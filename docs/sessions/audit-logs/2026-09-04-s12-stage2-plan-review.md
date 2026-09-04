# Audit Log — S12 阶段 2 独立计划审核（对象：plan 012）

- **参数头**：审核库 v2｜阶段 2｜Session 12（两轮，同 Agent 上下文复审）｜输入指针：plan 正本 docs/plans/2026-09-04-012-s12-uiux-alignment-plan.md；roadmap docs/session-roadmap.md；用户四项反馈原文（事实槽位内嵌提示词）；阶段 0 audit-log docs/sessions/audit-logs/2026-09-04-s12-stage0-review-of-s11.md；被审代码 src/client/{section.tsx,controller.ts,locales.ts} + tests/client/{section.spec.tsx,controller.spec.ts,locales.spec.ts}；dont-do；governance-sessions.md §3.4.6/§3.4.7；宿主实锚抽查面（deepseek-harness ui-primitives/Tooltip.tsx、icons/index.tsx、ui-agent-preset/AgentPresetSection.tsx、ui-settings-plugins/SubagentModelSelectionCard.tsx）｜偏离说明：骨架「审核维度」按事实槽位扩列为六维（可测性/依赖序/范围/遗漏面/roadmap 对齐/实锚抽查 4-6 处）；复审轮为同 Agent 上下文续用（six-stage 复审默认通道）。

- **轮 1 输出原文**（2026-09-04，结论 NEEDS REVISION：必改×3 + 建议×6）：

---

# 审核结论：NEEDS REVISION（必改 ×3，建议 ×6）

以下全部基于正本亲读与实锚抽查。抽查 6 处 file:line 实锚（宿主 Tooltip.tsx:34 / icons/index.tsx:890 / AgentPresetSection.tsx:165 / SubagentModelSelectionCard.tsx:76-87；本仓 section.tsx:66-76/112/114/128/176-185/226/240、controller.ts:40-47/50/119/141-147、locales.ts 20 键）**全部逐字命中，无转述失真**；`:128` 边界 bug 诊断经对照 filter + `moveSearchChainEntry` 跳过逻辑**复算成立**；已安装 `dsh-client-ui-primitives@0.1.2-alpha.4` 的 `lib/types/index.d.ts:31`（Tooltip）与 `icons/index.d.ts:157`（IconQuestionOutline14，经 `export *` :57）证实两组件在档，manifest/tsdown external 免改声称成立；`check-locales.mjs` 为 parity 制无硬编码键数，20→21→22 无需改脚本；🔴×2/🟡×9/🟢×5 共 16 项全部有归属（🟡6 偏弱，见建议 4）；STATUS:46 悬空指针、session-11 记录缺失、CHANGELOG 顶部=S10、S11 三份 audit-log 无参数头均实证与 plan 声称一致。但存在以下问题。

## 必改

**1. D1「IconQuestionOutline14 为 anchor」按字面不可执行（技术可行性缺陷）。**
Tooltip 的机制是 `cloneElement` 向**单个 anchor 子元素**注入 `ref/onMouseEnter/onMouseLeave/onFocus/onBlur`（宿主 Tooltip.tsx:139-147）；而 `IconQuestionOutline14`（icons/index.tsx:890）不透传多余 props，也不接受 ref——图标直作 anchor 时注入的 handlers/ref 全部静默丢弃，hover/focus 永不触发，tooltip 永不渲染。plan 引用的「宿主 ask-question-row.tsx:186 用例」实为图标作为卡片 `icon` prop 的用法，**并非 Tooltip anchor 先例**，「照抄该先例」的表述会误导执行者。修法一行：D1 明确 anchor = 可聚焦包裹元素（button 或带 tabindex 的 span），图标置于其内；这同时让「anchor aria-label 复用 keyFieldNote」的读屏声称成立（通用 span 上的 aria-label 不可靠，且 focus 触发腿要求可聚焦元素）。T1 红阶段若按 D1 字面实现会卡红且易被假绿绕过——正是 S11「断言空转」的同族失效面。

**2. 反馈②的验收措辞被静默改写，无披露标注。**
用户原文：「开关颜色跟随配置态（**未配灰/已配绿**）」；plan 目标节写「未配灰 / **已配开=绿**」，D2/R2 固化为三态矩阵（已配+关=灰）。该矩阵是合理引申，但 plan 在①（ℹ️→问号图标）处做了显式取舍披露（「用户终审可否决」），②的措辞改写却**未标注为解释决策**——验收契约对事实槽位的复述失真而无披露，恰是本棒自己要修的 🔴2「验收以披露替代交付」的镜像形态。修法一行：D2 补「已配+关=灰为语义矩阵推导，用户原文未含关态分支，终审可否决」。

**3. D7 同步面遗漏 roadmap 头部规则行，且现有 grep 令牌抓不到它。**
session-roadmap.md:9「偏离路线图用小数编号插行（10a/10b），**下游编号不顺延**」与 D7 的整段重编号（12→15、13→16 顺延）直接矛盾；该行不含 T0 grep 令牌（「S1[1-6]／策略棒／溯源／手册／验收准备」）中任何一个，R6「全仓引用 grep 零悬空」**按现有令牌集必然放行**这处自相矛盾——下一棒阶段 0 必抓（🟡7 同族复发）。修法：D7 同步面增列头部规则行的改写/补注（记录用户 2026-09-04 重排为权威、规则让位），grep 令牌增补「顺延／插行／Session 1[1-6]」（后者补抓 roadmap M7 里程碑行「（Session 11 证据）」→ 应为 Session 14 的证据指针——该行含「溯源」令牌可被带到，但「Session 11」子串本身不在 S1[1-6] 模式内）。

## 建议

**4. 🟡6 归属映射落空**：债务映射把 🟡6（progress-M7:63 节头「阶段 4/5 进行中」vs T8 PASS 自相矛盾，亲读证实）归入「T0 清偿（D7/D8/D9 + STATUS 启动刷新）」，但 D5-D9 与 T0 清单无一触碰该节头；仅 R6 事后核查。应显式挂到 D6（同文件同节编辑）。

**5. STATUS 悬空点计数少一处**：风险节称「STATUS 两处」，实际重排波及 STATUS 三处——:27 M5 总览行「文档腿 S12」、:29 M7 总览行、:53 下一棒；T0 明确点名的只有 :29。:27 仅靠全仓 grep 兜底。按 dont-do「收官序列漏刷状态区」已七次复发的家族史，应补全计数防第八次。

**6. 既有断言改写面未穷举**：T1 删内联小字必破 section.spec.tsx:227-231（keyFieldNote 卡内文本断言）；T3 品牌名渲染必破 :144-153（`li > span` 文本==id 列表）与 :233-239（空转过滤断言重写为负路径）；:168-181 边界测试因全配置 fixture 不受影响（可留）。D3 只钉了 data-testid 为 id 级，**aria-label 的 id/品牌名口径未定**（:155-191 既有查询依赖该选择）。本棒正在清偿 🟡1 断言空转，改写面应显式列进 T1/T3。

**7. R1 键数表述自混**：「check:i18n 21→22 键 parity」把 T1（21 键）与 T4（22 键）两个时点压进反馈①的验收条目；R1 应钉 21，22 归 R4（或 R7 门墙终态）。

**8. D3 fetchChain 收敛口径未披露**：用户③「链列表收敛为已配置成员」；D3 对 searchChain 用 S11 已交付过滤、对 fetchChain 只做品牌名映射不过滤（6 行全显）。作为只读链该取舍可辩护，但应比照①的披露模式写明解释口径，供 2.5 终审；目标节「已配置成员行渲染品牌名」对 fetchChain 亦不准确。（D7 未言明 12/13/14 落哪个里程碑段——可推断为 M7，建议一句话写死。）

## 无-action 核验项（免复核）

依赖链 T0→T9 线性串行符合治理逐一纪律，无环无缺；四项反馈 R1-R4 覆盖完整，超范围项（边界 bug 修复、role="status"、fixture 6 成员）均已在 D2/D3/🟢①显式披露；T5（🟡2/🟡3）与 T7（🟡4）对 S11 遗留腿的吸收路径与 🔴2「账面+证据+复验+闭合」四段式内部自洽；entry.spec.tsx 亲读证实零波及（无链列表断言、成员卡不过滤）；高危命令预告覆盖 scratch 自建/3417 端口/scratch install/浏览器自动化/pack dry-run，与 §3.4.7 清单对得上；T0 的「机械豁免候选」自评（多文件状态区改写不改行为语义）符合 §3.4.6 机械变更定义，但**仍需独立审核 Agent 确认**（plan 已依规标注「候选」而非自断，合规）。dont-do 复发标注：plan 背景节将 🟡5 标为既有「收官序列漏刷新状态区」条目第七次——与 dont-do.md 正本相符；本次审核第 3/5 条即该家族的预防性拦截。

**判定**：NEEDS REVISION。必改 3 项均为单行级修正（D1 anchor 结构、D2 披露行、D7 同步面+grep 令牌），修正后本 plan 无结构性障碍。

---

- **主 Agent 修订处置**：必改 1/2/3 + 建议 4-8 全数吸收（修订点：D1 anchor=可聚焦 button + cloneElement 机制注记；D2 披露行；D7 头部规则行改写+STATUS 三处点名+八项 grep 令牌+落段写死+M7 脚注证据指针；D6 挂 🟡6；T1/T3 断言改写面 + D3 aria 品牌名口径；R1 钉 21/R4 补 22；D3 fetchChain 披露）。修订处置原文已随复审请求逐条列明（会话留痕）。

- **轮 2 输出原文**（同 Agent 复审，2026-09-04，结论 APPROVED）：

---

# 复审结论：APPROVED

逐条点验（对照修订后 plan 正本）：

## 必改项闭合核验

**必改1（D1 anchor）——闭合。** D1（plan:79）现文：anchor = 可聚焦包裹 button（`type="button"`、`aria-label`=keyFieldNote、图标居内）；补记 cloneElement 注入机制并实锚到宿主 Tooltip.tsx:139-147（与我复审时亲读的注入行段一致）；明确「ask-question-row.tsx:186 为图标作卡片 icon prop 用法，非 Tooltip anchor 先例，不可照抄」。连带面同步：T1 红阶段改「anchor button 存在性」（plan:94）、R1 改「可聚焦 button」（plan:108）、D4 引「anchor 结构与参数同 D1」（plan:82）——ⓘ 图标同样获得可聚焦包裹，闭环完整。

**必改2（D2 披露）——闭合。** D2（plan:80）增粗体披露行：用户原文仅「未配灰/已配绿」、「已配+关=灰」为语义矩阵推导分支（含关态显绿失去 on/off 视觉的理由）、「用户终审可否决」。与①的取舍披露模式对齐，2.5 终审可据此行使否决。目标节摘要行措辞保留原样可接受——验收正本在 D/R，披露已落在决策层。

**必改3（D7 同步面）——闭合。** D7（plan:85）五项全数在文：① 头部规则行（:9「下游编号不顺延」）改写补注（用户重排为权威、经 2.5 终审批准、规则让位）；② STATUS 三处全点名 ：27/:29/:53（我此前对 STATUS.md 正本的亲读证实三处描述准确）；③ grep 令牌集扩为八项（含「顺延／插行／Session 1[1-6]」，后者可抓 M7 里程碑「Session 11 证据」指针）；④ 落段写死（12/13/14→M7、15→M5、16→M6）；⑤ M7 脚注「Session 11 证据→Session 14 证据」。T0 行（plan:93）与风险节（plan:152）的令牌集已同步为同一份八项集合，三处一致无漂移。

## 建议项闭合核验

- **建议4**：D6（plan:84）明文「节头『阶段 4/5 进行中』口径一并修正（🟡6 挂本决策——同节同批编辑）」；债务映射拆出独立行「🟡6 → T0 清偿（D6 同节同批编辑）」（plan:141）；T0 内容同步列「节头 🟡6」。**闭合。**
- **建议5**：D7 与风险节均改「STATUS 三处 ：27/:29/:53」。**闭合。**
- **建议6**：T1 列 ：227-231 改写面；T3 列 :144-153（品牌名口径）/:233-239（负路径重写）/:168-181 保留核验；D3 钉死「渲染文本与 move 按钮 aria-label = 品牌名口径（读屏听『DeepSeek 上移』），data-testid 保持 id 级」。**闭合**（见下方非阻塞残留注记）。
- **建议7**：R1 钉「21 keys parity（T1 时点）」，R4 补「22 keys parity（终态；R7 门墙终验）」——键数-时点绑定明确。**闭合。**
- **建议8**：D3 增 fetchChain「同品牌名映射、不过滤」披露行（只读链全量展示保留配置透明度，终审可否决）。**闭合。**

## 非阻塞残留注记（不构成改判依据，随 T3 执行即可）

D3 将 aria-label 钉为品牌名口径后，section.spec.tsx 中以 id 级 aria-label 作查询选择器的既有断言面实为 ：155-166、:168-181、:183-191、:241-258 全体——T3 改写面清单只点名 :144-153/:233-239，并将 ：168-181 标为「不受影响（保留，执行时核验）」。该标注在**断言语义**维度成立（全配置 fixture 下禁用逻辑不变），在**选择器**维度不成立（aria-label 改口径后查询串必改）。plan 以「执行时核验」兜底、且 TDD 红阶段会令这些选择器立即失败响亮暴露，配合提交态红线纪律可自然收敛——故仅记录，不要求再修订。执行者在 T3 应预期：凡 `aria-label="dshws-*  Move up/down"` 查询一律随品牌名口径同步改写。

**最终判定：APPROVED。** 3 项必改全部闭合、5 项建议全部落实，无新增结构性缺陷；上述残留注记属执行期选择器改写精度，已有双重机制（红阶段失败 + 执行时核验兜底）覆盖。
