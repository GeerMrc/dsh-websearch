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
## 6. S20 P2 批增补（2026-09-10，正本 = plan 020 附录 A）

- **漂移修正**：Exa `crawlingOptions`/`livecrawl`/`startCrawlDate`/`endCrawlDate` 已废弃——现行
  缓存新鲜度 = `contents.maxAgeHours`（-1..720）；Firecrawl `sources` 为**对象数组** [{type}]
  （web|images|news），`limit` 每-source；Tavily 域名上限 include 300/exclude 150 +
  `include_domains_mode`（filter|boost）。
- **组合限制守卫在案**（漏一条即生产 400）：Exa category∈{company,people} × startPublishedDate/
  excludeDomains = 400（dateFloor/excludeDomains 守卫变量）；Tavily filter_by_language × language
  未设 = 400（守卫）；ultra-fast × chunks_per_source（守卫抑制）；Firecrawl include/exclude 互斥
  （全局二选一 validate-hook + resolveConfig throw 双路径，ADR-0018）；通配 × Firecrawl
  hostname-only（整体跳过 fan-out）。
- **P2 未做项**（显式边界，plan 020 §0）：include_raw_content/subpages/summary/scrapeOptions/
  maxAge（seam 无槽或成本面）；auto_parameters（计费不可控）；safe（低价值）。
- **P3 候选清单**（后续棒）：Tavily exact_match/start_date/end_date//extract 端点；Exa
  contents.text.verbosity/includeSections/additionalQueries（deep 系）；Firecrawl tbs 组合形态
  （sbd:1/cdr 日期区间）。
## 7. S21 fetch 面增补（2026-09-10）

- **Tavily /extract**：urls ≤20/failed_results 独立数组/默认 markdown/**PDF URL 支持**/计费 basic 1 credit per 5 URL；face 落地（failed→链降级，空 results→badResponse）。
- **AnySearch /v1/extract**：探针正本 = docs/notes/2026-09-10-s21-anysearch-extract-probe.md（端点/单 URL body/信封/去噪 Markdown/50k 上限 49,934 实测/三错误形态）。
- **Firecrawl /v2/scrape**：代码在档（S16 P0 timeout 20s），S21 注册进内部 fetch registry。
- **Exa 无 fetch 面**（上游无能力）——fetch 链三家定案（ADR-0019）。
## 8. S22 P3 批增补（2026-09-10，正本 = plan 022；阶段 1 四家当日文档 diff）

- **勘正 §6 / plan 020 §87**：「AnySearch 契约面仅 query/max_results/zone，无 P2 可加」**已过时**——
  2026-09 官方 doc_spec 搜索面另有 language/tag/params(sub_domain_params)/domain/sub_domain 五族；
  本批落地 language（统一 searchLanguage fan-out，zh→zh-CN 主地区映射 + 区域码大写归一），
  tag/params 垂直面按 plan 022 硬规则**未实现**（无可达 key 做契约探针——维持 P4 边界披露）。
- **Tavily**：start_date/end_date（YYYY-MM-DD，与 time_range 正交）+ exact_match（引号短语过滤）；
  advanced_search_depth/days/include_score 现官方 spec **不存在**（旧调研销项）。
- **Exa**：endPublishedDate（对称上限）+ contents.text.verbosity（compact 默认=旧行为等价；
  standard/full 计费提示落 GUI ⓘ）+ include/excludeSections（封闭枚举，官方要求 maxAgeHours=0
  强制新抓——双路守卫：settings validate hook + resolveConfig throw；-1 never-recrawl 亦合法）。
- **Firecrawl**：tbs 由 5 值枚举放宽为文法校验自由串（qdr:*/sbd:1/cdr:1+cd_min/cd_max
  MM/DD/YYYY，可逗号组合；旧 qdr 存量值兼容断言在档）+ safe（SafeSearch）；lang/prefetch
  现官方 spec **不存在**（销项）。
- **seam 阻挡/计费排除维持 P4**：Tavily include_raw_content/auto_parameters/country/images 族、
  Exa summary/beta highlights/subpages、Firecrawl scrapeOptions/proxy/actions/LLM formats、
  AnySearch 匿名 auto-register key（违背凭据治理，永不实现）——逐项理由见 plan 022 §0。
