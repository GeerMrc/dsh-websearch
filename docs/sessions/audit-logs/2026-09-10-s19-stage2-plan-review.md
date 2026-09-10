# Stage 2 计划审核 — S19（plan 019）

> 参数头：骨架库 v2（six-stage.md 阶段 2 骨架，证伪优先）| 阶段 2 | Session 19 |
> 输入指针：plan 正本 docs/plans/2026-09-10-019-s19-remove-perplexity-plan.md；用户指令语境 =
> 完整移除 dshws-perplexity（前后端+测试+文档+下游任务）+ 免费额度准入标准。
> 相对骨架偏离说明：增列移除面完备性 grep 实测、兼容设计核证（legacy 别名/类型面分离）、
> loopback 场景承载风险。执行方式：独立 spawn；同 Agent 增量复审。

## 轮 1 输出原文（逐字）

## 审核结论：NEEDS REVISION

证据均来自对 /Volumes/IPFSJK/Zcode/dsh-websearch 的 grep/读文件实测。先说核实为「成立」的部分，再列问题。

### 核实成立（无需改）

- **移除面 grep 实测**：src/ 引用面 = index.ts / config.ts / errors.ts / client/controller.ts / providers/perplexity.ts，与 D1 一致；settings.ts / keys.ts / fetch-gate.ts / preset-authoring.ts / chain/ / tests/chain / fetch-gate.test / preset-authoring.test / takeover.spec **零 perplexity 引用**，无隐藏漏项。tests 面清单（config/settings/apply/errors/loopback/controller.spec + 两个删除文件）与 D1 一致。
- **T1 闭环可达**：client 面「ids spelled here rather than imported」（controller.ts:16-19 注释 + 实测无 src/config 类型导入），node 面先删不破 client 编译；controller.ts:105/161 的本地 literal union 含 'dshws-perplexity' 是合法宽化。T1/T2 边界成立。
- **Tavily content 风险预案属实**：tavily.ts:129-137 `answer`→`content`，config.ts:525 `includeAnswer ?? 'basic'`（S17 D4 默认开），loopback served-by 场景改由 tavily 承载可行。
- **UA×5 正确**：现 6 处 `user-agent: 'dsh-websearch/0.3.1'` 断言（6 个 provider test），删 perplexity.test 后余 5，且 5 处均需随 0.4.0 改值——与 D4「UA×5 + 断言×5」吻合。
- **locales 92 keys**：pplx 键恰 4 个×双语，check-locales 实测现 96 keys，96→92 成立。

### 必改

1. **docs/00-architecture.md 未列入移除面（D1/T5 均漏）**。它是 current-state 正本：line 8 成员清单含 Perplexity、line 50 文件树 `perplexity.ts`、line 84 默认链序、line 91 config 样例节。成员移除不改架构正本 = 事实双_home 矛盾（命中 dont-do「状态区清单逐处打勾」同族纪律）。注意 line 122 提及的第三方 id `perplexity`（撞名论证）应保留——需在 plan 里区分「成员事实」与「上游撞名事实」两类残留。

2. **locales 移除面写少了：4 个 pplx 键之外还有 6 行 prose 提及**。locales.ts:173/278(chainOrderHint 默认序含 Perplexity)、178/278(searchCountryNote)、180/280(searchLanguageNote)——R1 用 `grep -ri`（不区分大小写）必然抓到这些行，stage 4 才发现 = 返工到 T2。D1 的 locales 条目必须补上这 6 行 hint 文案改写。R1 排除域本身严谨（仅 src/ tests/，docs/ 历史档/ADR/CHANGELOG/AGENTS.md:24 撞名注记天然豁免），但建议在 R1 注明豁免边界一句话。

3. **D2 legacy 别名的 client 面归一路径未设计**。controller.ts:230-231 `fallbackSelection = value.fallbackMember`（读 section 原始值直进 snapshot）：存量 `fallbackMember:'dshws-perplexity'` 会泄漏进快照——`fallbackDesignationReady`（:244-246）在缩后的 MEMBERS 里找不到该 id，选择器出现死值。D2 只写了 host 侧 resolveConfig 归一；T2 必须同时指定 controller:230-233 的归一（或 host settings describe 出 canonical 值）。且「同 LegacyFallbackProvider 模式」措辞不准确：现有模式（config.ts:485-489）归一的是**另一字段** fallbackProvider、仅当 fallbackMember undefined 时生效；新别名与 canonical 字段同域，拦截点在 defined 分支内部——融合位置不同，plan 需写明。

4. **schema 宽容 vs TS 收窄的类型面分离未写明**。config.ts:313 zod union 保留 'dshws-perplexity'，而 Config.fallbackMember（:261）类型是 FallbackMember——union 缩后两者不一致，需要显式输入侧宽化类型（`FallbackMember | 'dshws-perplexity'`，类比 LegacyFallbackProvider 独立输入类型）或输出窄化声明，否则 typecheck 红或靠 cast 蒙混。D1/D2 各写了一半，缺拼接说明。

### 建议

5. **loopback 改写点建议点名**：exhaustion 场景断言 `"all 3 configured chain members failed"`（loopback.test.ts:257 附近）须改 "all 2"、cause code `DSHWS_PERPLEXITY_HTTP_ERROR`（:263）、legacy-alias 场景 configuredRefs 含 PERPLEXITY_API_KEY（:237）、:43 fallbackMember 类型 union。T3 只写了泛化口径，逐条点名可防漏（pitfalls「不要只信声称」同理）。
6. **「门墙静态六件」未定义清单**：package.json 实际门 = test / typecheck(含 client program) / lint / check:i18n / build（5 类）。T4 执行者需要显式六件枚举，避免数字与实物对不上（dont-do「验收数字须实测」条款）。
7. **验证矩阵缺 typecheck/build 责任行**（被「静态六件」吞没）：建议在矩阵中单列，明确 typecheck 双 program 在 T4 提交态亲跑。

### 分级汇总

- 必改 4 项（1-4）：文档正本漏项、locales 6 行 prose、client legacy 泄漏、类型面分离。
- 建议 3 项（5-7）：loopback 断言点名、六件枚举、矩阵补行。
- 其余维度（移除面完备性、T1-T7 依赖顺序、tavily 承载可行性、UA/i18n 数字）实测通过。

修订 1-4 后可进入执行。

## 轮 2（增量复审）输出原文（逐字）

## 复审结论：APPROVED

逐条核对修订（正本行号为 2026-09-10 修订版）：

| 原问题 | 修订落点 | 核验 |
|---|---|---|
| 必改 1（00-architecture 漏项） | T5（:61）点名 line 8/50/84/91 四处 + line 122 撞名论证显式保留为边界；R1（:98）注明豁免域（docs 历史档/ADR/CHANGELOG/AGENTS.md:24） | 闭合，与实测行号一致 |
| 必改 2（locales 6 行 prose） | D1（:25-27）「4 个 pplx 键 + 6 行 prose 提及改写」逐类点名（chainOrderHint ×2 / searchCountryNote ×2 / searchLanguageNote ×2） | 闭合，与 locales.ts:173/178/180/273/278/280 实测对应 |
| 必改 3（client 归一双点） | D2（:35-38）双点归一：resolveConfig defined 分支内拦截（并写明与 LegacyFallbackProvider undefined 兜底的位置差异）+ controller.ts:230-233 fallbackSelection 同步归一防死值 | 闭合 |
| 必改 4（类型面分离） | D2（:33-34）Config 输入侧 `FallbackMember \| 'dshws-perplexity'` 宽型、Resolved 维持窄型 | 闭合 |
| 建议 5（loopback 点名） | T3（:59）：:43 union / :237 configuredRefs / :257 "all 3"→"all 2" / :263 cause 码 / served-by 改 tavily 承载 | 闭合，行号与 loopback.test.ts 实测一致 |
| 建议 6/7（六件枚举 + 矩阵行） | 矩阵（:72）：typecheck 双 program / lint / check:i18n 92 / build / pack / git status，并明确全量 pnpm test 归阶段 4 唯一责任点 | 闭合 |

两条非阻塞观察（不构成 REVISE）：

1. T2 内容列仍写「locales（-4 键）」未带 6 行 prose——D1 已是权威清单且 T2 覆盖 locales 面，执行者按 D1 走即可；仅措辞略滞后。
2. client 侧归一（D2 ②）落在 T2 的「controller」字样内但 T2 done 条件未点名对应测试证；host 侧红→绿已由 T1 承载，client 侧可视为 refactor-class 由 controller.spec 覆盖——若阶段 3 执行时发现无断言护住「存量值→snapshot 归一」，属可当场补的测试粒度问题，非计划缺陷。

计划可进入执行（T0 起）。

## 处置记录（主 Agent）

- 阶段 2.5 = **用户直接指令充当**（2026-09-10 对话原文：「优先全部清掉 Perplexity 搜索工具，以及与其相关的后续需要推进的相关任务计划工作……前后端与之相关全部清除」+ 产品定位声明）——非默认裁定，原文在案。
- 轮 2 观察 2 处置：T2 执行时为 client 归一补 controller.spec 断言（存量 'dshws-perplexity' → snapshot 'auto'）。
