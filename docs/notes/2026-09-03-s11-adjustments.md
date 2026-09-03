# S11 实录：验收反馈调整——开关置灰、单槽逗号值、优先级过滤（2026-09-03）

> Session 11（feat/s11-adjustments）技术实录，S12 手册正素材。
> 决策正本：ADR-0011（单槽逗号值）；计划：docs/plans/2026-09-03-011-s11-acceptance-adjustments-plan.md。

## 单槽逗号值（ADR-0011 改判）

- ADR-0008 多 ref 形态 → superseded；每成员保持一个凭据 ref，值 = `k1,k2,...,kN` 逗号串（零明文不变）。
- KeyPool 端口改 `ref() → string`（单一 apiKeyEnv 活端口）+ `resolve(ref)` 后 `splitKeys()` 拆分。
- 上限 10：拆分后 >10 → requestFailed fail-loud（不新增错误码——沿用 S09 承诺）。
- `keySelection` 三策略保留，作用于拆分后的 key 序列（key 级轮换替代 ref 级）。
- gate 零改动：describe configured = 值存在（逗号串整体有值即 true）。

## GUI 调整

- 开关置灰：`disabled={!member.configured}`（未配置成员不可开——行为零变化，链本就跳过）。
- 附加 keys 列表/添加行/ExtraKeyRow 整删回单输入框 + `!` helper text。
- 优先级列表过滤未配置成员（configured filter——未配置成员不渲染排序行）。

## move 可见序列交换语义

`moveSearchChainEntry` 升级：delta 方向跳过未配置成员，与相邻已配置成员交换（未配置保持原位）——过滤后排序在可见集合内视觉有效。

## 坑

- **agent 输出文件被 resume 覆盖**：同 Agent 续审时 output.txt 被覆盖——轮 1 原文丢失，stage2 audit-log 轮 1 以 reconstructed 判词级重建。教训：**续审转录须在每轮完成后立即落盘**，不留到最终轮。
- **提交态红线第三次**：T1 批内 settings.test 漏更新带红 amend——穷举清单是验收契约，执行序每文件改完立即跑该文件测试。
- **误 amend 打错提交**：T2 首次 commit 因 typecheck 红未落 → `--amend` 打在 T1 上。教训：**commit 前确认 HEAD 是本任务基点**。
