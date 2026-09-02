# CHANGELOG

> 格式：**CalVer 纯日期**（`## YYYY-MM-DD — <批次名>（Session NN，<里程碑/批次进度>[+ 债务清偿
> 标注]）`，反向时间序，最新在上）。条目间 `---` 分隔，一条对应一个 session。
> 位置说明：本项目为可发布 npm 插件包，按治理根形态探测规则 CHANGELOG 落仓库根（非 docs/）。
> 分段（加粗标签）：**新增**（交付内容，含 commit/file:line/测试计数）/ **清偿（N 笔）**（逐笔
> 债务编号清偿记录，与 progress 台账划线对应）/ **治理**（阶段 0-5 独立 Agent 留痕：PASS /
> NEEDS REVISION / COMPLETE 逐阶段）/ **诚实标注（遗留项）**（已知限制显式声明——调查类工作
> 也要记录"调查了什么 + 结论"，不装作没发生）/ **跟踪（观察期）**（测试基线链 + 静态检查 +
> 里程碑计数 + dont-do 新增条目数 + 下一 session 接力指令摘要）。
> **诚实标注原则**：CHANGELOG 是外部视图，宁可暴露遗留也不粉饰；🟢 延后项在此显式声明。

---

## 2026-09-02 — 项目立项与治理 bootstrap（Session 01，M1 治理与规划定稿）

**新增**
- 项目立项：独立目录 `/Volumes/IPFSJK/Zcode/dsh-websearch`（git master），零内核侵入外挂式统一 WebSearch 管理插件
- 规划产物四件套：`AGENTS.md` 项目宪法 / `docs/00-architecture.md` 架构正本（高可用链语义规范 + 五 provider + `dshws-` id 前缀）/ `docs/session-roadmap.md`（S01-S10，M1-M6）/ `docs/decisions/adr-0001..0005`（commit `7d5eadc`，修订 `2f7ac3a`，收尾 `2c70bc8`）
- 治理套件安装：`.session-start` / `docs/governance-sessions.md`（§3.1.1/§3.4 保号）/ `docs/STATUS.md` / `docs/progress/progress-M1.md` / `docs/_templates/`×4 / `docs/dont-do.md`

**清偿（0 笔）**
- 无（首轮无存量债务；🟢 新登 2 笔见下）

**治理**
- 阶段 2 计划审核：NEEDS REVISION（F-001..F-019，含 🔴×3：cordis 版本域 / credentials 事件名 / servedBy 承载字段）→ 修订 → 同 Agent 复审 **APPROVED** → 收尾 R-001..R-003 已修
- 阶段 2.5 人工终审：用户批准（2026-09-02，指令节引：「请使用 session-governance 正式接管websearch 项目开发，确保项目高可用/高质量标准可交付」）
- 阶段 0：bootstrap 首棒，无前序 session（规划独立审核代行 gate）

**诚实标注（遗留项）**
- L-1 🟢：deepseek/exa/perplexity 在插件内重实现（上游注册表私有不可枚举），归属 S03-S05（ADR-0003）
- L-2 🟢：per-profile GUI 覆盖二期候选不排期，profile 级差异走 YAML patch（ADR-0004）
- S02 spike 五假设（外置 client half slot 注入 / 安装链路 / installSection 通路 / credentials 写通路 / 交付形态）未经实测——ADR-0006/0007 待 S02 定谳
- M6 上游实测由用户择机执行（S10 备清单与环境）

**跟踪（观察期）**
- 测试基线链：无（纯文档批，无产品代码）→ 首个基线在 S03 建立
- dont-do 新增 1 条（peer 版本域实测）；pitfalls 命中：无（首轮未查库，S02 起进入侧必读）
- 里程碑：M1 ✅（本条目）；下一棒 Session 02（Spike）
