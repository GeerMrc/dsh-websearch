# Stage 2 计划审核 — S17（plan 017）

> 参数头：骨架库 v2（six-stage.md 阶段 2 提示词骨架，证伪优先）| 阶段 2 | Session 17 |
> 输入指针：plan 正本 docs/plans/2026-09-10-017-s17-p1-api-params-plan.md；roadmap ⏳ 行
> docs/session-roadmap.md:79（S17）。
> 相对骨架偏离说明：增列技术设计核证维度（维度 6——读 src/config.ts、src/index.ts、
> src/settings.ts、src/providers/*、src/client/*、scripts/check-locales.mjs 核对 D1-D7 机制主张）
> 与 check-locales 硬编码键数、websearch-row/preset-authoring/fetch-gate 影响面问询项。
> 执行方式：独立 spawn general-purpose Agent（与主 Agent 上下文隔离）；同 Agent 复审（合规：
> 同阶段复审续用不违反阶段间隔离）。

## 轮 1 输出原文（逐字）

审核完成。以下为独立审核结论。

---

# 计划审核结论：NEEDS REVISION

正本均已亲读：plan 017、roadmap:79（S17 行）、dont-do.md、pitfalls.md、STATUS.md、progress-M7；代码核证亲读 src/config.ts、src/index.ts、src/settings.ts、src/providers/{tavily,exa,perplexity,firecrawl,deepseek}.ts、src/client/{controller,locales,section,websearch-row}、scripts/check-locales.mjs，并亲跑 oxlint 与 check-locales。

## 必改（3 项）

**B1｜T2/T3 done 条件与 D4 直接矛盾，按字面不可满足**
- 证据：plan §2 T2 done「缺省场景 **wire 体零漂移断言在档**」（T3「同上」继承）；plan §1 D4「两处例外（有意行为变更）……Tavily `includeAnswer` 默认 **'basic'**：请求增……」。
- 事实：includeAnswer 缺省 'basic' 意味着**默认请求体必含 `include_answer: 'basic'`**，缺省 wire 体必然漂移；Exa `textFallback` 默认 true 同理必增 `contents.text`。「零漂移断言」与「有意漂移」不能同时成立，执行者无法按字面验收。
- 修法：T2/T3 done 改写为「既有字段零漂移 + 新增缺省字段按 D4 形态断言（include_answer:'basic' / contents.text.maxCharacters:1000）」。
- dont-do/pitfalls 命中：无直接条目（新问题家族：验收条目须可满足）。

**B2｜T8 需要 0.3.0 tarball，但版本 bump 归属 T9——次序矛盾**
- 证据：plan §2 T8「remove→add **换 0.3.0 tarball** 重启」；§2 T9「版本 0.3.0 bump（package.json + UA×6 + 断言×6）」；§5 风险预案「版本 bump 在 T9 **一次原子完成，不散改**」。
- 事实：T8 先于 T9 执行，届时 package.json 仍为 0.2.2（package.json:3 亲证），0.3.0 tarball 不存在。且风险预案自引 S12a「同版本 tarball 被 pnpm 跳过」坑——换版本号正是为避开它，堵死了「T8 用 0.2.2 重装」的出路。
- 修法：bump 前移为 T8 的前置步（或独立 T7.5），T9 只复验；同步改 §5 的「T9 原子完成」表述。
- 命中：无直接条目（任务依赖闭环缺陷，属审核维度 2 抓获）。

**B3｜Perplexity `finish_reason==='length'` → `truncated: true` 违反 seam 字段契约，GUI 文案将失实（D4 第三点 / T4）**
- 证据：plan §1 D4「把 `choices[0].finish_reason === 'length'` 映射为结果 `truncated: true`（一等截断信号）」。
- 代码核证（机制主张不成立）：`WebSearchResult.truncated` 的所有权契约 = "True when **the seam** dropped sources to honor `maxResults`"（node_modules/@deepseek-ai/dsh-web/lib/types/types.d.ts:29-38），由 seam 的 `capSources` 设置且 provider 值直接透传（deepseek-harness packages/web/web/src/index.ts:196-199）；上游官方 Perplexity provider 自身硬编码 `truncated: false`（packages/web/web-search-perplexity/src/provider.ts:81）——无先例。映射后：sources 完整、仅答案被腰斩时，GUI 渲染 `toolTruncated`＝「Results truncated / 结果已截断」（src/client/locales.ts:108、src/client/websearch-row.tsx:246）——用户与模型可见文案都在撒谎。
- 修法（任一）：改为 `content` 尾注截断提示；或保留映射但作为 2.5 决策点显式披露语义扩展 + 同步改 toolTruncated 双语文案。现表述「一等截断信号，现被丢弃」把契约违背包装成纯收益，不可按原样批准。
- 命中：无直接 dont-do 条目；精神上违反「Runtime invariants assert owned relationships」（借宿主仓规则标注）。

## 建议（4 项）

**A1｜D1 与 D2 的机制接缝未写明（T1 会被 T6 返工）**
D1 的热化公式是 `resolveXxxMemberOptions(live.current().xxx, thunk)`——只喂成员节；D2 的根级 `searchCountry`/`searchLanguage` 要进各成员 options，必须扩展解析签名（root + member 合成）。建议 T1 直接按双参形状设计。D1 其余主张核证**全部成立**：六个 provider 确实逐次读 `this.options.X`（tavily.ts:127-141 / exa.ts:133-149 / perplexity.ts:156-158 / firecrawl.ts:172-182 / deepseek.ts:210-218），Proxy getter 可行；链序 getter 先例 index.ts:247-271 行号属实；`LiveResolvedConfig.refresh()` 重跑 resolveConfig（settings.ts:59-61）属实。

**A2｜Perplexity `web_search_options` 嵌套合并点**
T4 的 `search_context_size` 与 T6 的 `user_location.country` 同栖一个 `web_search_options` 对象（perplexity.ts:155-159 现 flat body）。两任务各自往 body spread 该键会互相覆写。应在 T4/T6 注明单一构造点。

**A3｜D1 的「launch-static → Hot」改写清单不全**
D1 只列「baseURL/model/maxResults/numResults/maxTokens」+ config.ts/settings.ts JSDoc。遗漏：deepseek `maxUses`（config.ts:100-103 标 Launch-static）、anysearch `zone`（config.ts:170-171）、controller.ts 三处 launch-static 注释（:69-70、:101、:293-295、:321-325）、section.tsx:710-712 注释、以及各 provider 模块头 wire-contract JSDoc——tavily.ts:5-9 明言「`include_answer` stays off」,T2 后该句成谎言。建议并入 T2-T7 done 条件（「文档随码同改」）。另：`maxTokens` D5 说 1..128000，schema 先例只有 `.min(1)`（config.ts:239），应补 `.max(128000)`（GUI 钳制先例 controller.ts:328）。

**A4｜阶段 0 audit-log 悬空引用未标 🚧**
plan 头部引用「audit-log 2026-09-10-s17-stage0-review-of-16p0.md」为正本，亲证该文件**不在盘**（ls 无匹配；plan 文件本身也 untracked），T0 才入库。按本仓 dont-do「收官证据链/悬空引用」与 pitfalls「不要提前预写收官状态（悬空引用）」——**轻度复发**，引用处须标「🚧 T0 生成中」。

## 核证通过项（抽查证据）

- **14 参数完备性 ✓**：D5 表 4+3+3+2 成员级 + 2 根字段 = roadmap 14 口径；Firecrawl country 经全局入口有 D2 显式产品裁定；注意缺省不发送 = US 偏差修复为 opt-in（与 D4 零漂移自洽，GUI ⓘ 已安排）。
- **T0 四笔 🟡 全部实证为真**：亲跑 `oxlint` 恰 3 warnings 且与 T0④ 描述逐字吻合（index.ts:25 WebFetchProvider / takeover.spec.ts:1 `vi` / :20 参数）；progress-M7 无 web_fetch 行（grep 空）；15a/15b/15c/16-p0 session 记录缺（ls 证实，audit-log 有 s15a stage45 可作重构源）；STATUS 上一棒=14x 且 15c 行序在 16-p0 之后（STATUS.md:82 vs :81）。
- **UA 面 ✓**：6 处 `dsh-websearch/0.2.2` 实证；测试断言现仅 5 处（anysearch.test.ts 无）→ 🟢 缺口属实，T9 补第 6 处自洽。
- **check-locales 无硬编码键数断言**（审核问询项）：亲跑输出「54 keys, parity holds」——脚本只断言 parity、键数仅打印，**无需同步**，plan 也未误设依赖。
- **settings 节联动 ✓**：installSection 复用同一 `Config` schema（settings.ts:86），新字段自动可达 settings 读写路径，无遗漏面；client 侧 MemberSectionValue 对齐由 T7 覆盖。
- **z.union 先例 ✓**：config.ts:228/274 既有枚举用法。
- **loopback e2e 无需新场景 ✓**：亲证 loopback.test.ts 只 mock 响应、不断言请求体；Exa mock 带 highlights → textFallback 默认不破坏现有断言；Tavily mock 无 answer → answer→content 映射零影响。
- **websearch-row.tsx 不受影响 ✓**：泛化渲染 answer/truncated（:146-166、:246），Tavily answer 自动流入卡片；preset-authoring/fetch-gate 与搜索参数无交集。
- **R1-R8 ↔ roadmap 验收四要素一一对齐 ✓**；验证矩阵责任阶段/采信规则齐备。唯一措辞张力：T1 done「既有测试全绿」隐含阶段 3 全量跑，与「全量 `pnpm test` 只归阶段 4 唯一责任点」字面冲突（实质无冲突——阶段 4 拥有正本数字），建议 T1 改「受影响子集全绿」。

**总评**：调研正本（附录 A）、债务映射、治理闭环、参数完备性质量高，代码机制主张除 B3 外全部核证成立。B1/B2 是验收与次序的硬矛盾，B3 是契约错位设计，三项修订后可过。

---

## 轮 2（增量复审）输出原文（逐字）

# 增量复审结论：APPROVED

七项修订逐一对照正本核实，全部闭合；另抓到 1 项 B2 修订自身引入的低危指针残留（不阻塞，建议随 T0 入库 commit 顺手勘正）。

## 逐项闭合核验

| 项 | 修订位置（正本行号） | 核验 |
|---|---|---|
| B1 | T2 行（:64）：done 改「缺省 wire 体 = 既有字段零漂移 + `include_answer:'basic'` 在档」，内容列同步「新增缺省字段按 D4 形态断言〔include_answer:'basic' 恒在缺省体〕」；T3 行（:65）：「contents.text.maxCharacters:1000 在档」+ done「同上口径」 | 闭合。与 D4 两处有意漂移（:31-32）不再矛盾，断言目标可写、可红绿 |
| B2 | D7（:56）「bump 时点 = T8 前置步」；T8 行（:70）「前置步：版本 0.3.0 bump（package.json + UA×6 + 断言×6 + anysearch UA 断言〔🟢 清偿〕……原子完成于 T8 开头）」；§5（:109）「版本 bump 在 T8 前置步一次原子完成……T9 只复验，不散改」；T9（:71）相应降为「版本面复验」 | 闭合。三处同步到位，0.3.0 tarball 在 T8 换包时已存在，S12a 同版本跳过坑由新版本号避开；T9 复验保留证据链 |
| B3 | D4（:33）「`finish_reason === 'length'` **不映射** `truncated`」+ 归属理由（seam 所有权「the seam dropped sources to honor maxResults」/ 上游 provider 恒 false / GUI 文案失实）；T4 行（:66）「finish_reason 不映射 truncated（D4 改判）」，done 的「truncated 映射红→绿」已删，换为「web_search_options 嵌套形态断言红→绿」 | 闭合。全文无残留 truncated 映射主张（附录 A :130 保留的是 API 事实描述，正确）；「截断事实经 toolRaw 可观察」与 websearch-row 的 Inspect/raw 通道（locales.ts:109-110）相符 |
| A1 | D1（:19）「签名从 T1 起即按双参形状设计……build 同时喂成员节与根节……T6 不返工 T1」；T1（:63）「热化机制（D1，双参形状）……为 T6 全局字段预留」 | 闭合 |
| A2 | T4（:66）「`web_search_options` 对象**单一构造点**〔search_context_size 与 T6 的 user_location.country 同栖，集中一处构造防互相覆写〕」；T6（:68）「Perplexity user_location.country〔并入 T4 单一构造点〕」 | 闭合。两任务互相指认同一构造点 |
| A3 | D1（:19）文档改写全清单（config.ts 含 maxUses/zone、settings.ts:10-14、controller.ts :69-70/:293-295/:321-325、section.tsx:710-712、endpointNote 双语、各 provider 模块头 JSDoc 含 tavily.ts:5-9 句）+「文档随码同改，分入各成员任务 done 条件」；D5 maxTokens 行（:46）「schema `.step(1).min(1).max(128000)` 显式带上限」 | 闭合。T2 已示范并入（模块头 JSDoc 更新入内容列）；exa.ts:7-9 等其余模块头由 D1 通则覆盖 |
| A4 | 头部（:5）「audit-log 2026-09-10-s17-stage0-review-of-16p0.md〔🚧 T0 生成中〕」；T1 done（:63）「受影响子集全绿（全量归阶段 4）」 | 闭合。悬空引用已标 🚧；与验证矩阵「全量归阶段 4」措辞一致 |

## 残留问题（低危，建议随 T0 plan 入库 commit 一并勘正）

**R-res-1｜anysearch UA 🟢 的处置指针未随 B2 搬家（3 处）**：任务面已把「anysearch UA 断言〔🟢 清偿〕」前移进 T8 前置步（:70），但——
- 头部（:4）仍写「🟢×2 → **T9** 处置」（其一已归 T8）；
- 债务映射表（:98）「anysearch UA 断言缺口……**T9 顺手补**」；
- R5 证据形态（:119）「**T0/T9** commits + 复验」——该 🟢 的清偿 commit 将落在 T8，按 R5 字面取证会扑空。

不构成阻塞：T8 执行、T9 复验两节各自仍可满足，纯归属指针错位。但这正是本仓治理史反复烧 🟡 的「指针未随搬家刷新」家族（dont-do 收官序列条），应在 plan 落盘前改齐三格。

**R-res-2（cosmetic）**：D1 双参伪签名 `root.live…` 记法松散（易读成第二个 live 实例）；T1 的「同时取 `live.current().xxx` 成员节与根节」已消歧，可不改。另 D1 清单漏列 controller.ts:101（MemberSnapshot baseURL 的 launch-static 注释）——同文件同 grep 可达，D1 通则已覆盖，记录在案即可。

## 结论

七项必改/建议全部闭合，无新增不可执行项。R-res-1 属三格指针勘正，建议并入 T0 的 plan 入库 commit；勘正后即可进入执行。**APPROVED**。

---

## 处置记录（主 Agent）

- B1/B2/B3 + A1-A4 修订后 plan 已更新；R-res-1 三格指针勘正已随 T0 落盘前完成（头部 🟢 指针 / 债务映射表 / R5 证据形态 → T8）；R-res-2 记录在案不改。
- 阶段 2.5：AskUserQuestion 三问（计划批准 / D4 默认值 / Perplexity 日落排期）未获答 → 按项目先例（S09/S10/S13/S14 问询未获答取默认）自主推进，默认 = 批准 / 默认开 / S18 插行（Perplexity Agent API 迁移棒）；披露双落于 session-17 记录与收官汇报。
