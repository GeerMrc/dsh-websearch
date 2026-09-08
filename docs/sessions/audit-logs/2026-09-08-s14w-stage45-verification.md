# S14w 阶段 4/5 独立验证 — 2026-09-08

> 审核对象：Session 14w（T0-T4，commits 34a8a7e/53c0865/59a3d92/117ed11，基线 master f9a54ca）。
> 以下为审核输出原文（逐字）。

---

## 🔴 阻塞项

无。

## 🟡 非阻塞新债

无。以下两个探查点均核销为 🟢（备注级，不构成债）：

1. **sequence 嵌套收窄**：`LoopbackBehavior.steps: LoopbackBehavior[]`（tests/e2e/helpers/loopback-server.ts:33）类型上允许嵌套 sequence，运行时会落 `respond(res, 500, { error: 'unhandled behavior kind' })`（loopback-server.ts:98）——fail-loud 不静默；本仓库 AGENTS.md 无 assertNever 约定；无任何测试使用嵌套 sequence。**hang/destroy 在 sequence steps 内可达且被正确处理**（handler :82/:86 在 status/success 分支之前，shift 出的 steps 元素与顶层行为走同一分发）。
2. **hint 文案「至多 3 次」准确性**：实测 master core.ts `#drawsFor`（≈:152-155）= `multiKeyPool ? MEMBER_DRAWS(3) : 1`；keys.ts:60-77 `hasMultiKeyPool` 对首轮冷启动（`#lastKeyCount=0`）和 order 策略均返回 false → 1 draw。冷启动 1 次、单 key 1 次、order 1 次全部 ≤ 3，**「至多」上界语义无矛盾**；T4 手册另披露「含首次；order 策略不换把」+ 暖启动节，比 hint 更细一层，两级文案一致。

## 🟢 逐项核验清单

**git 状态**：工作树干净；HEAD=`117ed114f7b543ff9b6b33c79869e0595a0ec529`；merge-base=`f9a54ca` = master HEAD（2026-09-08）；提交链 34a8a7e→53c0865→59a3d92→117ed11 与计划 T0→T4 一一对应。

**T1 主备 e2e**（tests/e2e/loopback.test.ts:283-336）：
- 暖场搜索 served-by tavily 断言（:319 `[served-by: dshws-tavily]`）✓
- 探测搜索 tavily 三 draw k2/k3/k1 轮换（round-robin）后 firecrawl 接力（:332 auths 全序断言 `['Bearer k1','Bearer k2','Bearer k3','Bearer k1','Bearer fk1']`）✓
- arrivals 五请求全序断言（:325-331）✓；`firecrawlAtLoopback` 注入（loopback.test.ts:44-45,73）✓
- harness sequence「耗尽重复末步」实现正确（loopback-server.ts:61-73：`queue.shift() ?? repeatLastStep(steps)`，空 steps 兜底 500）✓

**T2 纯呈现核验**（src/client/section.tsx:345-350）：
- primary 仅 `index === 0`；standby 需 `visibleSearch.length > 1 && index === visibleSearch.length - 1`；`visibleSearch` = configured && enabled 过滤（section.tsx:258-260）✓
- **`git diff master..HEAD -- src/` 仅 locales.ts + section.tsx 两文件**；controller.ts / src/chain/ / config.ts / index.ts 零改动——纯呈现按构造成立 ✓
- 文案 locale-owned（新键 chainRolePrimary/chainRoleStandby 入 typed dictionary，en/zh parity）✓

**T3 B2 v2 落档**（docs/plans/2026-09-08-014w-b2-member-tail-extension-v2.md）：5 落点表 ✓ + 3 待定义规则 ✓ + 2 ADR 修订面（ADR-0004 D3 + ADR-0013 D6）✓ + 前置依赖（S15 B1 先行）✓。**file:line 逐一在 master f9a54ca 实测命中**：config.ts:38（FallbackProvider union）、:60-63（withFallbackTail）、:195（z.union fail-loud）；index.ts:144-155（gates deepseek 恒 true 特例）、:165-175（order getter 每请求替换链尾）；section.tsx:546-597（DeepSeekFallbackRow 两按钮）；controller.ts:160-162（快照投影二元化）、:308-324（moveSearchChainEntry）——文档自声明「以 2026-09-08 master 为准」，与 master HEAD 日期自洽（HEAD 上 section.tsx 因 T2 +20 行漂移，不改判）。

**T4 手册素材**（docs/notes/2026-09-08-s14w-env-and-primary-standby.md）：解法 A（Redir-Host，推荐）/ B（fake-ip-filter 白名单）/ C（firecrawl 插件路径 + 约束披露）✓；dig 判据（`dig +short github.com` 不再回 198.18.x.x）✓；主备语义（链序即主备序 + 内置地板殿后 + 未配 key 不占位）✓；暖启动披露（首轮仅 1 次尝试）与 keys.ts JSDoc 逐句吻合 ✓。

**探针牙齿（两针全做，均真红，还原后 `git diff` 为空亲验）**：
- 针 a（auths 改 `['Bearer k1','Bearer k1','Bearer k1','Bearer k1','Bearer fk1']`）：vitest **1 failed | 11 passed**，diff 明确显示实际轨迹 k2/k3 被断言捕获——轮换断言有判别力 ✓
- 针 b（删 `visibleSearch.length > 1 &&`）：section.spec **1 failed | 45 passed**，单成员场景 standby 徽标被查出（:420 queryByTestId 断 null 失败）——守卫有判别力 ✓
- 两针还原后 `git diff --stat` + `git status --porcelain` 均空输出 ✓

## 门墙数字（亲跑，串行，exit 实录）

| 门 | 命令 | exit | 数字 |
|---|---|---|---|
| 1 | `pnpm exec vitest run` | **0** | Test Files 29 passed \| 1 skipped (30)；**Tests 320 passed \| 9 skipped (329)**；log 亲查 `grep -E 'Errors? \|\|Unhandled'` **0 匹配** |
| 2 | `pnpm run typecheck` | **0** | tsc --noEmit × 2 静默 |
| 3 | `pnpm run lint` | **0** | 0 warnings 0 errors（52 files，oxlint） |
| 4 | `pnpm run check:i18n` | **0** | **50 keys**，union/en/zh parity；19 files 零 CJK 字面量 |

## 总结论：**PASS**

计划 T1-T4 全部符合且证据在案；两针探针真红证明测试判别力真实；四门墙 exit 0 实测通过；新债探查（sequence 收窄完备性、hint 文案与实现一致性、B2 file:line 基准）全部核销；工作树干净、分支基点正确。符合 R4（复审 PASS 无新 🟡+），可进入 merge --no-ff。
