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

## 2026-09-02 — 插件宿主骨架 + 链式 meta-provider（Session 03，M3 第 1 棒）

**新增**
- 正式包骨架 `dsh-websearch@0.1.0`（`35969f0`）：package.json 按 ADR-0007（exports["."] 三键形态 / files / `dsh.bundle.patch` 键 / peer 域 cordis `>=4.0.1-rc.1 <5` + dsh-web `>=0.1.2-alpha.3 <0.1.3` / dep schemastery `>=3.18.1-rc.1 <4` / devDeps 按 dont-do 双实锚实钉）；tsdown esm+dts（outExtensions 钉 `.js`/`.d.ts`——默认 `.mjs`/`.d.mts` 与 exports 不符，实测修正）；cordis.patch.yml（insert 插件行，web 行标量覆盖留用户层）
- 链核 `src/chain/core.ts`：泛型编排 ChainCore（选择级跳过/运行降级/超时预算/全败摘要/日志一处实现）+ `dshws-chain`/`dshws-chain-fetch` 双薄壳 + MemberRegistry 双注册直连拓扑；归因定稿 D2（search content 首行 `[served-by: <id>]` 两形态）+ D3（fetch 仅日志，body 零注入）
- `src/errors.ts`：DSHWS_ 码清单（链级 3 码 + 五族成员命名空间）+ DshwsError + 全败摘要构造（cause=末位抛错）；`src/config.ts`：架构 §5 全字段 schema + resolveConfig 显式默认化（空链→内置序 tavily→exa→perplexity→firecrawl→deepseek / timeout 30000）
- apply 装配：Config→resolveConfig→双链注册 ctx.web + `ctx.logger.info` 日志接线；`ctx.web` 增强、schemastery 可调用归一化、cordis logger 三处 npm 发布面 API 实证
- Agent Note `docs/notes/2026-09-02-s03-chain-core-design.md`（链核 port/假面义务/归因定稿/构建契约事实）；progress-M3 台账（首个测试基线 47 条建立）

**清偿（2 笔）**
- 前序审核新增 🟡×3（progress-M1 M2 行镜像失同步 / R1「8 行」计数誊写 / V-03/V-04 收官留痕缺口）：T0 清偿，commit `c691caa`
- L-3 🟢（spike 脚手架不入库，正式骨架重建）：T1 正式包骨架落库，`35969f0`

**治理**
- 阶段 0 前序审核（独立 Explore Agent，骨架库 v2，四维实测）：S02 **PASS**（🔴×0；新增🟡×3 流程卫生债 → T0 同棒清偿）
- 阶段 2 计划审核（独立 general-purpose Agent）：轮 1 **NEEDS REVISION**（F-001 分支纪律 / F-002 链 available() 缺测 / F-003 六件套漏踩坑沉淀；F-004..F-008 🟢）→ 全项修订 → 同 Agent 复审 **APPROVED**（T1/T2 机械豁免类别确认成立）
- 阶段 2.5 人工终审：AskUserQuestion 未获答，按接力序取默认批准项自主推进（披露于 session-03 记录）
- 阶段 4/5：独立 Agent 验证 **PASS / COMPLETE**（R1-R5 对峙 + 全量 47 测试与四命令亲跑复现 + 变异判别力独立复现 + 安全/契约/前瞻三问 CLEAN；V-01..V-06 全 🟢 已逐条落 progress-M3 台账）
- 分支纪律落地：开发在 `feat/s03-host-skeleton`（阶段 4/5 PASS 后合入 master，AGENTS.md 首次代码棒执行）

**诚实标注（遗留项）**
- L-1 🟢（S04/S05a）/ L-2 🟢（二期）归属不变；L-3 已清偿
- MemberRegistry.toResolver() 恒 enabled/ready 为 S03 假面——S04 接 credentials describe + 事件刷新时必须替换（Agent Note §2 义务）
- 凭据热刷新未测（roadmap/plan 显式移 S04）；调用方 abort × 成员超时同窗竞争时序归 S08 e2e（plan 风险节）
- 安装端到端（dsh plugin add + patch 两行）归 S05b；本棒无 scratch profile / 实例启动

**跟踪（观察期）**
- 测试基线链：**47 条（6 文件）全绿**（本仓首个基线）；typecheck 0 error；lint 0 warning（oxlint 96 rules）；build lib 20.34 kB
- dont-do 新增 0 条（累计 2 条）；里程碑：M3 🚧 第 1 棒完成；下一棒 Session 04（deepseek/tavily provider + 凭据接线）

---

## 2026-09-02 — 可行性 spike 五假设定谳（Session 02，M2 可行性定谳）

**新增**
- 五假设 scratch 实测全成立（一次性 spike 包 `dsh-websearch-spike` @ `/tmp/dshws-s02-spike/`，不入库）：H1 外置 client half 分发/slot/locale/remote 全链 GO（combo 分发 200 + 设置页 en/zh 热切换渲染 + 细粒度 inject 契约 fail-loud 实证）；H2 `dsh plugin add` 本地目录 + tarball 双形态三处落盘（dependencies / `dsh.profile.bundles` 自动追加 / patch 接线）；H3 installSection describe/mutate 热改（revision 0→1 + 服务端 onChange + settings.yaml 持久化跨重启）；H4 credentials set→describe(source:file)→reference-updated 事件→unset 回落全链；H5 交付形态定谳
- ADR-0006：GUI 外置 client half **GO**（fallback 不启用，S06/S07 原目标执行）+ client bundle 构建契约实测结论（独立 tsdown：cjs + `__ModuleLoader__.load` banner + `entryFileNames:'client.js'` + inlineDynamicImports + 模块表外部面）
- ADR-0007：包名 `dsh-websearch`（npm 未占用实测）/ 独立 `0.1.0` 版本线 / 路径+tarball 交付（npm publish 延后 M6 后）/ 依赖只钉 npm 已发布稳定核心面
- S02 计划契约 `docs/plans/2026-09-02-002-s02-spike-plan.md`；progress-M2 台账；dont-do 第 2 条（npm latest dist-tag 失真）
- spike 全程 scratch 隔离（`DSH_HOME=/tmp/dshws-s02-spike/home`、profile=`web`、端口 3410、真实 `~/.dsh` 与 3080 实例零接触、凭据仅伪值且 unset 复原）

**清偿（1 笔）**
- S01-🟡-1（R1 占位符证据数字口径不可复现）：progress-M1 R1 行改逐行枚举口径（命令原文 + 8 行性质枚举），commit `410d58f`

**治理**
- 阶段 0 前序审核（独立 Explore Agent，四维实测）：S01 **PASS**（🔴×0；🟡×1 → T0 清偿；🟢×2 备注）
- 阶段 2 计划审核（独立 general-purpose Agent）：轮 1 **NEEDS REVISION**（F-001 🔴 非模板 profile 无 web 面 / F-002、F-003 🟡 / F-004..F-009 🟢）→ 全项修订 → 同 Agent 复审 **APPROVED**
- 阶段 2.5 人工终审：用户批准（2026-09-02，「批准，自主执行」）
- 阶段 4/5：独立 Agent 验证（R1-R5 对峙 + 一致性 + 安装链重放冒烟，结论见 progress-M2 阶段验收表）

**诚实标注（遗留项）**
- L-1 🟢（S03-S05）/ L-2 🟢（二期）归属不变；L-3 🟢 新增：spike 脚手架不入库，S03 按 ADR-0006/0007 结论重建正式骨架
- npm 发布面滞后 dev 树（`installSettingsSection` 等便利导出不在 npm alpha.3/.4）——插件依赖只钉稳定核心面，需要新 API 时须先确认进入 npm 发布线
- combo-only 分发（单包 URL 404）为上游当前实现形态，升级演练手册（S09）需覆盖
- M6 上游实测由用户择机执行（S10 备清单与环境）

**跟踪（观察期）**
- 测试基线链：无（spike 类不建基线）→ 首个基线 S03 建立
- dont-do 新增 1 条（latest dist-tag 失真，累计 2 条）；里程碑：M2 ✅（本条目）；下一棒 Session 03（插件宿主骨架 + 链式 meta-provider）

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
