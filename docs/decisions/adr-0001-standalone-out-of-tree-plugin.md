---
title: "ADR-0001: 独立项目目录 + 零内核侵入外挂式交付"
status: accepted
date: 2026-09-02
type: feat
origin: 方案 v3 用户批准（2026-09-02）；取代早期 v1 仓库内改造方案
---

# ADR-0001: 独立项目目录 + 零内核侵入外挂式交付

## Status

accepted（2026-09-02，bootstrap 规划批准）

## Context

上游 dsh 出厂把 web 搜索钉死在付费的 `deepseek-official`（`packages/bundle/base/cordis.patch.yml:450-468`），第三方 provider key 配置不对称（exa/perplexity 仅 env、需重启、无 GUI），且无优先级/降级面。可选路线：v1 在 fork 仓库内改 seam/统一包/重定 base；v2 做成外挂式标准插件。用户约束：不破坏原 DSH、符合标准插件规范、上游升级可持续；验证通过后基于上游全新重建。

## Decision

项目落在独立目录 `/Volumes/IPFSJK/Zcode/dsh-websearch/`（未来可独立成仓），全部能力以**一个标准 cordis 外挂插件**交付；对上游仓库**零文件改动**，组合面仅用户层 patch 两行（insert 插件行 + `web` 行钉 `dshws-chain`）。

## Rationale

- 上游合并对本插件零文件冲突 → 上游升级可持续性最强。
- 改动面 = 用户层 patch + 安装的插件包，卸载即复原 → 不破坏原 DSH 可静态论证 + 动态验证。
- seam 是公开扩展点，第三方 anysearch 已实测同构可行。

## Alternatives Considered

### 方案 A: fork 仓库内改造（v1：扩展 WebRuntime 降级链 + 统一 provider 包 + base 重定基）
- **优点**: 链语义在 seam 层实现最彻底；GUI 可复用仓库门禁体系。
- **缺点**: 侵入上游核心语义（需推翻 2026-06-24 无降级链决策）；上游 merge-forward 冲突面大（103+ 冲突量级先例）；用户重建上游后需重复移植。
- **排除理由**: 与「上游升级可持续 + 不破坏原 DSH」硬约束正面冲突。

### 方案 B: 本仓库顶层 plugins/ 目录
- **优点**: 共享 harness 测试/构建工具链。
- **缺点**: 上游合并面 ≈ pnpm-workspace.yaml 一行，冲突概率低但非零。
- **排除理由**: 用户选择独立性最强的方案 A（本 ADR 的独立目录）。

## Consequences

### 正面后果
- 上游升级只需按升级演练手册回归，无合并成本。
- 插件可独立版本化、独立交付（tarball/路径/npm）。

### 负面后果 / 风险
- 无法复用 harness 工具链，需自建精简 pnpm+vitest+tsdown → 接受（体量小）。
- deepseek 搜索需插件内重实现（链成员需可直接调用的实例；上游注册表私有）→ 记 🟢 债务 L-1，归属 S03-S05。
- 链语义只能活在本插件 provider 内部（上游标量钉死语义不变）→ 架构文档 §4 已定义，测试钉死。

## References

- `docs/00-architecture.md` §1/§2/§6
- 上游证据：`packages/web/web/src/index.ts:49-73`、`packages/bundle/base/cordis.patch.yml:450-468`
