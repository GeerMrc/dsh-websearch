# Agent Note — S04 凭据接线与成员 provider 设计（2026-09-02，Session 04）

> 记录 S04 交付中不写在单个文件 JSDoc 里、但后续棒次（S05a/S06/S08）必须知道的设计事实。

## 1. 凭据 gate：三态语义与事件边界

`src/credentials.ts` 的 `CredentialGate` 是链成员 `credentialsReady` 的唯一事实源。缓存只有
describe 的事实，不缓存任何 key 值——成员每操作经 thunk 调 `credentials.resolve`（服务契约：
每操作解析=热生效），gate 只承载便宜、零值的就绪信号。

- **未 describe = 未就绪**：缓存键缺席读作 `false`。S03 假面的教训直接内化成构造规则——没有
  事实不得报 ready。代价是 apply 启动到 prime 落地之间（本地 describe，毫秒级）链会跳过成员，
  最坏一次搜索跳过；换来 `available()` 从不说谎。
- **事件边界（实测锚 types.ts:80-84）**：`credentials/reference-updated` 只在 provider 托管
  源提交变更（set/unset/外部存储编辑被观察到）时发；**进程环境层变化不可观察、永不发事件**。
  环境变量轮换经重启生效——与上游语义一致。gate 的事件命中按 ref 名过滤，未受管 ref 直接忽略。
- **describe 抛错 = false + 日志**：保守答案只能跳过一个成员，不会泄漏 readiness；prime 因此
  不会 reject（ref 语法校验除外——见 §4）。
- **S05a 注册纪律**：`MemberRegistry.register` 的 gates 缺省为 enabled/ready=true，只服务无
  凭据概念的注册者（loopback stub/测试假成员）。**exa/perplexity/firecrawl 三族注册必须显式传
  `{ enabled, credentialsReady }` gate，否则该成员退回恒就绪 = 假面局部复活**。

## 2. 假面替换的形态

假面不是靠改缺省值死的，是靠「捆绑成员携带真实 gate」死的（plan D3）。`toResolver()` 在
resolve 时点热读 gate 函数——不快照——所以 S05a settings 启停热改只需把 `enabled` gate 指到
settings 值，注册结构与链核零改动。

## 3. 错误码族换形口径（D4）

`MEMBER_ERROR_CODES` 的族值随 provider 落地从前缀 string 换为五键对象
（`credentialMissing/requestFailed/httpError/badResponse/aborted`）。S04 换了 deepseek/tavily
两族；**S05a 落 exa/perplexity/firecrawl 时同口径换形**（五键、同键名、同大写蛇形码值模式），
`tests/errors.test.ts` 的形状断言随换形更新。凭据解析 thunk 本身抛错（服务不可达等）映射为
`REQUEST_FAILED` + "credential resolution failed" 前缀——它不是「凭据缺失」（那要求 resolve
成功返回 undefined）。

## 4. apply 装配顺序敏感点

- **ref 预校验在注册之前同步做**：`credentialRef()` 对语法外名称同步抛 TypeError，让
  misconfiguration 在 load 期 fail-loud（异步 prime 里抛就只是 rejected promise）。新增成员
  时照抄这个顺序：先 `credentialRef()` 全量校验，再建 gate/成员/链。
- **prime 故意 fire-and-forget**：`gate.prime(...)` 的 catch 只防意外 bug 变 unhandled
  rejection（会杀宿主进程），不是错误处理路径。
- **双成员构造顺序 = 内置序**（tavily → deepseek），与 `BUILT_IN_MEMBER_ORDER` 相对位置一致；
  S05a 追加成员时保持该相对序，避免上游默认选择序与文档序漂移。

## 5. 重实现映射来源（ADR-0003/L-1 的落地锚点）

deepseek 成员的线格式逐点对齐上游 `packages/web/web-search-deepseek/src/provider.ts`
（dev@3281e04b59）：默认端点 `https://api.deepseek.com/anthropic/v1`（`/messages` 追加）、
model `deepseek-v4-flash`、`anthropic-version: 2023-06-01`、maxTokens 4096、maxUses 5（内部
常量，非部署可调项）、`x-api-key`+`Bearer` 双头、`web_search_tool_result` 块→sources、text 块
citations→snippet、按 url 去重、无结果块 = BAD_RESPONSE。上游类不可复用的原因：其 id
`deepseek-official` 与宿主已注册 provider 撞名（`WEB_DUPLICATE_PROVIDER`）且违 `dshws-` 前缀
纪律。exa 成员（S05a）继续以 `packages/web/web-search-exa/src/provider.ts` 为形态参考。

## 6. Tavily 线格式取证（S-2 吸收）

官方 API reference（2026-09-02，docs.tavily.com/documentation/api-reference/endpoint/search）：
`POST https://api.tavily.com/search` + Bearer；请求 `query` 必填、`max_results` 可选（API 侧
默认 5、上限 20）；响应 `results[]: { url; title?; content?; score?; published_date? }`。
两个定案：① `max_results` **透传不 clamp**——seam `maxResults` 语义原样，>20 由 API 4xx 拒绝
→ HTTP_ERROR（链内降级/直连 fail-loud），与上游 exa 不 clamp 同构；② v1 不请求
`include_answer`，`content` 恒缺省；`published_date` 按容错透传（news topic 实况返回，官方
schema 未列字段）。

## 7. 测试形态事实

- 成员「超时」态的 provider 级可测面 = abort 传播（D7）：stub fetch 监听 `init.signal` 的
  abort 事件后 reject AbortError——真实事件路径，无 fake timers（S03 已证 fake timers ×
  AbortController 脆）。链级超时预算语义归 S03 必测⑦，不重复。
- e2e real（`tests/e2e.real/`）key 经 env-backed resolve thunk 注入——与生产同一 seam
  （per-operation thunk），只是事实源换成进程环境，零凭据存储接触。无 key 自跳已实测
  （91 passed | 2 skipped）。
- S08 loopback 场景注意：成员直连错误是 DshwsError（带 DSHWS_ 码），断言「原样传播」时按
  码匹配而非类排除（registry.test.ts 的 not.toBeInstanceOf(DshwsError) 断言只对非本插件
  成员错误成立）。

## 关联

- 契约正本：`docs/plans/2026-09-02-004-s04-providers-credentials-plan.md`（D1-D7、R1-R5）
- 前序设计：`docs/notes/2026-09-02-s03-chain-core-design.md` §2（假面义务正本）、§3（双注册拓扑）
- 链语义：ADR-0002 + `docs/00-architecture.md` §4-§5；凭据 seam：宿主
  `packages/credentials/credentials/src/index.ts:29,183,191` + `types.ts:90`
- 下游义务：S05a 三族 provider + settings installSection（gate 热改）、S06 client 键、
  S08 loopback 直连收口
