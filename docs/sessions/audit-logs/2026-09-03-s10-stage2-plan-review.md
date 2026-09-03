# Session 10 阶段 2 计划审核输出（三轮全文）

> **落盘说明**：本文件为 Session 10 阶段 2 独立审核 Agent 轮 1/轮 2/轮 3（同 Agent 续审）输出原文逐字（主 Agent 转录落盘，无敏感值）。审核对象：docs/plans/2026-09-03-010-s10-anysearch-member-plan.md。

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