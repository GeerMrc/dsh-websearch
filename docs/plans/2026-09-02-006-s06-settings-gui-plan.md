# Plan — 2026-09-02-006-s06-settings-gui-plan

> plan 是验收契约：R 验收条目是 progress 台账阶段验收的对照正本，验证矩阵是各阶段验证的
> 单源引用；🟢 债务归属映射的正本在本文件债务映射节。本棒为 GUI 产品代码棒（client half
> 新增 src 面）：核心逻辑/契约类任务走 TDD 红→绿逐一执行；配置/构建契约类任务以命令实证
> 为验证手段（分类由阶段 2 审核 Agent 确认）。

## 目标

S06 交付 roadmap ⏳ 行「网页搜索」设置页骨架：本仓库自带 client half（`src/client/` 构建
`lib/client.js`，ADR-0006 GO 形态）注入 `settings.section` slot，渲染 5 个 provider 卡
（key 输入→credentials 写通路、状态点、启停热改）+ 链只读展示，双语 typed dictionaries；
jsdom 组件测试绿 + 浏览器 DOM 断言（页面出现/卡片渲染/key 写入后 credentials.describe
可见）。node half 零变更预期（settings/credentials seam S04/S05a 已就绪并实测）。

## 背景

任务源 = `docs/session-roadmap.md` Session 06 ⏳ 行；GUI 形态正本 = ADR-0006（外置
client half GO + 构建契约）+ S02 spike H1-H4 实录（slot 注入/locale/细粒度 inject/
remote 写通路全链实测）；settings 语义正本 = ADR-0002/0003/0004 + `src/settings.ts`
（ns `dsh-websearch`，热子集 = 链序/超时/启停）。

阶段 0 独立审核（2026-09-02，骨架库 v2，正本
`docs/sessions/audit-logs/2026-09-02-s06-stage0-review-of-s05b.md`）：对 S05b **PASS**
——🔴×0；🟡×0；🟢×1 维持（L-2）+ 新增观察 ×2（tgz 尺寸转录漂移 / STATUS M3 总表行口径），
均 🟢 级，处置见债务映射节。

阶段 2 独立审核轮 1（2026-09-02，骨架库 v2）：**NEEDS REVISION**（必改 ×1：D6 漏
`@types/react` 且 devDeps 项数与高危预告①口径不齐；建议 ×4：D5「12r」悬空引用〔全仓无
出处〕/ searchChain 双链与双语字典两处范围移动未显式标注 / platform.ts 行号笔误 :16→:12 /
minimumReleaseAge 闸预案缺；观察 ×4：remote.session 裁剪、T8 配方措辞、settings/document-
updated 不订阅、externals grep 判据措辞）——本 plan 为修订版：必改 + 建议全数吸收，观察
随批落实或留痕（锚点抽查 30+ 处仅 1 处行号笔误已修）。复审续用同一审核 Agent。

阶段 2 独立审核轮 2（2026-09-02，同 Agent 续审）：**APPROVED**（必改 1 闭合、建议 2-5
全数忠实落位、修订无新问题；唯一残留 = T-prep `@testing-library/jsdom` 包名笔误〔观察级〕，
已随批修正）。正本：docs/sessions/audit-logs/2026-09-02-s06-stage2-plan-review.md。

阶段 1 只读摸底实锚（2026-09-02 亲测，宿主 deepseek-harness dev@3281e04b59）：

- **范本包**（`packages/client/ui-settings-plugins/`）：node half 空 `apply()`（src/index.ts:11）+
  client half `src/client/index.ts`；服务声明 `inject = ['slots','locale','remote',
  'remote.credentials','remote.session','settingsScope']`（:59-61）；locale 注册
  `ctx.locale.register(NS,{zh,en})` + `ctx.locale.bind(NS)`（:67-69）；设置节注入
  `ctx.slots.inject('settings.section', () => ctx.slots.register({name,id,order,label,
  locale,inject,children}, Component))`（:149-157）；keyed 子槽 generator 注入（:171-202）。
- **内置 WebSearchCard 对照**（同包 `src/client/WebSearchCard.tsx:14-27` +
  `web-search-card-controller.ts`）：DeepSeek 搜索卡——SecretField（password + configured
  徽标，fields.tsx:128）、`credentials.set` 后 re-read（controller:169-175）、
  `credentials/reference-updated` 订阅（index.ts:84-87）；NS 常量就地拼写注释（controller:23-25
  「client package must not depend on a Host package」——外置包自带常量的先例）。
- **模块表基线**（`packages/client/web/src/platform.ts:10-18`）：`PLATFORM_MODULES` 含
  `react`、`react/jsx-runtime`、`react-dom`、`@deepseek-ai/cordis`、dsh-client-store、
  dsh-client-ui-slots、**dsh-client-ui-primitives**；`PRELOADED_CLIENT_EXTERNALS` 空。
- **manifest 读取语法**（`packages/client/modules/src/client/manifest.ts`）：`dsh.client`
  声明读 `inject`（装载顺序边，:58/:196）+ `external`（精确模块请求，:62/:197）+
  `platform`——字段名亲证（S05b 嵌套键教训的内建防御）。
- **构建契约**（`packages/client/tsdown.client.ts:445-593`）：cjs + `entryFileNames:
  'client.js'`（:576）+ `inlineDynamicImports`（:582）+ banner/footer/intro ModuleLoader
  三件（:589-591）+ externals = 请求面（:462-470）+ CSS Modules 内联插件（:519-542）。
  外置包复刻四件套与声明（ADR-0006 Consequences 明示）。
- **ui-primitives 面**（`packages/client/ui-primitives/src/index.ts:1-71`）：StateDot
  （四态 done/warning/ongoing/error）、Button、Input、Pill 等；无独立 Switch 原语——
  上游设置卡自绘 `role="switch"` button（SubagentModelSelectionCard.tsx:76-86）；令牌 =
  `--dsw-alias-*`（ui-theme/src/styles/design-platform.css:157-186）。
- **remote 类型面**（`packages/api/settings-controller/lib/typert.remote-client.d.ts`）：
  `settings.describe()`→`{writable,hasDocument,namespaces:SettingsNamespaceView[]}`
  （types.ts:66-73；视图含 `{ns,schema,value,base?,user?,applies,secrets,revision}` :33-54）；
  `settings.update(ns,patch,expectedRevision)`→`SettingsNamespaceView`；`credentials.
  describe(refs[])`→`Record<ref,{configured,source?,writable}>`（credentials types.ts:67-74）；
  `credentials.set/unset(ref,value)`；`RemoteResult<T>` ok/error 收窄
  （typert/protocol/src/types.ts:74-76）。
- **测试范本**（`ui-settings-plugins/tests/section.client.spec.tsx:1-29`）：vitest + jsdom
  per-file pragma `// @vitest-environment jsdom` + `@testing-library/react` render/firewall；
  手造 props（`t = (key) => en[key]`）；根 devDeps：@testing-library/react ^16.3.2、jsdom
  29.1.1（根 package.json:164-179）；react ^18.2.0（web:40-41/ui-settings-plugins:61）。
- **本包现状**：`src/`（chain/config/credentials/errors/index/settings/providers）、tests 18
  文件基线 157 passed | 6 skipped (163)；`tsconfig.json` 无 jsx/dom lib（client 面需拆分）；
  `tsdown.config.ts` 单 node ESM 配置（JSDoc 已预告 client 配置 S06 加入）；manifest 嵌套
  `dsh.bundle.patch` 正确形态在位。
- **npm 发布面**（2026-09-02 `npm view` 亲测）：五个 client 包（dsh-client-locale /
  dsh-client-ui-slots / dsh-client-ui-settings / dsh-client-ui-primitives / dsh-api-remotes）
  全部发布至 `0.1.2-alpha.5`（alpha.4 在线）——devDep 锚 `0.1.2-alpha.4`（本仓现有 devDep
  线一致，dont-do 第 1/2 条已核）。

## 范围决策（D1-D6，供阶段 2 审核判定层级）

| # | 决策 | 依据 |
|---|---|---|
| D1 | client 组件架构 = 自持轻量控制器（直连 `remote.settings.describe/update` + `remote.credentials` 批量 describe/set/unset + `credentials/reference-updated` 订阅 + 本地刷新）；**不引入** settingsScope/store 快照机制（上游 WebSearchCard 面较重——store 绑定属 S07 排序交互再评估；S02 spike 证直连 remote 面全通） | 骨架最小面；spike H3/H4 先例；细粒度 inject 纪律（`remote.settings`/`remote.credentials` 显式声明，漏声明 fail-loud——ADR-0006 证据 4） |
| D2 | ui-primitives（StateDot/Button/Input）经 manifest `dsh.client.external: ['@deepseek-ai/dsh-client-ui-primitives']` 请求——模块表基线含它（platform.ts:12）；自定义样式最小化：开关自绘 `role="switch"` + inline style 消费 `--dsw-alias-*` 令牌，**不引入 CSS Modules 构建机制**（外置复制宿主 lightningcss 内联插件的复杂度骨架期不值得；S07 视需要再评估）。**Fallback**：若运行时 external 解析失败 → 自绘等价原语（tokens 不变），决策留痕 | roadmap WBS「复用 ui-primitives/alias 令牌」；manifest.ts:47 external 语义；external 请求宿主先例（session-controller/workspace-controller package.json `external` 字段实存，阶段 2 审核亲验） |
| D3 | 构建契约 = 本仓自备 client tsdown 配置复刻宿主四件套（format cjs + `entryFileNames: 'client.js'` + `inlineDynamicImports` + banner/footer/intro，id = `'dsh-websearch'`）；externals = `react`/`react/jsx-runtime` + dsh-client-ui-primitives；**不产出 client dts**（`exports["./client"]` 无 types 键，npm type face 保持 node half） | ADR-0006 构建契约（spike 实测）；宿主 tsdown.client.ts:576-591 |
| D4 | i18n = typed dictionaries（`declare module '@deepseek-ai/dsh-client-ui-slots'` 扩 `LocaleNamespaceMap` + `Record<Key,string>` zh/en 双语字典——**编译期强制 en/zh 键 parity**）；运行时 parity 冒烟测试随 T3 交付；S07 的 parity 校验脚本 + 字典外 CJK grep 门禁不在本棒（roadmap S07 项原样）。**范围锚定说明**：双语字典自 roadmap S07 前置入 S06，是 GUI 渲染的技术前提（S02 spike H3：导航/标题/正文均经字典渲染）；该前置为增量，不缩减 S07 验收——S07 parity 脚本/CJK grep/排序原样保留 | locale register 契约（缺/多键编译错，locale client index.ts:359-370）；roadmap S06/S07 行 |
| D5 | 浏览器 DOM 断言 = **agent 实测棒**（授权链：S05b 接力指令显式预告「GUI 涉实例与浏览器实测须守 user-paces-verification 惯例 + scratch 隔离配方」+ 本仓正本先例 = S02 spike H1/H4——agent 对 scratch 实例做浏览器 DOM 断言 + fake 值写入 + unset 复原 + 真实 `~/.dsh` 零接触，全部亲验在档）：scratch = `DSH_HOME=/tmp/dshws-s06/home` + `web` 模板 + 端口 **3412** + 启动 cwd=deepseek-harness 仓根；凭据只写 **fake 值**（断言后 unset 复原）；3080 实例、`~/.dsh`、`/tmp/dshws-s05b/`（用户 with-key 槽位现场）零接触；**with-key 真实搜索仍归用户槽位不变**（惯例本义 = 环境备好即停，真实 key 实测由用户择机） | session-05b.md:89-92 预告原文；S02 记录 H1/H4 节；user-paces 惯例（session-05a:74/82、session-05b:84/92） |
| D6 | devDep 锚（共 **12 项**）：client 五包 `0.1.2-alpha.4`（与现有 dsh-* devDep 线一致）；`react`/`react-dom` `^18.2.0`（宿主两处亲证）；`@types/react` + `@types/react-dom`（`jsx: react-jsx` client face typecheck 硬依赖——阶段 2 必改 1 补正；宿主 ~18.3.x）；jsdom 29.x + `@testing-library/react` ^16.3.2 + `@testing-library/dom` ^10.4.1（宿主根版本）；peerDependencies **不新增** client 包（运行时由宿主模块表/激活序供给，非 npm 安装面——typecheck 需求由 devDeps 承载）。**minimumReleaseAge 预案**：新装近期发布包可能触发该闸（pnpm-workspace.yaml 现存 12 条 alpha.4 exclude 先例）——若五 client 包 alpha.4 被闸，按既有形态增补对应 exclude 条目并随 T-prep 留痕披露 | npm versions 亲测；宿主 package.json 实锚；ADR-0007 交付形态（client 包不经 npm 安装链） |

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 类别 | 前置 |
|---|---|---|---|---|
| T0 | 治理批（纯文档直提 master）：阶段 0 audit-log 落盘（已完成待提交）+ STATUS 启动刷新（S06 🚧 台账行 + 当前位置块 + **M3 总表行口径统一**=🟢-6 处置）+ progress-M3 T-prep 行尺寸注记（🟢-5 处置）+ 本 plan 落盘 | 四处 file:line 可查 + 🟢 声明入 commit message | docs | 无 |
| T-prep | 依赖引入（高危预告①）：D6 全列 12 项 devDeps（先 `npm view` 复核 react/@types/react/jsdom/@testing-library/react 版本存在性——复审轮 2 残留笔误 `@testing-library/jsdom` 已修）+ `pnpm install` 留痕；**minimumReleaseAge 闸预案**（D6）：被闸即按既有形态增补 exclude 条目并留痕披露；新增零 peer 依赖核对 | install 输出 + package.json diff（+ 如触发：pnpm-workspace.yaml exclude 增补 diff） | 机械类 | T0 |
| T1 | tsconfig 双面拆分：root 保持 node face；新增 `tsconfig.client.json`（`lib` + `dom`、`jsx: react-jsx`、include `src/client/**` 与 `tests/client/**`）；`typecheck` 脚本双跑（node face + client face） | 双 typecheck exit 0 + 既有 163 测试零漂移 | 配置类 | T-prep |
| T2 | 构建契约 + manifest（D3/D2 声明面）：`tsdown.config.ts` 双配置（node ESM 现状保形 + client cjs 四件套，externals 按 D3）+ package.json 增 `exports["./client"]` 与 `dsh.client{platform:'web',inject:[locale,ui-settings,api-remotes],external:[ui-primitives]}` | `pnpm build` 产出 lib/client.js；banner 字节精确（ModuleLoader 三件）；产物 grep 判据 = `@deepseek-ai/*` **仅以外部 require 形态出现，无内联实现体**（externals 生效）；`npm pack --dry-run` 清单含 client.js；manifest 字段名与宿主读取语法（manifest.ts:196-206）一致 | 配置类 | T1 |
| T3 | typed dictionaries（D4）：`src/client/locales.ts`（NS + flat 键 union + zh/en 字典，键集覆盖导航/标题/5 成员名/key 输入/保存/清除/启停/状态/链展示全部 UI 文案）+ `declare module` 扩 `LocaleNamespaceMap` | TDD 红→绿：键集 parity 运行时冒烟测试先红（模块缺失）→ 实现 → 绿；typecheck 双 face 绿（编译期 parity 生效） | 契约类 | T2 |
| T4 | 设置控制器：`src/client/controller.ts`——describe 初始化（ns value→成员 enabled/apiKeyEnv/链/超时，客户端缺省与 resolveConfig 同源常量）+ credentials 批量 describe（5 ref）+ `credentials/reference-updated` 订阅刷新 + `setKey/unsetEnabled` 动作（RemoteResult 收窄 + expectedRevision 陈旧重读） | TDD 红→绿：fake remote stubs 全行为断言（初载/缺省回退/写 key→set 调用+刷新/启停→update 调用+patch 形状/事件→重 describe/RemoteResult error→状态不翻+留痕） | 契约类 | T3 |
| T5 | 设置节组件：`src/client/section.tsx`——节头（标题+说明）+ 5 provider 卡（成员名/StateDot 状态点〔configured→done / 否→warning〕/ SecretField 形态 key 输入 + 保存/清除按钮 + `role="switch"` 启停开关，inline `--dsw-alias-*` tokens）+ 链只读块（searchChain/fetchChain 有序列表 + 超时值。**roadmap 锚定说明**：WBS 原文 fetchChain，双链只读 = 对称扩展〔config.ts:85-87 两链对称、S07 排序前置底座〕，增量不缩减 S07 验收） | TDD 红→绿：jsdom 渲染断言（5 卡/双语 t/状态点 data-state/保存→controller.setKey 调用/开关→controller.setEnabled 调用/链列表逐项） | 契约类 | T4 |
| T6 | client entry：`src/client/index.ts`——`inject = ['slots','locale','remote','remote.settings','remote.credentials']` + locale register/bind + `ctx.slots.inject('settings.section', …register({name:'settings.section', id:'dsh-websearch', order:16, label, locale}))` + 控制器生命周期（创建/随注册闭包注入组件）。范本的 `'remote.session'` 显式裁剪（骨架不用 session 面，D1 范围内）；若 T8 fail-loud 直指缺失键则低成本补声明并留痕 | TDD 红→绿：stub ctx 捕获断言（register 参数契约/locale NS 注册/inject 数组面） | 契约类 | T5 |
| T7 | 门墙收口 + Agent Note + progress 增补：环境验证 + 四命令（`pnpm test` 全量〔漂移哨兵：163→163+N、既有 157|6 零破坏〕/ `typecheck` 双 face / `lint` / `build` 双产物）+ `npm pack --dry-run` 清单；Agent Note 落 docs/notes/（client half 构建/测试/交互面实录——S09 手册素材）；progress-M4 新开台账 | 四命令绿 + Note/台账落盘 | — | T6 |
| T8 | 浏览器 DOM 断言（D5，agent 实测棒）：build + `npm pack` → `/tmp/dshws-s06/` scratch（安装序列 = runbook §1 命令重放；boot/端口配方 = S02 T3 同款，端口 3410→本棒 3412）→ boot → browser-use 断言链：①combo 含 dsh-websearch id（combo-only 分发，ADR-0006）②设置导航 zh「网页搜索」/en 出现（含 en↔zh 热切换）③节渲染 5 卡 ④tavily 卡写 fake key → 保存 → 状态点翻转 + credentials describe 可见（S02 H4 复验）⑤启停关 → describe revision 变化 + scratch `settings.yaml` 落盘 `enabled: false` ⑥unset 复原 → describe configured:false → kill 实例 | 断言原文逐条入 session 记录 + 命令清单 | 实测类 | T7 |
| T9 | 阶段 4/5 独立审核 + 交叉验证：R1-R5 逐条对峙 + 隔离审计（DSH_HOME/端口/`~/.dsh`/3080/s05b scratch 零接触清单）+ 冒烟（重放一条 jsdom 测试 + 一条门墙命令） | PASS / COMPLETE 落 progress-M4 | 独立 Agent | T8 |
| T10 | 收尾 6 件套 + 原子翻转（STATUS 台账 ✅ + 当前位置块 + progress-M4 验收表 + roadmap S06 行 ✅；M4 里程碑行按 S06+S07 两棒结构表述）+ 踩坑沉淀 + 接力指令（S07；记录末节 + 回复末尾）+ `feat/s06-settings-gui` `--no-ff` 合入 master | R5 全过 | — | T9 |

执行纪律：开发自 **`feat/s06-settings-gui` 分支**推进（T-prep 起；T0/计划纯文档直提
master）。TDD 任务（T3-T6）逐一红→绿→commit，禁批量；配置/机械类（T1/T2/T-prep）以命令
实证留痕（分类由阶段 2 审核 Agent 确认）；写操作严格串行；**scratch 外零写**（仓库外路径
仅 `/tmp/dshws-s06/`）。

## 验收条目（R1-R5，progress-M4 阶段验收逐条对应）

- **R1** client half 构建契约可重放：lib/client.js 在位 + banner 字节精确 + 产物零
  `@deepseek-ai/*` 值内联 + `exports["./client"]`/`dsh.client` 三字段与宿主读取语法一致 +
  pack 清单含 client.js——命令原文与 grep 关键行
- **R2** 设置节注入可重放：jsdom 契约（register 参数 name/id/order/label/locale + NS
  注册）+ 浏览器 DOM（导航项出现、节面板渲染、en↔zh 热切换）
- **R3** provider 卡交互可重放：jsdom（保存→`credentials.set(ref,…)`/清除→unset/启停→
  `settings.update(ns,{<member>:{enabled}},expectedRevision)`）+ 浏览器（fake key 写入后
  状态点翻转 + credentials describe 可见——S02 H4 写通路复验；启停→revision 变化 +
  `settings.yaml` 落盘）
- **R4** 链只读展示：searchChain/fetchChain 逐项 + 超时值渲染自 describe value（客户端
  缺省同源；双链 = roadmap fetchChain 项的对称扩展，见 T5 锚定说明）——jsdom + 浏览器双面
- **R5** 五子证据逐面判定：①隔离（全程 DSH_HOME=/tmp/dshws-s06、端口 3412、`~/.dsh`/
  3080/`/tmp/dshws-s05b` 零接触、fake key unset 复原——命令清单逐条）②门墙四命令绿 +
  基线漂移哨兵（163→163+N，既有零破坏）③收尾 6 件套齐 ④原子翻转 + `--no-ff` 分支闭环
  ⑤typed parity（编译期）+ 阶段 4/5 audit-log 原文落 `docs/sessions/audit-logs/`

## 验证矩阵

| 验证面 | 触发时机 | 责任阶段 | 采信规则 |
|---|---|---|---|
| 依赖引入与版本锚 | T-prep | 3 | npm view 原文 + install 输出 |
| 双面 typecheck | T1 起每任务 | 3 | exit 0 亲见 |
| 构建契约（banner/externals/pack） | T2 | 3 | build 输出 + grep 原文 + pack 清单 |
| locales parity | T3 | 3 | 红证据内嵌记录 + 绿数字 |
| controller 行为 | T4 | 3 | 红→绿逐行为断言（红证据内嵌义务） |
| 组件渲染/交互 | T5 | 3 | jsdom 断言原文 |
| entry 注册契约 | T6 | 3 | stub ctx 捕获断言 |
| 门墙四命令（全量唯一责任点） | T7 | 3 / 4 | 主 Agent 亲跑；阶段 4 重放 |
| 浏览器 DOM 断言链 | T8 | 3 | 断言原文逐条入记录；阶段 4 抽查重放 |
| R1-R5 对峙 + 隔离审计 | T9 | 4 | 独立 Agent 实测 |
| 冒烟 | T9 阶段 5 | 5 | 独立 Agent 亲跑；采信阶段 3 数字 |

## 高危命令预告（阶段 2.5 披露，对照 governance §3.4.7 清单）

1. **依赖安装**：T-prep 12 项 devDeps 新增（npm registry 访问；新增非删除；真实 `~/.dsh`
   零接触；如触发 minimumReleaseAge 闸 → pnpm-workspace.yaml exclude 增补属依赖面变更随
   T-prep 留痕）
2. **仓库外路径写入**：/tmp/dshws-s06/ scratch 创建与写入（S02/S05b 授权形态；仅限本棒
   自建目录；**`/tmp/dshws-s05b/` 用户槽位现场零触碰**）
3. **实例启动与进程收尾**：scratch web 实例（端口 3412，非 3080）+ `kill $(lsof -ti
   :3412)`（本棒自启实例，精确端口定位）
4. **scratch profile 内 pnpm install**：`dsh plugin add` tarball 安装转发
5. **浏览器自动化 + fake 凭据写入**：browser-use 对 scratch 实例 token URL 访问与 DOM
   操作；向 scratch `.credentials.yaml` 写 **fake 值**（真实凭据零接触；断言后 unset 复原）
6. **明确不做**：npm publish / git push / 真实凭据读写 / `~/.dsh` 任何写入 / 3080 实例
   触碰 / `/tmp/dshws-s05b` 触碰 / 治理产物删除

## 债务归属映射（正本）

| 债务 | 等级 | 归属 | 依据 |
|---|---|---|---|
| L-2 per-profile GUI 覆盖二期候选 | 🟢 | 二期候选，不排期（不变） | ADR-0004 |
| 🟢-5 tgz 尺寸转录漂移（16644B 首包 vs 重打包 16654B） | 🟢 观察 | **T0 注记清偿**（progress-M3 T-prep 行） | s06-stage0 审核观察 5 |
| 🟢-6 STATUS M3 总表行口径（⏳ vs 🚧） | 🟢 观察 | **T0 统一清偿**（启动刷新批次） | s06-stage0 审核观察 6 |
| firecrawl fetch 面 402/429 it 缺独立覆盖 | 🟢 观察 | 不处置（不变）；S08 e2e 若覆盖则自然收口 | S05a 阶段 4/5 审核观察 |
| settingsScope/store 快照机制未用（上游 WebSearchCard 面较重） | 🟢 观察 | S07 排序交互时再评估（D1 显式范围决策，非遗漏） | 本 plan D1 |

## 风险

- **external 运行时解析**：模块表基线含 ui-primitives（platform.ts:12 亲证）+ manifest
  external 请求语义（manifest.ts:47/62）——若 T8 combo/运行时 require 失败 → D2 fallback
  自绘原语，决策留痕（构建面不受影响）
- **tsdown 双配置形态**：tsdown 0.22.2 对单文件数组导出的支持未亲证——T2 实测定形；
  fallback = 双配置文件 + `build` 脚本串联两次 tsdown
- **alpha.4 类型面 vs 宿主 dev 树**：typecheck 以 npm alpha.4 为准，运行时以宿主 dev 树
  （3281e04b59）为准——S02 spike 在同宿主树全通（低风险）；漂移若现形以 T8 实测为准留痕
- **oxlint 对 .tsx**：现门墙 30 files/96 rules 未含 .tsx——T7 报实际数字；新告警按规则
  逐条评估（不裸禁全局规则，narrow 例外需说明）
- **vitest jsdom 面**：仓库无 vitest 配置文件，per-file pragma 自带环境（宿主同款）——若
  发现必需全局项补最小 vitest.config.ts（测试基建，范围留痕）
- **combo-only 分发**（ADR-0006 负面后果）：T8 断言①显式覆盖；若 boot 快照不含本包 →
  先查 manifest 声明面（T2 已对宿主读取语法核验）再查 boot 图
- **/tmp 易失**：scratch 断言完成后 kill 实例；scratch home 保留供复核（不清理——用户可
  按 session 记录命令序列重建；与 s05b 槽位现场互不影响）
