# S41 阶段 0 audit-log — 前序 Session（S40）审核确认

## 参数头

- 骨架版本：库版本 v2（`references/audit-gate.md` 阶段 0 骨架：四维实测 + 债务三分级 + 流程合规审计）
- 阶段：0（S41 对 S40）
- Session：41
- 输入指针：仓库 `/Volumes/IPFSJK/Zcode/dsh-websearch`（master @ `26b646e`，审核起点工作树干净）；S40 记录 `docs/sessions/2026-09-30-session-40.md`；commit 范围 `619b99c1..26b646e`；`docs/STATUS.md`；`docs/session-roadmap.md`；`docs/progress/progress-M7.md`；`docs/dont-do.md`；`docs/governance-sessions.md`；静态检查命令 `pnpm run typecheck` / `pnpm run typecheck:client` / `pnpm run lint` / `pnpm run check:i18n`；node 经 nvm 绝对路径 v22.23.2
- 相对骨架的偏离说明：(1) 增补「基线登记」项——串行实跑 install、typecheck、typecheck:client、lint、test、check:i18n、build 各一次并记录数字，作为本 session 依赖变更前的基线；(2) 增补 semver 双语义矩阵项；(3) 增补上游监测三项（npm 版本面、harness 远端 tag、官方桌面 feed 与本机 app 版本）。审核 Agent 自行追加的只读补充探测见其报告自带的参数头。
- 审核 Agent：general-purpose，独立 spawn，与执行者上下文隔离
- 输出原文落盘：本文件下一节；原始输出归档于同目录 `2026-11-23-s41-stage0-raw/`

## 审核 Agent 输出原文（逐字，未经主 Agent 改写）

# S40 阶段 0 独立审核报告（S41 进入侧 gate · 前序 Session 审核确认）

> 审核日期 2026-11-24（00:02 起串行实跑基线链）｜只读审核｜审核 Agent 与 S40 执行上下文隔离
> 报告正本：`/tmp/dshws-s41/audit/s40-stage0-report.md`；原始输出：同目录 `baseline/`、`upstream/`、`*.out.txt`、`smoke-subset.log`

## 0. 提示词参数头

- 骨架版本：库版本 v2（阶段 0 变体：四维实测 + 流程合规审计）+ 协调方任务书增补项 e–g
- 阶段：0（S41 → S40）
- Session：41
- 审核对象：Session 40（官方桌面端采用批），commit 范围 `619b99c1..26b646e`
- 输入指针：仓库 `/Volumes/IPFSJK/Zcode/dsh-websearch`（master）；`docs/sessions/2026-09-30-session-40.md`；`docs/STATUS.md`；`docs/session-roadmap.md`；`docs/progress/progress-M7.md`；`docs/dont-do.md`；`docs/governance-sessions.md`；`docs/_templates/session-template.md`；`docs/plans/2026-09-30-047-desktop-adoption-plan.md`；`docs/desktop-adoption.md`；`docs/upstream-sync-sop.md`；`docs/decisions/adr-0023-desktop-adoption-dual-profile.md`；`docs/sessions/audit-logs/2026-09-30-s40-*`；harness 仓 `/Volumes/IPFSJK/Zcode/deepseek-harness` 树 `9370b2f7f9`；node `v22.23.2` / pnpm `11.7.0`（nvm 绝对路径）
- 偏离说明（中性）：任务书 b 的四条静态命令与 e 的串行链是同一组命令，合并为单次实跑，数字两处共用；除任务书列举项外另做只读补充探测（dsh-websearch origin 的 `ls-remote`、upstream HEAD、另两平台桌面 feed、upstream master 的 `host-protocol.ts`、`~/Library/Logs/DeepSeek Harness` 目录只读）；未触碰 `~/.dsh`，未运行 Electron 二进制，未 `ps eww`

## 1. 结论

> 引用约定：「S40 记录」= `/Volumes/IPFSJK/Zcode/dsh-websearch/docs/sessions/2026-09-30-session-40.md`；「STATUS」= `docs/STATUS.md`；「SOP」= `docs/upstream-sync-sop.md`；「plan 047」= `docs/plans/2026-09-30-047-desktop-adoption-plan.md`；「desktop-adoption.md」= `docs/desktop-adoption.md`；「dont-do」= `docs/dont-do.md`；「AGENTS.md」= 仓库根宪法；「stage4 / stage5」= `docs/sessions/audit-logs/2026-09-30-s40-stage4-review.md` 与 `…-stage5-crossvalidation.md`；「证据目录」= `docs/sessions/audit-logs/2026-09-30-s40-desktop-adoption/`。除注明 harness 树外，路径均相对 `/Volumes/IPFSJK/Zcode/dsh-websearch`。

**PASS（零 🔴；🟡×10，先债后新）**

- S40 声称的交付物全部在盘，可复核的数字与 file:line 抽验吻合，未发现虚假完成声明；测试面与静态面全绿（607 passed | 17 skipped (624)，四命令 exit 0）。
- 两项 🟡 具有事实上的前置性，S41 计划期必须排在最前：
  - **上游已前移**：npm `next`=0.2.2-rc.5、`alpha`=0.2.3-alpha.2；upstream master=`4b399c39a6`；本机官方桌面 app 已于 2026-11-18 自动更新到 0.2.2-rc.5。S40 的「免发版 / 双端适配全绿 / 无适配压力」只在其时点成立。
  - **SOP 的风险模型与宿主门实际语义不符**：宿主兼容门用 `includePrerelease: true`，0.2.x 预发布不会被拒，而是被放行到未演练的宿主上；SOP §2 的「域内 / 域外」判定未指明语义。
- 环境态提示（非 S40 缺陷）：3080 / 3423 / 19387 三端口当前均无监听（机器 2026-10-11 重启过），**生产 3080 不在役**；STATUS 与接力指令里的「在役」表述已失效。是否有意停机需用户确认。
- 推送前须处置：11 个 commit 尚未推送（origin/master 仍在 `619b99c1`），其中 4 个证据日志含明文 host token（现已失效）。

## 2. 三级清单

### 🔴 阻塞性技术债务

无。

### 🟡 非阻塞但必须完善的债务（按处置优先级排序）

**🟡-1 上游已前移，S40 的现势结论、STATUS 与接力前提全部过期**

- npm（生效 registry 为 npmmirror，7 包均第 1 次成功）：六个 `@deepseek-ai/dsh-*` 包 `next`=0.2.2-rc.5、`alpha`=0.2.3-alpha.2。S40 记录:48 与 STATUS:115 写的是「npm next=0.2.0-rc.2……无新版本则无适配压力」。
- upstream：`refs/heads/master`=`4b399c39a6`（= tag `dsh-v0.2.3-alpha.2`）。S40 记录:22 与 known-upstream-issues.md:27 写的是「停在 639ed01539（无新提交）」。
- 官方桌面 feed：mac-arm64=0.2.3-alpha.2（`stagingPercentage: 10`，2026-11-23T03:12:30Z）；mac-x64=0.2.1-rc.4；win-x64=0.2.3-alpha.2。desktop-adoption.md:28-30 与 SOP:44 的「三平台同版」不再成立。
- 本机官方 app：`CFBundleShortVersionString`=0.2.2-rc.5（Info.plist mtime 2026-11-18 19:35:40）。S40 记录:18、STATUS:103/115 写的是 0.2.0-rc.2。
- (f) 矩阵：0.2.1-rc.5 / 0.2.2-rc.1 / 0.2.2-rc.5 / 0.2.3-alpha.2 在默认语义下全为 false。
- S40 自登记的延后项「官方 app 更新事件实测留待发生时」（S40 记录:39、plan 047:39）触发条件已发生。
- 环境态：`lsof` 对 3080 / 3423 / 19387 的 LISTEN 结果均为空；`kern.boottime`=2026-10-11 23:35:22。STATUS:115/120、S40 记录:32/48/61 的「在役可复用」已失效。
- dont-do 命中：无直接条目；关联 AGENTS.md:35「上游每发新预发布逐钉扩展 + 跑演练手册后才可声明兼容」。
- 待坐实：本机官方桌面 0.2.2-rc.5 上插件的实际运行面（本审核禁触 `~/.dsh`，未读 profile 实况）；3080 停机是否有意。

**🟡-2 SOP / ADR / README 的「被 peer 门拒装」风险模型与宿主门语义不符；SOP §2 判定未指明语义；SOP 辅线监测命令读的是本地钉死文件**

- 宿主门代码：`packages/boot/app-boot/src/plugin-compatibility.ts:77`（树 `9370b2f7f9`）为 `semver.satisfies(runtimeVersion, requirement, { includePrerelease: true })`；9 个调用点全部走 `evaluatePluginCompatibility`（app-boot `compatibility-preflight.ts:105`、`profile.ts:675`；plugin-manager `index.ts:301/546/722`、`operations.ts:344/479`）。
- (f) 矩阵 `includePrerelease` 列：0.2.1-rc.5 / 0.2.2-rc.1 / 0.2.2-rc.5 / 0.2.3-alpha.2 全为 true，即 0.2.x 预发布不会被宿主门拒绝。
- S40 文本：adr-0023:23「预发布不在 `>=0.2.0 <0.3.0` 区间，官方桌面每升一版都可能拒装」；README.md:171「预发布版本不在插件兼容域时被 peer 门拦下」；desktop-adoption.md:33「插件 peer 域随即面临失配」。
- 项目自有先证未被吸收：`docs/sessions/audit-logs/2026-09-30-s38-t1-satisfies-matrix.txt` 已记录 0.2.1-rc.0 为「npm false / gate true」并注明「gate 越权放行」。
- SOP:48-50 决策树只写 `semver.satisfies(V, 域)`：按默认语义 0.2.2-rc.5 走「域外 → 扩钉发版」，按 gate 语义走「域内 → 免发版」，两条分支相反。
- SOP:40-41 辅线 grep 本地 `apps/desktop/src/host-protocol.ts`，而主 checkout 钉在 `9370b2f7f9`（恒为 4）；upstream master `4b399c39a6` 同文件 :4 已是 `DESKTOP_HOST_PROTOCOL_VERSION = 5`。ADR-0023:34「目前 = 4」过期。
- dont-do 命中：dont-do:70（semver 实测）同族——对 gate 行为的断言未对照 gate 代码与双语义；非严格复发。
- 待坐实：桌面 app 自动更新场景下（插件已装、无 fresh `pnpm add`）插件在 0.2.2-rc.5 上的真实表现；pnpm 侧对未满足 peer 的处置本审核未实测。
- 判别式：SOP 自称「流程单一正本」，核心判定谓词半成品，契约未闭环。

**🟡-3 证据工件含明文 host token ×4，随未推送 commit 待进公开仓库**

- 位置（值不转录）：`docs/sessions/audit-logs/2026-09-30-s40-desktop-adoption/` 下 `dev-desktop10.log:16`、`dev-desktop11.log:16`、`official-app.log:3`、`web-3423.log:1`。S40 全范围脱敏扫描仅此 4 处命中。
- 证据目录 README.md:7 自辩「已失效无妨」：提交时点 2026-10-01 00:52，3423 与 19387 实例均在役（stage5-crossvalidation.md:7 记 pid 21072 / 25798），当时并未失效；现因 10-11 重启已随进程消亡。
- origin 实况：`git ls-remote origin` 的 `refs/heads/master`=`619b99c118`，尚未公开；仓库为公开仓库（STATUS:94）。
- 命中：AGENTS.md:17「凭据零明文」的精神；dont-do 无对应条目。SOP:91 把「受管后台直启并 tee 落盘」定为 token 取证法，但无「归档前脱敏」步骤，每轮循环会再生。阶段 4（stage4-review.md:17）与阶段 5 均未提出。

**🟡-4「待合入 master（候令）」与 git 实况相反；merge 无留痕**

- `26b646e` 为双父 merge（`619b99c1` + `ede714d`），author date 2026-10-01 00:52:19；`ede714d` 提交于 00:52:12。「待合入」字样落盘 7 秒后即执行了合入。
- 仍写「待合入」：S40 记录:33/43/48/63；STATUS:103/115/120。
- `grep -rn 26b646e docs/ README.md CHANGELOG.md` 零命中。S40 记录:43 自设「（需用户确认）」，确认时点无留痕。
- STATUS:115「发布面：master `92a15d7`」过期：origin/master 现为 `619b99c1`。
- dont-do 命中：dont-do:26（收官 / 启动原子序列漏刷新状态区）复发。

**🟡-5 progress 台账停更（S38–S40 三棒）；SOP「六件套」两处枚举自相矛盾**

- `git log 619b99c1..26b646e -- docs/progress/` 为空；progress-M7.md 最后一次提交是 `4df0221`（S37 T17）；S38、S39 范围同样为空。
- S40 记录:26、plan 047:32（R4）、roadmap 行 40 称六件套完成；AGENTS.md:9 写明「STATUS+progress 更新……缺一即流程失败」；governance-sessions.md:76 为同一要求。
- S40 零锚点登记，「已验锚点」台账无法被引用，本次交付物全部直接重验。
- SOP:24（⑦ 列 6 项，含 RCA/dont-do 与接力指令）与 SOP:112（列 4 项）枚举不一致，两处均无 progress。
- S38 / S39 / S40 记录与 S40 阶段 4/5 日志对 progress 零提及，不存在停更裁定。
- dont-do 命中：dont-do:26（progress 状态区漏刷）复发；前两轮 gate 漏检。

**🟡-6 audit-log 溯源缺口**

- 阶段 4/5 记录无「提示词参数头」：stage4-review.md:1-7 与 stage5-crossvalidation.md:1-7 只有一行角色说明，缺「骨架版本｜阶段｜Session｜输入指针｜偏离说明」。
- 输出原文未逐字落盘：两份均为摘要表，无命令原文（governance-sessions.md:255 要求阶段 4 报告含命令原文 + 实测数字）。
- 阶段 0（审 S39）与阶段 2（计划两轮）的 audit-log 不存在：`ls docs/sessions/audit-logs | grep s40` 只有 `2026-09-30-s40-desktop-adoption/`、`…-stage4-review.md`、`…-stage5-crossvalidation.md`。阶段 0 结论仅见 S40 记录:7 一段；阶段 2 仅见 S40 记录:11 与 plan 047:3 两句，第二轮 verdict 未写明。
- 依据：session-governance `references/six-stage.md:207-218`。复发：S35 T0 曾回溯补齐 7 份 v2 参数头（progress-M7 提交 `6c2e360`）。

**🟡-7 接力指令非当期格式且内容过期**

- S40 记录:48 为单行「按 .session-start 启动 Session 41」加一段上下文要点。
- governance-sessions.md:79「禁止退化为单行格式」；:91 五语义点逐项：①只有 `.session-start`，缺 governance 编号与「按 docs/STATUS.md 定位」；②计划期与 2.5 人工终审缺；③六阶段 / 独立分离 / 逐一 TDD 缺；④五禁止缺；⑤高危命令门控缺。头行无目标句（roadmap 无 S41 的待执行行）。
- 内容三项过期：在役可复用、无新版本、待合入。
- 附注：S37–S39 记录的接力节同为自由体，属存量家族。

**🟡-8 session 记录模板缺项**

- 位置标头 3 行缺（session-template.md:3-7，v1.2 必填）：S40 记录:1-3 只有用户指令。
- 快照节缺「当前阶段」受控词表字段：S40 记录:59-63（模板 :86-90；STATUS:13 规则）。
- 强化说明节未按五项逐一确认：S40 记录:65-68 只有两条自由句，缺六阶段逐阶段声明与 2.5 批准时点、三级处置、任务完成度、高危命令逐条确认时点（模板 :92-106；governance §3.4.5）。
- 2.5 批准时点与「高危项授权清单」本体不在盘上（plan 047:3 仅提及）。
- 本批实际触发的高危类操作未逐条留痕：向共享的 `~/.dsh` 写入与仓库外写入（desktop-adoption.md:95/110/112）、官方端读取生产凭据（:112）、harness 仓删目录与链接（:103-104）、生产供版 worktree 切 detached（S40 记录:7）。S40 记录:68 只声明了发版门。用户初始指令在 S40 记录:3 留痕，其是否覆盖上述每一类操作，盘上无逐项记录可核（待坐实）。

**🟡-9 多载体重复誊写（含枚举式 commit 清单复发）**

- 实测计数（S40 触及的 14 个文件内）：`77804` 9 次 / 6 文件；`607` 7 次 / 6 文件；`9370b2f7f9` 7 次 / 6 文件；`17 工件` 6 次 / 6 文件；`46+` 4 次 / 4 文件；`17(624)` 4 次 / 4 文件；`369,764,183` 3 次 / 3 文件。
- 依据：governance-sessions.md:252 誊写纪律；STATUS:4「不堆审计细节」。
- S40 阶段 0 的 🟡①（STATUS pid 77445→77804）就是重复誊写导致的漂移，处置方式是再抄两处（STATUS:102/103）。
- dont-do 命中：dont-do:87（枚举式 commit 清单）复发。S40 记录:33 手工枚举 9 个 hash，内容经 `git log` 核对无误，但形态即该条禁用的形态。

**🟡-10 AGENTS.md:35 的 peer 域描述过期（存量，S33 / S38 起）**

- AGENTS.md:35 写到 `0.1.7-alpha.2` 止；package.json 实际另有 `|| 0.1.7-rc.1 || 0.1.7-rc.2 || 0.2.0-rc.1 || 0.2.0-rc.2 || >=0.2.0 <0.3.0`。
- 宪法每会话必读；S40 的 T6 上游复查与 SOP:50 均以其为依据。
- 判别式：位于 S41 上游适配路径上。

### 🟢 可延后项（归属明确）

1. S40 自登记三条维持（S40 记录:37-39）：桌面运行时真实搜索腿未实跑；desktop profile 钉 `file:` tgz；Windows 桌面形态未实装。第四条「更新事件实测留待」已并入 🟡-1。
2. desktop-adoption.md 行号与路径偏差：:70 写 `cli.ts:18`（实际 :16）；:50 写 `paths.ts:17-22`（注释在 :14）；:16 写 `apps/web/dist`（main.ts:669 实为 `dsh-web-frontend/dist`）；:18 写 `vendor/landlock`（代码为 packedLandlock 构建路径，源已在 `native/system`，提交 `336ebb235e`）；:19 写「在本仓打 desktop-v tag」（远端 45 条 tag 引用中 0 条）；:106 写「12 wheels」（runtime-assets.json 为 13 条 pythonhosted + node + cpython = 15）。
3. 证据索引判读错位（证据目录 README.md:13）：日志 5 实为 landlock-run ENOENT；日志 7 实为 `fetch failed`；日志 8 实为 `terminated`。
4. 债务计数口径不一：plan 047:36-39 四条，STATUS:121 写「🟢×3」。
5. 已合入的 feat 分支 6 条未清理（含 `feat/s40-desktop-adoption`）。
6. 既存测试噪音（非 S40 引入，台账未登记）：`validateDOMNesting` 的 button 嵌套（`src/client/chain-cards.tsx:206`）；`tests/client/entry.spec.tsx:60` 的 mock 缺 `$mount`；vite sourcemap 警告。

## 3. a–g 原始结果

### a. 测试面（增量采信制）

| 项 | 实测 |
|---|---|
| 起点哈希 | `619b99c1` = `619b99c118643972d9cc665e5a9f399aa5990273` |
| 终点哈希 | `26b646e` = `26b646e40f8a843c3b8132267881287ca701ad87` |
| commit 数 | 11（10 个普通提交 + 1 个 merge），与声称一致 |
| 提交链（旧→新） | 0c49462、a329490、057ede3、19f7d53、690cd2c、6f98b37、62e29fa、30f09bd、b52b6db、ede714d、26b646e（merge） |
| `git diff --stat` | 32 files changed, 6738 insertions(+), 9 deletions(-)；新增 25、修改 7 |
| `docs/` 内 / 外 | 30 / 2（`CHANGELOG.md` +7/−0；`README.md` +4/−1） |
| test / script / config 变更 | 0（`src`、`tests`、`scripts`、`package.json` 零 diff） |
| 最近产品代码提交 | `4608a1a`（2026-09-30 02:16），此后零产品代码变更 |

- 判定：`README.md` 不在 `docs/` 内，但属纯文档，无 test / script / config 变更，按「无产品代码变更」处理；因 fail-closed 口径对 README 归属有歧义，同时做了子集冒烟与 (e) 的全量各一次。
- 基线链：progress 台账最后一个测试锚点是 S37 的 601/601（`4df0221`），此后 12 个产品文件有变更，已重验；现行基线为 S38 阶段 4 的 607|17(624)，本次全量复现逐位一致。
- 抽样冒烟：`pnpm exec vitest run tests/client/entry.spec.tsx tests/user-agent.test.ts tests/pack.test.ts` → Test Files 3 passed (3)，Tests 11 passed (11)，exit 0，耗时 2.3 s。

### b. 静态检查（与 e 同一次实跑）

| 命令 | exit | 耗时 | 结果 |
|---|---|---|---|
| `pnpm run typecheck` | 0 | 2.6 s | 双面 tsc 零输出 |
| `pnpm run typecheck:client` | 0 | 1.4 s | 零输出 |
| `pnpm run lint` | 0 | 0.3 s | Found 0 warnings and 0 errors；87 files，96 rules |
| `pnpm run check:i18n` | 0 | 0.3 s | 179 keys，union/en/zh parity；41 files 零 CJK |

### c. git 状态

| 项 | 实测 |
|---|---|
| 分支 | master |
| HEAD | `26b646e40f8a843c3b8132267881287ca701ad87`（与声称一致） |
| 工作树 | 干净（`git status --short` 0 行） |
| `git rev-list --left-right --count origin/master...master` | `0	11` |
| origin/master（本地跟踪引用） | `619b99c1` |
| origin 实况（`git ls-remote`，未 fetch） | `refs/heads/master`=`619b99c118`；`refs/tags/v0.2.0`=`9aaea43919`（→ `6b5330d895`） |
| merge 提交 | `26b646e` 父 = `619b99c1` + `ede714d` |
| `feat/s40-desktop-adoption` | 仍存在，指向 `ede714d`，已合入 master |

### d. 交付物核验

| S40 记录声称 | 核验结果 |
|---|---|
| docs/desktop-adoption.md | 在盘，124 行；三形态实测节完整 |
| docs/upstream-sync-sop.md | 在盘，112 行，七节 |
| ADR-0023 | 在盘，34 行，status accepted，D1–D4 |
| README 桌面用户条目 | README.md:171；文档链接 :180-181；ADR 范围 :184 已更正为 0001..0023 |
| known-upstream-issues ① S40 复查行 | :27 在位；维护规则行 :5 已更新 |
| dont-do ×4 | :135-159 四条齐全 |
| CHANGELOG 条目 | :1-7 |
| plan 047 + roadmap 行 | 均在盘 |
| 证据归档 17 工件 + 索引 | 目录 18 个文件 = 17 + README，吻合 |
| 阶段 4/5 记录 | 两份在盘 |
| T0 ①STATUS pid 勘正 | STATUS:102 在位 |
| T0 ②S39 日志加注 | 「3080 终验」节实测 2026-09-27T18 共 232 行、2026-09-29T18 共 4 行，尾部 4 行 served-by anysearch ×2，与加注一致 |
| T0 ③生产 worktree detached | `dsh-harness-020rc2` = `9370b2f7f9`（detached HEAD） |
| harness 树 file:line 抽验 | 26 处抽验，23 处逐字吻合（README.md:7/63/151、update-coordinator.ts:69-70、profile.ts:239、args.ts:83-87/195、web-document.ts:77-93、main.ts:320/97-101、desktop-release-tag.ts:31-33、host-protocol.ts:4、web-app cordis.patch.yml:169-175、提交 336ebb235e 等）；3 处偏差见 🟢-2 |
| 证据日志抽验 | build-full.log 2 处 RESOLVE_ERROR（api-trust / claim-support）；build-clean.log 0 处、尾部有 client artifacts 记录行；dev-desktop10/11 含运行时冒烟通过与 inspectors 9229/9222/9230；dev-desktop8.log 尾行 `terminated` |
| 载荷缓存 | `.desktop-build/downloads` 110M，15 个文件 |
| 悬空引用 | 351 个路径引用，dsh-websearch 侧 5 个「不存在」均为缩写 / 区间记法 / 历史条目；无真实悬空 |

### e. 基线登记（串行，各一次）

| # | 命令 | exit | 耗时 | 通过 / 跳过 / 失败 |
|---|---|---|---|---|
| 01 | `pnpm install --frozen-lockfile` | 0 | 0.5 s | Already up to date；lockfile up to date |
| 02 | `pnpm run typecheck` | 0 | 2.6 s | 不适用 |
| 03 | `pnpm run typecheck:client` | 0 | 1.4 s | 不适用 |
| 04 | `pnpm run lint` | 0 | 0.3 s | 0 warnings / 0 errors |
| 05 | `pnpm test` | 0 | 6.1 s | Files 41 passed / 1 skipped (42)；Tests **607 passed / 17 skipped / 0 failed (624)**；vitest Duration 5.59 s |
| 06 | `pnpm run check:i18n` | 0 | 0.3 s | 179 keys；41 files |
| 07 | `pnpm run build` | 0 | 1.1 s | lib/index.js 155.68 kB、index.d.ts 52.10 kB、client.js 354.30 kB；2 条弃用 WARN |

- 耗时为驱动脚本墙钟时间，含进程启动。
- `git status --short`：install 后 0 行（无被跟踪文件改动，未触发停止）；七步全部完成后 0 行。
- 环境：node v22.23.2，pnpm 11.7.0，HEAD `26b646e4`，起跑 2026-11-24 00:02:33 +0800。

### f. semver 双语义矩阵

- semver：`/Volumes/IPFSJK/Zcode/dsh-websearch/node_modules/.pnpm/semver@7.8.5/node_modules/semver`（7.8.5，任务书指定路径存在）
- 六条 `@deepseek-ai/dsh-*` 范围：**逐字相同**（程序比对 true；逐版本逐包答案分歧 0）
- 范围：`>=0.1.5-rc.1 <0.1.8 || 0.1.6-alpha.1 || 0.1.6-alpha.2 || 0.1.7-alpha.1 || 0.1.7-alpha.2 || 0.1.7-rc.1 || 0.1.7-rc.2 || 0.2.0-rc.1 || 0.2.0-rc.2 || >=0.2.0 <0.3.0`

| 版本 | 默认语义 | includePrerelease 语义 | 性质 |
|---|---|---|---|
| 0.2.0-rc.2 | true | true | 探针 |
| 0.2.1-rc.5 | false | true | 探针 |
| 0.2.2-rc.1 | false | true | 探针 |
| 0.2.2-rc.5 | false | true | 探针 |
| 0.2.2 | true | true | 探针 |
| 0.2.3-alpha.2 | false | true | 探针 |
| 0.1.8 | false | false | 负控 |
| 0.3.0 | false | false | 负控 |

- 负控在两种语义下均为 false，矩阵能识别域外版本。
- 「0.2.2」稳定版在 npm 版本列表中不存在，仅为探针。
- 宿主兼容门采用 includePrerelease 列的语义（plugin-compatibility.ts:77）；npm-plain 列即默认语义。

### g. 上游监测（全部只读）

**npm**（`npm view <pkg> versions dist-tags --json`；生效 registry 为 npmmirror；7 包均第 1 次成功）

| 包 | 版本总数 | 最后 12 个版本 | dist-tags |
|---|---|---|---|
| @deepseek-ai/dsh-web | 49 | 0.2.1-rc.3, 0.2.1-rc.4, 0.2.1-rc.5, 0.2.2-alpha.2, 0.2.2-alpha.3, 0.2.2-rc.1, 0.2.2-rc.2, 0.2.2-rc.3, 0.2.2-rc.4, 0.2.2-rc.5, 0.2.3-alpha.1, 0.2.3-alpha.2 | next=0.2.2-rc.5；alpha=0.2.3-alpha.2；latest=0.0.1-rc.1 |
| @deepseek-ai/dsh-agent | 49 | 同上 | next=0.2.2-rc.5；alpha=0.2.3-alpha.2；latest=0.1.0-rc.6 |
| @deepseek-ai/dsh-credentials | 49 | 同上 | next=0.2.2-rc.5；alpha=0.2.3-alpha.2；latest=0.0.1-rc.1 |
| @deepseek-ai/dsh-settings | 49 | 同上 | next=0.2.2-rc.5；alpha=0.2.3-alpha.2；latest=0.0.1-rc.1 |
| @deepseek-ai/dsh-system-prompt | 49 | 同上 | next=0.2.2-rc.5；alpha=0.2.3-alpha.2；latest=0.0.1-rc.1 |
| @deepseek-ai/dsh-tools | 49 | 同上 | next=0.2.2-rc.5；alpha=0.2.3-alpha.2；latest=0.0.1-rc.1 |
| @deepseek-ai/cordis | 13 | 4.0.1-rc.4, 4.0.1, 4.0.2, 4.0.3, 4.0.4, 4.0.5-alpha.1, 4.0.5-alpha.2, 4.0.5, 4.0.6-alpha.1, 4.0.6-alpha.2, 4.1.0, 4.2.0-alpha.1 | latest=4.1.0；next=4.2.0-alpha.1；dsh-0-2-1-alpha-1=4.0.5-alpha.1；dsh-0-2-1-alpha-3=4.0.5-alpha.2 |

**harness 仓**

- `git -C /Volumes/IPFSJK/Zcode/deepseek-harness remote -v`：fork、origin、upstream 三个远端；fork=`https://github.com/GeerMrc/deepseek-harness.git`，origin 与 upstream=`https://github.com/deepseek-ai/deepseek-harness.git`。
- `git ls-remote --tags <upstream url> | tail -15`（第 1 次成功；共 45 行）：

```
1517a4dbca refs/tags/dsh-v0.2.1-alpha.5
1600d8a1e1 refs/tags/dsh-v0.2.1-rc.1
687f282e86 refs/tags/dsh-v0.2.1-rc.2
1f81c047fc refs/tags/dsh-v0.2.1-rc.3
504a01a957 refs/tags/dsh-v0.2.1-rc.4
b830ec950f refs/tags/dsh-v0.2.1-rc.5
f3803c9697 refs/tags/dsh-v0.2.2-alpha.2
05b1cae8db refs/tags/dsh-v0.2.2-alpha.3
66491b05e3 refs/tags/dsh-v0.2.2-rc.1
ddac96760b refs/tags/dsh-v0.2.2-rc.2
38a6a5c965 refs/tags/dsh-v0.2.2-rc.3
3f321d32bf refs/tags/dsh-v0.2.2-rc.4
9c2670d3bc refs/tags/dsh-v0.2.2-rc.5
d98f5d6851 refs/tags/dsh-v0.2.3-alpha.1
4b399c39a6 refs/tags/dsh-v0.2.3-alpha.2
```

- 补充：`git ls-remote <upstream url> HEAD refs/heads/master` → `4b399c39a6d1479cd84ca591b4d7c88e24d38a96`；tag 引用中 `desktop-v*` 为 0 条。
- 本地仓未被改动：HEAD=`9370b2f7f9`，分支 `fix/readonly-stack-020rc2`；未 fetch。

**官方桌面 feed**（`curl -s --max-time 20 https://download.deepseek.com/dsh-desk/feeds/mac-arm64/nightly-mac.yml | head -5`；第 1 次成功，HTTP 200，549 B）

```
version: 0.2.3-alpha.2
files:
  - url: >-
      https://download.deepseek.com/dsh-desk/bin/mac-arm64/deepseek-harness-0.2.3-alpha.2-mac-arm64.zip
    sha512: >-
```

- 该文件其余字段：size 365597921；releaseDate 2026-11-23T03:12:30.263Z；stagingPercentage 10。
- 补充：mac-x64 `nightly-mac.yml` version 0.2.1-rc.4（2026-10-27T08:15:01Z）；win-x64 `nightly.yml` version 0.2.3-alpha.2（2026-11-23T03:03:15Z）。

**本机 app 版本**（只读 Info.plist，未运行 Electron 二进制）

- `/Applications/DeepSeek Harness.app/Contents/Info.plist`：CFBundleShortVersionString=0.2.2-rc.5；CFBundleVersion=0.2.2-rc.5；CFBundleIdentifier=com.deepseek.dsh；文件 mtime 2026-11-18 19:35:40。
- 内置 launcher `Contents/Resources/runtime/cli/bin/dsh` 存在；`/usr/local/bin/dsh` 不存在。

## 4. 流程合规审计明细

| 检查项 | 结果 | 证据 |
|---|---|---|
| 「前序 Session 审核确认」节 | 在盘，实质齐全 | S40 记录:5-7：对象、方式、结论 PASS、🔴 零、🟡 三条及清偿提交；🟢 一项未显式写；原始输出未归档 |
| 「开发规范强化说明」节 | 在盘，未按五项确认 | 见 🟡-8 |
| 接力指令当期格式 | 不合规 | 见 🟡-7 |
| 六阶段留痕 | 部分 | 阶段 3 有逐任务提交；阶段 4/5 有记录；阶段 0/2 无 audit-log；阶段 2.5 无批准时点与指令正本 |
| plan 正本 | 收官补档 | plan 047:3 自述为「收官归档版」；在 `ede714d` 才首次入库；无「验证矩阵」节（governance §3.4.8 要求必填），只有 R1–R4 验收条目 |
| audit-log 参数头 | 缺 | 见 🟡-6 |
| 输出原文含 file:line 或实测数字 | 含 | 阶段 4/5 记录有行号与数字，但为摘要而非原文 |
| 多载体重复誊写 | 命中 | 见 🟡-9 |
| 悬空引用 | 未命中 | 见 d 表 |

## 5. 未复验项与待坐实

- `~/.dsh` 下的一切（本审核禁触）：profiles/desktop 的 patch 217B→661B、profiles/web 时间戳、四成员 Configured、会话树 46+、生产 profile mtime。采信 S40 阶段 4/5 记录。
- 时点证据不可重现：下载字节数与 dmg sha512、三平台 0.2.0-rc.2 feed 表、EPIPE 事故现场、阶段 4/5 的 pid 快照。S40 记录:18 的「369,764,183 B@55MB/s」与 desktop-adoption.md:91 的 6.7 s 算术自洽。
- S40 实测环境为 darwin 25.6.0，本机现为 darwin 27.0.0，桌面形态结论需在新环境重验。
- 待坐实：本机官方桌面 0.2.2-rc.5 上插件的实际运行面；pnpm 侧 peer 处置语义；3080 停机是否有意；合入 master 与高危操作的用户确认覆盖面。

## 6. 约束遵守

- 未修改任何被跟踪文件：dsh-websearch 终态 `git status --short` 0 行，HEAD 仍为 `26b646e4`；harness 仓 HEAD 与分支未变。
- 未执行 commit / push / checkout / switch / branch / stash / reset；未在 `docs/` 写文件；未触碰 `~/.dsh`；未运行 Electron 二进制；未 `ps eww`。
- 副作用仅限：`pnpm install --frozen-lockfile`（无变更）、已 gitignore 的 `lib/` 构建产物、`/tmp/dshws-s41/audit/` 下的临时文件。
- 本报告不含任何凭据值；证据日志中的 token 仅以 file:line 指认。
