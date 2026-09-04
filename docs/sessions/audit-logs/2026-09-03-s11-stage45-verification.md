# Session 11 阶段 4/5 独立验证输出（正本转录）

> 落盘说明：本文件为 Session 11 阶段 4/5 独立验证 Agent 输出原文逐字。
> **参数头（S12 T0 补录）**：审核库 v2｜阶段 4/5｜Session 11｜输入指针：plan 正本 011 + commit 范围 32afef7..65bef4e（feat/s11-adjustments）+ 测试命令（pnpm test/typecheck/lint/build/pack/check:i18n）｜偏离说明：当时未按 v1.2 记参数头，本行按 log 基线行补记；当期提示词原文不可考（S12 阶段 0 🟡9）。本 log 结论 BLOCKED 为在盘正本——收官曾误入账 PASS，S12 阶段 0 🔴2 勘正。

---

# S11 阶段 4/5 独立验证报告（T8）

基线：`feat/s11-adjustments@65bef4e`，工作区 clean，提交链与记录线逐一相符（32afef7 在 master，其余四枚在分支）。全程只读 + 测试实跑，零临时注入，零还原残留。

## 一、R1-R5 逐条对峙

**R1 开关置灰 — FAIL（实现✅，证据条❌）**
- 实现在源码亲见：`src/client/section.tsx` MemberCard switch `disabled={!member.configured}`（cursor/opacity 联动同点）。
- **但置灰 jsdom 断言不存在**：`tests/client/section.spec.tsx` 13 条全读，`disabled` 断言仅 Clear 按钮（:137/:141，S06 既有）与 move 边界（:177-180）；无任何「未配置成员 switch disabled + 配置后可开」断言。
- 浏览器腿（T6）零证据：`/tmp/dshws-s11/` 不存在，无 T6 commit，3416/3417 验证时点 LISTEN=0。

**R2 单槽逗号值 — 核心逻辑 PASS，证据条 FAIL（`!` 渲染断言缺 + 浏览器腿缺）**
- 亲跑全绿：`keys.test.ts` **9 passed**（单 key 不变/拆分轮换 k1→k2→k3/值变更游标取模/random 注入 rng/主值未存列 ref/空与纯逗号列 ref/上限 11 把 requestFailed 含 "10"/resolver 拒绝/预 abort）；`loopback.test.ts` **11 passed**（:241 逗号值 `'k1, k2, k3'` → wire `['Bearer k1','Bearer k2','Bearer k3']` 轮换 + :259 gate 跳过腿净增）；`tests/providers` **94 passed**（6 files）。
- extras 零残留 grep 亲验：`extraApiKeyEnvs/extraRefs/ExtraKeyRow/extraKeys/addKey/removeKey` 在 src/+tests/ 零命中（`refName` 命中为成员凭据引用名字段，非被删 locale 键）。
- `keyFieldNote` 渲染在源码（section.tsx:240）+ locales.spec:28-29 parity 断言在档；**但 jsdom 渲染断言无**；「GUI 逗号保存（浏览器）」无证据（T6 未做）。

**R3 优先级过滤 — FAIL（实现✅，jsdom+浏览器断言腿❌）**
- 过滤实现在源码亲见：section.tsx searchChain 渲染 `.filter((id) => members.some(m.configured))`；数据面零漂移亲证（loopback 11 + 全量 250 全绿）；`check:i18n` exit 0 亲跑（**20 keys parity + 17 files 零 CJK**）。
- **「未配置成员不渲染」jsdom 断言不存在**（section.spec 全部 fixture 均 configured:true）；浏览器腿无证据。

**R4 门墙七命令（提交态串行亲跑）— PASS**
①前置 `git status --short` clean → ②`pnpm test` **26 files passed + 1 skipped（27）；Tests 241 passed | 9 skipped (250)**（与增量披露逐位一致；S10 基线 257|9(266) → −16）→ ③`pnpm typecheck` exit 0 双面 → ④`pnpm lint` **0 warnings 0 errors（47 files，96 rules）** → ⑤`pnpm build` index.js **57.96** / index.d.ts **27.04** / client.js **21.57 kB**（S10 58.09/28.70/27.30 → 三件全缩，extras 退场缩减披露成立）→ ⑥`npm pack --dry-run` total files **5** → ⑦`check:i18n` exit 0 → 后置 `git status --short` clean。

**R5 五子证据 — 部分 PASS，一项缺口**
- 治理清偿 PASS（全亲读）：S10 stage2 log **[reconstructed]** 标注 + 轮 3 去重 + 落盘说明 transcription 修复在档；progress-M7:18 与 progress-M5 M7 行镜像推进（S11 进行中括注 + ADR-0008〔superseded→0011〕）；`grep '^## '` CHANGELOG 序 **S10:15→S09:51→S08:89→…→S01:380 严格反向**；MEMBERS 导出 diff 亲读（32afef7）。
- 门墙 PASS（R4）。收尾/翻转 = T9 待做（按指令不算 FAIL）。
- **audit-log 三份在档：不满足** — S11 仅 stage0 在档；**`2026-09-03-s11-stage2-plan-review.md` 未落盘**（plan :40-41/:47-48 两处承诺「正本将随 T0 落」，T0 实物 32afef7 仅含 S10 stage2 修复）；stage45 = 本验证（随 T8 落）。

## 二、三问交叉验证

**1. 安全 — PASS**：config schema 六成员仅存 `apiKeyEnv` 引用名（src/config.ts:140-178 亲读），key 值只走 credentials 服务（controller.setKey → setCredential）；src/ `sk-*`/`fake-key` 字面量扫描零命中；逗号串整体存凭据层符合 ADR-0011 Rationale 零明文纪律。3416 零接触：验证全程未起服务/浏览器，三端口 LISTEN=0，无 scratch 残留。

**2. 契约 — 大体 PASS，一项 FAIL**：单 key 行为零变化（keys.test #1 + 既有 loopback 场景零漂移 + `keySelection ?? 'order'` 兜底 config.ts:262/270/277 亲读）；KeyPool 单 ref 活端口（src/keys.ts:65-67 refs() 返回 `[ref]`，index.ts:119-139 工厂亲读）。**move 可见序列交换 jsdom 断言缺失**：实现在（controller.ts `moveSearchChainEntry` delta 方向跳过未配置交换）但 controller.spec move 用例全六成员 configured（:236-238/:259-261）或全未配置，无混合序列跳过交换用例——plan T4 验收点名的五 jsdom 断言（置灰/过滤/可见序列交换/单槽载荷/`!` 文案）**仅「单槽保存载荷」在档**（controller.spec:181 `[[DEFAULT_REF, 'sk-fake-tavily']]`）。

**3. 前瞻 — PASS**：ADR-0008 status superseded→0011 + ADR-0011 `supersedes: ADR-0008` 双向链完整；ADR-0012 未提前落盘（S12 属）；STATUS/roadmap/plan 三处 S12 策略棒（random 不放回变体 B + ADR-0012）口径一致，本棒三策略保留作用于 key 序列即其语义基础；ADR-0011 Consequences 已留 S12 手册注记（已落 extraApiKeyEnvs 部署需手工删除）。

## 三、发现清单

- 🔴 **T4 四类 jsdom 断言未交付**：置灰态/过滤态/可见序列交换/`!` 文案断言不存在（两 spec 全读核对）——R1/R3 判 FAIL 的直接根因，plan T4 验收要点字面不满足。
- 🔴 **T6 浏览器实测棒未做**：R1/R2/R3 三条的浏览器腿零证据（/tmp/dshws-s11 无、无 commit、端口空闲）。
- 🔴 **T5 牙齿探针未兑现**：验收要点「探针红签名入 commit」，34a6325 全文无探针记录。
- 🔴 **T7 未做**：progress-M7 无 S11 批次表/门墙表；S11 Agent Note（docs/notes/2026-09-03-s11-adjustments.md）不存在；「进行中」行仍写「T0 进行中，T1-T9 待执行」，与 T1-T5 已提交实物不符。
- 🟡 **S11 stage2-plan-review audit-log 未随 T0 落盘**（plan 两处承诺；T0 实物不含）。
- 🟢 D5 的 MemberSnapshot `memberId` 字段未落，实现以 `dshws-${m.key}` 内联对齐（行为等价；S12 序列编辑器如需 memberId 再补）。
- 🟢 T0 主体提交漏列 CHANGELOG/STATUS → 2f7c9b0/65bef4e 两次补交（commit message 已自曝，诚实披露）。
- 🟢 34a6325 自曝「中间提交 566bf22 曾带红落库→soft reset 合并」（提交态红线第二次，坑已入踩坑节）。

## 四、最终结论：**BLOCKED（需补完后复验方可收官）**

核心逻辑、门墙、治理清偿、安全/契约主面全绿（本人亲跑数字如上）；但 T8 被提前触发——T5 探针、T6 浏览器棒、T7 台账/Note 未执行，R1/R2/R3/R5 的字面证据条不满足。**补完清单**：①补四类 jsdom 断言（section.spec 置灰+过滤+keyFieldNote 渲染、controller.spec 混合序列可见交换）②T6 浏览器棒（3417 scratch，3416 零接触）③T5 探针红签名留痕 ④T7（progress-M7 S11 表 + Agent Note + 进行中行勘正）⑤S11 stage2 audit-log 落盘 → 重走 T8 对 R1/R3 复验 → T9 收官。