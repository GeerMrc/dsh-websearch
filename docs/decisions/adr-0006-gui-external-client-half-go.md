---
title: "ADR-0006: 设置页 GUI 走外置 client half（S02 spike GO，fallback 不启用）"
status: accepted
date: 2026-09-02
type: arch
origin: ADR-0005 spike-first 决策的承接；Session 02 五假设实测
---

# ADR-0006: 设置页 GUI 走外置 client half

## Status

accepted（2026-09-02，Session 02 spike 定谳；取代 ADR-0005 的「GO/NO-GO 待定」状态）

## Context

ADR-0005 把 GUI 形态压到 S02 spike：「外置插件的 client half 能否注入 `settings.section` slot 并使用 locale/remote」未经实测——上游 in-repo client 包不构成外置形态证据。S02 以一次性 spike 包 `dsh-websearch-spike`（/tmp，不入库）在 scratch profile（`DSH_HOME=/tmp/dshws-s02-spike/home`，`web` 模板，端口 3410）完成端到端实测。

实测证据（2026-09-02，全部亲见）：

1. **分发**：包声明 `dsh.client.platform: 'web'` + `exports["./client"]`（预构建 cjs bundle，banner `window.__ModuleLoader__.load({id, factory})` 契约）后，boot 图收录该包，combo 响应 200（5.1MB）含 `id: "dsh-websearch-spike"` 注册。单包 URL `/plugins/<pkg>/client.js` 返回 404——服务端只回放预生成 combo（combo-only），URL 形态是内部细节不影响加载。
2. **slot 注入**：`ctx.slots.inject('settings.section', () => ctx.slots.register({name,id,order,label,locale}, Component))` 后设置对话框出现 spike 导航项（en「Web Search Spike」/zh「网页搜索 Spike」），节面板完整渲染。
3. **locale**：`ctx.locale.register(NS, {zh, en})` + `ctx.locale.bind(NS)`；语言热切换 en↔zh 后导航、标题、正文全部正确切换（en/zh 全键 parity）。
4. **细粒度 inject 契约**：漏声明 `'remote.settings'` 时运行时 fail-loud `cannot get property "remote.settings" without inject`——外置 client half 必须按服务细分声明 inject（`remote.settings`/`remote.credentials` 等），上游 `ui-settings-plugins` 的 inject 面即范本。
5. **remote 写通路**：`ctx.remote.settings.describe/update`（mutate）与 `ctx.remote.credentials.set/unset/describe` 从外置 bundle 全通（H3/H4，证据见 ADR-0007 引用的 session 记录）。

## Decision

**GO**：正式插件在本仓库内自带 client half（`src/client/`，构建为 `lib/client.js` 随包分发），S06/S07 按 roadmap 原目标执行。ADR-0005 的 fallback（fork 仓库独立 client 包目录）不启用。

## Rationale

- 外置 client half 全链路（分发→slot→locale→remote 读写）实测无平台阻断；唯一发现（细粒度 inject 声明）是使用纪律而非结构缺陷。
- fallback 只在分发机制不通时才有价值；既证可用，分离两包只增加联调成本。

## Alternatives Considered

### fallback：fork 仓库独立 client 包目录（ADR-0005 预授权）
- **排除理由**：前提（外置 client half 不可用）被 spike 证伪。

### 方案 B：v1 无 GUI（纯 YAML）
- **排除理由**：与用户核心需求冲突（ADR-0005 已排除，不因 spike 改变）。

## Consequences

### 正面后果
- S03 的包骨架可同时携带 node half 与 client half，一条安装命令交付全部能力。
- 构建契约已实测：client bundle 独立 tsdown 配置（cjs + banner + `entryFileNames: 'client.js'` + `inlineDynamicImports`；外部依赖仅模块表基线 + 自家 `dsh.client.inject` 行）可直接复用为 S03 的构建蓝本。

### 负面后果 / 风险
- 上游 client 构建契约（banner/模块表）当前无稳定性承诺，alpha 升级需按升级演练手册回归（S09 交付）。
- combo-only 分发依赖服务端预生成快照；若上游改为按需分发需重验（记入升级演练清单）。

## References

- `docs/00-architecture.md` §8（开放问题 1/3/4——本 ADR 封闭 1，3/4 见其实测证据）
- `docs/decisions/adr-0005-gui-form-factor-spike-first.md`
- Session 02 记录（`docs/sessions/2026-09-02-session-02.md`，H1-H4 证据原文）
- 上游机制锚点：`packages/client/modules/src/index.ts:586,738-773`（发现与分发）、`packages/client/ui-settings/src/client/contract/slots.ts:54`（slot 契约）、`packages/api/settings-controller/src/credentials.ts:67-153`（credentials RPC 面）
