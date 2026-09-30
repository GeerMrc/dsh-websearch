# Plan — 2026-09-30-047 桌面端采用批（官方桌面端调研 × 三形态验证 × 插件桌面适配 × 上游同步规范）

> 补档说明：本 plan 为 S40 执行契约的收官归档版（S36-S39 同样为执行后补档先例）。计划期经历两轮独立审核（第一轮 NEEDS REVISION，R1 安装矢量守卫/R2 桌面更新通道风险/Y1-Y8 全部吸收；第二轮针对 home 共享边界补查）后经用户 2.5 终审批准（含高危项授权清单）。实际执行记录见 [session-40](../sessions/2026-09-30-session-40.md)。

## 目标

摸透 DSH 官方桌面客户端（来源/分发/架构/与 web 端边界）；三形态（官方安装包/源码 dev/3423 web）安装验证；`@maricgeer/dsh-websearch` 桌面端适配实测；fork 官方 bug 追踪固化；沉淀随上游迭代的稳定推进规范。

## 背景与已确立事实（计划期调研，file:line/URL 证据）

官方桌面端 = 官方仓 `apps/desktop` Electron 壳（无独立版本库）；分发 `download.deepseek.com`（feed 实测 0.2.0-rc.2 三平台）；桌面端与 web 复用 `~/.dsh`（数据共享、设置与插件按 profile 隔离）；desktop profile 受 CLI 守卫（唯一矢量 = app 内置 carrier）；更新通道 nightly+allowPrerelease（一次更新替换捆绑 runtime，插件 peer 域面临失配）。

## 任务分解（WBS）与验收对照

| 任务 | 内容 | 验收要点 | 结果 |
|---|---|---|---|
| T1a/T1b | desktop-adoption.md 报告（先行段+feed 实测 / 三形态回填） | 每条结论有证据；版本映射表 | ✅ 0c49462/a329490/…（§9 全回填） |
| T2 | 官方安装包（下载/签名/安装/启动/home 复用实测） | 版本=feed；19387；复用行为前后对照 | ✅（+EPIPE 事故闭环） |
| T3 | 源码构建 dev 桌面（隔离 home） | Harness Dev.app/19387/调试端口 | ✅（五关排障 runbook 素材） |
| T4 | 3423 web 基线（守卫树+插件） | 五锚点（版本横幅/Web Search 节等） | ✅ |
| T5 | 桌面端适配（5a 矢量/5b dev/5c 官方/5d peer 二分/5e 风险点） | 三形态×五面矩阵全绿 | ✅（免发版判定） |
| T6 | fork bug 追踪 + 上游监测 | KUI 状态实测更新；三线固化 | ✅（upstream 停 rc.2、readonly 未修） |
| T7 | upstream-sync-sop + ADR-0023 + README 桌面条目 | 命令级可操作；单一正本交叉引用 | ✅ |
| T0 | 阶段 0 三 🟡 勘正 | STATUS pid/audit-log 加注/worktree 对齐 | ✅ 30f09bd |
| T8/T9 | 阶段 4/5 独立审核 | PASS/BLOCKED + COMPLETE 三维 | ✅ PASS-WITH-NOTES（🟡 清偿 b52b6db）/ COMPLETE-WITH-NOTES（清单全处置） |

## 验收条目（R1-R4）

- R1 调研结论可复核（file:line/URL）→ ✅ 阶段 4 抽查 3 处全真、阶段 5 抽查 12+ 处零漂移。
- R2 三形态全部活体验证（3080 红线不触）→ ✅ 三端口并发在役快照（77804/21072/25798），生产 profile mtime 未动。
- R3 插件桌面端适配成立且免发版判定有依据 → ✅ 双端 manifest+UI+凭据活体；peer 域内实测。
- R4 规范文档可复用、治理合规（六件套+证据归档）→ ✅ SOP/ADR-0023/dont-do/CHANGELOG/audit-logs 17 工件/session-40。

## 债务映射

- 🟢 desktop profile 钉 file: tgz（dist-artifacts git-ignored，误清断供源）——登记 KUI 隐性债 + SOP §4(b) 注记；官方用户路径以 npm spec 为正。
- 🟢 桌面端运行时真实搜索腿未实跑（由测试套件+生产实录+等价性覆盖，三处显式声明）。
- 🟢 Windows 桌面形态未实装（边界已在 desktop-adoption §9 显式声明）。
- 🟢 官方 app 更新事件对插件拒装行为的实测留待未来更新发生（SOP §1 线 3 监测 + README FAQ 自查命令就位）。
