/**
 * Styles and state hooks shared by the web-search settings section blocks
 * (section.tsx, dns-card.tsx, member-card.tsx, chain-cards.tsx): inline-style
 * constants and functions over verified `--dsw-alias-*` tokens — text color is
 * inherited from the settings shell — plus the 1.5s auto-clear feedback hook
 * and the staged-field lifted-draft hook.
 *
 * @module dsh-websearch/client/section-styles
 */
import { useEffect, useState } from 'react'

export const cardStyle = {
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: 12,
  background: 'var(--dsw-alias-bg-layer-3)',
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
} as const

export const cardHeadStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
} as const

export const nameStyle = {
  fontSize: 14,
  fontWeight: 500,
} as const

export const hintStyle = {
  margin: 0,
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--dsw-alias-label-tertiary)',
} as const

/** S23a T4: one member-parameter row — label left, control right (the host
 * filter-row rhythm), so the expanded card reads as a compact two-column
 * grid instead of a tall stack of full-width blocks. */
export const paramRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
} as const

/** S23a T4: the member card's two named groups — credentials stay full-width,
 * the parameter rows flow as a two-column grid. */
export const groupHeaderStyle = {
  margin: 0,
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--dsw-alias-label-tertiary)',
} as const

export const fieldLabelStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  // S23 D14: the Models field label leaves a 10px gap before the ⓘ icon.
  gap: 10,
  fontSize: 12,
  lineHeight: '18px',
  fontWeight: 500,
  color: 'var(--dsw-alias-label-secondary)',
} as const

export const fieldInputStyle = {
  boxSizing: 'border-box',
  width: '100%',
  height: 32,
  padding: '0 10px',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: 8,
  font: 'inherit',
  fontSize: 14,
  lineHeight: '22px',
  background: 'var(--dsw-alias-bg-layer-1)',
  color: 'var(--dsw-alias-label-primary)',
} as const

/** Page-header info anchor (12b): the single key-format note seat. */
export const infoButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  opacity: 0.6,
  cursor: 'help',
} as const

/** S14s: feedback color follows the operation's semantics — save is a
 * positive confirmation (success green), clear is a retractive act (warn),
 * failure is an error; the old single green mislabeled both. */
export const feedbackColor = (state: 'saved' | 'cleared' | 'failed'): string =>
  state === 'saved'
    ? 'var(--dsw-alias-state-success-primary)'
    : state === 'cleared'
      ? 'var(--dsw-alias-state-warn-label)'
      : 'var(--dsw-alias-state-error-primary)'

export const feedbackStyle = {
  flex: 1,
  fontSize: 12,
} as const

/** Track follows the host switch shape (36x20, pad 2, r10 — SubagentModelSelectionCard
 * precedent) while keeping the S12 user-decided semantic green: green only when the
 * member is configured AND enabled — an unconfigured member never renders green. */
export const switchStyle = (configured: boolean, enabled: boolean) =>
  ({
    boxSizing: 'border-box' as const,
    position: 'relative' as const,
    flex: '0 0 auto' as const,
    width: 36,
    height: 20,
    padding: 2,
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    background:
      configured && enabled
        ? 'var(--dsw-alias-state-success-primary)'
        : 'var(--dsw-alias-border-l3)',
  }) as const

export const thumbStyle = (enabled: boolean) =>
  ({
    display: 'block' as const,
    position: 'absolute' as const,
    top: 2,
    left: 2,
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: 'var(--dsw-alias-label-primary-foreground)',
    transition: 'transform 120ms ease',
    transform: enabled ? 'translateX(16px)' : 'translateX(0px)',
  }) as const

/** Semantic status dot (host credentialDot precedent): role=img + aria-label +
 * title carry the configured state for assistive tech, unlike aria-hidden StateDot. */
export const statusDotStyle = (configured: boolean) =>
  ({
    flex: '0 0 auto' as const,
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: configured
      ? 'var(--dsw-alias-state-success-primary)'
      : 'var(--dsw-alias-state-warn-label)',
  }) as const


/** Auto-dismiss cadence for action feedback (ms). */
const AUTO_CLEAR_FEEDBACK_MS = 1500

/**
 * Auto-dismiss action feedback after 1.5s — the cadence every field with a
 * live-region note shares (S37 T11; was nine verbatim useEffect copies).
 */
export function useAutoClearFeedback<T extends string>(): [T | undefined, (value: T | undefined) => void] {
  const [feedback, setFeedback] = useState<T | undefined>(undefined)
  useEffect(() => {
    if (feedback === undefined) return
    const timer = setTimeout(() => setFeedback(undefined), AUTO_CLEAR_FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [feedback])
  return [feedback, setFeedback]
}

export const chainRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr) auto auto',
  gap: 8,
  alignItems: 'center',
  padding: 6,
  borderRadius: 6,
} as const

export const chainIndexStyle = {
  fontSize: 12,
  color: 'var(--dsw-alias-label-tertiary)',
  minWidth: 14,
} as const

/** Role chip for the two chain ends (S14w): a quiet bordered pill, secondary tone. */
export const roleChipStyle = {
  fontSize: 10,
  lineHeight: 1.4,
  padding: '0 6px',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: 999,
  color: 'var(--dsw-alias-label-secondary)',
  whiteSpace: 'nowrap',
} as const

export const moveButtonStyle = {
  width: 28,
  height: 28,
  lineHeight: 1,
  padding: 0,
  cursor: 'pointer',
  border: 'none',
  borderRadius: 6,
  background: 'transparent',
  color: 'var(--dsw-alias-label-secondary)',
} as const

/**
 * S23 D9 (plan §0.5 B2 path a): a staged field can run on LIFTED draft state
 * so the draft survives the card/fold unmounting around it; `lifted === undefined`
 * keeps the component self-contained (local state, previous behavior).
 */
export function useLiftedDraft(lifted: { draft: string | null, onDraftChange: (value: string | null) => void } | undefined): readonly [string | null, (value: string | null) => void] {
  const [local, setLocal] = useState<string | null>(null)
  if (lifted === undefined) return [local, setLocal] as const
  return [lifted.draft, lifted.onDraftChange] as const
}

/** Native select chrome (the fallback-row precedent): inset chevron, auto width. */
export const selectStyle = {
  ...fieldInputStyle,
  width: 'auto',
  minWidth: 0,
  margin: 0,
  appearance: 'none',
  WebkitAppearance: 'none',
  paddingRight: 24,
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2381858C' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 6px center',
} as const
