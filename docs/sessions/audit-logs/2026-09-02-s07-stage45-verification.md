# Session 07 阶段 4/5 独立验证输出（正本转录）

> **落盘说明**：本文件为 Session 07 阶段 4/5 独立验证 Agent 输出原文逐字（主 Agent 转录落盘，无敏感值）。

---

# S07 阶段 4/5 独立验证报告（T7，独立 Agent，2026-09-02）

> **参数头**：审核库 v2 ｜ 阶段 4/5 ｜ 验证对象 feat/s07-priority-i18n@15bfa4d ｜ 输入指针：docs/plans/2026-09-02-007-s07-priority-override-i18n-plan.md（R1-R6）、docs/progress/progress-M4.md、/tmp/dshws-s07/ 实物、git 面（0180c95..15bfa4d 自核）｜ 偏离说明：无。
> 验证执行：独立 general-purpose Agent，与执行者上下文隔离；门墙提交态串行亲跑；注入探针即还原。

前置：`git status --short` 空提交态确认（HEAD=15bfa4d，分支 feat/s07-priority-i18n）；全部命令 node v22.23.2 / pnpm 11.7.0 亲跑；注入均已还原并复验树干净。

## 一、R1-R6 逐条对峙

**R1 排序可重放 — PASS**
- 亲跑 `pnpm vitest run tests/client/controller.spec.ts tests/client/section.spec.tsx tests/client/locales.spec.ts` → **3 files 33 passed**（controller 16 / section 13 / locales 4）。controller 六项排序行为逐条在案：全量物化数组 patch（断言 `patch: { searchChain: [exa,tavily,perplexity,firecrawl,deepseek] }, expectedRevision: 0`）、默认序上移动→物化+pinned 翻转、标记两态、边界移动 not-ok 零 remote 调用、未知 id not-ok、update 冲突 not-ok。
- T6 实物核对：`/tmp/dshws-s07/settings-after-move.yaml` 与 `home/settings.yaml` 实物 = `dshws-exa` 首位物化数组（= 默认序 `tavily→exa→…`（src/config.ts:12-18 亲读）首项下移一位的精确结果）；`diff dump-baseline.yml dump-wired.yml` = `351,352c352,354` 标量翻转（wired 352/353 行 `dshws-chain`/`dshws-chain-fetch`，grep 亲见）+ `544a547,549` 插件注册行——commit message 数字吻合。
- D6 分层判定成立：①GUI→落盘=T6 实物 ✓；②patch 载荷=controller.spec 全量数组断言 ✓；③热链序=tests/settings.test.ts:124-140 亲读在案且全量回归绿 ✓；④端到端 order=roadmap S08 行原样「顺序保持」，从未在本棒验收列 ✓。

**R2 覆盖标记可重放 — PASS**
- deriveSnapshot 派生：controller.ts:122-123 亲读（`value.searchChain?.length > 0` 在场即 pinned，D1 语义）；spec 实跑绿（`pinned flags mark exactly the chains the section explicitly sets` 等）。
- 徽章：section.tsx:179-182 亲读（`data-dshws-chain-state={pinned?'pinned':'default'}` + `t('chainPinned')/t('chainDefault')` 双承载）；section.spec 徽章两态行为绿；T6 浏览器两态（初始双 default → search 翻 pinned → fetch 独立 default）= commit message ①②⑤ 记录 + settings.yaml 实物佐证（searchChain 在场⇒pinned）。

**R3 parity 脚本 — PASS**
- 正例亲跑 `pnpm check:i18n` → `check-locales: ok — 19 keys, union/en/zh parity holds` + `check-cjk: ok — 15 files`，**exit 0**。
- 拒绝路径亲证：注入 zh 独有键 `zhOnlyTester` → `check-locales: parity broken / zh extra: zhOnlyTester`，**exit 1** → `git checkout -- src/client/locales.ts` 还原，树复验干净。

**R4 CJK 门禁 — PASS**
- 零命中亲见（上式 15 files）；注释豁免为**真实豁免**：4 文件（client/index.ts:3、config.ts:11、errors.ts:4、providers/firecrawl.ts:4）grep 亲见 JSDoc CJK 而门禁绿。
- 注入亲证：src/errors.ts 第 21 行注入字面量 `'中文门禁探针'` → `check-cjk: src/errors.ts:21 — "中"`，**exit 1 且行号 21 精确保真**（穿过 9 行 JSDoc + 多行注释剥离后换行保留）→ 还原，树干净。

**R5 门墙全量（提交态串行亲跑）— PASS**
- 前置 `git status --short` 空（HEAD 15bfa4d）。
- `pnpm test` → **Test Files 22 passed (22)，Tests 196 passed | 6 skipped (202)**（与台账逐位一致；增量 +12 = locales 3→4 / controller 10→16 / section 8→13，与子集亲跑数吻合）
- `pnpm typecheck` → **exit 0**（node+client 双面）
- `pnpm lint` → **0 warnings and 0 errors, 38 files, 96 rules**
- `pnpm build` → lib/index.js **49.00 kB（49003B）** + index.d.ts **21.89 kB（21885B）** + client.js **20.54 kB（20541B，gzip 5.82）**；**node 面对深取证：与 /tmp/dshws-s06 现场 S06 tarball 解包 `cmp` 逐字节一致（index.js / index.d.ts 均 BYTE-IDENTICAL）**——零漂移最强实证
- `npm pack --dry-run` → **五件**：cordis.patch.yml(60B) + package.json(2.8kB) + lib/index.js(49.0kB) + lib/index.d.ts(21.9kB) + lib/client.js(20.5kB)
- `pnpm check:i18n` → **exit 0**；门墙后 `git status --short` 复验**仍干净**（build 产物不入 git）。

**R6 五子证据 — PASS（收尾/翻转两项按约「待 T8」不计 FAIL）**
- 隔离：`git log a9a228b..HEAD` message 扫描零危险写操作（唯一 `kill` 为 T6 对 scratch 实例 84536 的精确击杀记录）；`lsof` 亲证 **3413 LISTEN=0、PID 84536 不存在**；**3080 监听 PID 90269 在位未动**（`node apps/cli/lib/bin.js web --no-open`，Sep 1 23:54:32 启动）；/tmp/dshws-s05b（home 17:28）/tmp/dshws-s06（dir 19:44，home 19:56）均早于本棒窗口（T0 21:37:05 起）。⚠️ `~/.dsh` 一项见发现清单 🟡-1。
- 门墙：本次亲跑全绿（R5）。收尾件套 / 原子翻转（--no-ff）：**待 T8**（按验证口径不算 FAIL）。audit-log：stage0（21:34）+ stage2（21:35）正本亲见落盘 `docs/sessions/audit-logs/2026-09-02-s07-*`；stage45 = 本输出，随 T8 落盘。

## 二、三问交叉验证

**1. 安全 — 结论：T6 动作面无越界；一处法证口径问题（🟡-1）**
- T6 浏览器活动窗口（scratch 实物 21:50-21:54，commit 21:56:06）全部产物 confined 在 /tmp/dshws-s07/；kill 精确（3413 LISTEN=0、84536 消失、90269 未动，均已亲证）。
- 凭据面零接触**核实成立**：/tmp/dshws-s07/home/settings.yaml 与 settings-after-move.yaml 亲读仅有 `ui-onboarding` + `dsh-websearch.searchChain` 两键，无凭据字段；scratch 内 .credentials.yaml 为 scaffold 自建 browser-session 记录（key 名亲见、值未读），非用户凭据。
- 🟡-1：`~/.dsh/settings.yaml` birth=modify=**21:42:06**，落在本棒窗口内（T2 21:41:07 与 T3 21:44:08 之间），规定的 `ls -la ~/.dsh` mtime 核对法**不支持**「~/.dsh 零接触」的绝对主张。缓释证据：该文件无 dsh-websearch 键；`~/.dsh/.credentials.yaml` 停在 Aug 31 23:46 零变动；写入时点早于 T6 全部浏览器活动；21:42 前后无任何新启动 dsh/node 进程（ps 亲查）——最可能写入者是常驻 3080 实例（90269，默认 home）的 Web UI 状态持久化（welcomeNoticeVersion 在欢迎页确认时写入，源码 packages/client/ui-settings-general/src/index.ts:16 亲读）。非执行器可归因，但 T8 session 记录应补归属说明或软化措辞。

**2. 契约 — 结论：三项全部无破坏**
- 全量数组 patch 竞态：`moveSearchChainEntry`（controller.ts:215-228 亲读）带 `this.#revision` 作 expectedRevision，服务端乐观并发拒绝→`ok:false`→failed 反馈（section.spec 'a failed move shows failed feedback' 绿）；响应回填 value+revision 后 recompute，无陈旧态残留。单用户设置页场景下残余风险仅「一次点击冲突需重试」，可接受；全量替换另有宿主先例（tests/settings.test.ts:135-136）。
- 「移回默认序仍 pinned」：GUI 呈现与派生同源（presence-based deriveSnapshot，徽章直渲 `props.pinned`），且无「恢复默认」按钮（D4，🟢 债务已登记）——不存在与徽章矛盾的 UI 通路；这正是 D1 声明的诚实口径，成立。
- client half 产物：`git diff a9a228b..HEAD -- package.json` 亲证**仅增 check:i18n 一行 script**，`exports["./client"]` 与 `dsh.client` 三键零变动；lib/client.js 外部 require 恰三枚（react / react/jsx-runtime / dsh-client-ui-primitives，uniq 亲见），与 S06 R1 契约同构；宿主加载面无契约破坏。

**3. 前瞻 — 结论：S08 接口就绪；i18n CI 记录为 S09 手册项**
- S08 loopback「顺序保持」：排序写通路端到端已由 T6 实物证明（真服务端 settings.yaml 物化数组），且 settings.test.ts:124-140 证明链在调用时经 getter 读序热生效——S08 可用 settings 预置链序后断言 loopback 调用时序，接口面齐备。
- i18n 门禁 CI 接线：本仓**无 .github、无 CI 配置**（亲查），`check:i18n` 现仅存于 package.json scripts + 门墙手工口径——记 S09 手册项（与 S09 升级演练/README 同批），非本棒债务。

## 三、发现清单

- **🔴 ×0**
- **🟡 ×1**：`~/.dsh/settings.yaml` mtime 21:42:06 落于本棒窗口，「~/.dsh 零接触」主张按规定的 mtime 核对法不可证（正面证据：无 dsh-websearch 键、credentials 文件 Aug 31 未动、写入早于 T6 全部活动、无同时刻新进程——非执行器可归因；建议 T8 在 session 记录补一句归属说明或改措辞为「T6 动作零接触」）
- **🟢 观察 ×3**：vitest sourcemap 缺 map 警告（台账在案）；tsdown 弃用警告 ×2（台账在案）；s06 scratch home 子目录 mtime 19:56 与 commit 所引 dir 19:44 略有出入（均早于窗口，无影响）

## 四、最终结论

**PASS / COMPLETE**——R1-R6 逐条 PASS（门墙七命令提交态亲跑零偏差、node 面逐字节零漂移、双拒绝路径亲证红、T6 实物吻合、隔离法证除 🟡-1 口径项外全过；三问无阻断）。按约定待 T8 项不算 FAIL：T8 收官时需完成 session 记录 + STATUS/roadmap/CHANGELOG 原子翻转（--no-ff）+ stage45 audit-log 正本落盘，并顺手处置 🟡-1 的措辞归属。工作树已复验还原干净，无受管文件残留改动。
