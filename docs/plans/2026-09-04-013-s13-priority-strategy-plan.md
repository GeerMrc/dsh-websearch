# Plan — 2026-09-04-013-s13-priority-strategy-plan

> plan 是验收契约。本棒 = 优先级策略棒：①ADR-0012 定谳（key 级 `random` 策略采样语义：
> 现状有放回 vs 变体 B 不放回随机——用户 S11 方向，2.5 终审定谳）②keySelection GUI
> 控件（12b 移交）③成员/链两级调用顺序说明 UI。另承接阶段 0 🟡×1 先债后新（T0）。
> 分支 `feat/s13-priority-strategy`；node 侧（keys.ts 语义）+ client 侧（控件/说明）双面。

## 目标

①`keySelection` 的 `random` 策略采样语义经 ADR-0012 定谳并按裁定实现（推荐变体 B：
一轮内不放回、用尽重洗）；②六张成员卡新增 keySelection 控件（三选一，默认 order，
写 settings 热生效）；③成员卡控件行附两级调用语义说明句（key 级：按策略选把、失败
不换把直接降级下一成员；跨工具级已在页头 intro/链卡 hint，不重复）。

## 背景

**任务源**：roadmap M7 段 S13 ⏳ 行（keySelection 成员级 random/序列变体定谳 ADR-0012 +
keySelection GUI 控件 + 两级调用顺序说明，12b 分析移交）；S11 计划二轮问询「random 变体」
未获答时取推荐默认并留档「变体 B 不放回随机〔ADR 定谳，仍可讨论〕」（plan 011 背景）。

**摸底实锚（2026-09-04 亲测，master@410f516）**：

- 采样现状：`src/keys.ts:120-132` `#select`——`random` = `keys[Math.floor(rng() *
  keys.length)]`，**有放回**（每请求独立采样，可连续同把）；`order` 恒首把、
  `round-robin` 游标轮换；`rng` 端口已注入（`KeyPoolPorts.rng`，keys.ts:44）。
- 配置面已全通：config schema `z.union(['order','round-robin','random'])`（config.ts:144
  等六成员）+ `resolveConfig` 显式 `?? 'order'` + settings 热通路（apply.test.ts:102-145
  三行为断言在档）——**本棒零 schema/resolve 改动**。
- client 缺口：`MemberSectionValue` 仅 `enabled/apiKeyEnv`（controller.ts:56-59），
  `MemberSnapshot` 无 keySelection，成员卡（section.tsx:316-400：头行/输入行/footer
  三段）无控件——控件需 snapshot 字段 + patch 动作 + 渲染三件。
- patch 安全性：宿主 settings `mergeLayers`（packages/settings/settings/src/index.ts:284-292）
  对 plain object **递归深合并**、数组才整替换——`{ tavily: { keySelection } }` 不清
  同成员兄弟字段（`setEnabled` 同款 patch 形态已在产线）。
- 控件选型面：宿主 ui-primitives 无原生 Select/Segmented；自绘先例充分（switchStyle
  自绘 switch、链行 ↑↓ 自绘按钮）；`Menu` 原语可用但为锚定浮层（jsdom 断言面大）。
- 说明 UI 现状：页头 intro 已有跨工具降级句（locales description）、链卡 hint 已有
  默认序说明（chainDefaultHint）——key 级策略语义零 UI；12b 正本 note 判定「独立子页
  不需要」。
- 阶段 0 gate：独立审核 S12b **PASS**（🔴×0；🟡×1 = session-12b/12a 记录缺
  「开发规范强化说明」节〔12a 起模板漂移〕；🟢×5 记录类；正本
  docs/sessions/audit-logs/2026-09-04-s13-stage0-review-of-s12b.md）。基线
  **252 passed | 9 skipped (261)**、i18n **22 keys**、client.js **26.25 kB**。

## 范围决策（D1-D6）

| # | 决策 | 依据 |
|---|---|---|
| D1 | **ADR-0012：key 级 `random` 改判不放回随机（变体 B）**——每成员维护洗牌牌堆：请求逐张抽牌，一轮内不放回；抽尽以 **Fisher-Yates 升序公式**重洗（`j = i + floor(rng() × (n − i))`，`rng` 端口注入；**rng≡0 ↔ 恒等排列**——keys.test.ts:66-71 两既存钉牌断言在此公式下全存活，即零漂移证明面）；抽尽后再抽；牌堆与当前拆分序列（去顺序多重集）不一致即重建（settings 热改逗号值后下一请求重洗）；失败仍不换把不回牌——直接链层降级。`order`/`round-robin` 语义零改动；**成员级（跨工具）保持顺序降级不变**（ADR-0002/0004 正本，范围注记写入 ADR 防误读）。**2.5 终审定谳**：若用户裁定维持现状 A（有放回），T1 改为 ADR 记录性定谳 + keys.test 钉牌现状断言（characterization 测试，无红相），产品代码零变更（fallback 预案） | S11 用户方向「变体 B」；roadmap S13 行「仍可讨论」→ 2.5 收口 |
| D2 | **控件形态 = 成员卡自绘三段 segmented**（行内三 button，`role="group"` + `aria-label`（成员 label + 策略名）scoped、`aria-pressed` 标当前项 + `data-testid` 按卡与策略命名；S12a 自绘 switch 先例，jsdom 断言直接）。备选 `Menu` 浮层不取（锚定/开合状态断言面大，收益低）。控件行置于输入行与 footer 之间，label + 控件同排；**未配置成员禁用**（同 switch/Clear 置灰惯例——策略只作用于实际请求） | 摸底选型面；S12a 纵向卡惯例 |
| D3 | **说明落位 = 控件行下 hint 行**（keyFieldNote 同款 12px 三级字色）：一句两级语义——「多把 key 按{策略名}选取；单把失败不换把，直接降级下一成员」。页头 description 与链卡 hint **不动**（S12a/12b 已收敛面防文案回流）；「APIKEY 搜索顺序」独立子页维持不需要判定（12b note 正本） | 12b 移交「调用顺序说明 UI」；12b note 判定 |
| D4 | **controller 面**：`MemberSectionValue` + `keySelection`；`MemberSnapshot` + `keySelection`（`deriveSnapshot` 显式默认 `'order'`——client 侧默认化镜像 node resolveConfig，不由渲染层 `??` 兜底）；新动作 `setKeySelection(memberKey, selection)` → patch `{ [member.key]: { keySelection } }` + revision（`setEnabled` 同构）；成功后 `#recompute` | 摸底实锚；explicit > implicit |
| D5 | **locales +5 键**（22→**27**）：`keySelection`（行 label）+ `keySelOrder` / `keySelRoundRobin` / `keySelRandom`（三策略名，hint 句插值复用）+ `keySelectionHint`（说明句模板）。en/zh parity 编译期强制 + check:i18n 门照过 | D2/D3 文案面；check-cjk 门禁 |
| D6 | **scope-out（不做）**：①key 序列编辑器（逐把重排/单把删）——与 ADR-0011「key 个体无独立状态、重配即整池覆盖（用户确认接受）」直接冲突，如需 = 回计划期改 ADR；②成员级 random/轮换——ADR-0002 完整高可用链的顺序降级是设计正本；③「序列编辑器」 = 既有链卡 ↑↓（S07 交付），本棒零改动 | ADR-0011 后果实锚；ADR-0002 正本 |

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 类别 | 前置 |
|---|---|---|---|---|
| T0 | 治理批（分支首提交）：plan 013 + ADR-0012 落盘（按 2.5 裁定 status: accepted）+ 阶段 0/2 audit-log（已在档随批入库）+ roadmap S13 行验收标准细化（指针 → 本 plan R 条目）+ **🟡-1 清偿**：session-12b.md / session-12a.md 补「开发规范强化说明」节（勘注标补落时点与来源）+ 🟢① STATUS 台账行序归位（12a 前 12b 后）+ 🟢② progress-M7 技术债表补 CSS module 化 / anysearch fetch 面两行镜像 + 启动全状态区（STATUS 台账 S13 🚧 行 + 位置块 + progress-M7 进行中/待启动区）+ session-13 骨架（**三★节占位齐全**） | git clean 前置；🟡/🟢 处置逐笔可 diff；骨架三节不缺 | 治理（机械豁免候选） | 2.5 批准 |
| T1 | D1 变体 B 实现（TDD 核心逻辑）：先红——keys.test 新断言「**恒值 rng（()=>0）+ 3 把 key 三连发 = 池的一个排列**（多重集比较，每把恰一次；现状有放回基线产出 [k1,k1,k1] 故真红）」+「牌堆重建腿：抽一轮中途热改池值 → 下一请求按新池重抽」→ `#select` random 分支改洗牌牌堆（升序公式 + 重建守卫）→ 绿；既存断言零漂移（order/round-robin/超限/空池 + **钉牌单发 keys.test.ts:66-71 两断言在升序公式下存活**）。**裁定 A 分支**：无红相（characterization 钉牌现状断言，不在「重构类禁证红」适用域），留痕标注「记录性定谳无红相」 | 红→绿留痕（裁定 A 时标注无红相）；apply.test 热通路回归绿 | TDD | T0（裁定 B） |
| T2 | D4 controller 通路（TDD）：snapshot 字段 + `setKeySelection` + controller.spec（默认 order 透出 / patch 载荷与 revision / 失败 ok:false）；**section.spec 两 fixture helper 补新字段**（member() :19-31 + makeProps() :57-66——typecheck 必拦的机械 accommodation，非断言漂移） | 红→绿；既有 spec 零漂移（fixture 补字段除外，逐处列名） | TDD | T1 |
| T3 | D2/D3/D5 控件 + 说明（TDD）：成员卡控件行 + hint 行；locales +5 键（locales.spec 为泛化 parity 断言，无计数锚，预期零改）；section.spec 红绿（六卡控件渲染 / 当前策略 aria-pressed / 点击回调载荷 / 未配置禁用 / hint 文案）；**既有守卫共存性穷举**：卡内 tooltip null 守卫族（section.spec:254-273）与新控件 button 共存不误伤、:293 单 button 场景语义核对 | 红→绿；typecheck 双面；i18n 27 keys parity | TDD | T2 |
| T4 | 门墙七命令（提交态）+ progress 台账/门墙表 + Agent Note（ADR-0012 语义表 + 控件/说明面 + 变体裁定记录） | 门墙数字亲见（基线 252\|9(261) 起算） | 门墙+文档 | T3 |
| T5 | 浏览器实测棒（scratch 端口起前 `lsof -ti :<port> -sTCP:LISTEN` 查占；3416/3080/61518/3419/3420 零接触）：六卡控件渲染 + 默认 order 高亮 + 切 round-robin → settings.yaml 落盘（**deep-merge 兄弟字段存活实测**：先写 enabled=false 再切策略核对同存）+ hint 文案亲见 + 截图归档 /tmp/dshws-s13/ + fake 值复原 | 断言留痕；隔离纪律（「本棒动作零接触」口径） | agent 实测棒 | T4 |
| T6 | 阶段 4/5 独立验证（全量唯一责任点 + R 逐条对峙 + 安全/契约/前瞻三问） | PASS / COMPLETE | 强制独立 | T5 |
| T7 | 收尾：session-13 补全（三★节）+ 原子收官（dont-do ⑤ 实物 ls 清单）+ STATUS/roadmap/CHANGELOG + merge `--no-ff` + 接力指令 | 6 件套 | 收尾 | T6 |

## 验收条目（R1-R6）

- **R1** ADR-0012 在档（docs/decisions/）且与实现一致：裁定变体即 `#select` 实际语义；
  范围注记（成员级顺序降级不变）在 ADR Decision/Consequences 可见；2.5 裁定在
  session 记录留痕。
- **R2** 若裁定 B：keys.test 新断言红→绿留痕（恒值 rng 一轮内不放回〔多重集比较〕+
  跨轮重洗 + **牌堆重建腿：热改池值后按新池重抽** + 钉牌单发 keys.test.ts:66-71 存活），
  既有 order/round-robin/超限/空池断言零漂移；若裁定 A：keys.test 钉牌现状断言
  （无红相，characterization）+ 产品代码零 diff（`git diff --stat` 亲证仅测试/文档）。
- **R3** GUI 控件：六卡三段控件渲染 + 当前策略 aria-pressed（默认 order）+ 点击写
  settings（patch 深合并，兄弟字段存活——T5 实测）+ 未配置禁用；controller.spec 与
  section.spec 红绿留痕。
- **R4** 说明 UI：六卡 hint 行两级语义句（含「失败不换把，直接降级下一成员」）；
  en/zh parity（27 keys）+ check:i18n exit 0（17 files 零 CJK）。
- **R5** 门墙七命令（提交态）：`pnpm test`（基线 252\|9(261) 起算，TDD 净增可解释）/
  `pnpm typecheck` 双面 / `pnpm lint` / `pnpm build`（增量披露口径）/ `npm pack
  --dry-run` / `pnpm check:i18n` / `git status --short` 前后置 clean。
- **R6** 浏览器实测：T5 断言全过 + 截图归档 /tmp/dshws-s13/ + scratch 隔离（本棒动作
  零接触声明 + 常驻进程归属链）。

## 验证矩阵

| 验证面 | 时点 | 责任 | 采信 |
|---|---|---|---|
| keys.test / controller.spec / section.spec 红绿 | T1-T3 | 主 Agent | commit + 记录 pre-fix 红 |
| apply.test / 既有回归子集 | T1-T3 | 主 Agent | 零漂移断言存活 |
| 门墙七命令 | T4 + T6 复验 | 主 → 独立 | progress 门墙表 |
| 浏览器断言+截图归档 | T5 | 主 Agent | /tmp/dshws-s13/ + 记录 |
| R 对峙+三问 | T6 | 独立 | audit-log …-s13-stage45 |
| 原子收官 | T7 | 主 Agent | 四件 diff |

（重负载命令串行；每验证面单 session 亲跑 ≤2 次；全量测试唯一责任点 = T6。）

## 债务归属映射（正本）

| 债务 | 等级 | 归属 |
|---|---|---|
| 阶段 0 🟡-1：session-12b/12a 记录缺「开发规范强化说明」节（模板漂移自 12a 起） | 🟡 | **T0 清偿**（补节 + 勘注；session-13 骨架三节占位防复发） |
| 阶段 0 🟢① STATUS 台账行序 12b/12a 倒插 | 🟢 | T0 顺手归位 |
| 阶段 0 🟢② progress 技术债表缺 CSS module 化/anysearch fetch 面两行镜像 | 🟢 | T0 顺手补行 |
| 阶段 0 🟢③ plan 012b T1「保留卡内守卫」文本过时 | 🟢 | 声明不回改（plan 为时点快照，勘注惯例归 S15 顺手核对） |
| 阶段 0 🟢④ 12b 门墙 node v24.3.0 vs 本棒 v22.23.2 | 🟢 | 无动作（均在 engines 域，数字复现一致；门墙表环境列已载） |
| 阶段 0 🟢⑤ T6 测试守卫夹带 docs 型提交 | 🟢 | 无动作（12b 已披露随批） |
| 既有维持：fetch 排序 UI / 恢复默认按钮 / anysearch fetch 面 / CSS module 化 / L-2 / 观察×4 / v2 backlog | 🟢 | 维持不排期（progress-M7 台账正本） |

## 高危命令预告

①/tmp/dshws-s13 scratch 自建与复原 ②scratch 端口实例启停（起前 lsof 查占；kill 走
端口精确匹配；3416/3080/61518/3419/3420 零接触）③scratch profile pnpm install
④浏览器自动化（fake 值写入→复原）⑤npm pack --dry-run（非 publish）。无 push/publish/
大范围删除/凭据真实值/依赖变更/治理产物删除；merge `--no-ff` 为本地合入 master（不推
远端——本仓 dev/master 不推送惯例）。

## 风险

- **变体裁定翻转**：D1 fallback 预案（裁定 A → 零产品代码，ADR 记录性定谳）——T1 按
  裁定分支执行，不预写。
- **洗牌实现契约**：牌堆重建判定必须按多重集比较（同值重复 key 合法），防热改值后
  旧牌堆错配；T1 断言含重建腿。
- **控件行卡高**：六卡各加一行（label 24px + hint 18px）纵向增长——紧凑卡惯例内
  （12a 尺度），T5 截图目验。
- **hint 插值**：`keySelectionHint` 含策略名插值（`{policy}`）——locales 值拼接在
  渲染层完成，check-cjk 仅查字面量，插值模板入字典即可。
