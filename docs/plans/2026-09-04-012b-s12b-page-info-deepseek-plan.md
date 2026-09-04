# Plan — 2026-09-04-012b-s12b-page-info-deepseek-plan

> plan 是验收契约。本棒 = 用户三轮反馈（2026-09-04）三议题的**分析棒 + 轻量 UI 调整**：
> ①key 格式提示收敛为页头单图标（六卡重复 hint 撤除）②DeepSeek 双配置关系分析结论 +
> 澄清处置 ③多工具×多 key 调用逻辑文档化 + S13 策略棒衔接。roadmap 插行 **12b**。
> client half 纯 GUI + node 侧零变更。

## 目标

①「多把 key：{APIKEY1,APIKEY2,...}（最多 10 把）」从六张成员卡的重复 hint 行**收敛为
页头「网页搜索」标题旁的单个圆圈图标悬停提示**；②DeepSeek 成员卡与宿主模型设置页
DeepSeek APIKEY 的关系**分析结论落盘 + 卡面澄清**（处置按用户 2.5 裁定）；③跨工具/
同工具两级调用逻辑**现状文档化**（本轮澄清性调整）+ 顺序可视化配置需求**划归 S13
策略棒**（WBS 更新）。

## 背景

**任务源**：用户三轮反馈（截图：六卡各重复同一句 hint 红框标注「累赘不美观」；提议页头
「网页搜索」后加 `!` 圆圈图标悬停提示；DeepSeek 双配置先分析；调用顺序轮询/顺序要说明，
问是否需要独立「APIKEY 搜索顺序」子页配置）。

**分析一：DeepSeek 双配置关系（用户要求先明确回复）——事实已实测坐实**：

- 宿主模型 LLM（`packages/llm/llm-deepseek/src/index.ts:88` `DEFAULT_API_KEY_ENV =
  'DEEPSEEK_API_KEY'`）、宿主官方 DeepSeek 搜索（`packages/web/web-search-deepseek/src/
  provider.ts:302` 同 ref）、**本插件 dshws-deepseek 成员**（controller MEMBERS
  defaultRef `DEEPSEEK_API_KEY`）——**三者读同一凭据 ref，凭据层只存一份值**。
- 推论：①用户在模型设置页配了 DeepSeek key → 本插件 deepseek 卡**自动显示已配置**
  （credentials.describe 同 ref），零重复录入；②两处各写一个值 = **同 ref 互相覆盖**
  （后写赢——无存储层损坏，但值语义可丢失：多把池可被单把保存静默清掉——心智混淆点）；③本插件卡是**能力超集**：
  支持逗号多把（模型页单把）+ 启停 + 链序管理——移除卡会丢失这些管理面。
- **结论（对用户三子问的直接回答）**：①**读取无冲突**——单存储单值，模型页配了
  key 本插件自动可用；②**写入有覆盖面**——两处各写不同值时后写覆盖先写；最尖锐场景 =
  插件卡写入逗号多把池后，模型页单把保存会**静默清掉多把池**（值层面真丢失）；③
  **未完全独立分离**——凭据层共用同一 ref（这是设计而非缺陷：一份 key 多消费方），
  管理面（启停/链序/多把池）则完全独立。④「是否不再需要 Deepseek 的 APIKEY 配置」——
  不建议移除：插件卡是多把池/启停/链序的管理超集，移除丢能力；处置 = 澄清 badge
  （D2）。

**分析二：两级调用逻辑现状（用户问轮询还是顺序）——代码实测（src/keys.ts +
src/chain/core.ts）**：

- **跨工具（成员级）**：`searchChain` 顺序 = **顺序降级**（非轮询/非负载均衡）——每次
  请求都从链首就绪成员开始，失败（429/断网/超时/任何成员错误）才降级到下一就绪成员；
  顺序可 GUI 排序（↑↓，S07），未排序时 = 内置默认序（BUILT_IN_MEMBER_ORDER）。
- **同工具多 key（key 级，`keys.ts #select`）**：`keySelection` 三策略——`order`
  （**默认**，恒取第一把，不因失败换把）、`round-robin`（逐请求游标轮换
  k1→k2→k3→k1）、`random`（随机采样）。key 请求失败不做同成员换把重试——直接链层
  降级到下一成员。
- **配置入口现状**：链序 = GUI 已有（↑↓）；`keySelection` = **仅配置文件项**
  （settings `keySelection`，热生效；GUI 控件 = plan 011 登记 🟢「S13 策略棒再评估」）。
  **不需要新子页面**——排序入口（搜索链卡）+ 策略控件（成员卡，S13）在现有页面内即可
  完整承载；「APIKEY 搜索顺序」独立子页 = 过度设计（与插件配置页/插件列表页的宿主惯例
  也不符——它们是单页分区，非子页）。
- **S13 衔接**：三轮反馈的顺序配置需求 = S13 策略棒既有范围（成员级 random/序列 +
  ADR-0012 + 编辑器 GUI + 多 key 策略控件再评估）——roadmap S13 行 WBS 更新吸收
  「keySelection GUI 控件 + 调用顺序说明」。

**宿主图标库核查**：无「!」圆圈形态（grep 仅 IconQuestionOutline14 问号圆圈 +
IconWarningOutline16 警告三角）——页头图标用 **IconQuestionOutline14**（S12 已验证的
Tooltip anchor 安全用法：可聚焦 button 包裹），取舍向用户披露。

**S12a 状态快照**：同日收官（master a7762fb）；T5 阶段 4/5 独立验证 PASS/COMPLETE 在档
（…-s12a-stage45-verification.md，全量门墙亲跑 + R 对峙 + 三问，时点=本棒启动前）。
**阶段 0 = 标准增量采信制·无产品变更分支**——独立 Agent 已执行：**PASS**（🔴×0；
git 三采样 HEAD==master==a7762fb 零产品漂移；冒烟 49 passed 自洽；悬空引用 9/9；
正本 docs/sessions/audit-logs/2026-09-04-s12b-stage0-review-of-s12a.md；🟡×2 非阻塞：
接力简报分支名为预期态（T0 建分支以实测为准）+ 三轮反馈=任务源已认领）。

## 范围决策（D1-D5）

| # | 决策 | 依据 |
|---|---|---|
| D1 | **页头单图标**：六卡 hint 行全删；`网页搜索` h3 标题后加 IconQuestionOutline14（可聚焦 button anchor 包 Tooltip，S12 已验证形态：side="bottom" delayMs=400 maxWidth=320）；tooltip 文案 = keyFieldNote（格式化表述，保留现键）；卡内布局其余不动（头行/输入行/footer 保持） | 用户①；S12a 验证过的 anchor 形态 |
| D2 | **DeepSeek 澄清**：deepseek 卡头行状态点后加 11px badge「共用模型 Key」（en `Shared with Models`；仅 deepseek 卡，title 展开一句：与模型设置页共用同一把 DEEPSEEK_API_KEY，两处修改互相覆盖以最后写入为准）；不移除卡（多 key/启停/链序管理能力保留）。**备选披露**：如用户裁定移除输入行或整卡，回计划期重审 | 分析一结论；用户②要求先分析后动 |
| D3 | **调用逻辑说明落位**：页头 intro 已含降级句（S12a）；链卡 hint 已含默认序说明——本轮**不改 UI**，调用逻辑文档化落 Agent Note（两级语义表）+ roadmap S13 行 WBS 更新（吸收 keySelection 控件 + 顺序说明；「独立子页」判定为不需要，理由见背景） | 用户③；过度设计规避 |
| D4 | locales（**D1/T1 范围**）：description 键不动（intro 两句保持）；keyFieldNote 键保留（页头 tooltip 用）；D1 无键增删（20 keys）——locales.spec 逐字断言不动；**T2 另增两键（22）** | 最小面 |
| D5 | roadmap 插行 **12b**（12a 后 S13 前）+ S13 行 WBS 增补「keySelection GUI 控件 + 成员/链两级调用顺序说明（12b 分析移交）」 | roadmap 插行规则 |

**S12a D3 scope 区分（防 T5 误判回归）**：S12a R2 的「ⓘ/Tooltip 零残留」禁令=**卡内
label 旁**座席（摸底 Q3）；本棒页头座席不受其约束——T5 对峙以本 plan D1 为准。

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 类别 | 前置 |
|---|---|---|---|---|
| T0 | 治理批（分支首提交）：plan 012b + 阶段 0/2 audit-log + roadmap 12b 插行 + S13 行 WBS 增补 + 启动全状态区（STATUS/progress 全状态区）+ session-12b 骨架 | git clean 前置；骨架两新节占位 | 治理（机械豁免候选） | 2.5 批准 |
| T1 | D1 页头图标：六卡 hint 删 + 页头 h3 后图标+Tooltip（anchor aria-label = keyFieldNote 文案〔S-2〕）+ import 恢复（IconQuestionOutline14/Tooltip）；**既有 21 tests 仅 ：251-261「no info icon anywhere」改写**（标题与卡内 hint 断言随删除翻红；**保留**卡内 queryByRole tooltip/button null 守卫——宿主 Tooltip 为 anchor 就地兄弟节点、无 portal，页头气泡不进卡内子树，卡内 null 断言不翻红〔实测排除〕）；其余 20 存活 | 先红（卡内 queryByText(keyFieldNote) null；页头 anchor 存在 + focus 出 tooltip 含格式化文案；六卡 hint 零残留）→ 绿；i18n 20 keys 不变 | TDD | T0 |
| T2 | D2 DeepSeek badge：deepseek 卡头行 badge + **双语两键**（`sharedWithModels` badge 文案 + `sharedWithModelsDetail` title 展开句，20→**22**——一键一串，title 句走字典因 check-cjk 门拒绝字典外中文） | 先红（deepseek 卡 badge 文本/title 句/其他卡无此 badge）→ 绿；typecheck 双面；i18n 22 keys parity | TDD | T1 |
| T3 | 门墙七命令（提交态）+ 台账/门墙表 + Agent Note（两级调用逻辑表 + DeepSeek 关系结论） | 门墙数字亲见（基线 251\|9(260) 起算） | 门墙+文档 | T2 |
| T4 | 浏览器实测棒（scratch 3420，起前查占）：页头图标 hover 出提示/六卡无 hint/deepseek badge/截图归档 /tmp/dshws-s12b/ + 复原 | 断言留痕；隔离纪律 | agent 实测棒 | T3 |
| T5 | 阶段 4/5 独立验证 | PASS / COMPLETE | 强制独立 | T4 |
| T6 | 收尾：session-12b 补全 + 原子收官 + merge + 接力指令；收官 ✅ 前按 dont-do ⑤ 执行实物 `ls` 清单（6 件套逐一在档） | 6 件套 | 收尾 | T5 |

## 验收条目（R1-R5）

| # | 条目 |
|---|---|
| R1 | 页头单图标：anchor button 在 h3 后 + focus/hover 出 keyFieldNote tooltip；六卡 hint 段落零残留；卡内布局（头行/输入/footer）零漂移（既有断言存活） |
| R2 | DeepSeek 澄清：仅 deepseek 卡有「共用模型 Key」badge（title 展开句）；双语**两键** parity（**22 keys** 终态） |
| R3 | 分析落盘：两级调用逻辑表 + DeepSeek 关系结论在 Agent Note；roadmap S13 行 WBS 吸收顺序配置需求 |
| R4 | 布局零漂移回归：S12a 既有断言**除 ：251-261 按 T1 改写外全数存活**（头行/输入独占/footer/链区块条件渲染/品牌名五面与该条无交集） |
| R5 | 门墙七命令（提交态）+ 浏览器截图归档 + 前后 git clean |

## 验证矩阵

| 验证面 | 时点 | 责任 | 采信 |
|---|---|---|---|
| jsdom 红绿 | T1/T2 | 主 Agent | commit + 记录 pre-fix 红 |
| 门墙七命令 | T3 + T5 复验 | 主 → 独立 | progress 门墙表 |
| 浏览器断言+截图归档 | T4 | 主 Agent | /tmp/dshws-s12b/ + 记录 |
| R 对峙+三问 | T5 | 独立 | audit-log …-s12b-stage45 |
| 原子收官 | T6 | 主 Agent | 四件 diff |

## 高危命令预告

①/tmp/dshws-s12b scratch 自建 ②3420 端口启停（起前 lsof 查占；3416/3080/61518/3419 已停
实例零接触）③scratch pnpm install ④浏览器自动化（fake 值复原）⑤npm pack --dry-run。
无 push/publish/删除/凭据真实值/依赖变更/治理产物删除。

## 债务归属映射（正本）

| 债务 | 等级 | 归属 |
|---|---|---|
| 六卡 hint 重复（用户三轮①） | 🟡 | T1 清偿 |
| DeepSeek 双入口心智 | 🟡 | T2 澄清 badge（D2；移除选项归用户 2.5 裁定） |
| keySelection GUI 控件 + 顺序可视化 | 🟢→🟡 | **S13 策略棒认领**（D3/D5；WBS 已增补） |
| CSS module 化 / 内联微交互 / fetch 排序 / 恢复默认 / anysearch fetch 面 | 🟢 | 维持 |
| v2 backlog：余额看板 + fetch 兜底开关 | 🟢 v2 | S14 调研 |

## 风险

- **Tooltip anchor 形态回归**：IconQuestionOutline14 + 可聚焦 button（S12 验证）；本棒
  jsdom 断言同款手法（focus 腿）
- **DeepSeek badge 面积**：头行空间有限（名+点+badge+开关）——badge 11px 短文案
  （「共用模型 Key」5 字符+padding）实测验证
- **description/intro 不动**：D4 最小面——若用户觉得 intro 也该进图标，回计划期
