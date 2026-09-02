---
title: "ADR-0004: v1 全局优先级（settings 落点）与开箱完全中立"
status: accepted
date: 2026-09-02
type: feat
origin: 方案 v3 用户批准（用户选「完全中立」+「v1 全局优先级」）
---

# ADR-0004: v1 全局优先级（settings 落点）与开箱完全中立

## Status

accepted（2026-09-02，bootstrap 规划批准）

## Context

用户问「不同 DSH 模式（profile）下单独勾选」如何落地；同时要求开箱（零配置）不默认帮用户调付费官方搜索。架构事实：web seam 是 host 级单例（跨会话共享），`settings.yaml` 同一 `$DSH_HOME` 下全 profile 共享；profile 级差异的现成机制是 cordis.patch.yml 分层覆盖。

## Decision

1. **v1 全局优先级**：链配置存 `settings.yaml`（installSection），同 home 全 profile 共享、热生效；per-profile 差异继续走 profile patch YAML（进阶用法，文档化）；per-profile GUI 列为二期候选（不排期）。
2. **开箱完全中立**：插件自身默认链 = 内置默认序（deepseek 除外原则见第 3 点）；插件不预设任何「付费优先」。上游 base 对 `deepseek-official` 的钉死由用户层两行 patch 覆盖为 `dshws-chain`（ADR-0001 组合模型），上游行为在未安装本插件时零变化。
3. 内置默认序（用户未排序时）按 `tavily → exa → perplexity → firecrawl → deepseek`：付费 DeepSeek 搜索置于末位兜底，仅在其凭据存在且前序全部不可用时触达。

## Rationale

- 全局优先级与「web seam 是 host 单例」的架构事实一致；per-profile GUI 需 settings 按 profile 命名空间或 GUI 写 profile patch，成本与收益不匹配（v1）。
- 中立开箱把「用哪家搜索」的决定权完全交给用户配置；一个都没配则链 `available()`=false，报错指引设置页。

## Alternatives Considered

### 方案 A: 保留 DeepSeek 兜底默认（有 DEEPSEEK_API_KEY 即默认走它）
- **优点**: 官方深度用户开箱体验零变化。
- **缺点**: 「默认帮用户调付费搜索」的批评仍然成立。
- **排除理由**: 用户明确选择完全中立。

### 方案 B: v1 即做 per-profile GUI
- **优点**: 满足多模式差异化的终极形态。
- **缺点**: settings 按 profile 命名空间或 GUI 写 patch，工作量显著增大。
- **排除理由**: 用户选 v1 全局；YAML patch 已覆盖该需求（进阶用户）。

## Consequences

### 正面后果
- 配置面单一（settings 一处），GUI 与心智简单。
- 开箱零付费副作用；报错指引明确。

### 负面后果 / 风险
- 多 profile 用户无法在 GUI 上按模式区分（已知限制，诚实标注）→ profile patch YAML 可覆盖，写入 README 与升级手册。
- 内置默认序是产品决策而非技术必然 → 若用户反馈调整，仅改默认序常量，链语义不变。

## References

- `docs/00-architecture.md` §5/§6
- `docs/decisions/adr-0001-standalone-out-of-tree-plugin.md`（组合模型）
