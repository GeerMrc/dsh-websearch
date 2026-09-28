# Plan 045 — 上游对齐二轮（v0.2.1）+ 代码质量批 + 对齐流程常备化（Session 37）

> 2.5 终审：ZCode 计划批准流通过（2026-09-28）；阶段 2 独立审核于批准后、执行前补跑（S36 同类张力为前车之鉴，本棒清偿该流程债）。

## 目标

对 v0.2.0 做四路独立审计后的修复与清理：清除 2 个确定性 400 破坏项与 1 个带日期弃用面、补齐错误信封同族残缺（数组 detail/code 维度/request_id 对称）、消除 ~400 行同构重复与 ~100 行死代码（行为保持前提）、把「逐成员×逐面双路对齐」从 checklist 升格为 AGENTS.md 级强制流程——产出 v0.2.1。

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
| T0 | ①重跑门墙（双面 typecheck+vitest 全量+lint+i18n）落 audit-log 正本 ②STATUS 位置块三残留刷新+session-36 指针勘正 ③npm view 扫 DSH 六包全版本判 peer 扩钉（若需→独立呈批） | audit-log 落盘；位置块净；peer 结论留痕 |

### 阶段 PA — 上游对齐修复（逐项 TDD 红→绿→commit）
| # | 任务 | 来源 |
|---|---|---|
| T1 | Tavily 枚举勘正：zod/provider `filter\|boost`→`restrict\|prefer`；resolve 层 legacy 映射（filter→restrict、boost→prefer）防已存配置炸裂；测试锚改上游值+legacy 用例 | ❌-1 |
| T2 | shared.ts unfold 第三轮：①FastAPI 数组 detail（取首元素 `msg@loc`）②firecrawl `code` 维度；四成员信封单测矩阵扩行 | ⚠️-1+W4 |
| T3 | Exa category 守卫补 `endPublishedDate` 压制（三禁用参数全列注记） | X1 |
| T4 | AnySearch HTTP 错误路径补 `request_id`+`error_code` 进消息（两路径对称）；单测双形态 | ⚠️-2 |
| T5 | USER_AGENT 单点化（shared.ts 派生自 package.json version）+防漂测试（断言=当前版本）；5 处旧锚更新 | ⚠️-7 |
| T6 | anysearch max_results resolve 钳制 1-20+文件头裁定注记；exa includeSections/excludeSections 7 值枚举校验（loud） | ⚠️-3+W1 |
| T7 | firecrawl 枚举加 `alexandria`（research 保留+2026-11-16 注记+债务表带日期行）；formats 改对象形 `[{type:'markdown'}]` | W2+W3 |
| T8 | 对齐矩阵回填（新枚举/新信封/迁移注记）+ e2e.real 断言同步 | 全项 |

### 阶段 PB — 代码质量批（行为保持，655 用例锁）
| # | 任务 | 来源 |
|---|---|---|
| T9 | MemberParamField 保存失败保留草稿（红绿，对齐三先例） | 质量🔴-1 |
| T10 | providers 去重 ~190 行：`parseMemberResponse`/`memberHttpPost` 提升 shared.ts（#parse 模板）；#apiKey 收敛 | 质量🟡 |
| T11 | client 去重 ~200 行：`useAutoClearFeedback`（9 处）；GeoField/DomainField 合并；toolview-common；labelOf 归一 | 质量🟡 |
| T12 | 死代码清理（setDnsScope、DnsSnapshot.scope、15 死键+2 反向断言、7 孤儿 JSDoc、矛盾注释、URL 表去重）+ check-locales 使用量告警 | 质量🟡 |
| T13 | section.tsx 拆 5 文件（纯移动，spec 零改动；放最后） | 质量🟢-1 |
| T14 | 杂项：testid 前缀、魔法数收口、Anysearch 大小写、`replace('dshws-','')`→MEMBER 映射 | 质量🟢 |

### 阶段 PC — 流程常备化 + 收官
| # | 任务 | 验收 |
|---|---|---|
| T15 | AGENTS.md 增「上游适配强制流程」节（checklist 为门/DSH peer 扫描步骤/UA 版本钉规则/矩阵全绿才可 tag）+ checklist 增 DSH 上游维度 | 双落 |
| T16 | S37 阶段4（独立全量唯一责任点）/阶段5（三正交+用户路径冒烟） | 正本落盘 |
| T17 | 原子收官：v0.2.1 bump + CHANGELOG（含 Tavily 枚举迁移句）+ 六件套 + 呈批（v0.2.0 未推则两版一并呈批） | 收官批 |

## 验收条目（R）

- R1 阶段0 🔴🟡 全清（门墙正本/位置块净/peer 结论在案）
- R2 Tavily 枚举四路全通（新值直发/旧值映射/非法 loud/矩阵回填）
- R3 错误信封矩阵全绿（数组 detail/code/request_id 三补齐；real 层好窗断言）
- R4 Exa 三禁用参数守卫完备
- R5 USER_AGENT 版本派生+防漂测试在树
- R6 质量批净减 ≥250 行且用例零回归；section 拆分 spec 零改动通过
- R7 死代码清单全清+check-locales 告警生效
- R8 AGENTS.md 流程节+checklist DSH 维度在树（本计划执行即自证）
- R9 v0.2.1 定版全绿；推送/publish 候令状态清晰

## 验证矩阵

| 验证面 | 触发 | 责任 | 采信 |
|---|---|---|---|
| 各修复红→绿 | PA 各任务 | 阶段3 | 命令+数字入记录 |
| 全量门（双面 tsc/vitest/lint/i18n） | T0+阶段4 | 阶段4 唯一 | 正本含命令原文 |
| 行为保持（质量批） | PB 各任务后全量 | 阶段3 | 用例数逐批记录 |
| 对齐矩阵回填核对 | T8 | 阶段4 | 逐格 |
| 用户路径冒烟 | 阶段5 | 独立 Agent | 3423 搜索+fetch+错误路径 |

## 债务归属（🟢 显式延后，均有指针）

anysearch tag/params 垂直域（功能面）· 匿名档策略声明 · 429 头消费（池切换信号）· tavily/firecrawl opt-in 参数面按需批 · **alexandria 到期任务（2026-11-16 前，债务表带日期行）**

## 风险

- T1 涉已存配置 → legacy 映射兜底 + CHANGELOG 迁移句，热生效不炸
- PB 重构面大 → 逐任务全量跑+行为保持断言；T13 拆分放最后（测试已锁）
- 好网络窗依赖（real 层）→ 窗口内跑/失败如实记/单测层持久保护
- 版本呈批交织 → v0.2.0 未推，v0.2.1 完成后合并呈批（用户可分可合）
