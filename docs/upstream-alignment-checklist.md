# 上游对齐验证清单（Upstream Alignment Checklist）

> **适用场景**（[dont-do 入册](dont-do.md#上游适配验证纪律session-35-t11-入册用户裁定升级为常备门槛)）：插件功能扩展、成员 API 适配、随上游 DSH 版本更新适配——每次变更必须按本矩阵**逐成员 × 逐面**做 happy + error 双路确认，缺一格不得宣布该面适配完成。矩阵留痕入当期 session 记录。

## 一、请求面对齐矩阵（当前基线 v0.2.0）

鉴权头均经 credentials 服务按操作解析；`user-agent: dsh-websearch/<version>` 全成员统一。

| 成员 | 面 | 端点 | 方法 | 请求形状 | 期望成功 | 错误路径（确定性触发） |
|---|---|---|---|---|---|---|
| anysearch | search | `{baseURL}/v1/search` | POST | `{query, max_results?, zone?, language?}` + `Authorization: Bearer` | HTTP 200 信封 `code:0`，`data.results[]` | `code!==0`（HTTP 200）与 HTTP 4xx 双形态；422 extract_failed 时消息须含上游 detail |
| anysearch | fetch | `{baseURL}/v1/extract` | POST | `{url}` + Bearer | HTTP 200 `code:0`，`data.content`（~50k 探针上限，`truncated` 标记） | 同上；**不存在词条 → 422 `Unable to extract content from the URL.`**（dd5a9df 回归锚点） |
| tavily | search | `{baseURL}/search` | POST | `{query, max_results?, …}` + Bearer | HTTP 200 `results[]` | invalid-key 401 消息含上游 detail；**422 = FastAPI 数组 detail**（`msg @loc` 渲染，S37-T2）；`include_domains_mode` 仅 `restrict\|prefer`（legacy filter/boost resolve 归一化，S37-T1） |
| tavily | fetch | `{baseURL}/extract` | POST | `{urls:[url]}` + Bearer | HTTP 200 `results[]`（markdown） | 同上 |
| exa | search（含 text 兜底） | `{baseURL}/search` | POST | `{query, numResults?, contents?}` + Bearer | HTTP 200 `results[]`（snippet/text） | invalid-key 401 消息含上游 detail；**category=company/people 禁三参数**（start/endPublishedDate+excludeDomains，守卫 S37-T3）；includeSections 闭集 7 值（S37-T6） |
| firecrawl | search | `{baseURL}/v2/search` | POST | `{query, limit?…}` + Bearer | HTTP 200 `data[]` | invalid-key 401 消息含上游 detail；408/500 携 `code` 维度（`[TIMEOUT]` 等，S37-T2）；categories 枚举含 **alexandria**（research **2026-11-16 迁移**，S37-T7） |
| firecrawl | scrape（fetch 面） | `{baseURL}/v2/scrape` | POST | `{url, formats:[{type:'markdown'}]}`（官方对象形，S37-T7） | HTTP 200 `data`（markdown） | 同上 |
| deepseek | search | `{baseURL}`（searcher 端点） | POST | x-api-key + Bearer 双头 | HTTP 200 sources | invalid-key 4xx 消息含上游 detail |

**已实测认证的错误信封形态**（curl 直证 2026-09-28，unfolds 均已回归锁定）：

| 成员 | 触发 | 状态 | 信封形态 |
|---|---|---|---|
| anysearch | 不存在词条 fetch | 422 | `{code:-1, message:"Unable to extract content from the URL.", error_code:"extract_failed"}`（top-level message） |
| tavily | invalid key | 401 | `{"detail":{"error":"Unauthorized: missing or invalid API key."}}`（**嵌套 detail.error**——曾逃逸 pick()，f8e0a3f 修复） |
| exa | invalid key | 401 | `{"error":"Invalid API key. …","tag":"INVALID_API_KEY"}`（top-level error） |
| firecrawl | invalid key | 401 | `{"success":false,"error":"Unauthorized: Invalid token"}`（top-level error） |
| firecrawl | 超时/未知 | 408/500 | `{"success":false,"code":"TIMEOUT","error":"…"}`（code 追加 `[TIMEOUT]`——S37-T2） |
| tavily | 参数校验失败 | 422 | `{"detail":[{type,loc:["body","query"],msg,input}]}`（**FastAPI 数组**——`msg @loc` 渲染，S37-T2） |
| anysearch | 任意 HTTP 错误 | 4xx/5xx | 信封含 `request_id`+`error_code`（官方要求每个错误响应携带——S37-T4 起双路径入消息） |

注：exa/deepseek 无独立 fetch 面（链配置 `fetchChain` 不含二者）；矩阵列「面」以 `src/providers/*.ts` 实有请求面为准——新增面时先扩本表再写码。

## 二、逐格确认项（每格四查）

1. **端点/方法**：URL 路径、HTTP 方法与上游现行文档一致（防上游版本切换漂移——firecrawl 已历 v1→v2）。
2. **请求形状**：body 字段名/类型/必可选、鉴权头形态（Bearer vs x-api-key）、content-type。
3. **成功路径**：响应信封形状、映射函数消费字段、边界（空 results、截断标记）。
4. **错误路径**：确定性触发（invalid-key 401 / 不存在资源 4xx），断言**抛出的错误消息携带上游响应体 detail**（unfoldHttpErrorDetail 家族模式，8 面同构）。

## 三之前、DSH 上游维度（随宿主版本适配时必做）

| 检查 | 方式 | 采信 |
|---|---|---|
| 六包全版本清单 | `npm view @deepseek-ai/<pkg> versions`（agent/web/settings/tools/credentials/system-prompt） | 输出留痕 |
| peer 域覆盖 | 本仓 semver `satisfies` 全量过滤（禁目测） | 未覆盖新版本→扩钉独立呈批 |
| 宿主行为面 | 3434 演练位实测（dump 钉扎/徽标/插件装卸三态） | S32 三线矩阵 |

## 三、执行方式

- **单测层（必做，每次变更）**：`tests/providers/<member>.test.ts` 的 `!response.ok` 用例断言 detail 拼接（mock 信封）。
- **real 层（发版/适配批必做）**：`tests/e2e.real/<member>.real.test.ts` 错误路径用例（无 key 自跳过；确定性触发不烧配额）。
- **实测层（用户可见行为变更时）**：3423 实例逐成员单开，按 [upgrade.md](upgrade.md) §3 实测流程，chain-log `served-by` / `member failed (…detail…)` 行留痕。

## 五、带日期债务

- **2026-11-16**：firecrawl `research` → `alexandria` 迁移（官方公告）——到期任务：验证 `research` 迁移后行为（400 还是软重定向），必要时移除旧值 + 用户通知（S37-T7 登记）。

## 四、历史锚点

- 2026-09-27 S35 T11：anysearch fetch 面 422 信封裸抛（8 面唯一缺 unfold），happy-path-only 口径下全链路逃逸至用户侧 → dd5a9df 修复 + 本清单立册。
- 2026-09-28 S37 二轮：官方文档直证抓获 2 个确定性 400（Tavily 枚举漂移 filter/boost→restrict/prefer、Exa category 禁第三参数 endPublishedDate）+ 信封三残缺（数组 detail/code/request_id 对称）→ T1-T7 修复（红→绿逐项）；**对齐流程升格 AGENTS.md 强制节（T15）**。
