# Plan 018 — S18 Perplexity Agent API 迁移（Sonar 日落应对）

> 任务源：docs/session-roadmap.md:80（S18 ⏳ 行，S17 阶段 1 调研发现插行 + 2.5 默认批准）。
> 阶段 0 gate：PASS（🔴×0；🟡×2——①**凭据池无 PERPLEXITY_API_KEY**：真实 API 验收腿的前提风险，
> 2.5 决策点请示用户；②Sonar 日落本身=本棒主体；🟢×3 维持；正本 = 本 session 记录
> 「前序 Session 审核确认」节 + audit-log 2026-09-10-s18-stage0-review-of-s17.md〔🚧 T0 生成中〕）。
> API 契约正本：附录 A（独立调研 Agent，2026-09-10，docs.perplexity.ai 现行版，出处逐项在档）。

## 0. 范围与不做

**做**：`dshws-perplexity` 成员 wire 从 Sonar `/chat/completions` 迁移到 Agent API `POST /v1/agent`（responses 形态）；请求/响应形状按附录 A；**config/GUI/locale 零改动**（S17 已按同名可迁移形态设计——验收条目「config 面零改动验证」）；ADR-0016 落档；0.3.1 发版。

**不做**：streaming/background/多轮（previous_response_id）/其他工具类型（fetch_url/finance_search 等）——seam 是单轮搜索；Sonar 旧端点不留开关（2026-09-27 后死端点无价值，一刀切）；模型 preset 面不暴露（model 字段直传+前缀归一）。

## 1. 设计决策（D1-D4）

**D1 请求迁移**（perplexity.ts search()）：
- 端点：`${baseURL}/v1/agent`（原 `/chat/completions`）
- body：`{ model: <归一后>, input: request.query, max_output_tokens: this.options.maxTokens, tools: [webSearchTool], ...language_preference? }`
- **webSearchTool 恒包含**（Agent API web_search 是 opt-in——不加=纯参数记忆作答，搜索语义丢失）：单一构造点 `{ type: 'web_search', ...searchContextSize?, ...user_location?{country}, ...filters?{search_recency_filter} }`（recency 在 filters 内、contextSize/user_location 在工具顶层——与 S17 的嵌套结构同名换位）
- **模型名前缀归一**：Agent API 要求 `provider/model` 格式（`perplexity/sonar`）；存量 config `model: 'sonar'`/`'sonar-pro'` 保持可用——provider 侧归一 `model.includes('/') ? model : 'perplexity/' + model`（config 常量与默认值不动，零改动承诺兑现）
- `max_output_tokens` 改名自 max_tokens（缺省仍显式 1024）；`language_preference` 位置不变（顶层）

**D2 响应迁移**（mapPerplexityResponse 重写 + wire 类型更新）：
- **content**：`output[]` 中 `type:'message'` 的 item → 其 content parts 的 `text` 拼接（tolerant：string 直收）
- **sources**：优先 `output[]` 中 `type:'search_results'` 的 item → `results[]`（`{id,url,title,snippet,date?,last_updated?}`——结构化来源比旧 citations 更丰富）→ 同 S17 容忍映射（url 必需，空白省略，date→publishedAt）
- 回退链：message content 的 `annotations[]`（`url_citation`→{url,title}）→ 旧 `citations` string[]（tolerant 兜底，新 API 大概率无）
- `truncated` 恒 false 维持（S17 阶段 2 B3 裁定：seam 所有权）；响应/输出 `status:'incomplete'` 不映射（同 B3 口径，raw 可观察）

**D3 config 零改动**：config.ts/schema/GUI/locales 不动（验收条目）；唯一新增文档 = ADR-0016（端点切换 + 前缀归一 + web_search 恒含 + sources 来源链 + 截断口径延续 B3；另有 ADR-0015:30 与 roadmap 验收措辞勘注，见 T3）。

**D4 版本与实测**：0.3.0→**0.3.1**（wire 修复，用户透明）+ UA×6 + 断言×6（S16 P0 坑例律）；3423 换包冒烟（boot + 插件加载 + 非 perplexity 成员实搜证明链健康）；**真实 Perplexity 实测受凭据池限制**（无 key → e2e.real 自跳 + 如实披露；2.5 请示：补 key 或降级口径）。

## 2. 任务清单（T 编号；每任务 red→green→commit 闭环，串行）

| 任务 | 内容 | done 条件 |
|---|---|---|
| T0 | 治理批：分支 `feat/s18-perplexity-agent-api` + plan 018 + 阶段 0 audit-log 入库 + STATUS 启动刷新（S18 🚧 行 + 位置块）+ session-18 骨架（三★节） | 工件在档；STATUS 与 roadmap 口径一致 |
| T1 | 请求面迁移（D1）：端点/input/max_output_tokens/tools 恒含 web_search（filters 内 recency + 工具顶层 contextSize/user_location）+ 模型前缀归一 + **注释改写面**（模块头 JSDoc :1-44 / PERPLEXITY_DEFAULT_BASE_URL 注释 / options.baseURL 注释——旧端点句全数退役）+ wire 测试重写（缺省体 tools 恒在、旧字段全消）+ **loopback URL 面适配**（mock 键与 arrival 断言共 7 处行号 :97/:172/:185/:200/:211/:223/:261 → `/perplexity/v1/agent`；mock 响应体暂留旧形状——T1 不动 mapper，旧 mapper 读旧形状照常绿，commit 闭环） | 新 wire 断言红（现况 /chat/completions 证红）→ 绿；loopback 全绿；既有失败形态测试零漂移 |
| T2 | 响应面迁移（D2）：output message→content、search_results→sources、annotations/citations 回退链 + **loopback 响应夹具换新形状**（:172-173/:200-201 等成功体 → Agent responses 形状） | 新映射断言红 → 绿；loopback 全绿 |
| T3 | ADR-0016 落档（D1-D2 决策 + B3 截断口径延续 + web_search opt-in 恒含理由）+ **ADR-0015:30 勘注**（Perplexity user_location 自 S18 起在 web_search 工具顶层，非 web_search_options——language_preference 顶层不变无涉）+ **roadmap S18 验收措辞勘注**（若 2.5 采纳降级口径：「真实 API 实测」→「凭据可用面实测 + 无 key 自跳披露」） | 两 ADR 在档且口径一致；roadmap 措辞与裁定一致 |
| T4 | 版本 0.3.1 + UA×6 + 断言×6 + 3423 换包冒烟（boot + firecrawl 成员实搜——入口 `FIRECRAWL_API_KEY=<scratch 池> npx vitest run tests/e2e.real/firecrawl.real.test.ts`） | 版本面在档；3423 boot log + 实搜数字归档 /tmp/dshws-s18/ |
| T5 | 门墙静态六件 + perplexity.real 按 diff 判定（anchors 常量与 live 断言不涉 wire 形态，预期零改动——零改动则披露，不为改而改） | tc/lint/build/pack/i18n/status 全绿亲跑 |
| T6 | 阶段 4/5 独立验证（4=全量唯一责任点 + R 条目对峙；5=三正交 + 冒烟采信） | audit-log 正本两份 |
| T7 | 收尾 6 件套 + 原子收官（CHANGELOG/STATUS/roadmap/progress）+ merge `--no-ff` + 接力指令 | 六件套齐 + 实物 ls 核对 |

## 3. 验证矩阵

| 验证面 | 触发时机 | 责任阶段 | 采信规则 |
|---|---|---|---|
| perplexity wire/映射单测 | T1/T2 任务绿证 | 阶段 3 | 亲跑 1 次/任务，红→绿数字入 session 记录 |
| loopback 回归（URL 腿 / 形状腿） | T1 绿证（URL）+ T2 绿证（形状） | 阶段 3 | 各亲跑 1 次 |
| 门墙静态六件 | T5 提交态 | 阶段 3 | 亲跑 exit code |
| 全量 `pnpm test` | 阶段 4 唯一责任点 | 阶段 4 | 亲跑 1 次，数字为正本 |
| 3423 冒烟（boot + firecrawl 实搜） | T4 | 阶段 3 | log/数字归档 |
| 真实 Perplexity 实测 | 视 2.5 裁定 | — | 有 key=实跑；无 key=自跳 + 如实披露 |

## 4. 债务映射

| 债务 | 等级 | 处置 |
|---|---|---|
| 凭据池无 PERPLEXITY_API_KEY（阶段 0 🟡-1） | 🟡 | 2.5 请示：用户补 key（→真实验收闭合）或降级口径（wire 级 + 自跳披露） |
| Sonar 日落 | 🟡 | 本棒主体（迁移即清偿） |
| S17 遗留 🟢 池（re-export/真实实测缩面等） | 🟢 | 维持归属不变 |

## 5. 风险预案

- **Agent API 文档与实行为偏差**（responses 形态较新、finish 信号未记载）：映射按 tolerant 读取（optional 字段宽容），未知形状走既有 badResponse fail-loud；有 key 后实测校正。
- **loopback 夹具换新形状**：T2 必改（mock 必涉 perplexity 旧形状——URL 键与 arrival 断言共 7 处行号 :97/:172/:185/:200/:211/:223/:261，见任务表 T1/T2 拆分）。
- **模型前缀归一边界**：用户已写 `perplexity/sonar` 直传不二次加前缀；非 perplexity 前缀（如 anthropic/*）也直传——归一只补缺前缀者。
- **UA/断言六处联动**：T4 一次原子完成（S17 T8 先例）。

## 6. 验收条目（R1-R5，对 roadmap 验收）

| R | 条目 | 证据形态 |
|---|---|---|
| R1 | wire 迁移完整（端点/input/max_output_tokens/tools/language_preference + 前缀归一） | T1 红→绿数字 + wire 断言在档 |
| R2 | 响应映射（message→content / search_results→sources / 回退链） | T2 红→绿数字 |
| R3 | **config 面零改动验证** | `git diff c8799bd..feat/s18-perplexity-agent-api -- src/config.ts src/client/` 零输出亲证（schema 在 config.ts、GUI/locales 在 src/client/——该命令即严谨闭合；阶段 4 核） |
| R4 | 全量门墙 exit0 | 阶段 4 亲跑数字 |
| R5 | 真实 API 实测 | 2.5 裁定口径下闭合（实跑或如实披露）+ 3423 冒烟 |

## 附录 A — Agent API 线缆契约正本（2026-09-10 独立调研，出处 URL 在调研报告随 audit-log 入档）

**端点** `POST /v1/agent`（Bearer 同 key 域）；`/chat/completions` 官方支持至 **2026-09-27**（overview 横幅原文）。
**请求**：`input`（string 或 InputItem[]）必填；`model` 需 `provider/model` 格式（`perplexity/sonar`）或 preset（sonar→fast/sonar-pro→low/sonar-reasoning-pro→medium/sonar-deep-research→high）；`max_output_tokens` 改名（仅 anthropic/* 必填）；`instructions`/`stream`(默认 false)/`language_preference`(顶层, ISO 639-1)。
**web_search 工具**（opt-in）：`tools:[{type:'web_search', filters:{search_recency_filter(5 值同 S17)}, search_context_size, max_results(1-50), max_tokens, user_location:{city,country,...}}]`——recency 在 **filters 内**，contextSize/user_location 在**工具顶层**。
**drop 清单**：search_language_filter（无等价物；本插件未用）/return_images/return_videos/stream_mode:full/return_related_questions。
**响应**：`{id, object:'response', created_at, status(completed|incomplete|failed|…), model, output[], usage{input,output,total_tokens}}`；`output` 为完整 trace——`type:'message'`（答案文本，content parts 带 `annotations:url_citation`）+ `type:'search_results'`（`{queries, results:[{id,url,title,snippet,date?,last_updated?,source}]}`）；无 finish_reason/truncation 字段（status:'incomplete' 为唯一截断信号）。
