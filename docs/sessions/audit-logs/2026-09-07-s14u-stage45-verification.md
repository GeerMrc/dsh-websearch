# S14u 阶段 4/5 独立验证（初审轮）— 2026-09-07

> 审核对象：Session 14u（T1-T6 六任务，commits 8709248/650f639/eafd095/1df8125/514cc82/3445ae3 + 50c6f1a，基线 539f199）。
> 审核方式：独立 Agent + 四维实测（计划符合性逐项 file:line 核验 / 探针×3 / 门墙串行亲跑 / git 状态）。
> 以下为审核输出原文（逐字），归档时点 = 执行者收到报告后、清偿提交前。

---

## 总结论：BLOCKED

六个任务的代码与测试全部落地且有判别力，但 `pnpm exec vitest run` 实测 **exit code = 1**（Unhandled Rejection，3/3 稳定复现），R5「门墙全绿」不成立。执行者验收时只读了 `315 passed | 9 skipped` 行，漏看了 `Errors 1 error` 行与退出码。修复成本极小（一行测试写法），但按门墙口径必须阻断。

## 一、🔴 清单（1 条）

**🔴-1 `vitest run` exit=1 —— T4 新测试的 chain rejection 裸露成 Unhandled Rejection**
- 来源：`tests/chain/search-chain.test.ts:617`「records the shared-budget exhaustion as a member-timeout reason when a redraw cannot start」（T4 新增，提交 1df8125）。
- 根因：`const settled = chain.search(...)` 创建 promise 后先 `await vi.advanceTimersByTimeAsync(2000)`，rejection（`DSHWS_CHAIN_EXHAUSTED`，src/errors.ts:127）在这段窗口内无 handler，被 vitest 捕获为 unhandled；之后才 `await settled.then(...)` 已太晚。同文件 ：525 测试直接 `.then()` 附加 handler 故安全，:564 测试最终 fulfilled 故不炸。
- 实测：连续 3 次运行 exit 均为 1，错误信息均指向该测试；`Errors 1 error` 稳定出现。
- 修复建议：创建时立即挂 handler，如 `const settled = chain.search({ query: 'q' }).then(() => { throw new Error('expected the chain to reject') }, (e: unknown) => e as Error)`，再 advance。
- 附带：产物测试数字本身达标（315|9，基线 305|9(314)，+10）。

## 二、🟡 清单（3 条）

**🟡-1 src/chain/core.ts:181-233 try/catch 块缩进错位（T4 引入）**
T4 在 for 循环体内插入 `remaining` 检查（8 空格缩进，core.ts:172-179）后，原 `try {`（:181）、`} catch`（:207）与 for 闭合 `}`（:234）仍停留在 6 空格——for 体内两级缩进并存，`} catch` 与 for 闭合括号视觉同级。oxlint 不查缩进，故 lint 0w0e 不覆盖。纯格式债，但对读代码者撒谎（暗示 try 在 for 体外）。

**🟡-2 src/index.ts:128 `?? 'order'` 与 T6 勘正后的权威默认矛盾（T6 漏改关联面）**
live key pool 投影处 `selection: () => live.current()[memberKey].keySelection ?? 'order'`。`live.current()` 恒为 `resolveConfig()` 产物（src/settings.ts:34-62），keySelection 运行时恒有值——该兜底不可达；但其字面默认 `'order'` 与 T6 刚勘正的语义（config.ts resolveConfig 六成员 `?? 'round-robin'` + 12 处 JSDoc「defaults to round-robin」）直接矛盾。存量行，但 T6 的 JSDoc 勘正范围漏掉了这个同名默认的关联面，应一并改为 `'round-robin'` 或删除死兜底。

**🟡-3 DeepSeek `enabled` 字段语义架空未在 src JSDoc 记录（T1 漏改关联面）**
- src/config.ts:74-75 `DeepSeekSettings.enabled` JSDoc 写「Defaults to `true`」——与 resolveConfig 实际默认 `?? false`（config.ts:328）矛盾（此句为 S10 存量失真，非本次引入）。
- 更重：T1 后 node 侧 gates 恒真（index.ts:151），该字段对链成员资格**完全无效**（成员资格唯一入口 = fallbackProvider 命名），但 JSDoc 无任何架空说明；src/client/controller.ts:10 头注释「`enabled: true` except the opt-in deepseek fallback」与 ：141-142「S14d: the deepseek fallback is opt-in (mirrors node resolveConfig)」同样保留已被架空的 opt-in 叙事。字段未死（GUI snapshot 三态判定 section.tsx:369 仍读它），但 cordis.yml 里写 `deepseek.enabled: false` 的用户预期落空且无文档面告知。

## 三、🟢 清单（符合性证据）

- 🟢 工作树干净（`git status` 空），HEAD = `50c6f1a`，提交链与声称完全一致（8709248/650f639/eafd095/1df8125/514cc82/3445ae3 + 50c6f1a，基线 539f199）。
- 🟢 探针全部还原：三次探针后 `git diff` 0 行、`git status --short` 0 条。

### T1（deepseek 兜底 enabled gate 恒真）— 符合
- src/index.ts:144-151：`memberKey === 'deepseek' ? true : live.current()[memberKey].enabled`，注释（:146-150）明确「membership governed SOLELY by fallbackProvider naming」。
- tests/apply.test.ts:15-27：精确坏象限——默认 config（无显式 deepseek section）+ `DEEPSEEK_API_KEY` + fallbackProvider=auto，断言 `chain.available() === true`（付费地板可达）。
- 判别力：探针 C 改回 `live.current()[memberKey].enabled` 后该测试真红（apply.test.ts:26 失败）。附带发现：loopback e2e 全败场景（assemble 不传 deepseek.enabled → resolveConfig 默认 false）同样钉住此修复。
- 验收 R1 成立。

### T2（hasMultiKeyPool 纳入策略）— 符合
- src/keys.ts:79-81：`return this.#lastKeyCount > 1 && this.#ports.selection() !== 'order'`，JSDoc（:71-78）说明 order 下重试同 key、retry gate 拒绝。
- tests/keys.test.ts:108-118：order + k1,k2 → `hasMultiKeyPool() === false`；round-robin → true。
- 判别力：探针 A 去掉策略判断后真红（keys.test.ts:113 失败）。
- 验收 R2 成立：order→gate false→`#drawsFor`（core.ts:153-155）返 1 draw；多 key 池（round-robin）→ 3 draw（search-chain.test.ts:686-708 断言 draws=3）。链路在 unit 层闭合（无独立 order+失败端到端 wire 测试，非缺口）。

### T3（loopback e2e 零外网）— 符合
- tests/e2e/loopback.test.ts 全文件 371 行：所有请求目标均为 `http://127.0.0.1:<port>/...`（:65-71）；grep 到的 `https://exa.test/a` 等仅为 mock 响应 body 数据，非请求。
- 全败场景 ：212-260：:224 `fallbackProvider: 'deepseek'` + :225 `deepseekAtLoopback: true`；:220-222 注释直言旧版「let the tail fetch-search hit html.duckduckgo.com for real」；:249-250 断言 `cause.code === 'DSHWS_DEEPSEEK_HTTP_ERROR'` + `cause.httpStatus === 500`；:251-256 断言 arrivals 含 `POST /deepseek/messages` 且恰好四次（全在 loopback）。
- 验收 R3 成立。

### T4（耗尽摘要按成员聚合 + 成员级共享预算）— 符合（但见 🔴-1、🟡-1）
- src/errors.ts:101-109 `ChainMemberFailure.drawReasons`；:118-132 `createChainExhaustedError` 每成员一行、多 draw 内联 `failed (3 draws: a; b; c)`、成员计数 `all ${failures.length}` 归真。
- src/chain/core.ts:168 每成员一个 `deadline`；:172-179 每 draw 用 `remaining`，耗尽时记录 `member budget of Nms spent after X draw(s)` 并 break（不起 0ms 假 draw）；:190-193 计时器用剩余时间。
- 三条 S14u 测试（search-chain.test.ts）：:525 聚合（断言 `all 2` 而非 4）；:564 共享预算（draws=2、backup 接棒 ≤1000ms 而非 1800ms）；:617 耗尽记录 timeout reason 且 draws=1（该测试本身有 🔴-1 的 handler 裸露问题）。
- 验收 R4 成立。

### T5（4xx 分流 + hint 文案 + 注释勘正）— 符合
- src/errors.ts:82-90 `DshwsError.httpStatus`；:99 `NON_RETRYABLE_HTTP_STATUSES = new Set([400, 401, 403, 404, 422])`。
- 六个 provider httpError 抛点均附 `{ httpStatus: status }`：tavily.ts:162、exa.ts:170、perplexity.ts:179、deepseek.ts:255、firecrawl.ts:250、anysearch.ts:166；anysearch HTTP-200 envelope 业务错误（anysearch.ts:178-183）第三参省略——不附，符合设计。
- 分流接线 core.ts:212-215 + :223-231（`deterministic HTTP 401` log 注明；429/5xx 走 redraw）。
- hint 文案两处：locales.ts:98（en「up to 3 attempts including the first」）与 ：150（zh「至多 3 次尝试（含首次）」）。
- keys.ts `#select` 陈旧注释勘正确认（514cc82 diff：'no same-member retry' → 'whether the chain redraws … is chain policy'）。
- 测试：search-chain.test.ts:657-684（401 → draws=1 + deterministic log）、:686-708（429 → draws=3）。判别力：探针 B 清空集合后 401 侧真红（:681 期待 1 draw 实得 3），429 护栏仍绿。

### T6（残渣清理）— 符合
- 四项 grep 全零（均 exit=1 无匹配）：`DSHWS_FIRECRAWL` in fetchsearch src+tests；`chainDefault|fallbackSwitch|sharedWithModelsDetail|keyFieldNote|chainDisabledNote` in src/client + tests/client；`fetchChain` in src/client；`defaults to \`order\`|defaults to 'order'` in src/config.ts。
- fetchsearch.ts:24 自有族 `MEMBER_ERROR_CODES.fetchsearch`（errors.ts:48-54 五码 + errors.test.ts:70-76 六族枚举同步）。
- exa.ts:159-163：detail 以 `message += `: ${detail}`` 拼接，`(HTTP ${status})` 前缀保留（与其余成员对称）。
- config.ts 12 处 JSDoc 勘正确认（3445ae3 diff 恰 12 行 `-`，order+ADR-0008 → round-robin+ADR-0011；与 resolveConfig 六处 `?? 'round-robin'` 一致）。
- memberDisabled 死分支删除（section.tsx map 由 body 形式改 expression 形式），全 repo `memberDisabled` 0 命中；fetchChain/fetchChainPinned 死字段删除（controller.ts diff）。
- GUI 假警告三态：section.tsx:366-379——`every(!(configured && enabled)) && showChains` 门控下三态：deepseek 兜底无 key → 红色 chainNoUsableWarning（locales.ts:112）；deepseek 兜底有 key → chainFloorDeepseekNote；fetch/auto → chainFloorFetchNote。边界核查（auto 经 controller.ts:158-160 投影为 facts 决定的 deepseek/fetch）：各象限文案与 node 实际行为一致，未发现假警告回归。

## 四、牙齿验证（3 个探针，超出要求的 2 个）

| 探针 | 撤销操作 | 结果 | 还原 |
|---|---|---|---|
| C（T1） | index.ts gates 改回 `live.current()[memberKey].enabled` | apply.test.ts S14u 真红（:26 available 断言失败） | diff=0 |
| A（T2） | keys.ts 去掉 `&& selection() !== 'order'` | keys.test.ts S14u 真红（:113 toBe(false) 失败） | diff=0 |
| B（T5） | errors.ts 集合清空为 `new Set([])` | 401 测试真红（:681 期待 1 draw 实得 3），429 侧仍绿 | diff=0 |

三探针均证明对应测试有判别力，非假绿；还原后 `git diff` 0 行。

## 五、门墙实测（串行亲跑）

| 命令 | 结果 | exit |
|---|---|---|
| `pnpm exec vitest run` | **315 passed \| 9 skipped (324)**，Test Files 29 passed \| 1 skipped；**Errors 1 error**（Unhandled Rejection，见 🔴-1） | **1**（3/3 复现） |
| `pnpm run typecheck` | tsc 双面无输出 | 0 |
| `pnpm run lint` | oxlint：0 warnings 0 errors（52 文件） | 0 |
| `pnpm run check:i18n` | check-locales: ok — 48 keys, union/en/zh parity；check-cjk: ok — 19 files, 0 CJK literals | 0 |

R5 不成立（vitest exit 1）；R6 不成立（新增 🔴×1 + 🟡×3，其中 🟡-2/🟡-3 为本 session 勘正/语义变化的漏改关联面，🟡-1 为本次引入）。

## 六、每任务符合性结论

| 任务 | 结论 | 备注 |
|---|---|---|
| T1 enabled gate 恒真 | 符合 | 关联面 JSDoc 未同步（🟡-3） |
| T2 hasMultiKeyPool 策略 | 符合 | — |
| T3 e2e 零外网 | 符合 | — |
| T4 聚合 + 共享预算 | 符合（实现与测试语义全对） | 新测试致 vitest exit 1（🔴-1）；core.ts 缩进（🟡-1） |
| T5 4xx 分流 + 文案 + 勘正 | 符合 | — |
| T6 残渣清理 | 符合 | index.ts:128 `?? 'order'` 漏改（🟡-2） |

**裁定：BLOCKED。** 阻断项仅 🔴-1 一条且为一行级修复（测试 handler 附加时机）；修复后建议顺带清偿 🟡-1（缩进）与 🟡-2（`?? 'order'`→round-robin），🟡-3 可随下次文档面收口。
