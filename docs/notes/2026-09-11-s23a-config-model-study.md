# Note — S23a 配置模型深研：固定配置 vs LLM 决策（2026-09-11）

> 用户核心问题：搜索工具参数（以 Tavily 为例：主题/时间范围/搜索深度/生成答案/域名过滤/每源内容块数/发布日期窗…）
> 哪些该人为固定在设置页，哪些该让 LLM 调用时自行决策？
> 配套实测：真实 API 对齐矩阵 20/20（证据 /tmp/dshws-s23a/matrix.log + matrix-retry.log）。

## 1. 架构事实（决定可选空间）

- 宿主 `web_search` 工具的 LLM-facing schema **仅 `queries: string[]`**（harness tool-web/src/search.ts:323-333）；
  `web_fetch` 仅 `url`（fetch.ts:454-459）。seam `WebSearchRequest` 仅 `query/maxResults`。
  → **插件在现有官方工具面内无法把任何搜索语义参数交给 LLM 逐轮决策**——工具 schema 归宿主所有。
- 插件可用扩展点：`ctx.tools.register(defineTool(...))` 为公开面（tool-web 同款，@deepseek-ai/dsh-tools）
  → 插件**可以自注册一个富参数工具**（架构可行，路径 A）。

## 2. 业界两流派（官方文档核证，2026-09-11）

- **第一方 API（Anthropic web_search_20250305 / OpenAI Responses web_search）= 收窄 LLM 面**：
  模型只决定 query 与是否调用；域名过滤/地理定位/预算/质量档位全部由调用方在 tool 配置固定
  （Anthropic 配置面仅 max_uses/allowed_domains/blocked_domains/user_location 四项）。
- **第三方官方 MCP（Tavily/Exa/Firecrawl）= 胖 LLM 面**：search_depth/topic/time_range/start_end_date/
  include_exclude_domains/max_results 等全在模型 schema（schema 描述本身在教模型何时用）；
  调用方只固定 key + DEFAULT_PARAMETERS 默认值（可与模型传参叠加）。
- Tavily 另有第三层：`auto_parameters`（服务端按 query 意图自动定参，显式值覆盖；可能自动升 advanced=2 credits）。

## 3. 当前插件定位与问题

- 现状 = 第一方 API 模式（config 固定 + LLM 仅 query），**但 GUI 旋钮已达 30+**，远超 Anthropic 的 4 项
  配置面——「调用方配置」被做成了「高级控制台」，这是用户感觉不对的根源（S22b 折叠已缓解呈现，未解本质）。
- 实测结论：全部参数被上游接受且语义生效（含 include_domains=example.com 仅回 example.com 的语义断言），
  **对齐质量无缺口**；问题只在参数归属分层。

## 4. 三路径评估（呈用户裁定，实施归后续棒）

| 路径 | 内容 | 成本 | 风险 | 评价 |
|---|---|---|---|---|
| **A 自注册富参数工具**（Tavily-MCP 式） | 插件注册 `web_search_pro`：schema 暴露 depth/topic/时间窗/域名等 → 模型逐轮决策 | 大（新工具+prompt 协调+与官方 web_search 双入口策略+全测试面） | 双入口模型困惑；prompt 引导成本；各成员参数名不齐（需归一化子集） | 架构可行但不建议近期 |
| **B chain 智能默认**（auto_parameters 式） | 链前意图启发：query 含新闻/时效词→topic=news+timeRange；技术检索→默认；显式 config 覆盖 | 小（一层 heuristic + 覆盖语义测试） | 启发式不可解释；需「自动/手动」档避免与用户显式配置打架 | **推荐 v2 增强** |
| **C 维持固定+GUI**（现状=第一方 API 模式） | 零改动；参数缺省不发送已是最小侵入 | 零 | 30+ 旋钮的认知负担（折叠已缓解） | **当前基线合理** |

**建议分层正本**：基线 = C（与 Anthropic/OpenAI 同构，行业第一方标准做法）+ 近期增强 = B
（每参数「自动（链启发）/手动（config）/关闭」三态，GUI 默认自动档=大多数旋钮退场）+ A 留作可选
高级产品形态（独立富参数工具），不建议默认启用。

## 5. 实测矩阵摘要（20/20，key 取各池首把；全数字亲见）

Tavily：baseline 10 源/1.2-4.2s；news+week 10；日期窗+exactMatch 10；**include_domains 语义过滤
10→1（仅 example.com）✓**；chunks=1 3 源。Exa：baseline 10/0.8-1.8s；fast+news 10/837ms；
endPublishedDate 10；verbosity=standard avgSnippet 380；sections=body+maxAge=0（强制新抓）11.3s。
Firecrawl：baseline 3；qdr:w 3；sbd:1,qdr:m 3；safe 3；fetch 200。AnySearch：baseline 5/3.0s；
language zh→zh-CN 5/1.3s；zone=cn 5；extract 200/184ms。（AnySearch baseline 首跑瞬时网络失败，单行重跑过。）
