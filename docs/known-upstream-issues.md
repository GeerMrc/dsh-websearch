# 已知上游 DSH 问题登记表（Known Upstream Issues）

> **给谁看**：使用 dsh-websearch 插件（或任何 DSH 插件）的用户。上游宿主 `dsh`（[deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)）的已知问题在这里登记——**这些不是本插件的 bug**，但会让插件（乃至整个宿主）表现异常。每条按「现象 → 影响版本 → 根因 → 怎么办 → 怎么自查」组织，照做即可；技术沿革折叠在每条末尾供进阶读者。
>
> **维护规则**：上游每发新版本，我们按 [docs/upgrade.md](upgrade.md) 的演练矩阵逐线实测后更新本表（登记与销项都以实测为准，不凭发布说明推断）。上游现势最近核对：2026-11-24（S41 阶段 0 独立审核：npm `next`=0.2.2-rc.5、`alpha`=0.2.3-alpha.2；upstream master 即 `dsh-v0.2.3-alpha.2`；官方桌面 feed 三平台版本见 [desktop-adoption §3](desktop-adoption.md)）。逐问题最近全面核对：2026-09-30（0.2.0-rc.2 线，S38 适配批）；上一次 2026-09-26（0.1.7-rc.2 线）。问题 ①⑤⑥ 另有 2026-11-24 的 0.2.2-rc.5 核对（S41，各条写明是实测还是读源码）。

---

## 问题 ① 宿主启动期「插件元数据 TypeError」（readonly-stack，**部分版本未修复**）

### 现象（你在日志里会看到什么）

宿主服务端日志（不是插件日志）出现成串的：

```
Plugin metadata for <某个插件包名>: TypeError: Cannot assign to read only property 'stack'
```

后果：本应被静默跳过的「无元数据插件」被当成加载失败报错，错误分类被破坏；严重时插件加载/缺位判定整体失真。

### 影响版本

| 宿主版本 | 状态 |
|---|---|
| 0.1.7-alpha.2 / 0.1.7-rc.1 | ❌ 两处代码路径全裸（都会踩） |
| **0.1.7-rc.2** | ⚠️ **半修复**：ESM importer 路径官方已修；`MODULE_NOT_FOUND` 的 CJS require-stack 路径**仍未修** |
| **0.2.0-rc.1 / 0.2.0-rc.2** | ⚠️ **同半修复状态延续**（2026-09-30 S38 实测核对：ESM 站点已修、CJS 站点仍裸）。fork 守卫已移植：分支 `fix/readonly-stack-020rc2` = `dsh-v0.2.0-rc.2` + ebd42731c9 cherry-pick（=9370b2f7f9），S38 3434 演练 + 3423 七腿矩阵全程在该树在役零复发。**S40 2026-09-30 复查**：`git fetch upstream` 后 upstream/master 仍停在 `639ed01539`（0.2.0-rc.2 发布合并，无后续提交），全史 `--grep` 无官方等价修复——守卫继续必要（仅 fork 源码树/tsx 启动形态需要；官方桌面端跑打包产物，按本条触发条件不受影响——桌面端插件适配实测全过，见 [desktop-adoption.md](desktop-adoption.md)） |
| **0.2.2-rc.5** | ⚠️ **半修复状态延续**（2026-11-24 S41 读 tag `dsh-v0.2.2-rc.5` 的源码：ESM 站点经 `replaceErrorMessage` 有守卫；CJS 站点 `packages/boot/app-boot/src/profile-resolution/resolver.ts:819` 仍是裸赋值 `error.stack = …`）。**未在 rc.5 的源码启动形态下实跑**；fork 守卫也还没有重放到这条线。用桌面 app 内置命令（打包产物）启动的 rc.5 实例日志里，该症状出现 0 次，符合下文的触发条件 |
| 0.1.5-rc.x | ✅ 不受影响——该解析器改写机制在这些版本尚不存在（树中无 `profile-resolution/` 模块） |
| 0.1.6-alpha.1 | ✅ 机制在（两处裸赋值），但未观察到触发——实测证据见 [S33 演练](sessions/audit-logs/2026-09-26-s33-t6-drill.md)（该线冒烟零症状，生产曾长期在役） |

**触发条件（重要）**：只在 **tsx 源码方式启动宿主**（`node --import tsx/esm apps/cli/src/bin.ts ...`）时出现——npm 正式安装、跑构建产物（`lib/`）的用户**不受影响**。

### 根因（一段话）

Node 22 的 `module.register` 工作线程会把跨线程序列化重建的 Error 的 `stack` 属性变成**只读**属性；DSH 的 profile 解析器在改写错误消息时会顺手改写 `error.stack`，在只读 stack 上这一赋值直接抛 `TypeError`，把真正的原始错误（`ERR_PACKAGE_PATH_NOT_EXPORTED`）顶掉，于是「缺元数据」被误报成「加载崩溃」。

### 怎么办（三选一）

1. **最省事**：确认你的启动方式——如果你跑的是 npm 安装/构建产物，什么都不用做（不触发）。
2. **源码启动用户**：换用我们 fork 的修复分支宿主树（见下方命令，已含**两处路径的全量守卫**并通过 235 项回归测试）；
3. 等上游官方补齐 CJS 路径修复（rc.2 已修一半，可关注后续版本）。

**使用 fork 修复分支的三行命令**（需要 git + pnpm + node ≥22.19）：

```sh
git clone -b fix/readonly-stack-rc2 https://github.com/GeerMrc/deepseek-harness.git dsh-fixed && cd dsh-fixed
pnpm install && pnpm run build          # 必须构建，否则 profile 链接缺 lib 产物
DSH_HOME=<你的 dsh 家目录> node --import tsx/esm apps/cli/src/bin.ts web --port <端口> --no-open
```

分支说明：`fix/readonly-stack-rc2` = 官方 `dsh-v0.1.7-rc.2` tag + 一个守卫提交，生产环境验证在役中。

### 怎么自查（直接复制）

```sh
# 服务端日志里搜症状（按你的启动方式替换日志文件；nohup 重定向的那个）
grep -m3 "Cannot assign to read only property 'stack'" <宿主服务日志文件>
# 无输出 = 未触发；有输出 = 命中本问题
```

### 修复沿革（进阶阅读）

<details>
<summary>展开：从发现到收编的完整链（含提交号）</summary>

- **2026-09-24 发现并修复（fork 首版）**：提交 `03bffa9454`（分支 `fix/readonly-stack-rewrite`，基于 0.1.7-alpha.2）——以 try/catch 助手 `alignStackWithMessage` 守卫**两处**改写点，附带单测与 [Agent Note](https://github.com/GeerMrc/deepseek-harness/blob/fix/readonly-stack-rc2/.agents/notes/implemented/bug-fix/2026-09-24-readonly-stack-rewrite-guard.md)（含完整根因分析）。
- **上游 rc.2 半修**：官方在新助手 `replaceErrorMessage`（`Reflect.set` 失败则 `Object.defineProperty` 兜底）中修了 **ESM importer 路径**——但 `throwWithoutCjsAnchor`（CJS require-stack 路径）仍是裸赋值（dsh-app-boot@0.1.7-rc.2 `lib/index.js` 中 `replaceErrorMessage` 仅被 importer 站点调用）。
- **2026-09-26 收编到 rc.2**：提交 `ebd42731c9`（分支 `fix/readonly-stack-rc2`）——保留上游 `replaceErrorMessage` 机制，把 fork 守卫以同一助手移植到 CJS 站点，两站点全覆盖、机制统一；回归 **235/235 通过**，生产 3080 在役实证。
- **可向上游提 PR**：CJS 站点的守卫补丁很小（约 6 行），欢迎任何人向官方仓提交——fork 分支即现成参考。
- 证据链：[S33 兼容矩阵 Q1](notes/2026-09-26-s33-rc-matrix.md)（版本影响表与行号）、[S33 演练记录](sessions/audit-logs/2026-09-26-s33-t6-drill.md)（readonly-stack 回归零复发）。

</details>

---

## 问题 ② 0.1.6-alpha.2 宿主「任何工具调用都崩溃」（该死线独有）

### 现象

任意工具调用（shell、web_search、任何工具）直接失败，报：

```
dsh: UNKNOWN: Cannot read properties of undefined (reading 'prepare')
```

### 影响版本

**仅 0.1.6-alpha.2**。已用「无插件的干净环境」复现证实是宿主自身缺陷（agent-loop 的 `TOOL_RUNTIME_SCHEDULER.prepare` 调度路径）；0.1.5-rc.x / 0.1.6-alpha.1 / 0.1.7 全线正常（该代码三版本逐字相同，唯独此线中招）。

### 怎么办

**避开 0.1.6-alpha.2**：用 0.1.5-rc.3（next 稳定线）、0.1.6-alpha.1 或 0.1.7-alpha.2+（含 rc 线）。该版本已被后续线取代，等不到也不需要官方修复。

### 怎么自查

```sh
# 任发一条会调工具的消息，失败信息含 'reading .prepare.' 即命中
```

证据链：[S32 演练记录](sessions/audit-logs/2026-09-23-s32-t6-3434-drill.md)（净环境对照四件套：插件环境失败/无插件净环境同样失败/纯文本正常/邻线全部正常）。

---

## 问题 ③（易踩坑，非 bug）预发布版本装不上？—— peer 预检的 semver 语义

### 现象

在宿主版本是 `0.1.7-rc.x` 这类**预发布版**时安装插件，npm/pnpm 安装器可能报 peer 依赖不满足（`ERR_PNPM/ERESOLVE` 类错误），但宿主运行时其实完全兼容。

### 根因

npm 系安装器默认的 semver 规则**不认「跨版本号的预发布版**」（`0.1.7-rc.2` 不满足 `<0.1.8` 这种范围）；而 0.1.7-rc 起宿主自带的插件兼容预检用的是 `includePrerelease` 语义（运行时放行）。两层判定不一致，就出现「装不上但能跑」。

### 怎么办

- **插件侧已处理**：本插件的 peer 域**逐个显式钉住每个已演练的预发布版**（`|| 0.1.6-alpha.1 || … || 0.2.2-rc.5`，以 `package.json` 为准），安装器与运行时两层都能过——这是有意为之的设计，不是版本串写乱了。钉到 `0.2.2-rc.5` 的改动随 v0.2.0 之后的下一个版本发布；该版本目前只做完了装入与接管开关的实测，搜索与抓取的功能腿待做，所以这枚钉是暂定的。
- **其他插件作者**：如果你的插件也要跨预发布宿主版本，照同样方式逐钉；每钉一个新版本前先按 [docs/upgrade.md](upgrade.md) 演练。
- **安装时仍见 cordis unmet-peer 警告**（`dsh-typert-protocol … requires cordis ~4.0.4`）：告警级非错误，三线+生产实测无害，详见 [upgrade.md](upgrade.md) 的「已知 unmet-peer 告警」节。

---

## 登记与销项规则

- 新问题入表四要素：**现象（日志原文）/ 影响版本（实测矩阵）/ 根因 / 规避或修复与自查命令**——缺一不登。
- 销项（标记已修复）必须附上游版本号 + 我们的复测记录指针，不以发布说明为准。
- 相关正本：[upgrade.md](upgrade.md)（升级演练矩阵）、[S32](notes/2026-09-23-s32-upstream-diff-matrix.md)/[S33](notes/2026-09-26-s33-rc-matrix.md) 兼容矩阵 Note、[发布页](https://github.com/GeerMrc/dsh-websearch/releases)（各版本 tarball 与验证记录）。

---

## 问题 ④（易踩坑，非 bug）Node 大版本升级后 DNS 韧性层拦截可能失效——undici 代际行为漂移（S35 T6 登记）

### 现象

插件启用后本应被 DoH 接管的域名解析重新走系统 DNS（chain-log `[dshws-dns]` 行消失、Inspect 解析 trace 无记录），无任何报错。

### 影响版本（实测矩阵）

v20.18.3 / v22.23.2 双版本实测：undici（global fetch）按调用时属性访问 `dns.lookup`（`{hints:1024, all:true}` 形态），晚期 patch 有效（S35 T0 spike，`docs/sessions/audit-logs/2026-09-27-s35-t0-spike/`）。其余版本未测。

### 根因

Node 内置 undici 属代际漂移面：其 hostname 解析入口（自行调用 `dns.lookup` vs 经 net.js 模块级捕获回退）随版本变动；若未来代际改为加载期捕获引用，`dns.lookup` 晚期 patch 将不再触达 fetch。

### 怎么办 / 自查

升级 node 大版本后跑一次拦截回归：`pnpm exec vitest run tests/dns/intercept.test.ts`（含「patched module answer drives a real global fetch」端到端锁，红即失效）；失效则按 ADR-0022 备选否决记录改走 undici Agent 方案并修订 ADR。

---

## 问题 ⑤（易踩坑，非 bug）0.2.2-rc.5 起官方「网页搜索与获取」设置卡不再随 `web-search-deepseek` 一同隐藏（S41 登记）

### 现象
插件页的「内置插件配置」里同时有官方的「网页搜索与获取」和 dsh-websearch 两张卡。在官方卡里把提供方存成 `dshws-*` 之后关闭插件，
官方卡显示 `dshws-<成员>（未加载）`；按源码，此后 `web_search` 每次调用报 `WEB_PROVIDER_CONFIGURED_MISSING`，不会自动回退到官方提供方
（这一句本轮未实跑搜索）。

### 影响版本（实测矩阵）
| 宿主版本 | 状态 |
|---|---|
| 0.2.0-rc.2 | ✅ 官方卡随 `web-search-deepseek` 行被禁用而消失（ADR-0013 决策 7 的依据；本轮未复测） |
| **0.2.2-rc.5** | ❌ 两卡并存。依据是 rc.5 该卡改为依赖 `web` 命名空间的源码，以及用户报告的 rc.5 桌面端插件页现象；本轮没有留快照。同版本实测到的是：用户层的 `dshws-*` 钉值在关闭插件后原样残留（2026-11-24 S41，桌面 app 内置命令 0.2.2-rc.5 + 临时 `DSH_HOME`） |
| 0.2.3-alpha.2 及以后 | ❔ 未核对 |

### 根因
rc.5 的这张卡改为依赖 `web` 命名空间（`packages/client/ui-settings-web-search/src/client/index.ts:43,72`），而 `web` 行必须保持启用，
所以只禁用 `web-search-deepseek` 管不到它。钉值残留是因为用户层优先于随包层，关闭 bundle 只移除随包层。

### 怎么办
- 换用带 ADR-0024 接管行的插件版本（v0.2.0 没有）：它随包禁用官方设置页所在的行 `ui-settings-web-search`，插件启用期间列表里没有官方卡。
- 已经残留的钉值：打开该 profile 的 `cordis.patch.yml`，把 `web` 行下的 `searchProvider` 与 `fetchProvider` 两个键一起删掉，再重启宿主。
  只删一个会留下半截覆盖。
- `ui-settings-web-search` 行自 0.1.7-alpha.1 起存在。0.1.5、0.1.6 线的宿主会对这条 patch 打一条未命中的 loader 告警后跳过
  （按源码推断，未在旧宿主上实测）。

### 怎么自查
```sh
dsh --profile <profile> --dump-config | grep -n -A2 '^- id: ui-settings-web-search'
# 第三行是 disabled: true = 插件的接管在生效；这一行不存在或没有 disabled = 官方页可见
```

---

## 问题 ⑥（插件作者向，非 bug）启用 HMR 的宿主上，bundle 被关闭后插件自己基本没有执行通道（S41 登记）

### 现象
在插件页关闭一个 bundle 时，插件宿主侧由 `ctx.effect` 注册的 teardown 会运行，但其中经 `settings.mutate` 写配置被拒，宿主日志出现
`HMR transactions cannot be nested`；由 `ctx.on('dispose')` 注册的处理器不运行；插件的客户端代码多数在收到 `plugin-manager/changed`
之前已被退订，少数存活并收到事件（S41 阶段 5：13 次里 2 次）。设计成「关闭时由插件自己清理」的逻辑因此不可靠。

### 影响版本（实测矩阵）
| 宿主形态 | 结果 |
|---|---|
| 0.2.2-rc.5，web profile（HMR 启用） | 宿主侧如上。客户端守卫：13 次插件页关闭里 11 次在事件送达前被退订，2 次存活并收到事件，其中 1 次交还写入被接受（2026-11-24 S41）。判别条件未定位 |
| 0.2.2-rc.5 桌面端 | ❔ 未实测。rc.5 的基础 patch 只在 headless、sdk、acp 三个 bundle 里禁用 `hmr` 行，而桌面端的插件页与设置保存都可用，据此判断桌面端同样启用 HMR |
| 同一实例人为禁用 `hmr` 行 | 设置保存失败，不代表任何真实宿主 |

### 根因
rc.5 把 `hmr`、`plugin-manager`、`config-editor`、`settings` 四行钉在同一个条件上（`!ctx.get('profileContext')`）。插件页开关运行在
`hmr.runExclusive` 的事务里；配置编辑器的 `edit()` 在有 hmr 服务时同样经 `runExclusive`，而它拒绝嵌套事务
（`packages/boot/hmr/src/index.ts:269`）。命令行卸载与手改则不转发 `plugin-manager/changed`。

### 怎么办
不把「关闭时的清理」设计成插件自己的职责。需要随开关对称生效的宿主配置放进随包的 `cordis.patch.yml`：层在则生效，层去则自动失效。
需要清除的用户层值在插件启用期间处理，或在用户文档里写明手动清理方法。

---

## 问题 ⑦（易踩坑，非 bug）0.2.2-rc.5 上与换包、组件开关有关的三件事（S41 阶段 5 实测登记）

- **同名同版本的包经命令行换装后，运行中的实例仍沿用旧包的随包层。** 现象：`plugin add` 之后 `--dump-config` 显示的是新包，
  插件页却还是旧行为（例如官方卡该隐藏没隐藏）。怎么办：在插件页把该插件关一次再开；详情文档另需刷新一次页面。
  同版本号换装在升级时很常见，验收前先做这一步。
- **插件详情页的「启用组件」开关只停用插件本体。** 它往用户层写 `- id: <插件> / disabled: true`，插件随包层的配置原样保留。
  以本插件为例：停用后官方「网页搜索与获取」页仍被隐藏，设置里没有「网页搜索」一节，插件列表却仍显示已启用；
  列表里的开关关了再开也不复位。恢复办法是回详情页把该开关打开。
- **profile 里留有某插件的设置行时，关闭或卸载该插件后 `--dump-config` 的 stderr 多一行
  `patch: entry "<插件>" not found`。** 退出码仍是 0，重新启用后消失，可以忽略。
