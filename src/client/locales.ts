/**
 * Typed locale dictionaries for the web-search settings section (S06). The
 * namespace id doubles as the plugin identity string — one lexically distinct
 * space that cannot collide with host namespaces. The flat key union typed as
 * `Record<DshWsLocaleKey, string>` on both zh/en makes en/zh parity a compile
 * error at the locale runtime's typed `register` (missing or extra key), and
 * the runtime test mirrors that contract so an unsafe cast cannot ship it.
 *
 * @module dsh-websearch/client/locales
 */
import type {} from '@deepseek-ai/dsh-client-ui-slots'

/** Locale namespace id for every string this client half registers. */
export const NS = 'dsh-websearch'

/** Every model-visible string the settings section renders (flat keys). */
export type DshWsLocaleKey =
  | 'nav'
  | 'title'
  | 'description'
  | 'apiKey'
  | 'save'
  | 'clear'
  | 'enabled'
  | 'configured'
  | 'notConfigured'
  | 'searchChain'
  | 'timeout'
  | 'saved'
  | 'cleared'
  | 'failed'
  | 'moveUp'
  | 'moveDown'
  | 'chainDefault'
  | 'chainDefaultHint'
  | 'chainPinned'
  | 'keyFieldNote'
  | 'keySelection'
  | 'keySelOrder'
  | 'keySelRoundRobin'
  | 'keySelRandom'
  | 'keySelectionHint'
  | 'sharedWithModels'
  | 'sharedWithModelsDetail'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'dsh-websearch': DshWsLocaleKey
  }
}

/** English dictionary (complete per {@link DshWsLocaleKey}; parity is typed). */
export const en: Record<DshWsLocaleKey, string> = {
  nav: 'Web Search',
  title: 'Web Search',
  description: 'Manage search provider priority, API keys, and member toggles. Configured members are tried in chain order and the next one takes over on failure.',
  apiKey: 'API Key',
  save: 'Save',
  clear: 'Clear',
  enabled: 'Enabled',
  configured: 'Configured',
  notConfigured: 'Not configured',
  searchChain: 'Search chain',
  timeout: 'Per-member timeout',
  saved: 'Saved',
  cleared: 'Cleared',
  failed: 'Action failed',
  moveUp: 'Move up',
  moveDown: 'Move down',
  chainDefault: 'Built-in default order',
  chainDefaultHint: 'Members are tried in this built-in order while the chain is not pinned; a pinned order overrides it:',
  chainPinned: 'Pinned (overrides default)',
  keyFieldNote: 'Multiple keys: {APIKEY1,APIKEY2,...} (max 10)',
  keySelection: 'Key selection',
  keySelOrder: 'Order',
  keySelRoundRobin: 'Round-robin',
  keySelRandom: 'Random',
  keySelectionHint: 'Multiple keys are drawn by "{policy}"; a failing key is not retried — the next chain member takes over.',
  sharedWithModels: 'Shared with Models',
  sharedWithModelsDetail: 'Uses the same DEEPSEEK_API_KEY credential as the Models settings page; the last save wins.',
}

/** Chinese dictionary (complete per {@link DshWsLocaleKey}; parity is typed). */
export const zh: Record<DshWsLocaleKey, string> = {
  nav: '网页搜索',
  title: '网页搜索',
  description: '管理搜索引擎优先级、API key 与成员启停。已配置成员按链序依次尝试，失败自动降级到下一个。',
  apiKey: 'API Key',
  save: '保存',
  clear: '清除',
  enabled: '启用',
  configured: '已配置',
  notConfigured: '未配置',
  searchChain: '搜索链',
  timeout: '单成员超时',
  saved: '已保存',
  cleared: '已清除',
  failed: '操作失败',
  moveUp: '上移',
  moveDown: '下移',
  chainDefault: '内置默认序',
  chainDefaultHint: '未钉死时成员按此内置默认序依次尝试；钉死序会覆盖默认序：',
  chainPinned: '已钉死（覆盖默认序）',
  keyFieldNote: '多把 key：{APIKEY1,APIKEY2,...}（最多 10 把）',
  keySelection: 'Key 策略',
  keySelOrder: '顺序',
  keySelRoundRobin: '轮询',
  keySelRandom: '随机',
  keySelectionHint: '多把 key 按「{policy}」选取；单把失败不换把，直接降级下一成员。',
  sharedWithModels: '共用模型 Key',
  sharedWithModelsDetail: '与模型设置页共用同一把 DEEPSEEK_API_KEY；两处修改后写覆盖先写。',
}
