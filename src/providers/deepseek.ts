/**
 * `dshws-deepseek` chain member: DeepSeek web search through an
 * Anthropic-compatible Messages call with the native `web_search_20250305`
 * server tool. Each search costs a model turn and returns structured result
 * blocks; a response without them is an error, never a prose-scraping
 * fallback.
 *
 * Re-implemented inside the plugin rather than imported (ADR-0003, debt L-1):
 * the upstream `deepseek-official` provider's id collides with the host's
 * already-registered provider and breaks the `dshws-` prefix discipline. The
 * wire contract mirrors the upstream implementation (deepseek-harness
 * `packages/web/web-search-deepseek`, dev@3281e04b59) and shares its
 * `DEEPSEEK_API_KEY` credential ref.
 *
 * The API key is resolved fresh per operation through the injected thunk —
 * the provider never holds it (the credentials service's per-operation
 * contract), so a key change reaches the next search without a restart.
 *
 * @module dsh-websearch/providers/deepseek
 */
import type { DeepSeekMemberConfig } from '../config.ts'
import { DshwsError, MEMBER_ERROR_CODES } from '../errors.ts'
import type { WebSearchProvider, WebSearchRequest, WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'
import {
  isAbortError,
  isPositiveInteger,
  memberAborted,
  memberBadResponse,
  memberFetchFailure,
  resolveMemberApiKey,
  throwIfMemberAborted,
  unfoldHttpErrorDetail,
} from './shared.ts'

/** Stable id this member registers under (chain + direct pin, `dshws-` prefixed). */
export const DEEPSEEK_MEMBER_ID = 'dshws-deepseek'

/**
 * Default endpoint: DeepSeek's Anthropic-compatible API, `/v1` included
 * (`/messages` is appended). NOT the chat-completions base — only the API
 * key is shared with the chat side.
 */
export const DEEPSEEK_DEFAULT_BASE_URL = 'https://api.deepseek.com/anthropic/v1'

/** Default Anthropic-format model name. */
export const DEEPSEEK_DEFAULT_MODEL = 'deepseek-v4-flash'

/** `anthropic-version` header value; fixed wire constant. */
export const DEEPSEEK_API_VERSION = '2023-06-01'

/** Default upper bound on generated tokens for the Messages request. */
export const DEEPSEEK_DEFAULT_MAX_TOKENS = 4096

/**
 * Default server-tool search budget per request — identical name, semantic and
 * default to the host `web-search-deepseek` knob (S14c made it configurable;
 * the value itself is the host parity default).
 */
export const DEEPSEEK_DEFAULT_MAX_USES = 10

const codes = MEMBER_ERROR_CODES.deepseek

/** Attribution header sent on every request; bump with the package version. */
const USER_AGENT = 'dsh-websearch/0.8.0'

/** Wire types of the Anthropic-compatible Messages response (the subset the mapper reads). */
export interface DeepSeekCitation {
  readonly url?: string
  readonly cited_text?: string
}

export interface DeepSeekTextBlock {
  readonly type: 'text'
  readonly text: string
  readonly citations?: readonly DeepSeekCitation[]
}

export interface DeepSeekWebSearchResultItem {
  readonly type: 'web_search_result'
  readonly url: string
  readonly title?: string
  readonly page_age?: string
}

export interface DeepSeekWebSearchToolResultBlock {
  readonly type: 'web_search_tool_result'
  readonly content?: readonly DeepSeekWebSearchResultItem[]
}

export type DeepSeekContentBlock =
  | DeepSeekTextBlock
  | DeepSeekWebSearchToolResultBlock
  | { readonly type: string }

export interface DeepSeekAnthropicResponse {
  readonly content?: readonly DeepSeekContentBlock[]
}

/** Fully-resolved runtime options for the member; defaults applied by {@link resolveDeepSeekMemberOptions}. */
export interface DeepSeekMemberOptions {
  /** Credential-ref env name, for missing-credential diagnostics. */
  readonly apiKeyRef: string
  /** Resolve the current API key per operation (credentials service-backed). */
  readonly resolveApiKey: () => Promise<string | undefined>
  /** Endpoint base; `/messages` is appended. */
  readonly baseURL: string
  /** Anthropic-format model name. */
  readonly model: string
  /** Upper bound on generated tokens. */
  readonly maxTokens: number
  /** Server-tool search budget per request (S14c, host parity; was the `DEEPSEEK_MAX_USES` constant). */
  readonly maxUses: number
}

/**
 * Explicit defaulting at the owning boundary (explicit > implicit): omitted
 * config fields become the provider constants here, not via schema injection.
 */
export function resolveDeepSeekMemberOptions(
  config: DeepSeekMemberConfig,
  resolveApiKey: () => Promise<string | undefined>,
): DeepSeekMemberOptions {
  return {
    apiKeyRef: config.apiKeyEnv,
    resolveApiKey,
    baseURL: config.baseURL ?? DEEPSEEK_DEFAULT_BASE_URL,
    model: config.model ?? DEEPSEEK_DEFAULT_MODEL,
    maxTokens: config.maxTokens ?? DEEPSEEK_DEFAULT_MAX_TOKENS,
    maxUses: config.maxUses ?? DEEPSEEK_DEFAULT_MAX_USES,
  }
}

function isTextBlock(block: DeepSeekContentBlock): block is DeepSeekTextBlock {
  return block.type === 'text'
}

function isResultBlock(block: DeepSeekContentBlock): block is DeepSeekWebSearchToolResultBlock {
  return block.type === 'web_search_tool_result'
}

/**
 * Build a `url → cited_text` map from every text block's citations. The
 * excerpt lives in a separate text block keyed by `url`; first occurrence
 * wins.
 */
export function citationSnippets(blocks: readonly DeepSeekContentBlock[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const block of blocks) {
    if (!isTextBlock(block)) continue
    for (const cite of block.citations ?? []) {
      if (cite.url != null && cite.url.length > 0 && cite.cited_text != null && cite.cited_text.length > 0 && !map.has(cite.url)) {
        map.set(cite.url, cite.cited_text)
      }
    }
  }
  return map
}

/**
 * Map a Messages response to a normalized search result: walk
 * `web_search_tool_result` blocks for citeable items, join citation excerpts
 * as `snippet`, dedupe by `url`. The web service owns final `maxResults`
 * truncation, so `truncated` is always `false` here; no generated answer
 * text exists, so `content` stays omitted.
 * @throws {@link DshwsError} code `DSHWS_DEEPSEEK_BAD_RESPONSE` when no result block came back.
 */
export function mapDeepSeekResponse(response: DeepSeekAnthropicResponse): WebSearchResult {
  const blocks = response.content ?? []
  const resultBlocks = blocks.filter(isResultBlock)
  if (resultBlocks.length === 0) {
    throw new DshwsError(
      codes.badResponse,
      'DeepSeek returned no web_search_tool_result blocks; the request may not have triggered native web search',
    )
  }
  const snippets = citationSnippets(blocks)
  const seen = new Set<string>()
  const sources: WebSearchSource[] = []
  for (const block of resultBlocks) {
    for (const item of block.content ?? []) {
      if (item.type !== 'web_search_result' || item.url.length === 0 || seen.has(item.url)) continue
      seen.add(item.url)
      const snippet = snippets.get(item.url)
      sources.push({
        url: item.url,
        ...(item.title != null && item.title.length > 0 ? { title: item.title } : {}),
        ...(snippet !== undefined && snippet.length > 0 ? { snippet } : {}),
        ...(item.page_age != null && item.page_age.length > 0 ? { publishedAt: item.page_age } : {}),
      })
    }
  }
  return { sources, truncated: false }
}

/** The DeepSeek-backed chain member; redirects fail as a request failure. */
export class DeepSeekSearchProvider implements WebSearchProvider {
  readonly id = DEEPSEEK_MEMBER_ID

  constructor(private readonly options: DeepSeekMemberOptions) {}

  /** Cheap local config check (no network, no key dimension — the gate owns that). */
  available(): boolean {
    return URL.canParse(this.options.baseURL) && isPositiveInteger(this.options.maxTokens)
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    throwIfMemberAborted(codes, 'DeepSeek', signal)
    const apiKey = await this.#apiKey(signal)
    throwIfMemberAborted(codes, 'DeepSeek', signal)
    const endpoint = `${this.options.baseURL}/messages`
    const body = {
      model: this.options.model,
      max_tokens: this.options.maxTokens,
      messages: [{
        role: 'user',
        content: [{ type: 'text', text: `Perform a web search for the query: ${request.query}` }],
      }],
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: this.options.maxUses }],
    }
    let response: Response
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        redirect: 'error',
        headers: {
          // Official DeepSeek expects `x-api-key`; an Anthropic-compatible
          // proxy may expect `Authorization: Bearer` — send both so either resolves.
          'x-api-key': apiKey,
          'authorization': `Bearer ${apiKey}`,
          'anthropic-version': DEEPSEEK_API_VERSION,
          'content-type': 'application/json',
          'accept': 'application/json',
          'user-agent': USER_AGENT,
        },
        body: JSON.stringify(body),
        ...(signal !== undefined ? { signal } : {}),
      })
    } catch (error: unknown) {
      throw memberFetchFailure(codes, 'DeepSeek', error, signal)
    }

    if (!response.ok) {
      const status = response.status
      let message = `DeepSeek API error (HTTP ${status})`
      try {
        const parsed = await response.json() as Parameters<typeof unfoldHttpErrorDetail>[0]
        const detail = unfoldHttpErrorDetail(parsed)
        if (detail !== undefined && detail.length > 0) message += `: ${detail}`
      } catch (error: unknown) {
        // An abort firing mid-body must surface as aborted, not be swallowed
        // into a generic HTTP-error message; otherwise the status is already
        // in `message` and a non-JSON error body only ever cost the richer text.
        if (signal?.aborted === true || isAbortError(error)) throw memberAborted(codes, 'DeepSeek', signal, error)
      }
      throw new DshwsError(codes.httpError, message, { httpStatus: status })
    }

    try {
      const payload = await response.json() as DeepSeekAnthropicResponse
      return mapDeepSeekResponse(payload)
    } catch (error: unknown) {
      if (signal?.aborted === true || isAbortError(error)) throw memberAborted(codes, 'DeepSeek', signal, error)
      if (error instanceof DshwsError) throw error
      throw memberBadResponse(codes, 'DeepSeek', error)
    }
  }

  /** Resolve one operation's key without retaining it; a missing key is a loud member error. */
  #apiKey(signal?: AbortSignal): Promise<string> {
    return resolveMemberApiKey({
      codes,
      label: 'DeepSeek',
      apiKeyRef: this.options.apiKeyRef,
      resolveApiKey: this.options.resolveApiKey,
      signal,
    })
  }
}
