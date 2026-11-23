---
title: ADR-0024: 官方「网页搜索与获取」设置页接管与对称交还
status: proposed
date: 2026-11-23
type: feat
origin: plan 048 T5–T8 / Session 41 / 前置 ADR-0013（决策 7）
---

# ADR-0024: 官方「网页搜索与获取」设置页接管与对称交还

## Status

proposed（2026-11-23，Session 41；决策 4 的宿主通道以 plan 048 的 V10 实测为准，通过后转 accepted）

## Context（背景）

ADR-0013 让插件随包 patch 钉住 `web` 行的提供方选择并禁用 `web-search-deepseek`。在 0.2.0-rc.2
宿主上，官方设置卡随 `web-search-deepseek` 一同消失。0.2.2-rc.5 起该卡片改为依赖 `web` 命名空间，
而 `web` 行正是本插件必须保持启用的接缝，于是官方卡与本插件在插件页并存，用户可以在官方卡里
把提供方存成别的值。

更隐蔽的问题是关闭之后：用户在官方卡保存的 `dshws-*` 选择写进 profile 用户层，优先级高于 bundle
层。关闭或卸载本插件只移除 bundle 层，用户层的 `dshws-*` 钉值留下成为悬空引用，`web_search`
每次调用报 `WEB_PROVIDER_CONFIGURED_MISSING`，官方卡只显示「（未加载）」而不回退。

约束：

- 官方没有专门的接管 API 或清单字段。dsh-subagent-plus 隐藏「子智能体」的做法是随包 patch
  禁用官方设置页所在的 Loader 行。
- `settings.mutate` 的 `unset` 在基础层有值时等于设回继承值；整个结果与继承配置深度相等时，
  配置编辑器才删除用户层的 `config`。只清一个键会留下半截覆盖，rc.5 下抓取会报 `WEB_PROVIDER_AMBIGUOUS`。
- 桌面端没有 HMR：关闭 bundle 不卸载 fiber，只静态重组，重启后才生效；Web 客户端在重启前存活，
  并会收到转发的 `plugin-manager/changed`。
- 宿主兼容门放行 0.2.x 预发布（ADR-0027），插件可能运行在未演练过的宿主上，守卫必须对缺失的宿主面安全。

## Decision（决策）

启用本插件即隐藏官方「网页搜索与获取」设置页；关闭即自动交还官方，并清掉指向本插件的用户层钉值。

1. **接管只在 bundle patch 里追加一行** `- id: ui-settings-web-search` / `disabled: true`，不带 `name` 守卫。
   关闭或卸载 bundle 移除整层，官方页自行恢复，其已保存配置不受影响。
2. **运行时行一律不动**：`web`（仅钉 config）、`web-fetch-http`、`web-deepseek-api`、`tool-web` 与各预设行
   保持原样。它们是关闭插件后官方提供方无需重启即可接管的前提。`web-search-deepseek` 维持 ADR-0013 的禁用。
3. **交还守卫只处理本插件自己的残留**：`web` 命名空间用户层的 `searchProvider` / `fetchProvider`
   是 `dshws-*` 时，把这两个键一起 unset。官方 id、第三方 id 与空值一律不碰。
4. **两条通道**：有 HMR 的宿主走插件 dispose；桌面端走客户端对 `plugin-manager/changed` 的监听，
   发现本 bundle 不再启用即执行交还。两条通道都只在告警日志里报告失败，绝不影响开关、启动或关闭。
5. **被交还的钉值不恢复**。重新启用后回到默认链，用户可在本插件设置里重新配置。
6. **逃生口**：用户层写 `{id: ui-settings-web-search, disabled: false}` 可强制显示官方页，与 dsh-subagent-plus 一致。
7. **旧宿主退化**：行 id 不存在时 patch 条目按 Loader 语义告警后跳过；`web` 字段不是 volatile 的宿主上
   `mutate` 抛错被守卫吞掉，成为空操作。

## Rationale（理由）

- 一行声明式 patch 即可得到对称性：层在则官方页隐，层去则官方页现，没有需要自己维护的还原逻辑。
- 保留官方提供方行，使「关闭即由官方接管」在重启后立刻成立，也让官方提供方留作暖备。
- 守卫只认用户层，不靠比较生效值去猜来源；只认 `dshws-*` 前缀，保证不误删用户对官方或第三方提供方的选择。
- 双通道沿用 dsh-mm-resilience P4 的已验证模式，覆盖桌面与 HMR 两种宿主。

## Alternatives Considered（被排除的方案）

### 方案 A: 禁用官方提供方运行时行，实现完全替换
- **优点**: 插件页上官方相关行全部消失，观感最彻底。
- **缺点**: 关闭插件后官方提供方需要重新启用并重新注册，失去暖备；违背参考实现「运行时行不动」的纪律。
- **排除理由**: 用户的诉求是关闭后官方立即可用，暖备比观感重要。

### 方案 B: 在 `apply` 里用 settings API 改写 `web` 的选择，关闭时改回
- **优点**: 不依赖 patch 层。
- **缺点**: 写入落在用户层，进程被杀或客户端先关闭时还原会丢失，恰好制造本决策要消除的悬空钉值。
- **排除理由**: 选择应由随包层承载，用户层只留给用户的显式覆盖。

### 方案 C: 本插件自己注册 `web_search` / `web_fetch` 工具
- **优点**: 完全掌握工具面。
- **缺点**: 工具归 `tool-web`，Web 应用按 agent 预设组合，bundle patch 无法按 id 寻址；同名注册会撞名。
- **排除理由**: 在官方工具下方替换提供方已满足需求，且零维护。

## Consequences（后果）

### 正面后果
- 插件页不再并存两张网页搜索卡，用户只有一处配置入口。
- 关闭插件后 `web_search` / `web_fetch` 在重启后由官方提供方接管，不会因悬空钉值而失败。
- 接管范围在插件详情页的覆盖列表中可见。

### 负面后果 / 风险
- 官方卡上的 DeepSeek 计费方式与旧版搜索接口设置在接管期间不可达。前者由默认值承担，后者对应行本就已禁用。
- 宿主 dispose 通道在 HMR 重组期间存在重入可能 → 由 V10 实测定夺；不安全则降级为告警式空操作，
  桌面端不受影响。
- 用户在官方卡里保存过的 `dshws-*` 钉值会在关闭时被清除且不恢复 → 在用户文档中明示。
- 客户端在关闭瞬间未运行且宿主无 HMR 时交还会缺席，直到下一次启用再关闭 → 已知限制，记录于用户文档。

## References（关联）

- `docs/plans/2026-11-23-048-s41-takeover-docsplit-oidc-plan.md`
- `cordis.patch.yml`、`src/handover.ts`、`src/client/handover-watch.ts`
- 参考实现：dsh-subagent-plus `cordis.patch.yml` 与 `docs/decisions/2026-10-30-binary-takeover.md`；
  dsh-mm-resilience `docs/patterns.md` P4
- 相关 ADR: ADR-0013 — 本决策修正其决策 7「禁用 `web-search-deepseek` 即隐藏官方卡」的前提，该前提在 0.2.2-rc.5 起不成立
- 相关 ADR: ADR-0027 — 守卫需对未演练宿主安全的依据
