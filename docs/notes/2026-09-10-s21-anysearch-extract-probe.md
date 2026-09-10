# AnySearch /v1/extract 真实探针契约（S21 T1 正本）

> 2026-09-10，池内活 key 实测（5-key 池第 1 把；探针工件 /tmp/dshws-s21/extract-probe-{1..4}.json）。
> 用户侧调研细节逐条坐实结论见尾表。

## 端点与请求

- `POST https://api.anysearch.com/v1/extract`（路径**实测确认**——此前的信封推断正确）
- 认证：`Authorization: Bearer <key>`（与 search 同域同 key——同一把 key 在两端点均可用）
- body：`{"url": "<single-url>"}`——**单 URL 字符串**；`urls` 数组形态 **400 拒绝**（`URL is invalid.`）

## 响应（信封规格，与 search 同构）

```json
{ "code": 0, "message": "success", "request_id": "…",
  "data": { "url": "…", "title": "…", "content": "<markdown>" } }
```
- `data.content` = **去噪 Markdown**（example.com 产出标题级 MD；docs.firecrawl.dev 38KB 页产出 31,961 字符干净文档 MD——去噪坐实）
- `data.title` 可映射 fetch 结果辅助信息（seam 无槽——留链日志/不映射）

## 错误形态（业务错误在 HTTP 200 上）

| 场景 | HTTP | body |
|---|---|---|
| URL 语法非法 | 200 | `{code:-1, message:"URL is invalid.", error_code:"invalid_extract_url"}` |
| 页面不可提取（404/空） | 200 | `{code:-1, message:"Unable to extract content from the URL.", error_code:"extract_failed"}` |
| key 无效 | 200 | `{code:-1, message:"Invalid API key."}` |

→ face 映射：`code !== 0` → `DshwsError(httpError, message)`（沿 anysearch search 面同路径，链内降级）。

## 长度上限

- **50,000 字符上限坐实**：Wikipedia Python 条目（原文远超）实测 content = **49,934** 字符（≈50k 截断；非精确 50000——截断点按上游内部 token/块边界，上限量级坐实）。
- face 映射：`content.length >= 49900`（防御带）→ `truncated: true`；否则 false。

## 用户侧调研逐条坐实表

| 调研声称 | 实测结论 |
|---|---|
| URL → 去噪 Markdown | ✅ 坐实（两页实测） |
| 50,000 字符上限 | ✅ 坐实（49,934 实测，防御带 49900 判 truncated） |
| HTML-only（不支持 PDF） | ⚠️ 未测（无 PDF URL 样本；GitHub skill README 公网佐证维持）——face 不特判，PDF 行为交上游（extract_failed 路径兜住） |
| REST /v1/extract 端点 | ✅ 坐实 |
| MCP extract 工具 | 不在本探针面（公网佐证在档，不涉 face 实现） |

## 与 seam 的映射定案（T3 实现契约）

`WebFetchResult = { url: data.url ?? request.url, statusCode: 200, body: {kind:'text', content: data.content}, truncated: content.length >= 49900 }`；`code!==0` → throw DshwsError(httpError)（链降级）；超时预算走链 perMemberTimeoutMs + curl -m 观察到的服务端耗时（example.com ~1s / 38KB 页 ~3s——30s 链预算内宽裕）。
