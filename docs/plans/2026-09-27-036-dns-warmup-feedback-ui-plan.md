# Plan 036 — S35 增补批：启动预热 + 负反馈环轻量版 + DNS 块 UI/UX 对齐

> 用户两项提议 + 两项裁定（AskUserQuestion 2026-09-27）：①启动自动后台预处理（裁定全深度：检测+建池+预解析）②UI/UX 全面对齐（ⓘ+悬停范式）③纳入负反馈环轻量版（缓存作废反馈）。
> 依据：3423 实测日志两类残留失败（首查竞速 10s 超时；出口漂移重试 2.6s），正本 session-35 记录 T11 节。
> 批准：计划批准流 2026-09-27（= 本增补批 2.5）；发版/3080 仍属 S35 既有 T11/T12 高危门控。

## 目标

v0.2.0 定版前消除首查竞速失败、缓解出口漂移重试、DNS 设置块视觉与插件整体范式统一。

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 前置 |
|---|---|---|---|
| T0 | plan 落盘 + ADR-0022 勘注（D4「boot 预热」+ D3「连接失败缓存作废」）+ roadmap/STATUS/session 登记 | 独立阶段 2 审核 APPROVED | 无 |
| T1 | 启动预热：intercept `warmupDelayMs` 接缝（auto 装载后调度 triggerDetection→arm→prewarm；on 模式 arm 后预热；off 不动；dispose 清理定时器）；prewarm = scopeHosts 逐个预解析入缓存；index 接线 `process.env.VITEST === undefined ? 2500 : undefined` | 红→绿：定时推进后 decision 已决+armed+预解析 via=cache；dispose 取消；clean 零 patch；vitest 下 apply 零触发（证红锁死） | T0 |
| T2 | 负反馈：层暴露 `invalidateHost(hostname)`（删正缓存条目）；chain/core 成员连接级失败（TypeError fetch failed）经注入回调 `onMemberConnectFailure(memberId)` → index 映射 memberId→baseURL host→invalidate；HTTP 4xx/5xx 不作废；未启用/scope 外空操作 | 红→绿：连接级失败→作废→下次 resolve send 计数变化；HTTP 错码不作废；空操作路径；全套件零回归 | T0 |
| T3 | UI/UX 对齐：标题行 题+ⓘ(description 入 Tooltip)+chip；三选择器+自定义节点改 paramRowStyle 行（label+ⓘ+控件），四条 hint 独占行入 Tooltip；**卡展开即 refreshDnsFace()**（expand→refreshCounts 同款先例，修复状态 chip 停留）；证据/trace 样式对齐；保 testid | check:i18n 179 键不变；typecheck/lint 绿；section.spec 适配全绿；3423 双主题截图+视觉判读 | T0 |
| T4 | 复测：rc.1→**0.2.0-rc.2**（双名 tarball 重打 + 3423 重装重启）→ 真实搜索 ≥5 连发 | 日志对比：零「检测前竞速失败」；连接失败后下一查 via≠cache；served-by 成功率统计；证据入库 | T1-T3 |
| T5 | 阶段 4 独立回顾（全量门墙唯一责任点）+ 阶段 5 交叉验证（三维追问+3423 冒烟采信） | 两份 audit-log 归档 | T4 |

## 验收条目（R1-R6）

- **R1** 门墙零回归：全套件通过数不低于 555|13(568) 基线（新增用例另计）；typecheck/lint/check:i18n EXIT=0 且 179 键。
- **R2** 预热语义：3423 启动后无任何用户交互时 chain-log 已出现 decision+resolve（预解析）行；用户首搜 via=cache；vitest 全量运行零 DNS 外呼。
- **R3** 负反馈语义：连接级失败后同 host 缓存条目被删（单测断言 send 计数变化）；HTTP 级错误不触发。
- **R4** UI 范式：DNS 块无独占行 hint 文案（全部入 ⓘ Tooltip）；视觉判读双主题无缺陷；展开即刷新状态面。
- **R5** 复测数字：≥5 连发日志中「检测前竞速型 10s 超时」= 0；每查最终 served-by。
- **R6** 治理：plan/ADR 勘注/审核两轮原文/session 记录链完整。

## 验证矩阵

| 验证面 | 触发时机 | 责任阶段 | 采信规则 |
|---|---|---|---|
| tests/dns/ 新增预热与负反馈用例 | 任务绿证 | 3 | 红→绿各 1 次 |
| 全量 vitest + 静态门 | 汇总 | 4 | ≤1 次/期 |
| 3423 复测日志（R2/R5 数字） | T4 实测 | 3 | 亲见入库 |
| 双主题截图 + 视觉判读 | T4 | 3-4 | 判读报告入库 |

## 关键设计决策

- cordis 无 'ready' 生命周期事件（已核 vendored Events 接口）→ apply 后 2.5s 延迟定时器；dispose 清理保 HMR。
- 测试密闭性门槛 `process.env.VITEST`（仓库新引入模式，ADR 勘注显式声明：预热是网络副作用，单测密闭红线优先；证红断言锁死）。
- 负反馈=缓存作废而非 IP 黑名单：undici 不暴露实际选中连接 IP；作废→重新 DoH 拿新轮转集合为零埋点等效缓解；IP 级 60s 黑名单（undici 连接器埋点）与 TLS-Hello 预检列后续 ADR。
- 预解析外呼量：启动一次性 ≤8 包（4 域 DoH + 预检 TCP），零风控信号。

## 债务归属映射

| 债务 | 等级 | 归属 | 依据 |
|---|---|---|---|
| IP 级失败黑名单（undici 连接器埋点） | 🟢 | 后续 ADR（负反馈闭环完整版） | 技术报告 H4 + 本批轻量版 |
| TLS-Hello 带SNI 预检（SNI 过滤网络恢复预检信号） | 🟢 | 后续 ADR | 实测 probeDrop=3 盲区发现 |
| DNS 状态面 live 轮询（现为展开即刷新） | 🟢 | 按需 | T3 以展开刷新缓解 |
