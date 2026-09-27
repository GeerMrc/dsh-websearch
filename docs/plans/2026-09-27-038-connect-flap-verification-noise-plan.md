# Plan 038 — rc.4 有效性验证轮 + 连接抖动日志降噪（含运行关联键）

> 用户批准 2026-09-27（计划批准流）：T1+T2 执行、T3 设计裁定随附。
> 阶段 2 首轮 NEEDS REVISION（N1 正本未落盘 + 地面事实 A-E）已全数吸收：T2 升级为「紧凑样式 + 运行关联键」双管（并发行可归属）；T1 判定面锁定 chain-log 文件证据（禁 DOM evaluate 自证）；两份 /tmp 证据归档入 T1；STATUS 补登 037/038 入 T0。

## 目标

验证 rc.4 快降级的实测收益（T1）；把连接级抖动日志从「并发重复的长错误行」变为「短行且每行可归属到具体链运行」（T2）。

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 前置 |
|---|---|---|---|
| T0 | 本 plan 落盘（本动作）+ STATUS 位置块补登 plan 037/038 + session-35 记录 038 行 | 阶段 2 复审 APPROVED | 无 |
| T1 | **rc.4 有效性验证轮**：浏览器坐标点击驱动 3423 发起 ≥5 主题搜索；**判定面 = chain-log 文件 tail**（`/tmp/dshws-s35/home/logs/dsh-websearch.log`，禁以 DOM evaluate 返回值自证——session-35 T11 教训）；产出前后对照表；**归档** 10:59 旧基线（dsh-websearch.rc3.log 122-124 段）与本轮完整日志至 `docs/sessions/audit-logs/2026-09-27-s38-t1/` | 对照表：连接路径 30s MEMBER_TIMEOUT=0（结构上 2×10s<30s 预算）；最坏恢复 ≤4s（11:08 现场先例 3.4s）；全部 served；`connect-level retry cap` 快降级出现 | T0 |
| T2 | **connect-flap 紧凑样式 + 运行关联键**：ChainCore.run() 生成 4-hex runKey；连接级行改为 `[dshws-chain] connect-flap <member> → retry(fresh-resolve) #<runKey>` / `[dshws-chain] connect-flap <member> → degrade(retry-cap) #<runKey>`——并发实例的行经 runKey 可归属（11:08 现场 4 条 10ms 内重复行的根治）；**第三发射点** core.ts:194 gate-less stub 的 degrading 行同步紧凑化；其余行（key draw/served-by/DNS/HTTP 错误/MEMBER_TIMEOUT/链耗尽/credential-level/request-level 注记）**一字不动** | 红→绿：新样式含 runKey 断言；credential-level HTTP 401 与 request-level HTTP 400 子串断言（search-chain.test ~690/~744）不受影响；**行数断言**（search-chain.test ~391 `toHaveLength(1)`）逐一核对适配；真故障样式不变断言 | T1 |
| T3 | **设计裁定（不在本批实现）**：不新增第 4 mode——mode（auto/on/off）管整层启停，SNI 探测是预检传输方法，正交。正确形态 `dns.probe.method: 'tcp' \| 'tls-hello'`（默认 tcp；tls-hello = 带 SNI 的 TLS-ClientHello 握手即断，~30-50 行 + mock 套接字测试；对 (SNI,IP) 过滤网络恢复预检信号，消除 probeDrop 全盲噪音）。**立项时机 = T1 结果**：rc.4 后连接抖动仍高频则立项，否则挂后续。mode 路线的适配面（config 联合类型 + runCanary 五分支 + section 选择器 + locales 三键）作为否决记录留档 | 本节即裁定正本 | — |

## 验收条目（R1-R4）

- **R1** T1 对照表四指标全达标且证据归档（audit-logs/2026-09-27-s38-t1/ 两文件）。
- **R2** 并发链运行的连接级行经 runKey 可归属（单测：两个并发 run 的行交错后各归各）。
- **R3** 真故障行样式零变化（HTTP 错误/超时/链耗尽原样）。
- **R4** 全套件零回归 + typecheck/lint 绿；rc.5 双名重打重装 3423，新日志可读性现场验证留档。

## 验证矩阵

| 验证面 | 触发时机 | 责任阶段 | 采信规则 |
|---|---|---|---|
| tests/chain/ 新增 runKey 与样式用例 | 任务绿证 | 3 | 红→绿各 1 次 |
| 3423 实测日志（T1 对照 + rc.5 可读性） | T1/T2 实测 | 3 | 文件证据亲见归档 |
| 全量 vitest + 静态门 | 汇总 | 4 | ≤1 次/期 |

## 风险

- runKey 生成依赖：每 run 一次（crypto/计数器），零热路径成本。
- 行数断言（~391）适配遗漏 → 全量跑捕获。
- 浏览器驱动再遇点击失灵 → 以 chain-log 无新 key draw 行为「未发出」判据，重试坐标点击。
