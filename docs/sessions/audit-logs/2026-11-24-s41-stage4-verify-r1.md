# S41 阶段 4 audit-log（第 1 轮核验）— 执行回顾审核

## 参数头

- 骨架版本：库版本 v2（`references/six-stage.md` 阶段 4 骨架）
- 阶段：4（第 1 轮）
- Session：41
- 输入指针：plan 正本 `docs/plans/2026-11-23-048-s41-takeover-docsplit-oidc-plan.md`（含「实测更正」节；版本：提交 `cdd2894`）；commit 范围 `26b646e..a66ef5d`（由审核 Agent 自行 `git log` 复核）；测试命令 `pnpm test`；静态检查命令 `pnpm run typecheck`、`pnpm run lint`、`pnpm run check:i18n`、`pnpm run build`；rc.5 实测证据在仓库外的 `/tmp/dshws-s41/evidence/`（尚未归档入库，见报告 F7）
- 相对骨架的偏离说明：任务书除指针外，附了一份「建议核对动作」清单（不是计划正文，正本仍由审核 Agent 自行读取）。首份任务书漏了两项骨架要求——「先查 progress 的已验锚点台账」与「发现逐条标注是否命中既有 dont-do / pitfalls 条目」——以补充消息追加。实验目录限定在 `/tmp/dshws-s41/stage4/`。
- 审核 Agent：general-purpose，独立 spawn，与执行者上下文隔离
- 输出原文落盘：本文件下一节（由脚本从审核 Agent 的输出文件逐字拼接，未经主 Agent 改写）

## 审核 Agent 输出原文（逐字，未经主 Agent 改写）

# S41 阶段 4 独立核验报告

**总体结论：NEEDS REVISION。** 最重的一条：HEAD `a66ef5d` 上 `pnpm test` 是红的（2 条失败），自提交 `82b3a86` 起一直如此。R2、R6、R8 各有子句不成立，R7 的 README 勘正只做了一半。

## 1. 参数头

- **环境**：macOS darwin 27.0.0 arm64，zsh；node v22.23.2，pnpm 11.7.0，npm 10.9.8，vitest v4.1.11。
- **主仓库**：`/Volumes/IPFSJK/Zcode/dsh-websearch`，分支 `feat/s41-takeover-docsplit-oidc`，HEAD `a66ef5d0338621792e7e770a64b4839c45050041`，`git status --short` 无输出。`git log --oneline 26b646e..HEAD` 共 22 个提交（`8c0dc8a` 至 `a66ef5d`）。
- **实验目录**：`/tmp/dshws-s41/stage4/`（`logs/`、`tools/`、`clone/`、`base/`）。
- **命令概要**：
  - 只读 git 命令（status、rev-parse、log、show、diff、grep、tag -l）。
  - 主仓库五条全量门，逐个文件跑 7 个契约测试，两份工作流用 `yaml` 解析。
  - 全新克隆的八步预演，三组先红后绿抽样，定位引入失败Suite的提交。
  - 31 个改动文档的断链扫描，`check-release.mjs` 在非 git 目录的行为实验。
  - 对 npm trusted publishers 文档做了一次外部抓取。
- **约束遵守**：
  - 主仓库零改动（HEAD 不变、无 stash、无新 tag、`dist-artifacts/` 两个 tarball 的 sha256 前后相同）。
  - 未读写或列出 `~/.dsh`；未启停 3434 实例；未进入 `home-rc5*`。
  - 输出里的令牌值一律 `token=<redacted>`，比对只用哈希前缀。
- **偏离说明**：
  - 若干条只含 git、grep、sed 的只读命令没带 PATH 前缀；凡运行 node、pnpm、vitest 的命令都带了。
  - 做过一次被动的 `lsof -iTCP:3434 -sTCP:LISTEN`（只列监听，未与实例交互）。
  - 克隆里的 `pnpm install --frozen-lockfile` 按任务书原文执行，未加 `--registry`。
- **未能核实的部分**：
  - T5p 的客户端读数没有原始文件。
  - 证据目录里的 npm 源码副本没有版本标记（其 `package.json` 显示 12.2.3），无法确认记录所说的 11.21.3。
  - npm 文档引文来自一次小模型摘要，按近似引述对待。

## 2. 全量门结果（主仓库，串行）

| 命令 | 退出码 | 关键数字 |
|---|---|---|
| `pnpm run typecheck` | 0 | `tsc --noEmit` 与 `tsc --noEmit -p tsconfig.client.json` 均无输出 |
| `pnpm run lint` | 0 | 0 warnings、0 errors；95 files、96 rules |
| `pnpm test` | **1** | Test Files 2 failed / 45 passed / 1 skipped (48)；Tests **2 failed** / 701 passed / 17 skipped (720) |
| `pnpm run check:i18n` | 0 | check-locales 179 keys（zh/en 对齐）；check-cjk 43 files |
| `pnpm run build` | 0 | `lib/index.js` 155.68 kB，`lib/index.d.ts` 52.10 kB，`lib/client.js` 359.04 kB |

失败的两条（主仓库与全新克隆结果一致）：

- `tests/client/fetch-view.spec.tsx > … > registers the web_fetch toolview takeover at priority -1`
- `tests/client/toolview.spec.tsx > … > registers the web_search toolview takeover at priority -1`

报错都是 `TypeError: ctx.inject is not a function`，位置 `src/client/handover-watch.ts:120`，经 `src/client/index.ts:53` 进入。两个测试的 ctx 桩只有 `locale`、`slots`、`remote`、`effect`，没有 `inject`。

17 条跳过全部在 `tests/e2e.real/`，与「带 key 的 e2e.real 未实跑」一致。阶段 0 基线是 607 通过 / 17 跳过 (624)；S41 新增 96 条用例，总数 720。

## 3. R1–R8 逐条核验

### R1 接管 — PASS

| 子句 | 判定 | 证据 |
|---|---|---|
| patch 含 `- id: ui-settings-web-search` 与 `disabled: true` | PASS | `cordis.patch.yml:21-22`；覆盖集合恰为 `web`、`web-search-deepseek`、`ui-settings-web-search` |
| `tests/patch.test.ts` 断言四个运行时行不被禁用 | PASS | `pnpm exec vitest run tests/patch.test.ts` 退出 0，10 passed；`it.each` 覆盖四行 |
| V1 各行实际内容 | PASS | `v1-dump-config.yml`：`web` = `searchProvider: dshws-chain` / `fetchProvider: dshws-fetch-gate`；`ui-settings-web-search`、`web-search-deepseek` 为 `disabled: true`；`web-fetch-http`、`web-deepseek-api` 启用 |

`v1-dump-config.yml` 里顶层 `tool-web` 行是 `disabled: true`。这来自 rc.5 web-app 的基础 patch，不是本插件：关闭插件的 `v5-dump-config-off.yml` 里同样是 `disabled: true`，各预设行里才启用。

### R2 交还 — FAIL

| 子句 | 判定 | 证据 |
|---|---|---|
| `tests/handover.spec.ts` 全绿 | PASS | 退出 0，14 passed |
| `tests/client/handover-watch.spec.tsx` 全绿 | PASS | 退出 0，19 passed |
| T7 仅在可落盘时实现 | PASS（未实现） | `src/index.ts:111` 的 `inject` 为 `['web', 'credentials']`；`src/` 内没有 `on('dispose')`；`revertHandover` 没有任何调用点，只被测试引用 |
| T5p 矩阵归档并写明结论 | IN PROGRESS | 矩阵在 `/tmp/dshws-s41/evidence/t5p-probe-matrix.md`，未入库；逐格对照见下表，部分格无原始证据 |
| V5 通过 | PASS | `v5-plugins-list-off.txt` 官方卡回到第 2 位；`v5-dump-config-off.yml` 的 `web` 为 `{ fetchProvider: http }`，两条官方行启用，无 `dsh-websearch` 行 |
| V7 通过 | **FAIL** | 修复前后的 dump 字节相同（sha256 前缀 `a5d4cfa78bbc`）：关闭后 `web` 仍是 `dshws-tavily` / `dshws-fetch-gate`；官方页两项显示「（未加载）」，保存按钮 disabled |
| V10 通过 | NOT EXECUTED | 无证据文件；只有「T5p 期间实例存活」的间接说法 |
| V11 通过 | NOT EXECUTED | 无证据文件 |
| 限制与手动清理方法写入 README | PASS | `README.md:41` 与 `:178`；`README.en.md:67` 与 `:178` |
| 同上写入 `docs/plugin-page.{zh,en}.md` | **FAIL** | 只写了「旧版本在官方页保存的选择不会清除」和「在恢复出来的官方页重新选一个提供方」；没写命令行与手改向量不触发交还，没写删 `cordis.patch.yml` 两个键的方法 |

T5p 矩阵逐格对照（`rc5-web.log` 共 19 行，含令牌值，引用已脱敏）：

| 矩阵格 | 原始日志能否找到对应行 |
|---|---|
| 形态 H、插件页开关：`ctx.effect` teardown 触发 | 能。`rc5-web.log` 第 8、14 行 `effect teardown fired` |
| 同上：settings 写入被拒 | 能。第 11–12、17–18 行 `direct mutate failed: Error: HMR transactions cannot be nested`、`bound mutate failed: …` |
| 同上：`ctx.on('dispose')` 处理器不触发 | 只有反证。第 4 行登记了 dispose hook，其后没有触发行；后两轮探针（第 7、13 行）只登记 effect-teardown 探针 |
| 同上：客户端 `watch subscribed` 到 `stopped`，事件未送达 | **不能。** 浏览器侧读数没有任何归档文件 |
| 同上：钉值残留 | 能，由 V7 的 dump 佐证 |
| 命令行 `plugin remove`：钉值残留 | **不能。** `t5p-cli-remove*.log` 只是 pnpm 输出，没有卸载后的 dump |
| 客户端服务 47 毫秒后就绪 | **不能。** 无原始文件 |
| 形态 N：设置保存失败 | 部分。`rc5-web-nohmr.log` 在 `bound callback running` 之后没有任何结果行，界面报错文案无归档 |

计划指定的探针源码目录 `/tmp/dshws-s41/probe/` 不存在，探针到底登记了什么无法核对。

### R3 文档分离 — PASS

| 子句 | 判定 | 证据 |
|---|---|---|
| `tests/package-meta.spec.ts` 全绿 | PASS | 退出 0，9 passed |
| locale 与用户文档在盘并进包 | PASS | `locale/zh.json`、`locale/en.json` 含 `meta.title/description/detail`；tarball 成员含两份 locale 与两份 `plugin-page` |
| V3 通过 | PASS | `v3-detail-zh.txt`、`v3-detail-en.txt`：标题与描述来自 locale，详情区为用户文档，README 标记为 false。渲染出的描述与 HEAD 的 locale 文件逐字一致 |

`locale/`、`docs/plugin-page.*.md`、`src/` 自 `390ab80`、`41dc6ed` 之后未再改动，所以 V3 证据对 HEAD 仍有效。

### R4 发布门 — PASS（附注）

| 子句 | 判定 | 证据 |
|---|---|---|
| `tests/check-release.spec.ts` 全绿 | PASS | 退出 0，17 passed |
| `tests/release-workflow.spec.ts` 全绿 | PASS | 退出 0，8 passed |
| `release.yml` 不含 `NPM_TOKEN` | PASS | `grep -n "NPM_TOKEN\|NODE_AUTH_TOKEN" .github/workflows/release.yml` 退出 1，无匹配；`ci.yml` 同样无匹配 |
| 两份工作流可被解析器实读 | PASS | 任务书给的 `node -e "require('yaml').parse(…)"` 对两份文件都退出 0 |
| 步骤顺序 | PASS | release.yml 共 16 步：checkout(`fetch-depth: 0`)、setup、install、typecheck、lint、test、i18n、build、装 npm 11、`--tag` 校验、pack、`--tarballs` 校验、GitHub Release、`npm publish`（`id: publish`）、诊断步。ci.yml 共 11 步，以 pack 与 `--tarballs` 校验收尾，无发布 |
| fresh clone 本地预演通过 | PASS | 我在 HEAD `a66ef5d` 上重做，八步退出码见第 5 节 |
| 诊断步语义 | PASS（有两处措辞偏差） | `if: failure() && steps.publish.outcome == 'failure'` 只在发布步失败时运行，与注释一致；`\|\| echo` 保证该步退出 0。按执行者存的 npm 源码副本，`oidc` 记录器的消息不含令牌值 |

附注：release.yml 与 ci.yml 的全量门里都有 `pnpm test`，所以 HEAD 上这两条工作流会在测试步失败。诊断步的两处措辞偏差见发现 F11。

### R5 上游对齐 — 部分受阻

| 子句 | 判定 | 证据 |
|---|---|---|
| `tests/peer-range.spec.ts` 全绿 | PASS | 退出 0，23 passed；含负控 |
| devDependencies 对齐有结论 | PASS（数字需勘正） | `@deepseek-ai/dsh-*` 开发依赖共 17 个，其中 **16 个**在 `0.2.2-rc.5`；`dsh-typert-protocol` 在依赖与开发依赖两处都是 `0.1.7-rc.2`；`@deepseek-ai/cordis` 4.1.0；`@deepseek-ai/schemastery` 开发依赖 3.19.0，运行时依赖范围 `>=3.18.4 <4` |
| 六个 peer 范围原文 | PASS | `dsh-agent`、`dsh-credentials`、`dsh-settings`、`dsh-system-prompt`、`dsh-tools`、`dsh-web` 六条完全相同：`>=0.1.5-rc.1 <0.1.8 \|\| 0.1.6-alpha.1 \|\| 0.1.6-alpha.2 \|\| 0.1.7-alpha.1 \|\| 0.1.7-alpha.2 \|\| 0.1.7-rc.1 \|\| 0.1.7-rc.2 \|\| 0.2.0-rc.1 \|\| 0.2.0-rc.2 \|\| 0.2.2-rc.5 \|\| >=0.2.0 <0.3.0`。另有 `@deepseek-ai/cordis` 为 `>=4.0.1-rc.1 <5` |
| 功能腿 F1–F4 | **BLOCKED** | 无任何工件；只在 plan 048「实测更正」第 6 条记为受阻，session 记录没有条目 |
| 带 key 的 e2e.real | **BLOCKED** | 17 条全部跳过 |
| 对齐清单「DSH 上游维度」留痕 | **BLOCKED** | 无留痕 |

受阻分支本身须在 2.5 经用户确认，目前未获答复。

### R6 rc.5 实测 — FAIL

| 条目 | 证据文件 | 结果 |
|---|---|---|
| V1 | `v1-dump-config.yml` | 通过 |
| V2 | `v2-plugins-list-on.txt`、`v2-detail-components-on.txt` | 前半句通过；后半句（详情页覆盖列表）在 rc.5 上不存在，已判废 |
| V3 | `v3-detail-zh.txt`、`v3-detail-en.txt` | 通过 |
| V4 | **无** | 只有证据索引里的一段叙述，没有快照文件 |
| V5 | `v5-plugins-list-off.txt`、`v5-dump-config-off.yml` | 通过 |
| V6 | `v6-dump-config-on.yml` | dump 与 V1 只差 `welcomeNoticeVersion` 用户项和一行注释（我亲跑 diff）；「官方卡再次隐藏」没有快照 |
| V7 | `v7-dump-seeded.yml`、`v7-dump-off-before-fix.yml`、`v7-dump-off-after-fix.yml`、`v7-official-page-before-fix.txt` | **失败** |
| V8、V10、V11 | **无** | 未执行 |

「证据归档在案」不成立：证据只在 `/tmp/dshws-s41/evidence/`，仓库内 `docs/sessions/audit-logs/` 下没有任何 rc.5 实测目录。V6 的「key、链序等设置保留」也没有被检验，实例里从未配置过 key 或链序（V4 记的是 4 张「未配置」成员卡）。

### R7 文档 — 部分不成立

| 子项 | 判定 | 证据 |
|---|---|---|
| `docs/release-runbook.md` 在盘、本地链接可解析 | PASS | 160 行；31 个改动文档共 69 条本地链接，断链 0（只验文件存在，未验锚点） |
| 手册命令与判据符合仓库现状 | PASS（缺口见 F10） | `scripts/check-release.mjs`、`scripts/pack.mjs` 在盘；`USER_AGENT` 在 `src/providers/shared.ts:117`，值为 `dsh-websearch/0.2.0`；`repository.url` 为 `git+https://github.com/GeerMrc/dsh-websearch.git`，与 P7 一致；`tests/user-agent.test.ts` 断言 `USER_AGENT` 等于 `dsh-websearch/${pkg.version}` |
| SOP §2 双语义判定 | PASS | `docs/upstream-sync-sop.md:48-53` |
| 六件套枚举统一 | PASS | §0 第 24 行与 §7 第 114 行列的是同六项 |
| 归档前脱敏 | PASS | 第 93 行，含 sed 命令与 `git grep` 复核 |
| `known-upstream-issues.md` 增 rc.5 行 | PASS | 问题 ① 的 rc.5 行（标明读源码、未实跑）；新增问题 ⑤、⑥ |
| `upgrade.md` §6 与 ADR-0026 决策 7、8 一致 | PASS | 只剩「不移动 tag、升补丁号重发」「dist-tag 被拒请用户处理」；「重推同 tag」与手工 `npm publish` 只作为已废止做法出现 |
| README 过期表述已勘正 | **FAIL** | 三处未改，见 F4 |
| ADR-0013、ADR-0023 的 Status 有勘正注 | PASS | 两份都有「前提勘正」注，分别指向 ADR-0024、ADR-0027 |

### R8 治理 — 部分不成立

| 子句 | 判定 | 证据 |
|---|---|---|
| session-41 记录十节齐全 | PASS（内容缺口见 F5） | 十节都在。占位的有「下一步」「下一 Session 启动指令」「踩坑 / 经验」「开发规范强化说明」，另有「进度」一行 |
| progress-M7 含 S41 台账 | PASS（仅骨架） | 第 677–682 行只有阶段 0 与阶段 2 两条，没有阶段 3 的任务表、债务变动和新增锚点 |
| progress-M7 含 S38–S40 补账 | PASS | 第 657–675 行 |
| STATUS 的 41 行与当前位置块 | PASS | 第 105 行 🚧；当前位置块是启动时刷新的版本 |
| STATUS 与 roadmap 收官状态一致 | PASS（都在进行中） | roadmap 第 72 行同为 🚧 |
| roadmap 含编号 42 的待执行行 | **FAIL** | 没有 42 行。session 记录写明「待用户确认 Session 42 拆分后再写入」 |

## 4. 提交卫生（`git log --stat 26b646e..HEAD`，22 个提交）

- **没有混入无关文件，也没有误提交的构建产物。** 没有任何提交带入 `lib/`、`dist-artifacts/` 或临时文件。`6beb37a` 改动的 13 个 `.log` 是有意做的脱敏。
- **`e95c729` 与 `6f2ce32` 提交了令牌值。** 两处的 `tests/check-release.spec.ts` 各有 3 行带值字面量；`3eebf97` 已改为插值。详见 F8。
- **提交说明与所改文件不符：**
  - `317ec74` 写「17 个升到 0.2.2-rc.5」，实际是 16 个。
  - `82b3a86` 写守卫测试「19 条」，该提交上是 20 条。
  - `e95c729` 没提它新增的 `scripts/check-release.d.mts`，session 记录的交付物表也没列。
- **`390ab80` 的说明「README 中英文勘正过期表述」只做到一半**，见 F4。
- **自 `82b3a86` 起的 9 个提交都建立在红的全量测试上。**
- `a66ef5d` 是对 `cdd2894` 漏改 session 记录的补提交，记录里如实写了这次失误。

## 5. 克隆预演与先红后绿抽样

### 全新克隆预演（HEAD `a66ef5d`）

| 步骤 | 命令 | 退出码 | 输出摘录 |
|---|---|---|---|
| 1 | `git clone --branch feat/s41-takeover-docsplit-oidc /Volumes/IPFSJK/Zcode/dsh-websearch /tmp/dshws-s41/stage4/clone` | 0 | 克隆 HEAD 为 `a66ef5d…` |
| 2 | `pnpm install --frozen-lockfile` | 0 | `Packages: +313`，`Lockfile is up to date, resolution step is skipped`，Done in 1.1s |
| 3 | `pnpm run build` | 0 | 三个产物，大小同主仓库 |
| 4 | `pnpm exec vitest run tests/check-release.spec.ts tests/package-meta.spec.ts tests/patch.test.ts tests/release-workflow.spec.ts` | 0 | 4 files，44 passed |
| 5 | `node scripts/pack.mjs` | 0 | 两个 tarball，各 12 个成员，成员列表相同 |
| 6 | `node scripts/check-release.mjs --tarballs dist-artifacts` | 0 | `check-release: ok` |
| 7 | `node scripts/check-release.mjs --tag v0.2.1` | **1**（预期） | `check-release: tag v0.2.1 does not name the package.json version (0.2.0); expected v<version> with a stable triple`，随后 `check-release: 1 problem(s)` |
| 8 | `git status --short` | 0 | 无输出 |

### 先红后绿抽样（都在克隆里做，做完已恢复，克隆与主仓库状态干净）

| 样本 | 红时的操作 | 红的结果 | 恢复后 |
|---|---|---|---|
| T11b | `git show 3eebf97:.github/workflows/release.yml > .github/workflows/release.yml`，跑 `tests/release-workflow.spec.ts` | 退出 1；1 failed / 7 passed；`expected undefined to be 'publish'` | `git checkout -- .github/workflows/release.yml` 后退出 0，8 passed |
| T5 | `git show 98fe583^:cordis.patch.yml > cordis.patch.yml`，跑 `tests/patch.test.ts` | 退出 1；2 failed / 8 passed；实得 `['web', 'web-search-deepseek']` | 恢复后退出 0，10 passed |
| T10 | 把 `scripts/check-release.mjs` 暂移出（其父提交没有这个文件），跑 `tests/check-release.spec.ts` | 退出 1；`Cannot find module '../scripts/check-release.mjs'` | 移回后退出 0，17 passed |

三组都与 session 记录写的红、绿一致。

### 全量测试红的引入提交

只跑两个失败文件：

| 客户端入口取自 | 结果 |
|---|---|
| `26b646e`（基线） | 18 passed，退出 0 |
| `82b3a86`（T8 首版） | 2 failed，`TypeError: ctx.get is not a function`，退出 1 |
| `41dc6ed`（T8 修正） | 2 failed，`TypeError: ctx.inject is not a function`，退出 1 |
| HEAD `a66ef5d` | 同上 |

结论：T8 首版就打红了，T8 修正只是换了报错文字。克隆里的全量测试也是 2 failed / 701 passed / 17 skipped (720)。

### 令牌字面量扫描

- `grep -nE 'token=[A-Za-z0-9._~+/=-]{8,}' tests/check-release.spec.ts || echo none` 输出 `none`。
- HEAD 的被跟踪文件里匹配数为 0。
- `e95c729` 与 `6f2ce32` 各有 3 行匹配（只数行，未打印值）。

## 6. 发现清单

每条标注「复发」或「新」。复发是指命中 `docs/dont-do.md` 或 session-governance `pitfalls.md` 的既有条目。

### 必改

**F1 全量测试在 HEAD 上是红的。复发**（pitfalls「不要批量写完再测」，该条要求提交前全绿）。
- 位置：`tests/client/fetch-view.spec.tsx:128-146`、`tests/client/toolview.spec.tsx:182-200` 的 ctx 桩。
- 现象：见第 2 节。`82b3a86` 起 9 个提交没有跑过全量测试，记录里每个任务的「绿」都只是子集。阶段 3 之后唯一一次全量是 T4（01:46）。
- 修法：两个桩补 `inject: vi.fn(() => ({ dispose: () => {} }))`，与 `tests/client/entry.spec.tsx:60` 一致；重跑全量并记录；在 session 记录里加勘正。

**F2 交还在 rc.5 上不成立，R2 与 R6 无法记 PASS。新（技术路线被实测推翻，执行者已如实披露）。**
- 位置：R2 的 V7、V10、V11；R6 的 V7、V8、V10、V11。
- 现象：V7 失败，四个条目未执行。plan 048 自己规定「改变验收结果的条目须回 2.5 确认，确认前不记 PASS」，而 2.5 仍未获答复。
- 修法：等用户在交还路线与受阻分支例外上裁决。裁决前阶段 4 只能判未通过。

**F3 用户文档对交还的描述不完整，且清理方法没有证据。复发**（dont-do「计划项执行纪律：不要静默丢弃计划条目」）。
- 位置：`docs/plugin-page.zh.md:36-40`，英文版对应行。
- 现象有四点：
  - 没写命令行与手改向量不触发交还。ADR-0024 决策 8 声称用户文档已写，并以删 `cordis.patch.yml` 的两个键为清理方法，文档里没有。
  - 「重新选一个提供方即可」没有实测。现有证据 `v7-official-page-before-fix.txt` 显示的是保存按钮 disabled。
  - 「开关是唯一的关闭入口」不准确。`v2-detail-components-on.txt` 显示详情页「包含的组件」里还有第二个开关（`启用组件 dsh-websearch`）。
  - locale 描述写「关闭即自动交还官方」（`locale/zh.json`），与同一页面的「一处例外」以及 README 的「没有可用通道」相反。
- 修法：补齐无通道向量的限制与删键方法；把「重新选提供方」实测一次，否则标为未验证；改掉「唯一」；描述随路线裁决改写。

**F4 README 过期表述只清了一部分，中英文镜像错位。复发**（同上条 dont-do）。
- 位置与现象：
  - `README.md:66` 仍是「卸载自动复原宿主默认」，没有用户层钉值的例外。`README.en.md:67` 已改。
  - `README.md:173` 仍是「预发布版本不在插件兼容域时被 peer 门拦下」。阶段 0 审核 🟡-2 点名这一句（当时行号 171）交给 T9 修正，原样未动，也没有改判痕迹。
  - `README.en.md:41` 没有隐藏官方页与例外的说明，而 `README.md:41` 已改。
- 修法：三处对齐。中文是事实正本，先改中文。

**F5 session 记录的内容缺口与数字错误。复发**（pitfalls「不要对验收数字做算术外推」「不要让『现在到哪』依赖多源拼图」；dont-do「计划项执行纪律」）。
- 位置：`docs/sessions/2026-11-23-session-41.md`。
- 现象：
  - 没有 T12 的状态条目。V7 修复后仍失败、V8、V10、V11 未执行、功能腿受阻，这些只写在 plan 048 的「实测更正」节；`V8` 在记录里一次都没出现。
  - 「当前项目状态快照」写「阻塞项：无」，而同一记录的「未完成 / 遗留」列着五项待用户答复。
  - T4 写「17 个升到 rc.5」，实际 16 个。
  - T8 写「守卫 19、入口 7、交还 14，共 40」，执行者自己的 `t8-green.log` 是 20、6、14。T8 修正写「18、7、14，共 39」，`t8b-green.log` 是 19、6、14。
- 修法：补 T12 条目；改「阻塞项」；逐个数字按日志勘正。

**F6 roadmap 没有编号 42 行，R8 子句不成立。新（已披露，非静默）。**
- 位置：`docs/session-roadmap.md` 第 72 行之后。
- 现象：执行者以「待用户确认 Session 42 拆分」为由没写。
- 修法：用户确认后按 plan 048 给定的文本写入。

**F7 T12 证据没有归档入库。新。**
- 位置：计划指定的 `docs/sessions/audit-logs/2026-11-23-s41-rc5-live/` 不存在。
- 现象：全部证据只在 `/tmp`。R6 的「归档在案」目前不成立。
- 修法：阶段 6 收官前归档。`evidence/` 目录我扫过，令牌值匹配为 0，可以直接归档。但 `rc5-web.log` 与 `rc5-web-nohmr.log` 各有一行带令牌值，若要一并归档，先按 SOP 第 93 行脱敏。

### 建议

**F8 历史提交里的令牌值与仍在运行的实例是同一个。复发**（SOP §4「归档前脱敏」；这是该规则记录的四批之后的第五次；执行者已披露）。
- 现象：哈希比对显示 `e95c729` 里两个令牌值之一，与 `rc5-web.log` 里的进程令牌相同（sha256 前缀 `8ad9d70032`）。3434 端口此刻仍有监听进程（pid 95257）。记录说「实例停止即失效」，但实例还没停。
- 修法：推送前由用户或执行者停掉 scratch 实例，或在 token 历史的裁决里把这一点算进去。

**F9 `scripts/check-release.mjs` 有两处弱点。新。**
- 非 git 目录里令牌扫描会静默放行。我在 `/tmp/dshws-s41/stage4/` 下用合成的带值行实测：没有 `.git` 时输出 `check-release: ok`、退出 0；同一目录 `git init` 并提交后退出 1。原因是 `git grep` 的退出 1 与 128 没有区分。
- 扫描命中时会把整行连同令牌值逐字打印到 CI 日志。
- 修法：区分 git 的退出码，非 1 一律报错；只打印 `文件:行号`。

**F10 发布手册的缺口。新。**
- `docs/release-runbook.md:85`：草稿 PR 预演只是一行注释，没有命令、判据和 ★ 标记。照着代码块执行会整步跳过，而它是 R9 的前置。
- 没有提醒 `pack.mjs` 会写当前检出的 `dist-artifacts/`，预演应放在单独克隆里做。
- 本机 npm 是 10.9.8，流水线打包用的是 npm 11，本地与 CI 的 tarball 不是同一套工具产出。
- 修法：补 `git push -u origin <feat>` 与 `gh pr create --draft` 及「CI 两个 node 版本全绿」的判据；加一条克隆提醒。须在 Session 42 启动前处理。

**F11 `release.yml` 诊断步的注释不够准确。新。**
- 第 70–74 行说失败原因「只在 verbose 级」。按 npm 源码副本，两条「Skipped because …」是 `silly` 级。grep 的正则两者都覆盖，行为没问题。
- 若错误的调用栈经过名为 `oidc` 的函数，`verbose stack` 行也会被打印。不含凭据，但与「只打印 oidc 记录器的行」不完全相符。

**F12 README 里两处说法缺证据。新。**
- `README.md:177` 把逃生口写成可用的做法，而 ADR-0024 写明「逃生口未实测」（V11 未执行）。
- `README.md:41` 写「`plugin remove` 单命令复原…官方设置页随之恢复」。命令行向量在 rc.5 上没有卸载后的 dump。

**F13 源码注释把客户端通道说成可用。新。**
- 位置：`src/client/index.ts:50-53`、`src/client/handover-watch.ts:4-10`。
- 现象：注释称它是「无 HMR 宿主上的唯一通道」。执行者自己的结论是没有已知宿主属于这种形态，且该形态下设置保存同样失败。
- 修法：随路线裁决，要么撤掉 T6、T8，要么改注释。

**F14 ADR-0026 与 ADR-0027 的 Status 过期。新。**
- 两份都还写「决策正文尚未据以执行」，而 T3、T9、T10、T11、T11b、T13 已经落地。真实发布还没发生，应改成这一句。

**F15 rc.5 被写成「已演练」，功能腿却没做。复发**（dont-do「上游适配验证纪律：不要只测 happy-path 就宣布适配完成」）。**
- 位置：`README.md:26`、`tests/peer-range.spec.ts:26`、`known-upstream-issues.md` 问题 ③。
- 修法：F1–F4 与对齐清单补齐之前，把 rc.5 标为「已做环境与交还实测，功能腿待做」。

**F16 详情页的组件开关可能造成无解状态，未实测。新。**
- 推断：若用户关的是「启用组件 dsh-websearch」而不是 bundle 开关，bundle 层仍在。`web` 仍钉着已不存在的提供方，官方页仍被隐藏。接管行让这个状态从「有官方页可自救」变成「没有任何可见入口」。
- 修法：补一格探针。若成立，用户文档要写明只能用 bundle 开关。

**F17 T5p 证据链有缺口。新。**
- 客户端读数、命令行卸载后的 dump、47 毫秒时序都没有原始文件。
- 「dispose 处理器不触发」只靠日志里缺一行。
- 探针源码没有归档。
- 修法：归档浏览器侧日志与卸载后的 dump，留一份探针源码到证据目录。

**F18 V4 没有证据文件。新。**
- 证据索引把 V4 记为 PASS，细节具体，但目录里没有对应快照。V3 基线与 V6 的界面半句同样只有叙述。
- 修法：阶段 5 冒烟时补快照。

**F19 测试的弱项。新。**
- 「两份用户文档结构对齐」只比标题级别。
- `check-release.mjs` 的「tag 不存在」分支没有任何测试覆盖。
- `release-workflow.spec.ts` 的用例 4 标题说「先于一致性校验」，断言只比到发布步。
- 没有发现名义上存在却不断言任何东西的测试。

**F20 SOP 的两处小问题。复发**（pitfalls「不要跨载体誊写同一基线数字」）。
- `docs/upstream-sync-sop.md:91` 硬编码「607 套件」，现在是 720。
- §0 总览第 14 行仍是单语义判定，与 §2 的双语义不一致。

**F21 STATUS 没有反映阶段 3 新增的阻塞。复发**（pitfalls「不要让『现在到哪』依赖多源拼图」）。**
- 「活跃债务」只写了阶段 0 的十项。
- 没写交还路线待裁决、功能腿受阻、令牌历史。
- 没写 OIDC 首发窗：npm 文档确认新配置须在 2 天内完成首次发布，过期只能删除重建。plan 记的到期日是 2026-11-25，而发布已经顺延。

**F22 `known-upstream-issues.md` 问题 ⑤ 的「两卡并存」在 rc.5 上没有直接观测。新。**
- 表格行写「实测」，实测的只是钉值残留。「两卡并存」来自读源码，应照问题 ① 的写法标明。

**F23 执行者的「全新克隆重做预演」名不副实。新。**
- `fresh-clone-rehearsal.log` 第一行是「clone moved to 3eebf97」，安装步输出「Already up to date」，是同一目录换了提交。
- 预演做在 `3eebf97`，此后 T11b 又改过 `release.yml`。我的 HEAD 预演已补上。

### 已验锚点台账需更新的行（`docs/progress/progress-M7.md`，我没有改这个文件）

| 行 | 登记内容 | 自登记以来是否变更 | 需要怎么更新 |
|---|---|---|---|
| 671 | `docs/desktop-adoption.md`，提交 `ede714d` | 已变（`b88e46b`、`cdd2894`） | 改指 `cdd2894`，或注明 S41 修订后待重验 |
| 672 | `docs/upstream-sync-sop.md`，提交 `ede714d`，「待阶段 4 重验」 | 已变（`b88e46b`） | 填入本次重验结果：§2、六件套、脱敏三项成立，残留见 F20 |
| 673 | ADR-0023，提交 `65a4479` | 未变 | 不用改，可继续引用 |
| 674 | `known-upstream-issues.md`、`dont-do.md`，提交 `ede714d` | 前者已变两次；后者未变 | 拆成两行，前者改指 `cdd2894` |
| 675 | 五个产品文件「基线 `26b646e` 时零 diff」 | `release.yml`、`ci.yml`、`cordis.patch.yml` 已变；`pack.mjs`、`src/index.ts` 未变 | 「零 diff」不再成立，分别改指 `2b74865`、`6f2ce32`、`98fe583` |
| 677–682 | S41 台账 | 只有阶段 0 与阶段 2 | 补阶段 3 状态与本次阶段 4 的数字：701 通过 / 2 失败 / 17 跳过 (720)，tsc 0，lint 0 警告 0 错误，i18n 179 键，build 通过 |

旧台账里 S09 时代的源码锚点文件在 S41 内都没动，可以引用。行号是否还对得上我没有核。

## 7. 总体结论

**NEEDS REVISION。**

| 条目 | 判定 |
|---|---|
| R1 | PASS |
| R2 | FAIL |
| R3 | PASS |
| R4 | PASS（HEAD 上工作流会因 F1 在测试步失败） |
| R5 | 部分：契约测试与依赖对齐通过，功能腿受阻 |
| R6 | FAIL |
| R7 | 部分：README 勘正未完成 |
| R8 | 部分：roadmap 缺 42 行 |

必改项：

1. **F1** 修好两个测试桩，HEAD 全量测试回到全绿。
2. **F2** 交还路线与受阻分支例外须经用户在 2.5 裁决；R2、R6 在此之前不能记 PASS。
3. **F3** 补齐用户文档里交还的限制与清理方法，更正「唯一的关闭入口」。
4. **F4** 清掉 README 三处过期表述（`README.md:66`、`:173`，`README.en.md:41`）。
5. **F5** session 记录补 T12 状态、改「阻塞项」、勘正四个数字。
6. **F6** 用户确认后写入 roadmap 编号 42 行。
7. **F7** 阶段 6 收官前把 T12 证据脱敏归档入库。

F8 建议在推送之前处理。
