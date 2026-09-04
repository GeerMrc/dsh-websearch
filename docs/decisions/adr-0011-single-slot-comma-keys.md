---
title: "ADR-0011: 多 APIKEY 改判单槽逗号值（每成员单一凭据引用，k1,...,kN）"
status: accepted
date: 2026-09-03
type: arch
supersedes: ADR-0008
origin: 用户验收反馈（2026-09-03 S11 计划两轮方向确认；单槽逗号值 + 轮询/顺序可选 + 上限）
---

# ADR-0011: 单槽逗号值形态

## Status

accepted（2026-09-03，S11 计划 2.5 用户真实批准）；**supersedes ADR-0008**（多 ref 池形态自本 ADR 起废止）

## Context

ADR-0008 定的多 ref 形态（`extraApiKeyEnvs` 追加引用名 + 逐个起名/存值）经用户实际验收后反馈：管理与维护不便，期望单槽逗号值（一个凭据引用的值即 `k1,k2,...,kN`）；若不可行则宁回退单 key。经两轮方向确认与计划审核（plan 011），改判为单槽逗号值形态。

关键事实（S10 阶段 0/计划审核亲证）：

1. 宿主 credentials 的 `configured` 判定是「值存在」（非空字符串），**逗号串整体有值即 configured**——gate 零改动即可兼容单槽形态（credentials.ts:63-65 describe 布尔缓存）。
2. 宿主 credentials-local 对存储值只要求非空字符串（:635 `stored !== undefined → configured: true`）——`k1,k2` 串可存可读。
3. key 轮换的作用对象从「ref 级」变为「同一 ref 值内拆分出的 key 级」——`keySelection`（order/round-robin/random）语义不变，作用于 split(',') 后的序列。
4. `extraApiKeyEnvs` 字段与附加 keys GUI（S09 交付）随之退场；`keySelection` 字段保留。

## Decision

1. **单槽逗号值**：每成员保持**一个凭据引用**（`apiKeyEnv`，如 `TAVILY_API_KEY`），其值为逗号分隔的 key 串 `k1,k2,...,kN`。**删除** config 五成员+anysearch 的 `extraApiKeyEnvs` 字段（Settings/MemberConfig/schema/resolveConfig 四件制品）与 client 附加 keys 列表 UI（extraRefs/ExtraKeyRow/添加行，locales extraKeys/addKey/removeKey/refName 四键退场）。
2. **上限 10**：同一成员拆分后的 key 数 >10 → fail-loud（`DshwsError` codes.requestFailed + 明确 message——沿用「不新增错误码」承诺；requestFailed 为家族通用失败码，链按成员失败降级）。GUI 输入框下 `!` helper text（格式 + 上限说明，新 locale 键 `keyFieldNote`）。
3. **轮换语义**：`resolveMemberApiKey` 前置拆分——值 split(',') → trim → 滤空 →（超限报错）→ 按 `keySelection` 在 key 序列上选一把 → 既有三态路径。空/纯逗号值 = 空池 → 既有 `credentialMissing` 列 ref（与「存了但值全空」同一出口）。
4. **gate 语义**：configured = ref 有值（逗号串整体有值即 true）——成员就绪与链跳过行为零变化；「存了纯逗号」的值在拆分滤空后为空池，fail-loud（诚实路径）。
5. **GUI**：主 key 输入框即唯一入口（type=password 不变，值可逗号串），下挂 `!` helper text；附加 keys 列表区/添加行删除；`keySelection` 控件 v1 不做（配置文件项，GUI 控件留待评估——plan 011 债务台账登记）。

## Rationale

- 用户验收反馈：逐个起引用名的管理成本高于收益；单槽逗号值贴合「一个框配 N 把 key」的心智模型，且整池覆盖/清除语义天然成立（用户确认为正确行为）。
- 零明文纪律不变：逗号串整体仍存凭据层，settings.yaml 只落 ref 名。
- S09 基础设施（KeyPool 策略选择/热通路/gate）全部保留——重构面收敛于「ref 级池 → 值内 key 池」的解析层。

## Consequences

### 正面
- GUI 单输入框即可配 N 把 key；轮询/顺序策略可选且热生效。
- 凭据生态入口唯一（每成员一个 ref）。

### 负面 / 风险
- 凭据页看到的是逗号串（不透明）；清除 = 整池清（用户确认接受）。
- key 个体无独立状态（无法单独清除第 2 把）——重配即整池覆盖。
- config breaking（extraApiKeyEnvs 删除）——pre-release 无兼容承诺；settings.yaml 已落该字段的部署需手工删除（S15 手册注记；2026-09-04 重排勘注）。
