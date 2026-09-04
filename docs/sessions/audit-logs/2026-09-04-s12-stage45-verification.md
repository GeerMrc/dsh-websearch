# Audit Log — S12 阶段 4/5 独立验证输出（正本转录）

- **参数头**：审核库 v2｜阶段 4/5｜Session 12｜输入指针：plan 正本 docs/plans/2026-09-04-012-s12-uiux-alignment-plan.md + commit 范围 921e31b..c73cdfb（8 枚，自行 git log 复核）+ 测试命令（corepack pnpm test/typecheck/lint/build + npm pack --dry-run + check:i18n）+ 阶段 0 正本 …-s12-stage0-review-of-s11.md + S11 stage45 正本｜偏离说明：输入包按事实槽位扩列 R6 治理修复批核验清单与 S11 案卷闭合判定任务（plan 012 R5/D6 认领的复验义务）；阶段 5 冒烟含探针 A 独立重演。

- **输出原文**（独立 Agent 逐字落盘，2026-09-04）：

---

# S12 阶段 4/5 独立验证报告（T8）

**参数**：独立 Agent｜对象 feat/s12-uiux-alignment@`c73cdfb`（基线 master `921e31b`）｜node v24.3.0 / corepack pnpm｜工作树前置 clean、HEAD 亲证 `c73cdfb`｜只读 + 测试实跑 + 一次已还原的探针注入，重负载串行。已验锚点台账（progress-M7:180-189）所涉 node 侧文件（src/credentials.ts、src/index.ts、providers/shared.ts）经 `git diff 921e31b..c73cdfb --name-only -- src/ '!:!src/client'` 亲证**输出为空**——文件未变，node 侧锚点引用台账；本棒新改的 src/client 三文件不在台账内，全部全新 file:line 亲读。

## 一、R1-R7 逐条对峙

### R1 反馈① — PASS
- **代码**：`src/client/section.tsx:291-295` — `Tooltip label={keyFieldNote + keyFieldNoteExample} side="bottom" delayMs={400} maxWidth={320}` 包裹可聚焦 `<button type="button" aria-label={t('keyFieldNote')}>`，`IconQuestionOutline14` 居内（导入 :17）。`locales.ts:70/96`（en/zh）`keyFieldNoteExample` 在档。内联 span 已删：全文件 keyFieldNote 仅剩 Tooltip label 与 aria-label 两处，无渲染性 span；`tests/client/section.spec.tsx:286` 断言 `queryByText(en.keyFieldNote)` 为 null 锁死删除。
- **断言**：section.spec.tsx:282-295（anchor 存在性 + focus 出 bubble 含说明与示例 + blur 收）。
- **机制亲证**：宿主 ui-primitives lib/index.js（:2717 起）— `onFocus → show()` 立即、`onMouseEnter → showAfterHoverDelay()`（setTimeout delayMs）、cloneElement 向单一 anchor 注入 handlers——Agent Note「focus 腿无延迟」「裸 svg 不可作 anchor」两句与宿主实现逐点吻合，jsdom 手法（focus 不需 fake timers）成立。
- **i18n（T1 时点 21 键）**：历史时点无法廉价重跑；算术链自洽（S11 终态 20 + keyFieldNoteExample = 21 → T4 再 +chainDefaultHint = 22 终态，终态亲见 R7⑥）。

### R2 反馈② — PASS
- **代码**：`section.tsx:69-82` — `switchStyle(configured, enabled)`：`configured && enabled → --dsw-alias-state-success-primary`，否则 `--dsw-alias-border-l2`；使用点 :277（cursor/opacity 联动），`disabled={!member.configured}` :275 保持。feedback `role="status"` :316。
- **断言**：section.spec.tsx:255-280 三态矩阵齐——未配置+enabled 默认 true → 灰+disabled（:262-264，正是修复的误导绿）；已配+关 → 灰（:265-267）；已配+开 → 绿（:268-269）；role="status" 断言 :277-279。aria 语义（role=switch/aria-checked）既有断言 :104-109 未动。

### R3 反馈③ + S11 🟡1 — PASS（附 🟡-2 发现，见发现清单）
- **labelOf**：`section.tsx:85` = memberId→MEMBERS.label，未知 id `?? id` fallback。渲染+aria 双口径：搜索链 :129/:133/:142，fetchChain :159（不过滤，:157 直映）。`data-testid` id 级 :128；onClick 载荷 id 级 :135/:144 → controller.spec:192-194 断言 `'dshws-exa'`/`'dshws-tavily'`。
- **禁用边界用过滤后可见列表**：`visibleSearch` 过滤 :97-99；↑ `index === 0` :134；↓ `index === visibleSearch.length - 1` :143（全量链长旧错位已消除）。
- **MemberSnapshot.memberId**：`controller.ts:78`（JSDoc 声明对齐键用途）+ deriveSnapshot :120 落地。
- **负路径过滤断言（🟡1 清偿）**：section.spec.tsx:297-314 — Exa+AnySearch 未配置时可见列表恰为 `['Tavily','Perplexity','Firecrawl','DeepSeek']` 且末位可见项 ↓ disabled、其 ↑ 可用。
- **fixture 6 成员**：section.spec.tsx:16-17（BUILT_IN/BRANDS 六项）+ :33-42（defaultMembers 六卡，含 anysearch）。
- **node 链语义零漂移**：全量亲跑中 loopback 11 passed、apply 17 passed 亲见（R7①）。

### R4 反馈④ — PASS
- **代码**：`section.tsx:205-234` ChainStateBadge — pinned 态 :206-215 仅 `chainPinned` 文本无 ⓘ；default 态 ⓘ Tooltip label = `chainDefaultHint + MEMBERS.map(label).join(' → ')` :222-231，顺序从 MEMBERS（:40-47，与 `BUILT_IN_MEMBER_ORDER` controller.ts:50 同源）动态派生，零硬编码。
- **断言**：section.spec.tsx:220-242 — ⓘ anchors ×2、tooltip 含 hint + 六品牌顺序串、blur 收、pinned 态 `queryByRole('button', {name: chainDefault})` 为 null。
- **22 键**：locales.ts:17-39 union 枚举亲数 = 22；R7⑥ 亲跑 "22 keys, union/en/zh parity holds"。

### R5 S11 遗留腿清偿 — PASS
- **混合序列交换断言（🟡2）**：`tests/client/controller.spec.ts:283-319` — exa/perplexity 未配置时 move firecrawl 向上跳过两个未配置成员与 tavily 交换、未配置成员保持绝对槽位（全量 patch 数组断言 :295-312）、末位可见项向下越界 not-ok 零 remote 调用（:316-318）。
- **双牙齿探针红签名（🟡3）**：`git log -1 c040a98` message 原文亲见——探针 A「红 1 failed|16 passed（patch 序列断言）」、探针 B「expected Bearer k1×3 恒序红」。**且本人独立重演探针 A**：临时 `while (false && …)` 化跳过循环 → `vitest run tests/client/controller.spec.ts -t "mixed configured set"` → **1 failed | 16 skipped，patch AssertionError** → `git checkout --` 还原 → status clean。断言真实咬合，非空转。
- **浏览器五断言（🟡4）**：progress-M7:107 T7 行九断言留痕 + /tmp/dshws-s12/ 实物亲证（boot.log 载 `--port 3418`、tgz、dump 两份、home/ 树）。`.credentials.yaml` 亲读 = **`refs: {}`**（fake 值全清，唯一 record 为浏览器会话 grant）；`lsof :3418` LISTEN=0（scratch 已停）；3416/3080 LISTEN=0（零接触）；残留 pid 61518 仍在运行未 kill（`ps` 亲见，01:06:05 启动占 3417，DSH_HOME=/tmp/dshws-review）——与 T7 披露逐字一致。
- **超限拦截点修正披露**：T7 行披露「凭据层诚实落盘不拦、拦截在搜索期」——`src/keys.ts:101-107` fail-loud 实现亲读 + 单测在档（见 🟡-3 转录勘误），keys.test:89-95「11 把 → requestFailed 含 10」在全量亲跑中通过。

### R6 治理修复批 — PASS（附 🟡-1 发现）
- **S11 记录**：`docs/sessions/2026-09-03-session-11.md` 在档，:7-14 reconstructed 声明 + 来源清单，:16 前序审核确认节、:124 下一 Session 启动指令节两新节齐；不可考处（2.5 批准引文 :51-52）明写「不可考」不虚构，符合 D5。
- **progress-M7**：T8 勘正注记 :76（~~PASS / COMPLETE~~ 入账撤销 + BLOCKED 正本口径）；技术债台账「S11 遗留腿」行 :170 在档（翻账注记按 plan 归 T9）。
- **roadmap**：头部规则行 :9 改写（重排让位记录在案）；M7 段 S11 补登行 :56 ✅、S12-S14 行 :57-59、M5 段 S15 行 :68（原 S12 行标注）、M6 段 S16 行 :76、M5 里程碑行 :70「文档腿 S15」、M7 脚注 :61「Session 14 证据」。
- **grep 令牌集**：S1[1-6]／策略棒／溯源／手册／验收准备／顺延／插行／Session 1[1-6] 八项在活引用面（STATUS/roadmap/progress-M4/M5/M7/00-architecture/dont-do/CHANGELOG）穷举——**除 ADR 三处前向引用（🟡-1）外零悬空**；S09 批次节内「S09→S12」为历史记录，豁免。
- **CHANGELOG**：S11 条目 :15-40 居顶、S10 条目 :43 随后，反向时序正确；补录说明 + 诚实标注（遗留项）段齐。
- **STATUS**：三处总览/指针点齐——:27 M5「文档腿 S15」、:29 M7「S11 ✅〔缺口→S12 闭合中〕」、:53 下一棒 S13→S14→S15→S16；台账 :47 S12 行 🚧；位置块 :49-56 T0 启动刷新。
- **audit-log 参数头 ×3**：S11 stage0:3、stage2:3、stage45:4 均含「参数头（S12 T0 补录）：审核库 v2｜阶段｜Session｜输入指针｜偏离说明」五字段。
- **dont-do 两条新条目**：dont-do.md:42-46（🔴1 形态）、:48-52（🔴2 形态），各含 ❌/✅/来源 三要素，归「收官证据链（Session 12 阶段 0 定谳）」节。

### R7 门墙七命令（提交态 c73cdfb，本人亲跑） — PASS，零偏差

| # | 命令原文 | 实测数字 | vs 声称 |
|---|---|---|---|
| ① | `corepack pnpm test` | **Test Files 26 passed \| 1 skipped (27)；Tests 248 passed \| 9 skipped (257)** | 一致 |
| ② | `corepack pnpm typecheck` | exit 0（`tsc --noEmit && tsc -p tsconfig.client.json` 双面） | 一致 |
| ③ | `corepack pnpm lint` | **0 warnings 0 errors，47 files，96 rules** | 一致 |
| ④ | `corepack pnpm build` | **client.js 24.03 kB / index.js 57.96 kB（57964B）/ index.d.ts 27.04 kB（27039B）** | 一致；node 侧两件零漂移 |
| ⑤ | `npm pack --dry-run` | **total files 5** | 一致 |
| ⑥ | `corepack pnpm check:i18n` | **22 keys parity + 17 files zero CJK**，exit 0 | 一致 |
| ⑦ | `git status --short` | 前置 clean + 后置 clean，HEAD 恒 `c73cdfb` | 一致 |

## 二、S11 案卷闭合判定（🔴2 证据部分）

对照 stage45 BLOCKED 补完清单（2026-09-03-s11-stage45-verification.md:55）逐腿：

| 腿 | S12 清偿证据 | 判定 |
|---|---|---|
| ① 四类 jsdom 断言 | 置灰 section.spec:244-253／过滤负路径 :297-314／keyFieldNote 渲染 :282-295（按 plan 012 R1 授权改为 Tooltip 形态）／混合序列交换 controller.spec:283-319 | **已清偿** |
| ② T6 浏览器棒 | S12 T7 九断言（scratch 3418），实物 /tmp/dshws-s12/ + progress-M7:107；端口 3417→3418 改道有披露（pid 61518 未 kill 亲证） | **已清偿** |
| ③ T5 探针红签名留痕 | c040a98 message 双签名 + 本人独立重演探针 A 红亲见 | **已清偿** |
| ④ S11 T7 台账/Note/进行中行 | S11 `570ddc0` 已交付，stage0 审核已核 | **已清偿** |
| ⑤ S11 stage2 audit-log 落盘 | 文件在档（含 reconstructed 轮 1 标注 + S12 T0 参数头） | **已清偿** |

**plan 011 R1/R2/R3 浏览器腿代偿判定：成立**——plan 012 R5/D6 明文认领（「证据部分由本棒 T3/T5/T7 实做、T8 独立复验、T9 闭合」），且 T7 断言在当前代码态覆盖 S11 五断言 + S12 四新项。

**总结论：S11 验收采信链已闭合（证据面）**——三腿断言/探针/浏览器 + 浏览器腿代偿全部有实物与实测背书。仪式性收尾（progress 台账 :170 翻账注记 + S12 stage45 log 落盘）按 plan 012 D6/WBS **归 T9**，本报告即其所需复验证据，非缺口。

## 三、三正交追问 + 冒烟

- **安全 PASS**：Tooltip 用法只读（bubble 纯展示文案，ⓘ button 无 onClick，零状态变更）；`.credentials.yaml` refs:{} 零 fake 残留亲读；scratch 3418 LISTEN=0 零运行残留；3416/3080 零监听零接触；61518 未触碰仍在（披露一致）；分支对 package.json/tsconfig/cordis.yml/scripts **零 diff**（manifest 未动，Tooltip/图标走既有 external 面）。
- **契约 PASS**：MemberSnapshot.memberId 下游——全仓唯一手构点 section.spec 工厂 :23 已含 memberId，controller.spec/entry.spec 走真 controller 无 stale mock 面，typecheck exit 0 兜穷举；22 键 parity 亲跑；ADR-0011 语义零触碰（node src/ 零 diff 亲证）。发现 🟡-3（keys.test 行号转录）。
- **前瞻**：台账翻账注记 pending T9 = plan 内定非债务；labelOf fallback 披露的可达性论证不精确（🟡-2）；ADR 重排扫尾漏网（🟡-1）。
- **冒烟记录**：①`git log --oneline 921e31b..HEAD` → 恰 8 枚，与声称链逐枚一致（eb05ba4→9be6860→10f5d8e→2512f03→0b04c38→c040a98→7f94b9e→c73cdfb），无列表外提交；②`pnpm vitest run tests/client/section.spec.tsx -t "反馈①"` → 1 passed | 17 skipped；`-t "反馈④"` → 1 passed | 17 skipped；③探针 A 重演红→还原 clean（上文）。eb05ba4 stat 亲见 15 files +607/−39，与 T0 行一致。

## 四、发现清单

- **🟡-1 ADR 前向引用重排后漂移（T0 令牌集扫尾漏网）**：`docs/decisions/adr-0009-anysearch-member.md:57`「（S13 上游验收清单既有步骤）」（上游验收现 = S16）、`:62`「（…S12 素材）」（手册现 = S15）、`docs/decisions/adr-0011-single-slot-comma-keys.md:50`「（S12 手册注记）」（现 = S15）。三处均为 ADR Consequences 的**当下/未来义务指针**，非时点快照，按判定标准属活引用——T0「活引用面零悬空」声称对这三行不成立（plan D7 点名的同步面确未含 ADR，属面边界漏网）。dont-do 复发：**否**（无对应条目；失败家族同 stage0 🟡7 同号异义，但 dont-do 仅入册了 🔴1/🔴2 两形态）。建议 T9 扫尾顺手三处勘注 + 令牌 grep 面扩至 docs/decisions/。
- **🟡-2 未知 id fallback 无专用测试 + 可达性披露不精确**：plan 012 T3 先红清单点名「未知 id fallback」，交付披露「filter 保证不可达，无专用测试」（progress-M7:103）——该论证仅对 searchChain 成立（:97-99 过滤）；**fetchChain 不过滤**（section.tsx:157-160），手改 pinned fetchChain 含外来 id 即达 fallback。行为本身良性（渲染原 id = 修复前行为），披露诚实但论证面错。dont-do 复发：**否**。
- **🟡-3 T7 披露行号转录误**：progress-M7:107「keys.test:101-107 fail-loud 单测在档」——实际单测在 `tests/keys.test.ts:89-95`，`101-107` 是 `src/keys.ts` 实现行号（文件名混写）。实质正确（搜索期 fail-loud 实现+单测均在档且全量亲跑通过）。同类前科：S10 lint 45→47。dont-do 复发：**否**。
- **🟢-1**：test 运行中 vite sourcemap 告警（client-ui-primitives lib 缺 .map）——台账既有 🟢 观察（vitest sourcemap），不新登记。
- **🟢-2**：R1 之「T1 时点 21 键」为中间态声称，算术链（20+1+1=22 终态亲见）自洽，无需动作。

## 五、最终结论

- **阶段 4：PASS**——R1-R7 逐条 PASS，门墙七命令亲跑零偏差，提交链与声称逐枚一致。
- **阶段 5：COMPLETE**——安全/契约/前瞻三问全过 + 冒烟四项留痕；🟡×3 均为记录/文档类非阻塞项（两处披露勘误 + 一处重排扫尾漏网），不翻转任何 R 条目，建议随 T9 收官批一并勘正。
