# Session 路线图 — dsh-websearch

> **用途**：预定义每个 session 的目标与验收标准——session 目标不需要临场想，从本表复制。
> **使用方式**：
> 1. 开新 session 前查本表，找下一个「⏳ 待执行」行（「现在到哪」的权威答案在 `docs/STATUS.md` 当前位置块，两处不一致 → 先修一致性再启动）；
> 2. 启动方式两种（优先 A）——**A.** 粘贴上一 session 记录末尾的**启动指令**；**B.** 输入 `按 .session-start 启动 Session N`；
> 3. 状态列**只在阶段 6 原子收尾时写入** `✅ 日期`（验收证据用指针引用 session 记录/plan，不内嵌数字与行号清单）；与 STATUS.md 台账行 ✅ 同一收尾动作完成，禁止提前预写收官状态。
>
> **规则**：从最小编号往下找第一个 ⏳ 即下一个 session；前置依赖未完成先完成它。行宽上限：目标列 ≤2 行；WBS/验收细节放引用目标。偏离路线图用小数编号插行（10a/10b），下游编号不顺延。Spike 行验收形态为「假设/验收标准/结论」三节。架构术语与模块边界见 `docs/00-architecture.md`。本表已按 S01 独立审核（2026-09-02，F-001..F-019）修订。

## 治理与规划（M1 治理与规划定稿）

| Session | 目标 | WBS 项 | 验收标准 | 预估工期 | 状态 |
|---|---|---|---|---|---|
| **01** | 治理套件安装 + 架构/WBS 定稿过审 | 安装 11 模板并填占位符；AGENTS.md/架构/roadmap/ADR 过独立审核（F-001..F-019 修订）与用户批准 | ① `grep -r '{{' docs/ 仅命中活占位（`{{NN}}` 类）；② 独立审核复审结论 APPROVED 落盘；③ 用户批准记录在 session 记录；④ governance §3.1.1/§3.4 保号 | 1 天 | ✅ 2026-09-02（docs/sessions/2026-09-02-session-01.md） |

**里程碑 M1 治理与规划定稿**：治理产物齐备且占位符清零，计划过独立审核与人工终审 —— ✅ 2026-09-02（Session 01 证据：docs/sessions/2026-09-02-session-01.md + progress-M1 阶段验收 R1-R5 全 PASS）

## 可行性 spike（M2 可行性定谳）

| Session | 目标 | WBS 项 | 验收标准 | 预估工期 | 状态 |
|---|---|---|---|---|---|
| **02** | Spike：外置 client half + 安装链路 + 交付形态定谳 | scratch profile 实装：① `dsh plugin add` 本地路径安装；② client half 注入 settings.section + locale/remote 可用；③ installSection describe/mutate 通路；④ client 经 remote 的 credentials 写通路（set→describe 可见）；⑤ 包名/版本起点/交付形态（路径/tarball/npm）定谳 | 假设/验收标准/结论三节齐（含 ③④ 实测证据：安装日志、浏览器 DOM 断言、credentials.describe 返回）；ADR-0006（GUI GO/NO-GO）+ ADR-0007（包形态）落盘；NO-GO 时 fallback 方案与受影响 roadmap 行同步修订 | 1 天 | ✅ 2026-09-02（docs/sessions/2026-09-02-session-02.md） |

**里程碑 M2 可行性定谳**：GUI 形态、安装链路、交付形态有实测结论，ADR-0006/0007 定稿 —— ✅ 2026-09-02（Session 02 证据：docs/sessions/2026-09-02-session-02.md + progress-M2 阶段验收 R1-R5 全 PASS）

## 宿主包（M3 宿主包完备）

| Session | 目标 | WBS 项 | 验收标准 | 预估工期 | 状态 |
|---|---|---|---|---|---|
| **03** | 插件宿主骨架 + 链式 meta-provider | 包骨架（package.json name/version/files/exports 按 ADR-0007）/pnpm/tsdown；Config schema（含 `perMemberTimeoutMs`）；错误码清单 `src/errors.ts`；search/fetch 链编排 TDD（架构 §4 全语义，凭据解析用 fake） | 链语义必测 8 项（顺序/未配置跳过/不可用跳过/运行失败降级/全败 `DSHWS_CHAIN_EXHAUSTED`+摘要/servedBy content 首行署名/超时降级/钉死直连不降级）逐项红→绿留痕（凭据热刷新移 S04）；`pnpm test`、`pnpm build`、`pnpm typecheck`、`pnpm lint` 全绿（附命令原文与数字） | 1-2 天 | ✅ 2026-09-02（docs/sessions/2026-09-02-session-03.md） |
| **04** | deepseek/tavily provider + 凭据接线 | 两 provider 实现；credentials 每 provider 解析 + available() 缓存 + `credentials/reference-updated` 刷新 | 两 provider 单测（mock HTTP：成功/429/断网/超时）红→绿；凭据热刷新用例（写 ref→事件→available 翻转）红→绿；真实 API e2e 无 key 自跳实测 | 1 天 | ✅ 2026-09-02（docs/sessions/2026-09-02-session-04.md） |
| **05a** | exa/perplexity/firecrawl + settings 节 | 三 provider 实现（同 S04 测试口径）；installSection（链序/超时/启停热改） | 五 provider 注册冒烟全绿；settings 热改链序实测下次搜索生效；lint/typecheck 全绿 | 1 天 | ✅ 2026-09-02（docs/sessions/2026-09-02-session-05a.md） |
| **05b** | 安装端到端 + 卸载复原 | bundle patch；scratch profile `dsh plugin add` + 两行 patch；端到端验证 | `web_search` 经 dshws-chain 出真实结果（配任一可用 key，content 首行 `[served-by: …]` 实测）；卸载插件+删 patch 后上游行为复原（对照验证） | 1 天 | ✅ 2026-09-02（docs/sessions/2026-09-02-session-05b.md；机械面 ✅ 安装/接线/复原/boot/隔离审计全过——with-key 结果面 = 用户槽位待回填，指引 docs/notes/2026-09-02-s05b-install-runbook.md §4） |

**里程碑 M3 宿主包完备**：五 provider + 链 + 凭据/设置全绿，安装端到端可复现 —— 🚧 机械面 ✅ 2026-09-02（Session 05b 证据：安装/接线/复原/boot/隔离审计全过）；余用户 with-key 实测证据回填（指引：docs/notes/2026-09-02-s05b-install-runbook.md §4，S10/M6 同构）——回填后本行填 ✅

## 设置页 GUI（M4 设置页完备）

| Session | 目标 | WBS 项 | 验收标准 | 预估工期 | 状态 |
|---|---|---|---|---|---|
| **06** | 「网页搜索」设置页骨架 | settings.section 注入（形态按 ADR-0006）；provider 卡（key 输入→credentials、状态点、启停）；fetchChain 只读展示；复用 ui-primitives/alias 令牌 | jsdom 组件测试绿；浏览器实测 DOM 断言（页面出现/卡片渲染/key 写入后 credentials.describe 可见——写通路按 S02 结论） | 1-2 天 | ✅ 2026-09-02（docs/sessions/2026-09-02-session-06.md；双链只读 = fetchChain 项的对称扩展，plan T5 锚定说明） |
| **07** | 优先级排序 + 覆盖标记 + i18n | search 链上移/下移排序写 settings；组合钉死覆盖标记；双语 typed dictionaries | 排序变更→`settings.yaml` 实测落盘→下次搜索生效；en/zh 字典 parity 校验绿；字典外文案检查脚本零命中（CJK 字面量 grep，脚本随本 session 交付） | 1-2 天 | ✅ 2026-09-02（docs/sessions/2026-09-02-session-07.md；覆盖标记 = settings 层语义定谳 plan 007 D1；「下次搜索生效」= D6 分层证据，端到端 order 断言归 S08） |

**里程碑 M4 设置页完备**：GUI 全流程（配 key→启停→排序→热生效）浏览器实测通过 —— ✅ 2026-09-02（S06 配 key/启停 + S07 排序 = 浏览器六断言证据；热生效 = S05a 实测 + S07 热链序回归——复合证据按 plan 007 D6 尺，S07 阶段 4/5 裁定成立）

## 功能扩展（M7 功能扩展）

> 2026-09-03 用户需求扩展批次（ADR-0008/0009/0010 定谳；原 S09/S10 顺延为 S12/S13）。

| Session | 目标 | WBS 项 | 验收标准 | 预估工期 | 状态 |
|---|---|---|---|---|---|
| **09** | 多 APIKEY 池 + 选择策略 | config 每成员 `extraApiKeyEnvs` + `keySelection`（order/round-robin/random，ADR-0008）；`src/keys.ts` KeyPool（thunk 落点，provider 零改动）；gate/prime 全池扩展；GUI 附加 keys 列表（自绘仿链排序）+ typed locales；loopback stub 记 Authorization header 轮换断言 | 不配置 = 现状零变化；round-robin 三 key 三连发逐把轮换（e2e 实测）+ random 冒烟 + order 首个就绪；全空池才 CREDENTIAL_MISSING；策略/池 settings 热生效实测；门墙全绿 | 1-2 天 | ✅ 2026-09-03（docs/sessions/2026-09-03-session-09.md；wire 级轮换实证 + 牙齿证明 + 浏览器多 key GUI 三断言；provider 零改动兑现） |
| **10** | anysearch 第六成员 | `src/providers/anysearch.ts` HTTP 自实现（ADR-0009：POST /v1/search + 信封 code≠0 → httpError + content→snippet 补映射）；`MEMBER_ERROR_CODES.anysearch` 五码族；config anysearch 节（enabled/apiKeyEnv/baseURL/zone）；BUILT_IN_MEMBER_ORDER 尾部追加；node 接线 + client 第 6 卡 + locales；单测（envelope/429/断网/超时）+ loopback 扩展 + 真实 API smoke 自跳 | 成员全链路绿（链可含 dshws-anysearch 降级/署名/排序）；GUI 六卡渲染 + key 写通路；与 3080 anysearch 插件共存语义在档；真实 smoke 无 key 自跳；门墙全绿 | 1-2 天 | ✅ 2026-09-03（docs/sessions/2026-09-03-session-10.md；信封 wire 复证 + 六卡浏览器断言 + 共存语义 ADR-0009 在档；池化自动享用兑现） |
| **11** | session 搜索溯源增强 | 插件 client half 接管 `tool.call.toolview` web_search key（priority shadow，ADR-0010）；解析 served-by 首行 → 折叠行服务徽标；回退语义（无署名/形状不符 → 宿主同构/generic）；成员名映射 + typed locales；jsdom 契约 + 浏览器实测（session 视图徽标可见 + 回退态） | 徽标在 session 工具调用行可见（浏览器实测）；直连/外来结果回退态正确；宿主源码零 diff 断言；门墙全绿（含 check:i18n 新键） | 1-2 天 | ⏳ |

**里程碑 M7 功能扩展**：每成员多 APIKEY（多 ref 池 + order/round-robin/random）+ anysearch 第六成员 + session 工具调用溯源徽标（零内核侵入）—— 完成时填 ✅ 日期（Session 11 证据）；v2 backlog：各成员余额/积分定期统计与数据看板（ADR-0008 缓议章节，未排期）

## 验证与文档（M5 交付就绪）

| Session | 目标 | WBS 项 | 验收标准 | 预估工期 | 状态 |
|---|---|---|---|---|---|
| **08** | e2e 场景收口 | loopback stub：断网降级/429 降级/超时降级/全败报错/顺序保持/servedBy 透出/钉死直连不降级；真实 API e2e 自跳 | 各场景 e2e 绿（时序断言：失败成员→下一成员的调用序；`DSHWS_CHAIN_EXHAUSTED` 与逐成员摘要断言；content 首行署名断言） | 1 天 | ✅ 2026-09-02（docs/sessions/2026-09-02-session-08.md；loopback 七场景 + 链级真实 smoke 自跳；src 零变更兑现） |
| **12** | README + 迁移 + 升级手册（原 S09，2026-09-03 顺延——特性三棒前置，手册一次写全含 anysearch 迁移新现实） | README（zh/en：安装/配置/GUI/链语义/**多 key 池**）；anysearch 迁移（**先删其 patch 两行标量覆盖，再写本插件两行，附顺序与验证命令**；含官方 anysearch 插件共存/退役语义 ADR-0009）；docs/upgrade.md 升级演练手册（含溯源替身卡片维护点 ADR-0010） | 由独立审核 Agent 照手册从零在 scratch profile 走通安装→搜索并留痕；演练手册步骤可独立执行 | 1 天 | ⏳ |

**里程碑 M5 交付就绪**：e2e 收口全绿，文档自洽可复现 —— 🚧 e2e 收口腿 ✅ 2026-09-02（Session 08 证据：loopback 七场景 + 真实 API 自跳）；文档腿 S12——两腿齐后填 ✅（Session 12 证据；2026-09-03 顺延勘注）

## 上游验收（M6 上游验收通过）

| Session | 目标 | WBS 项 | 验收标准 | 预估工期 | 状态 |
|---|---|---|---|---|---|
| **13** | 上游重建验收准备（原 S10，2026-09-03 顺延） | 全新上游 build 环境步骤；验收清单（无 DEEPSEEK key 可搜索/GUI 全流程/降级演示/卸载复原）；anysearch 退役步骤 | 清单文档 + 环境备好；实测环节由用户择机执行，STATUS.md 保持 M6 未决直至用户证据回填 | 0.5 天 | ⏳ |

**里程碑 M6 上游验收通过**：用户在上游全新构建上完成验收清单 —— 完成时填 ✅ 日期（用户实测证据）

---

阶段划分与里程碑受控词表：M1 治理与规划定稿 / M2 可行性定谳 / M3 宿主包完备 / M4 设置页完备 / M5 交付就绪 / M6 上游验收通过 / **M7 功能扩展**（2026-09-03 ADR-0008/0009/0010 增设）。新阶段在文件尾部追加，不动历史行。
