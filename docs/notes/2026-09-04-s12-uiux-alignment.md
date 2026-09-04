# S12 实录：设置页 UI/UX 对齐——四项反馈 + S11 治理修复批（2026-09-04）

> Session 12（feat/s12-uiux-alignment）技术实录，S13/S15 正素材。
> 计划：docs/plans/2026-09-04-012-s12-uiux-alignment-plan.md；阶段 0/2 审核正本：
> docs/sessions/audit-logs/2026-09-04-s12-*.md。

## Tooltip 复用面（反馈①④）

- 宿主 `Tooltip`（ui-primitives）经 `cloneElement` 向**单个 anchor 子元素**注入
  handlers/ref——**裸 svg 图标不可作 anchor**（不透传 props，注入静默丢弃，hover 永不触发）。
  正确形态：可聚焦 `button`（type=button + aria-label）作 anchor，图标居内。
- focus 腿**无延迟立即显示**（hover 才走 delayMs 定时器）——jsdom 测试走
  `fireEvent.focus(anchor)` + `role="tooltip"` 断言，无需假定时器。
- 宿主无 InfoIcon；`IconQuestionOutline14` 是唯一 info 类图标（用户「ℹ️」的宿主对齐替代，
  2.5 批准披露点）。

## 开关色语义矩阵（反馈②）

`switchStyle(configured, enabled)`：`configured && enabled` 才渲染
`--dsw-alias-state-success-primary` 绿；未配置（enabled 默认 true 会出「误导绿」）与
已配+关均为 `--dsw-alias-border-l2` 灰。S11 的 disabled+opacity 0.4 保持。

## 链列表（反馈③）

- 品牌名口径：`labelOf(id)` = memberId→MEMBERS.label，渲染文本与 aria-label 用品牌名，
  `data-testid`/onClick 载荷保持 id 级（测试选择器与 action 语义稳定）。
- **边界 bug**：↑↓ disabled 原按全量链长算（`snapshot.searchChain.length - 1`），过滤后
  末位可见项 ↓ 恒可点、点击必假失败——改用过滤后可见列表长度。
- `MemberSnapshot.memberId` 落地（S11 plan D5 已批准对齐键）：过滤从字符串手术
  （`id.replace('dshws-','')`）改 memberId 精确对齐。

## S11 遗留腿清偿（🟡1-4）

过滤负路径断言（T3 混合 fixture）/ 混合序列交换断言（T5 controller.spec）/ 双牙齿探针
（A：破坏跳过循环→patch 断言红；B：loopback 轮换 order 化→`Bearer k1×3` 恒序红）/
浏览器棒（T7 补做）——S11 stage45 BLOCKED 案卷的证据部分在 S12 T8 闭合。

## 坑

- **提交态红线第四次**：`vitest | tail && commit` 管道吞退出码，T2 首个 commit 带红
  （1 failed 未拦截）——`zsh` 默认无 pipefail，管道段的失败不传导。教训：**验证与 commit
  分两条命令跑**，green 判定以测试命令自身退出码为准；当次以 amend 重写为绿提交（未推送
  分支安全）。
- **测试自撞**：反馈④测试初版用全局 `button[aria-label]` 计数断言「无 ⓘ」，与成员卡
  switch（也是 button+aria-label）撞车——scope 到链区容器后再查。
