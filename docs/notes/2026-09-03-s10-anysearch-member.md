# S10 实录：anysearch 第六成员——信封规格自实现与共存语义（2026-09-03）

> Session 10（feat/s10-anysearch-member）技术实录，S12 手册正素材。
> 决策正本：ADR-0009；计划：docs/plans/2026-09-03-010-s10-anysearch-member-plan.md。

## 信封规格（anysearch 与其余成员的唯一结构差异）

- `POST {base}/v1/search` + Bearer；响应**信封** `{code, message, data, request_id?}`——
  `code !== 0` 是**HTTP 200 下的业务错误**（第五失败形态，其余成员无此分支）：映射为
  `DSHWS_ANYSEARCH_HTTP_ERROR`，message 含信封 message + request_id（诊断锚点）。
- 映射补缺口：官方 `@anysearch/anysearch-dsh` provider 丢弃 `data.results[].content`——
  本成员 snippet 取 `snippet`、缺席回退 `content`（两形用例锁死优先级：both-present 取
  snippet）。
- `zone?: 'cn'|'intl'` 仅配置时透传请求体（缺省 body 无 zone 键——schema z.union 缺席
  不注入，S09 probe 惯例）。

## 接线 = 一行入池（S09 池化底座兑现）

`keyPool('anysearch', 'Anysearch', MEMBER_ERROR_CODES.anysearch)` + members 数组一项 +
MemberKey union 一员 + 公共导出三件——多 APIKEY/热通路/全池 gate 全部自动享用。S09
前瞻问句「anysearch 成员入池后自动享受池化」实测成立。

## 共存语义（3080 现场）

- 官方 anysearch 插件 provider id = `anysearch`（硬编码）；本成员 id = `dshws-anysearch`
  ——id/工具名零冲突，可并存。
- 切换链路：官方 anysearch 自带 bundle patch 钉 `web.searchProvider: anysearch`；用户层
  cordis.patch.yml **后写覆盖**钉 `dshws-chain` 即切到链（anysearch 作为链成员仍在链内）。
- 完全退役官方 anysearch 插件 = S13 上游验收清单步骤（bundle splice + patch 删行 +
  dump 对照）。

## 坑

- **语法校验循环是字面量枚举**（index.ts:103 `[resolved.tavily, …]`）——新增成员必须
  手工把 `resolved.anysearch` 加进循环，否则载入校验静默漏防（typecheck/既有测试零报
  错）。计划轮 2 必改②已把该点从「已泛化」的错误声称纠正为显式任务 + 红测试牙齿
  （anysearch extraApiKeyEnvs 非法名 → load TypeError，沿 apply.test 先例）。
- **成员插入位置**：members 数组首轮误插 firecrawl/deepseek 之间（非尾部）——拓扑断言
  （BUILT_IN 序）当场红。BUILT_IN 序 = 注册序 = GUI 卡序，三处同源，改动必须三处一致。
- **member 字面量注入的 regex 陷阱**：含 `...overrides` 展开的字面量不能机械注入
  resolved 缺省字段（注入点落在展开后 = 语法破坏；且 settings 侧字面量本就不该注入）——
  注入后 typecheck 红 + 展开位置语义错双杀，回退手改（必填字段置于展开前）。
