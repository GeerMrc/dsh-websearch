# Stage 0 前序审核 — S17（对象：S15c 收尾 + S16-P0）

> 参数头：骨架库 v2（audit-gate.md 审核提示词骨架）| 阶段 0 | Session 17 | 输入指针：
> 审核对象区间 `d4db769..6dfd80c`（commits b643a9b, 7e20156, 297aabc, d996d3d, 6dfd80c）；
> 声称基线 357|9(366) exit0 / i18n 54 keys / 版本 0.2.2；仓库 /Volumes/IPFSJK/Zcode/dsh-websearch。
> 相对骨架偏离说明：d 项以 CHANGELOG/STATUS/commit message 为声称源（上棒无 session 记录可对照，
> 该缺失本身即审核发现之一）；流程合规节增查四棒（15a/15b/15c/16-p0）记录缺失面。
> 执行方式：独立 spawn general-purpose Agent（与主 Agent 上下文隔离），只读 + 测试/lint 实跑。

## 输出原文（逐字）

全部取证完成。汇总输出审核报告。

---

# S16-P0 独立审核报告（进入侧前序审核 gate）

**审核对象**：d4db769..HEAD（b643a9b → 7e20156 → d0a4096 → 297aabc → d996d3d → 6dfd80c，与声称 commit 清单一致）
**环境**：node v24.3.0（初始 PATH）≥22.19 达标；pnpm 缺失，按预案前置 `~/.nvm/versions/node/v22.23.2/bin`（node v22.23.2 亦达标）跑全部命令。工作树干净，HEAD = `6dfd80c57a335dff05b7d60ffa3993a186e8a052` ✅。

## 一、四维实测（数字亲见）

**a. 测试面（增量采信，串行实跑）**
- `git diff --stat d4db769..HEAD`：15 files，+175/−22——src/providers×6 + tests/providers×5 + tests/takeover.spec.ts(+103) + CHANGELOG/STATUS/roadmap，与声称一致
- `pnpm vitest run tests/providers` → **95 passed | 0 skipped (95)，6 files，exit 0，197ms**
- `pnpm vitest run tests/patch.test.ts tests/takeover.spec.ts` → **7 passed (7)〔patch 4 + takeover 3〕，exit 0，184ms**
- 交叉验算：16-p0 声称 357 = S15c 声称 354 + b643a9b 新增 takeover.spec 3 例（亲见该文件恰 3 个 `it`）——算术自洽；区间变更面子集全绿

**b. 静态检查（串行逐个）**
- `pnpm typecheck`（双面）→ **exit 0**
- `pnpm lint` → **exit 0；3 warnings / 0 errors，57 files**（明细见 🟡-4）
- `pnpm check:i18n` → **exit 0；54 keys parity + 21 files 零 CJK**（声称 54 ✅）

**c. git 状态**：工作树干净 ✅；HEAD = 6dfd80c ✅

**d. 交付物逐项核验（file:line 证据，CHANGELOG/STATUS/commit message 为声称源）**

| 声称 | 实锤 | 判定 |
|---|---|---|
| Exa highlights 迁移 | src/providers/exa.ts:40-41（`EXA_HIGHLIGHT_MAX_CHARACTERS = 400` 替换废弃常量）+ exa.ts:148 body `contents: { highlights: { query, maxCharacters: 400 } }`；测试断言同步（exa.test.ts:75-78 亲见于 diff） | ✅ |
| Firecrawl timeout | src/providers/firecrawl.ts:199-206 body 增 `timeout: 20_000` + 注释；fetch face 断言同步（firecrawl.test.ts:196） | ✅ |
| 6 UA 统一 0.2.2 | grep 六文件现值全 `dsh-websearch/0.2.2`：deepseek.ts:64 / firecrawl.ts:49 / anysearch.ts:40 / exa.ts:46 / perplexity.ts:46 / tavily.ts:42（anysearch 自 0.2.0、余四家自 0.1.0，与 CHANGELOG 口径一致）；5 家测试断言同步 | ✅（anysearch 断言缺口见 🟢-1） |
| Tavily 头注释勘正 | src/providers/tavily.ts:5 `API-side default 10`（原 5） | ✅ |
| web_fetch 债务登记 🟡 | STATUS.md:90 活跃债务行已写——**但正本指针悬空（🟡-1）** | ⚠️ |
| roadmap S17 行 ⏳ | docs/session-roadmap.md:79 S17 行存在、状态 ⏳、WBS 与 STATUS「下一棒」互指一致 | ✅ |
| STATUS 台账 16-p0 行 | STATUS.md:81 ✅ + 357\|9(366)（交叉自洽，见上）；无 session 记录指针（因不存在，未构成悬空引用） | ✅/⚠️ |
| 已验锚点先行 | progress-M7「已验锚点」节（:386-394）无 providers/UA 锚点 → 核验对象已变 → 亲验（diff 亲读 + 子集实跑） | 流程 ✅ |

## 二、债务三分级清单

### 🔴（0 项）

无。四项 P0 修复代码-测试-声称三方一致；无虚报数字；无悬空收官引用（16-p0 台账行未引用不存在的文件路径）。

### 🟡（4 项）

1. **web_fetch 债务登记链断裂（悬空正本指针）——本棒四项交付之一的闭环缺口**
   STATUS.md:90 称「🟡×1（web_fetch 完整替代）……正本：progress-M7 台账」，但 docs/progress/progress-M7.md 技术债台账（:361-384）全表亲读**无 web_fetch 行**——登记仅落 STATUS+CHANGELOG 两处自述。判别式正面证据：progress-M7.md:384 为台账末行（v2 backlog），无新增行。系统性加重证据：该台账最后登记停在 S14b 期（2026-09-06），S14c 起约 13 棒债务全部内联在 STATUS「债务增减」列，违反 STATUS.md:7 自述的「progress 是台账细节（债务/已验锚点）」单源分工。命中 dont-do「收官序列——指针写进看板前先验文件存在」（S11/S12 悬空引用家族变体）+ pitfalls「悬空引用」条。

2. **15a/15b/15c/16-p0 四棒 session 记录全缺 + 15b/c/p0 audit-log 与 plan 全缺（治理生效边界内）**
   实测：`docs/sessions/*.md` 止于 2026-09-09-session-14z.md；`find docs/sessions docs/plans -name "*15*" -o -name "*16*"` 仅命中 s15a 的 plan + stage45 audit-log。逐棒：**S15a**（plan ✅ 015-s15a / stage45 audit-log ✅ / session 记录 ❌ / stage0+stage2 audit-log ❌——CHANGELOG 称「计划审核 5 必改」但正本仅剩 stage45 一份）；**S15b**（plan ❌ / audit-log ❌ / session 记录 ❌）；**S15c**（三缺）；**S16-P0**（三缺）。生效边界取证：docs/governance-sessions.md 由 6ca97b9（S01，2026-09-02）安装且 git log --follow 仅此一 commit（从未修订），§3.1.1 六件套② session 记录为硬交付 + 硬红线「无 session 记录结束 session」+ :264「不得只挂 commit message」；四棒（09-09/09-10）全在生效期内，非安装前合法缺省。§3.4.6 S 级轻量通道也仅降审核强度，「S 级判定与三问结论必须留痕于 session 记录」——记录义务不可豁免。采信锚：CHANGELOG 四棒各有外部视图条目（15a :73 / 15b :55 / 15c :31 / S16-P0 :15）+ STATUS 台账四行——作为部分证据补偿，不足以替代。命中 pitfalls「不要无 session 记录就结束」。

3. **STATUS 位置块刷新不完整 + 台账行乱序（6dfd80c「位置块刷新」声称与实物不符）**
   6dfd80c diff 亲证：位置块 5 字段仅刷 2——「上一棒」仍指 14x（STATUS.md:88，实际上一棒为 15c）；「更新时间」仍写「2026-09-09（14x 阶段 6 收尾）」（STATUS.md:91，而本 commit 即 2026-09-10 的 S16-P0 收官动作）。台账行序 15a→15b→**16-p0**→15c（STATUS.md:79-82），16-p0 插在 15c 之前，时间序错位。命中 dont-do「收官序列里漏刷新任何状态区」（清单化逐处打勾家族，本次为位置块内部字段漏刷）。

4. **lint 0w0e → 3w0e 回归未披露 + 死参数半成品面**
   实测 3 warnings：src/index.ts:25（`WebFetchProvider` unused——blame 归 05fa639 S15c 本体遗留，区间前引入但区间内 S15c 收尾三 commit 未抓获）；tests/takeover.spec.ts:1（`vi` unused）+ :20（`takeoverCtx(takeover)` 参数声明未用——**b643a9b 区间内引入**，测试辅助函数签名误导）。S14c 门墙口径「lint 0w0e」→ 现 3w，无任何载体披露；297aabc message 仅写「lint 0e」（字面成立、口径收缩）。fail-closed 归 🟡。

### 🟢（2 项）

1. **anysearch UA 无测试断言覆盖**：tests/providers/anysearch.test.ts 无 user-agent 断言（grep 空），六成员唯一；CHANGELOG「UA 测试断言同步更新」实际覆盖 5/6。归属明确：S17 P1 参数批顺手补。
2. **全量 357|9(366) 未亲证（采信说明，非债务）**：按增量采信制不跑全量；变更面子集 102 例全绿 + 算术自洽（354+3）+ 无矛盾信号。若需坐实，S17 门墙全量亲跑即闭合。

## 三、结论

**PASS**（🔴×0；🟡×4 如上，🟢×2）——产品交付面（四项 P0 修复 + 测试断言同步）实锤成立；4 项 🟡 全部为登记/流程/记录面，建议 S17 启动 T0 清偿：①progress-M7 台账补 web_fetch 行（并补 S14c 起停更债务）②四棒 session 记录至少 reconstructed 补落（沿 S11 先例）③STATUS 位置块「上一棒/更新时间」刷新 + 台账行序勘正④lint 3 warnings 清偿。

**实跑命令原文汇总**：`node --version`（v24.3.0）；`git status --short`（干净）；`git rev-parse HEAD`（6dfd80c…）；`git log --oneline d4db769..HEAD` + `git diff --stat`；`git show 297aabc` / `git show 6dfd80c`；`grep -n "USER_AGENT = " src/providers/*.ts`；`grep … tests/providers/anysearch.test.ts`（空）；`git blame -L 24,26 src/index.ts`；`export PATH=/Users/aibot/.nvm/versions/node/v22.23.2/bin:$PATH` 后 `pnpm vitest run tests/providers`（95\|0, exit 0）、`pnpm vitest run tests/patch.test.ts tests/takeover.spec.ts`（7, exit 0）、`pnpm typecheck`（exit 0）、`pnpm lint`（exit 0, 3w0e）、`pnpm check:i18n`（exit 0, 54 keys）。全程只读零修改、零 commit。
