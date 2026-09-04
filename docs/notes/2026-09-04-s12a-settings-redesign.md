# S12a 实录：设置页布局系统性重构——宿主惯例对齐（2026-09-04）

> Session 12a（feat/s12a-settings-redesign）技术实录，S13/S15 正素材。
> 计划：docs/plans/2026-09-04-012a-s12a-settings-redesign-plan.md；阶段 0/2 审核正本：
> docs/sessions/audit-logs/2026-09-04-s12a-*.md。

## 宿主设置页布局惯例（摸底结论，重构依据）

- **说明层级**：宿主设置页**零「label 旁 ⓘ tooltip」惯例**——控件解释=控件下方 12px
  hint 段落；区块级说明=页头 `h2+p.intro`；低频高级内容=`<details>` 折叠。外挂面板
  S12 的 ⓘ/Tooltip 是自创形态——本棒全撤。
- **凭据输入行**：输入框 `width:100%; height:32; r8; bg-layer-1` **独占整行**；
  Save/Cancel 在独立 footer 行（flex-end gap 8，胶囊）；错误/反馈独立 12px 行。
- **成员行卡**：border 1px l2 + r12 + padding 12 14 + column gap 12；头行=名称
  14px/500+状态点+`margin-left:auto` 动作；列表 gap 8。
- **开关**：36×20 pad 2 r10 + 16px thumb（`label-primary-foreground` 色）translateX
  120ms；off=border-l3，on=宿主用 brand-primary——**本棒保留语义绿**（S12 用户裁定
  优先）。
- **滚动**：section 自然流交给宿主 `.options` 滚，勿自设 max-height（卡内长列表才
  ≤280px 自滚）。

## 重构映射（用户四点 → 落点）

| 用户批评 | 落点 |
|---|---|
| ① ⓘ 紧贴输入框不协调 | ⓘ/Tooltip 全撤；说明=输入框下方 hint 行 |
| ② 文案差（凑数示例） | `{APIKEY1,APIKEY2,...}（最多 10 把）`格式化表述（keyFieldNoteExample 键删） |
| ③ 输入框短、按钮挤同行 | 输入 width:100% 独占行；Save/Clear 移 footer 行右对齐；旧行内结构删除 |
| ④ 底部链区块似说明占半屏 | 未配置态整块隐藏；已配置态紧凑卡（12px 标题+hint+grid 行+28px 图标钮+280 滚动）；调用逻辑上移页头 intro；fetchChain 只读区块移除（披露的功能收缩） |

## 技术决策

- **内联 style 保留 + 常数表全量对齐**：宿主共享 clientBundle preset（lightningcss
  注入链）为工作区相对导入，独立仓不可复用——css module 化=🟢 债务（另棒评估）。
  内联方案的代价：无伪元素/hover 微交互（thumb 用真实 span+transform 替代；图标钮
  hover 态放弃）。
- **状态点自绘**（role=img+aria-label+title 三件套）替代 aria-hidden 的 StateDot
  原语——读屏可闻（Models credentialDot 先例）。
- **数据面/展示面分离**：fetchChain 的 schema/快照字段保留（node 零变更），仅展示
  区块移除——controller.spec 的 fetchChain/pinned 断言存活。

## 坑

- **原语 wrapper 假绿**：断言「输入行独占」时 `input.parentElement` 是 Input 原语自带
  wrapper（span）而非布局行——第一版断言空转。修法：断言 wrapper 是卡片直接子级
  （`wrap.parentElement === card`）。**对第三方原语的 DOM 断言必须先读原语实现**。
- **大块替换漏网**：MemberCard 结构 python 大块替换时旧尾部 feedback 块漏删 →
  双渲染（feedback×2）。教训：**结构替换后 grep 旧选择器/testid 清点数量**。
- **测试自撞第二型**：链行加序号/占位 span 后 `li > span` 选择器多命中——品牌名加
  `data-dshws-chain-label` 稳定标记，测试不用位置型选择器。
