# S26 T6 / plan 015 T5 — 独立 Agent 手册从零走通验证（阶段 4）

> 验证者：独立 general-purpose Agent（agent_cd5541d5，2026-09-13 04:32-04:36）
> 对象：v0.1.0 tarball + README.md 快速开始（plan 015 T5 验收：scratch profile 从零 安装→设置节→搜索）
> scratch home：/tmp/dshws-s26-s15t5/home（~/.dsh 生产零接触，mtime 对照在案）

## 判定：Tier B PASS（诚实失败证据链完整走通）

- **安装**：`plugin --profile web add <tarball>` 原样成立（README 命令在 0.1.5-rc.2 可用，无需手动 fallback）——`+ dsh-websearch file:…`，profile 自动初始化。
- **dump 三处接线**：`searchProvider: dshws-chain`（dump:343）/ `fetchProvider: dshws-fetch-gate`（:344）/ insert 行（:543-545）。
- **实例**：3491 启动（pid 60901，已 kill）；token 门健康（裸 401 → token 303/200）。
- **设置节/运行时路由**：HTML bundle href 显式含 dsh-websearch 客户端；聚合路由 200，11.2MB，113 处 `dshws-*` GUI 代码在位。
- **Tier B 无 key 证据**（探针直证）：五成员 ref 全部 not-ready；直连成员 fail-loud `DSHWS_TAVILY_CREDENTIAL_MISSING`（文案指向 credentials 页）；链必至 `DSHWS_CHAIN_EXHAUSTED`。搜索实证标注 **Tier B 待回补**（池内 key 可得时补真实搜索），不静默记完整走通。

## 手册缺陷（非阻塞，登记）

1. `dsh plugin --help` 缺 `--profile` 时错误路径 exit 0（宿主 CLI 问题，非插件手册面）。
2. `/plugins/<name>/client.js` 单文件路由 404——GUI 用聚合路由（`/plugins/??…`）不受影响；README 未指引单文件路径，无 action。
3. README 快速开始整体成立，无阻塞性缺陷。

## 结论

M5 文档腿验收（plan 015 T5）：**PASS（Tier B 档）**。README/upgrade 手册可独立照做。
