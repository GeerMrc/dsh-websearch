# 阶段 5 独立交叉验证 — Session 35（2026-09-27）

- **提示词参数头**: 骨架库版本 v2（six-stage.md 阶段 5 提示词骨架）｜阶段 5｜Session 35｜输入指针：plan 正本 + commit 范围 5d34b2f..5c30d8d + 阶段 4 报告正本 docs/sessions/audit-logs/2026-09-27-s35-stage4-review.md｜相对骨架偏离说明：无（3423 浏览器冒烟降级条款为事实槽位——scratch 家目录已清空，声明理由并降级为采信阶段 4 全量数字 + 脚本冒烟）

---

以下为交叉验证 Agent 输出原文（逐字落盘，未修改；系统通知转写中 HTML 实体已还原为原字符）：

---

# S35 交叉验证报告（独立 Agent，只证据）

仓库 `/Volumes/IPFSJK/Zcode/dsh-websearch` @ `5c30d8d`（feat/s35-dns-resilience，工作树干净）。plan/阶段4报告/commit 链均自行复核：`git log 5d34b2f..5c30d8d` 实数 15 commit（与阶段4勘正后口径一致）。全文未重复阶段4已亲跑的面（全量/typecheck/lint/i18n/build/dns 子集），只做三维追问 + 冒烟。

## 总裁定：COMPLETE（本棒交叉验证任务全部完成），但附 5 项必须随 T11/阶段6 继续的任务（见文末清单）

## 一、安全维度（4 问）

**S1. scope=all 时任意域名经 DoH 出网——查询名去向与隐私声明一致性：一致，1 处口径细节**
- scope=all 语义确认：`src/dns/intercept.ts:182`——任意进程内 hostname 走 DoH，查询名明文进 DoH 节点（TLS 内）：`src/dns/transport.ts:164`。这是 ADR-0022 D5 的显式设计——查询名去向 DoH 节点在声明范围内；D9 隐私红线只约束日志面。
- 日志面验证：脱敏在 sink 强制——`src/dns/observability.ts:41-53` sanitizeHostFactory，`src/index.ts:221` sensitivity 谓词 live 读取；remote 跨线前再过 `ports.sanitize`（`src/dns/remote.ts:89-90`）。ring/log/UI 三面均覆盖，无旁路。
- 细节口径：实现保留末两个 label（`example.com` 级），声明写「保留 TLD」——比声明多留一层，且 16-bit 哈希前缀仅是分组键不是匿名化。与声明文字基本一致但非精确，登记措辞即可，非缺陷。

**S2. 出口预检（裸 TCP-443 到任意解析 IP）内网探测面：面存在，属未声明的低危缺口（新发现）**
- `src/dns/probe.ts:42-56` 对 DoH 应答的每个 IP 裸 SYN :443；`src/dns/intercept.ts:238` 端口硬钉 443。
- 关键边界：poisonRanges 不含 RFC1918（`src/config.ts:367-373`）——resolver 毒过滤不拦 10/8、172.16/12、192.168/16。scope=all + armed 下，一条 public DNS 的 rebinding 应答（A=10.0.0.5）会被插件进程 SYN 探测内网 :443。
- 缓解事实：①探测永不拒绝（全灭保留原列表，`probe.ts:98`，冒烟实测亲证）；②裁决不进任何模型可见面；③web_fetch 路径先过 fetch-gate SSRF 才进 fetch；④scope 默认 members。fetch-gate 已有 isPublicAddress 先例，预检复用它过滤非公网目标是零成本加固。ADR/plan 风险节均未讨论此面——建议 T11 登记或一行修复。

**S3. 自定义节点（dns.nodes 用户输入）注入面：边界足够，退化路径完备**
- 类型面：schema 钳制 port 1-65535/字符串三字段；跨字段规则双路径（config throw + settings legacy hook）+ 客户端 textarea 再守（`src/client/controller.ts:736-748`，custom 无有效节点拒提交 `:711-714`）。
- 恶意 path：查询名恒经 encodeURIComponent——path 无法改写查询名；host/sni/path 本就是用户自配的信任边界。
- sni CRLF：进 Node header 值校验（ERR_INVALID_CHAR）→ 分类 network 失败 → 节点冷却换下一节点，失败可控。
- 超长/非法 host：3 连败冷却 → 全灭 null → 回退系统 lookup——最坏=配置前状态。
- 自引用递归：hostname 型 host 的嵌套 dns.lookup 被 dohInFlight 守卫拦下走原函数（`intercept.ts:191`）——无递归风险（代码级确认）。

**S4. 代理暂停读 env 时点与 NO_PROXY 语义：每次 lookup 热读，无缓存；3 处语义陷阱（2 处已声明/1 处 UI 口径）**
- 热读确认：`intercept.ts:130` per-call 应用于 `:198` 与 `:297`——env 后置生效即时。
- 陷阱①（已声明）：state().proxyActive 故意忽略 NO_PROXY（`:276-277` 注释明示）——NO_PROXY 全豁免时 UI 仍显「代理存在」，UI 文案需自证。
- 陷阱②（声明即实现）：点后缀匹配语义与 ADR D7 声明逐条一致。
- 陷阱③（未声明的 divergence）：带端口条目（host:443）与前导点条目（.example.com）永不匹配——curl 语义两者都支持。建议 ADR 勘注。

## 二、契约维度（4 问）

**C1. resolveForGuard 对 fetch-gate SSRF 语义保持：等价，拒绝面未收窄**
- guard 仍对每个应答地址做公网检查（`fetch-gate.ts:60-64` 不变），layer 只换解析真值来源。负应答 throw ENOTFOUND = 官方语义；全灭系统回退。半污染等价性：过滤后空保留原应答→guard 照拒——与官方行为一致。冒烟实测 resolveForGuard('api.tavily.com') 返回 3 个真实 AliDNS IP。
- 一处差异（设计内）：resolveForGuard 不跑预检——guard 拒绝面由公网检查独占，语义干净。

**C2. dns.lookup options 形态完备性：主矩阵覆盖，2 处未覆盖形态（1 处真缺口）**
- 已覆盖：{all:true}/单地址形态/数字 family 对象形态/family 过滤空 delegate——降级完备。
- 缺口①（真缺陷，低危）：三参显式 options=null/undefined 时 `:208` 同步 TypeError——原函数接受。位于 async 块外无 try/catch。新发现。
- 缺口②（测试名不副实）：`:163` 用例名宣称 legacy call shapes 但只测 IP 字面量+scope 外——数字 family/verbatim/hints 零覆盖。verbatim 忽略意味着 v6-first 真实应答被重排 v4-first（Node≥17 默认 verbatim=true），当前网络无 v6 无实害，应登记。
- 修复建议（缺口①）：options ?? {} 一行；顺带补断言测试。

**C3. remote 三方法 wire 契约：完备、跨代、参数表纪律成立**
- 三描述符零参 parameters: [] 与宿主三方法逐一对齐；typeSymbol 三者唯一；schema+create 并存服务双代，与 key-counts 先例同构。契约测试在位。未见缺口。

**C4. settings 热路径 volatile 重入：正确性成立，1 处爆炸半径扩大（新发现）**
- 重入正确性：volatile 每读重跑 resolveConfig；{dns:{mode}} 部分补丁经宿主 deep-merge；nodes 整读整换——无半态。
- 爆炸半径（🟡）：volatile 路径无 installSection validate hook——绕 UI 的 preset:'custom'+空 nodes 提交使每次 live.current() throw，而 layerLookup `:194` deps.config() 无守卫 → 进程级 dns.lookup 同步抛 → 全进程 fetch 断。client 前置拒绝 + cordis load throw + legacy hook 三道墙，可达性低，但违反 never-worse。一行修复：try/catch 失败即 delegate。命中 S20 M-1 pitfall 家族（复发标注：部分重开）。

## 三、前瞻维度（4 问）

**F1. 阶段4 问题 2/4/5 遗留处置：足够，证据在档**
- 353ms 双数字：t10 transcript 保留两个判定原文——冒烟独立复现 353ms 逐位吻合。
- mock 干净腿由 regression 1 承担——定性合理。
- apply 级零外呼断言：apply.test.ts 无 dns 用例（grep 证实）；invariant 代码级复核成立（auto 只 install 不 arm/trigger，触发点唯一在首次 in-scope lookup）。「随 T11 归档」处置成立，但 T11 必须真的归档。

**F2. 后续项登记完整性：缺 1 项正本登记（新发现）**
- 已登记项全在 plan 债务表 + ADR 后续路线双载体。
- 未登记：「trace 逐调用归属」只在 session-35 T9 行内叙述——不在 plan/ADR/STATUS——违反 one-home-for-a-fact，T11 必须落正本。
- 本次三维追问新挖出 4 笔未登记技术债（S2/C2①/C2②/S4③）。

**F3. 每 lookup 热读开销：实测微秒级，无需缓存（结论与直觉相反）**
- 实测（N=100k，anti-DCE）：resolveConfig ≈ 0.14 µs/次；scopeHosts 五 URL ≈ 1.9 µs/次；单次热读合计 ≈ 2-4 µs——占冷路径 351-353ms 的 <0.002%。缓存机会收益为零，做缓存反而引入失效复杂度——建议勘注实测数字防后人优化。

**F4. dont-do 复发模式（提交链枚举）预防落点：不完整（复发风险敞口）**
- dont-do.md 无该家族条目（grep 证实）；session-35 踩坑节仍占位——阶段4处置承诺未兑现。已两现，第三现前必须进 dont-do.md 正本。

## 四、实跑冒烟（用户路径，可复述序列）

3423 浏览器冒烟不可用声明：scratch 家目录已清空——按约定降级为采信阶段4全量数字 + 本冒烟，理由属实。

操作序列（工具链 node 22.23.2，脚本 /tmp/dshws-s35-smoke/smoke.mjs，副作用限 /tmp+出网查询）：
1. node --experimental-strip-types smoke.mjs——直接 import 仓内 src/dns/intercept.ts。
2. 序列：记 ORIGINAL → resolveConfig({}) 默认档 → 系统预解析（得 198.18.0.211 投毒在案）→ installDnsLayer → 首次 lookup（系统应答）→ whenSettled → 二次 lookup → resolveForGuard → dispose。

结果（全绿）：
- 预决策系统应答 198.18.0.211；canary enable/poisoned 4/4 命中 198.18.x，armed=true；
- enable 后 dns.lookup('api.tavily.com') = 98.87.123.185 / 54.243.134.162 / 184.194.134.183——非 198.18，PASS；via=223.6.6.6，冷路径墙钟 353ms（与 t10 复测逐位吻合）；
- 意外增益实证：预检对 3 个真实 IP 全灭（CDN 轮移）→ kept=3, probeDropped=[全部3]，应答仍保留全部 3 IP——keep-all-when-empty 现场亲证；
- resolveForGuard 返回 DoH 真值 3 IP；dispose 后 dns.lookup === ORIGINAL = true。

## 必须继续的任务清单（随 T11/阶段6，均非阻塞本棒验收）

1. C4 爆炸半径（🟡，S20 M-1 家族部分重开）：deps.config() 加 try/catch 失败即 delegate。
2. F2 登记补全：「trace 逐调用归属」落 plan/ADR 正本；顺带登记 4 笔新债（S2/C2①/C2②/S4③）。
3. F4 复发预防：提交链枚举家族进 dont-do.md；session-35 踩坑节兑现。
4. F1 收尾：问题 5 措辞归档；353ms 双数字口径不漂洗。
5. S2 一行加固（推荐）：预检目标复用 isPublicAddress 过滤非公网，或 ADR 勘注。

未发现虚假声称；阶段4的数字、file:line 证据与本次独立冒烟全部咬合（353ms 冷路径、4/4 canary 命中、guard 三真 IP 三个数字独立复现一致）。

---

# 主 Agent 阶段 5 处置记录（2026-09-27，同日清偿）

- 清单 1（C4）：**已修**——layerLookup/resolveForGuard/inScope 三处 config 读取均 try/catch 失败即 delegate/回退（本批提交）。
- 清单 5（S2）：**已修**——fetch-gate.ts 导出 isPublicAddress；intercept 预检腿只探公网目标，非公网地址保留在应答中不探测（never-worse）。
- 清单 2（F2）：**已登记**——plan 035 债务表新增 4 行（trace 逐调用归属/verbatim/S4 divergence/已修复三缺陷登记）；ADR-0022 D7 勘注 + 后续路线补 trace 归属。
- 清单 3（F4）：**已落**——dont-do.md 新增「交接证据链」条目（提交链枚举家族，两现入册）；session-35 踩坑/经验节本批兑现。
- 清单 4（F1）：本 audit-log + session 记录即归档正本；353ms 双数字口径在 plan/audit-log/session 三载体一致。
- 回归锁：intercept.test.ts 新增 3 条（C4 恶意配置透传/C2 null-options/C2 数字 family）；全套件 **555 通过|13 跳过（568）**；typecheck EXIT=0；lint 0w0e。
