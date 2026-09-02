# Audit Log — 阶段 4/5 独立验证（Session 05a）

> 参数头：骨架库 v2 ｜ 阶段 4 + 阶段 5（合并 spawn，S03/S04 先例）｜ Session 05a ｜ 输入指针：docs/plans/2026-09-02-005a-s05a-providers-settings-plan.md、docs/session-roadmap.md S05a 行、commit 范围（feat 批 32c4cea→a0d6f00 十 commit + master 直提 1d8d6e7/d94a595/aaf7ab1，自行 git log 复核）、命令（pnpm test / typecheck / lint / build）、docs/dont-do.md、skill pitfalls.md、progress-M3 已验锚点台账 ｜ 相对骨架的偏离说明：阶段 4/5 由同一独立 Agent 顺次承担（阶段 5 采信阶段 4 亲跑数字，未重复全量实跑）；冒烟按 plan 验证矩阵 S-6 形态（/tmp node 脚本驱动构建产物 lib/index.js）。
> 审核执行：独立 general-purpose Agent（与阶段 0/2 审核及执行上下文均隔离）。
> 输出原文逐字落盘如下（结论：阶段 4 PASS（🟡 F-1 一项 T10 前置）+ 阶段 5 COMPLETE）。

---

# S05a 阶段 4（回顾审核）+ 阶段 5（交叉验证）独立审核报告

审核环境：dsh-websearch @ `feat/s05a-providers-settings` = `a0d6f00`（工作树干净），node v22.23.2 / pnpm 11.7.0，EXA/PERPLEXITY/FIRECRAWL/DEEPSEEK/TAVILY key 全 unset 实证。

## 前置复核

- **commit 范围与声称一致**：feat 批十连 `32c4cea`(T-prep)→`f00f133`(T1)→`7922597`(T2)→`730ef40`(T3)→`d4842a1`(T4)→`9a4eb74`(T5)→`e8e86e6`(T6)→`458c6c1`(T7)→`8a9bc99`(T7b)→`a0d6f00`(T8)；master 直提 `1d8d6e7`/`d94a595`/`aaf7ab1` 三连。无多提漏提。
- **锚点台账对峙**：宿主 `packages/settings/settings/src/index.ts` 末变 2026-09-01（`a402b0c`）、`web-search-exa/src/provider.ts` 末变 2026-08-09——均早于台账验证时点，按纪律引用台账；行号抽验命中（:469 installSection 签名、:868 hooks JSDoc、exa :22/:56-65/:98-114）。

## 阶段 4 逐 R 结论

**R1 三族错误码换形 — PASS**
`src/errors.ts:27-63`：deepseek/tavily/firecrawl/exa/perplexity 五族全为五键对象形（credentialMissing/requestFailed/httpError/badResponse/aborted），零前缀 string 残留。`tests/errors.test.ts:27-63` 五族 `toEqual` 全形状断言随行为更新。

**R2 exa/perplexity 四态红→绿 — PASS**
- `tests/providers/exa.test.ts` **17 条**（实跑文件级计数同）：请求映射三断言（numResults 显式/回退/省略 :62-99）+ 成功映射丢无 highlight 项（:102-115）+ 429→`DSHWS_EXA_HTTP_ERROR`（:129-141，含 JSON error 体展开）+ 断网→REQUEST_FAILED（:143-149）+ abort→ABORTED 真实事件路径（:151-159）+ 凭据缺失不发 wire（:161-171）+ 解析拒绝→REQUEST_FAILED + BAD_RESPONSE + available() + id 契约。
- `tests/providers/perplexity.test.ts` **15 条**：同口径四态 + content 承载答案 + search_results 优先/citations 仅缺席兜底（:104-117）。
- e2e real 两文件就位，skip 实测（本轮亲跑）：exa `2 tests | 1 skipped`、perplexity `2 tests | 1 skipped`。
- 红绿留痕：`730ef40`/`d4842a1` commit message（红=模块缺失；绿=17/15+全量 110/125）+ progress-M3 任务表红绿数字列。

**R3 firecrawl search+fetch 双面 — PASS（附 1 项 🟢 观察）**
- `tests/providers/firecrawl.test.ts` **19 条**：search 四态 + `data.web[]` 映射（description→snippet、丢无 url 项）+ `success:false`→BAD_RESPONSE（:109-113）+ 402/429 错误体展开；fetch 面 `formats:['markdown']` 请求断言（:196）、markdown→`{kind:'text'}`（:200）、statusCode 透传+缺省 200、`metadata.url→sourceURL→request url` 回退链（:205-214）、断网+abort（:216-229）、success:false+unprocessable（:231-237）。
- 单类双接口：`src/providers/firecrawl.ts:158` `implements WebSearchProvider, WebFetchProvider`，单实例三处注册（`src/index.ts:149-151,178,192-193`）。
- e2e real 双面就位（search+scrape 各一 it），skip 实测 `3 tests | 2 skipped`。
- **🟢 观察**：fetch 面无直接 402/429 `httpError` it——该路径由双面共用私有 `#parse`（firecrawl.ts:236-258）承担，search 面 :115-127 已钉同一代码；T5 WBS「镜像**子集**」措辞下可接受，不阻塞。
- 红绿留痕：`9a4eb74`（红=模块缺失；绿=19 passed、全量 144）。

**R4 settings 热改实测 — PASS**
- `src/settings.ts:32-60` LiveResolvedConfig（setSource/refresh 均重跑 resolveConfig）；`:70-83` attachSettingsSection 条件注入。
- `tests/settings.test.ts` 6 条 = 4 unit + 1 fake attach + **1 真实 seam**（:121-142：`new Context()` + `MemorySettings extends SettingsProvider` 驱动 attach→`ctx.settings.update`→dispose 回退 entry，全部 `vi.waitFor` 实证）。
- `tests/apply.test.ts` 热改链序四面：链序翻转（:151-175，全 500 stub 下 exhausted 摘要记录实际走查序翻转）、timeout 热读（30ms 降级→5000ms 慢成员胜出 :177-219）、enabled 翻转（→`DSHWS_NO_MEMBER_CONFIGURED` :221-232）、无 settings 服务回退（:234-241）。
- 说明：链序断言经失败摘要序而非 spy 调用序数组——由实际遍历派生，行为等价且更强，R4「下次搜索新序生效」意图满足。

**R5 五 provider 注册 + 门墙 — PASS（附 1 项 🟡 必修）**
- 期望序断言逐位命中（apply.test.ts:91-92）：search=`['dshws-chain','dshws-tavily','dshws-exa','dshws-perplexity','dshws-firecrawl','dshws-deepseek']`、fetch=`['dshws-chain-fetch','dshws-firecrawl']`。
- **门墙四命令本轮亲跑**（严格串行，命令原文 `pnpm test` / `pnpm typecheck` / `pnpm lint` / `pnpm build`）：
  - test → **Test Files 18 passed (18)；Tests 157 passed | 6 skipped (163)**；exit 0 —— 与台账逐位一致
  - typecheck → exit 0 —— 一致
  - lint → **0 warnings and 0 errors**（30 files，96 rules）—— 一致
  - build → lib/index.js **49.00 kB**（gzip 12.34）—— 一致；**lib/index.d.ts 实测 21.89 kB（gzip 4.83）≠ 台账 20.42 kB（gzip 4.75）**
- **🟡 F-1（唯一发现，T10 必修）**：门墙数字在 T8 commit 内先测后改——`a0d6f00` 同批为 `src/config.ts` 增补 Hot/Launch-static JSDoc（22 行，`git diff 8a9bc99..a0d6f00 -- src/config.ts` 实证）流入 .d.ts，台账 `.d.ts` 数字相对 HEAD 陈旧。build 本身 HEAD 绿。处置 = T10 以 HEAD 重跑 build 修正台账数字并留痕（同 S04「台账初稿误写…修正后终值」先例）。这是 pitfalls「验收数字失实」家族的一次相邻复发（非算术外推，系测改时序），已在下文 pitfalls 节标注。

**T1 零漂移 — PASS**：`git show f00f133 --name-only` 仅 deepseek/shared/tavily 三 src 文件，`grep -c '^tests/'` = **0**；消息保形抽验 2 条逐字比对：`'DeepSeek search aborted'`（前 `f00f133^:deepseek.ts:283` → 现 shared.ts:34 label 形）与 no-API-key 长文案（前 tavily.ts:185 → shared.ts:104-108），label 实参 `'DeepSeek'/'Tavily'`（deepseek.ts:265、tavily.ts:178）保形；T1 时全量 93 passed | 2 skipped（progress 表）+ HEAD 全量本轮绿。

**D7 透传修正 — PASS**：`ChainOptions` 无 id（core.ts:36-45）；core 全文零 `options.id` 运行时消费（契约瘦身成立）；两壳构造器按引用持有（core.ts:222-224/:246-248，无 spread），`ChainCore` 存引用（:111-114），`run()` 每迭代读 `order`（:139）、每成员读 `perMemberTimeoutMs`（:151-154）；tests/chain 33 条（21+5+7）本轮全绿。

**架构树同步 — PASS**：`docs/00-architecture.md` §3 树 `chain/core.ts` 行在位（幽灵 search-chain.ts/fetch-chain.ts 全文 grep 零命中）+ `providers/shared.ts` 行在位。

**dont-do / pitfalls 复发标注**：dont-do 两条（版本域/dist-tag）零复发；pitfalls 中「并发重负载」（本轮严格串行）、「提前预写收官」（STATUS 🚧/roadmap ⏳/progress T9-T10 待执行，三源一致）、「锚点重验」（未变文件引用台账）零复发；「验收数字」家族 🟡 F-1 一处（见上）；「pre-fix 红证据只挂 commit message」——现状 = commit message + progress 表双载体（符合本轮约定留痕形态），但 pitfalls 要求关键行内嵌 session 记录任务条目，该义务**顺延至 T10**（记录尚未生成的正当窗口内）。

**未完成任务**：仅 T9（本报告）与 T10。

## T10 期望交付清单

1. **🟡 F-1 必修前置**：HEAD 重跑 `pnpm build`，progress-M3 门墙节 `.d.ts` 改 21.89 kB / gzip 4.83 并附一句修正留痕；R5 表「逐位一致」表述与修正后数字对齐。
2. 治理 6 件套：progress-M3 S05a R 表（本报告结论+证据落账）+ session-05a 记录（**各任务 pre-fix 失败关键行内嵌任务条目**，清偿上述顺延义务）+ STATUS 台账行 ✅ + 当前位置块刷新 + roadmap 05a 行 ✅（指针式）+ CHANGELOG + 接力指令（记录末节+回复末尾）。
3. audit-log 正本落 `docs/sessions/audit-logs/`（本报告原文）。
4. 同一序列原子翻转 + `--no-ff` 合入 master（高危预告②）；踩坑沉淀：F-1 若判定「T8 批内测改时序」为系统性则入 pitfalls，否则显式声明零新增。

## 阶段 5 三正交 + 冒烟

- **安全 COMPLETE**：真实 key 字面量扫描零命中（URL 仅 DEFAULT 常量；sk-/pplx-/fc- 形态串零）；firecrawl fetch 面目标 URL 仅作为 JSON body 发往 api.firecrawl.dev，宿主进程不直连目标——上游 `web-fetch-http` 的 policy/publicHttpNetwork 层针对直连抓取，此处语义为托管抓取，无新增宿主侧暴露（第三方收到任意 URL 的信任模型与托管搜索同）。settings 节仅承载 Config（链序/超时/enabled/apiKeyEnv **名**/baseURL/model），CredentialGate「只缓存 describe 事实——绝不缓存 key 值」（credentials.ts:9-11），值经每操作 thunk 解析不落地。
- **契约 COMPLETE**：`src/index.ts` 导出 ≡ `lib/index.d.ts` 单行导出表（34 名逐对一致）；五成员 id 全 `dshws-` 前缀（五文件 MEMBER_ID 实锚）；firecrawl 双注册 disposer = 4 个独立 effect（ctx.web 搜索面/searchMembers/ctx.web fetch 面/fetchMembers），各 disposer 只删自家注册表项（core.ts:74-81），gate 闭包共享 live/gate 无状态互不腐蚀；MemberGates 显式五成员全覆盖（index.ts:187-190/:193），无 gate-less 捆绑成员。
- **前瞻 COMPLETE**：S05b 安装面无阻塞（files/exports/engines 齐，cordis.patch.yml insert 块在位，peer 四件域内）；S06 settings describe/mutate 面就绪（`dsh-websearch` 节 + 全量 Config schema 经 installSection 注册，S02 H3 先例；Agent Note §1 已写 GUI 义务：enabled 热、launch-static 字段须提示重启）；firecrawl `success:false` 双面防御已实现已测，文档外形态容错（缺 data.web→[]、metadata.url 回退链、statusCode??200、缺 markdown→BAD_RESPONSE）。
- **冒烟 S-6 实跑 PASS**：`/tmp/s05a-smoke.mjs` import 构建产物 `lib/index.js` + fake ctx，13/13 断言绿——注册序/fetch 序/单实例双面/gate prime 翻 available/hooks 捕获/全 500 基线走查序（tavily 先）→ 热改后新序（deepseek 先，零重注册）→ 重排后 served-by 首行 `[served-by: dshws-deepseek]` 且 sources 命中。EXIT=0。

## 最终结论

**阶段 4：PASS**（1 项 🟡 F-1 台账 .d.ts 数字漂移，属 T10 前置必修，不阻塞流程）；**阶段 5：COMPLETE**。T10 可启动，按上述清单执行后合入。
