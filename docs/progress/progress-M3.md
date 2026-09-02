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

| 条目 | 内容 | 结论 | 证据 |
|---|---|---|---|
| R1 | 前序审核 🟡×3 清偿可重放 | PASS | progress-M1.md:14 M2 行 ✅ / progress-M2.md:52-54 收官对账补注 / STATUS.md:36,40-46 启动刷新——阶段 4 独立 Agent 逐项 file:line 核验（`c691caa`） |
| R2 | 包骨架符合 ADR-0007 + dont-do 纪律 | PASS | package.json 逐键核验（name/version/exports["."]/files/dsh.bundle.patch/peer 域/dep/devDeps 实钉）；client 两键缺席 = D1（ADR-0006:47/ADR-0007:54 能力性表述）；pack --dry-run 重放四件清单；`35969f0` |
| R3 | 链语义必测 8 项逐项红→绿留痕 + NO_MEMBER + available() + fetch 镜像 | PASS | 每任务一 commit（T3-T12 十连）；断言逐项对峙（阶段 4 独立 Agent 全文抽读 6 测试文件，含 ⑧ `not.toBeInstanceOf(DshwsError)` 直连裸错误与 available() 三态 257fb65）；全量 47 passed 亲跑复现 |
| R4 | 门墙实测数字 | PASS | `pnpm test` 6 files/47 tests passed、`pnpm typecheck` exit 0、`pnpm lint` 0 warning 0 error（10 files/96 rules）、`pnpm build` lib 20.34 kB、pack 四件——阶段 4 独立 Agent 亲跑与下表数字全部一致 |
| R5 | 收尾 6 件套齐备且原子翻转 + 分支闭环 | PASS | 本文件 R 表 / session-03 记录（前序审核节 + 规范强化节）/ STATUS 台账 + 当前位置块 / roadmap S03 行 ✅ / CHANGELOG / 接力指令（记录末节 + 回复末尾）——同一收尾序列完成；feat/s03-host-skeleton 合入 master 留痕 |

### 阶段 4/5 独立验证发现（V-01..V-06，全 🟢 不阻塞，按流程改进承诺逐条落账）

| # | 内容 | 处置 |
|---|---|---|
| V-01 | T6 变异红数字「6 红」不可精确复现（审核同向变异实测 8 failed；变异 diff 未随 commit 留存） | 留痕不处置；后续变异校验把 diff 同批留存 |
| V-02 | T8 为纯测试 commit（行为体随 T7 落地），commit/台账/Agent Note 三处已披露 | 不处置；披露诚实，阶段 4 精确复现其「2 红」 |
| V-03 | T1「.gitignore 核补」为 no-op（bootstrap 已建且覆盖足够）无留痕说明 | 不处置；验收点冗余非缺陷 |
| V-04 | exports 额外 `"./package.json"` 键超出 plan 三键枚举（npm 惯例，plan 所列为必备非穷举） | 不处置 |
| V-05 | 宪法必测清单「凭据热刷新」未在本棒——roadmap/plan 均显式移 S04 | 显式范围决策，非遗漏；S04 落实 |
| V-06 | 调用方 abort 与成员超时同窗竞争时先记一次超时再降级一迭代才传播（语义收敛正确） | 时序组合面已显式归 S08 e2e（plan 风险节） |

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
