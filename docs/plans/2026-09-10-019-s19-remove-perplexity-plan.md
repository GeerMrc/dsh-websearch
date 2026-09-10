# Plan 019 — S19 完整移除 dshws-perplexity 成员（用户终裁 + 成员准入标准 ADR-0017）

> 任务源：用户直接指令（2026-09-10 对话原文：「优先全部清掉 Perplexity 搜索工具，以及与其相关
> 的后续需要推进的相关任务计划工作……前后端与之相关全部清除」）+ 免费额度事实核证坐实
> （无免费 API key 途径；正本 = 阶段 0 audit-log 附调研报告）。**阶段 2.5 = 用户直接指令充当。**
> 阶段 0 gate：PASS（精简版；🔴×0；schemastery 未知键探针 = NO THROW 静默透传——存量
> `perplexity:` 节无害；S18「真实 Perplexity 实测无 key」遗留判 moot 随本棒消亡；正本 =
> audit-log 2026-09-10-s19-stage0-review-of-s18.md〔🚧 T0 生成中〕）。

## 0. 产品定位（用户裁定，ADR-0017 正本）

本插件「网页搜索」的核心功能聚合标准：**高可用 + 有免费额度 API key 的供应商 + 多 APIKEY
支持 + 功能高度对齐各搜索工具上游实现**。无免费额度的供应商不入选——Perplexity（纯预充值
绑卡，Pro 订阅不含 API）依此标准移除。现役成员复核：Tavily（免费 1000 credits/月）/ Exa
（免费额度）/ Firecrawl（免费 credits）/ AnySearch（匿名免费额度）✓ 均达标；DeepSeek 为
显式付费 opt-in 兜底（ADR-0014 语义，非搜索成员准入面）不适用该标准。

## 1. 设计决策（D1-D4）

**D1 全清面**（前后端 + 测试 + 文档 + 下游任务）：src/providers/perplexity.ts 删除；
config.ts（PerplexitySettings/schema 节/MemberConfig/resolveConfig 分支 + ORDERABLE 5→4 +
FallbackMember union 缩）；index.ts（imports/exports/pools/traced/gates/members 接线/geoOf
无涉——geo fan-out 的 Perplexity 腿随 provider 消失）；errors.ts（perplexity 码族）；
client（MEMBERS 第 3 项/MemberSectionValue 三字段/MemberSnapshot 三字段/setMemberOption 联合/
MEMBER_PARAM_CONTROLS perplexity 节/locales **4 个 pplx 键 + 6 行 prose 提及改写**〔chainOrderHint
默认序 5→4 家 ×2 / searchCountryNote ×2 / searchLanguageNote ×2——Perplexity 从 fan-out 文案
剔除〕96→92）；tests（providers/
perplexity.test.ts + e2e.real/perplexity.real.test.ts 删除；config/client/loopback/errors/
settings/apply 适配）。

**D2 存量配置兼容（fail-safe 不 fail-loud——删除场景例外论证）**：
- `fallbackMember: 'dshws-perplexity'` 存量值：schema union **保留 'dshws-perplexity' 为
  legacy 别名**；**类型面分离**——Config 输入侧 `fallbackMember?: FallbackMember | 'dshws-perplexity'`
  （类比 LegacyFallbackProvider 独立输入宽型），Resolved 输出维持窄 FallbackMember。
  **归一双点**：①resolveConfig 在 fallbackMember defined 分支内拦截（与 LegacyFallbackProvider
  不同——那是另一字段 undefined 时兜底，本别名与 canonical 同域）归一为 'auto'；②client
  controller fallbackSelection 推导（controller.ts:230-233）同步归一（存量值直进 snapshot 会
  令 fallbackDesignationReady 永假 + 选择器死值）。防存量配置加载炸（union 拒值 fail-loud 在
  错误时机：用户没做任何事却坏）。
- settings.yaml 残留 `perplexity:` 节：schemastery 未知键静默透传（阶段 0 探针实测），无告警
  无故障——收尾文档提示用户可手动清理（🟢 观察在档）。
- `searchChain` 含 'dshws-perplexity' 死 id：运行时未知 id 跳过（既有语义），零处理。

**D3 ADR 处置**：ADR-0017 新增（成员准入标准 + Perplexity 移除定谳）；ADR-0016（Agent API
迁移）**改 superseded by ADR-0017**（历史档保留）；ADR-0015 注记（fan-out 语言面剩 Tavily、
region 面剩 Exa/Firecrawl）；Note s17 §4 Perplexity 节注记已随移除失效。

**D4 版本与实测**：0.3.1→**0.4.0**（breaking：成员移除 + FallbackMember 枚举缩——legacy
别名保兼容）；UA×5（perplexity 文件已删）+ 断言×5；3423 换包冒烟（boot + 实搜一轮证链 4 成员
健康）。

## 2. 任务清单（每任务 red→green→commit 或 refactor-class 全绿→commit，串行）

| 任务 | 内容 | done 条件 |
|---|---|---|
| T0 | 治理批：分支 ✓ + plan 019 + 阶段 0 audit-log（附免费 key 调研正本）+ roadmap S19 插行 + STATUS 启动刷新 + session-19 骨架 | 工件在档 |
| T1 | node 面移除（D1/D2）：删 provider + config/index/errors 清面 + **fallbackMember legacy 别名归一（新行为=先写测试证红：`fallbackMember:'dshws-perplexity'` → resolved 'auto'）** + config.test 链序 4 成员断言更新 + errors.test 适配 | legacy 归一测试红→绿；受影响子集全绿（refactor-class 不证红） |
| T2 | client 面移除：controller/section/locales（-4 键）+ specs 夹具 6→5 成员 | client 子集全绿；check:i18n 92 keys parity |
| T3 | e2e 适配：loopback perplexity 场景改由 exa/tavily 承载（**改写点点名**：:43 fallbackMember union、:237 legacy 场景 configuredRefs 含 PERPLEXITY_API_KEY、:257 附近 "all 3 configured"→"all 2"、:263 DSHWS_PERPLEXITY_HTTP_ERROR cause、served-by 签名场景改由 tavily〔S17 起 answer→content 在〕）+ 删 perplexity.real.test.ts | loopback 全绿 |
| T4 | 版本 0.4.0 + UA×5 + 断言×5 + 3423 换包冒烟（boot + 实搜） | 版本面在档；/tmp/dshws-s19/ 归档 |
| T5 | ADR-0017 + ADR-0016 superseded + ADR-0015/Note s17 注记 + **docs/00-architecture.md 正本更新**（line 8 成员清单/line 50 文件树/line 84 默认链序/line 91 config 样例——**line 122 上游 id `perplexity` 撞名论证保留**：成员事实与撞名事实两类残留的边界）+ **下游任务清理**（S18 真实实测闭合项 moot 翻账 / S15 手册素材口径更新——Perplexity 章节剔除） | 文档链一致 |
| T6 | 阶段 4/5 独立验证（4=全量唯一责任点 + R1-R5 对峙；5=三正交+冒烟） | audit-log ×2 |
| T7 | 收尾 6 件套 + 原子收官 + merge `--no-ff` + 接力指令（→S15 README） | 六件套齐 + 实物 ls |

## 3. 验证矩阵

| 验证面 | 触发时机 | 责任阶段 | 采信规则 |
|---|---|---|---|
| fallbackMember legacy 归一（新行为） | T1 任务绿证 | 阶段 3 | 红→绿留痕 |
| 受影响子集（providers/config/client/loopback/errors） | T1-T3 各任务绿证 | 阶段 3 | 亲跑 1 次/任务 |
| i18n parity（92 keys） | T2 绿证 + T4 门墙 | 阶段 3 | exit0 |
| 门墙静态六件（**枚举**：typecheck 双 program / lint / check:i18n〔92 keys〕/ build / pack / git status 前后 clean——全量 pnpm test 归阶段 4 唯一责任点） | T4 提交态 | 阶段 3 | 逐件亲跑 exit |
| 全量 `pnpm test` | 阶段 4 唯一责任点 | 阶段 4 | 亲跑 1 次正本 |
| grep 零残留 | 阶段 4 | 阶段 4 | `grep -ri perplexity src/ tests/` 零输出 |
| 3423 冒烟 | T4 | 阶段 3 | log/数字归档 |

## 4. 债务映射

| 债务 | 等级 | 处置 |
|---|---|---|
| S18 遗留「真实 Perplexity 实测无 key」 | 🟢→moot | 随移除消亡（T5 翻账） |
| 存量 settings.yaml 残留 perplexity 节（静默无害） | 🟢 新登记 | 收尾文档提示手动清理 |
| 既有 🟡 web_fetch / 🟢 池 | 不变 | 归属不变 |

## 5. 风险预案

- **loopback 场景改写风险**：perplexity 是多场景承载成员（顺序保持/跳过/降级）——改由 exa 或
  tavily 承载时保持场景语义不变（失败形态 mock 对应成员端点）；若某场景强依赖「成员带
  content」特性（served-by 签名行），改由 tavily（S17 起 include_answer→content）承载。
- **FallbackMember union 缩的 TS 波及**：controller 两处 union 同步（T2）；GUI 兜底选择器
  选项由 readyToolMembers 动态驱动，无硬编码。
- **UA 计数变 5**：断言×5（perplexity.test 已删）。

## 6. 验收条目（R1-R5）

| R | 条目 | 证据 |
|---|---|---|
| R1 | Perplexity 前后端全清 | `grep -ri perplexity src/ tests/` 零输出（阶段 4 亲跑；docs/ 历史档/ADR 注记/CHANGELOG/AGENTS.md:24 撞名注记为合法豁免域——成员事实与上游撞名事实分离） |
| R2 | 存量配置兼容 | legacy 别名归一测试 + schemastery 探针在档（阶段 0）+ 文档提示 |
| R3 | 全量门墙 exit0 + 链 4 成员语义 | 阶段 4 亲跑 + loopback 全绿 |
| R4 | 3423 换包冒烟 | T4 归档 |
| R5 | ADR-0017 准入标准 + 下游任务清理 | T5 文档链 |
