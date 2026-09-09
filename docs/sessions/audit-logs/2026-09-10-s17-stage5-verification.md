# Stage 5 交叉验证 — S17（安全/契约/前瞻三正交 + 用户路径冒烟）

> 参数头：骨架库 v2（six-stage.md 阶段 5 提示词骨架）| 阶段 5 | Session 17 |
> 输入指针：同阶段 4（plan 正本 + commit 范围 `6dfd80c..b8ef6aa` + 测试/静态命令）。
> 相对骨架偏离说明：验证数字采信阶段 4 亲跑记载（全量 399|13(412) exit0 / tc 0 / lint 0w0e 57f /
> i18n 96 keys / build 三件 / 探针 A/B）；冒烟以三腿子集（loopback / apply / config）替代 GUI
> 旅程（T8 已由主 Agent 完成）。
> 执行方式：独立 spawn general-purpose Agent（与主 Agent 及阶段 4 Agent 上下文均隔离）。

## 输出原文（逐字）

三腿冒烟全绿。全部验证面已闭合，输出交叉验证报告。

---

# S17-P1 独立交叉验证报告（阶段 5 — 安全/契约/前瞻三正交 + 用户路径冒烟）

验证对象：plan 正本 `docs/plans/2026-09-10-017-s17-p1-api-params-plan.md` × commit 范围 `6dfd80c..b8ef6aa`（feat/s17-p1-params，10 commits 亲核：9264402 T0 → b8ef6aa T9，merge-base = master HEAD 6dfd80c，干净分叉，工作树 clean）。阶段 4 数字（全量 399|13(412) exit0 / tc 0 / lint 0w0e 57f / i18n 96 keys / build 三件 / 探针 A/B 有牙含复绿）按指令采信，未重跑。

## 结论：COMPLETE

实施面 14 参数全链路 + 热化机制完整且与 plan/ADR 自洽；无 🔴/🟡 级新债。T11 收官待办（5 项）全部在案无遗漏面扩大，另补 1 项需收官核对（阶段 4 audit-log 落盘）+ 3 项 🟢 观察。可以推进 T11。

## 冒烟（亲跑，可复述序列）

1. `export PATH=~/.nvm/versions/node/v22.23.2/bin:$PATH; cd /Volumes/IPFSJK/Zcode/dsh-websearch; pnpm vitest run tests/e2e/loopback.test.ts` → **15 passed (15), exit0**
2. `pnpm vitest run tests/apply.test.ts`（T1 热通路用户路径：settings commit → 下一次搜索读到新值）→ **28 passed (28), exit0**
3. 补充腿：`pnpm vitest run tests/config.test.ts`（比 loopback 更贴近 S17 主流程——新字段 schema + resolveConfig 归一/'' 哨兵/缺省零漂移）→ **29 passed (29), exit0**

三腿各次实测输出、逐腿见绿（非算术外推），合计 72。

## 安全维度

- **注入/凭据暴露面：无。** 四家 provider wire 均为 `JSON.stringify({...})` body 构造（tavily.ts:171 / exa.ts:186 / perplexity.ts:186 / firecrawl.ts:190,216），free-text 值（location/startPublishedDate/searchCountry/searchLanguage）经 JSON 序列化天然转义，无 URL query 拼接、无 header 注入路径。API key 经 Authorization header 由 thunk 逐次解析，不进 body；key draw 日志仅尾 4 字符（src/index.ts:216）。
- **Proxy 热化机制（node 亲跑实证）**：`Symbol.toPrimitive`/`Symbol.toStringTag` 经 get trap 委托 `build()` 返回 undefined/正常值，`String(proxy)`/模板串得 `[object Object]`——无崩溃、无泄漏、无原型污染（get-only trap 无写路径）。**但语义与普通对象不等价（亲证）**：`JSON.stringify(proxy)` = `{}`、spread = `{}`、`Object.keys` = `[]`、`in` = `false`，全部**静默**退化。src 全量 grep 证实消费面仅六 provider 逐字段读（`this.options.X`），无一处 stringify/spread/keys/in 消费 hot options——当前零踩坑；枚举面（ownKeys/getOwnPropertyDescriptor 未转发到 target 空对象）反而封死了越权枚举 options 字段的路径。
- **'' 清除哨兵：无绕过路径。** '' 是 Config schema 枚举显式合法值（`z.union(['', ...])`，config.ts:335-337,345,365-366）；settings commit 经 attachSettingsSection 传入的同一 schema（settings.ts:87，dsh-settings installSection 契约接收 `schema: z<T>`）；resolveConfig 将 '' 归一 undefined（不发送）；GUI setter trim 后写（controller.ts:390,398）。根字段无 ISO 码表校验属**有意设计且已在 ADR-0015 Consequences 显式披露**（错误码值由 API 4xx 拒 + 既有降级链 fail-loud），非未消化缺口。

## 契约维度

- **三签名向后兼容：零破坏。** 四家（tavily/exa/perplexity/firecrawl）新增第三参 `geo?: UnifiedSearchGeo` 可选，anysearch/deepseek 维持两参；lib/index.d.ts 签名亲证（:595,635,675,709），现有调用方/测试不传 geo 不受影响。
- **导出面：弱观察（🟢）。** `UnifiedSearchGeo`、`ExaSearchType`、各 `XxxMemberOptions` 已 bundle 进 lib/index.d.ts（签名可见、`Parameters<typeof resolveExaMemberOptions>[2]` 结构化引用可行），但均**不在 src/index.ts 与 d.ts 的 export 列表**——下游无法按名 `import type { UnifiedSearchGeo }`。与 0.2.x 既有口径一致（XxxMemberOptions 原本就不导出），非本次回归；建议后续棒顺手补 re-export。
- **peer 依赖面零变更：证实。** package.json diff 仅 `0.2.2 → 0.3.0` 一行。

## 前瞻维度

- **roadmap「Firecrawl 3 参数」口径差：已由 ADR-0015 消化**（Decision 4：「country 修 US 偏差由全局入口承担，成员级只增 tbs/location」）。但 **plan 017 D2 正文（:21）仍写「Tavily country（仅 topic=general…GUI ⓘ 注明）+ language」，与实现（Tavily v1 只接 language）冲突**——改判正本在 ADR-0015 Decision 3（国名字符串 vs ISO 码不兼容，tavily.ts:81-84/config.ts:285-287 一致），plan 正本未回写勘注。ADR 晚于 plan 落盘且 origin 注明来源，治理上可接受（🟢：T11 可加一行勘注或维持 ADR 单源）。
- **Perplexity 日落 S18 插行：在档**（session-roadmap.md:80，含 2026-09-27 + 参数迁移映射 + 验收标准；STATUS 活跃债务 🟡 在档；plan D6/债务映射在档）。
- **旧配置零迁移：证实。** 全部新字段 optional + resolveConfig 缺省（'' → undefined，省略 → 不发送/API 默认），无必填新键；D4 两处有意行为变更（Tavily include_answer:'basic' 恒发、Exa contents.text 同请求）已披露。
- **Proxy 语义陷阱（🟢 前瞻债）**：hotMemberOptions JSDoc（index.ts:112-122）已说明「hold by reference, read fields per call」，但未警示 stringify/spread/keys/in 静默退化——未来维护者加一行 `console.log(this.options)` 或 `{...this.options}` 得 `{}` 且 TS 不报错。建议补 JSDoc 警示句（T11 顺手或后续棒）。

## T11 待办核验（阶段 4 清单 5 项 vs 实物）

| 项 | 实物核验 |
|---|---|
| CHANGELOG | 无 S17/0.3.0 条目（grep 证实，最新 = S16-P0）——待办在案。注意 T9 done 条件「评估结论落 CHANGELOG」实际只落了台账/Agent Note，**收官 CHANGELOG 条目须含 web_fetch 恢复路径评估结论**（非新增遗漏，属 T11 该项组成部分） |
| 台账指针 | STATUS 17 行关键交付列现指向 plan，收官须改指 session-17 记录——在案 |
| session 记录红绿数字 | session-17.md 仍执行期骨架（T0 起省略号、「执行中」占位）——在案 |
| 收官刷新 + merge | roadmap S17 🚧 / STATUS 位置块「启动刷新」态 / 分支未 merge——在案；master HEAD = merge-base，无竞态 |
| ADR 笔误 | **实证命中**：adr-0015 第 30 行 `user_search_options` 应为 `web_search_options`（provider/plan/实现均后者） |
| **补充（本验证新增）** | **阶段 4 audit-log 未落盘**——docs/sessions/audit-logs/ 止于 `2026-09-10-s17-stage2-plan-review.md`，无 s17-stage4 文件；plan T10 要求「audit-log 正本两份」。写 ✅ 前两份均须逐一 `ls` 在档（dont-do「收官证据链」条目直接约束） |

T8 浏览器证据 `/tmp/dshws-s17/` 在档 4 件（boot log / 2 截图 / 复原 settings.yaml）。

## dont-do / pitfalls 对照

本次发现**不新增** dont-do 条目（无系统性踩坑，准入门槛不满足）。既有条目命中：T11 收官适用 dont-do「收官序列漏刷新状态区」（五处原子：STATUS 台账行+位置块/roadmap 同行/progress T 行/CHANGELOG）与「声称完成而核心工件未落盘」（两份 audit-log ls 亲证后写 ✅）；阶段 4 数字采信亲跑记载符合 pitfalls「已验锚点引用台账/不重验」与「不跨载体誊写」；本报告冒烟 72 为三腿各自实测输出，不违「算术外推」条。

## 必须继续的相关任务（无新增阻塞债）

仅 T11 收官序（原计划内）：①session-17 记录补全（含各 T 红绿数字）②STATUS/roadmap/progress/CHANGELOG 原子收官（CHANGELOG 含 0.3.0 条目 + web_fetch 评估结论 + 诚实标注面）③阶段 4/5 两份 audit-log 落盘核对④merge --no-ff → master⑤ADR-0015 笔误一行勘正⑥（可选 🟢）plan D2 Tavily country 勘注 + hotMemberOptions JSDoc stringify/spread 警示 + 新类型 re-export。

---

## 处置记录（主 Agent，T11）

- ⑤ ADR 笔误已勘正（web_search_options）；⑥ plan D2 勘注已加、hotMemberOptions JSDoc 警示句已补、台账「Note §5」指针已勘正为「本行 + CHANGELOG S17 条目」；新类型 re-export 维持 0.2.x 口径不动（🟢 入台账，归后续棒）。
- ③ 本文件 + stage4 文件即两份 audit-log 落盘。
