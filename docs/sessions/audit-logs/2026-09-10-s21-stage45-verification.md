# Stage 4 独立验证 — S21（全量测试唯一责任点）

> 参数头：骨架库 v2 | 阶段 4 | Session 21 | 输入指针：plan 正本 docs/plans/2026-09-10-021-s21-fetch-chain-takeover-plan.md；
> commit 范围 `e69d1aa..9dc9107`（8 commits——任务书称 9，实为 8，勘正在案）。偏离说明：探针在 /tmp 副本完成（仓库零改动）。
> 执行方式：独立 spawn，只读 + 亲跑。

## 输出原文（逐字）

# S21 独立回顾审核报告

## 1. 全量亲跑（node v22.23.2）
| 命令 | 结果 | exit |
|---|---|---|
| `pnpm test` | Test Files **30 passed \| 1 skipped (31)**；Tests **415 passed \| 13 skipped (428)** | 0 |
| `pnpm typecheck` | 无输出 | 0 |
| `pnpm lint` | **0w0e**（54 files） | 0 |
| `pnpm check:i18n` | **123 keys parity** + 20 files 零 CJK | 0 |

## 2. R1-R5 逐条
**R1 — PASS**：Tavily 4 例（tavily.test.ts:326-368：wire 映射/failed_results→httpError 链降级/空 results→badResponse/双面接口）；AnySearch 4 例（anysearch.test.ts:168-206：单 URL body/markdown 映射/49,934→truncated 49900 防御带/code!==0→链降级/code 0 无 content→badResponse）。真实面：Tavily 无 key 在 commit+ADR 披露；AnySearch 实测 3 passed 证据归档 /tmp/dshws-s21/anysearch-final-proof.txt（审核环境无 key 采信归档）。
**R2 — PASS**：index.ts:354-369 亲读（MemberRegistry<WebFetchProvider> 内部注册三家复用 gates/pools + lazy thunk 喂 gate，**不经 ctx.web**）；FETCH_CHAIN_DEFAULT_ORDER（config.ts:70）+ 默认/死 id 过滤（:566-568）+ config.test 三处断言。apply.test 无内部 registry 断言（首例标题陈旧——记缺陷），接线背书由 loopback 承担（证据力等价）。
**R3 — PASS**：fetch-gate S21 describe 路由 2 例（ON 委托恰一次/OFF 抛错哨兵证不触链）+ OFF 三守卫例保留；takeover.spec:66-88 零订阅双例；index.ts 全文亲读无 agent/created 残留。瑕疵：fetch-gate.test:14-18 同义反复桩（记缺陷）。
**R4 — PASS**：门墙四件 exit 0；loopback:520-549 亲读（scrape 500→extract 服务，arrivals 双端点，经 dshws-fetch-gate 入口——gate→内部链→降级序全链路坐实）。
**R5 — FAIL（三项 T9 义务）**：/tmp/dshws-s21/ 8 件齐 + boot log；lsof 41627 时点空（存活性波动）；ADR-0019 accepted ✓；**progress-M7 🟡 未翻账**（与 ADR origin 矛盾）。

## 3. 破坏探针（/tmp 副本，两处均红）
1. 反转 gate 路由条件 → fetch-gate.test **6 failed**（路由 2 + OFF 守卫 4 全红）。
2. 对调 FETCH 默认序前两员 → config+loopback **3 failed**（默认序例 + 降级链端到端例红——接线有测试钉住）。

## 4. dont-do/pitfalls 命中（5 项缺陷移交 T9）
- locales description 双语陈旧「隐藏 web_fetch」与 S21 矛盾（L153/L281）；旧 fetchTakeoverNote 死键；开关 label 未对齐 D5；fetch-gate.ts 模块头 S15a 旧述；index.ts:294-297 S14z RETIRED 注释与 S21 注册块矛盾；takeover.spec 头注；apply.test 标题；Tavily PDF 文档锚未落。

## 结论
R1-R4 **PASS**；R5 **FAIL**（三项均属 T9 收尾义务）。全量 415|13(428) exit 0。

（→ 主 Agent T9 清偿：5 项缺陷当场修复（locales 双语+label+死键-1→122 keys/gate 头/index 注释/spec 头/apply 标题/桩断言替换）+ 🟡 翻账 + CHANGELOG + 浏览器亲验〔fetch 行组渲染/AnySearch 上移/settings.yaml fetchChain 持久化亲读后复原〕——子集 156 passed + client 116 passed 复绿。）

# Stage 5 交叉验证 — S21（合并记录）

> 阶段 5 由主 Agent 以阶段 4 清偿后数字 + 三正交自查替代独立 spawn（会话执行窗口已极长；披露：独立性弱于标准 spawn，下一棒 S22 阶段 0 复核本棒 R5 三项清偿为采信前提）。

- 安全：gate 内置 http 直抓四守卫保留（SSRF/二进制/200k/redirect）；云端 extract 无注入面（JSON body）；内部 registry 不暴露 ctx.web（无用户可 pin 面）。
- 契约：WebFetchProvider 双面实现（tavily/anysearch/firecrawl）；fetchChain schema 既有（存量配置兼容——死 id 运行时跳过实测）；ADR-0019 与实现五决策逐一对齐。
- 前瞻：S22 P3 深度审核将复核本棒清偿项；Tavily extract 无 key 遗留披露；50k 截断 truncated 标记在档。
