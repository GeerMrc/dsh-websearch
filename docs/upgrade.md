# dsh-websearch 升级演练手册

> 目的：每次升级（插件自身版本或宿主 dsh 版本）后按本手册走一遍安装→配置→搜索→降级→GUI 冒烟，全部通过才可声明兼容（AGENTS.md seam 纪律引用的正本）。

## 1. 版本演进表

| 版本 | 性质 | 要点 |
|---|---|---|
| 0.1.0（内部编号） | 初始 | 链核心 + Tavily/Exa/Firecrawl/DeepSeek 四成员 + GUI 骨架 |
| 0.2.0 | **breaking** | 兜底重构（ADR-0014）：删免费 fetch 地板；`fallbackMember` 单字段；legacy `fallbackProvider` 归一只读 |
| 0.3.x | patch | anysearch 成员（ADR-0009）、多 key 池（ADR-0008→0011/0012）、溯源徽标（ADR-0010） |
| 0.4.0 | **breaking** | Perplexity 移除 + 存量归一（ADR-0017 前身；legacy `dshws-perplexity` 值归一 `auto`） |
| 0.5.x–0.6.x | patch | P1/P2/P3 参数对齐上游、统一语言/区域/域名入口（ADR-0015/0018）、fetch 链接管（ADR-0019——**用户可见行为变更非 breaking**：web_fetch 改由插件链服务） |
| 0.7.x–0.9.x | patch | UI/UX 对齐宿主 0.8.0、上游 0.1.5-rc.2 适配 |
| **v0.1.0**（定档） | 版本线重置 | ADR-0020：内部编号归历史档；正式线从 v0.1.0 起，补丁位细迭代 |
| **v0.1.1** | feature | 设置页成员卡展开态 APIKEY 计数徽标（`dshws-websearch` 自有 Typert remote；三项通路定谳见 CHANGELOG） |
| **v0.1.2** | 适配 | S32 上游全跨度批（ADR-0021）：peer 域显式覆盖 0.1.5-rc.1…0.1.7-alpha.2；devDeps 0.1.7-alpha.2 + cordis 4.0.4 + schemastery 3.18.4；settings 双径（volatile/旧 installSection 特性探测）；图标双名回退；typert strict codec `create` 化 |

## 2. 升级演练步骤（插件版本升级）

前置：node ≥ 22.19（nvm 切换，**一律绝对路径启动**）；升级目标 tarball（双名打包：`node scripts/pack.mjs`，见步骤 1）。

1. **打包**：`pnpm install && pnpm run build && node scripts/pack.mjs`——一次产出 scoped（npm 分发名）与裸名（profile 安装名）双 tarball 入 `dist-artifacts/`（裸名经临时翻转 package.json name、失败亦字节级还原；工艺细节见 S35 记录 T11 节）。
   - **上游对齐确认（必做）**：按 [upstream-alignment-checklist.md](upstream-alignment-checklist.md) 逐成员 × 逐面 happy + error 双路核对——涉及上游 API 适配的变更缺格不得发版（[dont-do 入册](dont-do.md#上游适配验证纪律session-35-t11-入册用户裁定升级为常备门槛)）。
2. **换包**：`dsh plugin --profile web remove dsh-websearch && dsh plugin --profile web add <新 tarball>`。同版本号会被跳过——预览场景须 bump 版本号再 pack。
3. **dump 对照**：`dsh --profile web --dump-config`——`searchProvider: dshws-chain` / `fetchProvider: dshws-fetch-gate` / insert 行三处落盘。
4. **浏览器 reload**：插件 client 走 `/plugins/*?rev=` 运行时路由，换包后必须整页刷新。
5. **凭据 gate**：设置页成员卡绿点 = credentials describe 就绪；配 key 后无需重启（热生效）。
6. **搜索一条**：会话里发起搜索，工具行 `[served-by: <成员id>]` 徽标亲见。
7. **降级验证**：关首位成员开关（或断其 key）再搜——链降级到下一成员，日志 `<dshHome>/logs/dsh-websearch.log` 有降级轨迹。
8. **GUI 冒烟**：排序拖动 / 折叠展开 / 兜底选择器 / web_fetch 两态开关各操作一次。

### 2.1 生产 3080 升级 runbook（v0.1.3 → v0.2.0；**候令执行**——用户明确指令原文留痕后才动）

前置：`dist-artifacts/dsh-websearch-0.2.0.tgz`（裸名已核）；目标树 = 017rc2（当前生产宿主，不动）。

1. **备份点**（先做，全部留 sha256）：
   - `~/.dsh/profiles/web/package.json` + `cordis.patch.yml` + `pnpm-lock.yaml`（插件行与模型/链序配置）
   - `~/.dsh/.credentials.yaml`（只备份不触碰内容）
   - 当前 tarball 引用行（file: 指向 0.1.3 的依赖串）抄录留痕
2. **换包**：profile `package.json` 依赖 `dsh-websearch` 行 `file:…dsh-websearch-0.1.3.tgz → …dsh-websearch-0.2.0.tgz` → profile 目录 `pnpm install --no-frozen-lockfile`（node 22 绝对路径）。
3. **重启 3080**（`dsh web` 进程重启；模型/凭据/会话数据不动）。
4. **验收冒烟清单**（全过才算成）：
   - 横幅/设置页「网页搜索」节出现，**DNS 韧性卡**在节底部（成员卡同构头部+四选择器）
   - 成员卡 key 计数徽标与升级前一致（凭据零丢失）
   - 链序与升级前一致（cordis.patch.yml 未被覆写）
   - 一条真实搜索 → 工具行 `[served-by: …]`；日志 `~/.dsh/logs/dsh-websearch.log` 出现 `[dshws-dns] decision` 行（金丝雀自动检测；本网络预期 enable/poisoned）
   - 一条 web_fetch（接管开）→ served-by 任一成员
   - **错误路径抽验**（对齐纪律）：fetch 一个不存在词条 → 日志成员失败行携带上游 detail（422「Unable to extract…」）后降级兜底
5. **回滚**（任一验收不过）：依赖行改回 0.1.3 tarball → `pnpm install` → 重启——分钟级一级回滚；备份目录数据级兜底。

## 3. 宿主 dsh 版本升级演练（peer 域变更时）

> 2026-09-16 实测记录：0.1.5-rc.2 → 0.1.6-alpha.1 升级审核结论=插件零适配（依赖缝零变更/纯加法，双独立审核——**其 semver 覆盖断言系误判，见 CHANGELOG S30 勘误**）。实操两步：① 新 worktree `git worktree add <dir> dsh-v0.1.6-alpha.1 && pnpm install && pnpm run build`（**必须 build**，否则 profile symlink 解析不到 `lib/`，报 `typert.host.js` 缺失）；② 重启 web 进程（profile 链接自动 healing 指向新树）。3423 与 3080 均按此流程完成切换验证（横幅/徽标计数/接管开关全过）。回滚=进程切回旧 worktree 重启。
>
> 2026-09-23 S32 全跨度实测（v0.1.2，ADR-0021）：peer 域 `>=0.1.5-rc.1 <0.1.8 || 0.1.6-alpha.1 || 0.1.6-alpha.2 || 0.1.7-alpha.1 || 0.1.7-alpha.2`（semver 预发布排除规则下显式钉每个已演练预发布版；上游每发新预发布逐钉扩展）。**三线演练矩阵**（3434 端口 + 分线 scratch home `/tmp/dshws-s32/home-<线名>`）：
> | 线 | worktree | 破坏面（Note s32 矩阵） | 适配 |
> |---|---|---|---|
> | 0.1.5-rc.3 | dsh-harness-015rc3 | 零（12 seam src diff 全空） | 无 |
> | 0.1.6-alpha.2 | dsh-harness-016a2 | strict codec 字段更名 + ui-primitives 传递依赖；**宿主工具调度缺陷：任意工具调用崩 `TOOL_RUNTIME_SCHEDULER.prepare`（headless 与会话路径皆中，无插件净环境复现）——工具腿无法演练，语义由 0.1.5/0.1.7 线覆盖**（证据 docs/sessions/audit-logs/2026-09-23-s32-t6-drill-evidence/016a2-*.log）| T4-1/清单；工具腿 BLOCKED-by-upstream |
> | 0.1.7-alpha.2 | dsh-harness-017a2（现 fix/readonly-stack-rewrite=+fork 修复，生产在役） | settings 模型重写 + 图标改名 + codec | ADR-0021 双径/T4-3 |
> | 0.1.7-rc.1/rc.2 | dsh-harness-017rc2（fix/readonly-stack-rc2=rc.2+fork 收编，S33 T2b） | **零源码适配**（9 核心 seam 三版逐字节同；+code-language 补偿 devDep；peer 预检新语义）；rc.1 同线连续性（git 级 rc.1⊂rc.2 确认） | v0.1.3 manifest 三处+一补 |
>
> **已知 unmet-peer 告警（S32 起跨线常态）**：插件 runtime dep `dsh-typert-protocol`（v0.1.3 起=0.1.7-rc.2）的 peer 钉 `cordis ~4.0.4`，而 0.1.5/0.1.6 宿主 vendored cordis 4.0.2——profile 安装时 pnpm 打 `[WARN] Issues with peer dependencies`。告警级非错误：插件消费的 cordis/typert 面三线兼容（T2 矩阵 seam 8/10 + 3434 三线演练 + 生产 3080 实证）。
> **产物耐久性**：`dist-artifacts/`（gitignored）是生产 profile 的依赖指向；仓库目录被移动/清理/重 clone 后生产重装会断——再取路径 = 仓库内 `pnpm install && pnpm run build && npm pack --pack-destination dist-artifacts` 或 GitHub release 页。
> **pnpm 11.7 处方（新预发布 24h 窗口内）**：默认 `minimumReleaseAge`=24h 会在安装时命中新发布包——install 会自动把命中项追加进 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude`，但依赖变更后的 lockfile 增量校验仍会拦；**任何 package.json 依赖变更后走 `pnpm clean --lockfile && pnpm install`** 重建。verify-deps 运行前检查在该窗口内不读 exclude（已 `verifyDepsBeforeRun: false` 关闭，显式安装时的年龄门仍生效）。

以 0.1.5 采纳为例（S24/S25 实战，Note s24 是详细正本）：

1. **独立 worktree**：主树 checkout/merge = 生产即时换版本（symlink healing），升级一律走独立 worktree（如 `dsh-harness-015`）。
2. **peer 域刷新**：package.json peer 六条 + devDep 对齐目标版本；`pnpm install`。
3. **兼容排查清单**（Note s25 八项）：seam 接口 / credentials / settings / client 面 / primitives 传递依赖 / manifest（`dsh.bundle.patch` 嵌套形态）/ patch 钉扎 / 面板重做影响——逐项实测。
4. **门墙全量**：`pnpm run typecheck && pnpm run lint && pnpm run test && pnpm run build`。
5. **3423 冒烟**（dev 实例）：换包 → dump 对照 → 浏览器亲验（§2 步骤 3-8）。
6. **生产切换**：仅用户明确指令后进行（~/.dsh 同步 + 3080 验证——见 STATUS 接力口径）。

## 4. 漂移防线（升级后必查）

- **patch 钉扎**：`searchProvider: dshws-chain` + `fetchProvider: dshws-fetch-gate` 两行随包 patch 在位（ADR-0013 漂移防线——宿主 base 升级可能改写钉死行）。
- **id 撞名**：`dshws-*` 前缀与上游/第三方新注册 id 零冲突（升级后跑一轮全量测试的注册断言）。
- **seam 形状**：`WebSearchProvider`/`WebFetchProvider` 三方法 + 注册 API 未变（typecheck 即证）。
- **溯源替身卡片**（ADR-0010 维护点）：宿主 toolview 结构变化时同步替身卡片渲染。

## 6. 发布链失败恢复（tag v* 自动发布的中断续作）

自动链：`push tag v*` → CI `Release`（build → pack 双名 → gh release create 附双 tarball → npm publish scoped 到 registry.npmjs.org）。中断点与续作：

| 中断态 | 现象 | 续作 |
|---|---|---|
| build/pack 失败 | run 红在发布前 | 修复后**重推同 tag**（删本地 tag 重打或 `git tag -f`+push -f）；零半发布态 |
| `gh release create` 失败（网络/瞬时） | Release 页无条目 | 重跑该 run（Actions 页 Re-run）——release 未创建则幂等重试成立 |
| Release 已建但 npm publish 失败 | Release 页有 v0.2.0 条目、`npm view` 无该版 | 二选一：**a)** Re-run 整 job 前先 `gh release delete v0.2.0 --yes`（release create 非幂等，会死于 "already exists"）；**b)** 手工补发：`npm publish dist-artifacts/maricgeer-dsh-websearch-<ver>.tgz --registry https://registry.npmjs.org --access public`（**必须显式 --registry**——本机默认 registry 为 npmmirror，裸 `npm publish` 会误发镜像） |
| npm publish 成功但需重发（内容修复） | 同版本 npm 拒绝（防覆写保护） | bump 版本（0.2.1）+ 重打 tag 走全链；**禁止 force 覆写已发布版** |

## 5. 回退

- 插件回退 = remove 新包 + add 旧 tarball（配置 settings 节向后兼容：未知新字段被 schema 透传，无报错）。
- 宿主回退 = 切回原 worktree/分支重启实例；用户配置无需动。
