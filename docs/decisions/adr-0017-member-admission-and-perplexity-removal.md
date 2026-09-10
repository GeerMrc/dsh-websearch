---
title: "ADR-0017: 成员准入标准（高可用 + 免费额度 + 多 key + 对齐上游）与 dshws-perplexity 移除定谳"
status: accepted
date: 2026-09-10
type: feat
origin: 用户终裁（2026-09-10 对话原文）+ 免费额度事实核证（正本 = s19-stage0 audit-log 附调研报告）；supersedes ADR-0016
---

# ADR-0017: 成员准入标准与 Perplexity 移除

## Status

accepted（2026-09-10，用户直接指令充当 2.5 终审）

## Context

1. **产品定位（用户裁定原文）**：「插件-网页搜索」核心功能 = **高可用、有免费额度 APIKEY 的供应商聚合 + 多 APIKEY 支持 + 功能高度对齐各搜索工具上游的功能实现**。免费额度是硬门槛——无免费额度的供应商对零成本用户永远不可用，「看起来有成员、实际永远不可用」制造配置噪音与误配风险（与 S14v/S14x 删除免费 fetch 地板、S14e 删除 fetch-search 成员同构判例）。
2. **Perplexity 事实（2026-09-10 核证，官方出处在 s19-stage0 audit-log）**：API 无任何免费途径——纯预充值绑卡（起步≈几美元）；Pro/Max 订阅不含 API 额度（历史 $5/月 credit 已取消）；学生计划不含 API；唯一免费 = 创业公司 Startups 计划（$5000 credits 需审核）。**不达准入标准**。
3. 时序：S17（参数对齐）与 S18（Agent API 迁移）均在「日落应对」语境下保住该成员；本 ADR 依新的准入信息改判移除——决策时点信息不同，前序投入非浪费（git 历史可逆，将来若获 Startups 计划可 revert 单棒恢复）。

## Decision

1. **成员准入标准（此后新成员评估的第一道门）**：①高可用（API 稳定、有降级语义）②**有免费额度**（免费 tier 或等价长期免费 quota）③多 APIKEY 池可配（ADR-0008/0011 语义）④功能对齐上游（对齐类 P1-P2 批语义）。不满足 ② 者不入选。现役复核：Tavily（免费 1000 credits/月）/ Exa（免费额度）/ Firecrawl（免费 credits）/ AnySearch（匿名免费额度）✓；DeepSeek 为**显式付费 opt-in 兜底**（ADR-0014 语义，非搜索成员准入面）不受 ② 约束。
2. **移除 dshws-perplexity**：前后端 + 测试 + 文档全清（0.4.0 breaking）。
3. **存量配置兼容**：`fallbackMember: 'dshws-perplexity'` 为 legacy 别名（schema 宽容 + resolveConfig/controller 双点归一 'auto'——与 LegacyFallbackProvider 同思路但位置不同：同域 defined 分支拦截，非 undefined 兜底）；settings.yaml 残留 `perplexity:` 节被 schemastery 静默忽略（阶段 0 探针实测 NO THROW），无害，README（S15）将提示手动清理；searchChain 死 id 运行时跳过（既有语义）。
4. **ADR 处置**：ADR-0016（Agent API 迁移）superseded by 本 ADR——历史档保留；ADR-0015 fan-out 语言面剩 Tavily、region 面剩 Exa/Firecrawl。

## Consequences

- 正面：配置面 6→5 卡与准入标准一致；维护面缩减（Agent API 演进不再跟）；「永远不可用成员」噪音消除。
- 负面/接受：将来获付费意愿或 Startups 计划需整棒恢复（git revert + S18 重放）；统一语言入口只剩 Tavily 一家（语言维度覆盖收窄——API 客观边界）。
- 观察：残尸配置静默（schemastery 透传）——README 提示清理，不阻断。
