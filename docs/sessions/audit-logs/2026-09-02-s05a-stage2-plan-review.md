# Audit Log — 阶段 2 独立计划审核（Session 05a，两轮）

> 参数头（轮 1 与复审同）：骨架库 v2 ｜ 阶段 2 ｜ Session 05a ｜ 输入指针：docs/plans/2026-09-02-005a-s05a-providers-settings-plan.md（轮 2 为修订版 @`d94a595`）、docs/session-roadmap.md S05a 行、docs/dont-do.md、skill pitfalls.md、AGENTS.md、docs/00-architecture.md、S04 Agent Note（2026-09-02-s04-credentials-wiring.md）、项目根与上游参考仓只读路径 ｜ 相对骨架的偏离说明：无（骨架原样填槽；输入包按指针制附加宪法/架构/前序 Note 对照文件与代码锚核验许可，均为事实槽位）。
> 审核执行：独立 general-purpose Agent，复审续用同一 Agent（同阶段复审续用不违反独立性）。
> 输出原文逐字落盘如下（轮 1：NEEDS REVISION；复审：APPROVED 附 2 项非阻塞残项）。

---

## 轮 1 输出原文（结论节选与发现全文）

# 计划审核结论：NEEDS REVISION

审核对象：`/Volumes/IPFSJK/Zcode/dsh-websearch/docs/plans/2026-09-02-005a-s05a-providers-settings-plan.md`。所有代码锚点已亲核（dsh-websearch @ master 1d8d6e7；上游 deepseek-harness dev@3281e04b59）；firecrawl v2 线格式已对照活文档复核；`npm view @deepseek-ai/dsh-settings versions` 亲测与 plan 背景声称逐项一致（`0.1.2-alpha.2..4` 存在，T-prep 钉版可行）。

计划摸底质量整体很高（上游 provider 行号、installSection 时序、errors 族形状、npm 版本线全部核实无误），但存在 2 处必改。

### 必改（不改则 T7 卡死 / 验收违宪）

**M-1 「热改通路（链核零改动）」前提与现行代码矛盾——getter 会在构造器展开处被冻结**
- 证据：`src/chain/core.ts:220-222` 与 `:243-245`——`ChainSearchProvider`/`ChainFetchProvider` 构造器均为 `this.#core = new ChainCore({ ...options, id: this.id }, …)`。对象展开（`{ ...options }`）语义是**读取属性值**，getter 在此处被立即求值并固化为静态值。apply（`src/index.ts:84-95`）经这两个壳类构造链，因此 T7「链 options 改 getter-backed（order/perMemberTimeoutMs 热读）」在不改 core.ts 的前提下**不可能生效**：热改后 `ChainCore.#options.order` 仍是构造时的静态数组、`perMemberTimeoutMs` 仍是构造时的数字。
- plan 缺口：背景节「热改通路（链核零改动）……getter-backed options 对象即可热改」为假命题；风险节只讨论了 `readonly` 类型兼容面（该点判断正确），漏掉了 spread 求值面；WBS T7 无链壳构造器改动条目。T7 红灯阶段必然撞上计划外的 core.ts 改动（S03 交付物），且 plan 声称的「链核零改动为前提」会以失实状态进入记录。
- 要求：T7 显式列入「`ChainSearchProvider`/`ChainFetchProvider` 构造器改为透传 options（id 单独传递或等价方案），不再 spread」；撤回/改写背景节与风险节两处「链核零改动」表述；说明对 `tests/chain/*` 的影响评估（现有测试传静态 options，行为面应零变化，但改动落在 S03 资产上须留痕）。

**M-2 三个新 provider 的真实 API e2e 被静默遗漏**
- 证据：项目宪法 `AGENTS.md`「测试要求」节原文：「每个 provider：单测（本地 mock HTTP）+ 真实 API e2e（无 key 自跳）」；roadmap S05a 行 WBS 原文「三 provider 实现（**同 S04 测试口径**）」，而 S04 行验收含「真实 API e2e 无 key 自跳实测」，S04 已交付 `tests/e2e.real/deepseek.real.test.ts` + `tavily.real.test.ts`。
- plan 缺口：T3/T4/T5 只有 mock HTTP 单测；T8 门墙四命令无 e2e；R1-R5 无 e2e 条目；D1-D6 无一条范围决策声明此项偏离。这是对宪法级测试要求 + roadmap WBS 口径的**未声明遗漏**，不是已论证的裁剪。
- 要求：补 `tests/e2e.real/` 三 provider 条目（无 key 自跳形态同 S04；firecrawl 双面至少覆盖 search 面，fetch 面去留写明），或以显式 D 决策记录偏离理由并接受阶段 4 对峙——默认应执行宪法要求。

### 建议（不阻塞启动，阶段 4 可能追问）

1. **R4「实测」形态：fake seam 与 roadmap 字面的对齐风险**——建议 T7 热改测试至少一条走真实 cordis ctx + 真实 SettingsProvider；含 detach 回退的 T6 测试同理。
2. **settings 节 schema 全字段 vs 热改子集的静默 no-op**——建议 schema 窄化为热改三面，或写明偏差的文档化处置。
3. **五 provider 注册期望序未写明**——T7 冒烟断言的期望序（应为 chain → tavily → exa → perplexity → firecrawl → deepseek，同 `BUILT_IN_MEMBER_ORDER`）未落字。
4. **T1「覆盖未变」不可测**——本仓无 coverage 工具；建议改为可测表述（如「tests/ 在 T1 diff 中零变更」）。
5. **架构正本同步缺项**——D4 新增 `src/providers/shared.ts`，架构 §3 模块树应同步。
6. **T9 阶段 5 冒烟形态含糊**——建议写明具体命令形态。

### dont-do/pitfalls 命中核对

dont-do#1 版本域凭印象未复发；dont-do#2 latest tag 失真未复发；pitfalls 算术外推/`;` 链/红证据载体/批量并行/预写收官/change-detector 各条未复发或刻意契约冻结；S04 pnpm-workspace.yaml 自动改坑已吸收（高危预告① 显式携带）。

**结论**：按 M-1、M-2 修订 plan 后可进入阶段 2.5；六条建议建议随手吸收（尤其建议 1、3）。

---

## 复审输出原文

# 复审结论：APPROVED

修订版已逐项对照轮 1 发现核验（commit d94a595，+28/-16，仅动 plan 正本），全部吸收且技术表述经代码实证无误。

## 必改项处置核验（全部闭环）

**M-1（壳构造器 spread 冻结 getter）— 已闭环，且 D7 的条件分支已可预先消解。**
- 落点齐备：D7 决策行（plan:81）、T7 首项（:99）、背景节改写并附实证（:64-68「`{ ...options, id }` 的对象展开会在构造时求值 getter 并冻结」，标注 core.ts:220-222/:243-245——与我对现行代码的核验一致）、风险节改写（:169-171）。
- D7 留白的「实现时核实 core 对 `options.id` 的运行时消费」本轮已代为核实：**ChainCore 对 `options.id` 零运行时消费**（core.ts 内 `id` 仅出现于循环局部变量与泛型约束；`.id` 在构造链路只出现在 spread 本身 ：221/:244）。即 D7 的「零消费则契约瘦身」分支是事实分支，`Omit<ChainOptions,'id'>` 透传安全，壳类自身 `readonly id` 字段保持唯一 id 源。执行期按此分支落地即可，无悬念。
- 「既有 tests/chain/* 全绿为行为保持证据」是正确的验证面（静态 options 构造路径行为不变）。

**M-2（三 provider 真实 API e2e 遗漏）— 已闭环。**
- T7b（:100）：三文件、env key 自跳、firecrawl search+scrape 双面各一 it、env-backed resolve thunk 同生产 seam（与 S04 Agent Note §7 口径吻合）。
- R2「e2e real 两文件就位与 skip 实测」/ R3「e2e real 双面就位与 skip 实测」扩展到位；验证矩阵增「e2e 自跳 skip 计数 | T7b | pnpm test 原文；阶段 4 重放」行。
- T7b 类别标「验证类」豁免先红——与 S04 先例一致（无 key 时自跳测试无可演示的红），且宪法红绿要求限于契约/逻辑类，分类自洽。

**S-1..S-6 — 全部落实且声称可证**：S-1 真实 seam 测试（上游 `packages/settings/settings/tests/settings.spec.ts:700-711` 先例亲核属实）；S-2 D2 补定案（保持全量 Config、JSDoc 冷热标注，显式决策标「阶段 4 可对峙」）；S-3 期望注册序落字与 `BUILT_IN_MEMBER_ORDER`（config.ts:12-18）及 Agent Note s04 §4 一致；S-4 T1 验收三项均有命令或 diff 手段；S-5 架构 §3 树同步；S-6 冒烟形态可执行。

## 对齐复检

roadmap S05a 行三验收（五 provider 冒烟全绿 / settings 热改链序实测下次搜索生效 / lint+typecheck 全绿）分别由 R5、R4（+T7 真实 seam 测试支撑「实测」二字）、T8 四命令覆盖；WBS「同 S04 测试口径」经 T7b 后完整兑现。依赖序（T7→T7b→T8）合理；dont-do/pitfalls 复核零复发，且轮 1 审核结论按治理惯例内嵌于 plan 头部（:7-12）。

## 非阻塞残项（转执行者随手处理，不构成再修订条件）

1. **S-5 修正不彻底**：架构 §3 树（00-architecture.md:43-44）现列 `chain/search-chain.ts` + `chain/fetch-chain.ts` 两行，而 `src/chain/` 实际只有 `core.ts`（S03 实现形态与 S01 规划名不符，亲核确认）。T8 按现措辞「增两行」会留下两行幽灵文件。T8 执行时应**替换**该两行为 `chain/core.ts` 再增 `providers/shared.ts`，非纯增。
2. **决策编号卫生**：决策表头仍写「范围决策（D1-D6…）」但表内已插入 D7（且置于 D2 与 D3 之间）；背景节 ：67 把壳修正交叉引用写为「见 D2/T7」（应为 D7）。建议一次一行修订顺手改齐。

**结论**：APPROVED。可按修订版 plan 进入阶段 2.5（高危命令披露）与执行；残项 1/2 由执行者在 T8/顺手修订中处理即可。

（残项处置留痕：残项 2 已于 `aaf7ab1` 修订；残项 1 已于 T8 `a0d6f00` 落实——00-architecture.md §3 替换幽灵行为 chain/core.ts 并增 providers/shared.ts。）
