# Progress — M2 可行性定谳

> 本文件是 M2 阶段（可行性 spike）的进度台账。2026-09-02 新开（Session 02）。
> 验收契约：`docs/plans/2026-09-02-002-s02-spike-plan.md` 的 R1-R5 验收条目，阶段验收逐条
> 对应给 PASS/FAIL + 证据；🟢 债务归属映射正本在 plan 债务映射节，本文件台账为其镜像。

## 里程碑

| 里程碑 | 内容 | 状态 |
|---|---|---|
| M1 治理与规划定稿 | 治理产物齐备且占位符清零，计划过独立审核与人工终审 | ✅ 2026-09-02 |
| M2 可行性定谳 | GUI 形态、安装链路、交付形态有实测结论，ADR-0006/0007 定稿 | ✅ 2026-09-02（1/1 批次） |
| M3-M6 | 宿主包完备 / 设置页完备 / 交付就绪 / 上游验收通过 | ⏳ |

## 进行中

- 无（M2 收官；下一棒 Session 03 待启动）

## 待启动

- Session 03（插件宿主骨架 + 链式 meta-provider）——前置：M2 收官（R1-R5 全 PASS）

## 已完成

### Spike 批（2026-09-02）

阶段 0：S01 独立审核 **PASS**（🟡×1 R1 证据口径）→ T0 清偿 `410d58f` → 阶段 1 plan 落盘 → 阶段 2 轮 1 **NEEDS REVISION**（F-001..F-009）→ 修订 → 同 Agent 复审 **APPROVED** → 阶段 2.5 **用户批准**（2026-09-02）→ T1-T7 逐一执行 → 阶段 4/5 独立验证 → 原子收尾。

| 任务 | 内容 | 结果 |
|---|---|---|
| T0 | 🟡-1 清偿（R1 逐行枚举勘正） | 完成（`410d58f`） |
| T1 | spike 脚手架（node+client half、独立构建） | 完成（typecheck 0 error；banner 契约逐字符合） |
| T2/T2b | H2 安装链路两腿 | 成立（本地 link: + tarball file: 三处落盘 + 加载日志） |
| T3 | 实例启动（3410，scratch home，cwd=deepseek-harness 仓根〔源码启动所需〕） | 完成（token 轮换两次：inject 修复重启 + tarball 腿重启） |
| T4 | H3 describe/mutate | 成立（describe 视图 + mutate revision 0→1 + 服务端 onChange + settings.yaml 持久化跨重启） |
| T5 | H1 DOM 断言 | 成立（slot 注入 + en/zh 热切换渲染 + combo 分发 200） |
| T6 | H4 credentials 链 | 成立（set→事件→describe true/source:file→unset→回落 false） |
| T7 | ADR-0006/0007 | 完成（`818fdb1`） |
| T8 | 阶段 4/5 独立审核 + 交叉验证 | 见下方阶段验收表 |
| T9 | 收尾 6 件套 + 原子翻转 | 完成（本文件 R5 行） |

## 阶段验收（R1-R5，阶段收官时填）

| 条目 | 内容 | 结论 | 证据 |
|---|---|---|---|
| R1 | 前序 🟡-1 清偿可重放 | PASS | progress-M1 R1 行勘正 + 命令原文重放 8 行一致（T0，`410d58f`；阶段 4 独立 Agent 重放比对） |
| R2 | 五假设三节齐（假设/验收标准/实测结论） | PASS | session-02 记录「Spike：假设 / 验收标准 / 结论」节 H1-H5，证据均亲见原文（安装日志/DOM 断言/describe 返回/探针日志） |
| R3 | ADR-0006/0007 落盘（GO，无 roadmap 修订需求） | PASS | `docs/decisions/adr-0006…`/`adr-0007…`（`818fdb1`）；五假设全成立 → 无 NO-GO fallback 触发 → S06/S07 行不变 |
| R4 | scratch 隔离可证 | PASS | 全程 `DSH_HOME=/tmp/dshws-s02-spike/home`、profile=`web`（scratch 内）、端口 3410（非 3080）、启动 cwd=deepseek-harness 仓根（源码启动相对路径所需；隔离语义由 DSH_HOME 重定向承载——阶段 5 勘正 V-01）、环境无真实密钥、真实 `~/.dsh` 零接触（时间戳核查）；凭据仅伪值且 unset 后 refs 空 |
| R5 | 收尾 6 件套齐备且原子翻转 | PASS | session-02 记录（两新节+Spike 三节）/ progress-M2（本文件）/ STATUS 台账+当前位置块+里程碑 M2 ✅ / roadmap S02 行+M2 锚 ✅ / CHANGELOG / 接力指令（记录「下一 Session 启动指令」节 + 回复末尾）——阶段 6 同一序列完成 |

### 收官对账补注（S03 阶段 0 审核 🟡-3 清偿，2026-09-02）

阶段 4/5 独立验证结论 PASS-WITH-NOTES 的 V-01..V-04 逐条对账：**V-01**（🟡 R4 cwd 表述——隔离语义由 DSH_HOME 重定向承载，启动 cwd 仅源码启动所需）已随收官勘正落本文件 R4 行；**V-02**（🟢 R1 行数计数口径）已落 progress-M1 R1 行口径注；**V-03/V-04**（🟢 已采）正本文本未持久化、仅存于收官 commit `45ee143` message 摘要行——**留痕缺口如实承认**，可考的落地物为该 commit 实改集：`docs/00-architecture.md`（§8 开放问题定谳标注 + §9 ADR 对照表补 0006/0007 行）与 progress-M1 R1 口径注。流程改进：阶段 4/5 发现自本棒起逐条全文落 progress 台账，不得只存 commit message。同注（🟡-2 清偿）：R1「8 行」为**时点计数**，正本口径 = progress-M1 R1 行（性质分类零事实占位、非固定行数；后续重放命中 9 行系 session-02 记录自引条目自然增长，属预期）；次级载体（session-02 记录 / CHANGELOG / 本表 R1 证据列）为历史证据不回改，此后不再新增誊写。

## 技术债（台账）

| 债务 | 等级 | 归属 |
|---|---|---|
| L-1 deepseek/exa/perplexity 插件内重实现 | 🟢 | S03-S05（ADR-0003） |
| L-2 per-profile GUI 覆盖二期候选 | 🟢 | 二期候选，不排期（ADR-0004） |
| L-3 spike 脚手架不入库，正式包骨架 S03 重建 | 🟢 | S03（构建契约结论在 ADR-0006/0007） |
| 备注-1 S01「11 份资产」未逐份列出 | 备注 | 不处置，留痕 |
| 备注-2 S01 前瞻提及未标 🚧 | 备注 | 不处置；本棒前瞻表述遵循 🚧 实践 |

映射正本：`docs/plans/2026-09-02-002-s02-spike-plan.md` 债务映射节。

## 已验锚点（台账）

| 锚点（file:line 或基线项） | 所在 commit | 验证来源 |
|---|---|---|
| `dsh plugin add` pnpm 转发器 + reconcile 追加 bundles（apps/cli/src/plugin.ts:36-45,120-163）；非模板 profile 仅 base（packages/boot/app-boot/src/profile.ts:137-166） | deepseek-harness dev@3281e04b59 | S02 阶段 1 摸底 + 阶段 2 审核 F-001/F-002 核对 + T2 实测三方一致 |
| client half 分发要求 `dsh.client.platform='web'` + `exports["./client"]`（packages/client/modules/src/index.ts:224-234,738-773）；combo-only 服务（:586,1002-1024） | 同上 | S02 阶段 1 摸底 + T5 实测（combo 200 / 单包 404） |
| `SettingsProvider.installSection` published 面存在、独立 `installSettingsSection` 不存在（npm @deepseek-ai/dsh-settings alpha.3/.4 runtime exports 实测） | npm 实锚（2026-09-02） | T1 安装后 node -e runtime exports 亲见 |
| credentials RPC 面 describe/set/unset（packages/api/settings-controller/src/credentials.ts:67-153）；mutate op 形状（packages/settings/settings/src/index.ts:187-189） | deepseek-harness dev@3281e04b59 | S02 阶段 1 摸底 + T4/T6 实测互证 |
| 测试基线 | — | 无（spike 类不建基线；首个基线 S03 建立） |
