# S14 调研注记：fetch 兜底开关缝隙判定 + 余额/积分看板地基（v2 backlog 首棒）

> 日期：2026-09-06（Session 14，plan 014 T1 交付）。性质：**调研结论**，非当期架构
> 决策——ADR-0010 维持不变，v2 未立项；立项时按本注记缝隙走计划期。锚点口径见文末
> 复核清单。调研方式：独立 Explore Agent 全量摸底 + 阶段 2 审核 Agent 独立复核
> （25 锚点）双确认。

## 1. fetch 兜底开关（核心问题：宿主 fetchProvider 可否插件热改/兜底）

### 1.1 宿主现状：单赢家选择，无降级链

- 选择机制 = `resolveProvider`（宿主 `packages/web/web/src/index.ts:172-194`）：
  配置 id 已注册且 `available()` → 用它；**其余四路全部抛错、不回落到别的
  provider**——`WEB_PROVIDER_CONFIGURED_MISSING` / `WEB_PROVIDER_CONFIGURED_UNAVAILABLE`
  / `WEB_PROVIDER_AMBIGUOUS`（无配置且多个可用）/ `WEB_PROVIDER_UNAVAILABLE`（零可用）。
- `web_fetch` 工具对 `ctx.web.fetch` **单次调用，无重试无降级**
  （`packages/web/tool-web/src/fetch.ts:497-509`）；provider 内部也无重试。
- **结论①：宿主没有现成的 fetch 兜底缝。** 任何「失败换一家」语义必须由被选中的
  provider 自己实现（正如本插件 search 链在 `dshws-chain` 内部做的）。

### 1.2 search 那条「用户层 re-point」缝对 fetch 不存在

- search 的接管缝本质：shipped provider `web-search-deepseek` 装 settings namespace
  `web-search-deepseek` 并**每次搜索 `current()` 现读现解析**
  （`packages/web/web-search-deepseek/src/index.ts:85,127-139`）——外挂不改
  `searchProvider` 配置，只把内置 provider 的端点/凭据 re-point 到自己。
- fetch 的唯一 shipped provider `web-fetch-http`（id `'http'`，
  `packages/web/web-fetch-http/src/provider.ts:35`；`available()` 恒 true `:51-53`）
  **没有任何 settings namespace**（`web-fetch-http/src/index.ts:32-51` 全是行级
  传输限额；全文件 grep「settings」零命中）。
- **结论②：fetch 没有对应的用户层 settings 缝——不能靠 re-point 内置 provider。**

### 1.3 配置选择面：行 config 钉死，env 兜底不可达

- 配置键 = `WebRuntimeConfig { searchProvider?, fetchProvider? }`
  （`web/src/index.ts:55-60`）；来源 = Loader 行 config 优先、env 兜底
  （`config.fetchProvider ?? process.env.DSH_WEB_FETCH_PROVIDER`，:92-93）。
- 但 shipped base patch **两层显式钉死** `fetchProvider: http`
  （`packages/bundle/base/cordis.patch.yml:452-454`）→ 行 config 已设值，
  **`??` 右侧 env 在 shipped 组合里永远不生效**；且 patch 是整段替换 config，
  overlay 改 `web` 行必须重述全部键。
- 去掉配置指望「无配置自动选」也不行：`http` 恒 available，第二 provider 注册进来
  即 `WEB_PROVIDER_AMBIGUOUS` 全量失败（`web/src/index.ts:189-192`）。

### 1.4 唯一外挂缝（零宿主改动）

1. **注册**：插件 host 半 `ctx.web.registerFetchProvider(provider)`
   （`web/src/index.ts:114-116`；同 id 重复注册抛 `WEB_DUPLICATE_PROVIDER`
   `:118-129`——**id 不能复用 `'http'`**）。
2. **选中**：profile/bundle patch 把 `web` 行 `config.fetchProvider` 钉到插件 id
   （整段重述 config，含 searchProvider——ADR-0009 同款 patch 后写覆盖语义）。
3. **内部兜底**：插件 provider 失败时回落自组 `HttpFetchProvider` 实例——该类与
   id 常量是 `@deepseek-ai/dsh-web-fetch-http` 的**公开导出**
   （`web-fetch-http/src/index.ts:16-20`），可直接组合。
- 与本插件现状拼合：`dshws-chain-fetch`（ChainFetchProvider，`src/chain/core.ts`
   + `src/index.ts:163` 注册在产）就是那个「新 id provider」——**v2「fetch 兜底
   开关」的实现形态 = patch 钉 `fetchProvider: dshws-chain-fetch` + 链内末端回落
   http 同构**（链成员面即现有 fetch 链成员 + anysearch fetch 面债务的取舍）。

### 1.5 热切边界（开关的「热」字上限）

- `WebRuntime` 在**构造器一次性捕获** provider id（`web/src/index.ts:87-94`），
  无 per-call 配置读、**无 settings watch——不存在 settings 级热切 fetch 的通道**。
- 唯一热路径 = profile patch 层 live reload：`watchUserPatches` 经 Cordis HMR
  `hmr.registerConfig` watch profile 的 `cordis.patch.yml` 并事务性重应用
  （`packages/boot/app-boot/src/index.ts:235-261`）；shipped `web` 模板与自定义
  profile 默认 `patchReload: 'live'`（`app-boot/src/profile.ts:144,169`）。
  （重载语义为 HMR 通用行为，仓内无 `web` 行专项热切测试——标注为文档依据级。）
- **GUI 一键热开关（settings 页拨一下即切）需要上游改动**：给 fetch 加 settings
  namespace + per-call 选项解析（照抄 `web-search-deepseek` 的 `current()` 模式）。
  非外挂可独立完成——若 v2 要 GUI 开关，要么提上游 PR，要么接受「开关 = patch 层
  切换（live reload 生效）」的降级语义。

### 1.6 判定汇总

| 问题 | 判定 | 关键锚 |
|---|---|---|
| 宿主 fetchProvider 可否插件热改 | **settings 级：不可**（无 namespace/watch）；**patch 级：可**（live reload） | 1.2/1.5 |
| 有没有内建兜底/降级 | **无**（单赢家，四路抛错不回落） | 1.1 |
| 外挂兜底可行缝 | registerFetchProvider 新 id + patch 钉 id + 内部回落 HttpFetchProvider | 1.4 |
| env 兜底 | shipped 组合不可达（行 config 钉死 `??` 短路） | 1.3 |

## 2. 余额/积分看板地基（v2 另一项）

- **宿主 client 无任何现成「用量/余额/统计」扩展 slot**：契约 slot 名零命中
  usage/balance/quota/stats（复核口径：`grep -rn "key: '"
  packages/extensions/cordis-client-runner/src/client/slot-catalog.ts` 按目录全表
  核对；计数因口径而异〔契约声明面 51 vs 全目录 65〕，载荷性结论以**零命中**为准，
  不锚计数）。
- 可借 GUI 面：`settings.section`（本插件已在产的自建页——余额看板可作为设置页
  内区块或新 section）/ `sidebar.footer.action`（侧栏入口）。最接近的宿主统计件
  是 chat 统计条（`session-stats` projection，非 GUI slot）与 host 侧
  `@deepseek-ai/dsh-token-meter`（无 client 消费）。
- **数据面前提（本轮未做，属 v2 正式立项内容）**：各 provider 余额/用量 API 调研
  （Tavily/Exa/Perplexity/Firecrawl 的 usage 端点是否存在、鉴权与额度口径、
  anysearch 信封是否携带额度字段）——立项时按 provider 逐家实测定锚。

## 3. 版本态说明

- 宿主仓 `/Volumes/IPFSJK/Zcode/deepseek-harness` dev 分支 = **0.1.2-alpha.3 发布线**
  源码（HEAD `3281e04b59`，仓内 156 包同版本）；本插件 devDeps = **0.1.2-alpha.4**；
  npm 发布线已至 `0.1.2-rc.1`。
- 本注记宿主侧锚点取自 alpha.3 源树；**载荷性契约（slot priority 等）已在插件
  node_modules 的 alpha.4 安装包逐字复核一致**（阶段 2 审核锚点抽查 23-25）。
  v2 实现期如隔版本，按当日安装包复核锚点（rc 线可能有行号漂移）。

## 锚点复核清单（抽样 ≥5 即可复核本注记）

| # | 锚点 | 复核方式 |
|---|---|---|
| 1 | `deepseek-harness packages/web/web/src/index.ts:172-194` resolveProvider 四路抛错 | Read 该区间 |
| 2 | `packages/web/web-fetch-http/src/index.ts:16-20` HttpFetchProvider 公开导出 | Read + grep settings 零命中 |
| 3 | `packages/bundle/base/cordis.patch.yml:452-454` fetchProvider: http 钉死 | Read |
| 4 | `packages/web/web-search-deepseek/src/index.ts:127-139` current() 模式（对照缝） | Read |
| 5 | 插件 `src/index.ts:163` registerFetchProvider('dshws-chain-fetch') 在产 | Read 本仓 |
| 6 | `packages/boot/app-boot/src/index.ts:235-261` watchUserPatches live reload | Read |
| 7 | slot 零命中口径 | grep slot-catalog / SlotMap 契约 |
