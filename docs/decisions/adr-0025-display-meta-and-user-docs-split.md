---
title: ADR-0025: 插件显示元信息与用户文档分离
status: active
date: 2026-11-23
type: process
origin: plan 048 T9 / Session 41 / 前置 ADR-0007
---

# ADR-0025: 插件显示元信息与用户文档分离

## Status

accepted（2026-11-23，Session 41；用户批准计划）

## Context（背景）

DSH 插件页按以下顺序取详情文档：`locale/<语言>.json` 的 `meta.detail`，其次是包内 README。它不读取
`README.zh.md` 或 `README.en.md`。本包没有 `locale/`，标题与描述回退到 `package.json` 的 `name` 与
`description`，详情页回退渲染仓库 README，而 README 是面向开发、安装与验收的文档，含有内部开发
编号、迁移说明与配置参考，直接呈现给终端用户并不合适。

约束：

- `meta.detail` 必须是相对包根、以 `/` 分隔、以 `.md` 结尾的路径，且必须位于子目录；命名文件不存在时
  是硬错误，不回退到 README。
- 读取器经 `<包名>/locale/en.json` 解析并读取同目录全部 `locale/*.json`，所以 `exports` 必须暴露
  `./locale/*.json` 与 `./package.json`。
- 本仓 `docs/` 同时存放内部治理文档与用户文档，不能整目录发布。
- 原始 HTML 会被客户端省略；相对链接保持为文本。

## Decision（决策）

插件页呈现的内容由专门的显示元信息与用户文档承担，README 保持为开发文档。

1. 新增 `locale/zh.json` 与 `locale/en.json`，各含 `meta.title`、`meta.description`、`meta.detail`。
   标题用包名 `dsh-websearch`，描述为一两句面向用户的定位。
2. 新增用户文档 `docs/plugin-page.zh.md` 与 `docs/plugin-page.en.md`，结构为：一句话定位、它做什么、
   设置项、接管与交还、关闭插件、兼容性、开发文档链接。
3. README 保留开发、安装与验收内容，顶部声明与用户文档的分工；英文镜像 `README.en.md` 同步。
4. `package.json` 的 `exports` 暴露 `./locale/*.json`；`files` 在 `locale` 之后逐文件列出两份用户文档，
   不整目录发布 `docs/`。
5. 契约测试锁定：元信息为非空字符串、`meta.detail` 路径合法且文件存在、文件已列入 `files`、
   导出模式存在；发布前校验两份 tarball 都含这些文件。

## Rationale（理由）

- 顺着官方文档顺序解决问题：给读取器它最先查找的东西，而不是把 README 改造成两用的折中物。
- GitHub 首页与 npm 包页仍然需要完整的开发与安装说明，README 的职责不变。
- 逐文件列入 `files` 是 dsh-mm-resilience P6、P7 已踩过坑的做法：命名文件不在包内会让插件页直接报错。

## Alternatives Considered（被排除的方案）

### 方案 A: 把 README 改写成用户文档
- **优点**: 不新增文件。
- **缺点**: 开发、安装、验收内容需要另找去处；README 体量大，插件页内滚动很长。
- **排除理由**: 读者不同，文档就该分开。

### 方案 B: 让 `meta.detail` 指向 README
- **优点**: 零改动。
- **缺点**: 命名文件不存在时硬错误，不如现有的回退稳；呈现内容不变，问题没有解决。
- **排除理由**: 不解决问题且降低健壮性。

### 方案 C: `files` 整目录包含 `docs`
- **优点**: 以后新增文档不必改清单。
- **缺点**: 会把数百份内部治理文档（会话记录、计划、审核日志）发布到 npm。
- **排除理由**: 不可接受。

## Consequences（后果）

### 正面后果
- 插件页显示本地化的标题、描述与简短的用户文档，不再出现开发细节。
- 用户文档里可以明确写出接管与交还的行为，减少误操作。

### 负面后果 / 风险
- 多两份需要与 README 保持一致的文档 → 用户文档只写行为与设置项，细节一律链接到仓库 README。
- 显示文案有两种语言 → 契约测试锁定两种语言字段齐全。

## References（关联）

- `docs/plans/2026-11-23-048-s41-takeover-docsplit-oidc-plan.md`
- `locale/zh.json`、`locale/en.json`、`docs/plugin-page.zh.md`、`docs/plugin-page.en.md`、`tests/package-meta.spec.ts`
- 上游依据：`packages/util/plugin-detail/README.md`（Document order）、`docs/cookbook/adding-a-package.md`
  （插件展示元信息），均为 tag `dsh-v0.2.2-rc.5`
- 参考：dsh-mm-resilience `docs/patterns.md` P2、P6、P7
- 相关 ADR: ADR-0026 — tarball 完整性校验覆盖本决策的文件清单
