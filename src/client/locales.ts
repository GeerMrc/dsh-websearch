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
  | 'fetchTitle'
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
  | 'keyPlaceholder'
  | 'maskedKey'
  | 'chainOrderHint'
  | 'chainRolePrimary'
  | 'chainRoleStandby'
  | 'chainNoUsableWarning'
  | 'searchCountryLabel'
  | 'searchCountryNote'
  | 'searchLanguageLabel'
  | 'searchLanguageNote'
  | 'optDefault'
  | 'optOff'
  | 'recencyHour'
  | 'recencyDay'
  | 'recencyWeek'
  | 'recencyMonth'
  | 'recencyYear'
  | 'tavilyTopicLabel'
  | 'topicNews'
  | 'topicFinance'
  | 'tavilyTimeRangeLabel'
  | 'tavilyDepthLabel'
  | 'depthAdvanced'
  | 'depthFast'
  | 'depthUltraFast'
  | 'tavilyAnswerLabel'
  | 'answerBasic'
  | 'answerAdvanced'
  | 'exaTypeLabel'
  | 'typeInstant'
  | 'typeFast'
  | 'typeAuto'
  | 'typeDeepLite'
  | 'typeDeep'
  | 'typeDeepReasoning'
  | 'exaTextFallbackLabel'
  | 'exaTextFallbackNote'
  | 'exaDateFloorLabel'
  | 'tavilyStartDateLabel'
  | 'tavilyEndDateLabel'
  | 'tavilyExactMatchLabel'
  | 'tavilyExactMatchNote'
  | 'exaDateCeilingLabel'
  | 'exaVerbosityLabel'
  | 'exaVerbosityNote'
  | 'verbosityCompact'
  | 'verbosityStandard'
  | 'verbosityFull'
  | 'exaIncludeSectionsLabel'
  | 'exaExcludeSectionsLabel'
  | 'exaSectionsNote'
  | 'fcTbsNote'
  | 'fcSafeLabel'
  | 'fcSafeNote'
  | 'ctxLow'
  | 'ctxMedium'
  | 'ctxHigh'
  | 'fcTbsLabel'
  | 'fcLocationLabel'
  | 'fcLocationNote'
  | 'searchIncludeDomainsLabel'
  | 'searchIncludeDomainsNote'
  | 'searchExcludeDomainsLabel'
  | 'searchExcludeDomainsNote'
  | 'domainsLabel'
  | 'domainsNote'
  | 'modeFilter'
  | 'modeBoost'
  | 'catCompany'
  | 'catPublication'
  | 'catNews'
  | 'catPersonalSite'
  | 'catFinancialReport'
  | 'catPeople'
  | 'srcNews'
  | 'srcWebNews'
  | 'fcCatDeveloper'
  | 'fcCatResearch'
  | 'fcCatPdf'
  | 'chunksPerSourceLabel'
  | 'chunksOne'
  | 'chunksTwo'
  | 'chunksThree'
  | 'filterByLanguageLabel'
  | 'filterByLanguageNote'
  | 'categoryLabel'
  | 'maxAgeHoursLabel'
  | 'maxAgeHoursNote'
  | 'sourcesLabel'
  | 'fetchChainLabel'
  | 'advancedConfigLabel'
  | 'unsavedPending'
  | 'keyCountTitle'
  | 'keyCountZeroTitle'
  | 'paramsGroupLabel'
  | 'fetchChainHint'
  | 'fetchTakeoverNoteS21'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'dsh-websearch': DshWsLocaleKey
  }
}

/** English dictionary (complete per {@link DshWsLocaleKey}; parity is typed). */
export const en: Record<DshWsLocaleKey, string> = {
  nav: 'Web Search',
  title: 'Web Search',
  description: 'Manage search provider priority, API keys, member toggles, and the web_fetch chain. Configured members are tried in chain order and the next one takes over on failure. Installing this plugin takes over web_search and web_fetch (removing it restores the host defaults); when the takeover is on, web_fetch is served by the plugin fetch chain (toggle below).',
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
  fetchTitle: 'Web fetch',
  servedBy: 'Served by',
  toolSources: 'Sources',
  toolTruncated: 'Results truncated',
  toolRaw: 'Raw request / response',
  toolInspect: 'Inspect',
  toolError: 'Call failed',
  fallbackInfo: 'DeepSeek fallback details',
  fallbackRowLabel: 'Fallback search',
  endpointLabel: 'Endpoint',
  endpointNote: 'Leave empty for the provider default. Applies to the next search.',
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
  fetchTakeoverLabel: 'Take over web_fetch (plugin chain)',
  keyPlaceholder: '{ref} — multiple keys: APIKEY1,APIKEY2,… (max 10)',
  chainOrderHint: 'The order IS the primary/standby order: the first member is the primary — on failure it retries across its own keys first (up to 3 attempts), then the chain degrades in order; the last ready member is the in-chain standby (or the designated fallback tool, locked at the tail). Built-in default order: Tavily → Exa → Firecrawl → AnySearch.',
  chainRolePrimary: 'Primary',
  chainRoleStandby: 'Standby',
  maskedKey: '••••••••',
  searchCountryLabel: 'Search region',
  searchCountryNote: 'One ISO country code (e.g. CN) for every tool that accepts a region — Exa and Firecrawl (whose API otherwise defaults to US). Applies to the next search; leave empty to send none.',
  searchLanguageLabel: 'Search language',
  searchLanguageNote: 'One ISO language code (e.g. zh) for the members with a search-level language parameter — Tavily, and AnySearch (mapped to BCP-47, e.g. zh -> zh-CN). Applies to the next search; leave empty to send none.',
  optDefault: 'Default',
  optOff: 'No limit',
  recencyHour: 'Past hour',
  recencyDay: 'Past day',
  recencyWeek: 'Past week',
  recencyMonth: 'Past month',
  recencyYear: 'Past year',
  tavilyTopicLabel: 'Topic',
  topicNews: 'News',
  topicFinance: 'Finance',
  tavilyTimeRangeLabel: 'Time range',
  tavilyDepthLabel: 'Search depth',
  depthAdvanced: 'Advanced (2× credits)',
  depthFast: 'Fast',
  depthUltraFast: 'Ultra-fast',
  tavilyAnswerLabel: 'Generated answer',
  answerBasic: 'Basic',
  answerAdvanced: 'Advanced (more detail)',
  exaTypeLabel: 'Search type',
  typeInstant: 'Instant',
  typeFast: 'Fast',
  typeAuto: 'Auto',
  typeDeepLite: 'Deep lite',
  typeDeep: 'Deep',
  typeDeepReasoning: 'Deep reasoning',
  exaTextFallbackLabel: 'Text fallback',
  exaTextFallbackNote: 'ON: also request each result page\u2019s text so results without highlights keep a snippet instead of being dropped. Default ON.',
  exaDateFloorLabel: 'Published after',
  tavilyStartDateLabel: 'Published from',
  tavilyEndDateLabel: 'Published until',
  tavilyExactMatchLabel: 'Exact match',
  tavilyExactMatchNote: 'Only return results containing the exact quoted phrase(s) of the query, bypassing synonym expansion.',
  exaDateCeilingLabel: 'Published before',
  exaVerbosityLabel: 'Text verbosity',
  exaVerbosityNote: 'standard and full enlarge the returned text (more downstream tokens — billing-relevant); the default compact matches the previous wire.',
  verbosityCompact: 'Compact',
  verbosityStandard: 'Standard',
  verbosityFull: 'Full',
  exaIncludeSectionsLabel: 'Include sections',
  exaExcludeSectionsLabel: 'Exclude sections',
  exaSectionsNote: 'Comma-separated from header/navigation/banner/sidebar/footer/metadata/body. Requires cache freshness = 0 (fresh crawl) or -1; other values are rejected on save.',
  fcTbsNote: 'Time filter, comma-combinable: qdr:h/d/w/m/y presets, sbd:1 (date sort), cdr:1,cd_min:MM/DD/YYYY,cd_max:MM/DD/YYYY (custom range). Invalid expressions are rejected on save.',
  fcSafeLabel: 'SafeSearch',
  fcSafeNote: 'Filter explicit content from web source results; off = not sent (no filtering).',
  ctxLow: 'Low',
  ctxMedium: 'Medium',
  ctxHigh: 'High',
  fcTbsLabel: 'Time filter',
  fcLocationLabel: 'Location',
  fcLocationNote: 'Free-text place (e.g. Beijing,China) for city-level geo-targeting; pairs best with a region code above.',
  searchIncludeDomainsLabel: 'Include domains',
  searchIncludeDomainsNote: 'Comma-separated allowlist (e.g. example.com,foo.org) applied to Tavily/Exa/Firecrawl. Wildcards work on Exa only (Tavily and Firecrawl skip the domain lists entirely when one is present). Mutually exclusive with the exclude list — setting one clears the other.',
  searchExcludeDomainsLabel: 'Exclude domains',
  searchExcludeDomainsNote: 'Comma-separated blocklist applied to Tavily/Exa/Firecrawl. Mutually exclusive with the include list — setting one clears the other.',
  domainsLabel: 'Domains',
  domainsNote: 'Two mutually exclusive lists: include = allowlist only, exclude = blocklist only. Setting one clears the other.',
  modeFilter: 'Filter',
  modeBoost: 'Boost (weight)',
  catCompany: 'Company',
  catPublication: 'Publication',
  catNews: 'News',
  catPersonalSite: 'Personal site',
  catFinancialReport: 'Financial report',
  catPeople: 'People',
  srcNews: 'News only',
  srcWebNews: 'Web + news',
  fcCatDeveloper: 'Developer',
  fcCatResearch: 'Research',
  fcCatPdf: 'PDF',
  chunksPerSourceLabel: 'Chunks per source',
  chunksOne: '1 (compact)',
  chunksTwo: '2',
  chunksThree: '3 (default)',
  filterByLanguageLabel: 'Hard language filter',
  filterByLanguageNote: 'ON: results must match the search language above (sent only when that language is set). OFF: language stays a ranking boost.',
  categoryLabel: 'Category',
  maxAgeHoursLabel: 'Cache freshness (h)',
  maxAgeHoursNote: 'Content cache age in hours (-1 = always cached, 0 = fresh crawl, up to 720).',
  sourcesLabel: 'Sources',
  fetchChainLabel: 'Web Fetch chain',
  advancedConfigLabel: 'Advanced settings',
  unsavedPending: 'Unsaved',
  keyCountTitle: 'API keys configured: {count} of {max}',
  keyCountZeroTitle: 'No API keys configured',
  paramsGroupLabel: 'Search parameters',
  fetchChainHint: 'The web_fetch degradation order: Firecrawl → Tavily → AnySearch, each with its own multi-key retries. Independent of the search order; member toggles apply to both chains.',
  fetchTakeoverNoteS21: 'ON: web_fetch stays visible and is served by the plugin fetch chain (Firecrawl/Tavily/AnySearch — cloud-side extraction, unaffected by local network limits). OFF: plain local HTTP fetch. Uninstalling restores the official provider.',
}

/** Chinese dictionary (complete per {@link DshWsLocaleKey}; parity is typed). */
export const zh: Record<DshWsLocaleKey, string> = {
  nav: '网页搜索',
  title: '网页搜索',
  description: '管理搜索引擎优先级、API key、成员启停与 Web Fetch 链。已配置成员按链序依次尝试，失败自动降级到下一个。安装本插件即接管 web_search 与 web_fetch（卸载自动复原宿主默认）；接管开启时 web_fetch 由插件抓取链服务（下方开关控制）。',
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
  fetchTitle: '网页获取',
  servedBy: '服务成员',
  toolSources: '来源',
  toolTruncated: '结果已截断',
  toolRaw: '原始请求 / 响应',
  toolInspect: '检查',
  toolError: '调用失败',
  fallbackInfo: 'DeepSeek 兜底说明',
  fallbackRowLabel: '兜底搜索',
  endpointLabel: '接口地址',
  endpointNote: '留空使用提供方默认地址；下一次搜索生效。',
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
  fetchTakeoverLabel: '接管 web_fetch（插件链）',
  chainTailHint: '被指定的兜底工具固定链尾、不可排序；自动 = 链序末位即兜底。',
  configure: '配置',
  keyPlaceholder: '{ref}，可填多把：APIKEY1,APIKEY2,…（最多 10 把）',
  chainOrderHint: '链序即主备序：首位是主搜索工具——失败先在其多把 key 间重试（至多 3 次尝试），再按序降级；末位就绪成员即链内兜底位（或被指定的兜底工具，锁定链尾）。内置默认序：Tavily → Exa → Firecrawl → AnySearch。',
  chainRolePrimary: '主搜索',
  chainRoleStandby: '兜底位',
  maskedKey: '••••••••',
  searchCountryLabel: '搜索区域',
  searchCountryNote: '一个 ISO 国家码（如 CN），作用于所有支持区域的工具——Exa、Firecrawl（其 API 缺省固定美国）。下一次搜索生效；留空不发送。',
  searchLanguageLabel: '搜索语言',
  searchLanguageNote: '一个 ISO 语言码（如 zh），作用于有搜索级语言参数的工具——Tavily，以及 AnySearch（映射为 BCP-47，如 zh → zh-CN）。下一次搜索生效；留空不发送。',
  optDefault: '默认',
  optOff: '不限',
  recencyHour: '1 小时内',
  recencyDay: '24 小时内',
  recencyWeek: '1 周内',
  recencyMonth: '1 个月内',
  recencyYear: '1 年内',
  tavilyTopicLabel: '主题',
  topicNews: '新闻',
  topicFinance: '财经',
  tavilyTimeRangeLabel: '时间范围',
  tavilyDepthLabel: '搜索深度',
  depthAdvanced: '增强（2× 消耗）',
  depthFast: '快速',
  depthUltraFast: '极速',
  tavilyAnswerLabel: '生成答案',
  answerBasic: '基础',
  answerAdvanced: '高级（更详细）',
  exaTypeLabel: '搜索类型',
  typeInstant: '即时',
  typeFast: '快速',
  typeAuto: '自动',
  typeDeepLite: '深度精简',
  typeDeep: '深度',
  typeDeepReasoning: '深度推理',
  exaTextFallbackLabel: '全文回退',
  exaTextFallbackNote: '开：同时请求每条结果的页面全文——无高亮摘要的结果保留全文摘录而非被丢弃。默认开。',
  exaDateFloorLabel: '发布日期下限',
  tavilyStartDateLabel: '发布日期起',
  tavilyEndDateLabel: '发布日期止',
  tavilyExactMatchLabel: '精确短语匹配',
  tavilyExactMatchNote: '仅返回包含查询中精确引号短语的结果，绕过同义词扩展。',
  exaDateCeilingLabel: '发布日期上限',
  exaVerbosityLabel: '文本详细度',
  exaVerbosityNote: 'standard 与 full 会放大返回文本（增加下游 token——涉及计费）；默认 compact 与此前请求一致。',
  verbosityCompact: '精简',
  verbosityStandard: '标准',
  verbosityFull: '完整',
  exaIncludeSectionsLabel: '包含小节',
  exaExcludeSectionsLabel: '排除小节',
  exaSectionsNote: '逗号分隔，取值限 header/navigation/banner/sidebar/footer/metadata/body。要求缓存新鲜度 = 0（强制新抓）或 -1，其他值保存时会被拒绝。',
  fcTbsNote: '时间过滤，可逗号组合：qdr:h/d/w/m/y 预设、sbd:1（按日期排序）、cdr:1,cd_min:MM/DD/YYYY,cd_max:MM/DD/YYYY（自定义区间）。非法表达式保存时会被拒绝。',
  fcSafeLabel: '安全搜索',
  fcSafeNote: '过滤 web 来源结果中的显式内容；关闭 = 不发送该参数（不过滤）。',
  ctxLow: '低',
  ctxMedium: '中',
  ctxHigh: '高',
  fcTbsLabel: '时效过滤',
  fcLocationLabel: '位置',
  fcLocationNote: '自由文本地点（如 Beijing,China），城市级地理定向；与上方区域码搭配效果最好。',
  searchIncludeDomainsLabel: '仅含域名',
  searchIncludeDomainsNote: '逗号分隔白名单（如 example.com,foo.org），作用于 Tavily/Exa/Firecrawl。通配符仅 Exa 支持（Tavily 与 Firecrawl 在含通配符时整体跳过域名过滤）。与排除列表互斥——设置其一自动清除另一。',
  searchExcludeDomainsLabel: '排除域名',
  searchExcludeDomainsNote: '逗号分隔黑名单，作用于 Tavily/Exa/Firecrawl。与仅含列表互斥——设置其一自动清除另一。',
  domainsLabel: '域名过滤',
  domainsNote: '两个互斥列表：仅含 = 白名单，排除 = 黑名单。设置其一自动清除另一。',
  modeFilter: '过滤',
  modeBoost: '加权（仍搜全网）',
  catCompany: '公司',
  catPublication: '出版物',
  catNews: '新闻',
  catPersonalSite: '个人站点',
  catFinancialReport: '财报',
  catPeople: '人物',
  srcNews: '仅新闻',
  srcWebNews: '网页 + 新闻',
  fcCatDeveloper: '开发者',
  fcCatResearch: '研究',
  fcCatPdf: 'PDF',
  chunksPerSourceLabel: '每源内容块数',
  chunksOne: '1（紧凑）',
  chunksTwo: '2',
  chunksThree: '3（默认）',
  filterByLanguageLabel: '语言硬过滤',
  filterByLanguageNote: '开：结果必须匹配上方搜索语言（仅在语言已设时发送）。关：语言仅作排序加权。',
  categoryLabel: '类目',
  maxAgeHoursLabel: '缓存新鲜度（小时）',
  maxAgeHoursNote: '内容缓存时长小时数（-1 = 永用缓存，0 = 强制新抓，最大 720）。',
  sourcesLabel: '结果来源',
  fetchChainLabel: 'Web Fetch 链',
  advancedConfigLabel: '详细配置',
  unsavedPending: '未保存',
  keyCountTitle: '已配置 API Key：{count}/{max}',
  keyCountZeroTitle: '暂无有效 API Key',
  paramsGroupLabel: '搜索参数',
  fetchChainHint: 'web_fetch 降级序：Firecrawl → Tavily → AnySearch，各含自身多 key 重试。与搜索序相互独立；成员启停对两条链同时生效。',
  fetchTakeoverNoteS21: '开：web_fetch 保持可见，由插件抓取链服务（Firecrawl/Tavily/AnySearch——云端提取，不受本机网络限制影响）。关：普通本机 HTTP 抓取。卸载插件后自动恢复官方。',
}
