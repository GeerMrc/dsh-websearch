# S41 阶段 2 audit-log（第 2 轮复审）— 计划审核

## 参数头

- 骨架版本：库版本 v2（`references/six-stage.md` 阶段 2 骨架：证伪优先）
- 阶段：2（第 2 轮，同阶段复审）
- Session：41
- 输入指针：plan 正本修订版 `docs/plans/2026-11-23-048-s41-takeover-docsplit-oidc-plan.md`（版本：提交 `699de19`）；相对第 1 轮的差异 `git diff 65a4479..699de19 -- docs/`；ADR-0024、ADR-0026、ADR-0027；session-41 记录「做了什么」的 T2 条目；第 1 轮 audit-log `docs/sessions/audit-logs/2026-11-23-s41-stage2-plan-review-r1.md`；其余输入与第 1 轮相同
- 相对骨架的偏离说明：复审续用第 1 轮审核 Agent 的上下文（同阶段复审）；审核输入增补「上一轮各条发现是否已被吸收」的逐条判断。审核 Agent 自行追加的只读探查与一处对只读的偏离，见其报告自带的参数头与末节。
- 审核 Agent：同第 1 轮（general-purpose，独立 spawn，与执行者上下文隔离）
- 输出原文落盘：本文件下一节

## 审核 Agent 输出原文（逐字，未经主 Agent 改写）

# S41 阶段 2 独立计划审核报告（plan 048，第 2 轮复审）

> 审核日期 2026-11-24｜只读审核｜审核 Agent 与执行者上下文隔离
> 报告正本：`/tmp/dshws-s41/audit/s41-stage2-plan-review-r2.md`

## 0. 提示词参数头

- 骨架版本：库版本 v2（`six-stage.md` 阶段 2 骨架；同阶段复审续用第 1 轮审核 Agent 的上下文）
- 阶段：2（第 2 轮）
- Session：41
- 输入指针：plan 正本修订版 `docs/plans/2026-11-23-048-s41-takeover-docsplit-oidc-plan.md`；仓库 HEAD `699de19`（分支 `feat/s41-takeover-docsplit-oidc`，工作树干净）；差异 `git diff 65a4479..699de19 -- docs/`（6 个文件，全部在 `docs/` 下）；`docs/decisions/adr-0024`、`adr-0026`、`adr-0027`；`docs/sessions/2026-11-23-session-41.md`「做了什么」T2 条目；`docs/sessions/audit-logs/2026-11-23-s41-stage2-plan-review-r1.md`；批准原文；`docs/session-roadmap.md:72`；阶段 0 audit-log；`docs/STATUS.md`；`docs/dont-do.md`；`AGENTS.md`；`docs/governance-sessions.md`；skill `references/pitfalls.md`；harness 仓 tag `dsh-v0.2.2-rc.5` 与本地树 `9370b2f7f9`；node v22.23.2
- 偏离说明（中性）：(1) 把 `ui-settings-web-search` 行的存在性扫描从第 1 轮的 5 个抽样 tag 扩大到本地全部 `dsh-v0.1.5*` 至 `dsh-v0.2.2*` tag；(2) 增读 rc.5 `plugin-manager` 的 `removeBundle` 与旧宿主 tag 的 `vendor/include/src/index.ts`；(3) 对「只读」有一处偏离，如实披露：为核对 plan:68 的 YAML 实读命令，在 `/tmp/dshws-s41/audit/` 创建并删除了一个临时 yaml 文件，并在兄弟仓 dsh-mm-resilience 根目录短暂放置同名文件以试解析 `yaml`（该仓无此依赖，未解析成功）。文件已删除，该仓 `git status --short` 终态 0 行。(4) 未运行测试、未启动任何 DSH 实例、未触碰 `~/.dsh`、未运行 Electron 二进制。`65a4479..699de19` 只有文档变更，测试面采信阶段 0 基线。

引用约定同第 1 轮：「plan」= plan 正本修订版，「批准」= 批准原文，「记录」= session-41 记录。未注明仓的行号属 dsh-websearch；「rc.5」行号属 harness 仓 tag `dsh-v0.2.2-rc.5`。

## 1. 结论

**NEEDS REVISION。必改 4 项，建议 9 项。**

第 1 轮 8 项必改与 9 项建议在实质上均已吸收，修订后的任务顺序与设计没有发现新的方向性问题。本轮 4 项必改都是小幅文字与矩阵修订：其中 1 项的事实错误源自我第 1 轮报告的过度概括（见 §5），3 项是修订引入的口径不一致。吸收后可进入第 3 轮复审。

| 编号 | 一句话 | 位置 |
|---|---|---|
| 必改-1 | `ui-settings-web-search` 行在声明域内 5 个宿主版本上不存在；ADR-0024 D7「声明域内各宿主均有该行」不成立 | adr-0024:56-57；plan:22、:212 |
| 必改-2 | 验收归属与时序：R4 含 Session 42 子句；S41 核验范围未写明；key 窗口不可得的分支未定义 | plan:71、:117-136、:148、:219 |
| 必改-3 | 验证矩阵与任务口径不一致：T11 本地预演的全量门未计数；2b 的全量门未计数；T5p 无矩阵行 | plan:62、:68、:143、:162 |
| 必改-4 | 差异登记与确认状态：「已回 2.5」尚未发生；V11 与 R7 两项未列入回带清单；T4 判据放宽了用户设的门 | plan:5-6、:60、:192-201；记录:40-41 |

## 2. 第 1 轮发现的吸收判断

### 必改项

| 第 1 轮编号 | 判断 | 证据位置 | 残留 |
|---|---|---|---|
| M1 交还双通道 | 已吸收 | T5p 探针（plan:62）；T7 条件实现（plan:64）；交还条目写明向量、浏览器与两种形态（plan:97-104）；R2（plan:121-123）；ADR-0024 约束（adr-0024:35-38）、D4（:51-53）、D8（:58-59）、Rationale 不再称「已验证」（:66-67） | 向量集缺插件页卸载（建议-2）；缺最坏情况分支（建议-3） |
| M2 演练缺功能腿 | 已吸收 | 目标 4（plan:14）；F1–F4、e2e.real、对齐清单留痕（plan:106-113）；V9 已删（plan:115）；R5（plan:127-128）；矩阵（plan:148）；ADR-0027 D3（adr-0027:36-37） | key 窗口不可得的分支（并入必改-2） |
| M3 工作流无预演 | 已吸收 | T11（plan:68）；草稿 PR 预演（plan:161）；ADR-0026 D1、D5（adr-0026:39-41、:49-51） | `release.yml` 独有步骤（建议-1）；本地预演范围（并入必改-3） |
| M4 一致性门三处缺口 | 已吸收 | T10 规则与负控（plan:67）；T17 非 tag 模式（plan:74）；2b 时序（plan:162-163）；`docs/upgrade.md` §6（plan:70、:131）；ADR-0026 D3、D6（adr-0026:44-46、:52-54） | 无 |
| M5 减项未留痕 | 已吸收 | 「与批准原文的差异」节（plan:182-201）；T3 至 T9、T12、V7、T18、高危预告逐项恢复 | 登记不全与「已回」（必改-4） |
| M6 验证矩阵 | 已吸收 | 十行矩阵（plan:140-151）；阶段 5 冒烟（plan:72、:149）；V10 判据（plan:103-104） | 三处口径不一致（必改-3） |
| M7 发版时序与留痕 | 已吸收 | T17、T18 归 Session 42（plan:73-75）；R9（plan:135-136）；roadmap 行 42（plan:58）；token 历史交用户裁决（plan:157、:176、:220-222）；吊销 token 与记录（plan:167） | R4 的 Session 42 子句（必改-2） |
| M8 先债后新 | 已吸收 | T2b（plan:58）；R8（plan:133-134） | 记录的处置映射未同步（建议-8） |

### 建议项

| 第 1 轮编号 | 判断 | 证据位置 |
|---|---|---|
| S1 semver 依赖 | 已吸收 | plan:59 |
| S2 三类负控与勘正站点 | 已吸收 | plan:59；adr-0027:40-41、:65 |
| S3 YAML 解析器与契约测试 | 已吸收 | plan:68 |
| S4 npm 版本下限与收尾 | 已吸收 | adr-0026:39-40、:57；plan:164、:167 |
| S5 ADR-0013 勘正注与两处 README | 已吸收 | plan:61、:66、:132 |
| S6 T4 判据与对齐集合 | 已吸收，但判据改读放宽了用户的门 | plan:60（见必改-4） |
| S7 逃生口与中间态 | 部分吸收，处置合理 | V11（plan:94-95）；S42 步骤 1（plan:159）；旧宿主退化登记为延后项（plan:212） |
| S8 token 扫描命令 | 已吸收 | plan:55 |
| S9 宪法第 4 步对应项 | 已吸收 | plan:151 |

## 3. 必改

### 必改-1｜旧宿主事实不成立：该行在声明域内 5 个宿主版本上不存在

**证据**

- 对本地全部 `dsh-v0.1.5*` 至 `dsh-v0.2.2*` tag 扫描 `packages/bundle`：`dsh-v0.1.5-rc.1`、`dsh-v0.1.5-rc.2`、`dsh-v0.1.5-rc.3`、`dsh-v0.1.6-alpha.1`、`dsh-v0.1.6-alpha.2` 没有 `ui-settings-web-search` 行，自 `dsh-v0.1.7-alpha.1` 起才有。
- peer 域（package.json:40-45）含 `>=0.1.5-rc.1 <0.1.8 || 0.1.6-alpha.1 || 0.1.6-alpha.2`，上述 5 个版本都在声明域内。
- ADR-0024 D7（adr-0024:56-57）写「声明域内各宿主均有该行」。plan:22 写「该行在 0.1.7-rc.2 至 0.2.2-rc.5 各 tag 均存在」，句子属实，但没有覆盖域内的 0.1.5 与 0.1.6 线。债务表 plan:212 写「无旧宿主可测」，而本机有 `dsh-harness-015`（`dsh-v0.1.5-rc.2`）、`dsh-harness-015rc3`、`dsh-harness-016a2`（`dsh-v0.1.6-alpha.2`）等 worktree。
- 后果：v0.2.1 的随包 patch 在这 5 个宿主上多出一条指向不存在行的条目。按 `dsh-v0.1.5-rc.2` 与 `dsh-v0.1.6-alpha.2` 的 `vendor/include/src/index.ts`（`applyEntryPatches`：「A patch that matches nothing warns and is skipped」，两处分别在 `:112` 与 `:111`），每次启动与 `--dump-config` 打一条 loader 告警并跳过，不中断。这是源码推断，未实测。
- 来源：第 1 轮报告 §4 末行把 5 个抽样 tag 的结果推广成「声明域内不会触发」，是我的错误；ADR-0024 D7 与 plan:22 沿用了该前提。见 §5。

**要求的修订**

改写 ADR-0024 D7 与 plan:22、plan:212 的事实表述。T9 的用户文档与 README 兼容性段写明：0.1.5 与 0.1.6 宿主上启动日志会多一条 `patch: entry "ui-settings-web-search" not found` 告警，属预期。是否在 `dsh-harness-015` 上做一次冒烟由主 Agent 决定；不做则保持「源码推断、未实测」的措辞。

**复发标注**

`docs/dont-do.md:78-82`（核对每一消费代的运行时路径）同族；五禁「禁未经实测的信源」（AGENTS.md:10）。

### 必改-2｜验收归属与时序

**证据**

- R4（plan:125-126）第三个子句「草稿 PR 上 `ci.yml` 的发布预演通过（Session 42 步骤 2a）」只能在 S41 收官后核验。T14（plan:71）与 R 清单（plan:117-136）把 R1–R9 并列，没有写明 S41 的阶段 4、5 只核 R1–R8。
- key 窗口不可得的分支没有定义。R5（plan:127-128）要求「功能腿 F1–F4 与 e2e.real 有留痕」；矩阵（plan:148）写「无留痕不得启动 Session 42」；风险（plan:219）写「发布顺延」；T16（plan:73）的收官状态以 T0–T16 完成为前提。按 R5 字面，没有留痕则阶段 4 不能 PASS；按矩阵与风险的措辞，S41 可以收官、只拦 Session 42。e2e.real 自身另有「环境窗失败如实记录工件」（plan:112），与 R5 的「有留痕」口径也不同。

**要求的修订**

1. 把草稿 PR 预演从 R4 移出，改列为 T18 步骤 0 的前提与 R9 的前置；或把它前移到 S41 内执行并写明用户门控时点。
2. 写明 S41 阶段 4、5 的核验范围是 R1–R8，R9 由 Session 42 核验。
3. 定义 key 窗口不可得时 S41 停在哪一任务、状态标记是什么、哪些项可记为受阻工件、哪些必须等窗口。

**复发标注**

`docs/dont-do.md:56-60`（gate 未翻案前把验收入账成 PASS）的预防面；`docs/governance-sessions.md:249-264` 的采信规则。

### 必改-3｜验证矩阵与任务口径不一致

**证据**

- T11 与 R4（plan:68、:125）要求「fresh clone 本地依序执行两条工作流的步骤」。两条工作流的步骤都含全量门（plan:68 的 ci.yml 预演含全量门；adr-0026:42-43），即 T11 本地多跑两次 `pnpm test` 与两次静态面。矩阵第 2 行（plan:143）写「S41 内亲跑 2 次；T12 不跑全量」，没有计 T11。
- T18 步骤 2b（plan:162）在 master 上再跑全量门，矩阵写「Session 42 的 1 次」。合并若非快进，master 上的提交与 S42 阶段 4 核验的提交不同。
- T5p（plan:62）是新验证面，矩阵十行（plan:142-151）没有对应行。通道设计整体依赖它，R2 要求「T5p 矩阵归档并写明取舍结论」。

**要求的修订**

写明 T11 本地预演的范围。建议只执行安装、构建、check-release、打包、tarball 校验，全量门交给阶段 4；若保留全量门，矩阵增行并说明与亲跑上限的关系。写明 S42 的合并方式，非快进则把 2b 的全量门计入矩阵。矩阵增 T5p 一行：责任阶段 3；阶段 4 核对矩阵与日志原文；阶段 5 以重做 V5、V7 复核。

**复发标注**

`docs/governance-sessions.md:249-264` 与 `six-stage.md:69-76` 的亲跑上限条款。

### 必改-4｜差异登记与确认状态

**证据**

- plan:5-6 写「改变验收标准或范围的项目已回 2.5 请用户确认」。治理序是阶段 2 通过后才进 2.5（`docs/governance-sessions.md:155`）。记录:40-41 写「回 2.5 请用户确认，结果记在做了什么」，该节没有 2.5 的结果。确认尚未发生。
- V11（plan:94-95）是新增验收条目，进 R2（plan:122）与 R6（plan:129）；V10 增加了时限与后置断言（plan:103-104）。差异节六项（plan:192-201）未列。
- R7 新增「六件套枚举统一、含归档前脱敏」与「ADR-0013 与 ADR-0023 的 Status 有勘正注」（plan:130-132）。差异节第 4 项只列了 `docs/upgrade.md` §6。
- T4 判据（plan:60）「修复文件数只计 `src/`、`tests/`、`scripts/` 下除类型与导入以外的改动」，把批准原文的「修复不超过 5 个文件」（批准:11-12、:58，用户澄清答复第 3 条）改读成只计部分文件。这是放宽用户设的门，未列入回带清单。
- plan:5 称「全部差异登记在」差异节。不改变验收的增项（`semver` 与 `yaml` 两个 devDependency、ADR-0013 勘正注、README.md:38 与 :175、宪法第 4 步替代行）只出现在记录:58-59。

**要求的修订**

把「已回」改为「须回」，或补 2.5 结果的时点与原文位置。差异节补 V11、V10 判据、R7 的两项、T4 判据改读。T4 恢复字面计数，或把改读列为回带项交用户确认。差异节增一行指针，指向记录中的不改验收增项。

**复发标注**

`docs/governance-sessions.md:240-241` 范围变更回路；`pitfalls.md:96-100`（提前预写尚未发生的状态）同族。

## 4. 建议（9 项）

| 编号 | 发现 | 证据 | 建议 |
|---|---|---|---|
| 建议-1 | `release.yml` 独有步骤在 tag 推送前没有真实执行 | ci.yml 预演覆盖全量门、非 tag 校验、打包、tarball 校验（plan:68）；tag 模式校验、GitHub Release 与发布只在 `release.yml` 里 | 工作流契约测试锁定 `release.yml` 里 check-release 的调用行，并要求与步骤 2b 的本地调用一致；核对 `fetch-depth: 0` 下 runner 内 `origin/master` 的引用名 |
| 建议-2 | T5p 向量集缺「插件页卸载」 | rc.5 `packages/boot/plugin-manager/src/index.ts:1148-1175` 的 `removeBundle` 是插件页操作，完成后在 `:1397` 发 `plugin-manager/changed`，reason 含 `remove`（`packages/boot/plugin-manager/src/types.ts:408-411`）；ADR-0024 D8（adr-0024:58-59）把 `remove` 归入不经插件页的向量。无 hmr 服务时对运行中的 bundle 卸载被拒（`:1153-1156`，`stop-profile`），该向量只在形态 H 可执行 | T5p 增该向量，仅形态 H；用户文档写明桌面端的卸载次序是先关闭、重启、再卸载 |
| 建议-3 | T5p 的结论分支缺最坏情况 | 若形态 H 的插件页开关也没有通道，R2 的 V5、V7、V10 在 H 下无法通过（plan:99-104、:121-123） | 在 T5p 验收里写明该情形的处置：R2 改判并回 2.5 |
| 建议-4 | 功能腿的前置条件与步骤 1 的还原 | F1–F3 需要模型 key 与含 `tool-web` 的预设（rc.5 `packages/bundle/web-app/cordis.patch.yml:610-611`、`presets/standard.patch.yml:123`）；T18 步骤 1 的 V7 要向生产 profile 预置钉值（plan:159），依赖尚未在桌面实测过的交还 | 写明前置条件；写明 V7 失败时从备份还原 `cordis.patch.yml`，结束时核对用户层 `web` 行与备份一致 |
| 建议-5 | T16 的 CHANGELOG 条目与 T17 的匹配规则如何衔接 | T16 六件套要求 CHANGELOG 条目；tag 模式要求首个日期二级标题含 `v0.2.1`（plan:67） | 写明 T17 是改写 T16 条目的标题还是新增条目。S38 的先例是新增条目（CHANGELOG.md:8） |
| 建议-6 | ADR-0024 转 accepted 的时点 | T13（plan:70）在阶段 5 独立冒烟之前；若阶段 5 重做 V5、V7 失败，需要回改已接受的 ADR | 移到 T16 |
| 建议-7 | ADR-0026 与 ADR-0027 的 Status 未反映修订 | 两份的 Status 仍写「accepted（2026-11-23…用户批准计划）」（adr-0026:13、adr-0027:13），而提交 `699de19` 改写了决策正文（adr-0026:39-41、:44-46、:49-54、:57；adr-0027:36-37、:40-41），其中多项待用户 2.5 确认。AGENTS.md:48 写 ADR immutable、修订走 superseded | 至少在 Status 记修订日期、触发（阶段 2 第 1 轮）与「待用户确认」 |
| 建议-8 | session-41 记录与修订后的 plan 不一致 | 记录:17-26 的应清项处置仍指向 T13 与 T16，plan 已前移为 T2b（plan:58）；记录:19 写「不重写历史」，plan 写由用户裁决（plan:220-222） | 同步记录 |
| 建议-9 | roadmap 行 42 的文本未给出 | T2b（plan:58）只写「增编号 42 行」 | 在 plan 给出该行文本：目标、WBS 指向 plan 048 的 T17 与 T18、验收 R9，避免与行 41 的验收范围重叠 |

## 5. 第 1 轮报告勘误

1. 第 1 轮 §4 末行「ADR-0024 D7 的『行不存在』退化在声明域内不会触发」有误。该结论取自 5 个抽样 tag，全部不低于 0.1.7-rc.2，而声明域从 0.1.5-rc.1 起。更正见必改-1。
2. 第 1 轮建议 S2 写的「README.md:46」应为 `:45`。plan:59 的行号正确。
3. 第 1 轮 M1 把「手改」笼统写成手改 patch。rc.5 的开关状态持久化在 profile `package.json` 的 `dsh.profile.bundles`（rc.5 `apps/desktop/README.md:146`）。plan:62 的表述更准确。

## 6. 与 roadmap 验收标准对齐

`docs/session-roadmap.md:72` 的验收仍是 R1–R8，与修订后 S41 的范围（T0–T16，plan:73）一致。行 42 由 T2b 新增。错位一处：R4 含 Session 42 步骤 2a 的子句（必改-2）。

## 7. 本轮核验通过的事实

| 项 | 核验方式 | 结果 |
|---|---|---|
| T0 的验收命令（plan:55） | 在 HEAD `699de19` 执行 `git grep -nE 'token=[A-Za-z0-9._~+/=-]{8,}'` | 计数 0，仓库归档第 1 轮报告后仍为 0 |
| 五处 peer 表述行号（plan:59） | grep | README.md:24、:45，README.en.md:24、:46，AGENTS.md:35，全部正确 |
| HMR 与通道事实（plan:32-37） | 与第 1 轮引用逐条比对 | 一致 |
| CHANGELOG 现状 | grep | 无带 `v` 的 `v0.2.1`；首个二级标题不含该版本，负控用例在真实仓库上成立 |
| T8 的两个可选宿主面 | rc.5 `packages/client/ui-plugin-manager/src/client/index.ts:86` | `remote.pluginManager` 与 `configForms` 存在 |
| YAML 实读命令（plan:68） | node v22.23.2 实测参数语义 | `process.argv[1]` 即文件路径；解析依赖 T11 的 devDependency `yaml`，本轮未解析 |
| 第 1 轮报告的归档 | 仓库副本与 `/tmp` 原件 diff | 正文逐字一致；参数头齐全，指向 plan 版本 `65a4479` |
| 提交范围 | `git diff --stat 65a4479..699de19` | 6 个文件全部在 `docs/` 下，产品代码零 diff |

## 8. 未复验项与待坐实

- M1 的源码推演（HMR 形态下 dispose 写入被拒）仍未实跑，由 T5p 负责。
- 必改-1 的旧宿主行为是按两个 tag 的源码推断，未在 `dsh-harness-015` 等 worktree 上实测。
- 形态 H 下插件页开关时客户端半区是否存活到收到事件，未坐实，由 T5p 负责。
- OIDC 首发的真实行为、T4 对齐的破坏面规模、`~/.dsh` 与本机桌面 profile，均未核。

## 9. 约束遵守

- 未修改任何被跟踪文件：dsh-websearch 终态 `git status --short` 0 行，HEAD 仍为 `699de19`；harness 仓 HEAD 与分支未变，未 fetch。
- 未执行 commit、push、checkout、switch、branch、stash、reset；未在仓库 `docs/` 写文件；未触碰 `~/.dsh`；未运行 Electron 二进制。
- 对「只读」的一处偏离已在 §0 披露：在 `/tmp/dshws-s41/audit/` 与兄弟仓 dsh-mm-resilience 根目录各创建并删除了一个临时 yaml 文件，后者终态 `git status --short` 0 行。此外的副作用仅限本报告文件。
- 本报告不含任何凭据值。
