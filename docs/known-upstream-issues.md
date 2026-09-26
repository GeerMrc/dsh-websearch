# 已知上游 DSH 问题登记表（Known Upstream Issues）

> **给谁看**：使用 dsh-websearch 插件（或任何 DSH 插件）的用户。上游宿主 `dsh`（[deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)）的已知问题在这里登记——**这些不是本插件的 bug**，但会让插件（乃至整个宿主）表现异常。每条按「现象 → 影响版本 → 根因 → 怎么办 → 怎么自查」组织，照做即可；技术沿革折叠在每条末尾供进阶读者。
>
> **维护规则**：上游每发新版本，我们按 [docs/upgrade.md](upgrade.md) 的演练矩阵逐线实测后更新本表（登记与销项都以实测为准，不凭发布说明推断）。最近全面核对：2026-09-26（0.1.7-rc.2 线）。

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
| 0.1.5-rc.x / 0.1.6-alpha.1 | 未观察到此问题（该机制面较新） |

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

- **插件侧已处理**：本插件的 peer 域**逐个显式钉住每个已演练的预发布版**（`|| 0.1.6-alpha.1 || … || 0.1.7-rc.2`），安装器与运行时两层都能过——这是有意为之的设计，不是版本串写乱了。
- **其他插件作者**：如果你的插件也要跨预发布宿主版本，照同样方式逐钉；每钉一个新版本前先按 [docs/upgrade.md](upgrade.md) 演练。
- **安装时仍见 cordis unmet-peer 警告**（`dsh-typert-protocol … requires cordis ~4.0.4`）：告警级非错误，三线+生产实测无害，详见 [upgrade.md](upgrade.md) 的「已知 unmet-peer 告警」节。

---

## 登记与销项规则

- 新问题入表四要素：**现象（日志原文）/ 影响版本（实测矩阵）/ 根因 / 规避或修复与自查命令**——缺一不登。
- 销项（标记已修复）必须附上游版本号 + 我们的复测记录指针，不以发布说明为准。
- 相关正本：[upgrade.md](upgrade.md)（升级演练矩阵）、[S32](notes/2026-09-23-s32-upstream-diff-matrix.md)/[S33](notes/2026-09-26-s33-rc-matrix.md) 兼容矩阵 Note、[发布页](https://github.com/GeerMrc/dsh-websearch/releases)（各版本 tarball 与验证记录）。
