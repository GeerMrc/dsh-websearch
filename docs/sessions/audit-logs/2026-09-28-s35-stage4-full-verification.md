# S35 阶段 4 独立全量核验（收官前，2026-09-28）

## 提示词参数头

- 骨架版本：库版本 v2（阶段 4 变体：S35 收官前全量）
- 阶段：4（S36 → S35）
- Session：35
- 输入指针：plan 035/036/038 正本；session-35 记录；提交 dd5a9df/f8e0a3f/scripts/pack.mjs；audit-logs 2026-09-28-s36-* 两处；测试命令四条（node22 绝对 PATH）
- 偏离说明：e2e.real 仅结构核验不实跑（直连出口黑洞窗口在案，curl HTTP 000 证据）——审核方接受该限制并记录

## 审核 Agent 输出原文（逐字归档）

（全文见审核 Agent 输出；关键数字与结论如下，正本以对话留痕为准）

四命令实测：
1. vitest run --exclude e2e.real：Test Files 35 passed (35)；Tests 592 passed (592)；EXIT=0
2. tsc --noEmit：EXIT=0
3. oxlint：3w/0e EXIT=0（官方门 oxlint src tests = 2w/0e）
4. check:i18n：195 keys parity + 36 files zero CJK，EXIT=0

维度 2（记录 vs 实物）：PASS——plans 039-044 八 hash 全数亲验；revert 30bfc59 诚实入账（align=end 计数 0 复原）；T11 证据路径在盘且 rc15-smokes.log 三处声称逐字命中（422 detail 18:33:09Z / tavily 18:35:01Z / exa 18:36:08Z）；dist-artifacts 双名 rc.15 在盘；三红（R-1/R-2/R-3）清偿实证全过。

维度 3（代码抽验）：dd5a9df → anysearch.ts:252-264 fetch 面 unfold+abort+httpStatus 镜像 ✓；f8e0a3f → shared.ts:69-78 pick 双读 ✓；pack.mjs 双名工艺在盘 ✓。

维度 4（誊写卫生）：计数链 589→592 三方逐位对账（+8 = pack×4/anysearch×2/tavily×2）；i18n 195 ✓；STATUS/progress/CHANGELOG/ADR 欠账均属已登记 T6 收官集，无新增矛盾。

问题清单（无阻塞）：
1. [卫生] section.tsx:17 未用 Switch 导入 + :583 未用 onSetDnsScope 解构（81bdd9f/plan040 引入）→ 处置：已清偿（后续提交）
2. [证据轮转] 17:36–18:21Z 段原始日志仅存 stage0-audit 逐字引文（引文工件在声称前已提交，不命中 dont-do 工件未落盘）→ 处置：知悉在案
3. [誊写精度] A2「01:17 … 2.9s」盘上不可复验 → 处置：已改为盘上可复验的 00:58 腿 2.54s + 01:17 腿证据基础如实标注
4. [观察] 无独立 exa-fetch 腿（E1 全开腿覆盖 fetch，非缺陷）→ 处置：记录在案

dont-do 复发：四查全「未复发」；node20 家族条目当晚已两次实证（vitest ERR_REQUIRE_ESM + 实例静默退出）。

结论：**阶段 4 PASS**（含 4 条非阻塞发现，1/3 已当场清偿）。
