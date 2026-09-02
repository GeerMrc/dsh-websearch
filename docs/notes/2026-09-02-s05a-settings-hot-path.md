# Agent Note — S05a settings 热改通路与成员收编完成（2026-09-02，Session 05a）

> 记录 S05a 交付中不写在单个文件 JSDoc 里、但后续棒次（S06/S07/S08）必须知道的设计事实。

## 1. settings 热改通路：LiveResolvedConfig + 条件注入

`src/settings.ts` 是链与 gate 的热态唯一来源。`LiveResolvedConfig` 持有一个 source thunk +
一份 resolveConfig 结果；`setSource`（服务 attach/detach 钩子）换源并重算，`refresh`（committed
change 钩子）按原源重算——settings 服务的 watch 只发 onChange 不重发 setSource，两个钩子缺一
不可。每个 source 变更都重跑 `resolveConfig`：settings 节与 cordis.yml 走同一显式默认化，schema
永不注入默认。

- **条件注入**：`attachSettingsSection` 经 `ctx.inject(['settings'], …)`——宿主没有 settings
  服务时回调不执行，cordis.yml config 保持权威，插件不因缺服务失效（真实 seam 测试已验证
  attach → update → detach fallback 全链）。
- **热改范围（D2 定案）**：链序（search/fetchChain）、perMemberTimeoutMs、成员 enabled 三面
  热生效；成员选项字段（baseURL/model/maxTokens/maxResults/numResults/apiKeyEnv）launch-static
  ——settings 改它们要下次启动才生效，Config JSDoc 逐字段标注了冷热边界。S06/S07 GUI 写这些
  冷字段时应提示「重启生效」，或把 key 类配置引到 credentials 服务（apiKeyEnv 本就不该经
  settings 改）。
- **S06 GUI 义务**：启停开关写 settings 的 `enabled` 字段即热生效（gate 热读）；不要重注册
  provider——注册序与 `BUILT_IN_MEMBER_ORDER` 的相对序已由 apply 钉死。

## 2. D7 壳构造器透传修正（S03 资产、行为保持型）

S04 时 plan 曾假设「getter-backed options 即可热改、链核零改动」——**阶段 2 审核 M-1 证伪**：
壳构造器 `{ ...options, id }` 的对象展开会在构造时把 getter 求值成静态值。修正 = `ChainOptions`
移除 `id` 契约面（ChainCore 对其零运行时消费，审核代核）+ 两壳直接透传调用方 options 原对象。
教训入档：**包装/装饰构造器里的对象展开是 getter 的冻结点**，热路径对象必须按引用传递。
S08 loopback 场景如需日志前缀区分 search/fetch 链，注意 core 日志行硬编码 `[dshws-chain]`
前缀（S03 交付形态，两链共用）。

## 3. firecrawl：v2 线格式 + 单类双接口

官方现行 API 为 **v2**（取证 2026-09-02）：search = `POST {base}/v2/search`，响应
`data.web[]` 按源类型分组（v1 时代文档的扁平 `data[]` 已过时——架构文档旧表述以此为准修订）；
scrape = `POST {base}/v2/scrape`，`formats: ['markdown']`，页面自身状态 `metadata.statusCode`
成为 fetch 结果的 statusCode（seam 契约：非 2xx 页面是结果不是错误），markdown 映射到
`WebFetchBody` 的 `text` kind（封闭并集无 markdown arm，不扩上游类型）。单类
`FirecrawlProvider` 同时实现 `WebSearchProvider`/`WebFetchProvider`，search registry、fetch
registry、ctx.web 三处注册共用同一实例与 gate。

## 4. cordis proxy 与真私有字段（测试坑）

cordis 会用 Proxy 包装插件类实例——**真 `#private` 字段在 Proxy 外不可见**（`Cannot read
private member` 崩溃）。测试 fixture 类（如 MemorySettings）字段必须用公开属性。上游
settings.spec.ts 的 MemorySettings 用公开 `doc` 正是此因。

## 5. 成员收编完成态（L-1 全清）

五族错误码对象形收口（exa/perplexity/firecrawl 五键同 deepseek/tavily 口径）；`providers/shared.ts`
只放机械脚手架（取消三件套/正整数/错误体展开/凭据解析包装），**不建类层次**——上游明确评论
shared base class 会模糊各家 available() 契约，各家 availability 检查留在自己文件里。
exa 丢弃无 highlight 条目、perplexity content 承载生成答案（链 servedBy 首行前置于其上）、
firecrawl search 只映射 `data.web[]`——三条映射规则都是上游/文档行为的直接镜像，勿"补全"。

## 关联

- 契约正本：`docs/plans/2026-09-02-005a-s05a-providers-settings-plan.md`（D1-D7、R1-R5）
- 前序设计：`docs/notes/2026-09-02-s04-credentials-wiring.md`（gate 三态/传 gate 义务/错误码口径）
- settings seam：宿主 `packages/settings/settings/src/index.ts:469-506`（installSection）、
  `:868-886`（hooks）、`:700-760`（真实 seam 测试先例）
- 下游义务：S05b 安装端到端（scratch profile + patch 两行）；S06/S07 GUI（settings 节读写 +
  credentials 写通路）；S08 loopback 直连收口
