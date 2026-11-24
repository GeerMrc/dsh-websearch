# dsh-websearch

> **文档分工**：插件页显示的用户文档是 [docs/plugin-page.zh.md](docs/plugin-page.zh.md)（由 locale `meta.detail` 指定，英文环境读 [docs/plugin-page.en.md](docs/plugin-page.en.md)）；本 README 面向开发、安装与验收。
>
> **语言权威声明**：本文件为中文事实正本；`README.en.md` 为英文镜像，两文件不一致时以本文件为准。
> 版本线：v0.1.0 起（ADR-0020）；**v0.2.0 = DNS 韧性层 + 上游对齐二轮收口**（ADR-0022；含四工具上游对齐修复与质量批——单一版本发布）。内部开发编号 0.2.0–0.9.0 归历史档，见 CHANGELOG。

`dsh-websearch` 是 deepseek-harness（`dsh`）的**外挂式统一网页搜索管理插件**：零内核侵入，把多家搜索供应商收编进一个标准插件，提供用户可配置的优先级链、完整高可用降级、多 API key 池、统一 web_fetch 接管，以及 Web 设置页管理 GUI。

**成员准入标准**（ADR-0017）：高可用 + 有免费额度 + 支持多 API key + 功能实现对齐上游官方 API。

| 成员 | 搜索 | 抓取 | 免费额度 |
|---|---|---|---|
| Tavily | ✔ | ✔（/extract） | ✔ |
| Exa | ✔ | ✘（上游无 URL-fetch 能力，永不进 fetch 链） | ✔ |
| Firecrawl | ✔ | ✔（/v2/scrape） | ✔ |
| AnySearch | ✔ | ✔（/v1/extract） | ✔ |
| DeepSeek（付费兜底） | ✔ | ✘ | ✘（付费，默认不参与） |

## 快速开始

> ⚠️ **已知上游宿主问题（非本插件缺陷）**，详见 **[docs/known-upstream-issues.md](docs/known-upstream-issues.md)**（现象/影响版本/规避/自查命令，照做即可）：
> 1. `dsh` **0.1.6-alpha.2**：任意工具调用崩溃 `TOOL_RUNTIME_SCHEDULER.prepare`——避开该版本（用 0.1.5-rc.x / 0.1.6-alpha.1 / 0.1.7+）。
> 2. `dsh` **0.1.7-alpha.2/rc.1（rc.2 半修）**：tsx 源码启动下宿主启动期报 `Plugin metadata … TypeError: Cannot assign to read only property 'stack'`——npm 安装/构建产物用户不受影响；源码启动用户可用 [fork 修复分支](https://github.com/GeerMrc/deepseek-harness/tree/fix/readonly-stack-rc2)。

前置：宿主 `dsh` ≥ 0.1.5-rc.1（peer 域 `>=0.1.5-rc.1 <0.1.8 || 0.1.6-alpha.1 || 0.1.6-alpha.2 || 0.1.7-alpha.1 || 0.1.7-alpha.2 || 0.1.7-rc.1 || 0.1.7-rc.2 || 0.2.0-rc.1 || 0.2.0-rc.2 || 0.2.2-rc.5 || >=0.2.0 <0.3.0`（S32/S33/S38/S41 全跨度——显式钉的是已演练的预发布版，范围由 `tests/peer-range.spec.ts` 按两种 semver 语义守护；0.1.8 稳定线未演练仍排除。其中 0.2.2-rc.5 只做完了装入与接管开关的实测，搜索与抓取的功能腿待做。宿主兼容门按 `includePrerelease` 放行 0.2.x 预发布，显式钉是「已演练」的记录而非过门条件，见 ADR-0027））、node ≥ 22.19。

```sh
# 1. 打包（仓库根）
pnpm install && pnpm run build && node scripts/pack.mjs   # 双名 tarball：裸名 dsh-websearch-<ver>.tgz（profile 安装）+ scoped（npm）

# 2. 安装进 web profile（装即接管，ADR-0013）
dsh plugin --profile web add /path/to/dsh-websearch-<version>.tgz

# 3. 验证组合（无需实例/无 LLM 即可读出选择标量）
dsh --profile web --dump-config
#    web 行 searchProvider: dshws-chain / fetchProvider: dshws-fetch-gate
#    dsh-websearch insert 行出现
```

**装即接管**：插件随包 `cordis.patch.yml` 钉 `searchProvider: dshws-chain` + `fetchProvider: dshws-fetch-gate`，并在启用期间隐藏官方「网页搜索与获取」设置页（ADR-0024）——`plugin add` 单命令即接管；关闭或卸载即复原组合，官方设置页随之恢复（0.2.2-rc.5 上经插件页开关实测；命令行卸载在 rc.5 上另行实测）。无需手写用户层 patch。用户层里另行保存过的 `web` 选择多数不随关闭清除、不随卸载清除，见 FAQ。

**卸载**：`dsh plugin --profile web remove dsh-websearch`。已知残留（诚实披露）：settings 默认值与预设目录不随 remove 清理（无害，用户自撰同名目录永不覆写）。

## 安装、升级与注意事项

**安装**（宿主 peer 域见上——覆盖 0.1.5-rc 线、0.1.6 与 0.1.7 预发布线及未来 0.1.6/0.1.7 稳定版、0.2.0-rc 线、0.2.2-rc.5 与 0.2.x 稳定版；0.1.8 与 0.3.x 不在域内）。**profile 安装唯一支持形态是裸名 tarball**（v0.2.2 起；PC6/M1 实测：npm scoped 名安装会静默丢失客户端半区——设置页「网页搜索」节与工具行徽标不渲染，宿主半区照常工作；0.2.2 起插件探测到此形态会在启动时把高声告警写入 `<DSH_HOME>/logs/dsh-websearch.log`，rc.5 宿主自身不输出插件日志）：

```sh
# 方式一（推荐）：GitHub Release 裸名 tarball 一条命令直装（改版本号即升级）
dsh plugin --profile web add 'https://github.com/GeerMrc/dsh-websearch/releases/download/v0.2.2/dsh-websearch-0.2.2.tgz'
# 方式二：发布页手动下载裸名 tarball 后本地安装
dsh plugin --profile web add <dsh-websearch-tarball>
# 方式三：从源码自行打包（dist-artifacts/ 里的裸名 tgz）
git clone https://github.com/GeerMrc/dsh-websearch.git && cd dsh-websearch
pnpm install && pnpm run build && node scripts/pack.mjs
# 方式四：profile package.json 依赖 file: 指向裸名 tarball 后 pnpm install
```

scoped npm 包（https://www.npmjs.com/package/@maricgeer/dsh-websearch ；裸名 `dsh-websearch` 因 npm 防仿冒政策与既有包 `dsh-web-search` 过近被拒，故用 scope 分发）**只用于包管理器依赖解析与 registry 分发**（CI、e2e），不要装进 profile：`add @maricgeer/dsh-websearch` 宿主半区不加载，`dsh-websearch@npm:@maricgeer/dsh-websearch` 双名别名宿主半区可用但客户端半区静默缺失。另外 pnpm `minimumReleaseAge` 未加豁免时会**静默**解析到旧版本——registry 路径务必核对装到的版本号（PC6）。

安装即接管 web_search / web_fetch（bundle 钉扎安装序，后写者赢），并在启用期间隐藏官方「网页搜索与获取」设置页（ADR-0024）；卸载自动复原宿主默认与该页面。用户层另行保存的 `web` 选择不随卸载清除，见 FAQ。换包后浏览器整页刷新（client 走 `/plugins/*?rev=` 运行时路由）。

**升级**：完整演练手册见 [docs/upgrade.md](docs/upgrade.md)（打包→换包→dump 对照→GUI 冒烟→搜索→降级六步 + 发版前上游对齐确认）。同版本号换包会被跳过——预览场景先 bump 版本。

**CI/发布**（v0.2.0 起；OIDC 与一致性门自 ADR-0026 起）：master 推送与 PR 跑全量门禁加发布预演（typecheck/lint/test/i18n/build，node 22/24 矩阵；打包并校验 tarball 内容）。推送 `v*` 标签即发布确认点：流水线先跑全量门与 `scripts/check-release.mjs`（tag、package.json、CHANGELOG、`USER_AGENT` 四处版本一致，tag 指向 master 上的提交），再发布——双名 tarball 附 GitHub Release，scoped 包经 OIDC trusted publishing 发布到 npmjs.org，不使用长期 token。本地发版步骤见 [docs/release-runbook.md](docs/release-runbook.md)。

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
- **DNS 韧性卡**（v0.2.0，ADR-0022）：成员卡同构头部（启停 Switch），模式（自动/开启/关闭）、DoH 预设（自动/国内/海外/自定义节点）、探测方式（TCP/TLS）、检测状态与证据、Inspect 最近解析 trace；详见下节。

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

## DNS 韧性层（v0.2.0，ADR-0022）

旁路由/受控网络下的进程级解析高可用（对本插件的全部上游请求生效；不影响插件外进程）：

- **自动检测**（默认 `mode: auto`）：启动金丝雀对成员域名做双路对照，命中投毒证据（如 198.18.0.0/15 fake-ip）自动启用 DoH；干净网络零行为变化（零命中即卸载补丁）。
- **DoH 加密解析**：绕开 53 端口透明拦截；区域预设池（国内 AliDNS/DNSPod，海外 Cloudflare/Google/Quad9）+ bootstrap 自动选点（RTT 排序）。
- **出口预检**（`dns.probe.method`）：TCP-443 或 TLS-Hello（带 SNI，默认 tcp）探测 IP 可达性，过滤 CDN 轮换滞后的不可达 IP——(SNI, IP) 元组过滤网络的实测有效项。
- **多级降级**：DoH 全灭回退系统解析恰一次；连接级失败 fresh 解析后重试一次即降级下一成员（不烧 key 额度）。
- **隐私红线**：日志/trace 的主机名脱敏（非成员域名哈希+末两标）；代理环境变量在位时自动暂停（走系统路径）。
- 链路日志 `[dshws-dns]`/`[dshws-chain] connect-flap` 行含 4-hex 运行键，可并行归属。

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

- **官方桌面端（Electron app）能用本插件吗**：能。桌面端与 web 端共用 `~/.dsh`（key/会话/工作区直接共享），插件按 profile 隔离需各自安装：桌面端用 app 内置命令装 `'/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh' plugin --profile desktop add @maricgeer/dsh-websearch`（装完重启 app）。**app 自动更新后插件可能失效/拒装——这是预期行为**（更新会替换捆绑运行时：宿主兼容门按 `includePrerelease` 放行 0.2.x 预发布，插件不会被拒装，但上游改了接口时插件可能失效）：自查 `'<同上 launcher>' plugin --profile desktop add @maricgeer/dsh-websearch` 重装即可；仍失败说明需要等插件适配新版（见 [known-upstream-issues](docs/known-upstream-issues.md) 与 [desktop-adoption](docs/desktop-adoption.md)）。
- **官方 web_fetch 在代理环境报错**：宿主 SSRF 硬防护 × TUN fake-ip 所致（非本插件 bug）。开 `fetchTakeover` 走云端 extract 链即绕开。
- **Perplexity 哪去了**：已移除（ADR-0017——无免费额度可申请，不满足准入标准）。存量 settings.yaml 的 `perplexity:` 残节无害（schema 透传），可手动清理。
- **AnySearch 垂直面 tag/params 未实现**：待 key 探针（S22 登记）。
- **官方「网页搜索与获取」设置页去哪了**：插件启用期间它被隐藏，由「设置 → 网页搜索」接管（ADR-0024）；关闭或卸载插件后自动恢复。设计上的逃生口：在 profile 的 `cordis.patch.yml` 写 `- id: ui-settings-web-search` 与 `disabled: false` 可强制显示官方页（与 dsh-subagent-plus 的做法一致；0.2.2-rc.5 上实测可用）。
- **关闭插件后官方页显示「未加载」**：0.2.0 及更早版本里官方页可见，若在其中把提供方选定为本插件成员并保存，该选择写在用户层，优先于组合包层，关闭插件后成为悬空引用（`web_search` 报 `WEB_PROVIDER_CONFIGURED_MISSING`）。插件启用期间检测到该选择时，「网页搜索」设置页顶部会出现提示卡，点「清除钉值」一键清除；关闭插件后在恢复出来的官方页重新选择并保存也可清除（选「自动选择」加「本机直接获取」即回到默认）；还可以删除 profile `cordis.patch.yml` 里 `web` 行的 `searchProvider` 与 `fetchProvider`（两个一起删）后重启宿主。关闭时的自动交还在 rc.5 上不可靠：宿主 teardown 运行在 HMR 事务内、写入被拒，客户端守卫多数在事件送达前被卸载（13 次里 2 次存活，1 次写入成功），实测见 [session-41 记录](docs/sessions/2026-11-23-session-41.md)。
- **升级**：见 [docs/upgrade.md](docs/upgrade.md)。

## 更多文档
- [docs/patterns.md](docs/patterns.md) — 插件页介绍卡与换装验证范本（PC1–PC3，跨版本复用）
- [docs/known-upstream-issues.md](docs/known-upstream-issues.md) —— 已知上游 DSH 问题登记表（现象/规避/自查命令，含 fork 修复分支用法）
- [docs/desktop-adoption.md](docs/desktop-adoption.md) —— 官方桌面端全貌与采用实测（ADR-0023）
- [docs/upstream-sync-sop.md](docs/upstream-sync-sop.md) —— 随官方上游（npm 线 + 桌面端）迭代的同步 SOP（监测/决策/守卫重放/双端验证/发版联动）

- 架构正本：[docs/00-architecture.md](docs/00-architecture.md)
- 决策记录：[docs/decisions/](docs/decisions/)（ADR-0001..0027）
- 升级演练手册：[docs/upgrade.md](docs/upgrade.md)
- 治理看板：[docs/STATUS.md](docs/STATUS.md)
