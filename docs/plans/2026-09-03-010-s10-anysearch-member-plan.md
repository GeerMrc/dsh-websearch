# Plan — 2026-09-03-010-s10-anysearch-member-plan

> plan 是验收契约：R 验收条目是 progress 台账阶段验收的对照正本，验证矩阵是各阶段验证的
> 单源引用。本棒为新成员棒（成员 by-the-book 全套，S04/S05a 模式）：核心逻辑 TDD 红→绿
> 逐一执行；e2e 扩展场景为验证类 + 牙齿证明；浏览器 GUI 实测沿 D5 配方（scratch 隔离 +
> fake 值 + unset 复原）。

## 目标

S10 交付 roadmap M7 行「anysearch 第六成员」（ADR-0009 路线 B HTTP 自实现）：
`src/providers/anysearch.ts`（`dshws-anysearch`）+ 错误五码族 + config anysearch 节 +
BUILT_IN_MEMBER_ORDER 尾部追加 + node 接线（自动入池享 S09 池化）+ client 第 6 卡 +
单测（信封/429/断网/超时/bad JSON/content→snippet）+ loopback 扩展 + 真实 API smoke
自跳 + 浏览器六卡实测。与 3080 官方 anysearch 插件共存语义在档（README S12 素材）。

## 背景

任务源 = `docs/session-roadmap.md` M7 段 Session 10 行；决策正本 = ADR-0009（路线 B 定
谳 + 共存语义）；集成面事实 = 2026-09-03 探索定谳（anysearch 探员报告，file:line 在
ADR-0009 Context）。功能扩展计划 = 2026-09-03 用户批准。

阶段 0 独立审核（2026-09-03，骨架库 v2，正本将随 T0 落
`docs/sessions/audit-logs/2026-09-03-s10-stage0-review-of-s09.md`）：对 S09 **PASS**——
🔴×0；测试面 keys 9/apply 17/e2e 10/client 51/check:i18n 亲跑零偏差 + 增量算术 +34 独立
diff 复算证实 + providers 零改动亲证 + 12 commits 逐枚吻合 + 牙齿证明红签名在档。**审核
面外新登记 🟡×2（记录更正类，S10 T0 清偿）**：①「index.ts 注释同义两遍已收敛」声称与
实物不符（三处工件记已收敛/接力指令记待收敛，实物未收敛）②收官原子序列漏刷 progress
里程碑行括注（progress-M7:18 进行中未翻 ✅ + progress-M5:17 M7 镜像行 ⏳ 未来时态——
dont-do 第三条家族第五次）。

阶段 2 独立审核轮 1（2026-09-03，独立 Agent）：**NEEDS REVISION**（必改 ×1：波及面清单
三处实证遗漏——settings.test.ts:71 fetchChain 精确列表 T1 即红 / config.test:82-90 空配置
骨架注入形态 / entry.spec.tsx:117/:129 children 5→6 T4 红——+ T1 未点名 config anysearch
节四件制品；建议 ×5：T10 前置笔误 T9/信封 code 类型钉死 number+漂移安全方向/snippet 优先
级两形用例/controller.spec 默认链序明示/T3 机械面点名 MemberKey+导出块）。本 plan 为修订
版：必改 + 建议全数吸收。正本将随 T0 落
`docs/sessions/audit-logs/2026-09-03-s10-stage2-plan-review.md`（两轮全文）。

阶段 2 独立审核轮 2（同 Agent 点验）：**NEEDS REVISION**（残留必改 ×1：T3「语法校验循环
已泛化自动覆盖」与实物相反——index.ts:103 为显式数组字面量，不增 anysearch 即静默漏防
载入校验〔typecheck/既有测试零报错〕，修法 = 字面量增 resolved.anysearch + 语法红测试
变牙齿；点验 1-6/8 全闭合）。修订版：必改② + 观察 1/2（风险节措辞/命名统一
resolveAnysearchMemberOptions）已吸收。正本将随 T0 落
`docs/sessions/audit-logs/2026-09-03-s10-stage2-plan-review.md`（两轮全文）。

阶段 2 独立审核轮 3（同 Agent 残留点验）：**APPROVED**（必改②逐字落地闭合——语法循环
字面量增 resolved.anysearch + 语法红测试升格验收项；观察 1/2 到位；无阻塞残留；化妆级
观察：audit-log 转录按实际三轮写全文）。正本将随 T0 落
`docs/sessions/audit-logs/2026-09-03-s10-stage2-plan-review.md`（三轮全文）。

阶段 1 只读摸底实锚（2026-09-03 亲测，master@3059b36）：

- 成员模板：`src/providers/tavily.ts`（POST {base}/search + Bearer + 429 detail 追加 +
  content 缺省）——anysearch 差异点 = 信封（`{code, message, data, request_id?}`，
  code≠0 → 业务错误）+ 路径 `/v1/search` + `zone` 透传 + content→snippet 补映射
- 错误码：`src/errors.ts:27-63` MEMBER_ERROR_CODES 五家族对象——anysearch 家族并列追加
- 注册拓扑：`src/index.ts:187-217`（members 数组五项 + firecrawl 双面）——anysearch 追
  加为第 6 项（search 面单注册，无 fetch 面 v1）
- 默认序：`src/config.ts:12-18` BUILT_IN_MEMBER_ORDER 五成员——尾部追加 `dshws-anysearch`
- 池化底座：`src/index.ts:116-139` keyPool 工厂成员无关（memberKey 参数化）——anysearch
  一行接入自动享池化（S10 阶段 4/5 前瞻已核）
- client 镜像：`src/client/controller.ts:40-46` MEMBERS 五项 + SectionValue 成员节
  （:59-70 MemberSectionValue）——第 6 卡 = MEMBERS 追加 + anysearch 节
- 既有断言随行为更新点（**轮 1 必改①穷举补全**）：apply.test 注册拓扑两断言（search
  六件/fetch 两件不变）、config.test BUILT_IN 精确列表（:7-13）、**config.test:82-90
  空配置骨架（anysearch 节入骨架后 `extraApiKeyEnvs: []` 注入形态 T1 亲测留痕）**、
  **settings.test.ts:71 fetchChain BUILT_IN 精确列表（T1 即红）**、client controller.spec
  成员清单五→六 + **默认 searchChain 派生列表（:129-135，T4 同红）**、**entry.spec.tsx:117/:129
  children.length 5→6（T4 红——经真实 controller 渲染）**、loopback assemble MEMBERS 常量
  （场景成员 [tavily,exa,perplexity] 不受影响——anysearch 不入常规矩阵）
- schemastery：`z.union(['cn','intl'])` 对缺席字段不注入（S09 probe 实测）——zone 缺席
  = 不透传
- 真实 smoke 先例：tests/e2e.real/*.real.test.ts（env key 自跳 + default anchors 双 it）

## 范围决策（D1-D7，供阶段 2 审核判定层级）

| # | 决策 | 依据 |
|---|---|---|
| D1 | provider 形态（tavily.ts 模式 + 信封差异）：`POST {baseURL}/v1/search`，`Authorization: Bearer`，body `{query, max_results?, zone?}`（zone 仅配置时透传）；**信封分支**：HTTP ok 且 `code !== 0` → `httpError`（message 含信封 message + request_id）→ 这是 anysearch 特有的第五种失败形态（其余四成员无信封）；`data.results[]` → sources（url/title/**snippet 缺席回退 content**——补官方映射丢弃）；`redirect: 'error'`；abort/requestFailed/badResponse 语义同 tavily。`ANYSEARCH_DEFAULT_BASE_URL = 'https://api.anysearch.com'` | ADR-0009 Decision 1/2；探索 HTTP 规格亲证；tavily.ts 模式同构 |
| D2 | config anysearch 节：`{ enabled?, apiKeyEnv?='ANYSEARCH_API_KEY', baseURL?, zone?: 'cn'|'intl' }`——四件制品同步；`zone` launch-static 透传请求体（schema `z.union(['cn','intl'])`，缺席不注入 = 不透传）；resolved `AnysearchMemberConfig` = Required<Pick<enabled|apiKeyEnv>> + baseURL?/zone? + **池两字段必填**（extraApiKeyEnvs: string[] / keySelection: KeySelection——S09 惯例） | ADR-0009 Decision 3；成员四件制品惯例（S09 T1 形态）；schemastery union 缺席不注入实测 |
| D3 | `MEMBER_ERROR_CODES.anysearch` 五码族（credentialMissing/requestFailed/httpError/badResponse/aborted，`DSHWS_ANYSEARCH_*`）并列追加——errors.ts 家族对象模式原样 | ADR-0009 Decision 6；errors.ts:27-63 家族模式 |
| D4 | `BUILT_IN_MEMBER_ORDER` **尾部追加** `'dshws-anysearch'`（ADR-0009 Decision 4：不改前五位相对序；中立开箱语义不变——anysearch 未配 key 时 available()=false 链自动跳过）。**波及面穷举（轮 1 必改①）**：config.test BUILT_IN 精确列表 + 空配置骨架、settings.test.ts:71 fetchChain 列表、apply.test 注册拓扑、client controller.spec 成员清单 + 默认 searchChain 派生、entry.spec.tsx:117/:129 children 计数——全部随行为同棒更新（非豁免）；loopback 场景零波及（显式 searchChain + core.ts #isUsable skip 机制亲证） | ADR-0009 Decision 4；测试随行为惯例；轮 1 实测穷举 |
| D5 | client 第 6 卡：controller MEMBERS 追加 `{ key: 'anysearch', label: 'AnySearch', memberId: 'dshws-anysearch', defaultRef: 'ANYSEARCH_API_KEY' }`（brand label = locale-neutral 代码常量）；SectionValue/MemberSectionValue 加 anysearch 节；**零新 locale 键**（卡片全用既有键） | ADR-0009；S06 brand-label 惯例；S09 client 池面全泛化（#poolOf/MEMBERS 驱动） |
| D6 | 真实 API smoke：`tests/e2e.real/anysearch.real.test.ts`——`ANYSEARCH_API_KEY` env 自跳（describe.skip 模式）+ 真实搜索 sources 断言 + default anchors it（baseURL/常量）。用户有 key：self-skip 口径不变，**用户可择机 export key 跑真**（S13/M3 槽位同构不阻塞） | roadmap S10 WBS「真实 API smoke 自跳」；e2e.real 先例（tavily.real.ts:12-13） |
| D7 | 浏览器实测棒（scratch 3415，S06/S07/S09 D5 配方）：六卡渲染 + anysearch 卡 key 写 fake 值（`ANYSEARCH_API_KEY`）→ Configured 翻转 + unset 复原 + kill 精确（LISTEN 过滤）；3080 官方 anysearch 插件**不在 scratch**（共存语义由 ADR-0009 文档化 + dump 对照，非本棒浏览器面） | roadmap S10 验收「GUI 六卡渲染 + key 写通路」；user-paces 惯例 |

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 类别 | 前置 |
|---|---|---|---|---|
| T0 | 治理批（master 直提）：本 plan 落盘 + 阶段 0/2 audit-log 转录 + **🟡×2 清偿**（①index.ts 注释重复**实删**——非改词，删第二遍同义句；②progress-M7:18 里程碑行翻「🚧 S09 ✅ 余 S10/S11」+ progress-M5:17 M7 镜像行同步 + session-09 接力指令口径勘注以 plan/STATUS 为准不回改时点快照）+ STATUS 启动刷新（S10 🚧 行 + 位置块） | `git status` 前置 + 一 commit；index.ts 无同义重复句（grep 亲验）；progress 两行口径与 STATUS 一致 | 治理（机械豁免候选） | 阶段 2.5 批准 |
| T1 | errors 五码族 + BUILT_IN 追加 + **config.ts anysearch 节四件制品**（AnysearchSettings 接口 / schema 节含 `zone: z.union(['cn','intl'])` / AnysearchMemberConfig / resolveConfig 节 + ResolvedWebSearchConfig.anysearch 字段——轮 1 必改①点；池两字段必填沿 S09 惯例）；errors.test/config.test（含 settings.test fetchChain）断言更新与新增 | 先红（anysearch 家族缺失/新默认序断言/骨架注入形态）→ 绿；空配置骨架 anysearch 节注入形态亲测留痕（不入骨架需留豁免理由，不得静默） | TDD | T0 |
| T2 | `src/providers/anysearch.ts`：provider 本体 + resolveAnysearchMemberOptions（对称导出三件之一；命名成员键拼写一体惯例）；anysearch.test 单测（信封成功/**snippet 在先 content 回退两形**〔轮 1 建议 3：both-present 取 snippet 锁死优先级〕/信封 code≠0〔wire `code: number`，漂移字符串 fail-loud 安全方向注记〕/HTTP 429/断网 fetch failed/超时 abort/bad JSON/**未配置 zone 不入 body**/available 门） | 先红（模块缺失）→ 绿；红证据内嵌 commit；lint 0w0e 首查 Found 行 | TDD | T1 |
| T3 | node 接线：index.ts members 第 6 项 + pool + gates + 注册；**机械面点名（轮 1 建议 5 + 轮 2 必改②）**：MemberKey union 增 `'anysearch'`（index.ts:81）/公共导出块三件（ANYSEARCH_MEMBER_ID/resolveAnysearchMemberOptions——成员键拼写一体惯例）/公共 provider 类导出/**语法校验循环数组字面量增 `resolved.anysearch`（index.ts:103-105——非泛化点，不增即静默漏防载入校验）**；apply.test 注册拓扑断言更新（search 含 dshws-anysearch/可用性组合）+ anysearch pool 就绪行为 + **anysearch 池 ref 名出语法 → load 抛 TypeError 红测试**（沿 apply.test.ts:72-76/94-98 先例——把载入校验不变量从声称变牙齿） | 先红 → 绿；既有测试除拓扑断言外零漂移；语法红测试为验收项 | TDD | T2 |
| T4 | client 第 6 卡：controller MEMBERS/SectionValue + controller.spec 成员清单**与默认 searchChain 派生列表**更新 + anysearch 快照行为 + **entry.spec children 5→6 两处**（经真实 controller 渲染——轮 1 必改①点 3） | 先红 → 绿；#poolOf 泛化零改动验证（MEMBERS 驱动亲证） | TDD | T3 |
| T5 | e2e loopback 扩展：anysearch 信封成功场景（`/anysearch/v1/search` 信封 body → 链 servedBy） | 场景绿；信封 data.results 映射经真实 HTTP 验证 | 验证类（+牙齿探针可选） | T4 |
| T6 | 真实 API smoke（D6）：anysearch.real.test.ts | 无 key 自跳亲见；default anchors 断言 | 测试（自跳验证） | T2 |
| T7 | 浏览器实测棒（D7）：scratch `/tmp/dshws-s10/home` + 端口 3415 + boot `--no-open` + evaluate 合成点击；断言：六卡渲染/anysearch 卡 key 写 fake 值→Configured 翻转 + settings.yaml 落盘/unset 复原；kill 精确（LISTEN 过滤） | 断言全过逐项留痕（证据 commit）；3080/s05b-s09 现场零接触 | agent 实测棒（授权链沿 S06-S09） | T6 |
| T8 | 门墙 + 台账：七命令提交态亲跑 + progress-M7 批次表/门墙表（增量披露口径）+ Agent Note（docs/notes/2026-09-03-s10-anysearch-member.md：信封分支/共存语义/S12 素材） | 门墙数字亲见；基线 245 → 新基线（增量披露）；**增量重点 = src/providers 新文件** | 门墙+文档 | T7 |
| T9 | 阶段 4/5 独立验证（独立 Agent）：R1-R5 逐条对峙 + 门墙亲跑 + 隔离法证 + 三问 | PASS / COMPLETE；audit-log 正本落盘 | 强制独立 | T8 |
| T10 | 收尾：session 记录（三 ★ 节）+ STATUS/roadmap ✅ 原子收官（**progress 里程碑行括注含镜像行——dont-do 家族第五次教训动作化**）+ CHANGELOG + `--no-ff` 合入 + 接力指令 | 6 件套齐；M7 判定余 S11 | 收尾 | T9 |

## 验收条目（R1-R5，progress-M7 阶段验收逐条对应）

| # | 条目 | 对应 roadmap 验收 |
|---|---|---|
| R1 | anysearch 成员全链路：单测（信封成功/content→snippet/信封 code≠0/429/断网/超时/bad JSON/available）+ loopback 信封场景 + 默认序尾部追加 + 链降级/署名/排序语义不破坏（既有 e2e 零漂移） | 「成员全链路绿（链可含 dshws-anysearch 降级/署名/排序）」 |
| R2 | GUI 六卡 + key 写通路：jsdom 成员清单六项 + 浏览器六卡渲染 + anysearch 卡 fake 值写通路（翻转+落盘+复原） | 「GUI 六卡渲染 + key 写通路」 |
| R3 | 共存语义在档：ADR-0009 已立 + 本棒 Agent Note/记录载 3080 共存（id 不冲突/patch 层序）+ 真实 smoke 自跳亲见 | 「与 3080 anysearch 插件共存语义在档；真实 smoke 无 key 自跳」 |
| R4 | 门墙七命令（提交态）+ 增量披露：test 新基线/typecheck/lint 0w0e/build 增量（providers 新文件）/pack/check:i18n | 门墙纪律 |
| R5 | 五子证据：隔离（scratch 清单 + fake 值 unset 复原 + mtime 法证）/门墙/收尾件套/原子翻转/audit-log 三份 | 收官序列惯例 |

## 验证矩阵

| 验证 | 时点 | 责任 | 证据落点 |
|---|---|---|---|
| errors/config 红绿 | T1 | 主 Agent | commit message |
| provider 单测红绿 | T2 | 主 Agent | commit message |
| 接线/客户端红绿 | T3/T4 | 主 Agent | commit message |
| loopback 信封场景 | T5 | 主 Agent | commit |
| 真实 smoke 自跳 | T6 | 主 Agent | commit（skipped 亲见） |
| 浏览器六卡断言 | T7 | 主 Agent（D7 授权链） | 证据 commit + /tmp/dshws-s10/ 实物转录 |
| 门墙七命令（提交态） | T8 + T9 复验 | 主 Agent → 独立 Agent | progress-M7 门墙表 |
| R1-R5 对峙 + 隔离法证 + 三问 | T9 | 独立 Agent | audit-logs/…-s10-stage45-verification.md |
| STATUS/roadmap/progress/CHANGELOG 原子收官 | T10 | 主 Agent | 四件同序列 diff |

## 高危命令预告（阶段 2.5 披露）

1. `/tmp/dshws-s10/` scratch 自建（仓库外写入；s05b-s09 现场零接触）
2. 端口 3415 实例启停（boot `--no-open`；kill LISTEN 过滤）
3. scratch profile 内 `pnpm install`（deps file: tarball）
4. 浏览器自动化（anysearch 卡只写 **fake 值**且 unset 复原；真实 key 零接触）
5. `npm pack`（非 publish）
6. 不涉及：push/publish、删除、reset、凭据真实值、系统配置、治理产物删除、依赖变更

## 债务归属映射（正本）

| 债务 | 等级 | 归属 |
|---|---|---|
| 🟡 index.ts 注释同义两遍「已收敛」声称与实物不符（阶段 0 抓获） | 🟡 | **T0 实删清偿** + 记录口径统一 |
| 🟡 progress 里程碑行括注漏刷（阶段 0 抓获，dont-do 家族第五次） | 🟡 | **T0 清偿**（progress-M7:18 + progress-M5:17 镜像行） |
| L-2 / fetch 链排序 UI / 「恢复默认序」按钮 | 🟢 | 维持不排期 |
| firecrawl fetch 面 402/429 it 独立覆盖 | 🟢 观察 | 维持（S12 复核） |
| i18n CI 接线 | 🟢 观察 | S12 手册项 |
| tsdown 弃用 ×2 / vitest sourcemap / s06 mtime 口径 | 🟢 观察 | 维持 |
| 牙齿证明惯例沉淀 | 🟢 观察 | 维持无主（本棒 e2e 场景若设探针则续累证） |
| anysearch fetch 面（/v1/extract → dshws-anysearch-fetch） | 🟢 | 新登记：v1 不做（ADR-0009 Consequences 原文）；需要时按同模式追加 |
| v2 backlog：余额/积分看板 | 🟢 v2 | ADR-0008 缓议；未排期 |

## 风险

- **信封分支的测试盲区**：code≠0 且 HTTP 200 的形态为本棒特有——单测显式覆盖（信封
  code=1 固定用例），loopback 场景走成功信封即可（失败信封单测已断言）。
- **`zone` 透传的 schema 边界**：z.union 缺席不注入（S09 probe 实测）——resolved.zone
  缺席 = 请求体不带 zone 字段（非 null）；T2 单测断言「未配置 → body 无 zone 键」。
- **BUILT_IN 追加对既有 e2e 的影响**：assemble 场景显式 searchChain 三成员——anysearch
  不在链上，零影响；默认序断言（config.test/settings.test）随行为更新。
- **client 成员清单断言波及**：controller.spec 成员清单五→六 + anysearch 默认 ref——
  随 D4 同棒更新（机械，非行为漂移）。
