# Progress — M5 交付就绪

> 本文件是 M5 阶段（验证与文档）的进度台账。2026-09-02 新开（Session 08）。
> 验收契约：`docs/plans/2026-09-02-008-s08-e2e-loopback-plan.md` 的 R1-R5 验收条目，
> 阶段验收逐条对应给 PASS/FAIL + 证据；🟢 债务归属映射正本在 plan 008 债务映射节。

## 里程碑

| 里程碑 | 内容 | 状态 |
|---|---|---|
| M1 治理与规划定稿 | 治理产物齐备且占位符清零，计划过独立审核与人工终审 | ✅ 2026-09-02 |
| M2 可行性定谳 | GUI 形态、安装链路、交付形态有实测结论，ADR-0006/0007 定稿 | ✅ 2026-09-02 |
| M3 宿主包完备 | 五 provider + 链 + 凭据/设置全绿，安装端到端可复现 | 🚧（机械面 ✅ S05b；余用户 with-key 槽位回填——指引 docs/notes/2026-09-02-s05b-install-runbook.md §4） |
| M4 设置页完备 | GUI 全流程（配 key→启停→排序→热生效）浏览器实测通过 | ✅ 2026-09-02（S06+S07；热生效复合证据 plan 007 D6） |
| M5 交付就绪 | e2e 收口全绿，文档自洽可复现 | 🚧（e2e 收口腿 ✅ 2026-09-02 S08；文档腿 S12——2026-09-03 特性批次前置顺延） |
| M6 上游验收通过 | 用户在上游全新构建上完成验收清单 | ⏳ |
| M7 功能扩展 | 每成员多 APIKEY 池 + anysearch 第六成员 + session 溯源徽标（ADR-0008/0009/0010） | ⏳（S09/S10/S11 三棒；台账随 S09 开棒另立 progress-M7） |

## 进行中

- 无（S08 收官；2026-09-03 功能扩展计划获批——特性三棒前置，下一棒 S09 多 APIKEY 归 M7 台账）

## 待启动

- Session 12（README + 迁移 + 升级手册，原 S09 顺延）——前置：特性三棒 S09/S10/S11（M7）收官后开棒；素材在档：S08/S06/S07 notes + S05b runbook + ADR-0008/0009/0010

## 已完成

### S08 e2e 收口批（2026-09-02，分支 feat/s08-e2e-loopback）

阶段 0 独立审核 S07 **PASS**（🔴×0；🟡 新增×0；client 39 + chain 33 子集亲跑 + 9 commits
逐枚吻合 + 🟡 三笔清偿核验 + 誊写纪律抽查通过）→ plan 008 落盘 → 阶段 2 轮 1 **NEEDS
REVISION**（必改 ×1：M1 断言可观察面——reason 是 message 非 code、降级场景无摘要对象；
建议 ×3）→ 全数吸收 → 同 Agent 点验 **APPROVED**（6/6 闭合，41 锚点 0 虚构）→ 阶段 2.5
**用户真实批准**「批准，自主推进」（第 2 次真实人工批准，S05b 后首例；本记录与 session
记录双落）。

| 任务 | 内容 | 结果 |
|---|---|---|
| T0 | 治理批：plan 008 + 阶段 0/2 audit-log + STATUS 启动刷新 + progress-M5 新开 | 完成（`796b011`，master 直提） |
| T1 | fakeCtx 抽取 `tests/helpers/fake-ctx.ts`（apply.test.ts 迁移）+ `tests/e2e/helpers/loopback-server.ts`（瞬时端口/行为表/到达序/closedPort/teardown） | 完成（`bd25257`；apply 11 passed 零漂移；TS18047 narrowing 修正） |
| T2 | 场景批 A：断网降级 / 429 降级 / 超时降级 | 完成（`b67bcf3`；3 passed；首轮红 = exa 线材缺 highlights（测试线材非产品码）；**牙齿证明**：链序反转探针红→还原实录） |
| T3 | 场景批 B：顺序保持（到达序逐位=config 序）+ skip 不计序 + 全败（EXHAUSTED+逐成员行+cause） | 完成（`ca4fe6d`；6 passed 累计；TS2352 cast 修正） |
| T4 | 场景批 C：钉死直连不降级（直调注册表实例 → 成员码原样 + 零链介入） | 完成（`2acfb01`；7 passed 累计；servedBy 双承载已随批 A/B 落地） |
| T5 | 链级真实 API smoke（tests/e2e.real/chain.real.test.ts，无 key 自跳） | 完成（`bc5d068`；2 skipped 亲见） |
| T6 | 门墙七命令 + lint warning 清偿 + 本台账 + Agent Note（docs/notes/2026-09-02-s08-e2e-loopback.md） | 完成（数字见下节门墙表；**T1 迁移残留未用导入 warning 由 T6 门墙抓获清偿**——T1 时 lint 只核了末行未核 Found 行，教训在案） |
| T7 | 阶段 4/5 独立验证 | **PASS / COMPLETE**（R1-R5 逐条 PASS：七场景断言面逐条亲验 + 门墙七命令亲跑零偏差 + src 零触碰 diff 全景 + apply 测试体逐字节一致 + 三问全过；**🟡 ×1 抓获：assemble 内部失败路径服务器泄漏缺口**→T8 清偿；🟢×4 簿记级注记；audit-log 正本 docs/sessions/audit-logs/2026-09-02-s08-stage45-verification.md） |
| T8 | 收尾（🟡-1 assemble catch-close 加固随批 + 本文件 + session 记录 + STATUS/roadmap/CHANGELOG 原子收官 + merge `--no-ff` + 接力指令） | 完成（本序列；加固后 loopback 7 passed 复验 + typecheck/lint 绿） |

### 门墙实测数字（提交态，node v22.23.2 / pnpm 11.7.0）

| 棒 | 命令（七件全名） | 数字 |
|---|---|---|
| S06/S07 | （历史）test / typecheck / lint / build / npm pack --dry-run / check:i18n | 正本 progress-M4 门墙表 |
| S08 | ①`pnpm test` → **23 passed files + 1 skipped file（24），Tests 203 passed \| 8 skipped (211)**（202→211：loopback +7 + 链级真实 smoke skip 2；8 skipped = 6 既有 + 2 新自跳）②`pnpm typecheck` → exit 0 双面 ③`pnpm lint` → **0 warnings 0 errors（42 files，96 rules）**④`pnpm build` → **node 面 49.00+21.89 + client.js 20.54 kB 与 S07 逐字节零漂移（src 零变更预期兑现）**⑤`npm pack --dry-run` → 五件 ⑥`pnpm check:i18n` → exit 0（19 keys + 15 files）⑦`git status --short` 前置/后置 clean | S08 T6 提交态亲跑 |

## 阶段验收（R1-R5，阶段收官时填）

### S08 验收（阶段 4/5 独立 Agent 逐条对峙 2026-09-02，正本 audit-log stage45）

| 条目 | 内容 | 结论 | 证据 |
|---|---|---|---|
| R1 | 七场景 e2e 绿 | PASS | 亲跑 7 passed (7)；断言面逐场景核对：断网（reason 前缀正则 + 到达序 [exa]）/429（HTTP 429 + body {}）/超时（MEMBER_TIMEOUT 标记 + elapsed 下界）/顺序保持（到达序逐位=config 序）/skip 不计序（零到达）/全败（EXHAUSTED+三行按序+cause.code）/钉死直连（成员码原样+零链日志）；servedBy content 首行 ×5 处 |
| R2 | 真实 API 自跳 | PASS | 无 key 环境亲跑：chain.real 2 skipped 亲见 + 既有五件零触碰（diff 仅新增）；有 key 路径代码走查沿先例 |
| R3 | 装配零回归 | PASS | apply 11 + chain 33 = 44 passed 亲跑；fakeCtx 抽取机械一致性逐行比对（唯一行为差 = logger 捕获）；apply.test.ts 测试体逐字节一致 |
| R4 | 门墙七命令（提交态） | PASS | test 203\|8(211) / typecheck exit 0 / lint 0w0e 42 files / build 三件与 S07 零漂移 + **src/ 零触碰**（diff 全景 11 文件 = docs×6 + tests×5）/ pack 五件 / check:i18n exit 0；前后 git status clean |
| R5 | 五子证据 | PASS | ①隔离（零实例/零浏览器/零 /tmp；端口 ephemeral 亲读；lsof 零残留）②门墙（上）③收尾件套（T8 序列）④原子翻转 + `--no-ff` ⑤audit-log 三份正本 |

## 技术债（台账）

| 债务 | 等级 | 归属 |
|---|---|---|
| L-2 per-profile GUI 覆盖二期候选 | 🟢 | 维持不排期（plan 007/008 债务映射节） |
| fetch 链排序 UI | 🟢 | 维持不排期（S07 登记） |
| 「恢复默认序」按钮 | 🟢 | 维持不排期（S07 登记） |
| firecrawl fetch 面 402/429 it 独立覆盖 | 🟢 观察 | M3 台账正本；S08 loopback 不含 fetch 链（plan 008 D2），S12 复核 |
| i18n CI 接线 | 🟢 观察 | S12 手册项 |
| tsdown 弃用 ×2 / vitest sourcemap / s06 mtime 口径 | 🟢 观察 | S12 升级演练顺手项 / 上游包产物 / 留痕口径 |

## 已验锚点（台账）

| 锚点 | 验证来源 |
|---|---|
| 装配层：src/index.ts:89-206（apply 全序）+ fakeCtx 台架 tests/apply.test.ts:26-81（providers Map/configured Set/settings hooks/emitter/flushGate :83-85） | S08 阶段 1 摸底 + 阶段 2 轮 1 审核亲验（41 处 0 虚构） |
| 链层：src/chain/core.ts:133-184（run/选用门/超时 race/降级）+:162 served-by 日志+:171 caller-abort 直传+:173-177 reason=error.message+:204-210 withServedBy 首行/单行 | S08 阶段 1/2 亲读（M1 断言面修正依据） |
| 错误层：src/errors.ts:93-101（EXHAUSTED 逐成员行 + 末位 cause）+ core.ts:174（DSHWS_MEMBER_TIMEOUT 合成标记） | S08 阶段 1/2 亲读 |
| HTTP 面：tavily.ts:130 / exa.ts:136 POST {base}/search；perplexity.ts:146 POST {base}/chat/completions 且 :115-127 content 载体；shared.ts:66-75 unfoldHttpErrorDetail 三成员替换/追加不对称 | S08 阶段 1/2 亲读（D4/D6 依据） |
| 测试基线 | S06：184\|6(190)；**S07：196\|6(202)**（22 files）；S08 起点自本行 |
