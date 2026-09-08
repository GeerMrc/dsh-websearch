# Plan — 2026-09-09-014x-s14x-fallback-redesign

> 兜底重构（用户三轮需求收敛 + 三轮独立审核定稿，2026-09-09 用户批准计划包）。
> 分支 feat/s14x-fallback-redesign（自 master 19a1cbd）。版本 0.1.0 → 0.2.0（breaking）。

## 产品契约（用户需求终版，验收正本）

| 就绪工具数 | 「兜底工具」选择器 | 全败时 |
|---|---|---|
| 0 家 | [自动 \| DeepSeek 付费●] | 直接报错（选中且 key 有效则 DeepSeek 即全部搜索） |
| 1 家 | [自动（该工具自身）\| DeepSeek 付费●] | 工具多 key 重试完直接报错；选中 DeepSeek 则接住 |
| 2 家及以上 | [自动（链序末位）\| 各就绪工具]——DeepSeek 彻底消失 | 主+兜底工具规则走完直接报错 |

锁定规则：①免费 Fetch 兜底彻底删除；②兜底工具显式指定（专职链尾、徽标跟随、锁定
不可排序；其余沿用链序）；③DeepSeek 付费仅 0/1 家就绪可选（曾选中后配齐两家→自动
失效回退自动+说明句）；④指定工具未就绪→回退自动+橙标。

## 工程契约（三轮审核 13 必改吸收）

- 单字段 `fallbackMember`（'auto' 显式默认；GUI 只写它）；legacy `fallbackProvider`
  四值域读入别名（'auto'/'fetch'→auto-语义、'deepseek'→dshws-deepseek），schema 域内
  保留防升级炸载入；非法值 fail-loud + 负测。
- 指定工具成员 resolveConfig **静态剥离固定链尾**（strip-from-span，剥死 id
  dshws-fetch-search）；deepseek 指定**不**静态入链——参与守卫在 order getter：
  `选中 && readyCount≤1 && deepseek pool ready`，**append-only** 单条热规则（凭据面
  对 resolveConfig 不可见；严禁替换式写法重开合成缝）。
- **readyCount 只数五个工具成员**（enabled && pool ready 现读），排除 DeepSeek 自身
  （自数自杀洞）；客户端同规则（enabled && configured，排除 deepseek，注释钉死）。
- "意图/资格二分 + 实现降级为 auto 链"统一措辞（ADR-0014；不说"值回退"；direct-pin
  不受影响的边界句）；core.ts noMemberConfigured 文案改写（"S14u 不动"限定
  MEMBER_DRAWS / NON_RETRYABLE_HTTP_STATUSES / 耗尽摘要格式三项）。
- 测试：7 象限钉子（自排除④/enabled 面⑤/守卫第三子句⑥/GUI 热切换⑦/strip-to-tail
  e2e/legacy 别名兼测/零 key 断言）+ 既有面翻语义（apply ≥7 用例、settings 8 处尾断
  言、四句文案、loopback exhaustion 场景重塑〔readyCount>1 时无 deepseek 尾——恰为
  ②+规则③钉子〕、S14w 主备场景零改动）。

## 任务

T0 本计划 + ADR-0014 + 三轮审核正本归档 → T1 node 面 → T2 client 面 → T3 测试面收口
→ T4 ADR/B2/文档链（B2 superseded 注记指回 ADR-0014；014d/014e/014v 冻结注记）→
T5 门墙+CHANGELOG+0.2.0 → T6 独立复审 → T7 merge --no-ff → T8 3423 换包实测（含
S14v/S14w 随包部署 + 本案回归：仅 AnySearch 就绪全败→报错无 fetch 行）+ 治理翻账。

## 验收 R1-R6（用户视角）

R1 总表三档+锁定 4 条 3423 逐条亲验；R2 本案回归（单工具全败报错无 fetch 行）；R3 门
墙全绿+独立复审 PASS；R4 升级平滑（存量值不炸载入）；R5 无撒谎文案；R6 ADR/B2 文档
链闭合。

## 不做

不动重试语义/主备徽标机制/web_fetch/成员卡其余/cordis.patch.yml；proxy 网络增强列
v2；历史文档冻结只注不改。

## 触发源记录

S14v 实测取证（DDG 202 反爬壳 = 免费地板在主要网络段死亡）+ 用户 2026-09-09 三轮产品
裁决（删免费 / 显式指定兜底 / DeepSeek 条件禁用）。
