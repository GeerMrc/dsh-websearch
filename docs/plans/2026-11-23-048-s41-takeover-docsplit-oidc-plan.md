# Plan — 2026-11-23-048 S41 接管官方「网页搜索与获取」+ 插件页文档分离 + OIDC 发布自动化（v0.2.1）

> 计划来源：用户 2026-11-23 指令（三项工作重心）+ S41 阶段 0 独立审核的吸收项。用户于 2026-11-23
> 经计划审批批准范围与技术路线（批准原文：`2026-11-23-048-s41-approved-plan-snapshot.md`）。
> 本版为阶段 2 第 1 轮审核（NEEDS REVISION）后的修订版；相对批准原文的全部差异登记在
>「与批准原文的差异」节，其中改变验收标准或范围的项目已回 2.5 请用户确认。

## 目标

1. 启用 dsh-websearch 即隐藏官方「网页搜索与获取」设置页；关闭即自动交还官方，并清除指向
   `dshws-*` 的用户层钉值，使关闭后官方提供方立即可用。
2. 插件页显示本地化标题、描述与用户文档；README 回归开发、安装、验收文档。
3. 发布链改为 OIDC trusted publishing，并加 tag、package.json、CHANGELOG、UA 一致性门。
4. 完成上游 0.2.2-rc.5 对齐：peer 显式钉、devDependencies 对齐，以及在 rc.5 宿主上的功能演练。

## 背景与已确立事实

计划期调研证据。harness 行号除注明外均为本地树 `9370b2f7f9`（0.2.0-rc.2 线）；标 rc.5 的行号按 tag
`dsh-v0.2.2-rc.5` 直读上游文件。

- 「网页搜索与获取」卡片来自行 `ui-settings-web-search`：`packages/bundle/web-app/cordis.patch.yml:417-418`；
  rc.5 在 `:484-485`。该行在 0.1.7-rc.2 至 0.2.2-rc.5 各 tag 均存在。
- rc.5 该卡片依赖 `web` 命名空间（rc.5 `packages/client/ui-settings-web-search/src/client/index.ts:43,72`），
  所以 ADR-0013 决策 7「禁用 `web-search-deepseek` 即隐藏卡片」在 rc.5 失效，两张卡并存。
- 参考实现：已安装 dsh-subagent-plus 的 `cordis.patch.yml:11-16` 只禁用 `ui-settings-subagent` 一行；
  测试 `tests/takeover-patch.spec.ts:12-31`（源 `/Volumes/IPFSJK/Zcode/dsh-subagent-model-pin/`）。
- 插件页文档顺序：locale `meta.detail`，其次包内 README；不读 `README.zh.md` / `README.en.md`
  （`packages/util/plugin-detail/README.md`，rc.5）。读取器 `packages/boot/app-boot/src/package-meta.ts:148-172`。
- `settings.mutate` 的 `unset` 在基础层有值时等于设回继承值（`packages/settings/settings/src/index.ts:367-375`）；
  整个结果与继承配置深度相等时编辑器才删用户层 `config`（`packages/boot/config-editor/src/index.ts:120-126`）。
  rc.5 `web` 的 Config 只有 `searchProvider`、`fetchProvider` 两个 volatile 字段，两键同清后整行删除成立。
- 有 hmr 服务时，配置编辑器的 `edit()` 经 `hmr.runExclusive` 执行（rc.5 `packages/boot/config-editor/src/index.ts:151-152`）；
  `runExclusive` 在已有事务内直接拒绝「HMR transactions cannot be nested」（rc.5 `packages/boot/hmr/src/index.ts:269`）；
  插件页开关本身跑在 `runExclusive` 内（rc.5 `packages/boot/plugin-manager/src/index.ts:1312-1315`）。
  因此在启用 HMR 的形态下，插件 dispose 钩子里调用 `settings.mutate` 会被拒绝。
- CLI 或手改触发的重组不发 `plugin-manager/changed`（rc.5 `packages/boot/plugin-manager/README.md:68`）；
  无 hmr 服务时开关结果是 `restart-required`，fiber 不卸载（rc.5 `packages/boot/plugin-manager/src/index.ts:1381`）。
- 宿主兼容门用 `includePrerelease: true`（`packages/boot/app-boot/src/plugin-compatibility.ts:77`）。
  双语义矩阵与上游三线监测的原始数字见 `docs/sessions/audit-logs/2026-11-23-s41-stage0-audit-of-s40.md`。
- npm trusted publishing 要求 npm ≥ 11.5.1、`id-token: write`、`repository.url` 与仓库一致，新建配置须在
  2 天内完成首次发布：https://docs.npmjs.com/trusted-publishers 。dist-tag 的 OIDC 支持要求 npm ≥ 11.21.0。
- actions/checkout 默认 `fetch-depth: 1`，runner 上没有 master 引用。
- 现状：`cordis.patch.yml` 已钉 `web` 行并禁用 `web-search-deepseek`；`tests/patch.test.ts` 锁定 patch 内容；
  `.github/workflows/release.yml` 仍用 `NPM_TOKEN`；`ci.yml` 只在 master 推送与 PR 触发；`scripts/pack.mjs`
  产出双名 tarball；`CHANGELOG.md` 以日期二级标题组织，历史条目里已有不带 `v` 的「0.2.1」字样；
  `docs/upgrade.md:90-92` 仍写「修复后重推同 tag」与手工 `npm publish`。
- 本地 DSH 源码树早于已安装的 rc.5，仅作源码阅读参考。
- 本地 `master` 比 `origin/master` 多 11 个未推送的 S40 文档提交，发版推送时会一并带上；其中自 `ede714d`
  起的提交树曾含 4 行带值的 host token，当前树已遮蔽，历史提交对象未改写。

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 前置 |
|---|---|---|---|
| T0 | 阶段 0：独立 Agent 审核 S40；audit-log 落盘；归档证据中的 token 值前向遮蔽 | audit-log 含参数头与输出原文；`git grep -nE 'token=[A-Za-z0-9._~+/=-]{8,}'` 计数为 0 | 无 |
| T1 | 阶段 1：本 plan、ADR-0024 至 0027、roadmap S41 行、STATUS 行与当前位置块 | 文件在盘且互引一致 | T0 |
| T2 | 阶段 2：独立 Agent 审核计划，修订后复审至 APPROVED | APPROVED | T1 |
| T2b | 应清级文档债清理批（新任务开工前）：S40 记录勘注；S40 阶段 4/5 记录溯源补记；progress-M7 补 S38–S40 账并登记阶段 0 已验锚点；SOP 六件套枚举统一、§2 双语义判定、监测辅线改读远端、归档前脱敏；desktop-adoption 版本表与 known-upstream-issues 现势更新；roadmap 增编号 42 行 | 每项有文件与位置；progress 在阶段 4 之前可被引用 | T2 |
| T3 | peer 范围追加 `0.2.2-rc.5`；加 devDependency `semver@7.8.5`；`tests/peer-range.spec.ts` 分三类断言（已演练版本两种语义均真；未演练的 0.2.x 预发布默认语义假、宿主门语义真；窗口外版本两种语义均假）；勘正五处 peer 表述（README.md:24、:45，README.en.md:24、:46，AGENTS.md:35） | 新测试先红后绿；五处范围与 `package.json` 一致 | T2b |
| T4 | devDependencies 对齐 0.2.2-rc.5。判据开工前登记：修复文件数只计 `src/`、`tests/`、`scripts/` 下除类型与导入以外的改动；全绿，或此类文件不超过 5 个且无行为变更，则并入，否则回退并登记债务。对齐集合为全部 `@deepseek-ai/*` devDependencies 与 `schemastery`；`dsh-typert-protocol` 的 devDependency 与运行时依赖同钉 0.1.7-rc.2，不随本轮变动 | typecheck、lint、test 全绿，或带证据的回退记录；lockfile 已重建 | T3 |
| T5 | `cordis.patch.yml` 追加禁用 `ui-settings-web-search` 与头注释；扩展 `tests/patch.test.ts`，加运行时行永不禁用的负向断言，更新 rc.2 时代的过期注释；ADR-0013 的 Status 加勘正注 | 新断言先红后绿 | T4 |
| T5p | 探针：rc.5 实例上做「形态 × 向量 × 是否挂浏览器」矩阵。形态取 H（hmr 启用）与 N（scratch profile 用户层写 `- id: hmr` / `disabled: true`）；向量取插件页开关、CLI、手改 `dsh.profile.bundles`、remove。探针插件放 `/tmp/dshws-s41/probe/`，不入库。逐格记录 dispose 是否触发、`mutate` 是否落盘、宿主日志有无「cannot be nested」、客户端是否收到 `plugin-manager/changed` | 矩阵与原始日志归档；据矩阵写出 T7、T8 的取舍结论 | T5 |
| T6 | `src/handover.ts`：`planHandoverOps`、`revertHandover` | `tests/handover.spec.ts` 先红后绿：dshws 搜索钉、dshws 抓取钉、双钉同清、官方 id 保留、第三方 id 保留、空用户层 | T5p |
| T7 | 宿主 dispose 通道。仅当 T5p 在形态 H、向量=插件页开关的单元里证明 dispose 触发且 `mutate` 落盘时实现；否则不实现，ADR-0024 改为单通道并写明限制 | 实现时：`tests/handover-host.spec.ts` 先红后绿（dispose 触发一次 `mutate`；无钉不调用；抛错被吞并告警；无 settings 服务时空操作），且 T5p 有落盘证据。不实现时：`src/` 无 dispose 写入，`inject` 仍为 `['web','credentials']` | T6 |
| T8 | 客户端通道：`src/client/handover-watch.ts` 监听 `plugin-manager/changed`，兼容裸名 `dsh-websearch` 与 scoped 名 `@maricgeer/dsh-websearch`，冲突时重读重试一次；宿主缺少 `pluginManager` 或 `configForms` 时不订阅 | `tests/client/handover-watch.spec.tsx` 先红后绿 | T7 |
| T9 | 文档分离：`locale/zh.json`、`locale/en.json`、`docs/plugin-page.{zh,en}.md`、`package.json` 的 `exports` 与 `files`；README 中英文分工声明与勘正（含 README.md:38 的卸载表述与 :175 的闲置卡条目） | `tests/package-meta.spec.ts` 先红后绿：元信息非空、detail 路径合法、文件存在、已入 `files`、已导出；用户文档按既定结构 | T8 |
| T10 | `scripts/check-release.mjs` 与 `pnpm run check:release`。tag 模式断言：tag 形如 `vX.Y.Z` 且等于 `package.json` 版本；CHANGELOG 首个日期二级标题含 `v<版本>`；`USER_AGENT` 等于 `dsh-websearch/<版本>`；tag 提交在 master 上。两种模式都断言：两份 tarball 含运行必需文件与显示元信息文件、不含内部治理文档、被跟踪文件里没有带值的 `token=` | `tests/check-release.spec.ts` 先红后绿；负控用例：只含历史「0.2.1」提法的 CHANGELOG 必须判失败 | T9 |
| T11 | `release.yml` 改 OIDC（`id-token: write`、npm ≥ 11.21、`--provenance`、`fetch-depth: 0`、无 `NPM_TOKEN`）并加全量门；`ci.yml` 在 PR 与 master 推送上执行发布预演（全量门、一致性校验非 tag 模式、打包、tarball 校验）；加 devDependency `yaml` 与工作流契约测试 | 契约测试先红后绿（无 `NPM_TOKEN`、有 `id-token: write`、`fetch-depth: 0`、步骤顺序）；fresh clone 本地依序执行两条工作流的步骤通过；YAML 实读命令为 `node -e "require('yaml').parse(require('fs').readFileSync(process.argv[1],'utf8'))" <文件>` | T10 |
| T12 | rc.5 实测（条目见下）：环境条目、交还条目、功能腿 | 证据归档 `docs/sessions/audit-logs/2026-11-23-s41-rc5-live/` | T11 |
| T13 | 实测结果回填 known-upstream-issues 与 desktop-adoption；`docs/release-runbook.md`；`docs/upgrade.md` §6 改写为与 ADR-0026 一致；架构注记；ADR-0024 按 T5p 结论定稿并转 accepted | 交叉链接无断链 | T12 |
| T14 | 阶段 4：独立 Agent 逐条核验并跑一次全量测试 | 逐任务 PASS；报告含命令原文与实测数字 | T13 |
| T15 | 阶段 5：独立 Agent 交叉验证；冒烟内容为在 rc.5 的 3434 实例上重做 V2、V3、V5、V7 | COMPLETE | T14 |
| T16 | 阶段 6：收尾六件套；STATUS 与 roadmap 收官。S41 的收官范围为 T0–T16；T17、T18 归 Session 42 | 六件套齐全；状态为「候令：代码终审，通过后启动 Session 42」 | T15 |
| T17 | Session 42：用户确认代码审核后，版本号改 0.2.1、`USER_AGENT`、CHANGELOG 条目；在 feat 分支跑 `check-release` 非 tag 模式与全量门；由 Session 42 的阶段 4 独立核验 | `tests/user-agent.test.ts` 先红后绿；独立核验 PASS | 用户确认 |
| T18 | Session 42：发布序列（步骤见下），每步单独门控 | 满足 R9 | T17 |

T 编号在 session 记录与 progress 台账沿用。

## rc.5 实测条目（T12）

环境：临时 home `/tmp/dshws-s41/home-rc5`（形态 H）与 `/tmp/dshws-s41/home-rc5-nohmr`（形态 N），端口 3434，
profile `web`，不接触 `~/.dsh`。首选直接用桌面 app 内置命令
（`/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh`）配临时 `DSH_HOME` 启动，
跑的是与本机相同的 rc.5 运行时；输出重定向到文件，不经管道。不能启动 web 形态时，从 tag
`dsh-v0.2.2-rc.5` 建 worktree 构建后启动。

环境条目：

- V1 `--dump-config`：`web` 行为两个 dshws 钉值；`ui-settings-web-search` 与 `web-search-deepseek` 为 disabled；
  `web-fetch-http`、`web-deepseek-api` 仍启用。
- V2 插件页「内置插件配置」不再有「网页搜索与获取」；dsh-websearch 详情的覆盖列表含 `ui-settings-web-search`。
- V3 详情页：中文界面显示中文标题、描述与 `plugin-page.zh.md`；英文界面显示英文版；不渲染 README。
- V4 设置里的「网页搜索」节照常渲染。
- V11 逃生口：用户层写 `{id: ui-settings-web-search, disabled: false}` 后，插件启用时官方卡可见并列出
  `dshws-*` 提供方。

交还条目（向量均为插件页开关，浏览器在线；形态 H 与 N 各做一次）：

- V5 关闭插件：官方卡片回来，`web` 配置回到官方默认值。
- V6 重新启用：接管恢复，key、链序等设置保留。
- V7 预置用户层 `dshws-*` 钉值后关闭插件：直接检查 `cordis.patch.yml`，该 `web` 覆盖整行消失。
- V8 用户层钉的是官方 id 时，关闭插件后该值保留。
- V10 形态 H 下带预置钉值关闭插件：关闭后 60 秒内宿主进程存活、HTTP 探活有响应、日志无未捕获异常；
  并断言交还后置条件（V7 的文件级结果）。守卫若被拒，归档告警原文。

功能腿（需要 key 窗口，见风险节）：

- F1 rc.5 实例上真实搜索一条，留 served-by 痕迹。
- F2 `web_fetch` 一条。
- F3 降级或错误路径一条。
- F4 key-count 徽标、DNS 卡状态、toolview 溯源行渲染正常。
- e2e.real 错误路径带 key 实跑；环境窗失败如实记录工件。
- 对齐清单「DSH 上游维度」逐格确认的留痕写入 session 记录。

全量测试不属于 rc.5 实测，见验证矩阵第 2 行。

## 验收条目（R1-R9）

- **R1 接管**：`cordis.patch.yml` 含 `- id: ui-settings-web-search` 与 `disabled: true`；`tests/patch.test.ts`
  断言 `web`、`web-fetch-http`、`web-deepseek-api`、`tool-web` 不被禁用。
- **R2 交还**：`tests/handover.spec.ts` 与 `tests/client/handover-watch.spec.tsx` 全绿；T7 仅在 T5p 证明可落盘时
  实现且其测试全绿；T5p 矩阵归档并写明取舍结论；V5、V7、V10、V11 通过；无通道向量的限制与手动清理方法
  写入 `docs/plugin-page.{zh,en}.md` 与 README。
- **R3 文档分离**：`tests/package-meta.spec.ts` 全绿；V3 通过。
- **R4 发布门**：`tests/check-release.spec.ts` 与工作流契约测试全绿；fresh clone 本地依序执行两条工作流的步骤
  通过；草稿 PR 上 `ci.yml` 的发布预演通过（Session 42 步骤 2a）；`release.yml` 不含 `NPM_TOKEN`。
- **R5 上游对齐**：`tests/peer-range.spec.ts` 全绿；devDependencies 对齐有结论记录（并入或带证据回退）；
  功能腿 F1–F4 与 e2e.real 有留痕；对齐清单「DSH 上游维度」逐格确认在案。
- **R6 rc.5 实测**：V1–V8、V10、V11 的证据归档在案。
- **R7 文档**：`docs/release-runbook.md` 在盘；SOP §2 写明双语义判定、六件套枚举统一、含归档前脱敏；
  `known-upstream-issues.md` 增 rc.5 行；`docs/upgrade.md` §6 与 ADR-0026 一致；README 的过期表述已勘正；
  ADR-0013 与 ADR-0023 的 Status 有勘正注。
- **R8 治理**：session-41 记录十节齐全；progress-M7 含 S41 台账与 S38–S40 补账（T2b 完成）；STATUS 与 roadmap
  收官状态一致；roadmap 含编号 42 的待执行行。
- **R9 发布（Session 42）**：npm 上 0.2.1 可查且带 provenance；GitHub Release v0.2.1 含双 tarball；
  tag、`package.json`、CHANGELOG、`USER_AGENT` 四者版本一致。

## 验证矩阵

| 验证面 | 触发时机 | 责任阶段 | 采信规则 |
|---|---|---|---|
| 各任务相关测试子集 | 任务绿证 | 3 | 先红后绿各 1 次 |
| 全量测试 `pnpm test` | 阶段 0 基线（已跑）；阶段 4 汇总；Session 42 阶段 4 对版本号变更后的提交 | 0 / 4 / Session 42 | S41 内亲跑 2 次；T12 不跑全量；Session 42 的 1 次属另一 session 的阶段 4 |
| typecheck 两面、lint、check:i18n、build | 任务绿证按需；阶段 4 汇总；Session 42 阶段 4 | 3 / 4 / Session 42 | 阶段 5 采信阶段 4 数字 |
| check-release 非 tag 模式与 tarball 校验 | T10 单测；T11 fresh clone 本地执行；草稿 PR 的 ci.yml；Session 42 阶段 4 | 3 / CI / Session 42 | 本地与 CI 均须通过 |
| check-release tag 模式 | Session 42 步骤 2b 在 master 上推送前；Release 工作流内 | Session 42 | 本地与 CI 两次均通过才发布 |
| rc.5 实测 V1–V8、V10、V11 | T12 | 3 | 执行者自测，证据归档 |
| 功能腿 F1–F4 与 e2e.real | T12（key 窗口） | 3 | served-by 留痕与测试输出归档；无留痕不得启动 Session 42 |
| 独立冒烟 | 阶段 5 | 5 | 独立 Agent 在 rc.5 的 3434 实例上重做 V2、V3、V5、V7 |
| 桌面端实测（V2、V5、V7 与重启前的中间态） | Session 42 步骤 1 | 用户门控 | 失败则回到 Session 42 修正并重做其阶段 4 |
| 宪法第 4 步「发版前用户路径冒烟」 | 由「功能腿」与「独立冒烟」两行替代 | 3 / 5 | 在 3434 的 rc.5 实例上执行；3423 运行的是 rc.2 守卫树，不是发版目标宿主 |

重负载命令一律串行。

## 发布序列（T18，Session 42，每步先问用户）

0. 前提：用户完成代码终审并确认（T17 的触发条件）；功能腿留痕在案；token 历史的处置已由用户裁决（见风险节）。
1. 装入本机桌面端实测：备份 `~/.dsh/profiles/desktop` 的 `package.json`、`cordis.patch.yml`、`pnpm-lock.yaml`；
   用 app 内置命令装入候选 tarball；记录关闭后、重启前的中间态；重启 app；验证 V2、V5、V7 在桌面形态下成立。
2. 预演与推送：
   - 2a 推送 feat 分支并开草稿 PR，让 `ci.yml` 在候选提交上跑发布预演；网络不通时需要用户的隧道。
   - 2b 本地合并到 `master`，建带注解 tag `v0.2.1`，在 `master` 上跑 `check-release --tag v0.2.1` 与全量门，
     再执行 `git push --atomic origin master v0.2.1`（连同未推送的 S40 提交）。
3. Release 工作流发布后核对：`npm view @maricgeer/dsh-websearch@0.2.1 --registry https://registry.npmjs.org`
   的版本、`dist.integrity` 与 provenance；GitHub Release v0.2.1 及双 tarball。
4. 可选：桌面端改用 npm 包名重装，清掉 S40 留下的「钉本地 tgz」债务。
5. 发布成功后：由用户吊销仓库 secret `NPM_TOKEN` 与 npm 侧对应 token；写 session-42 记录并刷新 STATUS。

回退：推 tag 之前任一步失败则不推。tag 推送后发布失败时不移动 tag，修复后以 0.2.2 重发。npm 的
「Allow npm dist-tag」未勾选：若首次发布因此被拒，停下来请用户在 npm 侧处理，不改用 token。

## 高危动作预告

- 推送与发布：推送 feat 分支与开草稿 PR（公开仓库）；`git push --atomic origin master v0.2.1`；GitHub Release；
  npm 发布。
- 历史改写（仅当用户选择）：对未推送历史做一次 token 文本替换，改变 `ede714d` 及其后提交的 hash；执行前留备份引用。
- 凭据：功能腿需要 key 窗口，由用户决定供给方式；代理不读取 `~/.dsh/.credentials.yaml`。
- 仓库外写入：`/tmp/dshws-s41/`、可能的 harness worktree、备份副本。
- 生产 profile：`~/.dsh/profiles/desktop` 的备份、安装与 app 重启，仅在你届时明确指令后执行。
- 不涉及：删除依赖、改系统配置、代理读写凭据明文。

## 与批准原文的差异

已恢复的删减项（上一版 plan 压缩篇幅时遗漏，现逐项恢复）：T3 的文档一致性验收；T4 的
`dsh-typert-protocol` 约束；T5 的过期注释子项；T6、T7 的具名用例；T8 的双名兼容与冲突重试；
T9 的具名断言与用户文档结构；T12 的启动器路径与输出重定向约束；V7 的文件级验证方法；
T18 的分步门控、备份清单、隧道与回退；本「高危动作预告」节；Context 中未推送提交的事实。

吸收阶段 0 审核的增项：ADR-0027；T0 的 token 前向遮蔽；T10 的 token 值扫描；T2b 的文档债清理；
T13 的 SOP、desktop-adoption、`docs/upgrade.md` 勘正。

吸收阶段 2 第 1 轮审核、并改变验收标准或范围的项目（须回 2.5 请用户确认）：

1. 交还通道由「宿主 dispose + 客户端」双通道改为「先探针定通道」：新增 T5p；T7 改为条件实现；
   CLI、手改、remove 三个向量若探针确认无通道，则在用户文档中写明限制与手动清理方法（R2）。
2. T12 增功能腿 F1–F4、带 key 的 e2e.real 与对齐清单留痕；需要 key 窗口（R5）。
3. 发布前增草稿 PR 预演门；`release.yml` 增 `fetch-depth: 0`；`ci.yml` 承担发布预演（R4）。
4. T17 的一致性校验改为在 feat 分支跑非 tag 模式，tag 模式移到合并之后；CHANGELOG 匹配规则限定为首个
   日期二级标题并加负控；`docs/upgrade.md` §6 纳入改写（R7）。
5. T17、T18 归 Session 42；新增 R9 与 roadmap 编号 42 行（R8、R9）。
6. 推送将公开含已失效 host token 值的历史提交，由用户在推送前裁决处置方式。

## 债务归属映射（延后项正本）

| 债务 | 等级 | 归属 | 依据 |
|---|---|---|---|
| S40 自登记：桌面运行时真实搜索腿未实跑；desktop profile 钉本地 tgz；Windows 桌面形态未实装 | 🟢 | 搜索腿由 T12 功能腿与 Session 42 步骤 1 覆盖；tgz 一项在 Session 42 步骤 4 处置；Windows 随桌面形态专项 | S40 记录 |
| desktop-adoption.md 行号与路径偏差；证据索引判读错位 | 🟢 | 下次修订 desktop-adoption 时 | S41 阶段 0 审核 |
| 已合入的 feat 分支未清理 | 🟢 | 发版后清理批次 | S41 阶段 0 审核 |
| 既存测试噪音（button 嵌套告警、mock 缺 `$mount`、sourcemap 警告） | 🟢 | v2 候选 | S41 阶段 0 审核 |
| 插件图标；详情页「已接管」徽标；交还后恢复原钉值；npm 分阶段发布；rc.5 线 fork 守卫重放 | 🟢 | v2 候选 | 用户批准的计划「明确不做」 |
| ADR-0024 的旧宿主退化（`web` 字段非 volatile 时守卫空操作）无旧宿主可测 | 🟢 | 在 ADR 与用户文档中按设计推断表述，不声称已验证 | S41 阶段 2 审核 |
| 3080 是否有意停机 | 🟢 | 待用户确认 | S41 阶段 0 审核 |

## 风险

- OIDC 首发窗至 2026-11-25。过期则由用户删除并重建 Trusted Publisher 配置，不影响代码。
- npm「Allow npm dist-tag」未勾选。首次发布若因此被拒则停下请用户处理，不改用 token。
- 功能腿依赖 key 窗口。没有 key 窗口则功能腿无法留痕，按仓库宪法不得打 tag，发布顺延。
- 推送将首次公开含已失效 host token 值的历史提交（`ede714d`、其合并提交及遮蔽提交之前的提交树）。
  处置二选一，由用户裁决：推送前对未推送历史做一次文本替换（改变相关提交的 hash，保留备份引用与
  commit-map）；或原样推送并接受披露。
- devDependencies 对齐可能引发大面积修复。由 go/no-go 门回退并登记债务。
- 宿主 dispose 通道在 rc.5 HMR 形态下按源码会被拒绝。由 T5p 实测定夺，不成立则不实现。
- CLI、手改、remove 三个向量可能没有任何交还通道。由 T5p 实测；无通道则写明限制与手动清理方法。
- 桌面 app 内置命令可能不能启动 web 形态。退回 rc.5 worktree 构建。
- 上游持续前移（0.2.3-alpha.2 已发布）。本 session 锚定 rc.5，更高版本留给下一轮 SOP 循环。
