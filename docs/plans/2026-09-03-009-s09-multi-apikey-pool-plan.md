# Plan — 2026-09-03-009-s09-multi-apikey-pool-plan

> plan 是验收契约：R 验收条目是 progress 台账阶段验收的对照正本，验证矩阵是各阶段验证的
> 单源引用。本棒为核心逻辑棒（src 面新增 keys.ts + config/index/controller/section 扩展）：
> 契约类任务 TDD 红→绿逐一执行；e2e 轮换场景为验证类 + 牙齿证明（一次性变异探针，红签名
> 入 commit 不入库）；浏览器 GUI 实测沿 S06/S07 D5 配方（scratch 隔离 + fake 值 + unset 复原）。

## 目标

S09 交付 roadmap M7 行「多 APIKEY 池 + 选择策略」（ADR-0008）：每成员 `extraApiKeyEnvs`
（多凭据 ref 池）+ `keySelection`（order/round-robin/random，缺省 order = 现状零变化）；
KeyPool 在凭据解析层轮换（provider 文件零改动）；gate 全池语义（任一 ref configured 即就绪，
全空才 CREDENTIAL_MISSING）；GUI 附加 keys 列表（自绘仿链排序）；loopback 以 Authorization
header 实证轮换；settings 热生效；浏览器实测多 key GUI 面。

## 背景

任务源 = `docs/session-roadmap.md` M7 段 Session 09 行；架构决策正本 = ADR-0008（多 ref
形态/策略语义/gate 语义/字面量明文排除）；功能扩展计划 = 2026-09-03 用户批准（ExitPlanMode）。

阶段 0 独立审核（2026-09-03，骨架库 v2，正本将随 T0 落
`docs/sessions/audit-logs/2026-09-03-s09-stage0-review-of-s08.md`）：对 S08 **PASS**——
🔴×0、审核面内 🟡 新增×0；e2e 7 passed + e2e.real 5|8(13) + apply 11 子集亲跑 + check:i18n
exit 0 + 10 commits 逐枚吻合 + src 零触碰亲证 + 牙齿证明红签名在档 + 两笔 🟡 清偿核验。
**审核面外新登记 🟡×1**（归属 9ade4ef 治理批）：roadmap M5 里程碑尾注仍写「文档腿 S09」
未随顺延刷成 S12（dont-do 第三条同族：状态区漏刷）→ S09 T0 清偿。

阶段 2 独立审核轮 1（2026-09-03，独立 Agent）：**NEEDS REVISION**（必改 ×3：①热增 ref 的
gate 生命周期未定谳——D1 refs 静态端口与 T4「热增翻转」内部矛盾，prime 是 watched 集唯一
入口且 #refresh 不吸纳新 ref〔credentials.ts:56-69〕，re-prime 触发点须定谳；②空池文案
「列主 ref 名」与 ADR-0008 Decision 3「列出主 ref 与池」正本冲突；③T0 清偿「四处一致性」
与实测陈旧面不符——全仓 grep 实际陈旧 = roadmap:66 + progress-M5:77-78 + progress-M4:120
+ 00-architecture.md:117 四文件五处，STATUS 已正确。建议 ×7：codes/label 死重（随必改 2
转为有用）/config 四件制品纠正/作废注释清单/两处行锚漂移/T4 测试落点 apply.test/setKey
波及面点名/z.union 已实测可用）。本 plan 为修订版：必改 + 建议全数吸收。正本将随 T0 落
`docs/sessions/audit-logs/2026-09-03-s09-stage2-plan-review.md`（两轮全文）。

阶段 2 独立审核轮 2（同 Agent 点验，三项必改实质闭合）：**APPROVED**（残留 R1-R6 非阻塞
措辞/次序级，已随批全数吸收：R1 D3④ 次序勘误 refresh→prime〔refs 活端口读 live.current()，
refresh 前 prime 取旧池〕/R2 probe 旧表述三处同步/R3 T1 三件速记对齐四件制品/R4 T2 空池
措辞对齐 D1③/R5 T4 用例 ② 步序钉死〔先配置值→热增→prime 吸纳即就绪〕/R6 onCommitted
为插件侧在既有 onChange 钩子内组合〔宿主 hooks 形状不可扩展〕+ attach 时一次 prime 无害
留痕；每项有守护机制兜底：T4 ② 红线/D2 单源/typecheck/验收列）。正本将随 T0 落
`docs/sessions/audit-logs/2026-09-03-s09-stage2-plan-review.md`（两轮全文）。

阶段 1 只读摸底实锚（2026-09-03 亲测，master@9ade4ef）：

- gate 已池化友好：`src/credentials.ts:56-60`（prime 接受任意 ref 列表）+:63-65（per-ref
  isReady）——**gate 零改动**，池就绪 = `poolRefs.some(isReady)`
- thunk 落点：`src/index.ts:149-186`（每成员 resolveTavilyMemberOptions(resolved.x,
  () => resolveCredentialValue(credentials, refs.x))）；`src/providers/shared.ts:87-109`
  resolveMemberApiKey（abort/解析失败/缺失三态）——池化 = 替换 thunk，签名不变
- 校验点：`src/index.ts:99-105`（credentialRef() 载入期校验，fail loud）——扩展到全池 refs
- prime 点：`src/index.ts:203-205`（gate.prime(Object.values(refs))）——扩展为全池
- settings 数组 patch = 整字段替换（宿主 settings/src/index.ts:277-292 mergeLayers；活动例
  = 本仓 controller.ts moveSearchChainEntry 整数组回写）——extraApiKeyEnvs 列表编辑同语义
- client 面现状：controller.ts MEMBERS 镜像（:40-46）+ refName 派生（:103-117/:229-232）；
  describe 批量（:234-241）；section.tsx MemberCard 单输入框；locales 19 键
- e2e 设施：loopback-server.ts 行为表 + 到达序（S08）；**Authorization 记录为本棒新增**
  （行为表改造点）；fakeCtx.resolve 返回常量 'fake-key'——轮换断言需 per-ref 可区分值
  （fakeCtx 扩展点）
- schemastery 枚举形态已锚定（阶段 2 审核实测）：`z.union(['order','round-robin','random'])`
  运行时可用——非法值拒绝、缺省透传不注入默认；T1 一行确认留痕即可（fallback
  z.string() + 载入期校验已记录备用）

## 范围决策（D1-D7，供阶段 2 审核判定层级）

| # | 决策 | 依据 |
|---|---|---|
| D1 | `src/keys.ts` KeyPool：构造端口 `{ refs: () => readonly string[] /* 活端口——每调用读 live config，与链序 getter 同构 */, selection: () => KeySelection, isReady, resolve, label, codes, rng? }`；`resolveApiKey(signal?)` 与 provider thunk 签名兼容（provider 零改动）。**流程**：①`throwIfMemberAborted` ②ready = refs().filter(isReady)（保持池序）③ready 空 → **池自抛 `codes.credentialMissing`，消息列主 ref + 全池**（ADR-0008 Decision 3 正本一致；错误码不新增——`codes`/`label` 端口即为此用）④选 ref（order=ready[0]；round-robin=游标在 ready 序列递进，就绪集变化按池序重建取模；random=`rng()` 均匀取样，rng 可注入缺省 Math.random）⑤经 `resolveMemberApiKey({ codes, label, apiKeyRef: 选中 ref, resolveApiKey: () => resolve(ref), signal })` 走既有三态——**选 ref 在池、解析值三态在 shared.ts**，职责闭环 | ADR-0008 Decision 2/3/4；审核轮 1 必改 1/2 修法；rng 注入 = 确定性测试 DI |
| D2 | config 面：五成员 × **四件制品**（`XxxSettings` 接口 / `Config` schema / `XxxMemberConfig` 已解析类型 / `resolveConfig`）各增 `extraApiKeyEnvs?: string[]` + `keySelection?: 'order'|'round-robin'|'random'`；resolveConfig 显式缺省（`?? []` / `?? 'order'`，XxxMemberConfig 两字段转必填）。schema：keySelection 用 `z.union(['order','round-robin','random'])`（**阶段 2 审核已实测 schemastery 运行时可用**：非法值拒绝、缺省透传不注入——T1 一行确认留痕；fallback = z.string() + apply 载入期校验，已记录）；extraApiKeyEnvs = `z.array(z.string())`（searchChain 先例）；新字段 Hot/Launch-static 注记沿成员惯例 | ADR-0008 Decision 1/2；审核轮 1 建议 2/7 |
| D3 | index.ts 接线 + **热增 ref 的 gate 生命周期定谳（审核轮 1 必改 1）**：①每成员 pool refs = `[primary, ...extraApiKeyEnvs]`（载入期 credentialRef() 全池校验 fail loud——既有 refs 校验块扩展）；②gates 的 credentialsReady = `poolRefs.some(gate.isReady)`；③resolveApiKey = pool thunk；④**re-prime 触发点 = settings 提交侧**：`attachSettingsSection`（src/settings.ts，内部 API）扩展 `onCommitted` 回调——committed 后 **先 `live.refresh()` 再 `gate.prime(当前全池 refs)`**（refs 活端口读 live.current()——refresh 前 prime 会取到旧池，轮 2 R1 勘误；**prime 加法幂等**：credentials.ts:58 只 add 不清；`onCommitted` 为插件侧在既有 onChange 钩子内组合——宿主 installSection hooks 形状 {setSource, onChange} 不可扩展，轮 2 R6；attach 时 onChange 亦触发一次 prime，无害留痕）——覆盖「key 先存、ref 后入池」次序（入池无事件 fire，只有 settings 提交侧能观测）；⑤无 settings 服务（entry 权威）= 载入期 prime 一次，无热增语义（与现状同构）。**单 ref 不配置 extra = 行为与现状逐字节一致**（池退化 + order 缺省；既有测试零漂移为验收面）；作废注释随任务更新（index.ts:96-98「refs never change」/settings.ts:10-12 热子集清单/config.ts 新字段注记） | 审核轮 1 必改 1 修法 + 建议 3；credentials.ts prime 加法幂等实证 |
| D4 | GUI：controller `MemberSnapshot` 增 `extraRefs: readonly RefFact[]`（ref/configured/writable，describe 批量扩展全池——controller.ts:234-241 现有批量点）；动作扩展 `setKey(memberKey, ref, value)` / `clearKey(memberKey, ref)`（两参→显式 ref；**波及面点名**：section.tsx:25-26/:47-48/:198-211、controller.spec:174/186/197、section.spec:114/:133、entry.spec:133）+ `addExtraKey(memberKey, refName)` / `removeExtraKey(memberKey, refName)`（settings patch 整数组替换 extraApiKeyEnvs，revision 同款）；section MemberCard 增「附加 keys」列表（每行：ref 名 + 状态 + 输入 + 保存/清除/移除；追加行：ref 名输入 + 添加；per-ref aria-label）；locales 增 ~9 键（parity/CJK 门禁随棒） | ADR-0008 Decision 5；审核轮 1 建议 4/6（行锚修正 + 波及面点名） |
| D5 | e2e：loopback-server 到达记录扩载 Authorization 摘要（`auths: string[]`，与 arrivals 平行——不改动 arrivals 既有断言面）；fakeCtx 扩展 per-ref resolve 值（`values?: Record<string, string>`，缺省沿用 'fake-key'——既有测试零漂移）；场景：①round-robin 3 refs×3 连发 → auths 逐把轮换 ②order 池含未配置 ref → 恒用首个就绪 ③random ∈ 就绪集（6 连发成员断言）④牙齿证明：策略探针（round-robin 场景临时改 order → auths 断言红 → 还原） | S08 e2e 设施复用；Authorization 是轮换的 wire 级实证（过 provider 真实请求路径） |
| D6 | 浏览器 GUI 实测（scratch 配方沿 S06/S07 D5）：多 key 列表呈现 → 添加附加 ref（如 `TAVILY_API_KEY_2`）→ 写 fake 值 → 状态翻转 + settings.yaml 落盘 extraApiKeyEnvs → 移除复原；kill 零残留 + 凭据 fake 值 unset 复原 | GUI 新面沿 M4 惯例过浏览器；user-paces 惯例（真实 key 归用户槽位） |
| D7 | 本棒 src **必变**（keys.ts 新增 + config/index/controller/section 扩展）——门墙预期：node 面 build 增长（记录新值）+ client.js 增长；「零漂移」口径不适用本棒，改记「与上棒对比的增量披露」。回归红线 = 不配置 extra 的既有行为零变化（D3） | 与 S08「src 零变更」相反的本棒属性显式化，防审核误判 |

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 类别 | 前置 |
|---|---|---|---|---|
| T0 | 治理批（master 直提）：本 plan 落盘 + 阶段 0 audit-log 转录 + **🟡 清偿：S09→S12 陈旧引用穷举清偿**（阶段 0 抓获 + 轮 1 必改 3 修正清单）：roadmap.md:66（M5 尾注）/ progress-M5.md:77-78（S09 手册项、S09 升级演练顺手项）/ progress-M4.md:120（S09 升级演练顺手迁移）/ 00-architecture.md:117（S09 交付 upgrade.md）——**冻结面显式声明不在清偿范围**：sessions/、audit-logs/、已收官 plan、CHANGELOG、ADR-0006:51/ADR-0007:31 历史表述、docs/notes 素材头。另 STATUS 启动刷新（S09 🚧 行 + M7 行 🚧 + 位置块）+ progress-M7 台账新开 | `git status` 前置 + 一 commit；`grep -rn 'S09' docs/ --include='*.md'` 复验仅剩冻结面与 M7 语境 | 治理（机械豁免候选） | 阶段 2.5 批准 |
| T1 | config 面：五成员 × 四件制品（`XxxSettings`/`Config` schema/`XxxMemberConfig`/`resolveConfig`）增 `extraApiKeyEnvs` + `keySelection`（z.union 已锚定——T1 一行确认留痕）；config.test 扩展（缺省/透传/全成员覆盖） | 先红（新字段断言缺失）→ 绿；schema 非法值拒绝路径一行确认留痕 | TDD | T0 |
| T2 | `src/keys.ts` KeyPool：三策略 + 就绪过滤 + 空池抛 credentialMissing 列池（D1③）+ 游标/rng 注入；keys.test（order/round-robin 游标递进/random 注入 rng 分布/空池文案列主 ref+全池/就绪过滤保序） | 先红（模块缺失）→ 绿；红证据内嵌 commit | TDD | T1 |
| T3 | index.ts 接线：全池 refs 校验扩展 + pool thunk 替换 + gates 全池就绪 + prime 全池；apply.test 扩展（多 ref 注册/prime 覆盖/pool 就绪语义/disable×pool 组合） | 先红 → 绿；**单 ref 既有 apply 测试零漂移**（D3 回归红线） | TDD | T2 |
| T4 | settings 热通路（审核轮 1 必改 1 落点）：keySelection/extraApiKeyEnvs 热切 + 热增 ref gate 生命周期（onCommitted → gate.prime 全池增量）——**测试落点 = apply.test.ts**（fakeCtx + commitSettings 热通路先例；settings.test 只测 LiveResolvedConfig 缺省透传）：①热切策略下一搜生效 ②pre-stored-key 次序钉死：先配置该 ref 值（configured.add + values）→ commitSettings 热增 extraApiKeyEnvs → onCommitted prime 吸纳即就绪（无事件路径，真证提交侧触发）③热删 ref 后池收缩 | 先红 → 绿；无 settings 服务路径零变化（entry 权威既有测试守护） | TDD | T3 |
| T5 | client：locales 增键（~9，zh/en parity）+ controller（extraRefs 快照 + ref 显式 setKey/clearKey + addExtraKey/removeExtraKey 整表 patch + 全池 describe 批量）；controller.spec 扩展 | 先红 → 绿；既有 controller 行为零漂移（单 ref 成员快照形状兼容——extraRefs 空数组） | TDD | T4 |
| T6 | client section：MemberCard 附加 keys 列表（行呈现/追加/移除/per-ref aria）；section.spec 扩展（列表渲染/添加载荷/移除载荷/整表 patch 形态） | 先红 → 绿；lint 0w0e 含新面 | TDD | T5 |
| T7 | e2e 轮换（D5）：loopback auths 记录 + fakeCtx values 扩展 + 三场景 + 牙齿证明（策略探针红→还原，留痕不入库） | 场景绿 + auths wire 级实证；探针红签名入 commit；既有七场景零漂移（auths 增载不破坏 arrivals 断言） | 验证类（+牙齿证明） | T6 |
| T8 | 浏览器 GUI 实测（D6 配方）：scratch `DSH_HOME=/tmp/dshws-s09/home` + 端口 3414 + boot `--no-open` + evaluate 合成点击；断言：列表呈现/添加附加 ref/写 fake 值→Configured 翻转+settings.yaml 落盘 extraApiKeyEnvs/移除复原；凭据 unset 复原 + kill 精确 | 断言全过逐项留痕（证据 commit）；3080/~/.dsh/s05b-s08 现场零接触 | agent 实测棒（授权链沿 S06 D5） | T7 |
| T9 | 门墙 + 台账：七命令提交态亲跑（`pnpm test`/`pnpm typecheck`/`pnpm lint`/`pnpm build`/`npm pack --dry-run`/`pnpm check:i18n`/git status 前后置）+ progress-M7 批次表/门墙表（**增量披露口径 D7**）+ Agent Note（docs/notes/2026-09-03-s09-multi-apikey.md） | 门墙数字亲见；基线 211 → 新基线；D3 回归红线亲证（单 ref 既有测试零漂移） | 门墙+文档 | T8 |
| T10 | 阶段 4/5 独立验证（独立 Agent）：R1-R5 逐条对峙 + 门墙亲跑 + 隔离法证 + 三问 | PASS / COMPLETE；audit-log 正本落盘 | 强制独立 | T9 |
| T11 | 收尾：session 记录（三 ★ 节）+ STATUS/roadmap ✅ 原子收官 + CHANGELOG + progress 状态区 + `--no-ff` 合入 + 接力指令 | 6 件套齐 | 收尾 | T10 |

## 验收条目（R1-R5，progress-M7 阶段验收逐条对应）

| # | 条目 | 对应 roadmap 验收 |
|---|---|---|
| R1 | 池与策略可重放：keys.test 三策略/就绪过滤/空池回退单测 + e2e auths wire 级轮换断言（round-robin 逐把/order 首就绪/random ∈ 就绪集）+ 牙齿证明实录 | 「round-robin 三 key 三连发逐把轮换（e2e 实测）+ random 冒烟 + order 首个就绪」 |
| R2 | 默认零变化 + 热生效：单 ref 既有测试零漂移（D3 红线）+ keySelection/extraApiKeyEnvs settings 热切实测 + 全空池才 CREDENTIAL_MISSING | 「不配置 = 现状零变化；策略/池 settings 热生效实测」 |
| R3 | GUI 多 key 通路：controller/section jsdom 行为 + 浏览器实测（添加/写值/翻转/落盘/移除复原）+ locales parity/CJK 门禁绿 | 「GUI 附加 keys 列表；typed locales」 |
| R4 | 门墙七命令（提交态）+ 增量披露：test 全量新基线/typecheck 双面/lint 0w0e/build 三件新值披露（D7）/pack/check:i18n | 门墙纪律（增量口径） |
| R5 | 五子证据：隔离（scratch 清单 + mtime 法证）/门墙/收尾件套/原子翻转/audit-log 三份 | 收官序列惯例 |

## 验证矩阵

| 验证 | 时点 | 责任 | 证据落点 |
|---|---|---|---|
| schemastery 枚举确认（z.union 实测可用——阶段 2 审核亲证，一行留痕） | T1 首步 | 主 Agent | T1 commit message 留证 |
| config/keys/接线/热通路/client 红绿 | T1-T6 各自执行时 | 主 Agent | commit message 红证据 |
| e2e 轮换 + 牙齿证明 | T7 | 主 Agent | commit message 实录 |
| 浏览器多 key 断言 | T8 | 主 Agent（D6 授权链） | 证据 commit + /tmp/dshws-s09/ 实物转录 |
| 门墙七命令（提交态） | T9 + T10 复验 | 主 Agent → 独立 Agent | progress-M7 门墙表 |
| R1-R5 对峙 + 隔离法证 + 三问 | T10 | 独立 Agent | audit-logs/…-s09-stage45-verification.md |
| STATUS/roadmap/progress/CHANGELOG 原子收官 | T11 | 主 Agent | 四件同序列 diff |

## 高危命令预告（阶段 2.5 披露，对照 governance §3.4.7 清单）

1. `/tmp/dshws-s09/` scratch 目录自建（仓库外写入——自建隔离目录；s05b-s08 现场零接触）
2. 端口 3414 实例启停（boot 带 `--no-open`；kill 精确端口 LISTEN 过滤——S07 教训：`lsof -ti`
   会混入客户端连接，用 `-sTCP:LISTEN`）
3. scratch profile 内 `pnpm install`（deps file: tarball）
4. 浏览器自动化（多 key 列表操作；凭据只写 **fake 值**且 unset 复原；真实 key 零接触）
5. `npm pack`（本仓内产物，非 publish）
6. 不涉及：push/publish、大范围删除、`git reset --hard`/`git clean`、系统配置修改、依赖变更
   （本棒零新依赖）、治理产物删除

## 债务归属映射（正本）

| 债务 | 等级 | 归属 |
|---|---|---|
| 🟡 roadmap M5 尾注 S09→S12 漏刷（阶段 0 抓获，归属 9ade4ef 治理批） | 🟡 | **T0 清偿** |
| L-2 per-profile GUI 覆盖二期候选 | 🟢 | 维持不排期 |
| fetch 链排序 UI / 「恢复默认序」按钮 | 🟢 | 维持不排期（S07 登记） |
| firecrawl fetch 面 402/429 it 独立覆盖 | 🟢 观察 | 维持（S09 loopback 仍不含 fetch 链） |
| i18n CI 接线 | 🟢 观察 | S12 手册项 |
| tsdown 弃用 ×2 / vitest sourcemap / s06 mtime 口径 | 🟢 观察 | 维持 |
| 牙齿证明惯例沉淀为治理通用实践 | 🟢 观察 | 维持无主（T7 继续实录累证） |
| v2 backlog：余额/积分定期统计与数据看板 | 🟢 v2 | ADR-0008 缓议章节；未排期（需 provider 余额 API 调研 + 看板 slot 选型，届时另立 ADR） |

## 风险

- **schemastery 枚举形态**：已锚定 z.union（阶段 2 实测）；T1 一行确认，异常时 fallback
  z.string() + 载入期校验（fail-loud 不静默）。
- **round-robin 游标与就绪集联动的语义模糊**（就绪集变化时游标位置）：定谳 = 游标存索引于
  **当前就绪序列**，就绪集变化后按池序重建序列、游标取模——T2 行为测试钉死该语义，防
  实现漂移。
- **random 分布不可精确断言**：单测注入 rng 确定性断言；e2e 只断言成员资格（∈ 就绪集），
  不断言分布——诚实口径。
- **浏览器实测的凭据面**：只写 fake 值 + unset 复原（D6）；多 ref 场景 settings.yaml 落盘
  断言只涉 ref 名数组（extraApiKeyEnvs），不涉 key 值。
- **client 快照形状变更波及**：MemberSnapshot 增字段 → section.spec makeSnapshot 机械配套
  随 T5 同 commit（S07 M-1 家族教训前置化——字段新增与 helper 补齐同任务）。
