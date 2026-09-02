---
title: {{ADR-NNN: 决策标题}}
status: active
date: {{YYYY-MM-DD}}
type: {{feat | refactor | process}}
origin: {{WBS/roadmap 条目 + Session NN + 前置 ADR（如有）}}
---

# ADR-{{NNN}}: {{标题}}

> 命名：`docs/decisions/adr-NNN-<topic>.md`，序号全局递增，一事一文件。
> **ADR 是 immutable 的**：定稿后不修改正文；决策变更走新增 ADR 并在 Status 标注
> `superseded by ADR-NNN`，原文件保留。

## Status

{{accepted（YYYY-MM-DD，Session NN）/ proposed / deprecated / superseded by ADR-{{NNN}}}}

## Context（背景）

{{面临什么问题、有哪些约束、当前架构的什么不足催生了本决策。}}

## Decision（决策）

{{一句话能说清的核心结论 + 编号决策点。}}

## Rationale（理由）

{{为什么选这个方案：支持理由逐条列出。}}

## Alternatives Considered（被排除的方案）

### 方案 A: {{方案名}}
- **优点**: {{优点}}
- **缺点**: {{缺点}}
- **排除理由**: {{为什么没选}}

### 方案 B: {{方案名}}
- **优点**: {{优点}}
- **缺点**: {{缺点}}
- **排除理由**: {{为什么没选}}

## Consequences（后果）

### 正面后果
- {{好处 1}}

### 负面后果 / 风险
- {{代价/风险}} → {{缓解}}
- {{已知限制（诚实标注）}}
- {{产生的技术债 → 记入 progress 台账（L-N 编号 + 归属批次）}}

## References（关联）

- {{相关文档/设计章节链接}}
- 相关 ADR: {{ADR-NNN — 关联说明}}
