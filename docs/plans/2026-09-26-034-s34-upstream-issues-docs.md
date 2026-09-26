# Plan 034 — S34 上游问题经验沉淀文档批

> 用户指令（2026-09-26）：「将 fork 仓上游 DSH 的 bug 未修复相关发现与修复经验，在插件仓 Tag/README.md 加入或引入一个文档……方便小白用户复用经验，并一并更新推送到独立插件远端仓」。
> 计划期：AskUserQuestion 两问未答按推荐项（汇总三件已知问题/小白可照做+沿革折叠；zh-only 循 docs/ 惯例）。
> 正本=ExitPlanMode 批准的计划全文（本文件为指针存档）；R1-R6 验证矩阵见其 §三。

## 任务链
P0 阶段2轻量审核 → T1 docs/known-upstream-issues.md → T2 README zh/en 联动 → T3 Release v0.1.3 notes 追加（窗口重试）→ T4 阶段4轻量审核（事实逐条对照+链接校验+小白可照做性）→ T5 收尾（session-34 紧凑记录/STATUS/roadmap/CHANGELOG/合 master/推送）。

## 红线
不动 src/tests；不 bump 版本不重发 npm（README 漂移 🟢 随下版）；不碰生产/fork 仓/3080；每断言带可溯锚点。
