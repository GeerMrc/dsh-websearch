# Session 08 阶段 4/5 独立验证输出（正本转录）

> **落盘说明**：本文件为 Session 08 阶段 4/5 独立验证 Agent 输出原文逐字（主 Agent 转录落盘，无敏感值）。

---

# S08 收官前独立验证报告（阶段 4 + 阶段 5）

> **参数头**：审核库 v2 ｜ 阶段 4/5 ｜ 验证对象 feat/s08-e2e-loopback@42dc490 ｜ 输入指针：docs/plans/2026-09-02-008-s08-e2e-loopback-plan.md（R1-R5）、docs/progress/progress-M5.md、tests/e2e/ 全量、git 面（796b011..42dc490 自核）｜ 偏离说明：无。
> 验证执行：独立 general-purpose Agent，与执行者上下文隔离；门墙提交态串行亲跑。

环境：node v22.23.2 / pnpm 11.7.0；分支 feat/s08-e2e-loopback @ 42dc490；验证起止 `git status --short` 均 clean；commit 链 796b011→bd25257→b67bcf3→ca4fe6d→2acfb01→bc5d068→42dc490 逐枚亲见。

## 一、R1-R5 逐条对峙

**R1 七场景 e2e 绿 — PASS**
- 亲跑 `pnpm vitest run tests/e2e/loopback.test.ts` → **7 passed (7)，357ms**。
- 断言面逐场景核对（tests/e2e/loopback.test.ts）：
  - 断网（:61-85）：reason 前缀正则 `/member dshws-tavily failed \(Tavily search request failed:/`（:78，closedPort 真连接拒绝 :62/:68）+ 到达序 `['POST /exa/search']`（:81）✓
  - 429（:87-107）：`toContain('HTTP 429')`（:102）+ body 缺省即 `{}`（loopback-server.ts:68 `action.body ?? {}`）+ 到达序 [tavily, exa]（:103）✓
  - 超时（:109-134）：`DSHWS_MEMBER_TIMEOUT: no result within 150ms`（:128）+ elapsed < 5000 下界式（:125，hang 永不应答，无紧上界）✓
  - 顺序保持（:136-162）：到达序逐位 = config 序 [tavily, exa, perplexity]（:151-155 vs :48 MEMBERS 序）✓
  - skip 不计序（:164-185）：exaEnabled:false → 零 exa 到达，恰 [tavily, perplexity]（:180）✓
  - 全败（:187-220）：`code === 'DSHWS_CHAIN_EXHAUSTED'`（:199）+ 三摘要行按走序（:202-207 indexOf 递增）+ `cause.code === 'DSHWS_PERPLEXITY_HTTP_ERROR'`（:211）✓
  - 钉死直连（:222-249）：`code === 'DSHWS_TAVILY_HTTP_ERROR'`（:240）+ 零 `[dshws-chain]` 日志行（:245 toEqual([])）+ 到达序恰 [tavily]（:243）✓
- servedBy content 首行断言：**5 处**（:74、:99、:122、:157、:181）≥3 ✓；logger served-by 行 3 处（:79、:129、:158）。

**R2 真实 API 自跳 — PASS**
- 本机 `DEEPSEEK_API_KEY`/`DEEPSEEK_BASE_URL` printenv 双缺（exit 1）。
- 亲跑 `pnpm vitest run tests/e2e.real/` → 5 files passed + 1 skipped (6)；**chain.real.test.ts 2 tests | 2 skipped 亲见**；全目录 5 passed | 8 skipped (13) = 6 既有 + 2 新自跳。
- `git diff 564554f..HEAD -- tests/e2e.real/` → 仅 chain.real.test.ts +49 行，既有五件零触碰 ✓。有 key 路径代码走查：env thunk + 120s timeout + servedBy 首行断言（chain.real.test.ts:14-39），沿 e2e.real 先例。

**R3 装配零回归 — PASS**
- 亲跑 `pnpm vitest run tests/apply.test.ts tests/chain/` → **44 passed (44)：apply 11 + chain 7+5+21=33**，全绿。
- 机械一致性：564554f 内联 fakeCtx vs tests/helpers/fake-ctx.ts 逐行比对——FakeCtx 接口/web 注册/credentials describe+resolve/inject（含 args[4]）/on/commitSettings/emitUpdated/flushGate 体逐字相同；**唯一行为差 = logger 捕获**（旧 `info: () => {}` → 新 push 进 logLines 并入返回句柄）。apply.test.ts 测试体 `describe` 起逐字节 diff 为空（TEST-BODIES-IDENTICAL）。tests/chain/ 与 tests/providers/ 对 564554f 零 diff。

**R4 门墙七命令（提交态串行亲跑）— PASS**
1. `git status --short` 前置 clean ✓
2. `pnpm test` → **23 passed | 1 skipped files (24)，203 passed | 8 skipped (211)** — 与台账逐字命中 ✓
3. `pnpm typecheck` → exit 0（双面 tsc）✓
4. `pnpm lint` → **0 warnings 0 errors，42 files，96 rules** ✓
5. `pnpm build` → node 面 **lib/index.js 49.00 kB + lib/index.d.ts 21.89 kB + client.js 20.54 kB**，与 S07 台账数字零漂移；`git diff 564554f..HEAD --stat` 全景 11 文件 = docs×6 + tests×5，**src/ 零触碰** ✓
6. `npm pack --dry-run` → total files: **5**（cordis.patch.yml / lib/client.js / lib/index.d.ts / lib/index.js / package.json），exit 0 ✓
7. `pnpm check:i18n` → exit 0（19 keys + 15 files）✓
- 跑完 `git status --short` 复验 clean ✓

**R5 五子证据 — PASS**
- 隔离：commit message 全文扫描（796b011^..HEAD）零实例/零浏览器/零 /tmp/零 3080/零 ~/.dsh；helper 端口 = `server.listen(0, '127.0.0.1')`（loopback-server.ts:37）ephemeral 亲读 ✓
- 门墙：R4 ✓
- 收尾件套 / 翻转：T8 未做（STATUS.md:27/:47 S08 仍 🚧）——按约不计 FAIL
- audit-log：`2026-09-02-s08-stage0-review-of-s07.md` + `stage2-plan-review.md` 已在 docs/sessions/audit-logs/ 亲见；stage45 未落（= 本输出随 T8 落，符合序列）

## 二、三问交叉验证

**1. 安全 — 通过。** 本棒全部动作 confined 仓内：diff 全景仅 tests/+docs/（11 文件），无 3080/~/.dsh/外部服务接触。lsof 亲查：跑完全量后**零 vitest/零 dsh-websearch node 进程残留**；仅存的 127.0.0.1:3080 监听（PID 90269）经鉴别 = deepseek-harness 仓自己的 `bin.js web --no-open`（cwd=/Volumes/IPFSJK/Zcode/deepseek-harness，启动于 2026-09-01 23:54，早于本棒），与本批无关。生命周期泄漏路径：hang 场景 teardown = `closeAllConnections()` + `close()` + `await once('close')`（loopback-server.ts:77-81）亲读成立；唯一覆盖缺口见发现清单 🟡-1（仅红跑路径）。

**2. 契约 — 通过。** ① 零外网依赖：loopback.test.ts 全部 URL 构造为 `http://127.0.0.1:${server.port}/…`；result 数据里的 `https://exa.test/…` 仅是 stub 返回的 JSON 载荷，从不被 fetch；chain.real.test.ts 触网但无 key 自跳。② closedPort TOCTOU：窗口 = close→fetch connect（毫秒级，中间隔 assemble 的 flushGate）；翻车需他进程恰在该窗口显式 bind 同一瞬时端口（概率可忽略）；且每条劫持分支都 fail-loud——立即断开 = 与拒绝 observable 等价（语义仍真）、挂起/垃圾/伪造 200 分别触发 :78 前缀 / :72 sources / :74 content 断言红，**无静默假绿路径**（helper :87-89 注释与实现一致）。③ 门墙无 key 可重放：本验证全程 DEEPSEEK_API_KEY 缺席，七命令全过，CI 视角成立。

**3. 前瞻 — 就绪。** ① Agent Note（docs/notes/2026-09-02-s08-e2e-loopback.md，47 行）已落 e2e 分层地图/loopback helper 契约/M1 可观察面口径/exa highlights 线材坑/牙齿证明/台架共享化——S09 文档棒测试节正素材在档，plan 008 D1-D7 可引。② M5 证据链按 roadmap 定义闭合：roadmap :54「e2e 收口全绿，文档自洽可复现——完成时填 ✅（Session 09 证据）」；本棒 R1（七场景亲绿）+ R2（自跳亲见）= e2e 腿关死，文档腿显式归 S09，STATUS 🚧 表述与之一致。③ 牙齿证明惯例有沉淀价值：plan 008 头部将其定为「验证类任务」的替代红手段（一次性变异探针→目标场景红→还原，红签名入 commit message 不入库），b67bcf3 实录了红签名——建议未来写入治理流程 note（验证类任务验收附变异探针证据），是 TDD 豁免域的可审计补位。

## 三、发现清单

- 🔴 ×0
- 🟡 ×1：**assemble() 内部失败路径的服务器泄漏缺口**——若 `flushGate()` 后的 `expect(chain.available()).toBe(true)`（tests/e2e/loopback.test.ts:56）或 apply 本身抛错，:44 起的服务器永不 close（测试体 try/finally :70/:84 未进入），文件头注释「a failing assertion cannot leak sockets into the next scenario」（:20-22）在 assemble 内部失败分支不成立。正面证据如上行 file:line。影响限定：仅已红跑、陈旧服务器零连接、每场景独立端口无断言串扰、worker 退出即回收——**不阻塞收官**；可选加固 = assemble 自身 catch-close 或测试先行入 try。
- 🟢 ×4：① T4 commit message「content 首行 ×4 场景」与该提交实际 5 处（git show 2acfb01 计数亲验）差一——簿记措辞级；② tsdown 弃用 WARN ×2 = 台账既有 🟢 观察债，非新增；③ 本验证器为 diff 核对临时写过 /tmp 两个比对文件（已删，非仓内受管文件，与执行棒隔离证据无关）；④ 建议将牙齿证明沉淀为验证类任务通用实践（前瞻③）。

## 四、最终结论

**PASS / COMPLETE** —— R1-R5 全条 PASS，三问全过，七场景/门墙数字与台账逐字吻合，src 零变更预期兑现，隔离法证成立；🟡 ×1 为失败路径低危测试缺口不阻塞。T8 收尾（session 记录/原子翻转/CHANGELOG/stage45 落盘）按序列待主 Agent 执行。
