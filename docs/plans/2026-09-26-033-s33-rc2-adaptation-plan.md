# Plan 033 — S33 随上游 0.1.7-rc.1/rc.2 迭代适配批（多版本全跨度 + fork 修复审计 + 发布与生产切换呈批）

> Session 33 | 2026-09-26 | 用户指令正本：「0.1.7-rc.2 DSH 上游有更新，基于之前的经验对当前我们本地独立开发的插件-`网页搜索`做全链版本跌代升级适配相关工作，并同步更新到npm 与我们的github 仓……需要你独立启用一个端口进行版本适配调试验证……前提是本地通过实测各版本适配没有bug，同时我们当前版本:3080中有本地独立fork了一个修复官方上游DSH bug的问题的实现，也需要同步进行审核确认类似问题是否修复，未修复也需要进行同步优化完善」。
> 计划期裁定（2026-09-26，AskUserQuestion 生产处置问）：**多版本适配+测试端全验证 → GitHub+npm 多端同步 → 最后才是 3080 且须用户人工审核确认（本轮只呈批不执行）**；测试端授权复用生产模型配置与插件 APIKEY（验后删）；生产备份/安全回退方案为硬性交付物先行设计。端口=**3434**（空闲；3424 被另一 session 占用且与 3080 共用 017a2 树）。

## 0. 关键事实（计划期实测）

- **F1** 上游新增 0.1.7-rc.1（09-23）/0.1.7-rc.2（09-24），`next`=rc.2；无 0.1.8-alpha；cordis 仍 4.0.4、schemastery 仍 3.18.4。
- **F2** 现行 peer 域 semver 实证不含 rc.1/rc.2（预发布排除规则）——需逐钉扩展（dont-do semver 条）。
- **F3** **3080 生产 = 0.1.7-alpha.2 + 本地 fork 修复**：017a2 树 = 官方 tag + 1 提交 `03bffa9454 fix(boot): tolerate read-only stacks`（profile-resolution 只读 error.stack 容错；含测试+Note；已推 fork 远端）。**该树被 3424（selfupdate U8l/U7b）共用——本轮禁改**。
- **F4** 本地无 dsh-v0.1.7-rc.2 tag（需 fetch；rc.1 已有）。
- **F5** 本机直连 registry.npmjs.org 当前超时（镜像正常）——发布环节风险，须预案。
- **F6** 插件仓两处小欠账：09-23 生产切换批 CHANGELOG 段未提交（`git add docs/` 漏了根级 CHANGELOG）；STATUS 生产树口径滞后一轮。
- **F7** 0.1.6-alpha.2 `TOOL_RUNTIME_SCHEDULER.prepare` 缺陷是否在 rc 线修复=待建树 diff（S32 watch-item）。

## 1. 任务清单（串行逐一）

| # | 任务 | done 条件 |
|---|---|---|
| P0 | 本计划落盘 + 独立 Agent 审核（阶段 2） | APPROVED |
| T0 | 前序审核（独立 Agent）：S32 收官态实测+债务三分级 | audit-log 带 file:line |
| T1 | 治理补账：提交遗留 CHANGELOG 段；STATUS 位置块刷新（生产=017a2-fork 真相）；roadmap S33 插行 | 三处一致 |
| T2 | 上游钉板：fetch tags → worktree `dsh-harness-017rc2` @ dsh-v0.1.7-rc.2 → install+build → 独立 Agent diff 矩阵（12 seam + 三问：①readonly-stack 是否已修 ②prepare 缺陷是否已修 ③ui-primitives 传递依赖有无新增）→ Note | 树绿；矩阵带证据；三问有结论 |
| T2b | fork 携带（条件）：上游未修 → rc.2 起的新分支 cherry-pick `03bffa9454` → 重建+其自带测试过；不碰 017a2 | cherry-pick 干净+build 绿；已修则证据关闭 |
| T3 | 依赖域：peer 六条 +`0.1.7-rc.1 \|\| 0.1.7-rc.2`；devDeps 16 条 dsh-\*→rc.2；typert-protocol dep→rc.2；顺手清偿 🟢（prune 19 条 0.1.2-alpha.4 exclude）；`pnpm clean --lockfile && pnpm install`；全量门墙 | semver 9 版本全 true；门墙绿+数字 |
| T4 | 源码适配（条件，TDD 先红后绿；零适配则证据关闭） | 每项红→绿→commit |
| T5 | v0.1.3：bump；CHANGELOG；双名 tarball 入 dist-artifacts；upgrade.md rc 线矩阵+经验 | 产物就位（发布待 T6 后） |
| T6 | 3434 多版本演练（复用生产配置——授权）：rc.2(±fork) 全腿 + 015rc3 冒烟（跨代 typert 面）+ 016a1 冒烟（回滚位可信）；证据直接入库；清场（3434 无监听、凭据副本删） | 三线证据链齐 |
| T7 | 多端同步发布（T6 全过后）：合 master→push→tag v0.1.3→gh Release（双 tarball）→npm publish（registry.npmjs.org；不可达如实报阻+重试预案）→拉装冒烟 | 各端在档 |
| T8 | 独立审核（阶段 4：矩阵+门墙复跑）+ 交叉验证（阶段 5） | PASS/COMPLETE(-WITH-NOTES)；必修当轮清 |
| T9 | 收尾六件套 + **生产切换呈批件**（3080→rc.2(±fork)+v0.1.3 方案 + 备份/回退方案：对象=settings.yaml/.credentials.yaml/.anonymous-user-id/profiles 依赖清单/sessions//storages/；持久带日期+校验和目录非 /tmp；恢复步骤；一级回滚=017a2-fork）——**呈用户人工审核，未批不动 3080** | 呈批件在档；3080 零改动 |

## 2. 验证矩阵

| 验收 | 内容 | 责任 |
|---|---|---|
| R1 | 计划独立审核 APPROVED | 阶段 2 |
| R2 | T0 三分级落盘带证据 | 阶段 4 |
| R3 | 治理三处一致（CHANGELOG 无未提交段/STATUS/roadmap） | 阶段 4 |
| R4 | 017rc2 树构建绿 + 矩阵三问有结论 + T2b 条件执行正确 | 阶段 4/5 |
| R5 | semver 9 版本全 true；门墙绿+数字留痕 | 阶段 4（复跑） |
| R6 | T4 每项红→绿→commit 或零适配证据 | 阶段 4 |
| R7 | v0.1.3 双名 tarball + 文档在档 | 阶段 4 |
| R8 | 三线演练证据链入库；清场完成 | 阶段 4/5 |
| R9 | 多端发布在档（或网络受阻如实记录）；3080 零改动亲证 | 阶段 4/5 |
| R10 | 交叉验证无未报债/遗漏；生产呈批件含备份回退方案 | 阶段 5 |
| R11 | 六件套齐 + 接力指令 | 主 Agent |

## 3. 高危约束（本轮红线）

- 全程零 `~/.dsh` 写（只读清点+授权配置复制到 scratch）；不改既有 worktree（015/015rc3/016a1/016a2/**017a2**）；不 force-push；3434 实例绝不指向既有树；npm publish 仅在 T6 全过后执行。

## 4. 不做（边界）

- 3080 切换（仅呈批）；selfupdate 仓一切变更；上游 0.1.6-alpha.2 死线补演（除非矩阵显示 prepare 已修且成本极低——否则仅更新 watch-item 口径）。
