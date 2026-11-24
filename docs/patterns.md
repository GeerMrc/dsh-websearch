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
