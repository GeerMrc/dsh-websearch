/**
 * Host icon resolution across ui-primitives generations. Upstream 0.1.7
 * renamed the fixed-14px outline family to stroke-weight names
 * (`…Outline14` → `…OutlineRegular`); 0.1.5/0.1.6 hosts still provide only
 * the legacy names through the external bundle contract. One client bundle
 * must serve both generations, so each icon resolves at module load to the
 * first export the host actually provides; both default to a 14px edge, so
 * the rendered size does not depend on which side wins.
 *
 * @module dsh-websearch/client/host-icons
 */
import type { ComponentType } from 'react'
import {
  IconChevronDownOutlineRegular,
  IconGlobeOutlineRegular,
  IconQuestionOutlineRegular,
  // Legacy 0.1.5/0.1.6 exports: type via the augmentation below, undefined at
  // runtime on 0.1.7+ hosts (bundled externals resolve missing names to
  // undefined), so the `??` picks below stay safe there.
  IconChevronDownOutline14,
  IconGlobeOutline14,
  IconQuestionOutline14,
} from '@deepseek-ai/dsh-client-ui-primitives'

/** The face every icon here serves (the host package's own `IconProps`). */
interface HostIconFace {
  size?: number | undefined
  className?: string | undefined
}

declare module '@deepseek-ai/dsh-client-ui-primitives' {
  // Legacy 0.1.5/0.1.6 exports: absent from that package's own types since
  // 0.1.7, and absent at runtime on 0.1.7+ hosts (the `??` picks above then
  // resolve to the Regular names). Declared locally so the value imports
  // type-check against the compiled-in types while staying undefined on new
  // hosts.
  export const IconChevronDownOutline14: ComponentType<HostIconFace>
  export const IconGlobeOutline14: ComponentType<HostIconFace>
  export const IconQuestionOutline14: ComponentType<HostIconFace>
}

/** Host-provided chevron-down outline icon (any supported generation). */
export const ChevronDownIcon: ComponentType<HostIconFace> = IconChevronDownOutlineRegular ?? IconChevronDownOutline14

/** Host-provided globe outline icon (any supported generation). */
export const GlobeIcon: ComponentType<HostIconFace> = IconGlobeOutlineRegular ?? IconGlobeOutline14

/** Host-provided question outline icon (any supported generation). */
export const QuestionIcon: ComponentType<HostIconFace> = IconQuestionOutlineRegular ?? IconQuestionOutline14
