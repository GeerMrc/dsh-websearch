# Stage 0 前序审核 — S18（对象：Session 17）

> 参数头：骨架库 v2（audit-gate.md 审核提示词骨架）| 阶段 0 | Session 18 | 输入指针：
> 审核对象区间 `6dfd80c..c8799bd`（S17 十 commits + merge c8799bd）；声称基线 全量 399|13(412)
> exit0（正本 = s17-stage4 audit-log）/ tc 0 / lint 0w0e 57f / i18n 96 keys / 版本 0.3.0。
> 相对骨架偏离说明：交付物核验以 S17 收官工件 12 件清单（session-17 记录交付物表）为声称源；
> 增列 S18 可行性追问（凭据池 PERPLEXITY key 存在性——只看键名）。
> 执行方式：独立 spawn general-purpose Agent（与主 Agent 上下文隔离），只读 + 子集/静态亲跑。

## 输出原文（逐字）

# S17 独立审核报告（Session 17 = 6dfd80c..c8799bd，10 commits + merge）

## 1. 四维实测（数字亲见，全部只读/串行）

**git 面**
- `git status --short` → 零输出（工作树 clean）
- `git rev-parse HEAD` → `c8799bd1178d98bba60e7f19c73f7ec4086f497` ✓
- `git log --format='%h %p %s' -3 c8799bd` → `c8799bd 6dfd80c 83de0db merge: feat/s17-p1-params → master`（双亲，--no-ff 形态亲证）✓
- 区间 11 commits：`9264402..b8ef6aa`（T0-T9）+ `83de0db`（T10/11 收官）+ merge；`git diff --stat 6dfd80c..c8799bd` → 44 files, +2411/−109，重产品代码 → 增量采信制成立，实跑子集

**测试面（实跑）**
- `pnpm vitest run tests/providers tests/config.test.ts tests/apply.test.ts` → **8 files / 170 passed (170)，exit 0**
- `pnpm vitest run tests/client/controller.spec.ts tests/takeover.spec.ts` → **2 files / 32 passed (32)，exit 0**
- 与阶段 4 正本（audit-log stage4 全量 399|13(412) exit0）口径相容：子集全绿、无回归迹象

**静态检查（实跑，串行）**
- `pnpm typecheck` → exit 0（tsc 两 program 零输出）
- `pnpm lint` → **0 warnings 0 errors，57 files, 96 rules**（与阶段 4 记载 0w0e 57f 逐位吻合）
- `pnpm check:i18n` → **96 keys**，en/zh parity + 21 files 零 CJK 字面量（与记载 96 吻合）

## 2. 交付物 12 件逐项核验（全部命中）

① **ADR-0015** `docs/decisions/adr-0015-unified-search-geo-entry.md` — `status: accepted`（:3）；全文件 **无 `user_search_options` 残留**（grep 零命中），:20/:30 均为 `web_search_options`——阶段 4 抓获的笔误已 T11 勘正 ✓
② **session-17 记录** `docs/sessions/2026-09-10-session-17.md` — T0-T11 全在「做了什么」节；抽验 T2 **「pre-fix 红 11 failed|30 passed EXIT=1」（:28）**、T6 **「6 failed|136 passed EXIT=1」（:32）** 内嵌 ✓
③ **CHANGELOG.md** 最新条 = `2026-09-10 — P1 高价值参数批 0.3.0（Session 17…）`，含 web_fetch 恢复路径评估结论（短/中/长三路）+ 三项诚实标注（真实实测缩面、Sonar 2026-09-27 日落、两处默认开启行为变更）+ 🟢 re-export ✓
④ **STATUS.md** :83 S17 行 ✅；:92 `更新时间: 2026-09-10（S17 阶段 6 收尾）` ✓
⑤ **session-roadmap.md** :79 S17 行 ✅（399|13(412)/96 keys 证据内联）、:80 S18 行 ⏳（含 2026-09-27 死线与迁移参数映射）✓
⑥ **progress-M7** :30 S17 节 + :55 门墙行（全量数字正本指针）+ :426 新类型 re-export 🟢 观察行 ✓
⑦ **四份 s17 audit-log**（stage0/2/4/5）均存在且含「参数头：骨架库 v2」头 + 「输出原文（逐字）」体 ✓（stage4 头部亲读核验）
⑧ **Agent Note** `docs/notes/2026-09-10-s17-api-alignment.md` §1「三处推翻既有认知的枚举漂移」（:7）在档 ✓
⑨ **四棒 reconstructed**：session-15a/15b/15c（2026-09-09）+ 16p0（2026-09-10）各含 reconstructed 标记 ×1 ✓
- `package.json:3` `"version": "0.3.0"` ✓

## 3. 流程合规审计

- session-17 记录三新节齐：`## 前序 Session 审核确认（…）★`（:7）/ `## 下一 Session 启动指令（跨窗口接力，必填）★`（:64）/ `## 开发规范强化说明（固定声明，底部必填）★`（:89，含六阶段合规/独立 Agent 分离/三级处置/完成度/高危门控五行）✓
- 六阶段留痕：:22-:38 阶段 0（PASS 🟡×4）→1→2（两轮 NEEDS REVISION→APPROVED）→2.5 默认批准披露→3（T0-T11 红→绿→commit）→4（R1-R6 PASS）→5（COMPLETE）→6 原子收官 ✓
- 四处收官互指无悬空：STATUS:83 ↔ roadmap:79 ↔ CHANGELOG ↔ session-17 记录，数字互相一致 ✓
- dont-do 命中：S17 实测坑（webview 后台态 locator click / React 受控输入清空）属既有 dont-do「输入派发与实测判定」家族，session-17 :78 已回写入坑位，无新坑未入册 ✓

## 4. 债务三分级

**🔴 ×0**

**🟡**
1. **凭据池无 PERPLEXITY_API_KEY —— S18 可行性前提风险**（本审核特别追问项）：`/tmp/dshws-s14a/home/.credentials.yaml` 的 `refs:` 下键名仅 `ANYSEARCH_API_KEY / SZ_API_KEY / FIRECRAWL_API_KEY` 三枚。roadmap:80 S18 验收要求「迁移后真实 API 实测（scratch 凭据池）」——**无 Perplexity key 则 S18 验收面无法闭合**，且 2026-09-27 日死线。未命中既有 dont-do/pitfalls 条目（新发现）。建议 S18 启动前向用户催 key 或降级验收口径。
2. **Perplexity Sonar 2026-09-27 日落**（progress-M7:425、STATUS:91）——位于 S18 验收路径正中，归属明确（S18 迁移棒），非半成品。

**🟢**
1. Tavily/Exa/Perplexity 新参数真实 API 实测无 key（CHANGELOG 诚实标注在档，e2e.real 断言自跳）——不在 S18 WBS 路径（S18 只涉 Perplexity 迁移后实测，该腿并入上方 🟡-1），归属明确 = 用户择机补 key。
2. 新类型 re-export 未做（progress-M7:426）——归属明确后续棒。
3. web_fetch 完整替代实现（评估已闭环、短期开关已可用，实现归后续棒/v2）——按判别式「完全未实现且归属明确」归 🟢；注意 STATUS:91 自标 🟡×2，与本审核分级存在口径差（非悬空，仅严重度标注差异，不构成阻断）。

## 结论：**PASS**

全部实测命令原文与数字已内嵌上文；基线声称（399|13 全量为阶段 4 亲跑正本，本审核子集 170+32 全绿 + tc 0 / lint 0w0e 57f / i18n 96 keys 逐位吻合）。唯一需要动作的项：🟡-1 凭据池无 Perplexity key，属 S18 启动前提，不阻断 S17 收官。
