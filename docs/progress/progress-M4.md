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
| M4 设置页完备 | GUI 全流程（配 key→启停→排序→热生效）浏览器实测通过 | ✅ 2026-09-02（S06 配 key/启停 + S07 排序 = 浏览器证据；热生效 = S05a 实测 + S07 热链序回归——复合证据按 plan 007 D6 尺，T7 裁定成立） |
| M5-M6 | 交付就绪 / 上游验收通过 | ⏳ |

## 进行中

- 无（S07 收官；下一棒 S08 待启动）

## 待启动

- Session 08（e2e 场景收口）——前置：S07 已收官（排序写通路端到端实物在档，loopback 可用 settings 预置链序断言调用时序）

## 已完成

### S07 排序+i18n 批（2026-09-02，分支 feat/s07-priority-i18n）

阶段 0 独立审核 S06 **PASS**（🔴×0；🟡新登记×2 = 誊写纪律/STATUS 总览漏刷，T0 清偿
`0180c95`；🟢 L-2 维持 + 观察×4 坐实）→ plan 007 落盘 → 阶段 2 轮 1 **NEEDS REVISION**
（必改×1 M-1 makeSnapshot 机械配套；建议×5）→ 全数吸收 → 同 Agent 复审 **APPROVED**
（7/7 闭合零残留）→ 阶段 2.5 AskUserQuestion 未获答，按接力序取默认批准项自主推进
（披露，session 记录双落——S03/S04/S05a/S06 同款兜底）。

| 任务 | 内容 | 结果 |
|---|---|---|
| T0 | 治理批：plan 007 + 阶段 0/2 audit-log + STATUS 启动刷新 + 🟡×2 清偿 + dont-do 第三条扩化（状态区清单收编 STATUS 总览行） | 完成（`0180c95`，master 直提） |
| T1 | locales 扩四键（moveUp/moveDown/chainDefault/chainPinned zh/en）+ spec 断言 | 完成（`d7d57cd`；红 1 failed → 4 passed；typecheck 双面翻转绿） |
| T2 | controller `moveSearchChainEntry` + pinned 派生字段；makeSnapshot 机械配套（M-1） | 完成（`58e994d`；红 6 failed\|10 passed → client 34 passed；typecheck exit 0） |
| T3 | section 搜索链 ↑/↓ 按钮（per-item aria、边界 disabled）+ ChainStateBadge + failed 反馈；抓取链保持只读 | 完成（`c141416`；红 6 failed\|7 passed → client 39 passed；lint 0w0e；1 失败系测试作用域缺陷修正后绿） |
| T4 | i18n 门禁两脚本（check-locales/check-cjk，零依赖 .mjs）+ `check:i18n` + 拒绝路径双验证 | 完成（`194c9a2`；正例 exit 0 = 19 keys parity + 15 files 零 CJK；拒绝：zh 独有键 exit 1 / CJK 字面量 exit 1 且行号保真） |
| T5 | 门墙七命令（提交态）+ 本台账 + Agent Note（docs/notes/2026-09-02-s07-priority-i18n.md）+ settingsScope 观察闭合注记（plan 007 D3：维持自持控制器） | 完成（数字见下节门墙表） |
| T6 | 浏览器 DOM 断言（scratch 3413，主 Agent IAB 实测棒） | 完成（`15bfa4d` 证据 commit；六断言全过：①排序 UI+双徽章初始 default+fetch 0 按钮+边界初态②下移首项→序物化翻转+徽章翻 pinned+**settings.yaml 实物落盘新数组**③reload 持久④移动后边界复验⑤fetch 链独立⑥kill 84536 精确零残留——65097 ZCode Helper 客户端连接识别未误杀；boot 带 `--no-open`） |
| T7 | 阶段 4/5 独立验证 | **PASS / COMPLETE**（R1-R6 逐条 PASS + 门墙七命令提交态亲跑零偏差 + node 面与 S06 tarball cmp 逐字节一致 + 双拒绝路径亲证红 + 隔离法证 + 三问 COMPLETE；🟡 ~/.dsh mtime 落窗口径项——session-07 记录措辞处置清偿 + dont-do 第四条沉淀；🟢×3 观察；audit-log 正本 docs/sessions/audit-logs/2026-09-02-s07-stage45-verification.md） |
| T8 | 收尾（本文件 + session 记录 + STATUS/roadmap/CHANGELOG 原子收官 + merge `--no-ff` + 接力指令） | 完成（本序列） |

### 门墙实测数字（提交态，node v22.23.2 / pnpm 11.7.0）

| 棒 | 命令 | 数字 |
|---|---|---|
| S05a/S05b | （历史）test/typecheck/lint/build/pack | 157\|6(163) 等——正本 progress-M3 |
| S06 | test 22 files **184\|6(190)** / typecheck exit 0 / lint 0w0e 38 files / build 49.00+21.89+**16.52** kB / pack 五件 | T7/T9 两次亲跑一致（progress-M3 面口径见其台账） |
| S07 | test 22 files **196\|6(202)**（+12：locales+1/controller+6/section+5）/ typecheck exit 0 双面 / lint **0 warnings 0 errors** 38 files / build **node 面 49.00+21.89 零漂移 + client.js 20.54 kB（gzip 5.82）新值** / pack 五件 / **check:i18n exit 0（19 keys parity + 15 files 零 CJK）** | S07 T5 提交态亲跑（工作树 clean） |

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
| T7 | 门墙四命令 + Agent Note + 本台账 | 完成（`c310ec8`；下表 + docs/notes/2026-09-02-s06-settings-gui.md） |
| T8 | 浏览器 DOM 断言（scratch 3412，agent 实测棒） | 完成（`de53d72` 证据 commit；六断言全过：①combo 200/5,126,016B 含 id 注册②导航 en+zh 热切换③5 卡④key 写入→Configured+服务端 refs⑤启停→settings.yaml 落盘⑥unset 复原+refs:{}+开关复位；kill 零残留；环境留痕：IAB locator click 挂起→evaluate 合成点击路径） |
| T9 | 阶段 4/5 独立验证 | **PASS / COMPLETE**（R1-R5 逐条 PASS + 门墙亲跑零漂移 + 冒烟 27 passed + 隔离法证 + 三问 COMPLETE；🟡 提交态不自洽抓获——section.spec 修复滞留工作区自 T6，`899e2fd` 补提交清偿 + 提交态门墙亲跑全绿；🟢×4 观察 = order 断言（同 commit 清偿）/react 锚 ^18.3.1 注记（见已验锚点）/简报措辞偏差（非执行侧）/sourcemap 警告；audit-log 正本 docs/sessions/audit-logs/2026-09-02-s06-stage45-verification.md） |

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

### S06 验收（阶段 4/5 独立 Agent 逐条对峙 2026-09-02，正本 audit-log stage45）

| 条目 | 内容 | 结论 | 证据 |
|---|---|---|---|
| R1 | client half 构建契约可重放 | PASS | lib/client.js 16,516B + banner ModuleLoader 形含 id（head -c 亲见）；外部 require 恰三枚（react/react-jsx-runtime/ui-primitives）零实现内联（useState 2 处均外部调用形态 lib/client.js:331-332）；exports["./client"] 与 dsh.client 三键三方一致（宿主 clientExportOf/parseDshClient :200-237 + wire manifest.ts:196-206）；pack 五件（`9a97def`） |
| R2 | 设置节注入可重放（jsdom 契约 + 浏览器 DOM） | PASS | entry.spec 6 行为（register 契约含 order——`899e2fd` 补断言）；combo.js 5,126,016B 含 `id: "dsh-websearch"` 实物亲验 + page.html 含 dsh-websearch；T8 断言①②（导航 en/zh 热切换） |
| R3 | provider 卡交互可重放（jsdom 动作断言 + 浏览器 key 写入→credentials describe 可见） | PASS | controller 10 + section 8 行为；T8 断言④⑤ + 服务端终态亲见（settings.yaml enabled 复原态 + .credentials.yaml refs:{}——fake 写入/清除双向实测走通） |
| R4 | 链只读展示（双链 + 超时，jsdom + 浏览器双面） | PASS | section.spec 第 8 行为（双 ol 逐项 BUILT_IN 序 + 30000）+ T8 断言③；dump-wired.yml 实为基线+insert 行（链标量为代码注册 id 不入 dump——stage45 澄清在案；接线上限态由 wired dump + T8 组合证明） |
| R5 | 五子证据（隔离/门墙/收尾/翻转/parity+audit-log） | PASS | ①隔离（git message 扫描零写操作 + s05b home mtime 早于本棒 + ~/.dsh mtime 零接触 + 3412 kill 复原）②门墙四命令亲跑零漂移（数字正本 = 本文件「门墙实测数字」节）+ 提交态复验（`899e2fd` 后亲跑）③收尾件套（T10 同序列）④原子翻转（本序列）+ `--no-ff` ⑤typed parity + audit-log 三份正本落盘 |

### S07 验收（阶段 4/5 独立 Agent 逐条对峙 2026-09-02，正本 audit-log stage45）

| 条目 | 内容 | 结论 | 证据 |
|---|---|---|---|
| R1 | 搜索链排序可重放 | PASS | controller.spec 六排序行为 + T6 实物（settings-after-move.yaml 物化数组 = 默认序首项下移精确结果；dump 两态 diff 351-352c/544a547-549）；D6 分层：①GUI→落盘 T6 实物 ②patch 载荷 spec 断言 ③热链序 settings.test.ts:124-140 回归绿 ④端到端 order = S08 行原样 |
| R2 | 覆盖标记可重放 | PASS | deriveSnapshot presence 派生（controller.ts:122-123）+ 徽章 data 属性+文案双承载（section.tsx:179-182）+ T6 两态实测（初始双 default→search pinned→fetch 独立 default） |
| R3 | parity 校验脚本绿 + 拒绝路径红 | PASS | 正例 exit 0（19 keys union/en/zh parity）；注入 zh 独有键 → exit 1「zh extra」亲证 → 还原树干净 |
| R4 | CJK 门禁零命中 + 拒绝路径红 + 注释豁免 | PASS | 15 files 零命中；4 文件 JSDoc CJK 真实豁免；errors.ts:21 注入 → exit 1 行号保真 → 还原 |
| R5 | 门墙七命令（提交态） | PASS | test 196\|6(202) / typecheck exit 0 / lint 0w0e 38f / build node 面 49.00+21.89 **cmp 逐字节一致** + client.js 20.54 新值 / pack 五件 / check:i18n exit 0；门墙后树仍干净 |
| R6 | 五子证据 | PASS | ①隔离（3413 LISTEN=0 + 3080=90269 未动 + s05b/s06 mtime 早窗 + ~/.dsh 口径修正「T6 动作零接触」）②门墙（上）③收尾件套（T8 序列）④原子翻转 + `--no-ff` ⑤audit-log 三份正本 |

## 技术债（台账）

| 债务 | 等级 | 归属 |
|---|---|---|
| L-2 per-profile GUI 覆盖二期候选 | 🟢 | 二期候选，不排期（plan 007 债务映射节正本） |
| settingsScope/store 快照机制未用（骨架直连 remote 面） | 🟢 观察→**闭合**（S07） | plan 007 D3 定谳：排序与既有写动作同形，store 迁移零用户可见增益——维持自持控制器（S06 plan D1 观察就此关闭） |
| fetch 链排序 UI（roadmap S07 仅 search 链） | 🟢 | 新登记 S07：候选不排期，用户反馈驱动（plan 007 D2） |
| 「恢复默认序」按钮（需 patch 删除语义先行定谳） | 🟢 | 新登记 S07：候选不排期（plan 007 D4） |
| tsdown 弃用警告 ×2（inlineDynamicImports/external） | 🟢 观察 | S12 升级演练时顺手迁移（原记 S09，2026-09-03 顺延；语义同宿主 preset） |
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
| react devDep 实装锚：react ^18.3.1（18.3.1）/ react-dom ^18.2.0——D6 原声明 ^18.2.0 对 react 而言解析到 18.3 线（stage45 🟢 注记；18 大版本内门墙全绿） | package.json + stage45 门墙亲跑 |
| 测试基线 | S03：47（6 文件）；S04：93\|2(95)；S05a/S05b：157\|6(163)（18 文件）；**S06 T7/T9：184\|6(190)（22 文件）** |
| 写通路（客户端）：key→credentials.set(ref,value)→describe 刷新；启停→settings.update(ns,{member:{enabled}},revision)；事件→重 describe | controller.spec 10 行为 + entry.spec 6 行为（jsdom 实测断言）——浏览器面 T8 六断言复验（Configured 翻转 + settings.yaml 落盘 + refs 清空） |
| IAB 浏览器实测环境（T8 实录）：playwright locator click() 挂起（fill/getAttribute/evaluate 正常）；坐标 cua.click 可用但 DOM 插入后漂移；**evaluate 合成 MouseEvent dispatch = 可靠点击路径**（React root 监听捕获冒泡） | session-06 记录踩坑节 + T8 证据 commit `de53d72` |
| 排序写通路：`moveSearchChainEntry` 全量数组 patch（indexOf→swap→update）；数组替换宿主先例 tests/settings.test.ts:135-136 + 热链序 :124-140；物化语义 = 默认序上移动即写显式数组 | S07 T2 六行为（controller.spec）+ plan 007 D6 |
| 覆盖标记语义：describe 只带 user-set 字段（controller.ts:54 注释）→ 值显式在场 = pinned；组合标量属 cordis 组合层 client 不可达（index.ts:26 inject 五面） | S07 T2 派生测试 + plan 007 D1（阶段 2 两轮审核裁定成立） |
| i18n 门禁：`pnpm check:i18n` = scripts/check-locales.mjs（三集合 parity，fail-loud）+ scripts/check-cjk.mjs（状态机剥注释保换行→行号保真）；拒绝路径双证 exit 1 | S07 T4 实录（`194c9a2` message + /tmp/dshws-t4-r*.log 转录） |
