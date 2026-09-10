# Plan 022 — S22 P3 对齐批 + 全功能一致性深度审核

> Session 22 | 日期 2026-09-10 | 里程碑 M7
> 上游输入：阶段 0 gate（S21 审核 BLOCKED→T0 `719dbfb` 清偿后 PASS）+ 四家独立调研 Agent
> 官方文档 diff 正本（结论已并入本计划；调研全文见本 session 记录「阶段 1」节摘要）。
> 验收口径：roadmap S22 行——每参数红绿 + 守卫；全量门墙 exit0。

## 0. 范围裁定（P3 = 无计费风险子集；四决策第 4 条用户已裁定）

**做**（全部核证为真实存在的官方参数，无计费注记）：

| 成员 | 参数 | 官方语义 | GUI 形态 |
|---|---|---|---|
| Tavily | `start_date` / `end_date` | YYYY-MM-DD 发布日期区间（与 time_range 正交） | 日期输入（复用 startPublishedDate 部件模式） |
| Tavily | `exact_match` (bool) | 仅返回含 query 精确引号短语的结果 | 开关 |
| Exa | `endPublishedDate` | 发布日期上限（与 startPublishedDate 对称） | 日期输入 |
| Exa | `contents.text.verbosity` | compact(默认)/standard/full——**standard/full 放大 token，GUI ⓘ 计费提示**（用户裁定计费面披露不做实现拦截） | 下拉 |
| Exa | `contents.text.includeSections` / `excludeSections` | 封闭枚举数组 header/navigation/banner/sidebar/footer/metadata/body；**守卫：要求 maxAgeHours=0 强制新抓**（官方明文） | 文本输入（逗号分隔）+ 耦合守卫 |
| Firecrawl | `tbs` 组合值 | `sbd:1`（日期排序）/ `cdr:1,cd_min:MM/DD/YYYY,cd_max:MM/DD/YYYY`（自定义区间），可与 qdr 组合 | schema 放宽为带校验 string（现仅 5 qdr 值）；GUI 改文本输入 + 格式校验 |
| Firecrawl | `safe` (bool) | SafeSearch 过滤显式内容 | 开关 |
| AnySearch | `language` | 结果语言偏好（BCP-47 风格，如 zh-CN）——**并入统一 searchLanguage fan-out**（B2 裁定 a）：ISO 639-1 → BCP-47 归一映射 `zh→zh-CN` 等主语言默认地区，粒度超出部分（如 zh-TW）记 D5 Note；不新增第二语言控件（最小配置面） | 无新控件（统一语言入口热化到第 4 家） |
| AnySearch | `tag` + `params`（+ 伴生 `domain`/`sub_domain` 评估） | 垂直能力标签 + 键值对（spec 要求 required 参数齐全）——**硬规则（S3）：棒内真实 key 探针不可得 ⇒ 本批不实现，维持 P4 边界披露，只做 language**；探针可得则按探针证据定形态 | tag 文本 + params 键值文本（仅探针通过后） |

**不做（seam 阻挡 / 计费风险，维持 P4 边界披露，~15 项）**：Tavily include_raw_content /
auto_parameters / country / include_images(+descriptions) / include_favicon / extract advanced
depth+query+chunks；Exa summary(extras) / highlights.beta 族 / subpages / livecrawl 族 /
deprecated 族；Firecrawl scrapeOptions / enterprise / threatProtection / proxy / actions /
location / LLM formats；AnySearch 匿名 auto-register key（凭据治理违背）/ batch_search /
sub-domains 端点。逐项理由见调研正本（session 记录阶段 1 节）。

## 1. 设计要点

- **D1 配置面**：全部走各成员 Settings schema 扩展（zod + resolveConfig 默认不发送），与
  S17/S20 参数同构；`''` 清除哨兵语义沿用。
- **D2 守卫（双路执法，B1）**——每守卫两路径各证一次（settings 写入 validate hook 拒绝
  + resolveConfig throw；先例 = validateUnifiedDomainRule〔config.ts:531〕+ installSection
  validate hook〔settings.ts:92〕，S20 stage-2 M-1 教训：watcher throw 被宿主吞成 warn 会
  落盘砖化）：
  - Exa include/excludeSections 守卫精确条件（S5）：sections 已配置且 maxAgeHours **缺省或 >0**
    → 报错（-1 与 0 均为非缓存合法态，测试矩阵含 -1 边界用例）；
  - Firecrawl tbs 自由串格式校验（`qdr:[hdwmy]` / `sbd:1` / `cdr:1,cd_min:M/D/Y,cd_max:M/D/Y`
    及逗号组合），非法值双路拒绝；旧存量值 `qdr:*` 经新校验仍合法（断言）；
  - Tavily 日期复用既有日期归一化部件（normalizeStartPublishedDate 同族）。
- **D3 GUI**：`setMemberOption` 联合类型扩展 + section 行组 + locales 双语（i18n parity 门禁）；
  ⓘ 提示 = 官方语义一句话；verbosity 的 standard/full 计费提示落 hint 文案。
- **D4 版本 0.7.0**（功能批 minor）+ CHANGELOG 诚实标注（真实 API 实测覆盖面）。
- **D5 文档**：S17 API 对齐 Note 增补 P3 节（勘正 plan 020 §87「AnySearch 契约面仅
  query/max_results/zone」过时结论——2026-09 官方 doc_spec 另有 language/tag/params/domain/
  sub_domain 五族）；README 仍归 S15。

## 2. 任务清单（TDD 逐一，禁批量）

| # | 任务 | done 条件 |
|---|---|---|
| T0 | 治理批：stage2 正本补落 + session-21 勘正 | ✅ `719dbfb` |
| T1 | Tavily startDate/endDate/exactMatch：schema→wire→GUI→locales | 参数组红→绿；date 归一化 + 不配置不发送断言；settings.test validate 面同步（S2：受影响既有测试 = tests/settings.test.ts + tests/client/{section.spec,controller.spec,entry.spec,locales.spec} + scripts/check-locales.mjs） |
| T2 | Exa endPublishedDate/textVerbosity/include·excludeSections（wire 断言目标 = contents.text 嵌套位〔exa.ts:206-216 现有 contents 块〕逐键「不配置不发送」，S4） | 红→绿；sections×maxAgeHours 守卫双路误配显式报错测试（含 -1 边界）；verbosity 默认 compact 等价断言 |
| T3 | Firecrawl tbs 组合 + safe（tbs 联合类型触点 ×5：config.ts:182 Settings / :388 zod / :452 MemberConfig / firecrawl.ts:103 options / section.tsx:847 select 联合——select 行组改文本行组，S1） | 红→绿；tbs 格式双路拒非法值 + qdr 存量兼容断言；safe 不配置不发送断言 |
| T4 | AnySearch language/tag/params：真实 key 实测（探针）定形态后实现 | 探针证据落 Note；红→绿；通用模式（无 tag）零影响断言 |
| T5 | 0.7.0 + CHANGELOG + Note s17 增补 + loopback 场景扩展（新参数 wire 级抽验） | 版本/文档/场景绿 |
| T6 | 浏览器亲验：新参数 GUI 全要素（渲染/写入/热改/清除/i18n） | 亲见证据入 session 记录 |
| T7 | 收官：全量门墙 + 原子收官 + merge | 四件 exit0；STATUS/roadmap/progress 同步 |

## 3. 验证矩阵

| 验收 | 内容 | 责任 |
|---|---|---|
| R1 | 每参数组 wire 测试红→绿（TDD 先红留档） | 主 Agent（阶段 3） |
| R2 | 守卫三件（Exa 耦合〔含 -1 边界〕/ Firecrawl tbs 格式〔含 qdr 存量兼容〕/ 日期归一化）误配**双路径**（validate hook + resolveConfig throw）各显式失败一次 | 主 Agent |
| R3 | GUI 渲染/动作/热链 + i18n parity 双语 | 主 Agent + 浏览器亲验 |
| R4 | 全量门墙：test / lint / typecheck / check:i18n 四件 exit0（数字亲见） | 独立 Agent（阶段 4） |
| R5 | AnySearch 真实实测（key 在则做，无 key 降级披露）/ CHANGELOG / 收官四件一致 | 独立 Agent（阶段 4/5） |

## 4. 高危命令预告

`git merge --no-ff`（S22 收官，master）；kill 旧 3423 实例换包验证（先告知后动）；无仓外 rm /
无 push / 无发布动作。
