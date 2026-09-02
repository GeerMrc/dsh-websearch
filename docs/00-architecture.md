# dsh-websearch 架构文档

> 状态：v1.0（bootstrap 规划产物，2026-09-02，随 S01 定稿）
> 本文档是系统组成/模块边界/技术选型的正本；架构级决策正本在 `docs/decisions/`（ADR）。

## 1. 项目定位

`dsh-websearch` 是 deepseek-harness（`dsh`）的**外挂式统一 WebSearch 管理插件**：在不修改上游任何代码的前提下，把多搜索 provider（Tavily / Firecrawl / Exa / Perplexity / DeepSeek）收编进一个标准插件，提供用户可配置的优先级链与完整高可用降级，并在 Web 设置页提供统一管理 GUI（每 provider API key + 启停 + 排序）。

要解决的上游现状（2026-09-02 实测证据，deepseek-harness 仓库）：

| 现状 | 证据 |
|---|---|
| 出厂硬钉死付费官方搜索 | `packages/bundle/base/cordis.patch.yml:450-468` 钉死 `searchProvider: deepseek-official` |
| 无降级链（选定 provider 失败即报错） | `packages/web/web/src/index.ts:49-73` 选择语义；2026-06-24 架构决策刻意如此 |
| 第三方 provider key 配置不对称（仅 env、需重启、无 GUI） | `packages/web/web-search-exa/src/index.ts:61-73`（不接 credentials 服务） |
| 多 provider 无法共存选择 | 单标量 `searchProvider` + `WEB_PROVIDER_AMBIGUOUS` fail-loud |
| 无 provider 观察面（GUI 不知道装了哪些/哪些可用） | `WebRuntime` 注册表私有（`index.ts:85-86`） |

## 2. 宿主环境与公开依赖面（上游可持续契约）

宿主：`dsh` 0.1.2-alpha.x（web/headless profile，cordis 插件协议）。

**只允许依赖以下公开面**（详见 `AGENTS.md` seam 纪律节）：

| 依赖面 | 内容 | 引入方式 |
|---|---|---|
| web seam | `WebSearchProvider`/`WebFetchProvider` 接口（`packages/web/web/src/types.ts:99-120`）；`ctx.web.registerSearchProvider/registerFetchProvider`（`index.ts:103-116`），effect 注册、返回 disposer | `@deepseek-ai/dsh-web` type-only import + `inject: ['web']` 服务名注入 |
| 凭据 | credentials 服务按 ref 解析（四层：进程环境 > `~/.dsh/.credentials.yaml` > 项目 .env > 用户 .env），每操作解析=热生效；ref 粒度事件 `credentials/reference-updated`（`packages/credentials/credentials/src/index.ts:270`） | `inject: ['credentials']` |
| 设置 | `installSection(owner, ns, schema, entry, hooks)` 命名空间节（`packages/settings/settings/src/index.ts:469`），GUI 经 `settings.mutate` 写入；外置插件通路 S02 实测 | `inject: ['settings']` |
| client | slots（`settings.section` 注入设置页）、locale（双语字典）、remote（typert RPC 客户端） | client half 经插件运行时 `/plugins/<id>/client.js` 分发 |

第三方可行性已验证：`@anysearch/anysearch-dsh@0.1.4` 即以同构方式实现 `WebSearchProvider`/`WebFetchProvider` 并经 bundle patch 覆盖选择标量（其 `lib/index.js:62-63` 注册调用；patch 形态见 `docs/decisions/` ADR-0001 附录）。

## 3. 系统组成与模块边界

```
dsh-websearch/
├── src/                        # node 半区（cordis 插件）
│   ├── index.ts                # 插件宿主：name/inject/Config/apply；只做装配，不含业务逻辑
│   ├── config.ts               # Config schema（schemastery）：链序 + 每 provider 子节
│   ├── chain/                  # 链式 meta-provider（本项目核心资产）
│   │   ├── search-chain.ts     # dshws-chain：search 优先级链 + 降级
│   │   └── fetch-chain.ts      # dshws-chain-fetch：fetch 同构
│   ├── providers/              # 内置 provider 实现（每文件一个，互不依赖）
│   │   ├── deepseek.ts         # dshws-deepseek（Anthropic 兼容 Messages + web_search server tool）
│   │   ├── tavily.ts           # dshws-tavily（POST /search）
│   │   ├── firecrawl.ts        # dshws-firecrawl（search + 抓取，同 key）
│   │   ├── exa.ts              # dshws-exa（POST {baseURL}/search）
│   │   └── perplexity.ts       # dshws-perplexity（OpenAI 兼容 chat-completions, sonar）
│   ├── credentials.ts          # 每 provider key ref 解析 + available() 缓存 + credentials/reference-updated 刷新
│   └── settings.ts             # installSection：链序等用户可热改字段
├── client/                     # client 半区（设置页）
│   ├── index.ts                # apply：ctx.slots.inject('settings.section', ...)
│   ├── WebSearchSection.tsx    # 「网页搜索」设置页：provider 卡 + search 链优先级排序 + 状态；fetchChain v1 只读展示
│   └── locales.ts              # en 源 + zh 全键 parity
├── tests/                      # vitest：单测 + loopback stub e2e；e2e.real/ 真实 API（无 key 自跳）
└── docs/                       # 治理根（STATUS/sessions/progress/plans/decisions/...）
```

边界规则：providers 互不依赖、不感知链；chain 不实现任何 HTTP 调用、只做编排；client 半区禁 import node 半区值（类型可）。

## 4. 高可用链语义（规范级定义）

链 = 用户配置的保序 provider id 列表（默认空 = 内置顺序）。`dshws-chain` 作为**一个普通 `WebSearchProvider`** 注册进 `ctx.web`，对上游完全合规：

- `available()`（便宜本地检查，禁网络调用）：≥1 个启用成员的凭据就绪（credentials describe 缓存 + `credentials/reference-updated` 事件刷新）→ true。
- `search(request)`：按序遍历成员——未注册/未启用/凭据未配置 → 跳过；`available()`=false → 跳过；**运行期抛错（429 限额/网络/宕机等）或成员超时 → 记录后降级下一成员**；某成员成功 → 返回其结果。
- **每成员超时预算**：`perMemberTimeoutMs`（Config 字段，默认 30000）；超时视同该成员失败进入降级，宿主日志记 `DSHWS_MEMBER_TIMEOUT`。
- **servedBy 承载机制**（定谳）：seam 结果类型封闭（`WebSearchResult` 仅 `content?/sources/truncated`，零侵入约束下不可加字段），署名承载于 **`content` 首行 `[served-by: <成员id>]`**（model-visible，模型可据实引用来源）+ 宿主日志一行；用户钉死单成员直连时不加前缀（与上游行为一致）。
- 全部成员耗尽 → 抛 `DSHWS_CHAIN_EXHAUSTED`（末端 fail-loud），错误信息附逐成员失败摘要（成员 id + 失败原因/码）。
- 用户经组合标量钉死单个具体 provider（如 `searchProvider: dshws-tavily`）时走该 provider 直连，**不降级**（显式指定 = 用户意志）。
- fetch 链（`dshws-chain-fetch`）同构；GUI 上 fetchChain v1 只读展示，调整走 profile YAML（ADR-0004 进阶路径）。

此语义是对上游「无降级链」决策的**外挂侧实现**（不改上游行为，只在其上叠加），决策记录见 ADR-0002。

## 5. 配置与凭据模型

Config（schemastery，全部字段带 JSDoc；部署差异经 cordis.yml，用户热改经 settings 节）：

```text
dsh-websearch:
  searchChain:        string[]   # search 优先级链（成员 id；空 = 内置默认序
                                 #   tavily → exa → perplexity → firecrawl → deepseek，ADR-0004）
  fetchChain:         string[]   # fetch 优先级链（GUI v1 只读展示，YAML 调整）
  perMemberTimeoutMs: number     # 链内每成员超时预算，默认 30000（ADR-0002）
  deepseek:   { enabled, apiKeyEnv='DEEPSEEK_API_KEY', baseURL, model, maxTokens }
  tavily:     { enabled, apiKeyEnv='TAVILY_API_KEY',   baseURL, maxResults }
  firecrawl:  { enabled, apiKeyEnv='FIRECRAWL_API_KEY', baseURL }
  exa:        { enabled, apiKeyEnv='EXA_API_KEY',      baseURL, numResults }
  perplexity: { enabled, apiKeyEnv='PERPLEXITY_API_KEY', baseURL, model }
```

错误码规范（稳定 string code，前缀 `DSHWS_`）：链级 `DSHWS_CHAIN_EXHAUSTED`（全成员耗尽，附逐成员摘要）、`DSHWS_NO_MEMBER_CONFIGURED`（链上无任何可用成员）；成员级由各 provider 自带码（`DSHWS_DEEPSEEK_*`/`DSHWS_TAVILY_*`/…，S03 定义清单落 `src/errors.ts`）。

凭据：全部走 credentials 服务（ref 即 `apiKeyEnv` 名），GUI/凭据页写入 `~/.dsh/.credentials.yaml`，热生效；`available()` 基于其 describe 结果。禁字面 key 进任何文件。

## 6. 组合与安装模型（零内核侵入的落点）

安装 = `dsh plugin --profile web add <本插件包>` + 用户层 patch（`~/.dsh/profiles/web/cordis.patch.yml`）两行：

```yaml
- insert:
    - id: dsh-websearch
      name: <本插件包名>
- id: web
  config:
    searchProvider: dshws-chain      # 覆盖上游 base 对 deepseek-official 的钉死（用户层后写生效）
    fetchProvider: dshws-chain-fetch
```

卸载 = 移除插件 + 删两行 patch → 完全复原上游行为。上游 `web-search-deepseek` 行保持原样（README 建议 patch `disabled: true` 停用，避免双搜索入口混淆；文档化用法，非代码侵入）。

## 7. 兼容性与升级

- id 全前缀 `dshws-`：与上游（`deepseek-official`/`exa`/`perplexity`/`http`）及第三方（`anysearch`）零撞名。
- 对上游唯一假设：seam 公开接口形状（provider 接口三方法 + 注册 API + 服务名注入）。升级演练 = 每 alpha 升级后按 `docs/upgrade.md`（S09 交付）跑安装→配置→搜索→降级→GUI 冒烟。
- 本插件内重实现 deepseek 搜索（链成员需可直接调用的实例；上游注册表私有不可枚举）；与上游官方 provider 共用 `DEEPSEEK_API_KEY` ref，二者二选一启用。

## 8. 开放问题（S02 spike 定谳，ADR-0006/0007 承接）

1. **外置 client half 能否注入 `settings.section` slot 并使用 locale/remote 公共 API**（决定 GUI 形态：插件自带 client half / fork 仓库独立 client 包目录 fallback）。
2. `dsh plugin --profile web add <本地路径>` 安装链路端到端（本地目录/tarball 形态、peer 解析、bundle patch 自动接线）。
3. `settings.installSection` 在外置插件上的 describe/mutate 通路实测。
4. 外置 client half 的 **credentials 写通路**：`ctx.remote.credentials.set/unset` 是否对外置 client 可用且 `describe` 可见（GUI key 输入的前提；上游写路径 `modifyRecord` 在 `packages/credentials/credentials/src/index.ts:166`）。
5. 包名/版本起点/交付形态（本地路径 / tarball / npm publish）定谳 → ADR-0007。

## 9. 决策索引（正本在 docs/decisions/）

| ADR | 决策 |
|---|---|
| ADR-0001 | 独立项目目录 + 零内核侵入外挂式（对 v1 仓库内改造方案的取代） |
| ADR-0002 | 完整高可用链语义（选择时跳过 + 运行失败降级 + 全败末端报错；servedBy 承载于 content 首行） |
| ADR-0003 | 全 provider 收编单插件 + `dshws-` id 前缀隔离 |
| ADR-0004 | v1 全局优先级（settings 落点，home 级共享）；per-profile 留 YAML patch；完全中立开箱与内置默认序 |
| ADR-0005 | GUI 形态 spike-first（GO/NO-GO 由 ADR-0006 承接） |
| ADR-0006 | （S02 待定）GUI client half 形态 go/fallback |
| ADR-0007 | （S02 待定）包名/交付形态/版本策略 |
