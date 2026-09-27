# S36 阶段 0 独立审核 — Session 35 收官前现状（2026-09-28）

## 提示词参数头

- 骨架版本：audit-gate 库版本 v2（阶段 0 变体：收官前现状审核）
- 阶段：0（S36 → S35）
- Session：36
- 输入指针：docs/STATUS.md；docs/sessions/2026-09-27-session-35.md；docs/plans/（035/036/038）；docs/progress/progress-M7.md；./CHANGELOG.md（仓库根）；docs/decisions/adr-0022-dns-resilience-layer.md；git log/status/dd5a9df；/private/tmp/dshws-s35/home/logs/dsh-websearch.log（+ .bak-0115）
- 背景事实（交叉核对用，非结论）：今晚 3423 完成 S35-T11 逐工具实测（8 项 PASS）、修复 anysearch fetch 面错误保真缺陷（dd5a9df）、发生 node v20 误启动事故
- 偏离说明：无（中性措辞；指针制输入）

## 审核 Agent 输出原文（逐字）

# S35 收官前现状审核（独立阶段 0 审核 Agent，只认盘上证据）

审核对象：dsh-websearch @ feat/s35-dns-resilience，工作区 clean，HEAD=dd5a9df。以下全部结论经本人在盘亲验。

---

## 🔴 阻塞级（收官前必须清偿）

**R-1. dd5a9df 修复未进任何 tarball、未装上 3423——“3423 已就绪（供用户实测）”的口径对 fetch 面不成立。**
- 证据链：`dist-artifacts/` 最高 rc.14（mtime Sep 28 00:22 +0800）< dd5a9df 提交时（Sep 28 01:12:22 +0800，`git log --stat -1 dd5a9df`）；无 rc.15。
- 3423 实装包 = 0.2.0-rc.14（`/private/tmp/dshws-s35/home/profiles/web/node_modules/dsh-websearch/package.json`）。拆实装 bundle `lib/index.js`：search 面已有 `unfoldHttpErrorDetail` 展开模式，**extract 面仍裸抛**`` `Anysearch API error (HTTP ${status})` ``——正是 dd5a9df 修的那个面。
- 运行日志反证在案：`/private/tmp/dshws-s35/home/logs/dsh-websearch.log` 18:13:55Z（= 提交后 1 小时）仍出现无 detail 的 `member dshws-anysearch failed (Anysearch API error (HTTP 422))`。
- 结论：session-35.md:108「3423 已就绪」按现状写进记录即为失真。用户人工实测前必须重打包（rc.15）重装，或在交付说明显式披露该已知缺陷面。

**R-2. 今晚 T11「逐工具实测 8 项全 PASS」的盘上证据不全——tavily/exa 两腿无任何在盘运行时证据。**
- 在盘两份证据属实但覆盖有限：`dsh-websearch.log`（43 行，17:36–18:21Z 三段 boot）served-by 统计 = anysearch×6、firecrawl×2（均降级路径）、**tavily×0、exa×0**；`dsh-websearch.log.bak-0115`（243B，16:58Z，3 行，anysearch 单轮）。
- 17:16Z 轮转（bak 创建）与 17:36Z 新 log 之间 20 分钟空窗（约对应 node v20 事故恢复窗），中间轮次日志已不可得。
- 治理约束：plan 038 落盘的地面事实 D「file-evidence-only verdicts」（docs/plans/2026-09-27-038-connect-flap-verification-noise-plan.md）+ dont-do「收官证据链」节（docs/dont-do.md:48）——若 T11 记录照写「8 项全 PASS」而 tavily/exa 腿无文件证据，即命中「声称完成而工件未落盘」家族。
- 清偿路径（二选一）：重跑 tavily/exa 单开腿再生日志；或如实记录「哪些腿有日志、哪些腿证据已随轮转丢失」，并把两份 /tmp 日志归档入 `docs/sessions/audit-logs/`（现存 audit-logs 目录 2026-09-27 条目止于 s38，无今晚 T11 证据归档）。

**R-3. plans 039–044（7 个提交）在全部四类台账中零登记。**
- 提交在盘：8f97131(plan039)/81bdd9f(plan040)/4ec7bb3(plan041)/92fb4f7(plan042)/85ed683(plan043)/c1669be(plan044)+30bfc59(**revert**)，另有 8bf3f45 布局修复——git log 亲验。
- 台账全空：`docs/plans/` 仅存 035/036/038（无 037/039–044 文件）；session-35.md grep "039|040|041|042|043|044|rc\.14|dd5a9df|v20" 零命中；STATUS.md 同样零命中；roadmap S35 行括注仅提 plan 036。
- 这些是用户驱动的 UI 微批（先例 S14f–S14t：STATUS 台账逐行 + commit hash 收账）。收官批必须补登记，**且 plan044 的 revert 必须诚实入账**（30bfc59：align=end 漂移进左侧栏/越出设置对话框，回滚 align=center）。

---

## 🟡 新任务开工前清偿（可并入收官批，但须显式动作）

1. **STATUS 位置块与 session 记录直接矛盾**：STATUS.md:110 写「**plan 038 进行中**」，而 session-35.md:95-96 已记 plan038 阶段4/5 完成 + T3 完成。自最后一次位置块手刷（2c3f8a8）以来 16 个提交未反映（038 收尾、039–044、rc.3→rc.14、今晚 T11、dd5a9df）。位置块设计刷新点为「启动+收官」，中期滞后本身不违规，但 2c3f8a8 是手动中期更新且其内容已被后续工作推翻——收官若不全量刷，即 dont-do「收官序列状态区漏刷」第 5 次复发。
2. **node v20 误启动事故零记录**：session-35.md 踩坑节（:113-121）7 条无此项；开发规范强化说明（:133）已规定「node ≥22.19 经 nvm 绝对路径」，事故恰是该纪律的反例实证，且 node20 崩溃在本仓有家族先例（CHANGELOG 2026-09-26 S33 条目：lefthook pre-push 在 node20 下崩溃）。应入踩坑节，并考虑沉淀「沙箱 PATH 解析必须绝对路径」条目。
3. **ADR-0022 转正时点两口径**：ADR 正文 Status 节（adr-0022:13）写「随 **T6** 拦截层落地复核后转 accepted」——T6 早已落地且阶段 4/5 已过；session-35.md:80 写「随 **T11** 落地转 accepted」。收官批转 accepted 时须顺带勘一致。
4. **session 记录 T11 节为 rc.1 时点快照**：session-35.md:99 仍写「0.1.3 → 0.2.0-rc.1」，而 package.json 现值 0.2.0-rc.14、dist-artifacts rc.3–rc.14 双名齐全；rc 谱系只活在 commit message 里。遗留节「T10 浏览器截图腿（3423 双主题 zh/en）」（:79）与 T11 节只做了 zh/dark 视觉判读（:102）未对账。收官补全时 T11 节须扩为完整测试腿记录。
5. **progress-M7 完全无 S35 登记**：「进行中」节仍写「无（S14u 收官 2026-09-07）」（progress-M7.md:22），与 STATUS「S35 进行中」矛盾；S32–S34 均为收官后追加批次节模式，S35 在跑期间从未登记。

---

## 🟢 显式声明归属即可

- **全套件计数未随 dd5a9df 更新**：最后在册 589|13(602)（plan042 提交）；anysearch 文件 20/20。收官门墙全量重跑自会给终数。
- **T11 节「双名 tarball 入 dist-artifacts」为时点性表述**：rc.1/rc.2 tarball 已被后续 rc 替换（dist-artifacts 非 git 跟踪），注记即可。
- **「token 见交付说明」**（session-35.md:108）指向对话产物非盘上工件，收官补全时改为盘上指针或删除。
- **18:21Z 起 3423 实例**（pid 20597 LISTEN 127.0.0.1:3423 亲验在线）= rc.14 pre-fix 构建——若不重装即交用户实测，须披露。

---

## 台账矛盾清单

| # | 矛盾 | 证据 |
|---|---|---|
| 1 | 位置块「plan 038 进行中」vs 记录「plan038 阶段4/5 完成」 | STATUS.md:110 vs session-35.md:95-96 |
| 2 | progress-M7「进行中：无」vs STATUS「S35 进行中」 | progress-M7.md:22 vs STATUS.md:29/110 |
| 3 | ADR-0022 转正时点 T6 vs T11 | adr-0022:13 vs session-35.md:80 |
| 4 | plans 目录实物（035/036/038）vs 提交链声称的 plan037/039–044；审核输入指针「035-044 计划文件」与实物不符 | `git ls-files docs/plans/` vs commit messages |
| 5 | 「3423 已就绪」vs 实装 rc.14 缺 dd5a9df 修复 | session-35.md:108 vs 实装 bundle 拆验 + 日志 18:13:55Z |
| 6 | progress-M7 里程碑表 M5=🚧、M7=✅2026-09-06（:16/:18）vs STATUS M5 ✅、M7 🚧 复开——该表自 S15 起停更的结构性漂移，属 dont-do 收官序列家族欠账面 | 两文件对照 |
| 7 | CHANGELOG 位置：审核指针写 docs/CHANGELOG.md，实物在仓库根 ./CHANGELOG.md（根 CHANGELOG 自述「按治理根形态探测规则落仓库根」）——指针勘误，非仓库缺陷 | `find . -name "CHANGELOG*"` |

## 收官原子序列未刷新点全清单（现状核对）

1. STATUS 台账行 35（:99）：🚧，指针停在阶段 0/1 时点 → 须 ✅ + 全量指针。
2. STATUS 当前位置块（:110-116）：缺 038 完成态、039–044、rc 谱系、今晚 T11、dd5a9df。
3. STATUS M7 总览行（:29）：🚧 复开 → 收官口径。
4. roadmap S35 行（session-roadmap.md 尾表）：⏳，括注仅 plan 036 → 须 ✅ + 覆盖 036–044 增补链。
5. progress-M7：S35 批次节（含门墙表/已验锚点/债务划线）+ 状态区（进行中/待启动/里程碑行 M5/M7）。
6. CHANGELOG（根）：最新条目止于 2026-09-26 S34——无 S35/v0.2.0 批（含 036–044 + dd5a9df + 撞名澄清）。
7. ADR-0022：proposed → accepted（并勘 T6/T11 口径）。
8. session-35 三占位节：交付物（:75）/当前项目状态快照（:125）/下一 Session 启动指令（:129）+ T11 节扩全 + 踩坑补 node v20。
9. 发版面：package.json 0.2.0-rc.14 → 0.2.0 定版、README zh/en DNS 节 + 前置串/占位链接清偿（🟢 归属已改随 v0.2.0）、双 tarball、npm publish 呈批（高危门控）、T12 候令。

## dont-do 复发检查（现有 9 节逐一对照）

- 「收官序列状态区漏刷」（05b 节）：**未复发**（收官未发生）——但见 🟡-1/矛盾 6，为现存高危欠账面。
- 「声称完成而工件未落盘」（12 节）：**未复发**（8/8 PASS 尚未入册）——但 R-2 若照写即命中，属“预复发”状态。
- 「交接证据链枚举」（S35 入册节）：本次审核输入给的是范围锚点 + 单 hash，无枚举清单——**未复发**。
- 「客户端 Remote 挂载」（S35 plan036 节）：039–044 未触碰挂载面——**未复发**。
- 依赖/隔离/输入派发/semver/跨版本五节：今晚工作无命中面；今晚全程 3423 + DSH_HOME=/tmp/dshws-s35/home，幸存日志无 3080 触碰痕迹。

## 结论

**有条件可进入收官补全（T1–T6）。** 技术面已达收官基线：代码全部提交、工作区 clean、3423 在线、plan038 交付的 compact connect-flap 行（runKey #0007/#0008、retry/degrade 箭头、UND_ERR_CONNECT_TIMEOUT cause-code）在 18:19Z 段实测可见——运行时证据活着。但必须先清三件 🔴：①dd5a9df 重打包重装（rc.15）或显式披露，否则“用户人工实测”测的是旧面；②tavily/exa 腿证据补齐或诚实降级记录 + /tmp 日志归档；③039–044 七提交（含 plan044 revert）补登记方案落定并入收官批。三者均属记录/包装面，不动代码，预计一个收官批内可清偿完毕。

---

## 处置记录（主 Agent，清偿时回填）

- R-1 → 提前执行 T8（pack.mjs 脚本化）+ 构建 rc.15 + 重装 3423 + 错误路径冒烟（见 session-36 记录 T8/R-1 条目）
- R-2 → 重跑 tavily/exa 腿再生日志 + 两份 /tmp 日志归档入 audit-logs（见同上）
- R-3 → 039–044（含 30bfc59 revert）补登记进 session-35 记录与 CHANGELOG S35 批（见 T1/T6）
