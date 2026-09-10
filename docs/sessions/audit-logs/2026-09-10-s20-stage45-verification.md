# Stage 4/5 独立验证 — S20（合并正本）

> 参数头：骨架库 v2 | 阶段 4+5 | Session 20 | 输入指针：plan 正本 docs/plans/2026-09-10-020-s20-p2-params-plan.md；
> commit 范围 `2349961..d18a4b0`（9 commits——阶段 4 后 F-1/F-3 清偿 commit 4cc332a 属阶段 5 处置）。
> 偏离说明：阶段 4/5 由两个独立 Agent 分别执行（与主 Agent 及彼此隔离）；本文件合并两份正本。
> 执行方式：独立 spawn ×2，只读 + 亲跑。

## 阶段 4 输出原文（逐字）

# S20 P2 独立回顾审核报告

commit 范围复核：`git log --oneline 2349961..1397769` = 8 commits，与指令一致。审核全程只读（探针临时改动已还原，`git status --short` 空）。

## 1. 全量亲跑
- `pnpm test`（node v22.23.2）：**Test Files 30 passed | 1 skipped (31)；Tests 391 passed | 11 skipped (402)，EXIT=0**（复跑二次确认数字一致）
- skipped 拆账：anysearch.real 1 + tavily.real 2 + deepseek.real 1 + exa.real 2 + firecrawl.real 3 + chain.real 2 = **11，全部为 e2e.real 无 key 自跳** ✓
- `pnpm typecheck` exit 0；`pnpm lint` exit 0（0w0e，54 files）；`pnpm check:i18n` exit 0（121 keys parity + CJK 零字面量）

## 2. R1-R5 逐条
**R1 — PASS。** 红→绿留痕全部在 commit message：T1 `4 failed|121 passed EXIT=1`→绿 174+7；T2 `3 failed|50 passed`→53+7；T3 `2 failed|24 passed`→26；T4 `3 failed|53 passed`→178。timeout 修复断言在档（firecrawl.test:121-124 `body.timeout === 20_000`，含 bare 缺省也显式）。
**R2 — PASS（逐守卫核到断言）。** Exa company/people×日期+excludeDomains（exa.test.ts:107-138）；Tavily filter_by_language×language（tavily.test.ts:171-193）+ includeDomainsMode×include（同上）+ ultra-fast×chunks（:147-168）；Firecrawl 互斥 validate-hook 拒写（settings.test.ts:124-134）+ resolveConfig throw（config.test.ts:175-186）；通配×Firecrawl（firecrawl.test.ts:128-146）✓
**R3 — PASS。** 门墙四件亲跑 exit 0。缺省零漂移按 plan 排除口径核对：firecrawl.test:85 缺省不发 sources；仅 timeout:20000 为另一项有意漂移（:209 exact-body 含之）。无第三处漂移。
**R4 — FAIL（锚缺失）。** T5 done 点名的「settings-commit→wire 热生效断言」不在档；`git log -S "S20" -- tests/apply.test.ts` 空；client 新控件仅 fixture plumbing 无行为断言。
**R5 — PASS。** /tmp/dshws-s20/ 亲证（boot-3423.log + firecrawl-real-proof.txt 4 passed）；lsof → pid 28958 LISTEN；ADR-0018 accepted ✓；Note s17 §6 P2 节在档 ✓。

## 3. 探针（2/2 红证）
- 探针 1：破坏 exa.ts:192 dateFloor 守卫 → exa.test **1 failed | 25 passed**（守卫用例红）✓ 已还原
- 探针 2：删除 settings.ts validate 透传 → settings.test **1 failed | 6 passed**（拒写用例红）✓ 已还原

## 4. dont-do/pitfalls — 未见命中。

## 未完成项清单
1. **R4 锚缺失（唯一 FAIL）**：补 S20 参数 settings-commit→wire 热生效断言 + client 行为 spec。
（→ 主 Agent d18a4b0 清偿：apply 热锚 + setSearchDomains 互斥双清 spec + 三组控件行为 spec + filterByLanguage toggle 渲染默认 false 真实缺陷修复；client+apply 143 passed。）

## 阶段 5 输出原文（逐字）

## 交叉验证报告 — S20 P2 参数批（2349961..d18a4b0）

**结论：COMPLETE**（冒烟与三正交维度均无阻断项；3 条低severity发现附后）

### 冒烟（亲跑）
`pnpm vitest run tests/apply.test.ts tests/client` → **6 files / 140 tests passed**，与阶段 4 记载方向一致。

### 安全维度 — PASS
1. **validate throw 不带崩宿主写队列**（亲读宿主源码）：写路径 validate 包在排队 promise 内、persist 在 validate 之后——throw 只 reject 本次 update，链头 previous.catch(() => undefined) 保证失败前驱不毒化队列；持久化永不发生，committer 收到冒错。ADR-0018 双路径设计与宿主实际行为一致。
2. **热读 throw 风险排除**：fanoutOf() 不调 validateUnifiedDomainRule；resolveConfig 仅在构造/setSource/refresh 执行，宿主 publish 对外部文件编辑 resolve 失败是 catch + last-good + warn，commit 不触发。
3. **注入面**：逗号串 → splitDomainList → 数组 → JSON.stringify body，无拼接注入面。

### 契约维度 — PASS
4. UnifiedSearchFanout 重命名零导出面影响（新旧类型均仅 type-import，不在 index export）。
5. '' 哨兵归一链完整（schema z.union → resolveConfig || undefined → GUI patch）。
6. ADR-0018 与实现对齐（双路径/三守卫/通配跳过逐一在码）。

### 前瞻维度 — PASS（2 条低severity）
7. P3 候选清单已落档（note s17:85-87）；package.json 0.5.0 + UA×5 + **3423 实例确认 0.5.0**（进程 28958，profile 钉 0.5.0 tarball）；S15 素材留档在指针粒度 ✓。

### 发现（不阻断）
- **F-1（🟡）Tavily 通配语义未披露**：Tavily 路径对含 * 条目原样透传、无守卫无披露——官方无通配支持，静默永不匹配。守卫清单唯一漏项。
- **F-2（🟢）**：controller union 内联 6→16 扩面未注记；number kind 复活 JSDoc 未重登记。
- **F-3（cosmetic）**：ADR-0018 引宿主行号 :781-786 漂移（publish catch 现为 :693-698）。

**dont-do 命中核查**：无违反迹象。

（→ 主 Agent 4cc332a 清偿 F-1/F-3：Tavily domainsHaveWildcard 守卫 + 具名测试 + 披露统一 + ADR 勘注；F-2 随收官台账注记。）
