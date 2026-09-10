# Stage 2 计划审核 — S21（reconstructed）

> **重建披露（2026-09-10，S22 阶段 0 gate 抓获后补落）**：S21 阶段 2 独立审核 spawn 的原始
> 输出未落盘（session-21.md L36 原文称「与 stage0 同 commit 落盘」失实——`a9eb63e` 只落了
> stage0）。本正本由 S22 T0 治理批依据 session-21.md 记录的审核结论摘要 + plan 021 终稿
> （审核意见已内化于 D1/D2/D4-D5/B1-B3 标注）reconstructed；审核过程本身的独立 spawn 真实
> 发生（会话执行留痕），丢失的只是落盘正本。证据力弱于原始逐字输出，以本披露为限。

## 结论（依 session-21.md L36 记录）

两轮制：初审（必改×3 + 建议×6）→ 主 Agent 修订 → 复审 **APPROVED**（附两条非阻塞提示，修订时顺手勘正）。

## 初审必改项（B1-B3；终稿内化位置亲证）

- **B1 gate 构造序**：gate 先注册与链成员就绪的时序矛盾 → lazy thunk 单一机制
  （`resolveChain: () => WebFetchProvider`，不建 setter 第二机制〔复审提示 1 同源〕）。
  亲证：plan 021 D1（L29）B1 段 + 实现 `src/fetch-gate.ts`（阶段 4 R3 路由 2 例在测）。
- **B2 registry 注册矛盾**：ChainFetchProvider 若经 `ctx.web.registerFetchProvider` 注册
  会成为用户可 pin 选项（设计外行为）→ 改为插件内部 fetch MemberRegistry（不经 ctx.web）。
  亲证：plan 021 T4（L52）B2 段 + 阶段 4 R2 亲读背书（audit-log stage45 §2 R2）。
- **B3 启停语义未决**：fetch 链成员 `enabled` 是否独立于搜索链 → 写死「成员级 enabled 跨链
  共享、链序独立」（最小配置面，ADR-0019 明示）。亲证：plan 021 D5（L40）「B3 写死」标注。

## 建议×6 与复审两条非阻塞提示

结论摘要未逐条留痕（正本丢失的一部分）；可核证的落点：复审提示 1 = 不建 setter 第二机制
（plan 021 D1 内注）；提示 2 与建议项已内化于终稿 D 节标注（B1/B2/B3/S5 等）。不再凭记忆
补写具体条目——以 plan 021 终稿内化标注为可证下限。

## 复审采信链

复审 APPROVED 所指向的 plan 021 终稿即当前在盘文件（9,799B，commit `a9eb63e` 落档）；
其执行结果由 stage45 正本（415|13(428) exit0 + 探针双红）反向背书计划可执行性。
