# Plan 027 — S27 生产切换批（T7：~/.dsh 切 0.1.5-rc.2 + dsh-websearch v0.1.0 上生产）

> Session 27 | 2026-09-13 | 用户指令正本：「可考虑插件-网页搜索进主线生产版本切换部署……当前已有 3080 所有使用的模型相关配置可保留,但所有 session 数据全部清除;只需要基于上游 DSH 版本+当前我们的插件-网页搜索信息，以及模型 APIKEY 接入信息保留，其他任何可以彻底清除」。
> 阶段 0 gate：**PASS**（🟢×12/🟡×2——3080 未起服、凭据双位置，均入步骤）。

## 0. 关键事实（计划期实测）

- **healing 供版机制**：`~/.dsh/profiles/node_modules/@deepseek-ai/*` = 237 条 symlink → 主树 `apps/cli/node_modules`（alpha.3 @3281e04b59）。生产版本 = 运行 CLI 的树。
- **~/.dsh 现物**：`.credentials.yaml`（顶层，模型+搜索 key 库）/ `settings.yaml`（模型配置）/ `.anonymous-user-id` / `sessions/`（4 项目目录）/ `storages/` / `logs/` / `attachments/` / `profiles/`（含 anysearch 0.1.4 安装 + healing symlinks）/ `settings.yaml.bak-20260817`。
- **切换路线裁定（推荐 B）**：
  - A（STATUS 旧案）= 主树 merge-forward（dev←master 67 冲突 + 宿主门墙 playbook）→ healing 自动换版。重、险、与「升级走独立 worktree」红线相悖。
  - **B（本计划）= 重建 ~/.dsh + worktree 供版**：用户已授权全清——整 profiles/ 重建时 healing symlink 落到 0.1.5 worktree（dsh-harness-015，已过 S25 八项兼容清单 + 3423 真实搜索验证）。主树保持 alpha.3 零接触；其 merge-forward 降为后续独立 housekeeping 棒。
  - B 的已知边界（披露）：若未来从主树 cwd 运行 `dsh` 命令，healing 可能把 symlink 拉回主树（双树固有）；生产服务固定从 worktree 启动即可。
- **anysearch 裁定简化**：全新 profile 无 anysearch → ADR-0013「卸→装」只剩「装 dsh-websearch」。
- **key 人工配置 = 不需要**：`.credentials.yaml` 保留回填后插件按同名 ref 自动接管。

## 1. 任务清单（串行；本批无插件代码变更——仓库提交仅治理工件）

| # | 任务 | done 条件 |
|---|---|---|
| T0 | 治理批：分支 feat/s27-production-cutover + plan 027 + 阶段 0 audit-log 落盘 + roadmap S27 插行 + STATUS 启动 + session-27 骨架 | 工件在档 |
| T1 | 备份保留面 → `/tmp/dshws-s27/backup/`：`.credentials.yaml`、`settings.yaml`、`.anonymous-user-id`（+ md5 清单）；其余列入清除清单 | 备份实物 + md5 对账单 |
| T2 | **清除**（用户已授权；执行前贴最终清单 + `ls -A ~/.dsh` 快照基线〔9 项，阶段 2 已录〕）：`sessions/` `storages/`（含 session_projcache）/ `logs/` `attachments/` `profiles/`（含 anysearch + 237 旧 symlink）/ `settings.yaml.bak-*` | `ls -A ~/.dsh` 仅剩保留三件 |
| T3 | 安装：worktree（node22 PATH + **显式 `export DSH_HOME=$HOME/.dsh`**）`plugin --profile web add /tmp/dshws-s14a/dsh-websearch-0.1.0.tgz` → `--dump-config` 三接线（searchProvider: dshws-chain / fetchProvider: dshws-fetch-gate / insert 行）+ healing symlink 指向 worktree 亲证（抽 3 条 readlink） | dump 三处 + symlink 实证 |
| T4 | **先回填再起服**：settings.yaml / .anonymous-user-id 回位（.credentials.yaml 未动即在位）；若 0.1.5 拒收某键 → 删该键起服后 GUI 补（备份兜底）+ 凭据 gate 验证：设置页成员卡绿点（GUI 或 credentials describe 探针） | 模型配置 + key 生效实证 |
| T5 | 3080 起服（worktree cwd + nohup）+ 浏览器 token 首访 + **真实搜索 served-by 亲见**（chain log） | 3080 全要素 + 搜索留痕 |
| T6 | 阶段 4/5 独立验证 + 收尾六件套 + 接力指令 | audit-log ×2；六件套齐 |

## 2. 验证矩阵

| 验收 | 内容 | 责任 |
|---|---|---|
| R1 | 清除后保留面精确 = 用户口径（模型配置 + APIKEY + 插件；其余零残留） | 主 Agent + 阶段 4 |
| R2 | dump 三接线 + healing 指向 worktree + 插件 0.1.0 | 阶段 4 |
| R3 | 3080 token 流 + 设置节 + 凭据绿点 + 真实搜索 served-by | 阶段 4（浏览器亲验） |
| R4 | 主树零接触（git status + worktree detached fb2cf4b9e 不变） | 阶段 5 |
| R5 | 3423 dev 实例不受影响（pid 61902 存活） | 阶段 5 |

## 3. 高危命令预告（用户已授权项 + 兜底确认）

- **~/.dsh 大范围删除**（T2）——用户本指令显式授权；执行前贴逐目录最终清单（fail-closed）。
- **3080 起服**（生产实例拉起）——授权范围内。
- 无 push / 无发布 / 无主树写。

## 4. 不做（边界）

- 主树 merge-forward（67 冲突面）——降级为后续独立 housekeeping 棒（本批 B 路线不需要）。
- 远端创建推送 / 插件代码变更 / 版本号变更（生产跑 tag v0.1.0 现物）。
