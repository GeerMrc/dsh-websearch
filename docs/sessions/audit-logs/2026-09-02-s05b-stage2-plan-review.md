# Audit Log — 阶段 2 独立计划审核（Session 05b，两轮）

> 参数头（轮 1 与复审同）：骨架库 v2 ｜ 阶段 2 ｜ Session 05b ｜ 输入指针：docs/plans/2026-09-02-005b-s05b-install-e2e-restore-plan.md（轮 2 为修订版 @`65ac837`）、docs/session-roadmap.md S05b 行、docs/dont-do.md（含本棒 T0 新增第三条——三要素一并审核）、skill pitfalls.md、AGENTS.md、docs/00-architecture.md §6、S02 spike 记录、宿主仓机制锚只读路径（apps/cli、packages/boot/app-boot、packages/bundle/base）｜ 相对骨架的偏离说明：无（骨架原样填槽；对照文件与代码锚核验许可均为事实槽位）。
> 审核执行：独立 general-purpose Agent，复审续用同一 Agent（同阶段复审续用不违反独立性）。
> 输出原文逐字落盘如下（轮 1：NEEDS REVISION；复审：APPROVED 附批准性残项 ×1——已修 `2926723`）。
> 轮 1 输出为审核结论全文；复审输出为逐项核验全文。原文较长，正本即本文件，以下为逐字转录。

---

## 轮 1 输出原文

# 计划审核结论：NEEDS REVISION（必改 ×3 / 建议 ×5）

计划机制核心经实测核验成立，但 T0 已落盘的清偿引入了新的同族缺陷，且收官翻转规格有一处 false-green 缺口。逐条如下。

## 机制核验（通过面，供阶段 4 复用）

- CLI 命令形态全部可执行：`dsh plugin --profile web add|remove`（apps/cli/src/plugin.ts:120-163，pnpm 转发器 + reconcile；args.ts:171-181 plugin 子命令自带 `--profile`，绝对 tarball 路径经 anchorPathSpec 原样透传）；`--dump-config` 无 boot 组合观测面（apps/cli/src/dump-config.ts:30-52）。
- auto-scaffold 于 dump/首命令即发生（packages/boot/app-boot/src/profile.ts:805-818；`web` 模板 :142-145 patchReload 'live'）；宿主 HEAD 确为 dev@3281e04b59。
- 组合层级 bundles→profile 用户层→home→`--patch` 实锚在 **profile-boot.ts:124-143 与 :136-143**（非 plan 所引 profile.ts:125-140，见建议 4）；用户层两行覆盖机制成立；基线标量实测在 packages/bundle/base/cordis.patch.yml:450-454（`searchProvider: deepseek-official`/`fetchProvider: http`）。
- `DSH_HOME` 重定向实锚（packages/util/home-paths/src/index.ts:18/:87-91）；本机 `~/.dsh` **真实存在**（profiles/sessions/settings.yaml 等），R5 隔离审计是实质载荷而非仪式。
- D4 事实基础成立：本 shell 实测 DEEPSEEK/TAVILY/EXA/PERPLEXITY/FIRECRAWL 五 key 全 unset；`pnpm dsh` = 仓根 tsx 源码启动（deepseek-harness package.json:153），D1 的 cwd 要求必要且正确。
- 本包 `dsh.bundle.patch` 键 + files 清单（lib + cordis.patch.yml）与 T-prep 核对项一致；bundle patch 仅 insert 条目、用户层只需两行——对架构 §6 示例的正确代偿（S02 H2 机制）。
- 「无 TDD 红绿仪式」分类**确认成立**（本审核即阶段 2 确认动作）：T0 纯文档、T-prep 机械构建、T1-T6 均为命令证据类，零产品代码变更预期；T7「四命令=漂移哨兵，任何 src/tests 变更按实测数字报」是正确控制。无数字外推、无批量执行、T8 独立审核——pitfalls 主要条目均合规。

## 必改

1. **Y-1 清偿执行不完整——旧里程碑行残留，同表自相矛盾【dont-do 第三条复发标注：是】**。T0 commit `19587ef` 对 progress-M3.md 里程碑行是**追加而非替换**：现存两行 M3——:14 残留 `🚧（S03 ✅；S04 ✅；余 S05a/S05b）`（陈旧）与 :15 新行 `🚧（S03/S04/S05a ✅；余 S05b + 用户 with-key 槽位）`并存。这正是 dont-do 第三条「同文件内直接自相矛盾」的失败形态，且发生在该防线沉淀的同一 commit——家族第四次实例。必改：删除 ：14 残留行，补一笔留痕（plan T0 验收要点「三处+一条落盘 file:line 可查」需增补此清偿项或记入债务映射）。
2. **「plan 005b 已过审」为审核前预写**（progress-M3.md:20「进行中」节）。T0 提交时阶段 2 审核未发生（本审核即该审核），且与 STATUS.md:43「计划包审核推进中」同批矛盾【命中 pitfalls「不要提前预写收官状态（悬空引用）」同族】。必改：同批改为「审核推进中」，过审事实由审核结论落盘后回写。
3. **T9 原子翻转对 roadmap S05b 行的 ✅ 标注规格缺失**。roadmap S05b 验收原文含「`web_search` 经 dshws-chain 出真实结果（配任一可用 key…）实测」，而 plan T9 仅写「roadmap S05b 行 ✅ + M3 行按 D4 处理」——S05b 行若裸 ✅ 即验收条目未全项却翻绿。D4 的实质处理**诚实成立**（key 全 unset 实证、S10/M6 先例、M3 闸门保持 🚧 附注、D5 指引槽位落盘、S06 不阻塞有明示），但须补一行规格：S05b 行 ✅ 附指针「机械面 ✅；with-key 用户槽位待回填——session 记录指引节」（或该行保持 🚧 直至回填）。否则 T9 执行时将以 plan 为据写出 false-green 行。

## 建议

4. **锚点行号漂移**（T7 将把它们登记为已验锚点，先修正）：D2/背景所引「profile.ts:125-140 composeEntries 注释」实为 profile.ts:846-861（:847-849 注释原文）；组合层级实为 profile-boot.ts:124-143/:156-173；「bin.ts --help 实测」的帮助面在 args.ts:64-72/:131-134；base patch 行 449→实为 450-454（449 是注释尾行）。
5. **D3 可预注册 remove 侧预期**：remove reconcile 已实现于 apps/cli/src/plugin.ts:77-87（`wasDependency && !stillBundle → splice`），正常 remove 会同步清 bundles。「实测优先」立场不错，但建议把源码预期写入 T5 作判别性对照（偏离即异常），并把 plan 风险节「若 remove 只删 dependencies 不清 bundles」修正为「仅当已装版本丢失 dsh.bundle 声明时才会发生」。
6. **环境验证未入验收要点**：T-prep（build+pack）与 T7（四命令）应显式带 `node --version && pnpm --version` 前置（项目宪法：本机默认 v20 须切 nvm）【pitfalls「环境漂移」条预防】。
7. **R5 过度打包**：隔离审计/四命令/6 件套/原子翻转/分支闭环/槽位指引六面挤一条，阶段 4 无法逐面独立判 PASS；建议拆分或枚举子证据。另 T8 audit-log 落盘位置未指名（先例 docs/sessions/audit-logs/，S04/S05a 均如此）。
8. **阶段 0 结论前瞻引用未标 🚧**：「结论落本 session 记录」指向尚不存在的 docs/sessions/2026-09-02-session-05b.md（同 session 自写允许，但按 STATUS 悬空引用规则应标 🚧 生成中）。

## dont-do 第三条三要素审核：合规

❌ 错误做法 / ✅ 正确做法（四处刷新①-④）/ 来源（三次复发 + commit 链 `c691caa` 等 + 「STATUS 单源规则掩护」机制归因）齐备；准入门槛满足（系统性：三次家族复发，非一次性）；归入「收官序列」主题分组正确。唯其自身防线在落盘同 commit 即被必改 1 违反——建议该条「正确」款增补「替换而非追加」半句，堵住本次新形态。

**总评**：安装/接线/复原的机制链条经宿主源码逐锚验证为真，D1-D5 决策层级合理，实测棒分类成立；三处必改均为一行级修正，修订后可批复。

---

## 复审输出原文

# 复审结论：APPROVED（批准性残项 ×1，随批指派，不阻塞执行）

复审基线：commit `65ac837`（工作树干净，master），全部断言按轮 1 同维度亲验如下。

## 必改核验（×3 全数确认修复）

1. **Y-1 重复 M3 行——已修复，留痕诚实**。`git show 65ac837 -- docs/progress/progress-M3.md` 实测：陈旧行 `🚧（S03 ✅；S04 ✅；余 S05a/S05b）` 已删，里程碑表现在单行 M3（progress-M3.md:14）。plan 背景「T0 补清偿」段（plan:34-36）如实记录家族第 4 实例成因（新行插入旧行未删）。dont-do 第三条「正确」款已增补「**替换而非追加**——S05b T0 曾插入新行而旧行未删，同文件双行并存」，防的正是本次新形态。
2. **「已过审」预写——已修复**。progress-M3.md:20 现为「plan 005b 审核推进中」，与 STATUS.md:43 一致，矛盾消除。
3. **T9 翻转规格——已吸收**。plan T9（:82）显式规定：roadmap S05b 行 ✅ 附指针「机械面 ✅；with-key 用户槽位待回填——session 记录指引节」；M3 行保持 🚧 附注同旨（D4/S10-M6 同构）。false-green 缺口关闭。

## 建议核验（×4 全吸收，×1 部分吸收）

- 建议 5：T5 预期预注册（S-5）实锚准确——「wasDependency && !stillBundle → bundles splice」与宿主 apps/cli/src/plugin.ts:77-87 逐字相符；风险节改写（plan:142-144「仅当已装版本丢失 dsh.bundle 声明时才会残留」）与源码语义一致。D3「实测优先」立场与预注册无矛盾（预注册是判别性假设，非预设步骤）。
- 建议 6：T-prep/T7 均带环境验证前置（S-6，`node --version && pnpm --version` ≥22.19 入记录，plan:73/:80）。
- 建议 7：R5 已拆五子证据①-⑤逐面判定（plan:98-100），audit-log 落盘位置指名 `docs/sessions/audit-logs/`。
- 建议 8：阶段 0 前瞻引用已标 🚧 生成中（plan:23-24）。
- **建议 4：部分吸收——批准性残项 ×1**。背景节四处锚点已全部改正（args.ts:64-72/:131-134、profile-boot.ts:124-143/:156-173、profile.ts:846-861、base patch 450-454，plan:40/:47/:50），**但 D2 依据列（plan:63）仍残留旧串「profile.ts:125-140 composeEntries 注释明示」**，与同文件 :47 的 846-861 自相矛盾。主张本身为真（dump 与 boot 确经同一 applyEntryPatches 组合），仅行号串陈旧，且正确值已在 16 行之上——不阻塞。

**残项处置指派**：D2 依据列「profile.ts:125-140」改为「profile.ts:846-861」（或直接指回背景节修正锚），随下一 docs commit 或最迟 **T7 已验锚点登记前**改正并留痕——T7 将把这些行号写入 progress-M3 锚点台账，登记时必须用修正值。此为本轮唯一残项，依 S03/S05a「APPROVED + 批准性残项指派到任务」先例处置。

## 阶段 2 分类确认（本审核职责内声明）

本棒「无 TDD 红绿仪式」分类**确认成立**：T0 纯文档、T-prep 机械构建、T1-T6 命令证据类，零产品代码变更预期；验证手段（命令原文 + 落盘实测 + T7 四命令漂移哨兵 + 阶段 4 全量重放）满足文档/实测类验证要求。修订版无新增缺陷：轮 1 记录段（plan:28-32）与事实相符，WBS/R5/风险节内部一致，S-5/S-6 标签可回溯轮 1 编号。

**准予按 plan 推进**：T-prep 起（`feat/s05b-install-e2e` 分支），阶段 2.5 用户批准流程照常。

（残项处置留痕：D2 依据列已修 `2926723`，先于 T7 锚点登记。）
