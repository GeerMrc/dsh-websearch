---
title: "ADR-0013: 装即接管 web_search（插件随包 patch 钉扎 search 侧）"
status: accepted
superseded-partial: 2026-09-09 ADR-0014 supersedes D1/D6's「DeepSeek 末位兜底」tail framing (install takeover itself unchanged: searchProvider dshws-chain pin stands)
date: 2026-09-06
type: feat
origin: 用户提议与方向裁定（2026-09-06，方案 B；双 Agent 只读调研——宿主 patch 机制 file:line + 本仓决策链）
---

# ADR-0013: 装即接管 web_search

## Status

accepted（2026-09-06；用户方向裁定〔AskUserQuestion 获答方案 B〕+ 计划包批准。
**amend** ADR-0001 组合面 / ADR-0004 D2 接线形态 / ADR-0009 D5 博弈规则——三 ADR
已加注记互指，非整体 superseded；ADR-0004 D3 链中立性实质不变）

## Context

用户提议（2026-09-06）：「不装插件时用宿主默认 websearch；装了本插件就自动接管」——
动机是消除「安装后 web_search 仍走宿主默认 deepseek-official、需手动用户层两行接线」
带来的理解混乱（用户亲历：「装了为什么还在用官方的」）。

机制调研（2026-09-06，双只读 Agent）：

1. 宿主 patch 应用算法允许 **id 定向覆盖别包已插入行**的任意键（`vendor/include/
   src/index.ts:121-124`，`target[key] = value` 纯赋值；无「行属主」校验，:66-75/
   :96-101 注释明文「后层必须能配置先层插入的行」）。仓内先例：
   `agent-team-profile/cordis.patch.yml:14-24` 覆盖 base 行整段 config、`web-app`
   patch 覆盖 base 多行；生态先例：anysearch 官方插件即随包 patch 自钉 provider
   （ADR-0009 Context 引用）。
2. **行 config 是整段替换、无深合并**（`include/src/index.ts:121-124` +
   app-boot/README.md:139）——钉扎必须重述 searchProvider+fetchProvider 全部键；
   patch 写 `name` 守卫且不匹配时**静默跳过**（:116-119）——不写 name。
3. 层序 = base → 插件 bundle（bundles 数组序 = 安装序，`apps/cli/src/plugin.ts:62-68`）
   → 用户层 → home 层 → `--patch`（`profile-boot.ts:136-143`）；同 id 后写者赢。
4. **卸载即复原**：patch 层是纯派生态——根 cordis.yml 每次启动重写为空
   （`profile-boot.ts:104-122`）、组合每次从空根合成（`profile.ts:854-861`）；
   `plugin remove` splice bundles（`plugin.ts:77-87`）→ web 行自动回落 base 值
   `deepseek-official/http`（`bundle/base/cordis.patch.yml:450-454`）。**单命令
   完整复原**（现状还需手删用户层两行）。
5. 宿主无「注册但禁用」provider 的概念——选择是单赢家 config 驱动
   （`web/src/index.ts:172-194`）；「禁用官方 websearch」的落地形态即 config 翻转。
6. fetch 链现状 = 单成员 firecrawl（`src/index.ts:229-231`），无 key 即
   `available()=false`——装即接管 fetch 会把恒可用的内置 `http` 换掉，弄坏无
   firecrawl key 用户的 web_fetch。

## Decision

1. **插件随包 cordis.patch.yml 增加第二条目**：`- id: web` + `config:
   {searchProvider: dshws-chain, fetchProvider: http}`——安装即把 web_search
   接管到本插件链；**不写 name 守卫**（防静默跳过）。官方 `deepseek-official`
   provider 保持注册但不再被选中（闲置无害）；DeepSeek 搜索能力不消失——链内
   `dshws-deepseek` 成员用同一把 `DEEPSEEK_API_KEY` 末位兜底。
2. **fetch 显式重述为 `http`**：fetch 接线（`dshws-chain-fetch`）保留为 README
   文档化**手动可选项**——装即接管 fetch 会在无 firecrawl key 时弄坏 web_fetch
   （方案 C 否决依据）。
3. **卸载即完整复原**：`plugin remove` 单命令；若用户另有用户层翻转让，卸载时
   需删（README 沿用现行口径）。
4. **用户层终裁保留**：用户层/home 层 patch 仍压过插件层——想切回官方或钉其他
   provider，用户层两行即否决（层序后写者赢）。
5. **多插件钉扎博弈**：同为 bundle 钉扎时按安装序后写者赢（ADR-0009 D5「用户层
   后写覆盖 bundle 层」规则的 bundle 层延伸）；用户层终裁。
6. **中立性实质不变**（ADR-0004 D3 未动）：链内置默认序仍
   tavily→exa→perplexity→firecrawl→deepseek（DeepSeek 末位兜底），不付费优先——
   变更的只是「接线动作」从用户显式两行变为安装即生效。〔注记 2026-09-06 S14c：D3
   表述随 S14c 改判为「五家排序域 + DeepSeek 固定链尾兜底」，付费优先实质不变〕
7. **官方入口随包退役**（S14c 增补，用户裁定）：随包 patch 第三条目
   `- id: web-search-deepseek` + `disabled: true`——安装即官方 DeepSearch 入口完整
   退役（provider 注销 + 宿主设置卡消失 + 其 DEEPSEEK_API_KEY 单值写入点消失）；
   卸载自动复原（同派生态机制）；本插件链不依赖官方 provider（重实现成员）。

## Rationale

- 装即接管消除安装/接线两步的理解混乱；生态已有先例（anysearch 官方插件）。
- **破坏性分析零回归**：无任何 key 的用户，官方 provider 同样不可用（等价坏）；
  有 `DEEPSEEK_API_KEY` 的用户（几乎全部真实用户——聊天必需），链内 deepseek 成员
  即刻就绪（同 ref），web_search 行为近不变且获得溯源徽标与降级能力。
- 用户否决权完整保留（用户层最高层），零宿主源码改动、仍单 tarball 独立安装、
  卸载语义优于现状（单命令复原）。

## Alternatives Considered

### 方案 A: 维持现状 + 文档强化
- 优点：零风险。排除理由：困惑仅被解释、未被消除（用户已裁定否决）。

### 方案 C: 装即接管 search + fetch
- 优点：与「两行成对」教学口径对称。排除理由：fetch 链单成员 firecrawl，无 key
  即 `available()=false`——装即接管会弄坏无 key 用户的 web_fetch（真实回归）。

### 方案 D: GUI 接线状态显示 / 一键开关
- 优点：显式化。排除理由：宿主无选择态 RPC（pluginInventory 不含 config；web 行
  未注册 settings namespace），实现需上游改动——违背零宿主改动约束（S14 调研注记
  §1.5 同结论）。

## Consequences

### 正面后果
- 安装心智一步化（装即接管），消除「装了为什么还在用官方的」困惑。
- 卸载单命令完整复原（优于现状的手动两行清理）。
- 零宿主改动、单 tarball、无 fork；与 anysearch 共存规则自然衔接（同为 bundle
  钉扎，安装序博弈 + 用户层终裁）。

### 负面后果 / 风险
- **上游漂移**：行 config 整段替换，base 未来给 web 行加第三键会被本钉扎重述掉
  （schema 默认兜底，**非 base 值**——`fiber.ts:50-62` + `config-catalog.md:129-135`
  佐证）。缓解：peer 域钉版（`>=0.1.2-alpha.3 <0.1.3`）+ 发版清单「追平重述 web
  config」检查项。
- **安装即隐式行为变化**（ADR-0004 D2 原显式用户意志的反转）：README 首屏声明 +
  设置页 intro 一句披露（纯静态文案，不做接线状态显示——无数据源）。
- **既有用户层两行者迁移**：同值不冲突可保留；卸载时需删（文档化）。
- **官方入口退役的边界**（Decision 7）：行级 disabled 禁用宿主 shipped 行——若用户
  层另行钉 `searchProvider: deepseek-official` 会 CONFIGURED_MISSING 硬错（文档化）；
  `web-fetch-http` 行不受影响（fetch 仍走内置 http）。
