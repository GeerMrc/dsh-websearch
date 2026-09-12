# S27 阶段 2 — 计划独立审核（plan 027）

> 审核者：独立 general-purpose Agent（agent_ca48ef04，2026-09-13）。

## 结论：**APPROVED**（4 条建议性意见，全部采纳进计划）

- **B1 healing 落点**：3423 运行中实证——healing symlink 落到运行 CLI 的树（scratch home 指向 worktree）；worktree node_modules 完整（.pnpm 1268 条 / @deepseek-ai 109 条）；peer 解析经 profile 嵌套 node_modules（tarball peer 域 >=0.1.5-rc.1 <0.1.6 与 worktree rc.2 匹配）。
- **B2 保留面**：settings.yaml 顶层键 = ui-onboarding/locale/llm-pi-ai（providers qwen/sz/zai-coding-cn）/agent-default-model，grep web/search 零命中——无旧覆写冲突；`ls -A` 9 项全覆盖于 T1/T2 清单，无遗漏。
- **B3 回填顺序**：建议先回填再起服（GUI 无法重建三 provider models 枚举）；llm-pi-ai namespace 与 agent-default-model 在 0.1.5 均存在；不兼容键按 fail-loud 报错→删键起服→GUI 补（备份兜底）。已写入 T4。
- **B4 隔离**：T3/T5 命令显式 `export DSH_HOME=$HOME/.dsh`（防继承错 home）——已写入 T3；3423 env 亲证独立；主树零写。
- **B5 验收/高危**：R1-R5 可机械验证；基线已录（~/.dsh 9 项；worktree HEAD fb2cf4b9e69 clean）。
