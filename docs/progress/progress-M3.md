# Progress — M3 宿主包完备

> 本文件是 M3 阶段（宿主包）的进度台账。2026-09-02 新开（Session 03）。
> 验收契约：`docs/plans/2026-09-02-003-s03-host-skeleton-chain-plan.md` 的 R1-R5 验收条目，
> 阶段验收逐条对应给 PASS/FAIL + 证据；🟢 债务归属映射正本在 plan 债务映射节，本文件台账
> 为其镜像。

## 里程碑

| 里程碑 | 内容 | 状态 |
|---|---|---|
| M1 治理与规划定稿 | 治理产物齐备且占位符清零，计划过独立审核与人工终审 | ✅ 2026-09-02 |
| M2 可行性定谳 | GUI 形态、安装链路、交付形态有实测结论，ADR-0006/0007 定稿 | ✅ 2026-09-02 |
| M3 宿主包完备 | 五 provider + 链 + 凭据/设置全绿，安装端到端可复现 | 🚧（S03 进行中） |
| M4-M6 | 设置页完备 / 交付就绪 / 上游验收通过 | ⏳ |

## 进行中

- Session 03（插件宿主骨架 + 链式 meta-provider）：T0-T13 完成，T14（阶段 4 独立审核）/ T15（收尾）待执行

## 待启动

- Session 04（deepseek/tavily provider + 凭据接线）——前置：S03 收官

## 已完成

### S03 骨架批（2026-09-02，分支 feat/s03-host-skeleton）

阶段 0 独立审核 S02 **PASS**（🔴×0，新增🟡×3）→ T0 清偿 + 计划落盘 `c691caa` → 阶段 2 轮 1
**NEEDS REVISION**（F-001..F-003 🟡 / F-004..F-008 🟢）→ 修订 `748d695` → 同 Agent 复审
**APPROVED**（T1/T2 机械豁免类别确认成立）→ 阶段 2.5 AskUserQuestion 未获答，按接力序取
默认批准项自主推进（披露）→ T1-T12 逐一红→绿 → T13 门墙收口。

| 任务 | 内容 | 结果 |
|---|---|---|
| T0 | 前序🟡×3清偿 + STATUS 启动刷新 | 完成（`c691caa`） |
| T1 | 包骨架（manifest/tsconfig/tsdown/patch/最小骨架） | 完成（`35969f0`；install 54.3s 0 error；build/typecheck/pack 四验收过） |
| T2 | 四命令脚本拉起 | 完成（`de2cc28`；机械豁免类） |
| T3 | errors.ts 码清单 + DshwsError + 全败构造 | 完成（`1eb489f`；红→绿 6 passed） |
| T4 | config.ts schema 全字段 + resolveConfig | 完成（`b5d9259`；红→绿 15 passed） |
| T5 | 链核 + 必测①顺序保持 | 完成（`0886cb1`；红→绿 17 passed） |
| T6 | 必测②③跳过 + NO_MEMBER + 链 available() | 完成（`257fb65`；变异判别力证明 6 红→还原 26 passed） |
| T7 | 必测④运行失败降级 | 完成（`76e849f`；红→绿 28 passed） |
| T8 | 必测⑤全败 CHAIN_EXHAUSTED + 摘要 | 完成（`77d83a8`；变异判别力证明 2 红→还原 30 passed） |
| T9 | 必测⑥servedBy content 首行署名 | 完成（`24bd9db`；红→绿 33 passed） |
| T10 | 必测⑦超时降级 + 取消传播 | 完成（`6a96770`；红 3 failed/10.14s→绿 36 passed） |
| T11 | 必测⑧直连面 + MemberRegistry + apply 定形 | 完成（`b62b072`；红 5 failed→绿 42 passed） |
| T12 | fetch 链同构 dshws-chain-fetch | 完成（`ce26a06`；红 5 failed→绿 47 passed） |
| T13 | 门墙收口 + Agent Note + 本台账 | 完成（本文件 + docs/notes/2026-09-02-s03-chain-core-design.md） |

### 门墙实测数字（T13 收口，node v22.23.2 / pnpm 11.7.0）

- `pnpm test` → **Test Files 6 passed (6)，Tests 47 passed (47)**，~139ms
- `pnpm typecheck` → exit 0（0 error）
- `pnpm lint` → **0 warnings and 0 errors**（10 files，96 rules）
- `pnpm build` → lib/index.js 12.76 kB + lib/index.d.ts 7.58 kB
- `pnpm pack --dry-run` → cordis.patch.yml + lib/index.d.ts + lib/index.js + package.json（docs/ 不入库）

## 阶段验收（R1-R5，阶段收官时填）

（T15 原子收尾时逐条对照 plan R1-R5 填 PASS/FAIL + 证据。）

## 技术债（台账）

| 债务 | 等级 | 归属 |
|---|---|---|
| L-1 deepseek/exa/perplexity/firecrawl 插件内重实现 | 🟢 | S04/S05a（S03 已落五族码清单骨架，errors.ts） |
| L-2 per-profile GUI 覆盖二期候选 | 🟢 | 二期候选，不排期 |
| L-3 spike 脚手架不入库，正式骨架重建 | 🟢 | **已清偿**（T1 `35969f0` 正式骨架落库） |

映射正本：`docs/plans/2026-09-02-003-s03-host-skeleton-chain-plan.md` 债务映射节。

## 已验锚点（台账）

| 锚点 | 验证来源 |
|---|---|
| npm 发布面（2026-09-02 `npm view versions` 全列表）：dsh-web 0.1.2-alpha.2..4；cordis 4.0.1-rc.1..4.0.2；schemastery 3.18.1-rc.1..3.18.2；dsh-llm 0.1.2-alpha.4 | S03 阶段 1 摸底 + 审核轮 1 独立抽验一致 |
| anysearch 0.1.4 依赖纪律先例（schemastery dep `>=3.18.1-rc.1 <4`、cordis/dsh-* peer+dev 双声明、engines `^22.19.0 || >=24.0.0`、exports 三键、无 client 键） | `npm view @anysearch/anysearch-dsh@0.1.4` 实测（阶段 1 + 审核轮 1 双验） |
| seam 面：provider 接口三方法（web/src/types.ts:102-120）、注册 disposer + WEB_DUPLICATE_PROVIDER（index.ts:103-129）、WebSearchResult（types.ts:35-42） | S03 阶段 1 亲读 + 审核轮 1 抽验命中 |
| dsh-web published types 含 ctx.web 增强（`declare module '@deepseek-ai/cordis'`）+ 内部 import dsh-llm | 审核 Agent 下载 alpha.4 tarball 实证（lib/types/index.d.ts:13、types.d.ts:7）+ T11 typecheck/探测互证 |
| schemastery 实例可调用归一化（无 .validate；空对象→结构骨架） | T4 红绿循环实测（node_modules lib/types/index.d.ts:124-125） |
| cordis 日志面 ctx.logger（printf 风格） | vendor/cordis/src/logger.ts + webhook/settings 用例（webhook/src/index.ts:154）+ T11 typecheck 实证 |
| 测试基线 | **47 条（6 文件）全绿**——本仓首个基线（S03 建立） |
