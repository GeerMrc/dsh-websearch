# CHANGELOG

> 格式：**CalVer 纯日期**（`## YYYY-MM-DD — <批次名>（Session NN，<里程碑/批次进度>[+ 债务清偿
> 标注]）`，反向时间序，最新在上）。条目间 `---` 分隔，一条对应一个 session。
> 位置说明：本项目为可发布 npm 插件包，按治理根形态探测规则 CHANGELOG 落仓库根（非 docs/）。
> 分段（加粗标签）：**新增**（交付内容，含 commit/file:line/测试计数）/ **清偿（N 笔）**（逐笔
> 债务编号清偿记录，与 progress 台账划线对应）/ **治理**（阶段 0-5 独立 Agent 留痕：PASS /
> NEEDS REVISION / COMPLETE 逐阶段）/ **诚实标注（遗留项）**（已知限制显式声明——调查类工作
> 也要记录"调查了什么 + 结论"，不装作没发生）/ **跟踪（观察期）**（测试基线链 + 静态检查 +
> 里程碑计数 + dont-do 新增条目数 + 下一 session 接力指令摘要）。
> **诚实标注原则**：CHANGELOG 是外部视图，宁可暴露遗留也不粉饰；🟢 延后项在此显式声明。

---

## 2026-09-08 — 实测报错取证：DDG 地板报错诚实化（Session 14v，S15 前插棒）

**新增**
- **fetch-search 202 反爬识别**：DuckDuckGo 对疑似机器人出口 IP 恒回 HTTP 202 + 首页壳（实测 html/lite 双端点、带 UA 同 202）——此前 202 ∈ response.ok 落进解析零结果，报 "parsed no results" 读起来像解析 bug；现单列 `anti-bot challenge shell (HTTP 202); the free fetch fallback is unavailable in this network`（`5255d16`）
- **浏览器 UA 头**：DDG form POST 补桌面 Chrome UA 常量（裸请求头 = 不必要的 bot 指纹）

**诚实标注（遗留项）**
- 用户 5090 会话 web_fetch 11 错全部为**宿主 SSRF 防护 × 本机 fake-ip DNS**（198.18.x.x）：插件不在 web_fetch 路径（fetchProvider=官方 http）；环境解法（真实 IP DNS 分流）或配 FIRECRAWL_API_KEY 切本插件 fetch 链（服务端抓取）→ 归 S15 手册环境前提节（plan 014v 定性正本）
- anysearch 超时/fetch-failed 波动 = 上游与代理链路（成功 21 次证明通路健康；重试语义 S14u 定稿不动）；octet-stream 拒收 = 宿主行为

**治理**
- 取证（盘上 session.jsonl.zstd 逐条 verbatim）→ 定性（DNS 对照实测 + 宿主 network.ts 源码）→ TDD 红绿 → 独立复审 **PASS（🔴×0 🟡×0，探针红签名）**；原文 audit-logs 在档
- 执行红线 1 次当场纠正：typecheck exit 2 链式命令吞失败照常提交 → 立即补修 + 复检（e24d90c）

**跟踪**
- 测试基线 315→**317 passed | 9 skipped (326)**；下一棒：S15 手册棒（新增环境前提披露素材：fake-ip/DDG 地板边界/octet-stream）

---

## 2026-09-07 — 搜索链重试机制质量收口（Session 14u，双深审触发 🔴×3 清偿）

**新增**
- **重试机制定稿**（docs/notes/2026-09-07-s14u-quality-hardening.md 语义表）：成员内 key 级重试 3 draw〔仅多 key 池且策略非 order〕；**成员级共享超时预算**（一个 deadline 跨全部 draw，≤1× perMemberTimeoutMs，预算耗尽不再起 0ms 假 draw）；**确定性 4xx 分流**（`DshwsError.httpStatus` + {400,401,403,404,422} 直接降级，429/5xx/网络错保留 redraw）；耗尽摘要**每成员一行**（多 draw 内联 `failed (3 draws: …)`，成员计数归真）
- **零可用成员三态呈现**：fetch 地板/已配 key 的 DeepSeek 地板→中性地板说明（2 新键）；仅显式 DeepSeek 兜底且无 key→诚实红色失败警告（旧版一律假红警告）
- fetchsearch 自有错误族 `DSHWS_FETCHSEARCH_*`（不再借用 firecrawl 族）；exa HTTP 错误消息保留状态前缀

**清偿（🔴×3 + 🟡×5 + 复审 🔴×1+🟡×3）**
- 🔴 auto 兜底断裂：deepseek 成员 enabled gate 恒真，链尾资格唯一入口 = `fallbackProvider` 命名（`8709248`）
- 🔴 order 盲重试：`hasMultiKeyPool` 纳入策略（`650f639`）
- 🔴 loopback e2e 真外网：全败场景钉 deepseek 链尾回 loopback（`eafd095`）
- 🟡 耗尽聚合+共享预算（`1df8125`）/ 4xx 分流+文案（`514cc82`）/ 残渣清理：孤儿键 6 删（52→48 keys）+ memberDisabled 死分支 + fetchChain 死快照字段 + config.ts 12 处 JSDoc 默认勘正（`3445ae3`）
- 复审清偿：T4 测试 Unhandled Rejection 致 vitest exit 1（创建即挂 handler）+ 缩进/死兜底字面/enabled 架空 JSDoc（`b61622c`+`9dc0bb6`）

**治理**
- 阶段 0 快速通道（用户指令双深审代行；🟡 过程债 = 深审原文未落盘，session-14u 勘误披露）→ T1-T6 逐一 TDD 红绿留痕 → T8 独立复审初判 **BLOCKED**（探针×3 证判别力）→ 四项清偿 → 同 Agent 复验 **PASS/CONFIRMED**；两轮原文 audit-logs 在档

**诚实标注（遗留项）**
- 3423 实测用 fake DeepSeek key 已从 `.credentials.yaml` 物理清除（GUI 清空不清文件），零残留亲证
- S14f-S14t 微批（台账在 STATUS）未单列 CHANGELOG 条目——沿用微批口径

**跟踪**
- 测试基线 305→**315 passed | 9 skipped (324)**；i18n 52→**48 keys**；client.js **64.42 kB**；门墙口径新增 exit code + Errors 行
- 下一棒：S15 手册棒（README/迁移/升级手册 + ADR-0008/0011/0012 勘注 + 架构 §4/§5 重试段）

---

## 2026-09-07 — 免费 fetch 搜索兜底（DDG）+ 二选一自动默认 + 链徽标（Session 14e，用户方向修正）

**新增**
- **`dshws-fetch-search` 免费成员**：DuckDuckGo HTML 端点抓取+解析（uddg 解码/非 http 丢弃/零结果 fail-loud），免 key 恒 ready——"免费 fetch websearch"的落地形态（web_fetch 只能取 URL，免费侧由插件实现抓取型搜索）（`e91c246`）
- **fallbackProvider 二选一**（'deepseek'|'fetch'|'auto' 默认 auto）：安装自动默认——模型 key 在→付费 DeepSeek，无→免费 fetch；GUI 兜底行 [DeepSeek 付费 | Fetch 免费] 切换热生效；链尾只拼选中者（auto 在 order getter 现场解析）
- **语义变更**：无凭据时链恒 AVAILABLE（免费地板）——"不可用"断言移至显式付费选择面（paid+无 key→不可用，诚实失败）
- 链卡 hint 收进带边框 **! 徽标** Tooltip（删两行写死 prose；内容=五家序+兜底二选一说明）；locales 48→**51 keys**（`cc15d4c`）
- 测试 285→**292**（292 passed | 9 skipped (301)；+8）；client.js 53.48→**54.91 kB**；index.js 65.89（新成员）

**诚实标注**
- DDG 可达性=网络依赖：不可达→成员失败→链尽 fail-loud（无更低层）；README 披露归 S15
- 14d 的"无兜底"选项被本轮方向修正取代（用户澄清本意）

**跟踪**
- 下一棒：S15 = README + anysearch 迁移 + 升级手册（M5 文档腿收官）

---

## 2026-09-07 — 兜底二选一（默认无兜底）+ maxUses 修正 + ⓘ/脱敏（Session 14d，用户三项反馈）

**新增**
- **兜底二选一**（用户裁定）：底部兜底行改两段 choice [无兜底 | DeepSeek 付费]；**deepseek.enabled 默认 true→false**——付费兜底 opt-in，默认零付费触达（ADR-0004 中立性强化；既有显式 settings 值原样生效，兼容实证）；无兜底+无成员 fail-loud（`46aeec5`）
- **maxUses 修正**：默认 5→**10**；ⓘ 文案「一次请求必须作答前最多可搜索{N}次」{N}=输入值实时同步；删作用域后缀；行内对齐修正
- **标题 ⓘ = description**；多 key 格式提示移入各卡输入 placeholder（ref 名+多把格式）；已配置未编辑脱敏 ••••••••（聚焦编辑/失焦还原）（`f460668`）
- 测试 284 passed | 9 skipped (293)（净 0：语义适配+choice 用例互抵）；i18n 43→**48 keys**；client.js 52.07→**53.48 kB**

**治理**
- 快速通道阶段 0（同日零间隔+全量补强口径）；对话内连续微批（用户三项反馈+AskUserQuestion 裁定）；阶段 4/5 独立验证；红线一次带红当场 amend（五犯防复发要点入册）

**跟踪**
- 下一棒：S15 = README + anysearch 迁移 + 升级手册（M5 文档腿收官）

---

## 2026-09-06 — 全局置顶 + 折叠区 + 恒链尾 + maxUses + 官方入口退役（Session 14c，用户四轮反馈五决策点）

**新增**
- **全局区置顶恒显**：搜索链五家排序（Tavily/Exa/Perplexity/Firecrawl/AnySearch）+「DeepSeek 恒为链尾兜底，不参与排序」+ 单成员超时 + **单次请求最多搜索次数**（maxUses 宿主同款同名同义同默认 5，`fe31b94`）
- **DeepSeek 恒链尾语义**（node）：排序域收窄五家 + 固定尾拼接 + 老钉死序过滤迁移 + fetch 链排除 deepseek；ADR-0004 D3/0013 D6 注记（`f5376ae`）
- **maxUses 配置化**：DeepSeekSettings/MemberConfig/schema/resolveConfig 全链 + provider 常量改默认注入 + wire max_uses 透传 + GUI staged 输入（`b031bf2`）
- **官方 web-search-deepseek 随包退役**（ADR-0013 Decision 7，用户裁定）：patch 第三条目行级 disabled:true——安装即官方搜索卡消失 + provider 注销 + 其 DEEPSEEK_API_KEY 单写点消失；卸载自动复原；web-fetch-http 不触碰（`69e32c5`）
- 五卡折叠默认收起（头部恒显，展开区多 key 零损失）；删 fallbackFootnote（ⓘ 唯一说明入口）
- 测试基线 277→**284**（284 passed | 9 skipped (293)）；i18n 40→**43 keys**；client.js 47.47→**52.07 kB**

**清偿（2 笔）**
- 阶段 4/5 🟡×2 当场清偿（`0b32a37`）：fallbackNote 位置句纠偏 + setDeepseekMaxUses 专测
- 顺手清偿 S14b 🟢：MemberCard 死 badge 分支

**治理**
- 阶段 0 审 S14b **PASS**（替代证据+翻案条款）→ 用户四轮反馈五决策点（AskUserQuestion×3 + 修订确认）→ 计划包 ExitPlanMode 批准 → 阶段 4/5 **PASS / COMPLETE**（门墙零偏差 + R1-R7 全过 + 探针闭环〔withFallbackTail 反改红〕）
- 诚实标注：执行期提交态红三次（typecheck/entry/controller 红，均当场 amend 修复+亲见绿）——红线纪律防复发重点

**跟踪（观察期）**
- 基线链：277\|9(282) → **284\|9(293)**；typecheck 双面 0；lint 0w0e 50 files；43 keys + 18 files
- 里程碑：M7 ✅（S09-S14c 插行四连）；M5 文档腿 S15；M6 ⏳
- 下一棒：S15 = README + anysearch 迁移 + 升级手册（含官方退役说明与手动复原法）

---

## 2026-09-06 — DeepSeek 兜底行重构 + 双审计修复（Session 14b，用户产品裁定插行棒）

**新增**
- **DeepSeek 配置卡 → 兜底说明行**（用户双裁定）：ⓘ Tooltip 四点语义（接管后官方入口闲置/链内第 5 位兜底/共用模型 key 后写覆盖/付费 opt-out）+ **内嵌付费兜底开关**（绑既有 setEnabled，未就绪禁用）+ 动态状态 + 共用 badge 保留 + 底部 fallbackFootnote；**删除** key 输入/keySelection/Clear/Save——共享 ref `DEEPSEEK_API_KEY` 上逗号池会毒化模型页聊天鉴权，写/清路径语义错误（`bc5871b`）
- 链块两修复：可见链行 disabled 成员视觉区分（置灰 +（已停用）标注，仍列示可排序）+ configured&&enabled 归零红色预警行（`2294e7c`）
- 链全败错误文案纠偏：`(configured: 全序)` 误标 → `(chain order: …)` + 「设置页启用/配置成员（DeepSeek 经模型页 key 兜底）」指引句（`a3cf96b`）
- 文档横面：00-architecture §6 ADR-0013 注记（旧两行口径历史化 + 卸载半句/disabled 建议勘注）+ §7 勘注 + §9 决策索引补 0008-0013；台账勘注（S14a 入账超报）+ 新债两笔入册（`a747d59`）
- 测试基线 273→**277**（277 passed | 9 skipped (286)；+4 = fallback 2 + 链块 2）；i18n 34→**40 keys**；client.js 42.09→**47.47 kB**（index.d.ts 零漂移；index.js 59.78 文案变更）
- Agent Note 无新增（正素材 = 本记录 + s14a/s14b 台账）；audit-logs 2 份（stage0/stage45）

**清偿（4 笔 + 1 现抓）**
- 阶段 0 🟡×4 全收口：architecture 旧口径（T4）/错误文案误标（T3）/宿主闲置卡披露（入册→S15）/入账超报勘注（T4）
- 设置页审计 🟡×5 全收口（badge 语境/description 等式/链 disabled/零可用预警/文案纠偏）
- 阶段 4/5 🟡×1（归档截图视口截断）→ T7 补拍滚动截图清偿（AI 视觉亲读）

**治理**
- 阶段 0 审 S14a **PASS**（🟡×4 入册为放行条件；计划模式权限限制替代证据披露）→ 方向双裁定（对话 + AskUserQuestion「说明行+内嵌开关」）→ 计划包 ExitPlanMode **用户批准** → 阶段 4/5 **PASS / COMPLETE**（门墙零偏差 + R1-R6 全过 + 探针红签名〔分流改 false → 2 failed 精确签名〕+ 安装副本 md5 一致）

**诚实标注（遗留项）**
- 🟢 新登记：MemberCard 残留不可达 deepseek badge 死分支（S15 清理）
- 维持项：🟢×4 + L-2 + 观察（+宿主闲置卡披露→S15 / architecture 其余陈旧→S15）+ v2 backlog

**跟踪（观察期）**
- 测试基线链：273\|9(282) → **277\|9(286)**；typecheck 双面 0；lint 0w0e 50 files；check:i18n 40 keys + 18 files 零 CJK
- 里程碑计数：M7 ✅（S09-S14b 插行三连）；M5 文档腿 S15；M3 余用户 with-key 回填；M6 ⏳
- dont-do 新增：0 条（无超 15 分钟系统性新坑）
- 下一棒：S15 = README + anysearch 迁移（新口径）+ 升级手册（M5 文档腿收官）

---

## 2026-09-06 — 装即接管 web_search（插行棒）：ADR-0013（Session 14a，M7 插行增补 ✅）

**新增**
- **装即接管（ADR-0013）**：随包 cordis.patch.yml 增 `- id: web` 钉扎 `searchProvider: dshws-chain` + `fetchProvider: http` **显式重述**（fetch 链单成员 firecrawl，无 key 即坏——fetch 接管保留为手动可选；不写 name 守卫防静默跳过）——**安装即接管 web_search、remove 单命令 diff 基线零输出完整复原、用户层终裁保留**；零宿主源码改动、仍单 tarball 独立安装（`9884466`）
- ADR-0013 amend 三决策：ADR-0001 组合面 / ADR-0004 D2 接线形态（**D3 链中立性实质不变**：DeepSeek 仍末位兜底）/ ADR-0009 D5 博弈规则（bundle 层延伸：安装序后写者赢）；漂移防线 = peer 域 + 发版清单检查项（`bf3719f`）
- 实测：e2e 装卸三态 dump（翻转 / diff 零输出 / 用户层赢）+ **浏览器端到端**（web 行零手动接线 boot 一轮闭合，工具行徽标 `· DeepSeek` 亲见）——阶段 4/5 另行独立重演复现
- 设置页 intro 扩句（装即接管/卸载复原/fetch 可选）；s05b runbook ADR-0013 增补；roadmap S15 迁移口径适配（anysearch 卸装即切换）
- 测试基线 270→**273**（273 passed | 9 skipped (282)；+3 = patch.test 结构断言）；i18n 34 keys 维持；client.js 41.81→**42.09 kB**（index.js/index.d.ts 零漂移）
- Agent Note `docs/notes/2026-09-06-s14a-install-takeover.md`（机制锚 6 条 + 实测语义表 + S15 口径）；audit-logs 2 份

**清偿（1 笔）**
- 🟡 S14 接力指令 L-2 缺项：session-14 勘注（时点快照不回改；新接力指令全量口径，`bf3719f`）

**治理**
- 阶段 0 审 S14 **PASS**（增量采信 + 冒烟 21 passed）→ 方向裁定 = **用户 AskUserQuestion 获答方案 B**（A 现状/C 双接管/D GUI 状态显示均否决；双 Agent 只读调研）→ 计划包 ExitPlanMode **用户批准**（2.5 真实批准）→ 阶段 4/5 **PASS / COMPLETE**（门墙零偏差 + R1-R6 全过 + **独立重演 e2e** + 探针红签名〔fetch 改钉 → 双断言红〕）

**诚实标注（遗留项）**
- 用户预期偏差已在三处披露（设置页 intro / runbook 增补 / ADR Consequences）；「禁用官方 websearch」真相 = 选择翻转（deepseek-official 闲置无害，DeepSeek 能力经链末位成员保留）
- 🟢 新登记：一行否决在有 firecrawl key 场景 → WEB_PROVIDER_AMBIGUOUS 硬错（S15 手册按重述两键口径）；发版清单实体待 S15/S16 从 Note §5.1 搬运
- 维持项：🟢×4 + L-2 + 观察项 + v2 backlog（不排期）

**跟踪（观察期）**
- 测试基线链：270\|9(279) → **273\|9(282)**；typecheck 双面 exit 0；lint 0w0e 50 files；check:i18n 34 keys + 18 files 零 CJK
- 里程碑计数：M7 ✅（S09-S14 + S14a 插行）；M5 文档腿 S15；M3 余用户 with-key 回填；M6 ⏳
- dont-do 新增：0 条（workspace storages/ 目录坑并入既有配方记忆）
- 下一棒：S15 = README + anysearch 迁移（新口径）+ 升级手册（M5 文档腿收官）

---

## 2026-09-06 — 溯源徽标接管 + v2 调研首棒：M7 收官（Session 14，M7 ✅）

**新增**
- **session 搜索溯源接管（ADR-0010 落地）**：client half 以 **priority -1** 注册 `tool.call.toolview` 的 `web_search` key（升序最低者渲染，同 key 同 priority 抛错——契约锚安装包 dsh-client-ui-slots d.ts:399-400），shadow 宿主 WebRow 渲染整个工具调用块：折叠行 carried **served-by 服务徽标**（`· Tavily` 品牌名，aria-label 走 locales，未知 id 原样），展开体自绘同构（answer + sources + truncated + raw + inspect）；**两级回退**：无署名行（直连/外来）不渲染徽标、meta 形状不符退化 generic 工具卡（`4958fc0`）
- **v2 backlog 首棒调研注记**（`docs/notes/2026-09-06-s14-fetch-fallback-research.md`）：fetch 兜底开关缝隙判定——宿主单赢家无降级（resolveProvider 四路抛错）+ fetch 无 settings namespace（search 的 re-point 缝不存在）+ **唯一外挂缝** = registerFetchProvider 新 id + patch 钉 fetchProvider + 内部回落 HttpFetchProvider（公开导出）；热切上限 = patch live reload，GUI 热开关需上游。余额看板地基：宿主 client 零 usage/balance slot（`440c90e`）
- 类型面 D4 回退定谳：ui-tool 发布类型 block 经未装包静默 any（垃圾探针实证）→ 本地结构镜像 + SlotMap 自 declare（双 declare 永不相遇论证成立）；WebBlock 原语因 chrome labels 键面翻倍弃用（Agent Note §2-3）
- 测试基线 261→**270**（270 passed | 9 skipped (279)；+9 = keys 1〔钉牌〕+ toolview 8）；i18n 27→**34 keys**（+7，计划估 33 +toolInspect 披露）；client.js 29.98→**41.81 kB**（index.js 59.42 / index.d.ts 27.04 零漂移）
- Agent Notes ×2（溯源实现 `2026-09-06-s14-toolview-attribution.md` + 调研 `2026-09-06-s14-fetch-fallback-research.md`）；audit-logs 3 份

**清偿（2 笔）**
- 🟢「失败不回牌」钉牌断言：具名断言双策略在档（探针红×2 还原绿，`05f230c`）
- 🟢 阶段 0 新报「webview 输入派发族该入册未入册」：dont-do 三要素条目入册（家族第 2 次跨棒定谳，`a312805`）

**治理**
- 阶段 0 独立审核 S13 **PASS**（增量采信 + 子集实跑 57 全绿 + 交付物逐项 + v1.2 增查两过）→ 阶段 2 单轮 **APPROVED**（无必改；随批建议×5 全折入；锚点抽查 25 处含 npm registry 实查）→ 阶段 2.5 AskUserQuestion 未获答 → **按接力序取默认批准项自主推进**（S09/S10/S13 先例，双落披露）→ 阶段 4/5 **PASS / COMPLETE**（全量门墙亲跑零偏差 + R1-R7 全 PASS + 三问全过 + 探针有牙实证〔priority 改 0 → 红 → 还原复绿〕）

**诚实标注（遗留项）**
- 浏览器棒拓扑简化：单 stub 口三形状（3431 未用）；T5 首轮 STREAM_CLOSED（stub 非 SSE）与 workspace UI 摸索弯路如实入踩坑节——用户中途纠偏指向 workspace 注册表播种既有配方后一次通过
- 🟢 新登记：badge 超长 id 撑宽折叠行（纯视觉观察，React 转义无安全面）
- 维持项：fetch 排序 UI / 恢复默认按钮 / anysearch fetch 面 / CSS module 化（→S15 顺手候选）/ L-2 / 观察项 / v2 backlog（调研已落档，仍不排期）

**跟踪（观察期）**
- 测试基线链：261\|9(270) → **270\|9(279)**；typecheck 双面 exit 0；lint 0w0e 49 files；check:i18n 34 keys + 18 files 零 CJK
- 里程碑计数：**M7 ✅ 2026-09-06**（S09-S14 全收官）；M5 文档腿 S15；M3 余用户 with-key 回填；M6 ⏳
- dont-do 新增：1 条（webview 输入派发族「以调用成功判定动作」）
- 下一棒：S15 = README + anysearch 迁移 + 升级手册（M5 文档腿收官）

---

## 2026-09-04 — 优先级策略棒：ADR-0012 变体 B + keySelection 控件（Session 13，M7）

**新增**
- ADR-0012 定谳：key 级 `random` 策略改判**不放回随机**（洗牌牌堆：一轮内每把 key 恰抽一次，抽尽按升序 Fisher-Yates `j = i + floor(rng() × (n − i))` 重洗〔rng≡0↔恒等排列，既存钉牌断言零漂移〕；拆分序列与牌堆多重集不一致即重建；失败不回牌——直接链层降级；**成员级保持顺序降级不变**；S11 用户方向 + 2.5 默认批准披露）（`04c0e5c`）
- 成员卡 keySelection GUI 控件（12b 移交交付）：role=group 三段 segmented（aria-pressed 标当前项 / 未配置禁用 / 成员前缀 aria-label / pressed = bg-layer-1+border-l3）；写 settings 热生效，patch 深合并不清同成员兄弟字段（`27dd261`+`7aa0e5f`）
- 两级调用顺序说明 hint：控件行下插值当前策略名——「多把 key 按「{policy}」选取；单把失败不换把，直接降级下一成员」（locales 22→**27 keys**）（`7aa0e5f`）
- 测试基线 261→**270**（261 passed | 9 skipped；+9：keys 3〔含重复多重集重建腿〕+ controller 3 + section 3）；index.js 57.96→**59.42 kB**（index.d.ts 27.04 零漂移）；client.js 26.25→**29.98 kB**
- Agent Note `docs/notes/2026-09-04-s13-priority-strategy.md`（ADR-0012 语义表 + 控件面 + 三坑）；audit-logs 3 份

**清偿（1 笔）**
- 阶段 0 承接 🟡×1（session-12a/12b 记录缺「开发规范强化说明」节——模板漂移自 12a 起）：T0 补节头 + 勘注，内容原文不动（`e26a7dd`）；本棒记录自骨架起三★节占位（防复发）

**治理**
- 阶段 0 独立审核 S12b PASS（零产品漂移采信分支 + 冒烟 22 passed + 交付物六项逐核）→ 阶段 2 两轮（轮 1 NEEDS REVISION 必改×2〔洗牌公式未钉押硬币/fixture 面漏认领〕+ 建议×5 → 全数吸收 → 轮 2 APPROVED）→ 阶段 2.5 AskUserQuestion 未获答 → **按接力序取默认批准项自主推进**（推荐方案 + 变体 B；S09/S10 先例，双落披露）→ 阶段 4/5 **PASS / COMPLETE**（门墙七命令亲跑零偏差 + ADR 与实现逐句对照 + 三问全过；**🟡×1 抓获：sameMultiset 漏 `left<=0`——重复多重集平移陈旧牌堆存活〔探针实证〕→ b08b26e 当场清偿，同 Agent 复验 CONFIRMED**）

**诚实标注（遗留项）**
- 「失败不回牌」无直接钉牌断言（结构保证：抽牌即消费无重试环）——🟢 归 S14/S15 顺手补
- 🟡-1 清偿过程披露：首版「整周期多重集」断言被陈旧尾抽 + 自然重洗掩盖而假绿（12 passed）——改判别点为热改后立即首抽后证红（expected 'k2' to be 'k1'）
- 维持项：fetch 排序 UI / 恢复默认按钮 / anysearch fetch 面 / CSS module 化 / L-2 / 观察×4 / v2 backlog（余额看板 + fetch 兜底开关 → S14 调研）

**跟踪（观察期）**
- 测试基线链：252\|9(261) → **261\|9(270)**；typecheck 双面 exit 0；lint 0w0e 47 files；check:i18n 27 keys + 17 files 零 CJK
- M7 计数：S09/S10/S11/S12/12a/12b/13 ✅；余 S14（fetch 调研+溯源）；M5 文档腿 S15；M3 余用户 with-key 回填
- dont-do 新增：0 条（三坑入 session 记录 + Agent Note，未达系统性门槛）
- 下一棒：S14 = fetch 兜底开关调研 + session 搜索溯源增强（ADR-0010）

---

## 2026-09-04 — 设置页信息收敛 + DeepSeek 双配置澄清（Session 12b，M7 插行棒）

**新增**
- key 格式提示收敛：六卡重复 hint 段落撤除 → 页头「网页搜索 ⓘ」单图标悬停提示（用户裁定形态；宿主无「!」圆圈，用问号圆圈 IconQuestionOutline14）
- DeepSeek 卡澄清：头行「共用模型 Key」badge（title 展开句——与模型设置页共用同一把 DEEPSEEK_API_KEY，后写覆盖先写）；locales 20→**22 keys**
- 两级调用逻辑文档化（Agent Note 正本）：跨工具=**顺序降级**（非轮询；caller abort 直传例外）；同工具多 key=order（默认恒首把）/round-robin（逐请求轮换）/random（采样），失败不换把直接链层降级——顺序可视化配置需求划归 **S13 策略棒**（roadmap WBS 增补 keySelection GUI 控件移交）
- 测试基线 260→**261**（252 passed | 9 skipped）；client.js 24.68→**26.25 kB**；node 侧零变更兑现
- Agent Note `docs/notes/2026-09-04-s12b-page-info-deepseek.md`；audit-logs 3 份

**治理**
- 阶段 0 独立采信审核 PASS（无产品变更分支；正本漏落盘由阶段 2 复审 R-M1 抓获补落——dont-do ⑤ 家族）→ 阶段 2 两轮（NEEDS REVISION 必改×2 → 轮 2 残留 R-M1 修复后 APPROVED）→ 阶段 2.5 用户真实批准（第 6 次「批准推荐方案」——DeepSeek 卡保留+badge，不移除）→ 阶段 4/5 **PASS / COMPLETE**（门墙本审零偏差；截图实物采信；🟡×1 T6 补守卫清偿）

**诚实标注（遗留项）**
- keySelection GUI 控件与调用顺序可视化未做——S13 策略棒认领（roadmap WBS 已增补）
- 「成员卡子树 tooltip null 守卫」缺口（T5 抓获）——T6 补齐（22 passed）
- webview 后台态 programmatic focus() 不生效——focusin 冒泡触发手法沉淀

**跟踪（观察期）**
- 测试基线链 251→252；i18n 20→22 keys；下一 session 接力摘要：S13 = 优先级策略棒（ADR-0012）

---

## 2026-09-04 — 设置页布局系统性重构（Session 12a，M7 插行棒）

**新增**
- 成员卡纵向结构（对齐宿主 Models/Plugins 布局惯例——深度摸底实锚）：头行=品牌名+自绘语义状态点（role=img+aria-label+title，读屏可闻）+右开关（36×20+16px thumb 圆点）；**输入框独占整行**；key 格式说明改**控件下方 hint 行**（ⓘ/Tooltip 惯例外形态全撤）；Save/Clear 移**独立 footer 行**右对齐
- hint 文案格式化：`Multiple keys: {APIKEY1,APIKEY2,...} (max 10)`／`多把 key：{APIKEY1,APIKEY2,...}（最多 10 把）`（用户表述采纳；keyFieldNoteExample 键删除）
- 链区块收敛：未配置态**整块隐藏**（原半屏静态列表消除）；已配置态紧凑卡（12px 标题+badge+默认序说明+序号/品牌名/28px 图标钮行+280px 内滚动）；timeout 折入 hint
- fetchChain 只读展示区块移除（披露的功能收缩；信息并入页头 intro；数据面 schema/快照字段不动）
- 页头 intro 重写（含链调用降级逻辑句）+ 面板 max-width 720 + 间距/字号/圆角全量对齐宿主常数表
- 测试基线 257→**260**（251 passed | 9 skipped）；i18n 22→**20 keys**；client.js 24.80→**24.68 kB**；index.js/index.d.ts 零漂移（node 侧零变更兑现）
- Agent Note `docs/notes/2026-09-04-s12a-settings-redesign.md`（宿主布局惯例表/重构映射/四坑）；audit-logs 3 份

**治理**
- 阶段 0 独立采信审核 PASS（无产品变更分支）→ 阶段 2 两轮（轮 1 NEEDS REVISION 必改×4——含阶段 0 条款错锚与主 Agent 自核拦截——→ 轮 2 APPROVED）→ 阶段 2.5 用户真实批准（第 5 次，含两处字面表述替换裁定：去图标改 hint 行/页头静态 intro）→ 阶段 4/5 **PASS / COMPLETE**（门墙本审零偏差；🟡×2 记录类收官勘正）

**诚实标注（遗留项）**
- CSS module 化未做（宿主共享 preset 为工作区相对导入不可复用）——🟢 债务另棒评估；内联方案无伪元素/hover 微交互
- fetchChain 只读展示移除为功能收缩（用户批准披露点）
- T4 截图初未归档（Browser Use 截图仅入会话 artifacts）——T6 补归档双态 PNG；d561598 commit message 转写失真——勘误注记在档

**跟踪（观察期）**
- 测试基线链 248→251；i18n 22→20 keys；下一 session 接力摘要：S13 = 优先级策略棒（ADR-0012）

---

## 2026-09-04 — 设置页 UI/UX 对齐 + S11 治理修复批（Session 12，M7 第 4 棒）

**新增**
- 反馈①：多 key 提示改 info 图标 hover（可聚焦 button anchor + 宿主 `Tooltip`，含格式示例键 `keyFieldNoteExample`；宿主无 InfoIcon，用 `IconQuestionOutline14` 对齐——披露点经用户批准）
- 反馈②：开关颜色跟随配置态——`configured && enabled` 才渲染语义绿（修复未配置成员 enabled 默认 true 的「误导绿」）；已配+关=灰（推导分支，披露点）；feedback 补 `role="status"`
- 反馈③：搜索/抓取链行渲染**品牌名**（memberId→MEMBERS.label；aria 同口径；testid/载荷保持 id 级）+ ↑↓ 禁用边界改**过滤后可见列表**（修复末位可见项 ↓ 恒可点+假失败 bug）；`MemberSnapshot.memberId` 落地（S11 plan D5）
- 反馈④：默认序 ⓘ hover 说明（`chainDefaultHint` + MEMBERS 动态顺序派生，零硬编码；pinned 态无 ⓘ）；locales 20→**22 键**
- S11 治理修复批：session-11 记录 reconstructed 补落（🔴1）/ progress-M7 假 PASS 入账撤销 + 案卷闭合（🔴2，五腿清偿 + T8 独立复验）/ roadmap 按用户 2026-09-04 序列重排 12-16 / CHANGELOG S11 补录 / dont-do +2 条（收官工件缺失形态、gate 翻转无留痕形态）
- S11 遗留腿清偿：混合序列交换断言 + 双牙齿探针（破坏跳过循环红 / 轮换 order 化 `Bearer k1×3` 恒序红）+ 浏览器九断言（scratch 3418）
- 测试基线 254→**257**（248 passed | 9 skipped；+3 净增）；build 增量披露 client.js 21.57→24.03 kB（index.js/index.d.ts 零漂移——node 侧零变更兑现）
- Agent Note `docs/notes/2026-09-04-s12-uiux-alignment.md`；audit-logs 3 份

**治理**
- 阶段 0 独立审核 S11 **BLOCKED**（🔴×2 收官证据链）→ 修复批并入 T0（先债后新）→ 阶段 2 两轮（NEEDS REVISION 必改×3〔Tooltip anchor 机制/披露缺失/重排同步面〕→ APPROVED）→ 阶段 2.5 用户真实批准（第 4 次，AskUserQuestion 获答「批准，自主推进」）→ 阶段 4/5 **PASS / COMPLETE**（S11 验收采信链闭合判定成立；🟡×3 记录类随收官勘正）

**诚实标注（遗留项）**
- 超限 11 把 key 在凭据层诚实落盘不拦（拦截在搜索期，`src/keys.ts:101-107` fail-loud + `tests/keys.test.ts:89-95` 单测）——S11 plan「GUI 拦截」预期按实测修正
- 3417 端口被凌晨残留实例占用（pid 61518，DSH_HOME=/tmp/dshws-review；未 kill）——本棒改道 3418，下棒起实例先查占
- session 记录骨架未随 T0 创建（plan 自身根治式写法违例一次），T9 一次成文——已在踩坑节披露

**跟踪（观察期）**
- dont-do 六条（本棒 +2）；测试基线链 245→257；i18n 20→22 keys
- 下一 session 接力摘要：S13 = 优先级策略棒（成员级 random/序列 + ADR-0012）

---

## 2026-09-03 — 验收反馈调整：单槽逗号值 + 开关置灰 + 过滤未配置（Session 11，M7 调整棒；2026-09-04 补录）

> 补录说明：本条目由 Session 12 治理修复批补写（S11 收官提交 b23097b 漏落 CHANGELOG——
> S12 阶段 0 审核 🔴1 家族抓获，🟡8）。

**新增**
- 多 key 形态改判**单槽逗号值**（ADR-0008 superseded → ADR-0011）：每成员一个凭据 ref，值 = `k1,...,kN` 逗号串（上限 10 把拆分后 fail-loud；`keySelection` 三策略保留、作用于拆分后 key 序列——轮换对象 ref 级改 key 级）；S09 `extraApiKeyEnvs` 多 ref 池回退（config 四件制品 ×六成员退场，pre-release 无兼容承诺）
- 开关**置灰禁用**未配置成员（`disabled={!member.configured}`；行为零变化——链本就跳过）
- 优先级列表**过滤未配置成员** + move 升级**可见序列交换**（delta 方向跳过未配置成员与相邻已配置成员交换）
- key 输入框 `!` helper text（`keyFieldNote`：多把 key 逗号分隔最多 10 把）；locales 四删一增（19→**20 键**）
- 测试基线 266→**254**（245 passed | 9 skipped；extras 行为删改对冲净减）；build 增量披露 57.96/27.04/21.57 kB（退场缩减）
- Agent Note `docs/notes/2026-09-03-s11-adjustments.md`（单槽语义/回退决策/三坑——S12 正素材）；audit-logs 3 份

**治理**
- 阶段 0 独立审核 S10 **PASS**（🟡×3 记录更正类 T0 清偿）→ 阶段 2 两轮（NEEDS REVISION → APPROVED）→ 阶段 2.5 用户真实批准（第 3 次）
- 阶段 4/5 独立验证在盘正本 = **BLOCKED**（`65bef4e` 时点；R1/R3 证据条未齐）；收官提交曾误入账「PASS / COMPLETE」——2026-09-04 由 S12 阶段 0 审核（🔴2）撤销勘正（progress-M7 T8 行勘正注记在档）

**诚实标注（遗留项）**
- T6 浏览器实测棒未执行（scratch 3417 五断言）——转 S12 认领
- 阶段 4/5 遗留腿三笔：过滤负路径断言 / 混合序列交换断言 / 牙齿探针重演——转 S12 T3/T5 清偿
- 收官序列四件缺：session 记录（2026-09-04 reconstructed 补落）/ roadmap 更新 / CHANGELOG（即本条目）/ 接力指令——S12 T0 治理修复批补齐

**跟踪（观察期）**
- dont-do 新增 2 条（S12 T0 入册）：收官声称完成而核心工件缺失形态 / 验收 gate 翻转无留痕形态
- 下一 session 接力摘要：S12 = 设置页 UI/UX 对齐（用户 2026-09-04 反馈四项）

---

## 2026-09-03 — anysearch 第六成员（Session 10，M7 第 2 棒）

**新增**
- `dshws-anysearch` 第六成员（ADR-0009 路线 B HTTP 自实现）：`POST {base}/v1/search` + Bearer（凭据 ref `ANYSEARCH_API_KEY` 缺省）；**信封分支**——HTTP 200 且 `code !== 0` → `DSHWS_ANYSEARCH_HTTP_ERROR`（message + request_id 诊断）；映射补官方 provider 丢弃 content 的缺口（snippet 在先、content 回退，两形用例锁死优先级）
- `MEMBER_ERROR_CODES.anysearch` 五码族；config `anysearch` 节四件制品（enabled/apiKeyEnv/baseURL/zone cn|intl——zone 仅配置时透传请求体）
- `BUILT_IN_MEMBER_ORDER` 尾部追加（ADR-0004 中立开箱语义不变；未配 key 自动跳过）——**自动享用 S09 池化**（extraApiKeyEnvs/keySelection 全泛化）
- client 第 6 卡（label 'AnySearch' 代码常量，零新 locale 键）
- 与 3080 官方 anysearch 插件共存语义在档（id `dshws-anysearch` vs `anysearch` 零冲突；用户层 patch 后写覆盖切换链路——S12 素材）
- 测试基线 245→**266**（257 passed | 9 skipped；27 files，+21）；build 增量披露 58.09/28.70/27.30 kB
- Agent Note `docs/notes/2026-09-03-s10-anysearch-member.md`（信封规格/一行入池/共存语义/三坑——S12 正素材）；audit-logs 3 份

**清偿（2+1 笔）**
- 阶段 0 抓获 🟡×2（记录更正类，9ade4ef 治理批遗留）：①index.ts 注释同义两遍**实删**（非改词）②progress 里程碑行括注漏刷 ×2（progress-M7/M5 镜像）——dont-do 第三条家族第五次，T0 清偿（`8ac6107`）
- 阶段 4/5 抓获 🟡×1（门墙表 lint files 45 应为 47 转录误差）：T10 勘正清偿

**治理**
- 阶段 0 独立审核 S09 **PASS**（🔴0；五子集亲跑零偏差 + 增量算术独立复算 + providers 零改动亲证；原文 s10-stage0-review-of-s09.md）
- 阶段 2 **三轮**：轮 1 **NEEDS REVISION**（必改×1 波及面三处遗漏 + T1 未点名 config 四件制品，建议×5）→ 轮 2 残留**必改×1**（「语法校验循环已泛化」与实物相反——index.ts:103 字面量枚举）→ 轮 3 **APPROVED**（原文 s10-stage2-plan-review.md 三轮全文）
- 阶段 2.5：AskUserQuestion 未获答 → 按接力序默认批准自主推进（披露，session 记录双落）
- 阶段 4/5 **PASS / COMPLETE**（R1-R5 逐条 + 门墙七命令亲跑 + refs:{} 复原亲读 + 三问全过；原文 s10-stage45-verification.md）

**诚实标注（遗留项）**
- anysearch fetch 面（/v1/extract → dshws-anysearch-fetch）v1 不做（ADR-0009 Consequences 登记，需要时同模式追加）
- 信封 wire `code: number`——上游漂移字符串时判真 fail-loud（安全方向，已注记）
- T1 批内 settings.test 断言漏更新带红 amend（提交态红线第二次）；T2 误 amend 掺包 reset --soft 重排——两坑入 session 踩坑节
- M3 with-key 用户槽位不变；anysearch 真实 smoke 与其互补（用户有 key 可择机跑真）

**跟踪（观察期）**
- 测试基线链：S08 203|8(211) → S09 237|8(245) → **S10 257|9(266)**（27 files，+21）；typecheck 双面 exit 0 / lint 0w0e 47 files / build 增量披露 58.09+28.70+27.30 / pack 五件 / check:i18n exit 0（23 keys + 17 files）
- 里程碑：M1 ✅ M2 ✅ M4 ✅；**M7 🚧（S09 ✅ S10 ✅，余 S11）**；M5 🚧（文档腿 S12）；M3 🚧（余用户 with-key 回填）；M6 ⏳
- dont-do 累计 4 条（本棒无新增）；下一棒 = Session 11 session 溯源增强（M7 第 3 棒/收官棒）

---

---

## 2026-09-03 — 多 APIKEY 池 + 选择策略（Session 09，M7 第 1 棒）

**新增**
- 每成员多 APIKEY 池（ADR-0008，多凭据 ref 形态——key 零明文）：config 每成员 `extraApiKeyEnvs?: string[]`（附加凭据 ref）+ `keySelection?: 'order'|'round-robin'|'random'`（缺省 order = 现状零变化）；settings/cordis.yml 双面生效，热切下一搜即用
- `src/keys.ts` KeyPool：就绪过滤（gate describe 缓存）→ 策略选择（游标/注入 rng）→ 经 resolveMemberApiKey 走既有三态；空池自抛 `CREDENTIAL_MISSING` 列主 ref + 全池（ADR-0008 Decision 3）；**provider 文件零改动**（thunk 落点替换）
- gate 全池语义：任一 ref configured 即就绪；prime 扩全池；settings 提交侧 re-prime（`attachSettingsSection` onCommitted 钩子，refresh→prime 次序）——覆盖「key 先存、ref 后入池」次序
- GUI 附加 keys 列表：每成员卡新增附加 keys 区（per-ref aria 标签行：状态点/密码输入/保存/清除/移除 + 追加行）；整表 patch 回写；typed locales 19→23 键
- e2e wire 级轮换实证：loopback 到达记录扩载 Authorization——round-robin 三 key 三连发逐把轮换 / order 跳过未配置 primary / random ∈ 就绪集；牙齿证明（策略探针 order 化 → 恒序红 → 还原）
- 浏览器多 key GUI 三断言（scratch 3414）：添加附加 ref → settings.yaml 落盘 ref 名数组；写 fake 值 → Saved + 凭据 refs 落盘；Clear+Remove → refs:{} + extras:[] 复原
- 测试基线 211→**245**（237 passed | 8 skipped；25 files，+34）；build 增量披露 52.61/25.19/27.17 kB（src 本棒必变——D7 口径）
- Agent Note `docs/notes/2026-09-03-s09-multi-apikey.md`（活端口纪律/re-prime 触发点——S12 正素材）；audit-logs 3 份

**清偿（2 笔）**
- 阶段 0 抓获 🟡×1（9ade4ef 治理批顺延清扫漏刷——roadmap M5 尾注等 S09→S12 陈旧引用）：T0 穷举清偿（roadmap/progress-M5/progress-M4/00-architecture 四文件六处 + 冻结面声明 + grep 复验）
- 阶段 4/5 抓获 🟡×1（台账测试增量算术 +30 应为 +34）：T11 更正清偿

**治理**
- 阶段 0 独立审核 S08 **PASS**（🔴0 🟡审核面内新增 0；client/chain/apply 子集亲跑；原文 s09-stage0-review-of-s08.md）
- 阶段 2 两轮：轮 1 **NEEDS REVISION**（必改×3：热增 ref gate 生命周期/空池文案对齐 ADR 正本/T0 清偿范围 + 建议×7 含 z.union 实测收敛）→ 全数吸收 → 轮 2 **APPROVED**（残留 R1-R6 随批吸收含 prime/refresh 次序勘误；原文 s09-stage2-plan-review.md）
- 阶段 2.5：AskUserQuestion 未获答 → 按接力序默认批准自主推进（披露，session 记录双落）
- 阶段 4/5 **PASS / COMPLETE**（R1-R5 逐条 + 门墙七命令亲跑 + providers 零改动 diff 双点 + 三问全过；原文 s09-stage45-verification.md）
- 功能扩展背景：2026-09-03 用户需求扩展（多 key/anysearch/溯源增强三特性批次前置；余额看板 v2 缓议）——ADR-0008/0009/0010 + roadmap M7（`9ade4ef`）

**诚实标注（遗留项）**
- 多 key 的派生 ref 名靠约定（`_2/_3` 后缀）；凭据页无池分组语义（README S12 说明）
- round-robin 游标为进程内状态（重启归零——负载分摊语义非精确公平）；random 分布不设契约（成员资格断言）
- index.ts 注释同义两遍（T10 🟢 注记）已随 T11 收敛；providers 机械行逗号风格疵（lint 不拦，留痕）
- M3 with-key 用户槽位不变；v2 backlog：余额/积分看板（ADR-0008 缓议）

**跟踪（观察期）**
- 测试基线链：S07 196|6(202) → S08 203|8(211) → **S09 237|8(245)**（25 files，+34）；typecheck 双面 exit 0 / lint 0w0e 44 files / build 增量披露 52.61+25.19+27.17 / pack 五件 / check:i18n exit 0（23 keys）
- 里程碑：M1 ✅ M2 ✅ M4 ✅；**M7 🚧（S09 ✅，余 S10/S11）**；M5 🚧（文档腿 S12）；M3 🚧（余用户 with-key 回填）；M6 ⏳
- dont-do 累计 4 条（本棒无新增）；下一棒 = Session 10 anysearch 第六成员（ADR-0009 路线 B）

---

---

## 2026-09-02 — e2e 场景收口（Session 08，M5 e2e 腿）

**新增**
- loopback e2e 层（`tests/e2e/`）：真实 `node:http` 监听 stub（listen(0) 瞬时端口/四形态行为表/跨端点到达序日志/closeAllConnections 收口）+ 全装配 e2e（entry config → 真实 `apply()` → ctx.web 注册表 → 链）——七场景全绿：断网降级（closedPort 真连接拒绝）/429 降级（钉 tavily + body `{}` 保状态字样）/超时降级（hang + 150ms 预算，`DSHWS_MEMBER_TIMEOUT` 入 reason）/顺序保持（到达序逐位 = config 序）/skip 成员不计序（`enabled:false` 选择门跳过零到达）/全败（`DSHWS_CHAIN_EXHAUSTED` + 三摘要行按走序 + cause = 末位成员错误）/钉死直连不降级（ctx.web 注册表实例直调 → 成员码原样 + 零链日志——S03 T11 范围锚定的端到端闭合）
- servedBy 双承载断言：content 首行署名 ×5 场景（perplexity 胜出场景带正文）+ logger `[dshws-chain] served-by:` 行 ×3 场景
- 链级真实 API smoke（`tests/e2e.real/chain.real.test.ts`，链层真实 API 覆盖空白补齐）：无 `DEEPSEEK_API_KEY` 自跳（本地 2 skipped 亲见），有 key 环境跑 served-by 首行真实验证
- 测试台架共享化：fakeCtx/flushGate → `tests/helpers/fake-ctx.ts`（apply.test.ts 机械迁移零漂移；扩展点 = logger 行捕获）
- 测试基线 202→**211**（203 passed | 8 skipped；24 files：loopback +7 + 链级自跳 +2）；**src 零变更兑现**（build 三件与 S07 逐字节零漂移——S03 链语义/装配面经真实网络层复证）
- Agent Note `docs/notes/2026-09-02-s08-e2e-loopback.md`（e2e 分层地图/loopback 契约/可观察面口径——S09 正素材）；audit-logs 3 份

**清偿（2 笔）**
- 阶段 4/5 抓获 🟡×1（assemble 内部失败路径服务器泄漏缺口——测试头注释在该分支不成立）：T8 catch-close 加固清偿 + 7 passed 复验
- T6 门墙抓获 lint warning ×1（T1 台架迁移残留未用导入；T1 时 lint 只核末行未核 Found 行——教训在案）：清偿后 0w0e 42 files

**治理**
- 阶段 0 独立审核 S07 **PASS**（🔴0 🟡新增0；client 39 + chain 33 子集亲跑；原文 s08-stage0-review-of-s07.md）
- 阶段 2 两轮：轮 1 **NEEDS REVISION**（必改×1 断言可观察面〔reason=message 非 code、降级场景无摘要对象〕+ 建议×3）→ 全数吸收 → 轮 2 **APPROVED**（6/6 闭合，41 锚点 0 虚构；原文 s08-stage2-plan-review.md）
- 阶段 2.5：**用户真实批准**「批准，自主推进」（第 2 次真实人工批准，S05b 后首例；双落 session 记录 + progress-M5）
- 阶段 4/5 **PASS / COMPLETE**（七场景逐条对峙 + 门墙七命令亲跑 + lsof 残留抽查 + 三问全过；原文 s08-stage45-verification.md）

**诚实标注（遗留项）**
- M5 保持 🚧：e2e 收口腿本棒关死，文档腿（README/迁移/升级手册）归 S09
- 牙齿证明（验证类任务的变异探针惯例）候选沉淀为治理流程通用实践（T7 前瞻建议，未写入）
- T4 commit message「content 首行 ×4」与实际 5 处差一（簿记措辞级，T7 注记在档）
- M3 with-key 用户槽位不变；链级真实 smoke 与其互补不重叠（无 key 环境两者皆自跳/待回填）

**跟踪（观察期）**
- 测试基线链：S06 184|6(190) → S07 196|6(202) → **S08 203|8(211)**（24 files）；typecheck 双面 exit 0 / lint 0w0e 42 files / build node+client 三件零漂移 / pack 五件 / check:i18n exit 0
- 里程碑：M1 ✅ M2 ✅ M4 ✅；**M5 🚧（e2e 腿 ✅，文档腿 S09）**；M3 🚧（余用户 with-key 回填）；M6 ⏳
- dont-do 累计 4 条（本棒无新增）；下一棒 = Session 09 README+迁移+升级手册（验收 = 独立审核 Agent 照手册从零 scratch 走通）

---

---

## 2026-09-02 — 优先级排序 + 覆盖标记 + i18n（Session 07，M4 第 2 棒收官）

**新增**
- 搜索链排序：设置页搜索链逐项 ↑/↓ 按钮（per-item aria-label、首/末边界 disabled）→ `moveSearchChainEntry` 全量数组 patch 经 `settings.update`（expectedRevision 防护）→ `settings.yaml` 落盘 → 下次搜索生效（热通路 S05a 已验 + 本棒热链序回归绿；端到端 order 时序断言归 S08——plan 007 D6 分层证据）
- 钉死覆盖标记（语义定谳 = settings 层，plan 007 D1）：链块双徽章（`data-dshws-chain-state=default|pinned` + 双语文案）——settings 显式在场 = 已钉死（覆盖内置默认序）；组合标量层（`searchProvider`）client 不可达，v1 不显示
- i18n 门禁两脚本（零依赖 .mjs，node 直跑）+ `pnpm check:i18n` 入门墙：`scripts/check-locales.mjs`（union/en/zh 三集合 parity，fail-loud）+ `scripts/check-cjk.mjs`（状态机剥注释→CJK 码位扫描，行号保真）；拒绝路径双证（zh 独有键 exit 1 / CJK 字面量 exit 1）
- locales 扩四键（moveUp/moveDown/chainDefault/chainPinned zh/en，19 键编译期 parity）
- 浏览器六断言（scratch 3413 主 Agent IAB 实测）：排序 UI+双徽章初始态、下移→序物化翻转+徽章翻 pinned+settings.yaml 实物落盘、reload 持久、边界复验、fetch 链独立、kill 零残留
- 测试基线 190→**202**（+12：locales 1/controller 6/section 5）；client.js 16.52→20.54 kB（node 面 49.00+21.89 与 S06 逐字节一致零漂移）
- Agent Note `docs/notes/2026-09-02-s07-priority-i18n.md`（排序物化语义/门禁脚本实录——S09 正素材）；audit-logs 3 份

**清偿（3 笔）**
- 阶段 0 新登记 🟡×2（门墙数字三载体誊写 / STATUS 总览 M4 行漏刷）：T0 清偿（`0180c95`——session-06 门墙节指针化 + STATUS ⏳→🚧）+ dont-do 第三条扩化（状态区清单七处）
- 阶段 4/5 抓获 🟡×1（~/.dsh mtime 落窗，绝对零接触主张不可证）：session-07 记录措辞处置清偿（「本棒动作零接触」+ 归属证据链：常驻 3080 实例 welcomeNoticeVersion 持久化）+ **dont-do 第四条沉淀**（隔离法证方法学）

**治理**
- 阶段 0 独立审核 S06 **PASS**（🔴0 🟡新登记×2 🟢 坐实；27 client tests 子集亲跑；原文 s07-stage0-review-of-s06.md）
- 阶段 2 两轮：轮 1 **NEEDS REVISION**（必改×1 makeSnapshot 机械配套 + 建议×5）→ 全数吸收 → 轮 2 **APPROVED**（7/7 闭合零残留，25 组锚点亲验；原文 s07-stage2-plan-review.md）
- 阶段 2.5：AskUserQuestion 未获答 → 按接力序默认批准自主推进（披露，session 记录双落）
- 阶段 4/5 **PASS / COMPLETE**（R1-R6 逐条 + 门墙七命令提交态亲跑 + node 面 cmp 逐字节取证 + 三问；原文 s07-stage45-verification.md）

**诚实标注（遗留项）**
- 覆盖标记为 settings 层语义；用户 patch 钉死单成员直连（组合标量层）GUI v1 不显示（client 观测面不含 cordis 组合层——零内核侵入约束，plan 007 D1）
- 「恢复默认序」按钮与 fetch 链排序 🟢 新登记不排期（后者 roadmap S07 仅 search 链原样）
- i18n 门禁 CI 接线缺位（本仓无 CI）——S09 手册项；IAB evaluate 合成点击路径依赖在档（locator click 挂起未解）
- M3 with-key 用户槽位不变（本棒零接触凭据面）

**跟踪（观察期）**
- 测试基线链：S05a/b 157|6(163) → S06 184|6(190) → **S07 196|6(202)**（22 files）；typecheck 双面 exit 0 / lint 0w0e 38 files / pack 五件
- 里程碑：M1 ✅ M2 ✅ **M4 ✅ 2026-09-02**；M3 🚧（余用户 with-key 回填）；M5-M6 ⏳
- dont-do：+1 条（隔离法证，累计 4 条）；下一棒 = Session 08 e2e 场景收口（loopback stub 七场景 + 顺序保持时序断言）

---

---

## 2026-09-02 — 「网页搜索」设置页骨架（Session 06，M4 第 1 棒）

**新增**
- client half 端到端交付（ADR-0006 GO 形态首次落地）：`src/client/{index,controller,section,locales}` 四件 → `lib/client.js` 16.52 kB（构建契约复刻宿主四件套：cjs + client.js + inlineDynamicImports + ModuleLoader banner；external 恰三枚 require 零 react 内联）
- manifest 三键：`exports["./client"]` + `dsh.client{platform:web, inject:[locale,ui-settings,api-remotes], external:[ui-primitives]}`（宿主读取语法 manifest.ts:196-206 亲证）
- 设置节「网页搜索」：5 provider 卡（key 输入→credentials 写通路 / StateDot 状态点 / role=switch 启停热改）+ 双链只读展示（fetchChain 项的对称扩展）+ 超时展示；ui-primitives + `--dsw-alias-*` 令牌；双语 typed dictionaries（15 键 zh/en，编译期 parity）
- 浏览器六断言（scratch 3412 agent 实测棒）：combo 200/5.1MB 含 id 注册；导航 en/zh 热切换；5 卡渲染；key 写入→Configured+服务端 refs；启停→settings.yaml 落盘；unset 复原→refs:{}
- 测试基线 163→**190**（+27：locales 3/controller 10/section 8/entry 6）；vitest.config.ts（inline ui-primitives CSS module）+ tsconfig 双面拆分
- devDeps +13（client 六包 alpha.4 含 ui-renderer〔T6 随批披露〕+ react 18 线 + types + jsdom + testing-library）；minimumReleaseAge exclude +7（pnpm 自动按预案落盘）
- Agent Note `docs/notes/2026-09-02-s06-settings-gui.md`（构建/类型面/测试基建实录——S09 正素材）；audit-logs 3 份

**清偿（1 笔）**
- 阶段 0 新增 🟢×2 观察（tgz 尺寸转录漂移 / STATUS M3 总表口径）：T0 注记 + 统一双清偿（`3e4eb50`）

**治理**
- 阶段 0 独立审核 S05b **PASS**（🔴0 🟡0；原文 docs/sessions/audit-logs/2026-09-02-s06-stage0-review-of-s05b.md）
- 阶段 2 两轮：轮 1 **NEEDS REVISION**（必改×1 + 建议×4）→ 全数吸收 → 轮 2 **APPROVED**（原文 s06-stage2-plan-review.md）
- 阶段 2.5：AskUserQuestion 未获答 → 按接力序默认批准自主推进（披露，session 记录双落）
- 阶段 4/5 **PASS / COMPLETE**（门墙亲跑零漂移 + 隔离法证 + 冒烟 27 passed；原文 s06-stage45-verification.md）

**诚实标注（遗留项）**
- 🟡×1（stage45 抓获）：section.spec 类型修复滞留工作区自 T6、提交态门墙 exit 2——`899e2fd` 补提交清偿 + 提交态门墙亲跑全绿后收官
- 🟢 在档：react devDep 锚 ^18.3.1（D6 原声明 ^18.2.0，18 线内全绿）；tsdown 弃用警告 ×2（S09 迁移）；vitest 对 ui-primitives sourcemap 警告；settingsScope/store 机制未用（S07 再评估）；IAB locator click 挂起（evaluate 合成点击路径在档）；boot `--no-open` 未加致默认浏览器打开一次（无害，stage45 评估 🟢）
- M3 with-key 用户槽位不变（本棒零接触）

**跟踪（观察期）**
- 测试 22 files / 184 passed | 6 skipped (190)；typecheck 双面 exit 0；lint 0w0e 38 files；build 49.00+21.89+16.52 kB；pack 五件
- dont-do 维持 3 条（本棒零新增；T9 抓获的「提交态门墙」教训入 session 踩坑节，未达系统性门槛）
- 下一棒：Session 07（优先级排序 + 覆盖标记 + i18n）

---

---

## 2026-09-02 — 安装端到端 + 卸载复原（Session 05b，M3 收官棒·机械面）

**新增**
- 安装端到端实测（scratch 隔离配方 D1）：tarball 交付（16644B）→ `dsh plugin --profile web add` → 三处落盘（dependencies 翻 `file:` tarball / `dsh.profile.bundles` 自动追加 / dump 组合树 insert 行生效）；auto-scaffold（`PROFILE_TEMPLATES` web 模板）首命令即完成
- 接线实测：用户层两行 patch（`web` 行 `searchProvider: dshws-chain` / `fetchProvider: dshws-chain-fetch`）→ `--dump-config` 组合树标量翻转（dump-wired.yml:352-353）
- 卸载复原实测：`dsh plugin remove`（bundles reconcile 回模板，与宿主 plugin.ts:81-84 splice 预注册一致）+ 删两行 → dump 与安装前基线 **diff 零输出**（逐字节一致）
- boot 加载证明：scratch 实例（3411，非 3080）日志零 load 错 + HTTP 401 token 健康态 + kill 零残留
- **manifest 缺陷发现与修复**（`fdffe9e`）：`dsh.bundle.patch` 平铺顶层键 → 嵌套 `{"dsh":{"bundle":{"patch":…}}}`（宿主读取语法 profile.ts:832-834；平铺键从未被读取，缺陷潜伏 S03-S05a 三棒，由本棒安装实测暴露）
- dont-do 第三条：收官序列 progress 状态区刷新义务（三次家族复发 + 本棒第 4 实例，「替换而非追加」）
- Agent Note `docs/notes/2026-09-02-s05b-install-runbook.md`（安装/接线/卸载精确命令 + 嵌套键症状 + 用户槽位四步——S09 手册正素材）；audit-logs 3 份（token 脱敏）

**清偿（1 笔）**
- 阶段 0 新增 🟡×1（Y-1 progress-M3 状态区未随收官刷新，家族第三次复发）：T0 清偿（`19587ef`）；清偿自身引入重复 M3 行（家族第 4 实例）经阶段 2 轮 1 抓获修正（`65ac837`）—— dont-do 第三条顺势沉淀系统性防线

**治理**
- 阶段 0 前序审核（独立 general-purpose Agent，骨架库 v2，四维实测）：S05a **PASS**（🔴×0；🟡×1 Y-1 → T0 清偿 + dont-do 沉淀）
- 阶段 2 计划审核（独立 general-purpose Agent）：轮 1 **NEEDS REVISION**（必改 ×3 + 建议 ×5）→ 全数吸收 → 同 Agent 复审 **APPROVED**（残项 1 锚点行号 → `2926723`；代核 remove reconcile 源码语义）
- 阶段 2.5 人工终审：**用户真实批准**（「批准，自主执行到底」——AskUserQuestion 获答，S03 以来首次非默认推断）
- 阶段 4/5：独立 Agent 验证 **R1-R4 全 PASS + R5 子①② PASS + COMPLETE**（门墙四命令亲跑零漂移 + 隔离法证（`~/.dsh` 本棒时间窗零写入）+ 冒烟重放与 dump-wired 逐字节互证；观察 ×5 全 🟢）
- 分支纪律落地：开发在 `feat/s05b-install-e2e`，`--no-ff` 合入 master

**诚实标注（遗留项）**
- **M3 行保持 🚧**：机械面 ✅（安装/接线/复原/boot/隔离审计全过）；余用户 with-key 槽位（`web_search` 真实结果 + `[served-by:]` 首行）——指引 `docs/notes/2026-09-02-s05b-install-runbook.md` §4，S10/M6 同构，S06 不阻塞
- L-2 🟢（per-profile GUI 二期）不变——唯一在册 🟢 债务
- firecrawl fetch 面无独立 402/429 it（双面共用 #parse）——🟢 观察在档
- `pnpm pack --dry-run` 在 pnpm 11.7.0 不可用（审核以 npm pack 等价核验）——S09 手册须知
- scratch home 保留于 /tmp/dshws-s05b/home（用户槽位现场；易失，重建序列在 runbook §1）

**跟踪（观察期）**
- 测试基线链：47（S03）→ 93|2（S04）→ 157|6（S05a）→ **157 passed | 6 skipped（163；18 文件）零漂移**（本棒漂移哨兵口径——manifest 修复仅触 pack 面）；typecheck 0 error；lint 0w0e（30 files）；build 70.89 kB
- dont-do 新增 1 条（收官状态区刷新，累计 3 条）；里程碑：M3 🚧 机械面收官；下一棒 Session 06（「网页搜索」设置页骨架）

---

---

## 2026-09-02 — exa/perplexity/firecrawl + settings 热改（Session 05a，M3 第 3 棒）

**新增**
- `dshws-exa` 成员（`730ef40`）：`POST /search` + highlights→snippet，无可用 snippet 条目丢弃（上游同构重实现，ADR-0003；numResults 三态映射——request.maxResults 优先/配置回退/皆缺省省略）
- `dshws-perplexity` 成员（`d4842a1`）：OpenAI 兼容 `POST /chat/completions`（sonar），生成答案承载 `content`（五成员中唯一），sources 优先 `search_results[]`、citations 仅缺席兜底
- `dshws-firecrawl` 成员（`9a4eb74`）：**单类双接口**（search + scrape 同 key 同 gate）；v2 线格式（`/v2/search` `data.web[]` 分组、`/v2/scrape` markdown→text kind、statusCode 透传页面自身状态）；`success:false` 双面防御；官方文档 2026-09-02 取证
- settings 热改通路（`e8e86e6`/`458c6c1`）：`LiveResolvedConfig`（setSource/refresh 重跑 resolveConfig）+ `attachSettingsSection` 条件注入（缺 settings 服务回退 cordis.yml 静态配置）；**链序/超时/启停三面热生效**——热改链序下次搜索生效（exhausted 摘要记录实际走查序翻转实测）、timeout 热读、enabled gate 翻转；真实 SettingsProvider seam 测试（attach→update→detach fallback 全链）
- D7 壳透传修正（`458c6c1`）：`ChainOptions` 移除零消费的 id 契约面 + 两壳不再 spread options——**对象展开是 getter 冻结点**（阶段 2 审核 M-1 抓获），热路径对象按引用传递
- `providers/shared.ts`（`f00f133`）：成员共享机械脚手架（取消三件套/正整数/错误体展开/凭据解析包装），deepseek/tavily 切换；只函数不类层次
- 错误码全五族对象形收口（`7922597`）；Config 冷热字段 JSDoc 逐字段标注（`a0d6f00`）；架构 §3 模块树同步
- e2e real 三文件自跳（`8a9bc99`：exa/perplexity 各 1 + firecrawl 双面 2）；Agent Note `docs/notes/2026-09-02-s05a-settings-hot-path.md`；audit-logs 3 份

**清偿（2 笔）**
- L-1 🟢（deepseek/exa/perplexity/firecrawl 插件内重实现）：**全清**——deepseek S04，exa/perplexity/firecrawl 本棒 T3/T4/T5；tavily 属 S04 既定范围
- S04 观察级（错误脚手架近复制）：T1 shared.ts 提取清偿，`f00f133`
- 另：阶段 4 F-1（台账 .d.ts 数字测改时序漂移）T10 修正留痕；阶段 0 观察（S03 R 表标题）T0 修正

**治理**
- 阶段 0 前序审核（独立 general-purpose Agent，骨架库 v2，四维实测）：S04 **PASS**（🔴×0；🟡×0 新增；`--no-ff` 双 parent 实证）
- 阶段 2 计划审核（独立 general-purpose Agent）：轮 1 **NEEDS REVISION**（M-1 getter 冻结 / M-2 e2e 宪法遗漏 / S-1..S-6）→ 全数吸收 → 同 Agent 复审 **APPROVED**（残项 2 项转执行落实；代核 ChainCore 对 options.id 零消费）
- 阶段 2.5 人工终审：AskUserQuestion 未获答，按接力序取默认批准项自主推进（披露于 session-05a 记录）
- 阶段 4/5：独立 Agent 验证 **PASS / COMPLETE**（R1-R5 逐条 file:line 对峙 + 门墙四命令亲跑 + 安全/契约/前瞻三问 COMPLETE + /tmp 驱动 lib/index.js 冒烟 13/13；F-1 台账数字修正义务抓获并清偿）

**诚实标注（遗留项）**
- L-2 🟢（per-profile GUI 覆盖二期）不变——唯一在册 🟢 债务
- firecrawl fetch 面无独立 402/429 it（双面共用 #parse，search 面已钉同一代码）——🟢 观察级
- firecrawl v2 线格式取证时点 2026-09-02，漂移风险已容错（缺字段缺省 + success:false 防御），升级演练归 S09 手册
- 设置冷字段（baseURL/model/maxTokens/maxResults/numResults/apiKeyEnv）launch-static——settings 改动下次启动生效，Config JSDoc 逐字段标注；GUI 归 S06/S07

**跟踪（观察期）**
- 测试基线链：47（S03）→ 93 passed | 2 skipped（S04）→ **157 passed | 6 skipped（163；18 文件）**（skip = 真实 API 无 key 自跳）；typecheck 0 error；lint 0w0e（30 files，96 rules）；build lib 70.89 kB（js 49.00 + d.ts 21.89）
- dont-do 新增 0 条（累计 2 条）；里程碑：M3 🚧 第 3 棒完成（余 S05b 收官棒）；下一棒 Session 05b（安装端到端 + 卸载复原）

---

---

---

## 2026-09-02 — deepseek/tavily provider + 凭据接线（Session 04，M3 第 2 棒）

**新增**
- `dshws-deepseek` 成员（`af3d9b7`）：Anthropic 兼容 Messages + `web_search_20250305` 工具重实现（上游 id 撞名不可复用，ADR-0003；线格式对齐 upstream provider.ts——端点/model/apiVersion/maxTokens/maxUses/双 auth 头/结果块映射/去重，锚点见 Agent Note §5）
- `dshws-tavily` 成员（`9d0d61e`）：`POST /search` + Bearer；`max_results` 透传不 clamp（>20 由 API 4xx → HTTP_ERROR，与上游 exa 同构）；results[]→sources 容错映射；官方 API reference 2026-09-02 取证
- 凭据接线 `src/credentials.ts`（`2a5e3ad`）：CredentialGate——describe 缓存（未 describe = 未就绪，不说谎）+ `credentials/reference-updated` 事件命中重 describe + describe 抛错容错 + ref 语法校验 fail-loud；key 每操作经 credentials 服务解析，provider/gate 均零持有零缓存 key 值
- 假面替换（`b351d42`）：MemberRegistry 增 gates（enabled/credentialsReady 热读，resolve 时点取值）——S03 常量 true 假面移除，S05a settings 热改只需换 gate 指向，注册结构与链核零改动
- apply 接线（`b8a6755`）：inject 增 `credentials`；双成员双注册（ctx.web 直连拓扑 + registry 带 gate）；ref 预校验同步 fail-loud；**凭据热刷新端到端**（写 ref→事件→chain.available() 翻转双向）——宪法必测挂账 V-05 落实
- 错误码族（`351bc6f`）：MEMBER_ERROR_CODES deepseek/tavily 两族换五键对象形（credentialMissing/requestFailed/httpError/badResponse/aborted），三族留前缀待 S05a 同口径换形
- 真实 API e2e 自跳（`8815edd`）：tests/e2e.real/ 双文件（key 经 env-backed resolve thunk，与生产同 seam；无 key 自跳实测 2 skipped）
- Agent Note `docs/notes/2026-09-02-s04-credentials-wiring.md`（gate 三态与事件边界/假面替换形态/S05a 注册传 gate 义务/错误码换形口径/重实现锚点/tavily 取证）；audit-logs 3 份（阶段 0/2/4-5 输出原文）

**清偿（3 笔）**
- 阶段 0 新增 🟡×1（progress-M3 状态区未随收官刷新）：T0 清偿，commit `4fc4187`
- S03 假面 🟢（toResolver 恒 enabled/ready）：T1 gates 热读替换，commit `b351d42`
- L-1 部分 🟢（deepseek 插件内重实现）：T4 交付（余 exa/perplexity/firecrawl 归 S05a），commit `af3d9b7`
- 另：V-05 挂账注销（凭据热刷新，T6 `b8a6755`）；F-1 收尾义务（pnpm-workspace.yaml 残留）`b38cdf9`

**治理**
- 阶段 0 前序审核（独立 general-purpose Agent，骨架库 v2，四维实测）：S03 **PASS**（🔴×0；新增🟡×1 → T0 清偿；观察级×2 之一本棒吸收——合入改 `--no-ff`）
- 阶段 2 计划审核（独立 general-purpose Agent）：轮 1 **NEEDS REVISION**（M-1 T2 形状未定案+既有断言必红无预案；S-1..S-4 建议；O-1..O-3 观察）→ 全数吸收 → 同 Agent 复审 **APPROVED**（批准性修正 3 处随批落盘；T7 验证类豁免分类确认）
- 阶段 2.5 人工终审：AskUserQuestion 未获答，按接力序取默认批准项自主推进（披露于 session-04 记录）
- 阶段 4/5：独立 Agent 验证 **PASS / COMPLETE**（R1-R4 逐条 file:line 对峙 + 全量 95 条与四命令亲跑逐位一致 + 安全/契约/前瞻三问 PASS + /tmp 脚本驱动 lib/index.js 冒烟 12 断言 SMOKE PASSED；F-1 一项前置义务抓获并清偿）
- 分支纪律落地：开发在 `feat/s04-providers-credentials`，`--no-ff` 合入 master（merge commit 留痕，吸收阶段 0 观察级）

**诚实标注（遗留项）**
- L-1 余 🟢（exa/perplexity/firecrawl 三族）归 S05a；L-2 🟢（二期）不变
- 两 provider 错误脚手架 ~40 行近复制——S05a 第三族落地时提取候选（阶段 4/5 观察）
- T3/T4/T5 红证据为模块缺失型（测试先行的合法红，弱于行为红，如实记录）
- 设置热改（enabled gate 指向 settings）归 S05a installSection；安装端到端归 S05b；GUI 归 S06/S07；S08 loopback 直连收口

**跟踪（观察期）**
- 测试基线链：47 条（S03）→ **93 passed | 2 skipped（95；11 文件）**（skip = e2e real 无 key 自跳）；typecheck 0 error；lint 0 warning 0 error（18 files，96 rules）；build lib 42.74 kB（js 29.55 + d.ts 13.19）
- dont-do 新增 0 条（累计 2 条）；里程碑：M3 🚧 第 2 棒完成（余 S05a/S05b）；下一棒 Session 05a（exa/perplexity/firecrawl + settings 节）

---

---

---

## 2026-09-02 — 插件宿主骨架 + 链式 meta-provider（Session 03，M3 第 1 棒）

**新增**
- 正式包骨架 `dsh-websearch@0.1.0`（`35969f0`）：package.json 按 ADR-0007（exports["."] 三键形态 / files / `dsh.bundle.patch` 键 / peer 域 cordis `>=4.0.1-rc.1 <5` + dsh-web `>=0.1.2-alpha.3 <0.1.3` / dep schemastery `>=3.18.1-rc.1 <4` / devDeps 按 dont-do 双实锚实钉）；tsdown esm+dts（outExtensions 钉 `.js`/`.d.ts`——默认 `.mjs`/`.d.mts` 与 exports 不符，实测修正）；cordis.patch.yml（insert 插件行，web 行标量覆盖留用户层）
- 链核 `src/chain/core.ts`：泛型编排 ChainCore（选择级跳过/运行降级/超时预算/全败摘要/日志一处实现）+ `dshws-chain`/`dshws-chain-fetch` 双薄壳 + MemberRegistry 双注册直连拓扑；归因定稿 D2（search content 首行 `[served-by: <id>]` 两形态）+ D3（fetch 仅日志，body 零注入）
- `src/errors.ts`：DSHWS_ 码清单（链级 3 码 + 五族成员命名空间）+ DshwsError + 全败摘要构造（cause=末位抛错）；`src/config.ts`：架构 §5 全字段 schema + resolveConfig 显式默认化（空链→内置序 tavily→exa→perplexity→firecrawl→deepseek / timeout 30000）
- apply 装配：Config→resolveConfig→双链注册 ctx.web + `ctx.logger.info` 日志接线；`ctx.web` 增强、schemastery 可调用归一化、cordis logger 三处 npm 发布面 API 实证
- Agent Note `docs/notes/2026-09-02-s03-chain-core-design.md`（链核 port/假面义务/归因定稿/构建契约事实）；progress-M3 台账（首个测试基线 47 条建立）

**清偿（2 笔）**
- 前序审核新增 🟡×3（progress-M1 M2 行镜像失同步 / R1「8 行」计数誊写 / V-03/V-04 收官留痕缺口）：T0 清偿，commit `c691caa`
- L-3 🟢（spike 脚手架不入库，正式骨架重建）：T1 正式包骨架落库，`35969f0`

**治理**
- 阶段 0 前序审核（独立 Explore Agent，骨架库 v2，四维实测）：S02 **PASS**（🔴×0；新增🟡×3 流程卫生债 → T0 同棒清偿）
- 阶段 2 计划审核（独立 general-purpose Agent）：轮 1 **NEEDS REVISION**（F-001 分支纪律 / F-002 链 available() 缺测 / F-003 六件套漏踩坑沉淀；F-004..F-008 🟢）→ 全项修订 → 同 Agent 复审 **APPROVED**（T1/T2 机械豁免类别确认成立）
- 阶段 2.5 人工终审：AskUserQuestion 未获答，按接力序取默认批准项自主推进（披露于 session-03 记录）
- 阶段 4/5：独立 Agent 验证 **PASS / COMPLETE**（R1-R5 对峙 + 全量 47 测试与四命令亲跑复现 + 变异判别力独立复现 + 安全/契约/前瞻三问 CLEAN；V-01..V-06 全 🟢 已逐条落 progress-M3 台账）
- 分支纪律落地：开发在 `feat/s03-host-skeleton`（阶段 4/5 PASS 后合入 master，AGENTS.md 首次代码棒执行）

**诚实标注（遗留项）**
- L-1 🟢（S04/S05a）/ L-2 🟢（二期）归属不变；L-3 已清偿
- MemberRegistry.toResolver() 恒 enabled/ready 为 S03 假面——S04 接 credentials describe + 事件刷新时必须替换（Agent Note §2 义务）
- 凭据热刷新未测（roadmap/plan 显式移 S04）；调用方 abort × 成员超时同窗竞争时序归 S08 e2e（plan 风险节）
- 安装端到端（dsh plugin add + patch 两行）归 S05b；本棒无 scratch profile / 实例启动

**跟踪（观察期）**
- 测试基线链：**47 条（6 文件）全绿**（本仓首个基线）；typecheck 0 error；lint 0 warning（oxlint 96 rules）；build lib 20.34 kB
- dont-do 新增 0 条（累计 2 条）；里程碑：M3 🚧 第 1 棒完成；下一棒 Session 04（deepseek/tavily provider + 凭据接线）

---

---

---

## 2026-09-02 — 可行性 spike 五假设定谳（Session 02，M2 可行性定谳）

**新增**
- 五假设 scratch 实测全成立（一次性 spike 包 `dsh-websearch-spike` @ `/tmp/dshws-s02-spike/`，不入库）：H1 外置 client half 分发/slot/locale/remote 全链 GO（combo 分发 200 + 设置页 en/zh 热切换渲染 + 细粒度 inject 契约 fail-loud 实证）；H2 `dsh plugin add` 本地目录 + tarball 双形态三处落盘（dependencies / `dsh.profile.bundles` 自动追加 / patch 接线）；H3 installSection describe/mutate 热改（revision 0→1 + 服务端 onChange + settings.yaml 持久化跨重启）；H4 credentials set→describe(source:file)→reference-updated 事件→unset 回落全链；H5 交付形态定谳
- ADR-0006：GUI 外置 client half **GO**（fallback 不启用，S06/S07 原目标执行）+ client bundle 构建契约实测结论（独立 tsdown：cjs + `__ModuleLoader__.load` banner + `entryFileNames:'client.js'` + inlineDynamicImports + 模块表外部面）
- ADR-0007：包名 `dsh-websearch`（npm 未占用实测）/ 独立 `0.1.0` 版本线 / 路径+tarball 交付（npm publish 延后 M6 后）/ 依赖只钉 npm 已发布稳定核心面
- S02 计划契约 `docs/plans/2026-09-02-002-s02-spike-plan.md`；progress-M2 台账；dont-do 第 2 条（npm latest dist-tag 失真）
- spike 全程 scratch 隔离（`DSH_HOME=/tmp/dshws-s02-spike/home`、profile=`web`、端口 3410、真实 `~/.dsh` 与 3080 实例零接触、凭据仅伪值且 unset 复原）

**清偿（1 笔）**
- S01-🟡-1（R1 占位符证据数字口径不可复现）：progress-M1 R1 行改逐行枚举口径（命令原文 + 8 行性质枚举），commit `410d58f`

**治理**
- 阶段 0 前序审核（独立 Explore Agent，四维实测）：S01 **PASS**（🔴×0；🟡×1 → T0 清偿；🟢×2 备注）
- 阶段 2 计划审核（独立 general-purpose Agent）：轮 1 **NEEDS REVISION**（F-001 🔴 非模板 profile 无 web 面 / F-002、F-003 🟡 / F-004..F-009 🟢）→ 全项修订 → 同 Agent 复审 **APPROVED**
- 阶段 2.5 人工终审：用户批准（2026-09-02，「批准，自主执行」）
- 阶段 4/5：独立 Agent 验证（R1-R5 对峙 + 一致性 + 安装链重放冒烟，结论见 progress-M2 阶段验收表）

**诚实标注（遗留项）**
- L-1 🟢（S03-S05）/ L-2 🟢（二期）归属不变；L-3 🟢 新增：spike 脚手架不入库，S03 按 ADR-0006/0007 结论重建正式骨架
- npm 发布面滞后 dev 树（`installSettingsSection` 等便利导出不在 npm alpha.3/.4）——插件依赖只钉稳定核心面，需要新 API 时须先确认进入 npm 发布线
- combo-only 分发（单包 URL 404）为上游当前实现形态，升级演练手册（S09）需覆盖
- M6 上游实测由用户择机执行（S10 备清单与环境）

**跟踪（观察期）**
- 测试基线链：无（spike 类不建基线）→ 首个基线 S03 建立
- dont-do 新增 1 条（latest dist-tag 失真，累计 2 条）；里程碑：M2 ✅（本条目）；下一棒 Session 03（插件宿主骨架 + 链式 meta-provider）

---

---

---

## 2026-09-02 — 项目立项与治理 bootstrap（Session 01，M1 治理与规划定稿）

**新增**
- 项目立项：独立目录 `/Volumes/IPFSJK/Zcode/dsh-websearch`（git master），零内核侵入外挂式统一 WebSearch 管理插件
- 规划产物四件套：`AGENTS.md` 项目宪法 / `docs/00-architecture.md` 架构正本（高可用链语义规范 + 五 provider + `dshws-` id 前缀）/ `docs/session-roadmap.md`（S01-S10，M1-M6）/ `docs/decisions/adr-0001..0005`（commit `7d5eadc`，修订 `2f7ac3a`，收尾 `2c70bc8`）
- 治理套件安装：`.session-start` / `docs/governance-sessions.md`（§3.1.1/§3.4 保号）/ `docs/STATUS.md` / `docs/progress/progress-M1.md` / `docs/_templates/`×4 / `docs/dont-do.md`

**清偿（0 笔）**
- 无（首轮无存量债务；🟢 新登 2 笔见下）

**治理**
- 阶段 2 计划审核：NEEDS REVISION（F-001..F-019，含 🔴×3：cordis 版本域 / credentials 事件名 / servedBy 承载字段）→ 修订 → 同 Agent 复审 **APPROVED** → 收尾 R-001..R-003 已修
- 阶段 2.5 人工终审：用户批准（2026-09-02，指令节引：「请使用 session-governance 正式接管websearch 项目开发，确保项目高可用/高质量标准可交付」）
- 阶段 0：bootstrap 首棒，无前序 session（规划独立审核代行 gate）

**诚实标注（遗留项）**
- L-1 🟢：deepseek/exa/perplexity 在插件内重实现（上游注册表私有不可枚举），归属 S03-S05（ADR-0003）
- L-2 🟢：per-profile GUI 覆盖二期候选不排期，profile 级差异走 YAML patch（ADR-0004）
- S02 spike 五假设（外置 client half slot 注入 / 安装链路 / installSection 通路 / credentials 写通路 / 交付形态）未经实测——ADR-0006/0007 待 S02 定谳
- M6 上游实测由用户择机执行（S10 备清单与环境）

**跟踪（观察期）**
- 测试基线链：无（纯文档批，无产品代码）→ 首个基线在 S03 建立
- dont-do 新增 1 条（peer 版本域实测）；pitfalls 命中：无（首轮未查库，S02 起进入侧必读）
- 里程碑：M1 ✅（本条目）；下一棒 Session 02（Spike）
