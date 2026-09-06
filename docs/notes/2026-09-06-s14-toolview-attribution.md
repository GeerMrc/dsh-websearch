# S14 Agent Note — web_search toolview 溯源接管（ADR-0010 落地）

> 2026-09-06，plan 014 T3/T4 交付注记。ADR-0010（accepted）实现正本；本注记记录
> 实现期定谳、维护点与坑，供 S15 升级手册与后续宿主演进跟进使用。

## 1. 接管形态（与 ADR-0010 Decision 1 的对齐）

- 注册：`ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({ name:
  'tool.call.toolview', key: 'web_search', priority: -1, locale: NS },
  WebSearchToolviewRow))`（src/client/index.ts）。**priority -1 是硬约束**：keyed
  cell 升序最低者渲染、宿主 WebRow 以默认 0 注册、**同 key 同 priority 直接抛错**
  （安装包 `dsh-client-ui-slots/lib/types/index.d.ts:399-400` 逐字契约）——省略
  priority 不是「不接管」而是抛错。
- 卸载/注销复原零额外代码：插槽装拆对称（inject 装拆 + register 返回 disposer），
  宿主 priority-0 条目在插件条目注销后自动恢复渲染。
- 组件渲染**整个工具调用块**（宿主 ToolRow 折叠行与展开体同件，开合 state 在
  ToolRow 内），故徽标落在折叠调用行——「调用行可见」验收即此。

## 2. 类型面定谳（plan 014 D4：首选不可得，回退本地结构镜像）

- 首选（type-only import `@deepseek-ai/dsh-client-ui-tool/client` 的
  `ToolCallViewProps`）**实测不可用**：该包 d.ts 链经 `@deepseek-ai/dsh-client-ui-chat/client`
  解析 `block`，而本插件不依赖 ui-chat → 未安装 → **skipLibCheck 下静默 `any`**
  （垃圾对象探针：`const probe: Block = { completely: 'garbage' }` 通过 typecheck
  = 实证）。devDep 曾加后已撤（`pnpm remove`），避免无用依赖。
- 回退（已落地）：`src/client/websearch-row.tsx` 本地结构镜像——owner 面
  （callId/toolName/block/cwd?/home?/openFile/inspect?，锚宿主 ui-tool
  `contract/slots.ts:31-46`）+ block union（RunningCallFace 无 kind 字段 /
  ToolResultFace `kind:'tool-result'`，锚 ui-conversation `records.ts:155-173,264-279`）。
- **SlotMap 自 declare**：外部 client 程序里 `tool.call.toolview` 不在 SlotMap
  （ui-tool 的声明合并不在本程序）→ `ctx.slots.inject` 第一参数类型不含它。本插件
  在 websearch-row.tsx 内对该 slot 自 declare（owner = 本地镜像面）。**双 declare
  永不相遇**：本包刻意不依赖 ui-tool，两份声明不在同一程序；运行时按名串匹配注册。
- 测试 `t` 座：`TranslateNS<NS>` 含宿主共享词表键（'ok' 等）→ fixture 一次
  `as TranslateNS<'dsh-websearch'>` 边界转换（卡内不触发共享键）。

## 3. 展开体选型：WebBlock 原语弃用

- ui-primitives 导出 `WebBlock`（宿主 WebRow 展开区原语），但要求调用方供给
  `WebBlockLabels`（noResults/sourcesTruncated/http/contentTruncated/markdown 栅栏
  与脚注 chrome）——键面接近本插件现有 locale 的两倍，且多为设置页永不出现的
  chrome。**弃用，自绘同构**（answer 段 + sources 列表〔title||hostname，镜像宿主
  sourceLabel〕+ truncated 注记 + raw details + inspect）。宿主 WebBlock 演进时
  此处是跟进点（见 §5 维护点）。

## 4. 行为面（八用例谱面，tests/client/toolview.spec.tsx）

| 态 | 断言要点 |
|---|---|
| 链结果带署名 | 折叠行徽标 `· Tavily`（MEMBERS 映射）+ aria-label `Served by Tavily` |
| 未知成员 id | 徽标原样 `· member-x`（ADR-0010 Decision 4） |
| 无署名（直连/外来） | 无徽标 + 展开区宿主同构（sources 照常） |
| meta 形状不符 | generic 回退卡（content 文本 + 不炸 + 无徽标 + 无 sources） |
| running | 折叠行 title+queries 摘要，无徽标无卡体 |
| error | `Call failed: <name> (code)` note + generic 体 |
| 展开 | answer（meta.answer 原文含署名行）+ sources + truncated + raw + inspect 点击 |
| 注册载荷 | name/key `web_search`/**priority -1**/locale + 装拆对称 |

- 徽标形态注记（阶段 2 审核建议 4）：**徽标 = 品牌名**（`· Tavily`），aria-label
  走 locales `servedBy` 键；ADR-0010 Decision 1 的「`· Tavily (dshws-tavily)`」
  后缀为示例非契约——S15 手册对照时勿判偏离。
- `meta.answer` 回退 content 的语义：**解析署名行**用回退（answer 缺席时取首个
  text block）；**展示 answer** 只用 meta.answer（宿主 webCardModel 同口径，不
  无中生有 answer 区）。

## 5. 维护点（ADR-0010 Decision 5 落地——S15 升级手册正素材）

1. 宿主 WebRow/WebBlock/ToolRow 演进不自动跟进：替身卡需人工对齐（折叠行布局/
   展开区派生/IN·OUT 呈现粒度）。跟进判据：宿主 `web-card-model.ts` 校验或
   `WebSearchMeta` 形状变化 → 本卡 `deriveWebCard` 镜像同步。
2. 宿主 slot 语义变化（priority/shadow 契约）：锚 `dsh-client-ui-slots` d.ts:399-400，
   升级宿主域时复述该锚。
3. `conversation.details.tool` 独立 slot 未接管（ADR-0010 方案 C 维持 v1 外）——
   详情面板仍走宿主渲染。
4. subCalls/parentCallId：本卡不渲染嵌套子调用（web_search 无子调用面）；宿主若
   给 web_search 加子调用呈现，此处跟进。

## 6. i18n 与门墙

- locales +7 键（27→**34**；计划估 33，+`toolInspect` 键披露）：toolTitle/servedBy/
  toolSources/toolTruncated/toolRaw/toolInspect/toolError，en/zh parity + 零 CJK
  门过。
- 门墙（T4 提交态 4958fc0）：**270 passed | 9 skipped (279)**（+9 = keys 1 +
  toolview 8）；typecheck 双面 0；lint 0w0e **49 files**；build index.js 59.42 /
  index.d.ts 27.04 零漂移，**client.js 29.98→41.81 kB**（+11.83，自绘卡非压缩
  产物）；pack 五件；前后 clean。

## 7. 坑（执行期实录）

- **发布包类型链陷阱**：type-only import 的 d.ts 链引用未安装包 → skipLibCheck
  静默 any，**typecheck 照样 exit 0**——必须用垃圾对象探针实证类型是否真解析，
  不能信「编译过了」。此坑通用化价值高（凡外部 host 类型皆适用）。
- **`web !== undefined` 放过 null**：`deriveWebCard` 形状不符返回 null，与
  absent 未归一 → 运行时 `web.answer` 崩（vitest 不类型检查，typecheck 才会抓）。
  归一为「null 合并 absent」后分支两路（web 卡 / generic）。
- **getByText 精确匹配**：拼接串（`Call failed: DshwsError (…)）` 整段）用
  getByText('Call failed') 查不到——用 role=status + textContent 或正则。
- **jsdom 折叠语义**：generic 体在展开态才渲染（宿主同构），用例必须先 click。
