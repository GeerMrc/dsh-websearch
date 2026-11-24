# DSH 上游同步 SOP（upstream-sync-sop）

> **给谁看**：负责"插件随 DSH 官方上游（npm 线 + 官方桌面端）持续迭代"的维护者。本文是**流程单一正本**：上游监测 → 新版本决策 → fork 守卫重放 → 双端验证 → 插件发版 → 生产切换 → 治理落盘的完整闭环。事实与版本表不放这里（各有正本）：桌面端全貌与实测记录 → [desktop-adoption.md](desktop-adoption.md)；已知上游问题 → [known-upstream-issues.md](known-upstream-issues.md)；升级演练矩阵 → [upgrade.md](upgrade.md)；宪法级强制流程 → [AGENTS.md](../AGENTS.md)。
>
> **建立**：2026-09-30（S40，随 ADR-0023 立制；首轮全循环即本 session 实跑）。

---

## 0. 循环总览

```
① 上游监测（三线，每会话开始/每周）
      ↓ 有新版本（npm 或桌面 feed 或 upstream master/tag）
② 版本决策：按 §2 用两种 semver 语义判定（默认语义为真＝已演练并显式钉在域内 → 免发版；只有宿主门语义为真＝未演练但宿主会放行 → 先走适配流程；都为假＝域外）
      ↓ 否（新预发布/新稳定线）
③ peer 扩钉 + 对齐矩阵 + 双端演练（3434 / dev 桌面 / 官方桌面）
      ↓
④ 插件发版（AGENTS.md 立宪门：npm view + satisfies + UA 钉 + 矩阵全绿 → v* tag = 发布确认点）
      ↓
⑤ 生产切换（3080 红线流程：备份 → 演练 → 用户裁定切换 → 官方桌面 19387 同 tarball 重装）
      ↓
⑥ fork 守卫重放（仅当官方未修已登记问题）：新版本 worktree + cherry-pick + 重建 + 3434 验证
      ↓
⑦ 治理落盘（收尾六件套，见 §7：交付物 / session 记录 / progress+STATUS / 踩坑沉淀 / CHANGELOG / 接力指令）
```

## 1. 上游监测三线（快查命令块）

```sh
# 线1 git（harness fork 仓）：新提交/新 tag（dsh-v* / desktop-v*）
git fetch upstream --tags && git log upstream/master --oneline -3 && git tag --sort=-creatordate | head -5

# 线2 npm：宿主六包 + cordis 版本面与 dist-tag（禁只看 latest；预发布只挂 next/alpha）
npm view @deepseek-ai/dsh-web versions dist-tags --json | tail -12

# 线3 官方桌面 feed：三平台（mac 用 nightly-mac.yml、win 用 nightly.yml；404 会返回官方下载页 HTML 软 404，勿当 YAML 解析）
curl -s https://download.deepseek.com/dsh-desk/feeds/mac-arm64/nightly-mac.yml | head -3
curl -s https://download.deepseek.com/dsh-desk/feeds/win-x64/nightly.yml | head -3

# 辅线：桌面 host 协议版本（fork 守卫重放之外的第二条失配线）——读 upstream 远端内容，不读本地钉死的检出文件
git -C /Volumes/IPFSJK/Zcode/deepseek-harness show upstream/master:apps/desktop/src/host-protocol.ts | grep DESKTOP_HOST_PROTOCOL_VERSION
```

判定口径：**桌面 feed version ≈ dsh 家族版本 ≈ 捆绑 runtime 版本**（三平台可以不同版：2026-11-24 实测 mac-arm64 与 win-x64 为 0.2.3-alpha.2、mac-x64 为 0.2.1-rc.4；版本映射表正本在 desktop-adoption §3，随 feed 变化回填）。

## 2. 新版本决策树

对每个新版本号 `V`，先用真实 semver 实测**两种语义**（禁目测——dont-do semver 条目；依据见 [ADR-0027](decisions/adr-0027-compat-gate-semantics-and-explicit-pins.md)）：

1. 默认语义 `satisfies(V, 域)` 为真 → `V` 已演练并显式钉在域内：**免发版**，跑 §3 演练 + §4 双端验证，记录即可。
2. 默认语义为假、宿主门语义 `satisfies(V, 域, { includePrerelease: true })` 为真 → `V` **尚未演练，但宿主会放行**（0.2.x 预发布都属于这一类）：走 AGENTS.md「上游适配强制流程」——`npm view` 全列表 + 目标版本实例上的功能演练 + devDeps 换树 + `USER_AGENT` 版本钉（tests/user-agent.test.ts 防漂）+ [upstream-alignment-checklist.md](upstream-alignment-checklist.md) 全绿 → 显式扩钉 peer 域 → §4 发版。
3. 两种语义都为假 → 域外，宿主会拒绝安装：按第 2 步演练后扩钉。
4. 任一步失败 → 不 tag、不发布、撤销该版本的显式钉、登记 KUI。

## 3. fork 守卫重放 runbook（已登记官方未修问题，见 KUI）

```sh
# 以 readonly-stack 守卫为例（守卫 commit 家族：03bffa9454 → ebd42731c9 → 9370b2f7f9）
cd /Volumes/IPFSJK/Zcode/deepseek-harness && git fetch upstream --tags
git worktree add ../dsh-harness-<短版本号> dsh-v<版本>          # 新版本供版树
cd ../dsh-harness-<短版本号>
git cherry-pick <上一版守卫 commit>                              # 冲突则人工重放（修复面很小：boot resolver 两处）
source ~/.nvm/nvm.sh && nvm use 22.23.2                          # 仓宪 ≥22.19，本机默认 v20 必切
pnpm install && pnpm run build                                   # 久未构建/换树先 pnpm run clean（见 §6 残渣三关）
```

验证走 §4 的 3434 窗口；生产切换（3080）仅用户明确指令后动（upgrade.md §2.1 runbook + 备份先行）。**桌面端形态无守卫可打**（捆绑 runtime 不可改），已评估影响仅为启动期错误分类噪音（KUI ①），不影响插件功能。

## 4. 双端验证矩阵（三形态 × 五面）

五面 = 装入 / 注册 / 路由·UI / 工具 / 并发。三形态与端口（宪法环境纪律）：**3423** 常驻 dev web（scratch home `/tmp/dshws-s14a/home`）、**3434** 升级/专项窗口（分线 scratch home `/tmp/dshws-s32/home-<线名>`，终态清场）、**19387** 桌面端（dev 隔离 home 或官方 app）。**3080 生产红线禁触**。

```sh
# (a) web 形态（3423/3434 同款）
DSH_HOME=<scratch-home> node --import tsx/esm apps/cli/src/bin.ts plugin --profile web add file:<插件tgz>
DSH_HOME=<scratch-home> node --import tsx/esm apps/cli/src/bin.ts web --port 3423 --no-open

# (b) 官方桌面形态（carrier 直调；app 须在跑——profile 锁要求）
#     官方用户/长期形态用 npm spec；本机验证批次用 file: tgz 亦可（注意：file: 钉路径，
#     dist-artifacts 为 git-ignored 目录，误清将断该 profile 重装供源——S30 同族债务，登记在案）
'/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh' plugin --profile desktop add @maricgeer/dsh-websearch
osascript -e 'quit app "DeepSeek Harness"'; sleep 4; open -a "DeepSeek Harness"   # 重启重新组合

# (c) dev 桌面形态（需要调试 host/renderer 时；先排障 §6 五关）
# 安装用载体脚本（显式目录复刻 runDesktopCli，dev cli.js 自定位不可用）：
#   ELECTRON_RUN_AS_NODE=1 <dev Electron> --expose-internals /tmp/dev-carrier.mjs plugin --profile desktop add file:<tgz>
#   dev-carrier.mjs = await import('<dev project>/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js')
#                     .runDesktopCli('<dev project>', '<dev targets>/<target>/runtime/primary-runtime/dependencies')
```

**验证锚点（浏览器自动化打开 `http://127.0.0.1:<port>/?token=<从启动日志取>`）**：①Settings 导航出现 **Web Search** 节（= host 半区注册 + client.js 经 `/plugins/` 加载）；②成员卡状态与预期一致（官方端共享凭据应全 Configured + Primary/Standby 徽标）；③web_fetch 接管开关态；④DNS 韧性卡（DoH active + reserved-range 证据行 = DNS 层活体）；⑤设置页脚版本 = 官方桌面 feed version。**运行时真实搜索腿**不随验证烧 API——由插件仓 `pnpm test`（用例数见当期 progress 台账，不在此抄录）+ e2e.real（有 key 窗口）+ 在役实例的真实搜索记录（哪个实例在役以 STATUS 为准）覆盖。**并发**：3080 + 3423/3434 + 19387 三进程同跑为常规态（会话互斥写锁是设计行为）。

**macOS 桌面端取证注意**：官方 app 无远程调试口；拿 token URL 须以受管后台任务直启二进制并 tee 日志（`'<app>/Contents/MacOS/DeepSeek Harness' 2>&1 | tee <log>`），验完 `quit` + `open -a` 恢复标准启动；**绝不关闭其管道**（EPIPE 主进程崩溃弹窗，S40 事故在案）；**禁 `ps eww` 于 GUI 进程**（会倾倒继承环境里的全部凭据）。**归档前脱敏**：tee 落盘的日志在入库前执行 `sed -i '' -E 's#(token=)[A-Za-z0-9._~+/=-]{8,}#\1<redacted>#g' <文件>`，再用 `git grep -nE 'token=[A-Za-z0-9._~+/=-]{8,}'` 确认计数为 0——host 进程 token 也是凭据，S14c、S32、S33、S40 四批证据日志曾带值入库。

## 5. 插件发版与桌面端联动

发版门与双 tarball 流程的正本 = AGENTS.md「上游适配强制流程」+ `scripts/pack.mjs`（npm scoped + GitHub 裸名双 tarball；tag 推送 = 发布确认点，CI 自动接管；**tag/publish 前单独向用户确认**）。发版后的部署动作：生产 3080（用户裁定）+ 官方桌面 19387（§4(b) 同 tarball 重装 + 重启）。**桌面更新触发链**：官方桌面 feed 出现新版本 → §2 决策树 → 需要时扩钉发版；桌面用户侧的自查/重装指引在 README FAQ 桌面条目。

## 6. 本机构建环境残渣三关与网络兜底（S40 实战沉淀）

换树/久未构建的主 checkout 启动 dev 桌面前的排障序列（详见 desktop-adoption §9 T3）：

1. **陈旧 `lib/` 产物**（tsdown RESOLVE_ERROR 报 exports 子路径缺失）→ `pnpm run clean` 后重建。
2. **`.pnpm/node_modules` 陈旧 hoisted 链接**（pnpm 与 clean 均不修剪已删包的旧链接；表现为投影工程读 `package.json` ENOENT）→ 按「symlink 且 target 缺失或无 package.json」精确清扫（顶层 + `@scope/` 两层）。
3. **未跟踪旧布局残渣目录**（如重构前的 `native/landlock-run/`）→ `git ls-files <dir>` 确认零跟踪后删除。

网络兜底（本机国际腿间歇中断 + undici fetch 不吃代理变量）：
- Electron 下载：`ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`。
- 运行时载荷（15 项资产）挂死：curl 预热缓存 `apps/desktop/.desktop-build/downloads/`（**文件名 = sha256**；与根脚本默认 `/tmp/dsh-primary-runtime-downloads` 不同目录）；URL 变换序：原站 → 重试 → nodejs.org→`npmmirror.com/mirrors/node/`、pypi→`mirrors.aliyun.com/pypi/web/`（或 tuna）、github→代理链；sha256 强校验兜底字节一致性。
- dev 常驻进程管理：不用 `nohup &` 挂在已结束的前台调用下（会被会话清理 SIGTERM）；用受管后台任务。

## 7. 红线与高危门控（本 SOP 全程适用）

3080 生产禁触（仅用户明确指令）；`v*` tag 推送 / `npm publish` 先确认；仓库外写入、系统配置修改、大范围删除 fail-closed；DNS 相关只读观测；凭据零明文（含：诊断命令不得倾倒进程环境）。治理留痕：每轮循环按 session-governance 收尾六件套落盘——① 交付物 ② session 记录（含 audit-logs 证据归档，带参数头与输出原文）③ progress 台账与 STATUS、roadmap 更新 ④ 踩坑沉淀（RCA / dont-do）⑤ CHANGELOG ⑥ 接力指令；六项齐全才算收官。
