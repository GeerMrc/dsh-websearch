---
title: "ADR-0019: web_fetch 全模式多链接管——gate 运行时路由器 + 三家 fetch 链 + 两态开关"
status: accepted
date: 2026-09-10
type: feat
origin: 用户主计划批准（2026-09-10，四决策获答）；supersedes S15c 的 restrict 隐藏态；web_fetch 🟡 债务翻账
---

# ADR-0019: web_fetch 全模式多链接管

## Status

accepted（2026-09-10；supersedes S15c 隐藏态；amends ADR-0018 无涉——独立决策线）

## Context

1. S15c 以来 web_fetch 对模型彻底隐藏（restrict + prompt 遮蔽）——「按 URL 取全文」能力缺口登记 🟡（S16-P0）。
2. 三家成员上游有 fetch 能力：Firecrawl /v2/scrape（markdown 全文，代码在档未注册）、Tavily /extract（规格全公开，PDF URL 支持）、AnySearch /v1/extract（探针定案：去噪 Markdown、50k 上限坐实）；**Exa 上游无 URL-fetch 能力**。
3. 架构红利：云端 extract 完全绕开本机 fake-ip × 宿主 SSRF 限制（S14v 顽疾——服务端抓取不受影响）。
4. fetch 链骨架 90% 现存（ChainFetchProvider/firecrawl face/fetchChain config/patch 钉扎），恢复成本低。

## Decision

1. **gate 运行时路由器（patch 零改动）**：patch 继续钉 `fetchProvider: dshws-fetch-gate`；gate 构造增 `chainFetch` lazy thunk（单一机制，无 setter）——ON 委托内部 ChainFetchProvider（Firecrawl → Tavily → AnySearch 降级链），OFF 走 gate 内置 http 直抓（**官方行为等价近似**——redirect:'error'/200k/二进制/SSRF 四守卫；patch 钉死下官方 provider 实例永不被选，此为用户「OFF=官方」决策的落地口径）。
2. **restrict 监听退役**：agent/created 的 deny + prompt 遮蔽整体删除——web_fetch 恒可见，ON 时由链服务（用户两态决策：要么插件链全面接管，要么官方；隐藏态无场景支撑被弃）。
3. **fetch 链成员与独立性边界**：成员 = 三家有 fetch 能力者；`FETCH_CHAIN_DEFAULT_ORDER = [firecrawl, tavily, anysearch]`（Exa 永不进——上游无能力）。**「独立」= 链序与成员集合独立**（fetchChain 独立配置/排序/GUI 独立行组）；**成员级 enabled 启停天然跨链共享**（最小配置面——不新增 fetchEnabled 独立门，关 Tavily 同退两链）。
4. **无 http 回退尾**：云端三家全败即诚实报错（DSHWS_CHAIN_EXHAUSTED 同款哲学；fake-ip 环境下 http 尾本就抓不了公网域名）。
5. **内部 registry**：ChainFetchProvider 不经 ctx.web.registerFetchProvider——`dshws-chain-fetch` 永不成为用户可 pin 的 provider id（gate 是唯一注册面，patch 钉它）。

## Consequences

- 正面：web_fetch 能力回归且强于官方（多云端降级 + 绕开本机 SSRF 限制 + 多 key 重试）；🟡 债务翻账；GUI 双链独立排序。
- 负面/接受：OFF 态是 gate 内置 http 而非官方实例（行为等价近似，措辞正位）；成员启停跨链（独立性边界如上）；AnySearch extract 50k 截断（truncated 标记）；Tavily extract 计费 1 credit/5 URL basic。
- 关联：supersedes S15c（session-15c 记录 + CHANGELOG 历史档）；web_fetch 🟡（progress-M7 L481）本棒翻账。
