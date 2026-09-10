# Stage 4 回顾审核 — S18（全量测试唯一责任点）

> 参数头：骨架库 v2（six-stage.md 阶段 4 提示词骨架）| 阶段 4 | Session 18 |
> 输入指针：plan 正本 docs/plans/2026-09-10-018-s18-perplexity-agent-api-plan.md；commit 范围
> `c8799bd..035285d`（feat/s18-perplexity-agent-api 5 commits：10e60a4/ea8d032/0933f66/6b8c060/035285d）；
> 测试命令 `pnpm test`；静态检查 `pnpm typecheck`/`pnpm lint`/`pnpm check:i18n`。
> 相对骨架偏离说明：build/pack 归 plan T5 执行侧责任，非本面必跑（已声明可补）。
> 执行方式：独立 spawn general-purpose Agent（与主 Agent 上下文隔离），只读 + 全量/静态亲跑。

## 输出原文（逐字）

# S18 独立回顾审核报告（commit 范围 c8799bd..035285d，feat/s18-perplexity-agent-api）

## 全量亲跑（阶段 4 唯一责任点）

- `export PATH=~/.nvm/versions/node/v22.23.2/bin:$PATH; pnpm test` → **Test Files 32 passed | 1 skipped (33)；Tests 401 passed | 13 skipped (414)，exit 0**（Duration 3.35s）
- 13 skipped 逐文件核验：perplexity.real 2 / firecrawl.real 3 / deepseek.real 1 / exa.real 2 / anysearch.real 1 / chain.real 2 / tavily.real 2 —— **全部为 e2e.real 无 key 自跳**，与计划口径一致，正常。perplexity.real 3 例中 1 例（keyless anchors）实跑通过。
- vite sourcemap 警告（client-ui-primitives index.js.map ENOENT）为上游包缺失 map 的既有噪音，不影响 exit 0。

## R 条目逐条

**R1 wire 迁移 — PASS**
- `src/providers/perplexity.ts`：端点 `` fetch(`${this.options.baseURL}/v1/agent`) ``（:237）、`input`/`max_output_tokens: this.options.maxTokens`（:249 区域）、`language_preference` 顶层条件展开（:251）、`tools` 单一构造点 `type:'web_search'` 恒含（:221-228，filters 内 recency + 工具顶层 contextSize/user_location）、前缀归一 `this.options.model.includes('/') ? model : 'perplexity/' + model`（:235）。
- 测试断言在档：`tests/providers/perplexity.test.ts` :77 URL=`/v1/agent`、:84-89 缺省体 `model:'perplexity/sonar'`+`input`+`max_output_tokens:1024`+`tools:[{type:'web_search'}]` 恒在、:102 maxTokens 可配（4096）、:129 无参数时 tools 仍恒含、:160/:168 已带前缀/直传不二次加缀。
- loopback 7 处 URL 键与 arrival 断言全数迁移 `/perplexity/v1/agent`（loopback.test.ts :97/:172/:185(188)/:200(203)/:211(217)/:223(229)/:261(267) 亲读+diff 亲证旧 `/chat/completions` 全消）。

**R2 响应映射 — PASS**
- mapper：`output.find(type==='search_results').results` 优先 → `messageAnnotations`（`url_citation`）回退 → 旧 `citations` 平铺终兜底（perplexity.ts :175-199）；`truncated` 恒 false / `status:'incomplete'` 不映射（ADR-0016 Decision 4）。
- 测试三段断言在档（:173 trace 主链、:194 annotations 回退、:207 legacy citations 兜底）。
- loopback 夹具新形状亲读（:172-178）：`{ output: [ {type:'search_results', queries, results:[{id,url,title,snippet,source}]}, {type:'message', content:[{type:'output_text',text,annotations}]} ] }`，与附录 A 契约吻合。

**R3 config 面零改动 — PASS**
- `git diff c8799bd..035285d -- src/config.ts src/client/` → **零输出，exit 0**（亲证）。diff --stat 全量 22 文件亦无 src/config.ts / src/client/ 任何条目。

**R4 门墙 — PASS（亲跑数字）**
- `pnpm typecheck`（tsc --noEmit ×2）→ exit 0
- `pnpm lint`（oxlint src tests）→ **0 warnings 0 errors，57 files，26ms**，exit 0
- `pnpm check:i18n` → `check-locales: ok — 96 keys, union/en/zh parity holds` + `check-cjk: ok — 21 files, zero CJK literals`，exit 0
- （build/pack 未列入本次审核面责任，plan T5 归属执行侧；如需我可补跑。）

**R5 真实 API（降级口径）— PASS**
- /tmp/dshws-s18/ 存在性亲证：`boot-3423.log`（dsh web boot URL 3423 端口）+ `firecrawl-real-proof.txt`（firecrawl.real **4 passed**，含 tbs week 例 2606ms 真实通过、scrape 面 667ms）。
- `git diff c8799bd..035285d -- tests/e2e.real/perplexity.real.test.ts` → **零改动**（锚点常量与断言不涉 wire 形态，预判命中）；全量跑中 perplexity.real 自跳状态核实（3 tests | 2 skipped，1 keyless 例 passed）。
- 降级裁定链在档：roadmap S18 验收措辞勘注（「凭据可用面执行 + 无 key 自跳披露，补 key 后手动闭合」）+ ADR-0016 Consequences 披露。

## 探针抽查（1 处，红→绿）

- 临时破坏：把前缀归一改为直传 `model` → `npx vitest run tests/providers/perplexity.test.ts` → **2 failed | 19 passed（红）**；
- 还原（cp 备份回）→ **21 passed (21)（绿）**；`git status --short` + `git diff --stat` 零输出，工作树干净。探针确认测试对 wire 行为真实敏感。

## 已知披露核验

1. **T4 lint 装饰性修复晚于 tarball 安装 — 核实成立**：035285d 对 src/ 的全部非版本改动（排除 UA/version 字符串）仅一处——`webSearchFilters` 由条件展开改为 if 赋值 + `Record<string,string>` 注解。逐行为比对：recency undefined 时两者同产 `{}` 且 `filters` 键省略、有值时同产 `{search_recency_filter}`——**纯装饰，行为等价**，「已装 0.3.1 与 HEAD 行为等价」声称成立。
2. **ADR-0016 在档**（docs/decisions/adr-0016-perplexity-agent-api-migration.md，accepted，37 行）：D1-D4 决策、web_search 恒含理由、三级来源链、B3 截断口径延续、旧端点不留开关，全数覆盖。
3. **ADR-0015 勘注在档**：Decision 2 Perplexity 落点改为「web_search 工具顶层 user_location」并注明原 `web_search_options` 为 Sonar 形态。
4. **roadmap S18 验收措辞勘注在档**：降级口径原文亲读如上。

## 发现标注 vs dont-do/pitfalls

- 大负载串行（pitfalls.md:139）——本次审核全程串行执行，合规。
- UA×6+断言×6 原子联动（S16 P0 坑例律）——diff 亲证 12 处替换原子完成于单 commit。
- dont-do 版本域条目不直接触及本棒（无 peer 依赖变更）。

## 未完成项清单

- 无 FAIL 项。可选补漏：`pnpm run build` / pack 未在本审核面亲跑（plan T5 责任在执行侧，非阶段 4 面必跑项）。

**结论：R1-R5 全部 PASS，门墙数字为正本，探针真红真绿，披露三项全部核实成立。**
