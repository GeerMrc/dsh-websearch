# Plan — 2026-09-04-012a-s12a-settings-redesign-plan

> plan 是验收契约：R 验收条目是 progress 台账阶段验收的对照正本。本棒 = 用户二轮 UI/UX
> 反馈（2026-09-04 视频+截图四点批评）触发的**设置页布局系统性重构**：对齐宿主 Models/
> Plugins 设置页的布局惯例（深度摸底实锚见背景节）。roadmap 插行 **12a**（小数插行，下游
> S13-S16 不动）。全部 client half，node 侧零变更。

## 目标

照宿主自家设置页（Models 凭据编辑卡 / Plugins 卡）的布局结构与信息层级，重排
dsh-websearch 设置面板，消除用户指出的四点失调：

①ⓘ 图标从输入行旁移除——字段说明改为**控件下方 hint 行**（宿主惯例层级，无 label 旁
图标先例）；②hint 文案改**格式化表述** `{APIKEY1,APIKEY2,...}`（替代凑数示例文案）；
③**输入框独占整行**（width:100%），Save/Clear 移入独立 footer 行（右对齐胶囊）；
④底部链区块收敛——未配置态**整块隐藏**，调用逻辑说明上移**页头 intro**，已配置态
紧凑链卡（12px 标题 + hint + 图标钮行 + max-height 滚动），fetchChain 只读区块移除。

## 背景

**任务源**：用户 2026-09-04 二轮反馈（视频 iShot_2026-09-04_12.06.18.mp4 + 截图四点
批评：ⓘ 位置错/提示文案差/输入行比例失衡/底部链区块似说明占半屏）；用户点名要求
「深度全面了解整体 DSH 前端 UI/UX 布局结构/交互逻辑，系统性全面重构优化」。

**宿主布局惯例深度摸底**（2026-09-04 只读 Explore Agent，very thorough，六维实锚；
根 `packages/client/`）：

- **说明层级**：宿主设置页**无 label 旁 ⓘ tooltip 惯例**——控件解释=控件下方 `p.hint`
  （12px tertiary，fields.tsx:90-92/116）；区块级说明=页头 `h2.title + p.intro`
  （三页一致：ModelsSection.tsx:309-310 等）；低频高级内容=`<details>` 折叠
  （ProviderEditor.tsx:380-473）。
- **凭据输入行**（Models ProviderEditor，最同构先例）：field 纵向组（label 上/输入下
  gap 6）+ 输入框 `width:100%; height:32px; r8; bg-layer-1`（ModelsSection.module.css
  :545-557）**占满卡宽**；Save/Cancel 在**独立 footer 行**（`justify-content:flex-end`
  gap 8，EditorFooter：Cancel outline 左、Apply primary 右，胶囊 r18 高 36；dense
  变体 r14 高 28 pad 0 10）；错误/反馈为独立 12px 行。
- **成员行卡**（Models rowCard）：头行 = 名称(14px/500)→badge→状态点(8px 圆点)+
  `margin-left:auto` 动作（:353-418 css :55-62）；卡 = border 1px l2 + r12 + padding
  12 14 + column gap 12；列表 gap 8。
- **开关惯例**（SubagentModelSelectionCard）：36×20 track + 16px thumb 圆点
  translateX + 120ms 过渡（:22-60）+ 开关下 hint 随状态换文案。
- **弹窗滚动**：section 内容自然流，滚动容器是宿主 `.options`（SettingsRoot.module.css
  :219-225），section 勿自设 max-height；dialog 内长列表才自设（≤320px 惯例：
  SubagentModelSelectionCard .models max-height:280 overflow auto）。
- **常数表**（三页通用，全部 --dsw-alias-* 颜色 token + 自定间距常数）：section 列 max-width 720（Models/Presets；Plugins 760）gap 12；标题 16px/500；intro 14px/22 tertiary；卡 l2/r12/12-14；字段 gap 6；hint/错误 12px/18；badge 11px；dense 按钮 28px；禁用 opacity .4。
- **排序先例**：宿主设置页无可排序列表先例；最接近的多选列表 = grid 行
  `auto minmax(0,1fr) auto` + max-height 280 盒（SubagentModelSelectionCard :73-137 css
  :103-113）；**28×28 aria-label 图标钮先例在 Models 页**（.iconButton
  ModelsSection.module.css:467-476 + ModelListEditor.tsx:362-373）。
- **CSS module**：宿主全 css module + token，无内联布局；共享 preset
  （packages/client/tsdown.client.ts）经 lightningcss 虚拟模块在 factory 执行时注入
  style——但 preset 为工作区相对导入（`'../tsdown.client.ts'`），独立仓不可直接复用。

**技术取舍（D7）**：本棒保留内联 style 但**数值全量对齐上述常数表**（观感对齐 100%
由数值与结构达成）；CSS module 化 = 🟢 债务登记（需复制 preset 的 lightningcss 注入链
+ 新增 devDep + 构建链改造，单文件 bundle 约束下另棒评估）。

**S12 状态快照**：S12 收官于同日（master 6f50322）；T8 阶段 4/5 独立验证 PASS/COMPLETE
在档（audit-log …-s12-stage45-verification.md，含全量门墙亲跑 + R1-R7 对峙 + 三问 +
冒烟，时点=本棒启动前 1 小时内、代码态同 master HEAD）。

**阶段 0（标准流程·增量采信制·独立 Agent）**：本棒自 6f50322 切出后无产品代码变更
（fail-closed 口径核验）→ 走 audit-gate「无变更分支」：独立 Agent 采信 S12 基线链
（T8 全量复验正本）+ 抽样冒烟（client 测试子集）+ git 状态核 + 流程合规抽查——审核
Agent 独立 spawn（轮 1 计划审核 B1 修正：不得由主 Agent 自核代行）。用户二轮反馈 =
新任务源（非前序技术债），四点批评定级：①③④位于用户验收路径 = 🟡（本棒主体修复），
②文案表述 = 🟡（随①）；无 🔴。结论与原文落
docs/sessions/audit-logs/2026-09-04-s12a-stage0-review-of-s12.md。

## 范围决策（D1-D9，供阶段 2 审核判定层级）

| # | 决策 | 依据 |
|---|---|---|
| D1 | **成员卡结构重排**（照 rowCard+SecretField 惯例）：头行 = 品牌名(14px/500) + **自绘状态点 span**（8×8 圆点，`role="img"` + aria-label + title 三件套——照 ModelsSection credentialDot 先例 :371-380；弃 StateDot 原语〔aria-hidden by contract 无法承载语义〕；绿=state-success-primary 已配置 / 橙=state-warn-label 未配置；configured/notConfigured 两键均保留作 aria-label/title 文案）+ flex:1 + switch 右侧（**36×20 + 16px thumb span**（内联方案用真实子元素+transform，非伪元素），替 34×20 裸 track）；凭据行 = `input type=password width:100% height:32 r8 bg-layer-1` **独占整行**（无按钮无图标）；hint 行 = 12px tertiary 控件下方；footer 行 = `justify-content:flex-end gap:8`：Clear(outline dense 胶囊 28px)+Save(primary dense 胶囊 28px)；feedback（saved 绿/cleared 绿/failed 红，12px role=status）置 footer 左侧 flex:1（PluginCard failed 先例） | 用户③；摸底 Q1/Q2；S11 置灰语义（disabled+opacity .4）保持 |
| D2 | **hint 文案格式化**（用户表述）：en `Multiple keys: {APIKEY1,APIKEY2,...} (max 10)`；zh `多把 key：{APIKEY1,APIKEY2,...}（最多 10 把）`——改写 `keyFieldNote` 键、**删除 `keyFieldNoteExample` 键**（22→21 键）；`notConfigured`/`configured` 两键保留（头行状态点 aria-label/title 文案，见 D1） | 用户②；宿主 hint 短句惯例 |
| D3 | **ⓘ/Tooltip 全撤**：keyFieldNote tooltip、chainDefault ⓘ tooltip、IconQuestionOutline14 导入全删；链默认序说明改链卡 hint 行（D4）+ 页头 intro（D5）——grep 零残留（src/ tests/ 活引用面） | 用户①④；摸底 Q3（宿主无 label 旁图标惯例） |
| D4 | **链区块收敛**：未配置态（零成员 configured）**链区块整块隐藏**；已配置态 = 紧凑链卡：标题「Search chain」12px/500 secondary + pinned badge（保留 data-dshws-chain-state 契约）+ hint 行（默认序说明一句 + MEMBERS 派生顺序串）+ 紧凑行列表（grid `auto minmax(0,1fr) auto auto`：序号 + 品牌名 + ↑↓ 28×28 图标钮〔aria-label 品牌名口径、id 载荷不变〕）+ `max-height:280 overflow-y:auto`；timeout 并入链卡底部 hint 行；**链移动失败反馈（dshws-chain-feedback 契约保留）置链卡底部 12px 行（红 state-error-primary）**；**fetchChain 只读区块移除**（信息价值并入页头 intro——**功能收缩披露点，用户终审裁定**；fetch 排序 UI 本为 🟢 维持项） | 用户④；摸底 Q6/SubagentModelSelectionCard 先例 |
| D5 | **页头重写**：h2 `Web Search`(16px/500) + p.intro(14px/22 tertiary) 两句——管理说明 + 链调用逻辑（「已配置成员按链序依次尝试，失败自动降级到下一个；钉死的顺序覆盖默认序」）；ⓘ 不复现（intro 即说明） | 用户④；摸底 Q3-d |
| D6 | **样式常数全量对齐**（摸底表）：section 列 max-width 720 gap 12；卡 l2/r12/padding 12 14/column gap 12；列表 gap 8；输入 32/r8/bg-layer-1；hint 12/18 tertiary；feedback 12px；dense 胶囊 28/r14/pad 0 10；禁用 opacity .4；全部 `--dsw-alias-*` token（bg-layer-1/label-secondary/tertiary/state-error-primary 等）；内联 style 保留（D7） | 摸底 Q5 |
| D7 | **CSS module 化 = 🟢 债务登记**（不执行）：preset 工作区相对导入不可复用，复制注入链+devDep+构建改造另棒评估；本棒内联 style 数值对齐（D6） | 技术取舍（背景节） |
| D8 | **测试面改写**：section.spec 结构断言重写（jsdom 无样式——断言 DOM 层级：头行/输入行独占/hint 行/footer 结构/hint 格式化文案/链区块条件渲染〔未配置隐藏/已配置显示〕/链行 grid 结构）；tooltip 断言删；浏览器棒改**computed style 断言**（卡 padding/输入高 32/hint 12px/按钮 28px——布局对齐的实测证据）+ 截图；locales.spec 21 键 parity | D1-D6 波及 |
| D9 | roadmap 插行 **12a**（M7 段 S12 行后：「设置页布局系统性重构（用户二轮反馈）」⏳）；S13-S16 不动 | roadmap 头部规则（小数插行） |

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 类别 | 前置 |
|---|---|---|---|---|
| T0 | 治理批（分支首提交）：本 plan 落盘 + 阶段 0/2 audit-log + **session-12a 记录骨架创建**（10 节骨架含已定节，T6 只补全——dont-do 收官工件缺失条的纠正措施①）+ roadmap 12a 插行 + **启动原子序列全状态区**：STATUS 台账 12a 行 🚧 + 位置块 + M7 总览行；progress-M7 里程碑行括注/「进行中」/「待启动」三处——防漏刷家族第五次 | git clean 前置；roadmap 12a 行在 S12 后 S13 前；骨架文件存在且两新节占位 | 治理（机械豁免候选） | 2.5 批准 |
| T1 | 成员卡重构（D1+D2+D6 卡内部分）：头行（名+点+title+thumb 开关）/输入行独占/hint 行（格式化文案）/footer（Clear+Save+feedback）——section.tsx + locales（21 键） | 先红（section.spec 结构断言重写——**DOM 层级/子序断言**：头行含名称与状态点与开关、输入行父容器内无按钮兄弟元素、hint 行文本含 `{APIKEY1,APIKEY2,...}`、footer 含 Clear/Save/feedback 三元素、thumb span 存在；locales.spec 旧 keyFieldNote 逐字断言同步改写〔S5〕）→ 绿；typecheck 双面；i18n 21 keys | TDD | T0 |
| T2 | 链区块收敛（D3+D4）：未配置隐藏/紧凑链卡（标题+badge+hint〔默认序说明+顺序串〕+grid 行+28px 图标钮+280 滚动）/timeout hint 化/fetchChain 区块删除/页头 intro 重写（D5） | 先红（链区块条件渲染断言：未配置 null/已配置紧凑结构/hint 含顺序串/fetchChain 区块不存在/intro 含链逻辑句）→ 绿；grep IconQuestionOutline14/Tooltip 零残留——**范围 src/ tests/ 活引用面**（治理载体历史时点快照豁免） | TDD | T1 |
| T3 | 门墙七命令（提交态）+ progress-M7 12a 批次表/门墙表 + Agent Note（docs/notes/2026-09-04-s12a-settings-redesign.md：宿主布局惯例表/内联取舍/常数对齐） | 门墙数字亲见；基线 248\|9(257) → 新基线（断言改写净变化披露）；i18n 21 keys | 门墙+文档 | T2 |
| T4 | 浏览器实测棒（scratch 3419——**起前 lsof 查占**，3417/3418 均不可用）：computed style 断言（卡 padding 12/14、输入框高 32、hint 12px、按钮高 28、thumb transform 两态）+ 未配置态整页高度对比（链区块隐藏证据）+ 已配置态紧凑链卡 + 截图 ×2（未配置/已配置） | 断言全过留痕（/tmp/dshws-s12a/）；fake 值复原 refs:{}；隔离纪律（3416/3080/61518 零接触） | agent 实测棒 | T3 |
| T5 | 阶段 4/5 独立验证 | PASS / COMPLETE | 强制独立 | T4 |
| T6 | 收尾：session-12a 记录 + STATUS/roadmap/CHANGELOG 原子收官 + merge `--no-ff` + 接力指令 | 6 件套齐；session 记录随 T0 建骨架（S12 教训兑现） | 收尾 | T5 |

## 验收条目（R1-R7）

| # | 条目 | 对应反馈 |
|---|---|---|
| R1 | 成员卡结构：头行（名+自绘状态点 role=img+title+右开关 36×20 thumb）/输入框独占整行（width 100% 无同行元素）/hint 行/footer 右对齐（Clear outline+Save primary dense 28px）+feedback 左侧 role=status | 反馈③① |
| R2 | hint 文案 = `{APIKEY1,APIKEY2,...}` 格式化表述 + 上限；keyFieldNoteExample 删除（21 keys parity）；ⓘ/Tooltip/IconQuestionOutline14 于 src/ tests/ 活引用面零残留 | 反馈②① |
| R3 | 链区块：未配置态不存在（DOM 零链区块）；已配置态紧凑卡（12px 标题+badge 契约保持+hint 含 MEMBERS 顺序串+grid 行+28px 图标钮+280 max-height）；fetchChain 区块删除；timeout hint 化 | 反馈④ |
| R4 | 页头 intro 含链调用逻辑说明（降级语义一句） | 反馈④ |
| R5 | 布局对齐实测：浏览器 computed style 断言（D6 常数表五项以上）+ 未配置态面板高度显著收缩 + 截图 ×2 | 反馈③④ |
| R6 | a11y 保持并修正：状态点 role="img"+aria-label+title 三件套（两状态文案齐，读屏可闻——S12 的 StateDot aria-hidden 缺口顺带闭合）；switch role/aria-checked/aria-label；move 按钮 aria-label 品牌名口径；role=status | 回归保护+B4 |
| R7 | 门墙七命令（提交态）+ 增量披露 + 前后 git clean | 门墙纪律 |

## 验证矩阵

| 验证面 | 触发时机 | 责任 | 采信规则 |
|---|---|---|---|
| jsdom 结构断言红绿 | T1/T2 各 1 次 | 主 Agent | commit message + 记录 pre-fix 红证据 |
| 门墙七命令 | T3 + T5 复验（全量唯一责任点） | 主 → 独立 | progress-M7 门墙表 |
| computed style 浏览器断言 + 截图 | T4 | 主 Agent | /tmp/dshws-s12a/ + 记录 |
| R1-R7 对峙 + 三问 + 冒烟 | T5 | 独立 Agent | audit-log …-s12a-stage45 |
| 原子收官 | T6 | 主 Agent | 四件 diff |

## 高危命令预告

①/tmp/dshws-s12a scratch 自建 ②端口 3419 启停（--no-open；LISTEN 过滤 kill；3416/3080/
61518 零接触；**起前 lsof 查占**）③scratch pnpm install ④浏览器自动化（fake 值 unset
复原）⑤npm pack --dry-run。不涉及 push/publish/删除/凭据真实值/依赖变更/治理产物删除。

## 债务归属映射（正本）

| 债务 | 等级 | 归属 |
|---|---|---|
| 用户二轮反馈四点（ⓘ 位置/文案/比例/链区块） | 🟡 | **本棒主体**（T1/T2） |
| fetchChain 只读展示移除 | 功能收缩 | 本棒 T2（2.5 披露点；信息并入页头 intro） |
| CSS module 化（preset 注入链复制+devDep+构建改造） | 🟢 新登记 | 另棒评估（D7；单文件 bundle 约束） |
| 内联 style 无伪元素/hover 微交互（thumb 用真实 span 替代；图标钮 hover 态放弃） | 🟢 注记 | 随 CSS module 化一并解 |
| 滚动重叠帧（用户视频 9s/27s） | 🟢 观察 | 疑似录屏合成模糊（后续帧正常）；T4 浏览器棒滚动实测复核，若复现另立 |
| L-2 / fetch 排序 UI / 恢复默认按钮 / anysearch fetch 面 / 多 key 策略控件（S13） | 🟢 | 维持 |
| v2 backlog：余额看板 + fetch 兜底开关 | 🟢 v2 | S14 调研 |

## 与用户字面表述的替换点（2.5 显式裁定项）

- 用户①「? 移到 Tavily Not configured 标题行后」→ plan D3 = **ⓘ/Tooltip 全撤、说明改
  控件下 hint 行**（宿主无 label 旁图标惯例的实锚裁定；状态语义由头行自绘状态点的
  aria-label/title 承载）
- 用户④「页头悬停图标提示调用顺序」→ plan D5 = **静态页头 intro 两句话**（无图标；
  长顺序串在已配置态链卡 hint 行）
- 记录命名 `session-12a`（治理 §3.3「NN 递增」严格读法外的插行棒命名决定，披露一次）

## 风险

- **jsdom 无样式**：布局对齐的验收证据依赖 T4 computed style（浏览器面）；jsdom 面只保
  结构断言——两层证据缺一不可，T4 不得跳过
- **thumb span 与既有 switch 断言**：现有 spec 以 role=switch 定位 button——加 thumb 子
  span 不影响 role；disable/色矩阵断言（S12 R2）保持通过
- **链区块隐藏逻辑的状态源**：`configuredCount === 0` 判定（snapshot.members 派生）——
  与链行过滤同源，无新增数据面
- **browser-use 实测环境**：3418 token 已轮换失效（实例已停）——新实例新 token；iab tab
  复用前 tabs.list 核对
- **提交态红线**：验证与 commit 分两条命令跑（S12 第四次教训）；每文件改完立即跑该文件
  测试
