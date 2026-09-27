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
| T1 | 启动预热：intercept `warmupDelayMs` 接缝（auto 装载后调度定时器→triggerDetection→（enable 则）prewarm；on 模式 arm 完成后同样预热；off 不动；dispose 清理定时器 + 异步续行 disposed 守卫〔arm() 先例〕；定时触发时 live 读 mode 分派；recheck 先行时 settling 早退但 prewarm 仍执行——顺序 = await 检测/arming 后无条件 prewarm）；**prewarm = 对 scopeHosts 逐个走层公开 lookup 路径（family 0，与 undici 首查同缓存键，同样发 resolve 事件进 chain-log/trace）**，noop 回调弃答；skip 分支（干净网络）后 prewarm 走已卸载的透传=4 次系统解析，无害；门槛抽为可测助手 `resolveWarmupDelayMs(env)`（index 接线其返回值） | 红→绿：助手单测先红（VITEST 置位→undefined，未设→2500）；fake timers 推进后 decision 已决+armed+预解析 via=cache 且 chain-log 出 resolve 行；dispose 取消；clean 零 patch；apply.test 增例：vitest 环境下 apply 后推进定时器零 DNS 副作用 | T0 |
| T2 | 负反馈：**判别式 = 沿 DshwsError.cause 链找 cause.code ∈ 连接错误码集**（ECONNREFUSED/ETIMEDOUT/ECONNRESET/EHOSTUNREACH/ENETUNREACH/EPIPE/EAI_AGAIN/UND_ERR_*；到达 chain catch 的是 memberFetchFailure 包装的 DshwsError code=requestFailed、cause=原 TypeError——字符串匹配不可靠弃用）；**MEMBER_TIMED_OUT 明示计入作废**（超时同样指向选路劣化，作废代价仅 90-350ms 重解析；预热治本后该类本应消失，计入是保守网）；HTTP 4xx/5xx（DshwsError code=httpError）不作废；**负缓存条目不作废**（NXDOMAIN 尊重，neg TTL 仅 10s——明示决策+断言）；层暴露 `invalidateHost(hostname)`（**删该 host 全部 family 缓存键 host:0/:4/:6，小写归一**；`DohResolverLike` 增可选成员 invalidate，层内守卫存在性——既有 fake resolver 零破坏）；接线 = ChainOptions 增可选 `onMemberConnectFailure(memberId)`（**搜索/抓取两链共用 Options，单点覆盖两链**），index 侧映射 memberId→baseURL host→invalidate（材料复用 dnsScopeHosts 逻辑）；未启用/scope 外空操作 | 红→绿：连接码/超时→三键全删→下次 resolve send 计数变化；HTTP 错码不作废；负缓存保留断言；空操作路径；两链注入面各一断言；全套件零回归 | T0 |
| T3 | UI/UX 对齐（行级清单）：**删** dnsDescription `<p>`（文案移入标题 ⓘ Tooltip）与四条 hint `<p>`（dnsModeHint/dnsScopeHint/dnsPresetHint/dnsNodesHint 分别入对应选择器/节点行 ⓘ）；**留** 标题行（题+ⓘ+状态 chip）、decision 状态行、hits/failures 证据行（动态状态非提示）、trace 列表；三选择器+自定义节点改 paramRowStyle 行（label 左+ⓘ+控件右）；**卡展开即 refreshDnsFace()**（expand→refreshCounts 同款先例 section.tsx:1680，修复状态 chip 停留）；保 testid | check:i18n 179 键不变（删行不删键）；typecheck/lint 绿；**section.spec 增 DNS 卡用例**（hint <p> 不存在/ⓘ Tooltip 在/展开触发刷新回调——本任务红→绿腿）；3423 双主题截图+视觉判读 | T0 |
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
