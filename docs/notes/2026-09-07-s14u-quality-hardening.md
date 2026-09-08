# S14u 实录：搜索链重试机制质量收口（双深审 🔴×3 清偿 + 预算/分流/残渣）（2026-09-07）

> Session 14u（feat/s14u-quality-hardening）技术实录。触发：用户全面审核指令 → 双
> Agent 深审出 🔴×3 + 🟡×5（锚点清单正本 = plan 014u 审核锚节；深审原文只存在于
> 当期会话上下文，未落盘——过程披露见 session-14u 记录）。计划：
> docs/plans/2026-09-07-014u-s14u-quality-hardening.md。

## 三 🔴 根因：S14r 重试改造是「半接线」状态

S14r 落了 draw 循环，但三处配套没跟上——骨架健康（abort/署名/凭据热读/换牌均正确），
接线缺口全在 gate 与预算层：

1. **auto 兜底断裂**（index.ts gates × config.ts deepseek.enabled 默认 false）：deepseek
   成员沿用 S14d 付费 opt-in 的 enabled gate，`fallbackProvider` 命名它为链尾时被
   `enabled: false` 静默逐出——auto 三态里「有 key」象限的付费地板不可达，auto 实际
   等价免费兜底。修复：链尾成员资格唯一入口 = `fallbackProvider` 命名（gate 对
   deepseek 恒 true）；enabled flag 只再管可排序成员。
2. **order 盲重试**（keys.ts `hasMultiKeyPool` 只看 key 数）：order 策略每次 draw 恒取
   `keys[0]`，同 key 同错重试 3 次纯放大延迟。修复：语义钉「下一次 draw 能拿到不同
   key」——`>1 && selection() !== 'order'`。
3. **loopback e2e 外网依赖**：全败场景未钉 fallback，链尾 fetch-search 真连
   html.duckduckgo.com——离线环境随机红。修复：场景钉 `fallbackProvider: 'deepseek'`
   + `deepseekAtLoopback` 旗标（端口在 assemble 内取 `server.port`——调用方无法预知
   临时端口；port 0 占位符只会得到连接拒绝的 REQUEST_FAILED，到不了 HTTP 层）。

## 重试机制定稿语义（T4/T5 后）

| 层 | 语义 | 上限 |
|---|---|---|
| 成员级（跨工具） | 顺序降级（ADR-0002/0004 不变） | 链序全长 + 固定链尾地板 |
| 成员内 key 级（S14r） | 同成员 redraw 换 key，仅多 key 池且策略可换把（order 排除） | 3 draw（含首次） |
| 成员预算 | **一个共享 deadline 跨全部 draw**（非每 draw 各一计时器） | ≤ 1× perMemberTimeoutMs |
| 分流（T5） | 确定性 4xx（400/401/403/404/422，`DshwsError.httpStatus` 标记）直接降级不烧 draw；429/5xx/网络错/badResponse 保留 redraw | — |
| 耗尽摘要（T4） | **每成员一行**：单 draw `- id: reason`；多 draw `- id: failed (3 draws: a; b; c)`；`all N` = 成员数非 draw 数；cause = 末成员末 draw 抛错 | — |

- `NON_RETRYABLE_HTTP_STATUSES` 在 errors.ts；六个 HTTP provider 的 httpError 抛点附
  `httpStatus`；anysearch HTTP-200 envelope 业务错**不附**（无 HTTP 错误状态，fail-open
  保留重试资格）。
- 预算耗尽不起 0ms 假 draw：redraw 前查剩余，≤0 记 `DSHWS_MEMBER_TIMEOUT: member
  budget of Nms spent after K draw(s)` 直接降级。

## 零可用成员三态呈现（T6 假警告清偿）

链卡零可用成员时不再一律红色「将失败」：fetch 地板（免凭据）→ 中性「由免费 fetch 兜底
服务」；DeepSeek 地板已配 key → 中性「由 DeepSeek 兜底服务」；仅 `fallbackProvider:
deepseek` 且 key 缺失 → 红色诚实失败警告（文案点名 DeepSeek key 未配置）。

## 坑

- **gate 半接线**：改 draw 语义必须同轮审所有 gate 消费者（enabled/credentials/
  multiKeyPool）——S14r 只接了循环没接策略 gate，深审才现形。新增 gate 时列全量消费面。
- **e2e 钉尾要钉到端口**：钉「成员名」不够，baseURL 必须真指 loopback `server.port`；
  port 0 占位符把 HTTP 层失败伪装成 REQUEST_FAILED，断言判别点错层。
- **后续用户裁决会静默杀死早期 UI 语义**：S14b D2「禁用成员列示惰性行」被 S14r「就绪
  成员才入链」过滤后变不可达死分支——两棒相隔一个 session，无机制提示。审 UI 时先问
  「这条分支的入口还活着吗」。
- **JSDoc 默认值随 ADR 漂移**：config.ts 12 处 'defaults to order'（ADR-0008 时真）在
  ADR-0011 改默认后全部失真——改默认值的 PR 必须全仓 grep 旧默认值字符串。
