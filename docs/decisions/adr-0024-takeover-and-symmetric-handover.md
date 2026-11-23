---
title: ADR-0024: 官方「网页搜索与获取」设置页接管与对称交还
status: proposed
date: 2026-11-23
type: feat
origin: plan 048 T5–T8 / Session 41 / 前置 ADR-0013（决策 7）
---

# ADR-0024: 官方「网页搜索与获取」设置页接管与对称交还

## Status

proposed（2026-11-23 起草，Session 41；2026-11-24 按阶段 2 第 1、2 轮审核修订；同日按 rc.5 实测更正事实，更正处标「rc.5 实测更正」）。
决策 1、2（接管行、运行时行不动）已在 rc.5 上实测成立：插件页开关关、开各一次，接管随层去层回。
决策 3、4、5、8 依赖「关闭时插件还能执行」，rc.5 实测表明在已发布的图形界面宿主上不成立；处置路线待用户裁决，裁决后定稿。
决策 6 的逃生口未实测。

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
- ~~桌面端没有 HMR：关闭 bundle 不卸载 fiber，只静态重组，重启后才生效；Web 客户端在重启前存活，并会收到转发的
  `plugin-manager/changed`。~~ **rc.5 实测更正（2026-11-24）**：rc.5 的基础 patch 把 `hmr`、`plugin-manager`、`config-editor`、
  `settings` 四行钉在同一个条件上，只有 headless、sdk、acp 三个 bundle 禁用 `hmr`。桌面端因此同样启用 HMR（读 rc.5 的 bundle
  组合得出，未在桌面 profile 上实测）；承自 dsh-mm-resilience P4 的「桌面端无 HMR」对 rc.5 不成立。人为禁用 `hmr` 行的实例上，
  开关结果是 `restart-required`、fiber 不卸载，但它的设置保存同样失败，不代表任何真实宿主。
- 启用 HMR 的宿主上，插件页开关运行在 HMR 事务内；配置编辑器的 `edit()` 在有 hmr 服务时经
  `hmr.runExclusive` 执行，而 `runExclusive` 拒绝嵌套事务。dispose 钩子里调用 `settings.mutate` 在这类
  宿主上会被拒绝。
- CLI 或手改触发的重组不发 `plugin-manager/changed`。
- 宿主兼容门放行 0.2.x 预发布（ADR-0027），插件可能运行在未演练过的宿主上，守卫必须对缺失的宿主面安全。

## Decision（决策）

启用本插件即隐藏官方「网页搜索与获取」设置页；关闭即自动交还官方，并清掉指向本插件的用户层钉值。

1. **接管只在 bundle patch 里追加一行** `- id: ui-settings-web-search` / `disabled: true`，不带 `name` 守卫。
   关闭或卸载 bundle 移除整层，官方页自行恢复，其已保存配置不受影响。
2. **运行时行一律不动**：`web`（仅钉 config）、`web-fetch-http`、`web-deepseek-api`、`tool-web` 与各预设行
   保持原样。它们是关闭插件后官方提供方无需重启即可接管的前提。`web-search-deepseek` 维持 ADR-0013 的禁用。
3. **交还守卫只处理本插件自己的残留**：`web` 命名空间用户层的 `searchProvider` / `fetchProvider`
   是 `dshws-*` 时，把这两个键一起 unset。官方 id、第三方 id 与空值一律不碰。
4. **通道由探针定**。客户端对 `plugin-manager/changed` 的监听是主通道：发现本 bundle 不再启用即执行交还。
   宿主 dispose 通道只在 rc.5 实例上的探针证明「关闭时 dispose 触发且写入落盘」时才实现。通道只在告警
   日志里报告失败，绝不影响开关、启动或关闭。
   **探针结论（rc.5 实测，2026-11-24）**：经插件页关闭 bundle 时，宿主侧 `ctx.effect` 的 teardown 触发，但其中的
   `settings.mutate` 被拒（`HMR transactions cannot be nested`），`ctx.on('dispose')` 注册的处理器不触发；客户端在收到
   `plugin-manager/changed` 之前已被退订；命令行 `remove` 之后钉值残留。已发布的图形界面宿主上，插件被关闭之后没有属于自己的
   执行通道。宿主 dispose 通道因此不实现。`src/handover.ts` 与 `src/client/handover-watch.ts` 已写并各有单元测试，
   但在 rc.5 上没有被触发的时机，去留随路线裁决。
5. **被交还的钉值不恢复**。重新启用后回到默认链，用户可在本插件设置里重新配置。
6. **逃生口**：用户层写 `{id: ui-settings-web-search, disabled: false}` 可强制显示官方页，与 dsh-subagent-plus 一致。
7. **旧宿主退化**：`ui-settings-web-search` 行自 0.1.7-alpha.1 起存在；peer 域内的 0.1.5 与 0.1.6 线共 5 个
   宿主没有该行，指向它的 patch 条目按 Loader 语义告警后跳过，不中断启动。`web` 字段不是 volatile 的宿主上
   `mutate` 抛错被守卫吞掉，成为空操作。两项均为源码或设计推断，未在旧宿主上实测。
8. **不经插件页的关闭向量**（CLI、手改 profile 的 `dsh.profile.bundles`）不触发 `plugin-manager/changed`。
   用户文档写明限制与手动清理方法：删除 profile `cordis.patch.yml` 里 `web` 行的两个键。
   ~~无 HMR 的桌面端不允许卸载运行中的 bundle，卸载次序为先关闭、重启、再卸载。~~ 前提已按上文更正；桌面端的卸载行为未实测。

## Rationale（理由）

- 一行声明式 patch 即可得到对称性：层在则官方页隐，层去则官方页现，没有需要自己维护的还原逻辑。
- 保留官方提供方行，使「关闭即由官方接管」在重启后立刻成立，也让官方提供方留作暖备。
- 守卫只认用户层，不靠比较生效值去猜来源；只认 `dshws-*` 前缀，保证不误删用户对官方或第三方提供方的选择。
- 客户端通道沿用 dsh-mm-resilience P4 的做法。该做法在兄弟仓只有单元测试支撑；本决策以 rc.5 实例上的
  探针矩阵为准，不沿用其「已验证」的说法。

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
- 关闭插件后 `web_search` / `web_fetch` 在重启后由官方提供方接管，不会因悬空钉值而失败。（前提是交还成立；rc.5 上尚不成立，见下。）
- ~~接管范围在插件详情页的覆盖列表中可见。~~ **rc.5 实测更正**：详情页不渲染覆盖列表，「包含的组件」只列本 bundle 自己的行；
  接管在界面上的体现只有官方卡从「内置插件配置」消失。

### 负面后果 / 风险
- 官方卡上的 DeepSeek 计费方式与旧版搜索接口设置在接管期间不可达。前者由默认值承担，后者对应行本就已禁用。
- **交还在 rc.5 上不成立**：经插件页、命令行关闭时都不会清除用户层的 `dshws-*` 钉值。残留的钉值让官方卡显示「（未加载）」，
  本插件的设置页又被隐藏，用户看不到原因。用户文档已写明现状与手动清理方法；处置路线待裁决。
- 关闭时没有浏览器在线，或经 CLI、手改关闭时，交还不会发生 → 同上。
- 逃生口（决策 6）与桌面端关闭后、重启前的中间态 → 由 plan 048 的 V11 与 Session 42 步骤 1 实测，均未做。

## References（关联）

- `docs/plans/2026-11-23-048-s41-takeover-docsplit-oidc-plan.md`
- `cordis.patch.yml`、`src/handover.ts`、`src/client/handover-watch.ts`
- 参考实现：dsh-subagent-plus `cordis.patch.yml` 与 `docs/decisions/2026-10-30-binary-takeover.md`；
  dsh-mm-resilience `docs/patterns.md` P4
- 相关 ADR: ADR-0013 — 本决策修正其决策 7「禁用 `web-search-deepseek` 即隐藏官方卡」的前提，该前提在 0.2.2-rc.5 起不成立
- 相关 ADR: ADR-0027 — 守卫需对未演练宿主安全的依据
