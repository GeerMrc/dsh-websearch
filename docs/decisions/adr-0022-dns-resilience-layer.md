---
title: "ADR-0022: 进程级 DNS 韧性层（DoH 解析 + 出口预检 + 区域预设池）"
status: proposed
date: 2026-09-27
type: feat
origin: roadmap S35（用户主计划批准 2026-09-27）+ doh-dns 技术报告证据链 + S14v/S14w fake-ip 笔记；前置：ADR-0002（链语义延伸）、ADR-0019（fetch 接管同受益）、ADR-0021（dns 段热路径）
---

# ADR-0022: 进程级 DNS 韧性层（DoH 解析 + 出口预检 + 区域预设池）

## Status

proposed（2026-09-27，Session 35 阶段 1 起草；随 T6 拦截层落地复核后转 accepted）

## Context（背景）

本网络（旁路由白名单管控，:3080 生产同网）实测：53 端口全量透明拦截（6 个 DNS 服务器应答逐字节相同，"8.8.8.8" RTT 5ms 物理不可达）；非白名单域名黑洞至 198.18.0.0/15；出口按 (SNI, IP) 元组放行且滞后于 CDN 轮转（tavily 3 轮转 IP 同时刻仅 1 可达）；路由器虚拟端点（198.18.x）自身不稳。后果：4 成员中 anysearch 解析即失败（0/N）、tavily/exa 间歇超时。443/TLS DoH 是唯一可达真实 DNS 的通道（AliDNS JSON DoH ~93ms 真值）。仓内独立佐证：S14v/S14w 笔记（本机解析器返回 fake-ip，测试被迫以 IP 字面量绕开 DNS）。

约束：插件零内核侵入（ADR-0001）；链语义/成员逻辑/凭据体系零变更（ADR-0002/0011/0012/0019 零交互）；零新运行时依赖；`~/.dsh`(3080) 生产零接触纪律。

## Decision（决策）

在插件进程内以 **`dns.lookup`（callback 形态）+ `dns.promises.lookup` 晚期 patch** 实现 DNS 韧性层，编号决策点：

- **D1 拦截 seam = dns 模块 patch**（spike 实证，非推断）：undici（global fetch）按调用时属性访问 `dns.lookup` 解析 hostname——node v20.18.3 与 v22.23.2 双版本实测：晚期 patch 被 fetch 路径调用（`{hints:1024, all:true}` 形态），patched lookup 返回注入地址后 fetch 端到端 200；disposer 还原即回落。证据：`docs/sessions/audit-logs/2026-09-27-s35-t0-spike/`。
- **D2 解析链（不劣化原则）**：缓存命中 → DoH 节点按序（350ms/节点预算，连败 3 次冷却 30s）→ NXDOMAIN 尊重（确定性答案不换节点）→ 投毒过滤（A/AAAA 落保留段丢弃；过滤后空回退原应答）→ 出口预检 → 全灭回退原 `dns.lookup`（最坏 = 配置前状态）。
- **D3 出口预检**：对 A 记录并行 `net.connect(ip, 443)`（仅 TCP 握手，无 TLS/SNI/HTTP——服务端应用层不可见，零配额/零风控信号，多 KEY 池零交互）；成功保留失败丢弃；全灭保留原列表；结果缓存 30s。
- **D4 auto 模式证据制**：以运行时配置的成员 baseURL host 集合为 canary，系统 `dns.lookup` 应答命中保留段 = 污染高置信信号（唯一判定依据；不认"探测失败"防误报）；系统解析自身失败 → inconclusive 保守启用（DNS 全盲比污染更糟）；**无证据永不启用（红线）**；决策进程生命周期缓存 1 次，UI 重检按钮强制重跑；检测异步不阻塞首搜。
- **D5 scope 过滤**：默认 `members`——仅成员 host（live 读取随设置热变）走 DoH，其余 hostname 透传原 lookup；`all` 可选（覆盖 fetch-gate OFF 路径任意域名）。进程全局副作用压缩到最小。
- **D6 区域预设池 + bootstrap**：默认池 AliDNS/DNSPod/Cloudflare/Google/Quad9（全 JSON DoH，443/TLS，SNI 与 Host 分离）；`preset=auto` 启用时并行探测可达性+RTT 取前 2；`cn`/`global` 手动钉扎；`custom` 用户自填节点表。适配国内（AliDNS/DNSPod 可达）与海外（Cloudflare/Google 可达）用户开箱即用。
- **D7 代理环境自动暂停**：`HTTPS_PROXY`/`HTTP_PROXY`/`ALL_PROXY` 存在且目标不在 `NO_PROXY` → 层暂停（诊断码 + UI 状态）——代理模式解析与预检均移至代理侧，本地 DoH 无意义且预检失真；为 DSH 正式版代理 seam 预留对接点。
- **D8 fetch-gate 改造**：`src/fetch-gate.ts` SSRF 预检的 `import { lookup } from 'node:dns/promises'` 为 ESM 不可变绑定（运行时 patch 不可触达，spike 附带证实），改为经 dns 层导出 `resolveForGuard()`——层关闭时等价回落系统解析，行为零变化。
- **D9 隐私红线**：chain-log 与 ring buffer 仅 scope 内成员 host 明文；scope=all 时非成员域名截断脱敏（保留 TLD+哈希尾缀）；诊断码/计数不涉查询名。
- **D10 生命周期**：`ctx.effect()` 注册，disposer 还原两个 patch；HMR 完整丢弃重建（单层包装断言入回归）；`mode on↔off` 设置热切换即时生效（ADR-0021 volatile 路径复用）。
- **D11 诊断不进链路径**：`DSHWS_DNS_*` 为诊断级错误码（日志/inspect/UI），解析失败仍走既有"成员失败→链降级"语义（ADR-0002），不新增链终态。

**显式副作用声明（红线级透明）**：`dns.lookup` patch 是进程全局拦截——同进程其他模块经 `require('dns')` 属性访问的解析一并被接管（经 ESM import 绑定捕获的不受影响）。以 D4 证据制 + D5 scope + D10 disposer + R2 干净环境零 patch 断言约束。

## Rationale（理由）

1. **seam 选择以实测为准**：计划期静态分析曾判「net.js 模块级捕获 → 晚 patch 对 fetch 无效，须 Socket.prototype.connect 注入」，spike 双版本实测推翻——undici 自行调用 `dns.lookup`（属性访问）预解析，Socket 注入点反而不可达（`injectedHits=0`）。dns 模块 patch 是两条 node 线上唯一对 fetch 有效的极简 seam，且零新依赖。
2. **DoH 是本网络唯一真通道**（技术报告证据 5），JSON 画像为 AliDNS 唯一可用形态（wire DoH HTTP 500 实测）。
3. **预检消除 (SNI, IP) 元组放行 + CDN 轮转的随机超时**，且 TCP-only 握手对服务商零可见（多 KEY 轮换风控零新增信号）。
4. **auto 证据制 + scope 默认 members** 把进程全局副作用的实际暴露面压到「已证实污染的网络上的成员域名」，干净网络与无关域名零行为变化。
5. **区域预设池**解决全球用户默认节点可达性分歧：国内落 AliDNS/DNSPod、海外落 Cloudflare/Google，bootstrap 自动收敛（本网络即为实例：探测后仅 AliDNS 双节点存活）。

## Alternatives Considered（被排除的方案）

### 方案 A: NODE_OPTIONS `--require` 预加载外挂（参考实现 doh-lookup.js 形态）
- **优点**: 先于一切模块加载，patch 时机无争议；参考实现已实测可用。
- **缺点**: 不可分发（须改宿主启动链）、不可见（不进插件配置/UI）、路径硬编码、违背「插件自含」。
- **排除理由**: 宿主启动链归用户/运维侧；插件必须进程内自启。spike 证明进程内晚期 patch 对 fetch 同样有效，时机障碍不存在。

### 方案 B: `net.Socket.prototype.connect` 包装注入 `options.lookup`
- **优点**: net.js 按调用时 `options.lookup ?? dnsLookup` 取值，理论上覆盖一切经典 net/tls 消费者。
- **缺点**: **spike 实测对 fetch 不可达**——undici 预解析后才 connect（hostname 不进 connect options，注入点不触发，node 20.18.3/22.23.2 双版本 `injectedHits=0`）；对直接 `net.connect` 消费者有效但本插件 scope 内无此消费者。
- **排除理由**: 对目标消费者（fetch）无效；保留记录防止后续误选。

### 方案 C: undici `Agent({connect:{lookup}})` + `setGlobalDispatcher`
- **优点**: 官方定制点，不动进程全局。
- **缺点**: 引入 npm `undici` 依赖（破坏零新依赖约束）；npm undici 与 Node 内置 fetch 的全局调度符号跨版本兼容脆弱（`Symbol.for('undici.globalDispatcher.*')` 版本化）。
- **排除理由**: 依赖与兼容性代价高于 D1 的进程 patch（后者已有 scope+证据制+disposer 约束）。

### 方案 D: 每 provider 各自注入解析
- **缺点**: 9 个 fetch 调用点 4× 重复改造；fetch-gate 路径漏覆盖；违反「Plugins, not loop changes」精神。
- **排除理由**: 传输层单点接管优于业务层逐点改造。

### 方案 E: 系统级 forwarder（forwarder.py + launchd）
- **优点**: 全机覆盖（含非 Node 进程）；参考实现已交付。
- **缺点**: 超出插件 seam（需 root/系统配置）；违背零内核侵入与插件自含分发形态。
- **排除理由**: 归宿主/运维侧独立组件（技术报告 §7 已定位）；本 ADR 只做进程级。

### 方案 F: wire DoH（RFC 8484 二进制）传输
- **排除理由**: 本网络 AliDNS wire 端点 HTTP 500（实测）；JSON 画像为唯一可用形态；wire/DoT 列后续 ADR（节点表已抽象 transport 扩展点）。

## 后续路线（各自立项，不混入本批）

节点健康评分 + race 竞争取先回、wire DoH / DoT 传输、AAAA/IPv6 预检、负反馈闭环（连接失败→IP 短黑名单）、DSH 代理 seam 正式对接（订阅宿主代理配置事件）、系统级 forwarder 组件。

## 证据附录

- 拦截 seam spike（node v20.18.3 + v22.23.2）：`docs/sessions/audit-logs/2026-09-27-s35-t0-spike/`（正例 200 transcript + 对照 ENOTFOUND + Socket 注入不可达记录 + 脚本）。
- 网络证据链 6 条：`/Users/aibot/Desktop/DSH-Test/temp/doh-dns/TECHNICAL-REPORT.md` §2.2（外部正本，plan 035 引用）。
- 本机 fake-ip 独立佐证：`docs/plans/2026-09-08-014v-s14v-fetch-floor-honesty.md`、`docs/notes/2026-09-08-s14w-env-and-primary-standby.md`。
