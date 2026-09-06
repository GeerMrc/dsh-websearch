# Audit Log — S14 阶段 4/5 独立验证（全量门墙唯一责任点 + R1-R7 对峙 + 三问）

- **参数头**：审核库 v2｜阶段 4/5｜Session 14 验证（独立 Agent 与执行者上下文完全隔离）｜输入指针：plan 正本 docs/plans/2026-09-06-014-s14-toolview-attribution-plan.md（R1-R7/D1-D7/债务映射节）+ 执行序列 a312805/440c90e/05f230c/4958fc0/ebed524/04621b4 + 基线（S13：261|9(270)/27 keys/client.js 29.98/master 69494ad）+ /tmp/dshws-s14 浏览器实物 + 宿主仓 /Volumes/IPFSJK/Zcode/deepseek-harness（dev@3281e04b59）+ 安装包 node_modules/@deepseek-ai/*（alpha.4）｜要点转录（本提示词）：①全量门墙七命令亲跑对照零偏差（全量测试唯一责任点）②R1-R7 逐条对峙（file:line/实物亲读）③安全/契约/前瞻三问（XSS 面/凭据残留/双 declare 论证/shadow 关系/键数披露/维护点/债务清单含 firecrawl 观察项现状）④治理留痕（三★节/audit-log 成套/2.5 披露双落）⑤牙齿抽查（priority 探针，改后完整还原+复跑绿+clean 亲证）｜纪律：除探针外零文件修改/零 git 写/禁进程起停/重负载串行｜偏离说明：无。

- **输出原文**（独立 Agent 逐字落盘，2026-09-06；与执行 Agent 上下文完全隔离）：

---

# S14 阶段 4/5 独立验证报告（正本素材，主 Agent 落盘 docs/sessions/audit-logs/2026-09-06-s14-stage45-verification.md）

验证环境：feat/s14-toolview-attribution @ 04621b4（工作树全程 clean），node v22.23.2 / pnpm 11.7.0，重负载命令全串行亲跑。除第 5 项探针（改后已完整还原，shasum 前后一致 + 复跑绿 + clean 亲证）外零文件修改、零 git 写操作、/tmp/dshws-s14 只读。

## ① 全量门墙数字表（实测 vs 声称）

| 门墙 | 实测 | T4 声称 | 偏差 |
|---|---|---|---|
| pnpm test | 28 files（27 passed + 1 skipped），**270 passed \| 9 skipped (279)** | 同 | 零 |
| pnpm typecheck | `tsc --noEmit && tsc --noEmit -p tsconfig.client.json` exit 0 双面 | exit 0 双面 | 零 |
| pnpm lint | **0 warnings 0 errors（49 files，96 rules）** | 同 | 零 |
| pnpm build | index.js 59422B=**59.42 kB** / index.d.ts 27039B=**27.04 kB** / client.js 41815B=**41.81 kB**（tsdown 十进制 kB 口径） | 同 | 零 |
| npm pack --dry-run | **五件**（cordis.patch.yml + lib 三件 + package.json），total files: 5 | 五件 | 零 |
| pnpm check:i18n | **34 keys** union/en/zh parity + **18 files** 零 CJK，exit 0 | 同 | 零 |
| git status --short | **clean**（build 后复验，无 diff） | clean | 零 |

环境附注（非失败）：test 输出含 vite source-map ENOENT 警告（ui-primitives 安装包缺 index.js.map）；build 输出 tsdown `external`/`inlineDynamicImports` 弃用警告 ×2。二者均已有台账观察项在册（progress-M7「tsdown 弃用 ×2 / vitest sourcemap」行），不影响任何门墙结果。

## ② R1-R7 逐条结论

**R1 调研注记锚可复核 — PASS（7/7 锚抽查全实证，超出 ≥5 要求）**
注记在档：docs/notes/2026-09-06-s14-fetch-fallback-research.md，自带锚点复核清单（:107-117）。亲验：
- 锚 1 `resolveProvider` 四路抛错：宿主 packages/web/web/src/index.ts:172-194，CONFIGURED_MISSING(:177)/CONFIGURED_UNAVAILABLE(:180)/UNAVAILABLE(:187)/AMBIGUOUS(:191) 逐一在档。
- 锚 2 web-fetch-http：grep "settings" 零命中（exit 1）；HttpFetchProvider/LOCAL_FETCH_PROVIDER_ID 公开导出（src/index.ts:16-19）；`id='http'`（provider.ts:35）；`available()` 恒 true。
- 锚 3 patch 钉死：packages/bundle/base/cordis.patch.yml web 行 config `fetchProvider: http`（实测 451-455 区间，注记 :452-454 差 1 行内，内容零偏差）。
- 锚 4 current() 对照缝：web-search-deepseek/src/index.ts apply 内 `current = source` + `() => resolveOptions(ctx, current())` per-search 现读（:127-139 区间亲见）。
- 锚 5 插件在产注册：src/index.ts:163 `ctx.web.registerFetchProvider(new ChainFetchProvider(...))` 逐字命中。
- 锚 6 watchUserPatches：app-boot/src/index.ts:235-261 经 `hmr.registerConfig` 事务性重应用；web profile `patchReload: 'live'`（profile.ts:144）+ 自定义 profile 默认 'live'（:169）。
- 附加：WebRuntime 构造器一次性捕获 provider id（web/src/index.ts:87-94，无 per-call 读）——注记 1.5 「构造器捕获」实证。

**R2 组件回退态 — PASS**
tests/client/toolview.spec.tsx 八用例逐条核对均有具体 DOM 断言（非 smoke）：徽标含 label（`· Tavily` testid+aria，:59-66）/ 展开（answer+sources+truncated+raw+inspect spy times 1，:68-81）/ 未知 id 原样（`· member-x`，:83-91）/ 无署名无徽标（queryByTestId null，:93-103）/ meta 不符 generic（`dshws-toolview-generic` + 无 badge 无 sources，:105-117）/ running（:119-125）/ error（role=status + code 呈现，:127-139）/ 注册载荷（:141-176）。亲跑：**8 passed**。

**R3 接管接线 — PASS**
src/client/index.ts:61-66：`slots.inject('tool.call.toolview')` + `{ key: 'web_search', priority: -1, locale: NS }` + register 返回值直接作 inject disposer。安装包契约对峙：node_modules/@deepseek-ai/dsh-client-ui-slots@**0.1.2-alpha.4**/lib/types/index.d.ts **:398 `key: EntryKey`、:399 注释（ascending, default 0, lowest renders; same key + same priority throws）、:400 `priority?: number`**——spec :170 注释引用的 d.ts:399-400 精确命中。装拆对称断言在档（spec :174-175 `disposer()` → `unregister` times 1）。

**R4 宿主零 diff — PASS**
宿主仓亲跑 `git status --short` 无输出（clean），HEAD=**3281e04b59**（dev 分支），与声称一致。T3 提交（4958fc0）仅 5 文件（index.ts/locales.ts/websearch-row.tsx/entry.spec/toolview.spec），无宿主文件拷贝；websearch-row.tsx 五个 imports 逐核：react（value+type）、ui-primitives（external value）、ui-slots（type-only）、./controller.ts（本包）——零宿主源码引用（"WebRow" 命中均为注释文字）。

**R5 门墙 — PASS**（见第 ① 节，七命令全亲跑零偏差）。

**R6 浏览器实物采信核 — PASS**
/tmp/dshws-s14 实物亲读：三截图非空（PNG 1280×720，96.9-113.2 KB）且**内容亲读**——screenshot-chain-badge.png 实见 `Web search | loopback proof query | · DeepSeek` 徽标与 stub answer；direct/foreign 两轮实见同卡**无徽标**（chain-badge 图中 SSE 错误条即 commit 坑实录所述 stub 形态）。stub-log.jsonl 16 段 wire 亲见（三轮 20:30/20:31/20:32 各含 /chat/completions + /messages，auth 全 `sk-fake-s14`）；dump-wired.yml :352-353 `searchProvider: dshws-chain` + `fetchProvider: dshws-chain-fetch`（baseline 为 deepseek-official/http，diff 亲见）；boot2.log token 行在档。progress-M7 :152 T5 行与 session-14 :77-85 T5 段与实物逐点一致（含 3431 未用披露、kill 3422/3430、宿主 clean @3281e04b59）。

**R7 钉牌断言 — PASS**
tests/keys.test.ts:108-120「a consumed draw is not re-offered to the next attempt（失败不回牌钉牌——S13 🟢 S14 T2 清偿）」在档，round-robin/random 双策略各断言下一抽不重发同把。探针红绿留痕于 git log 05f230c message（探针 A 4 failed / 探针 B 3 failed 均含本断言 → 还原绿 13 passed）。亲跑 keys spec：**13 passed**。

## ③ 三问结论

**安全 — 过。** ①徽标解析健壮性：`SERVED_BY_PATTERN = /^\[served-by: ([^\]]+)\]/`（websearch-row.tsx:89）只取 answer 首行，`[^\]]+` 无嵌套量词无灾难回溯；servedBy 经 `labelOf` 后以 React JSX 文本节点/aria-label 渲染（:225-227），自动转义，全文件无 dangerouslySetInnerHTML——**无 XSS 面**，恶意 id 只能以纯文本显示。deriveWebCard 对外来 meta 逐字段校验（sources 每项 url 非空 string、title/snippet/publishedAt optional string，:143-167），不符返回 null 走 generic 回退。②凭据残留：/tmp/dshws-s14/home 全树 grep `sk-` **零命中**（fake 值仅存在于 stub-log.jsonl 的 wire 记录，属测试证据本体）；.credentials.yaml 仅含 `client-connection/browser-session` grant（宿主自身连接密钥，S13 已注记口径）；settings.yaml 无 apiKey 行。**无真实 key 残留**。

**契约 — 过。** ①SlotMap 双 declare 永不相遇：本包 package.json devDeps/peerDeps **零 ui-tool**（grep exit 1 亲证；仅 primitives/renderer/settings/slots/locale/api-remotes），本包编译程序内 SlotMap 只有 websearch-row.tsx:78-86 的本地 declare，宿主 ui-tool 的 declare 在另一程序——论证成立；运行时 registry 按名字符串匹配。②shadow 关系：宿主 WebRow 注册亲见（宿主仓 packages/client/ui-tool/src/client/tool/toolviews/web-row.tsx:47）`{ name: 'tool.call.toolview', key: 'web_search', locale: NS }` **省略 priority → 默认 0**；插件 -1 < 0，keyed cell renders lowest → 插件行渲染、宿主行 shadow；同 key 异 priority 不触发 same-priority throw。③34 vs 33：plan 014 原估 33（:134/:157），实际 34 已四处披露（commit 4958fc0 message / progress-M7 门墙表 :57 / session-14 T3 段 / Agent Note §6，均注明 +`toolInspect` 键原因）。

**前瞻 — 过。** ①宿主演进跟进点：Agent Note §5 四条维护点在档（跟进判据=web-card-model.ts 校验或 WebSearchMeta 形状变化 → deriveWebCard 镜像同步；slot 语义锚 d.ts:399-400 升级时复述；conversation.details.tool 未接管披露；subCalls 跟进），与 ADR-0010 Decision 5（:35）及负面后果节（:65-66）互指闭合。②S15 手册素材齐备：ADR-0012（失败语义 + 两级调用语义正本表指针 s12b note）+ ADR-0010 维护点 + roadmap S15 行（README zh/en/anysearch 迁移步骤与验证命令/upgrade.md 含溯源维护点）全在档。③遗留债务核对：台账在册——「失败不回牌」已翻账清偿（05f230c）；🟢 维持不排期 5 项（L-2 per-profile GUI/fetch 链排序 UI/恢复默认序按钮/CSS module 化/anysearch fetch 面）；**firecrawl 402/429 观察项现状**：search face 有 429/402 双 it（firecrawl.test.ts:115-127，位于 :64 search describe），fetch face（:180-236）无 402/429 独立 it（仅 requestFailed/badResponse）——观察项描述准确，维持观察未清偿，非 S14 验收路径。

## ④ 🟡/🟢 新发现清单

- **🟡：无**。验收路径无未闭环项，无半成品契约。
- **🟢 新观察候选（1 项，不阻塞）**：websearch-row.tsx badge（:185 badgeStyle `flexShrink: 0`、无 max-width/overflow 截断）遇超长 servedBy id（外来 content 的 meta.answer 首行可为任意非 `]` 字符串）会把折叠行撑宽——纯视觉最坏情况（React 转义无安全影响），与 summary 的 ellipsis 处理不对称。可随宿主 WebRow 对齐维护点顺手处理，价值低。
- 环境面 vite sourcemap ENOENT 与 tsdown 弃用警告 ×2：均已有台账观察项在册，**非新发现，维持**。

## ⑤ 总判定

**PASS / COMPLETE**

- 全量门墙七命令亲跑与 T4 声称**零偏差**（270|9(279)/exit 0 双面/0w0e 49f/59.42+27.04+41.81/五件/34 keys/clean）。
- R1-R7 全 PASS，证据全部 file:line 或实物亲读（含三截图内容级亲读、宿主仓/安装包双面对峙）。
- 三问全过；治理留痕齐全：session-14 三★节占位在位（审核节已填、启动指令/规范声明两节 T7 占位），audit-logs stage0/stage2 两份在档（本报告为第三份 stage45，主 Agent 落盘后成套），2.5 默认批准披露双落（session-14 计划与审核节 + plan 014 :222 专节）。
- 探针有牙实证：priority 改 0 → 注册载荷断言红（`AssertionError: expected +0 to be -1`，1 failed|7 passed）→ 还原 shasum 前后一致（81565ead…）→ 复跑 8 passed → git status clean 亲证。
- 补完清单：**无**。session-14 交付物表/未完成/下一步/启动指令/规范声明五节按流程归 T7 收官补全，不属本验证补完项。
