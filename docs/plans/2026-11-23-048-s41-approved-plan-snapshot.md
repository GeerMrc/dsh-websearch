# Plan 048 附件 — 用户批准的计划原文（阶段 2.5 批准正本）

> 批准时点：2026-11-23，经 ZCode 计划审批流（ExitPlanMode）由用户批准。
> 本文件是提交审批的计划原文逐字存档，不随后续修订改动；plan 正本
> `2026-11-23-048-s41-takeover-docsplit-oidc-plan.md` 相对本文件的差异须在 session-41 记录留痕。
> 计划批准前，用户对三项澄清问题的答复：
>
> 1. npm Trusted Publisher：「已保存，今天刚建」（2026-11-23 创建；npm 文档要求 2 天内完成首次发布）。
> 2. 桌面端实测范围：「Scratch 通过后装入本机」——3434 scratch 全绿后，经用户届时明确指令，备份
>    desktop profile 三件套，用 app 内置命令装入候选包，重启 app 实测开关往返，通过后才推 tag 发布。
> 3. devDependencies 对齐：「对齐，带 go/no-go 门」——全绿，或修复不超过 5 个文件且无行为变更则并入，
>    否则回退并带证据登记债务。

---

# S41 计划：dsh-websearch v0.2.1（接管官方「网页搜索与获取」、插件页文档分离、OIDC 发布自动化）

## Context

你本机的 DSH 桌面端是 0.2.2-rc.5，插件 dsh-websearch 仍是 npm 上的 v0.2.0。本轮（仓库治理的 Session 41）解决三件事：

1. 官方「网页搜索与获取」与本插件在插件页并存，容易误导用户。官方没有专门的接管 API。dsh-subagent-plus 隐藏「子智能体」的做法只有一处：随包 `cordis.patch.yml` 禁用官方设置页所在的行（`- id: ui-settings-subagent` / `disabled: true`）。关闭 bundle 即整层移除，官方页自动恢复。
2. 插件详情页渲染的是仓库 README（开发文档）。DSH 取文档的顺序是 `locale/<语言>.json` 的 `meta.detail`，其次是包内 README；它不读取 `README.zh.md` / `README.en.md`。本插件没有 `locale/`，所以落到 README。
3. `release.yml` 仍用 `NPM_TOKEN` 发布，且没有 tag、package.json、CHANGELOG 之间的一致性校验。

计划依据的已核实事实：

- 「网页搜索与获取」卡片来自行 `ui-settings-web-search`，rc.2 与 rc.5 同名。rc.5 起该卡片改为依赖 `web` 命名空间，所以现有做法（禁用 `web-search-deepseek`）不再能隐藏它。
- 现有 patch 已把 `web` 行钉为 `searchProvider: dshws-chain` / `fetchProvider: dshws-fetch-gate`，并禁用 `web-search-deepseek`。你的 desktop profile 用户层没有 `web` 覆盖，关闭插件后配置会自动回到官方默认值。
- 残留风险：若有人在官方页把提供方存成 `dshws-*`，该值写进用户层，优先级高于 bundle 层。关闭插件后它成为悬空引用，`web_search` 每次报 `WEB_PROVIDER_CONFIGURED_MISSING`，官方页只显示「（未加载）」，不回退。
- `settings.mutate` 的 `unset` 在基础层有值时等于「设回继承值」。只有整个结果与继承配置深度相等时，配置编辑器才删掉用户层的 `config`（`packages/boot/config-editor/src/index.ts:120-126`）。交还必须对两个键一起做，否则留下半截覆盖，rc.5 下抓取会报 `WEB_PROVIDER_AMBIGUOUS`。
- 宿主兼容门用 `includePrerelease: true` 判断（`packages/boot/app-boot/src/plugin-compatibility.ts:77`），所以 rc.5 不在显式钉域内也能运行。
- npm 官方文档：新建 Trusted Publisher 须在 2 天内完成首次成功发布，否则过期重建。你今天已创建，截止约 2026-11-25。
- dsh-websearch 本地 `master` 比 `origin/master` 多 11 个未推送的 S40 文档提交，发版推送时会一并带上。
- 本地 DSH 源码树是 0.2.0-rc.2，早于已安装的 rc.5。机制是按上游 tag `dsh-v0.2.2-rc.5` 核对的，本地树只用作源码阅读参考。

## 设计决策

- **接管**：只在 bundle patch 追加一行 `- id: ui-settings-web-search` / `disabled: true`（不带 `name` 守卫，沿用现有规则）。运行时行一律不动：`web`、`web-fetch-http`、`web-deepseek-api`、`tool-web` 和各预设行保持原样，它们是关闭插件后官方提供方能立即接管的前提。逃生口：用户层写 `{id: ui-settings-web-search, disabled: false}` 可强制显示官方页。
- **交还守卫（关闭时）**：仅当 `web` 命名空间用户层的 `searchProvider` / `fetchProvider` 是 `dshws-*` 时，把这两个键一起 unset。官方 id 和第三方 id 的钉死值永不触碰。两条通道：HMR 宿主走插件 dispose；桌面端无 HMR，走客户端 `plugin-manager/changed` 监听，与 dsh-mm-resilience 的 P4 模式一致。全程 warn-only，任何失败不影响开关与启动。旧宿主上 `web` 字段不是 volatile，守卫退化为空操作。被交还的钉死值不做恢复，重新启用后回到默认链，文档明示。
- **文档分离**：新增 `locale/zh.json`、`locale/en.json`（`meta.title` / `meta.description` / `meta.detail`）和用户文档 `docs/plugin-page.zh.md`、`docs/plugin-page.en.md`。README 保留为开发、安装、验收文档，顶部声明分工。`files` 逐文件列出两份用户文档，不整目录发布 `docs/`（内含 373 份内部治理文件）。
- **发布**：`release.yml` 改为 OIDC（`id-token: write`，去掉 `NPM_TOKEN`，npm 11，`--provenance`）。发布前跑完整门和一致性校验 `scripts/check-release.mjs`：tag 等于 package.json 版本；CHANGELOG 有该版本条目；`USER_AGENT` 等于 `dsh-websearch/<版本>`；tag 提交在 master 上；两个 tarball 含全部必需文件且不含内部文档。推送用 `git push --atomic origin master v0.2.1`，master、远端 tag、npm 版本一次成形。
- **上游对齐**：按你的选择，显式追加已演练的 `0.2.2-rc.5` 到六个 peer 范围，并带 go/no-go 门对齐 devDependencies。
- **版本**：v0.2.1（补丁号）。版本号、tag、CHANGELOG 条目只在你最终确认代码审核后动。

## 审批与流程的对应

你批准本计划即批准范围与技术路线。之后按仓库 `.session-start` 的六阶段推进：先由独立 Agent 做前序审核（T0）和计划审核（T2）。这两步如果出现阻塞级债务、范围或验收标准变化，我带差异回来请你确认；否则按计划自主执行到 T16 并停下，等你做最终代码审核。

## 任务清单（串行执行；核心逻辑先写测试证红再转绿；每项一提交）

| ID | 任务 | 验收证据 |
|---|---|---|
| T0 | 阶段 0：独立 Agent 审核 S40 交付与债务。阻塞级先修，应清级先于新任务 | `docs/sessions/audit-logs/2026-11-23-s41-stage0-audit-of-s40.md`：实测 git 状态、基线数字、semver 双语义矩阵（含负控）、SOP 三线监测 |
| T1 | 阶段 1：落盘 plan 048、ADR-0024（接管与交还）、ADR-0025（显示元信息与文档分离）、ADR-0026（OIDC 与一致性门）、roadmap S41 行、STATUS 行 | 文件存在，互相引用一致 |
| T2 | 阶段 2：独立 Agent 审核计划 | APPROVED |
| T3 | peer 范围追加 `0.2.2-rc.5`；新增 `tests/peer-range.spec.ts`；勘正 README L45 与 AGENTS.md L35 的过期范围 | 新测试先红后绿；两处范围与 README L24 一致 |
| T4 | devDeps 对齐 0.2.2-rc.5。go/no-go：全绿，或修复不超过 5 个文件且无行为变更则并入，否则回退并带证据登记债务。运行时依赖 `dsh-typert-protocol` 维持现钉 | typecheck、lint、test 全绿，或带证据的回退记录 |
| T5 | `cordis.patch.yml` 追加禁用行与头注释；扩展 `tests/patch.test.ts`，加「运行时行永不禁用」负向断言，更新 rc.2 时代的过期注释 | 新断言先红后绿 |
| T6 | `src/handover.ts`：`planHandoverOps`、`revertHandover` | `tests/handover.spec.ts` 先红后绿：dshws 搜索钉、抓取钉、双钉、官方 id 保留、第三方 id 保留、空用户层 |
| T7 | 宿主通道：在 `apply` 中经可选的 `settings` 注入注册 dispose 钩子；`inject` 保持 `['web','credentials']` | `tests/handover-host.spec.ts`：dispose 触发一次 `mutate`；无钉不调用；抛错被吞并告警；无 settings 服务时空操作 |
| T8 | 客户端通道：`src/client/handover-watch.ts` 监听 `plugin-manager/changed`，兼容裸名与 scoped 名，冲突时重读重试一次 | `tests/client/handover-watch.spec.tsx` 先红后绿 |
| T9 | 文档分离：`locale/zh.json`、`locale/en.json`、`docs/plugin-page.{zh,en}.md`；`package.json` 的 `exports` 与 `files`；README 中英文分工声明与勘正 | `tests/package-meta.spec.ts` 先红后绿：元信息非空、detail 路径合法、文件存在、已入 `files`、已导出 |
| T10 | `scripts/check-release.mjs` 与 `pnpm run check:release` | `tests/check-release.spec.ts` 先红后绿 |
| T11 | `release.yml` 改 OIDC 并加全量门；`ci.yml` 增加打包完整性检查 | 两个工作流经 YAML 解析器实读；步骤顺序与本文一致 |
| T12 | rc.5 实测（下方 V1–V10） | 截图与 dump 输出归档到 `audit-logs/2026-11-23-s41-rc5-live/` |
| T13 | 文档：`docs/release-runbook.md`、`docs/upstream-sync-sop.md`、`docs/known-upstream-issues.md`、架构注记 | 交叉链接无断链 |
| T14 | 阶段 4：独立 Agent 逐条核验并跑一次全量测试 | 逐任务 PASS；报告含命令原文与实测数字 |
| T15 | 阶段 5：独立 Agent 做安全、契约、前瞻三维追问与用户路径冒烟 | COMPLETE |
| T16 | 阶段 6：session 记录、progress、STATUS 与 roadmap 收尾、dont-do 沉淀、接力指令；状态为「候令：版本号变更与发布」 | 六件套齐全 |
| T17 | 你确认代码审核后：版本号改 0.2.1、`USER_AGENT`、CHANGELOG 条目；本地跑 `check-release --tag v0.2.1` 与全量门 | `tests/user-agent.test.ts` 先红后绿；门全绿 |
| T18 | 发布序列（见下，每步单独请你确认） | npm 上 0.2.1 可查且带 provenance |

T9 的用户文档结构（对齐 dsh-subagent-plus）：一句话定位；「它做什么」（成员表：Tavily、Exa、Firecrawl、AnySearch、DeepSeek）；「设置项」（位置：设置里的「网页搜索」节；key、链序、web_fetch 接管开关、DNS 韧性）；「接管与交还」；「关闭插件」；「兼容性」；指向 GitHub README 的开发文档链接。标题用包名 `dsh-websearch`；中文描述拟为「多源统一网页搜索与抓取：可配置优先级链、全链路高可用降级、多 API key 池；启用即接管官方「网页搜索与获取」，关闭即自动交还官方。」

## rc.5 实测（T12）

环境：临时 home `/tmp/dshws-s41/home-rc5`，端口 3434，profile `web`，不接触 `~/.dsh`。首选直接用桌面 app 内置命令（`/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh`）配临时 `DSH_HOME` 启动，跑的是与你机器上相同的 rc.5 运行时；输出重定向到文件，不经管道。如果它不能启动 web 形态，退回 SOP 做法：从 tag `dsh-v0.2.2-rc.5` 建 worktree 构建后启动。

- V1 `--dump-config`：`web` 行为两个 dshws 钉值；`ui-settings-web-search` 与 `web-search-deepseek` 为 disabled；`web-fetch-http`、`web-deepseek-api` 仍启用。
- V2 插件页：「内置插件配置」不再有「网页搜索与获取」；dsh-websearch 详情的覆盖列表含 `ui-settings-web-search`。
- V3 详情页：中文界面显示中文标题、描述和 `plugin-page.zh.md`；英文界面显示英文版；不再渲染 README。
- V4 设置里的「网页搜索」节照常渲染（回归）。
- V5 关闭插件：官方卡片回来，`web` 配置回到官方默认值。
- V6 重新启用：接管恢复，key、链序等设置保留。
- V7 预置一个用户层 `dshws-*` 钉值后关闭插件：该 `web` 覆盖整行消失（直接检查 `cordis.patch.yml`）。
- V8 用户层钉的是官方 id 时，关闭插件后该值保留。
- V9 全量测试与 loopback e2e 全绿，数字为实测。
- V10 HMR 形态下带预置钉值关闭插件，过程无崩溃、无卡死。若 dispose 通道在此被证明不安全或无效，把它降级为告警式空操作，并在 ADR-0024 记录限制。

## 发布序列（T18，每步先问你）

1. 装入本机桌面端实测：备份 `~/.dsh/profiles/desktop` 的 `package.json`、`cordis.patch.yml`、`pnpm-lock.yaml`；用 app 内置命令装入候选 tarball；重启 app；验证 V2、V5、V7 在桌面形态下成立（关闭后提示需重启，重启后生效）。
2. 合并到 `master`，执行 `git push --atomic origin master v0.2.1`（带注解 tag，连同 11 个 S40 提交）。网络不通时需要你的隧道。
3. Release 工作流跑全量门与一致性校验后发布；我核对 `npm view @maricgeer/dsh-websearch@0.2.1` 与 GitHub Release。
4. 可选：桌面端改用 npm 包名重装，清掉 S40 留下的「钉本地 tgz」债务。

回退：推 tag 之前任一步失败则不推。tag 推送后发布失败时不移动 tag，修复后以 0.2.2 重发。npm 的「Allow npm dist-tag」未勾选：若首次发布因此被拒，我停下来请你在 npm 设置里处理，不改用 token。

## 高危动作预告

- 推送与发布：`git push --atomic origin master v0.2.1`、GitHub Release、npm 发布。
- 仓库外写入：`/tmp/dshws-s41/`、可能的 harness worktree、备份副本。
- 生产 profile：`~/.dsh/profiles/desktop` 的备份、安装与 app 重启，仅在你届时明确指令后执行。
- 不涉及：删除依赖、改系统配置、读取或写入凭据明文。

## 明确不做（登记为可延后项）

插件图标；详情页「已接管」徽标；交还后恢复原钉死值；npm 分阶段发布；Windows 桌面形态；rc.5 线的 fork 守卫重放（除非 T0 监测显示它阻塞）。
