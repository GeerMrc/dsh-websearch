---
title: "ADR-0012: key 级 random 策略改判不放回随机（洗牌牌堆采样）"
status: accepted
date: 2026-09-04
type: arch
origin: S11 计划二轮问询用户方向「变体 B 不放回随机」（plan 011 背景，标注仍可讨论）；S13 计划 2.5 终审收口（问询未获答，按接力序取推荐默认批准——披露见 session-13）
---

# ADR-0012: key 级 random 改判不放回随机

## Status

accepted（2026-09-04，S13 计划 2.5 终审；**AskUserQuestion 未获答 → 按接力序取推荐默认「变体 B」批准，S09/S10 先例，全程披露**）。本 ADR 细化 ADR-0011 Decision 3 的 `random` 采样语义，不 supersede 任何 ADR。

## Context

- ADR-0008 定 `keySelection` 三策略（order/round-robin/random）；ADR-0011 改判单槽逗号值后，三策略作用于拆分后的 key 序列（split(',') → trim → 滤空，上限 10）。
- `random` 现状 = **有放回采样**：`src/keys.ts` `#select` 每请求独立 `keys[floor(rng() × n)]`——可连续多请求命中同一把，单周期负载不均。
- S11 计划二轮问询「random 变体」时用户方向为「变体 B 不放回随机」，未获正式确认，标注「仍可讨论」移交 ADR 定谳（roadmap S13 行）。
- 成员级（跨工具）选择 = 顺序降级（ADR-0002 完整高可用链；ADR-0004 全局优先级中立默认），不在本 ADR 范围。

## Decision

1. `random` 策略改判**不放回随机**：每成员 KeyPool 维护洗牌牌堆；每请求逐张抽牌，一轮（一个牌堆周期）内每把 key 恰抽一次；抽尽按 **Fisher-Yates 升序公式**重洗（`j = i + floor(rng() × (n − i))`，`rng` 端口注入不变；rng≡0 ↔ 恒等排列——既存钉牌单发断言 tests/keys.test.ts:66-71 零漂移）。
2. **牌堆重建**：每次 resolve 的现拆分序列与牌堆的去顺序多重集不一致（settings 热改逗号值/换 ref）即整堆重建后重抽。
3. **失败语义不变**：key 请求失败不换把不回牌——消耗本次抽牌，直接链层降级下一成员（12b 两级调用语义正本表：docs/notes/2026-09-04-s12b-page-info-deepseek.md）。
4. `order`/`round-robin` 语义零改动；**成员级保持顺序降级不变**（范围注记，防「成员级 random」误读）。
5. keySelection GUI 控件与两级调用顺序说明 UI（S13 交付）按 plan 013 D2/D3/D5。

## Rationale

- 不放回保证单周期内负载严格均匀（n 把 key 任意 n 连发每把恰一次），消除有放回的连续同把命中；与 S11 用户方向一致。
- 升序公式钉死 rng 契约：rng≡0 → 恒等排列，既存测试断言存活，本棒测试面收敛为新增行为断言（TDD 红绿）。

## Consequences

### 正面
- 单周期均匀轮转；与 round-robin 的差异收敛为「每轮起点与次序随机 vs 固定」。
### 负面 / 风险
- KeyPool 新增牌堆状态（单成员实例内）；热改池值触发整堆重建（一次重算，无外部观察面）。
- wire 级「random ∈ 就绪集」断言不变；序列级断言依赖牌堆语义（keys.test 新增红绿覆盖）。
