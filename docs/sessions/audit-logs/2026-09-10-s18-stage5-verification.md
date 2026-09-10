# Stage 5 交叉验证 — S18（安全/契约/前瞻三正交 + 冒烟）

> 参数头：骨架库 v2（six-stage.md 阶段 5 提示词骨架）| 阶段 5 | Session 18 |
> 输入指针：同阶段 4（plan 正本 + commit 范围 `c8799bd..035285d` + 测试/静态命令）。
> 相对骨架偏离说明：验证数字采信阶段 4 亲跑记载（全量 401|13(414) exit0 / tc 0 / lint 0w0e 57f /
> i18n 96 keys / R3 零输出 / 探针真红真绿）；冒烟以 loopback+perplexity 子集替代。
> 执行方式：独立 spawn general-purpose Agent（与主 Agent 及阶段 4 Agent 上下文均隔离）。

## 输出原文（逐字）

**结论：COMPLETE**（5 commits 复核一致；三正交追问无阻断项；冒烟复绿）

**冒烟（亲跑，可复述）**：`pnpm vitest run tests/e2e/loopback.test.ts tests/providers/perplexity.test.ts` → 2 files / **36 passed**（loopback 15 + perplexity 21），423ms，exit 0。loopback 全部 7 处 arrival 断言已指 `/perplexity/v1/agent`，成功夹具为新 responses 形状（`output[]` 含 `search_results`+`message`）。

**安全维度**
1. 请求体面：query 与 model 均只进 `body: JSON.stringify(...)`，headers 固定四键（authorization/content-type/accept/user-agent），URL 只拼 `${baseURL}/v1/agent`——**无 header/URL 注入面**；`redirect: 'error'` 维持。
2. 模型前缀归一：`model.includes('/')` 只补缺前缀者；恶意/错误 model 最坏路径 = API 4xx → fail-loud，无转义放大面。GUI/config 是信任边界内输入，符合「Trust TypeScript at typed same-process boundaries」。
3. annotations 回退链对畸形输出容忍良好：`url_citation` 过滤要求 type 匹配且 url 非空；`search_results` 条目无 url 被 `mapPerplexityResult` 丢弃；空 annotations → undefined → 落 citations 兜底；未知 output item 类型 read past。未发现崩溃路径。

**契约维度**
1. 导出面：`PerplexityResponse` 删除 `choices`/`search_results`、新增 `output`；`PerplexityOutputItem` 新导出类型。但 `src/index.ts:80-82` 只 re-export `PerplexitySearchProvider`/`resolvePerplexityMemberOptions`——wire 类型非公共 API 面，仓库内消费者仅 `tests/providers/perplexity.test.ts`，无外部破坏。
2. config 零改动亲证：`git diff c8799bd..035285d --stat -- src/config.ts src/client/` 零输出（R3 成立）。
3. 热通路：`hotMemberOptions` 是 per-property Proxy（src/index.ts:126-130），每次 `search()` 读 `this.options.model` 时重新 `live.current()` → 前缀归一在 wire 时逐次执行——**热改 model/参数 T1 后仍生效**，机制无关 perplexity；apply.test 热通路按机制覆盖（exa/country/timeout/disable 腿），perplexity 无专腿但同包装器，可接受。
4. ADR-0016 在档且与 plan 附录 A、代码实现三向一致（端点/恒含工具/前缀归一/来源链/B3 截断口径/amends ADR-0015）；ADR-0015:30 勘注与 roadmap S18 验收措辞勘注均已落地。

**前瞻维度**
1. Sonar 日落债务：roadmap S18 行（:80）🚧，T7 收官翻 ✅ 即清偿——台账处置路径明确，无悬挂。
2. 时间余量：今日 09-10，日落 09-27，17 天余量，且旧端点当前仍活（窗口内 revert 单 commit 面可行）。
3. 补 key 闭合路径清晰：`tests/e2e.real/perplexity.real.test.ts` 断言是 wire 无关的（sources url 正则 + content 非空），`maybe()` 自跳/启用机制就绪——补 `PERPLEXITY_API_KEY` 后 `vitest run tests/e2e.real/perplexity.real.test.ts` 直接闭合，无需改测试。
4. 3423 冒烟工件在档（/tmp/dshws-s18/boot-3423.log + firecrawl-real-proof.txt）。

**次要观察（非阻断，不计入不完整清单）**
- 旧 `citations` 兜底 `url => ({url})` 不做空白校验——**S17 前遗留行为原样保留**，非本次回归。
- `search_results` item 存在但条目全无 url 时 sources=[] 且不再落 annotations 兜底（设计为「item 缺席才兜底」）——边界语义可辩护，如遇真实 API 出现该形态可在补 key 实测时裁定。
- 字段空白判定微不对称：snippet 用 `.trim().length`、title/publishedAt 用 `.length`（title 空格串会过）——装饰级，不影响行为正确性。
- `status:'incomplete'` 不映射 truncated：B3 口径延续，ADR 已载明理由，非债务。

**dont-do/pitfalls 命中检查**：docs/dont-do.md 与 pitfalls.md 均无 S18/perplexity 相关条目；实现未见「为改而改」「静默吞错」「硬编码 tunable」等既有坑例命中。
