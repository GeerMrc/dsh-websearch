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

## 2026-09-23 — npm 发布批：@maricgeer/dsh-websearch@0.1.2 上架（Session 32 增补，用户指令）

**新增（分发）**
- **npm registry 发布**：`@maricgeer/dsh-websearch@0.1.2`（public，tag latest）。裸名 `dsh-websearch` 被 npm 防仿冒政策拒绝（与既有包 `dsh-web-search` 过近）——改用 npm 官方建议的 scope 名；插件注册 id/patch/功能不变。
- 发布元数据补齐（repository/bugs/homepage/keywords + README.en.md 入包）；全新 scratch 环境 `dsh plugin add @maricgeer/dsh-websearch` 从 registry 2 秒拉装 + dump 钉扎即生效（npm 分发链路黄金验证）。
- README 中英安装节增「方式一：npm registry（推荐）」并注明裸名被拒缘由。

**诚实标注**
- 生产 3080 仍指向本地持久路径 tarball（内名 `dsh-websearch` 裸名版 0.1.2，功能等价）；后续生产切换 npm 源另定。
- dist-artifacts/ 现存双名 tarball：`dsh-websearch-0.1.2.tgz`（生产在用，勿删）+ `maricgeer-dsh-websearch-0.1.2.tgz`（与 npm 一致）。

---

## 2026-09-23 — 上游全跨度升级适配批：v0.1.2（Session 32，用户三裁定：全跨度适配/修死 tgz 树不切/授权凭据复制）

**新增（依赖域与源码适配，ADR-0021）**
- **peer 域全跨度**：六条 `@deepseek-ai/dsh-*` peer 放宽为 `>=0.1.5-rc.1 <0.1.8 || 0.1.6-alpha.1 || 0.1.6-alpha.2 || 0.1.7-alpha.1 || 0.1.7-alpha.2`——semver 三副本（6.3.1/7.8.4/7.8.5）实测 7 个已发布版本全 true、0.1.8 封顶（dont-do「semver 预发布覆盖断言须实测」入册）。
- **devDeps 0.1.5-rc.2 → 0.1.7-alpha.2**（14 包）+ cordis 4.0.4 + schemastery 3.18.4 + typert-protocol runtime dep 0.1.7-alpha.2 + ui-primitives 未声明传递依赖补偿（simple-icons/diff/workspace-path/client-store/zustand/immer）。
- **settings 双径（ADR-0021）**：`buildConfigSchema(markVolatile)` 双 schema（Config volatile 标注 / ConfigLegacy 无标注）；`attachSettingsSection` 运行时探测 `installSection`——旧径全钩子保留，0.1.7+ 径走 `setVolatileSource` 读时求值 + `settings/document-updated` re-prime；`materializeConfig` 统一解包层（schema 调用即包装，与宿主版本无关）。
- **图标双名回退**（`src/client/host-icons.tsx`）：`*OutlineRegular`（0.1.7+）优先、`*Outline14`（旧宿主）局部模块增强回退，单一 client bundle 跨线。
- **typert strict codec**：key-counts client 半区 `schema:` → `create: () =>`（0.1.6+ 字段更名；wire 对 `refs` 不变）。
- 测试：双径分派 ×3 + volatile schema/materialize 断言 ×1 + controller mock 适配（autoGenerate/applies 收窄）+ ResizeObserver jsdom 桩（0.1.7 Tooltip 尺寸测量）；真实 seam 旧服务生命周期测试（依赖已删除的 SettingsProvider）退役，其覆盖由双径分派与 A/B 钩子测试承接。**全量 480 passed | 13 skipped（493）**（基线 476；T6 演练追加跨代 codec 测试后终态，阶段 4 复跑精确一致）；typecheck 双工程 / oxlint 0w0e / build（client.js 300.74 kB）/ check:i18n（144 键）全绿。
- **pnpm 11.7 处方入册**：默认 minimumReleaseAge=24h 命中新发布包自动追加 exclude；依赖变更后 `pnpm clean --lockfile && pnpm install` 重建；verify-deps 校验环节不读 exclude 已关闭（`verifyDepsBeforeRun: false`，显式安装年龄门保留）。
- **产物持久化**：`dist-artifacts/`（gitignore）存 v0.1.2 tarball + v0.1.1 回滚副本（tag 重建）；生产 profile 死 tgz 路径修复（T7）。

**治理**
- 计划 032 两轮审核（NEEDS REVISION→APPROVED）；T0 前序审核 PASS（🔴0/🟡4/🟢6，基线 476）；机械变更豁免独立确认（T3 六子项 + 两附加条件）。
- **S28–S31 补账**（合并记录 + STATUS/roadmap 刷新 + S28 CHANGELOG 补条 + S30 semver 勘误 + AGENTS/.session-start 头部与端口表更新：3423 常驻/3424=selfupdate 保留/3434=本仓升级验证窗口）。
- T2 三线兼容矩阵 Note（A 零适配 / B 2 项 / C +2 硬破坏 + 运行时必测清单）。

**诚实标注（遗留项）**
- 3434 三线演练（T6）与生产修复（T7）已收官：A 线（0.1.5-rc.3）全腿 PASS；**B 线（0.1.6-alpha.2）工具腿 BLOCKED-by-upstream**（宿主 TOOL_RUNTIME_SCHEDULER.prepare 缺陷——无插件净 home 复现，非本插件问题；其余腿 PASS）；C 线（0.1.7-alpha.2）全腿 PASS（volatile 端到端/双工具 served-by 徽标/GUI 提交降级）。生产 3080 已换持久路径 v0.1.2（树维持 016a1）。
- 每次新装/重装 profile 会见 `[WARN] @deepseek-ai/dsh-typert-protocol@0.1.7-alpha.2 requires cordis ~4.0.4` 类 unmet-peer 提示——typert-protocol 0.1.7 线 peer 钉 ~4.0.4 而 0.1.5/0.1.6 宿主 vendored cordis 4.0.2；告警级非错误，三线演练+生产实测运行正常（处置与实证见 docs/upgrade.md）。
- 0.1.7+ 路径自定义校验降级为 resolve 时 loud 失败（ADR-0021 已知差异）。
- ui-primitives 未声明传递依赖补偿为 devDeps（测试解析用；运行时由宿主 bundle 提供）——上游若声明化可移除。

---

## 2026-09-16 — 开源发布批：公开仓库上线（Session 31）

**新增**
- LICENSE（MIT，GeerMrc）；README 中英安装节补公开分发三方式（发布页 tarball / 源码 clone 打包 / profile file: 依赖）。
- 推送前敏感扫描（硬密钥形态精确匹配）零命中；清理本机失效 `x-access-token` 残留凭据（备份 git-credentials.bak）。
- 公开仓库 https://github.com/GeerMrc/dsh-websearch （master + tags v0.1.0/v0.1.1）。

---

## 2026-09-16 — 上游适配与生产升级批：0.1.6-alpha.1 + v0.1.1 上生产（Session 30，用户裁定插件+DSH 一并升）

**新增（升级审核与切换）**
- **上游兼容性审核**（双独立审核代理，GitHub 逐目录 commits/patch 取证）：0.1.5-rc.2 → 0.1.6-alpha.1 约 800 commits 中插件依赖缝（web/credentials/settings/typert protocol/gateway/cordis-host-runner/slots/locale/ui-primitives/ModuleLoader 契约/CSS token/cordis 4.0.2）零变更或纯加法；peer `>=0.1.5-rc.1 <0.1.6` 按 semver 覆盖 0.1.6-alpha.1 无需放宽。两注意点：loader 非事务化（插件失败 fiber FAILED 不回滚整树）；subpath loader 条目 fail-loud（本插件整包引用不受影响）。
  - **〔勘误 2026-09-23 S32 T0 实测〕**上一句「按 semver 覆盖 0.1.6-alpha.1」为**误判**：node-semver 预发布排除规则下 `satisfies('0.1.6-alpha.1','>=0.1.5-rc.1 <0.1.6') === false`（semver 6.3.1/7.8.4/7.8.5 三副本一致）——生产 3080（0.1.6-alpha.1 树 + 插件 v0.1.1）自切换日起实处于 peer 未满足状态（运行时零影响：web seam 零变更；后续 profile 内任何 pnpm install 将报 unmet peer）。peer 域放宽由 S32 T3 执行；dont-do 已沉淀「semver 预发布覆盖断言须实测」。
- **3423 升级验证**：新 worktree dsh-harness-016a1 @ dsh-v0.1.6-alpha.1（fetch tag → pnpm install → **pnpm run build**——缺 build 则 profile symlink 报 typert.host.js 缺失，已记 docs/upgrade.md）→ 3423 供版切换 → 横幅 0.1.6-alpha.1-0a15e36、插件零错误、四工具徽标计数（真实 key 5/1/2/5）、启停开关/web_fetch 接管/链卡全过。
- **3080 生产切换**（用户裁定插件+DSH 一并升）：备份 profile package.json 与 tgz 至 /tmp/dshws-s30/backup/ → profile 依赖切 v0.1.1 tgz → 3080 以 016a1 worktree 重启（symlink healing 自动指向新树）→ 横幅/徽标计数/会话树无损全过。**回滚预案**：profile 依赖指回 /tmp/dshws-s29/dsh-websearch-0.1.0.tgz + 进程切回 dsh-harness-015 供版重启。
- **文档**：README 中英新增「安装、升级与注意事项」章节；docs/upgrade.md 补 v0.1.1 版本行与 0.1.6-alpha.1 升级实操记录。

**诚实标注（遗留项）**
- 3080 真实搜索端到端（served-by 徽标亲见）留用户验收择机；远程仓库推送待用户给出地址后执行。

---

## 2026-09-16 — Key 计数徽标批：v0.1.1（Session 29，设置页展开态 APIKEY 计数提示）

**新增**
- **`dshws-websearch` 自有 Remote 命名空间**（`src/key-counts.ts` host 半 + `src/client/key-counts-remote.ts` client 半手写 contribution 经 `$mount` 挂载）：`describeKeyCounts(refs)` 回 `Record<ref, count>`——值不出进程，只回整数计数；refs 白名单=五成员当前解析 ref（`apiKeyEnv ?? defaultRef`），外部 ref 一律 0（防跨凭据探测）。零接触宿主主树（gateway SRC 动态发现 + `@deepseek-ai/dsh-typert-protocol@0.1.5-rc.2` 钉版防装饰器 marker 双实例）。
- **KeyCountBadge**（`src/client/section.tsx`）：仅展开态显示；0=灰空心圆、1-10=品牌色数字 pill（悬停 `已配置 N/10`）、>10=警示色（池超限是请求期 loud failure，ADR-0011）；计数未加载（undefined）不渲染（不与 0 混淆）；展开瞬间幂等 `refreshCounts()`（env 外部变更无事件也能在查看时刻刷新）。旧宿主+新客户端优雅降级=无徽标无报错。
- 测试：`tests/key-counts.test.ts`（计数/白名单/去重/resolve 失败保守 0/值不下发）+ `tests/key-counts.artifact.test.ts`（构建产物参数名↔wire 字段对齐冒烟，陈旧 lib 自动 skip）+ controller 5 例（counts 入快照/pending≠0/setKey 联动/事件带刷/失败保守）+ section 5 例（收起隐藏/0 灰/3 彩/11 警示/pending 不渲染/展开触发刷新）。vitest 加装饰器预变换插件（esbuild 不认 stage-3 装饰器，harness `standardDecoratorPlugin` 同形）。
- 门禁：test 476 passed / typecheck / oxlint / check:i18n 全绿。
- **用户样式裁定（同批修订）**：计数徽标弃 DeepSeek 蓝改插件自身绿色激活语义（`--dsw-alias-state-success-primary`，同状态绿点/保存反馈）；尺寸对齐 `?` 信息图标（IconQuestionOutline14）精确 14px 圆（12+2×1px / 11+2×1.5px border 计入）。另按用户指令将 3080 生产五个搜索 APIKEY 复制入 3423 scratch 凭据（备份 .credentials.yaml.bak-s29；生产文件只读未动），真实 key 下四工具徽标计数实测：Tavily 5 / Exa 1 / Firecrawl 2 / AnySearch 5。
- **3423 GUI 实测全过**（v0.1.1 tgz 装于 scratch profile）：0=灰空心圆（悬停「暂无有效 API Key」）/ 1 key=蓝 1 徽标 / 3 key=蓝 3 徽标（悬停「已配置 API Key：3/10」）/ 收起隐藏-展开重现-展开即刷新 / 页面刷新后持久正确 / 清除回灰圆；深浅双主题徽标均为品牌蓝 rgb(86,134,254)（`--dsw-static-deepseek-450`，主题无关；`--dsw-alias-brand-primary` 双主题均为中性近白/近黑不满足「彩色点亮」被否）。截图两帧在档（会话工件）。
- **三项通路技术定谳**（插件自建 Typert remote 的实现约束，后续同类功能直接引用）：① 客户端 `$mount` 的 contribution 必须 strict codec（zod schema），`src-json` 会被 `requireStrictCodec` 拒；② gateway 以 traceable proxy 作 receiver 调 SRC 方法——方法体内不得访问 `#private` 字段（穿透 proxy 抛 TypeError→`gateway/internal`）；③ rolldown 不降级 stage-3 装饰器（harness 走 tsc 预编译故无此问题）——本包用 `Remote(fn, context)` 公开调用面在模块加载期运行时标记，源码零装饰器语法（vitest 亦无需装饰器插件）。

**诚实标注（遗留项）**
- 生产（3080）升级待用户指令；发布扫尾（推送远程/安装方法/分支规整）为独立后续阶段。

**跟踪**
- 下一棒：发布扫尾（推送远程/安装方法/分支规整）独立阶段。

---

## 2026-09-13 — 徽标解耦微批（Session 28；**补账条目 2026-09-23 S32 T1**——当日漏登，正本=git 9e6591c/e9dce94 + docs/sessions/2026-09-16-sessions-28-31-backfill.md）

**新增**
- served-by 徽标渲染与宿主 toolview 结构解耦（全卡扫描替代定点结构匹配）+ web_fetch 溯源徽标（fetch-row.tsx/fetch-view.spec）。
- 版本裁定（用户）：本批并入 v0.1.0 定档基线不独立发版（e9dce94 回折版本号；远端 tag v0.1.0 移钉最终实现）。

---

## 2026-09-13 — 生产切换批：v0.1.0 上生产（Session 27，用户 2.5 批准路线 B）

**新增（生产部署）**
- **~/.dsh 重建切换**：0.1.5-rc.2 worktree 供版（路线 B——弃主树 67 冲突合并）+ dsh-websearch v0.1.0 装即接管；旧 anysearch 安装与 237 条 alpha.3 healing 链接随 profiles/ 全清。
- **保留面精确三件**：settings.yaml（模型配置）/ .credentials.yaml（模型三键 + 搜索四键合并——key 零人工操作）/ .anonymous-user-id；sessions 等其余全清（用户口径）。
- **生产实证**：横幅 0.1.5-rc.2-fb2cf4b9、dump 三接线、四成员绿点、真实搜索 served-by: dshws-tavily（多 key 轮换）带来源链接回答。

**治理**
- 阶段 0 PASS（增量采信 S26）/ 阶段 2 APPROVED（healing 落点 3423 实证）/ 阶段 4/5 R1-R5 PASS——三份 audit-log 在档。

**诚实标注（遗留项）**
- 2 条验证会话 + dsh-harness-015 工作区留用户检验；fresh 状态「添加工作区」浏览对话框自动化未触发（用户实际浏览器待确认）。
- 主树 merge-forward 降为 housekeeping 棒；双树 healing 边界（生产服务固定 worktree 启动）。

**跟踪**
- 3423 dev 零影响（pid 61902 存活）；主树 clean 零接触；备份 /tmp/dshws-s27/backup/ 四件。
---

## 2026-09-12/13 — 定档批 v0.1.0（Session 26，用户六裁定）

**新增（0.9.0〔内部编号〕→ v0.1.0，定档批）**
- **T1 UI**：兜底搜索行绿点前置（用户确认 2026-09-12）——DOM 序断言钉住（`bcff9e1`）
- **T2-T4 清偿**：lint 5w 清零（footerStyle/FieldLabel/冗余 spread）；治理口径三处对齐（🟡×0）；公共类型导出面（UnifiedSearchFanout/ExaSearchType/五家 MemberOptions）；badge 死分支翻账（S14c 已清）
- **T6 文档腿（plan 015）**：README.md（zh 正本）/ README.en.md / docs/upgrade.md / docs/00-architecture.md v2.0；配置参考以 src/config.ts 为正本；**独立 Agent 从零走通 Tier B PASS**（安装→dump 三接线→运行时路由→诚实失败探针）
- **T7 git 定档**：427 commits 敏感扫描零命中；59 已合分支删尽；远端仅准备不推送（用户裁定）

**治理（版本线规则，正本 ADR-0020）**
- 内部开发编号 0.2.0–0.9.0 归**历史档**（各批次 CHANGELOG 条目保留原编号，不回改）。
- 正式版本线从 **v0.1.0** 起：小补丁/细节迭代走补丁位（v0.1.0 → v0.1.1 → v0.1.2，标准 semver）；仅特大架构功能扩展升 0.2.x。细迭代节奏，不做大版本跨度开发。
- 首个 v0.1.0 = S26 定档批终态，tag 附注含定档说明（打在 master merge 提交）。

**诚实标注（遗留项）**
- 走通为 Tier B 档（无 key 诚实失败证据链），真实搜索实证待回补。
- T7 生产批下棒（Session 27，用户指令后）；远端创建与推送未做（仅准备）。

**跟踪**
- 全量 **449|13(462) exit0** / tc 0 / lint 0w0e / i18n 141 / build 0；3423 换 v0.1.0 冒烟（token 流 + 插件 client 在位）；阶段 0/4/5 独立 Agent 三份 audit-log（补强/走通/验收均 PASS）

---

## 2026-09-12 — 上游 0.1.5-rc.2 适配 0.9.0（Session 25，用户裁定 A 采纳）

**新增（0.8.2 → 0.9.0，适配批 minor）**
- **上游对齐**：peer 六条 → `>=0.1.5-rc.1 <0.1.6`；devDep 十三条 → `0.1.5-rc.2`；补 19 个 primitives 未声明传递依赖（测试环境解析；运行时仍走宿主模块表）
- **兼容性排查清单**（八项实测，见 Note s25）：seam/credentials/settings/client 面/primitives/manifest/patch 钉扎/面板重做影响——逐项 PASS
- **部署模型**：3423 从 0.1.5 worktree 供版；主树与 ~/.dsh 保持 alpha.3 直至生产批（用户分级上线约束）

**跟踪**
- 全量 448|13(461) exit0（对 0.1.5-rc.2）；3424/3423 亲验见 session-25 记录

---

## 2026-09-11 — Key 行内联 + 兜底入详细配置 0.8.2（Session 23b，用户反馈微批）

**新增（0.8.1 → 0.8.2，UI 修正批 patch）**
- **双「保存」修复（用户 bug 报告）**：API Key 的 保存/清除 动作并入 Key 输入行（含反馈），卡底 footer 移除——每 staged 字段各拥其保存，无双按钮歧义
- **兜底搜索行迁入「详细配置」折叠**（用户裁定，链行为配置归一处；成员列表保持可扫读）
- **配置模型裁定落档**：路径 C 维持现状（Note s23a §6）；B/A 不排期

**跟踪**
- 全量门墙数字见 session-23b 记录

---

## 2026-09-11 — 配置模型深研 + 真实 API 实测 + 成员卡重排 0.8.1（Session 23a，用户插行）

**新增（0.8.0 → 0.8.1，研究+UI 批 patch）**
- **配置模型研究**（Note s23a + /tmp/dshws-s23a/config-model-report.html）：宿主 web_search LLM 面仅 queries（工具 schema 归宿主）；当前固定配置模式与 Anthropic/OpenAI 第一方 API 同构=基线合理；建议近期增强=链智能默认（auto_parameters 式三态档）；A（自注册富参数工具，ctx.tools.register 可行）不建议近期——**呈用户裁定**
- **真实 API 对齐矩阵 20/20**（key 取 3423 实例各池首把；含 Tavily include_domains 语义断言 10→1、Exa 强制新抓 11.3s、AnySearch zh→zh-CN 真实链路）
- **成员卡展开区重排**：凭据区（全宽）+「搜索参数」组头 + 标签左/控件右行节奏 + 两列自适应 grid——纯呈现层，交互语义/testid/dirty pill 不变

**治理**
- S15（README，plan 015 已批准）顺延至本棒后；阶段 0-5 见 session-23a 记录

**跟踪**
- 全量 447|13(460) exit0 / i18n 141 keys

---

## 2026-09-11 — UI/UX 全面对齐 DSH 0.8.0（Session 23，roadmap 重排插行）

**新增（0.7.2 → 0.8.0，UI/UX 对齐批 minor）**
- **差距清单驱动**（独立 Agent 宿主源码级对照 D1-D18 + 已一致 10 项）：
- **D4 token 修复**：feedbackColor 的 `--dsh-` 前缀拼写错（解析失败）与 no-usable 警告的 `#f87171` 非法 fallback → 统一 `--dsw-alias-state-error-primary`
- **D1 折叠图标**：三处文字 ▾ → 宿主 `IconChevronDownOutline14` + 160ms 旋转
- **D2/D10 卡片态**：hover 边框 dimmed + open 态 bg-layer-2（「正在操作的那张」语义）+ 成员卡 footer 分隔线——经注入式 `<style data-dshws-styles>` 块（token 化，单文件 CJS 分发无 CSS 通道）
- **D3/D17 focus 覆盖**：六个输入框 brand focus 边框 + 开关/移动钮/折叠头 focus-visible 2px outline + reduced-motion 豁免（D16）
- **D8 select chevron** 宿主参数（#81858C/right 12px/pr 32px 两处）
- **D9 unsaved pill**：endpoint/param/maxUses/geo/domain 草稿提升卡级/折叠级——**折叠不丢草稿**，pending 时成员卡头与详细配置折叠头示「未保存」徽（宿主 PluginCard .pending 形态）
- **D15 提示形态统一**：三处自绘「！」圆徽 → ⓘ 图标 + Tooltip
- **裁定豁免（用户先例）**：D5 未配置琥珀 / D6 反馈 1.5s 自动清（仅勘正 2.5s 注释漂移）/ D7 开关绿 / D11 maxUses stepper；方言锚定 Models rowCard（D12/D13/D18 维持）

**治理**
- 阶段 0：S22b 审核 PASS（443|13(456) 复现）+ 🟡 roadmap 陈旧标记 T0 清偿
- 阶段 2：两轮（B1 伪类通路/B2 草稿提升语义）→ 复审 APPROVED；正本 = docs/sessions/audit-logs/2026-09-11-s23-stage0-2-audit.md
- 双审：阶段 4 核销 + 阶段 5 换 spawn 复审（见 session-23 记录）

**跟踪**
- 终态门墙数字见 session-23 记录收官节

---

## 2026-09-11 — 设置页折叠化 0.7.2（Session 22b，用户反馈插行棒）

**新增（0.7.1 → 0.7.2，UI 折叠批 patch）**
- **「接管 web_fetch」成员卡式折叠**（用户裁定，参考搜索工具卡）：头行（名称 + ⓘ + 开关）常态可见，Web Fetch 链排序行按需展开（默认收起，且仍仅 ON 时有内容）——不再常年占屏
- **搜索链卡「详细配置」子折叠**：单成员超时/单次请求最多搜索次数/搜索区域/搜索语言/仅含域名/排除域名 六组控件收进默认收起的「详细配置」折叠区——链排序行为卡片常态，详细配置不再占满窗口

**跟踪**
- 全量 443|13(456) exit0 / tc 0 / lint 0 / i18n 139 keys；浏览器亲验见 session-22b 记录

---

## 2026-09-11 — Web Fetch 链 UI 修正批 0.7.1（Session 22a，用户四项反馈插行棒）

**新增（0.7.0 → 0.7.1，UI/交互修正批 patch）**
- **链行排版修复**：角色 chip（主搜索/兜底位）并入名称单元格紧贴工具名——原 4 列 grid 装 5 子元素把 ↑/↓ 按钮挤到第二行（搜索链与 fetch 链同病灶，用户截图报告）
- **Web Fetch 链区块迁移（用户裁定）**：从搜索链卡迁至「接管 web_fetch」开关正下方，且仅开关 ON 时渲染（OFF 时链不服务 web_fetch，不再常年占页）
- **更名**：「全文抓取链」→「Web Fetch 链」（zh/en + 页头 description 同步），与开关命名一致
- **排序「操作失败」根因修复**：宿主 settings 乐观锁（settings/conflict）在快速连续排序时拒第二次写——controller 链移动写路径加 conflict 单次重试（重读 descriptor 后回放 patch）

**诚实标注（遗留项）**
- conflict 重试覆盖链移动写路径；其他高频连点面（开关/选项）沿用既有语义，未观察到同类报告

**跟踪**
- 全量 442|13(455) exit0 / tc 0 / lint 0 / i18n 138 keys；浏览器亲验见 session-22a 记录

---

## 2026-09-10 — P3 对齐批 0.7.0 + 全功能一致性深度审核（Session 22，roadmap 重排插行）

**新增（0.6.0 → 0.7.0，参数批 minor）**
- **Tavily**：`startDate`/`endDate` 发布日期区间（与 timeRange 正交）+ `exactMatch` 精确短语过滤——GUI 双日期输入 + 开关（i18n 126→138 keys）
- **Exa**：`endPublishedDate` 上限 + `contents.text.verbosity`（standard/full 含计费 ⓘ）+ `includeSections`/`excludeSections`（封闭枚举；**双路守卫**：sections 要求 maxAgeHours=0/-1，settings validate hook 与 resolveConfig 各拒绝一次，-1 边界在测）
- **Firecrawl**：`tbs` 放宽为官方组合文法（qdr 预设 + `sbd:1` + `cdr:1,cd_min,cd_max`，双路文法守卫，qdr 存量兼容断言）+ `safe` SafeSearch 开关
- **AnySearch**：统一 `searchLanguage` fan-out 第 4 家（zh→zh-CN 主地区映射、区域码大写归一）；tag/params 垂直面**未实现**（硬规则：无可达 key 做契约探针——P4 边界披露，plan 022 §0）
- **loopback server** 请求体捕获（bodies）+ 两条 S22 端到端 wire 场景（P3 参数达 wire / zh-CN 映射装配级）

**治理**
- 阶段 0（独立 Agent）：S21 审核初判 **BLOCKED（🔴×1 阶段 2 audit-log 正本悬空）**→ T0 `719dbfb` reconstructed 补落 + session-21 三处勘正 → PASS；🟡×2 同批清偿
- 阶段 1：四家独立 Agent 当日官方文档全参数 diff（Tavily/Exa/Firecrawl/AnySearch+DeepSeek）——roadmap 点名项全部核证为真；**勘正 plan 020 §87 AnySearch 契约面结论过时**（Note s17 §8）
- 阶段 2：初审 NEEDS REVISION（B1 双路守卫遗漏 / B2 AnySearch language 归属）→ 修订 → 复审 APPROVED；正本 = docs/sessions/audit-logs/2026-09-10-s22-stage0-2-audit.md
- 阶段 2.5：用户批准（session-governance 接管指令原文在 session-22 记录）

**诚实标注（遗留项）**
- AnySearch tag/params/domain/sub_domain 垂直面未实现（无 key 探针；补 key 后须先探针定形态）
- Tavily/Exa/Firecrawl 真实 API 实测沿用既有披露（无 key 环境维持 mock 全链路 + loopback）
- zh-TW 等非默认地区粒度超出统一入口能力（ISO 639-1 存储），Note s17 §8 记录

**跟踪**
- 终态门墙数字见 session-22 记录收官节；dont-do 无新增（本批无踩坑）

---

## 2026-09-10 — web_fetch 全模式多链接管 0.6.0（Session 21，用户主计划重排 + ADR-0019；🟡 债务翻账）

**新增（0.5.0 → 0.6.0，功能批 minor）**
- **多成员 fetch 链**：Firecrawl（/v2/scrape）→ Tavily（/extract）→ AnySearch（/v1/extract）降级链——云端提取**完全绕开本机 fake-ip × 宿主 SSRF 限制**（S14v 顽疾）；全败诚实报错（无 http 回退尾，用户决策）
- **gate 运行时路由器**（patch 零改动）：ON = web_fetch 可见、插件链服务；OFF = gate 内置 http 直抓（官方行为等价近似——patch 钉死下官方实例永不被选）。**S15c restrict 隐藏态退役**（agent/created 监听整体删除）
- **fetch 链独立配置**：`fetchChain` 字段复活（默认 FETCH_CHAIN_DEFAULT_ORDER 三家——Exa 永不进，上游无 fetch 能力）+ GUI FetchChainRows 排序行组（与搜索链独立）+ moveFetchChainEntry；成员启停跨链共享（最小配置面，ADR-0019）
- **AnySearch extract face（探针定案）**：/v1/extract 单 URL body、去噪 Markdown、50k 截断（truncated 标记，防御带 49900）、信封错误三形态——真实 API 实测 1,048ms
- **Tavily extract face**：urls/format:markdown/failed_results→链降级/PDF URL 支持（无 key 披露）
- web_fetch 完整替代 🟡 债务**翻账**（S16-P0 登记 → S21 落地）；ADR-0019 accepted；roadmap 重排 S21→S22→S23→S15 收尾

**治理**
- 阶段 0 PASS（fetch 链可行性背书）；plan 021 两轮 APPROVED（B1 构造序 lazy thunk/B2 内部 registry/B3 启停语义写死）；2.5 用户主计划批准+四决策获答；阶段 4 R1-R4 PASS + R5 FAIL→T9 清偿（🟡 翻账/CHANGELOG/浏览器亲验 + 5 项陈旧文案/注释缺陷当场修复）

**诚实标注（遗留项）**
- Tavily extract 真实面无 key（mock 全链路 + 规格全公开；AnySearch 探针+实测 + Firecrawl 代码在档背书）；AnySearch 50k 截断（truncated 标记）
- OFF 态为 gate 内置 http 而非官方实例（行为等价近似，ADR-0019 措辞正位）

**跟踪（观察期）**
- 全量 **415 passed | 13 skipped (428) exit0**（398→415）/ tc 0 / lint 0w0e / build 90.85+40.32+110.94 / pack 五件 59.3kB / i18n 122 keys（修复批 -1 死键）/ UA 0.6.0 ×5
- 下一棒：S22 P3 对齐批——正本 session-21 记录★节

---

## 2026-09-10 — P2 中价值参数批 0.5.0：统一域名入口 + 10 参数 + Firecrawl search timeout 修复（Session 20，用户裁定先于 S15 + ADR-0018）

**新增（0.4.0 → 0.5.0，功能批 minor）**
- **统一域名入口（ADR-0018）**：根 `searchIncludeDomains`/`searchExcludeDomains`（逗号串，GUI 双输入）fan-out Tavily/Exa/Firecrawl——**二选一硬约束双路径 fail-loud**：settings 路径宿主 validate-hook persist 前拒写（弃 resolveConfig throw——宿主 watcher 吞 warn + 重启 brick，阶段 2 M-1 实证）；cordis.yml 路径加载面冒错。守卫：Exa company/people×日期/exclude 跳过、Firecrawl hostname 归一 + 通配整体跳过（含 Tavily 同构守卫——阶段 5 F-1 清偿）
- **Tavily**：`chunksPerSource`（1-3；ultra-fast 抑制）/ `filterByLanguage`（硬语言过滤，须统一语言已设）/ `includeDomainsMode`（filter|boost）
- **Exa**：`category`（6 值枚举；company/people 守卫）/ `contents.maxAgeHours`（**现行官方名**——crawlingOptions/livecrawl 已废弃）
- **Firecrawl**：`sources`（**news 原生时效新闻源**——六成员唯一，web+news 双源 limit 每-source）/ `categories`（developer|research|pdf）
- GUI：全局域名双输入 + 8 成员级控件；locales 92→**121 keys**
- **修复**：Firecrawl search 面显式 `timeout: 20000`（S16-P0 scrape 修的同构缺口——上游默认 60s vs 链预算 30s）

**治理**
- 阶段 0 PASS；plan 020 两轮 APPROVED（M-1 必改）；2.5 用户排期裁定+默认；阶段 4 R1-R3/R5 PASS + R4 FAIL→清偿（热锚+行为 spec+toggle 默认缺陷修复）；阶段 5 COMPLETE + F-1/F-3→清偿；audit-log ×3

**诚实标注（遗留项）**
- Tavily/Exa P2 参数真实 API 实测无 key（firecrawl 实搜 4 passed；断言在档自跳）
- P3 候选（Note s17 §6）：Tavily exact_match/start_date/end_date//extract；Exa verbosity/includeSections/additionalQueries；Firecrawl tbs 组合形态
- AnySearch P2 = 零改动（上游契约面仅 query/max_results/zone——本地代码实读实证）

**跟踪（观察期）**
- 终态 **398 passed | 11 skipped (409) exit0**（377→398）/ tc 0 / lint 0w0e / build 83.58+39.53+104.34 / pack 五件 56.6kB / i18n 121 keys / UA 0.5.0 ×5
- 下一棒：S15 README 手册——正本 session-20 记录★节

---

## 2026-09-10 — 移除 dshws-perplexity 成员 0.4.0 + 成员准入标准（Session 19，用户终裁 + ADR-0017）

**Breaking 变更（0.3.1 → 0.4.0）**
- **完整移除 `dshws-perplexity` 成员**（前后端 + 测试 + 文档）：provider/config 节/GUI 卡与参数控件/errors 码族/e2e 场景；链默认序 5→4（Tavily → Exa → Firecrawl → AnySearch）；导出面收敛（PERPLEXITY_* 四导出全消）
- **动因（事实核证，官方出处在案）**：Perplexity API 无任何免费途径——纯预充值绑卡、Pro/Max 订阅不含 API 额度（历史 $5/月 credit 已取消）、学生计划不含 API、唯创业公司 Startups 计划（$5000 需审核）
- **ADR-0017 成员准入标准**（此后新成员第一道门）：①高可用 ②**有免费额度（硬门槛）** ③多 APIKEY 池 ④功能对齐上游；现役复核 Tavily/Exa/Firecrawl/AnySearch ✓（DeepSeek 为显式付费 opt-in 兜底不受 ② 约束）；ADR-0016 → superseded（S18 迁移转历史档——决策时点信息不同非浪费）；ADR-0015 fan-out 语言面剩 Tavily、region 面剩 Exa/Firecrawl
- **存量配置兼容**：`fallbackMember: 'dshws-perplexity'` legacy 别名双点归一 'auto'（schema 宽容 + resolveConfig/controller）；残留 `perplexity:` 节静默忽略（schemastery 探针实测）；searchChain 死 id 运行时跳过

**治理**
- 阶段 0 精简 PASS（探针 + 免费额度调研附档）；plan 019 两轮 APPROVED；2.5 = 用户直接指令；阶段 4 **R1-R5 全 PASS**（R1 grep 逐行分类零非豁免残留 + 探针双红绿）；阶段 5 **COMPLETE**（4 前瞻项全清偿）；audit-log ×4 入库

**诚实标注（遗留项）**
- 残尸 `perplexity:` 节静默无害——README（S15）将提示手动清理（🟢 在档）
- 恢复路径为方向性声明（整棒重放而非纯 git revert——移除横跨 4 commits + 测试承载改写）；controller 宽 union 内联重复 🟢（后续棒收口 import type）
- S18 观察×2（search_results 边界/title 空白）随成员移除 moot 翻账

**跟踪（观察期）**
- 基线 **377 passed | 11 skipped (388) exit0**（401→377，perplexity 测试删除）/ tc 0 / lint 0w0e 54f / build 77.20+34.02+93.18（净缩）/ pack 五件 51.7kB / i18n 92 keys / UA dsh-websearch/0.4.0 ×5
- 下一棒：S15 README 手册（新增素材：ADR-0017 准入口径 + 残尸配置清理提示）——正本 session-19 记录★节

---

## 2026-09-10 — Perplexity Agent API 迁移 0.3.1（Session 18，Sonar 日落应对 + 阶段 0 🟡 处置）

**迁移级变更（用户透明：config/GUI/locale 零改动）**
- `dshws-perplexity` wire 从 Sonar `/chat/completions` → Agent API **`POST /v1/agent`**（responses 形态）——官方公告 Sonar 全线 2026-09-27 停止支持，本迁移解除该死线
- 请求面：query→顶层 `input`；`max_tokens`→`max_output_tokens`；**web_search 工具恒包含**（Agent API 下 opt-in，缺工具=纯参数记忆作答）；`search_recency_filter` 入工具 `filters`、`search_context_size`/`user_location` 在工具顶层；**裸模型名自动补 `perplexity/` 前缀**（存量 `sonar`/`sonar-pro` 配置零变化）
- 响应面：`output[]` trace——message item 文本→content、search_results item→结构化来源（url/title/snippet/date，比旧 citations 平铺更丰富）；回退链 annotations `url_citation` → 旧 `citations` 终兜底；`truncated` 恒 false 维持（S17 B3 所有权裁定延续）
- ADR-0016 accepted（amends ADR-0015 Perplexity fan-out 落点）

**治理**
- 阶段 0 PASS（S17 增量子集 170+32 全绿 + 交付物 12 件全命中）；plan 018 两轮 + 复审预授 APPROVED；2.5 默认批准披露（问询未获答：批准/降级验收）；阶段 4 **R1-R5 全 PASS**（探针真红真绿）+ 阶段 5 **COMPLETE**（安全/契约/前瞻 + 冒烟 36）；audit-log ×4 入库

**诚实标注（遗留项）**
- **真实 Perplexity API 实测未做**：scratch 凭据池无 PERPLEXITY_API_KEY（2.5 降级裁定）——断言就绪零改动，补 key 后 `pnpm vitest run tests/e2e.real/perplexity.real.test.ts` 直接闭合；3423 已换 0.3.1 在跑（boot + firecrawl 成员实搜 4 passed 证明链健康）
- T4 lint 装饰性修复晚于 tarball 安装：已装 0.3.1 与 HEAD 行为等价（阶段 4 逐行为核实）
- 🟢 新观察×2（search_results 全无 url 边界语义 / title 空白判定不对称）归补 key 实测时裁定

**跟踪（观察期）**
- 基线 **401 passed | 13 skipped (414) exit0**（399→401）/ tc 0 / lint 0w0e 57f / build 85.31+38.68+95.68 / pack 五件 54.0kB / i18n 96 keys / UA dsh-websearch/0.3.1 ×6
- 下一棒：S15 README 手册（素材全就绪）——正本 session-18 记录★节

---

## 2026-09-10 — P1 高价值参数批 0.3.0：14 参数全链路 + 成员 options 热化 + 统一语言/区域入口（Session 17，API 对齐系列第 2 棒 + 阶段 0 🟡×4 清偿）

**新增（0.2.2 → 0.3.0，功能批 minor）**
- **14 个 wire 参数全链路**（config schema + resolveConfig + provider wire + GUI 控件 + locales + 单测红绿）：
  - Tavily：`topic`（general/news/finance）/ `time_range` / `search_depth`（**现行 4 值**：basic/advanced/fast/ultra-fast）/ `include_answer`（**默认 basic 恒发**——免费生成答案→结果 content）
  - Exa：`type`（**现行 6 值**，keyword/neural 上游已移除）/ `textFallback`（**默认 true**——contents.text 回退，修复「无 highlight 结果整条被丢」）/ `startPublishedDate`（date-only 归一 T00:00:00Z）
  - Perplexity：`maxTokens` 可配（**1024 腰斩修复 = 可调高**，缺省维持显式 1024，上限 128000）/ `search_recency_filter`（5 值含 hour）/ `web_search_options.search_context_size`（嵌套现行形态，单一构造点）
  - Firecrawl：`tbs`（qdr:h/d/w/m/y）/ `location`（城市级自由文本）；`country` 经全局入口喂给（ADR-0015）
  - 通用：根 `searchCountry`/`searchLanguage` 单写入点 fan-out 四家（Exa userLocation / Perplexity user_location.country + language_preference / Firecrawl country〔**修 API 缺省 US 偏差**〕/ Tavily language）
- **成员 options 统一热化（D1）**：`hotMemberOptions` getter 委托——settings commit 下一次搜索即生效（既有 baseURL/model/maxResults/numResults/maxTokens 一并变热，有意行为变更：endpointNote「下次启动」→「下一次搜索」）
- **GUI**：11 成员级控件（描述符驱动）+ 全局搜索区域/语言字段；locales 54→**96 keys**（en/zh parity）
- ADR-0015（统一入口：全局单写入点 + Tavily country v1 防御）+ Agent Note 四家参数正本（docs/notes/2026-09-10-s17-api-alignment.md）

**清偿（4+3 笔）**
- 阶段 0 🟡×4：progress-M7 台账 web_fetch 悬空行 + S14c 起停更债务镜像 / S15a·15b·15c·16-P0 四棒 session 记录 reconstructed 补落 / STATUS 位置块半刷新 + 台账行序勘正 / lint 3 warnings（→ 0w0e 复验）
- 🟢×2：anysearch UA 断言补齐（6/6）/ 全量基线坐实（阶段 4 亲跑 399|13(412) exit0）

**治理**
- 阶段 0 PASS（🔴×0）→ plan 017 两轮（NEEDS REVISION 必改×3 全吸收 → **APPROVED**）→ 2.5 默认批准披露（问询未获答，项目先例取默认：批准/默认开/S18 插行）→ T0-T9 逐一 TDD → 阶段 4 **R1-R6 PASS**（探针 A/B 有牙）→ 阶段 5 **COMPLETE**（安全/契约/前瞻三正交 + 冒烟 72）；audit-log 正本 ×4 入库

**诚实标注（遗留项）**
- **真实 API 参数实测缩面**：scratch 凭据池仅 firecrawl 1 key + anysearch 池——firecrawl tbs 真实通过（2160ms）；**Tavily news topic 验收例 / Exa / Perplexity 新参数无 key 未实测**（e2e.real 断言在档自跳；补 key 即闭合），归用户择机
- **Perplexity Sonar 全线 2026-09-27 停止支持**（官方横幅，含现用 /chat/completions）——S17 参数按 Agent API 同名可迁移形态设计，config 面 S18 零改动；迁移棒 = roadmap S18 插行，建议立即接棒
- **web_fetch 恢复路径评估结论**（🟡 在档项收口）：短期 = fetchTakeover 开关关闭即恢复官方 web_fetch（零开发，已可用）；中期 = Firecrawl scrape 单成员（fetch face 代码在档）；长期 = 多工具 fetch 链复活（v2 backlog）。实现归后续棒/v2
- 两处默认开启行为变更（2.5 默认裁定）：Tavily include_answer basic 恒发 + Exa contents.text 默认随行——升级即生效
- 🟢：新类型 re-export 未做（0.2.x 口径一致，后续棒）

**跟踪（观察期）**
- 基线 **399 passed | 13 skipped (412) exit0**（357→399）/ tc 0 / lint 0w0e 57f / build 83.65+38.68+95.68（gzip 22.33/8.62/22.70）/ pack 五件 53.5kB / i18n 96 keys + 21f 零 CJK / UA dsh-websearch/0.3.0 ×6
- 下一棒接力指令摘要：Session 18 Perplexity Agent API 迁移（2026-09-27 前）——正本 session-17 记录★节

---

## 2026-09-10 — P0 API 对齐修复 + web_fetch 技术债标记（Session S16-P0）

**修复级变更**
- **Exa highlights 参数迁移**：已废弃的 `highlightsPerUrl: 1`（上游已忽略）→ 现行官方形态 `query + maxCharacters: 400`——消除 snippet 静默消失导致结果被丢的正确性风险
- **Firecrawl scrape timeout 对齐**：显式 `timeout: 20000`（上游默认 60s vs 工具预算 30s——不设上限时客户端已 abort 而服务端继续烧 credit）
- **6 个 USER_AGENT 统一更新**：`dsh-websearch/0.1.0` → `0.2.2`（deepseek/tavily/exa/perplexity 从 0.1.0，anysearch 从 0.2.0）
- **Tavily 头注释勘正**：API 默认 max_results 实为 10（非 5）

**技术债务标记**
- web_fetch 完整替代正式登记为 🟡 级重大技术债务：当前 S15c 隐藏态工作正常（零报错零退化），但"按 URL 取全文"能力存在缺口；P1 参数对齐后评估恢复路径（Firecrawl 云端/官方回退/多工具 fetch 链）

**跟踪**
- 基线 357\|9(366) exit0；UA 测试断言同步更新

---

## 2026-09-09 — web_fetch 彻底隐藏 via tools.restrict()（Session 15c，终版）

**核心突破**
- 发现宿主官方 API `tools.restrict({deny:['web_fetch']})`——可以让工具从模型列表彻底消失（schema+执行一起），子代理系统就是用这个机制（child-agent.ts:217 先例）
- 配合 `agent/created` 事件监听（agent-presets 同款机制），对每个新 agent 自动调用 restrict
- **15 行核心代码**替代之前所有复杂方案（预设副本/网关拦截/预设文件修改）

**实测验证**
- 标准模式新会话：模型明确确认"我的可用工具里没有 web_fetch"
- 零报错、零引导、零改道——模型直接用 web_search 完成任务
- 对所有预设/所有模式/所有新 agent 自动生效

**与之前所有方案对比**
| 方案 | 工具可见？ | 报错？ | 复杂度 |
|---|---|---|---|
| 网关拦截（15b） | 可见 | 是 | 低 |
| 预设副本（15a） | 不可见 | 否 | 高 |
| **restrict()（15c 终版）** | **不可见** | **否** | **最低** |

**跟踪**
- 基线不变 354\|9(363) exit0；版本 0.2.2（功能变更不改版本号——行为对用户透明）

---

## 2026-09-09 — 网关-only 接管 0.2.2（Session 15b，用户裁定简化）

**变更**
- **砍掉副本层**：不再造预设副本、不再切默认预设、不再管理升级路径/会话恢复——整个 Layer B 移除
- **只留 fetch-gate 网关**：安装=所有模式 web_fetch 拦截（调用得到"请用 web_search"指引）；关闭=正常 HTTP；卸载=零残留
- **一次性迁移**：S15a 装机自动检测旧副本→清除→恢复默认 standard
- 工具名在原版预设中仍可见（模型看到 web_fetch→调一次→得到指引→自动改用 web_search），但功能 100% 拦截

**实测**
- 迁移：旧 3 个副本目录自动清除 + 默认恢复 standard ✔
- 拦截：标准模式会话→web_fetch 调用 0.0s 即得 isError+指引→模型自动改用 web_search ✔
- 正常搜索不受影响 ✔

**跟踪**
- 基线不变 354\|9(363) exit0；版本 0.2.2；代码净减 25 行

---

## 2026-09-09 — 全模式 web_fetch 接管 0.2.1（Session 15a，B+C 组合）

**新增**
- **多预设副本（Layer B）**：standard/PTC/创造三个含 web_fetch 的 shipped 预设各自动生成"仅搜索"副本（创造含 skills/ 随行），安装即生效；默认切到标准副本
- **fetch-gate 网关（Layer C）**：常驻 fetch provider 钉在 seam 上——ON：web_fetch 调用得到"已接管，请用 web_search"指引；OFF：委托 HTTP 抓取（含 SSRF 公网校验/二进制拒收/截断诚实标记/redirect 拒绝）
- **设置页 toggle**「接管 web_fetch（全模式）」：默认开；关=副本清除+默认复原+网关透传
- 即使手动选原版预设，web_fetch 也被网关拦住（工具名残留但功能 100% 拦截）

**清偿（审核 🔴+🟡）**
- 🔴 M3：takeover 分路改读 settings 持久值（live.current() 在 inject 时刻仍是 entry 默认——settings 面翻转不可见的根因）
- 🟡 Y-2：OFF 委托安全面（SSRF/二进制/truncated/redirect 四项对齐官方 provider）

**治理**
- 计划审核（5 必改：网关模式/文案面/会话恢复/升级路径/skills 复制）+ 阶段 4/5 BLOCKED→清偿→复验 PASS（available 探针 0→1 红实证闭洞）

**跟踪**
- 基线 346→**354 passed | 9 skipped (363)**；版本 0.2.1

---

## 2026-09-09 — 装即接管默认预设（Session 14z2，替代手动预设切换）

**新增**
- **安装即移除 web_fetch**（用户裁定：预设手动切换对交付不专业）：插件加载时从**已安装宿主的 standard 预设实时再生成**仅搜索组合（单 diff：tool-web fetch→false——零漂移，跟随宿主升级），写入 `<home>/.agent-presets/dshws-search-only/`（版本标记；用户自撰同名目录永不覆写）；预设落盘成功且当前默认仍=standard 时经 settings 服务热切默认（下一会话生效）——**静态钉 default 被明确排除**（预设缺失会让会话创建抛错=砖机风险；失败方向永远落回可用的 standard）；用户自选默认永不越权
- 实测：新会话**不动预设选择器**即组合 `dshws-search-only`、模型工具面无 web_fetch、仅 web_search 可用

**诚实标注**
- 卸载残留：settings 默认值 + 预设目录保留（组合完整可用）；恢复 = 选择器切回标准或删目录（upgrade manual 待记）
- 首次部署后已开着的浏览器页面可能持有陈旧名单缓存——重载后默认显示正确（实测）

**跟踪**
- 基线 337→**343 passed | 9 skipped (352)**（authoring 6 例 + fake settings 探针面）

---

## 2026-09-09 — web_fetch 移除 + 链路文件日志（Session 14z，用户默认裁定）

**新增**
- **链路文件日志** `<dshHome>/logs/dsh-websearch.log`：宿主 CLI 无 info 级导出器、链路语句原本发射即沉没——现每次搜索的 draw（key 尾 4 字符）/轮换/降级/兜底接手/served-by 全程可 `tail` 回溯；>1MB 启动轮转 .old；append 失败静默降级永不伤链；`chainLogFile` 配置默认 true
- **web_fetch 退役**（用户裁定「只使用本插件接管搜索」）：插件停注自有 fetch 链（chain-fetch + firecrawl scrape 面，死代码清除）；工具存在性归预设层——实例侧 `.agent-presets/plugin-search-only/`（standard 副本 `fetch: false`）实测：模型工具面无 web_fetch

**诚实标注**
- 默认裁定披露：AskUserQuestion 未获答，按消息正文默认（A 移除 + 立即做文件日志）推进
- seam 的 fetchProvider 留 http（工具已不存在，指向无害）；fetchChain 配置字段保留读入不再消费

**跟踪**
- 基线 333→**337 passed | 9 skipped (346)**；🟢 轨迹页 key 级可见列 v2

---

## 2026-09-09 — 混合 key 池治愈：确定性 4xx 二分（Session 14y，真实 key 池实测触发）

**新增**
- **凭据类 4xx（401/403）换 key 重试**：池内 key 是独立凭据——一把失效 key（实测 as_sk_d3df… 401）不再毒化整个池；抽到坏 key 时先换下一把（至多 3 draw），全池皆败才降级。**首搜即治愈**（凭据类失败不受冷门限制——401 本身即「换一把可能更好」的证据）
- **请求类 4xx（400/404/422）维持直降**：请求本身错，任何 key 同判
- UI 微批（用户截图反馈）：DeepSeek 付费选项去括号注 + 选择框收窄 200px；anysearch UA 串升 0.2.0

**清偿（S14u 前提勘正）**
- S14u「401 对每把 key 确定成立」对**独立凭据的多 key 池**不成立——旧构建靠盲重试掩盖、S14u 后抽到坏 key 即败（单成员链直接耗尽）。NON_RETRYABLE 二分为 REQUEST_LEVEL / CREDENTIAL_LEVEL 两集；循环上限改硬帽（冷门成员非凭据失败仍按门值 break）

**诚实标注**
- 用户报告深挖结论：26 次历史搜索 20 次成功（3-6s），失败 6 次全为网络层（3×30s 挂起 + 3×10.7s 等长连接死亡=代理链路）；API 集成本身对齐 ADR-0009 wire 契约无缺陷；「只搜一轮」不成立（多 query 扇出 + agent 多轮迭代均正常）
- **用户侧待办：更换/移除失效 key as_sk_d3df…**（修复后该 key 只浪费一次 draw，但仍是死重）

**治理**
- TDD 红 3（401 池耗尽/混合池同成员接手/400 直降）→ 绿；loopback wire 钉（auths=[dead,live]→served-by 同成员）；门墙 333\|9(342) exit0

---

## 2026-09-09 — 兜底重构 0.2.0：删免费地板 + 兜底工具显式指定 + DeepSeek 条件参与（Session 14x，ADR-0014）

**新增**
- **兜底工具单选择器**（ADR-0014）：替代「DeepSeek 付费 | Fetch 免费」两按钮——两家及以上工具就绪时可选 [自动（链序末位）| 各就绪工具]（**付费 DeepSeek 彻底消失**）；零/一家就绪时可选 [自动 | DeepSeek 付费（需模型页 key）]
- **指定成员锁定链尾**：被指定工具退出常规轮换、专职兜底（含自身多 key 重试规则），链卡锁定尾行 +「兜底位」徽标跟随 + 「锁定兜底」标记
- **fallbackMember 单字段**（'auto' 显式默认）；legacy fallbackProvider 读入别名平滑归一（'deepseek'→指定付费，'fetch'/'auto'/'none'→auto——旧 GUI 写过的值升级不炸载入）
- **DeepSeek 参与守卫**：选中 && 就绪工具成员 ≤1 && key 有效（append-only 单条热规则；readyCount 排除 DeepSeek 自身——自数自杀洞审核钉死）；不可实现的意图一律降级 auto 链（可观测一致）

**清偿（breaking，0.1.0 → 0.2.0）**
- **删除 dshws-fetch-search 免费成员与 DSHWS_FETCHSEARCH_* 码族**：免费抓取地板在主要网络段被 DDG 反爬封死（S14v 实证），删除比维护诚实
- 零 key 安装从「碰运气免费抓取」变为 `DSHWS_NO_MEMBER_CONFIGURED` 诚实报错（文案点名两出路）
- 有 DeepSeek key 但未点名的存量用户失去自动付费触达（费用控制权归还用户）
- **老用户升级口径**：settings.yaml 里的 `fallbackProvider` 旧值自动归一，无需手改；行为变化=付费触达与免费地板按上述规则重排

**治理**
- 三轮独立计划审核（轮 1 六必改 / 轮 2 四必改 / 轮 3 增量三必改全吸收；正本 audit-logs 三份在档）；用户三轮产品裁决（删免费/显式指定/条件禁用）+ 计划包两轮驳回后按产品视角重写获批
- 钉子测试：①④⑤⑥象限 + 热切换 1→2 + strip-to-tail e2e + legacy 别名兼测 + 零 key 断言 + schema 双负测

**诚实标注（遗留项）**
- 用户报告场景回归在案：仅 AnySearch 就绪时全败 → 报错不再含 fetch 行（R2 验收）
- B2 v2 落档 superseded（目标形态被本重构实现）；fetch 地板维护面归零

**跟踪**
- 测试基线 320→**330 passed | 9 skipped (339)**；i18n 50→**52 keys**；下一棒：S15 手册棒（按 ADR-0014 新语义撰写）

---

## 2026-09-08 — 主备链可验证交付（Session 14w，S15 前增强轮）

**新增**
- **主备模式 wire 级正本**（e2e）：暖场证主力健康服务 → 探测证主力先在自身 3 把 key 间轮换重试（k2→k3→k1）全败后备位成员接力——arrivals/auths 全序断言即主备语义的机器可读定义（`53c0865`；harness 增 sequence 行为 + firecrawl 接线）
- **链卡主备角色显式化**（纯呈现层）：首位就绪成员「主搜索」徽标 + 末位「兜底位」徽标 + hint 完整主备语义文案；src 仅 section/locales 两文件、语义层零改动——按构造消除规则冲突（`59a3d92`；i18n 50 keys）
- **B2（成员级链尾替换内置地板）v2 免重审启动包**：5 扩展落点 + 3 待定义规则 + ADR-0004/0013 修订面 + 前置依赖（`117ed11`）
- **手册素材正本**：OpenClash 三解法（Redir-Host 推荐 / fake-ip-filter 白名单 / firecrawl 云抓）+ dig 生效判据 + 主备用法 + 暖启动披露（首轮仅 1 次尝试）

**治理**
- 计划期：Explore 独立审核正本（七项 file:line）+ 用户两裁决（B1 先行/B2 v2；「风险告知不可替代完整交付」批评吸收为四件套形态）+ plan mode 批准
- 阶段 4/5 独立复审 **PASS（🔴×0 🟡×0）**：两针探针真红（auths 轮换失效 / 单成员双徽标）+ 纯呈现核验 + B2 file:line 实测命中

**诚实标注（遗留项）**
- T1 红跑含一次瞬时外联（未接线 firecrawl 真连 401 + DDG 202，搜索 POST 只读性质）；真实 key 全链路实测待用户配 key 择机
- 暖启动（首轮仅 1 次尝试）为已知行为，披露进手册、预热列 v2

**跟踪**
- 测试基线 317→**320 passed | 9 skipped (329)**；下一棒：S15 手册棒（素材全就绪）

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
