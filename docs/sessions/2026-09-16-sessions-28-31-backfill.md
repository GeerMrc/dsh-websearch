# Sessions 28–31 补账记录（reconstructed 2026-09-23，S32 T1）

> **性质**：S28–S31 于 2026-09-13 至 2026-09-16 实际执行（master 提交链 f219372→ba6a0ee），但未落 session 记录、未刷 STATUS/roadmap——治理欠账由 S32 阶段 0 审核抓获（🟡③，audit-log 2026-09-23-s32-t0-stage0-audit.md）。本记录为补账正本：从 git 历史 + CHANGELOG + S32 T0 独立实测重建，非当日现场记录。四棒均无 plan 文件（当时以用户即时指令驱动）；本补账不补造 plan，只登记事实与证据指针。

## Session 28（2026-09-13）— 徽标解耦微批（版本回折 v0.1.0 基线）

- **做了什么**：served-by 徽标渲染与宿主 toolview 结构解耦（全卡扫描替代定点结构匹配）+ web_fetch 徽标（`src/client/fetch-row.tsx` +219、`tests/client/fetch-view.spec.tsx` +157）。commit `9e6591c`。
- **版本裁定**：`e9dce94` 将版本号 0.1.1→0.1.0 回折（用户裁定：v0.1.0 定档基线，本批并入基线不独立发版）；远端 tag `v0.1.0` 移钉至 `e9dce94`（tag 指向最终实现）。
- **证据**：git show --stat 两提交；T0 审核 MATCH 判定。
- **CHANGELOG**：当日漏登条目——本补账批补登（见 CHANGELOG 2026-09-13 补账条）。

## Session 29（2026-09-16）— v0.1.1：设置页展开态 APIKEY 计数徽标

- **做了什么**：`dshws-websearch` 自有 Typert Remote 命名空间（host 半 `src/key-counts.ts` + client 半 `src/client/key-counts-remote.ts`，`describeKeyCounts(refs)` 只回整数计数，refs 白名单防跨凭据探测）；KeyCountBadge 组件（0=灰空心圆/1-10=品牌色 pill/>10=警示色）；三项通路技术定谳（strict codec/私有字段穿透/rolldown 不降级装饰器→源码零装饰器语法）。commits `538eb74`（feature）+ `b58f971`（徽标绿色语义样式裁定）。
- **测试**：+16 例（key-counts 单测 + artifact 冒烟 + controller 5 + section 5）；全量 476 passed。
- **实测**：3423 GUI 全过；3080 生产五个搜索 APIKEY 经用户指令复制入 3423 scratch（生产只读），四工具徽标计数 Tavily 5/Exa 1/Firecrawl 2/AnySearch 5。
- **证据**：CHANGELOG 2026-09-16 Key 计数徽标批条目（正本）；T0 审核 MATCH。

## Session 30（2026-09-16）— 上游 0.1.6-alpha.1 适配（文档面）+ 3423/3080 供版树切换

- **做了什么**：新 worktree `dsh-harness-016a1` @ `dsh-v0.1.6-alpha.1`（fetch tag → install → build）→ 3423 切换验证（横幅 0.1.6-alpha.1-0a15e36、四工具徽标、启停/接管/链卡全过）→ 3080 生产切换（用户裁定插件+DSH 一并升；profile 依赖切 v0.1.1 tgz + 016a1 供版重启）。docs-only commit `0764ba6`（CHANGELOG + README 中英 + upgrade.md 实操记录）。
- **误判（erratum，S32 T0 审核实锤）**：CHANGELOG 断言「peer `>=0.1.5-rc.1 <0.1.6` 按 semver 覆盖 0.1.6-alpha.1 无需放宽」——node-semver 预发布排除规则下为 **false**（semver 7.8.5 实测），生产实处于 peer 未满足状态（运行时零影响：web seam 零变更）。勘误与 dont-do 沉淀随本补账批落盘；peer 域放宽由 S32 T3 执行。
- **遗留（S32 接手）**：profile tgz 路径 `file:/tmp/dshws-s29/…`（/tmp 已清）成死路径——备份集 dshws-s27/s29/s30 全部消失，回滚预案失效。
- **证据**：CHANGELOG 2026-09-16 上游适配批条目 + S32 T0 实测（016a1 describe / pid 82060/83310 cwd / dead path）。

## Session 31（2026-09-16）— 开源发布批

- **做了什么**：LICENSE（MIT）；README 中英安装三方式（发布页 tarball/源码 clone 打包/profile file:）；推送前敏感扫描零命中 + 本机失效 x-access-token 清理；公开仓库 https://github.com/GeerMrc/dsh-websearch （master + tags v0.1.0/v0.1.1）。commit `ba6a0ee`。
- **证据**：git ls-remote（master=ba6a0ee、tags live）；T0 审核 MATCH、密扫复跑零真实命中。

## 台账登记（本补账批同步动作）

- STATUS.md 台账补 28/29/30/31 四行（✅，指针指向本记录与 CHANGELOG）；当前位置块刷新至 S32。
- roadmap：行 15（S15 文档棒）勘正关闭——实质由 S26 T6 文档腿（Tier B）+ S27 生产重建实测（安装→真实搜索留痕）复合兑现；M5 转 ✅。行 16/M6 维持 ⏳（待用户上游验收，设计如此）。
- CHANGELOG：补 S28 条目 + S30 semver 勘误注记。
- dont-do：新增「semver 预发布覆盖断言须实测」条目。

## 下一 Session 启动指令

见 docs/sessions/2026-09-23-session-32.md 末尾（S32 为本补账批的后续棒，进行中）。
