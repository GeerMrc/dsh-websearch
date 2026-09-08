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
  | 'chainFloorDeepseekNote'
  | 'chainFloorFetchNote'
  | 'chainPinned'
  | 'keySelection'
  | 'keySelOrder'
  | 'keySelRoundRobin'
  | 'keySelRandom'
  | 'keySelectionHint'
  | 'sharedWithModels'
  | 'toolTitle'
  | 'servedBy'
  | 'toolSources'
  | 'toolTruncated'
  | 'toolRaw'
  | 'toolInspect'
  | 'toolError'
  | 'fallbackInfo'
  | 'fallbackNote'
  | 'fallbackRowLabel'
  | 'endpointLabel'
  | 'endpointNote'
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
  chainFloorDeepseekNote: 'No configured member is enabled — the next web_search will be served by the DeepSeek fallback.',
  chainFloorFetchNote: 'No configured member is enabled — the next web_search will be served by the free fetch fallback.',
  chainPinned: 'Pinned (overrides default)',
  keySelection: 'Key selection',
  keySelOrder: 'Order',
  keySelRoundRobin: 'Round-robin',
  keySelRandom: 'Random',
  keySelectionHint: 'Keys default to "{policy}" selection; on failure the tool retries across its own keys first — up to 3 attempts including the first — before degrading to the next tool.',
  sharedWithModels: 'Shared with Models',
  toolTitle: 'Web search',
  servedBy: 'Served by',
  toolSources: 'Sources',
  toolTruncated: 'Results truncated',
  toolRaw: 'Raw request / response',
  toolInspect: 'Inspect',
  toolError: 'Call failed',
  fallbackInfo: 'DeepSeek fallback details',
  fallbackRowLabel: 'Fallback search',
  endpointLabel: 'Endpoint',
  endpointNote: 'Leave empty for the provider default. Applies at the next launch.',
  fallbackNote: 'The chain-tail fallback: when no orderable member is usable, the ACTIVE choice below serves the search. Paid = DeepSeek websearch through the Models-page DEEPSEEK_API_KEY (shared with chat; edits on either side overwrite the other; needs the key configured, budget via Max searches per request). Free = keyless DuckDuckGo scrape (always ready; reachability depends on the network). The default is automatic: model key present → paid, otherwise free; switch any time, effective on the next search.',
  chainNoUsableWarning: 'No configured member is enabled and the DeepSeek fallback key is not configured — the next web_search will fail. Enable a member or configure the DeepSeek key.',
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
  chainFloorDeepseekNote: '没有已启用的已配置成员——下一次 web_search 将由 DeepSeek 兜底服务。',
  chainFloorFetchNote: '没有已启用的已配置成员——下一次 web_search 将由免费 fetch 兜底服务。',
  chainPinned: '已钉死（覆盖默认序）',
  keySelection: 'Key 策略',
  keySelOrder: '顺序',
  keySelRoundRobin: '轮询',
  keySelRandom: '随机',
  keySelectionHint: 'key 默认按「{policy}」选取；请求失败优先在本工具的多把 key 间重试——至多 3 次尝试（含首次），仍失败才降级下一个工具。',
  sharedWithModels: '共用模型 Key',
  toolTitle: '网页搜索',
  servedBy: '服务成员',
  toolSources: '来源',
  toolTruncated: '结果已截断',
  toolRaw: '原始请求 / 响应',
  toolInspect: '检查',
  toolError: '调用失败',
  fallbackInfo: 'DeepSeek 兜底说明',
  fallbackRowLabel: '兜底搜索',
  endpointLabel: '接口地址',
  endpointNote: '留空使用提供方默认地址；下次启动生效。',
  fallbackNote: '链尾兜底：前序成员均不可用时，由下方当前激活的选项承接搜索。付费 = 经模型设置页 DEEPSEEK_API_KEY 的 DeepSeek websearch（与聊天共用同一把 key，两处修改后写覆盖；需已配置该 key；预算见「单次请求最多搜索次数」）。免费 = 免 key 的 DuckDuckGo 抓取（恒就绪；可达性取决于网络）。默认自动：有模型 key → 付费，否则免费；可随时切换，下一次搜索生效。',
  chainNoUsableWarning: '没有已启用的已配置成员，且 DeepSeek 兜底 key 未配置——下一次 web_search 将失败。请启用某成员或配置 DeepSeek key。',
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
