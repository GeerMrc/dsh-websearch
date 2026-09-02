# Plan — 2026-09-02-005b-s05b-install-e2e-restore-plan

> plan 是验收契约：R 验收条目是 progress-M3 阶段验收的对照正本，验证矩阵是各阶段验证的
> 单源引用；🟢 债务归属映射的正本在本文件债务映射节。本棒为验证/实测棒（安装链路机械面，
> 预期零产品代码变更）：每任务验证手段 = 命令原文与落盘文件实测（无 TDD 红绿仪式），
> 分类由阶段 2 审核 Agent 确认。

## 目标

S05b 交付 M3 收官棒（roadmap ⏳ 行）：真实包（非 spike）在 **scratch profile** 上完成安装
端到端与卸载复原——`dsh plugin add`（tarball 形态，ADR-0007 交付）→ bundle patch 接线 →
用户层两行 patch → 选择标量路由到 `dshws-chain`/`dshws-chain-fetch`（组合树实测）→ 实例
加载零错 → 卸载+删 patch 后与基线零 diff 复原。with-key 的 `web_search` 真实结果实测
（content 首行 `[served-by: …]`）= **用户实测槽位**（本棒备妥环境与步骤即停，
user-paces-verification 惯例，接力指令显式预告）。

## 背景

任务源 = `docs/session-roadmap.md` Session 05b ⏳ 行；安装机制正本 = ADR-0006/0007 +
S02 spike H2 实录（`dsh plugin add` pnpm 转发器 + `dsh.bundle.patch` manifest 键自动接线 +
非模板 profile 无 webserver → 必须 `web` 模板）；架构 §6 = 组合与安装模型（两行 patch 正本）。

阶段 0 独立审核（2026-09-02，骨架库 v2，结论落本 session 记录「前序 Session 审核确认」节 🚧
生成中——记录由本 session 收官时自写）：对 S05a **PASS**——🔴×0；🟡×1 新增（Y-1 =
progress-M3 状态区未随 S05a 收官刷新，**家族第三次复发**：S04 审核曾抓 progress-M1 同类、
S05a 收官又漏自身——系统性确认，本棒 T0 清偿 + dont-do 第三条沉淀防复发）。

阶段 2 独立审核轮 1（2026-09-02，骨架库 v2）：**NEEDS REVISION**（必改 ×3：Y-1 清偿自身引入
重复 M3 行——家族第 4 实例 / 「已过审」预写 / T9 roadmap 翻转规格缺失；建议 ×5：锚点行号
漂移 / remove 预期预注册 / 环境验证前置 / R5 拆分 / 🚧 前瞻标注；dont-do 第三条三要素合规
但「正确」款需增补半句），本 plan 为修订版：必改全数吸收（T0 补清偿见下 + T9 翻转规格），
建议随批吸收；dont-do 第三条增补「替换而非追加」。复审续用同一审核 Agent。

T0 补清偿（审核轮 1 必改 1）：progress-M3 里程碑区重复 M3 行已删（旧行 🚧（S03 ✅；S04 ✅；
余 S05a/S05b）残留系本棒 T0 编辑失误——新行插入而旧行未删，恰在 dont-do 第三条落盘同批
违反该条，家族第 4 实例如实留痕）；「已过审」预写改为「审核推进中」。

阶段 1 只读摸底实锚（2026-09-02 亲测，deepseek-harness dev@3281e04b59）：

- **dsh CLI 面**（apps/cli/src/bin.ts --help 实测；帮助面定义在 args.ts:64-72/:131-134）：`--dump-config` 打印组合后 profile 树并
  退出（无实例/无 LLM/无 key 的组合观测面）；`dsh plugin --profile <name> add|remove <pkg>`
  = pnpm 转发器（verbs 为 pnpm add/rm）。
- **profile 自动 scaffold**（packages/boot/app-boot/src/profile.ts:805-814）：profile 目录缺
  package.json 时按 `PROFILE_TEMPLATES` 初始化——`web` 模板 = `['@deepseek-ai/dsh-base',
  '@deepseek-ai/dsh-web-app']` + patchReload 'live'（:141-146）；非模板名抛错（S02 F-001
  的机制根源）。即 scratch home 首条 `dsh --profile web` 命令即完成初始化，无显式 init 步骤。
- **组合层级**（profile-boot.ts:124-143 与 :156-173；composeEntries 注释在 profile.ts:846-861）：bundles patch（各 bundle 的
  `dsh.bundle.patch`）→ profile cordis.patch.yml（用户层）→ home 层 → `--patch` 覆盖——
  用户层 web 行标量后写生效 = 接线机制。
- **上游对照锚**（packages/bundle/base/cordis.patch.yml:450-454）：`web` 行
  `searchProvider: deepseek-official` + `fetchProvider: http`——基线与复原对照的判定值。
- **本包 bundle patch**（cordis.patch.yml）：`- insert: - id: dsh-websearch`——安装时经
  `dsh.bundle.patch` 键并入 profile（S02 H2 三处落盘机制同源）。
- **S02 配方**（session-02 记录 T2/T3 + 经验节）：scratch `DSH_HOME=/tmp/<棒>/home`、
  profile=`web`、端口 3410（本棒用 3411）、启动 cwd=deepseek-harness 仓根（源码启动）、
  无真实密钥环境、kill 用精确端口 `lsof -ti :<port>`——3080 与 `~/.dsh` 零接触。

## 范围决策（D1-D5，供阶段 2 审核判定层级）

| # | 决策 | 依据 |
|---|---|---|
| D1 | scratch 隔离配方 = `DSH_HOME=/tmp/dshws-s05b/home` + `web` 模板（auto-scaffold，摸底实证）+ 实例端口 3411 + 启动 cwd=deepseek-harness 仓根 + 环境无真实密钥；真实 `~/.dsh` 与 3080 实例零接触（收尾列命令清单证明） | S02 配方直接复用；AGENTS.md 环境纪律 |
| D2 | 对照观察面 = `--dump-config`（组合树，无实例无 LLM 无 key）：T1 基线（deepseek-official）/T3 接线（dshws-chain）/T5 复原（与基线 diff 零）三态对照；boot 实例（T4）只作加载证明（零 load 错误），不作选择标量观测 | dump-config 与 boot 共用同一组合函数（profile.ts:846-861 composeEntries 注释明示，复审残项修正）——观测面即启动事实；无 LLM 环境下唯一可自主实测的路由证据 |
| D3 | 卸载语义**实测优先**：`dsh plugin remove` 对 `dsh.profile.bundles` 的 reconcile 行为未知（add 侧已证自动追加，remove 侧未证）——以实测为准；复原验收 = dump-config 与 T1 基线 diff 为零（不预设步骤）；精确卸载步骤实录入 Agent Note（S09 手册正素材） | roadmap 验收「卸载插件+删 patch 后上游行为复原」；不假设即不误写手册 |
| D4 | with-key 结果面 = **用户实测槽位**（S10/M6 同构）：S05b 收官 = 机械面全绿 ✅；M3 里程碑行保持 🚧 附注「余用户 with-key 实测证据回填」；S06 启动不被阻塞（roadmap 顺序独立于该槽位） | 接力指令显式预告 user-paces-verification；真实 key 本机不存在（阶段 1 实测四 key 全 unset） |
| D5 | 用户实测槽位载体 = session 记录「用户实测指引」节（精确命令序列：配 key→起实例→web_search→断言 `[served-by:]` 首行→收尾）+ scratch home **保留在接线态**（不清理，供用户直接使用；/tmp 易失性如实标注——用户可按指引重建） | user-paces 惯例（环境备好即停）；S02 scratch 清理先例（阶段 5 后仅清自建目录——本棒因槽位保留，差异显式声明） |

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 类别 | 前置 |
|---|---|---|---|---|
| T0 | Y-1 清偿（progress-M3 状态区：里程碑行/进行中/待启动/S05a 任务表 T9-T10 行）+ STATUS 启动刷新（S05b 🚧 行 + 当前位置块）+ **dont-do 第三条沉淀**（「收官序列必须刷新 progress 状态区」——三次复发系统性确认，❌/✅/来源 三要素）+ 本 plan 落盘；纯文档 commit 直提 master | 三处+一条落盘 file:line 可查 | docs | 无 |
| T-prep | 本包构建交付物：**环境验证前置（S-6）** `node --version && pnpm --version`（≥22.19）入记录 + `pnpm build` + `pnpm pack` → tarball 落 `/tmp/dshws-s05b/`（ADR-0007 交付形态）；pack 清单核对（lib + cordis.patch.yml + package.json） | tarball 在位 + 清单实测入记录 | 机械类 | T0 |
| T1 | 基线对照（D2）：fresh scratch home `DSH_HOME=/tmp/dshws-s05b/home pnpm dsh --profile web --dump-config` → ①profile auto-scaffold 发生（目录/package.json/bundles=dsh-base+dsh-web-app）②组合树 `web.config.searchProvider === 'deepseek-official'`、`fetchProvider === 'http'`（上游原态）③dump 输出原文留盘 | 命令原文 + dump 关键行 + 三处落盘实测 | 实测类 | T-prep |
| T2 | 安装（bundle patch 核验）：`DSH_HOME=… pnpm dsh plugin --profile web add /tmp/dshws-s05b/dsh-websearch-0.1.0.tgz` → 三处落盘实测（profile package.json dependencies / dsh.profile.bundles 追加 / patch insert 行生效）+ `--dump-config` 组合树含 dsh-websearch row | 三处 file:line/原文 + dump 关键行 | 实测类 | T1 |
| T3 | 接线：scratch profile `cordis.patch.yml` 增用户层两行（web 行 `searchProvider: dshws-chain` / `fetchProvider: dshws-chain-fetch`）→ `--dump-config` → **searchProvider === 'dshws-chain' 且 fetchProvider === 'dshws-chain-fetch'**（选择标量经用户层覆盖生效） | dump 关键行原文（接线前后各一份） | 实测类 | T2 |
| T4 | boot 加载证明：scratch 实例启动（`DSH_HOME=… pnpm dsh web` 系端口参数先 `--help` 摸底；目标端口 3411 ≠ 3080；启动 cwd=deepseek-harness 仓根）→ boot 日志零 load 错误 + dsh-websearch 加载证据（loader 日志行/无 WEB_DUPLICATE_PROVIDER）+ 健康探测（HTTP 端口响应；裸 curl 401 = 健康态）+ `kill $(lsof -ti :3411)` 收尾 | 启动命令 + 日志关键行 + kill 确认（进程零残留） | 实测类 | T3 |
| T5 | 卸载复原（D3）：`dsh plugin --profile web remove dsh-websearch` + 删用户层两行 → `--dump-config` 与 **T1 基线 diff 为零**（searchProvider 回 deepseek-official）→ 复原对照成立；精确步骤实录。**预期预注册（S-5）**：宿主 plugin.ts:77-87 reconcile 已实现「wasDependency && !stillBundle → bundles splice」——正常 remove 应同步清 bundles 行，实测偏离即异常并如实记录 | dump diff 零 + 步骤原文 + reconcile 预期对照 | 实测类 | T4 |
| T6 | 用户实测槽位（D4/D5）：scratch home 重装回接线态（复跑 T2/T3 命令）+「用户实测指引」节落 session 记录（配 key → 起实例 → web_search → `[served-by:]` 首行断言 → 收尾的精确命令序列）+ scratch home 保留声明 | 指引节落盘 + 接线态 dump 证据 | 实测类 | T5 |
| T7 | 门墙收口 + Agent Note + progress-M3 增补：环境验证输出（S-6）+ 四命令全绿（本棒预期零产品代码变更——四命令 = 漂移哨兵；若 T0-T6 引发任何 src/tests 变更则按实测数字报）；Agent Note 落 docs/notes/（安装/接线/卸载精确命令实录 + reconcile 行为 + dump-config 观测面——S09 手册正素材）；progress-M3 增 S05b 批次表 + 已验锚点（PROFILE_TEMPLATES/dump-config/base patch 行号/S02 配方） | 四命令绿 + Note/台账增补 | — | T6 |
| T8 | 阶段 4/5 独立审核 + 交叉验证：R1-R5 逐条对峙（命令原文重放 + 落盘文件核验）+ **scratch 隔离审计**（全程命令 DSH_HOME 指向 /tmp、端口非 3080、`~/.dsh` 零写入）+ 三问 + 冒烟（抽一条 dump 命令重放） | PASS / COMPLETE 结论落 progress-M3 | 独立 Agent | T7 |
| T9 | 收尾 6 件套 + 原子翻转（STATUS 台账 ✅ + 当前位置块 + progress-M3 验收表 + roadmap S05b 行 ✅ **附翻转规格（必改 3）**：S05b 行 ✅ 附指针「机械面 ✅；with-key 用户槽位待回填——session 记录指引节」；M3 行保持 🚧 附注同旨，按 D4/S10-M6 同构）+ 踩坑沉淀 + 接力指令（S06；记录末节 + 回复末尾）+ `feat/s05b-install-e2e` **`--no-ff`** 合入 master | R5 全过 | — | T8 |

执行纪律：开发自 **`feat/s05b-install-e2e` 分支**推进（T-prep 起；T0/计划纯文档直提
master）。本棒为实测棒：T1-T6 无 TDD 红绿仪式（验证手段 = 命令原文 + 落盘文件实测，
分类由阶段 2 审核 Agent 确认）；写操作严格串行；**scratch 外零写**（仓库外路径仅
/tmp/dshws-s05b/）。

## 验收条目（R1-R5，progress-M3 阶段验收逐条对应）

- **R1** 基线对照可重放：fresh scratch home scaffold 证据 + dump 组合树 searchProvider=
  deepseek-official（上游原态）——命令原文 + dump 关键行
- **R2** 安装端到端可重放：三处落盘（dependencies/dsh.profile.bundles/patch insert）+
  dump 组合树含 dsh-websearch——tarball 形态（ADR-0007）
- **R3** 接线可重放：用户层两行后 dump 组合树 searchProvider=dshws-chain &&
  fetchProvider=dshws-chain-fetch
- **R4** 卸载复原可重放：remove + 删两行后 dump 与基线 diff 为零；boot 加载零错证明在档
- **R5** 五子证据逐面判定：①scratch 隔离（全程 DSH_HOME 指向 /tmp、端口非 3080、`~/.dsh`
  零写入——命令清单逐条）②门墙四命令绿 ③收尾 6 件套齐 ④原子翻转 + `--no-ff` 分支闭环
  ⑤with-key 槽位指引落盘（D5）。阶段 4/5 audit-log 原文落 `docs/sessions/audit-logs/`（S04/S05a 先例）

## 验证矩阵

| 验证面 | 触发时机 | 责任阶段 | 采信规则 |
|---|---|---|---|
| Y-1 清偿核验 | T0 | 3 | 主 Agent 亲改；阶段 4 独立 Agent file:line 重放 |
| pack 交付物 | T-prep | 3 | tarball 在位 + 清单原文 |
| T1/T3/T5 三态 dump 对照 | T1/T3/T5 | 3 | 命令原文 + dump 关键行入记录；阶段 4 重放一条 |
| T2 三处落盘 | T2 | 3 | 落盘文件实测 |
| T4 boot 加载 | T4 | 3 | 日志关键行 + kill 确认 |
| 门墙四命令（漂移哨兵） | T7 | 3 / 4 | 主 Agent 亲跑；阶段 4 重放（全量唯一责任点） |
| R1-R5 对峙 + 隔离审计 | T8 | 4 | 独立 Agent 实测（命令清单逐条） |
| 冒烟重放 | T8 阶段 5 | 5 | 独立 Agent 亲跑一条 dump；采信阶段 3 数字 |
| 治理产物一致性 | 收尾前 | 4 | 独立 Agent 实测 |

（本棒无 GUI 面 / 无真实 key 轮次——with-key 槽位归用户，指引落 session 记录。）

## 高危命令预告（阶段 2.5 披露，对照 governance §3.4.7 清单）

1. **仓库外路径写入**：/tmp/dshws-s05b/ scratch 创建与写入（S02 先例授权形态；仅限本棒
   自建目录；因 D5 用户槽位 **scratch home 保留不清理**——差异显式声明）
2. **实例启动与进程收尾**：scratch web 实例（端口 3411，非 3080）启动 + `kill $(lsof -ti
   :3411)`（本棒自启实例，精确端口定位；3080 实例零接触）
3. **依赖安装**：`dsh plugin add` 在 scratch profile 内转发的 pnpm install（新增非删除；
   真实 `~/.dsh/profiles/web` 零接触）
4. **明确不做**：npm publish / git push / 真实凭据读写（scratch credentials 零写入——with-key
   槽位由用户执行）/ `~/.dsh` 任何写入 / 3080 实例触碰 / 治理产物删除

## 债务归属映射（正本）

| 债务 | 等级 | 归属 | 依据 |
|---|---|---|---|
| 阶段 0 新增 🟡×1（Y-1 progress-M3 状态区，家族第三次复发） | 🟡 | **本棒 T0 清偿 + dont-do 第三条沉淀** | 阶段 0 审核结论；先债后新 |
| L-2 per-profile GUI 覆盖二期候选 | 🟢 | 二期候选，不排期（不变） | ADR-0004 |
| firecrawl fetch 面 402/429 it 缺独立覆盖 | 🟢 观察 | 不处置（双面共用 #parse）；S08 e2e 场景若覆盖则自然收口 | S05a 阶段 4/5 审核观察 |

## 风险

- **dump-config 对 fresh home 的行为**：auto-scaffold 与 dump 的先后（loadProfile 初始化于
  读取前，摸底实证）若与预期不符（如要求先 boot）→ 实测即知，处置 = 先跑一次
  `dsh --profile web --dump-default-config` 或短暂 boot 完成初始化，决策留痕
- **remove 的 reconcile**（S-5 预注册）：宿主 plugin.ts:77-87 已实现正常路径的 bundles 同步
  清除；仅当已装版本丢失 `dsh.bundle` 声明时才会残留——实测偏离该预期即异常留痕，复原验收
  仍以 dump diff 为零为准
- **端口/健康面**：web 实例 0.1.2+ token auth——裸 curl 401 = 健康态（memory 实证先例），
  不做带 token 深探测（无浏览器面）
- **boot 日志观测面**：本插件 apply 无显式加载日志行（S03 形态）——加载证明 = 零 load 错误
  + 无 WEB_DUPLICATE_PROVIDER + （若 loader 打印插件装载清单则引用之）；不足以证明注册时
  以 T3 dump + T7 全量测试（apply 层五成员注册已有 11 条 apply 测试覆盖）兜底，留痕说明
- **/tmp 易失**：scratch home 因 D5 保留，重启后可能被系统清理——指引节附重建命令序列
  （T1-T3 全套命令可重放）
