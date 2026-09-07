# STATUS — dsh-websearch 进度单点看板

> **用途**：回答三个问题的**唯一权威**文件——「现在做到哪了」「下一个 session 做什么」
> 「活跃债务有哪些」。人工可读优先：一行一棒、指针下钻，不堆审计细节。
>
> **单源规则**：本文件是「现在到哪」的唯一权威；roadmap 是任务源（每棒 WBS/验收细节），
> progress 是台账细节（债务/已验锚点），两者的状态表述以本文件为准。状态唯一写入点：
> ① session 启动时——台账新增本棒行（🚧）+ 当前位置块刷新；② 阶段 6 原子收尾——本文件
> 台账行 ✅ + 当前位置块刷新 + roadmap 同行 ✅，三者同一收尾动作内完成，**禁止在任何工件
> 尚未落盘时提前预写收官状态**。
>
> **受控词表**：阶段/里程碑名称只能使用下方「里程碑总览」登记的名称；新增/改名走 ADR 级
> 变更并同步全部引用。session 记录「当前项目状态快照」的「当前阶段」字段必须使用词表项。
>
> **悬空引用规则**：本文件（及 progress/roadmap）的收官条目只能引用**已存在**的文件；指向
> 尚不存在文件的前瞻表述只能由生成该文件的 session 自己在其记录/接力指令中给出，且须标注
> 🚧 生成中。

## 里程碑总览（受控词表 + 状态）

| 里程碑 | 可验证定义 | 状态 |
|---|---|---|
| M1 治理与规划定稿 | 治理产物齐备且占位符清零，计划过独立审核与人工终审 | ✅ 2026-09-02 |
| M2 可行性定谳 | GUI 形态、安装链路、交付形态有实测结论，ADR-0006/0007 定稿 | ✅ 2026-09-02 |
| M3 宿主包完备 | 五 provider + 链 + 凭据/设置全绿，安装端到端可复现 | 🚧（机械面 ✅ S03-S05b；余用户 with-key 槽位回填——不阻塞 S12） |
| M4 设置页完备 | GUI 全流程（配 key→启停→排序→热生效）浏览器实测通过 | ✅ 2026-09-02（S06 配 key/启停 + S07 排序 = 浏览器六断言；热生效 = S05a 实测 + S07 热链序回归，复合证据 plan 007 D6） |
| M5 交付就绪 | e2e 收口全绿，文档自洽可复现 | 🚧（e2e 收口腿 ✅ 2026-09-02 S08；文档腿 S15——2026-09-04 用户重排编号，原 S12 顺延） |
| M6 上游验收通过 | 用户在上游全新构建上完成验收清单 | ⏳（准备棒 = S16，2026-09-04 重排编号） |
| M7 功能扩展 | 每成员多 APIKEY 池 + anysearch 第六成员 + 设置页 UI/UX 对齐 + session 溯源徽标（ADR-0008〔superseded→0011〕/0009/0010/0011/0012）+ 装即接管（ADR-0013） | ✅ 2026-09-06（S09-S14 + S14a 插行全收官；证据 = 徽标浏览器亲见 + 宿主零 diff + 装卸三态 dump + 各自 stage45 PASS/COMPLETE） |

## Session 台账（一行一棒）

| Session | 日期 | 一句话目标 | 状态 | 关键交付（指针） | 债务增减 |
|---|---|---|---|---|---|
| 01 | 2026-09-02 | 治理套件安装 + 架构/WBS 定稿过审 | ✅ | docs/sessions/2026-09-02-session-01.md（规划四件套 + 治理套件安装 + 两轮审核 APPROVED） | 🟢+2 |
| 02 | 2026-09-02 | Spike：外置 client half + 安装链路 + 交付形态定谳 | ✅ | docs/sessions/2026-09-02-session-02.md（五假设全定谳 + ADR-0006/0007 + 阶段 2 两轮审核 APPROVED） | 🟡-1（T0 清偿 `410d58f`）🟢+1（L-3） |
| 03 | 2026-09-02 | 插件宿主骨架 + 链式 meta-provider | ✅ | docs/sessions/2026-09-02-session-03.md（包骨架 ADR-0007 + 链语义 8 项红→绿 + fetch 同构；阶段 2 两轮审核 APPROVED；阶段 4/5 PASS/COMPLETE） | 🟡+3→0（T0 清偿 `c691caa`）🟢-1（L-3 清偿 `35969f0`） |
| 04 | 2026-09-02 | deepseek/tavily provider + 凭据接线（S03 假面替换） | ✅ | docs/sessions/2026-09-02-session-04.md（双 provider + CredentialGate + 假面替换 + 热刷新端到端；阶段 2 两轮审核 APPROVED；阶段 4/5 PASS/COMPLETE） | 🟡+1→0（T0 清偿 `4fc4187`）🟢-2（假面 `b351d42`、L-1 deepseek 半清偿 `af3d9b7`） |
| 05a | 2026-09-02 | exa/perplexity/firecrawl 三 provider + settings 节 | ✅ | docs/sessions/2026-09-02-session-05a.md（五成员收编 L-1 全清 + settings 热改链序/超时/启停 + D7 壳透传修正；阶段 2 两轮审核 APPROVED；阶段 4/5 PASS/COMPLETE） | 🟢-1（L-1 全清 `730ef40`/`d4842a1`/`9a4eb74`） |
| 05b | 2026-09-02 | 安装端到端 + 卸载复原（M3 收官棒） | ✅ | docs/sessions/2026-09-02-session-05b.md（安装/接线/复原三态 dump 对照 + boot 加载 + 隔离审计；**发现并修复 manifest 平铺键缺陷**；阶段 2 两轮审核 APPROVED + 用户真实批准；阶段 4/5 PASS/COMPLETE） | 🟡+1→0（Y-1 T0 清偿）+ dont-do 第三条沉淀 |
| 06 | 2026-09-02 | 「网页搜索」设置页骨架 | ✅ | docs/sessions/2026-09-02-session-06.md（client half 端到端：构建契约 + 5 provider 卡 + 双链只读 + 浏览器六断言；阶段 2 两轮审核 APPROVED + 阶段 4/5 PASS/COMPLETE 含 🟡 提交态清偿；基线 184\|6(190)） | 🟡+1→0（stage45 抓获提交态不自洽，`899e2fd` 清偿）🟢 观察×4 注记 |
| 07 | 2026-09-02 | 优先级排序 + 覆盖标记 + i18n | ✅ | docs/sessions/2026-09-02-session-07.md（搜索链排序写 settings + 钉死覆盖标记（settings 层 D1）+ check:i18n 门禁两脚本 + 浏览器六断言；阶段 2 两轮审核 APPROVED 7/7 + 阶段 4/5 PASS/COMPLETE；M4 ✅） | 🟡+2→0（阶段 0 登记，T0 `0180c95` 清偿）+🟡+1→0（~/.dsh 口径，记录措辞处置 + dont-do 第四条）🟢 新登记×2（fetch 排序/恢复默认） |
| 08 | 2026-09-02 | e2e 场景收口 | ✅ | docs/sessions/2026-09-02-session-08.md（loopback 七场景 + 到达序/摘要/署名断言 + 链级真实 API smoke 自跳；阶段 2 两轮审核 APPROVED + **阶段 2.5 用户真实批准** + 阶段 4/5 PASS/COMPLETE；src 零变更兑现；M5 e2e 腿 ✅） | 🟡+1→0（assemble 泄漏缺口，T8 加固清偿）+🟡 lint warning（T1 残留，T6 门墙抓获清偿） |
| 09 | 2026-09-03 | 多 APIKEY 池 + 选择策略 | ✅ | docs/sessions/2026-09-03-session-09.md（extraApiKeyEnvs 多 ref 池 + keySelection 三策略 + wire 级轮换实证 + GUI 多 key 列表 + settings 热通路；阶段 2 两轮审核 APPROVED + 阶段 4/5 PASS/COMPLETE；provider 零改动兑现） | 🟡+1→0（阶段 0 抓获 roadmap M5 尾注漏刷，T0 穷举清偿）+🟡+1→0（T10 抓获台账算术 +30→+34，T11 更正）+🟢×3 注记 |
| 10 | 2026-09-03 | anysearch 第六成员 | ✅ | docs/sessions/2026-09-03-session-10.md（信封规格 HTTP 自实现 + content→snippet 补映射 + BUILT_IN 尾部追加 + 第 6 卡 + 池化自动享用 + 共存语义在档；阶段 2 **三轮**审核 APPROVED + 阶段 4/5 PASS/COMPLETE） | 🟡+1→0（门墙表 lint files 45→47 转录勘误，T10 清偿）+🟢 新登记（anysearch fetch 面 v1 不做） |
| 11 | 2026-09-03 | 验收反馈调整（开关置灰 + 单槽逗号值 + 过滤未配置） | ✅ | docs/sessions/2026-09-03-session-11.md（reconstructed 补落 2026-09-04；ADR-0011 改判 + 开关置灰 + 过滤 + 可见序列交换 + keyFieldNote；技术面全绿经 S12 阶段 0 复核亲证；收官证据链缺口由 S12 修复批闭合） | S12 阶段 0 审定 **BLOCKED**（🔴×2 收官证据链 + 🟡×9）——🔴/🟡 全部由 S12 T0/T3/T5/T7/T8 认领闭合 |
| 12 | 2026-09-04 | 设置页 UI/UX 对齐（用户反馈四项）+ S11 治理修复批 | ✅ | docs/sessions/2026-09-04-session-12.md（四项 ⓘ hover/开关色/品牌名+边界/默认序说明 + S11 记录补落/roadmap 重排/案卷闭合；阶段 2 两轮 APPROVED + 2.5 第 4 次 + 阶段 4/5 PASS/COMPLETE） | 承接 S11 🔴×2+🟡×9 全清偿（T8 复验闭合）；新抓获 🟡×3（T8 记录类）T9 勘正；🟢 维持 |
| 12a | 2026-09-04 | 设置页布局系统性重构（用户二轮反馈四点） | ✅ | docs/sessions/2026-09-04-session-12a.md（成员卡纵向结构/输入独占行/hint 格式化文案/链区块未配置隐藏/紧凑链卡/fetchChain 展示移除/页头 intro；阶段 2 两轮 APPROVED + 2.5 第 5 次 + 阶段 4/5 PASS/COMPLETE） | 二轮反馈 🟡×1 全清偿；T5 抓获 🟡×2 记录类 T6 勘正；新登记 🟢×2 |
| 12b | 2026-09-04 | 设置页信息收敛 + DeepSeek 双配置澄清（用户三轮反馈） | ✅ | docs/sessions/2026-09-04-session-12b.md（页头单图标/DeepSeek 澄清 badge/两级调用逻辑文档化 + S13 移交；阶段 2 两轮 APPROVED + 2.5 第 6 次 + 阶段 4/5 PASS/COMPLETE） | 三轮反馈 🟡×2 全清偿；T5 抓获 🟡×1 T6 补守卫 |
| 13 | 2026-09-04 | 优先级策略棒：ADR-0012 定谳 + keySelection GUI 控件 + 两级调用顺序说明 UI | ✅ | docs/sessions/2026-09-04-session-13.md（ADR-0012 变体 B 不放回随机〔升序 Fisher-Yates〕+ 成员卡三段控件 + 两级语义 hint；阶段 2 两轮 APPROVED + 2.5 默认批准披露 + 阶段 4/5 PASS/COMPLETE + 🟡×1 清偿复验 CONFIRMED） | 承接 🟡×1（记录缺节）T0 清偿；T6 抓获 🟡×1（sameMultiset）当场清偿复验 CONFIRMED；🟢+1（钉牌断言缺口→S14/S15） |
| 14 | 2026-09-06 | fetch 兜底调研 + session 溯源徽标（ADR-0010 落地） | ✅ | docs/sessions/2026-09-06-session-14.md（toolview 接管 priority -1 + 自绘同构卡两级回退 + fetch/余额 v2 调研注记 + 钉牌断言清偿；阶段 2 单轮 APPROVED + 2.5 默认批准披露 + 阶段 4/5 PASS/COMPLETE；**M7 收官棒**） | 🟢 清偿×2（dont-do webview 家族入册 T0 / 钉牌断言 T2）；🟢 新登记×1（badge 超长 id 观察） |
| 14a | 2026-09-06 | 装即接管 web_search（插行棒，ADR-0013） | ✅ | docs/sessions/2026-09-06-session-14a.md（随包 patch 钉 search / fetch 留 http / remove 单命令复原 / 用户层终裁；方向 = 用户裁定 B + ExitPlanMode 批准 + 阶段 4/5 PASS/COMPLETE 含独立重演） | 🟡 清偿×1（L-2 缺项勘注 T0）；🟢 新登记×2 观察（AMBIGUOUS 语义精化/发版清单实体） |
| 14b | 2026-09-06 | DeepSeek 兜底行重构 + 审计修复（插行棒，用户产品裁定） | ✅ | docs/sessions/2026-09-06-session-14b.md（兜底行 ⓘ+付费开关+无 key 面 + 链块两修复 + 错误文案纠偏 + architecture 注记 + 台账勘注；阶段 4/5 PASS/COMPLETE + 探针 + 滚动截图补拍） | 🟡 清偿×4（阶段 0 审计发现全收口）；🟢 新登记×1（badge 死分支→S15） |
| 14c | 2026-09-06 | 全局置顶+折叠区+恒链尾+maxUses+官方退役（插行棒，用户五决策点确认） | ✅ | docs/sessions/2026-09-06-session-14c.md（全局卡置顶含 maxUses 宿主同款/五卡折叠/恒链尾语义/官方 web-search-deepseek 随包退役；阶段 4/5 PASS/COMPLETE + 🟡×2 当场清偿 + 浏览器全要素亲见含官方卡消失） | 🟡 清偿×2（阶段 4/5 抓获）；🟢×3 注记 |
| 14d | 2026-09-07 | 兜底二选一（默认无兜底）+ maxUses 修正 + ⓘ/脱敏（插行棒，用户三项反馈） | ✅ | docs/sessions/2026-09-07-session-14d.md（deepseek.enabled 默认 false 付费 opt-in + maxUses 默认 10 {N} 同步 + 兜底行两段 choice + 标题 ⓘ=description + placeholder 多 key + 脱敏） | 红线一次当场 amend |
| 14e | 2026-09-07 | 免费 fetch 搜索兜底（DDG）+ 二选一自动默认 + ! 徽标（插行棒，方向修正） | ✅ | docs/sessions/2026-09-07-session-14e.md（dshws-fetch-search 免 key 成员+fallbackProvider auto+链 hint 徽标化） | — |
| 14f | 2026-09-07 | 徽标化微批（pill 删除+居中） | ✅ | commit 79eeda3（浏览器 pillGone+flex center 亲证） | — |
| 14g | 2026-09-07 | maxUses 输入框收窄+步进钮微批 | ✅ | commit 408dc12（浏览器 94px/±点击 10→15 亲证） | — |
| 14h | 2026-09-07 | ! 徽标位置+尺寸微批 | ✅ | commit e2d274c（16px 对齐 ⓘ14px + 标题紧随亲证） | — |
| 14i | 2026-09-07 | 审核修复批（写后重 describe + 兜底行 v2） | ✅ | commit 3483764（浏览器切换后绿点跟随亲证；保存卡住根因修复） | — |
| 14j | 2026-09-07 | 标题恢复+输入框收窄微批 | ✅ | commit 03abec5（titleFound/66px 亲证） | — |
| 14k | 2026-09-07 | 整头展开+端点字段微批（官方对齐） | ✅ | commit 6b7839d（展开态 apiKey+接口地址亲证） | — |
| 14l | 2026-09-07 | 展开区网格对齐微批 | ✅ | commit 6c2d710（3 grid 行/标签列单 x 亲证） | — |
| 14m | 2026-09-07 | 展开区宿主形态复刻（用户批评重做） | ✅ | commit 36c7060（label/input 同 x、32px/r8 亲证） | — |
| 14n | 2026-09-07 | Key 策略循环 chip + 默认轮询 | ✅ | commit ef5791a（三连击循环+持久化亲证） | — |
| 14o | 2026-09-07 | 成员反馈自动消隐微批 | ✅ | commit 2db4065（已清除 0.7s 在/3.3s 自灭亲证） | — |
| 14p | 2026-09-07 | 端点占位=默认 URL（用户建议） | ✅ | commit 9a25b76（tavily/exa 占位亲证） | — |
| 14q | 2026-09-07 | APIKEY 输入明文化（用户裁定） | ✅ | commit f7b1d8c（typing 明文亲证） | — |
| 14r | 2026-09-07 | 保存即脱敏+就绪入链+key 级重试（用户三项） | ✅ | commit 73796a6（三项浏览器端到端亲证） | ADR-0012「失败不回牌」注记需 S15 勘注（重试语义升级） |

## 当前位置块（session 启动 + 阶段 6 收尾各刷新一次）

- **当前 session**: 无进行中（Session 14e ✅ 2026-09-07 收官——免费 fetch 兜底落地）
- **所处里程碑**: **M7 ✅ 2026-09-06**（S09-S14 + S14a 插行全收官）。M5 交付就绪（🚧 e2e 腿 ✅ S08；文档腿 S15）。M4 ✅。M3 宿主包完备（🚧 机械面 ✅；余用户 with-key 槽位回填——不阻塞）。M6 ⏳（准备棒 S16）
- **上一棒**: Session 14e — 记录：docs/sessions/2026-09-07-session-14e.md
- **下一棒**: S15 README + 迁移 + 升级手册（M5 文档腿收官）→ S16 上游验收准备
- **下一棒**: S15 README + 迁移 + 升级手册（M5 文档腿收官）→ S16 上游验收准备
- **活跃债务**: 🔴×0 🟡×0（阶段 4/5 审定+清偿）🟢×4 维持 + L-2 + 观察（badge 超长 id/fetchChain 显式不过滤对称注记/architecture D7 面→S15/AMBIGUOUS→S15 手册/发版清单→S15-S16/宿主闲置卡措辞〔已退役〕→S15/firecrawl 已复核/i18n CI→S15/tsdown→S15）+ v2 backlog——正本：progress-M7 台账
- **更新时间**: 2026-09-07（14d 阶段 6 收尾）
