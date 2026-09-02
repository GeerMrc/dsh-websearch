---
title: "ADR-0003: 全 provider 收编单插件 + dshws- id 前缀隔离"
status: accepted
date: 2026-09-02
type: feat
origin: 方案 v3 用户批准（用户点名 Tavily/Firecrawl 并要求 deepseek/perplexity 等「统一在一个插件中实现」）
---

# ADR-0003: 全 provider 收编单插件 + dshws- id 前缀隔离

## Status

accepted（2026-09-02，bootstrap 规划批准；相对方案 v3 的微调：id 由裸名改为全 `dshws-` 前缀）

## Context

用户要求 deepseek/perplexity/exa/tavily/firecrawl 统一在一个插件中实现与管理；anysearch 为外部插件不收编（验证后退役）。上游已占用 provider id：`deepseek-official`、`exa`、`perplexity`、`http`（exa/perplexity 出厂不挂载但包存在）；第三方 anysearch 占用 `anysearch`。`ctx.web` 注册表对重复 id 抛 `WEB_DUPLICATE_PROVIDER`（`packages/web/web/src/index.ts:118-121`）。

## Decision

1. 五个内置 provider（deepseek/tavily/firecrawl/exa/perplexity）+ 链式 meta-provider 全部实现在本插件单包内，经 Config 子节独立启停。
2. 本插件注册的**一切** provider id 以 `dshws-` 前缀命名（`dshws-deepseek`/`dshws-tavily`/`dshws-firecrawl`/`dshws-exa`/`dshws-perplexity`/`dshws-chain`/`dshws-chain-fetch`），与上游及任何第三方插件零撞名。

## Rationale

- 单包统一 = 单一 Config/settings 面 swung GUI 管理简单；用户心智 =「一个网页搜索管理页」。
- 裸名（如 `tavily`）在「用户同时挂载上游 exa 包」等非出厂组合下仍会撞名；全前缀把撞名风险归零，不依赖对上游挂载状态的假设。

## Alternatives Considered

### 方案 A: 裸名 id（tavily/exa/...，仅 deepseek 避让官方 id）
- **优点**: id 更短、日志更易读。
- **缺点**: 与上游非出厂挂载（exa/perplexity）及未来第三方存在撞名面。
- **排除理由**: 撞名 = 运行时注册抛错（fail-loud 但可避免）；前缀成本极低。

### 方案 B: 每 provider 独立 npm 包（对齐上游包布局）
- **优点**: 与上游包结构同构。
- **缺点**: 五个包的安装/版本/组合管理复杂度全落在用户侧，与「统一管理」目标相悖。
- **排除理由**: 用户明确要求统一单插件。

## Consequences

### 正面后果
- GUI/凭据/settings 单一命名空间，管理面最小。
- 撞名风险结构性消除。

### 负面后果 / 风险
- 单包体量增大（五 provider + 链 + client）→ 模块边界用目录切割（架构 §3），providers 互不依赖。
- deepseek/exa/perplexity 与上游实现重复 → 接受（链成员需可直接调用实例；上游注册表私有不可枚举），记 🟢 债务 L-1。

## References

- `docs/00-architecture.md` §3/§5/§7
- `AGENTS.md` seam 纪律节
