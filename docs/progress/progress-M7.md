# Progress — M7 功能扩展

> 本文件是 M7 阶段（功能扩展：多 APIKEY 池 / anysearch 成员 / session 溯源）的进度台账。
> 2026-09-03 新开（Session 09）。验收契约：`docs/plans/2026-09-03-009-s09-multi-apikey-pool-plan.md`
> 的 R1-R5 验收条目，阶段验收逐条对应给 PASS/FAIL + 证据；🟢 债务归属映射正本在 plan 009
> 债务映射节，本文件台账为其镜像。

## 里程碑

| 里程碑 | 内容 | 状态 |
|---|---|---|
| M1 治理与规划定稿 | 治理产物齐备且占位符清零，计划过独立审核与人工终审 | ✅ 2026-09-02 |
| M2 可行性定谳 | GUI 形态、安装链路、交付形态有实测结论，ADR-0006/0007 定稿 | ✅ 2026-09-02 |
| M3 宿主包完备 | 五 provider + 链 + 凭据/设置全绿，安装端到端可复现 | 🚧（机械面 ✅ S05b；余用户 with-key 槽位回填——指引 docs/notes/2026-09-02-s05b-install-runbook.md §4） |
| M4 设置页完备 | GUI 全流程（配 key→启停→排序→热生效）浏览器实测通过 | ✅ 2026-09-02（S06+S07） |
| M5 交付就绪 | e2e 收口全绿，文档自洽可复现 | 🚧（e2e 收口腿 ✅ 2026-09-02 S08；文档腿 S15——2026-09-04 重排） |
| M6 上游验收通过 | 用户在上游全新构建上完成验收清单 | ⏳ |
| M7 功能扩展 | 每成员多 APIKEY 池 + anysearch 第六成员 + 设置页 UI/UX 对齐 + session 溯源徽标（ADR-0008〔superseded→0011〕/0009/0010）+ 装即接管（ADR-0013 插行增补） | ✅ 2026-09-06（S09-S14 全收官 + S14a 插行收官；证据 = session-14/14a + 各自 stage45 PASS/COMPLETE + 徽标浏览器亲见 + 装卸三态 dump） |

## 进行中

- S14b DeepSeek 兜底行重构 + 双审计修复（插行棒）——方向双裁定 + ExitPlanMode 批准；阶段 0 审 S14a PASS（🟡×4 → 本节入册）；plan 正本 docs/plans/2026-09-06-014b-s14b-deepseek-fallback-row.md

## 待启动

- S15 README+迁移+升级手册（M5 文档腿；正素材：ADR-0012 语义表 + ADR-0010 溯源维护点 + ADR-0013 装即接管/anysearch 博弈 + fetch 调研注记 + s12b 两级调用逻辑）→ S16 上游重建验收准备（M6）——编排正本：roadmap（2026-09-04 用户重排；S14a 为 2026-09-06 插行）

## 已完成

### S10 anysearch 成员批（2026-09-03，分支 feat/s10-anysearch-member）

阶段 0 独立审核 S09 **PASS**（🔴×0；审核面外 🟡×2 记录更正类 = index 注释「已收敛」
声称与实物不符 + progress 里程碑行括注漏刷〔dont-do 家族第五次〕，T0 清偿 `8ac6107`）→
plan 010 落盘 → 阶段 2 **三轮**审核（轮 1 NEEDS REVISION 必改×1 波及面三处遗漏 + T1
未点名 config 四件制品，建议×5；轮 2 残留必改×1 语法校验循环非泛化点；轮 3 **APPROVED**
无阻塞残留）→ 阶段 2.5 AskUserQuestion 未获答，按接力序取默认批准项自主推进（披露，
session 记录双落）。

| 任务 | 内容 | 结果 |
|---|---|---|
| T0 | 治理批：plan 010 + 阶段 0/2 audit-log + 🟡×2 清偿（index 注释实删/progress 里程碑行×2）+ STATUS 启动刷新 | 完成（`8ac6107`，master 直提） |
| T1 | errors anysearch 五码族 + BUILT_IN 尾部追加 + config anysearch 节四件制品 | 完成（`ddfb4ae`；红 5 failed\|23 passed → 28 passed；骨架注入形态亲测留痕；**settings.test fetchChain 漏更新带红 amend——提交态红线教训第二次**） |
| T2 | src/providers/anysearch.ts（信封/content→snippet/zone 透传/五失败形态） | 完成（`c121f8c`；红=模块缺失 → 13 passed；**T1/T2 提交曾误 amend 掺包——reset --soft 重排干净**；isPositiveInteger 未用导入清偿） |
| T3 | index.ts 接线：members 第 6 项（尾部）+ pool + gates + MemberKey/导出块/校验循环 + anysearch 语法红测试 | 完成（`8641b2f`；红 3 failed\|16 passed → 19 passed；首轮误插 firecrawl/deepseek 之间被拓扑断言抓住修正） |
| T4 | client 第 6 卡：MEMBERS/SectionValue/deriveSnapshot 泛化 | 完成（`545ba42`；红 3 failed\|48 passed → 51 passed；controller.spec 默认链序三处硬编码随第 6 成员更新） |
| T5 | e2e 信封场景：anysearch 单成员链 + content→snippet + servedBy | 完成（`5e639b0`；11 passed） |
| T6 | 真实 API smoke：anysearch.real.test.ts（无 key 自跳） | 完成（`3bcd650`；1 passed\|1 skipped 亲见） |
| T7 | 浏览器六卡实测（scratch 3415，主 Agent IAB 实测棒） | 完成（`c5d2ae7`；六卡序/anysearch 卡全要素/fake 值写入 Configured 翻转+凭据 refs 落盘/Clear 复原 refs:{}；kill 95580 精确零残留） |
| T8 | 门墙七命令（提交态）+ 本台账 + Agent Note（docs/notes/2026-09-03-s10-anysearch-member.md） | 完成（数字见下节门墙表） |
| T9 | 阶段 4/5 独立验证 | **PASS / COMPLETE**（R1-R5 逐条 PASS：13 单测 + 11 loopback 亲跑含信封 wire 复证 + 门墙七命令亲跑零偏差 + providers 外零漂移 + 空池/信封契约 ADR 正本对齐 + 隔离法证（3415=0/3080=90269 未动/s05b-s09 早窗/refs:{} 复原亲读）+ 三问全过；**🟡 ×1 抓获：门墙表 lint files 45 应为 47**（转录误差）→ T10 勘正清偿；🟢×2 注记；audit-log 正本 docs/sessions/audit-logs/2026-09-03-s10-stage45-verification.md） |
| T10 | 收尾（🟡 files 勘正随批 + index.ts 注释收敛**实删**核对随批 + 本文件 + session 记录 + STATUS/roadmap/CHANGELOG 原子收官 + merge `--no-ff` + 接力指令） | 完成（本序列；**勘正**：session-10 记录「阶段 3 T0-T9 十 commit」实为 9 commit——T5/T6 合并；阶段 0 审核同类瑕点复现，时点快照不回改） |

### 门墙实测数字（提交态，node v22.23.2 / pnpm 11.7.0）

| 棒 | 命令（七件全名） | 数字 |
|---|---|---|
| S14a | ①`pnpm test` → **29 files（28 passed + 1 skipped），Tests 273 passed \| 9 skipped (282)**（270→273：+3 = patch.test 结构断言；既有零破坏）②`pnpm typecheck` → exit 0 双面 ③`pnpm lint` → **0 warnings 0 errors（50 files，96 rules）**④`pnpm build` → **增量披露：client.js 41.81→42.09 kB**（intro 扩句）；index.js 59.42 / index.d.ts 27.04 **零漂移**（node/src 逻辑零变更）⑤`npm pack --dry-run` → 五件（含新 cordis.patch.yml 双条目）⑥`pnpm check:i18n` → exit 0（34 keys parity + 18 files 零 CJK）⑦`git status --short` 前后置 clean | S14a T4 提交态亲跑（3d09b59，node v22.23.2 / pnpm 11.7.0） |
| S14 | ①`pnpm test` → **28 files（27 passed + 1 skipped），Tests 270 passed \| 9 skipped (279)**（261→270：+9 = keys 1〔T2 钉牌〕+ toolview 8〔T3〕；既有零破坏）②`pnpm typecheck` → exit 0 双面 ③`pnpm lint` → **0 warnings 0 errors（49 files，96 rules）**④`pnpm build` → **增量披露：client.js 29.98→41.81 kB**（自绘卡+图标通路+7 键）；index.js 59.42 / index.d.ts 27.04 **零漂移**（node 侧零变更兑现）⑤`npm pack --dry-run` → 五件 ⑥`pnpm check:i18n` → exit 0（**34 keys** parity + 18 files 零 CJK；计划估 33，+inspect 键披露）⑦`git status --short` 前后置 clean | S14 T4 提交态亲跑（4958fc0，node v22.23.2 / pnpm 11.7.0） |
| S06-S09 | （历史） | 正本 progress-M4/M5 门墙表 + progress-M7 S09 行 |
| S10 | ①`pnpm test` → **27 files（26 passed + 1 skipped），Tests 257 passed \| 9 skipped (266)**（245→266：+21 anysearch 单测 13/接线与池 3/拓扑与语法 2/信封场景 1/smoke 2；既有零破坏）②`pnpm typecheck` → exit 0 双面 ③`pnpm lint` → **0 warnings 0 errors（47 files，96 rules）**（T9 勘误：T8 原记 45）④`pnpm build` → **增量披露（D7）：index.js 52.61→58.09 kB / index.d.ts 25.19→28.70 kB / client.js 27.17→27.30 kB**（providers 新文件 + config 节）⑤`npm pack --dry-run` → 五件 ⑥`pnpm check:i18n` → exit 0（23 keys parity + 17 files 零 CJK）⑦`git status --short` 前后置 clean | S10 T8 提交态亲跑 |

### S11 调整批（2026-09-03，分支 feat/s11-adjustments）

阶段 0 独立审核 S10 **PASS**（🔴×0；🟡×3 记录更正类 T0 清偿）→ plan 011 → 阶段 2 两轮
**APPROVED** → 阶段 2.5 **用户真实批准**（第 3 次）→ 逐一执行 → 阶段 4/5（见 T8 勘正）。
**补记（S12 阶段 0 审核 BLOCKED，正本 audit-logs/2026-09-04-s12-stage0-review-of-s11.md）**：
本节头原记「阶段 4/5 进行中」与下表 T8「PASS / COMPLETE」自相矛盾（🟡6，本行即 S12 T0
修正）；session 记录/roadmap/CHANGELOG/接力指令四件收官工件缺失（🔴1/🟡7/🟡8）由 S12 T0
补齐；session-11 记录已 reconstructed 补落（2026-09-04）。

| 任务 | 内容 | 结果 |
|---|---|---|
| T0 | 治理批：plan 011 + ADR-0011/0008 superseded + audit-log + 🟡×3 清偿 | 完成（`32afef7`+`2f7c9b0`） |
| T1-T4 | 回退批：config extras 全退场/keys.ts 单槽化/index 单 ref/client extras UI 退场+置灰+过滤+可见序列交换+keyFieldNote/locales 四删一增（20 键） | 完成（`34a6325`+`b5c2579`；全量 241\|9(250)） |
| T5 | e2e 改写 | 完成（含在 C1） |
| T6 | 浏览器实测棒 | 待补（用户 3416 实例可直接查看；正式 3417 scratch 留 S12 期补做）——**补记（S12 🟡4）**：顺延未入台账为违规点，已由 S12 入技术债台账并吸收进 S12 T7 认领 |
| T7 | 门墙七命令 + 台账 + Agent Note | 完成（`570ddc0`；数字见下节） |
| T8 | 阶段 4/5 独立验证 | **~~PASS / COMPLETE~~（入账撤销——S12 阶段 0 🔴2 勘正）**：在盘 stage45 正本（`65bef4e` 时点）结论 **BLOCKED**（R1/R3 证据条未齐：浏览器腿未做/过滤负路径断言缺/混合序列交换断言以推演替代/T5 探针零痕迹；补完清单三腿在档正本）；b23097b 曾翻转为「R1-R5 逐条 PASS」且复验输出零落盘，与正本矛盾——遗留腿转 **S12 T3/T5/T7 认领 + T8 复验闭合**（progress 技术债台账「S11 遗留腿」行） |
| T9 | 收尾（🟡 勘正 + session 记录 + STATUS/roadmap/CHANGELOG 原子收官 + merge + 接力指令） | 部分完成（merge `921e31b`/STATUS 台账+位置块/progress 本节 ✅；**session 记录/roadmap 更新/CHANGELOG/接力指令四件缺**——S12 阶段 0 🔴1/🟡7/🟡8 抓获，S12 T0 补齐） |

### 门墙实测数字（提交态，node v22.23.2 / pnpm 11.7.0）

| 棒 | 命令 | 数字 |
|---|---|---|
| S09/S10 | （历史） | 正本 progress-M7 上节 |
| S11 | test **245 passed\|9 skipped(254)**（T9 勘误：T7 原记 241\|9(250) 为 65bef4e 时点数——064dc19 补 4 断言后实数） / typecheck exit 0 / lint 0w0e 47 files / build 57.96+27.04+21.57（extras 退场缩减披露）/ pack 五件 / check:i18n **20 keys** + 17 files | S11 提交态亲跑 |
| S13 | ①`pnpm test` → T4 提交态（7aa0e5f）**260 passed \| 9 skipped (269)**（261→269：+8 = keys 2 + controller 3 + section 3）；🟡-1 清偿后终态（b08b26e）**261 passed \| 9 skipped (270)**（+1 重复多重集重建腿）②`pnpm typecheck` → exit 0 双面 ③`pnpm lint` → **0 warnings 0 errors（47 files，96 rules）**④`pnpm build` → **增量披露：index.js 57.96→59.41 kB**（牌堆逻辑；终态 59.42）；index.d.ts **27.04 kB 零漂移**（公共类型未动）；**client.js 26.25→29.98 kB**（控件+hint+5 键）⑤`npm pack --dry-run` → 五件 ⑥`pnpm check:i18n` → exit 0（**27 keys** parity + 17 files 零 CJK）⑦`git status --short` 前后置 clean | S13 T4 提交态亲跑 + T6 独立复验零偏差 + 🟡-1 清偿复验 CONFIRMED（node v22.23.2 / pnpm 11.7.0） |
| 12b | ①`pnpm test` → **252 passed \| 9 skipped (261)**（260→261：+1 = T2 badge 断言；T1 改写净零）②`pnpm typecheck` → exit 0 双面 ③`pnpm lint` → **0 warnings 0 errors（47 files）**④`pnpm build` → **增量披露：client.js 24.68→26.25 kB**（页头图标+badge）；index.js/index.d.ts 零漂移 ⑤`npm pack --dry-run` → 五件 ⑥`pnpm check:i18n` → exit 0（**22 keys** parity + 17 files 零 CJK）⑦`git status --short` 前后置 clean | 12b T3 提交态亲跑（node v24.3.0）；T5 复验 1a57023 终态零偏差 |
| 12a | ①`pnpm test` → **251 passed \| 9 skipped (260)**（257→260：+3 净增 = T1 新 4−删 1 + T2 改写净零；既有零破坏）②`pnpm typecheck` → exit 0 双面 ③`pnpm lint` → **0 warnings 0 errors（47 files）**④`pnpm build` → **增量披露：client.js 24.03→24.80 kB**（结构重排）；index.js 57.96 / index.d.ts 27.04 零漂移（node 侧零变更兑现）⑤`npm pack --dry-run` → 五件 ⑥`pnpm check:i18n` → exit 0（**20 keys** parity + 17 files 零 CJK）⑦`git status --short` 前后置 clean | 12a T3 提交态亲跑（node v24.3.0）；T5 复验 d561598 终态：client.js **24.68 kB**、余六件零偏差 |
| S12 | ①`pnpm test` → **26 passed files + 1 skipped (27)，Tests 248 passed \| 9 skipped (257)**（254→257：+3 净增 = T2 色矩阵 1 + T4 ⓘ 1 + T5 混合序列 1；T1 为断言改写净零；既有零破坏）②`pnpm typecheck` → exit 0 双面 ③`pnpm lint` → **0 warnings 0 errors（47 files，96 rules）**④`pnpm build` → **增量披露：client.js 21.57→24.03 kB**（Tooltip/图标/品牌名/ⓘ 引入）；index.js 57.96 / index.d.ts 27.04 零漂移（node 侧零变更兑现）⑤`npm pack --dry-run` → 五件 ⑥`pnpm check:i18n` → exit 0（**22 keys** parity + 17 files 零 CJK）⑦`git status --short` 前后置 clean | S12 T6 提交态亲跑 + T8 独立复验零偏差（node v24.3.0） |

### S12 UI/UX 对齐批（2026-09-04，分支 feat/s12-uiux-alignment）

阶段 0 独立审核 S11 **BLOCKED**（🔴×2 收官证据链〔session 记录缺失+悬空指针；阶段 4/5
PASS 入账与 BLOCKED 正本矛盾〕+ 🟡×9 + 🟢×5；产品面全绿亲证：子集 188 passed /
typecheck/lint/i18n/build/pack 全过；正本
docs/sessions/audit-logs/2026-09-04-s12-stage0-review-of-s11.md）→ 治理修复批并入 T0
（先债后新）→ plan 012 → 阶段 2 两轮（轮 1 NEEDS REVISION 必改×3〔Tooltip anchor 裸
svg 不可用/②推导分支披露/D7 头部规则行〕+ 建议×6 → 全数吸收 → 轮 2 **APPROVED**；
正本 …/2026-09-04-s12-stage2-plan-review.md）→ 阶段 2.5 **用户真实批准**（第 4 次，
AskUserQuestion 获答「批准，自主推进」）→ 逐一执行中。

| 任务 | 内容 | 结果 |
|---|---|---|
| T0 | 治理修复批：S11 记录 reconstructed 补落 + 本台账勘正（T8 入账撤销/节头 🟡6/遗留腿入账）+ roadmap 重排（12-16 用户 2026-09-04 序列+头部规则行改写）+ CHANGELOG S11 条目 + S11 audit-log 参数头×3 补录 + dont-do 两条新条目 + STATUS 启动刷新 | 完成（`eb05ba4`；15 文件 +607/−39；grep 令牌集八项穷举——活引用面零残留，历史时点快照不回改） |
| T1 | 反馈①：keyFieldNote 内联小字 → 可聚焦 button anchor（aria-label=keyFieldNote）包 IconQuestionOutline14 + Tooltip（side=bottom delayMs=400 maxWidth=320）+ keyFieldNoteExample 键（21 keys） | 完成（`9be6860`；红 1 failed\|15 passed（内联 span 残留）→ 绿 21 passed；typecheck 双面 0；i18n 21 keys） |
| T2 | 反馈②：switchStyle(configured, enabled)——configured&&enabled 才绿（未配置 enabled 默认 true 的误导绿修复）+ feedback span role=status | 完成（`10f5d8e`；红 1 failed\|16 passed（未配置成员实得 success-primary）→ 绿 17 passed；**首 commit 管道吞退出码带红——amend 重写绿提交，提交态红线第四次**） |
| T3 | 反馈③：链行品牌名渲染（labelOf：memberId→MEMBERS.label，aria 同口径，id 级 testid/载荷保持）+ ↑↓ 边界改过滤后可见列表（末位假失败修复）+ MemberSnapshot.memberId 落地（S11 D5）+ 负路径过滤断言（🟡1 清偿）+ fixture 6 成员（🟢①） | 完成（`2512f03`；红 6 failed\|11 passed → 绿 client 44 passed；node 面 keys/apply/loopback 37 passed 零漂移；labelOf fallback 披露勘正（T8 🟡-2）——searchChain 由过滤保证不可达；fetchChain 不过滤、外来 id 可达（渲染原 id 良性），无专用测试） |
| T4 | 反馈④：ChainStateBadge default 态 ⓘ（结构同 T1）+ Tooltip 出「chainDefaultHint + MEMBERS labels join(' → ')」动态顺序 + pinned 态无 ⓘ | 完成（`0b04c38`；红 1 failed\|17 passed → 绿 45 passed；i18n 22 keys；测试自撞（全局 aria 计数 vs 成员卡 switch）当场修正） |
| T5 | S11 🟡2/🟡3 清偿：controller.spec 混合序列交换断言（跳过两个未配置成员交换+原位保持+末位越界 not-ok）+ 双牙齿探针（A：破坏跳过循环 → patch 断言红；B：loopback 轮换 order 化 → 恒序红） | 完成（`c040a98`；探针 A 红 1 failed\|16 passed/探针 B 红 expected Bearer k1×3——均还原绿；还原后 28 passed） |
| T6 | 门墙七命令（提交态）+ 本台账/门墙表 + Agent Note（docs/notes/2026-09-04-s12-uiux-alignment.md） | 完成（数字见下节门墙表；提交态 c040a98） |
| T7 | 浏览器实测棒（scratch 3418，3416/3080/残留 61518 零接触）：S11 遗留五断言（🟡4）+ S12 新四项 | 完成（九项断言全过留痕：①ⓘ anchor 六卡 ②keyFieldNote tooltip 含示例+blur 收 ③默认序 ⓘ tooltip 含动态六品牌顺序 ④未配开关 disabled+灰 rgba(255,255,255,.12) ⑤已配开=绿 rgb(34,197,94) ⑥链行品牌名（fetch 六行+搜索链混合两行）⑦搜索链全未配置空列表〔S11 🟡1 浏览器面〕⑧可见列表边界（首↑/末↓ disabled）⑨逗号 3 把→保存→凭据落盘（.credentials.yaml len=8 keys=3）+ Clear→refs 全清复原；截图+文件证据 /tmp/dshws-s12/；**披露：超限 11 把 = 凭据层诚实落盘不拦（keys=11 文件实证），拦截在搜索期（实现 src/keys.ts:101-107 + 单测 tests/keys.test.ts:89-95——T8 🟡-3 行号勘正）——S11 plan T6「GUI 拦截」预期按实测修正（plan 012 风险预案）**；3417 被凌晨残留实例占用（pid 61518，DSH_HOME=/tmp/dshws-review），未 kill 改用 3418） |
| T8 | 阶段 4/5 独立验证（含 S11 案卷复验闭合） | **PASS / COMPLETE**（R1-R7 逐条 PASS + 门墙七命令亲跑零偏差 + 提交链 8 枚逐枚一致 + S11 案卷闭合判定成立〔stage45 补完清单五腿全清偿 + plan 011 浏览器腿代偿成立〕+ 探针 A 独立重演红亲证 + 安全/契约/前瞻三问全过 + 冒烟四项留痕；🟡×3 记录类〔ADR 前向引用×3/fallback 论证面/行号转录〕随 T9 勘正清偿；audit-log 正本 docs/sessions/audit-logs/2026-09-04-s12-stage45-verification.md） |
| T9 | 收尾：session-12 记录 + S11 台账翻账 + 🟡×3 勘正 + STATUS/roadmap/CHANGELOG 原子收官 + merge + 接力指令 | 完成（本序列） |

### 12a 设置页布局重构批（2026-09-04，分支 feat/s12a-settings-redesign）

阶段 0 独立采信审核（无产品变更分支）**PASS**（🔴×0；🟡×1=用户二轮反馈四点=本棒主体；
冒烟 46 passed 自洽；正本 …/2026-09-04-s12a-stage0-review-of-s12.md）→ plan 012a →
阶段 2 两轮（轮 1 NEEDS REVISION 必改×4〔阶段 0 条款错锚+自核/骨架未入 T0/启动状态区
漏项/状态点 a11y 断裂〕+ 建议×6 → 全数吸收 → 轮 2 **APPROVED**；正本
…/2026-09-04-s12a-stage2-plan-review.md）→ 阶段 2.5 **用户真实批准**（第 5 次「批准，
自主推进」，含两处字面表述替换裁定：去图标改 hint 行/页头静态 intro）→ 逐一执行中。

| 任务 | 内容 | 结果 |
|---|---|---|
| T0 | 治理批：plan 012a + 阶段 0/2 audit-log + roadmap 12a 插行 + 启动全状态区（STATUS 台账/位置块/M7 总览行 + progress-M7 三处）+ session-12a 骨架 | 完成（`da4df11`） |
| T1 | 成员卡结构重排：头行（名+自绘状态点三件套+右开关 36×20 thumb）/输入独占行/hint 行（格式化文案）/footer（Clear+Save+feedback）；keyFieldNoteExample 删（21 keys） | 完成（`8f46952`；红 5 failed〔含 Input wrapper 假绿修正+旧 feedback 块漏网双渲染清除〕→ 绿 48 passed；typecheck 0；i18n 21） |
| T2 | 链区块收敛：未配置隐藏/紧凑链卡（12px 标题+badge+hint 顺序串+grid 行+28px 图标钮+280 滚动）/timeout hint 化/失败反馈红字行/fetchChain 展示移除/页头 intro+max-width 720；ⓘ/Tooltip 全撤（20 keys） | 完成（`5f70466`；红 4 failed → 绿 49 passed；数据面 fetchChain 字段不动；grep 活引用面零残留） |
| T3 | 门墙七命令（提交态）+ 台账/门墙表 + Agent Note | 完成（数字见下节门墙表；提交态 5f70466） |
| T4 | 浏览器实测棒（3419，起前 lsof 查占=空闲）：computed style 断言 + 双态截图 + 复原 | 完成（卡 padding 12/14+radius 12；输入 wrapper 高 32/r8/layer-1——**实测发现 Input 原语 wrapper 自带全部字段视觉，height:32 冗余已撤**；hint 12/18；thumb translateX(16px)；状态点 role=img aria "Not configured"；未配置态链区块不存在=0；已配置态链卡 1+品牌名行+绿开关+顺序 hint；**grid 行 5 元素占位 span 残留致 ↓ 换行——删除后 4 元素同线 rowH 40**；截图×3 与 /tmp/dshws-s12a/ 实物；Clear 复原凭据零残留；**同版本 tarball 重复 add 被 pnpm 跳过——rm node_modules 强制重装**；3416/3080/61518 零接触）——**勘误（T5 🟡-2）**：本行「height:32 冗余已撤」转写失真，d561598 实删的是 `boxSizing:'border-box'`（height:32 从未入过任何提交）；截图实物初未归档（Browser Use 截图仅入会话 artifacts），T6 已补归档双态 PNG 至 /tmp/dshws-s12a/ |
| T5 | 阶段 4/5 独立验证 | **PASS / COMPLETE**（R1-R6/R7 全 PASS + 门墙本审零偏差亲证〔client.js 终态 **24.68 kB** 落账〕+ 三问全过 + 冒烟 12a 用例 7 passed；🟡×2 记录类随 T6 清偿：截图腿补落盘 + d561598 勘误注记；audit-log 正本 …/2026-09-04-s12a-stage45-verification.md） |
| T6 | 收尾：🟡-1 截图补落盘（重启 3419 归档双态 PNG×2 至 /tmp/dshws-s12a/）+ 🟡-2 勘误注记 + session-12a 补全 + Agent Note 补坑 + STATUS/roadmap/CHANGELOG 原子收官 + merge + 接力指令 | 完成（本序列） |

### S14 溯源徽标 + fetch 调研批（2026-09-06，分支 feat/s14-toolview-attribution）

阶段 0 独立审核 S13 **PASS**（🔴×0 🟡×0 🟢×4；正本
docs/sessions/audit-logs/2026-09-06-s14-stage0-review-of-s13.md）→ plan 014（双轨：
ADR-0010 溯源接管〔priority -1 shadow + 自绘同构卡 + 两级回退 + MEMBERS 映射〕+
v2 调研〔fetch 兜底缝隙 + 余额看板地基，结论落注记〕；D1-D7）→ 阶段 2 独立计划审核
单轮 **APPROVED**（无必改；随批吸收建议×5 已折入 plan；锚点抽查 25 处亲核；正本
docs/sessions/audit-logs/2026-09-06-s14-stage2-plan-review.md）→ 阶段 2.5
AskUserQuestion 未获答，按接力序取默认批准项自主推进（S09/S10/S13 先例，披露双落
session 记录与 plan 014「2.5 默认项披露」节）→ 逐一执行中。

| 任务 | 内容 | 结果 |
|---|---|---|
| T0 | 治理批：plan 014 + 阶段 0/2 audit-log 入库（参数头审核库 v2）+ roadmap S14 行 WBS/验收指针细化 + 🟢① dont-do webview 输入派发族入册（家族第 2 次跨棒定谳）+ 启动全状态区（STATUS 台账/位置块/M7 总览行 + progress-M7 三处，含 M7 里程碑行「余 S13 策略」收官漏刷顺手勘正）+ session-14 骨架（三★节占位） | 完成（本提交） |
| T1 | 调研注记：docs/notes/2026-09-06-s14-fetch-fallback-research.md（fetch 缝隙判定 + 余额看板地基 + 版本态；锚点可复核） | 完成（`440c90e`；双 Agent 调研 + 阶段 2 复核 25 锚 + T1 三锚亲验〔src/index.ts:163 registerFetchProvider / 宿主 resolveProvider :172-194 四路抛错 / base patch :452-454 钉死〕） |
| T2 | 🟢 钉牌断言清偿（探针式红绿） | 完成（`05f230c`；「消费后下一抽不重发同把」具名断言 双策略；探针 A random deckPos 不推进 4 failed / 探针 B rr 游标不推进 3 failed〔均含本断言〕→ 还原绿 **13 passed**；src 零变更） |
| T3 | toolview 组件 + 注册（TDD 核心：websearch-row + locales +7 键〔34〕+ 注册 priority -1 + toolview.spec 八用例） | 完成（`4958fc0`；红=模块缺失 → 绿 toolview **8 passed** + client **64 passed**；typecheck 双面 0；lint 0w0e 49 files；i18n 34 keys + 18 files 零 CJK〔计划估 33，+inspect 键披露〕；**D4 回退触发**：ui-tool 发布类型 block 静默 any〔垃圾对象探针实证〕→ 本地结构镜像 + SlotMap 自 declare；WebBlock 原语弃用〔chrome labels 键面翻倍〕；entry.spec 双注册面适配 times 1→2） |
| T4 | 门墙七命令（提交态）+ 台账/门墙表 + Agent Note | 完成（数字见门墙表 S14 行；提交态 4958fc0；Note docs/notes/2026-09-06-s14-toolview-attribution.md） |
| T5 | 浏览器实测棒（3422 查占空闲；stub 3430 单口三形状：LLM SSE + 插件 deepseek 成员 + 宿主内置的 /messages；**3431 未用——拓扑简化披露**） | 完成（三轮亲见：①链路〔searchProvider: dshws-chain + 成员 baseURL 行 config 指向 stub〕→ 工具行 **`Web search | loopback proof query | · DeepSeek`** + aria "Served by DeepSeek"〔cua 坐标点击展开，locator click 假成功复发〕②直连〔dshws-deepseek 成员直服务〕同卡**无徽标** ③外来〔deepseek-official 内置 + DEEPSEEK_SEARCH_BASE_URL〕同卡**无徽标**；wire 证据 stub-log.jsonl 三段〔chat/completions tool_calls → /messages x-api-key → 终答〕；**SSE 形状坑**：宿主 chat 流式，普通 JSON 报 STREAM_CLOSED → stub 改 SSE+DONE；**workspace 播种**：storages/workspace.json 直写 canonical `/private/tmp/...`（12m 配方坑 2 复用，用户中途纠偏指向该配方）；同会话历史含 tool 消息会污染 stub 分支 → 每轮新会话；截图×3 + dump 双态 + boot log 归档 /tmp/dshws-s14/；kill 3422/3430 精确、3416/3080/61518 零接触〔3421=89220 非本棒进程注记〕；**deepseek-harness 仓 git status 亲证 clean @3281e04b59（R4）**） |
| T6 | 阶段 4/5 独立验证（R1-R7 对峙 + 三问 + firecrawl 402/429 观察项复核） | **PASS / COMPLETE**（全量门墙亲跑零偏差 + R1-R7 全 PASS〔R1 调研锚 7/7 实证 / R6 三截图内容级亲读〕+ 三问全过〔XSS 零面 + 凭据零残留 + 双 declare 论证成立 + firecrawl 观察项现状核对：search face 双 it 在档、fetch face 无——维持观察〕+ 探针有牙实证〔priority 改 0 → 注册载荷断言红 → 还原 shasum 一致 + 复跑绿 + clean 亲证〕；🟡×0；**🟢 新观察候选×1：badge 超长 id 撑宽折叠行**〔纯视觉，React 转义无安全面〕→ 入台账；audit-log 正本 docs/sessions/audit-logs/2026-09-06-s14-stage45-verification.md） |
| T7 | 收尾（session-14 补全 + 原子收官 + STATUS/roadmap/CHANGELOG + merge `--no-ff` + 接力指令） | 完成（本序列；实物 ls 清单核过） |

### S14 验收（阶段 4/5 独立 Agent 逐条对峙 2026-09-06，正本 audit-log stage45）

| 条目 | 内容 | 结论 | 证据 |
|---|---|---|---|
| R1 | fetch 调研结论在档且锚可复核 | PASS | 注记 7/7 锚亲验（resolveProvider 四路/无 settings namespace/patch 钉死/current() 对照缝/插件在产注册/watchUserPatches/构造器捕获） |
| R2 | 直连/外来/形状不符回退态 TDD | PASS | toolview.spec 八用例具 DOM 断言亲跑 8 passed |
| R3 | 接管接线有牙 | PASS | index.ts:61-66 priority -1 ↔ 安装包 d.ts:398-400 契约对峙；装拆对称断言；探针红实证 |
| R4 | 宿主源码零 diff | PASS | 宿主仓 clean @3281e04b59 亲跑；T3 五文件 imports 逐核零宿主引用 |
| R5 | 门墙全绿 | PASS | 七命令亲跑零偏差（270\|9(279)/0/0w0e 49f/59.42+27.04+41.81/五件/34 keys/clean） |
| R6 | 浏览器徽标亲见 + 隔离 | PASS | 三截图内容级亲读 + stub-log 16 段 wire + dump 双态 + 精确收口 |
| R7 | 钉牌断言顺手清偿 | PASS | keys.test:108-120 在档 + 探针红×2 留痕 + 亲跑 13 passed |

### S14b 兜底行重构批（2026-09-06，分支 feat/s14b-deepseek-fallback-row）

阶段 0 独立审核 S14a **PASS**（🔴×0；🟡×4 = 双 Agent 审计发现未入册 → 本节入册
为放行条件；正本 docs/sessions/audit-logs/2026-09-06-s14b-stage0-review-of-s14a.md
含计划模式权限限制的替代证据披露）→ 方向双裁定（对话：删卡改 ⓘ/底部说明；
AskUserQuestion：内嵌开关）→ 计划包 ExitPlanMode 批准 → 逐一执行中。

**🟡×4 入册（阶段 0 放行条件，本提交落实）**：①00-architecture §6 旧口径 → T4
注记；②noMemberConfigured 文案误标 → T3 纠偏；③宿主闲置设置卡披露 → 登记 S15
README「已知行为」节；④S14a 入账超报（🟢×3 vs 台账两行）→ T4 勘注。

| 任务 | 内容 | 结果 |
|---|---|---|
| T0 | 治理批：分支 + plan 014b + 阶段 0 audit-log 入库 + roadmap S14b 插行 + 🟡×4 台账入册 + 启动全状态区 + session-14b 骨架（三★节占位） | 完成（本提交） |
| T1 | DeepSeek 兜底行重构（TDD：locales 新键 + section.tsx 分流 + spec 更新） | 完成（`bc5871b`；ⓘ 四点语义 + 内嵌付费兜底开关 + 动态状态 + badge + 底部 footnote；删 key 输入/keySelection/Clear/Save；+4 键〔38〕；红 5 failed → 绿 section+entry **33 passed**；typecheck 0） |
| T2 | 链块两修复（disabled 视觉 + 零可用预警，TDD） | 完成（`2294e7c`；置灰 0.45 +（已停用）标注 + 零可用红色预警行；+2 键〔40〕；红 2 → 绿 29 passed） |
| T3 | 错误文案纠偏（chain/core.ts + 测试同步，TDD） | 完成（`a3cf96b`；(chain order: …) + 设置页指引句；红 1 → 绿 chain+keys+apply 63 passed + e2e 11 passed 回归） |
| T4 | 文档批（architecture §6/§9 + 台账勘注） | 完成（本提交：§6 ADR-0013 注记 + 旧口径历史化 + 卸载半句/disabled 建议勘注 + §9 索引补 0008-0013 + 入账超报勘注 + 新债两笔入册） |
| T5 | 门墙七命令（提交态）+ 台账/门墙表 | 待执行 |
| T6 | 浏览器验证（重装 tarball 重启 3423） | 待执行 |
| T7 | 阶段 4/5 独立验证 + 收尾 + merge + 接力 | 待执行 |

### S14a 装即接管批（2026-09-06，分支 feat/s14a-install-takeover）

阶段 0 独立审核 S14 **PASS**（🔴×0；🟡×1 = session-14 接力指令债务实况句漏列 L-2 →
T0 勘注处置〔时点快照不回改先例〕；🟢×2 注记；正本
docs/sessions/audit-logs/2026-09-06-s14a-stage0-review-of-s14.md）→ 方向裁定 =
用户 AskUserQuestion 获答**方案 B**（装即接管 search；A 现状/C 双接管/D GUI 均否决，
调研双 Agent 报告在案）→ 计划包 ExitPlanMode **批准** → plan 014a → 逐一执行中。

| 任务 | 内容 | 结果 |
|---|---|---|
| T0 | 治理批：plan 014a + 阶段 0 audit-log 入库 + ADR-0013 + 三 ADR 注记（0001/0004/0009）+ roadmap S14a 插行 + 🟡-1 勘注（session-14 接力指令 L-2）+ 启动全状态区 + session-14a 骨架（三★节占位） | 完成（本提交） |
| T1 | patch 变更（TDD）：cordis.patch.yml 双条目 + 内容测试 | 完成（`9884466`；红〔web 行断言 1 failed\|2 passed〕→ 绿 patch.test **3 passed**〔insert 行 / web 两键重述 + 无 name 守卫 / 不钉 fetch 链〕；src 逻辑零变更） |
| T2 | e2e 装卸载（3423 查占空闲）：翻转 / remove 单命令 diff 零输出 / 用户层终裁 | 完成（四 dump 留档 /tmp/dshws-s14a/：**装即翻转**〔add 后 searchProvider: dshws-chain + fetchProvider: http，零用户层 patch〕→ **remove 单命令 diff 基线零输出**〔DIFF_ZERO_RESTORED，优于现状手删两行〕→ **用户层终裁**〔写一行钉 dshws-deepseek → dump 用户层赢；用户层整段替换丢 fetchProvider 键时由「无配置+http 恒可用」路径兜住，README 教重述两键〕→ 清理态复原 FINAL_CLEAN_RESTORED） |
| T3 | 设置页 intro 文案 + locales + README/runbook 最小更新 | 完成（`3d09b59`；description 键扩句〔装即接管/卸载复原/fetch 可选〕，34 keys parity 维持 + 零 CJK；section.spec 字典值断言自动同步 30 passed；s05b runbook ADR-0013 增补；roadmap S15 迁移口径适配〔anysearch 卸装即切换〕；README 本体归 S15 全新撰写） |
| T4 | 门墙七命令（提交态）+ 台账/门墙表 + Agent Note | 完成（数字见门墙表 S14a 行；提交态 3d09b59；Note docs/notes/2026-09-06-s14a-install-takeover.md〔机制锚/实测语义表/维护点——S15 正素材〕） |
| T5 | 浏览器实测棒（3423/3432 查占空闲；复用 S14 stub 配方）：零用户层接线 boot → 徽标亲见 → 复原 | 完成（**R6 装即接管端到端实证**：用户层 patch 仅含 dsh-websearch 行 baseURL 测试脚手架，**web 行零手动**——boot 后一轮即闭合〔SSE 配方直通〕，工具行 `Web search \| loopback proof query \| · DeepSeek` 徽标亲见〔aria Served by DeepSeek〕；wire 三段 stub-log 在案〔chat/completions → /messages → 终答，auth 全 sk-fake-s14a〕；截图归档 screenshot-install-takeover-badge.png；kill 3423/3432 精确、3416/3080/61518/3421/3422 零接触；**宿主仓 clean @3281e04b59（R4）**；workspace 播种坑复发一次〔storages/ 目录 dump-only 不创建，mkdir 后重播——配方记忆已有该形状〕） |
| T6 | 阶段 4/5 独立验证（R1-R6 对峙 + 三问 + 探针） | **PASS / COMPLETE**（门墙七命令零偏差 + R1-R6 全 PASS〔**独立重演 e2e 三态**：新 scratch /tmp/dshws-s14a-verify + tarball 抽包核 + 用户层 [] 同样翻转双证〕+ 三问全过 + 探针红签名〔fetch 改钉 → 双断言红 2 failed → 还原复绿 3 passed + clean 亲证〕；🟡×0；🟢×3 新观察〔①AMBIGUOUS 语义精化 ②发版清单实体待 S15-S16 ③stub-log 探测残留行注记〕；audit-log 正本 docs/sessions/audit-logs/2026-09-06-s14a-stage45-verification.md） |
| T7 | 收尾（session-14a 补全 + 原子收官 + STATUS/roadmap/CHANGELOG + merge `--no-ff` + 接力指令〔全量债务口径含 L-2〕） | 完成（本序列；实物 ls 清单核过） |

### S13 优先级策略批（2026-09-04，分支 feat/s13-priority-strategy）

阶段 0 独立审核 S12b **PASS**（🔴×0；🟡×1 = session-12b/12a 记录缺「开发规范强化说明」
节〔模板漂移自 12a 起，前序审核两节口径漏检〕；🟢×5 记录类；正本
…/2026-09-04-s13-stage0-review-of-s12b.md）→ plan 013（ADR-0012 变体 B 定谳〔升序
Fisher-Yates 钉牌〕+ GUI 控件〔自绘三段 segmented〕+ 两级调用说明 hint；D1-D6）→
阶段 2 两轮（轮 1 NEEDS REVISION 必改×2〔洗牌公式未钉押硬币/fixture helper 面漏认领〕+
建议×5 → 全数吸收 → 轮 2 **APPROVED**；正本 …/2026-09-04-s13-stage2-plan-review.md）→
阶段 2.5 AskUserQuestion 未获答，按接力序取默认批准项自主推进（**推荐方案 + 变体 B**，
S09/S10 先例，披露双落 session 记录与 ADR-0012）→ 逐一执行中。

| 任务 | 内容 | 结果 |
|---|---|---|
| T0 | 治理批：plan 013 + ADR-0012（accepted，变体 B）+ 阶段 0/2 audit-log 入库 + 🟡-1 清偿（12a/12b 补节头 + 勘注）+ 🟢① STATUS 台账行序归位 + 🟢② 本台账补 CSS module 化/anysearch fetch 面两行镜像 + roadmap S13 行验收细化 + 启动全状态区 + session-13 骨架 | 完成（`e26a7dd`） |
| T1 | keys.ts 变体 B（TDD）：洗牌牌堆 + 升序 Fisher-Yates（`j = i + floor(rng() × (n − i))`，rng≡0↔恒等排列）+ 多重集不一致重建；新断言「恒值 rng 三连发 = 池排列」+「热改池值重建腿」 | 完成（`04c0e5c`；红 **2 failed\|9 passed**（现状基线 [k1,k1,k1]/[a1,a1] 真红）→ 绿 **11 passed**（钉牌单发 ：66-71 两断言存活）；apply.test 17 passed 热通路零漂移） |
| T2 | controller 通路（TDD）：MemberSectionValue/MemberSnapshot.keySelection（deriveSnapshot 默认 order）+ setKeySelection patch（revision 携带/冲突 not-ok）；section.spec 两 fixture helper 补必填字段（机械 accommodation） | 完成（`27dd261`；红 **3 failed\|17 passed** → 绿 controller 20 + section 22；typecheck 双面 0） |
| T3 | 控件 + hint（TDD）：成员卡 role=group 三段 segmented（aria-pressed/未配置禁用/成员前缀 aria-label/bg-layer-1 pressed 视觉）+ hint 插值策略名（两级语义句）；locales +5 键（27） | 完成（`7aa0e5f`；红 **3 failed\|22 passed** → 绿 client 三 spec **50 passed**；typecheck 双面 0；check:i18n 27 keys parity + 17 files 零 CJK；**执行缺陷一处当场修复：Section 解构漏 onSetKeySelection（渲染即 ReferenceError 批红，无假绿）**） |
| T4 | 门墙七命令（提交态 7aa0e5f）+ 本台账/门墙表 + Agent Note（docs/notes/2026-09-04-s13-priority-strategy.md） | 完成（数字见门墙表 S13 行） |
| T5 | 浏览器实测棒（3421，起前 lsof 查占=空闲）：六卡控件/默认序/hint + fake 值→Configured 解禁 + 关开关→切 Random→settings.yaml 深合并同存 + 截图归档 + Clear 复原 | 完成（六卡 group×6 + Order pressed 默认 + 未配置禁用亲见；Random [pressed] + hint 实时「"Random"」；**实物在盘：settings.yaml `tavily: {enabled: false, keySelection: random}` 同存——deep-merge 兄弟字段存活实测**；截图 screenshot-tavily-random.png 归档 /tmp/dshws-s13/；Clear→Not configured+refs:{} 复原亲读〔browser-session grant=宿主自身连接密钥，非凭据〕；kill 17316 精确、3416/3080/61518 零接触；**坑：后台 webview locator click 不派发（两次超时）——cua 坐标点击通路可用，dom_cua click 假成功无效果**） |
| T6 | 阶段 4/5 独立验证（全量唯一责任点 + R1-R6 对峙 + 三问） | **PASS / COMPLETE**（门墙七命令亲跑零偏差 + 增量 +8 逐文件亲数 + ADR-0012 与实现逐句对照 + 安全/契约/前瞻三问全过 + client/node 默认 order 六成员对称亲证；**🟡×1 抓获：#sameMultiset 漏 `left<=0`——重复多重集平移（k1,k1,k2→k1,k2,k2）陈旧牌堆存活〔探针实证〕→ b08b26e 当场清偿（S12b 先例）**；🟢×2〔STATUS 行序——b08b26e 顺手归位；失败不回牌钉牌断言——入台账归 S14/S15〕；🟡-1 复验 **CONFIRMED**（同 Agent：diff 逐行/判别力双推演/261\|9(270) 亲跑）；audit-log 正本 docs/sessions/audit-logs/2026-09-04-s13-stage45-verification.md） |
| T7 | 收尾：🟡-1 清偿批 + session-13 补全 + 原子收官（dont-do ⑤ ls 清单）+ STATUS/roadmap/CHANGELOG + merge `--no-ff` + 接力指令 | 完成（本序列） |

### S13 验收（阶段 4/5 独立 Agent 逐条对峙 2026-09-04，正本 audit-log stage45）

| 条目 | 内容 | 结论 | 证据 |
|---|---|---|---|
| R1 | ADR-0012 在档且与实现一致 | PASS | adr-0012 accepted 在档；公式逐字符等价（ADR ↔ keys.ts #shuffle）；多重集重建/失败不回牌/成员级注记/2.5 披露逐句对峙；🟡-1 缺口已清偿复验 CONFIRMED |
| R2 | 变体 B 测试面 | PASS | pre-fix 有放回亲证（git show 04c0e5c^）→ 恒值 rng 三连发真红；红绿 2f\|9p→11p + 🟡-1 腿 1f\|11p→12p；钉牌单发 ：66-71 零漂移 |
| R3 | GUI 控件通路 | PASS | controller.spec patch 载荷逐字断言；deriveSnapshot 显式默认 order（六成员与 node resolveConfig 对称亲证）；未配置禁用；deep-merge 实物在盘 |
| R4 | 说明 UI + i18n | PASS | zh hint 逐字含「单把失败不换把，直接降级下一成员」；{policy} 渲染层插值；27 keys parity + 17 files 零 CJK |
| R5 | 门墙七命令 | PASS | T4 提交态 + T6 独立复验 + 🟡-1 清偿复验三层亲跑零偏差（终态 261\|9(270) / exit 0 / 0w0e / 59.42+27.04+29.98 / 五件 / 27+17 / clean） |
| R6 | 浏览器实物 + 隔离 | PASS | /tmp/dshws-s13/ 五件亲见 + settings.yaml 实读 + 截图非空亲阅 + refs:{} 复原 + 3421 精确收/常驻零接触 |

### 12b 设置页信息收敛批（2026-09-04，分支 feat/s12b-page-info-deepseek）

阶段 0 独立采信审核 **PASS**（🔴×0；冒烟 49 passed；正本
…/2026-09-04-s12b-stage0-review-of-s12a.md——初审执行在先落盘遗漏由阶段 2 复审抓获）
→ plan 012b（含 DeepSeek 双配置分析四点结论 + 两级调用逻辑现状 + S13 衔接）→ 阶段 2
两轮（轮 1 NEEDS REVISION 必改×2〔locale 键算术 20→22/断言改写面穷举〕+ 建议×5 →
全数吸收 → 轮 2 残留 R-M1 阶段 0 正本漏落盘 → 补落后即 **APPROVED**；正本
…/2026-09-04-s12b-stage2-plan-review.md）→ 阶段 2.5 **用户真实批准**（第 6 次「批准
推荐方案」——D2 裁定 DeepSeek 卡保留+澄清 badge）→ 逐一执行中。

| 任务 | 内容 | 结果 |
|---|---|---|
| T0 | 治理批：plan 012b + 阶段 0/2 audit-log + roadmap 12b 插行 + S13 WBS 增补 + 启动全状态区 + session-12b 骨架 | 完成（`e9b2e66`） |
| T1 | 页头单图标：六卡 hint 删 + h3 后 IconQuestionOutline14+Tooltip（keyFieldNote 文案） | 完成（`ba61392`；红 1 failed → 绿 49 passed；i18n 20 keys 不变） |
| T2 | DeepSeek 澄清 badge：头行 11px 胶囊（title 展开句）+ 两新键（22 keys） | 完成（`1708cbe`；红 1 failed → 绿 50 passed；typecheck 0） |
| T3 | 门墙七命令（提交态）+ 台账/门墙表 + Agent Note（两级调用逻辑表 + DeepSeek 结论） | 完成（数字见门墙表 12b 行；提交态 1708cbe） |
| T4 | 浏览器实测棒（3420，起前查占=空闲）：页头图标 tooltip/六卡 hint 零残留/deepseek badge/截图归档 | 完成（页头 anchor+tooltip 文案亲见〔**focus() 在 webview 后台态不生效——focusin 冒泡触发**，手法沉淀〕；六卡 hint 0；badge text+title 完整且他卡零污染；未配置链区块 0+开关灰；截图 screenshot-header-tooltip.png 归档 /tmp/dshws-s12b/；无 fake 值写入故无复原面；3416/3080/61518 零接触） |
| T5 | 阶段 4/5 独立验证 | **PASS / COMPLETE**（R1-R5 全 PASS + 门墙本审零偏差亲证 + 浏览器截图实物采信 + 三腿全过 + 冒烟 12b 用例 2 passed；🟡×1 随 T6 补守卫清偿；audit-log 正本 …/2026-09-04-s12b-stage45-verification.md） |
| T6 | 收尾：🟡-1 补卡内 tooltip null 守卫（22 passed）+ session-12b 补全 + 原子收官（dont-do ⑤ ls 清单）+ merge + 接力指令 | 完成（本序列） |

### S09 验收（阶段 4/5 独立 Agent 逐条对峙 2026-09-03，正本 audit-log stage45）

阶段 0 独立审核 S08 **PASS**（🔴×0；审核面外 🟡×1 = roadmap M5 尾注 S09→S12 漏刷，
T0 清偿 `1290b5b`）→ plan 009 落盘 → 阶段 2 轮 1 **NEEDS REVISION**（必改 ×3：热增 ref
gate 生命周期/空池文案对齐 ADR 正本/T0 清偿范围；建议 ×7）→ 全数吸收 → 同 Agent 点验
**APPROVED**（残留 R1-R6 随批吸收，含 prime/refresh 次序勘误）→ 阶段 2.5 AskUserQuestion
未获答，按接力序取默认批准项自主推进（披露，session 记录双落——S03-S07 同款兜底口径）。

| 任务 | 内容 | 结果 |
|---|---|---|
| T0 | 治理批：plan 009 + 阶段 0/2 audit-log + 🟡 S09→S12 陈旧引用穷举清偿（四文件六处含 grep 复验）+ STATUS 启动刷新 + progress-M7 新开 | 完成（`1290b5b`，master 直提） |
| T1 | config 五成员 × 四件制品增 extraApiKeyEnvs + keySelection（z.union schema 约束） | 完成（`b89a285`；红 4 failed\|9 passed → 13 passed；32 处测试字面量机械补缺省；hostile cast） |
| T2 | src/keys.ts KeyPool（三策略/就绪过滤/空池自抛列池/游标+rng 注入） | 完成（`742e183`；红=模块缺失 → 9 passed；2 lint warning 两次 amend 清偿——T2 提交链内自查捕获） |
| T3 | index.ts 池化接线（全池校验/pool thunk/gate 全池/prime 扩池）+ settings.ts onCommitted 钩子（refresh→prime 次序） | 完成（`73a90c6`；红 3 failed\|11 passed → 14 passed；CredentialProvider 未用导入连带清偿） |
| T4 | settings 热通路（apply.test 三行为：热切策略/pre-stored-key/热删收缩） | 完成（`a5aa7a7`；**首跑即红** = keyPool 工厂 refs 静态化（必改 1 警告形态，T4 ② 守护红线命中）→ 活端口修复 → 全绿；fakeCtx values 扩展） |
| T5+T6 | client：locales +4 键（23 键）+ controller extraRefs/池校验/addExtra/removeExtra + section 附加 keys 列表（ExtraKeyRow） | 完成（`bdc2c70`；红 12 failed\|39 passed → 51 passed；T5/T6 合并提交——SectionProps 签名变更与渲染面同 commit 保门墙绿） |
| T7 | e2e 轮换：loopback auths 记录 + round-robin/order/random 三场景 | 完成（`5162870`；10 passed；**牙齿证明**：策略探针 order 化 → auths k1×3 恒序红 → 还原） |
| T8 | 浏览器多 key GUI 实测（scratch 3414，主 Agent IAB 实测棒） | 完成（`c9bda05`；三断言全过：添加 ref→settings.yaml 落盘/写 fake 值→Saved+凭据 refs/Clear+Remove→refs:{}+extras:[]；kill 45497 精确零残留） |
| T9 | 门墙七命令（提交态）+ 本台账 + Agent Note（docs/notes/2026-09-03-s09-multi-apikey.md） | 完成（数字见下节门墙表） |
| T10 | 阶段 4/5 独立验证 | **PASS / COMPLETE**（R1-R5 逐条 PASS：keys 9 + loopback 10 亲跑含 wire 轮换 + providers 零改动 diff 双点亲证 + 空池文案 ADR 正本逐字对齐 + 门墙七命令亲跑零偏差 + 隔离法证（3414=0/3080=90269 未动/s05b-s08 早窗）+ 三问全过；**🟡 ×1 抓获：台账增量算术 +30 应为 +34** → T11 更正清偿；🟢×3 注记；audit-log 正本 docs/sessions/audit-logs/2026-09-03-s09-stage45-verification.md） |
| T11 | 收尾（🟡 算术更正 + index.ts 注释同义收敛随批 + 本文件 + session 记录 + STATUS/roadmap/CHANGELOG 原子收官 + merge `--no-ff` + 接力指令） | 完成（本序列） |

### 门墙实测数字（提交态，node v22.23.2 / pnpm 11.7.0）

| 棒 | 命令（七件全名） | 数字 |
|---|---|---|
| S06/S07/S08 | （历史） | 正本 progress-M4/M5 门墙表 |
| S09 | ①`pnpm test` → **25 files（24 passed + 1 skipped），Tests 237 passed \| 8 skipped (245)**（211→245：**+34**——keys 9 + apply 6 + config 4 + controller 8 + section 3 + locales 1 + loopback 3；既有零破坏；T10 勘误：T9 原记 +30）②`pnpm typecheck` → exit 0 双面 ③`pnpm lint` → **0 warnings 0 errors（44 files，96 rules）**④`pnpm build` → **增量披露（D7）：index.js 49.00→52.61 kB / index.d.ts 21.89→25.19 kB / client.js 20.54→27.17 kB**（src 本棒必变）⑤`npm pack --dry-run` → 五件 ⑥`pnpm check:i18n` → exit 0（**23 keys** parity + 16 files 零 CJK）⑦`git status --short` 前后置 clean | S09 T9 提交态亲跑 |



## 阶段验收（R1-R5，阶段收官时填）

### S09 验收（阶段 4/5 独立 Agent 逐条对峙 2026-09-03，正本 audit-log stage45）

| 条目 | 内容 | 结论 | 证据 |
|---|---|---|---|
| R1 | 池与策略可重放 | PASS | keys.test 9 passed（三策略/就绪过滤/空池自抛列池）+ loopback 10 passed（round-robin auths 轮换 wire 级/order 跳未配置 primary/random ∈ 就绪集）+ 牙齿证明红签名 5162870 + 空池文案与 ADR-0008 Decision 3 逐字对齐（keys.ts:83-84） |
| R2 | 默认零变化 + 热生效 | PASS | apply 17 + settings 6 = 23 passed（热切策略/pre-stored-key 次序/热删收缩）；providers 81 passed 仅机械缺省字面量（行为断言逐字未动）；resolveConfig 显式 `?? []`/`?? 'order'` ×五成员 |
| R3 | GUI 多 key 通路 | PASS | client 51 passed（extraRefs 快照/池外拒绝/整表 patch/行渲染/追加/移除）+ check:i18n exit 0（23 keys + 16 files）+ T8 实物三件对上（settings-after-add/现 settings/credentials refs:{}） |
| R4 | 门墙七命令（提交态） | PASS | test 25 files 237\|8(245) / typecheck exit 0 / lint 0w0e 44 files / build 增量披露 52.61+25.19+27.17（D7 口径）/ pack 五件 / check:i18n exit 0；前后 git status clean |
| R5 | 五子证据 | PASS | ①隔离（3414 LISTEN=0/3080=90269 未动/s05b-s08 早窗/fake 值 refs:{} 复原）②门墙（上）③收尾件套（T11 序列）④原子翻转 + `--no-ff` ⑤audit-log 三份正本 |

## 阶段验收（R1-R5，阶段收官时填）

### S10 验收（阶段 4/5 独立 Agent 逐条对峙 2026-09-03，正本 audit-log stage45）

| 条目 | 内容 | 结论 | 证据 |
|---|---|---|---|
| R1 | anysearch 成员全链路 | PASS | anysearch.test 13 passed（信封成功/snippet 优先级两形/content 回退/信封 code≠0/429/断网/abort/bad JSON/zone 透传/available）+ loopback 11 passed（信封场景 content→snippet wire 复证 + servedBy）+ BUILT_IN 尾部追加断言 + 既有场景零漂移 |
| R2 | GUI 六卡 + key 写通路 | PASS | client 51 passed（成员清单六项/anysearch 默认 ref）+ T7 三断言（六卡序/写 fake 值翻转+refs 落盘/Clear 复原）+ /tmp/dshws-s10/ 实物亲读 |
| R3 | 共存语义在档 + 真实 smoke 自跳 | PASS | ADR-0009 Decision 5（id 零冲突 + patch 后写覆盖）+ Agent Note 共存节 + anysearch.real 1 passed\|1 skipped 亲见 |
| R4 | 门墙七命令（提交态） | PASS | test 27 files 257\|9(266) / typecheck exit 0 / lint 0w0e **47 files**（T9 勘误）/ build 增量披露 58.09+28.70+27.30 / pack 五件 / check:i18n exit 0（23 keys + 17 files）；前后 git status clean |
| R5 | 五子证据 | PASS | ①隔离（3415 LISTEN=0/3080=90269 未动/s05b-s09 早窗/sk-fake-anysearch 零残留亲扫/refs:{} 复原亲读）②门墙（上）③收尾件套（T10 序列）④原子翻转 + `--no-ff` ⑤audit-log 三份正本 |

## 技术债（台账）

| 债务 | 等级 | 归属 |
|---|---|---|
| S11 遗留腿四笔：jsdom 过滤负路径断言 / 混合序列交换断言 / 牙齿探针 / 浏览器棒（T6） | 🟡 | ~~S12 T3/T5/T7 清偿 + T8 复验闭合~~ **已翻账（2026-09-04 T9）：四腿全清偿，T8 独立复验判定 S11 验收采信链闭合（正本 docs/sessions/audit-logs/2026-09-04-s12-stage45-verification.md 第二节；S11 🔴2 证据面就此闭合）** |
| L-2 per-profile GUI 覆盖二期候选 | 🟢 | 维持不排期（plan 009 债务映射节正本） |
| fetch 链排序 UI | 🟢 | 维持不排期（S07 登记） |
| 「恢复默认序」按钮 | 🟢 | 维持不排期（S07 登记） |
| 设置页 CSS module 化（内联 style 收敛） | 🟢 | 维持不排期（12a 登记；S15 顺手候选——**本行为 S13 T0 补镜像**，原登记 plan 012a） |
| anysearch fetch 面（fetch 链成员 v1 不做） | 🟢 | 维持不排期（S10 登记——**本行为 S13 T0 补镜像**） |
| 「失败不回牌」无直接钉牌断言（结构保证：抽牌即消费无重试环） | 🟢 | ~~S14/S15 顺手补一条~~ **已翻账（2026-09-04 登记 → S14 T2 清偿 `05f230c`）**：「消费后下一抽不重发同把」具名断言双策略在档（keys.test；探针红×2 还原绿 13 passed） |
| firecrawl fetch 面 402/429 it 独立覆盖 | 🟢 观察 | M3 台账正本；S14 复核（2026-09-04 重排）——**已复核（2026-09-06 stage45）**：search face 双 it 在档（firecrawl.test.ts:115-127），fetch face 无独立 402/429 it（仅 requestFailed/badResponse）——描述准确，维持观察 |
| 溯源徽标 badge 超长 id 撑宽折叠行（flexShrink:0 无截断，与 summary ellipsis 不对称；纯视觉，React 转义无安全面） | 🟢 观察 | S14 阶段 4/5 登记（2026-09-06）；宿主 WebRow 对齐维护点顺手候选 |
| 一行否决（用户层仅钉 searchProvider）在有 firecrawl key 场景 → http 与 dshws-chain-fetch 双 usable → WEB_PROVIDER_AMBIGUOUS 硬错（响亮失败非静默） | 🟢 观察 | S14a 阶段 4/5 登记（2026-09-06）；S15 手册按「否决/自定义亦重述两键」口径写 |
| 发版清单「追平重述 web config」条目实体待建 | 🟢 观察 | S14a 阶段 4/5 登记；S15/S16 创建清单时从 s14a Note §5.1 搬运，勿凭记忆重写 |
| 宿主设置页闲置的 web-search-deepseek 配置卡（接管后不生效仍在；其 key 保存为对 DEEPSEEK_API_KEY 的单值写入点） | 🟢 | S14b 阶段 0 入册（2026-09-06，双审计发现）；披露正文归 S15 README「已知行为」节 |
| 00-architecture.md 其余陈旧（§1 五 provider 缺 anysearch / §3 模块树 / §5 config 模型 / 悬空附录指针） | 🟢 | S14b 阶段 0 入册；S15 文档腿全面刷新（§6/§9 已由 S14b T4 注记） |
| 〔勘注 2026-09-06，S14b T4〕S14a 收官 commit 4d8f921 称「🟢×3 新观察入台账」，实物为两行（第三项 stub-log 探测残留行留 session 记录注记未登台账）——记录性超报，时点快照不回改，本行即为对齐 | 勘注 | S14a 阶段 0 复核抓获 |
| i18n CI 接线 | 🟢 观察 | S15 手册项（2026-09-04 重排） |
| tsdown 弃用 ×2 / vitest sourcemap / s06 mtime 口径 | 🟢 观察 | S15 升级演练顺手项（2026-09-04 重排）/ 上游包产物 / 留痕口径 |
| 牙齿证明惯例沉淀为治理通用实践 | 🟢 观察 | 无主候选（各棒实录累证） |
| v2 backlog：余额/积分定期统计与数据看板 | 🟢 v2 | ADR-0008 缓议章节；未排期——**S14 T1 地基调研已落档**（docs/notes/2026-09-06-s14-fetch-fallback-research.md §2：宿主 client 零 usage/balance slot，可借面 settings.section/sidebar.footer.action；provider 余额 API 调研属 v2 正式立项内容） |
| v2 backlog：fetch 兜底开关 | 🟢 v2 | 未排期——**S14 T1 缝隙判定已落档**（同注记 §1：宿主单赢家无降级 + fetch 无 settings namespace + 唯一外挂缝 = registerFetchProvider 新 id + patch 钉 fetchProvider + 内部回落 HttpFetchProvider；热切上限 = patch live reload，GUI 热开关需上游） |

## 已验锚点（台账）

| 锚点 | 验证来源 |
|---|---|
| gate 池化友好：src/credentials.ts:56-60（prime 任意 ref 列表，加法幂等只 add 不清）+:63-65（per-ref isReady）+:68-69（#refresh 不吸纳未 watched ref——热增 ref 必须 settings 提交侧 re-prime） | S09 阶段 0/2 审核亲验（必改 1 证据链） |
| thunk 落点：src/index.ts:149-186（每成员 resolveXxxMemberOptions + resolveCredentialValue）+ shared.ts:87-109 resolveMemberApiKey 三态（abort/解析失败/缺失） | S09 阶段 1/2 亲读 |
| settings 数组 patch 整字段替换：宿主 settings/src/index.ts:277-292 mergeLayers；活动例 = 本仓 controller.ts moveSearchChainEntry 整数组回写 | S09 阶段 1/2 亲读 |
| schemastery z.union 枚举可用（非法值拒绝、缺省透传不注入默认） | S09 阶段 2 轮 1 审核 Agent 实测（建议 7）；T1 一行确认留痕 |
| 测试基线 | S07：196\|6(202)；**S08：203\|8(211)**（24 files）；S09 起点自本行 |
