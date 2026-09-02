---
title: "ADR-0009: anysearch 第六成员（HTTP 自实现，dshws-anysearch）"
status: accepted
date: 2026-09-03
type: feat
origin: 用户需求扩展（2026-09-03 批准的功能扩展计划；anysearch 集成面三路线探索定谳）
---

# ADR-0009: anysearch 成员集成路线

## Status

accepted（2026-09-03，功能扩展计划用户批准）

## Context

用户需求：把 anysearch 纳入 dsh-websearch 插件成为链成员（用户持有 anysearch APIKEY；3080 实例目前单独安装 anysearch 插件作为 `web.searchProvider` 在用）。

探索实测（2026-09-03）：

1. anysearch = `@anysearch/anysearch-dsh` v0.1.4（官方 npm 线 0.1.0..0.1.4；3080 web profile 作为 bundle 加载，用户层 cordis.patch.yml 为空 `[]`）。
2. 它是 cordis 插件：apply 注册 `ctx.web` 双 provider（id 硬编码 `anysearch`）+ 3 个模型面工具；包根导出 provider/client 类。
3. **复用其 provider 类不可行**：类内硬编码 `id='anysearch'`，与本插件共存时重复注册 → 宿主 `WEB_DUPLICATE_PROVIDER`；且链成员要求 `dshws-` 前缀 id（ADR-0003）；peer 区间不相交（anysearch-dsh 要求 `@deepseek-ai/dsh-web` rc 线 `<0.1.2`，本插件 `>=0.1.2-alpha.3`）；其对 dsh-web 为运行时值 import。
4. **宿主 ctx.web 注册表私有不可枚举**（`WebRuntime` 私有 Map，无按 id 读取面；ADR-0003 断言源码证实）→ 引用已注册实例不可行。
5. **HTTP 规格完备可自实现**：`POST {baseURL}/v1/search`（默认 base `https://api.anysearch.com`），`Authorization: Bearer <key>`（凭据 ref 默认 `ANYSEARCH_API_KEY`，走 credentials 服务——与现有成员同构）；请求 `{query, max_results?, tag?, params?, zone?: 'cn'|'intl', language?}`；响应信封 `{code, message, data, request_id?}`（code≠0 = 业务错误），`data.results[].{title, url, snippet?, content?}` + `data.metadata`；`redirect: 'error'`。官方映射丢弃 results 的 `content` 字段——自实现可补映射。
6. 共存性：本插件成员 id `dshws-anysearch` 与 anysearch 插件 provider id `anysearch` 不冲突、工具名不冲突；`web.searchProvider` 标量为配置层合并（用户层 patch 后写覆盖 bundle 层）。

## Decision

1. **路线 = HTTP 规格自实现**（tavily.ts 模式同构）：新 `src/providers/anysearch.ts`，成员 id `dshws-anysearch`；不复用、不依赖 `@anysearch/anysearch-dsh` 包。
2. **映射策略**：`data.results[]` → sources（url/title/snippet），**snippet 取 `snippet`，缺席回退 `content`**（补官方映射的丢弃）；信封 `code≠0` → `DSHWS_ANYSEARCH_HTTP_ERROR`（带 message/request_id 诊断）；截断、abort、4xx/5xx 语义同现有成员五码族。
3. **config**：`anysearch: { enabled?, apiKeyEnv?='ANYSEARCH_API_KEY', baseURL?, zone?: 'cn'|'intl' }`（launch-static 字段沿成员惯例；zone 透传请求体）。
4. **默认链位**：`BUILT_IN_MEMBER_ORDER` **尾部追加** `dshws-anysearch`（ADR-0004 中立开箱默认序的既有语义不变——尾部追加不改变前五位相对序；用户可经 GUI 排序）。
5. **与 3080 anysearch 插件共存**：安装本插件成员后两者可并存（id/工具名隔离）；用户要把搜索切到链时，在**用户层** patch 把 `web.searchProvider` 钉为 `dshws-chain`（后写覆盖 anysearch 自带 bundle patch 的 `anysearch` 钉扎）；anysearch 插件的退役仍按 roadmap 上游验收阶段的退役步骤执行。
6. **错误码**：`MEMBER_ERROR_CODES.anysearch` 五码族（credentialMissing/requestFailed/httpError/badResponse/aborted）。

## Rationale

- 三路线中仅自实现同时满足：`dshws-` 前缀 id（链成员资格）、与 3080 已装 anysearch 插件共存（不重复注册）、peer 域干净（零新依赖，dont-do 版本线纪律零风险）。
- 自实现补齐官方映射丢弃的 `content`→snippet，信息保真优于官方 provider。
- HTTP 形态使 anysearch 成员天然进入既有测试矩阵（单测 mock + loopback 信封场景 + 真实 API 自跳 smoke）。

## Alternatives Considered

### 方案 A: import 复用 `@anysearch/anysearch-dsh` 的 AnySearchProvider
- 优点：零重实现；官方映射维护跟随上游。
- 排除理由：id 硬编码冲突（3080 共存场景必炸）；`dshws-` 前缀不可满足；peer 区间不相交 + 运行时值 import。

### 方案 B: 经 ctx.web 引用 anysearch 已注册 provider
- 排除理由：注册表私有无读取面（源码证实）；且引用外部插件实例使链语义受制于其生命周期（ADR-0002 成员契约由本插件持有）。

## Consequences

### 正面后果
- 用户现有 anysearch APIKEY 直接可用（ref `ANYSEARCH_API_KEY` 经凭据页/环境注入）；与 ADR-0008 多 key 池天然组合。
- anysearch 的 fetch 面（`/v1/extract`）v1 不做（fetch 链仍单成员 firecrawl）；需要时按同模式追加 `dshws-anysearch-fetch`，本 ADR 不预设计。
- 官方 anysearch 插件退役路径不受影响（S13 上游验收清单既有步骤）。

### 负面后果 / 风险
- HTTP 规格自实现 = 上游 API 变更的自担面（信封/字段漂移 → badResponse/httpError fail-loud，真实 API smoke 有 key 时可early-warning）。
- 官方 provider 的额外能力（tag/params/language 等透传字段）v1 不全量透传——按需增补，不预设计。
- 用户同时装官方 anysearch 插件与本成员时存在「两套 anysearch」心智（README/迁移手册需写清共存与切换语义，S12 素材）。
