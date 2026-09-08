---
title: "ADR-0014: 兜底重构——删除免费抓取地板、兜底工具显式指定、DeepSeek 付费条件参与"
status: accepted
date: 2026-09-09
type: feat
origin: 用户三轮产品裁决（2026-09-08/09）+ 三轮独立计划审核；触发源 = S14v 实测取证（DDG 202 反爬壳）
---

# ADR-0014: 兜底重构

## Status

accepted（2026-09-09，计划包经三轮独立审核后用户批准；supersedes ADR-0004 D3 与
ADR-0013 D6 的"固定链尾兜底"半边，amend B2 落档规则 2）

## Context

1. **免费抓取地板在主要网络段死亡**（S14v 实测：DDG 对本网络出口 IP 恒回 HTTP 202
   反爬壳，html/lite 双端点、UA 无效）——它制造"看起来有兜底、实际必失败"的报错
   噪音（用户 5090 会话取证：6 次链耗尽全含误导性 fetch 行）。
2. **HA 正源是工具多样性**：五家搜索成员均有免费额度 × 每家多 key 池（ADR-0011），
   付费 DeepSeek 仅在用户稀少工具时才有边际价值。
3. 用户产品裁决（三轮收敛）：
   - 免费 Fetch 兜底彻底删除；
   - 兜底工具由用户**显式指定**（两家用例：选 Tavily 兜底 → Firecrawl 自动主搜 →
     Firecrawl 含自身多 key 重试全败 → Tavily 接手）；
   - **DeepSeek 付费仅 0/1 家就绪工具时可选**；2 家及以上彻底禁用（防意外费用 +
     兜底责任完全由用户工具承担）；全工具失败直接诚实报错。

## Decision

1. **删除 `dshws-fetch-search` 成员与 fetchsearch 错误族**。链 = 可排序工具成员；
   全败终态 = `DSHWS_CHAIN_EXHAUSTED`（ADR-0002 D3 正本语义）。
2. **单字段 `fallbackMember`**（'auto' | 五工具成员 id | 'dshws-deepseek'，默认
   'auto'）命名兜底**意图**；GUI 只写该字段。legacy `fallbackProvider`
   （'deepseek'|'none'|'auto'|'fetch'）为读入别名（schema 域内保留，防存量值在
   settings 注册面 fail-loud 炸载入），resolveConfig 归一：'deepseek'→
   'dshws-deepseek'，其余→'auto'；**优先级：fallbackMember 存在即权威**。
3. **意图/资格二分**：链在装配时只在兜底者**合格**时实现意图——
   - 工具成员资格 = enabled + 凭据就绪（由既有 selection-skip 缝实现，core.ts
     #isUsable）；
   - DeepSeek 资格 = 被点名 && **就绪工具成员计数 ≤1** && 其 key 有效（由 order
     getter 的 append-only 守卫实现——凭据面对 resolveConfig 构造性不可见，热规则只
     此一条，只追加不替换）。
   **不可实现的意图一律降级为 auto 链**：两条路径的可观测序列（到达序/耗尽摘要/
   noMemberConfigured）与 'auto' 完全一致（skip 成员不入 failures；守卫失败则序中
   无该 id）。存量值永不改写；措辞纪律 = "实现降级为 auto 链"，不说"值回退"。
   readyCount **只数五个工具成员，排除 DeepSeek 自身**（否则"1 工具+DeepSeek 选中"
   自数成 2 而自杀——本 ADR 钉死）。
4. **指定工具成员的静态接线**：resolveConfig 把被点名成员从排序域剥离后固定链尾
   （strip-from-span；用户钉死序中残留的 `dshws-deepseek`/死 id `dshws-fetch-search`
   一并剥除）。DeepSeek 点名不静态入链（资格是运行态的）。
5. **GUI**：「兜底搜索」两按钮 → 「兜底工具」单选择器，选项随就绪数动态：≥2 家=
   [自动 | 各就绪工具]（无 DeepSeek 项+停用说明句）；≤1 家= [自动 | DeepSeek 付费]
   （需模型页 key）。指定成员在链卡渲染锁定尾行（不可排序）+「兜底位」徽标跟随；
   未就绪指定/失效 DeepSeek → 橙色提示。零可用提示三态→二态。
6. **breaking（0.2.0）**：零 key 安装从"碰运气免费抓取"变为 `DSHWS_NO_MEMBER_
   CONFIGURED` 诚实报错（文案点名两出路）；有 DeepSeek key 但未点名的存量用户失去
   自动付费触达（费用控制权归还用户）。存量 'fetch'/'auto' 平滑映射不炸载入。

## Rationale

- 免费地板的"多端网络环境维护"成本（反爬对抗/端点漂移）与其真实可用性不成比——
  删除比维护诚实。
- "指定兜底 = 排序末位"与"显式指定"运行时等价，但显式指定的产品语义（谁兜底是一
  个被声明的角色）+ 锁定尾行 + 徽标跟随，把等价性变成用户可见的契约；B2 落档设想的
  "成员级链尾替换内置地板"扩展随之失去前提（内置地板不复存在）。
- B2 规则 2 原倾向 fail-loud；本设计改判为"实现降级 + GUI 橙标"，依据 = 与既有
  selection-skip 语义同构（未就绪成员被跳过是文档化正本行为），两缝共享同一回退语
  义，不产生第二种回退。

## Alternatives Considered

### 方案 A: 保留免费地板为可选（非默认）
- 排除理由：保留即保留其维护面与报错噪音；用户明确"彻底删除"。

### 方案 B: 双字段（fallbackProvider 开关 + fallbackMember 指定）
- 排除理由：deep-merge 无法 unset 兄弟字段 → 同设冲突与等价双表示两类规则缝
  （S14u 🔴 auto 兜底断裂的同构教训）；单字段使冲突不可表示。

### 方案 C: DeepSeek 常驻选择器（仅默认不选）
- 排除理由：用户裁决 2 家及以上**彻底禁用**——常驻选项与"防意外费用+兜底责任完全
  归工具"的产品意图冲突；最终以就绪计数条件化（第三轮收敛）。

## Consequences

- 正面：报错不再含必死地板行（本案回归验收）；设置页一个选择器表达全部兜底语义；
  DeepSeek 费用完全用户掌控；B2 扩展面消解（文档 superseded）；fetchsearch 维护面
  归零。
- 负面/风险：零 key 开箱可用性丧失（诚实报错替代）；getter 保留一条热规则（凭据面
  不可见性所致，append-only 写法+注释钉死防缝）；direct-pin（ctx.web 注册面，
  ADR-0002 D5）不受 readyCount 影响——与"指定成员未就绪时 provider 仍注册"对称，
  边界句在此备案。
