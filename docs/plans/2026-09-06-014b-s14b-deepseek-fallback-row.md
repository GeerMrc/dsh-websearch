# Plan — 2026-09-06-014b-s14b-deepseek-fallback-row

> plan 是验收契约。本棒 = **S14b 插行棒：DeepSeek 配置卡 → 兜底说明行重构（GUI）+
> 双审计修复批**。方向由用户裁定（2026-09-06 对话：删卡改 ⓘ/底部说明；付费兜底
> 关闭能力 = 说明行内嵌开关，AskUserQuestion 获答「说明行+内嵌开关」；计划包
> ExitPlanMode 批准）。分支 `feat/s14b-deepseek-fallback-row`；GUI 重构 + 一处
> node 错误文案 + 文档横面，**链逻辑/成员注册/凭据通路零改动**。

## 目标

DeepSeek 从「与五家对称的完整配置卡」改为「兜底说明行」：状态点 + label + 共用
badge + ⓘ Tooltip（接管语义四点）+ 内嵌付费兜底开关；删除其 key 输入（共享 ref
`DEEPSEEK_API_KEY` 上逗号池会毒化模型页聊天鉴权）/keySelection/Clear/Save。配套
收口今日双审计的全部 🔴/🟡（链错误文案/链块视觉与预警/architecture §6 注记/
台账勘注与新债入册）。

## 背景

- 阶段 0 gate：审 S14a **PASS**（🔴×0；🟡×4 = 双审计发现未入册 → 本棒 T0 入册为
  放行条件；正本 docs/sessions/audit-logs/2026-09-06-s14b-stage0-review-of-s14a.md，
  含计划模式权限限制的替代证据披露）。基线 273 passed | 9 skipped (282)、34 keys、
  client.js 42.09 kB、master `1df5507`。
- 审计锚：设置页（badge/detail 未接接管语境 section.tsx:391；visibleSearch 只滤
  configured :224-226；关唯一成员零预警；chain/core.ts:194 文案误标）；横面
  （00-architecture §6:98-112/:118 旧口径 + §9 索引止于 0007；宿主闲置卡披露缺；
  S14a 入账超报）。
- 支撑事实：`dshws-deepseek` 成员注册必须在产；`enabled` 开关是 ADR-0004 付费
  opt-out 的唯一通路，须保留形态。

## 范围决策（D1-D5）

- **D1 兜底行**：状态点（动态读既有 configured）+ label + badge（title 扩句）+
  ⓘ Tooltip（fallbackNote：接管后官方入口闲置/链内第 5 位兜底/共用模型 key 两处
  后写覆盖/无其他 key 时由此兜底）+ 内嵌开关（aria「DeepSeek 付费兜底」，未就绪
  禁用，绑既有 setEnabled）；删 key 输入/keySelection/hint/Clear/Save；底部
  fallbackFootnote 一行。
- **D2 链块两修复**：disabled 成员行视觉区分（置灰+aria）；configured&&enabled
  归零预警行。
- **D3 错误文案纠偏（node）**：chain/core.ts noMemberConfigured 消息改列通过选择
  门的成员（空则标 chain order）+ 追加设置页指引；受影响测试同步。
- **D4 文档横面**：architecture §6 ADR-0013 注记 + §9 索引补 0008-0013；台账勘注
  （S14a 入账超报）+ 新债入册（宿主闲置卡披露→S15 / architecture 其余陈旧→S15）。
- **D5 scope-out**：README 本体与宿主闲置卡披露正文（S15）；宿主 UI；fetch 面；
  node 链逻辑/成员注册/凭据通路。

## WBS

T0 治理批（本提交）→ T1 兜底行重构（TDD：locales 新键 + section.tsx deepseek 分流
+ section/entry spec 更新）→ T2 链块两修复（TDD）→ T3 错误文案纠偏（TDD）→
T4 文档批 → T5 门墙七命令 → T6 浏览器验证（重装 tarball 重启 3423，stub 3432 续用）
→ T7 阶段 4/5 独立验证 + 收尾 + merge `--no-ff` + 接力。

## 验收（R1-R6）

R1 兜底行全要素（无 key 输入面/ⓘ 四点/内嵌开关/动态状态/badge）；R2 链块两修复
红绿；R3 错误文案不误标+指引+测试同步；R4 architecture 注记+索引+台账对齐；R5 门墙
全绿（i18n parity；基线 273|9(282) 起算，测试数如实增减披露）；R6 浏览器亲见+隔离。

## 债务归属映射（正本）

本棒清偿/入册：阶段 0 🟡×4 + 设置页审计 🟡×5 全收口。归 S15：README 三悬空/
宿主闲置卡披露正文/runbook 收口/「第 5 位」措辞勘注/architecture 其余陈旧。维持：
🟢×4 + L-2 + 观察 + v2。

## 高危命令预告

/tmp scratch 自建；3423 重启 + 3432 stub 续用（查占/精确 kill/常驻零接触）；tarball
重装（npm pack 非 publish）；浏览器自动化（fake 键）；宿主仓零写。
