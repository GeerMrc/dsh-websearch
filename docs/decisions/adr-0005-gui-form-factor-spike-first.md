---
title: "ADR-0005: GUI 形态以 S02 spike 定谳（外置 client half 优先，独立 client 包 fallback）"
status: accepted
date: 2026-09-02
type: process
origin: 方案 v3 用户批准；S02 roadmap 行前置约束
---

# ADR-0005: GUI 形态以 S02 spike 定谳

## Status

accepted（2026-09-02，bootstrap 规划批准；GO/NO-GO 结论由 ADR-0006 承接，S02 产出）

## Context

用户要求设置页与 DSH 设置页风格/交互完全一致。DSH 设置页是 client 插件体系（`settings.section` slot 注入 + locale + remote），但「**外置**插件的 client half 能否注入 slot 并使用 client 公共 API」未经实测——上游 in-repo client 包（ui-settings-*）不构成外置形态的证据。此假设若不成立，GUI 形态需换路线，且越晚发现返工越大。

## Decision

S02 设为 spike session，先行验证两个假设并产出 ADR-0006（GO/NO-GO）：

1. 外置插件 client half 经 `/plugins/<id>/client.js` 运行时分发后，能否 `ctx.slots.inject('settings.section', ...)` 渲染设置页、`ctx.locale`/`ctx.remote` 是否可用。
2. `dsh plugin --profile web add <本地路径>` 的完整安装链路（peer 解析、bundle patch 自动接线）。

NO-GO 时的 fallback（预授权路线，届时仅需按 spike 结论细化后过阶段 2 审核）：在本 fork 仓库加**独立 client 包目录**（全新目录上游合并冲突面≈0），node 半区仍在本插件。

## Rationale

- spike 前置把最大不确定性压在最小成本节点（1 天），避免 S06 GUI session 才发现路线不通。
- fallback 已识别且成本可控，spike 不论结论都不阻塞总体规划。

## Alternatives Considered

### 方案 A: 直接按外置 client half 开发，S06 再验证
- **优点**: 前期省 1 天。
- **缺点**: 若不成立，S01-S05 部分产物（settings 面设计）可能返工。
- **排除理由**: 违反「禁自我以为」红线——未经验证的架构假设不得作为实现前提。

### 方案 B: v1 不做 GUI（纯 YAML 配置）
- **排除理由**: 与用户核心需求（设置页）直接冲突。

## Consequences

### 正面后果
- 路线风险前置收敛；GO/NO-GO 有实测证据链（安装日志 + 浏览器 DOM 断言）。

### 负面后果 / 风险
- spike 消耗 1 天 → 若 GO 则值回；若 NO-GO，fallback 路线使 client 包开发与插件包开发分离，联调成本略增（记入 ADR-0006 后果节）。

## References

- `docs/00-architecture.md` §8（开放问题）
- `docs/roadmap-WBS.md` Session 02 行
