# Session 09 阶段 2 计划审核输出（两轮全文）

> **落盘说明**：本文件为 Session 09 阶段 2 独立审核 Agent 轮 1 与轮 2（同 Agent 点验）输出原文逐字（主 Agent 转录落盘，无敏感值）。审核对象：docs/plans/2026-09-03-009-s09-multi-apikey-pool-plan.md。

---

# 轮 1：S09 计划审核结论

> **参数头**：审核库 v2 ｜ 阶段 2 ｜ 审核对象 plan 009 ｜ 输入指针：docs/plans/2026-09-03-009-s09-multi-apikey-pool-plan.md、docs/decisions/adr-0008-multi-apikey-pool.md、docs/session-roadmap.md M7 段、src/index.ts、src/credentials.ts、src/providers/shared.ts、src/config.ts、src/client/{controller.ts,section.tsx,locales.ts}、tests/e2e/helpers/loopback-server.ts、tests/helpers/fake-ctx.ts、tests/settings.test.ts ｜ 偏离说明：无。
> 审核执行：独立 general-purpose Agent，与计划制定者上下文隔离，只读。

## 结论

**NEEDS REVISION**（3 项必改；核心设计 D1-D7 大体自洽、WBS 对 roadmap M7 S09 验收全覆盖，但热增 ref 的 gate 生命周期无机制、空池文案与 ADR 正本冲突、T0 清偿范围与实测陈旧面不符——三处不修，执行者必然在 T4/T8/T0 卡死或产出与正本相悖的行为。）

## 必改清单（阻塞）

### 必改 1：热增 ref 的 gate 生命周期未定谳——D1 端口形状与 T4 验收内部矛盾，且 re-prime 触发机制缺失

证据链：
- `src/credentials.ts:56-60`（prime 是 gate watched 集的唯一入口）+ `:68-69`（`#refresh` 对未 watched 的 ref 直接 return——事件不吸纳新 ref）
- `src/index.ts:203-205`（apply 只在载入期 prime 一次）
- `src/settings.ts:57-59, 78-80`（settings 提交只重跑 `resolveConfig`，与 gate 零联动）
- 计划 D1（plan :55）端口写作静态 `refs`；而 T4（plan :71）要求「热增 ref 后 gate 翻转」、roadmap S09 验收要求「池 settings 热生效实测」、T8（plan :75）GUI 流程「添加附加 ref → 写 fake 值 → Configured 翻转」全部依赖它

矛盾：静态 `refs` 端口下热增 ref 永远不被 gate 观测，T4 红测试没有设计好的绿路径。且 re-prime 触发点至少有三种候选设计（settings onChange 扩展 re-prime / reference-updated 事件 ride re-prime / readiness 闭包内懒 prime），语义各不相同——尤其「key 先存、ref 后入池」场景（入池时无事件 fire）只有 settings 提交侧触发才能覆盖。

修法：D1 的 `refs` 改为活端口（`() => readonly string[]` 或每次调用读 live config，与链序 getter 同构）；D3/T4 显式定谳 re-prime 触发点（建议：扩展 `attachSettingsSection` 的 onChange 钩子对当前全池 refs 增量 prime——prime 是加法幂等的，`credentials.ts:58` 只 add 不清），并写明 pre-stored-key 次序的语义归属。

### 必改 2：空池 CREDENTIAL_MISSING 文案与 ADR-0008 Decision 3 正面冲突

- ADR-0008:36：「全池皆未配置时才 `CREDENTIAL_MISSING`（**错误信息列出主 ref 与池**）」
- 计划 D1（plan :55）：「**标准 CREDENTIAL_MISSING 文案，列主 ref 名**——不新造错误码」
- `src/providers/shared.ts:104-108`：走主 ref 路径的现有文案只含 `apiKeyRef`（主 ref），不含池列表

计划把 ADR 定为「决策正本」（plan :18-19），又默选了与正本相悖的最短路径且未声明 deviation。阶段 4/5 对 R2 对峙时会以正本仲裁，执行者将拿着互相矛盾的两份指令干活。

修法（二选一，写入 D1）：(a) 池在 ready 为空时自行抛 `codes.credentialMissing`、消息列主 ref + 全池（错误码不变，「不新造错误码」承诺仍成立）；(b) 保留现计划路径，但 T0 显式修订 ADR-0008 Decision 3 文案条款并留痕 deviation 依据。

### 必改 3：T0 的 🟡 清偿范围（「四处一致性」）与实测陈旧引用面不符

计划 T0（plan :67）声称「roadmap 两处 + STATUS + progress-M5」四处。亲测全仓 grep 结果：
- `docs/STATUS.md`：`:29/:48/:50` 均已正确（9ade4ef 已刷）——无需改
- `docs/session-roadmap.md`：陈旧仅 **一处**（`:66` M5 尾注「文档腿 S09」；`:49/:64` 是正确的顺延历史标记，不该动）
- `docs/progress/progress-M5.md`：陈旧 **两处**——`:77`「S09 手册项」、`:78`「S09 升级演练顺手项」（`:76/:17/:21/:25` 已正确）
- **计划完全漏掉的现役文件**：`docs/progress/progress-M4.md:120`（「S09 升级演练时顺手迁移」）、`docs/00-architecture.md:117`（「按 `docs/upgrade.md`（S09 交付）」）

按 T0 现验收执行，「四处一致」会宣告达成而两处现役陈旧引用存活。修法：T0 清偿清单改为穷举 file:line（roadmap:66、progress-M5:77-78、progress-M4:120、00-architecture:117），冻结面（sessions/audit-logs/旧 plan/CHANGELOG/ADR-0006:51、ADR-0007:31 的历史表述、docs/notes 素材头）显式声明不在清偿范围。

## 建议清单（不阻塞，应吸收）

1. **D1 端口 `codes`/`label` 是死重**：按 D1 自身设计（空池委托 resolveMemberApiKey、resolve 拒绝沿 thunk 传播给 `shared.ts:97-102` 包装），KeyPool 自身不构造任何错误——这两个端口字段无用途。删掉或写明用途，否则执行者会造出无人消费的 seam。
2. **D2「三处同步」实为四件制品**：每成员要动 `XxxSettings` 接口（config.ts:24-81）、`Config` schema（:104-138）、`XxxMemberConfig`（:141-168）、`resolveConfig`（:192-228）；且「ResolvedXxxConfig 两字段转必填」命名失准——每成员已解析类型是 `XxxMemberConfig`，`ResolvedWebSearchConfig` 是顶层。改为「四处」并纠正类型名（typecheck 能兜底 excess-property，但计划作为验收契约应精确）。
3. **被本棒作废的注释/JSDoc 应列入任务清单**：`src/index.ts:96-98`（「apiKeyEnv is launch-static (plan D2), so the refs never change at runtime」——T3 恰好动这块）、`src/settings.ts:10-12` 模块 JSDoc（「Only the hot subset (chain order, per-member timeout, per-member enabled)」）、config.ts 新增字段的 Hot/Launch-static 注记。
4. **client 面两处行锚漂移**：plan :41 的「:204-207 单 refName」实为 `setEnabled` 函数体；refName 派生在 controller.ts:103-117/:229-232。plan :42 的「:209-216 describe 批量」实为 `moveSearchChainEntry`；批量 describe 在 :234-241。语义描述正确、行号须修（摸底实锚自称「亲测」，锚质量是契约的一部分）。
5. **T4 测试落点**：「settings.test 扩展：热切策略下一搜生效」——settings.test.ts 无 provider 组装（只测 LiveResolvedConfig/attach），"下一搜"断言应沿 apply.test.ts:71-153 的 fakeCtx + commitSettings 热通路先例，指名 apply.test 或新 describe。
6. **setKey 波及面可点名**（T5/T6 范围可核验化）：section.tsx:25-26/:47-48/:198-211、controller.spec:174/186/197、section.spec:114/:133、entry.spec:133（`set('TAVILY_API_KEY', …)` called-with 断言）。
7. **T1 probe 可预先收敛**：本审核已实测 `z.union(['order','round-robin','random'])` 在 `@deepseek-ai/schemastery` 运行时可用（非法值拒绝、缺省透传不注入默认）。T1 可直接锚定 union 形态，probe 降级为一行确认 + 留痕；z.string + resolveConfig 校验作为已记录的 fallback。

## 观察清单（留痕）

- **锚点亲验摘要**：credentials.ts:56-65（prime 任意 ref 列表 / per-ref isReady）✓ 逐行吻合；index.ts:149-186 thunk 落点 ✓、:99-105 校验块 ✓、:203-205 prime ✓；shared.ts:87-109 三态 ✓；locales 19 键 ✓（逐一清点）；MEMBERS 镜像 ：40-46 ✓。漂移两处见建议 4。
- **职责分工判定（审核指定疑点）**：计划分工自洽——选 ref 与解析值都在池内（池经 `resolve` 端口取值，provider 只见 `() => Promise<string|undefined>` thunk，三态错误语义全保留在 resolveMemberApiKey）；`resolveApiKey(signal?)` 对 provider thunk 类型可赋值（可选参不破坏 assignability），但 shared.ts:98 调用不传 signal——该参数仅直连 KeyPool 的测试使用，无碍。
- 基线 211 属实（progress-M5:55「Tests 203 passed | 8 skipped (211)」）。
- D3 回归红线可核验：apply.test.ts:29-68（gate 接线四测）+ e2e 七场景（loopback.test.ts:68-229）+ provider 单测天然覆盖单 ref 面。
- D5 设施声称属实：loopback-server.ts:51-53 arrivals 与新增 auths 平行可行、七场景 arrivals 断言零破坏；fake-ctx.ts:79 常量 'fake-key' 扩展 `values` 后向兼容。
- D6 配方完整：S06/S07 先例在档（session-06:117/186-187 `--no-open` 教训、session-07:63/90/184 3413 端口 + LISTEN 过滤 kill 教训），3414 为新端口无冲突。
- round-robin 游标语义（就绪集变化按池序重建取模）可测、random「∈ 就绪集不断言分布」诚实口径成立、T7 牙齿探针（改 order→auths 红→还原）可操作。
- WBS 对 roadmap S09 验收七条逐项有着落（唯一内容级出入即必改 2 的文案条款）；TDD 分类（T1-T6 红→绿 / T7 验证+牙齿 / T8 实测棒 / T10 独立）恰当；T2「模块缺失」红形态可证（import 失败即红证据）。
- 债务映射与 progress-M5/ADR-0008 §7 一致；D7 增量披露口径与 S08「零漂移」切换表述清晰。

**终判**：修完必改 1-3 后此计划可执行；必改 1 是唯一会让执行者在任务中途被迫现场设计核心机制的点，务必在计划内定谳。

---

# 轮 2：阶段 2 复审（同 Agent 点验）

> **参数头**：审核库 v2 ｜ 阶段 2 复审 ｜ 续用轮 1 同一审核 Agent ｜ 复核范围：修订点 + 轮 1 留痕忠实性；无新命令需求——全部声称可对照轮 1 亲测数据与修订版全文判定。

## 结论

**APPROVED**（残留项 6 条，全部非阻塞、均有既定守护机制，随 T0 落盘 commit 或对应任务顺手吸收）

## 逐点点验

**1. 必改 1（热增 ref gate 生命周期）——闭合（留一条次序措辞残留）。** D1 refs 已为活端口 `() => readonly string[]`（plan :65，与链序 getter 同构）；D3④ 定谳触发点 = settings 提交侧、prime 加法幂等（credentials.ts:58 Set.add 只增不清，轮 1 已亲证）、「key 先存、ref 后入池」由提交侧覆盖（入池无事件 fire 的论证正确）、无 settings 服务 = 载入期 prime 一次（plan :67⑤，与现状同构）；T4 落点改 apply.test.ts 且新增用例 ②③（plan :81）。设计闭环。**残留 R1**：D3④「committed 后 gate.prime(当前全池 refs) **再** live.refresh()」次序反了——refs 活端口读 `live.current()`，refresh 前 prime 取到的是旧池，热增 ref 不会被吸纳；正确次序 = `live.refresh()` 后（或内部）prime。T4 用例 ② 恰好钉死该行为（红→强制纠正），故不阻塞，但规范文本须改。

**2. 必改 2（空池文案）——闭合，建议 1 随之消解。** D1③ 池自抛 `codes.credentialMissing`、消息列主 ref + 全池（plan :65）= ADR-0008:36 正本一致；错误码不新增承诺保持。`codes`/`label` 在 ③（池抛）与 ⑤（透传 shared.ts 三态）两处均有真实用途——轮 1「死重」判定消解。「选 ref 在池、解析值三态在 shared.ts」职责表述与 shared.ts:87-109 实际签名吻合。T2 验收列「文案列池」钉死（plan :79）。

**3. 必改 3（T0 清偿范围）——闭合。** T0（plan :77）穷举清单与轮 1 亲测集逐项一致：roadmap.md:66 / progress-M5.md:77-78 / progress-M4.md:120 / 00-architecture.md:117（四文件五处）；冻结面声明覆盖 sessions/audit-logs/已收官 plan/CHANGELOG/ADR-0006:51、ADR-0007:31/notes 素材头；复验口径（grep S09 仅剩冻结面与 M7 语境）可机械核验。STATUS 移出清偿面、归入启动刷新，划分正确。

**4. 建议 2（四件制品）——D2 到位（留一处 T1 行残留，见 R3）。** D2「五成员 × 四件制品」+ `XxxMemberConfig` 类型名纠正（plan :66）。

**5. 建议 3（作废注释）——到位。** D3 尾列全三项：index.ts:96-98 / settings.ts:10-12 / config.ts 新字段注记（plan :67）。

**6. 建议 4（行锚漂移）——清零。** 修订版 :51-52 为 :103-117/:229-232（refName 派生）与 ：234-241（describe 批量），与轮 1 亲测一致；全文无 ：204-207/:209-216 残留。

**7. 建议 5/6/7——到位（留 probe 旧表述残留，见 R2）。** T4 落点指名 apply.test.ts 并注明 settings.test 只测 LiveResolvedConfig（plan :81）；setKey 波及面 D4 内 file:line 点名，六簇与轮 1 亲数一致（plan :68）；z.union 锚定为 schema 形态 + 验证矩阵行改「一行确认留痕」（plan :66/:104）。**残留 R2**：probe 旧框架三处未同步——T1 行仍写「probe 定 schema 形态」（:78）、背景实锚仍写「枚举面待探……两态都在 T1 留证」（:56-59）、风险首条仍写「schemastery 枚举形态未知」（:138-139）。

**8. 轮 1 留痕节忠实性——忠实。** plan :28-36 摘要与轮 1 实际输出逐项对得上。

## 残留项（非阻塞，建议随 T0 落盘 commit 一并吸收）

- **R1**（最优先）：D3④ 次序改为 refresh → prime（如 written，prime 读到 refresh 前的旧池；T4 ② 已守护，红线自纠）。
- **R2**：probe 旧表述三处同步（T1 行 ：78、背景 ：56-59、风险 ：138-139 → 「union 已锚定，一行确认」）。
- **R3**：T1 行「（interface/schema/resolveConfig）」三件速记 → 对齐 D2 四件制品（漏 XxxMemberConfig 有 typecheck excess-property 兜底）。
- **R4**：T2 内容列「空池回退主 ref」为轮 1 旧措辞，与 D1③ 池自抛不一致（验收列已正确）——改为「空池抛 credentialMissing 列池」。
- **R5**：T4 用例 ② 步骤「热增 ref → prime 吸纳 → 配置该 ref」与括注「（pre-stored-key 次序）」歧义——钉死步序为「先配置该 ref 值 → commitSettings 热增 → prime 吸纳即就绪（无事件路径）」，才算真证提交侧触发。
- **R6**：D3④ 补一句显式约束：`onCommitted` 须为插件侧在既有 onChange 钩子内组合（宿主 installSection hooks 形状 {setSource, onChange} 不可扩展——settings.test.ts:89、fake-ctx.ts:15-18 为证）；附加时点（attach 时 onChange 亦触发一次 prime）无害，可留痕。

**复审判定**：三项必改的修法实质闭合且与代码实测一致；残留均为措辞同步与次序勘误，每一项都有已写入计划的守护机制（T4 ② 红线 / D2 单源性 / typecheck / 验收列）兜底，不存在「执行者被迫现场设计」或「产出与正本相悖」的路径。**APPROVED**，可进入阶段 2.5 人工终审。
