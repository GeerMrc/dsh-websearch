# Plan 045 — 上游对齐二轮（v0.3.0）+ 代码质量批 + 对齐流程常备化（Session 37）

> 2.5 终审：ZCode 计划批准流通过（2026-09-28）；阶段 2 独立审核于批准后、执行前补跑（S36 同类张力为前车之鉴，本棒清偿该流程债）。

## 目标

对 v0.2.0 做四路独立审计后的修复与清理：清除 2 个确定性 400 破坏项与 1 个带日期弃用面、补齐错误信封同族残缺（数组 detail/code 维度/request_id 对称）、消除 ~400 行同构重复与 ~100 行死代码（行为保持前提）、把「逐成员×逐面双路对齐」从 checklist 升格为 AGENTS.md 级强制流程——产出 **v0.3.0（minor：含加法面——alexandria 枚举/loud 校验收紧；纯修复不足以 patch，循 S20 参数批=minor 先例）**。

## 背景（四路审计实证，2026-09-28）

- **阶段 0（S36 gate）**：🔴×1（S36 自身阶段4/5 二轮无盘上正本）+ 🟡×3（位置块三残留/real-tier 指针半悬空/S36 计划无阶段2 正本张力）
- **Tavily×AnySearch**（官方文档直证 docs.tavily.com / anysearch.com）：❌-1 `include_domains_mode` 发 `filter|boost` 上游只认 `restrict|prefer`；⚠️ 422 数组 detail、request_id 不对称、max_results 无钳制声明、tag/params 未支持、匿名档偏离、429 头未消费
- **Exa×Firecrawl**（docs.exa.ai spec v2.0.0 / docs.firecrawl.dev v2）：X1 `category=company|people`+`endPublishedDate` 必 400（守卫漏第三禁用参数）；W2 `research→alexandria` **2026-11-16 官宣迁移**；W1 includeSections 7 值枚举未校验；W3 formats 对象形态；W4 firecrawl code 维度
- **代码质量**：🔴×4（MemberParamField 失败丢草稿/UA 版本被测试钉死 0.1.0/index.ts 矛盾注释/重复 testid）；🟡 ~400 行重复；🟢 section.tsx 1851 行拆 5 文件
- **DSH 上游**：本地 peer 顶格 0.1.7-rc.2=生产树（注册表扫描列 T0）

## 任务分解（WBS）

### 阶段 P0 — 前置清偿
| # | 任务 | 验收 |
|---|---|---|
| T0 | ①重跑门墙（双面 typecheck+vitest 全量+lint+i18n）**落 audit-log 正本——同时清偿阶段0 🔴（S36 二轮无档：本次正本即 09-28 时点全量门墙在档凭据）**，并记录**行为保持基线 N**（PB 锚）②STATUS 位置块三残留刷新+session-36 指针勘正 ③npm view 扫 DSH 六包全版本判 peer 扩钉——**失败处置**：重试一次后带日期留痕延后（STATUS S32a 网络债在案）；扩钉判定必须 semver `satisfies` 实测（dont-do 条目），禁目测 | audit-log 落盘（含基线 N）；位置块净；peer 结论或延后留痕在案 |

### 阶段 PA — 上游对齐修复（逐项 TDD 红→绿→commit）
| # | 任务 | 来源 |
|---|---|---|
| T1 | Tavily 枚举勘正（**四路全链**）：①输入 schema（schemastery，config.ts:530）收 legacy+新四值 `filter\|boost\|restrict\|prefer` ②resolve 层归一化（filter→restrict、boost→prefer，先例 LegacyFallbackProvider config.ts:44-51）③wire 只发新值（tavily.ts:107 类型+262 透传）④**client 面**：section.tsx:1289-1290 select options 换新值+locale 两键（modeFilter/modeBoost→新键或改文案）、controller.ts:109 类型同步；测试锚全换（config.test.ts:178-181/section 锚/tavily.test.ts:242）+legacy 映射用例 | ❌-1+N1+N2 |
| T2 | shared.ts unfold 第三轮：①FastAPI 数组 detail（取首元素 `msg@loc`）②firecrawl `code` 维度；四成员信封单测矩阵扩行 | ⚠️-1+W4 |
| T3 | Exa category 守卫补 `endPublishedDate` 压制（三禁用参数全列注记） | X1 |
| T4 | AnySearch HTTP 错误路径补 `request_id`+`error_code` 进消息（两路径对称）；单测双形态 | ⚠️-2 |
| T5 | USER_AGENT 单点化：shared.ts 单一常量（**不 import package.json**——规避 resolveJsonModule/NodeNext attribute/tsdown 内联三重风险）；**防漂测试在测试侧读 package.json 断言 `dsh-websearch/${version}` 与常量相等**（源不派生故无循环自证）；5 处旧锚更新 | ⚠️-7+S4 |
| T6 | anysearch max_results **search() 内钳制 1-20**（请求时参数不进 resolve，anysearch.ts:167）+文件头裁定注记（对齐 tavily.ts:16-18 先例）；exa includeSections/excludeSections 7 值枚举 loud 校验（validateExaSectionFilterRule 扩闭集） | ⚠️-3+W1 |
| T7 | firecrawl 枚举加 `alexandria`（research 保留+2026-11-16 注记+债务表带日期行）；formats 改对象形 `[{type:'markdown'}]` | W2+W3 |
| T8 | 对齐矩阵回填（新枚举/新信封/迁移注记）+ e2e.real 断言同步 | 全项 |

### 阶段 PB — 代码质量批（行为保持；基线=**T0 门墙实测数 N**，新增用例逐批记录，禁算术外推）
| # | 任务 | 来源 |
|---|---|---|
| T9 | MemberParamField 保存失败保留草稿（红绿，对齐三先例） | 质量🔴-1 |
| T10 | providers 去重 ~190 行：`parseMemberResponse`/`memberHttpPost` 提升 shared.ts（#parse 模板）；#apiKey 收敛 | 质量🟡 |
| T11 | client 去重 ~200 行：`useAutoClearFeedback`（9 处）；GeoField/DomainField 合并；toolview-common；labelOf 归一 | 质量🟡 |
| T12 | 死代码清理（setDnsScope、DnsSnapshot.scope、15 死键+2 反向断言、7 孤儿 JSDoc、矛盾注释、URL 表去重）+ check-locales 使用量告警 | 质量🟡 |
| T13 | section.tsx 拆 5 文件（纯移动，spec 零改动；放最后；**开工前独立 Agent 确认机械变更豁免分类**——AGENTS 质量红线） | 质量🟢-1 |
| T14 | 杂项（**首项 N4a**：`dshws-served-by` 按面前缀化——websearch-row.tsx:240→`dshws-search-served-by`、fetch-row.tsx:188→`dshws-fetch-served-by`+两 spec 锚同步）、魔法数收口、Anysearch 大小写、`replace('dshws-','')`→MEMBER 映射 | 质量🟢+🔴-4 |

### 阶段 PC — 流程常备化 + 收官
| # | 任务 | 验收 |
|---|---|---|
| T15 | AGENTS.md 增「上游适配强制流程」节（checklist 为门/DSH peer 扫描步骤/UA 版本钉规则/矩阵全绿才可 tag）+ checklist 增 DSH 上游维度 | 双落 |
| T16 | S37 阶段4（独立全量唯一责任点；**PA/PB 分正本**降爆炸半径）/阶段5（三正交+用户路径冒烟） | 正本落盘 |
| T17 | 原子收官：**v0.3.0** bump + CHANGELOG（含 Tavily 枚举迁移句；**不对称理由句**：T1 旧枚举值收口容忍〔存量配置不炸〕vs T6 新拒脏值〔includeSections 闭集本就无合法存量〕）+ 六件套 + 呈批（v0.2.0 未推则两版一并呈批） | 收官批 |

## 验收条目（R）

- R1 阶段0 🔴🟡 全清（门墙正本/位置块净/peer 结论在案）
- R2 Tavily 枚举四路全通（新值直发/旧值映射/非法 loud/矩阵回填）
- R3 错误信封矩阵全绿（数组 detail/code/request_id 三补齐；real 层好窗断言）
- R4 Exa 三禁用参数守卫完备
- R5 USER_AGENT 单点常量+测试侧防漂断言在树（测试读 package.json 断言与常量相等；源不 import package.json）
- R6 质量批净减 ≥250 行且用例零回归；section 拆分 spec 零改动通过
- R7 死代码清单全清+check-locales 告警生效
- R8 AGENTS.md 流程节+checklist DSH 维度在树（本计划执行即自证）
- R9 v0.3.0 定版全绿；推送/publish 候令状态清晰（v0.2.0/v0.3.0 呈批可分可合）

## 验证矩阵

| 验证面 | 触发 | 责任 | 采信 |
|---|---|---|---|
| 各修复红→绿 | PA 各任务 | 阶段3 | 命令+数字入记录 |
| 全量门（双面 tsc/vitest/lint/i18n） | T0+阶段4 | 阶段4 唯一 | 正本含命令原文 |
| 行为保持（质量批） | PB 各任务后全量 | 阶段3 | 用例数逐批记录 |
| 对齐矩阵回填核对 | T8 | 阶段4 | 逐格 |
| 用户路径冒烟 | 阶段5 | 独立 Agent | 3423 搜索+fetch+错误路径 |

## 债务归属（🟢 显式延后，均有指针）

anysearch tag/params 垂直域（功能面）· 匿名档策略声明 · 429 头消费（池切换信号）· tavily/firecrawl opt-in 参数面按需批 · **alexandria 到期任务（2026-11-16 前，债务表带日期行）** · **request_id 8 面增强余量**（T4 只清 anysearch 两路——其余成员信封本无 request_id 字段，属可选增强非缺陷；STATUS:103 🟢 行随 T17 对账收窄）

**Note/ADR 指派**：T1 枚举迁移决策配 Agent Note（.agents 或 docs/notes——循仓库惯例 docs/notes/）；T15 流程节即文档本体

## 风险

- T1 涉已存配置 → legacy 映射兜底 + CHANGELOG 迁移句，热生效不炸
- PB 重构面大 → 逐任务全量跑+行为保持断言；T13 拆分放最后（测试已锁）
- 好网络窗依赖（real 层）→ 窗口内跑/失败如实记/单测层持久保护
- 版本呈批交织 → v0.2.0 未推，v0.3.0 完成后合并呈批（用户可分可合）
