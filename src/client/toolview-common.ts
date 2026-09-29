/**
 * Shared faces of the two self-drawn toolview rows (S37 TC): the host-meta
 * type mirrors (the published ui-tool types resolve `block` through a package
 * this client does not depend on — see websearch-row.tsx's header for the
 * currency anchors) and the nine row styles both cards render identically.
 * Row-specific styles stay in their rows.
 *
 * @module dsh-websearch/client/toolview-common
 */

/** Host running-call face (no `kind` member; ui-conversation records.ts:264-273). */
export interface RunningCallFace {
  readonly callId: string
  readonly name: string
  readonly argsRaw: string
}

/** Host content-block face: only the text variant carries displayable text. */
export interface ContentTextFace {
  readonly type: string
  readonly text?: string | undefined
}

/** Host settled-result face (`kind: 'tool-result'`; ui-conversation records.ts:155-173). */
export interface ToolResultFace {
  readonly kind: 'tool-result'
  readonly call: { readonly name: string, readonly argsRaw: string } | null
  readonly content: readonly ContentTextFace[]
  readonly isError: boolean
  readonly error?: { readonly name: string, readonly code?: string | undefined } | undefined
  readonly meta?: unknown
}

/** The slot's frozen running-or-settled node. */
export type ToolCallBlockFace = RunningCallFace | ToolResultFace

export const shellStyle = { display: 'flex', flexDirection: 'column' } as const
export const rowStyle = {
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
export const titleStyle = { fontSize: 13, fontWeight: 500, flexShrink: 0 } as const
export const summaryStyle = { fontSize: 12, opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const
export const badgeStyle = { fontSize: 11, flexShrink: 0, border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 999, padding: '0 6px', lineHeight: '18px' } as const
export const bodyStyle = { display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0 8px 22px', fontSize: 13 } as const
export const noteStyle = { fontSize: 12, opacity: 0.7 } as const
export const errorStyle = { color: 'var(--dsw-alias-state-error-primary)', fontSize: 12 } as const
export const preStyle = { margin: 0, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word', opacity: 0.8 } as const
