# Audit Log — 阶段 2 独立计划审核（Session 04，两轮）

> 参数头（轮 1 与复审同）：骨架库 v2 ｜ 阶段 2 ｜ Session 04 ｜ 输入指针：docs/plans/2026-09-02-004-s04-providers-credentials-plan.md（轮 2 为修订版 @`364675d`）、docs/session-roadmap.md S04 行、docs/dont-do.md、skill pitfalls.md、AGENTS.md、docs/00-architecture.md、上游参考仓只读路径 ｜ 相对骨架的偏离说明：无（骨架原样填槽；输入包按指针制附加宪法/架构对照文件与代码锚核验许可，均为事实槽位）。
> 审核执行：独立 general-purpose Agent，复审续用同一 Agent（协议允许：同阶段复审续用不违反独立性）。
> 输出原文逐字落盘如下（轮 1：NEEDS REVISION；复审：APPROVED）。

---

## 轮 1 输出原文

# 计划审核报告 — plan 004（S04 providers + credentials）

## 结论：**NEEDS REVISION**（必改 ×1，建议 ×4，观察 ×3）

锚点核验说明：计划声称的现行代码锚点我逐条独立实测，**全部命中**——credentials seam（`resolve` index.ts:183 / `describe` index.ts:191 / `credentialRef` index.ts:29 / `CredentialInfo` types.ts:67-74 / 事件声明 types.ts:90 / `notifyUpdated` index.ts:269）；web seam（`WebSearchRequest` types.ts:16-18 / `WebSearchResult` types.ts:35-42 / `WebSearchSource.publishedAt` types.ts:53）；上游 provider 参考行号（deepseek :35/:38/:41/:44/:47/:228-236/:121-174、exa :89/:98/:118/:130/:145）；exa 测试先例（spec :90-91、e2e :9-11）；anysearch 0.1.4 peerDependencies 经 `npm view` 独立复核确实含 `@deepseek-ai/dsh-credentials`；`@deepseek-ai/dsh-credentials` npm 全列表含 0.1.2-alpha.2/3/4，宿主 `packages/credentials/credentials/package.json` version = 0.1.2-alpha.3；Agent Note §2 假面硬义务原文实证；progress-M3:14/19/23 三处 + STATUS:37/41-46 的 T0 落盘实证（commit `4fc4187`）；registry.test.ts 确实不断言常量 true（D3「零破坏」声称成立）；「既有 47 条」与 progress-M3:54 一致。参考仓 dev@3281e04b59 与实测 HEAD 一致。

## 必改（M-1）

**M-1｜T2 目标形状未定案 + 既有断言必红未预案**（证据：plan WBS T2 行「先红：码常量缺失/值断言 → 后绿 → commit」+ D4 行；对照 `tests/errors.test.ts:28-30`）
- 现状：`MEMBER_ERROR_CODES` 是五族字符串前缀（`src/errors.ts:22-28`），且 `tests/errors.test.ts:28-30` 以 `Object.values(MEMBER_ERROR_CODES)).toEqual(['DSHWS_DEEPSEEK','DSHWS_TAVILY',…])` **严格断言该形状**。T2 将 deepseek/tavily 两族扩为每族 5 个具体码（D4），两族值从 string 变 object 后该断言**必然红**。plan 对 T6 点名了「apply.test.ts inject 断言随行为更新」，对 T2 的对应处置零预案——执行者到「后绿」步会遭遇计划外红灯，且可能被 T1 的「既有 47 条零破坏」口径误导而错误保留旧断言。
- 形状本身是导出面契约（`src/index.ts:28` 导出 `MEMBER_ERROR_CODES`），D4 承诺「S05a 三族复用同形」——但 plan 未定案 T2 后的形状是「两族对象 + 三族前缀字符串」混合形，还是五族全改对象形、S05a 只填码值。这决定 S05a 的接口，不能留给执行时临场决定。
- **改法**：D4 补形状定案；T2 验收要点补「`tests/errors.test.ts:28-30` 现有 `MEMBER_ERROR_CODES` 形状断言随本任务更新（点名 file:line，同 T6 对 apply.test.ts 的处置口径）」。
- 命中标注：无既有 dont-do/pitfalls 条目直接对应；属「遗漏面」维度新发现（对比 T6 的细致度，T2 是对称性缺口——AGENTS.md「Prefer symmetry for parallel values」精神下的计划内部不对称）。

## 建议（S-1..S-4）

**S-1｜「超时→abort」映射应升格为范围决策并统一措辞**（证据：roadmap S04 验收标准原文「两 provider 单测（mock HTTP：成功/429/断网/超时）红→绿」；plan 目标节「四态（成功/429/断网/超时）」；R2「成功/429/断网/超时（abort）」；风险节「超时预算语义已由 S03 必测⑦覆盖，本棒不重复」）
映射本身技术成立（provider 无超时逻辑，预算在链核且 S03 必测⑦已覆盖；provider 级可测面只有取消传播 = ABORTED），且 R2 已括注披露。但该映射目前散落在 R2 括注 + 风险节两处，未进 D1-D6 决策表——而 D 表明示「供阶段 2 审核判定层级」，是验收口径正本；目标节与 R2 字面不一致（一个「超时」无括注、一个有）。阶段 4 对峙 roadmap 时这是口径争议点。改法：立 D7（roadmap「超时」→ provider 级 abort 语义 + 链级超时归 S03 必测⑦的对应关系），目标节措辞与 R2 对齐。不命中既有条目，属「与 roadmap 验收标准对齐」维度的显式化不足。

**S-2｜Tavily `max_results > 20` 的请求侧语义未决**（证据：plan 背景 Tavily 取证「max_results?（默认 5，≤20）」；T5「`max_results = request.maxResults ?? 配置 maxResults，皆缺省则省略`」）
`WebSearchRequest.maxResults` 按 seam 契约透传（上游 exa 无上限故无此问题），seam 只在响应侧截断。若调用方传 >20，Tavily 按 4xx 拒绝则链内降级、直连则 fail-loud——行为可接受但 plan 未决策「透传 vs 请求侧 clamp 到 20」。建议 T5 或 D6 补一句定案（哪怕定「透传 + 上游同构」），并入 Agent Note 取证。不命中既有条目，属遗漏面（低风险：宿主 dsh-tool-web 的 bound 通常 ≤10）。

**S-3｜背景节两处措辞与实测不符（数值对、字面不准）**（证据：plan 背景「宿主 vendored 0.1.2-alpha.3」「npm 全列表 0.1.2-alpha.2..4」）
- `dsh-credentials` 不在 `vendor/`（vendor/ 仅 cordis 系），在宿主 `packages/credentials/credentials/` 源码树——「vendored」应为「宿主源码树」。
- `npm view @deepseek-ai/dsh-credentials versions` 全列表实为 `0.0.1-rc.1..0.1.1-rc.2 + 0.1.2-alpha.2..4`——「全列表」应为「0.1.2 线 alpha.2..4」。
两处数值均正确、结论不受影响，但本 plan 的摸底节是后续 session 的引用正本（progress 已验锚点台账机制依赖其精确性），且 dont-do 第 2 条的纪律恰是「看全列表」——措辞失准会误导下一轮引用者。改法：两处措辞修正。命中标注： dont-do「不要信 npm latest dist-tag / 不要凭印象假设版本域」的**反向印证**（plan 主动引用了该纪律且实测结论正确），仅表述精度问题，非复发。

**S-4｜门墙任务缺环境验证前置**（证据：plan T8「四命令全绿」；dsh-websearch AGENTS.md 环境纪律「本机默认 v20——构建/测试前必须切 nvm。环境验证命令：`node --version && pnpm --version`」）
pitfalls「不要让命令跑在错误环境里（环境漂移）」要求进入 session 先验证环境；plan 全文未在 T8/验证矩阵标注该前置（progress-M3:52 的 S03 数字带了 node v22.23.2 标注，是正确先例）。改法：T8 验收要点补「附环境验证命令输出」。命中标注：pitfalls「环境漂移」条目——预防性缺失，非复发。

## 观察（O-1..O-3，不要求修改）

- **O-1**：阶段 0 审核结论的落盘载体——plan 背景「结论落本 session 记录『前序 Session 审核确认』节」，S04 session 记录至审核时点尚不存在（docs/sessions/ 仅 01-03）。STATUS.md:41 已独立佐证「阶段 0 审核 PASS」存在。按 STATUS 悬空引用规则，plan 由生成该记录的 session 自己写前瞻表述属允许情形；T10 收尾时落实即可。
- **O-2**：D2 凭据缓存模型的语义边界已正确引用服务契约（types.ts:80-84 实证「Ambient process-environment changes are not observable and never emit」为服务契约明示；且「external edit observed in storage」会发事件，gate 的「事件命中受管 ref → 重 describe」设计两种情形均覆盖）——自洽，无需改；建议 Agent Note 把「外部存储编辑可发事件、进程环境层永不发事件」一并记录。
- **O-3**：D3 缺省 gate = true 使 S05a 三族注册时必须显式传 gate，否则假面局部复活——建议 T8 Agent Note 内容清单加此提醒（D3 已论证缺省值理由，非缺陷）。

## 维度小结

| 维度 | 判定 |
|---|---|
| 验收标准可测性 | R1-R5 均可写出具体验证命令（R4 的 `.real.test.ts` 命名可被 `vitest run` 默认 include 拾取，skip 计数可见，成立）；唯 T2 因 M-1 存在执行时口径缺口 |
| 依赖顺序 | T0-T10 线性串行无环；T3←T2 依赖偏弱但为治理串行纪律所要求，无害 |
| 范围合理性 | roadmap S04 行 WBS/验收三条全覆盖（R2/R3/R4），超集部分（R1 假面、R5 门墙）各有正本（Agent Note §2 硬义务实证；S03 先例）；工期 11 任务 vs S03 13 任务同量级 |
| 遗漏面 | M-1 + S-2/S-4 |
| roadmap 对齐 | 三条验收全覆盖；「超时」字面需按 S-1 显式化映射 |

**处置要求**：完成 M-1 修订（S-1..S-4 建议随批处理）后，本审核改判 APPROVED 无需复审其余节——修订范围仅限 D4/T2/R2/背景节措辞/T8 验收要点五处，不触及任务串行结构与验收契约主体。

---

## 复审输出原文（修订版 @`364675d`）

# 复审报告 — plan 004 修订版（commit `364675d`）

## 结论：**APPROVED**（附 2 处引用编号修正，批准性微调，不另起审核轮）

## 轮 1 发现逐项核验

| 项 | 判定 | 证据（修订版 file:line） |
|---|---|---|
| M-1 必改 | **已吸收，质量到位** | D4 行（:77）形状定案：两族 provider 落地时换具体码对象（每族 5 键 `credentialMissing/requestFailed/httpError/badResponse/aborted` → `DSHWS_<FAM>_<KEY>`），三族保持前缀 string、S05a 同口径换形；`tests/errors.test.ts:28-30` 断言随行为更新点名；T2 行（:88）验收要点与验证矩阵 T2 行（:124）同步；依据列补「不为未落地族预造 15 个码值」的换形时点论证（15 = 3 族 × 5 键，事实算术成立；errors.ts:4-6 模块 JSDoc「each provider adds its concrete codes when it lands」实证该路线为既定）。混合形状与「S05a 复用同形」承诺的缝隙已闭合 |
| S-1 | **已吸收** | D7 新立（:80），映射论证完整（provider 无自有超时逻辑 + 双超时源反证）；目标节（:19）「超时（abort 传播，D7）」与 R2（:108-109）措辞对齐；T4/T5 任务行挂 D7 引用 |
| S-2 | **已吸收** | D6 行（:79）「透传不 clamp」定案含失败语义（>20 → Tavily 4xx → HTTP_ERROR）；T5（:91）同步；T8（:94）Agent Note 取证清单收录 |
| S-3 | **已吸收** | 背景节（:61-63）「npm 全列表 `0.0.1-rc.1..0.1.1-rc.2 + 0.1.2 线 alpha.2..4`」与本轮审核 `npm view` 实测逐项一致；「宿主源码树 packages/credentials/credentials（非 vendor/，vendor 仅 cordis 系）」与实测一致 |
| S-4 | **已吸收** | T8（:94）环境验证前置 + 验收要点「环境输出」项 |
| O-2/O-3 | **已并入** | T8 Agent Note 清单两项具名（事件边界 O-2、S05a 传 gate 提醒 O-3/D3） |
| O-1 | **处置正确** | 头注（:10-11）按 STATUS 悬空引用规则记为允许前瞻、T10 落实，与轮 1 认定一致 |

## 批准性修正（随下一 commit 顺带落盘即可，非阻塞）

1. **D7 依据列引用编号失准**（:80）：「**plan-002** T10 已实测链级超时」——本轮实证 plan-002（S02 spike plan）无 T10 超时内容；链级超时实测正本是 **plan-003** T10（`docs/plans/2026-09-02-003-s03-host-skeleton-chain-plan.md:72`，必测⑦超时降级；progress-M3:47 双源印证）。D7 的「本棒不重复建设」论证事实内核正确，仅指针错一个编号。
2. **风险节同源残留**（:166-168，轮 1 即存在、上轮点名背景节时未扫到此处，属审核方遗漏）：「fake timers × AbortController 脆（**plan-002** 风险节先例）」——正本为 **plan-003** 风险节（plan-003:145「fake timers × AbortController 交互不稳 → 降级真实短时延」）。同批一并改。
3. （可选，不改不阻塞）风险节首条（:159）「与 **vendored** alpha.3 源有偏差」——S-3 已在背景节澄清 dsh-credentials 在宿主源码树非 vendor/，此形容词为残留口径。

三处均为纯文档指针/措辞，不动验收口径、任务结构与决策语义；阶段 4 对峙时以上述 plan-003 行号为准。

## 维度复审小结

- **验收可测性**：T2 修订后闭环（「先红：新形状/码值断言对现行代码必红 → 后绿（含更新后的 errors 断言）」），R2 已含断言更新口径，验证矩阵 T2 行同步——轮 1 唯一缺口消除。其余 R 条未动，轮 1 已判可测。
- **依赖顺序**：T0-T10 线性结构未动，无环无缺。
- **范围**：未扩未缩；D4 换形时点论证反而收窄了越权面（不为 S05a 预造码值）。
- **遗漏面**：轮 1 五项全部闭合；新发现仅上述引用编号（非遗漏面、非契约面）。
- **roadmap 对齐**：D7 立项后，「超时」字面在 D 表、目标节、R2、任务行四处口径一致，对峙有单源可引。

**复审续用同一审核 Agent 的约定已履行**（头注 :11）；阶段 2 后续流程（T7 验证类豁免分类确认、高危命令 2.5 披露）照 plan 既定执行即可。
