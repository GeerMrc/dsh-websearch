# Plan — 2026-09-02-004-s04-providers-credentials-plan

> plan 是验收契约：R 验收条目是 progress-M3 阶段验收的对照正本，验证矩阵是各阶段验证的
> 单源引用；🟢 债务归属映射的正本在本文件债务映射节。本棒为常规 TDD 棒：契约/逻辑类任务
> 先红后绿；e2e 自跳文件属验证类（须有验证手段且回归不红），豁免分类由阶段 2 审核 Agent 确认。

## 目标

S04 交付 M3 第二棒（roadmap ⏳ 行）：`dshws-deepseek` 与 `dshws-tavily` 两个链成员 provider
（插件内重实现，ADR-0003/L-1）+ 凭据接线——credentials describe 缓存 + `credentials/reference-updated`
事件刷新 + **S03 假面替换**（Agent Note §2 硬义务：`MemberRegistry.toResolver()` 恒
`enabled/credentialsReady=true` 的假面移除，成员 gate 反映真实配置与凭据状态）。两 provider
单测 mock HTTP 四态（成功/429/断网/超时）红→绿；凭据热刷新用例（写 ref→事件→available 翻转）
红→绿；真实 API e2e 无 key 自跳实测。S03 宪法必测清单挂账项「凭据热刷新」本棒落实（V-05）。

## 背景

任务源 = `docs/session-roadmap.md` Session 04 ⏳ 行；链语义正本 = `docs/00-architecture.md` §4
+ ADR-0002；凭据模型正本 = 架构 §5；假面义务正本 = `docs/notes/2026-09-02-s03-chain-core-design.md` §2。

阶段 0 独立审核（2026-09-02，骨架库 v2，结论落本 session 记录「前序 Session 审核确认」节）：
对 S03 **PASS**——🔴×0；新增 🟡×1（progress-M3.md 状态区未随收官刷新：:14/:19/:23 三处与同
commit 填出的 R 表自相矛盾；与上轮 🟡① 同模式复发，已标注）；🟢 归属无漂移（L-1/L-2/假面）。
本棒 T0 清偿 🟡×1。审核另记观察级 2 条：fast-forward 合入无 merge commit 留痕（本棒吸收：
合入改用 `--no-ff`）；CHANGELOG 跟踪节数字重抄（格式强制、零漂移，不处置）。

阶段 1 只读摸底实锚（2026-09-02 亲测，deepseek-harness dev@3281e04b59）：

- **credentials seam**：`ctx.credentials`（`inject: ['credentials']`）= `CredentialProvider`
  抽象服务——`resolve(ref): Promise<ResolvedCredential | undefined>`（packages/credentials/
  credentials/src/index.ts:183，**每操作解析、禁止跨操作缓存**是服务契约）；`describe(ref):
  Promise<CredentialInfo>`（index.ts:191，返回 `{ configured; source?; writable }`，零值安全）；
  `credentialRef(value)`（index.ts:29，POSIX env 名语法校验，非法抛 TypeError——misconfiguration
  fail-loud 的现成实现）。事件 `credentials/reference-updated(ref)` 声明合并于 types.ts:90，
  `set`/`unset` 提交后经 notifyUpdated 扇出（index.ts:259-270，监听器失败被容纳）。
- **web seam**：`WebSearchRequest = { query; maxResults? }`（packages/web/web/src/types.ts:16-18，
  seam 负责截断）；`WebSearchResult = { content?; sources; truncated }`（types.ts:35-42）。
- **上游 deepseek 重实现参考**（packages/web/web-search-deepseek/src/provider.ts，同仓可见但
  不 import——其 id `deepseek-official` 与上游已注册 id 撞名且违 `dshws-` 前缀纪律，ADR-0003
  定重实现）：Anthropic 兼容 Messages + `web_search_20250305` server tool；默认端点
  `https://api.deepseek.com/anthropic/v1`（`/messages` 追加，:35）、model `deepseek-v4-flash`
  （:38）、`anthropic-version: 2023-06-01`（:41）、maxTokens 4096（:44）、maxUses 5（:47）；
  头 `x-api-key` + `authorization: Bearer` 双发（:228-236）；响应映射 = `web_search_tool_result`
  块 → sources、text 块 citations → snippet、按 url 去重、无结果块 = 错误（:121-174）；
  content 恒缺省、truncated 恒 false。
- **上游 exa 形态参考**（packages/web/web-search-exa/src/provider.ts）：REST `POST {baseURL}/search`
  + Bearer；`numResults = request.maxResults ?? 配置默认，两者皆缺省则省略字段`（:98-114）；
  错误形态学 = 请求失败/HTTP 非 2xx/响应体不可解析三类 + abort 独立（:118-148）；
  `available()` = 纯本地配置检查（:89-94）。
- **测试先例**：mock HTTP = `vi.stubGlobal('fetch', fetchMock)` + Response JSON helper
  （web-search-exa/tests/exa.spec.ts:84 起）；真实 API e2e 自跳 = `process.env.X ? describe :
  describe.skip`（exa.e2e.ts:9-11）。
- **依赖先例**：`@anysearch/anysearch-dsh@0.1.4` 实测 peerDependencies **含
  `@deepseek-ai/dsh-credentials`**——本插件引入该 peer 有直接先例；npm 全列表
  0.1.2-alpha.2..4（dont-do 第 2 条纪律），宿主 vendored 0.1.2-alpha.3。
- **Tavily 线格式**（官方 API reference，2026-09-02 取证：
  https://docs.tavily.com/documentation/api-reference/endpoint/search）：`POST
  https://api.tavily.com/search` + Bearer；请求 `{ query（必填）, max_results?（默认 5，≤20）, … }`；
  响应 `results[]: { url; title?; content?; score; published_date? }`（content 为摘要文本；
  answer 仅 `include_answer=true` 才返回）；错误码 401/429/432/433/500。

## 范围决策（D1-D6，供阶段 2 审核判定层级）

| # | 决策 | 依据 |
|---|---|---|
| D1 | 新增 peer `@deepseek-ai/dsh-credentials >=0.1.2-alpha.3 <0.1.3` + devDep 实钉 0.1.2-alpha.4；运行时引入 `credentialRef()`（非本地 cast 自造 brand） | anysearch peer 先例；`credentialRef` 自带语法校验 = misconfiguration fail-loud（AGENTS.md），自造 cast 丢校验且违反「宁可维护的依赖不手搓」；opaque id branded 纪律 |
| D2 | 凭据缓存三态：**未 describe 前 = 未就绪（false）**；`prime()`（apply 时触发，describe 全部受管 ref → 缓存）+ 事件命中受管 ref → 重 describe 刷新；`describe` 抛错 = 未就绪 + 宿主日志 | 假面的教训：无事实不得报 ready；启动窗口（prime 落地前）链跳过该成员，一次搜索的代价换 available() 不说谎；事件不触达进程环境层变化（服务契约明示），环境变量变化经重启生效 = 上游同语义 |
| D3 | 假面替换形态：`MemberRegistry.register(provider, gates?)` 增可选 gate `{ enabled?; credentialsReady? }`（`() => boolean` 热读）；`toResolver()` resolve 时点调 gate；**缺省（未传 gates）= true** | 缺省 true 只服务无凭据概念的注册者（loopback stub/测试假成员）；捆绑成员一律显式传 gate——假面死于「成员携带真实状态」，非死于改缺省值；S03 既有测试零破坏（registry 测试不断言常量 true） |
| D4 | 成员错误码族定形（本棒落 deepseek/tavily 两族，S05a 三族复用同形）：每族 5 码 `DSHWS_<FAM>_{CREDENTIAL_MISSING,REQUEST_FAILED,HTTP_ERROR,BAD_RESPONSE,ABORTED}` | errors.ts:22-28 留位义务；五码覆盖摸底实锚的上游错误形态学（transport/HTTP/body/abort）+ 本插件凭据缺失面；abort 独立码对齐上游 WEB_ABORTED 语义但走本插件 DSHWS_ 命名空间 |
| D5 | 两 provider 的 key 一律**每操作经 credentials 服务解析**（search 入口先 resolve），provider 本体不持有 key；`available()` = 纯本地配置检查（baseURL 可解析 + 数值字段正整数），不含 key 维度（key 维度由 gate 的 credentialsReady 承载） | credentials 服务契约「每操作解析=热生效」；直连钉死场景下 key 未配 → 成员抛 CREDENTIAL_MISSING（fail-loud 带指引信息），与链内降级语义一致 |
| D6 | provider 专属默认值（deepseek baseURL/model/maxTokens、tavily baseURL）落 provider 实现内显式兜底（config.ts:29-31 JSDoc 既定）；tavily v1 不请求 answer（`include_answer` 缺省），结果 content 映射为 snippet | explicit > implicit；架构 §5 配置模型未含 answer 开关，v1 不扩面 |

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 类别 | 前置 |
|---|---|---|---|---|
| T0 | 🟡×1 清偿 + STATUS 启动刷新 + 本 plan 落盘：① progress-M3.md 状态区三处刷新（:14 里程碑行括注、:19 进行中节、:23 待启动节——与 R 表/V 表对齐）；② STATUS.md 台账加 S04 🚧 行 + 当前位置块刷新；③ 本 plan 文件。纯文档 commit 直提 master（S01-S03 先例） | 三处落盘 file:line 可查；同批 commit 留痕 | docs | 无 |
| T1 | 假面替换（D3）：`MemberRegistry.register(provider, gates?)` + `toResolver()` 热读 gate（resolve 时点调用，非注册时快照）+ JSDoc 更新（移除「Until S04」注） | 先红：注册带 `enabled:()=>false` / `credentialsReady:()=>false` gates 的成员，resolve 返回对应 false（现行代码恒 true 即红）→ 后绿（既有 47 条零破坏回归）→ commit | TDD | T0 |
| T2 | 错误码族（D4）：`MEMBER_ERROR_CODES` 扩充 deepseek/tavily 两族具体码（每族 5 码）+ 导出面更新 | 先红：码常量缺失/值断言 → 后绿 → commit | TDD | T1 |
| T3 | 凭据 gate src/credentials.ts（D2）：`CredentialGate`（ports 注入：credentials 服务 + subscribe + log；`prime(): Promise<void>` describe 受管 ref → 缓存；`isReady(refName): boolean`；事件命中受管 ref → 重 describe；describe 抛错 = false + 日志，零未捕获 rejection） | 先红：prime 后 isReady 反映 configured；事件翻转（configure→true / unconfigure→false）；无关 ref 事件不动缓存；describe 抛错容错 → 后绿 → commit | TDD | T2 |
| T4 | deepseek provider `src/providers/deepseek.ts`（D5/D6）：线格式常量 + 请求/响应映射纯函数（导出供单测）+ provider 类（`dshws-deepseek`；每操作 resolve key，缺 → CREDENTIAL_MISSING 带指引；fetch 失败/非 2xx/bad body/abort 四态错误族；`available()` 本地检查）；单测 mock HTTP：请求映射（端点/头/体）+ 成功映射（blocks→sources、citations→snippet、去重）+ 429（HTTP_ERROR、非 JSON 错误体容错）+ 断网（REQUEST_FAILED）+ abort（ABORTED）+ 凭据缺失 + 响应无结果块（BAD_RESPONSE） | 先红 → 后绿 → commit | TDD | T2 |
| T5 | tavily provider `src/providers/tavily.ts`（D5/D6）：同 T4 口径（`dshws-tavily`；`POST {baseURL}/search` + Bearer；`max_results = request.maxResults ?? 配置 maxResults，皆缺省则省略`；results[]→sources 映射 published_date 容错透传）；单测 mock HTTP：请求映射 + 成功映射 + 429 + 断网 + abort + 凭据缺失 + 非 JSON 错误体 | 先红 → 后绿 → commit | TDD | T4 |
| T6 | apply 接线：`inject = ['web', 'credentials']`；CredentialGate 接 `ctx.credentials` + `ctx.on('credentials/reference-updated', …)`（注册返回 disposer 交 effect 域）；deepseek/tavily 以 resolveConfig 成员配置实例化 + **双注册**（`ctx.web` + MemberRegistry 传 gates `{ enabled: 配置静态值, credentialsReady: gate.isReady }`）；**热刷新端到端用例**：fake ctx（credentials + on 捕发 + web）下写 ref→事件→`chain.available()` 翻转 true、再撤销→false；apply.test.ts inject 断言随行为更新 | 先红：双注册缺失/gates 未接线/available 不翻转 → 后绿（全量回归）→ commit | TDD | T3/T5 |
| T7 | 真实 API e2e 自跳：`tests/e2e.real/deepseek.real.test.ts` + `tavily.real.test.ts`（`process.env.DEEPSEEK_API_KEY`/`TAVILY_API_KEY` 自跳；key 经 env-backed resolve thunk 注入——与单测同一 seam，披露于文件 JSDoc） | `pnpm test` 输出含 skipped 证据（本机无 key 实测自跳）；命令原文入记录 | 验证类 | T6 |
| T8 | 门墙收口 + Agent Note + progress-M3 增补：四命令全绿（命令原文与数字）；Agent Note 落 docs/notes/（凭据 gate 三态语义、假面替换形态、错误码族定形、重实现映射来源锚点、tavily 线格式取证）；progress-M3 增 S04 批次任务表 + 已验锚点台账新增（credentials seam 行号 / tavily docs URL / anysearch peer 先例 / 上游 provider 行号） | 四命令绿 + Note 落盘 + 台账增补 | — | T7 |
| T9 | 阶段 4/5 独立审核 + 交叉验证：R1-R5 逐条对峙（file:line + 实跑重放，**全量测试唯一责任点**）+ 安全/契约/前瞻三问 + 抽一条命令冒烟重放 | PASS / COMPLETE 结论落 progress-M3 | 独立 Agent | T8 |
| T10 | 收尾 6 件套 + 原子翻转（STATUS 台账 ✅ + 当前位置块 + roadmap S04 行 ✅ + progress-M3 阶段验收表，同一序列）+ 踩坑沉淀（无重大坑则显式声明零新增）+ 接力指令（记录末节 + 回复末尾）+ `feat/s04-providers-credentials` **`--no-ff`** 合入 master（吸收阶段 0 观察级：merge commit 留痕） | R5 全过 | — | T9 |

执行纪律：本棒开发自 **`feat/s04-providers-credentials` 分支**推进（T1 起；T0/计划为纯文档
直提 master 先例），阶段 4/5 PASS 后方合入 master。T0-T10 逐一串行，一任务一 commit
（红→绿→commit），禁批量；写操作不并行。T7 属验证类（无行为体新增，验证手段 = `pnpm test`
skip 计数 + 文件存在与 JSDoc 披露），豁免红绿循环——分类由阶段 2 审核 Agent 判定确认；
其余 src 任务全部先红后绿。

## 验收条目（R1-R5，progress-M3 阶段验收逐条对应）

- **R1** S03 假面替换可重放：`toResolver()` 无条件 true 移除（file:line）+ gates 热读行为测试
  红绿留痕 + 缺省语义测试 + 既有 47 条回归零破坏
- **R2** 两 provider 单测 mock HTTP 四态红→绿：deepseek/tavily 各自 成功/429/断网/超时（abort）
  + 请求映射 + 响应映射 + 凭据缺失 + 错误码族（每族 5 码）——每任务红证据/绿证据/commit 三元组
- **R3** 凭据热刷新（宪法必测挂账 V-05 落实）：CredentialGate 语义测试（prime/isReady/事件
  翻转/容错）+ apply 接线端到端「写 ref→事件→`chain.available()` 翻转」红→绿 + `inject`
  增 `credentials`
- **R4** 真实 API e2e 无 key 自跳实测：两文件就位、`pnpm test` skipped 计数实测（命令原文）
- **R5** 门墙实测数字（`pnpm test`/`typecheck`/`lint`/`build`，禁算术外推）+ 收尾 6 件套齐备
  且原子翻转 + 分支闭环（`--no-ff` merge commit 留痕）

## 验证矩阵

| 验证面 | 触发时机 | 责任阶段 | 采信规则 |
|---|---|---|---|
| T0 三处落盘核验 | T0 | 3 | 主 Agent 亲改；阶段 4 独立 Agent file:line 重放 |
| gates 红绿 + 既有回归 | T1 | 3 | vitest 红/绿输出原文入记录 |
| 错误码族 | T2 | 3 | 同上 |
| CredentialGate 语义红绿 | T3 | 3 | 同上 |
| 两 provider mock HTTP 红绿 | T4/T5 | 3 | 同上（每态断言独立 it） |
| apply 接线 + 热刷新端到端 | T6 | 3 | 同上 |
| e2e 自跳 skip 计数 | T7 | 3 | `pnpm test` 原文；阶段 4 重放 |
| 四命令门墙 | T8 收口 | 3 / 4 | 主 Agent 亲跑数字；阶段 4 独立 Agent 重放（全量唯一责任点） |
| R1-R5 对峙 | T9 | 4 | 独立 Agent 实测 |
| 冒烟重放 | T9 阶段 5 | 5 | 独立 Agent 亲跑一条；采信阶段 3/4 数字 |
| 治理产物一致性 | 收尾前 | 4 | 独立 Agent 实测 |

（本棒无 scratch profile / 无实例启动 / 无浏览器面——安装端到端归 S05b，GUI 归 S06/S07。）

## 高危命令预告（阶段 2.5 披露，对照 governance §3.4.7 清单）

1. **依赖安装**：T1 前 `pnpm install`（新增 peer `@deepseek-ai/dsh-credentials` + devDep 实钉
   alpha.4；新增非删除、域内非大版本变更——lockfile 随之锁定）
2. **本仓分支合并**：T10 将 `feat/s04-providers-credentials` 以 `--no-ff` 合入 master（阶段
   4/5 PASS 之后执行；本地合并，无 push / 无 PR / 无 force）
3. **明确不做**：npm publish / git push / 真实凭据读写（测试全用 fake 或自跳，零真实 key）/
   scratch profile 与实例启动 / `~/.dsh` 与 3080 实例触碰 / 仓库外路径写入 / 治理产物删除

## 债务归属映射（正本）

| 债务 | 等级 | 归属 | 依据 |
|---|---|---|---|
| 阶段 0 新增 🟡×1（progress-M3 状态区三处失同步） | 🟡 | **本棒 T0 清偿** | 阶段 0 审核结论；先债后新 |
| S03 假面（toResolver 恒 true） | 🟢 | **本棒 T1 清偿**（收官台账标 🟢-1） | Agent Note §2 硬义务；阶段 0 审核 🟢③ |
| L-1 deepseek/exa/perplexity/firecrawl 插件内重实现 | 🟢 | 本棒清偿 deepseek+tavily 两族（tavily 原列 L-1 文案外的既定 roadmap S04 范围），余 exa/perplexity/firecrawl 归 S05a——台账口径随收官更新 | ADR-0003；roadmap S04/S05a 行 |
| L-2 per-profile GUI 覆盖二期候选 | 🟢 | 二期候选，不排期（不变） | ADR-0004 |
| 宪法必测挂账「凭据热刷新」 | 挂账 | **本棒 R3 落实**（V-05 注销） | progress-M3 V-05；roadmap S04 行 |
| 观察级×2（fast-forward 留痕 / CHANGELOG 重抄） | 观察 | 前者本棒吸收（--no-ff）；后者不处置（格式强制、零漂移） | 阶段 0 审核观察项 |

## 风险

- **published dsh-credentials 类型面**：alpha.4 的 `CredentialProvider`/`credentialRef` 类型导
  出若与 vendored alpha.3 源有偏差 → T2 typecheck 即暴露；处置 = 停下走范围变更回路，不私打
  补丁（T1 已有 dsh-web alpha.4 类型增强成功先例，风险低）
- **cordis 事件订阅面**：`ctx.on('credentials/reference-updated', …)` 的返回与 dispose 语义若
  与预期不符 → T3/T6 单测（fake ctx）先行钉行为，typecheck 兜类型；异常按实锚修正，决策入
  Agent Note
- **fake credentials 事件时序**：事件扇出同步派发（fanOut 实现），fake ctx 需按同步语义触发；
  若 prime 与事件竞争 → 测试内显式 await prime 后再触发事件，不依赖微任务顺序
- **mock HTTP × abort 交互**：S03 已知 fake timers × AbortController 脆（plan-002 风险节先例）
  → 本棒成员单测用「signal 手动 abort + fetch stub 监听 abort 拒绝」的真实事件路径，不用
  fake timers；超时预算语义已由 S03 必测⑦覆盖，本棒不重复
- **DeepSeek 真实 e2e 无 key**：自跳路径已由上游先例验证；若本机环境出现半配置 key（env 存在
  但无效）→ 4xx 断言会真实打 API——e2e 文件以「key 存在才跑」守卫，本机实测前检查 env 确无
  该 key（阶段 1 已确认无 DEEPSEEK/TAVILY key）
