---
title: ADR-0026: 发布改用 OIDC trusted publishing 并加版本三同步门
status: active
date: 2026-11-23
type: process
origin: plan 048 T10–T11 / Session 41 / 前置 ADR-0007、ADR-0020
---

# ADR-0026: 发布改用 OIDC trusted publishing 并加版本三同步门

## Status

accepted（2026-11-23 起草，Session 41；2026-11-24 按阶段 2 第 1 轮审核修订决策 1、3 至 6 并新增决策 9。
决策 1 至 4 已据以执行：`release.yml`、`ci.yml`、`scripts/check-release.mjs`（T10、T11、T11b，以及阶段 4 核验后对令牌扫描与
入口判定的加固）。决策 5、6、9 属于发布序列与发布后的处置，尚未发生；决策 7、8 是发布失败时的处置规则，是否用到取决于首次发布。
修订项在 2.5 的确认尚未获答复，时点见 session-41 记录）

## Context（背景）

现有 `release.yml` 由 `v*` tag 触发，用长期有效的 `NPM_TOKEN` 发布，且没有任何校验去确认 tag、
`package.json` 版本与 CHANGELOG 指向同一个版本。兄弟仓 dsh-mm-resilience 在 v0.0.3 发布时出现过
「首次运行失败后移动 tag」的事故；本仓 v0.2.0 也经历过「tag 于增补后重打」。本地 tag、远端 tag
与 npm 版本一旦不一致，开发版本线就会混乱。

约束：

- npm 的发布认证体系在 2026 年变更：无人值守发布应使用 trusted publishing（OIDC），要求 npm ≥ 11.5.1、
  工作流持有 `id-token: write`、`repository.url` 与仓库一致；新建的 Trusted Publisher 配置须在 2 天内
  完成首次成功发布，否则过期重建。
- 用户已在 npm 为 `@maricgeer/dsh-websearch` 配置 Trusted Publisher：GitHub Actions、工作流文件
  `release.yml`、无 environment、允许直接 `npm publish`、未勾选 dist-tag 管理。
- 本机默认 registry 是 npmmirror，一切 npmjs 操作必须显式指定 registry。
- 仓库同时产出两份 tarball：scoped 名发 npm，裸名供 profile 本地安装。
- actions/checkout 默认 `fetch-depth: 1`，runner 上没有 `master` 引用，「tag 提交在 master 上」无从断言。
- `CHANGELOG.md` 的历史条目里已有不带 `v` 的「0.2.1」提法，子串匹配会被历史条目空满足。
- `docs/upgrade.md` §6 仍写「修复后重推同 tag」与手工 `npm publish`，与本决策相反，须同步改写。

## Decision（决策）

tag 推送即发布确认点；发布由 OIDC 完成，且只有通过版本三同步门的提交才能被发布。

1. `release.yml` 改为 OIDC：`permissions` 含 `id-token: write`，删除 `NPM_TOKEN`，发布前安装不低于 11.21.0 的
   npm（`npm install -g npm@11`），`npm publish` 带 `--provenance` 并显式指定 `https://registry.npmjs.org`；
   checkout 设 `fetch-depth: 0`。
2. 发布前依次执行：全量门（typecheck 两面、lint、test、check:i18n、build）、一致性校验、打包、
   tarball 校验、GitHub Release、npm 发布。任一步失败则不发布。
3. 一致性校验 `scripts/check-release.mjs` 在 tag 模式下断言：tag 形如 `vX.Y.Z` 且等于 `package.json` 版本；
   CHANGELOG 的首个日期二级标题含 `v<版本>`（历史条目里不带 `v` 的提法不算）；`USER_AGENT` 等于
   `dsh-websearch/<版本>`；tag 对象指向 HEAD，且 HEAD 被 `master` 包含。
4. tarball 校验断言两份 tarball 都含运行必需文件与显示元信息文件，且不含内部治理文档。
   〔2026-11-24 修订：带值的 `token=` 不在 tarball 里查，而是扫 HEAD 提交树里已提交的内容，即 tag 将要发布的；
   未提交的改动不在内。本地这一次因此在提交之后跑才有效。〕
   非 tag 模式与 tarball 校验由 `ci.yml` 在每次 PR 与 master 推送上执行，使问题在打 tag 之前暴露。
5. 推送方式为 `git push --atomic origin master v<X.Y.Z>`，tag 为带注解 tag。master、远端 tag、npm 版本
   由同一次操作与同一条流水线产生。打 tag 之前先推送 feat 分支开草稿 PR，让 `ci.yml` 在候选提交上完成
   发布预演。
6. 版本号只在用户完成代码审核并明确确认后变更，一个批次只变一次；tag 在推送时才创建。序列为：在
   feat 分支跑非 tag 模式校验与全量门并经独立核验；合并 `master`、建带注解 tag 后在 `master` 上跑 tag
   模式校验；再原子推送。
7. tag 推送后若发布失败，不移动 tag；修复后以更高的补丁号重发。
8. 若首次发布因 dist-tag 权限被拒，停下来请用户在 npm 侧处理，不退回 token。
9. 首次 OIDC 发布成功后，吊销仓库 secret `NPM_TOKEN` 与 npm 侧对应 token。

## Rationale（理由）

- 三处版本由同一提交、同一次推送、同一条流水线产生，才谈得上一致；分散的手工步骤迟早漂移。
- 校验放在发布之前、GitHub Release 创建之前，失败时公开面没有任何变化。
- OIDC 是 npm 当前的无人值守发布方式，也符合用户「不为发布建 bypass token」的既定纪律。
- tarball 校验同时覆盖 dsh-mm-resilience 踩过的「`meta.detail` 指向的文件不在包内」与本次发现的
  「证据日志带 token 值」两类事故。

## Alternatives Considered（被排除的方案）

### 方案 A: 保留 `NPM_TOKEN`
- **优点**: 零改动。
- **缺点**: 长期凭据；与 npm 现行认证方向和用户纪律相悖。
- **排除理由**: 用户已配置 Trusted Publisher，明确要求走 OIDC。

### 方案 B: `npm stage publish` 分阶段发布
- **优点**: 每次发布都需人工在网页审批，最严格。
- **缺点**: 审批需要 2FA，发布不再无人值守；本轮未评估完整流程。
- **排除理由**: 登记为 v2 候选，不在本批引入。

### 方案 C: 先推 master、另推 tag 的两段式
- **优点**: master 的 CI 先跑一遍。
- **缺点**: 两次推送之间可能插入新提交，tag 未必指向经过 CI 的那个提交。
- **排除理由**: 原子推送一次成形；发布流水线自身也跑全量门。

## Consequences（后果）

### 正面后果
- 本地 tag、远端 tag、npm 版本、CHANGELOG、UA 由一道门强制一致。
- 发布不再依赖长期凭据，并带 provenance 证明。

### 负面后果 / 风险
- 首次 OIDC 发布必须在配置创建后 2 天内完成 → 过期由用户删除重建配置，代码不受影响。
- 发布流水线变长（多跑一次全量门）→ 换取「发布的正是通过全量门的提交」。
- tag 推送后失败不能原地重试修正后的代码，只能升补丁号 → 已知代价，换来 tag 的不可变性。
- 发布预演需要先推送 feat 分支并开草稿 PR → 与发版推送同属公开动作，均经用户门控。

## References（关联）

- `docs/plans/2026-11-23-048-s41-takeover-docsplit-oidc-plan.md`
- `.github/workflows/release.yml`、`.github/workflows/ci.yml`、`scripts/check-release.mjs`、`docs/release-runbook.md`
- https://docs.npmjs.com/trusted-publishers 、https://docs.npmjs.com/staged-publishing
- 相关 ADR: ADR-0020 — 版本线与补丁号演进规则，本决策是其发布侧的执行机制
- 相关 ADR: ADR-0025 — tarball 校验覆盖的显示元信息文件清单
