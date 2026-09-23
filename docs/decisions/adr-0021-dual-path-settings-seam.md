---
title: "ADR-0021: 跨上游 settings 模型双径适配——单一构建服务 0.1.5–0.1.7 三线"
status: accepted
date: 2026-09-23
type: architecture
origin: S32 全跨度升级批（用户三裁定之一；T2 兼容矩阵 Note s32 破坏面 C-2）
---

# ADR-0021: 跨上游 settings 模型双径适配

## Status

accepted（2026-09-23）

## Context

1. 上游 0.1.7-alpha.2（commit 601d6761e4）重写 settings 包：`SettingsProvider.installSection/register` **删除**，改为 volatile-Config 投影模型——namespace = profile 插件条目，`describe()` 只列 Config 含 `.volatile()` 字段的条目，写经 configEditor 落 profile patch（旧 settings.yaml 由 `importLegacyDocument` 一次性迁移）。
2. 生产 3080 供版树维持 0.1.6-alpha.1（用户裁定 2026-09-23：修死 tgz、树不切），其 settings 仍是旧 `installSection` 模型；peer 域已按用户裁定全跨度覆盖 0.1.5-rc.1…0.1.7-alpha.2。
3. schemastery 3.18.4 的 `.volatile()` 在 **schema 调用时**（插件侧、与宿主版本无关）就把字段解析为 `Volatile<T>` handle——旧宿主的 GUI describe 若拿到 handle 会在序列化后变成空对象。
4. 两模型的自定义校验时机不同：旧模型有 `validate` 写前钩子（ADR-0018 域互斥等三条规则写前拒绝）；新模型只做 schema 级校验，无插件侧写前钩子。

## Decision

1. **双 schema 工厂**（`buildConfigSchema(markVolatile)`）：导出 `Config`（全字段 volatile 标注，供 0.1.7+ 宿主 live-forms 注册与 loader 解析）与 `ConfigLegacy`（同字段无标注，仅供旧宿主 `installSection` 路径，避免 handle 序列化空洞）。
2. **运行时特性探测分派**（`attachSettingsSection`）：宿主 settings 服务有 `installSection` → 旧径（ConfigLegacy + 物质化 entry + validate/setSource/onChange 钩子全保留）；无 → 0.1.7+ 新径（`LiveResolvedConfig.setVolatileSource` 读时求值 + 订阅 `settings/document-updated` 本 namespace 触发 re-prime）。
3. **统一物质化层**：`materializeConfig(ConfigRuntime): Config` 浅解包（volatile 标注恰在顶层字段与五个成员对象上）；`resolveConfig` 入口先物质化，容忍 plain 与 handle 两形态。
4. **读时求值模式**：`LiveResolvedConfig.current()` 在 volatile 模式下每次调用重算——提交变更无需事件即达下次搜索。
5. **校验降级显式化**：0.1.7+ 路径上 ADR-0018/tbs/exa 三规则降级为 resolve 时 loud 失败（写前不拦）；GUI 端 schema 级校验仍由宿主执行。
6. client 半区零改动（wire 面 `SettingsDescribeValue`/`SettingsNamespaceView.update` 签名未变，矩阵 seam 3）。

## Consequences

- 单一 client/node 构建跨三线：0.1.5/0.1.6 宿主走旧径（值 plain、GUI 值经 ConfigLegacy 解析）、0.1.7+ 走新径（handle 读时求值）。3434 三线演练为该设计的运行时验收正本。
- 0.1.7+ 上无效域组合的反馈时机从「写前」退到「读取（下次搜索/设置页重开）」——记录为已知差异，待上游提供写前钩子再收口。
- 旧径的 `settings/document-updated` 订阅不注册（旧径已有 onChange）；两径 re-prime 语义等价。
- 弃用任一路径的前提：生产供版树升过 0.1.7 或 0.1.5/0.1.6 线明确退役（届时删 `ConfigLegacy`、`materializeConfig` 容忍层与特性探测，收敛为纯 volatile 模型）。
- 同族适配（本 ADR 的模式库）：图标双名回退（`host-icons.tsx`，`*Outline14`↔`*OutlineRegular`）与 typert strict codec `schema`→`create` 字段更名同属「单一构建跨线」家族，后续同类破坏面优先复用双径/双名形态而非分叉构建。
