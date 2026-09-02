# Plan — 2026-09-02-001-s01-governance-bootstrap-plan

> 验收契约：本 plan 的 R 验收条目是 progress-M1 阶段验收的对照正本。

## 目标

S01 完成 dsh-websearch 治理 bootstrap：规划产物（宪法/架构/roadmap/ADR）定稿并过独立审核与人工终审，session-governance 模板套件安装且占位符清零，治理 6 件套落盘，产出 Session 02 接力指令。纯治理与计划产物批次，无业务代码。

## 背景

用户 2026-09-02 批准方案 v3（技术路线 + 治理框架 + roadmap 骨架）并指示「使用 session-governance 正式接管 websearch 项目开发」。治理前提铁律要求架构文档 + roadmap-WBS 先行过审后才可写业务代码；本 session 即该前提的落实棒。

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 前置 |
|---|---|---|---|
| T1 | 项目目录 + git 初始化（master） | 仓库存在且首个提交可溯 | 无 |
| T2 | AGENTS.md 项目宪法 | 插件规范/seam 纪律/五禁/测试要求齐备 | T1 |
| T3 | docs/00-architecture.md 架构正本 | 模块边界/链语义/配置模型/安装模型/上游锚点 | T2 |
| T4 | session-roadmap.md（S01-S10，M1-M6）+ ADR-0001..0005 | 每 Session 验收标准可实测；ADR 模板要素齐 | T3 |
| T5 | 阶段 2 独立审核轮 1 | verdict 落盘（实测结论：NEEDS REVISION，F-001..F-019） | T4 |
| T6 | 按 F-001..F-019 修订 + 同 Agent 复审 | 复审 APPROVED；修订 commit `2f7ac3a` | T5 |
| T7 | 复审收尾 R-001..R-003 | 修毕 commit `2c70bc8` | T6 |
| T8 | 阶段 2.5 人工终审 | 用户批准时点落盘（2026-09-02） | T7 |
| T9 | 模板套件安装（11 份）+ 占位符清零 + 保号 | R1/R2 实测通过 | T8 |
| T10 | 治理 6 件套落盘 + 接力指令 | R5 实测通过；接力指令含五语义点 | T9 |

## 验收条目（R1-R5）

- **R1** `grep -rn '{{' .session-start docs/ --include='*'`：命中仅限 `_templates/` 内模板与活占位（`{{NN}}`/`{{目标一句话…}}`/`{{WBS/验收标准见…}}`/`{{词表项}}`/`{{n}}` 类）；项目级事实（项目名/路径/阶段名/环境命令）零残留
- **R2** `docs/governance-sessions.md` 保号：`grep -c '§3.1.1'` ≥4 且 `grep -c '§3.4'` ≥6，`.session-start` 与 session 模板中的引用编号一致
- **R3** 审核证据链：`git log --oneline` 实测含 `7d5eadc`（规划）→`2f7ac3a`（F 修订）→`2c70bc8`（R 收尾）；轮 1 verdict NEEDS REVISION 与轮 2 APPROVED 结论在本 session 记录留痕
- **R4** 用户批准时点落盘 session 记录「做了什么」T8 条目（2026-09-02 用户指令原文指针）
- **R5** 治理 6 件套齐备（`ls` 实测）：session 记录 / STATUS.md / progress-M1.md / dont-do.md / CHANGELOG.md / 接力指令（session 记录「下一 Session 启动指令」节 + 回复末尾输出）

## 验证矩阵

| 验证面 | 触发时机 | 责任阶段 | 采信规则 |
|---|---|---|---|
| 安装不变量（R1 grep + R2 保号） | 安装后即时 | 3 | 主 Agent 亲跑 grep 原文 |
| 治理产物一致性（STATUS/roadmap/progress/plan/记录相互引用与受控词表） | 收尾前 | 4 | 独立 Agent 实测，结论 APPROVED 才收官 |
| 接力指令格式（五语义点/结构纪律） | 收尾前 | 4/5 | 独立 Agent 比对 governance §3.2 本体 |
| git 留痕链 | 收尾 | 6 | `git log` 实测（R3） |

（本批为纯文档/模板批：TDD 适用域=文档类，验证手段即上表，回归不红；无测试基线，首个基线 S03 建立。）

## 债务归属映射（🟢 延后项正本）

| 债务 | 等级 | 归属 | 依据 |
|---|---|---|---|
| L-1 deepseek/exa/perplexity 插件内重实现（上游注册表私有不可枚举） | 🟢 | S03-S05 | ADR-0003 |
| L-2 per-profile GUI 覆盖二期候选（profile 级差异走 YAML patch） | 🟢 | 二期候选，不排期 | ADR-0004 |

## 风险

- 模板占位符漏填 → R1 grep 全量兜底 + 独立 Agent 复核
- CHANGELOG 双落位歧义 → 已按治理根形态探测规则定根（仓库根）并在 governance §3.2⑤ 同步替换引用
- S02 spike 假设不成立 → fallback 已预授权（ADR-0005），届时按范围变更回路重审
