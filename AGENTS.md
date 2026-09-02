# AGENTS.md — dsh-websearch 项目宪法

DSH 外挂式统一 WebSearch 管理插件（独立项目，零内核侵入）。技术栈一句话：TypeScript + cordis 插件协议 + vitest，宿主为 deepseek-harness（`dsh`）0.1.2-alpha.x。

## 治理硬约束（session-governance）

- 本项目运行 session-governance 治理化流程：正本 `docs/governance-sessions.md`，进入方式见 `.session-start`；进度唯一权威 `docs/STATUS.md`，任务唯一源 `docs/roadmap-WBS.md` 的 ⏳ 行。
- 前序审核 gate：开新任务前由独立 Agent 实测审核上一 session 交付，债务三分级——🔴 阻塞（先修才准推进）/ 🟡 非阻塞（先债后新）/ 🟢 延后（计划与交付物中显式声明）。
- 收尾 6 件套：交付物落盘 / session 记录 / STATUS+progress 更新 / 踩坑沉淀（RCA+dont-do）/ CHANGELOG / 接力指令。缺一即流程失败。
- 质量红线：执行 ≠ 审核（审核环节独立 spawn，主 Agent 永不自审）；五禁——禁虚假审核（审核须 file:line 证据）、禁自我以为（禁假设式实现）、禁跨流程（不跳阶段）、禁批量执行（TDD 逐一，机械变更豁免唯一例外且分类须独立 Agent 确认）、禁未经实测的信源；写操作严格串行。
- 高危命令门控：大范围删除、`git reset --hard`/`git clean` 带丢弃、`push --force*`、发布类动作、凭据读写、仓库外写入、系统配置修改、依赖删除或大版本变更、治理产物删除、`curl | sh` 类网络执行——任何时刻先向用户确认。

## 插件开发规范（cordis 标准形态）

- 插件必须 namespace exports（禁 default export——Loader 会丢 `inject`）；`inject` 只写服务名数组；Config 走 schemastery，每个字段有 JSDoc 契约。
- 一切注册经 `ctx.effect()` / `ctx.on()`；注册函数返回 disposer；HMR 下可完整丢弃重建。
- 凭据零明文：key 一律 credential-ref（环境变量名）经 credentials 服务每操作解析；禁把任何 key 写进配置文件、文档、测试快照。
- 错误用领域错误类型 + 稳定 string code（前缀 `DSHWS_`）；空 `catch` 必须注释说明吞掉什么、为何别处不可达。
- client 半区一切用户可见文案 locale-owned：双语 typed dictionaries（en 为源、zh 全键 parity），禁硬编码文案。

## seam 依赖纪律（上游可持续契约）

- 只依赖公开面：`@deepseek-ai/dsh-web` 的 provider 接口与 `ctx.web` 注册 API（type-only import）、credentials / settings 服务注入、client 公共 API（slots / locale / remote）。禁 import 上游内部模块、禁依赖上游私有注册表。
- provider id 全前缀隔离：本插件注册的一切 provider id 以 `dshws-` 开头（如 `dshws-chain`、`dshws-tavily`），杜绝与上游及第三方插件（`deepseek-official`/`exa`/`perplexity`/`http`/`anysearch`）撞名触发 `WEB_DUPLICATE_PROVIDER`。
- peer 依赖（`@deepseek-ai/cordis`、`@deepseek-ai/dsh-web`）版本域钉死 `0.1.2-alpha.x`；上游升级必须跑升级演练手册（`docs/upgrade.md`，S09 交付）后才可声明兼容。

## 测试要求

- vitest；核心逻辑/契约类先红后绿（先红 = 证明测试有判别力），重构禁证红，文档/spike 须有验证手段且回归不红。
- 每个 provider：单测（本地 mock HTTP）+ 真实 API e2e（无 key 自跳）。
- 链语义必测清单：顺序保持、未配置跳过、不可用跳过、运行失败降级、全败报最后错、servedBy 归因、凭据热刷新、钉死单 provider 不降级。
- 验收数字必须实测亲见，禁算术外推。

## 分支与提交

- `master` = 可安装发布态；开发在 `feat/<批次>` 分支；独立审核通过才合入 `master`。
- 提交信息 `<type>(<scope>): <summary>`；执行期业务任务每任务一提交（红→绿→commit），禁跨任务攒批提交。
- 非平凡变更必须同批次带 Agent Note（`docs/notes/`）或 ADR（`docs/decisions/`，immutable，修订走 superseded）。

## 环境纪律

- node ≥ 22.19（宿主 dsh engines 要求）；本机默认 v20——构建/测试前必须切 nvm。环境验证命令：`node --version && pnpm --version`。
- 大版本跳跃或换树后先 `pnpm install` 再跑测试；报告测试结果必须附命令原文与实测数字。
