# Plan — 2026-09-04-012-s12-uiux-alignment-plan

> plan 是验收契约：R 验收条目是 progress 台账阶段验收的对照正本。本棒 = 用户 UI/UX 反馈
> 四项对齐（2026-09-04 确认，纯 client half GUI）+ 阶段 0 BLOCKED 治理修复批（🔴×2 先债后新）。
> 核心原则：四项全部复用宿主既有原语（Tooltip/图标/令牌），零自绘组件；S11 遗留证据腿
> （断言/探针/浏览器棒）吸收进本棒 WBS，交付时一并清偿。

## 目标

S12 交付用户验收反馈四项 UI/UX 对齐（全部 client half，node 侧零变更预期）：

①多 key 提示改 **info 图标 + hover 说明**（keyFieldNote 内联小字 → 图标 + Tooltip，
含格式示例）；②开关颜色**跟随配置态**（未配灰 / 已配开=绿，替代当前「跟 enabled 态」
导致的未配置成员绿+半透明误导）；③搜索/抓取链列表**收敛展示**：已配置成员行渲染
**品牌名**（替代原始 id）+ 修复 ↑↓ 禁用边界与过滤列表错位；④**默认序含义 hover 说明**
（chainDefault 徽标旁 info 图标，顺序文案从 MEMBERS 动态派生）。

另承接阶段 0 独立审核（结论 **BLOCKED**，正本
`docs/sessions/audit-logs/2026-09-04-s12-stage0-review-of-s11.md`）移交的治理修复批：
🔴1 S11 session 记录缺失 + STATUS 悬空指针；🔴2 S11 阶段 4/5 BLOCKED→PASS 翻转无留痕
且与在盘正本矛盾；🟡×9（断言空转×2 / 牙齿探针未兑现 / 浏览器棒未入台账 / 状态区漏刷
家族第七次 / roadmap 未更新同号异义 / CHANGELOG 缺 S11 条目 / audit-log 参数头回退）。

## 背景

**任务源**：2026-09-04 用户 UI/UX 反馈四项（接力指令在档）；棒次编排按用户 2026-09-04
重排：S12 本棒 → S13 策略棒（ADR-0012）→ S14 fetch 调研+溯源 → S15 手册 → S16 上游验收
准备。roadmap 现状未同步（阶段 0 🟡7），T0 执行重排（D7）。

**阶段 0 独立审核**（2026-09-04，独立 Agent，原文正本见 audit-log，此处不重抄）：
产品代码面真实全绿（亲跑子集 188 passed / typecheck / lint / i18n / build / pack 全过；
单槽实现与 node 侧覆盖扎实）；**BLOCKED 点全在收官证据链**（🔴1/🔴2，修复认领见 D5/D6）。
🟡×9 逐项认领见 WBS/债务映射；🟢×5 中 ①fixture 5 成员陈旧→T3 顺手、②2.5 批准引文→随
🔴1 修复、③⑤无动作、④转录教训已记。dont-do 复发：🟡5 命中收官序列条目第七次；
🔴1/🔴2/🟡7/🟡8 为新失效形态（收官声称完成而核心工件缺失/验收以披露替代交付）——
RCA 候选随 T0 沉淀 dont-do 候选条目（第六节「踩坑沉淀」随 session 记录）。

**宿主 UI/UX 惯例摸底**（2026-09-04 只读 Explore Agent，S12 前置任务，file:line 实锚）：

- Tooltip 原语在档：`@deepseek-ai/dsh-client-ui-primitives` 导出 `Tooltip`
  （宿主 ui-primitives/src/Tooltip.tsx:34；props `{ label: string | (() => string), side, delayMs, disabled, maxWidth, children }`，
  hover+focus 双触发，`role="tooltip"` 气泡）。设置页内真实用例 = ui-agent-preset
  AgentPresetSection.tsx:165（`side="bottom" delayMs={400} maxWidth={360}`）——本棒照抄该参数形态。
- 无 InfoIcon；宿主唯一 info 类图标 = `IconQuestionOutline14`（ui-primitives icons/index.tsx:890，
  宿主 ask-question-row.tsx:186 用例）——**取舍披露**：用户原话「ℹ️ hover 图标」，实现采用
  宿主问号图标（零自绘 SVG、宿主先例），语义等同（说明性 hover 提示）。
- 开关惯例 = 自绘 `role="switch"` 按钮（宿主无共享 Switch；SubagentModelSelectionCard.tsx:76-87
  为最完整先例；本插件现有结构同构，**仅改颜色映射不动结构**）。配置态语义绿 =
  `--dsw-alias-state-success-primary`（与宿主 Models 页 credentialDotConfigured
  ModelsSection.module.css:103 及 StateDot done 同 token，语义一致）；off 灰 =
  `--dsw-alias-border-l2`（现状沿用）。
- 保存反馈惯例 = inline `role="status"` 文案（ModelsSection.tsx:315 savedNotice）；Toast 为
  对话流专用，**不引入**。
- 令牌/外部机制：`ui-primitives` 整包已在 package.json `dsh.client.external`——新增包内
  组件导入（Tooltip/IconQuestionOutline14）无需改 manifest 与构建配置（devDeps 钉
  0.1.2-alpha.4，两组件均已存在于该版本，摸底亲证）。

**client 现状实锚**（2026-09-04 亲读 master@921e31b）：

- ①keyFieldNote 内联小字渲染 section.tsx:240；文案键 locales.ts:37/66/90（20 键）。
- ②开关色 `switchStyle(enabled)` section.tsx:66-76（enabled → state-success-primary）；
  `enabled` 默认 `true`（controller.ts:119）→ 未配置成员渲染「绿+opacity 0.4」误导；
  `disabled={!member.configured}`（:226）保持。
- ③链行渲染原始 id（section.tsx:114 `{id}`）；过滤已配置（:112，S11 交付，**负路径零断言**——
  阶段 0 🟡1）；↑↓ 禁用边界 `index === snapshot.searchChain.length - 1`（:128）用**全量**
  链长，与过滤后可见列表错位——末位可见项 ↓ 未禁用，点击后 moveSearchChainEntry 越界
  返回 `{ok:false}` → 反馈「操作失败」（行为 wart，本棒修复）；品牌名数据面现成
  （MEMBERS.label/memberId，controller.ts:40-47）；fetchChain 只读列表（:141-147）同样渲染
  原始 id，对称映射。
- ④chainDefault/chainPinned 徽标（ChainStateBadge，section.tsx:176-185）无 hover 说明；
  BUILT_IN_MEMBER_ORDER 从 MEMBERS 派生（controller.ts:50）——顺序文案同源派生，不硬编码。
- 既有测试面：section.spec.tsx / controller.spec.ts / locales.spec.ts / entry.spec.tsx；
  门墙 check:i18n 现为 20 keys + 17 files 零 CJK。

## 范围决策（D1-D9，供阶段 2 审核判定层级）

| # | 决策 | 依据 |
|---|---|---|
| D1 | ①info 图标 + Tooltip：anchor = **可聚焦包裹 button**（`aria-label` = keyFieldNote 文案，`type="button"`，图标居内）——宿主 `Tooltip` 经 `cloneElement` 向单个 anchor 子元素注入 handlers/ref（宿主 Tooltip.tsx:139-147），裸 svg 图标（IconProps 无 ref/handlers 透传）作 anchor 会静默丢弃注入、hover/focus 永不触发，故不可直接作 anchor（宿主 ask-question-row.tsx:186 为图标作卡片 `icon` prop 用法，**非 Tooltip anchor 先例**，不可照抄）；Tooltip 参数 side="bottom" delayMs=400 maxWidth≈320（照 AgentPresetSection.tsx:165 先例）；位置 = key Input 与 Save 按钮之间；tooltip 正文两行 = keyFieldNote 现文案 + 格式示例行（新 locale 键 `keyFieldNoteExample`，示例形如 `sk-aaa...,sk-bbb...` 两把）；内联小字 span 删除。净增 1 键（20→21） | 用户反馈①；摸底先例 + Tooltip 机制亲读；零自绘取舍（问号图标替代 ℹ️，已在目标节披露，用户终审可否决） |
| D2 | ②开关色跟配置态：`switchStyle` 改签名 `(configured, enabled)`——`configured && enabled` → `--dsw-alias-state-success-primary`，否则 `--dsw-alias-border-l2`；`disabled={!configured}` + opacity 0.4 不变（S11 交付保持）；`role="switch"`/aria-checked 结构零改动。语义矩阵：未配置=灰（无论 enabled 默认 true）/已配+开=绿/已配+关=灰。**披露：用户原文仅「未配灰/已配绿」，「已配+关=灰」为语义矩阵推导分支（关态开关显绿将失去 on/off 视觉），用户终审可否决**。顺手 a11y 对齐：卡片 feedback span 补 `role="status"`（宿主 savedNotice 惯例，零行为变更） | 用户反馈②；宿主语义绿 token 同源；摸底惯例 |
| D3 | ③链列表收敛：渲染文本与 move 按钮 aria-label = memberId→MEMBERS.label **品牌名**口径（读屏听「DeepSeek 上移」而非「dshws-deepseek 上移」），`data-testid` 保持 id 级不变（测试选择器稳定）；未知 id 原样 fallback（防外来 id）；searchChain 可排序列表 ↑↓ disabled 边界改用**过滤后可见列表**（index===0 / index===visible.length−1）——修复 :128 全量/过滤错位（末位可见项 ↓ 恒可点+假失败）；fetchChain 只读列表**同品牌名映射、不过滤**（**披露：用户原文「收敛为已配置成员」针对可配置的搜索链；fetchChain 为只读展示链，全量 6 行展示保留配置透明度，用户终审可否决**）。列表项保留 `data-testid` 现约定（id 级，非品牌名） | 用户反馈③；「收敛为已配置成员」= S11 已交付的过滤（本棒补负路径断言清偿 🟡1）；错误边界修复 |
| D4 | ④默认序 ⓘ：仅 `chainDefault`（未钉死）态，ChainStateBadge 旁加 info 图标+Tooltip（anchor 结构与参数同 D1）；label = `t('chainDefaultHint')` + MEMBERS labels `join(' → ')` 动态派生（新键 `chainDefaultHint`，一句引导文案不含顺序本体，en/zh 同构）；pinned 态不加（钉死序为用户自定，无默认序可释）。净增 1 键（→22） | 用户反馈④；顺序单一事实源（controller.ts:50 同源派生），硬编码顺序会漂移 |
| D5 | 🔴1 修复：补写 `docs/sessions/2026-09-03-session-11.md`——记录头标注 `reconstructed（S12 阶段 0 修复批补落，2026-09-04）` + 来源清单（plan 011 / audit-log 三份 / progress-M7 S11 节 / commits 32afef7..b23097b / STATUS 历史）；内容照 10 节骨架，**不可考处写「不可考」不虚构**；两新节齐（前序审核确认 = 引 S12 stage0 log；下一 Session 启动指令节 = 声明 S11 无收官接力指令、由 S12 补落，S12 启动指令见 session-12 记录）。STATUS:46 指针随文件落盘自然合法化 | 阶段 0 🔴1 + 最小修复清单①；审核 🟢2（2.5 批准引文）随记录从 STATUS 历史/progress:63 收录 |
| D6 | 🔴2 修复（账面部分）：progress-M7 S11 T8 行追加**勘正注记**——「PASS / COMPLETE」入账撤销，以在盘 stage45 log（BLOCKED）为准，遗留腿转 S12 认领（时点快照原文不删，勘误注记跟随——沿 S10 T10 勘误先例）；**同文件 S11 节头「阶段 4/5 进行中」口径一并修正（🟡6 挂本决策——同节同批编辑）**；progress-M7 技术债台账新增 S11 遗留腿条目（🟡：jsdom 过滤负路径断言/混合序列交换断言/牙齿探针/浏览器腿）。**证据部分**由本棒 T3/T5/T7 实做、T8 独立复验、T9 闭合（台账行清偿注记 + S12 stage45 log 载复验证据）——完成后 S11 验收采信链恢复 | 阶段 0 🔴2 + 🟡6 + 最小修复清单②（实做腿路径）；虚账必须更正，不留「PASS」假入账 |
| D7 | roadmap 一致性重排（用户 2026-09-04 序列）：M7 段补登「S11 验收反馈调整」行（✅ 2026-09-03，指针 session-11 记录）；待执行尾按用户序列重写并**写死落段**——12=设置页 UI/UX 对齐（本棒，落 M7 段，WBS/验收见本 plan）13=优先级策略棒（成员级 random/序列 + ADR-0012，落 M7 段）14=fetch 兜底开关调研 + session 溯源徽标（吸收原 roadmap 11 行溯源 WBS，ADR-0010 不变，落 M7 段）15=README+迁移+升级手册（原 roadmap 12 行内容平移，落 M5 段）16=上游重建验收准备（原 roadmap 13 行内容平移，落 M6 段）；M5 里程碑行「文档腿 S12→S15」、M6 行引用、M7 脚注（多 ref 池描述改单槽口径 + 「Session 11 证据」→「Session 14 证据」）同步；**roadmap 头部规则行（session-roadmap.md:9「偏离路线图用小数编号插行，下游编号不顺延」）一并改写**——补注用户 2026-09-04 重排为权威、本次整段重编号经 2.5 终审批准，规则让位（否则该行与重排自相矛盾，且不在 grep 令牌集内必成漏网）；STATUS 悬空/待刷点**三处**全点名：:27（M5 总览行「文档腿 S12」）、:29（M7 总览行「进行中」）、:53（下一棒指针）——T0 逐一改写（防 dont-do 家族第八次）；T0 验证 grep 令牌集 = 「S1[1-6]／策略棒／溯源／手册／验收准备／顺延／插行／Session 1[1-6]」 | 阶段 0 🟡7；用户 2026-09-04 重排为最新权威；STATUS 头部「两处不一致先修一致性」条款 |
| D8 | CHANGELOG 补 S11 条目（插于顶部 S10 条目之前，标注「2026-09-04 补录」；内容从 progress-M7 S11 节 + plan 011 摘要，诚实标注遗留腿转 S12） | 阶段 0 🟡8 + 最小修复清单④ |
| D9 | S11 三份 audit-log 各补**参数头行**（库版本 v2｜阶段｜Session 11｜输入指针｜偏离说明；标注「S12 T0 补录」），不改正文 | 阶段 0 🟡9 + 最小修复清单⑥ |

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 类别 | 前置 |
|---|---|---|---|---|
| T0 | 治理修复批（feat/s12-uiux-alignment 首提交）：本 plan 落盘 + 阶段 0/2 audit-log 落盘 + D5（S11 记录 reconstructed）+ D6 账面（T8 勘正注记 + 节头 🟡6 + 遗留腿入台账）+ D7（roadmap 重排 + 头部规则行改写 + 三处 STATUS 点 + 全量引用同步）+ D8（CHANGELOG）+ D9（参数头补录）+ STATUS 启动刷新（台账新增 S12 行 🚧 + 位置块刷新）+ dont-do 候选条目草稿（🔴1/🔴2 新失效形态，随 session 记录定稿） | `git status` 前置 clean；roadmap 重排后 grep 令牌集（S1[1-6]／策略棒／溯源／手册／验收准备／顺延／插行／Session 1[1-6]）穷举零悬空；S11 记录两新节齐 + reconstructed 标注；CHANGELOG 时序亲验 | 治理（机械豁免候选：多文件状态区改写不改行为语义） | 阶段 2.5 批准 |
| T1 | 反馈①：D1 实现（Tooltip 引入 + 可聚焦 button anchor + 图标居内 + keyFieldNoteExample 键 + 内联 span 删除）；**既有断言改写面**：section.spec.tsx:227-231（keyFieldNote 卡内文本断言 → 改 tooltip 渲染断言） | 先红（jsdom：anchor button 存在性/hover 后说明与示例渲染/内联小字消失）→ 绿；check:i18n 21 keys parity；Tooltip delayMs 机制读实现后定测试手法（fake timers，禁止假设） | TDD | T0 |
| T2 | 反馈②：D2 实现（switchStyle 签名与色映射 + role="status" 顺手项） | 先红（jsdom：未配置成员 enabled 默认 true 下背景=border-l2 灰+disabled；configured+enabled=state-success-primary；configured+!enabled=灰）→ 绿；aria 语义断言保持 | TDD | T1 |
| T3 | 反馈③：D3 实现（品牌名渲染+aria 口径 + 可见列表禁用边界 + fetchChain 对称映射 + fallback）+ **S11 🟡1 清偿**（负路径过滤断言：混合 fixture 未配置成员链行不渲染）+ fixture 升级 6 成员含 anysearch（🟢①顺手）；**既有断言改写面**：section.spec.tsx:144-153（`li > span` 文本==id 列表 → 品牌名口径）+ :233-239（空转过滤断言重写为负路径）；:168-181 边界测试全配置 fixture 不受影响（保留，执行时核验） | 先红（品牌名渲染/末位可见项 ↓ disabled/未配置行不渲染/未知 id fallback）→ 绿；链语义既有 node 测试零漂移 | TDD | T2 |
| T4 | 反馈④：D4 实现（chainDefault ⓘ + chainDefaultHint 键 + 动态顺序文案） | 先红（默认态 ⓘ hover 出「引导文案 + 六品牌顺序」；pinned 态无 ⓘ）→ 绿；check:i18n 22 keys parity | TDD | T3 |
| T5 | **S11 🟡2+🟡3 清偿**：controller.spec 混合序列可见交换断言（部分未配置时 move 跳过未配置成员与相邻已配置交换，六行为面补混合用例）+ e2e 牙齿探针重演（keySelection 改 order → loopback 轮换断言恒序红 → 还原；红签名入 commit message） | 断言红→绿留痕；探针红签名原文入 commit；node 面全绿 | TDD（遗留腿） | T4 |
| T6 | 门墙七命令（提交态）+ progress-M7 批次表/门墙表 + Agent Note（docs/notes/2026-09-04-s12-uiux-alignment.md：Tooltip 复用面/色语义矩阵/边界 bug 修复/遗留腿清偿账） | 门墙数字亲见；基线 245\|9(254) → 新基线（jsdom 净增，增量披露）；check:i18n 22 keys + 17 files | 门墙+文档 | T5 |
| T7 | 浏览器实测棒（scratch 3417 新建，**3416 用户查看实例零接触**）：S11 遗留五断言（🟡4 清偿：未配成员开关置灰/逗号 3 把→轮换保存/超限 11 把拦截/优先级列表只显已配置/复原）+ S12 四项新断言（①图标 hover 出说明+示例 ②未配灰/已配开绿 ③链行品牌名+末位 ↓ 禁用 ④默认序 ⓘ hover） | 断言全过留痕（/tmp/dshws-s12/ 实物）；s05b-s11 现场零接触；复原核验 | agent 实测棒 | T6 |
| T8 | 阶段 4/5 独立验证（含 S11 遗留腿清偿复验：R5 逐条 + 🔴2 证据闭合判定） | PASS / COMPLETE；S11 案卷复验结论入 S12 stage45 log | 强制独立 | T7 |
| T9 | 收尾：session-12 记录 + S11 遗留腿台账清偿注记 + dont-do 定稿（🔴1/🔴2 新条目 RCA 三要素）+ STATUS/roadmap/CHANGELOG 原子收官 + merge `--no-ff` + 接力指令 | 6 件套齐；**session 记录随 T0 创建骨架逐阶段补内容，收官前完成**（🔴1 直接教训）；原子翻转 | 收尾 | T8 |

## 验收条目（R1-R7）

| # | 条目 | 对应反馈/债务 |
|---|---|---|
| R1 | ①：jsdom 图标 anchor（可聚焦 button）+ hover 说明与格式示例渲染 + 内联小字删除 + check:i18n 21 keys parity（T1 时点） | 反馈① |
| R2 | ②：jsdom 三态色矩阵（未配灰+disabled / 已配+开绿 / 已配+关灰）+ aria 语义保持 + feedback span role="status" | 反馈② |
| R3 | ③：品牌名渲染（searchChain+fetchChain）+ 末位可见项 ↓ disabled + 负路径过滤断言（S11 🟡1 清偿）+ 未知 id fallback + node 链语义零漂移 | 反馈③+S11 🟡1 |
| R4 | ④：默认态 ⓘ hover 动态顺序文案（MEMBERS 派生）+ pinned 态无 ⓘ + check:i18n 22 keys parity（终态；R7 门墙终验） | 反馈④ |
| R5 | S11 遗留腿清偿：混合序列交换断言（🟡2）+ 牙齿探针红签名（🟡3）+ 浏览器五断言（🟡4）+ 🔴2 证据闭合（S12 stage45 复验 + T9 台账清偿注记） | S11 移交 |
| R6 | 治理修复批核验：S11 记录在档（reconstructed+两新节）/ T8 勘正注记+台账登记 / roadmap 重排后全仓引用 grep 零悬空 / CHANGELOG S11 条目 / 🟡5 三处里程碑行 + 🟡6 节头 + 🟡9 参数头 ×3 | 阶段 0 🔴🟡 |
| R7 | 门墙七命令（提交态）+ 增量披露 + 前后 git status clean | 门墙纪律 |

## 验证矩阵

| 验证面 | 触发时机 | 责任 | 采信规则 |
|---|---|---|---|
| client jsdom 红绿（T1-T5 各面） | 每任务红→绿各 1 次 | 主 Agent | commit message + session 记录 pre-fix 红证据内嵌 |
| e2e loopback + 牙齿探针 | T5 | 主 Agent | 探针红签名入 commit；loopback 断言亲跑 |
| 门墙七命令 | T6（任务绿证）+ T8（复验汇总，全量测试唯一责任点） | 主 Agent → 独立 Agent | progress-M7 门墙表（正本），他处指针引用 |
| 浏览器断言 | T7 | 主 Agent | /tmp/dshws-s12/ 实物 + session 记录 |
| R1-R7 对峙 + S11 案卷复验 | T8 | 独立 Agent | audit-log …-s12-stage45（正本） |
| 治理修复批核验（R6 清单 grep/ls） | T8 | 独立 Agent | 同上 log |

## 高危命令预告

①/tmp/dshws-s12 scratch 自建 ②端口 3417 启停（--no-open；LISTEN 过滤 kill；**3416
用户查看实例零接触**）③scratch pnpm install ④浏览器自动化（fake 值 unset 复原）
⑤npm pack --dry-run。不涉及 push/publish/文件删除/凭据真实值/依赖变更/治理产物删除。

## 债务归属映射（正本）

| 债务 | 等级 | 归属 |
|---|---|---|
| 🔴1 S11 session 记录缺失+悬空指针 | 🔴 | **T0 修复**（D5） |
| 🔴2 S11 阶段4/5 翻转无留痕 | 🔴 | **T0 账面 + T3/T5/T7 证据 + T8 复验 + T9 闭合**（D6） |
| 🟡1 过滤断言空转 / 🟡2 交换断言缺失 / 🟡3 探针未兑现 / 🟡4 浏览器棒未入台账 | 🟡 | **T3 / T5 / T7 清偿**（R5） |
| 🟡5 状态区漏刷第七次 / 🟡7 roadmap / 🟡8 CHANGELOG / 🟡9 参数头 | 🟡 | **T0 清偿**（D7/D8/D9 + STATUS 启动刷新） |
| 🟡6 progress-M7 节头口径 | 🟡 | **T0 清偿**（D6 同节同批编辑） |
| 🟢① section.spec fixture 5 成员陈旧 | 🟢 | T3 顺手升级（显式声明） |
| 🟢② 2.5 批准引文缺失 | 🟢 | 随 D5 记录补落收录 |
| 🟢③④⑤（已披露三项/转录教训/誊写无违例） | 🟢 | 无动作（本行即声明） |
| dont-do 新条目（🔴1/🔴2 新失效形态） | 治理 | T0 草稿 + T9 定稿 |
| L-2 / fetch 排序 UI / 恢复默认按钮 / anysearch fetch 面 | 🟢 | 维持不排期 |
| v2 backlog：余额看板 + fetch 兜底开关 | 🟢 v2 | S14 调研（维持） |
| 多 key GUI 策略控件（keySelection 下拉） | 🟢 | 维持（S13 策略棒再评估） |

## 风险

- **roadmap 重排引用同步面广**（roadmap 自身脚注+头部规则行/STATUS 三处 :27/:29/:53/progress-M5 两处/progress-M7 待启动行）——T0 commit 前 grep 令牌集（S1[1-6]／策略棒／溯源／手册／验收准备／顺延／插行／Session 1[1-6]）逐处核对；漏一处即悬空引用复发（🟡7 同款）。
- **S11 记录 reconstructed 的诚实边界**：只写来源可考内容（plan/audit-log/progress/commits），
  过程细节不可考处明写「不可考」；记录头标注 reconstructed，防未来被当作逐字实录引用。
- **Tooltip 测试手法**：delayMs=400 的 hover 触发依赖实现（setTimeout 与否）——T1 先读
  Tooltip.tsx 实现再写断言（禁止自我以为）；若 jsdom 固定定位无布局，断言限 DOM 存在性
  与文本内容，不断言几何。
- **浏览器棒断言在 S12 改动后仍成立**：置灰（disabled 不变）、超限拦截（node 面 fail-loud
  →GUI failed 反馈，①改 UI 不影响）、列表只显已配置（③只改渲染文本）——五断言可复用；
  若有失效按实测重写断言并披露。
- **switchStyle 色断言脆弱性**：jsdom 不算样式，断言经由 inline style 对象（现有测试同款
  手法——section.spec 已有 disabled 断言先例，读后沿用）。
- **提交态红线**：S11 T1 曾带红 amend——本棒每文件改完立即跑该文件测试，批末全量，
  commit 前确认 HEAD 基点。
