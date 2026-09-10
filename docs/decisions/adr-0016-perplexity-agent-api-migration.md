---
title: "ADR-0016: Perplexity Agent API 迁移——/v1/agent responses 形态、web_search 工具恒含、模型前缀归一（config 零改动）"
status: superseded by ADR-0017
date: 2026-09-10
type: feat
origin: Sonar 全线 2026-09-27 日落（官方迁移横幅，S17 阶段 1 调研发现）；roadmap S18 行 + plan 018 阶段 2 两轮审核 + 2.5 默认批准
---

# ADR-0016: Perplexity Agent API 迁移

## Status

superseded by [ADR-0017](adr-0017-member-admission-and-perplexity-removal.md)（2026-09-10——成员依准入标准移除，本迁移 ADR 转历史档；决策时点信息不同非浪费）

accepted（2026-09-10；amends ADR-0015 的 Perplexity fan-out 落点——见勘注）

## Context

1. 官方公告 Sonar（含 `/chat/completions` 别名与 `/v1/sonar`）**支持至 2026-09-27**；替代 = Agent API `POST /v1/agent`（responses 形态）。不迁移则届时 `dshws-perplexity` 成员死亡。
2. S17 参数面已按「同名可迁移形态」设计——但调研证实三处换位：`max_tokens`→`max_output_tokens`；web_search 从永远在线变为 **OPT-IN 工具**（`tools:[{type:'web_search',…}]`，不加 = 纯参数记忆作答）；`search_recency_filter` 入工具 `filters`、`search_context_size`/`user_location` 在工具顶层（S17 的 `web_search_options` 嵌套不复存在）。模型名要求 `provider/model` 前缀（`perplexity/sonar`）。
3. 响应为完整 trace：`output[]` 中 `message` item（文本）+ `search_results` item（结构化 url/title/snippet/date 来源，比旧 citations 平铺更丰富）；无 finish_reason/truncation 字段。

## Decision

1. **wire 一刀切迁移**（T1/T2）：端点 `/v1/agent`、query→顶层 `input`、`max_output_tokens`；**web_search 工具恒包含**——这是搜索成员，去掉工具即失去存在意义（opt-in 语义下的不变量：搜索成员永远带搜索工具）。
2. **config 零改动**（验收条目）：S17 的 maxTokens/searchRecencyFilter/searchContextSize 与 ADR-0015 的 searchCountry/searchLanguage 全部同名映射到新位置；**裸模型名在 provider 侧自动补 `perplexity/` 前缀**（`model.includes('/')` 判定，已含前缀直传）——存量 `sonar`/`sonar-pro` 配置与 GUI 零变化。
3. **来源优先级**：`search_results` item（结构化）→ message `url_citation` annotations → 旧 `citations` 平铺（tolerant 终兜底）。
4. **截断口径延续 S17 B3**：`truncated` 恒 false（seam「sources 被丢」所有权）；Agent API 的 `status:'incomplete'` 不映射（raw 可观察）。
5. **旧端点不留开关**：2026-09-27 后为死端点，回退开关无价值；窗口内如需回退用 git revert（迁移是单成员单 commit 面）。

## Consequences

- 正面：config/GUI/locale 零变更；来源结构化更丰富（title/snippet/date 全有）；`perplexity/sonar` 直呼或 preset 等价均可（用户 model 字段两者皆可写）。
- 负面/接受：web_search 工具恒含意味着无法配置「关闭搜索的纯对话」——本成员语义即搜索，接受；真实 API 行为（时延/计费/edge case）官方未详述，映射按 tolerant 读取 + badResponse fail-loud，有 key 后实测校正（凭据池无 key，降级验收已 2.5 裁定）。
- 关联勘注：ADR-0015 Decision 2 的 Perplexity 落点自本 ADR 起改为「web_search 工具顶层 user_location」（language_preference 顶层不变）。

## amends

- ADR-0015（2026-09-10）：Perplexity `web_search_options.user_location.country` → `web_search` 工具顶层 `user_location.country`（S18 迁移所致；其余 fan-out 落点不变）。
