# Session 路线图 — dsh-websearch

> **用途**：预定义每个 session 的目标与验收标准——session 目标不需要临场想，从本表复制。
> **使用方式**：
> 1. 开新 session 前查本表，找下一个「⏳ 待执行」行（「现在到哪」的权威答案在 `docs/STATUS.md` 当前位置块，两处不一致 → 先修一致性再启动）；
> 2. 启动方式两种（优先 A）——**A.** 粘贴上一 session 记录末尾的**启动指令**；**B.** 输入 `按 .session-start 启动 Session N`；
> 3. 状态列**只在阶段 6 原子收尾时写入** `✅ 日期`（验收证据用指针引用 session 记录/plan，不内嵌数字与行号清单）；与 STATUS.md 台账行 ✅ 同一收尾动作完成，禁止提前预写收官状态。
>
> **规则**：从最小编号往下找第一个 ⏳ 即下一个 session；前置依赖未完成先完成它。行宽上限：目标列 ≤2 行；WBS/验收细节放引用目标。偏离路线图默认小数编号插行（10a/10b）、下游编号不顺延；**整段重排须用户权威确认并经 2.5 终审批准**——2026-09-04 用户重排（S12=UI/UX 对齐、S13 策略、S14 fetch 调研+溯源、S15 手册、S16 验收准备）为批准首例，本规则对该次重排让位（S12 T0 记录）。Spike 行验收形态为「假设/验收标准/结论」三节。架构术语与模块边界见 `docs/00-architecture.md`。本表已按 S01 独立审核（2026-09-02，F-001..F-019）修订。

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

> 2026-09-03 用户需求扩展批次（ADR-0008/0009/0010 定谳）；2026-09-04 用户 UI/UX 反馈四项插入，
> 待执行尾按用户重排整段重编号（S12-S16，头部规则行让位记录在案）。

| Session | 目标 | WBS 项 | 验收标准 | 预估工期 | 状态 |
|---|---|---|---|---|---|
| **09** | 多 APIKEY 池 + 选择策略 | config 每成员 `extraApiKeyEnvs` + `keySelection`（order/round-robin/random，ADR-0008）；`src/keys.ts` KeyPool（thunk 落点，provider 零改动）；gate/prime 全池扩展；GUI 附加 keys 列表（自绘仿链排序）+ typed locales；loopback stub 记 Authorization header 轮换断言 | 不配置 = 现状零变化；round-robin 三 key 三连发逐把轮换（e2e 实测）+ random 冒烟 + order 首个就绪；全空池才 CREDENTIAL_MISSING；策略/池 settings 热生效实测；门墙全绿 | 1-2 天 | ✅ 2026-09-03（docs/sessions/2026-09-03-session-09.md；wire 级轮换实证 + 牙齿证明 + 浏览器多 key GUI 三断言；provider 零改动兑现） |
| **10** | anysearch 第六成员 | `src/providers/anysearch.ts` HTTP 自实现（ADR-0009：POST /v1/search + 信封 code≠0 → httpError + content→snippet 补映射）；`MEMBER_ERROR_CODES.anysearch` 五码族；config anysearch 节（enabled/apiKeyEnv/baseURL/zone）；BUILT_IN_MEMBER_ORDER 尾部追加；node 接线 + client 第 6 卡 + locales；单测（envelope/429/断网/超时）+ loopback 扩展 + 真实 API smoke 自跳 | 成员全链路绿（链可含 dshws-anysearch 降级/署名/排序）；GUI 六卡渲染 + key 写通路；与 3080 anysearch 插件共存语义在档；真实 smoke 无 key 自跳；门墙全绿 | 1-2 天 | ✅ 2026-09-03（docs/sessions/2026-09-03-session-10.md；信封 wire 复证 + 六卡浏览器断言 + 共存语义 ADR-0009 在档；池化自动享用兑现） |
| **11** | 验收反馈调整：开关置灰 + 单槽逗号值 + 过滤未配置（2026-09-03 执行；2026-09-04 补登） | extras 四件制品退场 + keys.ts 单槽化（ADR-0008 superseded → ADR-0011，上限 10 fail-loud）+ 开关置灰 + 优先级列表过滤 + 可见序列交换 + keyFieldNote | 技术面全绿（S12 阶段 0 独立复核亲证：子集 188 passed + 静态四件全过）；收官证据链缺口（session 记录/roadmap/CHANGELOG/接力指令 + 阶段 4/5 遗留腿）由 S12 修复批闭合 | 1 天 | ✅ 2026-09-03（docs/sessions/2026-09-03-session-11.md〔reconstructed 补落〕；遗留腿转 S12 T3/T5/T7 认领） |
| **12** | 设置页 UI/UX 对齐（用户 2026-09-04 反馈四项） | ①多 key 提示改 info 图标 hover + 格式示例 ②开关颜色跟随配置态（未配灰/已配开绿）③链列表收敛：品牌名渲染 + 可见列表禁用边界 ④默认序 ⓘ hover 动态说明；+ S11 治理修复批（T0：S11 记录补落/roadmap 重排/CHANGELOG/参数头/dont-do 两条） | WBS/验收正本：docs/plans/2026-09-04-012-s12-uiux-alignment-plan.md（R1-R7：四项 jsdom+浏览器断言 + S11 遗留腿清偿 + 治理修复批核验 + 门墙） | 1 天 | ✅ 2026-09-04（docs/sessions/2026-09-04-session-12.md；阶段 4/5 PASS/COMPLETE + S11 案卷闭合判定成立） |
| **12a** | 设置页布局系统性重构（用户 2026-09-04 二轮反馈四点：ⓘ 位置/文案格式/输入行比例/链区块占屏） | 对齐宿主 Models/Plugins 布局惯例（深度摸底实锚）：成员卡纵向结构（头行/输入独占行/hint 行/footer 按钮行）+ hint 格式化文案 + 链区块未配置隐藏/已配置紧凑卡 + fetchChain 只读区块移除 + 页头 intro + 常数表全量对齐 | WBS/验收正本：docs/plans/2026-09-04-012a-s12a-settings-redesign-plan.md（R1-R7：结构断言+computed style 实测+门墙） | 0.5-1 天 | ✅ 2026-09-04（docs/sessions/2026-09-04-session-12a.md；阶段 4/5 PASS/COMPLETE） |
| **12b** | 设置页信息收敛 + DeepSeek 双配置澄清（用户三轮反馈） | 六卡重复 key hint 撤除 → 页头单图标悬停提示；DeepSeek 卡加「共用模型 Key」澄清 badge；两级调用逻辑文档化 | 页头图标 hover 断言 + 六卡 hint 零残留 + badge 单卡性 + 门墙（WBS/验收正本：docs/plans/2026-09-04-012b-s12b-page-info-deepseek-plan.md R1-R5） | 0.5 天 | ✅ 2026-09-04（docs/sessions/2026-09-04-session-12b.md；阶段 4/5 PASS/COMPLETE） |
| **13** | 优先级策略棒：成员级 random/序列 + ADR-0012 | keySelection 成员级 random/序列变体定谳（ADR-0012；S11 时用户方向确认「变体 B 不放回随机」仍可讨论）+ **keySelection GUI 控件 + 成员/链两级调用顺序说明（12b 分析移交：跨工具=顺序降级；同工具多 key=order 恒首把/round-robin 轮换/random 采样；默认 order）** | WBS/验收正本：docs/plans/2026-09-04-013-s13-priority-strategy-plan.md（R1-R6：ADR-0012 与实现一致〔变体 B 升序 Fisher-Yates〕/变体红绿与既有零漂移/GUI 控件通路+deep-merge 兄弟字段存活/说明 UI+27 keys parity/门墙七命令/浏览器棒+隔离） | 1-2 天 | ✅ 2026-09-04（docs/sessions/2026-09-04-session-13.md；阶段 4/5 PASS/COMPLETE + 🟡×1 清偿复验 CONFIRMED；ADR-0012 定谳 = 变体 B，2.5 默认批准披露） |
| **14** | fetch 兜底开关调研 + session 搜索溯源增强 | fetch：兜底开关调研（v2 backlog 首棒：余额/积分看板 + fetch 兜底开关，结论落 ADR/注记）；溯源（原 11 行 WBS 平移，ADR-0010 不变）：client half 接管 `tool.call.toolview` web_search key（priority shadow）+ served-by 徽标 + 回退语义 + 成员名映射（复用 controller MEMBERS label）。WBS/验收正本：docs/plans/2026-09-06-014-s14-toolview-attribution-plan.md（R1-R7：调研注记在档锚可复核 / 回退态 TDD 六态 / 接管接线 priority=-1 有牙 / 宿主零 diff / 门墙 34 keys / 浏览器徽标亲见+隔离 / 钉牌断言顺手清偿） | 徽标在 session 工具调用行可见（浏览器实测）；直连/外来结果回退态正确；宿主源码零 diff 断言；门墙全绿（含 check:i18n 新键）；fetch 调研结论在档 | 1-2 天 | ✅ 2026-09-06（docs/sessions/2026-09-06-session-14.md；阶段 4/5 PASS/COMPLETE + 三轮浏览器亲见〔链路徽标 · DeepSeek / 直连无徽标 / 外来无徽标〕+ 探针有牙实证；fetch/余额调研注记 docs/notes/2026-09-06-s14-fetch-fallback-research.md；**M7 收官棒**） |

**里程碑 M7 功能扩展**：每成员多 APIKEY（单槽逗号值〔ADR-0011〕+ order/round-robin/random）+ anysearch 第六成员 + 设置页 UI/UX 对齐 + session 工具调用溯源徽标（零内核侵入）+ 装即接管（ADR-0013 插行）—— ✅ 2026-09-06（Session 14 + 14a 证据：徽标浏览器亲见 + 宿主零 diff + 装卸三态 dump + stage45×2 PASS/COMPLETE）；v2 backlog：余额/积分看板 + fetch 兜底开关（调研结论已落档 docs/notes/2026-09-06-s14-fetch-fallback-research.md，仍不排期）

## 验证与文档（M5 交付就绪）

| Session | 目标 | WBS 项 | 验收标准 | 预估工期 | 状态 |
|---|---|---|---|---|---|
| **08** | e2e 场景收口 | loopback stub：断网降级/429 降级/超时降级/全败报错/顺序保持/servedBy 透出/钉死直连不降级；真实 API e2e 自跳 | 各场景 e2e 绿（时序断言：失败成员→下一成员的调用序；`DSHWS_CHAIN_EXHAUSTED` 与逐成员摘要断言；content 首行署名断言） | 1 天 | ✅ 2026-09-02（docs/sessions/2026-09-02-session-08.md；loopback 七场景 + 链级真实 smoke 自跳；src 零变更兑现） |
| **14a** | 装即接管 web_search（插行棒，ADR-0013；2026-09-06 用户方向裁定方案 B） | 插件随包 cordis.patch.yml 钉扎 searchProvider: dshws-chain（fetch 显式重述 http 保底——单成员 firecrawl 无 key 即坏，不自动接管）；装即接管 / 卸载单命令复原 / 用户层终裁保留；ADR-0001/0004/0009 注记互指（0004 D3 中立性实质不变）。WBS/验收正本：docs/plans/2026-09-06-014a-s14a-install-takeover-plan.md（R1-R6：ADR 互指闭合 / patch 内容 TDD / 装卸载 e2e 三态〔翻转+diff 零输出+用户层赢〕/ fetch 不动 / 门墙全绿 / 浏览器零接线徽标亲见） | dump 三态实测 + 浏览器零手动接线徽标亲见 + 宿主仓零 diff | 0.5-1 天 | ✅ 2026-09-06（docs/sessions/2026-09-06-session-14a.md；阶段 4/5 PASS/COMPLETE 含独立重演 e2e + 探针红签名；浏览器零接线徽标亲见 + 装卸三态 dump + R4 宿主 clean） |
| **14b** | DeepSeek 兜底行重构 + 双审计修复（插行棒，用户产品裁定 2026-09-06） | DeepSeek 配置卡 → 兜底说明行（ⓘ Tooltip 四点语义 + 内嵌付费兜底开关 + 动态状态 + badge；删 key 输入/keySelection/Clear/Save——共享 ref 逗号池毒化聊天鉴权）；链错误文案纠偏 + 链块 disabled 视觉/零可用预警 + architecture §6 注记 + 台账勘注。WBS/验收正本：docs/plans/2026-09-06-014b-s14b-deepseek-fallback-row.md（R1-R6） | 兜底行全要素浏览器亲见；门墙全绿；审计 🔴/🟡 全收口 | 0.5-1 天 | ✅ 2026-09-06（docs/sessions/2026-09-06-session-14b.md；阶段 4/5 PASS/COMPLETE + 探针红签名 + 滚动截图视觉亲读；门墙 277\|9(286)/40 keys/47.47） |
| **14c** | 全局置顶 + 工具折叠区 + DeepSeek 恒链尾 + maxUses + 官方入口随包退役（插行棒，用户四轮反馈五决策点确认） | 顶部全局区恒显〔搜索链五家排序+单成员超时+单次请求最多搜索次数 maxUses 宿主同款〕；五卡折叠默认收起（多 key 零损失）；DeepSeek 兜底行最末纯头部；语义层恒链尾（node 排序域收窄+老钉死序过滤）；**官方 web-search-deepseek 随包 disabled 退役**（ADR-0013 Decision 7）。WBS/验收正本：docs/plans/2026-09-06-014c-s14c-global-top-tools-collapse.md（R1-R7） | 布局全要素+链尾语义+maxUses wire+官方卡消失与卸载复原 e2e/浏览器亲见；门墙全绿 | 1 天 | ✅ 2026-09-06（docs/sessions/2026-09-06-session-14c.md；阶段 4/5 PASS/COMPLETE + 探针 + 🟡×2 清偿；284\|9(293)/43 keys/52.07） |
| **14d** | 兜底二选一（默认无兜底 fail-loud）+ maxUses 修正 + ⓘ/脱敏（插行棒，用户三项反馈+裁定） | 见 plan 014d；R1-R5 | 全要素浏览器亲见；门墙全绿 | 0.5 天 | ✅ 2026-09-07（docs/sessions/2026-09-07-session-14d.md） |
| **14e** | 免费 fetch 搜索兜底（DDG 抓取）+ fallbackProvider 二选一自动默认 + 链 hint ! 徽标化 | 见 plan 014e | 浏览器亲见；门墙全绿 | 0.5 天 | ✅ 2026-09-07（docs/sessions/2026-09-07-session-14e.md） |
| **14u** | 质量收口棒（双深审触发，用户全面审核指令）：重试机制定稿 | 见 plan 014u（T0-T9 + R1-R6）；三 🔴：auto 兜底断裂〔enabled gate〕/order 盲重试〔策略 gate〕/loopback 外网；重试定稿：成员内 3 draw 换 key〔仅多 key 池且非 order〕+ 成员级共享 deadline ≤1× + 确定性 4xx 降级 + 耗尽摘要每成员一行；残渣清理（fetchsearch 自有族/假警告三态/孤儿键 6/死分支） | 三态浏览器亲见；门墙 exit0 全绿；独立复审 PASS（探针×3） | 0.5-1 天 | ✅ 2026-09-07（docs/sessions/2026-09-07-session-14u.md；315\|9(324)/48 keys；初审 BLOCKED→清偿复验 CONFIRMED） |
| **14v** | 实测报错取证插棒（用户 5090 会话触发，S15 前）：fetch 地板报错诚实化 | 见 plan 014v；取证：web_fetch 11 错全为宿主 SSRF×fake-ip〔非插件〕+ web_search 耗尽 6 次〔DDG 202 反爬壳诊断混淆〕；修：202 单列报错 + UA 头 | 复审 PASS（探针红）；门墙 exit0 | 0.5 天 | ✅ 2026-09-08（docs/sessions/2026-09-08-session-14v.md；317\|9(326)） |
| **14w** | 主备链可验证交付（用户两问 + 交付形态批评，S15 前） | 见 plan 014w：主备语义 wire 级 e2e 正本（暖场/3-key 轮换/备位接力）+ 链卡主备徽标/hint（纯呈现）+ B2 v2 免重审落档 + OpenClash/主备手册素材 | 复审 PASS（两针探针真红）；门墙 exit0 | 0.5 天 | ✅ 2026-09-08（docs/sessions/2026-09-08-session-14w.md；320\|9(329)/50 keys） |
| **14x** | 兜底重构 0.2.0（用户三轮裁决 + 三轮计划审核，S15 前）：删免费 fetch 地板 + 兜底工具显式指定 + DeepSeek 条件参与 | 见 plan 014x + ADR-0014：fallbackMember 单字段（'auto' 默认/工具指定 strip+pin/deepseek 守卫 readyCount≤1 排除自身）；legacy 别名归一；选择器动态选项+锁定尾行+二态提示；0.2.0 breaking | 三轮计划审核 + 阶段 4/5 BLOCKED→清偿复验 PASS（探针×5）；门墙 exit0；3423 换包实测 + 用户亲验 R1/R2 | 1 天 | ✅ 2026-09-09（docs/sessions/2026-09-09-session-14x.md；330\|9(339)/52 keys） |
| **17** | 搜索工具全面对齐官方 API——P1 高价值参数批（S16 审计触发） | Tavily 4 参数（include_answer→content 免费生成答案 / topic=news·finance / time_range / search_depth）+ Exa 3 参数（type 可配化 / contents.text 消除丢结果 / startPublishedDate）+ Perplexity 3 参数（max_tokens 可配化修复 1024 腰斩 / search_recency_filter / search_context_size）+ Firecrawl 3 参数（tbs 时效 / country / location 修 US 偏差）+ 通用 1（语言/区域统一入口）；每个参数 = config schema + resolveConfig + provider body + GUI 控件 + locales(en/zh) + 单测 | 每参数单测红绿留痕；GUI 可配+热生效+i18n 双语；全量门墙 exit0；3423 实测（如 Tavily news topic 返回新闻结果） | 4-7 天 | ✅ 2026-09-10（docs/sessions/2026-09-10-session-17.md；0.3.0；399\|13(412) exit0/96 keys；**枚举按 2026-09 现行文档改判**：search_depth 4 值/type 6 值/contextSize 嵌套——正本 Note s17；Firecrawl country 归全局入口〔ADR-0015〕；Tavily 真实例无 key 归用户择机） |
| **18** | Perplexity Agent API 迁移（Sonar 日落应对；S17 阶段 1 调研发现插行，2.5 默认批准） | `/chat/completions` → `POST /v1/agent` responses 形态；参数同名迁移（search_recency_filter→web_search filters / search_context_size→web_search 工具 / max_tokens→max_output_tokens / user_location 同名；search_language_filter 无对应物——官方 drop 清单）；官方公告 Sonar 支持至 **2026-09-27**（docs.perplexity.ai 弃用横幅 + migrate-from-sonar 指南，出处见 plan 017 附录 A）；S17 已按可迁移形态设计 config 面 | 迁移后真实 API 实测（scratch 凭据池）；config 面零改动验证；全量门墙 exit0；2026-09-27 前落地 | 1-2 天 | ⏳ |
| **15** | README + 迁移 + 升级手册（原 S12 行；2026-09-04 重排编号） | README（zh/en：安装/配置/GUI/链语义/**多 key 单槽逗号值**/**装即接管与卸载复原 ADR-0013**）；anysearch 迁移（**ADR-0013 口径：卸 anysearch〔其 bundle 钉扎退出〕→装本插件〔钉扎即生效〕；用户层两行仅用于否决/自定义/fetch 可选，整段替换须重述两键**；共存/退役语义 ADR-0009+0013）；docs/upgrade.md 升级演练手册（含溯源替身卡片维护点 ADR-0010 + 漂移防线检查项 ADR-0013） | 由独立审核 Agent 照手册从零在 scratch profile 走通安装→搜索并留痕；演练手册步骤可独立执行 | 1 天 | ⏳ |

**里程碑 M5 交付就绪**：e2e 收口全绿，文档自洽可复现 —— 🚧 e2e 收口腿 ✅ 2026-09-02（Session 08 证据：loopback 七场景 + 真实 API 自跳）；文档腿 S15——两腿齐后填 ✅（Session 15 证据；2026-09-04 重排勘注）

## 上游验收（M6 上游验收通过）

| Session | 目标 | WBS 项 | 验收标准 | 预估工期 | 状态 |
|---|---|---|---|---|---|
| **16** | 上游重建验收准备（原 S13 行；2026-09-04 重排编号） | 全新上游 build 环境步骤；验收清单（无 DEEPSEEK key 可搜索/GUI 全流程/降级演示/卸载复原）；anysearch 退役步骤 | 清单文档 + 环境备好；实测环节由用户择机执行，STATUS.md 保持 M6 未决直至用户证据回填 | 0.5 天 | ⏳ |

**里程碑 M6 上游验收通过**：用户在上游全新构建上完成验收清单 —— 完成时填 ✅ 日期（用户实测证据）

---

阶段划分与里程碑受控词表：M1 治理与规划定稿 / M2 可行性定谳 / M3 宿主包完备 / M4 设置页完备 / M5 交付就绪 / M6 上游验收通过 / **M7 功能扩展**（2026-09-03 ADR-0008/0009/0010 增设）。新阶段在文件尾部追加，不动历史行。
