---
title: "ADR-0023: 官方桌面端采用与双 profile 适配策略"
status: accepted
date: 2026-09-30
type: feat
origin: roadmap S40 桌面端采用批（用户计划批准 2026-09-30）；证据正本 [docs/desktop-adoption.md](../desktop-adoption.md)；前置：ADR-0013（装即接管 patch）、ADR-0020（版本线）、AGENTS.md seam 纪律
---

# ADR-0023: 官方桌面端采用与双 profile 适配策略

## Status

accepted（2026-09-30 起草并随 S40 双端实测矩阵全绿转 accepted；证据链见 desktop-adoption.md §9 与 session-40 记录）

## Context（背景）

官方 DSH 0.2.0-rc.2 起 `download.deepseek.com` 分发 Electron 桌面客户端（同仓 `apps/desktop` 构建，非独立版本库）。桌面端与 `dsh web` 复用同一 `$DSH_HOME`（数据层共享、设置与**插件按 profile 隔离**），host 跑同一 Web 应用栈（19387 vs 3080）。本插件此前只适配 web profile。约束：桌面 profile 受 CLI 守卫（外部 `dsh plugin --profile desktop` 硬拒，唯一矢量 = app 内置 carrier）；桌面更新通道为 nightly + `allowPrerelease`（一次更新即替换捆绑运行时）；`dsh.client.platform: "web"` 契合桌面渲染进程（跑同一 web 客户端栈）。

## Decision（决策）

- **D1 双 profile 各自安装，零平台分叉**：插件包不做任何桌面专属分支；web 与 desktop 两个 profile 各自 `plugin add` 一份（隔离语义由宿主保证）。共享层（`.credentials.yaml`/sessions/storages/skills/机器级 patch）免重配——官方端实测四成员 key 直接解析成功。
- **D2 安装矢量 = 内置 launcher 直调**：`'<app>/Contents/Resources/runtime/cli/bin/dsh' plugin --profile desktop add <spec>`（shell 脚本 → `ELECTRON_RUN_AS_NODE` 跑 app.asar 内 desktop-host cli，`manageDesktopProfile: true`）。零提权、零 UI 输入；`/usr/local/bin/dsh` 仅是 PATH 便利件（app 内对话框 + 管理员提权，非功能依赖）。dev 形态下 cli.js 自定位解析到卷根不可用，须显式调 `runDesktopCli(projectDir, <primary-runtime>/dependencies)` 复刻（载体脚本见 upstream-sync-sop §4）。
- **D3 版本策略不变，桌面 feed 纳入触发线**：peer 域扩钉仍按 AGENTS.md 立宪流程（`npm view` 全列表 + semver `satisfies` 实测 + UA 钉 + 对齐矩阵 + tag 即发布）；新增**桌面更新触发链**——官方桌面 feed 版本变化 = 捆绑 runtime 版本变化 = peer 域复评触发器（预发布不在 `>=0.2.0 <0.3.0` 区间，官方桌面每升一版都可能拒装）。
- **D4 运行面等价性主张（以实测为界）**：host 半区（provider/DNS 层）跑在 host 子进程纯 Node，桌面化不改变运行面（DoH 证据行双端一致实测）；client 半区经 `/plugins/` 同一分发路由（Electron 侧 `no-store`，换包须整页刷新的既有指引双端成立）。运行时真实搜索腿不随桌面端重复烧 API——由插件仓测试套件 + 生产实录 + 同版本组合等价性覆盖。

## Rationale（理由）

装即接管（ADR-0013）的 patch 语义与 profile 隔离天然解耦双端：同一 tarball 双 profile 复用，避免维护两套制品；carrier 直调绕开"等官方 Plugins 页支持第三方 spec"的不确定面；桌面 feed 触发线把"自动更新静默破坏插件"从隐患变成有监测、有 SOP 的常规循环。

## Consequences（后果）

- 每次插件发版后，生产 3080 与官方桌面 19387 各执行一次 `plugin add`（同 tarball）；
- 桌面用户更新 app 后插件可能拒装/失活——README FAQ 已设预期条目与自查/重装命令；
- 官方若改 carrier 路径/协议（`DESKTOP_HOST_PROTOCOL_VERSION` 目前 = 4），SOP 监测线负责捕获。
