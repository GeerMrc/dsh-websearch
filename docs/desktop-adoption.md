# DSH 官方桌面端全貌与采用指南（Desktop Adoption）

> **给谁看**：需要判断「要不要装官方桌面端、插件在桌面端怎么活、随官方桌面端更新怎么迭代」的 dsh-websearch 开发者与用户。本文是官方桌面客户端（DeepSeek Harness Desktop）的单一正本：它是什么、从哪来、怎么分发、与 `dsh web` 的架构与数据边界、插件的安装矢量与适配判定。三形态安装实测记录在 §9 随 S40 各任务回填。
>
> **维护规则**：官方桌面端每次 feed 变更（新版本发布）触发 [docs/upstream-sync-sop.md](upstream-sync-sop.md) 的桌面更新链；版本映射表（§3）以 feed 实测回填，不凭新闻稿推断。建立：2026-09-30（S40 T1a，harness 树 `fix/readonly-stack-020rc2` = `dsh-v0.2.0-rc.2` + 守卫）。

---

## 1. 一句话结论

官方桌面端就是官方 harness 仓 `apps/desktop` 从源码构建的 **Electron 壳**，壳里跑的是与 `dsh web` **同一套完整 Web 应用**；**没有独立的桌面客户端版本库**；当前线上版本 **0.2.0-rc.2**（2026-09-29 发布）——恰在本插件 peer 钉域内，桌面端适配**无需发版**，只需按 §6 的安装矢量装入 desktop profile 并实测。

## 2. 官方桌面端是什么（来源与构建）

- 源码唯一来源：[deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 仓 `apps/desktop`（包 `@deepseek-ai/dsh-desktop`，Electron ^44 + electron-builder ^26.15.3 + electron-updater；无任何 Tauri 痕迹）。`apps/desktop/README.md:7` 定位原话："The desktop application is an Electron shell around the complete dsh Web application"。
- 形态：Electron 主进程以 `ELECTRON_RUN_AS_NODE=1 --expose-internals` 把自身二进制当 Node 用，spawn 私有 host 子进程（`apps/desktop-host`，入口经同一 CLI profile runner `runProfile({ profile: 'desktop', args: ['--no-open','--port','19387'] })`，`apps/desktop-host/src/index.ts:23-42`）；host 在 `127.0.0.1:19387` 起完整 Web 应用；渲染进程经自定义协议 `dsh-app://app/`（`apps/desktop/src/ipc.ts:90`）加载打包进 app 的同一份 `apps/web/dist`（`apps/desktop/src/main.ts:669`）；浏览器侧 API/WebSocket 请求由主进程转发到本地 host（`apps/desktop/src/web-document.ts:77-93`，其中 `/plugins/` 响应改 `no-store`）。
- 桌面端不连任何远程 harness api；对外只连 DeepSeek Platform 账号/强更策略服务与更新下载源。
- 打包链（`apps/desktop/scripts/package-target.ts:450-480`）：本仓 `build:official` → `release:pack --family dsh` → pack `apps/desktop-host` → vendor/landlock → 捆绑运行时（锁定版 Node/Python/pnpm，首用时装入 `$DSH_HOME/dsh-runtimes/dsh-primary-runtime`，`apps/desktop/README.md:63`）→ electron-builder（macOS ZIP+DMG 双 lane 公证；Windows NSIS + EV 证书 SignTool）。目标硬编码 `mac-arm64 / mac-x64 / win-x64`，Linux 非发布目标。
- 版本号：桌面端版本 = dsh 发布家族共享版本（root/apps/desktop/apps/desktop-host/apps/web 同步 bump）；生产上传后在本仓打 `desktop-v<version>` tag（`apps/desktop/scripts/desktop-release-tag.ts:31-33`）。

## 3. 分发、版本与更新通道（feed 实测 2026-09-30）

- 固定下载入口（生产 origin `https://download.deepseek.com/`）：`desktop/dsh-latest-macos-arm64.dmg`、`desktop/dsh-latest-macos-x64.dmg`、`desktop/dsh-latest-windows-x64.exe`（实测 macOS-arm64 返回 HTTP 200，content-length ≈ 370MB）。
- electron-updater feed（更新检查用，mac 用 `nightly-mac.yml`、win 用 `nightly.yml`；404 时该域返回官方下载页 SPA HTML 软 404，勿当 YAML 解析）：

| target | feed | version | 产物 | size (B) | releaseDate |
|---|---|---|---|---|---|
| mac-arm64 | `dsh-desk/feeds/mac-arm64/nightly-mac.yml` | **0.2.0-rc.2** | `dsh-desk/bin/mac-arm64/deepseek-harness-0.2.0-rc.2-mac-arm64.zip` | 374,053,565 | 2026-09-29T10:18:12Z |
| mac-x64 | `dsh-desk/feeds/mac-x64/nightly-mac.yml` | **0.2.0-rc.2** | `dsh-desk/bin/mac-x64/deepseek-harness-0.2.0-rc.2-mac-x64.zip` | 390,853,725 | 2026-09-29T10:21:51Z |
| win-x64 | `dsh-desk/feeds/win-x64/nightly.yml` | **0.2.0-rc.2** | `dsh-desk/bin/win-x64/deepseek-harness-0.2.0-rc.2-win-x64.exe` | 289,313,640 | 2026-09-29T10:35:27Z |

（三 feed 均带 sha512；此处省略，自查命令见 §9 与 SOP。）
- 更新通道：固定 `channel: 'nightly'` + `allowPrerelease: true`（`apps/desktop/src/update-coordinator.ts:69-70`）；另有服务端强更策略（`mandatory-update-policy.ts`，字段含 `bundledDshVersion`）可强制用户升级。**含义：桌面端会自动升到更新的预发布版本，一次更新即替换捆绑运行时——插件 peer 域随即面临失配，这是桌面形态的固有迭代压力**（应对见 SOP 桌面更新链）。
- 签名/公证：macOS Developer ID（notarytool）+ forceCodeSigning；Windows EV 证书 + SignTool + RFC3161 时间戳（`apps/desktop/electron-builder.config.mjs` 与 `apps/desktop/.env.*.example`）。校验命令见 §9。

## 4. 与 `dsh web` 的架构对照

| 维度 | `dsh web`（CLI profile `web`） | 官方桌面端（reserved profile `desktop`） | dev 桌面（`pnpm run dev:desktop`） |
|---|---|---|---|
| 壳 | 浏览器 ↔ 本机 host | Electron 壳 + 私有 host 子进程 | Electron `Harness Dev.app` |
| 默认端口 | 3080（`--host 0.0.0.0` 被拒） | 19387（host 子进程绑定，可被 `webserver.config.port` patch 覆盖） | 19387；主进程调试 9229 / 渲染 9222 / host inspect 9230 |
| profile 目录 | `$DSH_HOME/profiles/web` | `$DSH_HOME/profiles/desktop`（CLI 禁止直接 boot；app 初始化为 web 模板 bundles） | 隔离 home `apps/desktop/.desktop-build/development/home`（不触 `~/.dsh`） |
| 前端来源 | host 服务出的 `apps/web` dist | 打包进 app 的同一份 dist，经 `dsh-app://` 协议 | 同左（dev 构建） |
| API/WS | 浏览器直连 host | Electron 主进程协议转发（附 cookie、剥连接层头、`/plugins/` no-store） | 同左 |
| 捆绑运行时 | 无（用宿主仓/npm 安装的 dsh） | 自带锁定版 Node/Python/pnpm，装入 `$DSH_HOME/dsh-runtimes/` | `preparePrimaryRuntime()` 下载锁定载荷 |
| 日志 | CLI/host 走 stderr | `app.getPath('logs')`（macOS `~/Library/Logs/DeepSeek Harness`）+ userData | 同左 + dev 控制台 |

## 5. `~/.dsh`（$DSH_HOME）共享边界

**结论：两形态复用同一个 home 根；数据层共享、组合层（设置与插件）按 profile 隔离。** 桌面端生产不设置/覆盖 `DSH_HOME`（`apps/desktop/src/paths.ts:17-22` 注释明言 "Harness home shared with npm-installed dsh"；`main.ts:320` 直接解析）；`~/.dsh` 已存在则**直接复用不迁移**，只补建 `profiles/desktop/` 三件套（`packages/boot/app-boot/src/profile.ts:239-243` "Existing files are never touched"）。注意：shell（`~/.zshrc`）里 export 的 `DSH_HOME` 只影响终端里的 `dsh web`，桌面端只保留 GUI 启动环境的 `DSH_*`（`apps/desktop/src/login-shell-environment.ts:96-103`）。

| 内容 | 位置 | 两形态 |
|---|---|---|
| 会话记录 sessions | `$DSH_HOME/sessions` | **共享**（web 建的会话桌面端可见，同根目录扫描；每会话 `session.lock` 内核写锁——同会话禁止双端同时写，争用报 `SessionAlreadyOwnedError`） |
| 凭据（API key / credential-ref） | `$DSH_HOME/.credentials.yaml` | **共享**（web 配好的 key 桌面端直接可用；跨进程文件锁保护） |
| storages（工作区注册表/schedule/projcache） | `$DSH_HOME/storages/<domain>` | **共享**（原子替换、last-write-wins；SQLite 默认 `:memory:` 不落盘） |
| skills | `$DSH_HOME/skills`（另扫 `~/.agents/skills`） | **共享** |
| 机器级 patch | `$DSH_HOME/cordis.patch.yml` | **共享且对含 desktop 在内每个 profile 生效**（组合顺序高于 per-profile 层） |
| 匿名 identity / attachments / cache / `.env` / 用户级 AGENTS.md | home 根 | **共享** |
| 桌面捆绑运行时 | `$DSH_HOME/dsh-runtimes/dsh-primary-runtime` | 桌面端**写入**共享 home |
| 用户设置（Settings 表单持久化） | `profiles/<name>/cordis.patch.yml` | **按 profile 隔离** |
| 插件安装（node_modules + manifest + patch） | `profiles/<name>/` | **按 profile 隔离**——web 装的插件对 desktop 不可见，须各自安装 |
| 桌面 UI 专属（快捷键等 Electron userData） | 系统 userData 目录 | 桌面独有 |

并发：web（3080）与桌面（19387）可同时运行；保护机制 = 桌面 Electron 单实例锁（`requestSingleInstanceLock`）+ `profiles/desktop/lock` 生命周期锁（PID 探活）+ 每会话内核写锁 + 凭据/settings/manifest 跨进程文件锁；无 home 级全局单例。桌面崩溃恢复只重置 desktop profile 的 bundles 并备份其 patch，不动 home patch（`apps/desktop/src/main.ts:97-101`）。

## 6. 插件在桌面端的安装矢量（关键守卫）

- 外部 CLI 直装**被硬拒**：`dsh plugin --profile desktop` 报 "profile desktop is managed exclusively by the Electron application"（`apps/cli/src/args.ts:83-87`，plugin 子命令在 `args.ts:195` 处再拒）。
- **唯一合法矢量 = 桌面 app 携带的 carrier `dsh` 命令**：`apps/desktop-host/src/cli.ts:18` 以 `manageDesktopProfile: true` 启动 CLI——即桌面 app 安装时注册的 `dsh` 命令载体（destination 记录在 `.dsh-desktop-command.json` receipt，可据此定位）。
- Web UI 的 Plugins 页（plugin-inventory）是 catalog/preset 驱动（搜索/预设/开关），**没有自由 spec 输入框**。
- **T5a 实测定谳（2026-09-30）**：`/usr/local/bin/dsh` 符号链接并非必需——**直接调用 app 内置 launcher 即可**：`'/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh'`（shell 脚本，`ELECTRON_RUN_AS_NODE=1` 以 app 二进制跑 `app.asar` 内 `dsh-desktop-host/lib/cli.js`）。实测：`--version` → `0.2.0-rc.2`；`plugin --profile desktop list` 放行（外部守卫树 CLI 同命令被拒 `profile "desktop" is managed exclusively by the Electron application`）；无子命令时提示 `plugin needs pnpm arguments to forward (e.g. add <package>)`。**桌面端插件安装矢量 = `<launcher> plugin --profile desktop add <pkg-spec>`**，零提权零 UI。`/usr/local/bin/dsh` 的 app 内对话框安装（osascript 管理员提权，`command-management.ts:138-170`）只是 PATH 便利件，非功能依赖。
- 装入 desktop profile 后插件对 web profile 无影响（§5 隔离），反之亦然。

## 7. 对 dsh-websearch 的适配判定（S40 时点）

- **peer 域：免发版**。官方桌面当前捆绑 runtime = 0.2.0-rc.2，本插件 peer 域已显式枚举 `0.2.0-rc.2`（`package.json` peerDependencies，S38 扩钉）——semver `satisfies` 实测见 §9/T5；桌面 feed 出现**新**版本时才触发扩钉发版流程（SOP 桌面更新链）。
- **client 半区**：web shell 以 `/plugins/<id>/client.js?rev=` 运行时路由分发客户端 bundle；桌面渲染进程跑同一 web 客户端栈（client 模块加载器只认 `platform === 'web'`，本包 `dsh.client.platform: "web"` 契合），`window.__ModuleLoader__.load` banner 与宿主 clientBundle 预设契约对齐；Electron 侧经协议转发且 `/plugins/` 响应 `no-store`——**换包后须整页刷新**的既有指引在桌面端同样成立。T5b/5c 实测确认。
- **host 半区（provider/DNS 层）**：跑在 host 子进程（纯 Node，`ELECTRON_RUN_AS_NODE` 模式），无浏览器 API 依赖；进程级 DNS 拦截层（`installDnsLayer`）按设计在 host 进程内生效——Electron 化不改变其运行面，T5e 只读观测确认。
- **凭据**：`.credentials.yaml` 共享（§5），桌面端无需重配 key；`credential-ref` 解析路径不变。

## 8. 官方版 vs 社区版（防混淆）

网上教程常混提两者：**官方版** = 本文的 Electron 桌面端（官方仓构建、官方签名、`download.deepseek.com` 分发、DeepSeek 账号体系、复用 `~/.dsh`）；**社区版 "DSH Desktop"**（文档站 dshtauri.mintlify.app，Gitee LangChat/deepseek-harness-desktop）= 第三方 Tauri 壳、自带运行时、**非 DeepSeek 官方产品**，与本文对象无代码关系。本插件只对官方版做适配承诺；社区版不在支持面。

## 9. 三形态安装与插件适配实测记录（随 S40 任务回填）

> 本节由 T2（官方安装包）/ T3（源码构建 dev）/ T5（桌面插件适配）实测回填：下载校验命令与输出摘要、`CFBundleShortVersionString` 对照、19387 监听证据、home 复用前后对照、carrier 命令 destination、三形态 × 五面（装入/注册/路由/UI/工具）矩阵结果。证据工件归档 `docs/sessions/audit-logs/`。

- [x] **T2 官方安装包（macOS arm64）— 全部 PASS（2026-09-30）**：
  - 下载：`desktop/dsh-latest-macos-arm64.dmg` HTTP 200，369,764,183 B（≈55MB/s，6.7s）；dmg sha512 `6b88f10d…37`（feed 内 sha512 属 ZIP 更新产物，与 dmg 天然不同，均各自留档）。
  - 签名/公证：`com.deepseek.dsh`，Developer ID Application: Hangzhou DeepSeek Artificial Intelligence Co., Ltd（Team `NAN929V4UM`），Timestamp 2026-09-29；`spctl -a -vv` → **accepted, source=Notarized Developer ID**；安装副本 `codesign --verify --deep --strict` valid。
  - 版本对照：`CFBundleShortVersionString` = `CFBundleVersion` = `0.2.0-rc.2`，与三平台 feed version 逐字一致。
  - 启动：主进程 pid 6403（`--expose-internals` 起 host），host 监听 `127.0.0.1:19387`，`curl /` → HTTP 401（与 web 同款 process-token 鉴权）；渲染进程经 `dsh-app://` 正常出 UI。
  - **home 复用实测**：首轮组合更新 `profiles/desktop/cordis.patch.yml`（217B→661B，引导状态 `completion: api-key`——**自动识别共享 `.credentials.yaml` 的 API key，免登录**）；`profiles/desktop/package.json`（bundles=web 模板，无插件）与 `pnpm-workspace.yaml` 内容未动（"Existing files are never touched" 实证）；`profiles/web` 时间戳全程未变（02:28/02:47）；home 顶层零新增；`dsh-runtimes` 未出现（office 载荷惰性安装，符合 README「on first use」）。
  - **并发实测**：生产 web 3080（pid 77804）与官方桌面 19387（pid 6403）同时监听在役，互不干扰——§5 并发结论实证。
  - carrier：`/usr/local/bin/dsh` 未自动安装（app 内对话框 + 管理员提权手动触发）；内置 launcher 直调可用（见 §6）。
  - 事故记录（已闭环）：执行者在只读 dmg 挂载卷上误跑 `--version`（Electron 忽略该 flag 直接启动 GUI），命令取消后 stdout 管道断裂 → 主进程 `write EPIPE` 崩溃弹窗；根因=管道断裂非安装缺陷；进程无残留；副作用=意外完成 `profiles/desktop` 骨架初始化（后续正式启动直接复用）。教训入 dont-do：Electron 二进制禁直跑取版本（读 Info.plist），启动一律 `open -a`。
- [x] **T3 源码构建 dev 桌面（macOS arm64 主 checkout）— PASS（2026-09-30，历经 5 关，全过程即 runbook）**：
  - 终态证据：运行时冒烟全过（`Office runtime versions and document round trips passed.`、`No broken requirements found.`、pnpm 11.7.0）；`DSH_HOME=<repo>/apps/desktop/.desktop-build/development/home`（隔离，生产 `~/.dsh` 时间戳全程未变）；inspectors main=9229/renderer=9222/host=9230；host 打印 `dsh web: http://127.0.0.1:19387/?token=…` 且 Electron LISTEN 19387；dev home 独立生成 profiles/desktop + sessions + storages。
  - **构建/启动五关（SOP 源码构建 runbook 素材，按序排障）**：
    1. 陈旧 `lib/` 产物致 tsdown RESOLVE_ERROR（`api-trust`/`claim-support` 子路径不在 exports）→ 先 `pnpm run clean`（清 334 路径）再 `pnpm run build` 即绿。
    2. `.pnpm/node_modules` 陈旧 hoisted 链接（旧布局包：dsh-acp-demo/dsh-examples 等 27+ 条，pnpm 不修剪、clean 也不覆盖）→ 按「symlink 且 target 缺失或无 package.json」精确清扫。
    3. `native/landlock-run/` 整目录为重构前未跟踪残渣（官方已迁 `native/system`，commit 336ebb235e；`git ls-files` 证实无跟踪文件）→ 删除后 landlock ENOENT 消失。干净克隆无此三关，属本机历史残渣。
    4. Electron 二进制下载静默挂死 → `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/` 立解（v44 约 128M 入 `~/Library/Caches/electron`）。
    5. `preparePrimaryRuntime()` 15 项资产（node 24.21.0 + cpython 3.12.14 standalone + 12 wheels）undici 裸 fetch 挂死且**不吃代理变量** → 先 curl 预热缓存：目标目录为 `apps/desktop/.desktop-build/downloads/`（**注意与根脚本默认 `/tmp/dsh-primary-runtime-downloads` 不同**），文件名=sha256，命中即跳网；国际腿间歇中断时按「nodejs.org→npmmirror / pypi→aliyun/tuna / github→代理链」变换 URL，sha256 强校验兜底字节一致性。
  - 进程管理教训：`nohup … &` 挂在已结束的前台工具调用下会随会话清理被 SIGTERM；dev 常驻须用受管后台任务或独立终端。
- [x] **T4 dsh web 3423 基线复核 — PASS（2026-09-30）**：生产同款 020rc2 守卫树（worktree `dsh-harness-020rc2`）+ 全新 scratch home `/tmp/dshws-s14a/home`（S39 已清场，本批重建）；`plugin --profile web add file:…dsh-websearch-0.2.0.tgz` 一次过（+6 包；manifest `dependencies` + `dsh.profile.bundles` 双登记）；`--port 3423 --no-open` 启动即监听（HTTP 401 鉴权同款）。UI 实测（浏览器自动化）：侧栏版本横幅 **`0.2.0-rc.2-9370b2f`**（守卫树 commit 实锤）；Settings 导航出现 **Web Search 节**（插件 client.js 完整渲染：链序说明卡、Tavily/Exa/Firecrawl/AnySearch 四成员卡〔未配置态〕、web_fetch 接管开关 ON、**DNS 韧性卡 DoH active + reserved-range 证据行**〔api.*.com → 198.18.0.x，本机 fake-ip 网络下自动启用，正是设计行为〕）；设置页脚 `Current version: 0.2.0-rc.2`。运行时路由佐证：S38 生产切换实录（真实搜索 served-by `dshws-anysearch ×5`，audit-log s38-prod-switch）+ 生产 3080 同树同插件在役。另：0.2.0-rc.2 官方 Preview Notice 原文即宣告「The new desktop app now targets a broad range of users」——桌面端官方定位佐证。
- [ ] T5 插件桌面适配：安装矢量（已定谳见 §6）/dev 与官方双端五面矩阵/并发冒烟/风险点实测（进行中）

## 10. 证据清单（harness 树 `fix/readonly-stack-020rc2`，2026-09-30 核对）

- 桌面壳与构建：`apps/desktop/package.json`、`apps/desktop/README.md:7,63,151`、`apps/desktop/electron-builder.config.mjs`、`apps/desktop/scripts/{electron-builder-config.mjs,package-target.ts,desktop-release-tag.ts,dev.ts:59-124}`、根 `package.json` scripts（`dev:desktop`/`start:desktop`/`package:desktop:*`）。
- host 与协议：`apps/desktop-host/src/index.ts:22-30,95-99`、`apps/desktop/src/{main.ts:320,399,669, ipc.ts:90, host-process.ts:188-206, web-document.ts:77-93, paths.ts:17-22, login-shell-environment.ts:96-103, single-instance.ts:16-26, update-coordinator.ts:69-70, mandatory-update-policy.ts, project-manager.ts:51-130}`。
- home 布局与共享：`packages/util/home-paths/src/index.ts:12,61-63,87-100`、`packages/boot/app-boot/src/profile.ts:169-176,239-243`、`apps/cli/src/profile-boot.ts:73-75,186-191`、`packages/bundle/base/cordis.patch.yml:105-197`（credentials/storages/sessions/skills/identity 各行）、`packages/session/session-persistence-jsonl/src/{format.ts:254-269,lease.ts}`、`packages/settings/settings/src/index.ts:224,241-258`、`packages/credentials/credentials-local/src/index.ts:61,90`、`packages/storage/storage-json/src/{per-record-unit.ts:51-57,atomic.ts:6-10}`、`packages/skill/skill-filesystem/src/index.ts:250-258`、`packages/workspace/workspace/src/spec.ts:76-84`。
- 插件安装守卫与矢量：`apps/cli/src/args.ts:83-87,195`、`apps/cli/src/plugin.ts:10-14,71-97`、`apps/desktop-host/src/cli.ts:18`、`packages/boot/plugin-manager/`、`packages/client/ui-settings-plugin-inventory/src/client/PluginInventorySettingsTab.tsx`。
- Web 端对照：`packages/bundle/web-app/cordis.patch.yml:169-175`（3080 fallback）、`packages/bundle/web-app/README.md:158`、`apps/cli/README.md`（desktop profile 保留）。
- 线上实测：三 feed YAML 与固定下载 URL（§3 表，2026-09-30 curl 亲测 HTTP 200/404）；新闻面（腾讯/新浪/开源中国对官方桌面端上线的报道）与社区版站（dshtauri.mintlify.app、Gitee LangChat/deepseek-harness-desktop）。
