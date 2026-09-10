# Stage 2 计划审核 — S20（plan 020）

> 参数头：骨架库 v2（证伪优先）| 阶段 2 | Session 20 | 输入指针：plan 正本
> docs/plans/2026-09-10-020-s20-p2-params-plan.md；用户语境 = P2 中价值参数批（先于 S15）。
> 偏离说明：增列技术设计核证维度（含宿主 settings 服务容错行为实证——读 deepseek-harness
> packages/settings 源码）。执行方式：独立 spawn；同 Agent 两轮增量复审。

## 轮 1 输出原文（逐字）

## 审核结论：NEEDS REVISION（必改 ×1，建议 ×6）

### 必改

**M-1（D1 / 风险预案第 3 条 / T1）：`resolveConfig` throw 在 settings 路径不是 fail-loud，是 fail-silent + 重启炸插件。** 实证链：
- 宿主 settings 服务把 `hooks.onChange` 作为 watcher 挂进 `scope.watch`，watcher 的同步 throw 被 `.then(() => undefined, error => warnWatcherFailure(...))` 吞成 logger.warn（deepseek-harness `packages/settings/settings/src/index.ts:781-786` 附近）。
- 即：用户在 GUI 同时填 include+exclude 并 commit → 写队列 resolve 通过（schemastery schema 不校验互斥）→ section **已持久化**（index.ts:673-683）→ `live.refresh()` 里 `resolveConfig` throw 被 warn 吞掉、`#current` 保持旧值（dsh-websearch `src/settings.ts:56-62`）→ 用户看到的是「提交成功但配置没生效」。
- 更糟：重启后 `LiveResolvedConfig` 构造函数直接跑 `resolveConfig`（settings.ts:39-42），throw 使整个插件加载失败——已持久化的非法配置把插件 brick 到手动改文件为止。
- **正位修法**：宿主 `installSection` 原生支持 `hooks.validate`（SettingsSectionHooks，settings/src/index.ts:868-881；installSection:478 透传），validate 在写队列内、persist **之前**跑，throw 拒绝写入并冒错——「用户刚写完立即看到」的 fail-loud。`attachSettingsSection` 当前未传 validate，T1 需加此参数并为拒写路径补单测。

### 建议

**S-1**：R3「缺省零 wire 漂移」与 D4 timeout 修复冲突——R3 须显式排除；D4「sources 缺省 web」歧义（现状不发 sources 键）——钉死「缺省不发 sources 键」。
**S-2**：D1 hostname normalize 不覆盖通配（`*.example.com` 非 URL-like）——统一入口下 Exa 支持通配、Firecrawl 不支持，缺处置方案。
**S-3**：D4 news 合并序未定义 + limit 每-source 语义（双 source = 2×limit）须 ADR 披露。
**S-4**：D3 maxAgeHours wire 嵌套路径（contents.maxAgeHours）任务描述须带全路径。
**S-5**：T2 守卫可行（proxy 逐属性读已核证）；「守卫在同一次 wire 构造内判定」应 JSDoc 写明。
**S-6**：T5 须点名至少一条 settings-commit→wire 热生效断言（R4 锚）。

### 未命中问题的维度
T1→T4 依赖顺序无返工风险；ADR-0018 编号正确；S20 整数编号偏离有用户裁定背书；locales/控件形态与既有先例同构；R1/R2/R5 可测性无问题。

**裁决：M-1 必须修订后重审，S-1 建议随 M-1 一并改写。**

## 轮 2（增量复审）输出原文（逐字）

## 增量复审：NEEDS REVISION（残留 ×2，一处必改一处轻微）

逐项闭合核验：
- **M-1 → 基本闭合，但残留一处矛盾正文**。D1 与 T1 已按 validate-hook 双路径改写正确。**但 §5 风险预案第 3 条仍是旧文案原样未动**（resolveConfig throw 在 load/commit 即炸——已被阶段 2 审核证伪的语义）。必改：重写为双路径口径或删除并入 D1 引用。
- **S-1 闭合**：R3 显式排除两项；D4 钉死「缺省不发 sources 键」。
- **S-2 闭合**：通配守卫整体跳过 + 同构注明。轻微备注：括注「Tavily 通配子域」在附录 A 无出处支撑——不阻断。
- **S-3 闭合**；**S-4 闭合**。
- **S-5 未闭合**：D2/T2 无「同一次 wire 构造内判定」表述——执行期 JSDoc 细节，转执行期备忘，不需再轮修订。
- **S-6 闭合**：T5 热生效断言锚点在档。

**裁决：仅风险预案第 3 条一处必改，改完即可 APPROVED；S-5 转执行期备忘。**

## 处置记录（主 Agent）

- 风险预案第 3 条已重写为双路径口径（settings=validate persist 前拒写 / cordis.yml=resolveConfig throw 加载面；「不得作为 settings 拒绝机制」明文）→ 按轮 2 预授「改完即可 APPROVED」生效，未再发第三轮。
- S-2 轻微备注处置：括注改为「通配是 Exa 能力，附录 A 出处在档」。
- S-5 转执行期备忘（T2 JSDoc 落实）。
- 阶段 2.5：用户裁定原文在案（「『先对齐 P2 再 S15』或『先 S15』」→ 选先对齐）充当排期裁定 + 计划包批准按项目先例默认（问询未答先例 S09/S10/S17/S18）——披露落 session-20 记录。
