# Plan — 2026-09-02-005a-s05a-providers-settings-plan

> plan 是验收契约：R 验收条目是 progress-M3 阶段验收的对照正本，验证矩阵是各阶段验证的
> 单源引用；🟢 债务归属映射的正本在本文件债务映射节。本棒为常规 TDD 棒：契约/逻辑类任务
> 先红后绿；T1 属重构类（禁证红、既有测试全绿零漂移），分类由阶段 2 审核 Agent 确认。

阶段 2 独立审核轮 1（2026-09-02，骨架库 v2）：**NEEDS REVISION**（M-1 🟡 getter 于壳构造器
spread 处被求值冻结——「链核零改动」前提不成立；M-2 🟡 三 provider 真实 API e2e 遗漏；S-1..S-6
建议；dont-do/pitfalls 零复发），本 plan 为修订版：M-1（T7 壳构造器透传修正 + 背景/风险表述
改写）、M-2（T7b e2e 三文件 + R2/R3 验收扩展）全数吸收；S-1（真实 settings seam 测试）、
S-2（schema 全量 + 冷热字段文档化定案 D7）、S-3（期望注册序落字）、S-4（T1 验收改可测表述）、
S-5（架构 §3 树同步入 T8）、S-6（阶段 5 冒烟形态落字）随批吸收。复审续用同一审核 Agent。

## 目标

S05a 交付 M3 第三棒（roadmap ⏳ 行）：`dshws-exa` / `dshws-perplexity` / `dshws-firecrawl` 三个
链成员 provider（前两者以上游同仓实现为线格式参考重实现，firecrawl 为全新面——上游无此包）+
settings 节接线（`installSection` 热改：链序/超时/启停，GUI 归 S06/S07，本棒只做 node 侧通路）。
三 provider 单测 mock HTTP 四态红→绿（同 S04 口径）；五 provider 注册冒烟全绿；settings 热改
链序实测下次搜索生效；门墙全绿。L-1 至此全部清偿。

## 背景

任务源 = `docs/session-roadmap.md` Session 05a ⏳ 行；链语义正本 = `docs/00-architecture.md` §4
+ ADR-0002；settings 依赖面 = 架构 §2（`installSection` 命名空间节）；成员注册纪律 =
Agent Note `2026-09-02-s04-credentials-wiring.md` §1（显式传 gates）/§3（错误码换形口径）。

阶段 0 独立审核（2026-09-02，骨架库 v2，结论落本 session 记录「前序 Session 审核确认」节）：
对 S04 **PASS**（🔴/🟡 结论以记录为准）。

阶段 1 只读摸底实锚（2026-09-02 亲测，deepseek-harness dev@3281e04b59）：

- **exa 上游参考**（packages/web/web-search-exa/src/provider.ts，不 import——id `exa` 撞上游
  注册名且违 `dshws-` 前缀，ADR-0003）：`POST {baseURL}/search` + Bearer；默认端点
  `https://api.exa.ai`（:22）；`numResults = request.maxResults ?? 配置默认，皆缺省省略字段`
  （:98-114）；`type: 'auto'` 与 highlights per-result=1 为请求形态内部常量（我们 config 无此
  二字段）；映射**丢弃无可用 highlight 的条目**（:56-65）；content 恒缺省、truncated 恒 false。
- **perplexity 上游参考**（packages/web/web-search-perplexity/src/provider.ts，同上不可复用）：
  OpenAI 兼容 `POST {baseURL}/chat/completions` + Bearer；默认端点 `https://api.perplexity.ai`
  （:22）、model `sonar`（:25）、maxTokens 1024（:28，我们 config 无字段 → 内部常量）；body =
  `{ model, max_tokens, messages: [{role:'user', content: query}] }`（:113-118）；响应映射 =
  content 取 `choices[0].message.content`（生成答案——五成员中唯一有 content 的成员）、sources
  优先结构化 `search_results[]`（{url,title,snippet,date}）、`search_results` 缺席时回退
  URL-only `citations[]`（:73-83）。
- **firecrawl 线格式**（官方文档取证 2026-09-02，docs.firecrawl.dev——**上游无 firecrawl 包，
  全新面**；当前 API 为 **v2**）：search = `POST https://api.firecrawl.dev/v2/search` + Bearer，
  请求 `{ query（必填）, limit? }`（v1 不发 sources/scrapeOptions → 默认 web 源），响应
  `{ success, data: { web: [{ url, title?, description?, position }] } }`（**按类型分组，非扁平
  数组**——v1 时代文档的扁平 `data[]` 已过时）；scrape = `POST /v2/scrape` + Bearer，请求
  `{ url（必填）, formats: ['markdown'] }`，响应 `{ success, data: { markdown,
  metadata: { sourceURL, url（最终 URL）, statusCode, contentType } } }`；错误面 = 402/429
  `{ error }`、500 `{ success:false, code, error }`。
- **settings seam**：`installSection(owner, ns, schema, entry, hooks)`
  （packages/settings/settings/src/index.ts:469-506）：注册 ns（lowercase kebab）+ schema +
  entry 为 base 层；hooks 时序 = `setSource(scope.get)` → detach-fallback effect → `onChange()`
  → `watch(onChange)`；`SettingsSectionHooks<T> = { setSource(current: () => T); onChange();
  validate? }`（:868-886）。**上游同构先例**（web-search-deepseek/src/index.ts:128-137）：
  `let current = () => config; ctx.inject(['settings'], sctx => sctx.settings.installSection(ctx,
  NS, Config, config, { setSource: s => { current = s }, onChange: () => {} }))`——provider 每
  操作投影 section，committed change 无需重注册。条件注入 = cordis 标准
  `ctx.inject(['settings'], cb)`（settings/src/index.ts:919 便利封装同构；缺服务时回退静态
  config）。ns 冲突面：本插件用 `'dsh-websearch'`（上游已占 `'web-search-deepseek'`）。
  S02 H3 已实证外置插件 describe/mutate 通路 + settings.yaml 持久化跨重启。
- **热改通路**：链核 `run()` 每次迭代读 `this.#options.order`、每成员读 `perMemberTimeoutMs`
  （chain/core.ts）——**但 S04 壳构造器 `{ ...options, id }` 的对象展开会在构造时求值 getter
  并冻结为静态值**（阶段 2 审核 M-1 实证：chain/core.ts:220-222/:243-245），故热改必须连带壳
  构造器改为 options 原对象透传（行为保持型修正，见 D2/T7）；成员 enabled gate 已是热读
  （S04 D3）。settings 源同样要过 `resolveConfig` 显式默认化（schema 零默认注入，S03 实锚）。
- **依赖面**：`@deepseek-ai/dsh-settings` npm 全列表 `0.0.1-rc.1..0.1.1-rc.2 + 0.1.2 线
  alpha.2..4`（dont-do 第 2 条纪律），宿主源码树 `packages/settings/settings` = 0.1.2-alpha.3；
  类型增强（`ctx.settings`）经 devDep type-only import 引入（S04 dsh-credentials 同模式）。
- **脚手架提取候选**（S04 阶段 4/5 观察级）：deepseek.ts/tavily.ts 各 ~40 行错误脚手架
  （abort 三件套/正整数检查/错误体展开/凭据解析包装）近乎复制——本棒提取，避免四份复制。

## 范围决策（D1-D6，供阶段 2 审核判定层级）

| # | 决策 | 依据 |
|---|---|---|
| D1 | settings 接线 = 条件注入 `ctx.inject(['settings'], …)`（settings 服务缺席 → 回退 cordis.yml 静态配置，插件不因缺服务失效）；ns = `'dsh-websearch'`；schema = 现有 `Config`；live state = `resolveConfig(source())` 于 setSource/onChange 重算（默认化显式，schema 不注入默认）；上游 web-search-deepseek 模式同构 | 上游先例 + S02 H3 实证；settings 源与 cordis.yml 源走同一 resolveConfig = 单一默认化归属 |
| D2 | 热改范围 v1 = **链序（search/fetchChain）/ perMemberTimeoutMs / 成员 enabled**；成员选项字段（baseURL/model/maxTokens/maxResults/numResults/apiKeyEnv）launch-static（provider options 构造一次，不改 S04 provider 构造形态）。**settings 节 schema 仍用全量 `Config`**（GUI S06/S07 与手改 settings.yaml 都面向同一节；不因冷热拆 schema），冷热边界文档化：Config 各字段 JSDoc 标注「热改/launch-static」，settings 改动冷字段 = 下次启动生效（S-2 定案，阶段 4 可对峙） | roadmap S05a WBS 字面 =「链序/超时/启停热改」；成员字段热改 = 扩 S04 provider 面（thunk 化），越权范围；apiKeyEnv 热改在 GUI S06 走 credentials 服务而非 settings，本就不经此节 |
| D7 | 热改的链通路 = 壳构造器**透传修正**（S03 资产、行为保持型）：`ChainSearchProvider`/`ChainFetchProvider` 构造器不再 `{ ...options, id }` spread（该展开把 getter 求值冻结——阶段 2 M-1 实证），改为把调用方 options 原对象交给 ChainCore（id 契约面收敛为 `Omit<ChainOptions,'id'>`；实现时核实 core 对 `options.id` 的运行时消费——为零消费则契约瘦身，若实有消费则显式独立传参）。既有 `tests/chain/*` 传静态 options，行为面零变化，全绿为证 | 链核编排骨架不动； spread 求值语义 = getter 冻结的根因 |
| D3 | firecrawl = **单类双接口**（implements WebSearchProvider & WebFetchProvider），共用 options/凭据/gate；search 注册 searchMembers + ctx.web，fetch 注册 fetchMembers + ctx.web；线格式钉 v2（`/v2/search`、`/v2/scrape`）；scrape markdown → `WebFetchBody` 的 `text` kind（封闭并集只有 html/text，markdown 是解码文本）；statusCode 取 `metadata.statusCode ?? 200`（资源状态非 API 状态——seam 契约「非 2xx 是结果不是错误」）；2xx 且 `success === false` → BAD_RESPONSE（防御文档外形态） | 架构 §3「firecrawl（search + 抓取，同 key）」；官方 v2 文档取证；closed union 不新增 kind |
| D4 | 脚手架提取 = `src/providers/shared.ts` 机械 helper（abort 判定与错误构造、正整数检查、容错错误体展开、每成员凭据解析包装——错误族码与文案 label 参数化）；**只提取函数，不建类层次**（上游明确评论 shared base class 会模糊各家可用性契约）；重构类 TDD：禁证红、既有测试全绿且断言/消息文本零漂移 | S04 阶段 4/5 观察级 + 本棒再落三族；上游 web-search-perplexity provider.ts:91-99/155-167 的提取边界评论 |
| D5 | 映射规则：exa **丢弃无可用 highlight 的条目**（upstream 同构——seam 无其他字段可派生 snippet）；perplexity content 承载生成答案（链 servedBy 首行前置于其上，D2 归因兼容）；firecrawl search 仅映射 `data.web[]`（v1 不请求 news/images）且丢弃无 url 条目 | 上游行为即正本；seam `WebSearchSource` 字段真实性（不发明字段） |
| D6 | 错误码三族换形同 S04 口径（D4 沿革）：`MEMBER_ERROR_CODES` exa/perplexity/firecrawl 三族前缀 string → 五键对象（`credentialMissing/requestFailed/httpError/badResponse/aborted`）；`tests/errors.test.ts` 形状断言随行为更新（同 S04 M-1 处置口径） | Agent Note s04 §3 既定路线；S05a 落地即全五族对象形，混合形状终结 |

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 类别 | 前置 |
|---|---|---|---|---|
| T0 | STATUS 启动刷新（S05a 🚧 台账行 + 当前位置块）+ 本 plan 落盘；纯文档 commit 直提 master（先例） | 三处落盘 file:line 可查 | docs | 无 |
| T-prep | 新增 peer `@deepseek-ai/dsh-settings >=0.1.2-alpha.3 <0.1.3` + devDep 实钉 alpha.4（类型增强 type-only + installSection 运行时经服务注入）；`pnpm install` | install 0 error；typecheck 过；高危预告① | 机械类 | T0 |
| T1 | 脚手架提取（D4）：`src/providers/shared.ts`（`isAbortError`/`throwIfMemberAborted`/`memberAborted`/`isPositiveInteger`/`unfoldHttpErrorDetail`/`resolveMemberApiKey`——错误族码与文案 label 参数化）+ deepseek/tavily 切换到共享 helper；**禁证红**：全量测试回归绿、断言与错误消息文本零漂移（label 保形） | 重构类验收 = 全量绿 + **tests/ 目录在 T1 diff 中零变更**（S-4 可测表述）+ src 行为面 diff 审阅 | 重构类 | T0 |
| T2 | 错误码三族换形（D6）+ 形状断言随行为更新 | 先红（新形状断言必红）→ 后绿 → commit | TDD | T1 |
| T3 | exa provider `src/providers/exa.ts`（D5）：请求/响应映射纯函数 + provider 类（`dshws-exa`）；单测 mock HTTP：请求映射（含 numResults 显式/回退/省略三断言）+ 成功映射（丢无 highlight 项）+ 429 + 断网 + abort + 凭据缺失 + BAD_RESPONSE + available() + id 契约 | 先红（模块缺失）→ 后绿 → commit | TDD | T2 |
| T4 | perplexity provider `src/providers/perplexity.ts`（D5）：单测 mock HTTP：请求映射 + 成功映射（content=答案 + search_results 优先）+ citations 兜底映射 + 429 + 断网 + abort + 凭据缺失 + BAD_RESPONSE + available() + id 契约 | 先红 → 后绿 → commit | TDD | T2 |
| T5 | firecrawl provider `src/providers/firecrawl.ts`（D3）：单类双接口；单测 mock HTTP search 面（请求映射 + data.web 映射 + 429 + 断网 + abort + 凭据缺失 + BAD_RESPONSE(success:false) + available() + id 契约）+ fetch 面镜像子集（请求映射 formats=['markdown'] + markdown→text kind 映射 + statusCode 透传 + 402/429 错误 + abort） | 先红 → 后绿 → commit | TDD | T2 |
| T6 | settings live-state `src/settings.ts`（D1）：`createLiveConfig(config)`（返回 `{ current(): ResolvedWebSearchConfig }` 初始态）+ `attachSettingsSection(ctx, schema, entry, onChange)` 薄封装（installSection + setSource/onChange 重算 resolveConfig）；单测 fake settings seam：初始 attach 调 setSource+onChange；热改 source → current() 反映新值（含链序/timeout/enabled 字段）；detach 回退 entry | 先红（模块缺失）→ 后绿 → commit | TDD | T-prep |
| T7 | apply 五成员定形（D2/D7）：**壳构造器透传修正（D7，S03 资产行为保持型）**——ChainSearchProvider/ChainFetchProvider 不再 spread options，原对象透传 ChainCore（getter 热读才成立；核实 core 对 id 的运行时消费后收敛契约面）；exa/perplexity/firecrawl 以 resolveConfig 成员配置实例化 + **显式传 gates**（Agent Note s04 §1 纪律）；firecrawl 双注册（search + fetch registry + ctx.web 双面）；链 options 改 getter-backed（order/perMemberTimeoutMs 热读）；`ctx.inject(['settings'])` 接 D1 live state（缺服务回退）；apply.test 升级：**五 provider 注册冒烟**（**期望序 = `['dshws-chain','dshws-tavily','dshws-exa','dshws-perplexity','dshws-firecrawl','dshws-deepseek']`，成员按 BUILT_IN_MEMBER_ORDER 注册**（S-3）/fetch=`['dshws-chain-fetch','dshws-firecrawl']`）+ **热改链序实测下次搜索生效**（spy 调用序翻转）+ timeout 热读 + enabled gate 翻转 + 无 settings 服务回退可跑 + **真实 seam 测试一条**（真实 cordis ctx + 真实 SettingsProvider（上游 settings.spec.ts 先例）驱动 update→watch→onChange→新序生效（S-1）） | 先红 → 后绿（含 tests/chain 回归）→ commit | TDD | T3/T4/T5/T6 |
| T7b | 真实 API e2e 自跳（M-2 宪法口径）：`tests/e2e.real/` 增 exa/perplexity/firecrawl 三文件（`process.env.EXA_API_KEY`/`PERPLEXITY_API_KEY`/`FIRECRAWL_API_KEY` 自跳；key 经 env-backed resolve thunk 同生产 seam，JSDoc 披露；firecrawl 双面——search 与 scrape 各一 it） | `pnpm test` 输出 skipped 计数实测（本机无 key 自跳）；命令原文入记录 | 验证类 | T7 |
| T8 | 门墙收口 + Agent Note + progress-M3 增补 + **架构树同步（S-5）**：环境验证输出（`node --version && pnpm --version` ≥22.19）+ 四命令全绿（完整输出过滤，禁 tail 截断）；Agent Note 落 docs/notes/（settings 热改通路与冷热字段边界/firecrawl v2 取证与双接口/壳构造器透传修正留痕/提取边界）；**00-architecture.md §3 模块树增 `chain/core.ts`（S03 树外新增回填）与 `providers/shared.ts` 两行**；progress-M3 增 S05a 批次表 + 已验锚点新增（settings seam 行号 / firecrawl docs URL / 上游双 provider 行号 / dsh-settings 发布线） | 环境输出 + 四命令绿 + Note/架构树落盘 + 台账增补 | — | T7b |
| T9 | 阶段 4/5 独立审核 + 交叉验证：R1-R5 逐条对峙（file:line + 实跑重放，**全量测试唯一责任点**）+ 安全/契约/前瞻三问 + 实跑冒烟 | PASS / COMPLETE 结论落 progress-M3 | 独立 Agent | T8 |
| T10 | 收尾 6 件套 + 原子翻转（STATUS 台账 ✅ + 当前位置块 + roadmap S05a 行 ✅ + progress-M3 验收表，同一序列）+ 踩坑沉淀（无重大坑则显式声明零新增）+ 接力指令（记录末节 + 回复末尾）+ `feat/s05a-providers-settings` **`--no-ff`** 合入 master | R5 全过 | — | T9 |

执行纪律：开发自 **`feat/s05a-providers-settings` 分支**推进（T-prep 起；T0/计划纯文档直提
master），阶段 4/5 PASS 后方合入。逐一串行，一任务一 commit，禁批量；写操作不并行。
T1 重构类豁免证红（禁证红是重构纪律本身），分类由阶段 2 审核 Agent 确认；T-prep 机械类
（install 验证手段 = 命令绿）；其余 src 任务全部先红后绿。

## 验收条目（R1-R5，progress-M3 阶段验收逐条对应）

- **R1** 三族错误码换形可重放：exa/perplexity/firecrawl 五键对象形（file:line）+ errors.test.ts
  断言随行为更新 + 全五族对象形收口（混合形状终结）
- **R2** exa/perplexity 单测 mock HTTP 四态红→绿：成功/429/断网/超时（abort 传播）+ 请求映射 +
  响应映射（exa 丢无 highlight 项 / perplexity content 答案 + citations 兜底）+ 凭据缺失 +
  available() + id 契约 + **e2e real 两文件就位与 skip 实测**——每任务红/绿证据/commit 三元组
- **R3** firecrawl search + fetch 双面红→绿：search 四态 + data.web 映射；fetch 请求/映射
  （markdown→text、statusCode 透传）/402-429 错误/abort；单类双接口形态 + **e2e real 双面就位
  与 skip 实测**
- **R4** settings 热改实测：热改链序 → **下次搜索新序生效**（spy 调用序断言）+ timeout 热读 +
  enabled gate 翻转 + 条件注入回退（无 settings 服务静态可跑）
- **R5** 五 provider 注册冒烟全绿（search=chain+5、fetch=chain-fetch+firecrawl）+ 门墙实测数字
  （test/typecheck/lint/build，禁算术外推）+ 收尾 6 件套齐备且原子翻转 + 分支闭环（`--no-ff`）

## 验证矩阵

| 验证面 | 触发时机 | 责任阶段 | 采信规则 |
|---|---|---|---|
| T0 落盘核验 | T0 | 3 | 主 Agent 亲改；阶段 4 独立 Agent file:line 重放 |
| T1 重构回归零漂移 | T1 | 3 | 全量测试绿 + diff 行为面审阅（阶段 4 抽验） |
| 三族换形红绿 | T2 | 3 | vitest 红/绿输出原文入记录 |
| 三 provider mock HTTP 红绿 | T3/T4/T5 | 3 | 同上（每态断言独立 it；fetch 面镜像） |
| settings 热改 + 回退 | T6/T7 | 3 | 同上（链序 spy 序 + timeout/enabled + 缺服务回退 + **真实 SettingsProvider seam 一条（S-1）**） |
| 五 provider 注册冒烟 | T7 | 3 | apply.test 注册面断言（期望序 = BUILT_IN_MEMBER_ORDER） |
| e2e 自跳 skip 计数 | T7b | 3 | `pnpm test` 原文；阶段 4 重放 |
| 门墙四命令 | T8 收口 | 3 / 4 | 主 Agent 亲跑数字；阶段 4 独立 Agent 重放（全量唯一责任点） |
| R1-R5 对峙 | T9 | 4 | 独立 Agent 实测 |
| 冒烟重放 | T9 阶段 5 | 5 | **形态（S-6）**：/tmp node 脚本 import 构建产物 lib/index.js + fake ctx（web/credentials/settings 面）驱动「注册五成员→配 key→settings 热改链序→stub fetch 搜索」，断言新序生效；采信阶段 3/4 数字 |
| 治理产物一致性 | 收尾前 | 4 | 独立 Agent 实测 |

（本棒无 scratch profile / 无实例启动 / 无浏览器面——安装端到端归 S05b，GUI 归 S06/S07。）

## 高危命令预告（阶段 2.5 披露，对照 governance §3.4.7 清单）

1. **依赖安装**：T-prep `pnpm install`（新增 peer `@deepseek-ai/dsh-settings` + devDep 实钉
   alpha.4；新增非删除、域内非大版本变更——**注意 S04 坑：install 可能自动改
   pnpm-workspace.yaml，commit 必须一并带上**）
2. **本仓分支合并**：T10 将 `feat/s05a-providers-settings` 以 `--no-ff` 合入 master（阶段 4/5
   PASS 之后；本地合并，无 push / 无 PR / 无 force）
3. **明确不做**：npm publish / git push / 真实凭据读写（测试全 fake 或自跳）/ scratch profile
   与实例启动 / `~/.dsh` 与 3080 实例触碰 / 仓库外路径写入（除 /tmp 冒烟脚本）/ 治理产物删除

## 债务归属映射（正本）

| 债务 | 等级 | 归属 | 依据 |
|---|---|---|---|
| L-1 余 exa/perplexity/firecrawl 插件内重实现 | 🟢 | **本棒 T3/T4/T5 清偿**（收官台账标 🟢-1 → L-1 全清） | ADR-0003；roadmap S05a 行 |
| L-2 per-profile GUI 覆盖二期候选 | 🟢 | 二期候选，不排期（不变） | ADR-0004 |
| S04 观察级：错误脚手架近复制 | 观察 | **本棒 T1 提取清偿**（shared.ts） | S04 阶段 4/5 审核观察项 |
| S04 观察级：T3/T4/T5 模块缺失型红 | 观察 | 不处置（合法红形态，留痕） | S04 阶段 4/5 审核观察项 |

## 风险

- **published dsh-settings 类型面**：alpha.4 类型增强（`ctx.settings`/installSection/hooks）若
  与宿主源码树 alpha.3 有偏差 → T-prep 后 T6 typecheck 即暴露；处置 = 停下走范围变更回路，
  不私打补丁（dsh-credentials alpha.4 同模式已一次通过，风险低）
- **settings 回调时序**：installSection 的 setSource/onChange/watch 时序若与摸底理解不符 →
  T6 单测（fake seam）钉行为 + 上游 deepseek 先例对峙；异常按实锚修正，决策入 Agent Note
- **getter-backed options 与壳构造器（D7）**：透传修正后 getter 链路面成立；若 ChainCore 存在
  `options.id` 的运行时消费（实现时核实）→ 壳构造器显式独立传 id 参数，契约面相应调整；既有
  tests/chain 全绿为行为保持证据
- **firecrawl v2 文档漂移**：取证时点 2026-09-02；若响应字段（data.web/metadata.statusCode）与
  实际不符 → 容错映射（缺失字段缺省）+ 单测钉容错面；重大漂移走范围变更回路
- **T1 重构回归**：消息文本参数化（label）若引入文本漂移 → 既有测试断言立刻红（它们钉了消息
  内容）；TDD 纪律 = 先跑全量确认绿再 commit
- **mock HTTP × abort**：沿 S04 真实事件路径（stub fetch 监听 signal abort），不用 fake timers
