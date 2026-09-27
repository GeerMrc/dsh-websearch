# 上游对齐验证清单（Upstream Alignment Checklist）

> **适用场景**（[dont-do 入册](dont-do.md#上游适配验证纪律session-35-t11-入册用户裁定升级为常备门槛)）：插件功能扩展、成员 API 适配、随上游 DSH 版本更新适配——每次变更必须按本矩阵**逐成员 × 逐面**做 happy + error 双路确认，缺一格不得宣布该面适配完成。矩阵留痕入当期 session 记录。

## 一、请求面对齐矩阵（当前基线 v0.2.0）

鉴权头均经 credentials 服务按操作解析；`user-agent: dsh-websearch/<version>` 全成员统一。

| 成员 | 面 | 端点 | 方法 | 请求形状 | 期望成功 | 错误路径（确定性触发） |
|---|---|---|---|---|---|---|
| anysearch | search | `{baseURL}/v1/search` | POST | `{query, max_results?, zone?, language?}` + `Authorization: Bearer` | HTTP 200 信封 `code:0`，`data.results[]` | `code!==0`（HTTP 200）与 HTTP 4xx 双形态；422 extract_failed 时消息须含上游 detail |
| anysearch | fetch | `{baseURL}/v1/extract` | POST | `{url}` + Bearer | HTTP 200 `code:0`，`data.content`（~50k 探针上限，`truncated` 标记） | 同上；**不存在词条 → 422 `Unable to extract content from the URL.`**（dd5a9df 回归锚点） |
| tavily | search | `{baseURL}/search` | POST | `{query, max_results?, …}` + Bearer | HTTP 200 `results[]` | invalid-key 401 消息含上游 detail |
| tavily | fetch | `{baseURL}/extract` | POST | `{urls:[url]}` + Bearer | HTTP 200 `results[]`（markdown） | 同上 |
| exa | search（含 text 兜底） | `{baseURL}/search` | POST | `{query, numResults?, contents?}` + Bearer | HTTP 200 `results[]`（snippet/text） | invalid-key 401 消息含上游 detail |
| firecrawl | search | `{baseURL}/v2/search` | POST | `{query, limit?…}` + Bearer | HTTP 200 `data[]` | invalid-key 401 消息含上游 detail |
| firecrawl | scrape（fetch 面） | `{baseURL}/v2/scrape` | POST | `{url, formats…}` + Bearer | HTTP 200 `data`（markdown） | 同上 |
| deepseek | search | `{baseURL}`（searcher 端点） | POST | x-api-key + Bearer 双头 | HTTP 200 sources | invalid-key 4xx 消息含上游 detail |

**已实测认证的错误信封形态**（curl 直证 2026-09-28，unfolds 均已回归锁定）：

| 成员 | 触发 | 状态 | 信封形态 |
|---|---|---|---|
| anysearch | 不存在词条 fetch | 422 | `{code:-1, message:"Unable to extract content from the URL.", error_code:"extract_failed"}`（top-level message） |
| tavily | invalid key | 401 | `{"detail":{"error":"Unauthorized: missing or invalid API key."}}`（**嵌套 detail.error**——曾逃逸 pick()，f8e0a3f 修复） |
| exa | invalid key | 401 | `{"error":"Invalid API key. …","tag":"INVALID_API_KEY"}`（top-level error） |
| firecrawl | invalid key | 401 | `{"success":false,"error":"Unauthorized: Invalid token"}`（top-level error） |

注：exa/deepseek 无独立 fetch 面（链配置 `fetchChain` 不含二者）；矩阵列「面」以 `src/providers/*.ts` 实有请求面为准——新增面时先扩本表再写码。

## 二、逐格确认项（每格四查）

1. **端点/方法**：URL 路径、HTTP 方法与上游现行文档一致（防上游版本切换漂移——firecrawl 已历 v1→v2）。
2. **请求形状**：body 字段名/类型/必可选、鉴权头形态（Bearer vs x-api-key）、content-type。
3. **成功路径**：响应信封形状、映射函数消费字段、边界（空 results、截断标记）。
4. **错误路径**：确定性触发（invalid-key 401 / 不存在资源 4xx），断言**抛出的错误消息携带上游响应体 detail**（unfoldHttpErrorDetail 家族模式，8 面同构）。

## 三、执行方式

- **单测层（必做，每次变更）**：`tests/providers/<member>.test.ts` 的 `!response.ok` 用例断言 detail 拼接（mock 信封）。
- **real 层（发版/适配批必做）**：`tests/e2e.real/<member>.real.test.ts` 错误路径用例（无 key 自跳过；确定性触发不烧配额）。
- **实测层（用户可见行为变更时）**：3423 实例逐成员单开，按 [upgrade.md](upgrade.md) §3 实测流程，chain-log `served-by` / `member failed (…detail…)` 行留痕。

## 四、历史锚点

- 2026-09-27 S35 T11：anysearch fetch 面 422 信封裸抛（8 面唯一缺 unfold），happy-path-only 口径下全链路逃逸至用户侧 → dd5a9df 修复 + 本清单立册。
