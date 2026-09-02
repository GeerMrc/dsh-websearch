---
title: "ADR-0002: 完整高可用链语义（选择跳过 + 运行失败降级 + 全败末端报错）"
status: accepted
date: 2026-09-02
type: feat
origin: 方案 v3 用户批准（2026-09-02，用户选「完整高可用链」）；架构文档 §4
---

# ADR-0002: 完整高可用链语义

## Status

accepted（2026-09-02，bootstrap 规划批准；同日 S01 独立审核 R-002 定谳修订：Decision 3 全败抛错对齐为链级 `DSHWS_CHAIN_EXHAUSTED`，Decision 4 补 servedBy 承载机制——两处为审核闭环内的定稿澄清，非决策反转）

## Context

上游 seam 刻意无降级链：选定 provider `available()`=false 或运行抛错都是终态（`WEB_PROVIDER_CONFIGURED_UNAVAILABLE` 等，`packages/web/web/src/index.ts:49-73`）。用户要求「最先/其次/最后使用，确保搜索高可用」，降级触发时机是方案分叉点。

## Decision

本插件的链式 meta-provider 实现两级降级：

1. **选择级**：成员未注册/未启用/凭据未配置/`available()`=false → 跳过，不消耗调用。
2. **运行级**：成员调用抛错（429 限额、网络错误、宕机、超时）→ 记录后降级下一成员。
3. **末端 fail-loud**：全部成员耗尽 → 抛链级 `DSHWS_CHAIN_EXHAUSTED`，错误信息附逐成员失败摘要（成员 id + 失败原因/码，含末位成员错误）。
4. 成功即返回。**servedBy 承载机制（审核 F-003 定谳）**：seam 结果类型封闭（`WebSearchResult` 仅 `content?/sources/truncated`），零侵入约束下不可加字段——署名承载于 `content` 首行 `[served-by: <成员id>]`（model-visible）+ 宿主日志一行；钉死直连不加前缀。
5. 用户经组合标量钉死单个 provider 时直连、**不降级**（显式指定 = 用户意志，保留上游 fail-loud 语义）。

## Rationale

- 选择级跳过覆盖「配置缺失」类永久故障；运行级降级覆盖「限额用尽/临时宕机」类瞬时故障——后者恰是高可用的主要诉求。
- 全败报最后错 + 逐成员摘要：保留可诊断性，不吞错。
- 钉死不降级：显式 > 隐式，与上游「操作覆盖非隐藏链」哲学一致。

## Alternatives Considered

### 方案 A: 仅选择级降级（fail-loud 保留运行错误）
- **优点**: 改动小、语义最保守。
- **缺点**: 限额用尽/临时故障不切换，高可用目标落空。
- **排除理由**: 用户明确选择完整高可用链。

### 方案 B: 上游 seam 层实现链（扩 WebRuntimeConfig）
- **优点**: 语义最彻底。
- **缺点**: 侵入上游内核，违反 ADR-0001。
- **排除理由**: 与零内核侵入约束冲突。

## Consequences

### 正面后果
- 单 provider 故障/欠费不再打断 agent 搜索能力。
- servedBy 归因让降级可观察、可审计。

### 负面后果 / 风险
- 运行级降级放大尾延迟（串行尝试多成员）→ 用每成员超时上限缓解（Config 暴露）。
- 降级引入跨 provider 结果质量差异 → servedBy + 逐成员摘要保证可解释。
- 技术债：降级时序/超时预算的组合测试面较大 → S03 链语义必测清单 + S08 e2e 收口。

## References

- `docs/00-architecture.md` §4（规范级定义）
- 上游无降级链决策：deepseek-harness `.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.md:117-125,301-303`
