# S17 API 对齐——四家参数正本与三处枚举漂移（Agent Note）

> 2026-09-10，S17 阶段 1 双路独立调研 Agent 核证（Tavily+Exa / Perplexity+Firecrawl），
> 以当日现行官方文档为准；出处 URL 逐项在 plan 017 附录 A。本 Note 是参数面的维护正本：
> 改任何成员的 wire 参数前先读这里。

## 1. 三处推翻既有认知的枚举漂移（S16 老口径 vs 2026-09 现行）

| 参数 | 老口径（S16 审计期） | 现行（2026-09-10） | 影响 |
|---|---|---|---|
| Tavily `search_depth` | `basic`/`advanced` 2 值 | **4 值**：`basic`\|`advanced`\|`fast`\|`ultra-fast`（advanced=2 credits，其余 1） | config 枚举按 4 值落地 |
| Exa `type` | `auto`/`keyword`/`neural` | **6 值**：`instant`\|`fast`\|`auto`\|`deep-lite`\|`deep`\|`deep-reasoning`（**keyword/neural 已移除**，schema 显式拒绝） | 老值发出去会 4xx |
| Perplexity `search_context_size` | top-level 参数 | **嵌套 `web_search_options.search_context_size`**（schema 默认 low；档位计费 $5/$8/$12 per 1k sonar 请求） | wire 形态按嵌套构造（单一构造点） |

教训（对齐类工作的方法论）：审计快照会过时——动手前必须按**当日**官方文档重核枚举；
本棒两路独立调研都在 Tavily `days`（已移除）、Exa `category`×date-filter 组合限制等处
抓到与旧印象不同的现行事实。

## 2. 14 参数落地面速查（wire 形态 ↔ config 字段 ↔ 默认值）

| 成员 | config 字段 | wire | 缺省行为 |
|---|---|---|---|
| tavily | `topic` | `topic` | 不发送（API=general） |
| tavily | `timeRange` | `time_range` | 不发送 |
| tavily | `searchDepth` | `search_depth` | 不发送（API=basic） |
| tavily | `includeAnswer` | `include_answer` | **'basic' 恒发**（D4：免费答案→结果 content；官方明示须手动设置） |
| exa | `type` | `type` | 解析默认 'auto' 常量 |
| exa | `textFallback` | `contents.text: { maxCharacters: 1000 }` | **true**（D4：修「无 highlight 结果整条被丢」；highlights 与 text 可同请求） |
| exa | `startPublishedDate` | `startPublishedDate` | 不发送；date-only 输入归一 `T00:00:00Z` 后缀 |
| perplexity | `maxTokens` | `max_tokens` | 解析默认 1024 显式（官方无默认记载；「1024 腰斩」=社区经验，修复=可调高；上限 128000 schema 钉死） |
| perplexity | `searchRecencyFilter` | `search_recency_filter` | 不发送（枚举含 `hour` 共 5 值） |
| perplexity | `searchContextSize` | `web_search_options.search_context_size` | 不发送（API 默认 low） |
| firecrawl | `tbs` | `tbs` | 不发送（枚举 `qdr:h|d|w|m|y`；官方还支持 sbd/cdr 组合形态——v1 只暴露 5 预设） |
| firecrawl | `location` | `location` | 不发送（自由文本城市级；官方建议与 country 同设） |
| 根 | `searchCountry` | 见 §3 | 不发送 |
| 根 | `searchLanguage` | 见 §3 | 不发送 |

## 3. 统一语言/区域 fan-out 矩阵（ADR-0015）

`searchCountry`（ISO 3166-1 alpha-2，归一大写）→ Exa `userLocation` / Perplexity
`web_search_options.user_location.country`（并入单一构造点）/ Firecrawl `country`
（修 API 缺省 US 偏差）。`searchLanguage`（ISO 639-1，归一小写）→ Tavily `language`
/ Perplexity `language_preference`。

**Tavily 不接 country（v1 防御）**：其 `country` 期望国名字符串（"united states"），ISO 码
兼容性未验证；发未验证值可能 400 链头成员。AnySearch（zone 已有）/DeepSeek（服务端工具）
无对应参数。Exa/Firecrawl 搜索面**无语言参数**（Firecrawl 的 languages 仅 scrapeOptions
抓取阶段）——统一入口的语言面只覆盖 Tavily/Perplexity 是 API 客观边界，非实现缺口。

## 4. Perplexity Sonar 日落（🟡，迁移棒 = S18）

官方横幅：**Sonar（含 `/chat/completions` 别名与 `/v1/sonar`）支持至 2026-09-27**；替代 =
Agent API（`POST /v1/agent`，responses 形态）。参数同名迁移面：`search_recency_filter` →
web_search 工具 filters；`search_context_size` → web_search 工具；`max_tokens` →
`max_output_tokens`；`user_location` 同名；`language_preference` 保留；
**`search_language_filter` 官方列为无对应物（drop 清单）**——本插件未用该参数，无影响。
S17 config 面按可迁移形态设计：S18 迁移时用户可见配置零改动。现行模型面：`sonar`/
`sonar-pro`/`sonar-reasoning-pro`/`sonar-deep-research`（`sonar-reasoning` 已移除）。

## 5. 维护点

- **UA 随包版本走**（S16 P0 坑 + 本棒 0.3.0 复用）：6 个 `USER_AGENT` 常量 + 6 处测试断言
  （anysearch 断言本棒补齐，现 6/6）——每次发版原子同步。
- **枚举再核证**：上游（尤其 Exa/Tavily）参数面演进快（keyword/neural 移除、search_depth
  扩 4 值都是近月变化）；对齐类工作动手前重查当日文档，勿信本 Note 快照超过一个季度。
- **`''` 清除哨兵**：可清除枚举（topic/timeRange/searchDepth/searchRecencyFilter/
  searchContextSize/tbs）与文本（startPublishedDate/location/searchCountry/searchLanguage）
  的 GUI 清除 = 写 `''`，node 侧 resolveConfig 归一为不发送（baseURL 先例同构）；schema
  联合含 `''` 是有意设计，勿"清理"。
- **web_search_options 单一构造点**：perplexity.ts 的嵌套对象只在 search() 一处构造
  （searchContextSize + user_location.country 同栖），新增嵌套字段进同点，防互相覆写。
