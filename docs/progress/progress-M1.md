# Progress — M1 治理与规划定稿

> 本文件是 M1 阶段（治理与规划）的进度台账。2026-09-02 新开（Session 01）。
> 首个阶段无前序文件。
> 验收契约：本阶段 plan（`docs/plans/2026-09-02-001-s01-governance-bootstrap-plan.md`）的
> R1-R5 验收条目，阶段验收逐条对应给 PASS/FAIL + 证据；🟢 债务的归属映射正本在 plan 的
> 债务映射节，本文件台账为其镜像。

## 里程碑

| 里程碑 | 内容 | 状态 |
|---|---|---|
| M1 治理与规划定稿 | 治理产物齐备且占位符清零，计划过独立审核与人工终审 | ✅ 2026-09-02（1/1 批次） |
| M2 可行性定谳 | GUI 形态、安装链路、交付形态有实测结论，ADR-0006/0007 定稿 | ⏳ |
| M3-M6 | 宿主包完备 / 设置页完备 / 交付就绪 / 上游验收通过 | ⏳ |

## 进行中

- 无（M1 收官；下一棒 Session 02 待启动）

## 待启动

- Session 02（Spike：外置 client half + 安装链路 + 交付形态定谳）——前置：M1 收官（阶段验收 R1-R5 全 PASS）

## 已完成

### 规划与审核批（2026-09-02）

阶段 0：bootstrap 首棒无前序 session（规划独立审核代行 gate）→ 阶段 2 轮 1 **NEEDS REVISION**（F-001..F-019，🔴×3）→ 修订 `2f7ac3a` → 同 Agent 复审 **APPROVED** → 收尾 R-001..R-003 `2c70bc8` → 阶段 2.5 **用户批准**（2026-09-02）。基线：无测试基线（纯文档批，无产品代码）——首个基线 S03 建立。

| 任务 | 内容 | 结果 |
|---|---|---|
| T1 | 目录 + git 初始化（master） | 完成（仓库存在） |
| T2 | AGENTS.md 项目宪法 | 完成（`7d5eadc`） |
| T3 | 架构正本 00-architecture.md | 完成（`7d5eadc`） |
| T4 | session-roadmap.md + ADR-0001..0005 | 完成（`7d5eadc`） |
| T5 | 独立审核轮 1 | NEEDS REVISION（F-001..F-019） |
| T6 | 修订 + 复审 | APPROVED（`2f7ac3a`） |
| T7 | 复审收尾 R-001..R-003 | 修毕（`2c70bc8`） |
| T8 | 阶段 2.5 人工终审 | 用户批准（2026-09-02） |

### 收尾批（2026-09-02）

阶段 4/5 独立验证 **PASS**（独立 Explore Agent：安装不变量/一致性/悬空引用/模板合规/安全-契约-前瞻三问全过），顺手修正 V-1..V-4（接力块格式外行折入头行/锚点采信措辞收敛/11 份资产口径注明/批准引文统一）；原子收尾三处翻转（STATUS 台账+M1、roadmap S01+M1 锚、本文件 R1-R5）。

| 任务 | 内容 | 结果 |
|---|---|---|
| T9 | 模板套件安装（资产 11 份落位）+ R1/R2 实测 | 完成（R1 模板外仅活占位 5 处均为格式件；R2 §3.1.1×5 / §3.4×14） |
| T10 | 治理 6 件套 + 阶段 4/5 验证 + 原子收尾 | 完成（VERDICT: PASS；V-1..V-4 已修） |

## 阶段验收（R1-R5，阶段收官时填）

| 条目 | 内容 | 结论 | 证据 |
|---|---|---|---|
| R1 | 占位符清零（grep 实测，仅活占位） | PASS | 勘正（S02 T0，2026-09-02；原「命中 5 处」系内容词过滤口径的行数且不可复现——S02 阶段 0 审核 🟡-1）：`grep -rn '{{' .session-start docs/ --exclude-dir=_templates` 实测 **8 行**，逐行枚举均为非事实占位——`.session-start:202/221/226`（接力格式工作示例，`{{NN}}`/`{{目标一句话…}}` 活占位）、`session-roadmap.md:15`（S01 行验收条目自身 grep 字面量）、`governance-sessions.md:84`（§3.2 接力格式本体活占位）、`plans/2026-09-02-001:30`（S01 plan R1 条目 grep 字面量）、`progress-M1.md:55`（本行勘正说明自引）、`plans/2026-09-02-002:50`（S02 plan T0 勘正说明自引）；**项目级事实占位零残留**。口径注：出现次数随 grep 实现（macOS BSD `--include` 会过滤显式文件参数）与过滤词漂移，故钉命令原文 + 逐行枚举，不裸引次数；命令自引类条目（验收/勘正文字引用本命令）随后续文档自然增长，重放比对以「性质分类零事实占位」为准，非固定行数（S02 阶段 5 V-02 注） |
| R2 | governance §3.1.1/§3.4 保号 | PASS | `grep -c` 实测 §3.1.1×5、§3.4×14（阈值 ≥4/≥6）；`.session-start`/session 模板引用编号一致 |
| R3 | 审核证据链（3 commit 实测） | PASS | `git log --oneline`：`7d5eadc`（规划）→`2f7ac3a`（F 修订）→`2c70bc8`（R 收尾），提交信息与 T5-T7 声称逐字相符 |
| R4 | 用户批准时点落盘 | PASS | session 记录 T8、progress T8、CHANGELOG 治理节三处同日（2026-09-02）留痕 |
| R5 | 治理 6 件套齐备 | PASS | `ls` 实测：session 记录 / STATUS.md / progress-M1.md / dont-do.md / CHANGELOG.md / 接力指令（记录「下一 Session 启动指令」节 + 回复末尾输出） |

## 风险

- S02 spike 五假设任一不成立 → fallback 已预授权（ADR-0005）；届时走范围变更回路重审受影响 roadmap 行
- 安装/端到端验证触达用户 live 环境 → 硬纪律：仅 scratch profile + 临时 DSH_HOME（AGENTS.md 质量纪律节）

## 技术债（台账）

| 债务 | 等级 | 归属 |
|---|---|---|
| L-1 deepseek/exa/perplexity 插件内重实现（上游注册表私有不可枚举；file:line 依据见 ADR-0003 Context） | 🟢 | S03-S05（依据 ADR-0003） |
| L-2 per-profile GUI 覆盖二期候选（profile 级差异走 YAML patch） | 🟢 | 二期候选，不排期（依据 ADR-0004） |

映射正本：`docs/plans/2026-09-02-001-s01-governance-bootstrap-plan.md` 债务映射节。

## 已验锚点（台账）

| 锚点（file:line 或基线项） | 所在 commit | 验证来源 |
|---|---|---|
| 架构 §1 现状表 5 处上游锚点（base patch:450-468 / index.ts:49-73,85-86,103-116,118-121 / exa:61-73 / types.ts:99-120 / settings installSection:469） | `2f7ac3a` 后文本 | Session 01 独立审核两轮实测核对（14 处抽查全命中）；**结论留痕**于 session 记录 T5/T6（逐项输出未落盘，采信范围以两轮 verdict + 三定谳为限） |
| cordis peer 域 `>=4.0.1-rc.1 <5`（vendor 4.0.2）；dsh-web `>=0.1.2-alpha.3 <0.1.3`（npm 有 alpha.4） | `2f7ac3a` | 同上（F-001 核对） |
| 事件名 `credentials/reference-updated`（credentials/src/index.ts:270） | `2f7ac3a` | 同上（F-002 核对） |
| 测试基线 | — | 无（纯文档批；首个基线 S03 建立） |
