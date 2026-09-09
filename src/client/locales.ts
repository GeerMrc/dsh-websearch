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
  | 'fallbackAutoOption'
  | 'fallbackDeepseekOption'
  | 'fallbackDeepseekStoppedNote'
  | 'fallbackDeepseekKeylessNote'
  | 'fallbackDesignationLostNote'
  | 'chainLockedNote'
  | 'fetchTakeoverLabel'
  | 'fetchTakeoverNote'
  | 'keyPlaceholder'
  | 'maskedKey'
  | 'chainOrderHint'
  | 'chainRolePrimary'
  | 'chainRoleStandby'
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
  description: 'Manage search provider priority, API keys, and member toggles. Configured members are tried in chain order and the next one takes over on failure. Installing this plugin takes over web_search (removing it restores the host default); installing hides web_fetch from the model (toggle below).',
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
  chainFloorDeepseekNote: 'No usable search tool — the next web_search will be served by the selected DeepSeek paid fallback.',
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
  fallbackNote: 'The fallback tool: with two or more ready tools, pick one to hold the chain-tail fallback slot (it leaves the normal rotation and only serves when every other tool failed — its own multi-key retries apply). With zero or one ready tool you may instead select the paid DeepSeek floor (Models-page DEEPSEEK_API_KEY, shared with chat; edits on either side overwrite the other; budget via Max searches per request). Auto = the last tool in the chain order is the fallback. Effective on the next search.',
  chainNoUsableWarning: 'No usable search tool and no working fallback — the next web_search will fail. Enable or configure a tool member, or select the DeepSeek paid fallback (needs the Models-page key, offered with fewer than two ready tools).',
  maxUsesLabel: 'Max searches per request',
  maxUsesHint: 'One request may search at most {N} times before it must answer.',
  chainTailHint: 'The designated fallback tool is pinned at the chain tail and not orderable; Auto = the last tool in the order.',
  configure: 'Configure',
  fallbackAutoOption: 'Auto (chain-order last)',
  fallbackDeepseekOption: 'DeepSeek paid',
  fallbackDeepseekStoppedNote: 'Two or more ready tools are configured — the paid DeepSeek fallback is disabled; the fallback comes from your tools.',
  fallbackDeepseekKeylessNote: 'DeepSeek paid is selected but its key is not configured (Models page); until then the chain runs without a paid floor.',
  fallbackDesignationLostNote: 'The designated fallback tool is not ready (missing key or disabled); the chain-order last tool serves as the fallback meanwhile.',
  chainLockedNote: 'locked fallback',
  fetchTakeoverLabel: 'Take over web_fetch (all modes)',
  fetchTakeoverNote: 'ON: the web_fetch tool is hidden from the model entirely — it never appears in the tool list, so the model uses web_search for everything. OFF: web_fetch is visible and works normally. Uninstalling the plugin restores the official behavior.',
  keyPlaceholder: '{ref} — multiple keys: APIKEY1,APIKEY2,… (max 10)',
  chainOrderHint: 'The order IS the primary/standby order: the first member is the primary — on failure it retries across its own keys first (up to 3 attempts), then the chain degrades in order; the last ready member is the in-chain standby (or the designated fallback tool, locked at the tail). Built-in default order: Tavily → Exa → Perplexity → Firecrawl → AnySearch.',
  chainRolePrimary: 'Primary',
  chainRoleStandby: 'Standby',
  maskedKey: '••••••••',
}

/** Chinese dictionary (complete per {@link DshWsLocaleKey}; parity is typed). */
export const zh: Record<DshWsLocaleKey, string> = {
  nav: '网页搜索',
  title: '网页搜索',
  description: '管理搜索引擎优先级、API key 与成员启停。已配置成员按链序依次尝试，失败自动降级到下一个。安装本插件即接管 web_search（卸载自动复原宿主默认）；安装即隐藏 web_fetch（下方开关控制）。',
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
  chainFloorDeepseekNote: '没有可用搜索工具——下一次 web_search 将由所选 DeepSeek 付费兜底服务。',
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
  fallbackNote: '兜底工具：两家及以上工具就绪时，可指定一家专职链尾兜底（它退出常规轮换，仅在其余工具全部失败后接手——含其自身多 key 重试规则）；零家或一家就绪时可改选付费 DeepSeek 地板（经模型设置页 DEEPSEEK_API_KEY，与聊天共用同一把 key，两处后写覆盖先写；预算见「单次请求最多搜索次数」）。自动 = 链序末位工具即兜底。下一次搜索生效。',
  chainNoUsableWarning: '没有可用搜索工具，也没有可用兜底——下一次 web_search 将失败。请启用或配置工具成员，或选择 DeepSeek 付费兜底（需模型页 key，两家及以上工具就绪时不提供）。',
  maxUsesLabel: '单次请求最多搜索次数',
  maxUsesHint: '一次请求必须作答前最多可搜索{N}次。',
  fallbackAutoOption: '自动（链序末位）',
  fallbackDeepseekOption: 'DeepSeek 付费',
  fallbackDeepseekStoppedNote: '已配置两家及以上搜索工具——付费 DeepSeek 兜底已停用，兜底由你的工具承担。',
  fallbackDeepseekKeylessNote: '已选择 DeepSeek 付费但模型页 key 未配置；在此之前链上没有付费兜底。',
  fallbackDesignationLostNote: '指定的兜底工具未就绪（缺 key 或已停用）；期间由链序末位工具承担兜底。',
  chainLockedNote: '锁定兜底',
  fetchTakeoverLabel: '接管 web_fetch（全模式）',
  fetchTakeoverNote: '开：web_fetch 工具从模型列表中彻底隐藏——模型不会看到它，所有网页信息通过 web_search 获取。关：web_fetch 正常显示和可用。卸载插件后自动恢复官方行为。',
  chainTailHint: '被指定的兜底工具固定链尾、不可排序；自动 = 链序末位即兜底。',
  configure: '配置',
  keyPlaceholder: '{ref}，可填多把：APIKEY1,APIKEY2,…（最多 10 把）',
  chainOrderHint: '链序即主备序：首位是主搜索工具——失败先在其多把 key 间重试（至多 3 次尝试），再按序降级；末位就绪成员即链内兜底位（或被指定的兜底工具，锁定链尾）。内置默认序：Tavily → Exa → Perplexity → Firecrawl → AnySearch。',
  chainRolePrimary: '主搜索',
  chainRoleStandby: '兜底位',
  maskedKey: '••••••••',
}
