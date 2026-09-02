---
title: "ADR-0007: 包名 dsh-websearch + 独立 0.1.0 版本线 + 路径/tarball 交付（npm publish 延后）"
status: accepted
date: 2026-09-02
type: arch
origin: Session 02 H2/H5 实测定谳
---

# ADR-0007: 包名、版本起点与交付形态

## Status

accepted（2026-09-02，Session 02 spike 定谳）

## Context

架构 §8 开放问题 5：包名/版本起点/交付形态（本地路径 / tarball / npm publish）待实测定谳。S02 以 spike 包 `dsh-websearch-spike@0.1.0` 完成安装链路实测：

1. **本地目录**：`dsh plugin --profile web add <目录>` → profile `package.json` 记 `link:<目录>`，`dsh.profile.bundles` 自动追加（前提=包 manifest 声明 `dsh.bundle.patch` 指向自带 cordis.patch.yml），boot 加载成功。
2. **tarball**：`pnpm pack` 产物（6.7KB）同命令安装 → 依赖 spec 翻转为 `file:<tgz>`，重启后加载成功。
3. **profile 名约束**：非模板名 profile 只装 base bundle、无 webserver——GUI 插件的目标 profile 必须是 `web` 模板（scratch 隔离走 `DSH_HOME` 重定向，不靠 profile 改名）。
4. **版本域实锚**（dont-do 首条纪律）：`@deepseek-ai/cordis` npm 线为 4.0.x（latest tag 指向旧 0.0.1-rc.1 的包另有其因——dsh 系包 latest tag 同样失真，须以 versions 列表为准）；`@deepseek-ai/dsh-*` 发布线 0.1.2-alpha.2..4（alpha.4 = 2026-09-01）。
5. **npm 发布面滞后**：dev 树已有的 `installSettingsSection`/`settingsNamespace` 独立导出在 npm alpha.3/.4 均不存在（provider 方法 `installSection` 在）；部分 remote payload 类型在 published 面偏松。
6. **pnpm 供应链默认**：安装时 `minimumReleaseAge` 类闸把新发布包列入 `minimumReleaseAgeExclude` 提示（spike 实录）。
7. **名称可用性**（2026-09-02 npm view 实测）：`dsh-websearch`、`@deepseek-ai/dsh-websearch`、`dsh-websearch-spike` 均 E404 未占用。

## Decision

1. **包名**：`dsh-websearch`（unscoped；npm 未占用实测在档）。cordis 插件 id 同名 `dsh-websearch`；一切 provider id 维持 `dshws-` 前缀（ADR-0003 不变）。scope 版（`@deepseek-ai/dsh-websearch`）不用——本项目非上游 monorepo 成员，占上游 scope 不当。
2. **版本起点**：独立 semver 线，`0.1.0` 起；不跟随宿主 0.1.2-alpha.x（宿主版本是上游整仓发布态，插件与它只保持 peer 兼容域关系）。
3. **交付形态**：v1 交付 = **本地路径 / tarball** 二形态（README 给出可复现命令，S05b/S09 收口）；npm publish 延后到 M6 上游验收通过之后（避免验收前对公共仓库发版）。
4. **依赖钉版策略**：`@deepseek-ai/cordis` peer `>=4.0.1-rc.1 <5`（不变）；`@deepseek-ai/dsh-web` peer `>=0.1.2-alpha.3 <0.1.3`（不变）；插件运行时只依赖 npm 已发布的稳定核心面（如 `SettingsProvider.installSection` provider 方法），dev-tree-only 便利导出（`installSettingsSection` 等）等 npm 同步后再采用——S03 起以此为准绳。

## Rationale

- 两形态实测均通且 `dsh plugin add` 对本地路径/tarball 的处理完全一致（同一 reconcile 机制），v1 无需公共仓库即满足交付与验收。
- 独立版本线让插件发版节奏与上游 alpha 节奏解耦；peer 域承载兼容性语义。
- npm publish 是对外发布动作，按项目纪律留到用户验收后。

## Alternatives Considered

### scoped 包名 `@deepseek-ai/dsh-websearch`
- **排除理由**：借用上游 scope 发布会让包看起来像上游官方件；且未来上游若发布同名包即冲突。

### 版本跟随宿主（0.1.2-alpha.x 起）
- **排除理由**：把上游整仓发布号误当兼容承诺；alpha 号每轮漂移，插件被迫空转升版。

### v1 即 npm publish
- **排除理由**：验收前发公共版不可撤回；tarball 形态已覆盖安装需求。

## Consequences

### 正面后果
- S03 包骨架的 name/version/files/exports 可直接定稿（`exports["."]` + `exports["./client"]` + `dsh.bundle.patch` + `dsh.client` 四键形态已在 spike 验证）。
- 卸载复原语义简单：移除依赖 + 删 bundles 行即净（spike 收尾将实测复原）。

### 负面后果 / 风险
- 用户安装多一步（下载 tarball 或 clone 后 add），npm publish 前的获取成本由 README 承担。
- npm 发布面滞后 dev 树期间，插件不得采用 dev-tree-only API——需要新 API 时必须先确认其已进入 npm 发布线（S03 起为审查项）。

## References

- `docs/00-architecture.md` §6（安装模型）、§8（开放问题 2/5——本 ADR 封闭）
- `docs/decisions/adr-0001-standalone-out-of-tree-plugin.md`（独立目录与 patch 两行模型）
- `docs/dont-do.md`（peer 版本域双实锚纪律）
- Session 02 记录（H2 安装日志原文、H5 名称可用性实测）
