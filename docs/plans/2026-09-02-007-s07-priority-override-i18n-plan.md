# Plan — 2026-09-02-007-s07-priority-override-i18n-plan

> plan 是验收契约：R 验收条目是 progress 台账阶段验收的对照正本，验证矩阵是各阶段验证的
> 单源引用；🟢 债务归属映射的正本在本文件债务映射节。本棒为 GUI 产品代码棒（client half
> 排序交互 + 覆盖标记 + i18n 门禁脚本）：核心逻辑/契约类任务走 TDD 红→绿逐一执行；脚本/
> 治理批以命令实证为验证手段（分类由阶段 2 审核 Agent 确认）。

## 目标

S07 交付 roadmap ⏳ 行「优先级排序 + 覆盖标记 + i18n」：设置页搜索链获得上移/下移排序
（写 `settings.update`，与启停同通路）；链块渲染组合钉死覆盖标记（settings 显式 vs 内置
默认，语义定谳见 D1）；i18n 门禁两脚本随棒交付（en/zh parity 校验 + 字典外 CJK grep，
注释豁免）。浏览器实测断言排序变更→`settings.yaml` 落盘→持久；「下次搜索生效」的热
通路由既有 node 测试守护（S05a 锚点），端到端 order 时序断言归 S08（D6 分层证据）。

## 背景

任务源 = `docs/session-roadmap.md` Session 07 ⏳ 行；骨架底座 = S06（client half 端到端：
`src/client/` 四件 + 构建契约 + 浏览器六断言，master `a9a228b`）；链语义正本 = ADR-0002
（servedBy/降级）+ ADR-0004（v1 全局优先级、内置默认序 `tavily→exa→perplexity→firecrawl→
deepseek`）；组合标量语义 = 架构 `searchProvider`（`dshws-chain`=链 / 单成员 id=钉死直连）。

阶段 0 独立审核（2026-09-02，骨架库 v2，正本将随 T0 落
`docs/sessions/audit-logs/2026-09-02-s07-stage0-review-of-s06.md`）：对 S06 **PASS**——
🔴×0；🟡 新登记 ×2（门墙数字三载体整段誊写〔session-06:97-105 对 progress-M4:49-59、
progress-M4:71 R5 证据格三处〕；STATUS 里程碑总览 M4 行漏刷 ⏳ 与位置块 🚧 不一致
〔STATUS.md:26 vs :45，dont-do 第三条同族〕），均随 T0 清偿；🟢 L-2 维持 + 观察 ×4 归属
逐条坐实（react 锚/tsdown 弃用 ×2/sourcemap/settingsScope）。测试面子集实跑 27 passed
（tests/client/）+ 门墙抽样亲见（typecheck exit 0、lint 0w0e 38 files、build 16,516B
client.js）+ 13 枚 commit 逐枚吻合 + 锚点抽验 3 处全命中（引用台账不重开成立）。

阶段 2 独立审核轮 1（2026-09-02，独立 Agent，25 组锚点亲验全命中零偏差）：**NEEDS
REVISION**（必改 ×1：M-1 T2 给 SectionSnapshot 增必填字段会使 tests/client/section.spec.tsx
makeSnapshot 字面量缺属性——client 面 typecheck 在 T2-T3 间提交态必红，恰是 S06 🟡 失败
家族；建议 ×5：R5 逐位口径消歧 / T2 默认序物化语义一句 / D5 与 T6 凭据措辞对齐 / T8 显式
引用 D6 判定尺 / T0⑤ 指针化保留「两次亲跑一致」事实行；观察：D1/D6 裁定均成立不触发
范围变更回路、--no-ff 非 PR-merge 高危、check-cjk 扫描域读法成立、注释状态机今日风险低、
pack 五件不含 scripts/）。正本将随 T0 落
`docs/sessions/audit-logs/2026-09-02-s07-stage2-plan-review.md`（两轮全文）。

阶段 2 独立审核轮 2（同 Agent 续审，7/7 修订点闭合）：**APPROVED**（残留 ×0；微注 ×2
非残留：观察清单省「阶段 0 自述交叉一致」工作流注记不影响执行面；三分类确认随 audit-log
两轮全文保全。附带核实：makeSnapshot 补字段对既有 8 行为无影响、T2 时点 section.tsx 尚
不消费新字段不破坏 typecheck、「M-1」标签为同文件活引用）。正本将随 T0 落
`docs/sessions/audit-logs/2026-09-02-s07-stage2-plan-review.md`（两轮全文）。

阶段 1 只读摸底实锚（2026-09-02 亲测，本仓 master@a9a228b）：

- 链块 UI 落点：`src/client/section.tsx:97-113`（`data-testid="dshws-chains"`，双 ol 只读
  + 超时行）；排序按钮即挂到 searchChain 列表项，fetch 链保持只读（D2）
- 排序写通路：`src/client/controller.ts:193-202`（`setEnabled` 的 update 形态 = 同款：
  `updateSettings(NS, patch, revision)` → 响应 `value`/`revision` 回填 → `#recompute`）；
  数组全量替换先例 `tests/settings.test.ts:135-136`（`{ searchChain: ['dshws-exa'] }` 热生效）
- 快照派生：`src/client/controller.ts:99-122`（`deriveSnapshot` 纯函数；覆盖标记 = 新增
  两个布尔派生字段，源 = `value.searchChain?.length > 0`——describe 只带 user-set 字段，
  在场即覆盖，controller.ts:54 注释为证）
- 内置默认序：`src/config.ts:12-18`（BUILT_IN_MEMBER_ORDER）+ client 侧镜像
  `src/client/controller.ts:48-52`
- 组合标量不可观测（D1 依据）：client half 宿主面 = settings + credentials 两 remote +
  slots/locale（`src/client/index.ts:26` inject 五面；S02 spike H3/H4 实录）；`searchProvider`
  属 cordis 组合层（架构 :70-72/:108），不经 settings 命名空间暴露
- CJK 现状：`src/` 内 locales.ts 之外 4 文件含 CJK，全部位于 JSDoc/注释
  （client/index.ts:3、config.ts:11、errors.ts:4、providers/firecrawl.ts:4）→ 门禁必须
  注释豁免（D7），字面量零命中
- 字典：`src/client/locales.ts:17-76`（15 键 flat union + zh/en 双 `Record`，编译期
  parity）；运行时 parity 冒烟 tests/client/locales.spec（S06 T3）——S07 parity 脚本是
  门禁化增量，不替代既有两层
- 无 scripts/ 目录、无 tsx 直依赖 → 门禁脚本用零依赖 `.mjs`（node 22 直跑，engines 线内）

## 范围决策（D1-D7，供阶段 2 审核判定层级）

| # | 决策 | 依据 |
|---|---|---|
| D1 | 「组合钉死覆盖标记」语义定谳 = **settings 层覆盖标记**：`searchChain`/`fetchChain` 在 settings 值中显式在场 = 已钉死（覆盖内置默认序），缺席 = 内置默认；标记为链块徽章（data 属性 + 文案双承载）。**组合标量层（`searchProvider`）不做**：client half 观测面 = settings+credentials（摸底实锚），组合标量属 cordis 组合层不可达，显示它需新宿主面 = 违零内核侵入（ADR-0001）。标记诚实口径：移回默认序仍显示已钉死（settings 显式即钉死） | roadmap WBS 措辞「组合钉死覆盖标记」；架构 :108「覆盖…钉死」语源；controller.ts:54「describe 只带 user-set 字段」；验收标准条文（roadmap S07 验收列）不含组合标量显示 |
| D2 | 排序范围 = **仅 search 链**（roadmap WBS 原样「search 链上移/下移」）；fetch 链保持只读展示 + 覆盖标记。fetch 排序列 🟢 候选显式声明（不排期，见债务映射） | roadmap S07 WBS 字面；M4 定义「排序」单数；范围纪律（不自行扩验收面） |
| D3 | S06 观察项「settingsScope/store 机制再评估」**闭合 = 维持自持控制器**（plan 006 D1）：排序交互与启停同形（一次 remote update + 本地 recompute），store 迁移零用户可见增益、纯结构churn；progress 台账该观察行随 T5 注记闭合（决策指针本 plan D3） | S06 交付物实录：控制器模式已承载 3 类写动作（key/启停/清除）零摩擦；观察项原始归属 plan 006 D1 |
| D4 | 排序边界语义：首项上移/末项下移按钮 disabled；未知 id 照显照排（raw id 渲染，按钮同规则）；**不按 `writable` 门控**（沿 S06 先例——启停/key 均不门控，失败经统一 failed 反馈显形）；无「恢复默认」按钮（需 patch 删除语义，roadmap 未要求，🟢 候选声明） | S06 先例对称；`snapshot.writable` 现状未被 UI 消费（section.tsx 全文无 writable 分支）；范围纪律 |
| D5 | 浏览器实测 = **agent 实测棒**（S06 D5 同款授权链 + 已验证配方）：scratch `DSH_HOME=/tmp/dshws-s07/home` + `web` 模板 + 端口 **3413** + 启动 cwd=deepseek-harness 仓根 + **boot 带 `--no-open`**；点击一律走 **evaluate 合成 MouseEvent dispatch**（IAB locator click 挂起在档，session-06 踩坑节）；凭据面**本棒预期零接触**（排序/标记不涉 credentials——若任何断言意外触凭据则只写 fake 并 unset 复原，见 T6）；3080 实例、`~/.dsh`、`/tmp/dshws-s05b/`、`/tmp/dshws-s06/` 零接触 | session-05b.md:89-92 授权预告 + session-06 T8 实录配方；user-paces 惯例（真实 key 实测归用户槽位不变） |
| D6 | 「下次搜索生效」证据分层：①GUI→settings.yaml 落盘 = 本棒浏览器断言（新面）；②patch 载荷形态 = jsdom 断言（`{ searchChain: [新序] }` 全量数组）；③热链序 = node 既有测试守护（settings.test.ts:124-140 LiveResolvedConfig 热更新链 + S05a 已验锚点「settings 热改链序实测下次搜索生效」）+ 本棒门墙回归零破坏；④端到端 order 时序断言 = S08 loopback（roadmap S08 行原样「顺序保持」）。非缩水：④从未在本棒验收列（roadmap S07 验收 = 落盘+两 i18n 项） | roadmap S07/S08 两行验收列字面；settings.ts 模块注释「chains read order through getters at call time」 |
| D7 | i18n 门禁 = 两脚本随棒交付 + `check:i18n` 入 package.json + 门墙：①`scripts/check-locales.mjs`——文本级解析 locales.ts，断言 DshWsLocaleKey union、en、zh 三集合相等；②`scripts/check-cjk.mjs`——扫描 `src/**/*.{ts,tsx}`（locales.ts 除外）**注释豁免**（状态机剥注释后 grep CJK 码位），字面量零命中。**拒绝路径必须证明**：临时注入坏例（zh 独有键 / CJK 字面量）→ 脚本非零退出（验证后还原，不入库）；注释豁免反证（CJK 仅在注释 → 通过）。不引入新依赖 | roadmap S07 验收「parity 校验绿；字典外文案检查脚本零命中（CJK 字面量 grep，脚本随本 session 交付）」；摸底实锚（注释 CJK 合法存在）；仓库规则「prove each changed acceptance path rejects an invalid case」 |

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 类别 | 前置 |
|---|---|---|---|---|
| T0 | 治理批（master 直提）：①本 plan 落盘 ②阶段 0 audit-log 转录落盘 ③STATUS 启动刷新（台账 S07 🚧 行 + 位置块刷新）④**🟡-2 清偿**：STATUS 总览 M4 行 ⏳→🚧 ⑤**🟡-1 清偿**：session-06 门墙节（:97-105）改指针引用（**保留「T7/T9 两次亲跑一致」事实主张行**，只指针化数字清单）+ progress-M4 R5 证据格瘦身（数字正本 = progress-M4 门墙节）⑥dont-do 第三条扩化：状态区刷新完整性家族收编 STATUS 总览行（progress 四处 + STATUS 总览行/位置块） | `git status` 前置 + 一 commit；STATUS 三处自洽（总览/台账/位置块）；session-06 无门墙数字整段誊写残留；dont-do 条目仍含三要素 | 治理（机械豁免候选，分类由阶段 2 确认） | 阶段 2.5 批准 |
| T1 | locales 扩键：`moveUp`/`moveDown`（排序 aria 组合用）、`chainDefault`（内置默认序）、`chainPinned`（已钉死覆盖）zh/en 双语；locales.spec 扩断言（新键双语在场 + parity 既有断言不变） | 先红（新键断言缺模块导出/键缺失）→ 绿；编译期 parity 自然强制四键同落 | TDD | T0 |
| T2 | controller 排序 + 标记派生：`moveSearchChainEntry(id, delta)`（indexOf→新数组→update 全量→回填 recompute；**默认序上移动 = 把生效序物化为显式数组写入 settings——徽章翻 pinned 的机制本身**）；`SectionSnapshot` 增 `searchChainPinned`/`fetchChainPinned`（deriveSnapshot 派生）；controller.spec 扩行为（移动首/末边界、未知 id、update 失败→ok:false、标记两态、patch 载荷形态 D6②）；**机械配套：`tests/client/section.spec.tsx` makeSnapshot 补两新字段（保 client typecheck 全程绿——M-1 必改，行为断言仍归 T3）** | 先红 → 绿；红证据内嵌 commit message；一 commit；T2 提交态 typecheck exit 0 | TDD | T1 |
| T3 | section 排序 UI + 覆盖标记：searchChain 列表项加上/下移按钮（aria-label = `${id} ${t('moveUp'/'moveDown')}`，首/末 disabled，`data-testid="dshws-search-chain"` + 项级 testid）；标记徽章（data-dshws-chain-state="default\|pinned" + 文案 `t('chainDefault'/'chainPinned')`，双链各一）；section.spec 扩行为（按钮呈现/边界禁用/点击回调载荷/标记两态/fetch 链无按钮） | 先红 → 绿；lint 0w0e 含新面 | TDD | T2 |
| T4 | i18n 门禁两脚本（D7 全文）+ package.json `check:i18n` + 拒绝路径双验证（坏例红/注释豁免绿，临时态不入库）+ scripts/README 或脚本头 JSDoc（运行口径 + 范围） | node 直跑 exit 0；坏例注入 exit 非 0 实录留痕（commit message）；不引入依赖 | 脚本（验证手段实证，不强制先红） | T3（扫描对象含新 UI 面） |
| T5 | 门墙 + 台账：全量亲跑 `pnpm test`/`typecheck`/`lint`/`build`/`npm pack --dry-run`/`check:i18n`（提交态——`git status` 前置，S06 🟡 教训动作化）；progress-M4 台账（任务表 + 门墙数字 + D3 观察闭合注记）；Agent Note（docs/notes/2026-09-02-s07-priority-i18n.md：排序通路/标记语义/门禁脚本实录） | 门墙数字亲见落台账；基线 190 → 新基线（+本棒新增，零破坏）；note 与 S06 note 同构 | 门墙+文档 | T4 |
| T6 | 浏览器实测棒（D5 配方）：新 tarball 安装 scratch（deps file:/bundles/dump 三处 + 接线两行同 S06）→ boot 3413 → DOM 断言六项：①排序 UI 呈现 + 双链标记初始态（search=默认/fetch=默认，settings 无显式链）②上移末项/下移首项 → 列表序翻转 + 标记翻 pinned + **settings.yaml 实物落盘新数组** ③reload → 序与标记持久（describe 回读）④首项 up/末项 down disabled 实测 ⑤fetch 链无按钮且标记独立 ⑥kill 零残留 + 两态 settings.yaml dump 留痕（/tmp/dshws-s07/） | 六断言全过逐项留痕（证据 commit message + 实物）；fake 凭据零写入本棒可不动凭据面（排序不涉 credentials）——若触则 unset 复原 | agent 实测棒（D5 授权链） | T5 |
| T7 | 阶段 4/5 独立验证（独立 Agent）：R1-R6 逐条对峙 + 门墙亲跑（提交态）+ 隔离法证（s05b/s06 现场与 ~/.dsh mtime 零接触）+ 冒烟 + 三问交叉验证 | PASS / COMPLETE；audit-log 正本落盘 | 强制独立 | T6 |
| T8 | 收尾：session 记录（含前序审核节 + 启动指令节 + 规范强化节）+ STATUS/roadmap ✅ 原子收官（含 M4 里程碑行判定——**按 D6 分层标准判定**，与阶段 4/5 同一把尺）+ CHANGELOG + progress 状态区四处 + `--no-ff` 合入 master + 接力指令输出 | 6 件套齐；M4 判定按 D6 复合证据链（配 key/启停 = S06 浏览器证据；排序 = 本棒浏览器证据；热生效 = S05a/S06 node 证据链）——证据不足则 M4 保持 🚧 不预写 ✅ | 收尾 | T7 |

## 验收条目（R1-R6，progress-M4 阶段验收逐条对应）

| # | 条目 | 对应 roadmap 验收 |
|---|---|---|
| R1 | 搜索链排序可重放：jsdom 行为断言（移动/边界/失败/载荷）+ 浏览器实测（UI 翻转 + settings.yaml 实物落盘 + reload 持久 + 边界禁用） | 「排序变更→settings.yaml 实测落盘→下次搜索生效」（生效证据 = D6 分层：本棒①②+既有③④） |
| R2 | 覆盖标记可重放：派生字段两态 + 徽章渲染（data 属性 + 文案）+ 浏览器初始默认→pinned 翻转 | WBS「组合钉死覆盖标记」（语义 = D1 定谳） |
| R3 | parity 校验脚本绿 + 拒绝路径红实录（临时 zh 独有键 → 非零退出） | 「en/zh 字典 parity 校验绿」 |
| R4 | CJK 门禁零命中 + 拒绝路径红实录（CJK 字面量注入 → 非零退出）+ 注释豁免反证（现有 4 文件 JSDoc CJK 不误报） | 「字典外文案检查脚本零命中（CJK 字面量 grep，脚本随本 session 交付）」 |
| R5 | 回归零破坏 + 门墙亲跑（提交态）：test 全量（基线 + 新增零破坏）/typecheck 双面 exit 0/lint 0w0e/build 三件（**node 面 index.js/index.d.ts 本棒零变更应逐字节零漂移；client.js 因新 UI 记录新值**）/pack 五件/check:i18n 绿 | 门墙纪律（S06 T7/T9 口径延续） |
| R6 | 五子证据：隔离（scratch 清单 + mtime 法证）/门墙/收尾件套/原子翻转（--no-ff）/audit-log 三份正本（stage0/stage2/stage45） | 收官序列惯例 |

## 验证矩阵

| 验证 | 时点 | 责任 | 证据落点 |
|---|---|---|---|
| locales/controller/section 新行为红→绿 | T1/T2/T3 各自执行时 | 主 Agent | commit message 红证据 |
| 拒绝路径双验证（parity 坏例红 / CJK 字面量红 / 注释豁免绿） | T4 | 主 Agent | commit message 实录 |
| 门墙七命令（含 check:i18n） | T5（提交态）+ T7 复验 | 主 Agent → 独立 Agent | progress-M4 门墙节 |
| 浏览器六断言 | T6 | 主 Agent（D5 授权链） | 证据 commit + /tmp/dshws-s07/ 实物转录 |
| R1-R6 对峙 + 隔离法证 + 三问 | T7 | 独立 Agent | audit-logs/…-s07-stage45-verification.md |
| STATUS/roadmap/progress/CHANGELOG 原子收官 | T8 | 主 Agent | 四件同序列 diff |

## 高危命令预告（阶段 2.5 披露，对照 governance §3.4.7 清单）

1. `/tmp/dshws-s07/` scratch 目录自建（仓库外写入——自建隔离目录，s05b/s06 现场零接触）
2. 端口 3413 实例启停（boot 带 `--no-open`；kill 精确端口；3080 零接触）
3. scratch profile 内 `pnpm install`（deps file: tarball）
4. 浏览器自动化（DOM 断言；本棒排序不涉凭据面——若任何断言触凭据则只写 fake 并 unset 复原）
5. `npm pack`（本仓内产物，非 publish）
6. 不涉及：push/publish/PR merge、大范围删除、`git reset --hard`/`git clean`、凭据读写（真实）、
   系统配置修改、依赖删除或大版本变更、治理产物删除。**T0 对 session-06 记录与 dont-do 的
   编辑属治理产物修订（🟡 清偿机制内动作，非删除）——显式披露**。

## 债务归属映射（正本）

| 债务 | 等级 | 归属 |
|---|---|---|
| 🟡-1 门墙数字三载体誊写（阶段 0 新登记） | 🟡 | **T0 清偿**（session-06 门墙节 + progress-M4 R5 证据格改指针） |
| 🟡-2 STATUS 总览 M4 行漏刷（阶段 0 新登记） | 🟡 | **T0 清偿**（⏳→🚧；S07 收官时该行随原子序列 ✅） |
| L-2 per-profile GUI 覆盖二期候选 | 🟢 | 维持不排期（S01 起；plan 006 同款声明） |
| fetch 链排序 UI（D2 范围外） | 🟢 | 新登记：候选不排期；roadmap 未列，用户反馈驱动 |
| 「恢复默认序」按钮（D4 范围外） | 🟢 | 新登记：候选不排期；需 patch 删除语义先行定谳 |
| settingsScope/store 观察项 | 🟢 观察→**闭合** | T5 注记闭合（D3 决策指针） |
| react 锚 ^18.3.1 / tsdown 弃用 ×2 / vitest sourcemap | 🟢 观察 | 维持（S09 升级演练顺手项；本棒零依赖新增不动该面） |

## 风险

- **文本级 parity 解析脆弱性**：check-locales.mjs 依赖 locales.ts 稳定格式（union + 两个
  对象字面量）——格式受控于本仓（唯一字典文件），格式漂移时脚本 fail-loud（解析不到集合
  即非零退出），不会静默绿。
- **注释剥离状态机的边界**（模板字符串内 `//` 等）：扫描对象为本仓受控风格代码；状态机对
  引号/转义/模板串做处理，误报/漏报由 T4 双向验证（字面量红 + 注释绿）兜住。
- **组合标量层不可观测的期望差**：D1 已显式定谳范围（settings 层标记）；若阶段 2 审核判定
  验收面含组合标量显示，则触发范围变更回路（回 2.5 重审）——不在执行期自行扩。
- **M4 收官判定**：T8 按 roadmap M4 定义对照四环节证据链（S06 key/启停 + 本棒排序 + 热生效
  S05a/S06 链证据）；若审核判定证据不足则 M4 保持 🚧，不预写 ✅。
