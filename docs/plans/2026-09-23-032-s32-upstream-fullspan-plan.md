# Plan 032 — S32 上游全跨度升级适配批（0.1.5-rc.3 / 0.1.6-alpha.2 / 0.1.7-alpha.2）

> Session 32 | 2026-09-23 | 用户指令正本：「我们开发的 DSH 的插件`网页搜索`，当前版本与最新 DSH 官方升级有冲突，请全面审核确认，并制定高可用方案随官方 DSH 最新版本进行升级适配升级工作推进……当前 `:3424`端口在进行另外插件开发用，尝试使用 `:3434`做开发与调试以及验证确认相关工作用」。
> 计划期裁定（2026-09-23，AskUserQuestion 三问）：① **全跨度适配**（peer 域显式覆盖 0.1.5-rc.1…0.1.7-alpha.2 全部已发布版本，devDeps 升 0.1.7-alpha.2，三线全演练）；② **修死 tgz、宿主树不切**（生产 profile 换 v0.1.2 持久路径 tarball，3080 树维持 016a1）；③ **授权凭据复制**（按 S24/S25 先例复制进 scratch home，3434 验证后删除副本）。

## 0. 关键事实（计划期实测）

- **C1 peer 域排除官方新线（实证）**：现 peer `>=0.1.5-rc.1 <0.1.6` 下，semver 6.3.1/7.8.4/7.8.5 三副本判定一致——`0.1.5-rc.2/rc.3`=true，`0.1.6-alpha.1/2`、`0.1.7-alpha.1/2` 全 false（node-semver 预发布排除规则：仅同 tuple 带预发布的比较子放行预发布版）。生产 3080（016a1 树）+ 插件 v0.1.1 实处于 peer 未满足状态；S30「peer range covers 0.1.6-alpha.1 by semver」为误判（false-green）。
- **C2 npm 官方现状（registry 实查 2026-09-23）**：`next`=0.1.5-rc.3（09-22）、0.1.6-alpha.2（09-17）、`alpha`=0.1.7-alpha.2（09-22）；cordis 4.0.3/4.0.4（09-22，latest=4.0.4）。插件 devDeps 15 条全钉 0.1.5-rc.2、cordis 4.0.2，对上述任何版本零演练。本地 clone tag 止于 dsh-v0.1.6-alpha.1（需 fetch）。
- **C3 生产 profile 死路径**：`~/.dsh/profiles/web/package.json:5` → `file:/tmp/dshws-s29/dsh-websearch-0.1.1.tgz`，目录已清——任何触发 profile 重装/协调的操作直接失败。
- **C4 已知破坏面（0.1.5-rc.2→0.1.6-alpha.1，550 commits 实证）**：`agent/session-start` 事件删除、`agent/created` payload 变更（+source/signal，串行 await，可否决）、`ctx.codeRuntime`→`ctx.ptcRuntime` 重命名、`PreToolDecision`/`ToolErrorInfo` 形状增广、locale 键 `json.collapseNode/expandNode` 删除、api-remotes 名册新增、web 启动必需项收紧、Cordis loader 回退非事务化；**web seam（ctx.web 注册 API/provider 类型）零源码变更**。0.1.6-alpha.2 与 0.1.7-alpha.2 段本地无 tag，待 T2 补审。
- **C5 治理欠账**：S28–S31 已执行（commit ba6a0ee 止）但无 session 记录、STATUS/progress 停在 S27；AGENTS.md 头部宿主版本（0.1.2-alpha.x）、`.session-start` 版本/端口口径过期。
- **插件消费面（适配审计对象）**：dsh-web（registerSearchProvider/registerFetchProvider + seam 类型，type-only）、dsh-credentials（4 层解析 + reference-updated 事件）、dsh-settings（attachSettingsSection + revision）、dsh-typert-protocol（**runtime dep**，钉 0.1.5-rc.2，key-counts RPC）、client 半区（slots/locale/remote.settings/remote.credentials 注入 + toolview 接管 + primitives 值导入）、schemastery/cordis。
- **端口方案**：本轮开发/调试/验证一律 **3434** + scratch home `/tmp/dshws-s32/home`；3423（websearch 常驻 dev，运行中）、3424（selfupdate U3 保留位）不动；3080 仅 T7 受控操作。

## 1. 任务清单（串行逐一）

| # | 任务 | done 条件 |
|---|---|---|
| P0 | 本计划落盘 + 独立 Agent 审核计划（阶段 2） | 本文件在档 + 审核结论 APPROVED（NEEDS REVISION 则修订复审） |
| T0 | 前序审核（独立 Agent）：实测审 S27–S31 交付 + 债务三分级 | audit-log 落盘（🔴/🟡/🟢 带 file:line 证据），重点核 C1 误判、C3 死 tgz、C5 欠账 |
| T1 | 治理补账（先债后新）：S28–S31 合并补账 session 记录；STATUS 当前位置块+台账刷新；roadmap 陈旧 ⏳ 行清理；AGENTS.md 头部/端口段刷新（3434 入册、3424=selfupdate 保留）；`.session-start` 过期行修正；S30 semver 误判 erratum + dont-do 条目（现象/根因/修复/预防） | STATUS/roadmap/补账记录三处一致；erratum+dont-do 在档 |
| T2 | 上游钉板：主仓 `git fetch origin --tags` → worktree ×3（dsh-harness-015rc3/016a2/017a2；tag 缺失则报阻降级该线为显式债务）→ 各自 node22 + `pnpm install && pnpm run build`（必须 build，否则 typert.host.js 缺失）→ 独立 Agent 按 Note s25 八项清单出三线兼容矩阵 → `docs/notes/2026-09-23-s32-upstream-diff-matrix.md` | 三 worktree install+build EXIT=0；矩阵逐缝结论（零适配/破坏面）带 commit 级证据；含 cordis 4.0.3/4.0.4 变更审计 |
| T3 | 依赖域刷新（机械变更豁免候选，分类须独立 Agent 确认）：peer 六条 → `>=0.1.5-rc.1 <0.1.8 \|\| 0.1.6-alpha.1 \|\| 0.1.6-alpha.2 \|\| 0.1.7-alpha.1 \|\| 0.1.7-alpha.2`；devDeps 15 条 → 0.1.7-alpha.2；runtime dep `dsh-typert-protocol` → 0.1.7-alpha.2；cordis devDep 按 0.1.7-alpha.2 线实际 peer 升 4.0.3/4.0.4；扩展 pnpm `minimumReleaseAgeExclude`（新版均 1 日龄）；`pnpm install` 后全量门墙 | semver 判定脚本对 7 个已发布版本全 true（实测亲见）；typecheck（node+client）/lint/vitest/build/check:i18n 全绿 + 实测数字留痕 |
| T4 | 源码适配（条件触发，按 T2 矩阵；TDD 先红后绿，禁攒批）：候选——agent/created 类型增广、locale 键、client inject 面核对 | 每项 红→绿→commit；零适配则记录证据关闭 |
| T5 | 版本与产物：v0.1.1→v0.1.2；CHANGELOG（含 C1 历史纠偏披露）；`npm pack` 产物存持久路径 `/Volumes/IPFSJK/Zcode/dsh-websearch/dist-artifacts/`（gitignore）+ v0.1.1 回滚副本；docs/upgrade.md 增补三线演练矩阵与 3434 口径 | tgz 双副本在持久路径；CHANGELOG/upgrade.md 更新在档 |
| T6 | 3434 三线演练（015rc3/016a2/017a2 各一轮）：目标树 cwd 起服（DSH_HOME=/tmp/dshws-s32/home，--port 3434 --no-open）→ plugin add v0.1.2 tgz → `--dump-config` 三钉扎行对照 → 凭据 gate（授权复制）→ 真实搜索一条 + served-by 徽标 → 降级验证 → web_fetch 两态 → GUI 冒烟（排序/折叠/兜底选择器）→ key-count 徽标（Typert RPC 跨版本关键点）→ §4 漂移防线四查（patch 钉扎/id 撞名/seam 形状/toolview 替身卡片）→ 停服换树 | 三线证据链齐全（audit-logs）；终态 3434 无残留进程、凭据副本已删；任一不过即 blockers 如实上报 |
| T7 | 生产修复（用户已授权，操作前复述裁定原文留痕）：`~/.dsh/profiles/web/package.json` 依赖改指持久路径 v0.1.2 tgz → profile 内 pnpm 安装 → 3080 重启（预告短暂中断）→ 按 S30 验收集验证（横幅/徽标计数/接管开关/dump 对照）；settings.yaml+.credentials.yaml 不触；回滚=改回 v0.1.1 持久副本重启 | profile 可重装（C3 消除）实证 + 3080 验证过 |
| T8 | 独立审核（阶段 4）+ 交叉验证（阶段 5），两个独立 Agent | 阶段 4 逐条核验收矩阵 + 全量门墙复跑一次（唯一责任点）；阶段 5 完成度/技术债/遗漏 + 冒烟采信复核（重点：semver 实证、C3 修复、三线证据、补账完整） |
| T9 | 收尾六件套 + ops runbook：session 记录 S32（10 节骨架）/progress/STATUS+roadmap ✅/RCA+dont-do（S30 误判、死 tgz）/CHANGELOG/接力指令；更新 `/Volumes/IPFSJK/Zcode/dsh-ops-3080-runbook.md`（端口分配表+3434+持久产物路径+死 tgz 史）；独立审核通过后合入 master | 六件套齐；runbook 同步；master 合并留痕 |

## 2. 验证矩阵

| 验收 | 内容 | 责任 |
|---|---|---|
| R1 | 计划经独立 Agent 审核 APPROVED | 阶段 2 |
| R2 | T0 三分级清单落盘且带 file:line 证据 | 阶段 4 |
| R3 | 治理补账三处一致（STATUS/roadmap/补账记录）；erratum+dont-do 在档 | 阶段 4 |
| R4 | 三 worktree install+build EXIT=0；兼容矩阵三线逐缝结论带 commit 证据 | 阶段 4/5 |
| R5 | semver 7 版本全 true 实测；全量门墙绿 + 数字留痕 | 阶段 4（复跑） |
| R6 | T4 每项红→绿→commit，或零适配证据 | 阶段 4 |
| R7 | v0.1.2 tgz + v0.1.1 回滚副本在持久路径；CHANGELOG/upgrade.md 在档 | 阶段 4 |
| R8 | 3434 三线证据链齐全；终态无残留进程、凭据副本已删 | 阶段 4/5 |
| R9 | 生产 profile 指持久路径且可重装；3080 验证过；settings/credentials 零触碰 | 阶段 4/5 |
| R10 | 阶段 5 无未报技术债/无遗漏；不完整项追问并补完 | 阶段 5 |
| R11 | 收尾六件套 + ops runbook 同步 + master 合并留痕 | 主 Agent |

## 3. 高危命令预告（用户已授权项 + 兜底确认）

- **~/.dsh/profiles/web 写 + 3080 重启**（T7）——计划期裁定②显式授权；执行前复述裁定原文。
- **凭据复制进 scratch home**（T6）——计划期裁定③显式授权；验后删除副本。
- **主仓 worktree 新建**（T2）——非破坏性（主树/015/016a1 worktree 零接触）。
- 无 `push --force*`、无 npm publish、无主树切版、无 selfupdate 仓写。

## 4. 不做（边界）

- 3080 宿主树不切（维持 016a1）；树切新版本另发指令。
- 不 npm publish（发布另发指令）；不做 selfupdate 仓任何变更；不动 3423/3424。
- 主仓（deepseek-harness）dev 分支零提交零重写（仅 fetch + worktree）。
