# Audit Log — S14 阶段 2 独立计划审核（对象：plan 014 溯源徽标 + fetch/余额 v2 调研）

- **参数头**：审核库 v2｜阶段 2｜Session 14（单轮 APPROVED；独立 Agent 与计划制定者上下文隔离）｜输入指针：plan 正本 docs/plans/2026-09-06-014-s14-toolview-attribution-plan.md；参照 docs/session-roadmap.md（M7 段 S14 ⏳ 行）、docs/decisions/adr-0010-session-search-attribution.md、docs/progress/progress-M7.md（技术债台账）、docs/dont-do.md、阶段 0 正本 docs/sessions/audit-logs/2026-09-06-s14-stage0-review-of-s13.md｜实测代码面：插件侧 src/chain/core.ts、src/client/{index.ts,controller.ts,locales.ts}、tsdown.client.config.ts、package.json、tests/{keys.test.ts,client/}、vitest.config.ts；宿主仓 packages/client/ui-tool（slots/ToolCallTree/ToolRow/web-row/web-card-model/client 出口）、ui-skill、ui-agent-preset、ui-conversation records.ts、packages/web（web/web、web-fetch-http、web-search-deepseek、tool-web search.ts）、bundle/base/cordis.patch.yml、boot/app-boot；安装包 node_modules/@deepseek-ai/dsh-client-ui-slots/lib/types/index.d.ts；npm registry（dsh-client-ui-tool versions）｜要点转录：①任务源对齐（roadmap 验收五条↔R 条目）②ADR-0010 逐句一致性（Decision 1-5）③锚点抽查 ≥8（亲开双仓+安装包+registry）④可执行性（TDD 红绿判别力/R3 有牙性/D4 回退闭合/T2 探针域）⑤债务映射完整性（台账逐行）⑥风险与高危预告（治理红线对照）⑦治理合规（要素齐备/估时/分支纪律）｜偏离说明：无。

- **输出原文**（独立 Agent 逐字落盘，2026-09-06；与执行 Agent 上下文完全隔离）：

---

# 阶段 2 计划审核 — S14 toolview 溯源（正本：docs/plans/2026-09-06-014-s14-toolview-attribution-plan.md）

## 结论：**APPROVED**（无必改项；5 条随批吸收建议见下）

审核方式：亲开双仓文件核对锚点、npm registry 实查、git 只读命令。未跑测试（阶段 0 已有子集实测）。当前 dsh-websearch 状态亲证：master `69494ad`，唯一未跟踪文件即本 plan；deepseek-harness dev HEAD `3281e04b59` clean（与 R4 声称一致）。

---

## 逐审核面结论

### 1. 与任务源对齐 — 通过

roadmap S14 ⏳ 行（docs/session-roadmap.md:78）验收五条与 R 条目一一对应，无弱化：徽标浏览器实测→R6；直连/外来回退态→R2；宿主零 diff→R4；门墙含 i18n 新键→R5（27→33 键算术成立，locales.ts 现数 27 亲证）；fetch 调研在档→R1。溯源四要素全在：接管+priority shadow（D1/T3/R3）、served-by 徽标（D2/D3/R2/R6）、回退语义（D2 两级+running/error 态）、成员名映射复用 controller MEMBERS（D3；controller.ts:40-46 `MEMBERS` 在案且 JSDoc 明文「exported for the S11 attribution card's label mapping」）。fetch 调研轨（v2 backlog 首棒）→D5/T1，roadmap「结论落 ADR/注记」口径由 D5 论证承接。

### 2. 与 ADR-0010 一致性 — 通过

- Decision 1（接管路线/priority shadow/自绘卡/meta.answer 回退 content/折叠行徽标）→ D1/D2/D3 全覆盖。
- Decision 2（回退两级）→ D2 逐句对应且补 running 态（增强非偏离）。
- Decision 3（只 web_search、web_fetch 不动、宿主零 diff）→ D6 scope-out 六项 + R4。
- Decision 4（typed locales + CJK 门禁 + 成员名 locale-neutral + 未知 id 原样）→ D3 + T3（check:i18n 33 keys parity + 零 CJK）。
- Decision 5（维护责任披露）→ T4 Agent Note 落点 + 「S15 升级手册正素材」；roadmap S15 行明文含「docs/upgrade.md 升级演练手册（含溯源替身卡片维护点 ADR-0010）」——披露已排期非漏项。本棒 Note 落点 + S15 正式手册的双段安排与 ADR「README/升级手册诚实标注」一致。
- 无矛盾项。唯一措辞差：ADR Decision 1 徽标示例「· Tavily (dshws-tavily)」vs 计划 D3「· Tavily」——ADR 原文「如」标记为示例，计划满足规范性内容（已知成员显品牌名、未知显原 id），见建议 4。

### 3. 锚点抽查 — 通过（清单见文末）

22+ 处亲核，全部载荷性锚点成立，多处精确到行。三处行号/路径微偏（不影响任何载荷性结论）列入建议 3。

### 4. 可执行性 — 通过

- T0-T7 粒度逐一可执行可验收，无跨关注点批处理（T3 为一根 TDD 纵切，符合 S12 T1 先例粒度）。前置链 T0→T2→T3→T4→T5→T6→T7 清晰，T6 强制独立、T7 收尾六件套。
- toolview.spec 七用例各有判别点：①徽标含成员 label ②未知 id 原样 ③无署名 queryBy 缺席断言 ④形状不符 generic 不炸 ⑤running 无徽标 ⑥error 态 ⑦注册载荷（key/priority/locale）断言。
- R3 有牙性成立：payload 断言对「priority 缺省」判别（undefined ≠ -1）；真实后果有契约背书——安装包 d.ts:399-400 逐字亲证「ascending, default 0, lowest renders; same key + same priority throws」，且宿主 WebRow 确以无 priority（默认 0）注册（web-row.tsx:47）。装拆对称断言（R3 后半）在 jsdom 可执行（注册伪宿主行 priority 0 → inject 插件 → dispose 复原）。
- T2 探针式符合本仓 TDD 适用域：「失败不回牌」为结构保证类（台账明文「结构保证：抽牌即消费无重试环」），直接证红不可得；探针惯例 S12 T5 有正例（progress-M7:108 双牙齿探针留痕），且 T2 要求「探针红签名 + 还原绿亲见 + 既有 12 断言零漂移」（keys.test.ts 现 12 断言亲数属实）。
- D2/D4 回退分支闭合：带署名/未知 id/无署名/meta 不符/running/error/content 缺失（generic 兜底）六态全覆盖，与 ADR「最坏退化为基础呈现」红线一致。
- D4 类型面双保险成立且我已双确认：宿主源码出口 `@deepseek-ai/dsh-client-ui-tool/client` 确实 type-export `ToolCallViewProps`（client/index.ts:3-5）；npm registry 实查 `@deepseek-ai/dsh-client-ui-tool` 含 `0.1.2-alpha.4`（至 `0.1.2-rc.1`），devDep 可加；type-only 擦除 + externals 契约（tsdown.client.config.ts 亲证）下 bundle/manifest 零变化的论证成立。

### 5. 债务映射完整性 — 通过（一处声明性建议）

progress-M7.md 技术债台账（:241-256）逐行核对：🟢×5（fetch 链排序 UI/恢复默认序按钮/CSS module 化→S15/anysearch fetch 面/失败不回牌）——前四维持或 S15 候选、末项 T2 清偿 ✓；L-2 维持（plan 009 正本）✓；观察项四笔（firecrawl 402/429→T6 复核、i18n CI→S15、tsdown 等→S15 顺手、牙齿惯例→无主候选）✓；v2 backlog 两项→T1 调研后仍不排期 ✓。台账 12 行每笔有归属，无漏账。

阶段 0 新报 🟢×4：webview 家族入册复评→T0 🟢① 显式处置（dont-do.md 在档、三要素格式与既有条目一致）；钉牌断言→T2 显式处置；「残留实例注记」「plan 节名措辞」两笔未在计划文本中点名——按 S13 先例（plan 013 对阶段 0 🟢×5 显式认领 2 笔、其余骑行 T0 治理批/audit-log 入库，阶段 2 审核 APPROVED）可骑行 T0「阶段 0/2 audit-log 入库（参数头骨架库 v2）」，不构成必改；建议 1 要求补一行显式声明以闭合可审计性。

另核：阶段 0 audit-log 正本（2026-09-06-s14-stage0-review-of-s13.md）现未在盘——计划明文「T0 入库」，与 S13 模式（stage-0 log 随 T0 `e26a7dd` 入库）一致，非缺陷；T0 验收「治理产物逐笔可 diff」覆盖其落盘核验。

### 6. 风险与高危预告 — 通过（一处补口建议）

LLM stub 技术风险如实：风险节第二条点名 chat completions 形态/tool_calls 字段/流式与否三面，回退梯完整（stub→D7-qwen 届时先问→宿主 test:snapshot 录制机制借用仅记录不默认）；S08 loopback 先例 + 根仓 AGENTS.md `DEEPSEEK_BASE_URL` 机制使 127.0.0.1 stub 路线技术上成立。高危清单对照治理红线：删除（scratch 域 rm node_modules，12a 在案）✓、force 无 ✓、发布（npm pack 非 publish）✓、凭据（qwen 先问）✓、仓外写（/tmp + scratch home）✓、系统配置无 ✓、依赖变更（devDep 域内对齐 + scratch install）✓、治理产物删除无 ✓、curl|sh 无 ✓、宿主仓零写（第 7 条）✓。分支纪律 feat/s14-toolview-attribution + `--no-ff` 在 T0/T7。缺口：LLM stub 与 loopback 成员 stub 自身的监听端口未定值/未纳入查占纪律（只有应用口 3422 与常驻零接触面）——建议 2。

### 7. 治理合规 — 通过

要素齐备：目标/背景（任务源+阶段 0 gate+摸底实锚）/范围决策 D1-D7/WBS T0-T7/验收 R1-R7/验证矩阵（首验+复核双列）/债务归属映射（正本）/高危命令预告/风险/2.5 默认项披露/估时。估时 1.5-2 天在 roadmap 1-2 天口径内，T3 关键路径判断合理（自绘同构卡+七用例为本棒最大件）。T0 含 session-14 骨架三★节占位——符合 dont-do「session 记录随 T0 创建骨架」定谳条款。

---

## 随批吸收建议（非阻塞，执行期顺手落）

1. **债务映射补两笔声明**（T0 或 plan 附注一行）：阶段 0 🟢「残留实例注记」「plan 节名措辞」的归属显式化（归 T0 audit-log 入库/参数头骨架库 v2 口径），替代当前按 S13 先例的隐式骑行。
2. **T5 stub 端口定值**：给 LLM stub 与 loopback 成员 stub 的监听端口定值并纳入「起前 lsof 查占」纪律，与 3422 同口径留痕。
3. **两处锚点微偏勘正**（T1/T3 复核时顺带）：records.ts 的 ToolResultNode 主体在 `:155-173`（plan 引 `:264-279` 实覆盖 RunningToolCall + `:279` 的 union，字段内容本身全对）；ToolRow.tsx 实际路径含 `tool/components/` 子目录；web-card-model.ts 实际在 `tool/models/` 下（行号 58-82 精确）；ui-skill 先例实际 `:68-71`（±1）。
4. **徽标形态与 ADR 示例差异注记**：T4 Agent Note 一句记录「徽标=品牌名、aria-label 走 locales，ADR Decision 1 的 `(dshws-tavily)` 后缀为示例非契约」，避免 S15 手册期对照 ADR 误判偏离。
5. **slot 计数口径**：T1 注记给出「宿主 client 65 个 slot」的可复核命令与口径（我按契约文件独立 grep 得 51，方法论差异；载荷性结论「零 usage/balance/quota/stats 键 + settings.section/sidebar.footer.action 可借面存在」我已独立复核成立）。

---

## 锚点抽查清单（核了哪些、结果）

**插件侧 /Volumes/IPFSJK/Zcode/dsh-websearch（master 69494ad）**：
1. `src/chain/core.ts:204-210` withServedBy——`[served-by: ${memberId}]` 首行、无 content 独占一行 ✓（JSDoc 起于 ：199，计划引 200-210 成立）
2. `src/chain/core.ts:240-241` ChainFetchProvider id `dshws-chain-fetch` + `src/index.ts:163` registerFetchProvider 在产 ✓
3. `src/client/index.ts:26` inject 含 `'slots'` ✓ 精确
4. `src/client/index.ts:37` 起 settings.section inject+register 形态 ✓
5. `src/client/controller.ts:40-46` MEMBERS（memberId→label，S11 导出注记在案）✓ 精确
6. `tsdown.client.config.ts` externals=react 系+ui-primitives；`package.json` dsh.client.external + devDeps 四件 0.1.2-alpha.4（:50-53,78-85）✓
7. `tests/client/` 四 spec、`tests/keys.test.ts` 12 断言、vitest.config inline ui-primitives、`src/client/locales.ts` 27 键 ✓

**宿主仓 /Volumes/IPFSJK/Zcode/deepseek-harness（dev 3281e04b59，clean 亲证）**：
8. `packages/client/ui-tool/src/client/contract/slots.ts:15-17,20-24` key 域开放+「接管而非共享」✓ 精确逐行
9. 同文件 `:31-46` ToolCallOwnerProps 七字段 ✓ 精确
10. `packages/client/ui-tool/src/client/tool/ToolCallTree.tsx:40-43` renderSlot 派发（entryKey=toolName、fallback=GenericToolCard）✓ 精确
11. `tool/components/ToolRow.tsx`（286 行）：开合 state `:113` ✓ 精确；折叠/展开区间 ±2 行成立；「折叠行与展开体同在 ToolRow 内→徽标可上折叠行」结论成立（路径缺 components/ 子目录，微偏）
12. `tool/toolviews/web-row.tsx:47-48` 宿主 WebRow 注册 key web_search/web_fetch **无 priority（默认 0）** ✓——D1/R3 的前提成立
13. `tool/models/web-card-model.ts:58-82` webCardModel 同构校验（不过→null→generic）✓ 精确
14. `ui-tool client/index.ts:1-5` 只导出 apply/inject 与类型，`ToolCallViewProps` 在类型出口 ✓——D4 type-only 路线源码面成立
15. `ui-conversation/src/client/contract/records.ts`：ToolResultNode `:155-173`（call:{name,argsRaw}|null/content/isError/meta? 全对）；`:264-279` 实覆盖 RunningToolCall+union（:279）——字段引注微偏、内容真
16. `packages/web/tool-web/src/search.ts` WebSearchMeta {sources;truncated;answer?}（:115-121 附近）+ queries 在 args（parseSearchArgs）✓
17. `ui-skill client/index.ts:68-71` toolview 注册先例 + `ui-agent-preset client/index.ts:~196-205` settings.section 先例 ✓
18. `packages/web/web/src/index.ts:55-60` WebRuntimeConfig、`:87-94` 构造器一次性捕获 id、`:114-116` registerFetchProvider、`:118-129` 同 id 抛、`:172-194` resolveProvider 四路全抛不回落 ✓
19. `web-fetch-http/provider.ts` LOCAL_FETCH_PROVIDER_ID='http'（:34 附近，±1）+ available() 恒 true；`index.ts:16-20` HttpFetchProvider 公开导出；全文件 grep「settings」零命中 ✓（「fetch 无 settings namespace」对照缝成立）
20. `web-search-deepseek/src/index.ts:85` settings namespace + `:127-139` current() 模式 ✓
21. `packages/bundle/base/cordis.patch.yml:452-454` fetchProvider: http 两层钉死 ✓ 精确
22. `boot/app-boot/src/index.ts:~237-263` watchUserPatches + `profile.ts` web patchReload:'live'/DEFAULT_PROFILE_PATCH_RELOAD:'live' ✓

**安装包/registry**：
23. `node_modules/@deepseek-ai/dsh-client-ui-slots/lib/types/index.d.ts:399-400` priority 契约 ✓ 逐字（「ascending, default 0, lowest renders; same key + same priority throws」）
24. npm registry：`@deepseek-ai/dsh-client-ui-tool` versions 含 0.1.2-alpha.4、至 0.1.2-rc.1 ✓
25. slot 地基抽查：契约声明 slot 名中零 usage/balance/quota/stats；settings.section 与 sidebar.footer.action 均存在 ✓（「65」计数口径见建议 5）

**审核结论：APPROVED。**

---

*（随批吸收处置记录，T0 回填）：建议 1-5 已于 2026-09-06 折入 plan 014（债务映射两笔显式声明 / T5 stub 端口定值 :3430/:3431 / 锚点勘正×3〔plan 摸底实锚节内联标注〕 / T4 徽标形态注记 / T1 slot 计数去锚化）——计划内微调，验收标准未变，按治理规则不重审。*
