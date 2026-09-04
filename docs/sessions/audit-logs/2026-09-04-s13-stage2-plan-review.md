# Audit Log — S13 阶段 2 独立计划审核（对象：plan 013 优先级策略棒）

- **参数头**：审核库 v2｜阶段 2｜Session 13（单轮；独立 Agent 与计划制定者上下文隔离）｜输入指针：plan 正本 docs/plans/2026-09-04-013-s13-priority-strategy-plan.md；参照 docs/session-roadmap.md（M7 段 S13 行）、docs/notes/2026-09-04-s12b-page-info-deepseek.md、docs/decisions/adr-0002-full-ha-chain-semantics.md + adr-0004-global-priority-neutral-default.md + adr-0011-single-slot-comma-keys.md、阶段 0 正本 docs/sessions/audit-logs/2026-09-04-s13-stage0-review-of-s12b.md、docs/dont-do.md｜实测代码面：src/keys.ts、src/config.ts、src/client/{controller.ts,section.tsx,locales.ts}、tests/{keys,apply,config}.test.ts、tests/e2e/loopback.test.ts、tests/client/{controller.spec.ts,section.spec.tsx,locales.spec.ts}、scripts/check-{locales,cjk}.mjs、tsconfig{.json,.client.json}、package.json、宿主 packages/settings/settings/src/index.ts（mergeLayers）；基线 master@410f516｜审核依据要点转录：①摸底实锚逐一复核 ②断言面穷举（存活/必改清单）③locale 22→27 算术与 check-cjk 门兼容 ④变体 B 牌堆语义可实现性与红测试判别力 ⑤裁定 A fallback 零产品代码路径与 TDD 适用域 ⑥治理面对应（T0 清偿/WBS 前置/R 可测性/验证矩阵纪律/高危预告/基线数字）⑦D6 范围纪律与「序列编辑器」解读溯源 ⑧非阻塞建议｜偏离说明：无。

- **结论**：**NEEDS REVISION**——必改 ×2（均一行级验收条款修订，无结构性返工）；建议 ×5。摸底实锚 12/12 全真、治理映射零遗漏、基线数字全对、范围纪律成立；修订后可提请 2.5（如需复审，仅对峙 M1/M2 两点即可）。

## 必改（M）

### M1 「既有断言零漂移（…rng 注入）」押在洗牌方向的硬币上——按主流 Fisher-Yates 公式该断言必翻

- **证据**：tests/keys.test.ts:66-71 现断言——fresh 池 `'k1,k2'`、`rng: () => 0` → 期望 `'k1'`（:67-68）；`rng: () => 0.999` → 期望 `'k2'`（:69-70）；两池各只发一枪。变体 B 洗牌牌堆下其存亡取决于公式：
  - 降序教科书 FY（`j = floor(rng()·(i+1))`，i 自高向低）：`rng≡0` → 牌堆 `[k2,k1]` → 首抽 k2 ≠ 'k1'；`rng≡0.999` → 牌堆 `[k1,k2]` → 首抽 k1 ≠ 'k2'。**两条全翻。**
  - 升序公式（`j = i + floor(rng()·(n−i))`）：`rng≡0` → 恒等排列 → 首抽 k1 ✓；`rng≡0.999` → `[k2,k1]` → 首抽 k2 ✓。**两条全存活。**
- **plan 缺陷**：T1（plan :61）与 R2（:74-76）把「rng 注入」列入零漂移清单，但 D1（:49）只写「Fisher-Yates 重洗」未钉公式——验收条款由实现者二选一决定真假。
- **修法（二选一，一句话）**：① D1 钉升序公式（rng≡0 ↔ 恒等排列；既有钉牌断言语义平移为「洗牌种子」）；② T1/R2 零漂移清单把 keys.test.ts:66-71 摘出，声明为裁定 B 下允许随实现改写的必改面。

### M2 「既有 spec 零漂移」漏认两张 fixture 面（typecheck 门必拦）

- **证据**：D4（plan :52）给 `MemberSnapshot` 加 `keySelection`（镜像 deriveSnapshot 显式默认，必填）+ 新动作 `setKeySelection` → `SectionProps` 必加回调。tests/client/section.spec.tsx:19-31 `member()` 与 :57-66 `makeProps()` 均为对象字面量 fixture，缺新字段即编译错；tsconfig.client.json `include` 含 `tests/client/**`，`pnpm typecheck` 双面（package.json scripts.typecheck）必红。plan T2（:62）「既有 spec 零漂移」按字面读为假（controller.spec 不构造快照字面量、确实零漂移；section.spec 两 helper 必改）。
- **修法**：T2 或 T3 补一句「section.spec 两 fixture helper 补新字段（机械 accommodation，非断言漂移）」——防 plan-vs-actual 文本漂移债（本 plan 债务表 🟢③ 同款）复发。

## 建议（S，非阻塞）

- **S1** T1 红测试钉牌选恒值（如 `rng: () => 0`）并按多重集（排序后比较）断言「每把恰一次」——有放回基线可证产出 `[k1,k1,k1]`（红）；若误钉循环序列（如 0/0.34/0.67），有放回也会凑出排列而假绿。TDD「记录 pre-fix 红」要求可自纠，但钉法写明省一轮返工。
- **S2** 牌堆重建腿（热改逗号值 → 多重集错配 → 重建）现仅见于风险节（plan :125-126）；建议补进 T1 红测试列举（:61）与 R2（:74-76），免 T6 R 对峙时口径不一。
- **S3** 裁定 A 分支已由 D1（:49）/ R2（:75-76）/ 风险（:123-124）三处承载，且 T1 前置列标「T0（裁定 B）」，无契约矛盾；建议 T1 行补一句「裁定 A 时按 D1 fallback：记录性定谳，无红相」，使 WBS 单行自足。**适用域裁定**：「钉牌现状断言」是 characterization 测试（记录被定谳的现状），不是重构——「重构类禁证红」不适用，无 TDD 冲突；仅 T1 行「红→绿留痕」四字在 A 分支下不适用，标注即可。
- **S4** T5 零接触端口清单（plan :65：3416/3080/61518）与高危预告（:117：另有 3419/3420）不一致——统一取全集。
- **S5** D2 控件行建议加 `role="group"` + aria-label（与行 label 同源）：六卡 × 三 button 文案相同，group 语义让 scoped 查询与读屏更稳（data-testid 已按卡命名，二者取一即可）。

## 逐点核验（八维证据）

**1. 摸底实锚 12/12 全真**：src/keys.ts:120-132 `#select`——random 有放回（:122-125 `keys[Math.floor(rng()*keys.length)]`）/ order 恒首把（:131）/ round-robin 游标（:126-130）；rng 端口恰在 :44（`readonly rng?: () => number`）。config.ts schema union 六成员（:144/:151/:157/:164/:171/:178）+ resolveConfig 显式 `?? 'order'` 六处（:262/:270/:277/:283/:290/:299）✓。controller.ts:56-59 `MemberSectionValue` 仅 enabled/apiKeyEnv；`MemberSnapshot`（:74-84）无 keySelection ✓。section.tsx:316-400 `MemberCard` 头行（:346-364）/输入行（:365-372）/footer（:373-397）三段 ✓。宿主 mergeLayers（packages/settings/settings/src/index.ts:284-292）plain object 递归深合并、数组整替换（:286）✓；`{ tavily: { keySelection } }` 不清兄弟字段成立；setEnabled 同款 patch 形态 controller.ts:212 ✓。

**2. 断言面穷举**：`grep random/rng src+tests` 全查——波及面恰四处置：keys.test.ts:66-71（M1，条件必改）；tests/config.test.ts:47-50（resolveConfig 透传断言，零 schema 改动下存活）；tests/e2e/loopback.test.ts:278-296（random 冒烟：:289-291 仅断言集合成员资格 + :292 次数，「distribution is not an asserted contract」——变体 B 下仍绿）；tests/apply.test.ts:102-128（order→round-robin 热切，无 random 腿，存活；plan 称「apply.test.ts:102-145 三行为断言」实测 :102/:130/:142 三 it，锚准确）。controller.spec 既有用例不构造 MemberSnapshot 字面量 → 零漂移成立。section.spec 守卫共存核查：:262 卡内 tooltip null 守卫（新控件为 aria-pressed button 非 tooltip，共存）；:291-293 输入行 wrapper 无 button（控件行置于输入行与 footer 之间，共存）；:296 footer 判定（save.parentElement）不动；全文件无全局 button 计数断言。plan 已认领 :254-273 守卫族与 :293 单 button 场景——**未认领面仅 M2 两 fixture**。

**3. locale 算术**：src/client/locales.ts union :17-39 亲数恰 **22** 键；D5 +5（keySelection/keySelOrder/keySelRoundRobin/keySelRandom/keySelectionHint）→ **27** ✓。scripts/check-locales.mjs 仅 union/en/zh parity（无计数锚）；键名正则 `'([a-z][a-zA-Z]*)'` 与两格缩进字典解析对五新键全兼容。tests/client/locales.spec.ts 泛化 parity（:14-25）+ 既有键钉断言（:27-44，不含新键名）零波及——plan「泛化 parity 断言，无计数锚，预期零改」属实。check-cjk.mjs 豁免 locales.ts（EXCEPTION），渲染层插值（`{policy}` 模板入字典、拼接在渲染层）不产生字典外 CJK 字面量 ✓。

**4. 变体 B 语义完备性**：可实现——`#select` 每请求单次抽牌（keys.ts:108 选定后即定），「失败不换把不回牌」结构性成立（链层降级）；牌堆/游标为 KeyPool 实例私有，settings 热切（apply.test.ts:102-145 热通路不重建实例）下靠多重集重建守卫续命，D1 已载。红测试判别力：恒值钉牌下现状实现产出 `[k1,k1,k1]`（非排列 → 红）✓，前提是钉法不凑出排列（S1）。热改值重建可测（setValue + 钉 rng）；round-robin 游标零波及；未发现未覆盖交互角。

**5. fallback 预案可执行性**：裁定 A 路径 = ADR-0012 记录性定谳 + keys.test 钉牌现状断言 + 产品代码零 diff——波及面恰 keys.ts:122-125 一处分支，不动即零 diff，成立（见 S3 的 TDD 适用域裁定）。

**6. 治理面**：T0 清偿清单与阶段 0 正本一一对应——🟡-1 亲证（grep「开发规范强化说明」仅 session-12.md:167 命中；12a/12b 均缺节）；🟢① 亲证（docs/STATUS.md:48 12b 行倒插于 :49 12a 行前）；🟢② 亲证（progress-M7 技术债表无「CSS module 化」「anysearch fetch 面」两行，STATUS:57 声明四 🟢 仅两行镜像）；🟢③④⑤ 处置声明与正本一致。WBS 线性前置链 + 类别标注合理；R1-R6 均可实测（宁少而实）。验证矩阵「门墙七命令 T4 主 + T6 独立复验（全量唯一责任点 = T6）」与 012a 先例（plan 012a:113 同款表述）一致；每验证面 ≤2 次 ✓；重负载串行 ✓。高危命令预告覆盖 scratch 自建/端口实例（lsof 起前查占 + 端口精确 kill + 零接触清单）/scratch pnpm install/浏览器 fake 值复原/npm pack --dry-run 五族，禁项声明完整（无 push/publish/大范围删除/真实凭据/依赖变更/治理产物删除），T7 挂 dont-do ⑤ 实物 ls 清单 ✓；T5/R6 用「本棒动作零接触」口径符合 dont-do 隔离条目。基线 **252 passed | 9 skipped (261) / i18n 22 keys / client.js 26.25 kB** 与阶段 0 正本（其 :21/:34）逐一吻合。

**7. 范围纪律**：D6① 有 ADR-0011 正本支撑（Rationale「整池覆盖/清除语义天然成立（用户确认为正确行为）」+ 负面风险「key 个体无独立状态……重配即整池覆盖」）；D6② ADR-0002 运行级顺序降级为设计正本（Decision 2），D1 成员级范围注记要求写入 ADR 防误读——加固恰当；D6③「序列编辑器 = 既有链卡 ↑↓」有 roadmap S07 行（排序变更→settings.yaml 实测落盘）+ 12b note（「排序（链卡）+ 策略控件（成员卡，S13）在现有页面承载」）双重支撑；roadmap S13 行「random/序列变体定谳」在变体 B（不放回 = 轮内随机序列）语义下被 D1 覆盖，解读成立；「独立子页不需要」有 12b note 判定正本；plan 任务源与 roadmap S13 行 WBS 三件（定谳/GUI 控件/两级说明）逐项对齐 ✓。

**8. 其余**：D4 显式默认化（deriveSnapshot 镜像 node resolveConfig，不由渲染层 `??` 兜底）符合 explicit > implicit 边界惯例；D2 未配置禁用与 switch/Clear 置灰惯例（section.tsx:358/:382）同构；风险节四条均有对应验收或实测腿。

## 终审

plan 实锚质量高（12/12 全真）、治理映射零遗漏、基线全对、范围纪律成立；两条必改均为验收条款精度问题（M1 一句话钉洗牌公式或摘出必改面；M2 一句话认领两 fixture），修订留痕后可提请 2.5 终审。建议五条不阻塞，采纳与否由主 Agent 裁定。

---

# 轮 2 复审（同审核对象：plan 013 修订版；仅对峙轮 1 M1/M2 + S1-S5 落实度）

- **参数头**：审核库 v2｜阶段 2 轮 2｜Session 13（同独立 Agent 上下文续审）｜输入指针：plan 修订版 docs/plans/2026-09-04-013-s13-priority-strategy-plan.md（轮 1 后主 Agent 修订）；对照基线 = 轮 1 本 log 全部证据（keys.test.ts:66-71 实锚、tsconfig.client.json include、section.spec.tsx:19-31/:57-66）｜偏离说明：复审范围限 M1/M2 + S1-S5，其余节按轮 1 结论维持。

- **轮 2 结论**：**APPROVED**——M1/M2 全数落实且修法正确；S1-S5 五条全落实；无新引入矛盾。

## M1/M2 对峙（必改项，逐条验真）

**M1 ✓ 落实（修法①：钉公式）**——D1（plan:49）钉死「Fisher-Yates **升序公式** `j = i + floor(rng() × (n − i))`」+「**rng≡0 ↔ 恒等排列**」+「keys.test.ts:66-71 两既存钉牌断言在此公式下全存活，即零漂移证明面」。数学复核：升序公式 rng≡0 → j=0 恒等排列 → 首抽 k1（=:68 期望）✓；rng≡0.999 → j = 0+floor(0.999×2)=1 → 牌堆 [k2,k1] → 首抽 k2（=:70 期望）✓——两断言全存活，证明面成立。T1（:61）零漂移清单改为「order/round-robin/超限/空池 + **钉牌单发 ：66-71 两断言在升序公式下存活**」、R2（:74-76）同步——轮 1 的「验收条款押硬币」缺陷消除。

**M2 ✓ 落实（按修法原文）**——T2（plan:62）新增「**section.spec 两 fixture helper 补新字段**（member() :19-31 + makeProps() :57-66——typecheck 必拦的机械 accommodation，非断言漂移）」，验收要点改「既有 spec 零漂移（fixture 补字段除外，逐处列名）」。行锚与轮 1 证据逐一吻合，「零漂移」条款字面为真。

## S1-S5 落实度（建议项，逐条核对）

- **S1 ✓**：T1（:61）红测试钉牌改「恒值 rng（()=>0）+ 多重集比较」并写明「现状有放回基线产出 [k1,k1,k1] 故真红」——变体 B + rng≡0 下重洗恒产恒等排列，三连发 [k1,k2,k3] 为排列（绿），判别力钉死。
- **S2 ✓**：牌堆重建腿进 T1 红测试列举（:61「抽一轮中途热改池值 → 下一请求按新池重抽」）与 R2（:74-75「热改池值后按新池重抽」）——与风险节（:126-127）口径合一。
- **S3 ✓**：T1（:61）加裁定 A 分支标注（characterization 无红相、不在「重构类禁证红」适用域、留痕标「记录性定谳无红相」）+ 验收要点「红→绿留痕（裁定 A 时标注无红相）」；D1（:49）fallback 同步补「（characterization 测试，无红相）」——WBS 单行自足达成。
- **S4 ✓**：T5（:65）与高危预告（:117）端口清单统一为全集 3416/3080/61518/3419/3420。
- **S5 ✓**：D2（:50）控件行加 `role="group"` + `aria-label`（成员 label + 策略名）scoped——group 语义落实；label 挂 group 或逐 button 两读均可（逐 button 更利 scoped getByRole，实现时取一即可，不阻塞）。

## 新引入面核查

修订仅落 D1/D2/T1/T2/R2/T5/高危预告七处，逐处复读无与轮 1 证据冲突的新断言；两处排版噪音不阻塞：①D1:49「抽尽以…重洗（…）；抽尽重洗后再抽」措辞重复（语义无矛盾）②T1:61/R2:75「钉牌单发 ：66-71」全角冒号前多一空格。均可在 T0 入库时顺手抹平，不作必改。

## 终审（轮 2）

**APPROVED**——plan 013 修订版可提请 2.5 终审（人工批准后按 WBS T0 启动）。本 log（轮 1 + 轮 2）即阶段 2 正本。
