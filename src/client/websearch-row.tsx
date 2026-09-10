/**
 * web_search toolview takeover (ADR-0010): registers below the shipped WebRow
 * (priority -1 — a keyed cell renders the lowest priority, and the same key at
 * the same priority throws) and owns the whole tool-call block: the collapsed
 * row carries a served-by badge parsed from the first line of `meta.answer`
 * (content fallback), the expanded body mirrors the host WebRow derivation
 * (answer + sources + truncated). Two fallback levels per ADR-0010 Decision 2:
 * a result without the signature line renders badge-free in the host shape
 * (pinned-direct or foreign results), and a meta shape mismatch degrades to a
 * generic tool card that never assumes the web_search shape.
 *
 * The host exports neither WebRow nor ToolRow, so the card is self-drawn over
 * the same meta model — a standing maintenance point when the host web card
 * evolves (ADR-0010 Decision 5, carried into the upgrade handbook by S15).
 * Props are a local structural mirror of the host owner face: the published
 * `@deepseek-ai/dsh-client-ui-tool` types resolve their `block` through a
 * package this client does not depend on (silently `any` under skipLibCheck),
 * so the faces below restate the contract instead — anchored to ui-tool
 * `contract/slots.ts:31-46` (owner currency) and ui-conversation
 * `records.ts:155-173,264-279` (block union). Reusing the ui-primitives
 * `WebBlock` for the expanded body was considered and set aside: its
 * `WebBlockLabels` chrome (markdown fence/footnote/no-results strings) would
 * double this plugin's locale surface for chrome the settings-page GUI never
 * shows.
 *
 * @module dsh-websearch/client/websearch-row
 */
import { useState } from 'react'
import type { ReactElement } from 'react'
import { IconGlobeOutline14 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { MEMBERS } from './controller.ts'

/** Host running-call face (no `kind` member; ui-conversation records.ts:264-273). */
interface RunningCallFace {
  readonly callId: string
  readonly name: string
  readonly argsRaw: string
}

/** Host content-block face: only the text variant carries displayable text. */
interface ContentTextFace {
  readonly type: string
  readonly text?: string | undefined
}

/** Host settled-result face (`kind: 'tool-result'`; ui-conversation records.ts:155-173). */
interface ToolResultFace {
  readonly kind: 'tool-result'
  readonly call: { readonly name: string; readonly argsRaw: string } | null
  readonly content: readonly ContentTextFace[]
  readonly isError: boolean
  readonly error?: { readonly name: string; readonly code?: string | undefined } | undefined
  readonly meta?: unknown
}

/** The slot's frozen running-or-settled node, mirrored locally (D4 fallback). */
type ToolCallBlockFace = RunningCallFace | ToolResultFace

/** Self-drawn mirror of the host toolview owner currency (ui-tool contract/slots.ts:31-46). */
export interface WebSearchToolviewOwnerFace {
  readonly callId: string
  readonly toolName: string
  readonly block: ToolCallBlockFace
  readonly openFile: (path: string) => void
  readonly inspect?: (() => void) | undefined
}

/** Self-drawn mirror of the host owner currency plus the `t` seat. */
export interface WebSearchToolviewProps extends PropsLocale<'dsh-websearch'>, WebSearchToolviewOwnerFace {}

// The host ui-tool package declares this slot through the same merging; an
// external client that does not depend on ui-tool sees no declaration (the
// name is absent from its SlotMap), so this module restates it with the local
// owner mirror. The two declarations never meet in one program — this package
// deliberately does not depend on ui-tool (D4 fallback) — and the runtime
// registry matches slots by name string either way.
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'tool.call.toolview': {
      kind: 'keyed'
      scope: 'session'
      owner: WebSearchToolviewOwnerFace
    }
  }
}

/** Attribution carrier shape written by the chain since S03 (ADR-0002 Decision 4). */
const SERVED_BY_PATTERN = /^\[served-by: ([^\]]+)\]/

/** The web card view model: the host `WebSearchMeta` projection plus attribution. */
interface WebCardFace {
  readonly answer: string | undefined
  readonly sources: readonly { url: string; title?: string; snippet?: string; publishedAt?: string }[]
  readonly truncated: boolean
  readonly servedBy: string | undefined
}

/** Join the model-facing queries for the collapsed summary (host toolRowModel shape). */
function summarizeArgs(argsRaw: string): string {
  try {
    const parsed: unknown = JSON.parse(argsRaw)
    if (parsed !== null && typeof parsed === 'object' && Array.isArray((parsed as { queries?: unknown }).queries)) {
      const queries = (parsed as { queries: readonly unknown[] }).queries.filter(
        (query): query is string => typeof query === 'string',
      )
      if (queries.length > 0) return queries.join(', ')
    }
  } catch {
    // Malformed argsRaw JSON: the raw text below is the summary.
  }
  return argsRaw
}

/** Display label for a source: its title, else the hostname (host sourceLabel). */
function sourceLabel(url: string, title: string | undefined): string {
  if (title !== undefined && title.length > 0) return title
  try {
    return new URL(url).hostname
  } catch {
    // Not a parseable absolute URL: label with the raw string.
    return url
  }
}

/** Badge brand for a member id: the bundled label, else the raw id (ADR-0010 Decision 4). */
function labelOf(memberId: string): string {
  return MEMBERS.find((member) => member.memberId === memberId)?.label ?? memberId
}

/** The first text block's text, if the settled call carries one. */
function firstText(content: readonly ContentTextFace[]): string | undefined {
  return content.find((piece) => piece.type === 'text' && typeof piece.text === 'string')?.text
}

/**
 * Derive the web card model from a settled block, mirroring the host
 * `webCardModel` validation: `sources` must be a well-formed array, `truncated`
 * a boolean, `answer` an optional string — anything else returns null and the
 * caller degrades to the generic tool card. The served-by signature is parsed
 * from `meta.answer`, falling back to the first content text block.
 */
function deriveWebCard(block: ToolResultFace): WebCardFace | null {
  const meta = block.meta
  if (meta === null || typeof meta !== 'object') return null
  const { sources, truncated, answer } = meta as Record<string, unknown>
  if (!Array.isArray(sources) || typeof truncated !== 'boolean') return null
  if (answer !== undefined && typeof answer !== 'string') return null
  const cleaned: { url: string; title?: string; snippet?: string; publishedAt?: string }[] = []
  for (const source of sources) {
    if (source === null || typeof source !== 'object') return null
    const { url, title, snippet, publishedAt } = source as Record<string, unknown>
    if (typeof url !== 'string' || url.length === 0) return null
    if (title !== undefined && typeof title !== 'string') return null
    if (snippet !== undefined && typeof snippet !== 'string') return null
    if (publishedAt !== undefined && typeof publishedAt !== 'string') return null
    cleaned.push({
      url,
      ...(title !== undefined ? { title } : {}),
      ...(snippet !== undefined ? { snippet } : {}),
      ...(publishedAt !== undefined ? { publishedAt } : {}),
    })
  }
  const signatureText = answer !== undefined ? answer : firstText(block.content)
  const signature = signatureText !== undefined ? SERVED_BY_PATTERN.exec(signatureText.split('\n')[0] ?? '') : undefined
  return { answer, sources: cleaned, truncated, servedBy: signature?.[1] }
}

const shellStyle = { display: 'flex', flexDirection: 'column' } as const
const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: 'none',
  border: 'none',
  padding: '4px 0',
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
  textAlign: 'left',
  minWidth: 0,
} as const
const titleStyle = { fontSize: 13, fontWeight: 500, flexShrink: 0 } as const
const summaryStyle = { fontSize: 12, opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const
const badgeStyle = { fontSize: 11, flexShrink: 0, border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 999, padding: '0 6px', lineHeight: '18px' } as const
const bodyStyle = { display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0 8px 22px', fontSize: 13 } as const
const answerStyle = { margin: 0, whiteSpace: 'pre-wrap' } as const
const sourcesTitleStyle = { fontSize: 12, opacity: 0.7, marginBottom: 4 } as const
const listStyle = { margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 } as const
const sourceStyle = { display: 'flex', flexDirection: 'column', gap: 2 } as const
const urlStyle = { fontSize: 11, opacity: 0.6 } as const
const snippetStyle = { fontSize: 12, opacity: 0.8 } as const
const noteStyle = { fontSize: 12, opacity: 0.7 } as const
const errorStyle = { color: 'var(--dsw-alias-state-error-primary)', fontSize: 12 } as const
const preStyle = { margin: 0, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word', opacity: 0.8 } as const

/** The self-drawn web_search tool row served by the `tool.call.toolview` takeover. */
export function WebSearchToolviewRow(props: WebSearchToolviewProps): ReactElement {
  const [open, setOpen] = useState(false)
  const { block, t } = props
  const settled = 'kind' in block && block.kind === 'tool-result' ? block : undefined
  const running = 'kind' in block ? undefined : block
  const argsRaw = settled?.call?.argsRaw ?? running?.argsRaw ?? ''
  const summary = summarizeArgs(argsRaw)
  // `null` merges the absent and the shape-mismatch cases: both render generic.
  const web = settled !== undefined && !settled.isError ? deriveWebCard(settled) : null
  const badge = web !== null && web.servedBy !== undefined ? `· ${labelOf(web.servedBy)}` : undefined
  const contentText = settled !== undefined
    ? settled.content.filter((piece) => typeof piece.text === 'string').map((piece) => piece.text).join('\n')
    : ''

  return (
    <div data-testid="dshws-toolview" style={shellStyle}>
      <button
        type="button"
        data-testid="dshws-toolview-row"
        style={rowStyle}
        aria-expanded={open}
        onClick={() => { setOpen((value) => !value) }}
      >
        <IconGlobeOutline14 size={14} />
        <span style={titleStyle}>{t('toolTitle')}</span>
        <span style={summaryStyle}>{summary}</span>
        {badge !== undefined && web !== null && web.servedBy !== undefined && (
          <span data-testid="dshws-served-by" style={badgeStyle} aria-label={`${t('servedBy')} ${labelOf(web.servedBy)}`}>
            {badge}
          </span>
        )}
      </button>
      {open && (web !== null
        ? (
          <div data-testid="dshws-toolview-body" style={bodyStyle}>
            {web.answer !== undefined && <p data-testid="dshws-toolview-answer" style={answerStyle}>{web.answer}</p>}
            <div>
              <div style={sourcesTitleStyle}>{t('toolSources')}</div>
              <ul style={listStyle}>
                {web.sources.map((source) => (
                  <li key={source.url} style={sourceStyle}>
                    <a href={source.url} target="_blank" rel="noreferrer">{sourceLabel(source.url, source.title)}</a>
                    <span style={urlStyle}>{source.url}</span>
                    {source.snippet !== undefined && <span style={snippetStyle}>{source.snippet}</span>}
                  </li>
                ))}
              </ul>
            </div>
            {web.truncated && <div style={noteStyle}>{t('toolTruncated')}</div>}
            <details>
              <summary>{t('toolRaw')}</summary>
              <pre style={preStyle}>{argsRaw}</pre>
              <pre style={preStyle}>{contentText}</pre>
            </details>
            {props.inspect !== undefined && (
              <button type="button" onClick={() => { props.inspect?.() }}>{t('toolInspect')}</button>
            )}
          </div>
        )
        : (
          <div data-testid="dshws-toolview-generic" style={bodyStyle}>
            {settled?.isError === true && settled.error !== undefined && (
              <div role="status" style={errorStyle}>
                {`${t('toolError')}: ${settled.error.name}${settled.error.code !== undefined ? ` (${settled.error.code})` : ''}`}
              </div>
            )}
            <pre style={preStyle}>{contentText}</pre>
          </div>
        ))}
    </div>
  )
}
