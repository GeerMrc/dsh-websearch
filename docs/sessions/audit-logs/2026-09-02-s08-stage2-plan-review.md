# Session 08 阶段 2 计划审核输出（两轮全文）

> **落盘说明**：本文件为 Session 08 阶段 2 独立审核 Agent 轮 1 与轮 2（同 Agent 点验）输出原文逐字（主 Agent 转录落盘，无敏感值）。审核对象：docs/plans/2026-09-02-008-s08-e2e-loopback-plan.md。

---

# 轮 1：Session 08 计划审核结论（阶段 2 独立审核）

> **参数头**：审核库 v2 ｜ 阶段 2 ｜ 审核对象 plan 008 ｜ 输入指针：docs/plans/2026-09-02-008-s08-e2e-loopback-plan.md、docs/session-roadmap.md（S08 行）、src/index.ts、src/chain/core.ts、src/errors.ts、src/providers/{tavily,exa,perplexity}.ts、tests/apply.test.ts、tests/e2e.real/tavily.real.test.ts、vitest.config.ts、package.json ｜ 偏离说明：无。
> 审核执行：独立 general-purpose Agent，与计划制定者上下文隔离，只读；dsh-ci-test-reliability SKILL.md 端口/生命周期原则对照 D1/D4。

## 结论

**NEEDS REVISION**（1 项必改：T2 验收要点含一个对现实现不可断言的字面标记；其余锚点 41 处亲验命中，D1-D7 设计整体成立）

## 必改清单（阻塞项）

**M1. T2「成员码入摘要（REQUEST_FAILED/HTTP 429/DSHWS_MEMBER_TIMEOUT）」中 REQUEST_FAILED 字面不可断言，且降级场景不存在「摘要」对象**

证据链：
- 链层记录失败时 reason 取的是 `error.message`，**不是 code**：`src/chain/core.ts:173-177`（`error instanceof Error ? error.message : String(error)`）。断网时成员抛 `DSHWS_TAVILY_REQUEST_FAILED` + message `"Tavily search request failed: TypeError: fetch failed"`（`src/providers/shared.ts:52`）——`REQUEST_FAILED` 这个字符串**不出现在 message、不出现在任何日志或摘要里**。
- 降级场景（断网/429/超时）链最终**成功**，不抛 `DSHWS_CHAIN_EXHAUSTED`，因此 `createChainExhaustedError`（`src/errors.ts:93-101`）根本不会被构造——T2 场景没有「摘要」对象可断言；失败痕迹唯一可见面是 logger 降级行 `[dshws-chain] member <id> failed (<reason>); degrading to next member`（`core.ts:179`）。
- 三个标记中只有两个成立：`HTTP 429` 在 reason 中出现（`tavily.ts:151`），`DSHWS_MEMBER_TIMEOUT` 是链层合成进 reason 的（`core.ts:174` + `errors.ts:18`）；`REQUEST_FAILED` 两条都不满足。
- 与计划自身的「src 零变更预期」（plan 头部 5-8 行）冲突：要让 `REQUEST_FAILED` 字面入摘要必须改 src——自相矛盾。

建议修法：T2 验收要点改为按可观察面书写——「logger 降级行含失败成员 id + 失败 reason（断网场景 reason 以 `<Label> search request failed` 开头；429 场景 reason 含 `HTTP 429`；超时场景 reason 含 `DSHWS_MEMBER_TIMEOUT`）；降级后胜出成员 servedBy」。`code` 级断言只保留在有异常对象可拿的场景（T4 直调、D5 全败 cause 链）。

## 建议清单（不阻塞，应吸收）

1. **429 stub body 形状需在 D4 钉死**：`unfoldHttpErrorDetail`（`src/providers/shared.ts:66-75`）命中 `error`/`detail`/`message` 形状时，exa/perplexity **替换** message（`exa.ts:163`、`perplexity.ts:172` `message = detail`），会丢掉 `HTTP 429` 字样；只有 tavily 是**追加**（`tavily.ts:155` `message += ': ' + detail`）。若 429 场景成员不是 tavily、或 body 带可展开 detail，D4 的「reason 含 `HTTP 429`」会红。修法：body 用无可展开 detail 的 JSON（如 `{}`），或把该断言钉在 tavily 成员上。
2. **实锚文件名漂移**：plan 背景/锚点两处写「apply.ts:187-193」「apply.ts:197」——仓库**不存在 apply.ts**，apply 函数在 `src/index.ts`（`:187-190` 为注册循环，`:188` 为 `ctx.web.registerSearchProvider`；双注册注释实为 `src/index.ts:144-148`）。行号本身命中，文件名应改。
3. **D5 全败场景的「refuse」行为形态**：单服务器单端口下，某一成员「拒绝连接」只能用 socket 级 destroy（产生 ECONNRESET），真 ECONNREFUSED 只能由 D4 的关端口路径产生。两者在 fetch 面的 observable 相同（`TypeError: fetch failed`），语义等价，但 T1 helper 契约应写明行为表里 refuse = 连接即断，避免执行者寻找「按路径拒绝」的不存在实现。

## 观察清单（留痕）

1. **D4 关端口 TOCTOU**：与 dsh-ci-test-reliability SKILL.md:35「Never scan for a free port and bind it later」的精神相邻但可接受——取端口后不绑定的窗口内若被其他进程抢占，失败签名会变成 HTTP_ERROR 类而非 `search request failed`，断言自捕红（fail-loud），不会静默绿。
2. **D7 新增链级真实 smoke 超出 roadmap「真实 API e2e 自跳」字面最小解**（既有五件已自跳即满足字面），属小步增层；有 key 路径仅代码走查（T5 口径），与既有 e2e.real 五件引入时同标，可接受。
3. **R4「门墙七命令」未逐名列全**（R4 枚举仅 6 个名字）——沿 S06/S07 先例口径，执行者按前 session 记录对照即可，建议 T6 台账里列明七件全名。
4. undici keep-alive 连接池跨场景残留由「每场景一服务器 + 换端口 + closeAllConnections」三重隔离兜住，无跨场景 bleed 路径。
5. e2e 需经 `gate.prime` 异步翻转 available（`src/index.ts:203`），抽取台架须保留 `flushGate`（apply.test.ts:83-85）——T1 机械迁移自然覆盖，计划未点名，留痕。
6. 牙齿证明（反转链序→红→还原）与 reliability skill「Prove the intended regression」（临时引入被拒案例观察失败）及 S03 T8 变异校验先例（session-03 记录 T8 行）三方一致。

## 锚点核对结果摘要

**41 处亲验命中，3 处偏差（1 必改 + 2 建议），0 处虚构。**

| 组 | 结果 |
|---|---|
| 装配层 | index.ts:89-206 ✓；gates = enabled+credentialsReady（:112-115）✓；双注册同一实例（:187-190 同一 `provider` 对象传入两处）✓ |
| 台架 | apply.test.ts:26-81 fakeCtx 全形状 ✓（providers Map :29/:38、configured Set、settings hooks、emitter、flushGate :83-85）；e2e 扩展点（logger 捕获 / configured Set 控 ref）在现形状上可达 ✓ |
| 链层 | core.ts:133-184 run ✓；:162 served-by 日志格式逐字符 ✓；:171 caller-abort 直传 ✓；:204-210 withServedBy 首行/单行 ✓ |
| 超时语义 | core.ts:148-161 timer 同步 reject MEMBER_TIMED_OUT ✓；:160 `memberPromise.catch(() => {})` 吞迟到 rejection ✓——「e2e 无 unhandled rejection 风险」结论**可靠** |
| 错误层 | errors.ts:93-101 逐行 + 末位 cause ✓；`DSHWS_MEMBER_TIMEOUT: no result within Xms`（core.ts:174 + errors.ts:18）✓ |
| HTTP 面 | tavily.ts:130 / exa.ts:136 `POST {base}/search` ✓；perplexity.ts:146 `POST {base}/chat/completions` ✓；content 载体仅 perplexity（:115-127）——「署名断言用 perplexity 胜出」**成立** ✓ |
| 发现面 | vitest.config 无 include → tests/e2e 自动入 `pnpm test` ✓；22 个测试文件（18 .test.ts + 4 client spec）✓；基线 202 it ✓；chain 33 ✓；client 39 ✓；e2e.real 现状 skipped = 6（firecrawl 块 2 + 其余各 1）✓；skip 模式 tavily.real.test.ts:12-13 ✓ |
| settings/entry 权威 | settings.ts:70-83 缺席 no-op ✓；index.ts:197 调用点 ✓；config.ts 各成员 baseURL 可指 loopback（:200-224）✓ |
| D1 环境断言 | node v22.23.2 亲测 `closeAllConnections` 为 function ✓；`listen(0)` → `address().port` 亲测可用 ✓ |
| 任务源 | roadmap S08 行（session-roadmap.md:51）七场景 + 三断言要素与 R1/T2-T4 逐字吻合 ✓；S03 T11 范围锚定原文在 s03 plan:73 ✓；STATUS.md:46-48 S08 = 下一前沿 ✓；audit-logs 目录与命名先例（s0X-stage0-review-of-s0Y）✓；progress-M1..M4 在 docs/progress/，M5 新开口径一致 ✓ |
| TDD 适用域 | six-stage.md:109-110（契约类先红 / 重构类禁证红 / 其余须有验证手段且回归不红）——e2e 场景归验证类 + 牙齿证明，**归类恰当** ✓；「src 零变更 ↔ 暴露 bug 转 TDD 红→绿」边界清晰 ✓ |

**终判**：计划骨架、范围决策 D1-D7、WBS 覆盖（roadmap 三验收要素 + 真实 API 自跳 + 回归口径）全部可落地；唯一阻塞是 M1 的验收措辞与实现可观察面脱节——按建议修法改 T2（顺带吸收建议 1-3）后即可 **APPROVED**，无需重开阶段 2 全量审核，仅需对 M1 修订做点验。

---

# 轮 2：阶段 2 复审（同 Agent 点验）

> **参数头**：审核库 v2 ｜ 阶段 2 复审 ｜ 续用轮 1 同一审核 Agent ｜ 复核范围：修订点六处（M1 + 建议 ×3 + 观察 3/5 落实 + 轮 1 留痕忠实性），未重开全量锚点核对。

## 结论

**APPROVED**（六项修订点全数闭合；2 条纯措辞级残留不阻塞，随执行自然消化）

## 点验明细

**1. M1（必改）— 闭合。** T2（plan:88）断言面已改为 logger 降级行的可观察内容，与实现逐项对上：`<Label> search request failed` 前缀 = `shared.ts:52` 的 message 构造（`${label} search request failed: …`）；`HTTP 429`（钉 tavily + body `{}`）= `tavily.ts:151` 状态字样保留、`{}` 经 `unfoldHttpErrorDetail` 得 undefined 不改动 message；`DSHWS_MEMBER_TIMEOUT` = `core.ts:174` 合成标记。「降级场景链最终成功，无摘要对象可断言」陈述与 `core.ts:133-184` 一致（胜出即 return，不构造 CHAIN_EXHAUSTED）；code 级断言收缩到 T4 直调 / T3 全败两处有异常对象在手的位置。虚假断言面（REQUEST_FAILED 字面 + 幽灵摘要对象）已清零。

**2. 建议 1（429 body）— 闭合。** D4（plan:77）双重保险：body 钉 `{}` + 成员钉 tavily，并注明 `shared.ts:66-75` 三成员替换/追加不对称的依据（exa/perplexity 替换、tavily 追加）——与轮 1 亲证一致。

**3. 建议 2（文件名漂移）— 闭合。** 实锚改为 `src/index.ts:144-148` 注释 + `:187-190` 注册循环，两处亲读复验逐字命中。全仓 grep `apply.ts`（排除 apply.test.ts）仅剩 plan:35 轮 1 留痕内的引用——属审核史实，非活锚点，合规。

**4. 建议 3（refuse 契约）— 闭合。** D5（plan:78）写明单端口内 refuse = 连接即断（socket destroy → `TypeError: fetch failed`，与真 ECONNREFUSED 在 fetch 面 observable 等价），真连接拒绝归 D4 关端口路径，helper 不提供「按路径拒绝」形态；T1（plan:87）行为表枚举 success/status/hang/destroy 并带「destroy=连接即断」契约。

**5. 观察 3/5 — 到位。** T6（plan:92）七命令逐名列全（test/typecheck/lint/build/`npm pack --dry-run`/check:i18n + `git status --short` 前置为证，「七件全名入台账」）；T1 点名保留 `flushGate` 并写明 gate.prime 异步翻转 available 的理由。

**6. 轮 1 留痕节 — 忠实。** plan:31-40 与轮 1 输出逐项对照：必改×1、建议×3、观察×6 全部在列且无失真；「41 处锚点亲验命中 0 虚构」与轮 1 摘要一致；audit-log 正本命名 `s08-stage2-plan-review.md` 符合既有 `s04-stage2-plan-review.md` 先例；轮 2 占位（plan:42）规范。

## 残留项（非阻塞，不设整改义务）

1. **术语残留（纯措辞）**：D1（plan:74）行为表仍写「refuse-连接」，T1 枚举用「destroy」——D5 契约已钉死两者同义，无矛盾，执行时以 D5 契约为准即可。
2. **「七命令」算术（台账时点自明）**：T6 列名 6 条命令，「七件」靠 build/typecheck 的 node+client 面拆计——计划已把这步显式推迟到台账「七件全名入台账」，届时列明即可。

**放行**：plan 可进入阶段 2.5 人工终审 → 阶段 3 执行。轮 2 结论：APPROVED（同 Agent 点验，2026-09-02，六修订点全闭合，残留 ×2 非阻塞措辞级）。
