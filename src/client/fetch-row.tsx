/**
 * web_fetch toolview takeover (S28), the fetch sibling of the web_search row
 * in websearch-row.tsx: registers at priority -1 below the shipped WebRow and
 * owns the whole tool-call block. The collapsed row carries a served-by badge
 * parsed from `[served-by: …]` lines in the settled content text; the expanded
 * body mirrors the host WebFetchBlock derivation (URL + HTTP status +
 * truncated) plus the signature-stripped raw text. Fallback levels match the
 * search row: a result without the signature line renders badge-free in the
 * host shape (gate OFF direct fetches), and a meta shape mismatch degrades to
 * a generic tool card.
 *
 * The signature is written by `withFetchServedBy` at the head of
 * `body.content`; by the time it reaches this card the host has prepended the
 * untrusted-content notice and, for html bodies, turndown has escaped the
 * brackets — the pattern below tolerates both positions and the escaped
 * `\[served-by: …\]` form.
 *
 * @module dsh-websearch/client/fetch-row
 */
import { useState } from 'react'
import type { ReactElement } from 'react'
import { GlobeIcon } from './host-icons.tsx'
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
export interface WebFetchToolviewOwnerFace {
  readonly callId: string
  readonly toolName: string
  readonly block: ToolCallBlockFace
  readonly openFile: (path: string) => void
  readonly inspect?: (() => void) | undefined
}

/** Self-drawn mirror of the host owner currency plus the `t` seat. */
export interface WebFetchToolviewProps extends PropsLocale<'dsh-websearch'>, WebFetchToolviewOwnerFace {}

// Mirrors the web_search declaration note in websearch-row.tsx: the runtime
// registry matches slots by name string; this package does not depend on ui-tool.
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'tool.call.toolview': {
      kind: 'keyed'
      scope: 'session'
      owner: WebFetchToolviewOwnerFace
    }
  }
}

/** Attribution carrier written by `withFetchServedBy`; the `\\?` pairs tolerate turndown's escaped form. */
const SERVED_BY_PATTERN = /\\?\[served-by: ([^\\\]]+)\\?\]/g
const SERVED_BY_LINE_PATTERN = /^\\?\[served-by: [^\\\]]+\\?\]\n?/gm

/** The fetch card view model: the host `WebFetchMeta` projection plus attribution. */
interface FetchCardFace {
  readonly url: string
  readonly statusCode: number
  readonly truncated: boolean
  readonly servedBy: readonly string[]
}

/** Badge brand for a member id: the bundled label, else the raw id (ADR-0010 Decision 4). */
function labelOf(memberId: string): string {
  return MEMBERS.find((member) => member.memberId === memberId)?.label ?? memberId
}

/** The first text block's text, if the settled call carries one. */
function firstText(content: readonly ContentTextFace[]): string | undefined {
  return content.find((piece) => piece.type === 'text' && typeof piece.text === 'string')?.text
}

/** The fetched URL from the call arguments (host WebFetchRequest `url`). */
function urlFromArgs(argsRaw: string): string {
  try {
    const parsed: unknown = JSON.parse(argsRaw)
    if (parsed !== null && typeof parsed === 'object' && typeof (parsed as { url?: unknown }).url === 'string') {
      return (parsed as { url: string }).url
    }
  } catch {
    // Malformed argsRaw JSON: the raw text below is the summary.
  }
  return argsRaw
}

/**
 * Derive the fetch card model from a settled block, mirroring the host
 * `webCardModel` validation: `url` a non-empty string, `statusCode` a number,
 * `truncated` a boolean — anything else returns null and the caller degrades
 * to the generic tool card. The served-by signature is parsed from the first
 * content text block, wherever the host output layout places it.
 */
function deriveFetchCard(block: ToolResultFace): FetchCardFace | null {
  const meta = block.meta
  if (meta === null || typeof meta !== 'object') return null
  const { url, statusCode, truncated } = meta as Record<string, unknown>
  if (typeof url !== 'string' || url.length === 0) return null
  if (typeof statusCode !== 'number' || typeof truncated !== 'boolean') return null
  const text = firstText(block.content)
  const servedBy: string[] = []
  if (text !== undefined) {
    for (const match of text.matchAll(SERVED_BY_PATTERN)) {
      if (!servedBy.includes(match[1]!)) servedBy.push(match[1]!)
    }
  }
  return { url, statusCode, truncated, servedBy }
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
const linkStyle = { fontSize: 12 } as const
const statusStyle = { fontSize: 12, opacity: 0.7 } as const
const noteStyle = { fontSize: 12, opacity: 0.7 } as const
const errorStyle = { color: 'var(--dsw-alias-state-error-primary)', fontSize: 12 } as const
const preStyle = { margin: 0, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word', opacity: 0.8 } as const

/** The self-drawn web_fetch tool row served by the `tool.call.toolview` takeover. */
export function WebFetchToolviewRow(props: WebFetchToolviewProps): ReactElement {
  const [open, setOpen] = useState(false)
  const { block, t } = props
  const settled = 'kind' in block && block.kind === 'tool-result' ? block : undefined
  const running = 'kind' in block ? undefined : block
  const argsRaw = settled?.call?.argsRaw ?? running?.argsRaw ?? ''
  const summary = urlFromArgs(argsRaw)
  // `null` merges the absent and the shape-mismatch cases: both render generic.
  const fetch = settled !== undefined && !settled.isError ? deriveFetchCard(settled) : null
  const badge = fetch !== null && fetch.servedBy.length > 0 ? `· ${fetch.servedBy.map(labelOf).join(' + ')}` : undefined
  const contentText = settled !== undefined
    ? settled.content.filter((piece) => typeof piece.text === 'string').map((piece) => piece.text).join('\n')
    : ''
  const displayText = fetch !== null && fetch.servedBy.length > 0 ? contentText.replace(SERVED_BY_LINE_PATTERN, '').trim() : contentText

  return (
    <div data-testid="dshws-fetch-toolview" style={shellStyle}>
      <button
        type="button"
        data-testid="dshws-fetch-toolview-row"
        style={rowStyle}
        aria-expanded={open}
        onClick={() => { setOpen((value) => !value) }}
      >
        <GlobeIcon size={14} />
        <span style={titleStyle}>{t('fetchTitle')}</span>
        <span style={summaryStyle}>{summary}</span>
        {badge !== undefined && fetch !== null && fetch.servedBy.length > 0 && (
          <span data-testid="dshws-served-by" style={badgeStyle} aria-label={`${t('servedBy')} ${fetch.servedBy.map(labelOf).join(' + ')}`}>
            {badge}
          </span>
        )}
      </button>
      {open && (fetch !== null
        ? (
          <div data-testid="dshws-fetch-toolview-body" style={bodyStyle}>
            <a href={fetch.url} target="_blank" rel="noreferrer" style={linkStyle}>{fetch.url}</a>
            <div style={statusStyle}>{`HTTP ${fetch.statusCode}`}</div>
            {fetch.truncated && <div style={noteStyle}>{t('toolTruncated')}</div>}
            <details>
              <summary>{t('toolRaw')}</summary>
              <pre data-testid="dshws-fetch-raw" style={preStyle}>{displayText}</pre>
            </details>
            {props.inspect !== undefined && (
              <button type="button" onClick={() => { props.inspect?.() }}>{t('toolInspect')}</button>
            )}
          </div>
        )
        : (
          <div data-testid="dshws-fetch-toolview-generic" style={bodyStyle}>
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
