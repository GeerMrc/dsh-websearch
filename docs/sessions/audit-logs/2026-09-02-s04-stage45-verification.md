# Audit Log — 阶段 4/5 独立验证（Session 04）

> 参数头：骨架库 v2 ｜ 阶段 4 + 阶段 5（合并 spawn，S03 先例）｜ Session 04 ｜ 输入指针：docs/plans/2026-09-02-004-s04-providers-credentials-plan.md、docs/session-roadmap.md S04 行、commit 范围（代码批 d2e10b7→ec14f96 十 commit + master 直提 4fc4187/364675d/8665e3b，自行 git log 复核）、命令（pnpm test / typecheck / lint / build）、docs/dont-do.md、skill pitfalls.md、progress-M3 已验锚点台账 ｜ 相对骨架的偏离说明：阶段 4/5 由同一独立 Agent 顺次承担（阶段 5 采信阶段 4 亲跑数字，未重复全量实跑）；冒烟按骨架「以用户路径执行一次主流程」建议以 /tmp node 脚本驱动构建产物 lib/index.js。
> 审核执行：独立 general-purpose Agent（与阶段 0/2 审核及执行上下文均隔离）。
> 输出原文逐字落盘如下（结论：PASS 逐 R + COMPLETE，附 F-1 一项 T10 前置义务）。

---

# S04 阶段 4/5 独立审核报告（feat/s04-providers-credentials @ ec14f96）

## 阶段 0：输入复核

- **commit 范围与声称一致**。代码批 d2e10b7→ec14f96 十 commit（d2e10b7/b351d42/351bc6f/2a5e3ad/af3d9b7/9d0d61e/b8a6755/8815edd/e8e50c4/ec14f96）全部在 feat 分支；计划文档批 4fc4187/364675d/8665e3b 经 `git branch --contains` 确认在 master 直提。`git log --format` 亲读十个 commit message 全文：T1/T2/T6 带行为红证据数字，T3/T4/T5 红证据为「Cannot find module」（模块缺失型红——测试先行的合法红，弱于行为红，如实记观察级），T7 带 skip 实测。
- **锚点台账**：宿主仓库 HEAD 即锚点 commit 3281e04b59（`git merge-base --is-ancestor` 通过，diff 为空）→ progress-M3.md「已验锚点」节全部**引用不重验**（credentials seam 行号、上游 provider 锚、tavily 取证、anysearch peer 先例）。
- dont-do/pitfalls 逐条对照：见各 R 末尾标注。

## 阶段 4：逐 R 核验

**R1 假面替换 — PASS**
- `src/chain/core.ts:86-100`：`toResolver()` 无常量 true，resolve 时点调 `gates?.enabled?.() ?? true` / `gates?.credentialsReady?.() ?? true`；:64-70 JSDoc 明示缺省语义与「bundled members must always pass gates」，S03「Until S04」注已移除。
- 行为测试 `tests/chain/registry.test.ts:34-63`：gate 状态断言（:41-42）、热读翻转（:45-55，同一 resolver 二次 resolve 见翻转）、缺省 true（:57-63）、dispose 连带删 gates（:65-72）——四态齐。
- 既有 47 条回归：全量实跑绿（见门墙），registry/errors/apply 旧断言除 plan M-1 点名的形状断言外零改动。

**R2 两 provider 四态红→绿 — PASS**
- deepseek `tests/providers/deepseek.test.ts`（14 tests）：成功映射（:98-122 去重/citations→snippet/content 缺省）、429 非 JSON + JSON 体（:131-149→HTTP_ERROR）、断网（:151-157→REQUEST_FAILED）、abort 真实事件路径（:159-167→ABORTED，stub fetch 监听 signal，无 fake timers，D7 口径）、凭据缺失不触线（:169-179）、凭据解析拒绝（:181-194→REQUEST_FAILED）、BAD_RESPONSE 两路径（:124-127/:196-200）、请求映射全字段（:69-94）。
- tavily `tests/providers/tavily.test.ts`（16 tests）：同构四态（:125-155）+ 凭据缺失/解析拒绝（:157-182）+ 请求映射含 **max_results 透传不 clamp 三断言**（:79-93 显式/回退/省略，D6）。
- 错误码族 `src/errors.ts:27-45`：deepseek/tavily 两族五键对象，firecrawl/exa/perplexity 保持前缀；`tests/errors.test.ts:27-45` 形状断言随行为更新（M-1 口径，plan 点名的 :28-30 旧断言已换形）。错误码族对象形成立。
- 红绿留痕：每任务一 commit，message 红证据数字与 progress-M3.md:71-77 任务表逐条一致。

**R3 凭据热刷新 — PASS**
- `src/credentials.ts:39-81`：未 describe 读 false（:64）、事件命中受管 ref 重 describe（:48/:68-69 过滤未受管）、describe 抛错 = false + 日志（:73-79）、prime 语法校验 fail-loud（:57）。
- 语义测试 `tests/credentials.test.ts`（6 tests）：prime 双态/未知 ref/事件双向翻转（vi.waitFor）/无关 ref 不动缓存/容错 + 日志断言/语法校验 rejects TypeError。
- 端到端 `tests/apply.test.ts:85-100`：写 ref→事件→`chain.available()` 翻转 true→撤销→false 双向实测；:110-117 disabled 成员不贡献 readiness；:119-123 ref 非法 load 期抛。
- `inject = ['web', 'credentials']`：`src/index.ts:53` + apply.test.ts:80 断言。V-05 挂账落实成立。

**R4 e2e 自跳实测 — PASS**
- 两文件在位（tests/e2e.real/deepseek.real.test.ts、tavily.real.test.ts），自跳逻辑 `process.env.X` 存在性 + 长度检查→`describe.skip`（各 ：12-13）；key 经 env-backed resolve thunk（与生产同 seam）披露于文件 JSDoc。
- env 实测：`DEEPSEEK_API_KEY`/`TAVILY_API_KEY` 均 unset、无 .env 文件后跑全量，输出 `tavily.real.test.ts (2 tests | 1 skipped)` + `deepseek.real.test.ts (2 tests | 1 skipped)`——2 skip 全部命中两个真实 API 用例，keyless 锚点断言（端点/模型）照常跑。

**R5 门墙实测数字 — PASS（四命令部分；收尾 6 件套/原子翻转/合并属 T10，不在本轮）**

环境：node v22.23.2 / pnpm 11.7.0（≥22.19 达标，与台账环境行一致）。四命令串行亲跑：

| 命令 | 实测 | 台账（progress-M3.md:81-86） | 对峙 |
|---|---|---|---|
| `pnpm test` | Test Files **11 passed (11)**，Tests **93 passed \| 2 skipped (95)**，334ms，exit 0 | 11 passed (11)，93 passed \| 2 skipped (95)，~341ms | 逐位一致 |
| `pnpm typecheck` | exit 0（0 error） | exit 0 | 一致 |
| `pnpm lint` | **0 warnings and 0 errors**（18 files，96 rules） | 0w0e（18 files，96 rules） | 一致 |
| `pnpm build` | lib/index.js **29.55 kB**（gzip 8.68）+ lib/index.d.ts **13.19 kB**（gzip 3.78） | 29.55 + 13.19 kB | 逐位一致 |

**dont-do/pitfalls 命中标注**
- ❌「数字算术外推」：未命中（所有数字实跑亲见，台账数字与复测零漂移）。
- ⚠️「pre-fix 红证据只挂 commit message」（pitfalls S10 条）：**部分命中风险**——红证据目前仅在 commit message + 台账引述，session 记录尚未生成（T10 交付物），生成时必须内嵌红/绿输出关键行。
- ❌「批量写完再测」「多源状态拼图」「悬空引用」：未命中（一任务一 commit 十连；STATUS/roadmap 保持启动态、T9/T10 标「待执行」未预写 ✅）。

## 发现清单（问题）

1. **F-1（必须在 T10 合并前处置）**：工作区有**未提交**的 `pnpm-workspace.yaml` 改动——`minimumReleaseAgeExclude` 新增 `@deepseek-ai/dsh-credentials@0.1.2-alpha.4` 与 `@deepseek-ai/dsh-invariants@0.1.2-alpha.4` 两行。d2e10b7 只提交了 package.json + pnpm-lock.yaml，install 时 pnpm 自动追加的排除项残留未提交。属 D1 依赖变更的一部分，需随批补提交（或显式还原并留决策）；带着脏工作区做 `--no-ff` 合并与原子翻转违反收尾前提。
2. 观察（不阻塞）：STATUS.md:41 当前位置块措辞停在「计划包审核推进中」——中途态自愈于 T10 原子刷新，非违规。
3. 观察：deepseek.ts/tavily.ts 各约 40 行错误脚手架（throwIfAborted/aborted/isAbortError/isPositiveInteger/非 JSON 错误体展开）近乎复制，S05a 第三族落地时是提取候选（🟢 可维护性观察，当前两份属可接受显式形态）。
4. 观察：T3/T4/T5 红证据为模块缺失型（弱于行为红），如实记录即可，无需处置。

## 阶段 5：三正交交叉验证

**安全 — PASS**：全仓 grep 无真实 key 形态字面量（sk-/tvly-/高熵串零命中）；mock key 为 `dk-key`/`tvly-key`/`fake-key` 显假形态。provider 零持有：key 仅是 `search()` 内局部 const（deepseek.ts:197、tavily.ts:122），不入实例字段；gate 缓存 `Map<string, boolean>`（credentials.ts:43）只存 describe 事实；`resolveCredentialValue`（index.ts:135-140）每操作新解析。错误信息只引 ref 名（`apiKeyRef`，env 变量名）不引值；key 仅出现在请求头。

**契约 — PASS**：`src/index.ts` 导出面与构建产物 `lib/index.d.ts:285` 导出集**逐一比对完全一致**（19 符号 + 6 type）；package.json exports `.`(types/import/default) + `./package.json`，files = lib + cordis.patch.yml。四个 id 全部 `dshws-` 前缀且有测试钉死（deepseek.test.ts:57-59、tavily.test.ts:50-52、apply.test.ts:67-68）。DshwsError 码为 `as const` 稳定对象，五键命名模式统一。MemberRegistry gates 缺省语义三处表述一致：core.ts:64-70 JSDoc = Agent Note §1 = plan D3，与实现 `?? true` 吻合。

**前瞻 — PASS**：S05a 就绪度：errors.ts:21-26 JSDoc + Agent Note §3 留痕换形口径（五键/同键名/大写蛇形）；gate 传参义务在 Agent Note §1/§2 显式留痕（「不传 gate = 假面局部复活」）；config.ts 五成员 section + `BUILT_IN_MEMBER_ORDER` 五 id 已就绪。S08 障碍：Agent Note §7 已留 DshwsError 直连传播按码匹配的断言提醒；V-06 abort×超时时序面已挂账 S08。冒烟：/tmp/dshws-smoke.mjs import 构建产物 **lib/index.js** 全流程 **SMOKE PASSED**（12 断言）：apply→注册拓扑→prime 前 available false→配 ref+事件翻 true→链 search（`[served-by: dshws-tavily]` 首行/sources 映射/`https://api.tavily.com/search`/Bearer 载每操作解析 key/max_results 透传）→直连 pinned 成员→撤销翻 false。

## 结论：**COMPLETE（附带一项 T10 前置义务）**

R1-R4 全 PASS；R5 四命令门墙 PASS 且与台账逐位一致；R5 的收尾 6 件套/原子翻转/`--no-ff` 合并按 plan 归 T10，由主 Agent 在本结论后执行。**无要求返工的未完成任务**；主 Agent 继续执行 T9 结论落盘 + T10 至 100%。

**T10 期望交付清单（供收尾对照）**：
1. 处置 F-1：`pnpm-workspace.yaml` 补提交（归依赖变更语义）或显式还原留痕——合并前工作区必须清洁。
2. progress-M3.md：S04 批次任务表 T9/T10 行完成 + 阶段验收 R1-R5 表填写（引用本轮实跑数字正本：93 passed | 2 skipped (95; 11 files)、typecheck exit 0、lint 0w0e 18 files、build 29.55+13.19 kB）。
3. `docs/sessions/2026-09-02-session-04.md` 新建：红/绿证据关键行**内嵌任务条目**（pitfalls「不只挂 commit message」）、阶段 4/5 结论、F-1 处置记录。
4. STATUS.md 台账 S04 行 🚧→✅ + 当前位置块刷新（受控词表）；roadmap Session 04 行 ⏳→✅——与 progress 同序列原子翻转，收官条目只引用已存在文件。
5. CHANGELOG 跟踪节基线数字更新（不得算术外推）。
6. 接力指令（记录末节 + 回复末尾，最小自举集五语义点）。
7. `feat/s04-providers-credentials` **`--no-ff`** 合入 master（merge commit 留痕）。
8. 踩坑沉淀：本棒无系统性坑则显式声明零新增；F-1 属一次性残留，记 session 记录即可，不入 dont-do。
