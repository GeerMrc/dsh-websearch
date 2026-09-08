# Plan — 2026-09-08-014w-s14w-primary-standby-delivery

> S15 前增强轮（用户批准 2026-09-08）：主备搜索链**可验证交付** + OpenClash 环境指引落档
> + B2（成员级链尾）完整落档 v2。分支 feat/s14w-primary-standby-delivery。
> 用户裁决正本：场景 (b) 走 **B1 先行**（链序末位即自定义兜底）、**B2 列 v2 候选**；
> 场景 (a) 现有链序已承载主备语义——本轮交付形态 = 可执行证明（e2e）+ 可见呈现
>（徽标/hint）+ 可续期方案（B2 落档），不以"风险提示"替代交付。

## 前置审核正本（Explore 独立探查，file:line 在案，session 记录引用）

- 链序 = 降级优先级；五成员 GUI ↑↓ 可排（controller.ts:308-324）；未配 key 成员运行时
  跳过不占位（core.ts:134-140）。
- 成员内重试：multiKeyPool → 3 draw 换 key（core.ts:150-155、keys.ts:79-81）；确定性
  4xx 直降（S14u）；共享超时预算。
- 链尾固定二元地板（config.ts:38/60-63、index.ts:165-175、ADR-0004 D3 + ADR-0013 D6
  S14c 注记）；fallbackProvider 非法值 fail-loud（config.ts:195）。
- 直连钉选绕链不降级（ADR-0002 D5）。

## 任务

- **T1（TDD）主备语义 e2e**：loopback 场景 [tavily(3 key), firecrawl(1 key)]——tavily
  三 draw 每次换 key 全败 → firecrawl 接力成功；断言 arrivals 全序、key 轮换轨迹、
  served-by 落 firecrawl。此测试即主备模式的机器可读定义。
- **T2（TDD）GUI 主备角色显式化**（纯呈现层，底层零改动——按构造消除规则冲突）：
  链卡首位就绪成员「主搜索工具」徽标、末位就绪成员「兜底位」徽标 + hint 完整主备
  语义文案（en/zh 新键）；section.spec 断言。
- **T3 B2 完整落档（v2）**：5 扩展落点（schema 取值域 / withFallbackTail / getter auto
  合成 / gates 特例一般化 / GUI 三态）+ 3 待定义规则（被点名成员重复入链去重 / 点名尾
  key 不可用时 fail-loud vs 回落 / 与 auto 合成）+ ADR-0004 D3、ADR-0013 D6 修订面 →
  v2 backlog 登记，未来棒免重审。
- **T4 手册素材落档**：OpenClash 路线 A（运行模式切 Redir-Host 系，推荐）/路线 B
  （fake-ip-filter 白名单，治标）+ 生效判据（dig 不再回 198.18.x.x）+ 主备用法
  （链序排列即主备）→ S15 编入 README 环境前提节。
- **T5**：门墙（exit code + Errors 行口径）→ 独立 Agent 复审（探针牙齿 + B2 落档完整
  性 + T2 纯呈现核验）→ merge --no-ff → 治理翻账 + 接力指令。

## 验收 R1-R5

R1 主备 e2e 在档绿（含 key 轮换轨迹）；R2 徽标+hint 亲见；R3 门墙 exit0 全绿；
R4 复审 PASS 无新 🟡+；R5 B2 台账完整可续。

## 不做（边界）

不加复刻链语义的「高级模式」开关；不动 fallbackProvider 域/链尾拼接/ADR/chain core
运行语义；不动 3423/3432 实例；不替用户改 OpenClash。真实 key 全链路实测待用户配 key
后择机，本轮以 loopback 场景为证。
