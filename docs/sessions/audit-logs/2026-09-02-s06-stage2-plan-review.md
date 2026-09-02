# Session 06 阶段 2 计划审核输出（轮 1 + 轮 2 原文逐字）

> **落盘说明**：本文件为 Session 06 阶段 2 独立审核 Agent 两轮输出原文逐字（主 Agent 转录落盘）。

---

# 轮 1：独立审核报告 — Session 06 计划（阶段 2，轮 1）

**参数头**：审核库 v2 ｜ 阶段 2 轮 1 ｜ 对象 = `docs/plans/2026-09-02-006-s06-settings-gui-plan.md` ｜ 输入指针：session-roadmap.md S06 行（:42）、adr-0006/0007、session-02.md、audit-logs/2026-09-02-s06-stage0-review-of-s05b.md、governance-sessions.md §3.4.6/§3.4.7、宿主仓 dev@3281e04b59（只读）、本包仓 9b59d7e（工作树含 T0 待提交变更）、npm view 实跑 ｜ 偏离说明：无（未跑 pnpm install/build/test——尚未开工无可跑面，测试基线 157|6(163) 采信 stage-0/stage45 审核链；npm view 按 PATH 导出实跑）。

---

## 逐维度结论

### 1. 可执行性 — 成立（一处前置缺口见必改 1）

- T0→T-prep→T1→T2→T3→T4→T5→T6→T7→T8→T9→T10 线性前置关系成立；T0 描述与工作树实态逐项吻合（audit-log untracked 实存；STATUS M3 总表行/台账 06 行 🚧/当前位置块/progress-M3 T-prep 尺寸注记的 diff 亲见，🟢-5/🟢-6 处置已在树）。T0「已完成待提交」表述属实。
- 验证手段均可照跑：`pnpm build` + banner grep + `npm pack --dry-run`（正确沿用 S05b 教训用 npm pack 而非 pnpm pack --dry-run）、双 typecheck、jsdom spec、T8 命令链（S02/S05b 双先例）。
- TDD 判别力：T4 六行为断言（初载/缺省回退/写 key→set+刷新/启停→update patch 形状/事件→重 describe/error→状态不翻）与 T5/T6 stub 捕获对象明确，红可构造、绿可判别——成立。T3 红态=模块缺失属弱红但有效，且编译期 parity（locale register 契约「缺/多键编译错」，locale/src/client/index.ts:358-370 亲证）提供第二重判别。
- 分类判定（本审核职责，对照 governance §3.4.6）：**T-prep 机械类成立**（新增 devDeps 零行为语义、单一意图、install+lockfile diff 单命令覆盖）。**T1/T2 配置类成立**——注意 T2 引入新产物面（exports["./client"]），不落入 §3.4.6「机械豁免」严格定义；plan 未援引豁免而以「配置类/命令实证」表述是诚实处理，条件是执行期保持一任务一 commit、不与 T3-T6 合并批处理。

### 2. 验收对峙 — 全覆盖，一处未标注的范围扩展（建议 3）

| roadmap S06 条目 | plan 覆盖 |
|---|---|
| jsdom 组件测试绿 | R5② 基线哨兵 + R2/R3/R4 jsdom 面 ✓ |
| 浏览器 DOM 断言·页面出现 | R2（导航项出现 + en↔zh 热切换）+ T8①② ✓ |
| 浏览器 DOM 断言·卡片渲染 | R2 + T8③（5 卡）✓ |
| 浏览器 DOM 断言·key 写入后 credentials.describe 可见 | R3 + T8④（S02 H4 复验）✓ |
| WBS：settings.section 注入（ADR-0006 形态） | T2/T6 + R2 ✓ |
| WBS：provider 卡（key→credentials、状态点、启停） | T5 + R3 ✓ |
| WBS：fetchChain 只读展示 | T5/R4 **扩展为 searchChain+fetchChain 双链**——合理（config.ts:85-87 两链对称存在；S07 排序前置）但**未显式标注为 roadmap 外扩展**，见建议 3 |
| WBS：复用 ui-primitives/alias 令牌 | D2 + T5 ✓ |

无漏范围。双语 typed dictionaries 自 roadmap S07 前置入 S06（D4）——GUI 渲染的技术前提（S02 spike H3 先例），D4 已写明 S07 的 parity 脚本 + CJK grep 门禁「原样」保留，拆分边界清楚，与 searchChain 一并归入建议 3 的标注义务。

### 3. 锚点抽查（亲验 30+ 处，下列为全部关键项）

| # | plan 声称 | 亲验结果 |
|---|---|---|
| 1 | ui-settings-plugins/src/client/index.ts:59-61 inject 六键 | ✓ 逐字一致 |
| 2 | index.ts:149-157 settings.section 注册 | ✓ |
| 3 | index.ts:67-69 locale register/bind；:84-87 订阅；:171-202 keyed 子槽 | ✓ 全中 |
| 4 | web/src/platform.ts:10-18 模块表含 ui-primitives + PRELOADED 空 | ✓ 内容真（列表实跨 :8-13；range 10-18 覆盖尾部+PRELOADED） |
| 5 | **D2/风险引「platform.ts:16 = ui-primitives」** | **✗ 行号错**：ui-primitives 在 **:12**；:16 是 `PRELOADED_CLIENT_EXTERNALS` 声明行（主张内容仍真，建议 4） |
| 6 | manifest.ts:58/:62 inject/external 字段；:196-206 读取；:47 external 语义 | ✓ 全中 |
| 7 | tsdown.client.ts:576/:582/:589-591 三件；:462-470 externals；:519-542 CSS 内联 | ✓ 全中 |
| 8 | typert.remote-client.d.ts：credentials describe/set/unset（:13-15）、settings.describe（:19）、settings.update(ns,patch,expectedRevision)（:24） | ✓ |
| 9 | SettingsDescribeValue types.ts:66-73；NamespaceView :33-54 八字段；CredentialInfo :67-74；RemoteResult :74-76 | ✓ 全中 |
| 10 | web-search-card-controller.ts:169-175 set 后 re-read；:23-25 NS 就地拼写注释 | ✓（writeKey 精确 :169-175；引文在 :24） |
| 11 | WebSearchCard.tsx:14-27；fields.tsx:128 SecretField（password :145）；index.ts:1-71 StateDot 四态 done/warning/ongoing/error；SubagentModelSelectionCard.tsx:76-86 role="switch"；design-platform.css:157-186 alias 令牌 | ✓ 全中 |
| 12 | 根 package.json:164-179 devDeps；react ^18.2.0（web:40-41、ui-settings-plugins:61）；section.client.spec.tsx:1-29；ui-settings-plugins src/index.ts:11 空 apply() | ✓ 全中 |
| 13 | 本包 settings.ts:23 `SETTINGS_NAMESPACE='dsh-websearch'`；config.ts:12-18 五成员；apiKeyEnv 默认名（:199-223）；tsconfig 单面；tsdown 单配置+JSDoc 预告 | ✓ 全中 |
| 14 | npm view：五 client 包 alpha.4 在线、发布至 alpha.5 | ✓ 实跑命中（注意须用 `@deepseek-ai/` scope 名，plan 用简名照录） |
| 15 | S05b 接力指令预告「GUI 涉实例与浏览器实测」 | ✓ session-05b.md:89-92 逐字亲见 |
| 16 | 阶段 0 audit-log「已完成待提交」 | ✓ untracked 实存 |
| 17 | **D5「12r 先例」** | **✗ 悬空**：全仓 grep 仅 plan 自身命中，无任何留痕定义「12r」（建议 2） |

### 4. 范围决策 D1-D6

- **D1 成立**：spike H3/H4 直连 remote 面先例 + 细粒度 inject 纪律（ADR-0006 证据 4）依据充分；「不引入 settingsScope/store」已入债务映射（S07 再评估），自洽。
- **D2 成立，fallback 可执行**：external 请求有宿主先例（session-controller/workspace-controller package.json `"external"` 字段实存）；自绘 role="switch" 有上游先例（:76-86 亲证）。依据行号 :16 笔误（建议 4）。
- **D3 成立**：与宿主 clientConfig（:445-593）四件套逐项对齐；`dts: false` 与宿主 ：457 注释理由一致；exports["./client"] 无 types 键符合 ADR-0007 四键形态。
- **D4 成立**：编译期 parity 依赖 locale register 契约（亲证）；S07 项保留边界清楚。
- **D5 授权链基本忠实，一处悬空**：要素 1（S05b 接力指令预告原文）✅ 亲验；「user-paces-verification 惯例」真实存在且语义 = 「环境备好即停，真实 key 实测由用户择机」（session-05a:74/82、session-05b:84/92），plan 把 with-key 真实搜索保留给用户槽位（D5 末句）是对惯例本义的忠实遵守，agent 做 fake 值浏览器 DOM 断言沿 S02 H1/H4 先例，无越权；**但「12r 先例」全仓无出处**（建议 2）。scratch 配方（DSH_HOME + web 模板 + 非 3080 端口 + 仓根 cwd + fake 值 + unset 复原 + s05b 零接触）完整忠实。
- **D6 有缺口**：见必改 1。

### 5. 高危清单完备性 — 覆盖成立（一处同组增补提示，见建议 5）

对照 governance §3.4.7 十类逐条：大范围删除 / reset --hard / push --force / publish（明确不做）/ 真实凭据读写（明确不做，fake+unset 复原）/ 仓库外写入（预告②，s05b 零触碰显式）/ 系统配置（无）/ 依赖变更（预告①）/ 治理产物删除（明确不做；T0 为增补非删除）/ curl|sh（无）——**无漏报**。T10 `--no-ff` 本地 merge 非 §3.4.7「PR merge」发布动作，与 S05b 先例口径一致。kill $(lsof -ti :3412) 先例同款且限定自启实例。

### 6. 债务与风险完备性 — 成立

债务映射承接阶段 0 全部发现（L-2 维持、🟢-5→T0、🟢-6→T0、firecrawl 维持、D1 显式化），与 audit-log 正本逐条对得上。风险 7 条覆盖真实翻车点（external 解析/tsdown 双配置/alpha.4 vs dev 树/oxlint tsx/vitest 无配置文件/combo-only//tmp 易失），均带 fallback 或留痕义务。未列风险：minimumReleaseAge 闸（建议 5）。

### 7. 治理合规 — 成立

九节结构与 005b 先例逐节同构（目标/背景/范围决策/WBS/R/验证矩阵/高危/债务/风险）。无提前预写收官：STATUS 06 行 🚧 + session-06.md 标注「🚧 生成中」、T10 为任务指令非收官声明、roadmap ✅ 留待原子翻转——合规。T7 的 docs/notes/ Agent Note 与 R5⑤ audit-log 均为任务前瞻表述而非收官引用——合规；引用的已存在文件（audit-log、runbook、ADR、S02 记录）全部实存，唯一悬空引用是「12r」（建议 2）。

---

## 发现分级清单

**必改**
1. **D6 依赖清单缺 `@types/react`，且 D6 枚举（client 五包+react+react-dom+jsdom+@testing-library/react+@testing-library/dom = 10 项）与高危预告①「11 项 devDeps」数字不齐**。`jsx: react-jsx`（T1）的 client face typecheck 硬依赖 @types/react（react 18 不自带类型；宿主用 @types/react ~18.3.1 / @types/react-dom ~18.3.0）。不改则 T1 必红且红灯伪装成实现问题。修改指令：D6 增补 `@types/react`（如需 react-dom 类型再加 @types/react-dom），高危预告①项数与 D6 枚举对齐（若 11 已含 types 则 D6 漏列，若不含则预告数字改 10）。

**建议**
2. D5 依据「12r 先例」全仓无出处（file:line：plan:83）——替换为可查证先例：S02 记录 H1/H4（agent 浏览器 DOM 断言 + fake 值 + unset 复原 + 真实 `~/.dsh` 零接触）即「预告 + scratch = agent 可实测」的本仓正本先例。
3. 范围移动显式标注：R4/T5 的 searchChain 扩展（roadmap 仅列 fetchChain）与 D4 的双语字典自 S07 前置，建议在范围决策表或 WBS 加一句 roadmap 锚定说明（「增量不缩减 S07 验收；S07 parity 脚本/CJK grep/排序原样保留」），避免阶段 4 对峙 roadmap 时被当偷跑复核。
4. D2 与风险节的 `platform.ts:16` 改为 `:12`（ui-primitives 实际行；:16 是 PRELOADED 声明行）。
5. T-prep 补一句 minimumReleaseAge 预案：S02 spike 实录 + 本仓 pnpm-workspace.yaml 现存 alpha.4 exclude 表（12 条亲见）表明新装近期发布包会触发该闸；五 client 包 alpha.4（2026-09-01 发布）可能命中——若需增补 exclude 属依赖面变更，应随 T-prep 留痕披露。

**观察**
6. T6 inject 面较范本少 `'remote.session'`（骨架不用 session 面，合理裁剪；已声明基础 `'remote'`，`$on` 应在其下）——若 T8 fail-loud 报错直指缺失键，返工成本低，留痕即可。
7. T8「runbook §1 序列重放」措辞宽泛：§1 实为 dump-config 安装序列（无端口/无 boot 步），boot+端口部分实沿 S02 T3 配方（3410→3412）——非错误，留痕即可。
8. D1 骨架不订阅 `settings/document-updated`（他面 YAML 改动不自动刷新）——D1 已声明轻量面且 S07 再评估，留痕即可。
9. T2 验收「产物 grep 零 @deepseek-ai/* 值内联」执行时注意措辞精确化：externals 本身会以 `require("@deepseek-ai/…")` 形态出现在产物中，grep 判据应表述为「引用仅以外部 require 形态出现，无内联实现体」。

---

**结论：NEEDS REVISION**（唯一必改 = D6 补 @types/react 并统一 T-prep 项数口径；其余为可吸收建议与观察，修订后无需换审可复审）。

---
---

# 轮 2：独立审核报告 — Session 06 计划复审（阶段 2，轮 2）

**参数头**：审核库 v2 ｜ 阶段 2 轮 2（续用同一审核 Agent）｜ 对象 = 修订版 `docs/plans/2026-09-02-006-s06-settings-gui-plan.md` ｜ 输入指针：同轮 1 + 轮 1 报告发现清单 ｜ 偏离说明：无（只读复核；轮 1 已亲验锚点不重开，新增/被改引用逐处回查）。

## 一、落位核验清单

| # | 轮 1 发现 | 处置声称 | 核验结果 |
|---|---|---|---|
| 必改 1 | D6 缺 @types/react + 项数口径（10 vs 11） | D6 重写 12 项 + 高危预告①改 12 | ✓ **闭合**。plan:91 枚举重算：client 五包(5) + react/react-dom(2) + @types/react + @types/react-dom(2) + jsdom/@testing-library/react/@testing-library/dom(3) = **12 项**，与「共 12 项」（:91）、T-prep「D6 全列 12 项」（:98）、高危预告①「12 项」（:151）四处一致。枚举无漏项：vitest ^4.1.8/oxlint/tsdown/typescript/@types/node 已在 devDeps；@types/jsdom 不需要（测试不引 jsdom 类型 API，宿主 spec 同款）；@testing-library/jest-dom 宿主 spec 未用。@types/react 标注「jsx: react-jsx 硬依赖」理由准确 |
| 建议 2 | D5「12r」悬空 | 改可查证授权链 | ✓ **闭合**。「12r」全文消失。新授权链三要素逐一回查：①session-05b.md:89-92 预告原文——轮 1 亲验逐字吻合，D5 引文「GUI 涉实例与浏览器实测须守 user-paces-verification 惯例 + scratch 隔离配方」准确（:91-92，跨行）；②S02 记录 H1/H4 节实存（session-02.md:24-28/:42-46），内容与描述吻合（DOM 断言/fake 值/unset 复原/~/.dsh 零接触）；③user-paces 惯例出处 session-05a:74/82、session-05b:84/92 轮 1 亲见。「with-key 真实搜索仍归用户槽位不变」= 惯例本义忠实表述（:90） |
| 建议 3 | searchChain 双链 + 双语字典两处范围移动未标注 | D4/T5/R4 三处锚定说明 | ✓ **闭合**。D4「范围锚定说明」（:89：前置 = GUI 渲染技术前提〔S02 H3〕、增量不缩减 S07、parity 脚本/CJK grep/排序原样保留）；T5「roadmap 锚定说明」（:103：WBS 原文 fetchChain，双链 = 对称扩展，config.ts:85-87 两链对称——行号轮 1 亲证准确；S07 排序前置底座）；R4 回指 T5（:127）。三处口径一致 |
| 建议 4 | platform.ts:16 笔误 | D2 与风险节改 ：12 | ✓ **闭合**。D2 :87「platform.ts:12」、风险节 :176「platform.ts:12 亲证」——:12 即 `'@deepseek-ai/dsh-client-ui-primitives'` 行，轮 1 亲证 |
| 建议 5 | minimumReleaseAge 预案缺 | D6 + T-prep + 高危预告① 三处联动 | ✓ **闭合**。D6 预案段（:91，「现存 12 条 alpha.4 exclude 先例」——pnpm-workspace.yaml 12 条为轮 1 实跑数，准确）；T-prep 增「被闸即按既有形态增补 exclude 条目并留痕披露」+ 验收要点「(+ 如触发：pnpm-workspace.yaml exclude 增补 diff)」（:98）；高危预告①增「属依赖面变更随 T-prep 留痕」（:152-153）。三处口径一致 |
| 观察 6 | remote.session 裁剪未声明 | T6 显式注明 | ✓ 落位（:104：显式裁剪 + D1 范围内 + T8 fail-loud 低成本补声明留痕） |
| 观察 7 | T8 配方措辞宽泛 | 改精确口径 | ✓ 落位（:106：「安装序列 = runbook §1 命令重放；boot/端口配方 = S02 T3 同款，端口 3410→本棒 3412」——S02 T3 内容 session-02.md:62 轮 1 亲证） |
| 观察 8 | document-updated 不订阅 | D1 已声明 + 留痕 | ✓ 按轮 1 建议原样处置（D1 :86 + 债务映射 settingsScope 行「S07 再评估」），无需改动 |
| 观察 9 | externals grep 判据措辞 | T2 精确化 | ✓ 落位（:100：「仅以外部 require 形态出现，无内联实现体」）。R1 保留「零值内联」简写（:118）与 T2 操作化判据语义兼容，无冲突 |

背景节修订记录段（:28-33）：必改 ×1 / 建议 ×4 / 观察 ×4 的分级概要与轮 1 报告逐项一致；「锚点抽查 30+ 处仅 1 处行号笔误」属实；只写「复审续用同一审核 Agent」未预写复审结论——合规。

## 二、修订引入问题排查

D5 授权链重写、D6 重写、D4/T5/R4 锚定段、T-prep/T2/T6/T8 验收要点增补均为增量修订；背景实锚、WBS 主体、验证矩阵、债务映射、风险主体与轮 1 已验版本逐字未动（差异仅在上述处置点），未发现新失真。宿主 inject 数组表述（:38-39）与 :59-61 实际顺序仍逐字一致。

**新发现残留 ×1（观察级，不阻塞）**：T-prep 行 `npm view` 复核对象写「react/@types/react/**@testing-library/jsdom**」（:98）——`@testing-library/jsdom` 是不存在的包名（正确对象为 `jsdom` 与 `@testing-library/react`；该笔误轮 1 版已存在，轮 1 漏抓，修订未触及）。照跑会 E404 误判「版本不存在」；执行者见 404 即知包名有误，不构成开工阻断。修改指令：该处改为「react/@types/react/jsdom/@testing-library/react」。

## 三、结论

**APPROVED**（必改 1 闭合、建议 2-5 全数忠实落位、修订无新问题；唯一残留为 T-prep 的 `@testing-library/jsdom` 包名笔误，观察级，可在 T-prep 执行时顺手修正并留痕，不构成复审障碍）。
