# Session 10 阶段 2 计划审核输出（三轮；轮 1 为 reconstructed 判词级重建，轮 2/轮 3 逐字）

> **落盘说明**：本文件为 Session 10 阶段 2 独立审核 Agent 三轮输出转录（主 Agent 落盘，无敏感值）。**转录缺陷修复（S11 T0）**：初版误漏轮 1 原文且轮 3 重复两遍（转录脚本复用了被 resume 覆盖的 agent 输出文件）——轮 1 以 reconstructed 判词级重建（源 = plan 010 留痕节 + 轮 2 点验回引），轮 3 去重保留一份。审核对象：docs/plans/2026-09-03-010-s10-anysearch-member-plan.md。

---

# S10 计划阶段 2 复审（轮 3，残留点验）

**结论：APPROVED**

## 逐点点验

| # | 点验项 | 判定 | 依据 |
|---|---|---|---|
| 1 | 必改② | ✅ 闭合 | T3（plan:91）已按轮 2 修法逐字落地：①「语法校验循环数组字面量增 `resolved.anysearch`（index.ts:103-105——非泛化点，不增即静默漏防载入校验）」——与实物相符（index.ts:103 显式字面量，已亲证）；②红测试升格为验收项：「anysearch 池 ref 名出语法 → load 抛 TypeError 红测试（沿 apply.test.ts:72-76/94-98 先例）」+ 验收要点列「语法红测试为验收项」——不变量从声称变牙齿。导出块三件同步改为「ANYSEARCH_MEMBER_ID / resolveAnysearchMemberOptions / 公共 provider 类导出」，与既有成员对称面一致 |
| 2 | 观察 1 | ✅ 到位 | plan:154 风险节「默认序断言（config.test/settings.test）随行为更新」——窄化消除，与锚点/D4/T1 口径一致 |
| 3 | 观察 2 | ✅ 到位 | T2（plan:90）「resolveAnysearchMemberOptions（命名成员键拼写一体惯例）」；D2 `AnysearchMemberConfig` 不变——函数/类型/成员键拼写统一为 Anysearch，D5 卡片 label `'AnySearch'` 保留品牌位，与在库惯例（resolveTavilyMemberOptions/TavilyMemberConfig + label 'Tavily'）同构 |
| 4 | 轮 2 留痕节 | ✅ 到位 | plan:39-44 忠实转录轮 2 结论（残留必改②内容 + 「点验 1-6/8 全闭合」+ 观察 1/2 吸收记录），plan:46 轮 3 占位就位 |

## 残留项

无阻塞项。一条化妆级观察（不吸收亦可）：plan:37/:44 两处 audit-log 指注写「两轮全文」——轮 3 结论补记后实为三轮，T0 转录时按实际轮数写（或径写「全文」）即可，属转录时点自然消解项，不影响计划可执行性。

## 终判理由

三轮累计：轮 1 必改 ×1（波及面 3 处 + config 四件制品点名）+ 建议 ×5、轮 2 残留必改 ×1（语法循环非泛化点）+ 观察 ×2，全部闭合且修订精确对准 file:line 实证，未引入计划外改动（本轮全文重读 diff 核对：仅 plan:39-46/90/91/154 四处，均在议定范围内）。计划现为可执行验收契约：WBS 与 roadmap S10 验收五条全覆盖、波及面穷举完备、不变量均有牙齿测试点名、TDD/验证类/实测棒分类沿先例。可进入阶段 2.5 用户终审批准。

# 轮 1：S10 计划独立审核报告（阶段 2，master@3059b36 干净亲证）

> **参数头**：审核库 v2 ｜ 阶段 2 ｜ 审核对象 plan 010 ｜ 输入指针：plan 010、ADR-0009、roadmap M7 段 S10 行、src/providers/tavily.ts、src/errors.ts、src/config.ts、src/index.ts、src/client/controller.ts、tests/apply.test.ts、tests/e2e/loopback.test.ts、tests/e2e.real/tavily.real.test.ts ｜ 偏离说明：无。
> **[reconstructed]** 本区块为轮 1 报告的判词级重建（轮 1 逐字原文因转录缺陷缺失——见文末转录说明；重建源 = plan 010 阶段 2 留痕节 + 轮 2 点验表对轮 1 的逐项回引 + 审核会话记录），非逐字原文。

## 结论

**NEEDS REVISION**（1 项必改：波及面清单三处实证遗漏 + config 四件制品无任务点名；余为建议/观察）

## 必改清单（阻塞项）

**必改①：计划「既有断言随行为更新点」清单不完备——亲测遗漏 3 处会红的断言 + T1 未点名 config 四件制品**

1. **tests/settings.test.ts:71** 遗漏：fetchChain BUILT_IN 精确列表断言——尾部追加（T1）即红，而 T1 scope 未含 settings.test。
2. **tests/config.test.ts:82-90** 遗漏：空配置骨架断言——schema 增 anysearch 节后按归一化行为将含 `anysearch: { extraApiKeyEnvs: [] }`，T1 红（若亲测不入骨架需留豁免理由）。
3. **tests/client/entry.spec.tsx:117、129** 遗漏：children.length 5 断言——MEMBERS 增第 6 项（T4）即红（经真实 controller 渲染）。
4. **T1 未点名 config anysearch 节四件制品**：roadmap S10 交付列明确含 config anysearch 节，D2 已定谳设计（与 TavilyMemberConfig 惯例同构亲核属实），但 T1/T2/T3 内容列均未点名 config.ts 落地。

**修法**：阶段 1 锚点清单 + D4 波及面补入上列 3 处（附 file:line）；T1 内容列增 config anysearch 节四件制品。

## 建议清单

1. **T10 前置列笔误**：写「T10」（自引用），应为 T9。
2. **信封 code 类型定谳**：wire 显式 `readonly code: number`，漂移字符串 `!== 0` 判真 → httpError fail-loud（安全方向）。
3. **content→snippet 同时存在用例**：补 both-present（snippet 胜）+ content-only（回退）两形，锁死优先级。
4. **controller.spec:129-135 明示**：默认 searchChain 精确列表在 T4 同红——「成员清单五→六」扩写为「成员清单 + 默认链序两处」。
5. **T3 scope 点名**：MemberKey union 增 anysearch、公共导出块三件、语法校验循环。

## 观察清单

- 锚点行号微漂（对象正确）：controller MEMBERS 实际 47-53、MemberSectionValue 62-66、members 数组 181-215。
- roadmap S10 WBS「locales」字样由 D5 零新键定谳取代——T8 Agent Note 留一句。
- 门墙七命令口径一致；端口 3415 无冲突先例。
- README/architecture 无「五成员」计数散文，docs 门墙无本棒耦合。
- 🟡 债务①②实物亲证成立（index.ts:96-102 两句同义并存/progress-M7:18 与 progress-M5:17 未推进）。
- chain 门控语义亲证：#isUsable skip 不入 failures；loopback MEMBERS 经显式 searchChain 钉死，anysearch 追加零波及。

**判定**：其余面（WBS 对 roadmap S10 验收五条全覆盖、分类沿先例、D6/D7 配方同构、高危披露、债务归属）核实可执行。

---


---

# 轮 2：S10 计划阶段 2 复审（轮 2，同 Agent 点验）

**结论：NEEDS REVISION**（残留必改 ×1：T3 对「语法校验循环」的泛化声称与实物相反；其余修订点 1-6、8 全部闭合）

## 逐点点验结果

| # | 修订点 | 判定 | 依据 |
|---|---|---|---|
| 1 | 必改①波及面清单 | ✅ 闭合 | 阶段 1 锚点（plan:54-60）三处全补齐且 file:line 与轮 1 实测逐位吻合：config.test:82-90 骨架（含「不入骨架需留豁免理由」注记——忠实吸收）、settings.test.ts:71（T1 即红）、entry.spec.tsx:117/:129（经真实 controller、T4 红）；D4（plan:72）穷举六簇 + loopback 零波及机制引 core.ts #isUsable，与 core.ts:114-121 亲证一致 |
| 2 | T1 点名 config 四件制品 | ✅ 闭合 | plan:82 四件俱全（AnysearchSettings/schema 节含 zone z.union/AnysearchMemberConfig/resolveConfig 节 + ResolvedWebSearchConfig.anysearch），池两字段必填沿 S09 惯例，测试 scope 含 settings.test fetchChain，红形态含骨架注入形态 |
| 3 | T10 前置 | ✅ 闭合 | plan:91 前置列 = T9 |
| 4 | code: number 钉死 | ✅ 闭合 | plan:83「wire `code: number`，漂移字符串 fail-loud 安全方向注记」 |
| 5 | snippet 两形用例 | ✅ 闭合 | plan:83「snippet 在先 content 回退两形〔both-present 取 snippet 锁死优先级〕」 |
| 6 | T4 默认链序 | ✅ 闭合 | plan:85「成员清单与默认 searchChain 派生列表」+ 锚点 ：129-135 |
| 7 | T3 机械面点名 | ❌ **残留** | 见下方必改 |
| 8 | 轮 1 留痕节忠实度 | ✅ 闭合 | plan:31-37 必改 ×1（3+1）与建议 ×5 逐条忠实；D4 保留 #isUsable 亲证引注 |

## 残留必改（阻塞）

**必改②：T3「语法校验循环已泛化自动覆盖」为不实声称——该循环是显式数组字面量，不增即静默漏防**

- 实物证据：`src/index.ts:103` `for (const member of [resolved.tavily, resolved.exa, resolved.perplexity, resolved.firecrawl, resolved.deepseek])` —— **字面量枚举，非从 ResolvedWebSearchConfig 派生**；config 增 anysearch 节后此循环不会自动覆盖，必须手工增 `resolved.anysearch`。（对比：`Object.values(pools)` 于 index.ts:230/:240 才是真泛化点。）
- 后果链：若执行者按计划跳过——anysearch 的 entry-config 池 ref 名不再在 load 时过 credentialRef 语法校验，仅 settings 路径在 resolve 时兜底 → 违反 AGENTS.md「Misconfiguration fails loud at load when self-contained」不变量；typecheck 与既有测试**零报错**（apply.test 语法用例仅 tavily），纯静默缺口。
- 讽刺点：这正是本棒 T0 待清偿 🟡① 的同族形态——「已收敛/已泛化」声称与实物不符。计划自身不得复刻该失败模式。
- **修法（一行级）**：T3 该短句改为「语法校验循环数组字面量增 `resolved.anysearch`（index.ts:103-105——非泛化点）」，并在 T3 验收要点增一条红测试：anysearch 池 ref 名出语法（如 `extraApiKeyEnvs: ['not a valid ref!']`）→ load 抛 TypeError（沿 apply.test.ts:72-76/94-98 先例），把该不变量从声称变为牙齿。

## 非阻塞观察（吸收与否均可，随执行留痕）

1. **风险节措辞滞后**：plan:147「默认序断言（config.test）随行为更新」——现 operable 面（锚点/D4/T1）已含 settings.test.ts:71，风险节单点名 config.test 属陈旧窄化；顺手改「config.test/settings.test」。
2. **命名大小写微不一致**：T2 函数名 `resolveAnySearchMemberOptions`（plan:83）vs D2 类型 `AnysearchMemberConfig`（plan:70）；在库惯例是成员键拼写一体（`resolveTavilyMemberOptions`/`TavilyMemberConfig`，index.ts:27,30 亲证）。建议统一为 `resolveAnysearchMemberOptions` 或两者均 AnySearch——实现期对齐即可。
3. config.test:34-41/:43-49 与 errors.test:27（"five families" 命名）为不红的扩展点，T1「断言更新与新增」口径已覆盖，无需单列。

## 点验摘要

轮 1 的 1 项必改 + 5 项建议中 6.5 项忠实落地；唯一残留是建议 5 的三件之一被写成与其事实相反的「已泛化」。修正必改②（连同观察 1 顺手）后，同 Agent 复审可直接转 APPROVED——该修正不触计划结构，仅正一词、增一测试点名。


---
