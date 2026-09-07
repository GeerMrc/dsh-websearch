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
  | 'toolTitle'
  | 'servedBy'
  | 'toolSources'
  | 'toolTruncated'
  | 'toolRaw'
  | 'toolInspect'
  | 'toolError'
  | 'fallbackSwitch'
  | 'fallbackInfo'
  | 'fallbackNote'
  | 'maxUsesLabel'
  | 'maxUsesHint'
  | 'chainTailHint'
  | 'configure'
  | 'fallbackChoiceGroup'
  | 'fallbackChoicePaid'
  | 'keyPlaceholder'
  | 'maskedKey'
  | 'fallbackChoiceFree'
  | 'chainOrderHint'
  | 'chainDisabledNote'
  | 'chainNoUsableWarning'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'dsh-websearch': DshWsLocaleKey
  }
}

/** English dictionary (complete per {@link DshWsLocaleKey}; parity is typed). */
export const en: Record<DshWsLocaleKey, string> = {
  nav: 'Web Search',
  title: 'Web Search',
  description: 'Manage search provider priority, API keys, and member toggles. Configured members are tried in chain order and the next one takes over on failure. Installing this plugin takes over web_search (removing it restores the host default); switching web_fetch to the plugin chain stays a manual option.',
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
  toolTitle: 'Web search',
  servedBy: 'Served by',
  toolSources: 'Sources',
  toolTruncated: 'Results truncated',
  toolRaw: 'Raw request / response',
  toolInspect: 'Inspect',
  toolError: 'Call failed',
  fallbackSwitch: 'paid fallback',
  fallbackInfo: 'DeepSeek fallback details',
  fallbackNote: 'Installing this plugin serves web_search through its chain; the host built-in DeepSeek entry stays idle. This row is the chain-internal DeepSeek fallback (pinned to the chain tail, never orderable): it shares the DEEPSEEK_API_KEY with the Models settings page — edits on either side overwrite the other — and serves whenever no earlier member is usable. Off by default: web_search fails loud when no member is usable unless you opt into the paid fallback here.',
  chainDisabledNote: ' (disabled)',
  chainNoUsableWarning: 'No configured member is enabled — the next web_search will fail. Enable a member or the DeepSeek fallback.',
  maxUsesLabel: 'Max searches per request',
  maxUsesHint: 'One request may search at most {N} times before it must answer.',
  chainTailHint: 'DeepSeek stays the chain-tail fallback and is not orderable.',
  configure: 'Configure',
  fallbackChoiceGroup: 'Fallback',
  fallbackChoicePaid: 'DeepSeek paid',
  fallbackChoiceFree: 'Fetch (free)',
  keyPlaceholder: '{ref} — multiple keys: APIKEY1,APIKEY2,… (max 10)',
  chainOrderHint: 'Built-in default order: Tavily → Exa → Perplexity → Firecrawl → AnySearch (fallback search tool: paid DeepSeek APIKEY or free Fetch websearch)',
  maskedKey: '••••••••',
}

/** Chinese dictionary (complete per {@link DshWsLocaleKey}; parity is typed). */
export const zh: Record<DshWsLocaleKey, string> = {
  nav: '网页搜索',
  title: '网页搜索',
  description: '管理搜索引擎优先级、API key 与成员启停。已配置成员按链序依次尝试，失败自动降级到下一个。安装本插件即接管 web_search（卸载自动复原宿主默认）；把 web_fetch 切到本插件链为手动可选项。',
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
  toolTitle: '网页搜索',
  servedBy: '服务成员',
  toolSources: '来源',
  toolTruncated: '结果已截断',
  toolRaw: '原始请求 / 响应',
  toolInspect: '检查',
  toolError: '调用失败',
  fallbackSwitch: '付费兜底',
  fallbackInfo: 'DeepSeek 兜底说明',
  fallbackNote: '安装本插件后 web_search 由插件链接管，宿主内置的 DeepSeek 搜索入口保持闲置。此行即链内 DeepSeek 兜底（恒为链尾，不参与排序）：与模型设置页共用同一把 DEEPSEEK_API_KEY，两处修改后写覆盖；前序成员均不可用时由此兜底。默认关闭：无成员可用时 web_search 直接报错指引，选付费后才经此兜底。',
  chainDisabledNote: '（已停用）',
  chainNoUsableWarning: '没有已启用的已配置成员——下一次 web_search 将失败。请启用某成员或 DeepSeek 兜底。',
  maxUsesLabel: '单次请求最多搜索次数',
  maxUsesHint: '一次请求必须作答前最多可搜索{N}次。',
  chainTailHint: 'DeepSeek 恒为链尾兜底，不参与排序。',
  configure: '配置',
  fallbackChoiceGroup: '兜底',
  fallbackChoicePaid: 'DeepSeek 付费',
  fallbackChoiceFree: 'Fetch 免费',
  keyPlaceholder: '{ref}，可填多把：APIKEY1,APIKEY2,…（最多 10 把）',
  chainOrderHint: '内置默认序：Tavily → Exa → Perplexity → Firecrawl → AnySearch（兜底搜索工具：付费 DeepSeek APIKEY 或 免费 Fetch websearch）',
  maskedKey: '••••••••',
}
