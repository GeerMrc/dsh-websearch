# 阶段 2 独立计划审核 — Session 35 plan 035（2026-09-27）

- **提示词参数头**: 骨架库版本 v2（six-stage.md 阶段 2 提示词骨架·证伪优先）｜阶段 2｜Session 35｜输入指针：plan 正本 docs/plans/2026-09-27-035-dns-resilience-plan.md；roadmap ⏳ 行 docs/session-roadmap.md S35（约 104 行）；关联事实锚点（ADR-0022 草案、spike 证据目录、src/ 与 tests/ 现状、AGENTS.md/dont-do.md/governance-sessions.md/STATUS.md、外部正本 doh-dns/TECHNICAL-REPORT.md）｜相对骨架偏离说明：在「输入指针」槽位额外列出了供自行核验的关联文件路径（纯事实路径，无引导性措辞）

---

以下为审核 Agent 输出原文（逐字落盘，未修改）：

---

# 结论：NEEDS REVISION

计划骨架（对接点、spike 证据链、验证矩阵形态、roadmap 对齐）大部分经实测为真，但存在 5 处必改——其中两处是验收条目自身不可达成/与其引用证据直接冲突，两处会命中仓内已记录 pitfall 的复发路径。

---

## 必改（5）

**N1. R4「搜索仍可用」在指定 fixture 网络上不可达成——与批次自身问题陈述矛盾**
- 证据：plan R4（第 63 行）「DoH 节点全灭 → 回退原 lookup 且**搜索仍可用**（死端口混沌）」；T10（第 54 行）把混沌腿划定在「本网络 fixture（3423）」；plan 背景（第 11 行）自证本网络配置前基线 = anysearch 全灭、tavily 间歇；ADR-0022 D2 与 TECHNICAL-REPORT §3.5 的降级语义均为「最坏 = 配置前状态（不劣化）」，报告 §2.3 实测配置前 tavily「3 连测 1 次超时」。死端口混沌在本网络执行时，回退原 lookup = 回到坏基线，「搜索仍可用」必然 FAIL。
- 修法：R4 改为「回退原 lookup 且**不劣于配置前基线**（本网络下部分成员间歇属预期）」，或把该断言限定到 mock/干净网络降级场景，并与 T10 验收要点（只主张「降级链诊断码序列」）对齐——当前 R4 与 T10 同一条腿口径不一。

**N2. 默认池「全 JSON DoH」与其引用的上游证据直接冲突；Quad9 的 JSON 端点无任何佐证**
- 证据：plan 第 34 行「默认节点池（JSON DoH）：…Cloudflare…Google…Quad9」；ADR-0022 D6「全 JSON DoH」；而 plan/ADR 引用的正本 TECHNICAL-REPORT §7.1 节点表明确标注 Cloudflare/Google/Quad9 = **wire DoH**（RFC 8484），报告全文未测过这三家的 JSON face。Quad9 无公开文档的 JSON DoH 端点；ADR-0022 方案 F 又明确本批只做 JSON（wire 列后续 ADR）。
- 后果：T2 的 golden fixture（「真实应答样本」）对 Quad9 无法取样；默认池内置永不可达节点，`preset=global` 子集含死节点。
- 修法：T2 前对五节点逐一实测 JSON 端点形态（AliDNS/DNSPod 有据，Cloudflare `dns-json`/Google `/resolve` 高置信，Quad9 存疑），核验不过的换节点或删；该核验本身写进 T2 验收要点。注意 session-35 记录「用户指令正本」第 18 行的裁定文本同样写了「全 JSON DoH」——核验结果若否决 Quad9，须作为事实勘误向用户披露，不得静默改池。

**N3. T1 缺 settings 写路径校验挂载——S20 M-1 砖机 pitfall 复发路径**
- 证据：plan T1（第 45 行）只写「`src/config.ts` dns 段：schema 双 face + resolveConfig 默认物化 + 校验」，未列 `src/settings.ts` 的 validate hook 改造。仓内既定模式是跨字段规则双路径：`src/config.ts:655-659`（validateUnifiedDomainRule）JSDoc 明载事故机理——「A resolveConfig throw must NOT be relied on for the settings path: the host swallows watcher throws into a warn, persisting the invalid value and **bricking the plugin on restart** (S20 stage-2 M-1 evidence)」；现挂载点在 `src/settings.ts:138-143`（attachSettingsSection 的 validate 回调，ADR-0018/tbs/exa 三规则均在此接线）。
- 「preset=custom 时 nodes 非空」是同类跨字段规则，只走 resolveConfig throw 就是复发。
- 复发标注：不命中 dont-do.md 既有条目（dont-do 无此条），但命中仓内 config.ts JSDoc 级已记录 pitfall——属「已知坑无任务承接」。
- 修法：T1 WBS 增补 settings.ts validate-hook 接线 + 双路径用例（settings 路径拒写、cordis.yml 路径 load 报错）。

**N4. T8 前置错标（T6 → 应为 T7）且 remote 方法面欠定义**
- 证据：plan T8（第 52 行）前置列「T6」，但其交付含「最近检测状态与证据/**重检按钮**」——重检触发与 ring buffer 读取都来自 T7（第 51 行）的「remote namespace 扩展」；T7 又未定义方法面（至少需要：检测状态/证据读、trace/ring buffer 读、重检触发三类，对照先例 `src/key-counts.ts:70` 单方法 `describeKeyCounts` 的粒度）。
- 按数字序执行碰巧不翻车，但前置列是治理执行契约（governance §3.4 逐一执行），错标即允许乱序。
- 修法：T8 前置改 T7；在 T7/T8 之间把 remote 方法名/参数/返回定下来（写进 T7 验收要点）。

**N5. auto 检测触发时机未定义——威胁 R1 既有 480 基线（单测密闭性）**
- 证据：ADR D4「检测异步不阻塞首搜」两读（apply 时异步启动 vs 首次 scope 内解析时触发），plan 与 ADR 均未定死；plan 风险节（第 94 行）的隔离论证「既有测试走 localhost IP 字面量天然跳过」只覆盖 **lookup 侧**，未覆盖**检测自身的外呼**：mode=auto 默认下，若 apply 时触发，本机（fake-ip 网络，报告 §2.2 证据 2）跑 `pnpm test` 的所有装配类测试（tests/apply.test.ts、takeover.spec.ts 等）会对成员 host 做真实系统 DNS canary → 命中保留段 → ENABLED → 安装进程级 patch + 真实 DoH 请求——本机与 CI（干净网络 SKIPPED）行为分叉，单测非密闭，直接威胁 R1「既有 480|13(493) 基线不降」（基线数字与 stage0 audit 第 27 行采信记录一致）。
- 修法：定死 lazy 触发（首次 scope 内 lookup 触发检测，装配测试不 fetch 成员 host 即零外呼）或提供测试注入位；T5 验收要点补「触发时机」用例。

---

## 建议（9）

1. **R5 第三子句无任务挂载**：「scope 随设置热变（成员 host 集合 live 读取）」不在 T6 回归 4 条（plan 第 50 行）之列，也不在 T5/T10——验收条目悬空。挂 T6。
2. **R3 的 P99 统计依赖未交付的字段**：R3「冷解析 P99 增量 ≤350ms（chain-log 统计）」要求 `[dshws-dns]` 行携带每次解析时延；T7 验收要点只写「日志样本断言 + 脱敏单测」，时延字段只在 T9 Inspect 侧出现。T7 补「时延数字入日志行」。
3. **known-upstream-issues 检查项只在风险节**（plan 第 91 行「T6 附『新 node 大版本回归』检查项」），T6/T11 验收要点均未承接，收官易漏。挂任务。
4. **v0.2.0 与历史内部编号 0.2.0 撞名**：CHANGELOG.md:552 已存在「2026-09-09 — 兜底重构 **0.2.0**」条目（内部编号，第 174 行明载不回改）；定版后 CHANGELOG 将出现两个 0.2.0 标题，README.md:4「内部开发编号 0.2.0–0.9.0 归历史档」表述需澄清。npm 侧无冲突（registry 只见 0.1.x，tag 无冲突）。T11 补一句澄清。
5. **dns.promises.lookup patch 的消费者未论证**：spike 证实 fetch 不走 promises face（transcript「promises patch applied but unused by fetch」），D8 改造后 fetch-gate 也不走；ADR「显式副作用声明」只论证了 `require('dns')` 属性访问面。要么命名目标消费者，要么缩为仅 `dns.lookup` patch（少一个 patch 面 + 少一组还原断言）。
6. **T5 决策表「单污染/全污染」两分支的动作未定义**：D4 只定义 命中=启用/解析失败=inconclusive 保守启用/无证据=永不启用；单污染（部分成员 host 命中保留段）的裁决两处都没写。
7. **README 功能文档腿缺失**：T11 只清 peer 串/占位链接（README.md:24/README.en.md:24 止于 0.1.7-alpha.2、:6 占位链接 `https://github.com/` 均实测在案）+ CHANGELOG；v0.2.0 旗舰用户面功能（DNS 设置块/Inspect/隐私红线/代理暂停语义）无 README zh/en 节。S31/S34 均有 README 联动先例，建议 T11 补或显式声明归属。
8. **NO_PROXY 匹配语义未定义**：D7「目标不在 NO_PROXY」的「目标」指什么（成员 host？DoH 节点？）与匹配语法（后缀/`*`/CSV）未定，代理暂停要可测（R4/T5/T10 三处引用）就得先定语法。
9. 措辞级：验证矩阵「tests/fetch-gate.test.ts（适配后）红→绿 1 次」——适配既有测试不是红→绿形态；chain-log 前缀 `[dshws-dns]` 与既有 `[dsh-websearch]`（src/index.ts:239）/`[dshws-websearch]`（src/index.ts:401）三式并存，定一个。

---

## 周边发现（非 plan 本体缺陷，建议随 T0① 或阶段 6 处置）

**STATUS.md 自相矛盾 + 里程碑归属悬空**：docs/STATUS.md:112（当前位置块）写「所处里程碑： **M7 功能扩展 🚧（S35 进行中）**」，而同文件 ：29（里程碑总览）与 session-roadmap.md:63 均为 M7 ✅ 2026-09-06 终态；且 roadmap 的 S32-S35 行物理挂在「M5 交付就绪」表内（session-roadmap.md:65-104）。S35 属哪个里程碑（M7 复活改总览？M5 表内新段？）未裁定，阶段 6 原子收尾时三载体（STATUS 台账/位置块/roadmap 行）会再次互斥。
**复发标注：命中 dont-do.md「收官序列状态区漏刷新」家族**（docs/dont-do.md:26-30，S04/S05a/S05b/S07 四次复发史；本次是同文件两区口径不同步的同型病变）。

---

## 已核验为真（不改，列出以界定上表边界）

- **对接点全部实存且形态相符**：`src/fetch-gate.ts:21` 的 `import { lookup } from 'node:dns/promises'` 精确在案；schemastery 双 face（`buildConfigSchema(markVolatile)` → `Config`/`ConfigLegacy`，config.ts:430-521）；volatile 路径（`LiveResolvedConfig`/`setVolatileSource` 读时重算，settings.ts:35-80）；locales parity 机制（`Record<DshWsLocaleKey,string>` 双字典 + scripts/check-locales.mjs/check-cjk.mjs = check:i18n）；remote namespace 先例（key-counts.ts TypertRemoteService + Remote 运行时标记）；chain-log sink（chain-log.ts 追加 `<dshHome>/logs/dsh-websearch.log`）；errors 码族模式（DSHWS_* 现行结构支持 DSHWS_DNS_* 扩展）。
- **spike 证据与 D1 逐点一致**：4 transcript + 2 脚本实存；Q1 晚期 patch HIT×1（推翻计划期静态预判）、正例 patched→fetch 200 双版本、restore→ENOTFOUND、Socket 注入 injectedHits=0 双版本；正例脚本零外网依赖可复跑；ADR Rationale 1 的叙述与 transcript 吻合。
- **T0 🟡×4 与 stage0 正本逐条对应**（audit-log s35-stage0 §债务清单 1-4 = plan T0 ①-④）；🟢 Release/fork 活体销项与该 audit 维度 1d 一致；README 债务两处（:24 串、:6 占位链接）实测在案。
- **TECHNICAL-REPORT 引用全部对得上原文**：§2.2 六证据、AliDNS JSON ~93ms、wire DoH HTTP 500、198.18.0.0/15、(SNI,IP) 元组放行、保留段清单（§4.1：198.18/15、192.0.2/24、203.0.113/24、0.0.0.0/8、240/4——可作 poisonRanges 默认值来源）、anysearch CNAME→GTM 原始数据（§4.4，可作 golden fixture 素材）。
- **roadmap 对齐**：S35 行（session-roadmap.md:104）与 plan 的版本（0.2.0，符合 ADR-0020 在档政策）、任务数（T0-T12=13）、R1-R8 引用、双高危门控、3-4 天工期口径一致；⏳ 状态符合「阶段 6 才写 ✅」规则。
- **验证矩阵自洽**：四列形态 = governance-sessions.md §计划必填节要求；责任阶段 3/4/5 与六阶段流水线对齐；全量 vitest「每 session 至多 1 次、唯一责任点=阶段 4」「阶段 5 采信阶段 4 数字」与 governance §亲跑上限/阶段 5 采信逐字吻合。
- **环境纪律合规**：全程 3423（AGENTS.md 用户裁定端口），未触碰 3424/3434；T12「仅用户明确指令原文留痕后执行」+ T11 发版呈批 = AGENTS.md 高危门控与 3080 红线的正确落地；版本 bump（package.json 0.1.3 → 0.2.0）与 npm 现状无冲突；engines ^22.19||>=24 与「intercept 单测以 node 22.23.2 运行」自洽（spike 的 v20.18.3 为额外广度）。

**总评**：修正 N1-N5 后可过。N1/N2 属「验收标准与证据链自洽性」硬伤，N3/N5 属已知 pitfall 的无承接复发路径，N4 是执行契约错误——均为低成本修订，不动方案本体（方案骨架与全部对接点经核为真）。

---

# 主 Agent 处置记录（2026-09-27，修订后供复审）

- N1 吸收：R4 改「不劣于配置前基线 + 降级链诊断码序列」口径，与 T10 对齐。
- N2 吸收：五厂商 JSON face 即时核验完成（Quad9 = `dns.quad9.net:5053/dns-query` + `application/dns-json`，Quad9 官方博客/ControlD docs/netmeister.org 多源；DNSPod doh.pub JSON 在档；Cloudflare dns-json/Google /resolve 官方文档）——「全 JSON DoH」成立无需改池，节点表补 `port` 字段（Quad9 5053 非标端口，网络封禁场景由 bootstrap 剔除兜底）；T2 验收要点补端点形态核验（可直达者实测取样、被阻断者文档锁定并标注）。
- N3 吸收：T1 WBS 补 settings.ts validate-hook 接线 + 双路径用例。
- N4 吸收：T8 前置改 T7；T7 验收要点补 remote 三方法面（describeDnsStatus / readDnsTrace / requestDnsRecheck，粒度对照 key-counts 先例）。
- N5 吸收：定死 lazy 触发（首次 scope 内 lookup 触发检测；auto 默认下 apply() 不触发——单测密闭性断言入 T5）。
- 建议 1-9 全部吸收（R5 scope 热变入 T6 回归第 5 条；T7 补时延入日志行；known-upstream-issues 检查项挂 T6+T11；CHANGELOG 0.2.0 撞名澄清挂 T11；dns.promises patch 缩面删除——仅 patch dns.lookup；D4 补单污染分支动作=任一命中即 ENABLED；T11 补 README zh/en「DNS 韧性」功能节；NO_PROXY 语义=成员 host 目标 + CSV 后缀匹配 + `*` 通配；验证矩阵 fetch-gate 行改「适配后全绿（禁证红）」+ chain-log 前缀定 `[dshws-dns]`）。
- 周边发现处置：M7 复活口径（总览行 🚧 复开 + 阶段 6 三载体一致）并入 T0① 清偿范围。

---

# 复审轮（同阶段续用同一审核 Agent，2026-09-27）

- **提示词参数头**: 骨架库版本 v2（six-stage.md 阶段 2 复审轮）｜阶段 2 复审｜Session 35｜输入指针：修订后 plan 正本 + ADR-0022 + 本 audit-log 末节处置记录；修订 commit 4edc5b1｜相对骨架偏离说明：无

以下为复审 Agent 输出原文（逐字落盘，未修改）：

---

# 复审结论：APPROVED

（附 6 条非阻塞残留建议，供执行期 T5/T7/T11 落定时吸收；无剩余必改）

修订范围核对：`git show 4edc5b1 --stat` 确认改动仅落在 plan / ADR-0022 / session-35 记录 / 处置记录四件，无夹带源码或其他文档改动；plan 与 ADR 全文已逐行重读。

---

## 一、N1-N5 逐条核验（全部实质落实，非表面措辞）

**N1 — 已落实。** plan R4（第 63 行）改为「回退原 lookup 且**不劣于配置前基线**（本网络配置前部分成员间歇属预期，不主张全绿；断言降级链诊断码序列 DOH_UNREACHABLE→FALLBACK_SYSTEM）」；T10（第 54 行）同步改为「断言不劣于配置前基线 + 降级链诊断码序列——本网络配置前部分成员间歇属预期，不主张全绿」。R4 与 T10 同一腿口径现已一致，且与 ADR D2「最坏 = 配置前状态」及技术报告 §3.5 降级语义对齐。验收在本网络上可达成。

**N2 — 已落实，佐证主张成立且落入正文。** 三点核验：
1. **来源标注在正文而非口头**：plan 第 34 行默认池正文写明「五厂商 JSON face 已核验（Quad9 官方博客/ControlD docs/netmeister.org、doh.pub 文档、Cloudflare/Google 官方文档…）」；ADR D6 同样落正文（含逐厂商来源枚举）。处置记录之外的两个正本都承载了佐证。
2. **节点表补 `port` 字段**（Quad9 专用 ：5053 /dns-query + application/dns-json，其余 ：443），plan 第 20/34 行 + ADR D6 一致；并新增风险节条目「Quad9 非标端口 5053…bootstrap 探测剔除兜底」（plan 第 92 行），`preset=global` 子集仍含 CF/Google 四节点的退化路径已论证。
3. **独立复核 Quad9 主张**：本审核自行检索确证 `https://9.9.9.9:5053/dns-query` + `Accept: application/dns-json` 返回 JSON 为真实存在的公开用法，且 plan 点名的 netmeister.org 来源属实（其页面给出 `curl -H 'Accept: application/dns-json' 'https://9.9.9.9:5053/dns-query...'` 原例）。T2 验收要点（第 46 行）同时补了「五节点 JSON 端点形态核验（可直达者〔AliDNS/DNSPod〕实测取样；被阻断者按已核验文档锁定形态并标注来源）」——本网络不可直达的三个节点有文档锁定 + 达者有实测取样双保险。原「报告 §7.1 标 wire」的冲突以新增证据消解，无需触发向用户的事实勘误披露（裁定文本「全 JSON DoH」成立，:5053 属补充事实非矛盾）。

**N3 — 已落实。** plan T1（第 45 行）WBS 增补「**`src/settings.ts` validate-hook 接线**（跨字段规则双路径：settings 写路径拒写 + cordis.yml 路径 load 报错——S20 M-1 砖机 pitfall 防复发）」，验收要点含「双路径用例」。S20 M-1 复发路径已被任务承接。

**N4 — 已落实。** T8 前置列改「T7」（第 52 行）；T7（第 51 行）定义 remote 三方法面 `describeDnsStatus` / `readDnsTrace` / `requestDnsRecheck`（粒度对照 key-counts 先例），验收要点含「remote 方法契约测试」。T8 的「检测状态与证据/重检按钮」自此有明确后端依赖。

**N5 — 已落实。** ADR D4 定死「**触发时机 = lazy**（首次 scope 内 lookup 时触发检测；auto 默认下 apply() 不触发——单测密闭性红线，装配类测试零外呼零 patch）」；T5 验收要点含「触发时机用例（lazy…auto 默认下 apply() 零检测零外呼断言）」。R1 的 480 基线威胁解除，且与 R2 断言形态（lookup 后断 SKIPPED）自洽。

## 二、建议 1-9 与周边发现处置核验

| 项 | 落点核验 | 结论 |
|---|---|---|
| 1 R5 scope 热变 | T6 回归改 **5 条**，第 5 条即「scope 随设置热变」（第 50 行）；ADR D10 同步 | 落实 |
| 2 时延入 chain-log | T7「含每次解析时延数字」+ 验收「含时延字段」（第 51 行） | 落实 |
| 3 known-upstream-issues | 挂 T6 验收（第 50 行）；处置记录称「挂 T6+T11」但 plan T11 未列——plan 为正本，T6 已足，处置记录微 overstated（见残留 5） | 落实（单点） |
| 4 0.2.0 撞名 | T11「CHANGELOG 0.2.0 撞名澄清…CHANGELOG:552 已有内部 0.2.0 条目」（第 55 行）；README.md:4 版本线句的澄清未逐字点名（见残留 4） | 部分落实，残余为一句话 |
| 5 dns.promises patch | 采纳缩面方案：plan 方案要点/T6/ADR D1/D10 四处一致改为「仅 dns.lookup 单 patch 面」+ 消费者论证入 D1 正文；全文无 dangling 引用 | 落实（选了更优的缩面项） |
| 6 单污染分支 | D4/T5 改「任一命中→ENABLED〔证据=命中 host+IP 清单〕」，动作已定义；但 T5 验收仍写「决策表 **5** 分支」而正文枚举 4 分支（见残留 1） | 实质落实，计数残留 |
| 7 README 功能节 | T11「README zh/en『DNS 韧性』功能节（设置块/Inspect/隐私红线/代理暂停语义）」（第 55 行） | 落实 |
| 8 NO_PROXY 语义 | T5 + ADR D7 双处定义（目标=本次解析的成员 host；CSV+后缀匹配〔等于条目或以 `.条目` 结尾〕+`*` 通配），可测 | 落实 |
| 9 措辞级 | 矩阵 fetch-gate 行改「适配后全绿（适配既有测试，禁证红）」（第 74 行，与仓内「重构禁证红」纪律一致）；前缀定 `[dshws-dns]` | 落实 |
| 周边 M7 矛盾 | T0① 增补「M7 复活口径〔总览行 🚧 复开 S35，三载体一致〕」（第 44 行）；STATUS 单源规则（「两者状态表述以本文件为准」）给该处置提供了权威序，roadmap :63 历史 ✅ 行不必回改 | 已处置入 T0 |

## 三、修订引入新问题检查

未发现阻塞级新问题。diff 全量核对，改动均映射到上一轮发现，无夹带。以下为核出的小颗粒残留（全部非阻塞，建议在对应任务落定时顺手吸收）：

1. **T5「决策表 5 分支」vs 正文枚举 4 分支**（plan 第 49 行）：合并单污染/全污染为「任一命中」后计数未同步。且合并暴露一个未定义混合态：canary 部分 host 解析干净、部分 host 系统解析失败但零保留段命中——按 D4 红线「无证据永不启用」应 SKIPPED，按「系统解析自身失败→inconclusive 保守启用」应启用，两条规则在该态碰撞。建议 T5 落定时改「4 分支」或把该混合态显式定义为第 5 分支（推荐后者，一行字）。**这是残留中最值得处理的一条。**
2. **R4 诊断码简写无前缀**（第 63 行「DOH_UNREACHABLE→FALLBACK_SYSTEM」）：T7 交付的是 `DSHWS_DNS_*` 族；建议 T7 定码名时写全（`DSHWS_DNS_DOH_UNREACHABLE`→`DSHWS_DNS_FALLBACK_SYSTEM`），避免验收时与 errors.ts 实际常量对不上。
3. **transport 节点抽象 vs accept 头**：节点表为 {host, sni, path, port}（第 20 行），而 DNSPod/Cloudflare 的 JSON face 依赖 `accept: application/dns-json`（第 34 行）。若 transport 统一固定携带该 Accept（对 AliDNS/Google 路径式 JSON 无害）则抽象自洽；建议 T2 实现时明示这一常量决策，勿使其成为隐式行为。
4. **README.md:4 版本线句**（「内部开发编号 0.2.0–0.9.0 归历史档」）在真实 v0.2.0 发布后的澄清未在 T11 逐字点名（CHANGELOG 澄清已点名）；T11 本就重写 README 节，加半句即可。
5. **处置记录与 plan 的一处微差**：处置称 known-upstream-issues「挂 T6+T11」，plan 仅 T6 承接——以 plan 为正本则无缺口，建议在 session 记录或处置记录补一句以 T6 为准，免收官核对时按处置记录找不到 T11 条目。
6. **风险节「测试确定性」条未同步引用新缓解**（第 95 行仍是「IP 字面量天然跳过」的旧论证）；实际缓解已升格为 D4 lazy 触发红线 + T5 密闭性断言，风险节该条可顺手补引，非必须。

## 四、佐证来源（N2 独立复核所用）

- netmeister.org — DNS Security: Threat Modeling DNSSEC, DoT, and DoH（plan/ADR 点名来源，页面含 9.9.9.9:5053/dns-query + application/dns-json 原例）
- Gist (matt40k) — DoH endpoint A-record lookup（:5053/dns-query + accept=application/dns-json 用法）
- FINSIN — DNS script（Quad9 9.9.9.10:5053 JSON API 用法）

**总评**：N1-N5 全部实质清偿（N2 经独立检索二次确证），建议 9 条与周边发现均有真实落点，修订未引入阻塞级新问题。残留 6 条均为一句话/计数级颗粒，已给出任务落点（T5 两条、T7 两条、T11 两条），不构成再修 round 的理由——可进入 2.5 用户终审。

---

# 残留 6 条吸收记录（主 Agent，同日；计划内微调，验收标准不变，不触发重审）

1. T5 决策表定为显式 5 分支（混合态=第 4 分支：有干净样本即证未污染→SKIPPED，失败侧出 DETECT_INCONCLUSIVE 诊断码）；ADR D4 同步判定优先级语义。
2. R4 诊断码写全（DSHWS_DNS_DOH_UNREACHABLE→DSHWS_DNS_FALLBACK_SYSTEM）。
3. T2 补「统一固定携带 accept: application/dns-json（对路径式 JSON 端点无害，显式常量决策）」。
4. T11 补 README.md:4/README.en.md:4 版本线句同步澄清。
5. 勘正本节处置记录：known-upstream-issues 检查项**以 plan T6 为准**（单点承接；处置记录「挂 T6+T11」系笔误）。
6. 风险节「测试确定性」条补引 D4 lazy 触发红线 + T5 密闭性断言。
