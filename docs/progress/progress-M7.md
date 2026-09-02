# Progress — M7 功能扩展

> 本文件是 M7 阶段（功能扩展：多 APIKEY 池 / anysearch 成员 / session 溯源）的进度台账。
> 2026-09-03 新开（Session 09）。验收契约：`docs/plans/2026-09-03-009-s09-multi-apikey-pool-plan.md`
> 的 R1-R5 验收条目，阶段验收逐条对应给 PASS/FAIL + 证据；🟢 债务归属映射正本在 plan 009
> 债务映射节，本文件台账为其镜像。

## 里程碑

| 里程碑 | 内容 | 状态 |
|---|---|---|
| M1 治理与规划定稿 | 治理产物齐备且占位符清零，计划过独立审核与人工终审 | ✅ 2026-09-02 |
| M2 可行性定谳 | GUI 形态、安装链路、交付形态有实测结论，ADR-0006/0007 定稿 | ✅ 2026-09-02 |
| M3 宿主包完备 | 五 provider + 链 + 凭据/设置全绿，安装端到端可复现 | 🚧（机械面 ✅ S05b；余用户 with-key 槽位回填——指引 docs/notes/2026-09-02-s05b-install-runbook.md §4） |
| M4 设置页完备 | GUI 全流程（配 key→启停→排序→热生效）浏览器实测通过 | ✅ 2026-09-02（S06+S07） |
| M5 交付就绪 | e2e 收口全绿，文档自洽可复现 | 🚧（e2e 收口腿 ✅ 2026-09-02 S08；文档腿 S12） |
| M6 上游验收通过 | 用户在上游全新构建上完成验收清单 | ⏳ |
| M7 功能扩展 | 每成员多 APIKEY 池 + anysearch 第六成员 + session 溯源徽标（ADR-0008/0009/0010） | 🚧（S09 多 APIKEY 棒进行中；余 S10/S11） |

## 进行中

- Session 09（多 APIKEY 池 + 选择策略）——T0 进行中，T1-T11 待执行

## 待启动

- S10（anysearch 第六成员）→ S11（session 溯源增强）→ S12（手册，原 S09 顺延）→ S13（上游验收准备，原 S10 顺延）

## 已完成

（S09 批次表随执行落此）

## 阶段验收（R1-R5，阶段收官时填）

（S09 验收表随阶段 4/5 落此）

## 技术债（台账）

| 债务 | 等级 | 归属 |
|---|---|---|
| L-2 per-profile GUI 覆盖二期候选 | 🟢 | 维持不排期（plan 009 债务映射节正本） |
| fetch 链排序 UI | 🟢 | 维持不排期（S07 登记） |
| 「恢复默认序」按钮 | 🟢 | 维持不排期（S07 登记） |
| firecrawl fetch 面 402/429 it 独立覆盖 | 🟢 观察 | M3 台账正本；S12 复核 |
| i18n CI 接线 | 🟢 观察 | S12 手册项 |
| tsdown 弃用 ×2 / vitest sourcemap / s06 mtime 口径 | 🟢 观察 | S12 升级演练顺手项 / 上游包产物 / 留痕口径 |
| 牙齿证明惯例沉淀为治理通用实践 | 🟢 观察 | 无主候选（各棒实录累证） |
| v2 backlog：余额/积分定期统计与数据看板 | 🟢 v2 | ADR-0008 缓议章节；未排期（需 provider 余额 API 调研 + 看板 slot 选型，届时另立 ADR） |

## 已验锚点（台账）

| 锚点 | 验证来源 |
|---|---|
| gate 池化友好：src/credentials.ts:56-60（prime 任意 ref 列表，加法幂等只 add 不清）+:63-65（per-ref isReady）+:68-69（#refresh 不吸纳未 watched ref——热增 ref 必须 settings 提交侧 re-prime） | S09 阶段 0/2 审核亲验（必改 1 证据链） |
| thunk 落点：src/index.ts:149-186（每成员 resolveXxxMemberOptions + resolveCredentialValue）+ shared.ts:87-109 resolveMemberApiKey 三态（abort/解析失败/缺失） | S09 阶段 1/2 亲读 |
| settings 数组 patch 整字段替换：宿主 settings/src/index.ts:277-292 mergeLayers；活动例 = 本仓 controller.ts moveSearchChainEntry 整数组回写 | S09 阶段 1/2 亲读 |
| schemastery z.union 枚举可用（非法值拒绝、缺省透传不注入默认） | S09 阶段 2 轮 1 审核 Agent 实测（建议 7）；T1 一行确认留痕 |
| 测试基线 | S07：196\|6(202)；**S08：203\|8(211)**（24 files）；S09 起点自本行 |
