# Audit Log — S12a 阶段 4/5 独立验证输出（正本转录）

- **参数头**：审核库 v2｜阶段 4/5｜Session 12a｜输入指针：plan 正本 docs/plans/2026-09-04-012a-s12a-settings-redesign-plan.md + commit 范围 6f50322..d561598（6 枚，自行 git log 复核）+ 测试命令（corepack pnpm test/typecheck/lint/build + npm pack --dry-run + check:i18n）+ 阶段 0/2 正本 + 宿主实锚抽查面｜偏离说明：无。

- **输出原文**（独立 Agent 逐字落盘，2026-09-04）：

---

# S12a 阶段 4（R 对峙）+ 阶段 5（三正交）独立验证报告

审核基线：分支 `feat/s12a-settings-redesign` @ `d561598`，工作树 clean（`git status --porcelain` 空，门前门后两次核验）。commit 链 `git log --oneline 6f50322..HEAD` 逐枚 = 主 Agent 声称 6 枚（da4df11 / 8f46952 / 5f70466 / a4faa4d + 92905ef / d561598），无夹带提交。

## 一、阶段 4：R1-R7 逐条对峙

**R1 成员卡结构 — PASS**
`src/client/section.tsx`：状态点 `:317` `<span role="img" aria-label={statusText} title={statusText} style={statusDotStyle(...)} />`，`:134-143` 绿=`state-success-primary`/橙=`state-warn-label`；品牌名 `:73-76` fontSize 14/weight 500；开关 `:101-116` 36×20 pad 2 r10，thumb `:118-130` 16×16 `translateX(16px/0px)` 真实子 span `:329`；Input `:332-339` 为卡直接子级（inputStyle 仅 `width:'100%'`）；hint 行 `:340` hintStyle 12px/18px；footer `:341-365` `justifyContent:'flex-end' gap:8`，Clear `variant="outline" size="sm"`、Save `variant="primary" size="sm"`，feedback `:343` `role="status"` flex:1 居左。宿主来源亲验：`dsh-client-ui-primitives/lib/Button.module.css` `.sm { height:28px; border-radius:14px }`。spec 断言亲读：`tests/client/section.spec.tsx:263-271`（dot 双态）、`:273-287`（`wrap.parentElement === card` 且 wrap 内无 button——原语 wrapper 假绿坑的修正断言）、`:289-298`（thumb 两态 transform）。

**R2 hint 格式化文案 + 键清理 — PASS**
`locales.ts:66` `'Multiple keys: {APIKEY1,APIKEY2,...} (max 10)'` / `:90` `'多把 key：{APIKEY1,APIKEY2,...}（最多 10 把）'`；`locales.spec.ts:27-33` 逐字断言 + `keyFieldNoteExample` 双侧否定断言。键数算术链亲测：`git show` 逐提交数 union —— `6f50322`=**22** 键（含 `fetchChain`:28、`keyFieldNoteExample`:39）→ `8f46952`(T1)=**21** → `5f70466`(T2)=**20** → HEAD=**20**。plan 写 21 是 T1 时点、终态 20，算术链 22→21→20 成立。grep（src/ tests/ 活引用面）：`keyFieldNoteExample` 仅 locales.spec 否定断言；`IconQuestionOutline14` 零命中（exit 1）；`Tooltip` 零命中（exit 1）。

**R3 链区块收敛 — PASS**
未配置态：`section.tsx:169` `showChains = members.some(m => m.configured)`，`:189` 条件渲染；spec `:147-151` `dshws-chains` 为 null（本审亲跑通过）。已配置紧凑卡：h4 12px/500 `:192`；badge `:272` `data-dshws-chain-state`（spec `:189-200` default/pinned 恰 1 个）；hint `:195-197` chainDefaultHint + `MEMBERS.map(label).join(' → ')`（spec `:202-211`）；grid `:240-247` `'auto minmax(0,1fr) auto auto'`；图标钮 `:255-265` 28×28；`maxHeight:280` `:200`。fetchChain 展示区块：grep fetchChain 于 src/client 仅 controller.ts（数据面 `:63/:90/:94/:131/:133` 字段保留），spec `:135-145` 断言仅 1 个 `<ol>` 且 `dshws-fetch-chain` 为 null；`controller.spec.ts:139/264/269/280` fetchChain/fetchChainPinned 断言存活。timeout hint 化 `:230-233`；移动失败反馈 `:233` 红 `state-error-primary` + `dshws-chain-feedback` testid（spec `:319-336`）。

**R4 页头 intro — PASS**
`locales.ts:49` en "…Configured members are tried in chain order and the next one takes over on failure." / `:73` zh「已配置成员按链序依次尝试，失败自动降级到下一个。」——降级语义句双侧在位；`section.tsx:172` `maxWidth: 720`，`:175` 渲染 description；spec `:80-84`。

**R5 布局对齐实测 — PASS（附条件，见 🟡-1）**
T4 computed-style 记录（progress-M7:127）逐项与代码源交叉核对一致：卡 padding 12/14+r12 = cardStyle `:57-65`；wrapper 32/8r/layer-1 = 原语 `Input.module.css` `.wrap { height:32px; border-radius:8px; background:var(--dsw-alias-bg-layer-1) }` 亲读证实「wrapper 自带全部字段视觉」论断为真；hint 12/18 = hintStyle；thumb translateX(16px) = thumbStyle；grid rowH 40 算术自洽（padding 6×2 + 钮 28 = 40），4 元素同线由 d561598 删除占位 span 达成（diff 亲读）。未配置态高度收缩腿：jsdom 面链区块 null 断言本审复跑通过 + T4 记录「未配置态链区块不存在=0」。**截图腿不闭合**：progress-M7:127 与 d561598 commit message 均称「截图×3 / 截图 /tmp/dshws-s12a/」，但 `find /tmp/dshws-s12a -type f` 实测仅 boot×4.log、dsh-websearch-0.1.0.tgz、home/ 树——**零 PNG**；扩展搜 /tmp、/var/folders、repo 内（13:00-14:30 窗口）均无。/tmp/dshws-s12a/ 其余实物（boot 13:28→13:39 四次、scratch home 13:28-13:41 写入轨迹、tgz 13:34）与 T4 时序自洽。

**R6 a11y — PASS**
状态点三件套 `:317`（configured/notConfigured 两键均作 aria-label+title，spec `:263-271` 双态亲验）——S12 StateDot aria-hidden 缺口确已闭合；switch `:322-327` `role="switch"`+`aria-checked`+`aria-label`（spec `:91-96`）；move 钮 aria=`${labelOf(id)} ${moveUp/moveDown}` 品牌名口径 `:211/:220`，id 载荷不变（spec `:179-187` 断言 `'dshws-exa', -1`）；`role="status"` `:343`（spec `:247`）。

**R7 门墙七命令 — PASS（本审 @d561598 亲跑全量，node v24.3.0）**

| # | 命令原文 | 实测 | 台账比对 |
|---|---|---|---|
| 1 | `corepack pnpm test` | **251 passed \| 9 skipped (260)**；26 文件 passed + 1 skipped (27)；section.spec 21 tests | 零偏差 |
| 2 | `corepack pnpm typecheck` | exit 0（tsc 双面） | 零偏差 |
| 3 | `corepack pnpm lint` | 0 warnings 0 errors，47 files | 零偏差 |
| 4 | `corepack pnpm build` | index.js **57.96 kB** / index.d.ts **27.04 kB**（零漂移，node 零变更兑现）；client.js **24.68 kB** | T3 记 24.80 为 5f70466 时点；d561598 删 span/boxSizing 后收缩至 24.68，方向与成因吻合，以实测为准 |
| 5 | `npm pack --dry-run` | total files: **5** | 零偏差 |
| 6 | `corepack pnpm check:i18n` | "ok — **20 keys**, union/en/zh parity holds" + "ok — **17 files**, zero CJK literals"，exit 0 | 零偏差 |
| 7 | `git status --porcelain` | 前后均空（clean） | 零偏差 |

## 二、阶段 5：三正交 + 冒烟

**安全 — PASS**
`.credentials.yaml` 亲读：仅 `client-connection/browser-session` grant，`refs: {}`；`grep -in "tavily\|exa"` exit 1——fake 值复原零残留。`lsof -nP -iTCP:3419/3416/3080 -sTCP:LISTEN` 全部无监听（3419 已停）；pid 61518 仍存活（`ps` lstart=Sep 4 01:06:05，即 S12 期凌晨残留 3417 实例）——**未被杀 = 零接触主张与物理证据一致**。`~/.dsh/settings.yaml` mtime Sep 3 00:26、`~/.dsh/.credentials.yaml` Aug 31，均早于本棒 13:xx 窗口（下限证据）。`git diff --name-status 6f50322..HEAD` 无 package.json/tsconfig/cordis.yml——bundle 配置零 diff。

**契约 — PASS**
SectionSnapshot.fetchChain/fetchChainPinned 字段保留 + controller.spec 四处断言存活（行号见 R3）；memberId/品牌名 aria 口径未回退（labelOf 同源，id 载荷断言在）；20 键 parity 三重证（union 计数 + check-locales + locales.spec）；`git diff --name-only 6f50322..HEAD -- src/ '!:!src/client'` 为空——node 侧零 diff。

**前瞻 — COMPLETE**
a4faa4d/92905ef 两笔拆分：92905ef message 明文披露「a4faa4d 因 anchor 双匹配仅含 Agent Note，本提交补齐台账」，与两笔 diff 实物（各 1 文件）吻合——披露完整。「pnpm 同版本 tarball 重复 add 被跳过」坑：在 progress-M7:127 台账行 + d561598 message，**未入 Agent Note「坑」节**（见 🟢-1）。CSS module 化 🟢 债务：plan D7 + 债务映射表 + Agent Note 技术决策节三处同口径登记，归属清晰。

**冒烟**
`npx vitest run tests/client/section.spec.tsx -t "12a"` → **7 passed \| 14 skipped (21)**——全部 12a 命名用例（反馈①②③④ + D1×2）通过。宿主实锚抽查 4 处全真：credentialDot `ModelsSection.tsx:371-380`（role=img+aria-label+title 逐行吻合）、`.input` `ModelsSection.module.css:545-557`、`.iconButton` `:467-476`、`.switch/.thumb` SubagentModelSelectionCard.module.css:22-60（36×20/16px/translateX(16px)/120ms 逐值吻合）。dont-do 六条逐条排查：无正式复发（🟡-1 系第 5 条的旁支模式，见下）；第 3 条启动状态区 T0 刷新核验齐全（STATUS:29/48/52-57 + progress-M7 三处 + roadmap 插行 + 骨架 87 行在档），第 6 条台账 T5 行为「进行中」未预翻 PASS。

## 三、发现清单

**🔴 ×0**

**🟡 ×2**（均附正面证据）
1. **T4 截图证据链断裂**：progress-M7:127「截图×3 与 /tmp/dshws-s12a/ 实物」+ d561598 message「截图 /tmp/dshws-s12a/」，但该目录及全盘窗口内搜索零 PNG 实物（find 输出为证）。验证矩阵对 R5 的采信规则是「/tmp/dshws-s12a/ + 记录」——截图腿的实物从未落盘或已丢失。这是 dont-do 第 5 条「声称完成而核心工件未落盘」的同族模式（不构成正式复发：该条 scope 收官序列 STATUS 指针，本条是任务行级）。**整改**：T6 前补跑浏览器棒落盘截图，或按 S10 T10 先例对 progress-M7 T4 行加勘误注记（截图仅会话内留痕、未归档）。browser 腿本审无法代跑（Browser Use 仅限主 Agent）——此为 R5 附条件的原因。
2. **d561598 变更描述与 diff 不符**：commit message 与 T4 台账行均称「inputStyle 撤 height:32」，实测 diff 删除的是 `boxSizing: 'border-box'`；且 8f46952/5f70466 两个历史提交态的 inputStyle 均只有 `{width, boxSizing}`——height:32 从未存在于任何已提交版本。行为无损（style 落点为原语内层 input，`.input` 无 padding/border，boxSizing 删除零视觉影响；wrapper 32px 视觉由原语承载为真），但「实测发现 height 冗余已撤」的叙事与实物对不上，属台账转写失真。**整改**：T6 勘误注记一并处理。

**🟢 ×3**
1. pnpm 同版本 tarball 坑已入 progress 台账 + commit message，未入 Agent Note「坑」节与 session-12a（骨架待 T6 补）——T6 补全时归拢，S15 手册素材不丢失即可。
2. T4 后 client.js 实测 24.68 kB 尚未入台账（T3 行 24.80 是其自身提交态的诚实记录）——T5 数字随收官落账。
3. a4faa4d message 内容表述大于实际 diff（称含门墙表/批次表，实仅 Agent Note）——由 92905ef 显式披露并补齐，配对诚实；另 vitest 输出偶发 vite sourcemap transform 噪音（测试全过，非本棒引入，仅记录）。

## 四、终审

- **阶段 4：PASS**——R1/R2/R3/R4/R6/R7 全 PASS 且门墙本审零偏差亲证；R5 PASS 附条件：截图腿须按 🟡-1 整改（补落盘或勘误注记）后方为完全闭合。
- **阶段 5：COMPLETE**——安全/契约/前瞻三问全过；🟡×2 须在 T6 收官原子序列内清偿（均为记录类整改，不动产品代码）；🟢×3 随 T6/S15 归拢。

T5 gate 通过，可进 T6 收官；T6 清单须包含：🟡-1 截图腿处置、🟡-2 勘误注记、dont-do 第 3 条收官侧状态区全刷（含本审 24.68 数字落账）。
