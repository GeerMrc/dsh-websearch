# Stage 4 回顾审核 — S19（全量测试唯一责任点）

> 参数头：骨架库 v2（six-stage.md 阶段 4 骨架）| 阶段 4 | Session 19 | 输入指针：plan 正本
> docs/plans/2026-09-10-019-s19-remove-perplexity-plan.md；commit 范围 `7cc5f1f..cb2f672`（149d84f/
> e3ae688/3474bef/f4293f0/cb2f672）；测试 `pnpm test`；静态 `pnpm typecheck`/`pnpm lint`/`pnpm check:i18n`。
> 相对骨架偏离说明：R1 按逐行分类判定（legacy 别名基建为 plan D2 有意豁免）。执行方式：独立 spawn，只读 + 亲跑。

## 输出原文（逐字）

# S19 独立回顾审核报告（阶段 4/6 对峙核验）

审核基线：plan 正本已复核；commit 范围 `7cc5f1f..cb2f672` 亲跑 `git log --oneline` 确认 5 commits（149d84f T0 / e3ae688 T1+T3 / 3474bef T2 / f4293f0 T4 / cb2f672 T5），与指令一致。HEAD = `cb2f672c160be`，探针前后 `git diff --exit-code` 均干净（TREE_CLEAN 亲证 ×2）。全程只读+测试实跑，零 git 写。

## 1. 全量亲跑（唯一责任点）

- 命令：`export PATH=~/.nvm/versions/node/v22.23.2/bin:$PATH && pnpm test`
- 实测：**Test Files 30 passed | 1 skipped (31)；Tests 377 passed | 11 skipped (388)；exit 0**（Duration 3.01s）
- 对比 S18 正本 401|13(414)：如预期减少（414-388=26 个用例、perplexity.test 288 行文件+perplexity.real.test 删除所致）。
- skipped 全量拆账（第二次亲跑逐文件抓取）：anysearch.real 1 + tavily.real 2 + deepseek.real 1 + firecrawl.real 3 + exa.real 2 + chain.real 2 = **11，全部为 e2e.real 无 key 自跳**，无其他跳过来源。`tests/e2e.real/` 目录 7 文件，**perplexity.real.test.ts 已不在**。
- 附带噪音（非阻塞）：vite 报 `dsh-client-ui-primitives` 缺 index.js.map 的 source map ENOENT——第三方包残缺，与本棒无关。

## 2. R1-R5 逐条

### R1 Perplexity 前后端全清 — **PASS**
`grep -ri perplexity src/ tests/` 共 18 行命中，逐行分类：

**功能性残留 = legacy 别名基建（plan D2 有意设计，豁免）—— 7 行：**
- `src/config.ts` ×5：LegacyFallbackMember 类型定义、JSDoc/注释、schema union 含 'dshws-perplexity'、resolveConfig 归一分支
- `src/client/controller.ts` ×2：输入宽型 union（含 'dshws-perplexity'）、fallbackSelection 归一分支

**描述性测试标题/注释（豁免）—— 4 行：**
- `tests/config.test.ts` 两处测试标题（"perplexity removed" / "naming the removed perplexity member"）
- `tests/client/section.spec.tsx` 注释 "S19: perplexity removed"

**测试断言用例值（R2 归一测试本体，豁免）—— 7 行：**
- `tests/config.test.ts` `resolveConfig({ fallbackMember: 'dshws-perplexity' })` 及断言
- `tests/client/controller.spec.ts`：两处循环含 'PERPLEXITY_API_KEY'（存量 env ref 残值兼容语义测试）+ `nsValue = { fallbackMember: 'dshws-perplexity' }`

**判定：零非豁免功能性残留。** provider 文件已删（diff stat 见 `tests/providers/perplexity.test.ts -288 行`）；`src/providers/` 无 perplexity.ts。plan R1 写「零输出」，实际为「零未豁免输出」——豁免域（legacy 别名基建）正是 plan §D2 明文设计，判定一致。

### R2 存量配置兼容 — **PASS**
- `tests/config.test.ts:55-59`：legacy 别名归一测试在案（resolved → 'auto'，searchChain 不含死 id）
- `tests/client/controller.spec.ts:538-544`：snapshot 侧归一测试在案（fallbackSelection → 'auto'）
- schemastery 探针在案：`docs/sessions/audit-logs/2026-09-10-s19-stage0-review-of-s18.md:43`——`node -e` 探针实测 Schema.object 未知键 **NO THROW 原样透传**，结论残尸 `perplexity:` 节静默无害（🟢 观察登记）

### R3 全量门墙 + 链 4 成员语义 — **PASS**
亲跑数字（命令原文 + exit）：
- `pnpm typecheck`（tsc --noEmit && tsc --noEmit -p tsconfig.client.json 双 program）→ **exit 0**
- `pnpm lint`（oxlint src tests）→ **0 warnings 0 errors**，54 files，exit 0
- `pnpm check:i18n` → **92 keys, union/en/zh parity holds** + CJK 20 files zero literals，exit 0（96→92，4 个 pplx 键已删）
- 全量 pnpm test：见第 1 节，exit 0
- loopback 4 成员语义：`tests/e2e/loopback.test.ts` 15 tests 全绿；`MEMBERS = ['dshws-tavily','dshws-exa','dshws-firecrawl']`（:24），:43 fallbackMember union 已无 perplexity（6 值窄型）；注释明示「chain semantics member independent（S03 fake tier）」。注：实际承载成员为 tavily/exa/firecrawl（commit e3ae688 自述 firecrawl 承载），与 plan §5 建议的 exa/tavily 不完全一致，但场景语义（断网/429/超时降级、degrade line 断言）逐场景保留——判定等效达标。

### R4 3423 换包冒烟 — **PASS**
- `/tmp/dshws-s19/` 存在：`boot-3423.log`（boot URL 含 token，09:52）+ `firecrawl-real-proof.txt`（4 passed (4) 实搜证明，09:51）
- `lsof -nP -iTCP:3423 -sTCP:LISTEN` 亲证：**node PID 22026 LISTEN 127.0.0.1:3423**（存活至今）
- `curl http://127.0.0.1:3423/` → 401（token 门墙在，服务健康响应）

### R5 ADR-0017 + 文档链 — **PASS**
- ADR-0017：`docs/decisions/adr-0017-member-admission-and-perplexity-removal.md`，status **accepted**（用户直接指令充当 2.5 终审），准入标准四条齐全（①高可用 ②**免费额度硬门槛** ③多 key ④对齐上游），附免费额度事实核证（纯预充值绑卡/Pro 不含 API/学生不含/唯 Startups 计划）及现役成员复核
- ADR-0016：frontmatter `status: superseded by ADR-0017`，历史档保留 ✓
- ADR-0015：:39 勘注在案（语言面剩 Tavily、region 面剩 Exa/Firecrawl）✓
- `docs/00-architecture.md`：项目定位行（Tavily/Firecrawl/Exa/DeepSeek + ADR-0017 引用）、文件树（无 perplexity.ts）、默认链序「S19 起 4 成员」、config 样例（无 perplexity 节）四处更新 ✓；上游 id 撞名行保留（实际 line 121，plan 写 122——±1 行漂移，内容即撞名论证保留，判定达标）
- roadmap：S18 行勘注「转历史档」+ S19 插行在档（状态 🚧，见未完成项）

## 3. 探针（临时破坏→红→还原复绿，git diff 干净）

- **探针 1**（resolveConfig legacy 归一）：将 `? 'auto'` 改为直通 cast → `pnpm vitest run tests/config.test.ts` = **1 failed**（正是 S19 legacy 归一用例）| 26 passed。`git checkout -- src/config.ts` 还原，`git diff --exit-code` 干净，复跑 27 passed 全绿。
- **探针 2**（ORDERABLE 链序）：交换 exa/firecrawl 顺序 → `pnpm vitest run tests/config.test.ts tests/e2e/loopback.test.ts` = **1 failed**（"applies the built-in member order — four tools (S19)" 用例）| 41 passed。还原后 TREE_CLEAN_AGAIN，config.test 复跑 27 passed 全绿。

两探针均红→绿留痕，证明四成员链序断言与 legacy 归一断言真实咬合实现（非恒真测试）。

## 4. dont-do / pitfalls 命中检查 — **无命中**

- `docs/dont-do.md`（60 行全扫）：依赖版本域两条（本棒无 peer 依赖改动）、S07 mtime 绝对主张条（本审核未做 `~/.dsh` 零写入类绝对主张）——均未触发。
- `pitfalls.md`（session-governance）：提示词版本化/audit-log 落盘条——本棒 audit-log 落盘规范未见违反（stage0/stage2 两份在档且含实跑命令原文）。
- 唯一邻域风险「fail-safe 静默透传残尸配置」已在 plan D2 明文论证为删除场景例外并登记 🟢 观察（README S15 收尾提示），非漏标。

## 未完成项清单（按 plan 任务表）

| 项 | 状态 |
|---|---|
| T6 阶段 4/5 audit-log ×2 | 本报告供阶段 4 采信；audit-log 落盘待执行者完成 |
| T7 收尾 6 件套 + 原子收官 + merge `--no-ff` + 接力指令 | 未做（roadmap S19 行仍 🚧，属预期中段状态） |
| README（S15）残尸配置手动清理提示 | 归 S15，plan 已排期 |

**总判定：R1-R5 全部 PASS，无阻断项。** 采信正本 = 本报告各命令原文与实测数字。
