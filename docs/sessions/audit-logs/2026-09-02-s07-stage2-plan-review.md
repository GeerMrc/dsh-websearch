# Session 07 阶段 2 计划审核输出（两轮全文）

> **落盘说明**：本文件为 Session 07 阶段 2 独立审核 Agent 轮 1 与轮 2（同 Agent 续审）输出原文逐字（主 Agent 转录落盘，无敏感值）。审核对象：docs/plans/2026-09-02-007-s07-priority-override-i18n-plan.md。

---

# 轮 1：Session 07 计划审核结论（阶段 2 独立审核）

> **参数头**：审核库 v2 ｜ 阶段 2 ｜ 审核对象 plan 007 ｜ 输入指针：docs/plans/2026-09-02-007-s07-priority-override-i18n-plan.md、docs/session-roadmap.md（S07/S08 行）、docs/sessions/2026-09-02-session-06.md、docs/progress/progress-M4.md、本仓与宿主仓代码面（锚点亲验）｜ 偏离说明：无。
> 审核执行：独立 general-purpose Agent，与计划制定者上下文隔离，只读。

## 结论：**NEEDS REVISION**（必改 ×1；吸收后可直批，无需重开摸底）

## 必改清单（阻塞 APPROVED）

**M-1｜T2 会在 client 面留下一个 typecheck 红的 commit——WBS 缺一处机械配套改动**
- 证据链：T2 给 `SectionSnapshot` 增两个必填派生字段（plan:75）。全仓 `SectionSnapshot` 字面量构造点仅两处：`src/client/controller.ts:114-121`（T2 自改）与 `tests/client/section.spec.tsx:41-50` 的 `makeSnapshot()` 完整对象字面量（spec 内 5 处使用）。`tsconfig.client.json:8-13` 的 include 显式含 `tests/client/**`，故 T2 提交后至 T3 修复前，`pnpm typecheck`（client 面）必红（TS2739 缺属性）。计划 T2 验收要点（plan:75）只写了 controller.spec，未提 section.spec 的 helper 适配；T3 才"扩行为"。这正是 S06 🟡（修复滞留工作区、提交态门墙红三棒）的失败家族——计划自己在 T5 引用该教训（plan:78「提交态——git status 前置，S06 🟡 教训动作化」），不应在 WBS 里复刻同类缺口。
- 修法：T2 行补一句「含 `tests/client/section.spec.tsx` makeSnapshot 机械补两字段（保 client typecheck 绿）」，或在 T2/T3 前置关系里显式声明该 helper 归 T2。一行改动，行为断言仍归 T3。

## 建议清单（不阻塞，应吸收）

1. **R5「与 S06 逐位口径」消歧**（plan:91）：node 面（index.js/index.d.ts）本棒零变更、应逐字节零漂移；client.js 因新 UI 必然增长。建议写明「node 面零漂移 + client.js 记录新值」，避免执行者误把 client.js 增长当失败。
2. **T2 补一句语义**：在默认序（settings 无显式链）上执行移动 = 把生效序物化为显式数组写入 settings（这正是徽章翻 pinned 的机制）。行为测试会钉住它，但一句话消除执行者歧义。
3. **D5 与 T6 措辞对齐**：D5 说「凭据只写 fake 值（断言后 unset 复原）」(plan:65)，T6 收窄为「零接触」(plan:79)。建议 D5 补「本棒预期零接触（见 T6）」，免得执行者预做准备。
4. **T8 的 M4 判定显式引用 D6 标准**：四环节中「热生效」无浏览器直测面（设置页无搜索触发点），只能复合证据。风险节已兜底（plan:137-138），建议 T8 行直接写「按 D6 分层标准判定」，让阶段 4/5 与阶段 6 用同一把尺。
5. **T0 ⑤ 指针化 session-06 门墙节时保留「T7/T9 两次亲跑一致」语境行**（session-06.md:97）：指针化删数字不删事实主张。

## 观察清单（留痕）

- 阶段 0 审核自述与仓内记录交叉一致：13 枚 commit 亲点吻合（`3e4eb50..a9a228b`）、27 client tests = 3+10+8+6、16,516B = progress-M4:67；其正本随 T0 落盘的安排可接受。
- T8 本地 `--no-ff` 合入 master 不属高危清单「PR merge」（S06 同款声明与执行先例：session-06:190-191）。
- check-cjk 扫描域 = `src/**`（不含 tests/）：roadmap「字典外文案」指模型可见文案、居 src，读法成立；tests 域可留后续。
- 现存 `src/` 无正则字面量、无含 `//` 的模板串（grep 实证），注释剥离状态机今日风险低；T4 双向验证兜格式漂移。
- pack 仍五件：`files: ["lib","cordis.patch.yml"]`（package.json:20-23），scripts/ 不入 tarball，`check:i18n` 仅以 scripts 条目随 package.json 发布面存在。
- 审核对 D1/D6 的裁定：**均成立，不触发范围变更回路**。D1——`src/client/index.ts:26` inject 五面实证 `searchProvider` 无获取途径（架构 :72 组合标量属宿主组合层），settings 显式=钉死与 controller.ts:54 注释自洽；D6——settings.ts 模块注释「chains read order/timeout through getters at call time」+ settings.test.ts:124-140 热链实测 + S05a 锚点（roadmap:33）+ T2 载荷断言，复合闭环成立；S08 行「顺序保持」（roadmap:51）原文核对属实。TDD/脚本/治理三分类（plan:4-6）亦确认（T1-T3 TDD、T4 命令实证、T0 机械豁免候选确认）。

## 锚点核对结果摘要

**25 组锚点亲验全部命中，零偏差**（本仓 20 组 + 跨仓/文档 5 组）：section.tsx:97-113、controller.ts:48-52/:54/:99-122/:193-202、index.ts:26、config.ts:11-18、locales.ts:17-76（15 键）、settings.test.ts:124-140/:135-136、CJK 四文件行号（独立 grep 重验：全仓恰 4 文件全在注释、字面量零命中）、架构 :72/:108、ADR-0002/0004 在档、S02 H3/H4（session-02:36/42）、05b:89-92、plan-006 D1/L-2 归属、session-06:97-105 + progress-M4:49-59/:71 三载体誊写（🟡-1 证据坐实）、STATUS.md:26 vs :45（🟡-2 ⏳/🚧 不一致坐实）、dont-do 第三条三要素齐（docs/dont-do.md:26-30）、governance §3.4.7 高危清单对照（docs/governance-sessions.md:242-247）+ audit-gate「上一轮违规下一轮回收」机制（audit-gate.md:88-89，T0 修订 session-06 属机制内动作且已披露）、package.json（无 tsx 依赖、engines ^22.19 线内 .mjs 可行、scripts 挂点在）、/tmp 隔离配方与 3413 端口无冲突。

**唯一发现 = M-1**。M-1 修入后本审核立场可更新为 APPROVED（同 Agent 复审即可，无需重开摸底）。

---

# 轮 2：阶段 2 复审（同 Agent 续审）

> **参数头**：审核库 v2 ｜ 阶段 2 复审 ｜ 续用轮 1 同一审核 Agent ｜ 复核范围：修订点 7 处（M-1 + 建议 ×5 + 轮 1 留痕忠实性），未重开全量锚点核对。

## 结论：**APPROVED**（7/7 修订点闭合，残留项 ×0）

## 逐点复核

1. **M-1——闭合**。plan:84 内容列已含「机械配套：tests/client/section.spec.tsx makeSnapshot 补两新字段（保 client typecheck 全程绿…行为断言仍归 T3）」，验收要点加「T2 提交态 typecheck exit 0」。破坏面唯一构造点（section.spec.tsx:41-50）已入 T2 范围，且提交态验收使红 typecheck commit 不可能发生。附带核实无新矛盾：T2 时点 section.tsx 尚不消费新字段（不破坏 typecheck），makeSnapshot 多两字段对既有 8 行为无影响（vitest 不受字段增加干扰）。
2. **建议 1——闭合**。plan:100 R5「node 面 index.js/index.d.ts 本棒零变更应逐字节零漂移；client.js 因新 UI 记录新值」——判定尺已消歧。
3. **建议 2——闭合**。plan:84「默认序上移动 = 把生效序物化为显式数组写入 settings——徽章翻 pinned 的机制本身」——语义到位。
4. **建议 3——闭合**。plan:74 D5「凭据面本棒预期零接触……若任何断言意外触凭据则只写 fake 并 unset 复原，见 T6」与 T6（plan:88）口径一致，指针关系成立。
5. **建议 4——闭合**。plan:90 T8「按 D6 分层标准判定，与阶段 4/5 同一把尺」+ 验收要点复合证据链三分（key/启停=S06 浏览器、排序=本棒浏览器、热生效=S05a/S06 node 链）+ 不足保持 🚧——与风险节（plan:146-147）一致。
6. **建议 5——闭合**。plan:82 T0⑤「保留『T7/T9 两次亲跑一致』事实主张行，只指针化数字清单」。
7. **轮 1 留痕——忠实**。plan:32-39 的必改/建议×5/观察×5 与轮 1 输出逐项对应，「25 组锚点亲验全命中零偏差」「D1/D6 成立不触发范围变更回路」等关键裁定均如实转录，无措辞性失真。两处微注（非残留）：①观察清单压缩时省去「阶段 0 自述交叉一致」一条——属审核工作流注记，不影响执行面；②「TDD/脚本/治理三分类确认」未入摘要——在轮 1 全文里，按「正本 = 本文件两轮全文」的转录约定保全，无需回填 plan。plan:84 正文中的「M-1 必改」标签为活引用（定义于同文件留痕节），不属死引用泄漏。

## 残留项

无。轮 1 必改 ×1 已闭合，建议 ×5 全数吸收，观察项处置妥当。

**复审结论供留痕**：轮 2 **APPROVED**（同 Agent 复审，7/7 闭合、零残留；无需第三轮）。计划可推进阶段 2.5 人工终审。
