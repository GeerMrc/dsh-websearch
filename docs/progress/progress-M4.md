# Progress — M4 设置页完备

> 本文件是 M4 阶段（设置页 GUI）的进度台账。2026-09-02 新开（Session 06）。
> 验收契约：`docs/plans/2026-09-02-006-s06-settings-gui-plan.md` 的 R1-R5 验收条目，
> 阶段验收逐条对应给 PASS/FAIL + 证据；🟢 债务归属映射正本在 plan 债务映射节，本文件台账
> 为其镜像。

## 里程碑

| 里程碑 | 内容 | 状态 |
|---|---|---|
| M1 治理与规划定稿 | 治理产物齐备且占位符清零，计划过独立审核与人工终审 | ✅ 2026-09-02 |
| M2 可行性定谳 | GUI 形态、安装链路、交付形态有实测结论，ADR-0006/0007 定稿 | ✅ 2026-09-02 |
| M3 宿主包完备 | 五 provider + 链 + 凭据/设置全绿，安装端到端可复现 | 🚧（机械面 ✅ S05b；余用户 with-key 槽位回填——指引 docs/notes/2026-09-02-s05b-install-runbook.md §4） |
| M4 设置页完备 | GUI 全流程（配 key→启停→排序→热生效）浏览器实测通过 | 🚧（S06 骨架棒进行中） |
| M5-M6 | 交付就绪 / 上游验收通过 | ⏳ |

## 进行中

- Session 06（「网页搜索」设置页骨架）——T0-T7 完成，T8 浏览器面待跑

## 待启动

- Session 07（优先级排序 + 覆盖标记 + i18n）——前置：S06 收官

## 已完成

### S06 设置页骨架批（2026-09-02，分支 feat/s06-settings-gui）

阶段 0 独立审核 S05b **PASS**（🔴×0；🟢×1 维持 + 观察×2 → T0 处置）→ plan 006 落盘 →
阶段 2 轮 1 **NEEDS REVISION**（必改 ×1：D6 漏 @types/react；建议 ×4）→ 全数吸收 → 同
Agent 复审 **APPROVED**（残项 1：T-prep 包名笔误，随批修正）→ 阶段 2.5 AskUserQuestion
未获答，按接力序取默认批准项自主推进（披露，session 记录双落）。

| 任务 | 内容 | 结果 |
|---|---|---|
| T0 | 治理批：阶段 0/2 audit-log 落盘 + STATUS 启动刷新 + 🟢-5/-6 处置 + plan 006 | 完成（`3e4eb50`，master 直提） |
| T-prep | 12 项 devDeps + minimumReleaseAge exclude 6 条（pnpm 自动按预案落盘） | 完成（`8fe9238`） |
| T1 | tsconfig 双面拆分（client face dom+jsx+types:[]；root exclude client 面） | 完成（`459f705`；157\|6(163) 零漂移；双跑合翻至 T3——空 include TS18003 时点留痕） |
| T2 | client 构建契约 + manifest 三键（exports./client + dsh.client.platform/inject/external） | 完成（`d23f7c7`；node 构建零漂移；pack 四件清单同构；client 配置解析证明；`clean: false` 防 outDir 互清——失败试跑清 lib/ 实测踩坑） |
| T3 | typed locale 字典（NS=dsh-websearch，15 键 zh/en 编译期 parity）+ 双面 typecheck 合跑 | 完成（`7748924`；红=模块缺失 → 3 passed；160\|6(166)） |
| T4 | 设置控制器（端口面 + describe/update/set/unset + 事件刷新） | 完成（`fb45198`；红=模块缺失 → 10 行为绿；170\|6(176)；宿主类型经 dsh-settings/types 子路径） |
| T5 | 设置节组件（5 provider 卡 + StateDot + 启停 + 双链只读） | 完成（`1a02cca`；jsdom 8 行为红→绿；vitest inline ui-primitives（CSS module）；178\|6(184)；lint 0w0e 36 files） |
| T6 | client entry（inject 五面 + slot 契约 + 控制器绑定）+ build:client 激活 | 完成（`9a97def`；entry 6 行为红→绿；lib/client.js 16.52 kB、external 三枚 require 零 react 内联、pack 五件；**偏差披露：第 13 devDep ui-renderer@alpha.4**（ctx.slots 类型面，范本同款）） |
| T7 | 门墙四命令 + Agent Note + 本台账 | 完成（下表 + docs/notes/2026-09-02-s06-settings-gui.md） |

### 门墙实测数字（S06 T7 收口，node v22.23.2 / pnpm 11.7.0）

- `pnpm test` → **Test Files 22 passed (22)，Tests 184 passed | 6 skipped (190)**，~1.05s
  （S05b 基线 157|6(163) → +27 passed；skip = 真实 API 自跳口径不变）
- `pnpm typecheck` → exit 0（node + client 双面）
- `pnpm lint` → **0 warnings and 0 errors**（38 files，96 rules——.tsx 入面；entry.spec
  未用形参 warning 一枚，改 `_value` 前缀清偿，非豁免）
- `pnpm build` → lib/index.js 49.00 kB + lib/index.d.ts 21.89 kB + **lib/client.js 16.52 kB**
  （gzip 12.34 / 4.83 / 4.92；node 面与 S05b 终值逐位一致零漂移）
- `npm pack --dry-run` → 五件：cordis.patch.yml + package.json + lib/index.js +
  lib/index.d.ts + lib/client.js

## 阶段验收（R1-R5，阶段收官时填）

### S06 验收（阶段 4/5 独立 Agent 逐条对峙 2026-09-02，正本 audit-log stage45 🚧 生成中）

| 条目 | 内容 | 结论 | 证据 |
|---|---|---|---|
| R1 | client half 构建契约可重放 | 🚧 | 🚧 |
| R2 | 设置节注入可重放（jsdom 契约 + 浏览器 DOM） | 🚧 | 🚧 |
| R3 | provider 卡交互可重放（jsdom 动作断言 + 浏览器 key 写入→credentials describe 可见） | 🚧 | 🚧 |
| R4 | 链只读展示（双链 + 超时，jsdom + 浏览器双面） | 🚧 | 🚧 |
| R5 | 五子证据（隔离/门墙/收尾/翻转/parity+audit-log） | 🚧 | 🚧 |

## 技术债（台账）

| 债务 | 等级 | 归属 |
|---|---|---|
| L-2 per-profile GUI 覆盖二期候选 | 🟢 | 二期候选，不排期（plan 006 债务映射节正本） |
| settingsScope/store 快照机制未用（骨架直连 remote 面） | 🟢 观察 | S07 排序交互时再评估（plan D1 显式范围决策） |
| tsdown 弃用警告 ×2（inlineDynamicImports/external） | 🟢 观察 | S09 升级演练时顺手迁移（语义同宿主 preset） |
| firecrawl fetch 面 402/429 it 缺独立覆盖 | 🟢 观察 | 不处置（M3 台账正本）；S08 e2e 若覆盖则自然收口 |

## 已验锚点（台账）

| 锚点 | 验证来源 |
|---|---|
| 范本 client entry 形态：ui-settings-plugins/src/client/index.ts:59-61（inject 六键）/:67-69（locale register/bind）/:149-157（settings.section 注册）/src/index.ts:11（空 apply） | S06 阶段 1 摸底 + 阶段 2 轮 1 审核亲验一致 |
| 模块表基线 PLATFORM_MODULES 含 ui-primitives（packages/client/web/src/platform.ts:12）+ PRELOADED_CLIENT_EXTERNALS 空 | 阶段 1 亲读 + 轮 1 审核亲验（plan 曾笔误 :16 已校正） |
| manifest 读取语法：dsh.client.inject/external 字段（packages/client/modules/src/client/manifest.ts:58/:62/:196-206） | 阶段 1 亲读 + 轮 1 审核亲验 |
| 宿主 client 构建四件套（packages/client/tsdown.client.ts:576/:582/:589-591）+ externals 请求面（:462-470） | 阶段 1 亲读 + 轮 1 审核亲验 |
| remote 类型面：settings.describe/update 与 credentials.describe/set/unset（packages/api/settings-controller/lib/typert.remote-client.d.ts:12-25）+ SettingsNamespaceView/SettingsDescribeValue（dsh-settings lib/types/types.d.ts:28/:64，**经 ./types 子路径导出**）+ CredentialInfo（dsh-credentials lib/types/types.d.ts:60） | 阶段 1 亲读 + 轮 1 审核亲验 + T4 typecheck 实证 |
| ctx 合并声明：ctx.locale（dsh-client-locale lib/types/client/index.d.ts:56）/ctx.remote（dsh-api-remotes lib/types/client/index.d.ts:48）/ctx.slots（dsh-client-ui-renderer/client——范本 index.ts:18 同款 type-only import） | T6 实证（第 13 devDep typecheck 通过） |
| ui-primitives 契约：StateDot{state,size?,className?} aria-hidden / Button variant+attrs 透传 / Input wrapper+attrs 透传（lib/types/*.d.ts） | T5 实测（jsdom data-state/role 断言命中） |
| LocaleNamespaceMap 增强目标 + LocaleKeysOf 含 common 回退键（dsh-client-ui-slots lib/types/index.d.ts:27/:48/:67） | T3/T5 typecheck 实证 |
| npm 发布面（2026-09-02 亲测）：六个 client 包（locale/ui-slots/ui-settings/ui-primitives/api-remotes/ui-renderer）alpha.2..5 线全在，devDep 锚 alpha.4 | T-prep/T6 `pnpm add` 落盘 + 阶段 1/2 `npm view` 双验 |
| 测试基线 | S03：47（6 文件）；S04：93\|2(95)；S05a/S05b：157\|6(163)（18 文件）；**S06 T7：184\|6(190)（22 文件）** |
| 写通路（客户端）：key→credentials.set(ref,value)→describe 刷新；启停→settings.update(ns,{member:{enabled}},revision)；事件→重 describe | controller.spec 10 行为 + entry.spec 6 行为（jsdom 实测断言）——浏览器面 T8 复验 |
