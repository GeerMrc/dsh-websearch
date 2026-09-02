---
title: "ADR-0010: session 搜索溯源呈现（插件接管 tool.call.toolview 的 web_search 卡）"
status: accepted
date: 2026-09-03
type: feat
origin: 用户需求扩展（2026-09-03 批准的功能扩展计划；宿主 client slots/toolview 面探索定谳）
---

# ADR-0010: session 搜索溯源增强

## Status

accepted（2026-09-03，功能扩展计划用户批准；呈现形态经用户确认选「接管工具卡片」）

## Context

用户需求：session 的工具调用显示目前只见「websearch 工具调用」，看不出具体由哪家服务（anysearch/Exa/Tavily…）执行；要求**不改官方 DSH 源码**前提下增强。

探索实测（2026-09-03）：

1. 呈现链路：web_search 卡片 = 宿主 `ui-tool` 的 `WebRow`，注册于 `tool.call.toolview` keyed slot（key `web_search`）；折叠行标题 = locale 文案 + args 摘要（queries），结果不进折叠行；展开卡片由 `webCardModel` 从 `block.meta` 派生，其中 `meta.answer` = 工具完整 content（**含 S03 起的 `[served-by: <id>]` 首行**）。
2. 接管机制（宿主官方背书）：同 key 异 priority = shadow（priority 最低者渲染）；`tool.call.toolview` 的 key 域开放，shipped key 被注册即「接管而非共享」（`contract/slots.ts` 明文）；cookbook `adding-a-tool.md` 正文书面的正是客户端插件注册 wire 工具名到该 slot 的路线；宿主 ui-skill 有同管线先例。
3. 结构化元数据三层封死：web_search 输出 schema `additionalProperties: false` + `presentationMeta` projector 固定 + 客户端 `webSources` 投影只挑四字段——自定义字段注入不可行；`tools/post-execute` 换 value 须过封闭 schema，注入额外字段直接 isError。
4. 插件 client bundle 注入是全局装配（`dsh.client` manifest → boot 同列表加载），不限 settings 页；S06 的 settings.section 注入为同管线已验证实例。
5. 带内生还载体只有：`content` 字符串（→ meta.answer）与 source 四字段（url/title/snippet/publishedAt）。

## Decision

1. **路线 = 插件 client half 接管 `tool.call.toolview` 的 `web_search` key（priority 低于宿主，shadow 渲染）**：插件自写卡片组件，从 `block.meta.answer`（回退 content）解析首行 `[served-by: <成员id>]`，在折叠行标题渲染服务徽标（如「· Tavily (dshws-tavily)」）；展开区沿用 meta.sources/truncated 派生（宿主 WebRow 同构呈现）。
2. **回退语义**（cookbook 要求的本地校验 + 回退）：
   - 无署名行（用户钉死单成员直连/外来 provider 直接服务）→ 不渲染徽标，宿主同构呈现；
   - meta/content 缺失或形状不符 → generic 工具卡回退（不假设 web_search 形状）。
3. **范围**：只接管 `web_search` key；`web_fetch` 与其余工具卡不动；宿主源码零 diff（零内核侵入红线）。
4. **文案**：徽标与卡片文案走本插件 typed locales（en/zh parity + CJK 门禁随棒）；成员品牌名（Tavily/Exa/…）为 locale-neutral 代码常量映射（`dshws-` id → 显示名），未知 id 显示原始 id。
5. **维护责任**：接管后官方 `WebRow` 演进不再自动生效——替身卡片需在宿主 client 演进时跟进（README/升级手册诚实标注此维护点）；回退路径保证最坏情况退化为基础呈现而非破图。

## Rationale

- 三层封闭使「结构化字段注入」不可行；带内唯一可靠载体是 S03 已落的 content 署名行——缺的只是**呈现层把它变成显式徽标**，而呈现层恰好有官方 open slot + shadow 语义。
- 插件同时握有写端（链署名）与读端（卡片解析）——闭环不依赖宿主参与，天然随成员扩展（anysearch 等）自动生效。
- 用户在两个候选形态（接管卡片 vs 仅强化署名行措辞）中明确选择接管。

## Alternatives Considered

### 方案 A: 仅优化 content 署名行措辞
- 优点：零维护成本。
- 排除理由：折叠行不显示 content，不满足「调用行明确显示具体服务」的需求本义（用户已确认）。

### 方案 B: sources 的 title/snippet 前缀携带成员名
- 优点：不依赖 slots；每条来源可见服务名。
- 排除理由：污染引用数据（模型引用标签与每条来源都带前缀）；显示粒度错位（调用级事实写进条目级数据）。

### 方案 C: shadow `conversation.details.tool`（详情面板标注）
- 优点：触达面小。
- 排除理由：只改详情面板，折叠调用行仍无服务名；作为 F3 的可选增量不强入 v1。

## Consequences

### 正面后果
- session 工具调用行直接可见具体服务名；链、直连、外来 provider 三态呈现语义清晰（徽标/无徽标/回退）。
- 零内核侵入；随成员列表扩展自动覆盖（成员名映射表补一行）。
- `meta.answer` 已在生产链路携带署名行（S03 起）——本 ADR 纯呈现层增量，无写端变更。

### 负面后果 / 风险
- 官方 WebRow 演进不自动跟进（已知维护点，回退路径兜底；升级手册标注）。
- 宿主对 `tool.call.toolview` shadow 语义的契约变化（若上游调整 slot 语义）需跟进（低概率：slot 契约有明文文档）。
- 非本插件来源的 web_search 调用（如宿主内置 provider）也走替身卡片——回退语义保证呈现等同宿主，但渲染代码路径已换（测试面须覆盖外来结果形状）。
