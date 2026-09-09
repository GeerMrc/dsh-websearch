# Plan 017 — S17 搜索工具全面对齐官方 API：P1 高价值参数批

> 任务源：docs/session-roadmap.md:79（S17 ⏳ 行，S16 审计触发）。
> 阶段 0 gate：PASS（🔴×0；🟡×4 全为登记/流程面 → T0 清偿；🟢×2 → anysearch UA 断言归 T8 前置步、全量坐实归阶段 4；正本 =
> 本 session 记录「前序 Session 审核确认」节 + audit-log 2026-09-10-s17-stage0-review-of-16p0.md〔🚧 T0 生成中〕）。
> API 参数正本：本 plan 附录 A（两路独立调研 Agent 官方文档核证，2026-09-10；出处 URL 逐项在档）。

## 0. 范围与不做

**做**：roadmap S17 行的 14 个 wire 参数全链路（config schema + resolveConfig + provider wire + GUI 控件 + locales en/zh + 单测红绿），加统一的「成员 options 热化」机制（验收要求热生效）。

**不做（显式边界）**：
- Perplexity Agent API 迁移（`/v1/agent` + responses 形态）——Sonar 全线 2026-09-27 日落，本棒参数按可迁移同名形态设计（见 D6），迁移单列债务 + 建议 S18 立即接棒（2.5 决策点）。
- S16 审计 P2/P3/P4 项（后续棒）。
- README/architecture 全面刷新（S15 文档腿既有归属）；web_fetch 恢复路径只做**评估**（结论落档，不实现）。

## 1. 设计决策（D1-D7）

**D1 成员 options 统一热化（含既有字段）**。现况：成员 options 在 apply() 一次解析（launch-static），仅链序/超时/enabled 门走 `live.current()` 热读；验收要求新参数热生效。机制：index.ts 增 `hotMemberOptions(build)` 帮助函数——getter 委托（Proxy get 每读经 `resolveXxxMemberOptions(live.current().xxx, thunk)` 重解析，纯函数开销可忽略），六成员统一接入；provider 零改动（六 provider 均逐次读 `this.options.X`，已核证）。**签名从 T1 起即按双参形状设计**（阶段 2 审核 A1）：build 同时喂成员节与根节（`resolveXxxMemberOptions(live.current().xxx, root.live…)`——D2 全局字段需进成员 options，T6 不返工 T1）。**副作用（有意）**：既有 baseURL/model/maxResults/numResults/maxTokens 一并变热——同一机制自然覆盖，刻意保冷反而要额外冻结代码。**launch-static → Hot 文档改写全清单（阶段 2 审核 A3，文档随码同改，分入各成员任务 done 条件）**：config.ts 各成员 JSDoc（含 deepseek `maxUses`、anysearch `zone` 的 Launch-static 标注）、settings.ts:10-14「provider option fields stay launch-static」段、controller.ts launch-static 相关注释（:69-70 baseURL 注释/:293-295/:321-325）、section.tsx:710-712 MemberEndpointField 注释、endpointNote 双语文案、各 provider 模块头 wire-contract JSDoc（如 tavily.ts:5-9「include_answer stays off」句——T2 后必改）。链序 getter 先例：src/index.ts:247-271。

**D2 通用「语言/区域统一入口」= 全局单写入点 + 按成员 fan-out（最小配置面，ADR-0015 正本）**。根 config 增两字段：`searchCountry`（ISO 3166-1 alpha-2，如 `CN`）、`searchLanguage`（ISO 639-1，如 `zh`）；缺省不发送（零 wire 变化）。映射：Tavily `country`（**仅 topic=general 生效**，官方约束，GUI ⓘ 注明）+ `language`；Exa `userLocation`；Perplexity `web_search_options.user_location.country` + `language_preference`；Firecrawl `country`；AnySearch/DeepSeek 无对应参数（不映射）。**Firecrawl 的 country 即经全局入口喂给（roadmap 三参数之一，不另设成员级 country——对称复制配置面是既有产品裁定反对的模式）**；成员级只加 tbs + location（location 为城市级自由文本，仅 Firecrawl 有此粒度）。〔勘注 2026-09-10，T6 执行时改判：Tavily country **v1 不喂**——其官方形态为国名字符串（"united states"），ISO 码兼容性未验证，发未验证值可能 400 链头成员；Tavily 只接 language。正本 = ADR-0015 Decision 3。〕

**D3 枚举一律按 2026-09-10 现行官方文档**（三处与 roadmap 老表述不同，调研实证）：
- Tavily `search_depth`：`basic|advanced|fast|ultra-fast`（4 值；advanced=2 credits，其余 1）
- Tavily `topic`：`general|news|finance`（3 值）；`time_range`：`day|week|month|year`（全名形态）；`include_answer`：`basic|advanced` 枚举（bool 已演进，true≡basic）；响应 `answer` → 结果 `content`
- Exa `type`：`instant|fast|auto|deep-lite|deep|deep-reasoning`（6 值；**keyword/neural 已移除**；现行硬编码 `auto` 仍是合法默认，转为可配）
- Perplexity `search_recency_filter`：`hour|day|week|month|year`（5 值含 hour）；`search_context_size`：**嵌套 `web_search_options.search_context_size`**（非 top-level），`low|medium|high`
- Firecrawl `tbs`：`qdr:h|qdr:d|qdr:w|qdr:m|qdr:y`；`country`：ISO 码（API 默认 `US`——不设即美国偏置，这正是要修的）；`location`：自由文本地理串（官方建议与 country 同设）

**D4 缺省 = 零行为漂移，两处例外（有意行为变更，2.5 披露）**：
- Exa `textFallback` 默认 **true**：请求增 `contents.text: { maxCharacters: 1000 }`，snippet 取 `highlights[0]` 回退 `text`——修复「无 highlight 结果整条被丢」（S16 P0 遗留正确性缺口的正面修复）
- Tavily `includeAnswer` 默认 **'basic'**：免费（官方无计费记载）生成答案 → 结果 `content`；对齐 Perplexity 成员已回 content 的既有语义
- Perplexity `maxTokens` 缺省维持显式 1024（现行常量语义不变，仅转可配——「1024 腰斩」修复 = 用户可调高；官方无「不传默认 1024」记载，属社区经验层）。**`finish_reason === 'length'` 不映射 `truncated`**（阶段 2 审核 B3 改判）：seam 契约中 `truncated` 的所有权是「**the seam** dropped sources to honor maxResults」（dsh-web types.d.ts:29-38，上游官方 Perplexity provider 亦恒 false）——答案 token 截断复用该字段会让 GUI「Results truncated/结果已截断」对 sources 完整的场景撒谎；截断事实已可通过 toolview 原始响应（toolRaw）观察，不新增通道

**D5 字段命名与形态**（config camelCase，wire 按各家原生）：

| 成员 | config 字段 | 类型/枚举 | wire 形态 |
|---|---|---|---|
| tavily | `topic` | `'general'\|'news'\|'finance'`（缺省不发送） | `topic` |
| tavily | `timeRange` | `'day'\|'week'\|'month'\|'year'` | `time_range` |
| tavily | `searchDepth` | `'basic'\|'advanced'\|'fast'\|'ultra-fast'` | `search_depth` |
| tavily | `includeAnswer` | `'basic'\|'advanced'`（缺省 basic，见 D4） | `include_answer`；响应 `answer`→`content` |
| exa | `type` | 6 值枚举（缺省 auto 常量） | `type` |
| exa | `textFallback` | `boolean`（缺省 true） | `contents.text: { maxCharacters: 1000 }` 同请求于 highlights |
| exa | `startPublishedDate` | `string`（YYYY-MM-DD，GUI date input） | `startPublishedDate`（date-only 归一为 `T00:00:00Z` 后缀，provider 侧归一） |
| perplexity | `maxTokens` | `number`（1..128000，缺省 1024；schema `.step(1).min(1).max(128000)` 显式带上限，API 硬约束） | `max_tokens` |
| perplexity | `searchRecencyFilter` | `'hour'\|'day'\|'week'\|'month'\|'year'` | `search_recency_filter` |
| perplexity | `searchContextSize` | `'low'\|'medium'\|'high'`（缺省不发送） | `web_search_options.search_context_size` |
| firecrawl | `tbs` | `'qdr:h'\|'qdr:d'\|'qdr:w'\|'qdr:m'\|'qdr:y'` | `tbs` |
| firecrawl | `location` | `string`（自由文本） | `location` |
| 根 | `searchCountry` | `string`（2 字母） | 各家形态（D2） |
| 根 | `searchLanguage` | `string`（2 字母） | 各家形态（D2） |

**D6 Perplexity 日落防御**：本棒停在现行 `/chat/completions`（roadmap 口径），但所选参数在 Agent API 均有同名/近名对应（`search_recency_filter`→web_search filters、`search_context_size`→web_search 工具、`max_tokens`→`max_output_tokens`、`user_location` 同名），迁移时 config 面零改动；债务台账登记 🟡「2026-09-27 Sonar 日落迁移」（建议 S18）。

**D7 版本与 UA**：功能批 = minor：0.2.2 → 0.3.0；6 个 USER_AGENT 同步 `dsh-websearch/0.3.0` + 六处测试断言（S16 P0 坑在案：UA 随包版本走）；顺手清偿 🟢 anysearch UA 断言缺口（阶段 0 登记）。bump 时点 = T8 前置步（审核 B2：换包需要新版本号 tarball 避开 pnpm 同版本跳过）。

## 2. 任务清单（T 编号；每任务 red→green→commit 闭环，串行）

| 任务 | 内容 | done 条件 |
|---|---|---|
| T0 | 治理批：分支 `feat/s17-p1-params` + plan 017 + 阶段 0 audit-log 入库 + **🟡×4 清偿**（①progress-M7 债务台账补 web_fetch 行 + S14c 起停更债务行镜像 ②S15a/15b/15c/16-p0 四棒 session 记录 reconstructed 补落〔沿 S11 先例，以 CHANGELOG+STATUS+commit 为源〕③STATUS 位置块「上一棒/更新时间」刷新 + 台账行序勘正〔15c 归位 16-p0 前〕④lint 3 warnings 清偿〔index.ts WebFetchProvider 未用导入 / takeover.spec.ts vi 未用 + 参数未用〕）+ STATUS 启动刷新 + session-17 骨架（三★节） | 四笔清偿各有 commit + 亲跑证据；`pnpm lint` 0w0e；STATUS 与 progress 口径一致 |
| T1 | 热化机制（D1，双参形状）：index.ts `hotMemberOptions`（build 同时取 `live.current().xxx` 成员节与根节——为 T6 全局字段预留）+ 六成员接入 + apply/settings 热通路测试（settings commit → 下一次 search 读到新 baseURL/maxResults，既有字段证热）+ settings.ts「launch-static」段改写 + config.ts JSDoc Hot 标注 | 热通路测试红（现况 launch-static 证红）→绿；受影响子集全绿（全量归阶段 4） |
| T2 | Tavily 4 参数（D3/D4/D5）：config 4 字段 schema+resolveConfig 默认化 + provider wire（topic/time_range/search_depth/include_answer）+ `mapTavilyResponse` answer→content + 模块头 JSDoc 更新（含「include_answer stays off」句改写，D1 清单）+ 单测（wire 断言/**既有字段零漂移 + 新增缺省字段按 D4 形态断言**〔include_answer:'basic' 恒在缺省体〕/answer 映射）+ e2e.real 补 topic=news+include_answer 真实断言（无 key 自跳） | 新测试先红后绿；缺省 wire 体 = 既有字段零漂移 + `include_answer:'basic'` 在档 |
| T3 | Exa 3 参数：config 3 字段 + provider wire（type 枚举 6 值/textFallback contents.text 同请求/startPublishedDate 归一）+ `mapExaResult` snippet 回退 text + 单测（缺省 wire 体 = 既有字段零漂移 + `contents.text.maxCharacters:1000` 在档）+ e2e.real 补 textFallback 断言 | 同上口径；「无 highlight 有 text 不再被丢」具名断言红→绿 |
| T4 | Perplexity 3 参数：config 3 字段 + provider wire（max_tokens 可配/`web_search_options` 对象**单一构造点**〔search_context_size 与 T6 的 user_location.country 同栖，集中一处构造防互相覆写——审核 A2〕/search_recency_filter）+ 单测 + e2e.real 补 maxTokens 断言；finish_reason 不映射 truncated（D4 改判） | 同上口径；web_search_options 嵌套形态断言红→绿 |
| T5 | Firecrawl 2 参数：config 2 字段 + provider wire（tbs/location）+ 单测 + e2e.real 补 tbs 断言 | 同上口径 |
| T6 | 通用语言/区域入口（D2）：根 config 2 字段 + 四家 fan-out wire（Tavily country〔general-only〕/language、Exa userLocation、Perplexity user_location.country〔并入 T4 单一构造点〕/language_preference、Firecrawl country）+ 单测（每家映射形态 + 缺省零发送）+ ADR-0015 落盘 | 四家映射断言红→绿；ADR-0015 accepted 在档 |
| T7 | client 面（全部控件）：controller（MemberSectionValue 扩展 + deriveSnapshot 增字段 + 泛型 `setMemberOption` + `setSearchCountry`/`setSearchLanguage`）+ section.tsx（Tavily 4/Exa 3/Perplexity 3/Firecrawl 2 控件 + 全局卡 2 字段；select 复用 FallbackToolRow 样式，toggle 复用 switch 形态）+ locales 新键 en/zh（估 +40 前后）+ controller.spec/section.spec/locales.spec 红绿；endpointNote「下次启动」文案改「下一次搜索」（随 D1） | 每成员控件渲染/动作派发/快照默认断言红→绿；check:i18n parity exit0 |
| T8 | **前置步：版本 0.3.0 bump**（package.json + UA×6 + 断言×6 + anysearch UA 断言〔🟢 清偿〕——审核 B2 次序修正：tarball 需新版本号避开 pnpm 同版本跳过坑，bump 原子完成于 T8 开头）→ 浏览器实测棒（scratch 3423：remove→add 换 0.3.0 tarball 重启，先告知后动；常驻 3080/3416 零接触）：新控件全要素亲见（渲染/选择/保存/反馈消隐/链卡全局字段）+ settings.yaml 持久化亲读 | 截图+文件证据归档 /tmp/dshws-s17/；复原态确认 |
| T9 | 实测收口 + 门墙：**3423 真实 API 参数实测**（按 scratch 凭据池可用面：Tavily topic=news 返回新闻结果〔验收例〕/Firecrawl tbs/country；无 key 者如实披露归用户择机）+ 版本面复验（0.3.0/UA×6 + 断言×6 在档）+ 门墙静态六件（typecheck/lint/build/pack/check:i18n/git status；**全量 `pnpm test` 留阶段 4 唯一责任点**）+ web_fetch 恢复路径评估结论（落 CHANGELOG 诚实标注 + 台账更新，不实现）+ Agent Note（docs/notes/2026-09-10-s17-api-alignment.md：附录 A 参数正本 + 三处枚举漂移 + 日落警报入册） | 真实 API 数字亲见或如实披露；lint 0w0e；i18n 新键数在档；评估结论落档 |
| T10 | 阶段 4/5 独立验证（两 Agent）：阶段 4 = 全量测试 + R1-R7 逐条对峙；阶段 5 = 安全/契约/前瞻三问 + 用户路径冒烟（采信阶段 4 数字） | audit-log 正本两份；PASS/COMPLETE |
| T11 | 收尾：session-17 记录补全 + STATUS/roadmap/progress/CHANGELOG 原子收官 + merge `--no-ff` → master + 接力指令（含 Perplexity 日落迁移紧迫披露） | 六件套齐 + 实物 ls 核对 |

## 3. 验证矩阵

| 验证面 | 触发时机 | 责任阶段 | 采信规则 |
|---|---|---|---|
| provider wire 单测（各成员新参数） | T2-T6 任务绿证 | 阶段 3 | 亲跑 1 次/任务，红→绿数字入 session 记录 |
| config resolveConfig 单测 | T2-T6 任务绿证 | 阶段 3 | 同上 |
| apply/settings 热通路 | T1 任务绿证 | 阶段 3 | 同上 |
| controller/section/locales specs | T7 任务绿证 | 阶段 3 | 同上 |
| i18n parity（check:i18n） | T7 绿证 + T9 门墙 | 阶段 3/4 | T9 亲跑 exit0 + 键数 |
| 静态门墙（typecheck/lint/build/pack/status） | T9 提交态 | 阶段 3 | 亲跑 exit code（lint 0w0e 含 T0 清偿复验） |
| 全量 `pnpm test` | 阶段 4 唯一责任点 | 阶段 4 | 亲跑 1 次，数字为正本（门墙表/CHANGELOG 引用不重写） |
| 浏览器实测 | T8 | 阶段 3 | 截图+文件证据 /tmp/dshws-s17/ |
| 真实 API 实测（3423 + e2e.real） | T9 | 阶段 3 | 有 key 面数字亲见；无 key 面如实披露 |

## 4. 债务映射

| 债务 | 等级 | 处置 |
|---|---|---|
| web_fetch 完整替代（S16-P0 登记，STATUS 悬空指针） | 🟡 既有 | T0 补台账行；T9 完成恢复路径**评估**（Firecrawl 云端/官方回退/多工具 fetch 链三路对比，结论落档；实现归后续棒） |
| progress-M7 债务台账 S14c 起停更（13 棒债务内联 STATUS） | 🟡 阶段 0 新抓获 | T0 补行镜像 |
| S15a/15b/15c/16-p0 session 记录缺失 | 🟡 阶段 0 | T0 reconstructed 补落四份 |
| STATUS 位置块半刷新 + 台账行序乱序 | 🟡 阶段 0 | T0 勘正 |
| lint 3 warnings 未披露 | 🟡 阶段 0 | T0 清偿（0w0e 复验） |
| anysearch UA 断言缺口 | 🟢 阶段 0 | T8 前置步顺手补（随版本 bump 原子完成） |
| 全量 357\|9(366) 未亲证 | 🟢 阶段 0 | 阶段 4 全量亲跑坐实 |
| **Perplexity Sonar 2026-09-27 日落**（新发现） | 🟡 新登记 | 本棒按 D6 可迁移形态设计；迁移单列 S18 建议（2.5 决策点） |
| 既有 🟢 池（L-2/观察项/v2 backlog） | 🟢 | 维持不排期；显式声明归属不变 |

## 5. 风险预案

- **3423 无 Tavily key**：真实实测面缩至可用 key（firecrawl/anysearch）；Tavily 验收例改由 e2e.real 自跳 + 用户择机补测，如实披露——不虚构通过。
- **Tavily country×topic 约束**：news/finance 主题下发送 country 官方未承诺——实现选择「topic 为 news/finance 时不发送 country」（防御性），GUI ⓘ 注明。
- **GUI 控件量大**（11 成员级 + 2 全局 + ~40 键）：T7 若 review 判过重，可裁剪为「高频控件直出 + 低频进折叠」——以 2.5 批准面为准，不擅自扩面。
- **换树/换包坑**（S12a：同版本 tarball 被 pnpm 跳过 → rm node_modules 强制重装；S14 系列：3423 换包先停旧实例，先告知后动）。
- **UA 断言六处联动**（P0 坑）：版本 bump 在 T8 前置步一次原子完成（审核 B2：T8 换包需要新版本号 tarball），T9 只复验，不散改。

## 6. 验收条目（R1-R8，对 roadmap 验收标准）

| R | 条目 | 证据形态 |
|---|---|---|
| R1 | 14 参数 config+resolveConfig+wire 单测红绿留痕 | 每 T 任务 pre-fix 失败行 + 绿数字（session 记录） |
| R2 | GUI 可配 + 热生效 + i18n 双语 | T7 specs + T1/T7 热通路测试 + check:i18n 键数 + T8 浏览器亲见 |
| R3 | 门墙全绿 exit0 | T9 静态六件 + 阶段 4 全量亲跑数字 |
| R4 | 3423 实测（Tavily news topic 返回新闻结果等） | T9 真实 API 数字/截图；不可用面如实披露 |
| R5 | 🟡×4 清偿 + 🟢×2 处置 | T0 commits + T8 前置步 commit（anysearch UA）+ lint 0w0e 复验 |
| R6 | API 参数正本落档 + ADR-0015 | Agent Note（附录 A + 出处）+ ADR accepted |
| R7 | web_fetch 恢复路径评估结论落档 | CHANGELOG 诚实标注 + 台账行更新 |
| R8 | 治理 6 件套 + 原子收官 | T11 序列 + 实物 ls 核对 |

## 附录 A — 官方 API 参数核证正本（2026-09-10，两路独立调研 Agent）

**Tavily**（docs.tavily.com/documentation/api-reference/endpoint/search）：`include_answer` bool|`basic`|`advanced`（默认 false；响应 `answer`；无计费记载）；`topic` `general|news|finance`；`time_range` `day|week|month|year`（+缩写；`days` 参数已移除）；`search_depth` `basic|advanced|fast|ultra-fast`（advanced=2 credits）；`max_results` 默认 10 上限 20；`country` 仅 topic=general；`language` ISO 639-1（boost）+ `filter_by_language`。

**Exa**（exa.ai/docs/reference/search）：`type` `instant|fast|auto|deep-lite|deep|deep-reasoning`（keyword/neural 已移除）；`contents.text` 与 `contents.highlights` 可同请求（text.maxCharacters 1-10000；响应字段 `text`）；`startPublishedDate` ISO 8601 date-time（people/company category 不支持——本插件不设 category）；`numResults` 默认 10 上限 100；区域唯一参数 `userLocation`（ISO 国家码）；无 language 参数。

**Perplexity**（docs.perplexity.ai/api-reference/sonar-post）：`max_tokens` int ≤128000（无官方默认记载；截断信号 `choices[].finish_reason==='length'`）；`search_recency_filter` `hour|day|week|month|year`；`web_search_options.search_context_size` `low|medium|high`（schema 默认 low；$5/$8/$12 per 1k 请求档位计费）；`language_preference` + `search_language_filter` + `web_search_options.user_location.country`；**Sonar 全线（含 /chat/completions 别名）2026-09-27 停止支持**（官方横幅；Agent API 迁移文档在档）。

**Firecrawl**（docs.firecrawl.dev/api-reference/search）：`tbs` `qdr:h|qdr:d|qdr:w|qdr:m|qdr:y`（可组合 sbd/cdr 形态）；`country` ISO 码默认 `US`（省略即美国偏置）；`location` 自由文本地理串（官方建议与 country 同设；合法值清单 firecrawl.dev/search_locations.json）；`limit` 默认 10 上限 100；搜索面无 language 参数（languages 仅 scrapeOptions 抓取阶段）。
