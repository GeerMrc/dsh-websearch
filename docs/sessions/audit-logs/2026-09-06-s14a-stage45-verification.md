# Audit Log — S14a 阶段 4/5 独立验证（全量门墙唯一责任点 + R1-R6 对峙 + 三问）

- **参数头**：审核库 v2｜阶段 4/5（全量门墙唯一责任点 + R1-R6 对峙 + 三问 + 牙齿探针）｜对象：Session 14a（装即接管 web_search，ADR-0013，分支 feat/s14a-install-takeover @ 01aae1c，commit 链 bf3719f→9884466→566f822→3d09b59→5421c5c→01aae1c）｜输入指针：plan 014a 正本 + progress-M7 台账 + /tmp/dshws-s14a 浏览器实物（只读；重演用新目录 /tmp/dshws-s14a-verify）+ 宿主仓 dev@3281e04b59 + 安装包｜要点转录（本提示词）：①全量门墙七命令亲跑对照零偏差 + tarball 内容核②R1-R6 逐条对峙（含 dump 亲读 + 独立重演 + 用户层 patch 现物）③安全/契约/前瞻三问④牙齿探针（改 fetchProvider → 断言红 → 完整还原复绿 clean 亲证）⑤治理留痕（三★节/方向裁定链）｜纪律：除探针外零修改/零 git 写/禁进程起 kill。

- **输出原文**（独立 Agent 逐字落盘，2026-09-06；与执行 Agent 上下文完全隔离）：

---

## ① 门墙数字表（实测 vs 声称，对照 T4/门墙表 S14a 行）

| 门 | 声称 | 实测（亲跑 2026-09-06） | 判定 |
|---|---|---|---|
| ① `pnpm test` | 29 files，273 passed \| 9 skipped (282) | **29 files（28 passed + 1 skipped），273 passed \| 9 skipped (282)**，1.94s | 零偏差 |
| ② `pnpm typecheck` | exit 0 双面 | `tsc --noEmit && tsc --noEmit -p tsconfig.client.json` **exit 0** | 零偏差 |
| ③ `pnpm lint` | 0w0e 50 files | **0 warnings 0 errors，50 files（96 rules）** | 零偏差 |
| ④ `pnpm build` | index.js 59.42 / index.d.ts 27.04 / client.js 42.09 kB | **59.42 / 27.04 / 42.09 kB** 逐位一致（基线 41.81→42.09 增量披露成立） | 零偏差 |
| ⑤ `npm pack --dry-run` | 五件（cordis.patch.yml 双条目） | **5 files**：cordis.patch.yml 136B + lib/client.js + lib/index.d.ts + lib/index.js + package.json；**tarball 内 cordis.patch.yml 双条目亲读**（`tar -xzO` 抽 /tmp/dshws-s14a 归档 tarball：insert 行 + `- id: web` 两键重述无 name，与工作树逐字一致；shasum 786e27e4…） | 零偏差 |
| ⑥ `pnpm check:i18n` | 34 keys + 18 files 零 CJK | **34 keys union/en/zh parity + 18 files zero CJK**，exit 0 | 零偏差 |
| ⑦ `git status` clean | 前后 clean | 验证首末三次核 **clean**（含探针还原后） | 零偏差 |

基线对账：270→273（+3 = patch.test）与既有零破坏相符。**T4 声称零偏差成立。**

## ② R1-R6 逐条结论

- **R1 PASS**。ADR-0013 在档 `docs/decisions/adr-0013-install-takeover-search.md`（frontmatter `status: accepted`，date 2026-09-06）。三 ADR Status 节注记逐个亲读：ADR-0001:15（组合面改判）、ADR-0004:15（D2 接线形态改判，**明文 D3 实质不变**）、ADR-0009:15（D5 博弈规则 bundle 层延伸）——均 `git show bf3719f` 亲证为纯注记 hunk（各 +2 行，单一 hunk），互指 ADR-0013 为正本。**ADR-0004 D3 未动亲证**：该 commit 对 adr-0004 的 diff 仅 `@@ -12,6 +12,8 @@` 注记插入；D3 正文（tavily→exa→perplexity→firecrawl→deepseek，DeepSeek 末位兜底）逐字原样；ADR-0013 全史仅 T0 一枚 commit，未被后改。
- **R2 PASS**。`tests/patch.test.ts` 三断言亲读：insert 行（:15-18）/ web 行两键重述 + 无 name 守卫（:20-28，含 `not.toMatch(/- id: web\n\s+name:/)`）/ 不钉 fetch 链（:30-32）。`cordis.patch.yml` 双条目（7 行 136B：insert + web 行 searchProvider: dshws-chain + fetchProvider: http，无 name）。**亲跑 3 passed（87ms）**。
- **R3 PASS（dump 亲读 + 独立重演双重）**。归档四 dump 亲读：baseline :351-352 `deepseek-official/http`；installed :352-353 `dshws-chain/http`；userveto :352 `dshws-deepseek`（用户层赢，且 dump 注记行直指用户层 patch 源文件）；**restored 与 baseline diff 本人重跑 EXIT=0 零输出**。另在全新 scratch `/tmp/dshws-s14a-verify`（DSH_HOME 自建、tarball 复制出仓、仅一次性 dump/add/remove 命令、零端口监听）**独立重演三态**：baseline（deepseek-official/http）→ tarball add → installed（**dshws-chain/http，此时用户层 cordis.patch.yml 仍为 `[]`——零手动接线**）→ remove 单命令 → **diff EXIT=0，544 行逐字节一致**。装卸闭环本人第一手复现。
- **R4 PASS**。dump fetchProvider=http（归档 + 重演双证）；patch 三处现物（工作树 / tarball 内 / home node_modules 安装副本）均无 `dshws-chain-fetch` 钉扎；无 firecrawl key 场景推演在档：ADR-0013 Context 6（单成员 firecrawl 无 key 即 `available()=false`）+ Decision 2 + 方案 C 排除理由 + Note §3 fetch 行。
- **R5 PASS**。见①表，七命令零偏差。
- **R6 PASS**。①截图 98455B PNG 1280×720 非空，**AI 视觉亲读**：工具行 "Web search · loopback proof query" + 右侧徽标 **"· DeepSeek"**，终答消息 "Search round complete — stub final answer."；②stub-log.jsonl wire 三段亲读：`/chat/completions →(Bearer sk-fake-s14a)` → `/messages (sk-fake-s14a)` → `/chat/completions (Bearer sk-fake-s14a)`（三段序 + 全 fake key 成立）；③boot.log 含启动命令行 + **token URL 行**（port 3423）；④**用户层 patch 现物亲读**：`/tmp/dshws-s14a/home/profiles/web/cordis.patch.yml` 仅含 dsh-websearch 行 baseURL 脚手架（`http://127.0.0.1:3432`），**无 web 行**——「web 行零手动」关键证物成立（我方重演中用户层 `[]` 同样翻转，双证）；⑤安装副本 node_modules/dsh-websearch/cordis.patch.yml 双条目。
- **附加核 PASS**：台账 T5 行（progress-M7:184）与实物逐项一致（截图名/wire 三段/零手动/宿主 clean/端口收口）；宿主仓 `/Volumes/IPFSJK/Zcode/deepseek-harness` 分支 dev **clean @3281e04b59**（验证前后双核）；`lsof :3423 :3432 :3416 :3080` 零残留监听。

## ③ 三问结论

- **安全**：钉扎影响面 = web 行单行两键（整段重述防丢键），insert 行与 src 逻辑零变更（build 零漂移佐证）；peer 域 `>=0.1.2-alpha.3 <0.1.3` 在 package.json 亲证。用户预期偏差披露在档：设置页 intro（locales.ts description en/zh 扩句——装即接管/卸载复原/fetch 可选）+ s05b runbook 增补（:6-10）+ ADR-0013 Consequences 负面后果条目。凭据零残留：`grep -rn sk- /tmp/dshws-s14a`（排除 node_modules）**仅 stub-log.jsonl 4 行 wire 日志**；home 内 .credentials.yaml 仅 browser-session grant、settings.yaml/patch/workspace 全零 sk-。
- **契约**：ADR-0013 与 0001/0004/0009 一致性论证闭合——三 ADR 注记互指（git 亲证纯注记）+ D3 中立性实质不变（diff 级亲证）+ D5 博弈规则为 bundle 层自然延伸（与 0009 注记同口径）。漂移防线在案：peer 域 + 发版清单条目**互指成立**（Note §5.1 ↔ ADR-0013 Consequences ↔ plan D3）且 roadmap S15 行已带「漂移防线检查项 ADR-0013」去处（发版清单实体本身为 S15/S16 未来物——npm publish 按 ADR-0007 延后至 M6 验收后，无现实清单可挂，去向链不悬空）。卸载复原与用户层终裁**实测闭环**（本人独立重演 diff EXIT=0 + userveto dump 用户层赢）。
- **前瞻**：S15 素材齐备——ADR-0013 语义（Decision 六条 + 实测语义表）+ Note §4 新口径（选择翻转真相/破坏性零回归/anysearch 卸装即切换/两行者迁移）+ roadmap S15 行已适配（anysearch 卸装即切换 + 整段替换须重述两键）。多插件博弈文档化（ADR-0013 Decision 5 + ADR-0009 注记）。债务对齐：plan 债务归属映射 vs progress-M7 台账逐类核对——本棒清偿 🟡-1（session-14 勘确实物在档）、维持 🟢×4 + L-2 + 观察 + v2 backlog 全在册。

## ④ 🟡/🟢 新发现（判别式同库 v2）

- **🟡 ×0**。
- **🟢 ①（语义精化，S15 README 取材）**：台账 T2 行「用户层整段替换丢 fetchProvider 键时由『无配置+http 恒可用』路径兜住」的表述仅在**无 firecrawl key** 时成立——宿主 `web/src/index.ts` resolveProvider 的 auto-select 要求**恰好一个** usable；若用户有 firecrawl key 且插件在装，一行否决（仅钉 searchProvider）会使 http 与 dshws-chain-fetch 双 usable → `WEB_PROVIDER_AMBIGUOUS` 硬错（响亮失败，非静默）。S15 手册必须按「否决/自定义亦重述两键」口径写（runbook 增补与 roadmap S15 的「整段替换须重述两键」已覆盖此义务，本条为判别式补强）。
- **🟢 ②**：发版清单「追平重述 web config」条目现有四处文本互指 + roadmap S15 去处，但清单**实体**尚未存在（publish 延后 M6 后，无错可挂）——S15/S16 创建清单时须从 Note §5.1 搬运，勿凭记忆重写。
- **🟢 ③**：stub-log.jsonl 首行有一条早于正式轮 61s 的 `/v1/chat/completions`（无 auth）探测残留行，不影响 chat→/messages→chat 三段证据链（fake-key 轮完整独立成立）。
- 环境注记（非新发现，台账在册项复现）：test 运行时 vite 对 `@deepseek-ai/dsh-client-ui-primitives` lib 缺 source map 报 ENOENT 噪音——测试全绿 exit 0，属台账 🟢 观察「vitest sourcemap」既有项。

## ⑤ 总判定

**PASS / COMPLETE**（R1-R6 六条全过，门墙七命令零偏差，三问证据链闭合，探针红签名留痕且完整还原复绿 clean，治理留痕三★节/stage0/方向裁定链全部在档；🟡×0，🟢×3 新观察。可进入 T7 收尾。）

---
**牙齿探针实录（第 4 项）**：python 将 `cordis.patch.yml` 的 `fetchProvider: http` 改为 `dshws-chain-fetch` → `vitest run tests/patch.test.ts` **红：2 failed | 1 passed**（"pins the web row config with both keys restated" 与 "does not pin the fetch chain" 双断言命中——fetch 不钉扎的守卫有牙齿）→ `git checkout -- cordis.patch.yml` 完整还原 → 复跑 **3 passed** → `git status` clean 亲证。
