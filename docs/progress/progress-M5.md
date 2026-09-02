# Progress — M5 交付就绪

> 本文件是 M5 阶段（验证与文档）的进度台账。2026-09-02 新开（Session 08）。
> 验收契约：`docs/plans/2026-09-02-008-s08-e2e-loopback-plan.md` 的 R1-R5 验收条目，
> 阶段验收逐条对应给 PASS/FAIL + 证据；🟢 债务归属映射正本在 plan 008 债务映射节。

## 里程碑

| 里程碑 | 内容 | 状态 |
|---|---|---|
| M1 治理与规划定稿 | 治理产物齐备且占位符清零，计划过独立审核与人工终审 | ✅ 2026-09-02 |
| M2 可行性定谳 | GUI 形态、安装链路、交付形态有实测结论，ADR-0006/0007 定稿 | ✅ 2026-09-02 |
| M3 宿主包完备 | 五 provider + 链 + 凭据/设置全绿，安装端到端可复现 | 🚧（机械面 ✅ S05b；余用户 with-key 槽位回填——指引 docs/notes/2026-09-02-s05b-install-runbook.md §4） |
| M4 设置页完备 | GUI 全流程（配 key→启停→排序→热生效）浏览器实测通过 | ✅ 2026-09-02（S06+S07；热生效复合证据 plan 007 D6） |
| M5 交付就绪 | e2e 收口全绿，文档自洽可复现 | 🚧（S08 e2e 收口棒进行中；文档腿归 S09） |
| M6 上游验收通过 | 用户在上游全新构建上完成验收清单 | ⏳ |

## 进行中

- Session 08（e2e 场景收口）——T0 进行中，T1-T8 待执行

## 待启动

- 无（S08 收官后下一棒 = S09 README+迁移+升级手册，由 S08 收官序列刷新）

## 已完成

（S08 批次表随执行落此）

## 阶段验收（R1-R5，阶段收官时填）

（S08 验收表随阶段 4/5 落此）

## 技术债（台账）

| 债务 | 等级 | 归属 |
|---|---|---|
| L-2 per-profile GUI 覆盖二期候选 | 🟢 | 维持不排期（plan 007/008 债务映射节） |
| fetch 链排序 UI | 🟢 | 维持不排期（S07 登记） |
| 「恢复默认序」按钮 | 🟢 | 维持不排期（S07 登记） |
| firecrawl fetch 面 402/429 it 独立覆盖 | 🟢 观察 | M3 台账正本；S08 loopback 不含 fetch 链（plan 008 D2），S09 复核 |
| i18n CI 接线 | 🟢 观察 | S09 手册项 |
| tsdown 弃用 ×2 / vitest sourcemap / s06 mtime 口径 | 🟢 观察 | S09 升级演练顺手项 / 上游包产物 / 留痕口径 |

## 已验锚点（台账）

| 锚点 | 验证来源 |
|---|---|
| 装配层：src/index.ts:89-206（apply 全序）+ fakeCtx 台架 tests/apply.test.ts:26-81（providers Map/configured Set/settings hooks/emitter/flushGate :83-85） | S08 阶段 1 摸底 + 阶段 2 轮 1 审核亲验（41 处 0 虚构） |
| 链层：src/chain/core.ts:133-184（run/选用门/超时 race/降级）+:162 served-by 日志+:171 caller-abort 直传+:173-177 reason=error.message+:204-210 withServedBy 首行/单行 | S08 阶段 1/2 亲读（M1 断言面修正依据） |
| 错误层：src/errors.ts:93-101（EXHAUSTED 逐成员行 + 末位 cause）+ core.ts:174（DSHWS_MEMBER_TIMEOUT 合成标记） | S08 阶段 1/2 亲读 |
| HTTP 面：tavily.ts:130 / exa.ts:136 POST {base}/search；perplexity.ts:146 POST {base}/chat/completions 且 :115-127 content 载体；shared.ts:66-75 unfoldHttpErrorDetail 三成员替换/追加不对称 | S08 阶段 1/2 亲读（D4/D6 依据） |
| 测试基线 | S06：184\|6(190)；**S07：196\|6(202)**（22 files）；S08 起点自本行 |
