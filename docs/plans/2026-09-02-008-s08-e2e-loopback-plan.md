# Plan — 2026-09-02-008-s08-e2e-loopback-plan

> plan 是验收契约：R 验收条目是 progress 台账阶段验收的对照正本，验证矩阵是各阶段验证的
> 单源引用。本棒为 e2e 测试收口棒：**src 零变更预期**（S03 链语义已实现并有 fake 层测试，
> S04/S05a 有 fetch-stub 层单测——S08 补的是真实 HTTP 回环 + 全装配层）；e2e 场景属
> 验证类（TDD 适用域：须有验证手段且回归不红，不强制先红），牙齿证明走一次性变异探针
> （临时改装配 → 目标场景红 → 还原，留痕不入库）。若场景暴露真实产品 bug：修复属
> 「场景收口」字面范围，修复任务转 TDD 红→绿。

## 目标

S08 交付 roadmap ⏳ 行「e2e 场景收口」：loopback stub（本机 HTTP 服务器脚本化成员行为）
+ 全装配 e2e（entry config → 真实 `apply()` → ctx.web 注册表 → 链）打穿七场景——断网降级 /
429 降级 / 超时降级 / 全败报错 / 顺序保持 / servedBy 透出 / 钉死直连不降级；时序断言
（失败成员→下一成员的调用序）、`DSHWS_CHAIN_EXHAUSTED` + 逐成员摘要断言、content 首行
署名断言逐条落地。真实 API e2e 保持自跳（+ 链级真实 API smoke，无 key 自跳）。

## 背景

任务源 = `docs/session-roadmap.md` Session 08 ⏳ 行；语义正本 = ADR-0002（链语义 +
servedBy content 首行 + 钉死直连拓扑）+ 架构 §4；S03 T11 范围锚定说明：「⑧端到端闭合
（真实上游标量钉死成员）由 S08 loopback 场景收口」——S03 验收面为插件自有注册层，
S08 补真实网络层。

阶段 0 独立审核（2026-09-02，骨架库 v2，正本将随 T0 落
`docs/sessions/audit-logs/2026-09-02-s08-stage0-review-of-s07.md`）：对 S07 **PASS**——
🔴×0；🟡 新增×0；测试面 client 39 passed + chain 33 passed（tests/chain 零变更零破坏，
S08 前置面成立）+ check:i18n exit 0；9 commits 逐枚吻合；🟡 三笔清偿核验（誊写指针化 /
STATUS 四处口径一致 / dont-do 第四条 / ~/.dsh 措辞）；🟢×3 归属一致。

阶段 2 独立审核轮 1（2026-09-02，独立 Agent，41 处锚点亲验命中 0 虚构）：**NEEDS
REVISION**（必改 ×1：M1 T2「REQUEST_FAILED 入摘要」断言脱离实现可观察面——链层 reason
取 error.message 非 code〔core.ts:173-177〕且降级场景链最终成功无摘要对象可断言，修法 =
按 logger 降级行可观察面书写、code 级断言只留异常对象在手处；建议 ×3：429 body 形状钉死
〔unfoldHttpErrorDetail 三成员替换/追加不对称〕/实锚文件名 apply.ts 漂移→src/index.ts/
helper「refuse」形态 = socket destroy 写明契约；观察 ×6：关端口 TOCTOU fail-loud 可接受 /
D7 链级 smoke 属小步增层可接受 / R4 七命令全名入台账 / keep-alive 三重隔离无 bleed /
flushGate 须随台架迁移 / 牙齿证明与 reliability skill 三方一致）。本 plan 为修订版：
必改 + 建议全数吸收（观察随批落实）。正本将随 T0 落
`docs/sessions/audit-logs/2026-09-02-s08-stage2-plan-review.md`（两轮全文）。

阶段 2 独立审核轮 2（同 Agent 点验，六修订点全闭合）：**APPROVED**（残留 ×2 非阻塞
措辞级：D1 行为表「refuse-连接」与 T1「destroy」同义——执行以 D5 契约为准；「七命令」
算术由台账时点列明。M1 修订逐项与实现对上：`<Label> search request failed` =
shared.ts:52、`HTTP 429` 保留 = tavily.ts:151 + `{}` 不触发 unfold、
`DSHWS_MEMBER_TIMEOUT` = core.ts:174；虚假断言面清零；audit-log 命名符合同构先例）。
正本将随 T0 落 `docs/sessions/audit-logs/2026-09-02-s08-stage2-plan-review.md`（两轮全文）。

阶段 1 只读摸底实锚（2026-09-02 亲测，master@564554f）：

- 装配层：`src/index.ts:89-206`（apply：Config→resolveConfig→链+成员双注册；gates =
  enabled+credentialsReady；`ctx.web.registerSearchProvider` 逐 id）；台架先例 =
  `tests/apply.test.ts:26-81`（fakeCtx：providers Map + configured Set + credentials
  fake + settings hooks + 事件 emitter + `flushGate`）
- 链层：`src/chain/core.ts:133-184`（run：order 逐个 → #isUsable 选用门 → AbortController
  + MEMBER_TIMED_OUT race → catch 降级 → failures 摘要；:162 served-by 日志行；:171
  caller-abort 直传不降级）；`:204-210` withServedBy（content 首行，无 content 时单行）
- 错误层：`src/errors.ts:93-101`（DSHWS_CHAIN_EXHAUSTED：`- memberId: reason` 逐行 +
  末位 error 作 cause）；超时 reason 带 `DSHWS_MEMBER_TIMEOUT: no result within Xms`
  （core.ts:174）
- HTTP 面：tavily/exa `POST {baseURL}/search`（tavily.ts:130、exa.ts:136；success
  `{results:[…]}`，tavily 不产 content）；perplexity `POST {baseURL}/chat/completions`
  （:146；success `choices[0].message.content` → **WebSearchResult.content 载体**——
  content 首行署名断言用 perplexity 胜出场景）；全部成员 `baseURL` config 可指 loopback
  （config.ts 各成员 baseURL 字段）
- 超时语义：timer 回调同步 reject MEMBER_TIMED_OUT 先于 AbortError 进 race（core.ts:148-161），
  成员迟到 rejection 被 `memberPromise.catch(() => {})` 吞（:160）——e2e 无 unhandled
  rejection 风险
- 既有 e2e 分层：tests/e2e.real/ 五件 provider 级真实 API smoke（env key 自跳模式
  `describe.skip`，tavily.real.test.ts:12-13）；链级真实 API 测试不存在（S08 补）
- vitest 发现面：默认 include `**/*.test.ts`——新 tests/e2e/ 目录零配置即入 `pnpm test`
- 钉死直连拓扑：成员以同一实例双注册（`src/index.ts:144-148` 注释 + `:187-190` 注册循环同一
  `provider` 对象传两处）——从 ctx.web 注册表取成员实例直调 = 宿主标量钉死的等价调用路径

## 范围决策（D1-D7，供阶段 2 审核判定层级）

| # | 决策 | 依据 |
|---|---|---|
| D1 | loopback stub = `node:http` 真实监听服务器（127.0.0.1 + `listen(0)` 瞬时端口，零固定端口）；**每场景一服务器**（beforeEach 生命周期，防行为表跨场景 bleed）；按路径前缀路由成员（`/<member>/…`），行为表脚本化（refuse-连接 / 状态码 / 挂起 / 成功 JSON）；到达序日志（跨成员单调序号）= 时序断言正本；teardown `close()` + `closeAllConnections()`（挂起 handler 强制收口，Node ≥18.2） | 「loopback」字面 + S03 T11 范围锚定（端到端闭合）；vi.stubGlobal fetch（S04 层）不满足「真实调用序」与「真实网络故障」语义；dsh-ci-test-reliability 纪律（瞬时端口/closeAllConnections/无跨测试共享可变态） |
| D2 | 场景成员 = tavily / exa / perplexity 三搜索成员（REST 形状最简）；deepseek（chat 形状）与 firecrawl 不入 loopback 矩阵——七场景语义均成员无关（链层语义，S03 已证），引入只为线材复杂度；**fetch 链不入矩阵**（ChainCore 同核，S03 已测；roadmap 七场景全 search 面） | 七场景字面无 fetch；线材最小化；范围纪律 |
| D3 | 装配 = 真实 `apply()` 经共享台架：**fakeCtx 抽取至 `tests/helpers/fake-ctx.ts`**（机械迁移 tests/apply.test.ts，回归零破坏）+ e2e 扩展点（logger 行捕获 / per-ref resolve）；链序与 baseURL 全走 entry `config`（`searchChain` + 各成员 `baseURL` 指 loopback，settings 服务缺席 = entry 权威，settings.ts no-op 分支） | tests/apply.test.ts:26-81 台架先例；测试文件间复制台架 = duplication 债；entry-config 权威分支已在 apply/settings 实现并有测试 |
| D4 | 断网场景实现 = **已关闭端口**（起服→取端口→即关，用该端口连接拒绝）——不用固定保留端口；429 = stub 返回 429 + **无可展开 detail 的 body（`{}`）**（若 body 带 `error`/`detail`/`message` 形状，exa/perplexity 会以 detail **替换** message 丢掉 `HTTP 429` 字样，仅 tavily 追加——429 场景成员钉 tavily，reason 含 `HTTP 429`）；超时 = stub 挂起 handler + `perMemberTimeoutMs: 150`（摘要 reason 带 `DSHWS_MEMBER_TIMEOUT` 标记；elapsed 远小于挂起时长断言链未等满 handler） | core.ts 超时路径语义（摸底实锚）；shared.ts:66-75 unfoldHttpErrorDetail 三成员替换/追加不对称（审核轮 1 建议亲证）；确定性（连接拒绝可复现，不依赖外部网络） |
| D5 | 全败场景 = 三成员三种失败形态（refuse / 429 / 200 坏 JSON）→ 断言 `code === 'DSHWS_CHAIN_EXHAUSTED'` + message 含三条 `- dshws-…: <reason>` 逐成员行 + `cause` = 末位成员 error。**helper 契约（审核轮 1 建议 3）**：单端口服务器内「refuse」= 连接即断（socket destroy → `TypeError: fetch failed`，与真 ECONNREFUSED 在 fetch 面 observable 等价）；真连接拒绝由 D4 关端口路径承担，helper 行为表不提供「按路径拒绝」形态 | errors.ts:93-101 契约；ADR-0002 Decision 3；审核轮 1 建议亲证 |
| D6 | servedBy 透出双承载断言：①result.content 首行 === `` `[served-by: dshws-perplexity]` ``（perplexity 胜出场景，content 载体有正文）；②ctx.logger 捕获含 `[dshws-chain] served-by: …` 行。钉死直连不降级 = 从 ctx.web 注册表取 `dshws-tavily` 实例**直调** search（= 宿主标量钉死等价路径）+ 其端点 500 → 抛 `DSHWS_TAVILY_HTTP_ERROR`（成员码原样，无 CHAIN_EXHAUSTED 包装）+ 到达序日志证明其他成员端点零命中 | 摸底实锚（tavily content 缺省→单行载体；perplexity content 载体；双注册拓扑 = 同一实例）；架构 :70-72 |
| D7 | 真实 API e2e 自跳 = 既有五件 provider 级不动 + **新增链级 smoke `tests/e2e.real/chain.real.test.ts`**（DEEPSEEK_API_KEY 缺席 `describe.skip`；ChainSearchProvider + 单成员注册表 + env key resolver → 真实搜索 → servedBy 首行断言，timeout 120s）——链层此前无真实 API 覆盖（摸底实锚），补层不重复；本地无 key 全跳（skip 计数 +1 口径与 6 skipped 现状一致） | roadmap S08 WBS「真实 API e2e 自跳」字面；e2e.real 自跳模式先例（:12-13）；M3 with-key 用户槽位不受影响（测试仅在有 key 环境跑） |

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 类别 | 前置 |
|---|---|---|---|---|
| T0 | 治理批（master 直提）：本 plan 落盘 + 阶段 0/2 audit-log 转录 + STATUS 启动刷新（S08 🚧 行 + 位置块 + M5 段表述）+ progress-M5.md 台账新开 | `git status` 前置 + 一 commit；STATUS/progress 状态区按 dont-do 第三条七处清单核对 | 治理（机械豁免候选） | 阶段 2.5 批准 |
| T1 | 台架抽取 + loopback helper：fakeCtx → `tests/helpers/fake-ctx.ts`（apply.test.ts 机械迁移，**保留 `flushGate`**——e2e 需经 gate.prime 异步翻转 available）+ `tests/e2e/helpers/loopback-server.ts`（瞬时端口/行为表〔success/status/hang/destroy〕/到达序日志/closedPort fixture/teardown） | apply.test.ts 全绿零漂移（机械迁移）；helper 有 JSDoc 契约（运行口径：每场景一服务器；行为表形态枚举含 destroy=连接即断）；helper 冒烟（起服→请求→断言序号→关服）随 T2 场景首跑兑现 | 测试基建（机械/工具，不强制先红） | T0 |
| T2 | 场景批 A：断网降级 / 429 降级 / 超时降级（全装配 e2e：config→apply→链） | 三场景绿 + 断言落在**可观察面**（审核轮 1 必改 M1 修法）：logger 降级行含失败成员 id + reason——断网场景 reason 以 `<Label> search request failed` 开头、429 场景 reason 含 `HTTP 429`（成员钉 tavily + body `{}`）、超时场景 reason 含 `DSHWS_MEMBER_TIMEOUT`；降级后胜出成员 servedBy（content 首行 + logger 行）。**code 级断言只保留在有异常对象可拿处**（T4 直调 / T3 全败）——降级场景链最终成功，无摘要对象可断言。**牙齿证明**：临时反转 config 链序 → 顺序断言红 → 还原（留痕 commit message，不入库） | 验证类（回归不红） | T1 |
| T3 | 场景批 B：顺序保持（时序断言 = 到达序日志逐位等于 config 序）+ 全败（D5 三断言） | 两场景绿；顺序场景含「skip 成员不计序」子断言（disabled 成员跳过不产生到达记录） | 验证类 | T1 |
| T4 | 场景批 C：servedBy 双承载（D6①②）+ 钉死直连不降级（D6 直调 + 成员码 + 零串扰） | 两场景绿；直连场景断言成员码精确 === `DSHWS_TAVILY_HTTP_ERROR` 且 `code` 不含 CHAIN | 验证类 | T1 |
| T5 | 链级真实 API smoke（D7）：tests/e2e.real/chain.real.test.ts | 无 DEEPSEEK_API_KEY 时 skip（本地实测亲见 skipped 计数 +1）；有 key 路径代码走查（endpoint/model 锚沿用 e2e.real 先例） | 测试（自跳验证） | T1 |
| T6 | 门墙 + 台账：七命令提交态亲跑（`pnpm test` / `pnpm typecheck` / `pnpm lint` / `pnpm build` / `npm pack --dry-run` / `pnpm check:i18n`，提交态以 `git status --short` 前置为证——七件全名入台账）+ progress-M5 批次表/门墙表 + Agent Note（docs/notes/2026-09-02-s08-e2e-loopback.md：loopback 配方/牙齿证明/场景-语义映射） | 门墙数字亲见落台账；基线 202 → 新基线（+场景数，零破坏）；**src 零变更预期核验**（git diff 触 src 则逐笔披露）；node 面 build 零漂移 | 门墙+文档 | T5 |
| T7 | 阶段 4/5 独立验证（独立 Agent）：R1-R5 逐条对峙 + 门墙亲跑（提交态）+ 隔离法证（本棒无实例/无浏览器——端口 ephemeral + teardown 核验）+ 三问 | PASS / COMPLETE；audit-log 正本落盘 | 强制独立 | T6 |
| T8 | 收尾：session 记录（三 ★ 节）+ STATUS/roadmap ✅ 原子收官 + CHANGELOG + progress 状态区 + `--no-ff` 合入 + 接力指令 | 6 件套齐；M5 判定按 roadmap 定义（本棒 = e2e 收口全绿腿；文档腿归 S09——M5 保持 🚧 至 S09） | 收尾 | T7 |

## 验收条目（R1-R5，progress-M5 阶段验收逐条对应）

| # | 条目 | 对应 roadmap 验收 |
|---|---|---|
| R1 | 七场景 e2e 绿：断网降级/429 降级/超时降级/全败/顺序保持/servedBy/钉死直连——每场景断言要点落在 plan D4-D6（时序断言 = 到达序日志；`DSHWS_CHAIN_EXHAUSTED` + 逐成员摘要；content 首行署名） | 「各场景 e2e 绿（时序断言…；…摘要断言；content 首行署名断言）」 |
| R2 | 真实 API e2e 自跳：五件既有不动 + 链级 smoke 自跳实测（无 key 环境 skipped +1 亲见） | 「真实 API e2e 自跳」 |
| R3 | 装配零回归：fakeCtx 抽取后 apply.test.ts 全绿零漂移；tests/chain 33 零破坏；全量 `pnpm test` 新基线零破坏 | 回归纪律 |
| R4 | 门墙七命令（提交态）：test/typecheck/lint/build（**node+client 三件与本棒起点零漂移——src 零变更预期**）/pack/check:i18n | 门墙纪律（S06/S07 口径延续） |
| R5 | 五子证据：隔离（无 3080/~/.dsh 接触；端口 ephemeral + teardown 断言）/门墙/收尾件套/原子翻转/audit-log 三份 | 收官序列惯例 |

## 验证矩阵

| 验证 | 时点 | 责任 | 证据落点 |
|---|---|---|---|
| helper 冒烟（起服→请求→序号→关服） | T2 首场景兑现 | 主 Agent | 场景测试本身 |
| 牙齿证明（链序反转 probe 红→还原） | T2 | 主 Agent | commit message 实录 |
| 七场景 + 真实 API 自跳 + 全量回归 | T2-T5 每批 + T6 全量 | 主 Agent | commit + progress-M5 门墙表 |
| 门墙七命令（提交态） | T6 + T7 复验 | 主 Agent → 独立 Agent | progress-M5 |
| R1-R5 对峙 + 隔离法证 + 三问 | T7 | 独立 Agent | audit-logs/…-s08-stage45-verification.md |
| STATUS/roadmap/progress/CHANGELOG 原子收官 | T8 | 主 Agent | 四件同序列 diff |

## 高危命令预告（阶段 2.5 披露，对照 governance §3.4.7 清单）

1. **无新增高危项**——本棒零实例、零浏览器、零 /tmp 写入、零依赖变更（纯仓内测试层）。
2. 门墙与测试全程 `pnpm`（nvm node 22）；loopback 服务器瞬时端口仓内进程内起停。
3. 不涉及：push/publish/merge（T8 `--no-ff` 本地合入沿 S06/S07 先例披露）、删除、reset、
   凭据、系统配置、治理产物删除。

## 债务归属映射（正本）

| 债务 | 等级 | 归属 |
|---|---|---|
| L-2 per-profile GUI 覆盖二期候选 | 🟢 | 维持不排期 |
| fetch 链排序 UI | 🟢 | 维持不排期（S07 登记） |
| 「恢复默认序」按钮 | 🟢 | 维持不排期（S07 登记） |
| firecrawl fetch 面 402/429 it 独立覆盖（M3 观察） | 🟢 观察 | 本棒 loopback 不含 fetch 链（D2）；若 S08 场景延伸需覆盖则升格任务，否则 S09 复核 |
| i18n CI 接线 | 🟢 观察 | 维持 S09 手册项 |
| tsdown 弃用 ×2 / vitest sourcemap / s06 mtime 口径 | 🟢 观察 | 维持 |

## 风险

- **本机 fetch 对 127.0.0.1 的代理环境变量**：若 shell 带 `http_proxy`/`HTTPS_PROXY`，undici
  默认不走代理（Node fetch 不读 env proxy）——回环直连成立；T2 首场景即验证真实回环连通，
  连不通属环境问题 fail-loud 不静默。
- **挂起 handler 的 socket 残留**：closeAllConnections 兜底（D1）；若 Node 版本线异常则该
  场景超时红——fail-loud。
- **超时场景时序脆弱性**：150ms 预算 + 本机回环 RTT（<5ms）裕量充足；CI 慢机风险由
  「elapsed < 挂起时长」断言的下界式写法兜住（不设过紧上界）。
- **真实 API smoke 撞真实端点漂移**：无 key 本地自跳，有 key 环境（CI/用户机）才触网——
  漂移时该 it 红，属上游契约变化信号，fail-loud 可接受。
