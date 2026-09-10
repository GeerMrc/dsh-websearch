# Stage 5 交叉验证 — S19（安全/契约/前瞻三正交 + 冒烟）

> 参数头：骨架库 v2（six-stage.md 阶段 5 骨架）| 阶段 5 | Session 19 | 输入指针：同阶段 4。
> 相对骨架偏离说明：验证数字采信阶段 4 亲跑记载（全量 377|11(388) exit0 / tc 0 / lint 0w0e 54f /
> i18n 92 keys / R1 逐行分类 / 探针双红绿 / 3423 pid 22026 + /tmp/dshws-s19/）；冒烟 = loopback+apply+client 子集。
> 执行方式：独立 spawn（与主 Agent 及阶段 4 Agent 上下文均隔离）。

## 输出原文（逐字）

**结论：COMPLETE**（三正交 + 冒烟通过；4 条前瞻性待办/低危观察，均不阻断收官，列后供 T7 收官清单核对）

## 冒烟（亲跑）

`pnpm vitest run tests/e2e/loopback.test.ts tests/apply.test.ts tests/client` = **7 files / 149 passed / 149，exit0**，与阶段 4 记载无矛盾。

## 安全维度：通过

- **伪造值滥用面**：`fallbackMember` 输入由 schemastery `z.union` 7 值字面量闭集把守（src/config.ts:288），'dshws-perplexity' 之外任何死 id（如 'dshws-fetch-search'）在加载即被拒，**到不了** resolveConfig/controller 的归一点——归一点只对单一已知 legacy 值做 `=== 'dshws-perplexity'` 判等，无通配/前缀面。`withDesignatedFallback`（config.ts:74-80）签名收窄 `FallbackMember`，静态面无法传入死值。
- **searchChain 死 id**：resolveConfig 静态 span 只剥 deepseek/fetch-search，残留 'dshws-perplexity' 会留在 resolved.searchChain，但 `ChainMemberResolver.resolve(): ChainMember | undefined`（src/chain/core.ts:35）运行时未注册即 undefined 跳过——「既有跳过语义」亲证成立。
- **残尸 `perplexity:` 节**：schema 节已删，未知键静默透传（阶段 0 探针）；section 读路径只读已知字段，GUI 不回显该节，无信息泄漏面。写入面为部分字段 merge，不会意外把未知键写回。
- **GUI 存量值呈现**：controller.ts:216-220 归一后 snapshot 只见 'auto'，选择器由 readyToolMembers 动态驱动，无死值选项；spec:540 有存量值直进 nsValue 的回归测试。

## 契约维度：通过

- **导出面收敛**：亲核 `git show 7cc5f1f:src/index.ts` — `PERPLEXITY_MEMBER_ID`/`PerplexitySearchProvider`/`resolvePerplexityMemberOptions`/`PerplexitySettings` 四个导出全消，随 0.4.0 breaking 声明，无隐性下游面。`FallbackMember`/`LegacyFallbackMember` 本就不在 index 面（config.ts 模块内），无第三处遗漏的宽/窄分裂——宽型共三处（schema union、Config 类型 controller.ts:98 内联、controller nsValue 内联），后两处字面量重复有漂移风险（见前瞻③）。
- **ADR-0015/0017/JSDoc/locales 四处口径逐字核对一致**：语言面 = Tavily 一家（locales:176「the tool with a search-level language parameter — Tavily」/ config.ts searchLanguage JSDoc / ADR-0015 勘注 :39）；region 面 = Exa+Firecrawl（locales:174 / JSDoc / ADR 勘注）；chainOrderHint 默认序 4 家（Tavily → Exa → Firecrawl → AnySearch，locales:169/265）。三处零漂移。

## 前瞻维度：4 条（低危，待办性质）

1. **S18 新观察×2 尚未翻账**：docs/STATUS.md:93 活跃债务行仍挂着「S18 新观察×2：search_results 全无 url 边界 + title 空白判定——归补 key 实测裁定」——补 key 前提已随成员移除永久 moot。plan 债务映射只点名「S18 真实实测」一项翻账，未点名这两条；roadmap:80 已加勘注但 STATUS/progress-M7 台账待 T7 刷新。**属 T7 收官清单应补项。**
2. **新登记 🟢（残尸 perplexity 节）未落 STATUS/progress 台账**：plan D2 承诺「🟢 新登记」，STATUS:93 当前无此条；README 提示归属 S15（ADR-0017 已声明）合理，但台账登记本身不应等到 S15。**属 T7 应补项。**
3. **controller.ts:98 宽 union 内联重复**：`'auto' | 'dshws-tavily' | … | 'dshws-perplexity' | …` 字面量与 config schema 重复维护，config.ts 已有 `FallbackMember | LegacyFallbackMember` 组合类型却未复用——后续再删成员时此处会静默漂移（本次 5→4 两处同步靠人工）。非阻断，建议后续棒收口为 `import type` 组合。
4. **「git revert 单棒恢复」可执行性偏薄**：ADR-0017 称将来可 `git revert` 单棒恢复，但移除横跨 4 个代码 commit（e3ae688/3474bef/f4293f0/cb2f672）且中间隔了 0.4.0 发版历史 + loopback 场景改由 tavily/firecrawl 承载（revert 会撞测试改写）——「整棒恢复 + S18 重放」是方向性声明而非可执行 runbook，措辞上宜视为弱承诺。另 AnySearch「匿名免费额度」达标但 ADR 未挂可持续性观察钩子（上游收紧即触发准入复审）——可留待下次准入复审时补。

## dont-do / pitfalls 对照

docs/dont-do.md 无 perplexity/移除相关条目（零命中）；「fail-safe 不 fail-loud」对删除场景的偏离在 plan D2 有明确例外论证（用户没做任何事却坏 = 错误时机），与 pitfalls.md 无冲突。R1 豁免域（docs 历史档/CHANGELOG/AGENTS.md:24 撞名注记/测试内 S19 legacy 注释）逐类复核均属成员事实与撞名/兼容事实的合法分离，无借豁免夹带的真残留。

**总评：移除面干净、兼容策略双点闭环、文档口径零漂移；4 条前瞻项全部归位到 T7 收官动作，不影响 COMPLETE 判定。**

## 处置记录（主 Agent，T7）

- 前瞻 1/2 → 台账翻账 + 🟢 登记随收官序列落地；3 → 🟢 登记（controller union 内联，归后续棒）；4 → ADR-0017 补注（恢复为方向性声明弱承诺 + AnySearch 可持续性观察）。
