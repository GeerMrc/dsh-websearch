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
| M5 交付就绪 | e2e 收口全绿，文档自洽可复现 | 🚧（e2e 收口腿 ✅ 2026-09-02 S08；文档腿 S12） |
| M6 上游验收通过 | 用户在上游全新构建上完成验收清单 | ⏳ |
| M7 功能扩展 | 每成员多 APIKEY 池 + anysearch 第六成员 + session 溯源徽标（ADR-0008/0009/0010） | 🚧（S09 多 APIKEY 棒 ✅；余 S10 anysearch 成员 = 进行中、S11） |

## 进行中

- Session 10（anysearch 第六成员）——T0 进行中，T1-T10 待执行

## 待启动

- S11（session 溯源增强，M7 第 3 棒）→ S12 手册（原 S09 顺延）→ S13 上游验收准备（原 S10 顺延）

## 已完成

### S09 多 APIKEY 池批（2026-09-03，分支 feat/s09-multi-apikey-pool）

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

## 技术债（台账）

| 债务 | 等级 | 归属 |
|---|---|---|
| L-2 per-profile GUI 覆盖二期候选 | 🟢 | 维持不排期（plan 009 债务映射节正本） |
| fetch 链排序 UI | 🟢 | 维持不排期（S07 登记） |
| 「恢复默认序」按钮 | 🟢 | 维持不排期（S07 登记） |
| firecrawl fetch 面 402/429 it 独立覆盖 | 🟢 观察 | M3 台账正本；S12 复核 |
| i18n CI 接线 | 🟢 观察 | S12 手册项 |
| tsdown 弃用 ×2 / vitest sourcemap / s06 mtime 口径 | 🟢 观察 | S12 升级演练顺手项 / 上游包产物 / 留痕口径 |
| 牙齿证明惯例沉淀为治理通用实践 | 🟢 观察 | 无主候选（各棒实录累证） |
| v2 backlog：余额/积分定期统计与数据看板 | 🟢 v2 | ADR-0008 缓议章节；未排期（需 provider 余额 API 调研 + 看板 slot 选型，届时另立 ADR） |

## 已验锚点（台账）

| 锚点 | 验证来源 |
|---|---|
| gate 池化友好：src/credentials.ts:56-60（prime 任意 ref 列表，加法幂等只 add 不清）+:63-65（per-ref isReady）+:68-69（#refresh 不吸纳未 watched ref——热增 ref 必须 settings 提交侧 re-prime） | S09 阶段 0/2 审核亲验（必改 1 证据链） |
| thunk 落点：src/index.ts:149-186（每成员 resolveXxxMemberOptions + resolveCredentialValue）+ shared.ts:87-109 resolveMemberApiKey 三态（abort/解析失败/缺失） | S09 阶段 1/2 亲读 |
| settings 数组 patch 整字段替换：宿主 settings/src/index.ts:277-292 mergeLayers；活动例 = 本仓 controller.ts moveSearchChainEntry 整数组回写 | S09 阶段 1/2 亲读 |
| schemastery z.union 枚举可用（非法值拒绝、缺省透传不注入默认） | S09 阶段 2 轮 1 审核 Agent 实测（建议 7）；T1 一行确认留痕 |
| 测试基线 | S07：196\|6(202)；**S08：203\|8(211)**（24 files）；S09 起点自本行 |
