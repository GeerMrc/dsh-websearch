# Plan — 2026-09-02-003-s03-host-skeleton-chain-plan

> plan 是验收契约：R 验收条目是 progress-M3 阶段验收的对照正本，验证矩阵是各阶段验证的
> 单源引用；🟢 债务归属映射的正本在本文件债务映射节。本棒为常规 TDD 棒（首个测试基线建立棒）：
> 契约/逻辑类任务先红后绿，机械/配置类任务验证手段 = 命令绿（豁免分类见执行纪律，须阶段 2
> 审核 Agent 确认）。

## 目标

S03 交付 `dsh-websearch` 正式包骨架（node 半区）与链式 meta-provider 核心资产：manifest 按
ADR-0007 定稿、构建链按 ADR-0006 已验证契约搭建（本棒仅 node 侧）、Config schema 全量、
错误码清单落 `src/errors.ts`、search/fetch 链编排按架构 §4 全语义 TDD（链语义必测 8 项逐项
红→绿留痕，凭据解析用 fake，凭据热刷新移 S04）。S03 = roadmap M3 第一棒。

## 背景

任务源 = `docs/session-roadmap.md` Session 03 ⏳ 行；链语义正本 = `docs/00-architecture.md` §4 +
ADR-0002；包形态正本 = ADR-0007；构建契约（client 侧）= ADR-0006（本棒不触及 client 构建）。

阶段 0 独立审核（2026-09-02，骨架库 v2，结论将落本 session 记录「前序 Session 审核确认」节）：
对 S02 **PASS**——🔴×0；新增 🟡×3（① progress-M1 M2 行镜像失同步 ② R1「8 行」计数跨载体誊写
③ V-03/V-04 收官留痕缺口）；🟢×3 归属不变。🟡×3 已按先债后新于本 plan 同批 commit 清偿（T0）。

阶段 1 只读摸底实锚（2026-09-02 亲测）：

- 上游 seam 面（deepseek-harness dev@3281e04b59）：`WebSearchProvider`/`WebFetchProvider` =
  `{ id; available(): boolean; search|fetch(request, signal?): Promise<…> }`
  （packages/web/web/src/types.ts:102-120）；`registerSearchProvider/registerFetchProvider`
  返回 disposer、重复 id 抛 `WEB_DUPLICATE_PROVIDER`（index.ts:103-129）；
  `WebSearchResult = { content?; sources; truncated }`（types.ts:35-42，content 为 provider
  生成文本）；`ctx.web` 增强声明在 dsh-web src（index.ts:35 `declare module '@deepseek-ai/cordis'`）。
- 插件形态范本（web-search-exa/src/index.ts）：namespace exports（`name`/`inject`/`Config`/`apply`），
  Config 走 `@deepseek-ai/schemastery`（dependency），dsh-web 为 type-only import。
- npm 发布面（`npm view <pkg> versions` 全列表，dont-do 第 2 条纪律）：
  `@deepseek-ai/dsh-web` 0.1.2-alpha.2..4（alpha.4 为线头，落在 AGENTS.md peer 域内）；
  `@deepseek-ai/cordis` 4.0.1-rc.1..4.0.2；`@deepseek-ai/schemastery` 3.18.1-rc.1..3.18.2；
  `@deepseek-ai/dsh-llm` 发布线 0.1.2-alpha.4（dsh-web 类型面 import 其 HarnessError——devDep 需求）。
- 外置插件依赖纪律先例（`@anysearch/anysearch-dsh@0.1.4` 实测 manifest）：schemastery 为
  dependency（域 `>=3.18.1-rc.1 <4`）、cordis/dsh-* 为 peer + dev 双声明（dev 侧精确钉版）、
  engines `^22.19.0 || >=24.0.0`、`type: module`、exports types/import/default 三键形态。
- 工具链成熟线（宿主仓根 devDeps + anysearch devDeps 一致）：typescript ^6.0.3 / vitest ^4.1.8 /
  tsdown ^0.22.2 / oxlint 1.76.0 / @types/node ^22.20.0（npm latest tag 另有更高版本，不采信——
  dont-do 第 2 条）。

## 范围决策（D1-D4，供阶段 2 审核判定层级）

| # | 决策 | 依据 |
|---|---|---|
| D1 | manifest 本棒落 node 侧三键（`exports["."]`/`files`/`dsh.bundle.patch`），client 侧两键（`exports["./client"]`/`dsh.client`）延后 S06 与 client half 同批落地 | client half 不存在的键 = 破 manifest（fail-loud 原则反向适用：不声明指空文件）；anysearch 纯 node half 安装先例（S02 H2 同证）；ADR-0007「四键形态」为最终态而非 S03 强制 |
| D2 | servedBy 署名 = content **首行前置** `[served-by: <成员id>]`：成员有 content → 署名行 + `\n` + 原文；成员无 content → content = 仅署名行 | ADR-0002 Decision 4 的直接实现；content 本就是 provider 生成文本位（types.ts:29-31），署名行与其同质；两形态均测试钉死 |
| D3 | fetch 链归因 = 宿主日志一行，**不改动 fetch body** | ADR-0002 servedBy 机制正本 scope = `WebSearchResult.content`，fetch 面承载未定义；fetch body 是资源本体，注入署名行污染资源内容。记入 Agent Note；阶段 2 审核若判 ADR 级则升级新增 ADR |
| D4 | 工具链钉版随宿主/anysearch 成熟线（D4 明细见背景），npm latest 不采信 | dont-do 第 2 条；两先例一致 |

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 类别 | 前置 |
|---|---|---|---|---|
| T0 | 前序 🟡×3 清偿 + STATUS 启动侧刷新：① progress-M1 里程碑表 M2 行 ⏳→✅（指针 progress-M2 阶段验收表）；② progress-M2 增「收官对账补注」（V-01..V-04 逐条对账 + V-03/V-04 留痕缺口如实承认 + 「8 行」时点计数口径指针 + 阶段 4/5 发现自本棒起逐条落台账的流程改进）；③ STATUS 台账加 S03 🚧行 + 当前位置块刷新 | 三处落盘 file:line 可查；与本 plan 同批 commit 留痕 | docs | 无 |
| T1 | 包骨架：package.json（name `dsh-websearch`/version `0.1.0`/type module/engines/packageManager/exports["." types+import+default]/files `["lib","cordis.patch.yml"]`/`dsh.bundle.patch` 指向自带 cordis.patch.yml/peer 域 cordis `>=4.0.1-rc.1 <5` + dsh-web `>=0.1.2-alpha.3 <0.1.3`/dep schemastery `>=3.18.1-rc.1 <4`/devDeps 实钉 cordis 4.0.2 + dsh-web 0.1.2-alpha.4 + dsh-llm 0.1.2-alpha.4 + 工具链 D4 明细）+ tsconfig.json（strict、ESM、`.ts` 相对导入、noEmit typecheck 面）+ tsdown.config.ts（esm + dts → lib/，entry src/index.ts）+ cordis.patch.yml（insert `dsh-websearch` 插件行）+ .gitignore 核补 + 最小插件骨架 src/index.ts（name/inject/Config 占位/apply 空装配）+ `pnpm install` | ① install 0 error；② build 产出 lib/index.js + lib/index.d.ts；③ `tsc --noEmit` 0 error（对 npm 实钉 devDeps——即证 published dsh-web 类型面含 ctx.web 增强，不足则停下走范围变更回路，不私打补丁）；④ `pnpm pack --dry-run` 交付清单 = lib/* + cordis.patch.yml + package.json（docs/ 不入库） | 机械类 | T0 |
| T2 | 工具链四命令脚本：`test` = vitest run（暂 `--passWithNoTests`，T3 落首个测试时移除）/ `typecheck` = tsc --noEmit / `lint` = oxlint src tests / `build` = tsdown | 四命令 exit 0，命令原文与数字入记录 | 机械类 | T1 |
| T3 | src/errors.ts：`DshwsError`（code/message/cause）+ 链级码 `DSHWS_CHAIN_EXHAUSTED` / `DSHWS_NO_MEMBER_CONFIGURED` / `DSHWS_MEMBER_TIMEOUT`（日志码）+ 成员级码清单（deepseek/tavily/firecrawl/exa/perplexity 五族命名空间常量 + JSDoc 契约；具体成员码随 S04/S05a provider 落地扩充）+ 逐成员摘要格式化 helper（成员 id + 失败原因/码；全败错误的 cause = 末位成员错误） | 先红：错误携带 code、摘要含逐成员 id+原因、全败构造 cause=末位错误 → 后绿 → commit | TDD | T2 |
| T4 | src/config.ts：Config interface + z schema（架构 §5 全字段：searchChain/fetchChain/perMemberTimeoutMs + 五 provider 子节）+ resolveConfig 显式默认化（链空 → 内置默认序 tavily→exa→perplexity→firecrawl→deepseek；timeout 默认 30000；子节字段默认）。默认化一律在 resolveConfig 显式做，不依赖 schema 默认值注入 | 先红：空链→默认序、显式链保序且容忍未知 id（运行期跳过语义，§4）、timeout 默认与非法值拒绝、子节默认 → 后绿 → commit | TDD | T2 |
| T5 | 链核 src/chain/core.ts（泛型编排，HTTP-free；成员解析经 port：`resolve(id) → { provider; enabled; credentialsReady } | undefined`，核心零 cordis 耦合）+ 必测①顺序保持：fake 成员按配置序排列，首位可用成员先中、spy 调用序 = 配置序 | 先红 → 后绿 → commit | TDD | T4 |
| T6 | 必测②未配置跳过 + ③不可用跳过（选择级：未注册/未启用/凭据未配置/available()=false 各形态跳过不消耗调用）+ 全跳过 → 抛 `DSHWS_NO_MEMBER_CONFIGURED` | 先红×3 → 后绿 → commit | TDD | T5 |
| T7 | 必测④运行失败降级：成员 search 抛错 → 记录摘要 → 降级下一成员成功返回 | 先红 → 后绿 → commit | TDD | T6 |
| T8 | 必测⑤全败：全部成员运行失败 → 抛 `DSHWS_CHAIN_EXHAUSTED` + 逐成员摘要 + cause=末位错误 | 先红 → 后绿 → commit | TDD | T7 |
| T9 | 必测⑥servedBy：成功结果 content 首行 `[served-by: <id>]`（有 content/无 content 两形态，D2）+ 宿主日志一行（log port 注入，测试捕获断言） | 先红 → 后绿 → commit | TDD | T8 |
| T10 | 必测⑦超时降级：perMemberTimeoutMs 预算内未返回 → 视同失败，abort 该成员 signal，摘要记 `DSHWS_MEMBER_TIMEOUT`，降级下一成员（fake timers 优先，稳定性不足则真实短时延，风险节预案） | 先红 → 后绿 → commit | TDD | T9 |
| T11 | 必测⑧钉死直连不降级 + apply 定形：成员注册 helper（成员按自身 id 独立注册 `ctx.web`、返回 disposer——上游标量钉死成员 id 即直连成员本体，链不介入）；直连调用错误原样传播断言（不经链、不包装）；src/index.ts apply 定形（inject `['web']`、注册 `dshws-chain`/`dshws-chain-fetch`、成员注册表接线、Config→resolveConfig→链构造） | 先红：fake ctx.web 断言双链注册形态 + disposer 生效 + 直连错误传播 → 后绿 → commit | TDD | T10 |
| T12 | fetch 链同构：链核泛型化覆契约 `WebFetchProvider`（`dshws-chain-fetch`），归因 = 宿主日志一行（D3）；fetch 面镜像必测子集：顺序保持 / 运行失败降级 / 全败 CHAIN_EXHAUSTED / 超时降级 / 归因日志（核心语义已由 search 面全测，本任务证 fetch 适配层接线正确，防双实现漂移） | 先红 → 后绿 → commit | TDD | T11 |
| T13 | 门墙收口 + Agent Note：四命令全绿（`pnpm test`/`pnpm build`/`pnpm typecheck`/`pnpm lint`，命令原文与数字）；Agent Note 落 docs/notes/（链核 port 设计、fake 策略、servedBy 承载 D2、fetch 归因 D3、client 键延后 D1、core.ts 为架构 §3 树外新增文件的结构说明）；progress-M3 新开（任务表 + 债务台账 + 已验锚点台账） | 四命令绿 + Note 落盘 + progress-M3 骨架 | — | T12 |
| T14 | 阶段 4/5 独立审核 + 交叉验证：R1-R5 逐条对峙（file:line + 实跑重放，全量测试唯一责任点）+ 安全/契约/前瞻三问 + 抽一条命令冒烟重放 | PASS / COMPLETE 结论落 progress-M3 | 独立 Agent | T13 |
| T15 | 收尾 6 件套 + 原子翻转（STATUS 台账行 ✅ + 当前位置块 + roadmap S03 行 ✅ + progress-M3 阶段验收表，同一序列）+ 接力指令（当期格式五语义点，记录末节 + 回复末尾） | R5 全过 | — | T14 |

执行纪律：T0-T15 逐一串行，一任务一 commit（红→绿→commit），禁批量；写操作不并行。
机械类（T1/T2）豁免红绿循环——豁免分类待阶段 2 审核 Agent 确认；其余任务全部先红后绿，
红证据（测试失败输出原文）与绿证据（通过数字）随任务入 session 记录。

## 链语义必测 8 项 ↔ 任务映射

| # | 必测项（roadmap S03 行） | 任务 |
|---|---|---|
| ① | 顺序保持 | T5 |
| ② | 未配置跳过 | T6 |
| ③ | 不可用跳过 | T6 |
| ④ | 运行失败降级 | T7 |
| ⑤ | 全败 `DSHWS_CHAIN_EXHAUSTED` + 摘要 | T8 |
| ⑥ | servedBy content 首行署名 | T9 |
| ⑦ | 超时降级 | T10 |
| ⑧ | 钉死直连不降级 | T11 |

（凭据热刷新按 roadmap 移 S04；`DSHWS_NO_MEMBER_CONFIGURED` 附加覆盖于 T6；fetch 同构 T12。）

## 验收条目（R1-R5，progress-M3 阶段验收逐条对应）

- **R1** 前序审核 🟡×3 清偿可重放：progress-M1 M2 行 ✅ + progress-M2 收官对账补注 + STATUS 启动刷新三处落盘，逐项 file:line + commit
- **R2** 包骨架符合 ADR-0007 + dont-do 纪律：manifest 逐键核对（name/version/type/engines/exports/files/patch 键/peer 域与 npm 实测一致）；`pnpm pack --dry-run` 交付清单实测（docs/ 不入库）；`pnpm install`/`build`/`typecheck`/`lint` 全绿附命令原文
- **R3** 链语义必测 8 项逐项红→绿留痕（每项红证据/绿证据/commit 三元组）+ `DSHWS_NO_MEMBER_CONFIGURED` 覆盖 + fetch 同构镜像
- **R4** 门墙实测数字：`pnpm test`（N passed）、`pnpm typecheck`（0 error）、`pnpm lint`（0 error）、`pnpm build`（产物清单）——命令原文与数字，禁算术外推
- **R5** 收尾 6 件套齐备且原子翻转：session 记录（含前序审核节 + 底部规范强化节）/ progress-M3（任务表 + 债务台账 + 已验锚点台账 + 阶段验收表）/ STATUS 台账 + 当前位置块 / roadmap S03 行 ✅ / CHANGELOG / 接力指令（记录末节 + 回复末尾双落位）

## 验证矩阵

| 验证面 | 触发时机 | 责任阶段 | 采信规则 |
|---|---|---|---|
| T0 三处落盘核验 | T0 | 3 | 主 Agent 亲改；阶段 4 独立 Agent file:line 重放 |
| manifest/构建产物/pack 清单 | T1 | 3 | 主 Agent 亲跑，命令原文入记录 |
| 四命令（test/typecheck/lint/build） | T2 首拉起；T13 全量收口 | 3 / 4 | 主 Agent 亲跑数字；阶段 4 独立 Agent 重放（全量测试唯一责任点） |
| 8 项链语义 + NO_MEMBER + fetch 镜像红绿 | T5-T12 | 3 | vitest 红/绿两态输出原文逐项入记录 |
| R1-R5 验收条目对峙 | T14 | 4 | 独立 Agent 实测（file:line + 重放） |
| 冒烟重放（抽一条门墙命令） | T14 阶段 5 | 5 | 独立 Agent 亲跑；采信阶段 3/4 数字不重跑全量 |
| 治理产物一致性（记录/progress/STATUS/roadmap 引用与受控词表） | 收尾前 | 4 | 独立 Agent 实测 |

（本棒无 scratch profile / 无实例启动 / 无浏览器面——安装端到端归 S05b，GUI 归 S06/S07。）

## 高危命令预告（阶段 2.5 披露，对照 governance §3.4.7 清单）

1. **依赖安装**：T1 `pnpm install`（新增 peer/dep/devDep 与工具链，非删除、非大版本变更——首装即锁定 pnpm-lock.yaml）
2. **明确不做**：npm publish / git push / 真实凭据读写 / scratch profile 与实例启动 / `~/.dsh` 与 3080 实例触碰 / 仓库外路径写入 / 治理产物删除

## 债务归属映射（🟢 延后项正本）

| 债务 | 等级 | 归属 | 依据 |
|---|---|---|---|
| L-1 deepseek/exa/perplexity/firecrawl 插件内重实现 | 🟢 | S03-S05（不变；本棒仅落 errors.ts 五族码清单骨架，provider 实现归 S04/S05a） | ADR-0003；阶段 0 审核结论 |
| L-2 per-profile GUI 覆盖二期候选 | 🟢 | 二期候选，不排期（不变） | ADR-0004 |
| L-3 spike 脚手架不入库，正式骨架 S03 重建 | 🟢 | **本棒 T1 清偿**（收官时台账标 🟢-1） | 阶段 0 审核结论；ADR-0006/0007 构建契约结论 |
| 备注-1 / 备注-2（S01 审核备注级） | 备注 | 不处置，留痕 | progress-M2 债务台账 |

（前序审核新增 🟡×3 非延后项：T0 同棒清偿，不进本表。）

## 风险

- **published 类型面不足**：npm dsh-web alpha.4 的 lib/types 若缺 `ctx.web` 增强或类型面偏差 → T1 typecheck 即暴露；处置 = 停下走范围变更回路（回 2.5 重审），不私打补丁、不挂 dev 树路径
- **tsdown dts 链路受阻** → 降级 tsc 两步构建（tsc emit 类型 + tsdown 出运行时），决策记 Agent Note；验收不变（lib/index.js + lib/index.d.ts）
- **schemastery API 面**（z.array / z.object / 校验语义）与预期不符 → 以实装 3.18.2 实测为准；默认化一律在 resolveConfig 显式做，不依赖 schema 默认值注入
- **fake timers × AbortController 交互不稳** → 降级真实短时延（如 20ms 预算）；测试稳定性优先，决策随测试留痕
- **超时/降级时序组合面大**（ADR-0002 已识别）→ 本棒只钉 8 项 + NO_MEMBER + fetch 镜像；时序组合 e2e 归 S08
