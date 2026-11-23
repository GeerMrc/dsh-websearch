# Plan — 2026-11-23-048 S41 接管官方「网页搜索与获取」+ 插件页文档分离 + OIDC 发布自动化（v0.2.1）

> 计划来源：用户 2026-11-23 指令（三项工作重心）+ S41 阶段 0 独立审核的吸收项。用户于 2026-11-23
> 经计划审批批准范围与技术路线（阶段 2.5 时点）。阶段 0 / 阶段 2 若带来范围或验收标准变化，
> 须回带差异请用户确认；仅吸收审核建议而验收标准不变时留痕继续。

## 目标

1. 启用 dsh-websearch 即隐藏官方「网页搜索与获取」设置页；关闭即自动交还官方，并清除指向
   `dshws-*` 的用户层钉值，使关闭后官方提供方立即可用。
2. 插件页显示本地化标题、描述与用户文档；README 回归开发、安装、验收文档。
3. 发布链改为 OIDC trusted publishing，并加 tag、package.json、CHANGELOG、UA 一致性门。
4. 完成上游 0.2.2-rc.5 对齐：peer 显式钉与 devDependencies 对齐。

## 背景与已确立事实

计划期调研证据。harness 行号除注明外均为本地树 `9370b2f7f9`（0.2.0-rc.2 线）；rc.5 行为按 tag
`dsh-v0.2.2-rc.5` 直读上游文件核对。

- 「网页搜索与获取」卡片来自行 `ui-settings-web-search`：`packages/bundle/web-app/cordis.patch.yml:417-418`；
  rc.5 同名（`packages/bundle/web-app/cordis.patch.yml`，tag 直读）。
- rc.5 该卡片改为依赖 `web` 命名空间（`packages/client/ui-settings-web-search/README.zh.md`，tag 直读），
  所以 ADR-0013 决策 7「禁用 `web-search-deepseek` 即隐藏卡片」在 rc.5 失效，两张卡并存。
- 参考实现：已安装 dsh-subagent-plus 的 `cordis.patch.yml:11-16` 只禁用 `ui-settings-subagent`
  一行，并声明运行时行一律不动；测试 `tests/takeover-patch.spec.ts:12-31`（源
  `/Volumes/IPFSJK/Zcode/dsh-subagent-model-pin/`）。
- 插件页文档顺序：locale `meta.detail`，其次包内 README；不读 `README.zh.md` / `README.en.md`
  （`packages/util/plugin-detail/README.md` Document order，tag 直读）。作者格式见
  `docs/cookbook/adding-a-package.zh.md`「插件展示元信息」（tag 直读）；读取器
  `packages/boot/app-boot/src/package-meta.ts:148-172`。
- `settings.mutate` 的 `unset` 在基础层有值时等于设回继承值（`packages/settings/settings/src/index.ts:367-375`）；
  整个结果与继承配置深度相等时编辑器才删掉用户层 `config`（`packages/boot/config-editor/src/index.ts:120-126`）。
- 宿主兼容门用 `includePrerelease: true`（`packages/boot/app-boot/src/plugin-compatibility.ts:77`）。
  双语义矩阵与上游三线监测的原始数字见 `docs/sessions/audit-logs/2026-11-23-s41-stage0-audit-of-s40.md`。
- 桌面端无 HMR 时 bundle 开关不卸载 fiber，运行时写入的交还须走客户端 `plugin-manager/changed`
  通道：`/Volumes/IPFSJK/Zcode/dsh-mm-resilience/docs/patterns.md` P4 与 `src/handover.js:17-24`。
- npm trusted publishing 要求 npm ≥ 11.5.1、`id-token: write`、`repository.url` 与仓库一致，新建配置
  须在 2 天内完成首次发布：https://docs.npmjs.com/trusted-publishers 。
- 现状：`cordis.patch.yml` 已钉 `web` 行并禁用 `web-search-deepseek`；`tests/patch.test.ts` 锁定 patch 内容；
  `.github/workflows/release.yml` 仍用 `NPM_TOKEN`；`scripts/pack.mjs` 产出双名 tarball。
- 本地 DSH 源码树早于已安装的 rc.5，仅作源码阅读参考。

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 前置 |
|---|---|---|---|
| T0 | 阶段 0：独立 Agent 审核 S40；audit-log 落盘；归档证据中的 token 值前向遮蔽 | audit-log 含参数头与输出原文；全仓 `token=` 带值计数为 0 | 无 |
| T1 | 阶段 1：本 plan、ADR-0024 至 0027、roadmap S41 行、STATUS 行与当前位置块 | 文件在盘且互引一致 | T0 |
| T2 | 阶段 2：独立 Agent 审核计划 | APPROVED | T1 |
| T3 | peer 范围追加 `0.2.2-rc.5`；`tests/peer-range.spec.ts`；勘正 README 与 AGENTS.md 的过期范围 | 新测试先红后绿（双语义 + 负控） | T2 |
| T4 | devDependencies 对齐 0.2.2-rc.5。go/no-go：全绿，或修复不超过 5 个文件且无行为变更则并入，否则回退并登记债务 | typecheck、lint、test 全绿，或带证据的回退记录 | T3 |
| T5 | `cordis.patch.yml` 追加禁用 `ui-settings-web-search` 与头注释；扩展 `tests/patch.test.ts` | 先红后绿；运行时行永不禁用的负向断言 | T4 |
| T6 | `src/handover.ts`：`planHandoverOps`、`revertHandover` | `tests/handover.spec.ts` 先红后绿 | T5 |
| T7 | 宿主通道：经可选 `settings` 注入注册 dispose 钩子；`inject` 不变 | `tests/handover-host.spec.ts` 先红后绿 | T6 |
| T8 | 客户端通道：`src/client/handover-watch.ts` 监听 `plugin-manager/changed` | `tests/client/handover-watch.spec.tsx` 先红后绿 | T7 |
| T9 | 文档分离：`locale/zh.json`、`locale/en.json`、`docs/plugin-page.{zh,en}.md`、`package.json` 的 `exports` 与 `files`、README 分工声明与勘正 | `tests/package-meta.spec.ts` 先红后绿 | T8 |
| T10 | `scripts/check-release.mjs` 与 `pnpm run check:release`（含 token 值扫描） | `tests/check-release.spec.ts` 先红后绿 | T9 |
| T11 | `release.yml` 改 OIDC 并加全量门；`ci.yml` 加打包完整性检查 | 两个工作流经 YAML 解析器实读；步骤顺序符合 ADR-0026 | T10 |
| T12 | rc.5 实测 V1–V10 | 证据归档 `docs/sessions/audit-logs/2026-11-23-s41-rc5-live/` | T11 |
| T13 | 文档：`docs/release-runbook.md`；`docs/upstream-sync-sop.md`（双语义判定、六件套枚举、归档前脱敏）；`docs/known-upstream-issues.md`；`docs/desktop-adoption.md` 版本表；架构注记 | 交叉链接无断链 | T12 |
| T14 | 阶段 4：独立 Agent 逐条核验并跑全量测试 | 逐任务 PASS；报告含命令原文与实测数字 | T13 |
| T15 | 阶段 5：独立 Agent 交叉验证与用户路径冒烟 | COMPLETE | T14 |
| T16 | 阶段 6：收尾六件套；progress 补 S38–S41 账；S40 记录勘注 | 六件套齐全；状态为「候令：版本号变更与发布」 | T15 |
| T17 | 用户确认代码审核后：版本号 0.2.1、`USER_AGENT`、CHANGELOG；本地跑 `check-release --tag v0.2.1` 与全量门 | `tests/user-agent.test.ts` 先红后绿；门全绿 | 用户确认 |
| T18 | 发布序列：桌面端装入实测、合并与原子推送、Release 发布、npm 核验 | npm 上 0.2.1 可查且带 provenance | T17，逐步门控 |

T 编号在 session-41 记录与 progress 台账沿用。

## 验收条目（R1-R8）

- **R1 接管**：`cordis.patch.yml` 含 `- id: ui-settings-web-search` 与 `disabled: true`；`tests/patch.test.ts`
  断言 `web`、`web-fetch-http`、`web-deepseek-api`、`tool-web` 不被禁用。
- **R2 交还**：`tests/handover.spec.ts`、`tests/handover-host.spec.ts`、`tests/client/handover-watch.spec.tsx`
  全绿；rc.5 实测 V7、V8、V10 通过。
- **R3 文档分离**：`tests/package-meta.spec.ts` 全绿；rc.5 实测 V3 通过。
- **R4 发布门**：`tests/check-release.spec.ts` 全绿；`release.yml` 不含 `NPM_TOKEN`、含 `id-token: write`，
  步骤顺序为全量门、一致性校验、打包、tarball 校验、Release、发布。
- **R5 上游对齐**：`tests/peer-range.spec.ts` 全绿；devDependencies 对齐有结论记录（并入或带证据回退）。
- **R6 rc.5 实测**：V1–V10 证据归档在案。
- **R7 文档**：`docs/release-runbook.md` 在盘；SOP §2 写明双语义判定；`known-upstream-issues.md` 增 rc.5 行；
  README 的过期表述已勘正。
- **R8 治理**：session-41 记录十节齐全；progress-M7 含 S41 台账与 S38–S40 补账；STATUS 与 roadmap 收官状态一致。

## 验证矩阵

| 验证面 | 触发时机 | 责任阶段 | 采信规则 |
|---|---|---|---|
| 各任务相关测试子集 | 任务绿证 | 3 | 每项先红后绿各 1 次 |
| 全量测试 `pnpm test` | 阶段 0 基线、阶段 4 汇总、T17 发版候选复验 | 0 / 4 / 用户门控后 | 阶段 0 一次（数字在 audit-log e 项）；阶段 4 一次；T17 的一次针对版本号变更后的提交，属不同提交 |
| typecheck、typecheck:client、lint、check:i18n、build | 任务绿证按需、阶段 4 汇总 | 3 / 4 | 阶段 5 采信阶段 4 数字 |
| rc.5 实测 V1–V10 | T12 | 3 | 截图与 dump 归档；阶段 5 补用户路径冒烟 |
| 桌面端实测 V2、V5、V7 | T18 步骤 1 | 用户门控 | 装入生产 profile 须用户明确指令 |

重负载命令一律串行。

## rc.5 实测条目（V1–V10）

环境：临时 home `/tmp/dshws-s41/home-rc5`，端口 3434，profile `web`，不接触 `~/.dsh`。首选桌面 app
内置命令配临时 `DSH_HOME` 启动；不能启动 web 形态时，从 tag `dsh-v0.2.2-rc.5` 建 worktree 构建后启动。

- V1 `--dump-config`：`web` 行为两个 dshws 钉值；`ui-settings-web-search` 与 `web-search-deepseek` 为 disabled；
  `web-fetch-http`、`web-deepseek-api` 仍启用。
- V2 插件页「内置插件配置」不再有「网页搜索与获取」；dsh-websearch 详情的覆盖列表含 `ui-settings-web-search`。
- V3 详情页：中文界面显示中文标题、描述与 `plugin-page.zh.md`；英文界面显示英文版；不渲染 README。
- V4 设置里的「网页搜索」节照常渲染。
- V5 关闭插件：官方卡片回来，`web` 配置回到官方默认值。
- V6 重新启用：接管恢复，设置保留。
- V7 预置用户层 `dshws-*` 钉值后关闭插件：该 `web` 覆盖整行消失。
- V8 用户层钉的是官方 id 时，关闭插件后该值保留。
- V9 全量测试与 loopback e2e 全绿，数字为实测。
- V10 HMR 形态下带预置钉值关闭插件，过程无崩溃、无卡死。宿主 dispose 通道若被证明不安全或无效，
  降级为告警式空操作并在 ADR-0024 记录。

## 债务归属映射（延后项正本）

| 债务 | 等级 | 归属 | 依据 |
|---|---|---|---|
| S40 自登记：桌面运行时真实搜索腿未实跑；desktop profile 钉本地 tgz；Windows 桌面形态未实装 | 🟢 | S41 T18 步骤 4 处置 tgz 一项；其余随桌面形态专项 | S40 记录 |
| desktop-adoption.md 行号与路径偏差；证据索引判读错位 | 🟢 | 下次修订 desktop-adoption 时 | S41 阶段 0 审核 |
| 债务计数口径不一（plan 047 与 STATUS） | 🟢 | 已由 STATUS 当前位置块改为指针表述 | S41 阶段 0 审核 |
| 已合入的 feat 分支未清理 | 🟢 | 发版后清理批次 | S41 阶段 0 审核 |
| 既存测试噪音（button 嵌套告警、mock 缺 `$mount`、sourcemap 警告） | 🟢 | v2 候选 | S41 阶段 0 审核 |
| 插件图标；详情页「已接管」徽标；交还后恢复原钉值；npm 分阶段发布；rc.5 线 fork 守卫重放 | 🟢 | v2 候选 | 用户批准的计划「明确不做」 |
| 3080 是否有意停机 | 🟢 | 待用户确认 | S41 阶段 0 审核 |

## 风险

- OIDC 首发窗至 2026-11-25。过期则由用户删除并重建 Trusted Publisher 配置，不影响代码。
- npm「Allow npm dist-tag」未勾选。首次发布若因此被拒则停下请用户处理，不改用 token。
- devDependencies 对齐可能引发大面积修复。由 go/no-go 门回退并登记债务。
- 宿主 dispose 通道在 HMR 重组期间存在重入可能。由 V10 实测定夺，不安全则降级。
- 桌面 app 内置命令可能不能启动 web 形态。退回 rc.5 worktree 构建。
- 上游持续前移（0.2.3-alpha.2 已发布）。本 session 锚定 rc.5，更高版本留给下一轮 SOP 循环。
