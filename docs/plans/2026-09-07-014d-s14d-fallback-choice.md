# Plan — 2026-09-07-014d-s14d-fallback-choice

> S14d 插行棒：maxUses 行修正 + 兜底二选一（无兜底 fail-loud 默认）+ 标题 ⓘ/输入占位脱敏。
> 用户三项反馈 + 免费侧裁定（AskUserQuestion 获答「无兜底 fail-loud」）。分支 feat/s14d-fallback-choice。

## D1-D5
- D1 maxUses 行：对齐修正；ⓘ 文案「一次请求必须作答前最多可搜索{N}次」（{N}=输入值实时同步）；删作用域后缀；默认 5→**10**（provider 常量+GUI 回显）。
- D2 兜底二选一（用户裁定）：fallback 行开关改 role=group 两段 [无兜底 | DeepSeek 付费]；**默认无兜底**（deepseek.enabled 默认 true→**false**——默认零付费触达，ADR-0004 中立性强化注记）；选中 DeepSeek 付费时才注册入链尾；无兜底+无成员 → fail-loud（错误指引句同步改）。
- D3 标题 ⓘ 内容 ← description 文本；多 key 格式提示移入各卡输入 placeholder（ref 名 + 多把格式）；已配置未编辑时输入框脱敏显示 ••••••，聚焦进入编辑、失焦还原。
- D4 既有用户兼容：settings 显式 enabled 值原样生效（无迁移）；ADR-0004/0013 注记默认翻转。
- D5 scope-out：免费抓取型 provider（用户否决）；README（S15）。

## WBS
T0 治理批（本提交）→ T1 maxUses 修正（TDD）→ T2 兜底二选一（node 默认翻转+GUI segmented+错误文案+测试适配，TDD）→ T3 ⓘ/placeholder/脱敏（TDD）→ T4 门墙 → T5 阶段4/5 独立验证 → T6 收尾 merge。

## R1-R5
R1 maxUses 全要素（对齐/文案 {N} 同步/无后缀/默认 10 wire 断言）；R2 二选一（默认无兜底/选付费入链尾/fail-loud 指引/兼容显式值）；R3 ⓘ 内容=description+placeholder 多 key 格式+脱敏聚焦交互；R4 门墙全绿（基线 284|9(293)）；R5 ADR 注记互指。

## 高危预告
同 S14c（3423/3432 续用查占；remove→add 换包；宿主仓零写）。
