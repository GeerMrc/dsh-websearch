# Agent Note — S03 链核设计与包骨架决策（2026-09-02，Session 03）

> 记录 S03 交付中不写在单个文件 JSDoc 里、但后续棒次（S04/S05a/S06/S08）必须知道的设计事实。

## 1. 链核结构：泛型编排 + 类型化薄壳

`src/chain/core.ts` 的 `ChainCore<P, Req, Res>` 是架构 §3 树之外的新增文件（树原本只列
search-chain.ts / fetch-chain.ts 两文件）。拆出泛型核的原因：search 与 fetch 的 §4 语义
（选择级跳过、运行降级、超时预算、全败摘要、日志）完全同构，双实现必然漂移——泛型核一处
实现，两个薄壳类（`ChainSearchProvider`/`ChainFetchProvider`）只承载 seam 接口签名与归因
策略。归因策略 = 构造时注入的 transform：search 用 `withServedBy`（D2 前缀），fetch 用
恒等（D3 仅日志）。

## 2. 成员解析 port 与 S03 假面

链核经 `ChainMemberResolver.resolve(id)` 拿成员（`undefined` = 未注册），成员三态
`{ provider, enabled, credentialsReady }` 承载 §4 的前三种跳过形态，第四种
（`available()=false`）由核直接调成员 provider 的 `available()`。核心零 cordis 耦合、
零网络调用——这是 47 条单测全部内存可跑的前提。

`MemberRegistry.toResolver()` 当前把所有注册成员报告为 `enabled: true,
credentialsReady: true`——这是 S03 假面（无真实成员，链惰性不可选）；**S04 接线
credentials describe 缓存 + `credentials/reference-updated` 刷新时必须替换该假面**，
否则凭据未配置的成员会被误判可用。

## 3. 直连拓扑（必测⑧的落地形态）

每个捆绑成员按自身 `dshws-` id **双注册**：`ctx.web`（上游选择标量可见）+ 插件自有
`MemberRegistry`（链可见）。用户标量钉死成员 id 时，上游直接调成员本体，链不在调用路径上
——「钉死直连不降级」由拓扑保证而非运行时分支。S03 无真实成员，端到端闭合由 S08 loopback
场景收口（plan F-006 scope 注）。

## 4. 归因语义定稿

- **search（D2）**：`content` 首行前置 `[served-by: <id>]`；成员无 content 时 content =
  仅署名行。依据：ADR-0002 Decision 4 + `WebSearchResult.content` 本就是 provider 生成
  文本位；无 content 成员（Exa/DeepSeek 实况）若跳过署名则归因静默消失。
- **fetch（D3）**：宿主日志一行（`[dshws-chain] served-by: <id>`），body 零改动。依据：
  ADR-0002 servedBy 机制正本 scope 于 `WebSearchResult.content`；fetch body 是资源本体
  （CLOSED discriminated union），注入署名行会污染资源内容。
- 超时失败的成员在全败摘要中记 reason
  `DSHWS_MEMBER_TIMEOUT: no result within <N>ms`，无 error 对象——全败 cause 取末位成员
  抛错，超时居末位时 cause 缺省（`errors.ts` 已钉）。

## 5. 包骨架与构建契约事实

- **D1**：client 侧两键（`exports["./client"]`/`dsh.client`）延后 S06 与 client half 同批
  落地；S03 manifest 只含 node 侧三键（`exports["."]`/`files`/`dsh.bundle.patch`）。
  anysearch 0.1.4（无 client 键）为真实安装先例；声明指空文件才是破 manifest。
- **tsdown 默认吐 `.mjs`/`.d.mts`**，与 `type: module` 包的 exports 声明不符——
  `outExtensions: () => ({ js: '.js', dts: '.d.ts' })` 显式钉死（T1 实测修正）。
- **tsconfig `skipLibCheck: true`** 的具体理由：上游 `dsh-llm@0.1.2-alpha.4` published
  types import 了未随包声明的 `@deepseek-ai/dsh-attachment`（packaging 缺口），tsdown 自身
  d.mts 亦引用未声明可选类型。skipLibCheck 只跳过 d.ts 内部互查，不掩盖 src 错误；
  dsh-web 的 `ctx.web` 增强在 src 有编译期探测（apply 内 `ctx satisfies { web: unknown }`）。
- **schemastery 实例是可调用对象**（`(data) => 归一化输出`，非法抛
  `ValidationError`），没有 `.validate` 方法；空对象归一化为结构骨架
  （数组→`[]`、节→`{}`）。默认值注入不靠 schema——`resolveConfig` 显式兜底（explicit >
  implicit 纪律）。
- **cordis 日志面**：`ctx.logger.info/warn(...)`（printf 风格）；published cordis 4.0.2
  类型含 logger 增强（typecheck 实证）。链的 `ChainLogger` port 在 apply 接
  `ctx.logger.info`。

## 6. 测试纪律注记

T6/T8 的跳过门与全败终端行为随 T5/T7 的接口完备性提前落地（seam 抽象成员必须有实现、
循环必须有终态），断言后置——红仪式以**变异校验**兑现（摘门禁/换终端 → 新测试全红 →
还原全绿），两次变异的输出均已随 commit 留痕。T3-T12 其余任务为标准先红后绿。

## 关联

- 契约正本：`docs/plans/2026-09-02-003-s03-host-skeleton-chain-plan.md`（D1-D4、R1-R5）
- 链语义：ADR-0002 + `docs/00-architecture.md` §4；包形态：ADR-0007
- 下游义务：S04 凭据 gate 接线（§2 假面）、S04/S05a 成员双注册（§3）、S06 client 键（§5）、
  S08 loopback 直连收口（§3）
