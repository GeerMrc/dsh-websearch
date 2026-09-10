---
title: "ADR-0018: 统一域名入口——include/exclude 二选一 + validate-hook 双路径 fail-loud + 按成员格式守卫 fan-out"
status: accepted
date: 2026-09-10
type: feat
origin: S20 P2 参数批（用户裁定先于 S15）；plan 020 阶段 2 两轮审核（M-1 改判：resolveConfig throw 在 settings 路径失效）
---

# ADR-0018: 统一域名入口

## Status

accepted（2026-09-10）

## Context

1. 站点白/黑名单是聚合搜索最常用的精确域控（S16 审计 P2 高价值项）；三家成员原生支持但格式各异：Tavily `include_domains`(≤300)/`exclude_domains`(≤150) + `include_domains_mode`；Exa `includeDomains`/`excludeDomains`(≤1200, hostname/路径前缀/通配)；Firecrawl `includeDomains`/`excludeDomains`（hostname-only，**互斥**——同请求 400）。
2. **组合限制实锤**（2026-09-10 调研）：Exa `category ∈ {company, people}` × `excludeDomains` = 400；通配（`*.`）仅 Exa 支持，Firecrawl hostname-only 不支持。
3. **fail-loud 机制陷阱（阶段 2 M-1 实证）**：resolveConfig throw 在 settings 提交路径被宿主 watcher 吞成 logger.warn（`settings/src/index.ts watcher 吞错〔阶段 5 勘注：publish catch 现位于 :693-698，行为同述〕`）且值已持久化——重启时 LiveResolvedConfig 构造 throw 把插件 brick 到手动改文件；「二选一校验用 resolveConfig throw」在 settings 路径不是 fail-loud 而是 fail-silent+brick。

## Decision

1. **全局单写入点**：根 config `searchIncludeDomains` / `searchExcludeDomains`（逗号分隔字符串，GUI 单输入框——多 key 单槽同构）；**二选一硬约束**（同时非空 = 非法态）。
2. **fail-loud 双路径正位**：①settings/GUI 路径 = 宿主 `installSection` 原生 `hooks.validate`（写队列内、**persist 之前**跑——throw 拒绝本次写入并冒错给提交方，`validateUnifiedDomainRule` 随 attachSettingsSection 透传）；②cordis.yml 路径 = resolveConfig 入口 throw → loader 加载面冒错（手动编辑文件的合理 loud）。resolveConfig throw **不得**作为 settings 路径的拒绝机制。
3. **按成员格式守卫 fan-out**：Tavily 逗号串切数组透传（上限由 API 4xx fail-loud——与 max_results 不 clamp 同构）；Exa 数组透传（category∈{company,people} 时跳过 excludeDomains——官方 400 组合防御性跳过〔T3 落地〕）；Firecrawl URL-like 输入归一为 host + **任一通配条目整体跳过该成员的域名 fan-out**（hostname-only 不支持——与 Exa category 守卫同构的防御性跳过，JSDoc 注明）。AnySearch/DeepSeek 不映射。
4. Tavily 的 `include_domains_mode`（filter/boost）为成员级参数（S20 T2 落地）——boost 加权语义与全局 include 列表解耦。

## Consequences

- 正面：一处配置三生效（ADR-0015 同构）；非法态在提交即拒（不 brick）；各家格式差异全部有守卫防 400 降级链噪音。
- 负面/接受：通配输入对 Firecrawl 静默不生效（防御性跳过——ADR/ⓘ 文案披露，非静默丢弃语义：与「未配置」等价）；域名上限不前置校验（API 裁决，fail-loud 于调用面）。
- 关联：ADR-0015（统一入口模式首例）；plan 020 附录 A（组合限制证据链）。
