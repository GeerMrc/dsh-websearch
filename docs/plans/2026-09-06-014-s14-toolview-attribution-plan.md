# Plan — 2026-09-06-014-s14-toolview-attribution-plan

> plan 是验收契约。本棒 = S14 双轨：①**session 搜索溯源增强**（ADR-0010 落地：client
> half 接管 `tool.call.toolview` web_search key〔priority shadow〕+ served-by 徽标 +
> 回退语义 + 成员名映射；ADR-0010 不变）②**v2 backlog 首棒调研**（fetch 兜底开关 +
> 余额/积分看板，结论落注记）。另承接两笔 🟢 顺手债（T0 入册复评 / T2 钉牌断言）。
> 分支 `feat/s14-toolview-attribution`；client 侧单面新增 + 调研文档，node 产品面零改动。

## 目标

①插件 client half 注册 `tool.call.toolview` keyed slot 的 `web_search` 条目（priority
低于宿主默认 0 → shadow 接管），自绘同构卡片：折叠行标题渲染 served-by 服务徽标
（成员品牌名），展开区沿用 meta 派生同构呈现；无署名行（直连/外来）不渲染徽标，
meta 形状不符回退 generic 工具卡。②fetch 兜底开关与余额看板两项 v2 议题的缝隙调研
结论落 docs/notes/ 注记（含宿主零缝/唯一外挂缝/热切边界判定）。③顺手清偿 🟢 钉牌
断言 + dont-do 家族入册复评。

## 背景

**任务源**：roadmap M7 段 S14 ⏳ 行（验收五条：徽标浏览器实测可见 / 直连·外来回退态
正确 / 宿主源码零 diff 断言 / 门墙全绿含 i18n 新键 / fetch 调研结论在档）；ADR-0010
（accepted 2026-09-03，呈现形态经用户确认「接管工具卡片」）。

**阶段 0 gate（2026-09-06）**：独立审核 S13 **PASS**（🔴×0 🟡×0 🟢×4；正本
docs/sessions/audit-logs/2026-09-06-s14-stage0-review-of-s13.md，T0 入库）。基线
**261 passed | 9 skipped (270)**、i18n **27 keys**、client.js **29.98 kB**、
master `69494ad` clean。

**阶段 2 计划审核（2026-09-06）**：独立 Agent **APPROVED**（无必改项；随批吸收建议
×5 已全部折入本 plan——债务映射两笔显式声明 / T5 stub 端口定值 :3430/:3431 /
锚点微偏勘正×3 / T4 徽标形态注记 / T1 slot 计数口径去锚化；正本
docs/sessions/audit-logs/2026-09-06-s14-stage2-plan-review.md，T0 入库；锚点抽查
25 处亲核）。

**摸底实锚（2026-09-06 亲测，双 Agent 调研 + 安装包复核）**：

*slot 契约（安装包 alpha.4 实锚——插件 devDeps 即此版）*：

- priority 契约：`node_modules/@deepseek-ai/dsh-client-ui-slots/lib/types/index.d.ts:399-400`
  ——cell shadowing rank，**升序、默认 0、最低者渲染；同 key + 同 priority 抛错**。
  宿主 WebRow 以默认 0 注册 → 插件必须 `priority: -1`，只同 key 注册不给更低
  priority 会直接抛错而非静默接管。
- key 域开放 + 「接管而非共享」契约：宿主仓 `packages/client/ui-tool/src/client/contract/slots.ts:15-17,20-24`。
- WebRow 渲染的是**整个工具调用块（含折叠行标题）**：派发点
  `ui-tool/src/client/tool/ToolCallTree.tsx:40-43`（`renderSlot('tool.call.toolview',
  owner, { entryKey: toolName, fallback: GenericToolCard })`）；折叠行与展开体同在
  ToolRow 内（`tool/components/ToolRow.tsx:91-286`，折叠 `:169-206` / 展开
  `:208-282`，开合 state `:113`）→ **徽标可上折叠调用行**；未命中 key 才落
  GenericToolCard。（阶段 2 审核勘正：路径含 `components/` 子目录）
- **ToolRow/WebRow/webCardModel 均未从 ui-tool `/client` 出口导出**
  （`client/index.ts:1-5` 只导出 apply/inject 与类型）→ 接管组件须自绘同构卡。
- owner props：`ToolCallOwnerProps`（slots.ts:31-46：callId/toolName/block/cwd?/home?/
  openFile/inspect?）；`block` 形状（ui-conversation `records.ts`：ToolResultNode
  主体 `:155-173`，union `:264-279`）= RunningToolCall | ToolResultNode（后者
  `call:{name,argsRaw}|null`、`content: readonly ContentBlock[]`、`isError`、
  `meta?`）。（阶段 2 审核勘正：ToolResultNode 行号）
- web_search meta 宿主写入形状：`tool-web/src/search.ts:115-121`
  `{ sources: WebSource[]; truncated: boolean; answer?: string }`——`answer` = 工具
  完整 content（含署名行）；**queries 不在 meta，在 args 的 argsRaw JSON**
  （search.ts:26,43-50）。派生校验参照 `tool/models/web-card-model.ts:58-82`
  （不合法 → null → 通用卡）。（阶段 2 审核勘正：models/ 子目录）
- 注册先例：ui-skill `client/index.ts:68-72`——`ctx.slots.inject('tool.call.toolview',
  () => ctx.slots.register({ name, key, locale }, Row))`；settings.section 先例
  ui-agent-preset `client/index.ts:196-205`。`conversation.details.tool` 是独立 slot，
  shadow toolview 不影响详情面板。
- `@deepseek-ai/dsh-client-ui-tool` 已发布（npm versions 实查含 0.1.2-alpha.4，
  至 0.1.2-rc.1）→ type-only devDep 可加；本仓 node_modules 现未装。

*插件侧锚*：

- 署名行：`src/chain/core.ts:200-210` `withServedBy`——`[served-by: ${memberId}]`
  首 content 行，**无 content 也独占一行**（署名永不消失）；ChainFetchProvider
  **无** body 署名（fetch 体是资源本身，D3）→ 本棒只接管 `web_search`。
- client 入口：`src/client/index.ts:26` `inject` 已含 `'slots'`；settings.section
  注册形态 `:37-54`（slots.inject + register + locale NS）。
- 成员名映射：`src/client/controller.ts:40-46` `MEMBERS`（memberId→label，
  S11 起导出供溯源卡复用）。
- client bundle 契约：`tsdown.client.config.ts` externals = react 系 +
  ui-primitives（= `dsh.client.external`，package.json）；type-only import 编译期
  擦除不入 bundle、不需 manifest 变更。
- 测试基建：vitest + jsdom + testing-library（tests/client/ 四 spec 在档；
  vitest.config inline ui-primitives）。

*fetch 调研锚（宿主仓，dev 分支 = 0.1.2-alpha.3 线 HEAD `3281e04b59`；与插件
devDeps alpha.4 一级版本差——行号以安装包复核为准）*：

- 选择机制单赢家无降级：`web/src/index.ts:172-194` resolveProvider——配置 id
  未注册/不可用/歧义/零可用**全部抛错不回落**；与 search 同一套代码同一套规则。
- 配置键 `WebRuntimeConfig { searchProvider?, fetchProvider? }`（:55-60）；行
  config 优先 env 兜底（:92-93），但 base patch 两层显式钉死
  `fetchProvider: http`（`bundle/base/cordis.patch.yml:452-454`）→ shipped 组合
  里 env 永不生效。
- 内置 fetch provider 唯一 `'http'`（`web-fetch-http/provider.ts:35`，available
  恒 true `:51-53`）且**无 settings namespace**（`web-fetch-http/src/index.ts:32-51`）
  → search 那条「用户层 settings re-point 内置 provider」缝（对照
  `web-search-deepseek/src/index.ts:85,127-139` current() 模式）对 fetch 不存在。
- 唯一外挂缝：`ctx.web.registerFetchProvider`（web/src/index.ts:114-116；同 id
  抛 `:118-129`）+ profile/bundle patch 把 `web` 行 `fetchProvider` 钉到新 id
  （overlay 整段重述 config）+ 插件 provider 内部回落 `HttpFetchProvider`（
  `web-fetch-http/src/index.ts:16-20` 公开导出，可直接组合）；id 不可复用 `'http'`。
- 热切边界：WebRuntime 构造器一次性捕获 id（:87-94）无 settings watch——**无
  settings 级热开关通道**；唯一热路径 = profile patch live reload
  （`app-boot/src/index.ts:235-261` watchUserPatches；`profile.ts:144,169`
  patchReload 'live'）。GUI 一键热开关需上游给 fetch 加 settings namespace——
  非外挂可独立完成。
- 插件现状：`ChainFetchProvider` id `dshws-chain-fetch` 已注册在产（chain/core.ts）
  ——v2 兜底开关 = patch 钉 `fetchProvider: dshws-chain-fetch` + 链内末端回落
  http 同构，零宿主改动。
- 余额看板地基：宿主 client slot 契约面**零 usage/balance/quota/stats 键**（T1 注记
  附可复核口径与命令——如 `grep -rn "key: '" <slot-catalog 或 SlotMap 契约文件>`；
  计数因口径而异〔契约声明 51 vs 全目录 65〕，载荷性结论以零命中为准，不锚计数）；
  可借面仅 `settings.section`（自建页）/`sidebar.footer.action`（入口）；
  token-meter 无 client 消费。

## 范围决策（D1-D7）

| # | 决策 | 依据 |
|---|---|---|
| D1 | **接管形态**：`ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({ name: 'tool.call.toolview', key: 'web_search', priority: -1, locale: NS }, WebSearchRow))`——priority 必须异于且低于宿主默认 0（升序最低渲染；同 key 同 priority 抛错）。卸载/注销后宿主 WebRow（priority 0 仍在）自动复原，卸载复原语义零额外代码 | 安装包 d.ts:399-400 契约；ui-skill 先例；ADR-0010 Decision 1 |
| D2 | **组件 = 自绘同构卡**（ToolRow/WebRow/webCardModel 未导出不能复用）：折叠行（icon + title + queries 摘要 + 徽标）+ 展开体（answer 文本 + sources 列表〔url/title/snippet/publishedAt〕+ truncated 注记 + IN/OUT 原文开关 + inspect 按钮〔owner 提供〕）。回退两级（ADR-0010 Decision 2）：无署名行 → 不渲染徽标、宿主同构呈现；meta 形状不符（webCardModel 同构校验不过）→ 自绘 generic 工具卡（title=toolName + content 文本 + error 态），不假设 web_search 形状。running 态 → 折叠行无徽标。icon 用 ui-primitives 现有图形原语（执行期查导出面；无则自绘占位，12a 状态点先例） | ToolRow 渲染整块含折叠行实锚；ADR-0010 Decision 1/2 |
| D3 | **徽标解析与文案**：`meta.answer`（回退 content[0] 文本块）首行 `[served-by: <id>]` 解析；成员映射复用 controller `MEMBERS`（memberId→label），未知 id 原样显示；徽标文案 locale-neutral（「· Tavily」），aria-label 走本插件 locales 新键。web_fetch 卡与 conversation.details.tool 不动 | ADR-0010 Decision 4；chain/core.ts:200-210 载体在产（S03 起，纯呈现层增量零写端变更） |
| D4 | **类型面**：首选 type-only import `@deepseek-ai/dsh-client-ui-tool/client` 的 `ToolCallViewProps`（新增 devDependency `0.1.2-alpha.4`，域内 `>=0.1.2-alpha.3 <0.1.3` 对齐既有 devDeps 钉法；type-only 编译期擦除，bundle/manifest 零变化）；T3 首步核 node_modules 实际导出，**不可得则回退本地结构类型**（按 owner props + locale t 手写，注释锚宿主 slots.ts:31-46）——择一落 Agent Note | 安装包核实锚；tsdown externals 契约 |
| D5 | **调研载体 = docs/notes/ 注记**（`2026-09-06-s14-fetch-fallback-research.md`）而非新 ADR：无当期架构决策变更（ADR-0010 维持、v2 未立项），roadmap 明文「结论落 ADR/注记」。内容：fetch 缝隙判定（单赢家无降级 + 唯一外挂缝 + 热切边界 + GUI 开关需上游）+ 余额看板地基（无现成 slot，settings.section 路径）+ 版本态说明（宿主仓 alpha.3 行号 vs 安装包 alpha.4） | 摸底实锚轨 A 全组 |
| D6 | **scope-out（不做）**：①web_fetch 卡接管（无 body 署名，ADR-0010 范围只 web_search）；②conversation.details.tool（ADR-0010 方案 C 维持 v1 外）；③宿主源码任何改动（零内核侵入红线，全程只读）；④fetch 兜底开关本体实现（v2 立项后）；⑤余额看板本体；⑥node 产品面改动（写端零变更） | ADR-0010 Decision 3；roadmap v2 口径 |
| D7 | **浏览器棒会话来源（默认）** = 本地 OpenAI 兼容 LLM stub（scratch 实例 `DEEPSEEK_BASE_URL` → 127.0.0.1 stub，脚本化返回 web_search tool_calls + 终答）+ 搜索成员 baseURL → loopback stub（S08 e2e harness 模式）→ 确定性真实 session（web_search 调用经插件链 → 署名行 → 徽标）。「直连」态 = 同实例第二轮把 searchProvider 钉单成员（绕过 chain，无署名）核对无徽标。回退梯（stub 受阻时）：qwen 真实路由跑真实轮次（S07 先例；涉 ~/.dsh 凭据读取，**届时先问**） | 验收「徽标在 session 工具调用行可见（浏览器实测）」；keyless 优先纪律 |

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 类别 | 前置 |
|---|---|---|---|---|
| T0 | 治理批（分支首提交）：plan 014 + 阶段 0/2 audit-log 入库（参数头骨架库 v2）+ roadmap S14 行 WBS/验收指针细化（→ 本 plan R 条目）+ **🟢① dont-do 入册复评**：后台 webview 输入派发族（12b focus() 不生效 / S13 locator click 超时 + dom_cua 假成功）第 2 次跨棒 → 入册一条三要素（❌以调用成功判定动作 / ✅以预期效果出现判定 + cua 坐标通路 / 来源 12b+S13）+ 启动全状态区（STATUS 台账 S14 🚧 + 位置块 + M7 总览行口径 + progress-M7 进行中/待启动）+ session-14 骨架（**三★节占位齐全**） | git clean 前置建分支；治理产物逐笔可 diff；骨架三节不缺 | 治理（机械豁免候选） | 2.5 批准 |
| T1 | D5 调研注记：docs/notes/2026-09-06-s14-fetch-fallback-research.md（fetch 缝隙判定 + 余额看板地基 + 版本态；全部 file:line 锚可复核） | 锚点抽样复核 ≥5 处有效；与 ADR-0009/0010 口径不冲突 | 文档（验证=锚点复核） | T0 |
| T2 | 🟢 钉牌断言清偿（TDD/探针）：keys.test.ts 补「失败消费仍推进游标」直接断言——写断言（现状绿）→ 探针破坏（临时引入回牌逻辑）证断言红 → 还原绿（S12 T5 探针惯例，红绿留痕） | 探针红签名 + 还原绿亲见；keys 既有 12 断言零漂移 | TDD（探针域） | T0 |
| T3 | D1-D4 组件 + 注册（TDD 核心）：devDep `@deepseek-ai/dsh-client-ui-tool`（type-only）→ 核 `ToolCallViewProps` 导出面（不可得走 D4 回退）→ `src/client/websearch-row.tsx`（自绘卡：折叠行+徽标+展开体+两级回退+running/error 态）+ locales +6 键（27→**33**：title/sources/truncated/request/response/error 类）+ `src/client/index.ts` 注册（slots.inject + priority -1）→ tests/client/toolview.spec.tsx 红绿：①链结果带署名 → 徽标含成员 label ②未知 id → 徽标原样 ③无署名（直连/外来）→ 无徽标 ④meta 形状不符 → generic 回退不炸 ⑤running 态 ⑥error 态 ⑦注册接线（key/priority/locale 载荷断言）+ entry.spec 既有断言零漂移 | 红→绿留痕；typecheck 双面；check:i18n 33 keys parity + 零 CJK | TDD | T2 |
| T4 | 门墙七命令（提交态）+ progress 台账/门墙表 + Agent Note（替身卡维护点〔ADR-0010 Decision 5〕+ priority 契约锚 + D4 类型面择一记录 + **徽标形态注记：徽标=品牌名、aria-label 走 locales；ADR Decision 1 的 `(dshws-tavily)` 后缀为示例非契约**——S15 手册正素材） | 门墙数字亲见（基线 261\|9(270) 起算增量披露）；build client.js 增量披露 | 门墙+文档 | T3 |
| T5 | D7 浏览器实测棒（scratch **3422** 起前 `lsof -ti :3422 -sTCP:LISTEN` 查占；**LLM stub 定值 :3430、loopback 成员 stub 定值 :3431，同口径起前查占**；3416/3080/61518/3417-3421 零接触）：LLM stub + loopback 成员 → 真实 session web_search 调用 → **折叠行徽标亲见**（截图归档 /tmp/dshws-s14/）→ 直连态（searchProvider 钉单成员）无徽标核对 → 外来态（宿主内置 provider 结果形状，stub 直返无署名）无徽标核对 → 复原（stub/loopback 进程精确收口、scratch home 键值复原） | 断言留痕（预期效果出现口径）；隔离纪律（「本棒动作零接触」口径 + 归属证据链）；**deepseek-harness 仓 git status 亲证 clean（R4）** | agent 实测棒 | T4 |
| T6 | 阶段 4/5 独立验证（全量唯一责任点 + R1-R7 逐条对峙 + 安全/契约/前瞻三问 + 门墙亲跑零偏差；观察项 firecrawl 402/429 复核一眼〔台账归 S14 复核〕） | PASS / COMPLETE | 强制独立 | T5 |
| T7 | 收尾：session-14 补全（三★节）+ 原子收官（dont-do ⑤ 实物 ls 清单）+ STATUS/roadmap/CHANGELOG + merge `--no-ff` + 接力指令 | 6 件套 | 收尾 | T6 |

## 验收条目（R1-R7）

- **R1**（roadmap「fetch 调研结论在档」）调研注记在档且锚点可复核：fetch 缝隙判定
  （宿主单赢家无降级 + fetch 无 settings namespace + 唯一外挂缝 = registerFetchProvider
  + patch 钉 id + 内部回落 HttpFetchProvider + 热切边界 = 仅 profile patch live reload，
  GUI 热开关需上游）+ 余额看板地基（无现成 slot；settings.section 路径）+ 版本态说明。
- **R2**（「直连/外来结果回退态正确」）toolview.spec 红绿留痕：带署名 → 徽标（成员
  label 映射 / 未知 id 原样）；无署名 → 无徽标宿主同构；meta 形状不符 → generic
  回退；running/error 态不炸。
- **R3**（接管接线）注册载荷断言：slot 名 `tool.call.toolview` + key `web_search` +
  **priority -1**（契约锚 d.ts:399-400 同 key 同 priority 抛错——priority 缺省即抛，
  断言有牙）；注销 → 宿主 WebRow 复原语义（slots.inject 装拆对称，jsdom 断言）。
- **R4**（「宿主源码零 diff 断言」）deepseek-harness 仓全程零触碰：T5/T6 `git status`
  亲证 clean（HEAD `3281e04b59`）；插件仓 grep 无宿主文件拷贝（imports 全 type-only
  或 ui-primitives external）。
- **R5**（「门墙全绿」）七命令提交态亲跑：test 增量披露（基线 261\|9(270) 起算）/
  typecheck 双面 exit 0 / lint 0w0e / build（client.js 增量披露，index.js/index.d.ts
  零漂移） / pack 五件 / **check:i18n 33 keys parity + 零 CJK** / 前后 git clean。
- **R6**（「徽标在 session 工具调用行可见」）浏览器实测：真实 session（LLM stub +
  loopback 成员确定性链路）折叠调用行徽标亲见 + 直连/外来态无徽标亲见 + 截图
  /tmp/dshws-s14/ 归档 + 隔离法证（scratch home / 端口查占 / 常驻零接触 / 复原）。
- **R7**（顺手债）「失败不回牌」钉牌断言落 keys.test（探针红→还原绿留痕）。

## 验证矩阵

| R | 证据形态 | 首验 | 复核 |
|---|---|---|---|
| R1 | 注记文档 + file:line 锚抽样复核 ≥5 | T1 | T6 |
| R2 | toolview.spec 红→绿数字 + 用例清单 | T3 | T6 重跑 |
| R3 | 注册载荷断言 + 装拆对称断言 | T3 | T6 重跑 |
| R4 | deepseek-harness `git status` clean 亲证 | T5 | T6 复证 |
| R5 | 门墙七命令提交态数字（基线起算增量披露） | T4 | T6 亲跑零偏差 |
| R6 | 浏览器断言留痕 + 截图实物 + 隔离归属证据链 | T5 | T6 采信核 |
| R7 | 探针红签名 + 还原绿 | T2 | T6 |

## 债务归属映射（正本）

- **本棒清偿**：🟢「失败不回牌」钉牌断言 → T2（progress 台账翻账）；🟢① 阶段 0
  新报「webview 输入派发族该入册未入册」→ T0 入册 dont-do（翻账）。
- **阶段 0 其余 🟢 显式声明**（随批吸收——阶段 2 审核）：🟢③「残留实例 61518 注记」
  与 🟢④「plan 节名缩写措辞」→ T0 阶段 0 audit-log 入库时一并落参数头/注记口径，
  不另立任务（S13 先例的显式化）。
- **维持不排期（显式声明）**：🟢 fetch 链排序 UI / 恢复默认序按钮 / anysearch fetch
  面（v1 不做）→ 维持；🟢 CSS module 化 → S15 顺手候选；L-2 per-profile GUI 覆盖
  二期 → 维持（plan 009 正本）。
- **观察项**：firecrawl 402/429 独立覆盖 → **T6 复核**（台账归 S14）；i18n CI 接线
  → S15；tsdown 弃用/vitest sourcemap/s06 mtime → S15 顺手；牙齿证明惯例沉淀 →
  无主候选。
- **v2 backlog**：余额看板 + fetch 兜底开关 → T1 调研结论落档后**仍 v2 不排期**
  （立项需另走计划期）。
- **新登记预测**：无；执行期发现如实入账（阶段 4/5 抓获按 S13 先例当场清偿 + 复验）。

## 高危命令预告（执行期自主边界）

1. `/tmp/dshws-s14/` scratch 自建（LLM stub 脚本 + loopback 成员 stub + 截图归档）。
2. scratch 实例 **3422** 启停（`dsh --profile web --port 3422 --no-open`；起前
   `lsof -ti :3422 -sTCP:LISTEN` 查占；kill 走 lsof :3422 精确；**3416/3080/61518/
   3417-3421 零接触**）。
3. scratch profile `pnpm install` + 插件 tarball `dsh plugin add`（`npm pack`
   非 publish；`PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"` 前置；新
   home 无同版本重复 add 坑，若复发 rm node_modules 强制重装——12a 在案）。
4. 新增 devDependency `@deepseek-ai/dsh-client-ui-tool@0.1.2-alpha.4`（type-only
   用途；域内对齐，非删除/非大版本）。
5. 浏览器自动化（stub/fake 数据；复原；无真实 key 写入）。
6. **回退梯触发时**：qwen 真实路由涉 `~/.dsh` 凭据读取——**届时先问再动**（S07
   先例不足以自动授权）。
7. deepseek-harness 仓零写（调研只读已毕；后续如需再读仅 Read/grep）。

## 风险

- **版本差**（宿主仓 alpha.3 行号 vs 安装包 alpha.4）：T3 首步对安装包复核关键锚
  （ToolCallViewProps 导出 / props 形状）；drift 处以安装包为准并在 Note 标注。
- **LLM stub 兼容面**（chat completions 形态 / tool_calls 字段 / 流式与否）：回退梯
  D7-qwen（先问）；再退——宿主 test:snapshot 录制 session 机制借用（复杂度高，
  仅记录不默认）。
- **webview 后台态输入派发**（12b/S13 家族坑，T0 入册）：每动作以「预期效果出现」
  判定；cua 坐标点击通路备用。
- **折叠行徽标视觉**（ToolRow 省略号截断布局无现成 badge 槽位）：jsdom 断言内容
  为主、视觉以截图留痕；溢出场景不强求像素级一致。
- **generic 回退覆盖面**（外来 provider 形状不可穷举）：按 webCardModel 同构校验
  + 不炸断言守住下限，ADR-0010「最坏退化为基础呈现」红线。

## 2.5 默认项披露（问询未获答时按接力序默认推进，S09/S10/S13 先例，双落披露）

- D7 浏览器棒会话来源默认 **LLM stub 方案**（keyless 优先纪律；qwen 路由仅回退且
  届时先问）。
- D4 类型面默认 **type-only import**（回退本地结构类型，T3 首步核定）。
- 本计划无开放方向问题（roadmap/ADR-0010 已定方向）；批准即按 WBS 自主推进。

（估时：1.5-2 天，roadmap 1-2 天口径内；T3 为关键路径。）
