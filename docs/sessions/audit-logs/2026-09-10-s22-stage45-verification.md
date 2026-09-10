# Stage 4/5 审核 — S22（正本）

> 阶段 4 独立回顾审核 + 阶段 5 独立交叉验证，各自独立 spawn，亲跑（node v22.23.2）。

## Stage 4 结论：PASS-WITH-NOTES → 缺陷对当场清偿（`3842079`）

- 门墙亲跑（审核时点）：test **438|13(451) exit0** / tc 0 / lint 3w0e / i18n 138 keys。
- R1-R5 全 PASS：wire 红→绿断言逐 file:line 核证（tavily:140-176 / exa:194-223 /
  firecrawl:68,80 / anysearch:38-80）；守卫双路径（config.test:300-324 + settings.test:137-157）；
  GUI 386 client 用例；版本/UA×5/Note §8/loopback 两场景。
- **破坏探针双红**：Exa 守卫边界反转（>0→>=0）→ 双路径各红 1；TBS_TOKEN 放开 → 红 3。
  探针改动已还原（git diff 空）。
- 缺陷×2（低）→ 3842079 清偿：① tbs 孤立 cd_min/cd_max 无 cdr:1 可通过（已收紧 + 2 用例）；
  ② Exa P3 GUI 行组缺专属交互用例（已补，verbosity/ceiling/sections 三动作）。
  清偿后全量 **439|13(452) exit0** / tc / lint / i18n 全 0。
- 信息项：vite stderr 第三方包缺 sourcemap 噪音（dsh-client-ui-primitives 发布物，非本仓）。

## Stage 5 结论：COMPLETE-WITH-NOTES

- 修复批后全量亲跑复现 **439|13(452) exit0**。
- 安全：新参数全为出站 JSON body 字段（逐家 wire file:line），tbs 文法约束在双路径执行，
  无注入面；守卫报错回显用户输入属本机操作者面，可接受。
- 契约：旧存量配置零破坏（qdr 存量兼容断言在测；P3 字段全部缺省不发送）；loopback bodies
  捕获不改行为表语义。术语勘正（可选）：plan D1 写 "zod"，实际 schema 库为 schemastery。
- 前瞻：S15 README 需收录 language fan-out 与 tbs 文法新素材面（正常接力，非本批义务）。
- 完成度：T0-T7 代码面全在；tag/params 不实现是 plan §0 硬规则计划内条款，**无范围变更**；
  剩余 = 阶段 6 收官四件（本 audit-log 所属动作）。
