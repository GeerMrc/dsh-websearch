# Stage 2 计划审核 — S18（plan 018）

> 参数头：骨架库 v2（six-stage.md 阶段 2 提示词骨架，证伪优先）| 阶段 2 | Session 18 |
> 输入指针：plan 正本 docs/plans/2026-09-10-018-s18-perplexity-agent-api-plan.md；roadmap ⏳ 行
> docs/session-roadmap.md:80（S18）。
> 相对骨架偏离说明：增列技术设计核证维度（读 src/providers/perplexity.ts +
> tests/providers/perplexity.test.ts + tests/e2e/loopback.test.ts + src/websearch-row.tsx 对照
> D1/D2 主张；核 loopback mock 涉及面真实大小、导出面消费者、3423 实搜入口）。
> 执行方式：独立 spawn general-purpose Agent；同 Agent 两轮增量复审（合规：同阶段复审续用）。

## 轮 1 输出原文（逐字）

# 结论：NEEDS REVISION

计划主体扎实（D1/D2 与代码实况吻合、红测试可构造、验证矩阵大体成立），但有 2 条必改 + 4 条建议。

## 必改

**1. T2「loopback 若涉 perplexity 形状则适配」的假设式措辞与实况不符——适配是确定的、双面的**
- 证据：`tests/e2e/loopback.test.ts` 有 5 处 mock 键与断言硬编码 `/perplexity/chat/completions`（:97/:172/:185/:200/:211/:223/:261），成功体也是旧形状 `{choices:[{message:{content}}], citations:[...]}`（:172-173/:200-201）。端点 URL 和响应体两者都必须改写。plan 第 40/69 行的「若涉」「若 mock 不涉 perplexity 则零改动披露」分支实际不可达。
- 更严重的闭环缺口：**端点 URL 在 T1 改，loopback 回归却排在 T2**（验证矩阵第 52 行）。T1 提交后 loopback 必红（所有 `/perplexity/chat/completions` arrival 断言失败），违反「每任务 red→green→commit 闭环」。必改：loopback 的 URL 面适配挪进 T1（或 T1/T2 合并为单一原子提交，同时声明理由）。
- 命中 pitfalls.md:91「进度三源矛盾」相邻家族的「计划与代码实况脱节」；dont-do.md:44 家族（未实测先断言）。

**2. ADR-0015 迁移后文本失真，plan 未安排勘注**
- 证据：`docs/decisions/adr-0015-unified-search-geo-entry.md:30` 写死 Perplexity `web_search_options.user_location.country`；S18 把 user_location 挪进 `tools[0].web_search` 顶层后该行即错（language_preference 顶层不变，:31 行仍对）。ADR-0015:39 已预埋 S18 关联注记，但 plan D3 只新增 ADR-0016、未给 0015 勘注任务（T3 应扩）。违反本仓「one home per fact」纪律。

## 建议

**3. R3 的 git diff 范围未定界基线 ref**——「config.ts/schema/client 零变更亲证」需写死命令与 base（schema 在 `src/config.ts` 内、locales 在 `src/client/locales.ts`，故 `git diff <base>..feat/s18-perplexity-agent-api -- src/config.ts src/client/` 即严谨闭合；建议直接写进 R3 证据形态列）。命中 pitfalls.md:12（验收要确切命令逐条见绿）。

**4. T4「firecrawl 成员实搜」未给出可执行入口**——正本入口是 `tests/e2e.real/firecrawl.real.test.ts`（`$FIRECRAWL_API_KEY` 环境变量 gate，仓内无 .env，须从 scratch 凭据池导出）。建议 T4 done 条件补命令：`FIRECRAWL_API_KEY=... npx vitest run tests/e2e.real/firecrawl.real.test.ts`，避免执行期现找入口。

**5. 模块头 JSDoc/文档改写面未点名**——`src/providers/perplexity.ts:1-44` 模块注释、`PERPLEXITY_DEFAULT_BASE_URL` 注释（「/chat/completions is the operation」:43）、`baseURL` 字段注释（:80「/chat/completions is appended」）均写死旧端点，属 T1 改写面但 plan 未列；`docs/00-architecture.md` 未 grep 到 sonar 引用，无碍。

**6. e2e.real 断言面比 T5 措辞小**——`tests/e2e.real/perplexity.real.test.ts` 的「default anchors」断言的常量（baseURL 'https://api.perplexity.ai'、model 'sonar'）S18 后均不变，live 断言只依赖 provider 返回的归一结果、不涉 wire 形态；T5「perplexity.real 断言更新为 Agent API 形态」可能实际零改动——建议改为「按 diff 判定，零改动则披露」，避免为改而改。

## 核证通过的主张（不需改）

- **D1**：`options.model` 仅来自 `config.model ?? PERPLEXITY_DEFAULT_MODEL`（perplexity.ts:109），前缀归一在 search() 内做不污染 config 面，边界描述（含 `/` 直传）与风险预案 3 一致。
- **D2**：`mapPerplexityResult`/`PerplexitySearchResult`/`PerplexityResponse` 无仓内其他消费者（仅 provider 自身 + 单测；`websearch-row.tsx`、controller、locales 零 perplexity 引用），导出面重写安全。
- **T1 红测试可构造**：现测试断言 `/chat/completions` URL、`max_tokens`/`messages`、无 `tools`（perplexity.test.ts:77/:83-87/:111-112/:120/:134-135），新断言（`/v1/agent`、`input`、`tools` 恒含）在现况必红；S17 嵌套形态断言的改写已被 T1「wire 测试重写」覆盖。
- **UA×6/断言×6**：6 个 provider 各 1 处 `dsh-websearch/0.3.0` 常量 + 6 处测试断言，数目核对无误（grep 证据在案）。
- **roadmap 对齐**：config 零改动/门墙/2026-09-27 时限均有承载；真实 API 腿的凭据缺口已作为 🟡 债务显式挂 2.5 裁定，不算隐瞒（但注意 roadmap 验收原文是「迁移后真实 API 实测」——降级口径若被采纳，roadmap 行验收措辞需同步勘注，此点 plan 亦未提，可并入必改 2 的文档勘注任务）。

## 轮 2（增量复审）输出原文（逐字）

# NEEDS REVISION（残留 2 条必改 + 2 条措辞级）

已核证通过的修订：必改 1 的 T1/T2 扩写（loopback URL 面留旧形状、T1 旧 mapper 读旧形状照常绿的闭环逻辑成立——:97 destroy / :223 status-500 场景不涉响应体，:172/:200 成功体旧 mapper 兼容）；必改 2 的 T3 三件（ADR-0015:30 勘注 + roadmap 措辞勘注条件化挂 2.5）；建议 3（R3 命令 + base `c8799bd` 实核=当前 master HEAD/S17 merge，有效）；建议 4/5/6 均落位。

## 残留

**1. 验证矩阵未随 T1 扩写同步（声明改了但没改）**
- 第 52 行仍是 `| loopback 回归 | T2 绿证 |`。修订说明称改为「T1（URL 腿）/T2（形状腿）」未落实；现 T1 done 条件（第 39 行「loopback 全绿」）与矩阵触发时机自相矛盾——矩阵没有为 T1 安排 loopback 亲跑采信点。

**2. §5 风险预案第 69 行残留已废弃的假设式分支**
- 「loopback 夹具涉旧形状：T2 顺带适配，**若 mock 不涉 perplexity 则零改动披露**」原句未删。实况已确证 mock 必涉（5+ 处），该分支不可达，且与修订后 T2 的确定式表述冲突。应整条改写为确定式（「loopback 夹具换新形状——T2 必改，见任务表」）。

## 措辞级（可顺手修，不单独阻审）

- 第 39 行「5 处 arrival 断言」后列了 7 个行号（:97/:172/:185/:200/:211/:223/:261），且混含 mock 键与 arrival 断言两类——计数与措辞不准，建议改为「mock 键与 arrival 断言共 7 处行号」。
- 第 30 行 D3「唯一新增文档 = ADR-0016」与 T3 现在编辑 ADR-0015/roadmap 并存——「新增」严格说不假（勘注非新增），但建议改为「唯一新增文档 = ADR-0016（另有 ADR-0015:30 与 roadmap 勘注，见 T3）」消除读感矛盾。

修毕第 1、2 条即可 APPROVED，无需再全量复审。

## 处置记录（主 Agent）

- 残留 1（验证矩阵双腿）+ 残留 2（假设式分支删除）+ 两处措辞级已全部修毕 → 按轮 2 预授「修毕即 APPROVED」生效，未再发第三轮。
- 阶段 2.5：AskUserQuestion 两问（计划批准 / Perplexity key 处置）未获答 → 按先例取默认：①批准自主推进 ②降级验收（wire 级 + 自跳披露；用户补 key 后手动跑一轮闭合）。披露落 session-18 记录与收官汇报。
