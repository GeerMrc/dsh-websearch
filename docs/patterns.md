# dsh-websearch 开发范本（本项目沉淀）

> 跨版本复用的开发经验正本。首篇 PC1 沉淀自 S41（2026-11-24）介绍卡六轮收敛的全过程，吸收兄弟仓
> [dsh-mm-resilience `docs/patterns.md`](../../dsh-mm-resilience/docs/patterns.md) 的 P2（meta.detail 双语用户文档）
> 与 P7（npm 发布 files 白名单），并补入本项目实测得到的行数/高度预算、换装与验证方法。
> 后续版本迭代先查本文件，不在已入册的坑上走弯路。

## PC1. 插件页介绍卡——meta.detail 双语用户文档（吸收 P2/P7）

**场景**：插件详情页默认回退渲染 README.md（开发文档直达终端用户）。S41 曾因文档尾部一句「参见项目 README」
被用户连续四轮误读为「还在渲染 README」——介绍卡里连这个词都不该出现。

**机制**（rc.5 `boot/plugin-manager/src/bundle-detail.ts` + `util/plugin-detail`）：
- 文档顺序：① locale `<lang>.json` 的 `meta.detail` 指定文件 → ② 包 README → ③ 市场条目仓库 README
- **语言链**：`zh-Hans-CN` 依次读 `locale/zh-hans-cn.json` → `zh-hans.json` → `zh.json` → `en.json`
- **路径规则**：`/` 分隔、包根相对、`.md`/`.markdown` 后缀、无 `./..` 空段、无反斜杠、无 URL scheme
- **命名文件不存在 = 硬错**（不回退 README）
- 数据源二选一：已安装 → 本地包目录**实时读取（无缓存）**；未安装 → npm CDN 按发布版本拉（注册表上的旧版无 locale 会回退 README，发布新版后自然消失）
- 字节上限 `detailMaxBytes` 默认 **1MiB**（只有字节约束，官方无行数指引——行数靠自己预算，见下）

**行数与高度预算（本项目实测定档）**：
- **目标 16–22 行**（社区参考卡 dsh-mm-resilience 18 行、dsh-subagent-plus 19 行）
- 渲染高度才是硬约束：详情文档区在 **720px 视口实测可视 456px**（约 15–16 行）；更高视口更宽裕
- 校验法：浏览器控制台量 `详细介绍` 区域的 `scrollHeight` 与 `clientHeight`——相等即一屏零滚动（14 行平铺版实测 348=348）
- 结构模板：`# 标题` → `> 一句话定位引用块` → `## 它做什么`（3–6 条粗体要点，每条一行）→ 设置一段 → 关闭语义与兼容一段 → 末行仓库链接

**配方**：
1. `docs/plugin-page.zh.md` + `docs/plugin-page.en.md`（中英结构逐行对齐，契约测试锁定）
2. `locale/zh.json`：`{"meta":{"title":"…","description":"…","detail":"docs/plugin-page.zh.md"}}`；`en.json` 同理
3. `package.json`：`files` 逐文件列入两份文档与 `locale`；`exports` 含 `"./locale/*.json"` 与 `"./package.json"`
4. README 分工声明放 **README 一侧**；介绍卡全文不出现 "README" 字样，末行只放仓库 URL（问题反馈/版本发布入口）
5. 契约测试（本仓 `tests/package-meta.spec.ts`）：元信息非空、detail 路径合法、文件存在且入 `files`、已导出、中英结构对齐

**禁忌**：
- ❌ 介绍卡末尾放「参见项目 README」指针——用户会整页误读为 README（S41 T20d 实证）
- ❌ 操作手册式长文（接管三大段、组件开关长警告）塞进介绍卡——详细行为放设置页提示卡与 tooltip
- ❌ `meta.detail` 指向不存在/未入 `files` 的文件——硬错或发布后缺文件
- ❌ 只数行数不量高度——行数是代理指标，`scrollHeight ≤ clientHeight` 才是验收

## PC2. 换装与验证（吸收本项目 KUI ⑦ 与生产安装经验）

- `file:` 安装必须指向**耐久路径**（`/tmp` 重启即失，生产 profile 会钉住该路径）
- **同版本号换装**：运行中的实例继续沿用旧包的随包层——重启宿主，或在插件页把插件关一次再开
- 详情页读本地目录**实时无缓存**：改了文档重换装（或重启）即生效；用版本号变更保证所有缓存面失效
- 换装后核验四件套：依赖行指向新路径/新版本；`node_modules/<pkg>/locale/` 与 `docs/plugin-page.*.md` 在位；
  `--dump-config`（或用户层文件）未被波及；**身份三腿一致**（清单 name == 包内 insert name == client id，v0.2.3 起，见 PC6 排障速查）
- 验证渲染：新开标签 → 设置/插件页 → 详情，用无障碍树（DOM snapshot）断言内容，用截图留档；判别「是否真在渲染 README」看 README 独有标记（快速开始/治理看板等）是否为零

## PC3. 未来新插件快速复用清单

1. 复制本仓 `locale/{zh,en}.json` + `docs/plugin-page.{zh,en}.md` + `tests/package-meta.spec.ts` 三件套
2. 按 PC1 行数/结构模板写卡，量高度验收
3. `files`/`exports` 白名单照抄；发布前跑 `check-release --tarballs`（含必需文件断言）
4. **身份三腿必检**（v0.2.3 起，PC6 正本）：client 构建盖戳 `id = manifest.name`（照抄本仓
   `tsdown.client.config.ts`）；随包补丁 insert `name` = 清单名（scoped 记得 YAML 引号）；双名分发时
   `pack.mjs` 三腿联动翻转（照抄本仓实现，含锚点校验）；`insert id` 独立稳定、不参与客户端配对
5. 装载验收：npm 名直装 + 裸名 tarball 双形态各装一遍，设置节/详情页/徽标三面渲染 + `--dump-config` 零 skip

## PC4. 兄弟仓 P1–P8 对照表（v0.2.1 审计，2026-11-24）

对照 [dsh-mm-resilience patterns](../../dsh-mm-resilience/docs/patterns.md) 逐条核对本插件实现：

| 参考条 | 本插件状态 | 说明 |
|---|---|---|
| P1 上下文注入行 | **不适用** | 本插件不向模型会话注入内容；served-by 走 toolview 行（ADR-0010），无气泡污染面 |
| P2 meta.detail 文档分离 | ✅ 已应用（见 PC1） | 含语言链/路径规则/硬错语义全套 |
| P3 设置卡官方同构 | **部分** | 控制器提升 ✅（在 `settings.section` 注入回调创建、随注入处置，等价于 apply() 生命周期）；**控件为自绘**（S06 起的历史设计：成员卡/链排序等富交互超出官方 SettingsForm 表达力，且用户已裁定「保持当前整体交互逻辑」）；**StrictMode 双挂载回归测试缺失** → 已补（见下）；用的是 `settings.section`（设置对话框）而非 `plugins.bundle.config`（插件页卡），属刻意选择 |
| P4 对称接管/交还 | ✅ 已应用并按 rc.5 修正 | 接管用**随包补丁层**（比参考的路由行对账更强：层在则生效、层去则自动失效）；交还守卫只认 `dshws-*` 前缀（等价于「只 unset 仍等于自己应用值的行」）；客户端监听含冲突重试；rc.5 实测修正：HMR 宿主上事件送达前多被退订 → 启用期提示卡（T19）为可靠主通道 |
| P5 真模型测试 | 原则已应用 | 本插件不用官方 SettingsFormModel（自绘控件），无需 src 编译法；FakeRemote 为有状态假件（记录调用+状态迁移），符合「关键链路禁仅静态假件」；带 key 的 e2e.real 待 key 窗口 |
| P6 跨切纪律 | 基本 ✅ | Warn-only ✅（交还/DNS/守卫）；无条件注册 ✅（settings.section/toolview 不套 whileServed）；peerDeps 钉版 ✅（ADR-0027）；版本-Tag-npm 三同步 ✅（ADR-0026 + check-release）；CHANGELOG 四要素部分条目欠「预防」栏；private:true 不适用（0.2.0 已公开发布） |
| P7 files 白名单 | ✅✅ 超出 | 逐文件白名单 + 发布门 `check-release --tarballs` **直接断言 tarball 内容物**（参考仓事故后建议加的 CI 步骤我们已内建） |
| P8 发布全链路 | ✅ 已应用 | OIDC + npm 11 + provenance + runbook；**吸收其「同批推送可能不触发 workflow」教训 → 推送顺序改为主干先、tag 后**（见 runbook §7.3 与 PC5） |

**P3 验证缺口处置**：新增「控制器跨组件挂载存活」回归测试（渲染→卸载→再渲染同一绑定组件，控制器不随组件卸载而失效）——P3 的 StrictMode 本质是「模型死于组件卸载」，该测试锁住我们的等价面。

## PC5. 发布推送顺序（吸收 P8 踩坑）

兄弟仓 P8 实录：同批推送分支+tag 曾不触发 workflow。本仓 runbook 原方案为 `git push --atomic origin master vX.Y.Z`。
**定档**：主顺序改为**先推 master、确认 CI 绿、再推 tag**（最坏态=master 已推而 tag 未推=无发布、可安全重试 tag；
tag 先行的坏态=发布了一个未经 CI 的提交）。atomic 仅在两步均不可行时使用且须人工盯 workflow 触发。

## PC6. 客户端身份三腿对齐——npm scoped 直装全功能（2026-11-25 终版，v0.2.3；推翻同日早版「宿主不可修」结论）

**场景**：npm 反抢注拒绝裸名，插件以 scoped 名发布（`@maricgeer/dsh-websearch`）。宿主 rc.5 的客户端装载要求
**三方字符串精确相等**：随包补丁 insert 行 `name` == 包清单 `name` == client bundle 构建时打进
`__ModuleLoader__.load({ id })` 的注册 id。任何一腿不一致 → 客户端半区（设置节/徽标）静默缺失，无任何报错。
insert 行的 `id` **不参与**客户端配对（mm-resilience `id≠name` 在产实证），scoped 名在 URL/编码/查找全链不受损，
无 `@deepseek-ai` 白名单（宿主自带 `@fixture/live-client` e2e 即 scoped 第三方全链生效）。

**定位史（三段，含一次误判）**：
1. 0.2.1 时代：insert name=裸 + 清单 scoped + client id=裸（硬编码）→ 两腿不一致 → scoped 直装宿主半区不加载、
   双名别名客户端静默缺失；裸名 tarball（pack 翻清单名）三腿恰好一致 → 全功能。误归因为「裸名才行」。
2. **M1 误判**：翻转 insert id+name 与清单为 scoped 三处一致，仍不渲染 → 误判「宿主浏览器侧对 scoped 行不可修」。
   漏因：**client bundle 注册 id 硬编码裸名没翻**（三腿只对齐两条）。教训入 dont-do（实验完备性）。
3. **源码定案**（rc.5 标签树三路取证 + M4 实验）：读宿主 `packages/client/modules` 链——row 键=解析出的清单 name
   （`nearestPackage` 要求与 entry name 逐字相等）；页面按 row id 建 entry、以 entry name import；
   注册侧 `id = manifest.name`（宿主共享 tsdown 预设）。M4 手改三腿全 scoped → **设置节完整渲染**，证伪早版结论。

**v0.2.3 根修**：`tsdown.client.config.ts` 注册 id 从清单 name 盖戳；repo 补丁 insert name=scoped（YAML 引号）；
`pack.mjs` 裸名打包三腿联动翻转（锚点校验+字节还原）。npm 直装/裸名 tarball 双形态全功能。

**配方**（v0.2.3 起两形态皆可）：
```sh
'<launcher>' plugin --profile <p> add '@maricgeer/dsh-websearch'        # npm 直装（推荐）
'<launcher>' plugin --profile <p> add 'file:/…/dsh-websearch-<ver>.tgz'  # 裸名 tarball（Release 资产/本地）
```
- pnpm 坑：`minimumReleaseAge` 无豁免时静默解析旧版（11.3x 对直加依赖自动写豁免）；`.tarball` 扩展名不识别；
  同路径 file: 命中 store 旧缓存（换新文件名）
- **双名别名结构性不支持**：裸目录 ≠ scoped 清单名，`nearestPackage` 必不匹配，客户端半区必缺——文档声明勿用
- 验证：装后核对 `node_modules/<包>/package.json` 版本；启动零 `did not activate`；设置节渲染+徽标在位
- 装置三坑（实验时）：patch 里 scoped 名必须引号；profile 根 patch 的 config 行 `name` 也要随形态对齐
  （不齐会被跳过并告警）；bundles 列表条目=包清单名

**四版演进表（统一复盘，2026-11-25）**：

| 版本 | 形态/修法 | 结果 | 有效沉淀 |
|---|---|---|---|
| 0.2.0 | npm scoped 包（insert name/client id 均裸） | scoped 直装不加载；别名半残 | 「裸名才行」的**错误归因**起点 |
| 0.2.1 | 双名别名当修法 | 只救宿主半区 | PC6 旧版错误配方（已废） |
| 0.2.2 | 有声守卫（错误方向） | 坏形态有声、根因未动 | 守卫双通道（rc.5 不接插件 console exporter，插件自有日志才可靠）；实验假阴性排除法；M1 误判入 dont-do 勘误 |
| 0.2.3 | **三腿对齐根修** | npm 直装/裸名 tarball 双形态全功能 | 本条目正本 |

**排障速查**（症状 → 断哪条）：
1. 设置节/徽标不渲染 → 依次查三腿：`node_modules/<包>/package.json` 的 `name` == 包内 `cordis.patch.yml` insert `name` == `lib/client.js` 首行 `id:` 字面量（任一不符即命中）
2. 三腿一致仍不渲染 → 查装置面：profile 根 patch 的 config 行 `name` 是否随形态（不齐会被跳过并告警）、bundles 条目是否=包清单名、patch 里 scoped 名是否带引号
3. 宿主半区都不加载 → insert `name` 指向的包名在 node_modules 解析不到（scoped 直装旧形态/目录名不符）
4. 双名别名形态 → 直接判死（结构性），换 npm 直装或裸名 tarball

**禁忌**：
- ❌ 不要用双名别名法装 profile——结构性客户端半残（nearestPackage 要求清单名=可解析目录名）
- ❌ 不要凭"add 成功/宿主能搜索"判断装对——年龄门静默降级不在 add 的输出里
- ❌ 不要在没对齐**全部三腿**（含 client bundle 注册 id）前下「宿主不可修」结论——M1 教训
- ❌ 改任何一腿身份时，三腿必须随分发形态联动（清单/insert name/client id），insert `id` 保持稳定不变

## PC7. 发布链全流程编排——本地验证→独立审核→用户终审→master 先→tag★→OIDC→三方核验（吸收 runbook §2/§5–§11、mm-resilience P8；2026-11-25 入册）

**场景**：DSH 独立插件的版本发布是一条多角色链路，任何一环省略都会重演历史事故（v0.2.0 tag 三度重打、
v0.2.1–0.2.3 五小时三连发灭火）。本条把 [release-runbook.md](release-runbook.md) 的操作正本收编为开发者纪律链。

**纪律链八环**（每环有明确产物，跳环=事故源）：
1. **本地全门**：typecheck（双 face）/lint/全量测试/i18n/build/pack/check-release——与流水线同序同参
2. **真机实测**：scratch 双形态矩阵 + 生产桌面端装入四清单（用户实测回执留 session id）
3. **推送前独立审核**：独立 Agent 审核代码与文档（APPROVE WITH CHANGES 须全处置），执行与审核不同上下文
4. **用户版本终审**：版本号变更时点=用户终审通过并明确确认（确认原文入 session 记录）；一个批次只变一次
5. **master 先推**：确认 CI 全绿后才碰 tag（PC5；坏态=发布未经 CI 的提交）
6. **tag 单独确认（★）**：附注 tag 指向 master 上的提交，推送前向用户单独确认
7. **OIDC 自动发布**：tag push 触发流水线全量门+一致性门+tarball 门→npm publish --provenance
8. **发布后三方核验**：npm version+attestations、GitHub Release 双 tarball 非草稿、远端 tag==本地 tag；
   npm 有 **Validating 传播窗**（数分钟），轮询勿慌

**失败处置**：tag 已公开后任何失败**不移动 tag、不 --force、不手工 npm publish**——修复后以更高补丁号重发。

**禁忌**：
- ❌ 不要为省事跳独立审核或真机实测直推（v0.2.2 错向守卫正是缺了「在产反例」交叉验证的产物）
- ❌ 不要在用户终审前碰版本号/CHANGELOG 发布态（v0.3.0 双版本方案被撤销的教训，见 PC8-E3）
- ❌ 不要同批推 master+tag 后不看 CI 就等发布（workflow 可能未触发，v0.2.0 实录）

## PC8. 版本号演进纪律——semver 阶梯与 tag 不可变（吸收 ADR-0020、runbook I2–I4；2026-11-25 入册）

**场景**：早期版本管理混乱（定档前内部编号 0.2.0→0.9.0 跑完 15 批后整体重置回 0.1.0；v0.1.0 tag 移钉+版本回折；
v0.3.0 双版本方案当日撤销；v0.2.0 tag 三度重打）。0.1.x 时代上述门全部不存在；S41 起四处一致性门+纪律立宪。

**规则**：
- **阶梯**：补丁位细迭代（v0.0.1→v0.0.2→…→v0.1.0→v0.1.1…）；minor 仅限特大架构扩展（ADR-0020）；**不跳号、
  不双版本并行、不同号两义**。澄清事实：本仓正式线 0.1.0→0.2.3 全连续无跳号、无 pre-release tag；混乱集中在
  定档前内部号段与 tag 操作，非发布号本身
- **tag 纪律**：推送后不移动、不 `tag -f`、不删除重推（I4）；tag 必须指向 master 上的提交且=流水线构建的那个
  提交（I2，check-release 机器断言；物证面细则见 PC11）；稳定三元组（`v\d+\.\d+\.\d+`），rc/alpha 一律拒——
  **插件不用 pre-release 发布**
- **一处变更三处同步**：版本号=一个提交改 package.json/USER_AGENT/CHANGELOG 首个日期标题，机器门兜底
- **宿主版本混乱外溢**（背景事实）：宿主 dsh-v* 线 42 tag 全预发布、两处跳号（无 0.1.4、无 0.2.2-alpha.1）、
  两处乱序（0.1.5-rc.3/0.2.1-rc.5 迟打）→ 插件 peer 域被迫逐枚举宿主预发布版本；应对=upstream-sync-sop
  监测三线+显式钉扎（ADR-0027）

**E1–E7 事件史速查**（完整取证见 session-41 记录 v0.2.3 续记）：

| # | 事件 | 已有防线 |
|---|---|---|
| E1 | 内部编号 0.2.0–0.9.0 整体重置回 0.1.0 | ADR-0020 定档；号未外发无伤害 |
| E2 | v0.1.0 tag 移钉+0.1.1 回折 | I4/P4+check-release tag==HEAD |
| E3 | v0.3.0 双版本方案撤销（同日三折） | I3 版本一批只变一次+用户终审 |
| E4 | v0.2.0 tag 三度重打（workflow 未触发/ENOENT；均发生在零发布产物窗口，I4 未破） | CI 发布预演+PC5 主干先+§10 失败表 |
| E5 | 身份分叉→三腿不齐→0.2.1–0.2.3 灭火 | PC6 三腿机制+三腿发布门（check-release --tarballs） |
| E6 | 0.1.0–0.1.1 发布产物不齐（无 Release/单资产/未上 npm；0.1.2 起补齐） | release.yml 双 tarball 自动建制+§9 核对 |
| E7 | 宿主版本混乱外溢 | upstream-sync-sop+peer 显式钉扎 |

**禁忌**：
- ❌ 不要随意 tag/改版本号——一个功能完成≠一个版本；版本是用户终审的裁决物不是开发的进度条
- ❌ 不要重打/移动已推送的 tag（git 不校验覆推，纪律与 check-release 是唯一防线）
- ❌ 不要在 CHANGELOG 埋历史版本号——一致性门只认首个日期标题

## PC9. 上下文注入行——后端注入内容走官方折叠行（吸收 mm-resilience P1；DSH 通用规范；2026-11-25 入册）

**场景**：插件需向模型注入描述/标签等上下文，但**不能污染用户的聊天气泡**——前端与原生 DSH 交互一致原则
（mm-resilience P1，用户实测否决项）。

**机制**（DSH 聊天窗渲染规则）：`source.kind ≠ 'user'` 的 `user/message` 一律渲染为「上下文注入行」——
折叠细行（图标+标题，点击展开正文）；投影层对自定义 kind 一等支持（`{role:'inject', label: kind 字符串}`），
`KNOWN_FORMS` 含 instructions/catalog/snapshot/notice/relay/recall 六形态。

**配方**（插件侧；字段级细节与完整代码示例回查 mm-resilience P1 原文）：
1. `agent/pre-step` 回调中**不改用户消息**，构造 `{role:'user', content, source:{kind:'<命名空间化-kind>', form:'notice'}}`
   追加到 `decision.messages`
2. 无内容返回 `null`——不产生行
3. kind 一律命名空间化（如 `dshws-xxx`），避免与其他插件投影冲突

**本仓适用性注记**：dsh-websearch 当前**不向模型会话注入内容**（served-by 溯源走 `tool.call.toolview` 工具卡，
ADR-0010）——但本条为 DSH 通用规范，后续任何注入需求（如搜索策略提示）必须走本配方。

**禁忌**：
- ❌ 不要把注入文本写进用户消息的 content（气泡污染，用户实测否决）
- ❌ 不要用替换式上下文（会被丢弃）；不要隐身注入（违反「模型可见⟺日志记录」铁律）

## PC10. npm 账号与发布侧规范——trusted publishing、Passkey 2FA、冻结纪律（吸收 runbook §3/§10、mm-resilience P8、ADR-0026、用户级 npm 账号纪律〔~/.zcode/AGENTS.md 2026-11-02 定型〕；2026-11-25 入册）

**场景**：npm 侧的账号形态与操作纪律——2026 年 npm 认证体系大改后，旧习惯（验证器 TOTP/长期 token）全部失效或被禁。

**规则**：
- **trusted publishing 配置**（npmjs → Settings → Publishing access）：绑 GitHub 仓+工作流文件名+环境；
  **新建配置 2 天内必须完成首次成功发布**否则过期重建；`Allow npm dist-tag` 权限项含义未知→不勾，
  首发被拒时停下来人工处理而非改用 token
- **2FA 唯一形态=通行密钥（Passkey）**：npm 已关闭新 TOTP 注册；恢复码只用于网页自救不能当 `--otp`
  〔用户级 npm 纪律〕；**agent 无 TTY 跑发布必败**（EOTP）——发布命令必须在用户交互终端执行（本仓已由
  OIDC 流水线根治）
- **禁 bypass-2FA granular token**：删除类当场被拒，2027-01 起彻底失去直接发布资格；CI 无人值守用
  trusted publishing（OIDC），不用 token
- **冻结纪律**〔用户级 npm 纪律〕：连续敏感操作失败（反复 unpublish/建 token/2FA 切换）触发账号临时冻结
  24–72h——失败后停手隔天再试，冻结期间任何触碰可能重置冷却
- **registry 纪律**：本机默认 npmmirror，一切 npmjs 操作显式 `--registry https://registry.npmjs.org`
  （流水线内 registry 双钉：setup-node `registry-url` + 发布命令 `--registry`）
- **发布窗口**：npm publish 成功后有 **Validating 后处理窗**（数分钟，registry 页面可见）——属正常传播延迟，
  轮询 `npm view <pkg> version` 至转正即可，勿重复发布

**禁忌**：
- ❌ 不要在 agent/无 TTY 环境跑任何 npm 写操作（认证 URL 随进程消亡）
- ❌ 不要为「快一点」建 bypass token——见冻结纪律与 2027 大限
- ❌ 不要凭一次 `npm publish` 退出码 0 就宣布上线——Validating 窗内版本不可安装，三方核验须等转正

## PC11. GitHub 版本管理——tag 不变量、草稿 PR 预演、分支生命周期（吸收 runbook §7/§9/§11；2026-11-25 入册）

**场景**：GitHub 侧的版本物证管理——tag/Release/分支三件套与 npm 版本的一致性是发布可信度的外显。

**规则**：
- **tag 不变量**：I2 tag=master 上被流水线构建的那个提交（check-release 断言 `tag^{commit}==HEAD` 且 HEAD
  ∈ master）；I4 推送后不可变——公开 tag 移动=信任破坏，失败只能加补丁号重发
- **草稿 PR 发布预演**：发布序列前开草稿 PR 跑一遍 CI（发布预演含 pack+tarball 门）——打包类缺陷在打 tag
  前暴露（v0.2.0 的 pack.mjs ENOENT 类）
- **分支生命周期**：feat/<session>-<主题> 单线开发→合 master 即删；不发版批次（纯 docs/门加固）直接 master
  就位，下个版本自然带上——**不要为文档提交单独发版**
- **Release 核对**：非草稿非预发布、双 tarball 资产在位（scoped+裸名）、由流水线机器人建制（人工手建是
  0.1.x 时代遗留，产物不齐的 E6 教训）；发布后核对远端 tag SHA==本地

**禁忌**：
- ❌ 不要手建 GitHub Release（资产易缺漏；release.yml 双 tarball 自动建制）
- ❌ 不要让 feat 分支长存漂移（下个 session 基线失真）
- ❌ 不要把「tag 已推但发布失败」当回滚信号去动 tag——修完加补丁号（§10 失败表）

