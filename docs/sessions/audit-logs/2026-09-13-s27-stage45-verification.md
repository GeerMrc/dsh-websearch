# S27 阶段 4/5 — 生产切换验收（独立 Agent）

> 验证者：agent_b218c74c（2026-09-13）。判定：**PASS**（R1-R5 全过）。

- R1 保留面：`~/.dsh` 顶层 = 保留三件 + 4 个重建运行时目录；备份四件在；md5 对账（credentials 因合并搜索 key 预期不同——pre-merge 模型三键名仍在）。
- R2 接线：dump :343/:344/:544 三处；插件 0.1.0。
- R3 运行态：3080 裸 401；chain log 21:18 段 key draw ×2 + `served-by: dshws-tavily` ×2。
- R4 主树零接触：deepseek-harness clean；worktree HEAD fb2cf4b9e 不变。
- R5 3423 存活：pid 61902、裸 401。
- 附加：插件仓分支工件齐（plan/audit×2/session 骨架）；3080 = pid 63856。
