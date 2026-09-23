# 不要做（Negative Instructions）

> 本文件记录 dsh-websearch 开发中**永久禁止的行为**。每条含三要素：❌ 错误做法 + ✅ 正确做法 +
> 来源（Session/任务编号/RCA 链接），缺一不可。
> **准入门槛**：新增条目必须经过 踩坑 → RCA → 确认是**系统性问题**后才写入，不写一次性问题
> （防清单噪音化——一次性问题记 session 记录即可）。已确认的系统性坑（超过 15 分钟才解决，
> 或导致回滚/数据丢失）不沉淀是治理失败。
> 组织方式：早期按主题分类，后期可按 Session 分组（`## <主题>（Session NN）`）追加。

## 依赖与版本（Session 01）

### ❌ 不要凭印象假设 peer 依赖的版本域

- **错误**：假设 `@deepseek-ai/cordis` 与 `@deepseek-ai/dsh-*` 同为 `0.1.2-alpha.x` 域——实测 npm 上 cordis 只有 `4.0.1-rc.1..4.0.2`（宿主 vendored 为 4.0.2；anysearch 存在证 peer 为 `>=4.0.1-rc.1 <5`）。按错误域写 package.json 将直接不可安装。
- **正确**：钉版本域前必查两处实锚——宿主 `vendor/cordis/package.json`（或 `node_modules` 实装版本）+ `npm view <pkg> versions`；dsh 系包与 cordis 系包分属两条版本线，分开核对。
- **来源**：Session 01 阶段 2 独立审核 F-001（🔴）；修订 commit `2f7ac3a`

### ❌ 不要信 npm `latest` dist-tag（对本仓库相关包失真）

- **错误**：`npm view <pkg> version`（= latest tag）判断可用版本——实测 `@deepseek-ai/dsh-settings` latest 指向 `0.0.1-rc.1` 旧线，而真实发布线 `0.1.2-alpha.2..4` 存在且 alpha.4 为最新；据此会误判「包未发布/无新版」。
- **正确**：判断发布态一律 `npm view <pkg> versions` 看全列表（必要时 `time --json` 看发布时间）；dist-tag 只作参考。钉 prerelease 域用显式 range（如 `>=0.1.2-alpha.3 <0.1.3`）。
- **来源**：Session 02 T1 双实锚核对时实测发现（`410d58f` 后）；ADR-0007 依赖钉版策略采纳

## 收官序列（Session 05b，三次复发后系统性确认；S07 扩化）

### ❌ 不要在收官/启动原子序列里漏刷新任何状态区（progress 四处 + STATUS 总览行/位置块）

- **错误**：收官或启动只刷新部分状态载体——progress 文件自身的状态区（里程碑行括注、「进行中」/「待启动」节、任务表 T 末行）漏刷；或 STATUS.md 内部里程碑**总览行**与「当前位置块」口径不同步（S06 收官刷了位置块与 M3 总览行，M4 总览行漏刷成 ⏳，S07 阶段 0 审核抓获 🟡-2）。后果 = 同文件或跨文件状态自相矛盾。
- **正确**：原子序列把状态区刷新当清单逐处打勾，缺一不可——①progress 里程碑行括注（**替换而非追加**——S05b T0 曾插入新行而旧行未删，同文件双行并存）②progress「进行中」清空并下移 ③progress「待启动」前移 ④本棒任务表 T 末行落完成态 ⑤STATUS 里程碑总览行（每个受影响里程碑，与位置块同口径）⑥STATUS 台账行 ⑦STATUS 当前位置块。收官与启动两时点同规则。
- **来源**：三次家族复发——S04 阶段 0 抓 progress-M1 同类（🟡，`c691caa` 清偿）、S05a 阶段 0 观察 S03 R 表标题、S05a 阶段 0 抓 progress-M3 状态区（🟡 Y-1，S05b T0 清偿）；第四次 = S07 阶段 0 抓 STATUS M4 总览行漏刷（🟡-2，S07 T0 清偿）——STATUS 单源规则掩护了它（位置块始终正确，总览行无人查）

## 隔离法证（Session 07）

### ❌ 不要把「~/.dsh 零接触」写成绝对主张——mtime 核对无法归因常驻进程写入

- **错误**：隔离审计用 `ls -la ~/.dsh`（或 stat mtime）核对后写「`~/.dsh` 全程零写入/零接触」——常驻进程（如 3080 停靠实例）会在本棒窗口内向默认 home 写 UI 状态（S07 实测：`~/.dsh/settings.yaml` 的 `welcomeNoticeVersion` 于 21:42 落窗），mtime 变化与本棒动作无关，但绝对主张被下一轮审核用同一证据推翻（S07 阶段 4/5 🟡-1）。
- **正确**：隔离主张一律写**「本棒动作零接触」**并附归属证据链——①本棒全部命令的 DSH_HOME 指针清单 ②涉事文件的键内容核对（无本棒命名空间键）③写入时点 vs 本棒动作时窗对照 ④窗口内新进程排查（ps）。mtime 只作「本棒动作后未变」的下限证据，不作归属证明。
- **来源**：S07 阶段 4/5 独立验证 🟡-1（`~/.dsh/settings.yaml` mtime 21:42 归因常驻 3080 实例 welcomeNoticeVersion 持久化，宿主 ui-settings-general/src/index.ts:16；session-07 记录措辞处置清偿）；S06 同款绝对主张未被查验属漏网，下不为例。

## 输入派发与实测判定（Session 14 入册；12b/S13 两棒复发定谳）

### ❌ 不要以「调用成功」判定 webview 后台态输入动作已生效

- **错误**：IAB 面板可见但宿主窗口处于后台态时，认为 `focus()` / Playwright locator click / `dom_cua.click` 调用成功返回即动作已生效——12b 实测 `focus()` 不生效（须 focusin 冒泡触发等价事件）；S13 实测 locator click 两次超时（actionability 不过）+ `dom_cua.click` 假成功无任何效果。
- **正确**：每个输入动作以「**预期效果出现**」判定（UI 状态变化亲见/断言通过），不以调用返回值判定；可靠通路 = `cua` 坐标点击（截图定位后按坐标派发）+ focusin 冒泡等价事件触发。
- **来源**：session-12b T4 手法沉淀 + session-13 T5 坑（docs/sessions/2026-09-04-session-13.md 踩坑节）；S14 阶段 0 审核 🟢① 复评入册（家族第 2 次跨棒，2026-09-06）

## 收官证据链（Session 12 阶段 0 定谳，S11 事故入册）

### ❌ 不要在收官序列里「声称完成而核心工件未落盘」——STATUS 预写收官指针前必须逐一 `ls` 实物

- **错误**：收官提交（S11 b23097b）把 STATUS 台账行写成 ✅ 并指向 session 记录路径，但该记录文件从未写入（T9 序列里「session 记录 + 接力指令」步骤被跳过）；roadmap 未更新、CHANGELOG 缺条目同批发生。下一 session 的标准自举入口（记录 + 启动指令）不存在而看板声称存在。
- **正确**：①**session 记录随 T0 创建骨架、逐阶段补内容**，收官时只做补全与核对，不做从零撰写（缺口无处藏）；②收官原子序列加「实物存在性核对」清单步——本棒收官应收工件逐一 `ls`/`git log --diff-filter=A` 亲证在档后，才允许 STATUS/roadmap 写 ✅；③指针写进看板前先验文件存在（悬空引用规则）。
- **来源**：S12 阶段 0 独立审核 🔴1（docs/sessions/audit-logs/2026-09-04-s12-stage0-review-of-s11.md；session-11 记录全历史从未存在 + STATUS:46 悬空指针 + progress-M7:73 T9 声称与实物相反）；S12 T0 修复（session-11 reconstructed 补落 + 本条目入册）

### ❌ 不要在阶段 4/5 gate 未翻案前把验收入账改成 PASS——翻转必须有复验证据先落盘

- **错误**：阶段 4/5 独立验证在盘正本为 BLOCKED（补完清单三腿在档），收官提交却把台账 T8 行写成「PASS / COMPLETE（R1-R5 逐条 PASS）」，复验输出零落盘——入账与正本直接矛盾，且按 plan 自身条文（R1/R3 含浏览器腿、jsdom 断言点名交付）该翻转在证据上不可能成立。
- **正确**：验收结论只能由**在盘 audit-log 正本**背书；BLOCKED→PASS 翻转必须先补齐正本点名的证据腿（断言/探针/浏览器腿实做或正式改判债务入台账），复验输出落盘后，才在同一原子序列里更新台账行；时点原文不删、勘误注记跟随（沿 S10 T10 先例）。
- **来源**：S12 阶段 0 独立审核 🔴2（stage45 正本 BLOCKED vs b23097b 的 progress-M7 T8「PASS / COMPLETE」；补完清单 docs/sessions/audit-logs/2026-09-03-s11-stage45-verification.md）；S12 T0 撤销入账 + T3/T5/T7/T8 证据闭合

### ❌ 不要在开发调试中触碰默认生产环境 ~/.dsh（3080）——开发实例固定 3423

- **错误**：开发/换包/实测时误把插件装进（或在）`~/.dsh` 默认环境、改其 settings/凭据/profile 依赖，或起 3080 当调试实例——污染用户日常生产安装（现装 anysearch 插件，与 dsh-websearch 后装者赢互斥，ADR-0013）。
- **正确**：一切开发调试走 3423 固定端口 + `/tmp/dshws-s14a/home` scratch 家目录；动 `~/.dsh` 的唯一合法前提 = 用户明确指令原文（交付后安装/升级生产），且操作前复述留痕。
- **来源**：用户环境裁定 2026-09-12（环境盘点确认 `~/.dsh` 从未装过 dsh-websearch 后定谳）。

## 依赖域与 semver 判定（Session 32 T0 入册）

### ❌ 不要以数值直觉断言「semver 范围覆盖某预发布版」——必须用真实 semver 实测 satisfies

- **错误**：以 `0.1.6-alpha.1 < 0.1.6` 的数值序直觉断言「peer `>=0.1.5-rc.1 <0.1.6` 覆盖 0.1.6-alpha.1 无需放宽」（S30 CHANGELOG 原句）。node-semver 预发布排除规则：预发布版仅当**同一 [major,minor,patch] tuple 且带预发布的比较子**存在时才被放行——本例唯一预发布比较子是 tuple 0.1.5 的下界，0.1.6 预发布一律 false。结果：生产 0.1.6-alpha.1 树 + 插件 v0.1.1 自切换日起 peer 未满足（false-green 审核被双重独立审核同时漏过，7 天后才被实测纠偏）。
- **正确**：任何「范围覆盖 X」断言必须以真实 semver（node_modules 内任一副本即可）跑 `satisfies(X, range)` 实测留痕再落笔；含预发布版的 peer 域用「稳定区间 + 逐个预发布显式钉」（如 `>=0.1.5-rc.1 <0.1.8 || 0.1.6-alpha.1 || …`），并随上游每个新预发布逐钉扩展。
- **来源**：S32 阶段 0/2 独立审核实锤（semver 6.3.1/7.8.4/7.8.5 三副本一致判定；audit-logs 2026-09-23-s32-t0-stage0-audit.md §3b）；CHANGELOG S30 条勘误 2026-09-23。
