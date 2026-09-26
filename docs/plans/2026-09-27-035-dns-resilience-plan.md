# Plan 035 — DNS 韧性层批（v0.2.0：进程级 DoH 解析 + 出口预检 + 区域预设池）

> Session 35 正本验收契约。用户主计划批准 2026-09-27（计划批准流），四裁定见 session-35 记录「用户指令正本」节。

## 目标

在插件进程内实现 DNS 韧性层并定版 v0.2.0：DoH（JSON, 443/TLS）加密解析绕过 53 端口拦截、出口可达性预检消除 CDN 轮转 IP 随机超时、投毒过滤、多级降级（不劣化原则）；auto 模式干净网络零行为变化；区域预设节点池 + bootstrap 自动选点适配国内/海外；设置页底部独立「DNS 韧性」块 + Inspect 解析 trace。

## 背景

- **问题实测在案**：本网络（旁路由白名单管控，:3080 生产同网）53 端口全量拦截、非白名单域名黑洞至 198.18.0.0/15、出口按 (SNI, IP) 元组放行且滞后于 CDN 轮转——4 成员中 anysearch 全灭（解析黑洞）、tavily/exa 间歇超时。证据链正本：`/Users/aibot/Desktop/DSH-Test/temp/doh-dns/TECHNICAL-REPORT.md` §2（6 条实测证据）+ 仓内 S14v/S14w 笔记（本机解析器 fake-ip 佐证）。
- **拦截 seam 已实证（T0 spike，2026-09-27）**：`dns.lookup` 晚期 patch（callback 形态）在 node v20.18.3 与 v22.23.2 上均拦截 global fetch——undici 以 `{hints:1024, all:true}` 形态按调用时属性访问 `dns` 模块；完整正例（patched lookup 返回 127.0.0.1 → fetch 200）双版本通过；disposer 还原后回落 ENOTFOUND。`Socket.prototype.connect` 注入对 fetch 不可达（undici 预解析后才 connect，spike 实测 injectedHits=0）→ 降级为 ADR-0022 备选否决记录。证据：audit-logs/2026-09-27-s35-t0-spike/（4 份 transcript + 2 份脚本）。
- **fetch-gate 事实**：`src/fetch-gate.ts:21` 的 `import { lookup } from 'node:dns/promises'` 为 ESM 不可变绑定，运行时 patch 不可触达（spike 附带证实 dns.promises 属性可变更但 fetch 不走它）→ 需重构 fetch-gate 经 dns 层导出解析。
- **版本定档**：v0.2.0（用户裁定 2026-09-27；本批定性特大架构子系统，符合 ADR-0020/S26「仅特大架构升 0.2.x」口径，无需修订政策）。
- **约束**：零新依赖（node:net/node:https/全局 fetch）；不改链语义/成员逻辑/凭据体系（ADR-0002/0011/0012/0019 零交互声明）；上游 peer 域不动；`~/.dsh`(3080) 零接触直至用户明确指令。

## 方案要点（细目见 ADR-0022）

```
src/dns/transport.ts  DoH JSON 客户端：节点 {host, sni, path}，SNI 与 Host 分离，TLS 原生校验，350ms/节点
src/dns/resolver.ts   缓存(pos 30–300s 钳制/neg 10s) → 节点按序(连败 3 次冷却 30s) → NXDOMAIN 尊重
                      → 投毒过滤(保留段) → 出口预检(TCP-443 并行) → 全灭回退原 lookup
src/dns/probe.ts      出口预检：仅 TCP 握手(无 TLS/SNI/HTTP)，30s 缓存，全灭保留原列表
src/dns/detect.ts     canary auto 检测(仅保留段命中=污染高置信；inconclusive 保守启用；无证据永不启用)
                      + 区域池 bootstrap(并行探测+RTT 排序取前 2) + 代理 env 检测暂停
src/dns/intercept.ts  dns.lookup + dns.promises.lookup patch（scope 过滤 + disposer 还原 + HMR 安全）
src/config.ts         dns 段：mode(auto/on/off) / scope(members/all) / preset(auto/cn/global/custom)
                      / nodes / probe / cache / poisonRanges —— 双 face volatile，resolveConfig 显式默认
src/fetch-gate.ts     SSRF 解析改走 dns 层 resolveForGuard()（层关闭时等价回落系统解析）
src/errors.ts         DSHWS_DNS_* 诊断码（诊断级，不进链失败路径）
观测面                chain-log [dshws-dns] 行 + remote ring buffer(最近 50 条，脱敏规则) + 设置页块 + Inspect trace
```

**默认节点池**（JSON DoH）：AliDNS（223.5.5.5/223.6.6.6，sni dns.alidns.com，/resolve）、DNSPod（120.53.53.53，doh.pub）、Cloudflare（1.1.1.1/1.0.0.1，cloudflare-dns.com）、Google（8.8.8.8/8.8.4.4，dns.google）、Quad9（9.9.9.9，dns.quad9.net）；preset=auto 时 bootstrap 并行探测选可达前 2，cn/global 为手动钉扎子集，custom 用户自填。

**区域与隐私**：查询名脱敏红线——chain-log 与 ring buffer 仅记录 scope 内成员 host 明文；scope=all 时非成员域名截断脱敏（保留 TLD + 哈希尾缀）；计数与诊断码不涉名。

**代理前瞻**：HTTPS_PROXY/HTTP_PROXY/ALL_PROXY 存在且目标不在 NO_PROXY → dns 层自动暂停（诊断码 + UI 状态）；为 DSH 正式版代理 seam 预留（后续订阅宿主代理配置事件即可对接，登记后续路线）。

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 前置 |
|---|---|---|---|
| T0 | 阶段 0 抓获的 🟡×4 收官卫生债清偿（① STATUS 位置块/🟢 枚举统一 ② session-34 记录补「开发规范强化说明★」+「当前项目状态快照」两节 ③ S32-S34 三份 audit-log 补 v2 参数头 ④ 接力指令格式裁定落档——本棒恢复本体格式并记录）+ 🟢 Release/fork 活体目验销项落台账 | 逐项 file:line 修复 + 复核；session-34 记录 10 节齐 | 无（先债后新） |
| T1 | `src/config.ts` dns 段：schema 双 face（volatile 标记）+ `resolveConfig` 默认物化 + 校验（preset=custom 时 nodes 非空；范围值钳制） | `tests/config.test.ts` 新增用例红→绿；typecheck/lint 绿 | T0 |
| T2 | `src/dns/transport.ts` DoH JSON 客户端（节点抽象、SNI/Host 分离、超时、错误分类） | golden fixture 契约测试（真实应答样本：tavily 3 IP 轮转、anysearch CNAME→GTM）锁定转换正确性 | T1 |
| T3 | `src/dns/resolver.ts`：缓存（pos 钳制/neg）、投毒过滤（保留段表驱动）、节点冷却、降级链、回退原 lookup 断言 | 表驱动全绿：缓存 TTL/过滤边界 IP/冷却切换/全灭回退（断言原函数被调恰 1 次） | T2 |
| T4 | `src/dns/probe.ts` 出口预检：并行 TCP-443（仅握手）、30s 结果缓存、全灭保留原列表 | mock 套接字表驱动：2 通 1 断→返回 2；全断→保留全部；预算不击穿 | T3 |
| T5 | `src/dns/detect.ts`：canary 决策表（干净跳过/单污染/全污染/inconclusive 保守启用/空集跳过）+ 区域池 bootstrap + 代理 env 暂停 | 决策表 5 分支全绿 + bootstrap 排序/淘汰用例 + 代理暂停用例 | T3 |
| T6 | `src/dns/intercept.ts`（dns.lookup + dns.promises.lookup patch、scope 过滤、IP 字面量/校验型透传、`{all:true}` 与 legacy 形态、disposer）+ `src/index.ts` effect 集成 + `src/fetch-gate.ts` 改造 `resolveForGuard` | 回归 4 条全绿：干净环境零 patch 断言/污染启用/热切换 on↔off 即时生效/HMR 单层包装；既有 fetch-gate 测试适配后全绿 | T5 |
| T7 | 观测面：`src/errors.ts` DSHWS_DNS_* + chain-log `[dshws-dns]` 行 + ring buffer（最近 50 条脱敏）+ remote namespace 扩展 | 日志样本断言 + 脱敏规则单测（scope=all 非成员域名不明文） | T6 |
| T8 | client A：`locales.ts` en 源 + zh 全键 parity（DNS 韧性段：模式/范围/预设/节点/状态/重检/代理暂停）+ `section.tsx` 底部「DNS 韧性」折叠块（mode/scope/preset/节点高级编辑/最近检测状态与证据/重检按钮）+ `controller.ts` 镜像 | `check:i18n` 绿；3423 浏览器双主题截图留痕（zh/en） | T6 |
| T9 | client B：`websearch-row.tsx`/`fetch-row.tsx` Inspect 面板解析 trace 区（via 节点/kept/dropped/时延/降级事件） | 3423 浏览器截图留痕 + toolview 测试绿 | T8 |
| T10 | 真实网络 e2e + 混沌：3423 scratch 家目录，本网络 fixture（预期 auto→ENABLED + 四成员 10 连测）；干净环境模拟（mock 正常解析→SKIPPED 零 patch）；死端口混沌（DoH 全灭降级链诊断码序列）；代理 env 注入（暂停+诊断码） | 验收基线数字实测填表（R3/R4）；预检预算 ≤350ms 不击穿成员超时 | T6-T9 |
| T11 | 收官：治理 6 件套 + CHANGELOG + **v0.2.0 定版**（package.json version + peer 串 README 前置串清偿〔原「随 0.1.4」债务归属改此〕+ 双 tarball + npm 发版呈批） | 门墙全绿；npm publish 高危门控：**发版前呈用户确认** | T10、阶段 4/5 |
| T12 | 生产 3080 切换（备份先行 → profile 单行改 v0.2.0 tarball → pnpm install → 重启 → 验证） | **仅用户明确指令原文留痕后执行**；3423 预验证 + 三级回滚预案先行 | T11 |

## 验收条目（R1-R8，progress 阶段验收逐条对应）

- **R1 门墙零回归**：`pnpm run typecheck`/`lint`/`test`（全量）EXIT=0；既有 480|13(493) 基线不降（新增套件另计）；`check:i18n` EXIT=0 且键数增加后 en/zh parity。
- **R2 干净环境零行为变化**：mock 正常系统解析下 `mode=auto` → 检测 SKIPPED，`dns.lookup ===` 原函数（零 patch）；单测断言 + T10 模拟实测。
- **R3 本网络 fixture 可达基线**（实测亲见，3423）：auto 检测 ENABLED（证据：保留段命中 host+IP）；anysearch 可达 10/10；tavily 首试 10/10；exa/firecrawl 10/10（TCP-443 连通口径）；冷解析 P99 增量 ≤350ms（chain-log 统计）。
- **R4 降级与暂停语义**：DoH 节点全灭 → 回退原 lookup 且搜索仍可用（死端口混沌）；预检全灭 → 保留原列表；HTTPS_PROXY 注入 → 层暂停 + `DSHWS_DNS_SUSPENDED_PROXY` 诊断码 + UI 状态。
- **R5 热语义与 HMR**：运行中 `mode on↔off` 即时注入/还原；HMR 重建后无重复包装（`dns.lookup` 单层）；scope 随设置热变（成员 host 集合 live 读取）。
- **R6 UI 双语与可用**：设置页底部 DNS 韧性块 zh/en 双主题截图；Inspect trace 区展示 via/kept/dropped/时延。
- **R7 隐私红线**：chain-log 与 ring buffer 无 scope 外明文域名（脱敏单测 + 日志样本断言）。
- **R8 治理收官**：6 件套原子收尾（STATUS 台账+位置块+roadmap 行同一动作）；ADR-0022 → accepted；v0.2.0 双 tarball 入 dist-artifacts/；npm 发版呈批件在档（发版与生产切换各为独立高危门控）。

## 验证矩阵（各阶段与 audit-log 引用本节，不重写命令与数字）

| 验证面 | 触发时机 | 责任阶段 | 采信规则 |
|---|---|---|---|
| tests/dns/* 新增子集 + tests/config.test.ts | 任务绿证 | 3 | 红→绿各 1 次 |
| tests/fetch-gate.test.ts（适配后） | 任务绿证 | 3 | 红→绿 1 次 |
| 真实网络 e2e + 混沌（R3/R4 数字） | T10 实测 | 3 | 数字实测亲见，progress 锚点登记 |
| 全量 vitest（含既有 480 基线核对） | 汇总 | 4 | 每 session 至多 1 次（唯一责任点） |
| typecheck / lint / check:i18n / build | 汇总 | 4 | 阶段 5 采信阶段 4 数字 |
| 3423 浏览器冒烟（设置块/Inspect 双语双主题） | 冒烟 | 5 | 用户路径一次主流程 + 截图 |

## 债务归属映射（🟢 延后项正本）

| 债务 | 等级 | 归属 | 依据 |
|---|---|---|---|
| README 前置 peer 串 + README.md:6/README.en.md:6 占位链接 | 🟢 | **v0.2.0 T11**（原「随 0.1.4」归属因本棒定版 0.2.0 改乘） | S33/S34 登记 + 阶段 0 核对 |
| Release/fork 远端活体目验 | 🟢 | **已销项**（S35 阶段 0 活体亲验：远端 master=5d34b2f 一致、fork head=ebd42731c9 一致） | audit-log s35-stage0 §维度 1d |
| npm 包内 README 漂移 | 🟢 | v0.2.0 发版自然消除 | S34 登记 |
| 节点健康评分/race、wire DoH/DoT、AAAA/IPv6 预检、负反馈闭环、DSH 代理 seam 正式对接、系统级 forwarder 组件 | 🟢 | 后续 ADR（各自立项） | ADR-0022「后续路线」节 |

## 风险

- **undici 代际行为漂移**（spike 只覆盖 v20.18.3/v22.23.2）：缓解——intercept 单测在 CI/本地以当前 node 22.23.2 运行；T6 附「新 node 大版本回归」检查项入 known-upstream-issues；ADR-0022 记录 spike 版本矩阵。
- **进程级 patch 副作用**：scope 默认 members + mode 三态 + auto 证据制 + disposer + R2 零 patch 断言。
- **auto 误判**：仅保留段命中判定（高置信）；inconclusive 独立诊断码保守启用。
- **测试确定性**（本机 fake-ip 环境）：单测全 mock 传输/套接字；既有测试走 localhost IP 字面量天然跳过；e2e.real 在本机 auto 启用属预期增益不破坏断言。
- **发版/生产影响**：T11/T12 双高危门控（用户确认/明确指令）；3423 预验证 + 备份 + 三级回滚（runbook 既有）。
- **网络窗口**（GitHub/npm push 受阻先例）：发版腿沿用 S33 编排器模式重试，CHANGELOG 诚实标注。
