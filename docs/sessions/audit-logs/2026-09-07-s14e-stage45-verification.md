# Audit Log — S14e 阶段 4/5 独立验证（全量门墙 + 五点对峙 + 截图视觉 + 推导反转探针 + 三问）

- **参数头**：阶段 4/5（全量门墙唯一责任点 + 五点对峙 + AI 视觉亲读 + controller 推导反转探针 + 三问快评）｜对象：Session 14e（免费 fetch 搜索兜底 DDG + fallbackProvider 二选一自动默认 + 链徽标化，master @ `355fede`，merge 亲证）｜输入指针：/tmp/dshws-s14a/screenshot-s14e.png（14:56，只读）+ session-14e 正本 + 仓内源码/测试｜基线：S14d master `4a3e315`（284|9(293)、48 keys、50 lint files、client.js 53.48 kB）｜纪律：除探针（完整还原亲证）与本日志落盘外零修改/零 git 写；3423/3432 用户检验窗实例全程零触碰。
- **输出原文**（独立 Agent 逐字落盘，2026-09-07；与执行 Agent 上下文完全隔离，只认证据）。

---

## ① 门墙数字表（实测 vs 声称）

| 门 | 声称 | 实测（亲跑 2026-09-07 午后，node v22.23.2 pnpm） | 判定 |
|---|---|---|---|
| ① `pnpm test` | 292 passed \| 9 skipped (301) | **29 files（28 passed + 1 skipped 全 skip 文件 chain.real），292 passed \| 9 skipped (301)**，2.07s | 零偏差 |
| ② `pnpm typecheck` | 0 | `tsc --noEmit && tsc --noEmit -p tsconfig.client.json` **exit 0** | 零偏差 |
| ③ `pnpm lint` | 0w0e 50f | **0 warnings 0 errors，52 files**（96 rules，26ms） | 🟢-1 偏差（50f→52f） |
| ④ `pnpm build` | 65.89+28.02+54.91 | **index.js 65.89 kB / index.d.ts 28.02 kB / client.js 54.91 kB** 逐位一致（vs S14d 基线：client.js 53.48→54.91 = +1.43 kB，choice 二选一 + ! 徽标 + controller 推导的净增；index.js 60.95→65.89 = +4.94 kB，fetchsearch provider + auto getter） | 零偏差 |
| ⑤ `pnpm pack` | 五件 | **5 files**：cordis.patch.yml + lib/client.js + lib/index.js + lib/index.d.ts + package.json（`npm pack --dry-run` 只读亲证，无落盘） | 零偏差 |
| ⑥ `pnpm check:i18n` | 51 keys + 19 files | **51 keys union/en/zh parity holds + 19 files zero CJK literals**，exit 0（S14d 48 → 51 净 +3：fallbackChoiceFree/chainOrderBadge/chainOrderHint，与 locales.ts 键联合亲读一致） | 零偏差 |
| ⑦ `git status` clean | clean | 验证首 / build 后 / **探针还原后** clean 三度亲证（porcelain 空，本日志落盘除外） | 零偏差 |

基线对账：284→292（+8）= fetchsearch.test 6 用例 + apply.test 语义 2 用例（无凭据恒 AVAILABLE + paid 无 key 不可用）+ e2e loopback 适配；48→51 keys、client.js +1.43 kB 与 merge 摘要自述一致。**声称除 lint 文件数外零偏差成立。**

**🟢-1（lint 文件数笔误）**：52 = 50 + 2（S14e 新增 `src/providers/fetchsearch.ts` + `tests/providers/fetchsearch.test.ts`，diff --stat 亲证）；执行者台账的 50f 沿用 S14d 旧数未随 +2 文件更新。结果面（0w0e）零偏差，纯记录失真。

**diff 范围附加核**：`git diff 4a3e315..355fede --stat` = 18 files +525/−79；src 面**恰六文件**（fetchsearch.ts +105 新增 / index.ts 20+ / config.ts 38+ / section.tsx 58+ / controller.ts 21+ / locales.ts 9+）+ 测试五文件（fetchsearch.test.ts +66 新增 / apply / section.spec / loopback / deepseek 各小改）+ 文档七件——chain/core.ts、settings.ts、keys.ts、websearch-row.tsx、其余五 provider 零触碰，与 plan 014e WBS 对应无越界。**注意：tests/client/controller.spec.ts 零改动**（与 ④ 探针结论互证）。

## ② 五点对峙逐条结论

- **R1（dshws-fetch-search 成员）PASS**。`src/providers/fetchsearch.ts` 全文亲读（105 行）：解析 `parseDdgHtml` 主块正则锚 `result__a` 类锚点 + 标题去标签 + `result__snippet` 尾随提取 + maxResults 截断 + URL 强制 `^https?://` 白名单（:57）；uddg 解码 `decodeDdgHref`（:30-41）：`indexOf('uddg=')` + `split('&')[0]` + `decodeURIComponent` try/catch（malformed 保 raw tail 不崩）；免 key gate：`available()` 恒 true（:72-74，注释 "carries no credential ref: its gate is always ready"）+ `search()` 空 query→`DSHWS_FIRECRAWL_CREDENTIAL_MISSING`、fetch POST `html.duckduckgo.com/html/` 带 `redirect:'error'`、HTTP !ok→`REQUEST_FAILED`、解析零结果→`BAD_RESPONSE`（fail-loud，无更低层）。错误族复用 firecrawl 桶（:24，fetch face of the generic bucket）。**6 用例亲跑**（`npx vitest run tests/providers/fetchsearch.test.ts`）：**6/6 绿 13ms**；测试本体亲读——fixture 三块（uddg 跳板/直链/javascript: 毒 scheme）断言精确 toEqual、decodes+直连透传、markup 剥离、毒 scheme 丢弃、maxResults=1 截断、id 双重校验（常量+字面量）、available 恒 true、空 query 码、mock fetch 解析、503→REQUEST_FAILED、空 HTML→BAD_RESPONSE。断言面与实现面咬合。
- **R2（fallbackProvider 三态）PASS**。**schema**：`src/config.ts:191` `fallbackProvider: z.union(['deepseek', 'fetch', 'auto'])` 三值闭合；**resolveConfig**：:320 `fallbackProvider: config.fallbackProvider ?? 'auto'` 显式默认 + :316-319 `searchChain` 经 `withFallbackTail`（:60-63 剥双兜底 id 再 append `fallbackMemberId(choice)`；:52-57 'fetch'→FETCH id，'deepseek'/未设→DEEPSEEK id，**'auto' 保持符号化交调用方**，注释 "the key gate is runtime state, not config"）；**order getter auto 现场解析**：`src/index.ts:157-167`——`get order()` 每次 `live.current()` 后，`fallbackProvider === 'auto' ? (pools.deepseek.ready() ? DEEPSEEK_FALLBACK_MEMBER_ID : FETCH_FALLBACK_MEMBER_ID) : fallbackMemberId(...)`，再 `chain[chain.length-1] = tail` 覆写链尾。settings 热路径经 `LiveResolvedConfig.refresh()`→`resolveConfig` 重算（settings.ts:59-61），每请求 getter 现场读——key 配置翻转下一个 search 即切换，无重注册。fetch 链不受 choice 影响（index.ts:175-177 直读 fetchChain；resolveConfig :321-323 剥 DEEPSEEK id，fetch 面无兜底概念）。
- **R3（语义变更双用例）PASS**。`tests/apply.test.ts` 亲读 + **两用例分别亲跑均绿**：:15-20 "the chain is AVAILABLE with no credentials — the free fetch floor（S14e 语义变更，用户设计）"——`apply({})` 后 `chain.available() === true`（通路：auto→无 key→getter 尾换成 fetch-search→双恒 gate→usable）；:22-27 "an explicit PAID fallback choice with no model key keeps the chain unavailable（paid is honest）"——`apply({ fallbackProvider: 'deepseek' })` 后 `available() === false`（尾恒 dshws-deepseek，fakeCtx 无凭据全 skip）。拓扑用例 :8-13 同步亲证七成员双注册（+dshws-fetch-search）。链核心 selection 级跳过（chain/core.ts:125-130 `#isUsable`：undefined/disabled/!credentialsReady/!available 全跳）与 `noMemberConfigured` fail-loud（:196-202）亲读——语义地基与 S14 前完全一致，S14e 仅扩了成员与尾选择。
- **R4（GUI choice）PASS（表现层）/ 🟡-A（controller 推导层零断言，见④探针）**。`src/client/section.tsx:493-512`：`role="group" aria-label={t('fallbackChoiceGroup')}` 内**两段** aria-pressed——付费钮 `aria-pressed={choice === 'deepseek'}` / 免费钮 `aria-pressed={choice === 'fetch'}`，onClick 各走 `onChoose('deepseek'|'fetch')`；choice 源 :349 `snapshot.fallbackProvider`。**setFallbackProvider 通路三段亲读**：section.tsx:59 绑定 `controller.setFallbackProvider(choice)` → controller.ts:258-265 `updateSettings(NS, { fallbackProvider: choice }, revision)` 回读 value + recompute（顶层字段、热生效下一个 search）。**快照推导**：controller.ts:157-159 `deriveSnapshot`——显式 'deepseek'/'fetch' 透传，**'auto'/未设 → `facts.get('DEEPSEEK_API_KEY')?.configured === true ? 'deepseek' : 'fetch'`**（客户端镜像 node 半 auto 语义）。测试面：section.spec:367-380 亲读——fixture `fallbackProvider: 'fetch'` 下 free pressed true/paid false + click 双向 `onSetFallbackProvider` 参数断言（mock 回调，表现层契约）；:301-322 兜底行零 key 面断言保持。
- **R5（! 徽标）PASS**。section.tsx:263-274：`data-testid="dshws-chain-order-info"` 圆角带边框 22×22 "!" 钮（`Tooltip label={t('chainOrderHint')}` + 同文 aria-label + `IconQuestionOutline14` 无关——直接字符 "!"），S14e 注释亲读："the order note lives behind a bordered ⓘ badge on the corner — no dead prose lines under the heading"。**prose 删除**：chains 卡内 JSX 通读无 order 提示段落（仅 timeout/maxUses/feedback 功能行）；locales `chainOrderHint` 键在（en:127/zh:182，含付费/免费二选一文案）。测试锁 section.spec:233-246 亲读：chains 卡 textContent **不含** `chainDefaultHint`/`chainTailHint`（双反向断言）+ badge 文本恰 "!" + focus 出 tooltip=`chainOrderHint` + blur 消失。

## ③ 截图 AI 视觉亲读（/tmp/dshws-s14a/screenshot-s14e.png，1280×720，14:56）

AI 视觉模型全图亲读：

- **! 徽标**：「搜索链」标题右侧小圆形 "!" 徽标亲见——位置（标题右/卡角）、形态（圆形带边框）与 section.tsx:263-274 实现一致。
- **choice 组**：DeepSeek 兜底行两枚按钮「DeepSeek 付费」「Fetch 免费」亲见，**「DeepSeek 付费」呈按下/高亮态**。该截图生成环境 DEEPSEEK_API_KEY 已配置（行首状态点实心绿亲证），auto 推导→paid pressed——**视觉态与推导语义自洽**（若显示 fetch pressed 才是缺陷）。
- **prose**：链卡内无 chainDefaultHint/chainTailHint 类长句死 prose（可见文字为 timeout 30000ms / maxUses 10 功能行）；页面级 description 属页头区，非链卡。DOM 层由 section.spec:233-246 断言背书。

## ④ 探针：controller auto 推导反转（configured→'fetch'）

**协议**：备份 controller.ts（sha `ce8fe700…` 双写亲证）→ Edit 反转 deriveSnapshot:159 三元两臂（`configured===true ? 'fetch' : 'deepseek'`）→ 跑测 → `cp` 还原 → sha 复核 + 全量复绿 + clean 复核。

| 步骤 | 结果 |
|---|---|
| 注入后 `vitest run tests/client/controller.spec.ts` | **21/21 仍绿（探针阴性——应红未红）** |
| 注入后全量 `pnpm test` | **292 passed \| 9 skipped (301) 仍全绿** |
| 还原 | `cp` 回写，sha `ce8fe700…` 逐位一致，`git diff` 空 |
| 复跑 controller.spec + 全量 + clean | 21/21 绿、292|9(301) 绿、porcelain 空 |

**🟡-A（结论：客户端 fallback 推导层零测试覆盖）**：把 auto 推导完全反转（有 key→fetch、无 key→deepseek，即语义 100% 颠倒）后**整个 292 用例套件无一变红**。交叉证据：`grep fallbackProvider tests/client/controller.spec.ts` 零命中（该文件在 S14e diff 中零改动）；section.spec 的 pressed 断言用手写 props fixture（snapshot.fallbackProvider='fetch'），不经推导逻辑；entry.spec 只测 key 保存通路。同批 `setFallbackProvider` action 亦无调用断言（section.spec 只 mock props 回调）。**缺口边界清晰**：node 半 order getter 的 auto（apply.test 两语义用例）与 GUI 表现层（section.spec choice 断言）均有牙，唯独 controller.ts:157-159 推导 + :258-265 action 裸奔——回归在此断裂不会被任何门墙捕获。非功能性缺陷（实现亲读正确 + 截图自洽），属测试债务，与 S14d 🟡-B（{N} 插值零断言，本次未见清偿）同类。

## ⑤ 三问快评

- **安全**：PASS。**ReDoS**——parseDdgHtml 全部正则亲读：无嵌套量词（无 `(x+)+`/`(x*)*` 形态）；`[\s\S]*?` 惰性 + `matchAll` 线性推进；前瞻内 `<\/div>\s*<\/div>\s*<\/body>` 的 `\s*` 不嵌套；去标签 `/<[^>]+>/g` 单层；`class="[^"]*result__a[^"]*"` 属 `A*X A*` 模式（最坏 O(n²) 单次尝试，输入为 DDG 页面级 HTML 数十 KB，量级可接受，非指数）。decodeDdgHref 纯 indexOf/split 无正则。**注入**——title/snippet 外部 HTML 提取物全链路以 React 文本插值渲染（websearch-row.tsx :149-160 先做 typeof string 收窄），`grep -rn dangerouslySetInnerHTML src/ tests/` **零命中**，React 文本节点自动转义；URL 侧 `^https?://` 白名单丢弃 javascript: 等毒 scheme（测试覆盖）。附带观察（🟢，非安全）：title/snippet 未做 HTML 实体解码，`&amp;` 类实体会原样显示——显示瑕疵。
- **契约**：PASS。`check-locales` 亲跑 **51 keys union/en/zh parity holds**；19 files zero CJK literals。键增对账 S14d 48→51（fallbackChoiceFree/chainOrderBadge/chainOrderHint）与 diff 一致。附带观察（🟢-2 死键）：`fallbackChoiceNone`（"None (fail loud)" 三选一时代残留）与 `chainOrderBadge` 在 src/tests 均零引用——纯死键；`chainDefaultHint`/`chainTailHint` 仅作 section.spec 反向断言锚（有意保留，prose 删除的守卫），不属死键。
- **前瞻**：PASS。DDG 可达性披露归 S15 **在档亲证**：session-14e.md:27「DDG 可达性=网络依赖（不可达→成员失败→链尽 fail-loud，无更低层——诚实披露）；README/ADR（S15）」+ :30「S15 手册（正素材含兜底二选一语义+免费地板说明+DDG 可达性披露）」；plan 014e D5（不可达语义）/D6（README/ADR 注记归 S15 + Bing 抓取否决）。实现侧 fail-loud 闭环与披露一致（R1）。

## ⑥ 总判定

**🟡（通过，附债务清单）**

门墙七门全绿、五点对峙全部 PASS、截图三项亲证、三问全 PASS、探针完整还原（sha 逐位 + 复绿 + clean 三重亲证）。功能实现与声称一致，无安全缺陷。债务三笔：

1. **🟡-A（探针实锤）**：controller 客户端 auto 推导（controller.ts:157-159）+ setFallbackProvider action（:258-265）零测试覆盖——反转语义全量仍绿。建议 S15 补 controller.spec 两用例（空值+DEEPSEEK key configured/unconfigured 三态断言 + setFallbackProvider patch 断言），沿用 S14c 🟡-2/S14d 🟡-B 清偿惯例。
2. **🟢-1**：台账 lint 文件数 50f 沿用 S14d 旧数，实际 52f（+2 新文件未记账）。纯记录失真。
3. **🟢-2**：locales 死键 fallbackChoiceNone/chainOrderBadge（零引用）；附带 title/snippet HTML 实体不解码的显示瑕疵。可随 S15 手册/键清理一并处理。
