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
- 换装后核验三件套：依赖行指向新路径；`node_modules/<pkg>/locale/` 与 `docs/plugin-page.*.md` 在位；`--dump-config`（或用户层文件）未被波及
- 验证渲染：新开标签 → 设置/插件页 → 详情，用无障碍树（DOM snapshot）断言内容，用截图留档；判别「是否真在渲染 README」看 README 独有标记（快速开始/治理看板等）是否为零

## PC3. 未来新插件快速复用清单

1. 复制本仓 `locale/{zh,en}.json` + `docs/plugin-page.{zh,en}.md` + `tests/package-meta.spec.ts` 三件套
2. 按 PC1 行数/结构模板写卡，量高度验收
3. `files`/`exports` 白名单照抄；发布前跑 `check-release --tarballs`（含必需文件断言）

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

## PC6. scoped npm 包名与客户端装载配对——profile 安装一律裸名 tarball（2026-11-25 定稿）

**场景**：npm 反抢注拒绝了裸包名，插件以 scoped 名发布（`@maricgeer/dsh-websearch`），但宿主按裸名
插件 id（`dsh-websearch`）装载。三种 npm 安装形态实测两残一好：

| 安装形态 | 宿主半区 | 客户端半区 |
|---|---|---|
| scoped 直装 `add @maricgeer/dsh-websearch` | ❌ 不加载（裸名解析失败） | ❌ |
| 双名别名 `dsh-websearch@npm:@maricgeer/dsh-websearch` | ✅ | ❌ 静默丢失（设置节消失、徽标不渲染） |
| 裸名 tarball（pack 翻转 name）`file:…/dsh-websearch-<ver>.tgz` | ✅ | ✅ 全功能 |

**机制**（rc.5 实测链 + M1 实验 2026-11-25）：
- 客户端模块表按包清单 name 建 row；浏览器侧 fiber/apply 要求 loader entry 的 id/name 与 graph row id
  配对。对非 `@deepseek-ai` scoped 行该配对**不成立**——这是宿主客户端装载器的**未文档化约束**
- **M1 判定（方案 A 之门未过）**：插入行 id+name 双双 scoped + 包清单 scoped + profile 真名安装，
  三处身份完全一致，客户端半区**仍不渲染**（启动图有 row、combo 200，fiber/apply 不采纳）→
  配对卡点不在插件可控的补丁身份，在宿主浏览器侧
- pnpm `minimumReleaseAge` 是解析偏好而非硬门：未过年龄窗且无豁免条目时**静默解析到旧版本**，add 照样"成功"

**配方**（profile 安装/升级唯一支持路径）：
```sh
'<launcher>' plugin --profile <p> add 'file:/…/dsh-websearch-<ver>.tgz'   # 裸名 tarball
```
- tarball 来源：GitHub Release 资产（双 tarball 里的裸名版）或耐久本地路径；**不要**用 registry scoped 包
- 前置：目标版本的 profile `pnpm-workspace.yaml` 加 `minimumReleaseAgeExclude` 条目（仅 registry 安装相关）
- pnpm 两个坑：`.tarball` 扩展名不被识别（须 `.tgz`）；同路径 file: 依赖命中 store 旧缓存（换新文件名击穿）
- 验证：`node_modules/dsh-websearch/package.json` 的 name 是裸名且版本正确；启动日志零 `did not activate`；
  设置页「网页搜索」节渲染 + 详情页/溯源徽标在位
- scoped npm 包的正当用途：包管理器依赖解析与 registry 分发（CI、e2e），不做 profile 直装

**禁忌**：
- ❌ 不要 `add @maricgeer/dsh-websearch`（scoped 直装）——宿主半区都不加载
- ❌ 不要用双名别名法装 profile——只修宿主半区，客户端静默半残（2026-11-25 实测定稿，替代 11-24 的旧结论）
- ❌ 不要凭"add 成功/宿主能搜索"判断装对——年龄门静默降级与客户端半残都不在 add 的输出里
- ❌ 不要再试插入行身份翻转修客户端半区——M1 已证伪（三处一致仍不渲染），等上游答复

