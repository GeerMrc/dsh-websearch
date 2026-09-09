# Stage 4 回顾审核 — S17（全量测试唯一责任点）

> 参数头：骨架库 v2（six-stage.md 阶段 4 提示词骨架）| 阶段 4 | Session 17 |
> 输入指针：plan 正本 docs/plans/2026-09-10-017-s17-p1-api-params-plan.md；commit 范围
> `6dfd80c..b8ef6aa`（feat/s17-p1-params 10 commits：9264402/37868a8/11cd0ed/90cee45/da679ac/
> d9f50a6/03733a2/d607590/339c6bf/b8ef6aa）；测试命令 `pnpm test`；静态检查 `pnpm typecheck` /
> `pnpm lint` / `pnpm check:i18n`。
> 相对骨架偏离说明：R4 3423 实测按「真实 API 面数字在档 + /tmp 证据存在性」口径核验（浏览器
> 交互本体已由 T8 主 Agent 完成，本阶段不重复 GUI 旅程）；增列探针抽查两处（有牙验证）。
> 执行方式：独立 spawn general-purpose Agent（与主 Agent 上下文隔离），只读 + 全量/静态亲跑。

## 输出原文（逐字）

# S17 P1 阶段 4 独立验证报告（全量测试唯一责任点）

仓库 /Volumes/IPFSJK/Zcode/dsh-websearch，分支 feat/s17-p1-params，HEAD b8ef6aa，working tree clean（`git status --porcelain` 0 行）。

## 0. 范围复核

`git log --oneline 6dfd80c..b8ef6aa` = 恰 10 commits，与任务描述逐一对应（9264402 T0 / 37868a8 T1 / 11cd0ed T2 / 90cee45 T3 / da679ac T4 / d9f50a6 T5 / 03733a2 T6 / d607590 T7 / 339c6bf T8 / b8ef6aa T9）。无越界、无漏报。

## 1. 亲跑正本数字（阶段 4 采信依据）

| 命令原文（均先 `export PATH=~/.nvm/versions/node/v22.23.2/bin:$PATH`，node v22.23.2） | 实测结果 | exit |
|---|---|---|
| `pnpm test`（vitest run，全量） | **Tests 399 passed \| 13 skipped (412)；Test Files 32 passed \| 1 skipped (33)；3.31s** | 0 |
| `pnpm typecheck` | tsc --noEmit + client 两程序无输出 | 0 |
| `pnpm lint` | **0 warnings 0 errors（57 files）** | 0 |
| `pnpm check:i18n` | **96 keys en/zh parity ok + 21 files 零 CJK literals** | 0 |
| `pnpm build` | index.js 83.65 kB (gzip 22.33) + index.d.ts 38.68 kB (gzip 8.62) + client.js 95.68 kB (gzip 22.70)——与 T9 commit message 逐位一致 | 0 |
| `pnpm pack --pack-destination /tmp` | /tmp/dsh-websearch-0.3.0.tgz 生成（审毕已删） | 0 |
| `git status --porcelain` | 0 行 clean | — |

13 skipped 全在 tests/e2e.real（无 key 自跳：firecrawl 3/deepseek 1/exa 2/perplexity 2/tavily 2/anysearch 1/chain 2），属正常。唯一噪音：vite 对 node_modules 内 @deepseek-ai/dsh-client-ui-primitives 缺 .map 的一条 source map 警告——第三方产物、非本仓代码、测试全绿，无实质影响。plan §4「全量 357|9(366) 未亲证 🟢」由本次 399|13(412) 坐实清偿。

## 2. R1-R8 逐条对峙（plan §6）

**R1 — PASS。** `grep -rn 'S17' tests/` = 37 处。14 参数逐参数断言在档：

| 参数 | config 断言 | wire 断言 |
|---|---|---|
| tavily.topic / timeRange / searchDepth | tests/config.test.ts:86-104（含非法枚举 fail-loud :96-100） | tests/providers/tavily.test.ts:111-126 |
| tavily.includeAnswer（默认 basic, D4） | config.test.ts:78-84 | tavily.test.ts:102（缺省体恒发）+128（advanced 覆盖） |
| exa.type（6 值） | config.test.ts:117-125（keyword/neural 拒绝 :120-122） | exa.test.ts:55-67 |
| exa.textFallback（默认 true, D4） | config.test.ts:108-115 | exa.test.ts:69-81 + 丢结果具名修复 :203 |
| exa.startPublishedDate | config.test.ts:108-115 | exa.test.ts:83-105（date-only→T00:00:00Z 归一双形态） |
| perplexity.maxTokens | config.test.ts:127-135（0/200000 拒绝 :137-140） | perplexity.test.ts:90-99（4096） |
| perplexity.searchRecencyFilter / searchContextSize | config.test.ts:127-144 | perplexity.test.ts:102-112（嵌套 web_search_options）+ :115-122（未设则整对象缺席） |
| firecrawl.tbs / location | config.test.ts:148-156 | firecrawl.test.ts:55-68（+缺省缺席 :70-76） |
| 根 searchCountry / searchLanguage | config.test.ts:157-164（' cn '→'CN' 归一、空串省略） | 四家 fan-out：exa:107 / tavily:147 / perplexity:124 / firecrawl:77 |

commit 红绿数字与测试现实对账：T1「红 2 failed|25 passed」→ apply.test 现 28 例（T1 加 2 + T6 加全局热通路 1）自洽；**T7「client 92 passed」= controller 29 + locales 6 + section 57，精确自洽**（entry 6/toolview 8 属未动未跑面）；T2-T5 时点快照数字结构与当前文件计数（tavily 21/config 29/exa 23/perplexity 19/firecrawl 22）相容，历史帧无法逐秒回放属正常。

**R2 — PASS。** ①tests/client 新 spec：controller.spec.ts:520-561（setMemberOption patch+revision / '' 清除哨兵 / snapshot 原始值含 textFallback 镜像默认 true / setSearchCountry+setSearchLanguage）+ section.spec.tsx:877-943（四成员控件渲染/派发/反馈 + anysearch/deepseek 无控件负断言 ：940）。②apply.test 热通路 3 例在档：:298（maxResults 5→9 下一次 wire 跟随）、:320（baseURL 覆盖）、:338（searchCountry 全局入口热生效）。③check:i18n 96 keys 亲跑 exit 0（54→96 = +42 键与 T7 message 一致）。④T8 浏览器亲见：/tmp/dshws-s17/ 4 文件 ls 亲证（2 截图 + boot-3423.log + settings-restored.yaml）；截图目验确认 Tavily 卡参数下拉（主题/时间范围等）+ 全局搜索区域（CN）/搜索语言（zh）字段 + 中文 locale 生效。

**R3 — PASS。** 六件全部本审核亲跑（§1 表）：tc 0 / lint 0w0e 57f / build 三产物数字逐位吻合 / pack exit0 / i18n 96 keys parity / status clean。全量面 399|13 亦亲跑在案。

**R4 — PASS（按本阶段口径：真实 API 面有数字在档）。** b8ef6aa message 在档：firecrawl tbs「S17: tbs week filter serves results for a live query」2160ms 真实通过 + 凭据池实况披露（firecrawl 1 + anysearch 池可用；tavily/exa/perplexity 无 key 自跳，Tavily 验收例归用户择机）。本机无 key 复核：firecrawl.real.test.ts 结构自洽（maybe describe.skip 3 真实例 + 无条件 endpoint anchor 1 例 = 4|3 skipped）。/tmp/dshws-s17/ 存在性 ls 亲证。

**R5 — PASS。** 四笔逐项：①progress-M7 台账 web_fetch 🟡 行（:389）+ S14c 起停更镜像补账行 + Perplexity 日落 🟡 新登记行，三行在档；②四棒 reconstructed 记录 ls 亲证（2026-09-09-session-15a/15b/15c.md + 2026-09-10-session-16p0.md），15c 抽查以 CHANGELOG/STATUS/commit 为源、口径一致；③STATUS 行序 15a(:79)→15b(:80)→15c(:81)→16-p0(:82)→17 🚧(:83) 勘正 + 位置块（:87/:91/:92）刷新；④lint 修复 diff 亲证（9264402：src/index.ts WebFetchProvider 导入移除 + takeover.spec.ts vi 未用/takeoverCtx 死参数）+ 本审核亲跑 0w0e 复验。🟢×2：anysearch UA 断言在档（anysearch.test.ts:77 = 'dsh-websearch/0.3.0'；src 6 处 + tests 6 处 = 6/6）；全量未亲证由本报告 §1 坐实。

**R6 — PASS。** Agent Note docs/notes/2026-09-10-s17-api-alignment.md（71 行）：§1 三处枚举漂移正本 + §2 14 参数速查表 + §3 fan-out 矩阵（含 Tavily country v1 防御理由）+ §4 日落迁移面 + §5 维护点；附录 A 出处 URL 在 plan 017。ADR-0015（docs/decisions/adr-0015-unified-search-geo-entry.md:3 status: accepted）且 **Decision 3 明文留痕「v1 不喂 Tavily country」**——对 plan D2 的偏离有 ADR 正本，非擅自偏离。小瑕疵一条：ADR Decision 2 笔误 `user_search_options` 应为 `web_search_options`（Context :20、实现、测试 :124 均正确），建议 T11 顺手勘正。

**R7 — PASS 带一处实质问题。** 评估结论本体在档：progress-M7:389 台账行内联三路结论（短期 fetchTakeover 开关 / 中期 Firecrawl scrape 单成员 / 长期多工具 fetch 链 v2）+ b8ef6aa commit message 同口径。**问题**：该台账行称「正本 = Note §5 + S17 CHANGELOG 诚实标注」，但 (a) Note §5 实为「维护点」节，全文 grep `web_fetch|fetchTakeover|恢复` 零命中——**指针指向不含评估内容的章节**；(b) CHANGELOG 尚无 S17 条目（最新为 S16-P0）。结论不因指针而失实（内联已完整），但按「一 home per fact」口径 T11 必须修：落 CHANGELOG S17 条目 + web_fetch 诚实标注，并勘正台账行指针（或把评估内容补进 Note 对应节）。

**R8 — 不判 PASS（按指令归 T11）。** 就绪度：就绪面 = 10 commits 齐、门墙全绿、session-17 骨架三★节在档且逐棒补全中（「做了什么」已记至 T0）、STATUS/roadmap 🚧行在档、阶段 0/2 audit-log 入库。T11 待办：session-17 补全（**含 T2-T9 红绿数字入记录——当前红绿数字仅存 commit message，命中 pitfalls「不要把 pre-fix 红证据只挂在 commit message」，plan 内属 T11 补全项，收官不补即坐实**）、STATUS/roadmap/progress 收官行、CHANGELOG S17 条目（R7 腿）、merge --no-ff、接力指令（含 Perplexity 2026-09-27 日落紧迫披露）。另注意 roadmap S17 行「Firecrawl 3 参数+通用 1」与实现「Firecrawl 2+根 2」计数口径差（总数均 14，归属见 ADR-0015 Decision 4），收官对账时需消化。

## 3. 探针抽查（两处，均有牙，还原后 git diff 0 行）

- **探针 A（GUI 枚举默认）**：section.tsx MEMBER_PARAM_CONTROLS includeAnswer fallback 'basic'→'advanced' → `npx vitest run tests/client/section.spec.tsx -t 'four selects'` = **1 failed | 56 skipped**（断言 dshws-param-tavily-includeAnswer value 精确红）→ 还原 → 全量 **57 passed** 复绿。
- **探针 B（config 默认面）**：config.ts:543 exa textFallback 默认 true→false → `npx vitest run tests/config.test.ts tests/providers/exa.test.ts` = **3 failed | 49 passed**（D4 默认断言 + exa wire/丢结果修复联动红）→ 还原 → **52 passed** 复绿。

## 4. dont-do / pitfalls 对照

- **命中（同族）**：pitfalls「不要提前预写收官状态（悬空引用）」——R7 台账行以 Note §5 为正本指针但该节无对应内容、CHANGELOG 引用未兑现；dont-do「声称完成而核心工件未落盘」半命中（结论内联在档，指针半落空）。
- **当前时点命中、plan 内待清**：pitfalls「不要把 pre-fix 红证据只挂在 commit message」——T1-T9 红绿数字全部仅在 commit message，session-17「做了什么」T2-T9 未补（T11 收官项）。
- **无命中**：dont-do 其余四条（peer 版本域/npm latest/隔离绝对主张/webview 判定）、pitfalls 验收算术外推（本棒数字均有实测背书，T7 92 面与探针 57 面经本审核重算自洽）、并发重负载（本审核全部串行执行）。

## 5. 结论与未完成项（供 T11 继续执行到 100%）

**R1-R6 PASS；R7 PASS 带指针问题；R8 归 T11。全量 399|13(412) exit0 为正本。** 未完成清单：
1. CHANGELOG S17 条目 + web_fetch 恢复路径诚实标注（R7 的 CHANGELOG 腿，T11）。
2. progress-M7:389「Note §5」指针勘正，或将评估三路结论补入 Note 对应节（T11）。
3. session-17 记录 T2-T9 红绿数字补全（T11， pitfalls 清账）。
4. STATUS/roadmap/progress S17 收官刷新 + merge --no-ff → master + 接力指令（T11）。
5. 顺手项：ADR-0015 Decision 2 `user_search_options`→`web_search_options` 笔误。
