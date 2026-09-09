---
title: "ADR-0015: 通用语言/区域统一入口——全局单写入点 + 按成员原生参数 fan-out"
status: accepted
date: 2026-09-10
type: feat
origin: S17 P1 参数批（roadmap ⏳ 行「通用 1（语言/区域统一入口）」）；plan 017 阶段 2 审核后 2.5 默认批准
---

# ADR-0015: 通用语言/区域统一入口

## Status

accepted（2026-09-10，plan 017 阶段 2 两轮审核 APPROVED + 2.5 默认批准披露）

## Context

1. 四家搜索成员对「区域/语言」的原生参数形态各异（S17 阶段 1 双路独立调研核证，2026-09-10 现行官方文档，出处见 plan 017 附录 A）：
   - Tavily：`country`（**国名字符串**如 "united states"；仅 topic=general；boost 语义）+ `language`（ISO 639-1）
   - Exa：`userLocation`（ISO 3166-1 alpha-2 码）；无语言参数
   - Perplexity：`web_search_options.user_location.country`（ISO 3166-1 alpha-2）+ `language_preference`（ISO 639-1）
   - Firecrawl：`country`（ISO 码，**API 默认 `US`——省略即美国偏置**，这正是要修的）；搜索面无语言参数
   - AnySearch（zone cn/intl 已有）/DeepSeek（服务端工具）：无对应参数
2. roadmap 把「Firecrawl country」与「通用语言/区域入口」并列为不同条目；若每成员各配一份 country/language，则同一语义在 5 张卡上重复出现——正是本项目既有的产品裁定反对的「对称复制配置面在共享资源上」（S14 系用户裁定累积）。
3. Tavily `country` 的国名字符串形态与其余三家的 ISO 码形态不匹配，且官方文档未承诺 ISO 码兼容——按 ISO 码透传可能 400 主成员（链头），按国名透传则其余三家不认。

## Decision

1. **全局单写入点**：根 config 增 `searchCountry`（ISO 3166-1 alpha-2，归一大写）与 `searchLanguage`（ISO 639-1，归一小写）两字段；GUI 在全局链卡区暴露两个输入（成员卡不复制）。缺省不发送 = 升级零 wire 漂移；区域修正是 opt-in。
2. **按成员原生形态 fan-out**（resolve 时第三参 `geo`，随 T1 热化逐次读取）：
   - `searchCountry` → Exa `userLocation`、Perplexity `user_search_options.user_location.country`（并入 T4 单一构造点）、Firecrawl `country`
   - `searchLanguage` → Tavily `language`、Perplexity `language_preference`
3. **v1 不喂 Tavily `country`**：国名字符串与 ISO 码不匹配且兼容性未验证；发送未验证值给 boost 参数可能让链头成员 400。Tavily 只接 `language`。待有实测证据（Tavily 对 ISO 码的真实行为）后再评估扩展——记录于本 ADR，实施于 `resolveTavilyMemberOptions` 的 geo 形参（只取 language）。
4. **Firecrawl 的 roadmap「country 修 US 偏差」由全局入口承担**，成员级只增 tbs/location（location 为城市级自由文本，仅 Firecrawl 有此粒度，成员级保留）。

## Consequences

- 正面：单一写入点（用户产品裁定口径）；Firecrawl US 偏差修复对全部 ISO 码成员一次生效；热化（T1 机制）使全局入口下一次搜索即生效。
- 负面/接受：Tavily 区域定向 v1 缺席（语言仍在）；两字段均为自由文本（GUI placeholder 示范格式，未做码表校验——错误码值由各 API 以 4xx 拒绝、走既有 HTTP_ERROR 降级链，fail-loud）。
- 关联：成员 options 热化统一（plan 017 D1）；Perplexity Agent API 迁移（S18）时 `user_location` 同名保留、`search_language_filter` 官方列为无对应物（drop 清单）——本入口的 language 面在迁移后仅剩 Tavily。
