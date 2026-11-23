---
title: ADR-0026: 发布改用 OIDC trusted publishing 并加版本三同步门
status: active
date: 2026-11-23
type: process
origin: plan 048 T10–T11 / Session 41 / 前置 ADR-0007、ADR-0020
---

# ADR-0026: 发布改用 OIDC trusted publishing 并加版本三同步门

## Status

accepted（2026-11-23，Session 41；用户批准计划）

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

## Decision（决策）

tag 推送即发布确认点；发布由 OIDC 完成，且只有通过版本三同步门的提交才能被发布。

1. `release.yml` 改为 OIDC：`permissions` 含 `id-token: write`，删除 `NPM_TOKEN`，发布前安装 npm 11，
   `npm publish` 带 `--provenance` 并显式指定 `https://registry.npmjs.org`。
2. 发布前依次执行：全量门（typecheck 两面、lint、test、check:i18n、build）、一致性校验、打包、
   tarball 校验、GitHub Release、npm 发布。任一步失败则不发布。
3. 一致性校验 `scripts/check-release.mjs` 在 tag 模式下断言：tag 形如 `vX.Y.Z` 且等于 `package.json` 版本；
   CHANGELOG 含该版本的条目；`USER_AGENT` 等于 `dsh-websearch/<版本>`；tag 提交在 `master` 上。
4. tarball 校验断言两份 tarball 都含运行必需文件与显示元信息文件，且不含内部治理文档与任何带值的
   `token=`。该校验在 `ci.yml` 的每次 master 推送上也执行，使问题在打 tag 之前暴露。
5. 推送方式为 `git push --atomic origin master v<X.Y.Z>`，tag 为带注解 tag。master、远端 tag、npm 版本
   由同一次操作与同一条流水线产生。
6. 版本号只在用户完成代码审核并明确确认后变更，一个批次只变一次；tag 在推送时才创建。
7. tag 推送后若发布失败，不移动 tag；修复后以更高的补丁号重发。
8. 若首次发布因 dist-tag 权限被拒，停下来请用户在 npm 侧处理，不退回 token。

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

## References（关联）

- `docs/plans/2026-11-23-048-s41-takeover-docsplit-oidc-plan.md`
- `.github/workflows/release.yml`、`.github/workflows/ci.yml`、`scripts/check-release.mjs`、`docs/release-runbook.md`
- https://docs.npmjs.com/trusted-publishers 、https://docs.npmjs.com/staged-publishing
- 相关 ADR: ADR-0020 — 版本线与补丁号演进规则，本决策是其发布侧的执行机制
- 相关 ADR: ADR-0025 — tarball 校验覆盖的显示元信息文件清单
