# S41 阶段 2 audit-log（第 1 轮）— 计划审核

## 参数头

- 骨架版本：库版本 v2（`references/six-stage.md` 阶段 2 骨架：证伪优先）
- 阶段：2（第 1 轮）
- Session：41
- 输入指针：plan 正本 `docs/plans/2026-11-23-048-s41-takeover-docsplit-oidc-plan.md`（版本：提交 `65a4479`）；批准原文 `docs/plans/2026-11-23-048-s41-approved-plan-snapshot.md`；roadmap 编号 41 行；阶段 0 audit-log `docs/sessions/audit-logs/2026-11-23-s41-stage0-audit-of-s40.md`；`docs/sessions/2026-11-23-session-41.md`；`docs/STATUS.md`；`docs/dont-do.md`；`AGENTS.md`；`docs/governance-sessions.md`；ADR-0024 至 0027；skill `references/pitfalls.md`；仓库 HEAD `65a4479`（分支 `feat/s41-takeover-docsplit-oidc`）
- 相对骨架的偏离说明：增补两项审核输入——批准原文作为对照基线；验证矩阵须逐面有责任阶段与采信规则。审核 Agent 自行追加的只读探查见其报告自带的参数头。
- 审核 Agent：general-purpose，独立 spawn，与执行者上下文隔离
- 输出原文落盘：本文件下一节

## 审核 Agent 输出原文（逐字，未经主 Agent 改写）

# S41 阶段 2 独立计划审核报告（plan 048）

> 审核日期 2026-11-24｜只读审核｜审核 Agent 与执行者上下文隔离
> 报告正本：`/tmp/dshws-s41/audit/s41-stage2-plan-review.md`

## 0. 提示词参数头

- 骨架版本：库版本 v2（`six-stage.md` 阶段 2 骨架）+ 协调方任务书增补项（批准原文对照留痕、验证矩阵责任阶段与采信规则）
- 阶段：2（Session 41）
- 输入指针：plan 正本 `docs/plans/2026-11-23-048-s41-takeover-docsplit-oidc-plan.md`；批准原文 `docs/plans/2026-11-23-048-s41-approved-plan-snapshot.md`；`docs/session-roadmap.md:72`；`docs/sessions/audit-logs/2026-11-23-s41-stage0-audit-of-s40.md`；`docs/sessions/2026-11-23-session-41.md`；`docs/STATUS.md`；`docs/dont-do.md`；`AGENTS.md`；`docs/governance-sessions.md`；`docs/decisions/adr-0024..0027`；skill `references/pitfalls.md`；仓库 `/Volumes/IPFSJK/Zcode/dsh-websearch` HEAD `65a4479`（分支 `feat/s41-takeover-docsplit-oidc`，工作树干净）；harness 仓 tag `dsh-v0.2.2-rc.5`（`9c2670d3bc`，本地已有对象，经 `git show <tag>:<path>` 直读）与本地树 `9370b2f7f9`；node v22.23.2 / pnpm 11.7.0 / npm 10.9.8
- 偏离说明（中性）：(1) 增补两处外部事实核对（npm trusted publishers 文档、actions/checkout README）；(2) 增补只读探查：仓内依赖可解析性、rc.5 源码若干文件、兄弟仓 dsh-mm-resilience 与 dsh-subagent-model-pin 的被引文件、未推送历史中 `token=` 带值行数（只计数，不转录值）；(3) 未运行测试、未启动任何 DSH 实例、未触碰 `~/.dsh`、未运行 Electron 二进制。产品代码自阶段 0 基线提交 `26b646e` 起零 diff（`git diff --stat 26b646e..HEAD -- src tests scripts package.json pnpm-lock.yaml .github cordis.patch.yml` 为空），测试面采信阶段 0 基线。

引用约定：「plan」= plan 正本，「批准」= 批准原文，「记录」= session-41 记录，「audit-log」= 阶段 0 audit-log。未注明仓的行号属 dsh-websearch；「rc.5」行号属 harness 仓 tag `dsh-v0.2.2-rc.5`，「rc.2」行号属本地树 `9370b2f7f9`。

## 1. 结论

**NEEDS REVISION。必改 8 项，建议 9 项。**

| 编号 | 一句话 | 主要位置 |
|---|---|---|
| M1 | 交还双通道：T7 的 dispose 通道在 rc.5 上按源码必然被拒；决定性实验排在实现之后；R2 的实测面分不清是哪条通道生效 | T6–T8、V5/V7/V10、R2、ADR-0024 |
| M2 | 「演练 0.2.2-rc.5」没有功能腿，V9 名不副实，不满足仓库上游适配强制流程 | T12、V9、R5/R6、ADR-0027 |
| M3 | 两条工作流首次真实执行就是正式发版，无预演通道；「tag 提交在 master 上」在默认浅克隆下必败 | T10、T11、T18 |
| M4 | 一致性门三处缺口：T17 时序不可执行、CHANGELOG 腿被历史条目空满足、既有 runbook 与新规则相反 | T10、T13、T17、R7 |
| M5 | plan 相对批准原文的减项未留痕，「验收标准未变」不成立 | 全文、记录:39-40 |
| M6 | 验证矩阵不完整，全量测试面超出亲跑上限 | 验证矩阵节 |
| M7 | 发版序列时序与留痕：阶段 6 收官早于 T17/T18，接力无目标行，推送将首次公开含 token 值的提交而未列入披露 | T16–T18、风险节 |
| M8 | 应清级债务处置时点违反「先债后新」 | T13、T16、记录:17-26 |

M1、M2、M4、M7 的修订会改变 R 条目或新增任务面，按 plan 头注（plan:3-5）须回 2.5 请用户确认，清单见 §5。

## 2. 必改

### M1｜交还双通道：T7 在 rc.5 上按源码是确定性空操作，实验却排在实现之后，R2 分不清通道

**证据**（rc.5 直读）

- `packages/boot/hmr/src/index.ts:269`：`if (this.executing.getStore()) return Promise.reject(new Error('HMR transactions cannot be nested'))`；`:931` 要求 profile 重组必须在 `runExclusive` 内。上游自测锁定该拒绝：`packages/boot/hmr/tests/coordination.spec.ts:51-53`。
- `packages/boot/config-editor/src/index.ts:151-152`：存在 hmr 服务时 `edit()` 经 `hmr.runExclusive(run)` 执行；`settings.mutate`（rc.5 `packages/settings/settings/src/index.ts:368-376`）必经 `edit()`。
- `packages/boot/plugin-manager/src/index.ts:1312-1315`（`configure` 经 `hmr.runExclusive(apply)`）与 `:1350-1356`（`reload` 调 `hmr.reconcileProfile`）；`packages/boot/app-boot/src/index.ts:346-415` 的 `recompose()` 在同一事务内 `entry.update`（`:410`）并等待 fiber 处置完成（`:391`、`:415`）。
- `packages/bundle/base/cordis.patch.yml:27-31`：「Profile configuration reloads by default」，有 profileContext 即启用 hmr。
- 推演链：插件页开关 → 事务内处置插件 fiber → T7 的 dispose 钩子调 `settings.mutate` → `edit()` → `hmr.runExclusive` → 以「cannot be nested」拒绝 → 被守卫吞掉。T7 在启用 HMR 的形态是确定性空操作，且每次关闭写一条告警日志。
- `packages/boot/plugin-manager/README.md:68`：「a patch generation applied outside the manager, by HMR's watcher after a CLI or hand edit, announces nothing」。CLI 或手改关闭不发 `plugin-manager/changed`，T8 不触发。
- `packages/boot/plugin-manager/src/index.ts:1381`：无 hmr 服务时开关结果是 `restart-required` / `no-hmr`，fiber 不卸载。
- 兄弟仓 `dsh-mm-resilience/docs/patterns.md:112` 对 P4「已验证」的记载只有两份单测；`src/handover.js:17-24` 关于 dispose 钩子在 HMR 宿主生效的说法没有实测记录。ADR-0024 Rationale（adr-0024:58）称其为「已验证模式」。
- plan:35-36、T7（plan:54）、V10（plan:111-112）、风险第 4 条（plan:131）把这件事交给 T12 定夺；T12 排在 T6–T11 全部写完之后。

**影响**

- T7 的单测用 `tests/helpers/fake-ctx.ts`，没有 hmr 面，发现不了该拒绝：绿测对应真实宿主上的死通道。
- V5、V7、V10 都在 web profile 执行，未写关闭向量与是否挂浏览器。走插件页且有浏览器时实际生效的是 T8；走 CLI 或无浏览器时两条通道都不触发，V7 失败。这个结果到 T12 才暴露。
- 无 HMR 形态（桌面端）唯一有效通道是 T8。它在 T12 没有任何隔离验证，唯一实测是阶段 6 之后、用户门控的 T18 步骤 1，而 R2（plan:73-74）不要求它。
- CLI 关闭、手改、`dsh plugin remove`（README.md:40 写明的卸载命令）在任何形态都没有通道。ADR-0024 Context（adr-0024:23）把「关闭或卸载」并列为悬空钉值的来源，决策与 V 项只覆盖「关闭」。

**要求的修订**

1. 在 T6 之前插入探针任务：在 rc.5 的 3434 实例上做「形态 × 向量 × 是否挂浏览器」矩阵并归档。形态取 hmr 启用，以及 scratch profile 写 `- id: hmr` / `disabled: true`（上游自测同法，`apps/cli/tests/web-agent-shutdown.e2e.ts:23-24`）；向量取插件页开关、CLI、手改、remove。记录 dispose 是否触发、`mutate` 是否落盘、宿主日志有无「cannot be nested」。
2. 由探针结论决定 T7 去留：删除，或保留为明示「rc.5 HMR 形态下会被拒」的尽力通道。ADR-0024 D4 与 Rationale 同步改写，不再称 P4「已验证」。
3. V5、V7、V10 写明向量与浏览器状态；在无 HMR 形态下补一条客户端通道的隔离验证；R2 的实测条目相应改写。
4. 对无通道的向量（CLI、手改、remove）作出决定：在 `docs/plugin-page.{zh,en}.md` 写明限制与手动清理命令，并同步 README.md:38「`plugin remove` 单命令完整复原」的表述；或给出机制。
5. 第 3 条改变 R2/R6 验收标准，回 2.5 请用户确认。

**复发标注**

- `docs/dont-do.md:78-82`「不要把上游改名判为纯编译级——必须核对每一消费代的运行时读取点」同族：结论取自兄弟仓自述与单测，未在实例上核对运行时路径。
- 五禁「禁未经实测的信源」（AGENTS.md:10）。
- audit-log「待坐实」中「官方桌面 0.2.2-rc.5 上插件的实际运行面」仍未坐实。
- 本项为源码推演加上游单测佐证，未实跑坐实，见 §7。

### M2｜「演练 0.2.2-rc.5」没有功能腿，V9 名不副实，不满足仓库上游适配强制流程

**证据**

- ADR-0027 D1（adr-0027:33）：显式预发布钉是「本版本已演练」的声明；D3（adr-0027:36）本 session 演练 rc.5 并扩钉。plan 目标 4、T3、R5 同此。
- V1–V10（plan:101-112）逐条：V1 是 dump；V2–V4 是插件页与设置节渲染；V5–V8 是交还；V9 是单测；V10 是崩溃。没有一条在 rc.5 宿主上发起搜索、抓取或降级。key-count 徽标、DNS 卡状态（插件自有 typert remote，运行时依赖 `dsh-typert-protocol` 钉 0.1.7-rc.2，package.json:48）、toolview 溯源行都不在列。
- 债务映射第 1 行（plan:118）自承「桌面运行时真实搜索腿未实跑」。
- 仓库宪法 `AGENTS.md:21-29`「上游适配强制流程」：随 DSH 上游版本更新的适配「必须走完整对齐流程，缺格不得宣布该面适配完成、不得 tag 发版」；第 4 步要求 e2e.real 与发版前用户路径冒烟。
- `docs/upstream-alignment-checklist.md:52`：「real 层（发版/适配批必做）」。`docs/upgrade.md:3`：安装→配置→搜索→降级→GUI 冒烟全部通过才可声明兼容；§2 第 6–8 步（`docs/upgrade.md:29-31`）。
- 同类先例：CHANGELOG.md:12，S38 对 0.2.0-rc 线做了含搜索与降级的 3434 演练、七腿矩阵 7/7、e2e.real 错误路径 4/4。
- V9「全量测试与 loopback e2e 全绿」：`pnpm test` 在插件仓执行，与 rc.5 环境无关；`tests/e2e/loopback.test.ts` 本就在全量内；e2e.real 无 key 自跳（阶段 0 基线 17 skipped）。
- rc.5 web-app 基础 patch 禁用 `tool-web`（rc.5 `packages/bundle/web-app/cordis.patch.yml:610-611`），搜索工具由预设重新插入（`packages/bundle/web-app/presets/standard.patch.yml:123`）。功能腿须用含 `tool-web` 的预设并备模型 key。

**影响**

R5「peer 范围全绿」加 R6「V1–V10 归档」可以被满足，同时插件的核心功能从未在 rc.5 上跑过一次。宪法把这一格定为打 tag 的前置条件，按现计划 T18 步骤 2 无法合规执行。

**要求的修订**

1. T12 增功能腿：rc.5 3434 实例上真实搜索一条（served-by 留痕）、web_fetch 一条、降级或错误路径一条；key-count 徽标与 DNS 卡状态；toolview 溯源行渲染。
2. 增 e2e.real 错误路径带 key 实跑；环境窗失败如实记录工件。
3. 对齐清单「DSH 上游维度」逐格确认的留痕入 session 记录。
4. 删除 V9，或把它改写为验证矩阵行的指针。
5. 本项改变 R5/R6 验收标准，回 2.5 请用户确认。

**复发标注**

- `docs/dont-do.md:120-124`「不要只测 happy-path 就宣布上游适配完成」（S35 T11 入册，用户裁定的常备门槛）。
- AGENTS.md:23。

### M3｜两条工作流首次真实执行就是正式发版，无预演通道；master 包含断言在默认浅克隆下必败

**证据**

- `.github/workflows/ci.yml:7-10` 只在 master 推送与 PR 时触发；`.github/workflows/release.yml:11-13` 只在 `v*` tag 时触发。`git branch -a`：`feat/s41-takeover-docsplit-oidc` 没有上游分支。T11 验收只有「两个工作流经 YAML 解析器实读」（plan:58）。
- ADR-0026 D7（adr-0026:47）：tag 推送后失败不移动 tag。tag 触发的流水线运行的是被打 tag 的提交里的工作流文件，工作流自身的缺陷只能换版本号重发。
- actions/checkout 默认 `fetch-depth: 1`，官方 README：「Only a single commit is fetched by default, for the ref/SHA that triggered the workflow」。runner 上没有 master 引用，T10 的「tag 提交在 master 上」断言（ADR-0026 D3，adr-0026:40-41）无从执行。plan T10、T11 未写 `fetch-depth: 0`。
- 本仓先例：`docs/sessions/2026-09-30-session-38.md:81-82`，pack.mjs ENOENT 与 npm 参数解析两起事故都是 CI-only 缺陷，都在正式发版时才暴露。
- 「经 YAML 解析器实读」当前写不出命令：`yaml`、`js-yaml` 从仓根解析均为 `MODULE_NOT_FOUND`。

**要求的修订**

1. T11 给 `release.yml` 加 `workflow_dispatch` 干跑模式：全量门 → 一致性校验 → 打包 → tarball 校验，止于 Release 与发布之前；checkout 设 `fetch-depth: 0`。
2. T18 步骤 2 之前加一道门：候选提交在 feat 分支上干跑通过，或推送 feat 分支开草稿 PR 让 ci.yml 先跑。
3. T11 验收增「fresh clone 本地依序执行两条工作流的步骤」，并写明 YAML 实读命令。
4. npm 版本下限改写，见 S4。

**复发标注**

- S38 事件 B、C 同族。ADR-0026 Context（adr-0026:19）自述本仓「tag 于增补后重打」事故。

### M4｜一致性门三处缺口：T17 时序不可执行、CHANGELOG 腿被历史条目空满足、既有 runbook 与新规则相反

**证据**

- T17（plan:64）要求「本地跑 `check-release --tag v0.2.1` 与全量门」。ADR-0026 D6（adr-0026:46）「tag 在推送时才创建」，D3 要求断言「tag 提交在 master 上」；合并到 master 发生在 T18（plan:65）。T17 时点既无 tag 对象，提交也还在 feat 分支，tag 模式校验按字面必然失败，「门全绿」不可达。
- `CHANGELOG.md:557`「## 2026-09-09 — 全模式 web_fetch 接管 0.2.1」与 `:573`「版本 0.2.1」：仓库今天已含 0.2.1 字样。「CHANGELOG 含该版本的条目」若是子串匹配，T17 之前就为真，T10 的先红后绿只在夹具里成立。
- `docs/upgrade.md:90`「修复后重推同 tag（删本地 tag 重打或 `git tag -f`+push -f）」、`:92` 手工 `npm publish` 补发，与 ADR-0026 D7 及 OIDC 相反。T13（plan:60）与 R7（plan:80-81）未列 `docs/upgrade.md`。

**要求的修订**

1. 写明序列：T17 在 feat 分支跑 check-release 非 tag 模式加全量门 → T18 步骤 2 本地合并 master、建带注解 tag、在 master 上跑 `check-release --tag v0.2.1`、再原子推送。plan 须写明本地建 tag 的步骤与执行方。
2. 定义 CHANGELOG 匹配规则（例如首个日期二级标题含 `v0.2.1`），并加负控用例：只含历史 0.2.1 提法的 CHANGELOG 必须判失败。
3. T13 增 `docs/upgrade.md` §6 改写，R7 增对应条目。

**复发标注**

- audit-log f 项已立的负控纪律在本计划的新断言上未落实；`docs/dont-do.md:70-74`（断言须实测）同族。
- 第 1 条改变 T17 验收，回 2.5 请用户确认。

### M5｜plan 相对批准原文的减项未留痕，「验收标准未变」不成立

记录:39-40 只登记了增项（ADR-0027、T0 token 前向遮蔽、T10 token 扫描、T13 勘正、T16 补账），并写「验收标准未变」。逐行对照，下列减项未登记：

| 位置 | 批准原文 | plan 正本 | 性质 |
|---|---|---|---|
| T3 验收 | 新测试先红后绿；两处范围与 README L24 一致（批准:57） | 新测试先红后绿（双语义 + 负控）（plan:50） | 删文档一致性验收 |
| T4 | 运行时依赖 `dsh-typert-protocol` 维持现钉（批准:58） | 无此句（plan:51） | 删约束 |
| T5 | 更新 rc.2 时代的过期注释（批准:59） | 与头注释（plan:52） | 删子项 |
| T6 验收 | 六个具名用例（批准:60） | 先红后绿（plan:53） | 删用例清单 |
| T7 验收 | 四个具名用例（批准:61） | 先红后绿（plan:54） | 删用例清单 |
| T8 | 兼容裸名与 scoped 名，冲突时重读重试一次（批准:62） | 监听 `plugin-manager/changed`（plan:55） | 删功能要求 |
| T9 验收 | 五个具名断言（批准:63）与用户文档结构段（批准:74） | 先红后绿（plan:56） | 删断言与结构 |
| T12 环境 | launcher 绝对路径；输出重定向到文件，不经管道（批准:78） | 首选桌面 app 内置命令（plan:98-99） | 删方法约束 |
| V7 | 直接检查 `cordis.patch.yml`（批准:86） | 该 `web` 覆盖整行消失（plan:108） | 删验证方法 |
| T18 | 四步各带门控、备份清单、隧道、回退段（批准:91-98） | 四个短语，无编号无回退（plan:65） | 删门控与回退 |
| 高危动作预告 | 独立一节（批准:100-105） | 无此节 | 删整节 |
| Context | 11 个未推送提交随发版推送（批准:34） | 无 | 删事实 |

T4 的约束不是措辞：`@deepseek-ai/dsh-typert-protocol` 同时出现在 `dependencies`（package.json:48）与 `devDependencies`（package.json:66）。按 plan:51「devDependencies 对齐 0.2.2-rc.5」执行，编译面会变成 0.2.2-rc.5 而运行面仍是 0.1.7-rc.2。T8 的「兼容裸名与 scoped 名」对应裸名 tarball 与 scoped npm 名两种安装形态，是功能要求。债务表（plan:118）与矩阵（plan:92）按「T18 步骤 1 / 步骤 4」引用，正本的 T18 行没有步骤编号。

**要求的修订**

逐项恢复，或在记录的差异段登记减项及理由。其中 T3 验收、T4 约束、T8 功能要求、T18 步骤四项改变验收或范围，回 2.5 请用户确认。

**复发标注**

- `docs/governance-sessions.md:241` 范围变更回路：计划内微调须留痕。
- `docs/dont-do.md:129-133`「不要静默丢弃计划任务清单里的条目」同族。

### M6｜验证矩阵不完整，全量测试面超出亲跑上限

| 验证面 | 矩阵现状 | 缺口 |
|---|---|---|
| 全量测试 | 触发：阶段 0、阶段 4、T17（plan:89） | V9（plan:110）在 T12 又要求一次全量，未入矩阵。治理上限是每 session 至多 1 次、责任点在阶段 4（`docs/governance-sessions.md:255`）；阶段 0 的偏离已在 audit-log 参数头声明，T17 以「不同提交」说明，V9 没有任何说明 |
| typecheck 两面、lint、check:i18n、build | 触发：任务绿证按需、阶段 4（plan:90） | T17「全量门」在另一提交上重跑这五面，没有触发时机与责任方 |
| rc.5 实测 V1–V10 | 责任阶段 3；阶段 5 补冒烟（plan:91） | 阶段 5 冒烟的范围、实例、条目未定义。R2、R3、R6 的实测证据全部是执行者自测自证，独立阶段只看归档截图 |
| 桌面端 V2、V5、V7 | T18 步骤 1，用户门控（plan:92） | 发生在阶段 4、5、6 之后；失败时没有回环定义；R2 不引用 |
| tarball 校验、check-release tag 模式 | 无行 | T10 单测、T11 的 ci.yml 步骤、T18 步骤 2 的首次 CI 执行，三者的关系没有进矩阵 |
| V10 | 并入 rc.5 实测行 | 没有操作化判据：无时限，也没有断言交还真的发生。dispose 钩子抛错被吞或从未运行时 V10 照样通过 |

**要求的修订**

补齐上表各行；删 V9；为 T17 的提交写明五个静态面与全量门的责任方和采信来源；把阶段 5 冒烟定义为独立 Agent 在 rc.5 3434 实例上重做 V2、V3、V5、V7；V10 写明时限与交还后置断言。

**复发标注**

`docs/governance-sessions.md:249-264` 与 `six-stage.md:69-76` 的亲跑上限条款；`pitfalls.md`「测试与验证」之重复验证同族。

### M7｜发版序列时序与留痕：阶段 6 收官早于 T17/T18，接力无目标行，推送将首次公开含 token 值的提交而未列入披露

**证据**

- roadmap 唯一的待执行行是 16（`docs/session-roadmap.md:120`）。记录:7 写「下一棒: Session 42（roadmap 待执行行）」，该行不存在。T16（plan:63）未含新增行。
- T17 改 package.json、`src/providers/shared.ts:117`、CHANGELOG，发生在 T14、T15 之后，没有独立核验（矩阵缺口见 M6）。
- 未推送历史中 `ede714d`、`26b646e`（本地 master HEAD）、`8c0dc8a` 三个提交各含 4 行带值 `token=`。T18 步骤 2 推送后首次公开。记录:19 记了「不重写历史」的裁定；plan 风险节（plan:128-133）与 T18 未提。AGENTS.md:17 是凭据零明文。
- R1–R8 与 roadmap:72 都不含 T18 的验收，「npm 上 0.2.1 可查且带 provenance」只出现在 plan:65。行 41 标记完成后，发布结果没有任何验收条目跟踪。

**要求的修订**

1. T16 增 roadmap 行 42（待执行：v0.2.1 版本号变更与发布序列），或明示无下一棒并写明 T17/T18 的续作载体。
2. T18 步骤 2 的用户门控说明与风险节写明「本次推送将首次公开 3 个含已失效 host token 值的提交」，由用户在推送前裁决。
3. 写明 T17、T18 完成后的记录动作（session 记录附记、STATUS 刷新）与 T16 时点的状态标记语义。
4. 第 2 条涉及不可逆的公开动作，回 2.5 请用户确认。

**复发标注**

- audit-log 应清项 7（接力指令头行无目标句）在 S41 自身收官时原样复发的风险。
- `docs/dont-do.md:26-30`（收官序列漏刷状态区）相关；audit-log 应清项 3 的延伸。

### M8｜应清级债务处置时点违反「先债后新」

**证据**

- `docs/governance-sessions.md:44`：应清级债务「本轮新任务推进前优先处理（先债后新）」，时点「新任务开工前」；`audit-gate.md:80` 同义。
- 记录:20、:21、:22、:24、:25 把应清项 4（S40 记录勘注）、5（progress 补 S38–S40）、6（S40 阶段 4/5 溯源补记）、8、9 排到 T13 与 T16，即新任务 T3–T12 之后。
- 阶段 4 核验前须先查 progress「已验锚点」台账（`six-stage.md:122-123`），该台账停更自 S37。T16 的补账与 S41 自己的锚点写在阶段 4、5 之后，不会被独立核验。

**要求的修订**

把这批纯文档债前移为 T3 之前的文档批；或在 plan 与记录写明偏离理由并经用户确认。

## 3. 建议（9 项）

| 编号 | 发现 | 证据 | 建议 |
|---|---|---|---|
| S1 | T3 的测试拿不到 semver | `semver` 从仓根 `MODULE_NOT_FOUND`，仓内只有传递副本 `node_modules/.pnpm/semver@7.8.5`；rc.5 宿主门用 `semver ^7.8.5`（rc.5 `packages/boot/app-boot/package.json:46`） | T3 写明加 devDependency `semver@7.8.5`；这是 package.json 与 lockfile 变更，排在 T4 之前 |
| S2 | T3 负控分类与勘正站点不清 | audit-log f 项：0.2.1-rc.5、0.2.3-alpha.2 默认语义为假而宿主门为真；ADR-0027 D6 笼统写「域外版本两语义均假」；peer 表述另见 README.md:46、README.en.md:24 与 :46 | 测试分三类断言：已演练版本真/真，未演练 0.2.x 预发布假/真，窗口外版本假/假。T3 列全五个勘正站点。若无散文守护测试，ADR-0027 后果第 2 条「范围描述不再漂移」应限定为 package.json |
| S3 | T11 验收无法落地 | `yaml`、`js-yaml` 均不可解析；R4 的步骤顺序只有人工阅读 | 写明命令；加一条工作流契约测试锁「无 NPM_TOKEN、有 id-token: write、步骤顺序」 |
| S4 | npm 版本下限与收尾动作 | npm 文档：dist-tag 的 OIDC 支持要求 npm 11.21.0 以上；trusted publishing 下 provenance 自动生成；本机默认 registry 是 npmmirror | ADR-0026 D1 与 T11 写明 npm 不低于 11.21.0；T18 步骤 3 核验命令带 `--registry https://registry.npmjs.org`；首次 OIDC 成功后吊销 `NPM_TOKEN` 的仓库 secret 与 npm token |
| S5 | ADR-0013 与两处 README 表述随 T5 过期 | ADR-0024 自述修正 ADR-0013 决策 7，但无勘正注任务（T1 对 ADR-0023 有先例）；README.md:175 仍写闲置配置卡「仍在」 | T5 或 T13 给 ADR-0013 的 Status 加勘正注；T9 同步 README.md:38 与 :175 |
| S6 | T4 的 go/no-go 判据与对齐集合未写 | 「不超过 5 个文件且无行为变更」没有计数口径与判定人；rc.5 vendored cordis 是 4.1.0（rc.5 `vendor/cordis/package.json`），本仓 devDep 是 4.0.4；`docs/upgrade.md:66` 要求依赖变更后重建 lockfile | 开工前预登记判据与对齐集合（含 cordis 与 schemastery）；判定证据入 session 记录 |
| S7 | ADR-0024 的两条决策无验证 | D6 逃生口（用户层强制显示官方页）与 D7 旧宿主退化都没有 V 项或测试；桌面端关闭后、重启前的中间态未验证 | 各补一条实测，或在用户文档中降级表述；T18 步骤 1 增重启前检查 |
| S8 | token 扫描没有命令 | T0「全仓 token= 带值计数为 0」与 T10「含 token 值扫描」都未写正则；本审核以两种正则实测 HEAD 均为 0 | 把命令与正则写进 plan 或 audit-log；`src/` 现无 `token=` 字面量，tarball 扫描不会误报 |
| S9 | 宪法第 4 步「发版前 3423 用户路径冒烟」在 plan 中无对应项 | AGENTS.md:28；plan 用 3434 的 T12 与阶段 5 冒烟 | 写明由哪一项替代，避免阶段 4、5 争议 |

## 4. 核验通过的事实

| plan 断言 | 核验方式 | 结果 |
|---|---|---|
| 卡片行 rc.2 `packages/bundle/web-app/cordis.patch.yml:417-418`，rc.5 同名 | 本地树 grep；tag 直读 | 属实。rc.5 在 :484-485，带 `name: '@deepseek-ai/dsh-client-ui-settings-web-search'` |
| rc.5 卡片改依赖 `web` 命名空间 | tag 直读 `packages/client/ui-settings-web-search/src/client/index.ts:43,72` | 属实。inject 含 `remote.web`，页面在 Host 服务 `web` 期间存在 |
| dsh-subagent-plus `cordis.patch.yml:11-16`、`tests/takeover-patch.spec.ts:12-31` | 读兄弟仓文件 | 属实 |
| 插件页文档顺序与读取器 `package-meta.ts:148-172` | 本地树；tag 直读 | 属实。rc.5 另要求 `meta.title`、`meta.description` 若存在须为非空字符串 |
| `settings.mutate` 的 unset 语义 :367-375；config-editor :120-126 | 本地树；tag 直读 | 属实。rc.5 `web` 的 Config 只有 `searchProvider`、`fetchProvider` 两个 volatile 字段（rc.5 `packages/web/web/src/index.ts:110-113`），两键同清后用户层 config 整行删除成立 |
| 宿主门 `includePrerelease: true` :77 | 本地树 | 属实 |
| npm 不低于 11.5.1、`id-token: write`、`repository.url` 一致、2 天首发窗 | npm 官方文档 | 属实，补充见 S4 |
| T8 可调 `remote.settings.mutate` | 已装 0.1.7-rc.2 `dsh-api-remotes/lib/client.js:5275-5297` | 存在。T4 回退不阻塞 T8 编译 |
| T17 `tests/user-agent.test.ts` 先红后绿 | `tests/user-agent.test.ts:14-17` | 成立，断言取自 package.json |
| T0「token= 带值计数为 0」 | 两种正则 `git grep` | HEAD 计数均为 0 |
| ADR-0024 至 0027 与批准的设计决策 | 逐条对照 | 决策内容一致。ADR-0024 状态 proposed，待 V10 |
| 依赖顺序 T3 到 T18 | 通读 | 线性顺序成立。例外见 M1（T12 晚于 T6–T8）与 M4（T17、T18） |
| `ui-settings-web-search` 行在 0.1.7-rc.2、0.2.0-rc.1、0.2.0-rc.2、0.2.1-rc.5、0.2.2-rc.5 均存在 | 各 tag grep | 属实，ADR-0024 D7 的「行不存在」退化在声明域内不会触发 |

## 5. 须回 2.5 请用户确认的清单

1. M1：R2 增客户端通道隔离验证；T7 去留；CLI、手改、remove 向量的限制披露。
2. M2：R5、R6 增功能腿、e2e.real 与对齐矩阵留痕。
3. M4：T17 验收由 tag 模式改为非 tag 模式，tag 模式校验移到合并之后。
4. M5：恢复或确认四项减项（T3 验收、T4 约束、T8 功能要求、T18 步骤）。
5. M7：推送将首次公开三个含已失效 token 值的提交。
6. M8：若选择保留 T13、T16 的处置时点，须确认偏离。

## 6. 与 roadmap 验收标准对齐

`docs/session-roadmap.md:72` 的验收写「R1-R8（接管 / 交还 / 文档分离 / 发布门 / 上游对齐 / rc.5 实测 / 文档 / 治理）」，与 plan:71-82 的 R1–R8 名称一致；WBS 项指向 plan 048；状态为进行中。对齐成立。两点保留：R8「STATUS 与 roadmap 收官状态一致」只能在 T16 验证；T18 的发布结果不在 R 条目内，见 M7。

## 7. 未复验项与待坐实

- M1 是源码推演加上游单测佐证，本审核未启动实例坐实。
- 桌面形态禁用 hmr 的位置未在 rc.5 可读范围内定位，只见 acp、headless、sdk 三个 bundle 显式禁用；旁证是 plugin-manager 的 no-hmr 分支与兄弟仓注释。
- OIDC 首发在 dist-tag 权限未勾选时的真实表现，npm 文档未写明。
- `~/.dsh` 与本机桌面 app 的 profile 未读；桌面端 0.2.2-rc.5 上插件的现况未核。
- 测试、lint、typecheck 未重跑，采信阶段 0 基线。
- T4 对齐的破坏面规模未评估，需实跑。

## 8. 约束遵守

- 未修改任何被跟踪文件：dsh-websearch 终态 `git status --short` 0 行，HEAD 仍为 `65a4479`；harness 仓 HEAD 与分支未变，未 fetch。
- 未执行 commit、push、checkout、switch、branch、stash、reset；未在仓库 `docs/` 写文件；未触碰 `~/.dsh`；未运行 Electron 二进制；未 `ps eww`。
- 副作用仅限本报告文件。
- 本报告不含任何凭据值，`token=` 只以计数与 file 指认。
