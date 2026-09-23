# dsh-websearch

> **语言权威声明**：本文件为中文事实正本；`README.en.md` 为英文镜像，两文件不一致时以本文件为准。
> 版本线：**v0.1.0** 起（ADR-0020）。内部开发编号 0.2.0–0.9.0 归历史档，见 CHANGELOG。

`dsh-websearch` 是 [deepseek-harness](https://github.com/)（`dsh`）的**外挂式统一网页搜索管理插件**：零内核侵入，把多家搜索供应商收编进一个标准插件，提供用户可配置的优先级链、完整高可用降级、多 API key 池、统一 web_fetch 接管，以及 Web 设置页管理 GUI。

**成员准入标准**（ADR-0017）：高可用 + 有免费额度 + 支持多 API key + 功能实现对齐上游官方 API。

| 成员 | 搜索 | 抓取 | 免费额度 |
|---|---|---|---|
| Tavily | ✔ | ✔（/extract） | ✔ |
| Exa | ✔ | ✘（上游无 URL-fetch 能力，永不进 fetch 链） | ✔ |
| Firecrawl | ✔ | ✔（/v2/scrape） | ✔ |
| AnySearch | ✔ | ✔（/v1/extract） | ✔ |
| DeepSeek（付费兜底） | ✔ | ✘ | ✘（付费，默认不参与） |

## 快速开始

> ⚠️ **已知上游宿主问题（非本插件缺陷）**：`dsh` **0.1.6-alpha.2** 宿主自身工具调度缺陷——任意工具调用（含 shell/web_search）崩溃 `TOOL_RUNTIME_SCHEDULER.prepare`，无插件净环境可复现。请避开该宿主版本（用 0.1.5-rc.x / 0.1.6-alpha.1 / 0.1.7-alpha.x），或等上游修复。详见 [docs/upgrade.md](docs/upgrade.md) 三线矩阵。

前置：宿主 `dsh` ≥ 0.1.5-rc.1（peer 域 `>=0.1.5-rc.1 <0.1.8 || 0.1.6-alpha.1 || 0.1.6-alpha.2 || 0.1.7-alpha.1 || 0.1.7-alpha.2`，S32 全跨度——显式钉已演练预发布版）、node ≥ 22.19。

```sh
# 1. 打包（仓库根）
pnpm install && pnpm run build && npm pack   # 产出 dsh-websearch-<version>.tgz

# 2. 安装进 web profile（装即接管，ADR-0013）
dsh plugin --profile web add /path/to/dsh-websearch-<version>.tgz

# 3. 验证组合（无需实例/无 LLM 即可读出选择标量）
dsh --profile web --dump-config
#    web 行 searchProvider: dshws-chain / fetchProvider: dshws-fetch-gate
#    dsh-websearch insert 行出现
```

**装即接管**：插件随包 `cordis.patch.yml` 钉 `searchProvider: dshws-chain` + `fetchProvider: dshws-fetch-gate`——`plugin add` 单命令即接管，`plugin remove` 单命令完整复原（dump diff 零输出）。无需手写用户层 patch。

**卸载**：`dsh plugin --profile web remove dsh-websearch`。已知残留（诚实披露）：settings 默认值与预设目录不随 remove 清理（无害，用户自撰同名目录永不覆写）。

## 安装、升级与注意事项

**安装**（宿主 peer 域见上——覆盖 0.1.5-rc 线、0.1.6 与 0.1.7 预发布线及未来 0.1.6/0.1.7 稳定版，上限 0.1.8）：

方式一（npm registry，推荐）：

```sh
dsh plugin --profile web add @maricgeer/dsh-websearch
```

（npm 包页 https://www.npmjs.com/package/@maricgeer/dsh-websearch ；裸名 `dsh-websearch` 因 npm 防仿冒政策与既有包 `dsh-web-search` 过近被拒，故用 scope 分发——插件注册 id 仍为 `dsh-websearch`，功能与本地 tarball 安装完全一致）

```sh
# 方式一：从本仓库发布页取 tarball
dsh plugin --profile web add <dsh-websearch-tarball>
# 方式二：从源码自行打包
git clone https://github.com/GeerMrc/dsh-websearch.git && cd dsh-websearch
pnpm install && pnpm run build && npm pack   # 产出 dsh-websearch-<ver>.tgz
# 方式三：profile package.json 依赖 file: 指向 tarball 后 pnpm install
```

安装即接管 web_search / web_fetch（bundle 钉扎安装序，后写者赢）；卸载自动复原宿主默认。换包后浏览器整页刷新（client 走 `/plugins/*?rev=` 运行时路由）。

**升级**：完整演练手册见 [docs/upgrade.md](docs/upgrade.md)（打包→换包→dump 对照→GUI 冒烟→搜索→降级六步）。同版本号换包会被跳过——预览场景先 bump 版本。

**注意事项**：
- key 值永不下发客户端；设置页徽标只显示整数计数（refs 白名单限定五成员，防跨凭据探测）。
- 宿主升级换供版 worktree 后需先在该 worktree `pnpm install && pnpm run build`，profile 链接（symlink healing）才能解析到完整 `lib/`。
- 0.1.6-alpha.1 起 loader 非事务化：插件启动失败表现为 fiber FAILED + 日志（不再整树回滚），排障看 `<dshHome>/logs/`。

## 从 anysearch 插件迁移（ADR-0013）

原 `@anysearch/anysearch-dsh` 用户：**先卸载再安装**即完成切换（bundle 钉扎安装序，后写者赢）：

```sh
dsh plugin --profile web remove @anysearch/anysearch-dsh   # 或其安装名
dsh plugin --profile web add /path/to/dsh-websearch-<version>.tgz
```

- 两插件 id 前缀不同（`anysearch` vs `dshws-*`），零冲突；本插件含 `dshws-anysearch` 成员，key 沿用 `ANYSEARCH_API_KEY`。
- **否决/自定义**（用户层终裁）：若用户层 `cordis.patch.yml` 整段替换 web 行 config，须重述 `searchProvider` 与 `fetchProvider` 两键，否则在配置了 firecrawl key 的场景触发 `WEB_PROVIDER_AMBIGUOUS` 硬错（响亮失败，非静默）。

## Key 配置（多 key 单槽逗号值，ADR-0011）

key 一律走宿主 credentials 服务（credential-ref = 环境变量名），**零明文进配置文件**。解析四层：进程环境 > `~/.dsh/.credentials.yaml` > 项目 .env > 用户 .env；每操作解析，热生效。

每成员一个 ref（默认 `TAVILY_API_KEY` / `EXA_API_KEY` / `FIRECRAWL_API_KEY` / `ANYSEARCH_API_KEY` / `DEEPSEEK_API_KEY`，可经 `apiKeyEnv` 改名）。**多 key = 同一 ref 的值写成逗号分隔**（如 `TAVILY_API_KEY=key1,key2,key3`），或 GUI 设置页 Key 输入框直接输入逗号串。

取 key 策略 `keySelection`（默认 `round-robin`）：`order`（按序）/ `round-robin`（轮询）/ `random`（不放回随机，ADR-0012——升序 Fisher-Yates 牌堆，同一轮不重抽）。

## GUI 设置页导览

安装后 Web 端「设置 → 网页搜索」：

- **成员卡**（默认折叠，整卡头部点击展开）：状态绿点、名称、**Key 计数徽标**（仅展开态，14px 圆同「?」图标尺寸：0=灰空心圆，N=绿色数字圆=插件激活色，超 10=警示色；悬停显示 `已配置 N/10`，展开瞬间自动刷新计数）、未保存 pill、启停开关；展开区 = API Key 输入（明文输入/保存后 •••• 遮罩/清除）、Key 策略循环 chip、接口地址覆盖（留空=默认）、逐成员参数（对齐上游官方枚举，ⓘ 悬停有完整语义说明）。
- **搜索链 / Web Fetch 链**：双链独立排序（ADR-0019），启停即时生效（下一次搜索）。
- **详细配置折叠区**：兜底搜索选择器、超时预算、DeepSeek maxUses、统一语言/区域（ADR-0015）。
- **溯源徽标**（ADR-0010）：会话工具行显示 `[served-by: <成员id>]`，模型可据实引用来源。

## 链语义（ADR-0002 / ADR-0014）

- 按序遍历：未注册/未启用/凭据未就绪 → 跳过；运行失败或超时（`perMemberTimeoutMs`，默认 30000）→ 降级下一成员；某成员成功即返回。
- 同工具 key 级重试：池 >1 key 时，失败先同成员重抽 ≤3 次（ADR-0012），再降级。
- 全部耗尽 → `DSHWS_CHAIN_EXHAUSTED`（附逐成员失败摘要，fail-loud）。
- **兜底**（`fallbackMember`，ADR-0014）：`auto`（默认，链尾即兜底）/ 指定工具成员（钉尾，退出常规轮转）/ `dshws-deepseek`（付费兜底：仅当就绪工具成员 ≤1 且其 key 已配置时参与，运行时守卫，非静态追加）。
- 用户在宿主层钉死单成员（`searchProvider: dshws-tavily` 等）= 直连不降级。

## web_fetch 接管（ADR-0019）

`fetchProvider` 钉 `dshws-fetch-gate`（gate 运行时路由器）：

- **接管开**（`fetchTakeover: true`，默认）：web_fetch 由内部 fetch 链服务——Firecrawl → Tavily → AnySearch 降序降级（Exa 无上游 fetch 能力，永不进链）。云端抓取不受本机代理/SSRF 限制。
- **接管关**：gate 回落内置 http 直抓（官方行为等价近似；patch 钉死下官方 provider 实例永不被选）。
- 两态开关在 GUI 与 settings 热生效（下一个 agent / 下一次调用）。

## 配置参考（cordis.yml `dsh-websearch` 节）

> 唯一正本 = `src/config.ts` schema；此处摘录常用面。全字段热生效（下一次搜索）。GUI 写入与 cordis.yml 同 schema。

```yaml
dsh-websearch:
  searchChain: []            # 搜索链；空 = tavily→exa→firecrawl→anysearch
  fetchChain: []             # fetch 链；空 = firecrawl→tavily→anysearch
  perMemberTimeoutMs: 30000  # 每成员超时预算
  fallbackMember: auto       # auto | 成员id | dshws-deepseek（付费兜底）
  fetchTakeover: true        # web_fetch 接管两态开关
  chainLogFile: true         # 链路日志 <dshHome>/logs/dsh-websearch.log
  searchCountry: ''          # 统一区域 ISO 3166-1 alpha-2（fan-out Exa/Firecrawl，ADR-0015）
  searchLanguage: ''         # 统一语言 ISO 639-1（fan-out Tavily，ADR-0015）
  searchIncludeDomains: ''   # 统一域名白名单（逗号分隔；与 exclude 互斥，ADR-0018）
  searchExcludeDomains: ''
  tavily:     { enabled: true, apiKeyEnv: TAVILY_API_KEY, baseURL: '', maxResults: 5,
                topic: general, timeRange: '', searchDepth: '', includeAnswer: basic,
                chunksPerSource: 3, filterByLanguage: false, includeDomainsMode: filter,
                startDate: '', endDate: '', exactMatch: false, keySelection: round-robin }
  exa:        { enabled: true, apiKeyEnv: EXA_API_KEY, baseURL: '', numResults: 5,
                type: auto, textFallback: true, startPublishedDate: '', endPublishedDate: '',
                category: '', maxAgeHours: 720, textVerbosity: '', includeSections: '',
                excludeSections: '', keySelection: round-robin }
  firecrawl:  { enabled: true, apiKeyEnv: FIRECRAWL_API_KEY, baseURL: '', tbs: '',
                safe: false, location: '', sources: '', categories: '', keySelection: round-robin }
  anysearch:  { enabled: true, apiKeyEnv: ANYSEARCH_API_KEY, baseURL: '', zone: cn,
                keySelection: round-robin }
  deepseek:   { enabled: false, apiKeyEnv: DEEPSEEK_API_KEY, baseURL: '', model: '',
                maxTokens: 0, maxUses: 5, keySelection: round-robin }
```

组合限制（fail-loud：0.1.5/0.1.6 宿主 settings validate hook 写前拒写；0.1.7+ 宿主降级为读取时 loud 失败——ADR-0021；cordis.yml 加载报错两代恒在）：
- `searchIncludeDomains` 与 `searchExcludeDomains` 互斥（ADR-0018）。
- `exa.includeSections/excludeSections` 须配 `exa.maxAgeHours: 0` 或 `-1`（官方约束）。
- `firecrawl.tbs` 须为官方 tbs 文法（`qdr:*` / `sbd:1` / `cdr:1,cd_min:…,cd_max:…` 逗号组合）。

## FAQ / 已知行为

- **官方 web_fetch 在代理环境报错**：宿主 SSRF 硬防护 × TUN fake-ip 所致（非本插件 bug）。开 `fetchTakeover` 走云端 extract 链即绕开。
- **Perplexity 哪去了**：已移除（ADR-0017——无免费额度可申请，不满足准入标准）。存量 settings.yaml 的 `perplexity:` 残节无害（schema 透传），可手动清理。
- **AnySearch 垂直面 tag/params 未实现**：待 key 探针（S22 登记）。
- **宿主设置页闲置的 web-search-deepseek 配置卡**：接管后不生效仍在（其 key 保存为对 `DEEPSEEK_API_KEY` 的单值写入点）——已知行为，勿在那里配置多 key。
- **升级**：见 [docs/upgrade.md](docs/upgrade.md)。

## 更多文档

- 架构正本：[docs/00-architecture.md](docs/00-architecture.md)
- 决策记录：[docs/decisions/](docs/decisions/)（ADR-0001..0020）
- 升级演练手册：[docs/upgrade.md](docs/upgrade.md)
- 治理看板：[docs/STATUS.md](docs/STATUS.md)
