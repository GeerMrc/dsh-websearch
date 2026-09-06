# Plan — 2026-09-06-014a-s14a-install-takeover-plan

> plan 是验收契约。本棒 = **S14a 插行棒：装即接管 web_search（bundle patch 钉扎 search 侧）**。
> 方向由用户裁定（方案 B，2026-09-06 AskUserQuestion 获答 + 计划包 ExitPlanMode 批准）。
> 分支 `feat/s14a-install-takeover`；插件自带 patch 一个文件的产品变更 + ADR + 文档，
> node/src 产品逻辑零改动。

## 目标

插件随包 cordis.patch.yml 增加 `- id: web` 条目钉扎
`searchProvider: dshws-chain`（fetch 显式重述为 `http` 保底）——实现「**安装即接管
web_search、卸载单命令完整复原、用户层终裁保留**」，零宿主源码改动、仍为单 tarball
独立安装。

## 背景

**任务源**：用户提议（2026-09-06）「不装插件用宿主默认 websearch；装了自动接管」
+ 方向裁定 B；roadmap 插行规则（小数编号，下游编号不顺延）。

**阶段 0 gate（2026-09-06）**：独立审核 S14 **PASS**（🔴×0；🟡×1 = session-14
接力指令债务实况句漏列 L-2 → 本棒 T0 勘注处置〔时点快照不回改先例〕；🟢×2 注记；
正本 docs/sessions/audit-logs/2026-09-06-s14a-stage0-review-of-s14.md）。基线
**270 passed | 9 skipped (279)**、i18n **34 keys**、client.js **41.81 kB**、
master `81f6986` clean。

**摸底实锚（2026-09-06 双 Agent 只读调研，两份报告要点）**：

- 宿主 patch 应用算法允许 id 定向覆盖别包行（`vendor/include/src/index.ts:121-124`，
  `target[key] = value` 纯赋值；无行属主校验，:66-75/:96-101 注释明文「后层可配置
  先层插入的行」）；**config 整段替换无深合并**（app-boot/README.md:139）——钉扎
  必须重述 searchProvider+fetchProvider 全部键；**不写 name 守卫**（写错静默跳过，
  :116-119）。
- 层序：base patches → 插件 bundle patches（bundles 数组序 = 安装序，
  apps/cli/src/plugin.ts:62-68）→ 用户层 → home 层 → --patch（
  apps/cli/src/profile-boot.ts:136-143）；同 id 后写者赢；**用户层终裁保留**。
- 卸载复原：patch 层纯派生态——根 cordis.yml 每次启动重写为空
  （profile-boot.ts:104-122）、每次从空根合成（profile.ts:854-861）；`plugin
  remove` splice bundles（plugin.ts:77-87）→ web 行自动回落 base 值
  `deepseek-official/http`（bundle/base/cordis.patch.yml:450-454）。**单命令完整
  复原，无需手删两行**（对比现状）。
- 先例：仓内 `agent-team-profile/cordis.patch.yml:14-24` 覆盖 base 行整段 config +
  disabled 三行；`web-app` patch 覆盖 base 多行；生态先例 anysearch 官方插件自钉
  provider（ADR-0009 Context :21 引用）。
- 漂移风险：base 未来给 web 行加第三键会被重述掉，schema 默认兜底（**非 base 值**，
  fiber.ts:50-62 + config-catalog.md:129-135 佐证）——缓解 = peer 域 + 发版清单
  检查项。
- 宿主无「禁用 provider」概念（单赢家 config 驱动，web/src/index.ts:172-194）；
  客户端无选择态 RPC（pluginInventory 无 config；web 行未注册 settings namespace
  ——设置页只做静态文案，不做接线状态显示）。
- fetch 链现状：单成员 firecrawl（src/index.ts:229-231），无 key 即
  `available()=false`——装即接管 fetch 会弄坏无 key 用户 web_fetch（方案 C 否决
  依据）。
- 破坏性分析零回归：无任何 key 用户官方 provider 同样不可用（等价）；有
  DEEPSEEK key 用户链内 deepseek 成员即刻就绪（同 ref，末位兜底）。

## 范围决策（D1-D6）

| # | 决策 | 依据 |
|---|---|---|
| D1 | **patch 形态**：现 insert 行 + `- id: web` + `config: {searchProvider: dshws-chain, fetchProvider: http}`；不写 name；fetch 显式重述保底 | 摸底锚（整段替换/无属主校验/name 守卫）；fetch 单成员风险 |
| D2 | **ADR-0013（accepted）**：装即接管 search；amend ADR-0001 组合面 / ADR-0004 D2 接线形态（中立性实质不变：链默认序 DeepSeek 末位）/ ADR-0009 D5 博弈规则（bundle 层延伸：安装序后写者赢、用户层终裁）；三 ADR 注记互指 | 决策链一致性 |
| D3 | **漂移防线**：peer 域（>=0.1.2-alpha.3 <0.1.3）+ 发版清单「追平重述 web config」检查项；风险与缓解入 ADR Consequences | config-catalog 佐证 |
| D4 | **既有用户迁移**：用户层两行同值不冲突可保留；卸载时需删（README 口径沿用） | 层序后写者赢 |
| D5 | **设置页文案**：页头 intro 一句「安装即接管 web_search（fetch 可选手动）」——纯静态，不做接线状态显示 | 无选择态 RPC（调研证） |
| D6 | **scope-out**：fetch 自动接管（C，否决）；GUI 接线状态（需上游 remote）；宿主任何改动 | 零内核侵入红线 |

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 类别 | 前置 |
|---|---|---|---|---|
| T0 | 治理批：plan 014a + 阶段 0 audit-log 入库 + ADR-0013 + 三 ADR 注记 + roadmap S14a 插行 + 🟡-1 勘注（session-14 接力指令 L-2 缺项）+ 启动全状态区 + session-14a 骨架（三★节占位） | 治理产物逐笔可 diff | 治理 | — |
| T1 | patch 变更（TDD）：cordis.patch.yml 双条目 + 新增内容测试（读文件断言：insert 行 / web 行两键 / 无 name） | 红→绿留痕 | TDD | T0 |
| T2 | e2e 装卸载（scratch **3423** 查占）：dump 基线 → add → dump 翻转（dshws-chain/http）→ **remove 单命令 → diff 基线零输出** → 用户层终裁（写 dshws-deepseek → dump 用户层赢 → 清理） | 三态 dump 留痕 | 实测 | T1 |
| T3 | 设置页 intro 文案 + locales +1~2 键 + README/runbook 最小更新 | i18n parity + 零 CJK | TDD | T2 |
| T4 | 门墙七命令（提交态）+ 台账/门墙表 + Agent Note（ADR-0013 语义表 + 漂移防线 + anysearch 博弈——S15 正素材） | 数字亲见 | 门墙+文档 | T3 |
| T5 | 浏览器实测棒（**3423/3432** 查占；复用 S14 stub 配方：SSE LLM stub + workspace canonical 播种）：**装完不写用户层 patch** boot → web_search 走链 → served-by 徽标亲见 → 复原 | 装即接管端到端证据 | agent 实测棒 | T4 |
| T6 | 阶段 4/5 独立验证（全量门墙 + R1-R6 对峙 + 三问 + 探针） | PASS / COMPLETE | 强制独立 | T5 |
| T7 | 收尾：session-14a 补全 + 原子收官 + STATUS/roadmap/CHANGELOG + merge `--no-ff` + 接力指令（债务实况以台账全量口径——含 L-2） | 6 件套 | 收尾 | T6 |

## 验收条目（R1-R6）

- **R1** ADR-0013 在档（accepted）且与 0001/0004/0009 注记互指闭合；中立性实质
  （链默认序 DeepSeek 末位）不变亲证（ADR-0004 D3 未动）。
- **R2** patch 内容 TDD 红绿：insert 行 + web 行两键重述 + 无 name 守卫。
- **R3** e2e：装即翻转（dump searchProvider=dshws-chain）+ **卸载单命令复原**
  （diff 基线零输出）+ 用户层终裁保留（钉 dshws-deepseek 时用户层赢）。
- **R4** fetch 不动：dump fetchProvider=http；无 firecrawl key 场景 web_fetch 不坏
  （推演 + ADR 注记）。
- **R5** 门墙全绿（test/typecheck 双面/lint/build〔client.js 增量披露〕/pack 五件/
  i18n parity + 零 CJK/前后 clean；基线 270|9(279) 起算）。
- **R6** 浏览器：零手动接线 boot → 工具调用行 served-by 徽标亲见 + 隔离法证。

## 债务归属映射（正本）

- **本棒清偿**：🟡-1（session-14 接力指令 L-2 缺项）→ T0 勘注。
- **维持**：🟢×4（fetch 排序 UI/恢复默认/anysearch fetch 面/CSS module 化→S15 顺手
  候选）+ L-2（**新接力指令全量口径列出**）+ 观察（badge 超长 id/firecrawl 已复核/
  i18n CI→S15/tsdown→S15）+ v2 backlog（不排期）。
- **新登记预测**：无；执行期发现如实入账。

## 高危命令预告

1. /tmp/dshws-s14a/ scratch 自建（含 SSE stub 脚本）。
2. 3423 实例 + 3432 stub 启停（起前 lsof 查占；kill lsof 精确；常驻口零接触）。
3. scratch pnpm install + tarball add/remove（npm pack 非 publish）。
4. 浏览器自动化（fake 键 sk-fake-s14a 仅 env；无真实凭据）。
5. 宿主仓零写（git status 亲证）。

## 风险

- 漂移（D3 防线）；安装即隐式变化的披露义务（README 首屏 + 设置页 intro）；
  多插件钉扎博弈文档化（ADR-0013 Decision 5）。
- T5 复用 S14 配方已知坑：SSE 形状 / workspace canonical 播种 / 每轮新会话 /
  locator click 假成功 → cua 坐标（dont-do 在册）。
