# Plan 021 — S21 web_fetch 全模式多链接管（用户批准 roadmap 重排）

> 任务源：用户主计划批准（2026-09-10 ExitPlanMode 批准 + 四决策点 AskUserQuestion 获答）+
> roadmap 重排（S21/S22/S23 插行，S15 顺延收尾）。**阶段 2.5 = 用户主计划批准充当**
> （四决策原文在 session-21 记录；AnySearch 探针结果若颠覆设计则按范围变更回路回 2.5）。
> 阶段 0 gate：待生成（audit-logs/2026-09-10-s21-stage0-review-of-s20.md〔🚧 T0 生成中〕）。

## 0. 用户四决策（原文摘要，正本 = session-21 记录）

1. **Exa 保留 + fetch 链独立配置**（搜索链 4 家 / fetch 链 3 家双链独立）。
2. **两态开关**：ON = web_fetch 可见、插件链服务；OFF = 官方 http。隐藏态弃用。
3. **无 http 回退尾**：云端三家全败诚实报错。
4. **P3 只做无计费风险子集**；计费面参数 + 独立计费看板 = 未来迭代登记（S22 范围）。

## 1. 架构事实底座（阶段 1 探索实测，file:line）

- ChainFetchProvider 完整存活（chain/core.ts:307，fetch-chain.test.ts 仍全套测试）
- Firecrawl scrape 面完整（firecrawl.ts:281：/v2/scrape + timeout 20s + markdown 映射），未注册 fetch 面
- fetchChain config/resolve 现存（config.ts:269/556，默认 [...ORDERABLE] 含 exa——需改）
- patch 钉 fetchProvider: dshws-fetch-gate（cordis.patch.yml；patch.test.ts:31 反向钉死不钉 chain-fetch）
- FetchGateProvider（fetch-gate.ts）：ON=拒绝+指引 / OFF=自有 http 直抓（SSRF 检查/200k 截断/二进制拒绝）
- restrict + prompt 遮蔽（index.ts:146-155）：ON 时对每 agent deny web_fetch——需移除
- Tavily /extract 规格全公开（调研在案：urls≤20/failed_results 独立数组/默认 markdown/PDF URL 支持/1 credit per 5 URL basic）
- AnySearch /v1/extract：Markdown 输出 + HTML-only 公网证实；**端点路径/字段/50k 上限未证实——T1 探针定案**
- **架构红利**：云端 extract 绕开本机 fake-ip × 宿主 SSRF（S14v 顽疾）

## 2. 设计决策（D1-D6）

**D1 gate 运行时路由器（patch 零改动；阶段 2 B1 补构造序方案）**：patch 继续钉 `fetchProvider: dshws-fetch-gate`；FetchGateProvider 改造——ON = 委托内部 ChainFetchProvider 实例（三家降级链）；OFF = gate 内置 http 直抓（**官方行为等价近似**——redirect:'error'/200k 截断/SSRF 检查；patch 钉死下官方 provider 实例永不被选，S1 措辞正位：决策「OFF=官方 http」落地为「OFF=gate 内置 http 直抓（官方行为等价近似）」，ADR-0019 + roadmap 行 ⑤ 同步此口径）。运行时可切。**构造序（B1）**：gate 构造签名增 `resolveChain: () => WebFetchProvider`（lazy thunk 单一机制——注册时序不变仍可先注册 gate，链在成员/pools 就绪后经 thunk 解析；不建 setter 第二机制〔复审提示 1〕；避免 index.ts 构造序大挪移）。

**D2 restrict 整体移除**：agent/created 监听删除（deny + prompt 遮蔽两处）——工具恒可见，ON 时由链服务。**takeover.spec 改写为「apply 后 agent/created 零订阅」断言**（保留事件总线 fake，断言 handlers 数组为空〔S2〕）；index.ts:137-155 的 S15c 注释块 + settings.ts fetchTakeover JSDoc「S15a」注释随 T5 一并更新（注释/文档面入任务）。

**D3 fetch 链成员与默认序**：成员 = Firecrawl（scrape）/ Tavily（extract）/ AnySearch（extract）——Exa 不实现 fetch 面（上游无能力）。fetchChain resolve 默认改 `[dshws-firecrawl, dshws-tavily, dshws-anysearch]`（存量用户显式配置原样保留，死 id 运行时跳过）。gates：enabled + key gate（复用 pools）；per-member 超时复用 perMemberTimeoutMs。

**D4 两家新 extract face（TDD）**：
- Tavily：`POST /extract`，body `{urls: [url], format: 'markdown', timeout: 20}`（链预算内）；响应 `results[0].raw_content` → body text kind；`failed_results[]` 非空 → 成员错误（进链降级）；statusCode 语义：成功=200。
- AnySearch：**T1 探针定案**（Note 正本）：`POST /v1/extract` body `{url}` 单串 → `data.content` 去噪 Markdown → text kind；`code!==0` → DshwsError(httpError) 链降级；`content.length >= 49900` → truncated: true（50k 上限实测坐实，防御带口径）。
- 两者均实现 WebFetchProvider 接口（url/statusCode/body/truncated 契约）。

**D5 GUI（B3 写死）**：「独立」的语义边界 = **链序与成员集合独立**（fetch 链只含三家、排序独立于搜索链）；成员级 `enabled` 启停天然跨链共享（关 Tavily 同时退出两链——最小配置面决策，ADR-0019 明示该语义，不新增 fetchEnabled 独立门）。实施：controller 增 `moveFetchChainEntry`（现只有 moveSearchChainEntry）+ **snapshot 面扩展**（fetchChain 现不在 controller snapshot——grep 零命中，T6 含此扩展）；section 增 fetch 链排序行组（复用 search-chain 行模式）；开关文案改「接管 web_fetch（插件链服务）」。locales 新键。

**D6 版本 0.6.0**（功能批 minor）+ ADR-0019（fetch 链接管架构：gate 路由器/两态/无 http 尾/Exa 不进 fetch 链的准入分离）+ web_fetch 🟡 债务翻账。

## 3. 任务清单（每任务 red→green→commit，串行）

| 任务 | 内容 | done 条件 |
|---|---|---|
| T0 | 治理批：分支✓ + plan 021 + 阶段 0 audit-log + roadmap 重排✓ + STATUS 启动 + session-21 骨架（含用户主计划与四决策原文落档） | 工件在档 |
| T1 | ✅ **AnySearch /v1/extract 真实探针定案**：端点/单 URL body/信封响应/去噪 Markdown/**50k 上限坐实**（49,934 实测）/三错误形态——正本 = docs/notes/2026-09-10-s21-anysearch-extract-probe.md；探针工件 /tmp/dshws-s21/extract-probe-{1..4}.json | 已完成 |
| T2 | Tavily extract face（TDD：mock wire + failed_results + PDF URL 文档锚） | 红→绿；real 自跳在档 |
| T3 | AnySearch extract face（TDD，按 T1 契约） | 红→绿 |
| T4 | fetch 链接线：**构造 ChainFetchProvider（仅进插件内部 fetch MemberRegistry——不经 ctx.web.registerFetchProvider，gate 经 lazy thunk 持有直调〔B2：ctx.web 注册会让 dshws-chain-fetch 成用户可 pin 选项，设计外行为〕）** + firecrawl fetch 面注册进内部 registry + 三家 fetch gates（复用 pools）+ fetchChain 默认改 `FETCH_CHAIN_DEFAULT_ORDER = ['dshws-firecrawl','dshws-tavily','dshws-anysearch']`（config.ts 导出新常量〔S5〕） | apply.test 断言 = 插件内部 fetch registry 成员集 + config.test 默认序红→绿 |
| T5 | gate 路由器改造 + restrict 移除（TDD：ON=链服务断言 / OFF=http 直抓断言 / agent-created 零订阅断言〔handlers 空，D2/R3 口径〕） | fetch-gate.test + takeover.test 语义更新红→绿 |
| T6 | GUI fetch 链配置面 + 开关文案 + locales（TDD：渲染/动作/热生效断言） | section.spec 红→绿；i18n parity |
| T7 | loopback fetch 场景恢复（三家降级链端到端）+ ADR-0019 + Note s17 增补 fetch 面 | loopback fetch 场景绿；ADR accepted |
| T8 | 0.6.0 + UA×5 + 3423 换包**真实 fetch 三家降级链实测**（firecrawl 有 key 实抓一页；T/Any 探针面）+ 门墙六件 | /tmp/dshws-s21/ 归档 |
| T9 | 阶段 4/5 独立验证 + 收尾 6 件套 + merge + 接力（→S22 P3） | audit-log ×2；六件套齐 |

## 4. 验证矩阵

| 验证面 | 触发时机 | 责任阶段 | 采信规则 |
|---|---|---|---|
| extract face 单测（两家） | T2/T3 绿证 | 阶段 3 | 红→绿留痕 |
| 链注册/默认序/gate 语义 | T4/T5 绿证 | 阶段 3 | 红→绿 |
| loopback fetch 降级链 | T7 绿证 | 阶段 3 | 亲跑 |
| GUI + i18n + **浏览器亲验**（fetch 链排序拖动/开关切换——dont-do「webview 输入以效果判定」家族，S4） | T6 绿证 + T8 浏览器 | 阶段 3 | parity + 效果亲见 |
| 门墙静态六件 | T8 提交态 | 阶段 3 | exit |
| 全量 `pnpm test` | 阶段 4 唯一责任点 | 阶段 4 | 亲跑 1 次正本 |
| 3423 真实 fetch 链 | T8 | 阶段 3 | 归档 |

## 5. 债务映射

| 债务 | 处置 |
|---|---|
| web_fetch 完整替代 🟡（S16-P0 登记） | **本棒翻账**（多成员链落地 = 长期路径 v2 提前实施） |
| S15 手册 | 顺延（roadmap 勘注）；fetch 链口径并入素材 |
| 未来迭代（新登记） | ①计费看板 ②计费面参数 ③Tavily favicon 等低价值项 |

## 6. 验收条目（R1-R5）

| R | 条目 | 证据 |
|---|---|---|
| R1 | 两家 extract face mock-wire 全链路红绿 + 真实面如实披露（Tavily 无 key；AnySearch 探针背书） | T2/T3 数字 + 披露在档 |
| R2 | fetch 链三家接线 + 默认序 + gates | T4 断言 + apply 链注册 |
| R3 | 两态开关语义（ON=链服务且 agent/created 零订阅 / OFF=gate 内置 http 直抓〔官方行为等价近似口径〕） | T5 断言 |
| R4 | 全量门墙 exit0 + loopback 降级链 | 阶段 4 + T7 |
| R5 | 3423 真实 fetch 实测 + ADR-0019 + 🟡 翻账 | T8 归档 + 台账 |

## 7. 风险预案

- **AnySearch 探针颠覆**（端点不存在/字段迥异）：face 设计回 2.5（范围变更回路）；链先以两成员（Firecrawl/Tavily）落地，AnySearch 增量棒。
- **gate 委托链的循环注册**：ChainFetchProvider 不经 ctx.web 注册（避免与 gate 撞 selection）——gate 内部持有实例直调。
- **fetch 真实实测面**：firecrawl key 在池（实抓）；Tavily/AnySearch extract 无 key 时以探针（Any 有 key 池！）+ 单测背书——Tavily extract 无 key 如实披露。
- **存量 fetchChain 配置**：含 exa 死 id 运行时跳过（既有语义）；GUI 展示过滤死 id。
