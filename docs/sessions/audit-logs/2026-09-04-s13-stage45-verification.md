# Audit Log — S13 阶段 4/5 独立验证（对象：Session 13 优先级策略棒·全量唯一责任点）

- **参数头**：审核库 v2｜阶段 4/5｜Session 13 独立验证审本棒执行面｜输入指针：对象分支 `feat/s13-priority-strategy` HEAD `3736ca7` + plan 013 `docs/plans/2026-09-04-013-s13-priority-strategy-plan.md`（R1-R6 + 验证矩阵 + D1-D6）+ ADR-0012 `docs/decisions/adr-0012-key-random-without-replacement.md` + 执行棒证据目录 `/tmp/dshws-s13/`（只读采信）+ progress-M7 T0-T5 行 + 门墙表 S13 行｜偏离说明：无（门墙七命令串行亲跑，全量测试唯一责任点在本阶段履行）。要点转录（本提示词）：提交链亲证 → 门墙七命令提交态亲跑逐件对峙 → R1-R6 逐条（file:line + 实测数字）→ 增量算术逐文件复算 → 安全/契约/前瞻三问 → 🟡 判别式正面证据要求（fail-closed）→ 报告完成即落盘。环境 node 22.23.2（nvm）；重负载全串行；`~/.dsh`、3080/3416/3417、pid 61518 全程零接触；本文件不含任何 token/凭据值。

- **输出原文**（独立 Agent 逐字落盘，2026-09-04；与执行 Agent 上下文完全隔离）：

---

# S13 阶段 4/5 独立验证报告

## 结论：**PASS / COMPLETE**（🔴×0 🟡×1 🟢×2；🟡 为功能边角类，附判别式探针正面证据，建议 T6 补腿当场清偿或显式移交下一棒 T0）

## 阶段 4 前置：提交链与状态亲证

- `git log --oneline -12`：HEAD = `3736ca7`（T5 浏览器棒），链序 `e26a7dd`(T0 治理批)→`04c0e5c`(T1 keys)→`27dd261`(T2 controller)→`7aa0e5f`(T3 控件+hint)→`dcbdbcb`(T4 门墙)→`3736ca7`(T5)——与执行棒声称逐一吻合
- `git branch --show-current` = `feat/s13-priority-strategy`；`git rev-parse HEAD` = `3736ca7b566f2f6260b28484e4d107931b31ec3a`
- `git status --short`：门墙前后均 clean
- 证据目录 `/tmp/dshws-s13/` 亲见：`boot.log`、`dsh-websearch-0.1.0.tgz`(27711 B)、`dump-baseline.yml`、`dump-wired.yml`、`home/`（树）、`screenshot-tavily-random.png`(112654 B PNG 1280×720)

## 阶段 4-1：门墙七命令亲跑 vs T4 声称（HEAD 3736ca7 提交态，串行）

| 命令 | 亲跑结果 | T4 声称 | 判定 |
|---|---|---|---|
| `pnpm test` | **260 passed \| 9 skipped (269)**，Test Files 26 passed \| 1 skipped (27) | 260\|9(269) | ✅ 一致 |
| `pnpm typecheck` | `tsc --noEmit && tsc --noEmit -p tsconfig.client.json`，exit 0（双面） | exit 0 双面 | ✅ 一致 |
| `pnpm lint` | oxlint **0 warnings 0 errors，47 files**，exit 0 | 0w0e 47 files | ✅ 一致 |
| `pnpm build` | index.js **59.41 kB** / index.d.ts **27.04 kB** / client.js **29.98 kB**，exit 0 | 57.96→59.41 + 27.04 零漂移 + 26.25→29.98 | ✅ 三件逐一命中 |
| `npm pack --dry-run` | **total files: 5**（cordis.patch.yml / lib/client.js / lib/index.d.ts / lib/index.js / package.json），27.7 kB | 五件 | ✅ 一致（27.7 kB 与证据 tgz 27711 B 吻合） |
| `pnpm check:i18n` | check-locales **27 keys** union/en/zh parity + check-cjk **17 files** 零 CJK，exit 0 | 27 keys + 17 files | ✅ 一致 |
| `git status --short` | 前后均 clean | clean | ✅ 一致 |

七件零偏差。（test 运行中出现一条 vite 对 node_modules 依赖包 sourcemap 缺失的 warning，属环境噪声，非测试失败，不影响判定。）

**增量算术逐文件复算**：基线 252\|9(**261**) → **269**，+8 全额可解释——`tests/keys.test.ts` 9→11（+2，T1 两断言）；`tests/client/controller.spec.ts` 17→20（+3，T2）；`tests/client/section.spec.tsx` 22→25（+3，T3）；locales.spec 5、apply.test 17 等其余零变化。`grep -cE '^\s*it\('` 逐文件亲数与声称口径吻合；T3 声称「client 三 spec 50 passed」= controller 20 + section 25 + locales 5 ✅。

## 阶段 4-2：R1-R6 逐条对峙

### R1 — ADR-0012 在档且与实现一致：**PASS（带 🟡-1 偏差，见下）**

- ADR 在档：`docs/decisions/adr-0012-key-random-without-replacement.md`，status accepted（2026-09-04）；Status 节含 2.5 披露（「AskUserQuestion 未获答 → 按接力序取推荐默认『变体 B』批准，S09/S10 先例，全程披露」），session 记录 `docs/sessions/2026-09-04-session-13.md:44-45` 双落留痕 ✅
- **公式逐句对照**：ADR D1 `j = i + floor(rng() × (n − i))` ↔ `src/keys.ts:151-158` `const j = i + Math.floor(rng() * (deck.length - i))`——升序 Fisher-Yates 逐字符等价 ✅；rng≡0 → j=i 恒自换 → 恒等排列 ✅（既存钉牌断言零漂移佐证，见 R2）
- **牌堆语义**：`#select`（keys.ts:132-141）random 分支逐张抽牌 `#deck[this.#deckPos++]`；`#deckPos >= #deck.length` 抽尽重洗；一轮内每把恰一次 ✅
- **重建条件**：keys.ts:136 `#deckPos >= #deck.length || !KeyPool.#sameMultiset(...)`；`#sameMultiset`（keys.ts:161-171）按计数表比对——对**互异 key** 正确（探针 2/3 实证：异值热改必重建、同多重集重排不重建）
- **失败语义（不回牌）**：keys.ts:140 抽牌在 `#select` 返回时即消费（`#deckPos++`）；`resolveApiKey` 无重试环，key 请求失败直接上抛由链层降级——结构性满足「不换把不回牌」✅（但无直接钉牌测试，见 🟢-2）
- **范围注记**：ADR Decision 4 明文「成员级保持顺序降级不变」✅；order/round-robin 语义零改动（round-robin 既存断言 keys.test.ts:48-64 原样存活；S13 提交 diff 无 chain 层文件）✅

**🟡-1（判别式正面证据在案）**：`#sameMultiset` 对**同值重复 key 的多重集平移**漏判——`left === undefined` 检查漏 `left === 0`（计数耗尽）情形。实测探针（本验证 Agent 以仓库实际 `KeyPool` 运行，rng≡0）：池 `k1,k1,k2` 消耗两抽后热改为 `k1,k2,k2`，下一抽得 `k2`（= 陈旧牌堆 deck[2]）；若重建发生应得 `k1`（新池恒等排列 deck[0]）。即 {k1×2,k2×1}→{k1×1,k2×2} 不触发重建，过渡周期按旧池多重集发牌。后果受限：发出的 key 字符串始终 ∈ 现池（无无效 key 泄漏），但违背 ADR-0012 D2「去顺序多重集不一致即整堆重建」与 JSDoc「same multiplicities」契约。定位：`src/keys.ts:166`（建议守卫 `left === undefined || left === 0`）；测试缺口：keys.test 重建腿（:85-92）仅覆盖变长场景。**归属依据**：plan 013 风险节明示「牌堆重建判定必须按多重集比较（**同值重复 key 合法**），防热改值后旧牌堆错配」——位于本棒验收路径上，非误报。一行守卫 + 一条重复 key 重建腿即可闭合。

### R2 — 变体 B 测试面：**PASS**

- **pre-fix 真红亲证**：`git show 04c0e5c^:src/keys.ts` —— 旧 `#select` random 分支 = `return keys[Math.floor(rng() * keys.length)]`（有放回）；恒值 rng 下三连发 = `[k1,k1,k1]` ≠ 池排列 → 新断言在现状确实红 ✅；红相算术 9+2=11 与提交信息「红 2 failed|9 passed → 绿 11 passed」吻合 ✅
- **钉牌单发零漂移**：`git show 04c0e5c -- tests/keys.test.ts` 为**纯插入 diff**；既存「random samples inside the split sequence through the injected rng」（现 ：66-71，rng≡0→k1 / rng≈0.999→k2）逐字未动，在升序公式下逻辑存活（0.999 → j=floor(0.999×2)=1 → 首抽 k2）✅
- **重建腿在档**：keys.test.ts:85-92「rebuilds the random deck when the split sequence changes (热改池值)」✅（覆盖面缺口并入 🟡-1）
- 既有 order/round-robin/超限/空池断言零漂移（全量 260 绿佐证）✅

### R3 — GUI 控件通路（controller 面）：**PASS**

- 字段三件：`MemberSectionValue.keySelection`（controller.ts:56-61）、`MemberSnapshot.keySelection`（:84-85）、`deriveSnapshot` 显式默认 `section?.keySelection ?? 'order'`（**:128，非渲染层 ?? 兜底**，符合 D4「explicit > implicit」）✅
- 动作：`setKeySelection`（:226-235）patch `{ [member.key]: { keySelection } }` + revision + 成功后 `#recompute` ✅；断言面：controller.spec:244-256 逐字断言 patch 载荷 `{ ns: 'dsh-websearch', patch: { tavily: { keySelection: 'random' } }, expectedRevision: 0 }`；:258-267 冲突 not-ok 且快照保持 ✅
- fixture helper 补字段为机械 accommodation：`git show 27dd261 --stat` section.spec.tsx 仅 +1 行（section.spec:27 `keySelection: 'order'`），无断言漂移 ✅
- 未配置禁用：section.tsx:429 `disabled={!member.configured}` ✅
- node↔client 默认对称：`resolveConfig` 六成员 `?? 'order'`（config.ts:262/270/277/283/290/299）↔ deriveSnapshot `?? 'order'` ✅

### R4 — 说明 UI + i18n：**PASS**

- 五键在档：locales.ts:38-42（keySelection/keySelOrder/keySelRoundRobin/keySelRandom/keySelectionHint），en :74-78、zh :105-109 ✅
- 两级语义句：zh「多把 key 按「{policy}」选取；**单把失败不换把，直接降级下一成员**」逐字命中 plan D3 模板；en 对应「a failing key is not retried — the next chain member takes over」✅
- 插值在渲染层：section.tsx:435 `t('keySelectionHint').replace('{policy}', t(keySelectionLabelKey(...)))`，模板入字典 ✅；hint 精确断言 section.spec:394-395 ✅
- check:i18n 亲跑 27 keys parity + 17 files 零 CJK exit 0 ✅

### R5 — 门墙七命令：**PASS**（见阶段 4-1 表，七件零偏差，数字逐位命中）

### R6 — 浏览器实物：**PASS**

- 五件证据亲见（ls）：boot.log / tgz / dump-baseline.yml / dump-wired.yml / home 树 + screenshot ✅
- **settings.yaml 实读**：`/tmp/dshws-s13/home/settings.yaml` → `dsh-websearch: { tavily: { enabled: false, keySelection: random } }`——先关开关再切 Random **同存**，deep-merge 兄弟字段存活动坐实 ✅
- **截图目验**（112654 B PNG 1280×720 非空，本验证亲阅）：Tavily 卡 Random [pressed] 高亮 + hint 实时插值 `"Random"` + 开关关；Exa/Perplexity 未配置卡三钮禁用 + 默认 Order hint ✅（六卡渲染另由 section.spec:356 起全 BRANDS 环覆盖）
- **凭据复原实读**：`/tmp/dshws-s13/home/.credentials.yaml` → `refs: {}`（fake 值全清；残留唯一记录为 client-connection/browser-session grant，系宿主自身会话连接密钥，非 provider 凭据，随 scratch 丢弃）✅
- dumps 双件为插件配置面（`--dump-config`），仅 ref **名**（`apiKeyEnv: DEEPSEEK_API_KEY`）与插件 id，零密钥值；diff 显示 wired 侧经 scratch `cordis.patch.yml` 挂载 dsh-websearch ✅
- 隔离口径：boot.log 记 3421 启停命令（内含 token，**本审计不转录**）；现测 3421 free（精确收）；pid 61518 存活且占 3417（常驻实例未被波及的直接旁证）；scratch 全状态（settings/credentials/anonymous-id/profiles）收于 `/tmp/dshws-s13/home/` ✅

## 阶段 5 三问

### 问 1 安全 — **PASS**

- 全仓 tracked 文件高熵/key 形态清扫（tvly-/sk-长串/pplx- 等）：仅 `tests/providers/tavily.test.ts` 显假 mock `tvly-key` 与历史 audit-log 自引清扫模式，零真实 key 形态 ✅
- boot.log token 未入任何仓库文档（session-13/progress-M7 对该串 grep 计数 = 0）；本 audit-log 亦不含 token/密钥/fake 值以外的敏感串 ✅
- scratch 隔离：运行态全部收敛 `/tmp/dshws-s13/home/`（settings.yaml/.credentials.yaml/.anonymous-user-id/profiles/web）；`~/.dsh` 与 3080/3416/3417/61518 本阶段全程零接触 ✅

### 问 2 契约 — **PASS（带 🟡-1）**

- ADR D1 公式/恒等排列 ✅、D2 重建对互异 key ✅（重复 key 平移漏判 = 🟡-1，见 R1）、D3 失败不回牌结构性成立（keys.ts:140 抽牌即消费、无重试环、错误直接链层降级）✅、D4 order/round-robin 零改动 + 成员级顺序降级范围注记在档且 chain 层零 diff ✅
- client 默认 order 与 node resolveConfig 默认**六成员逐一对称** ✅

### 问 3 前瞻 — 移交项两条

- **S15（手册）**：README/upgrade 手册需写明多 key 单槽逗号值 + keySelection 三策略语义，其中 random 须按 **ADR-0012 不放回随机**口径（一轮内每把恰一次、抽尽重洗、热改池值整堆重建、失败不换把直接降级）+ 控件说明（Key selection 三段 segmented、默认 order、未配置禁用、hint 语义）。roadmap S15 行已载「多 key 单槽逗号值」，建议补 ADR-0012 显式指针。
- **S14（溯源徽标/fetch 调研）**：served-by 徽标为**成员级**归因，random 只影响成员内取哪把 key，不改变哪个成员服务——membership-only 口径**无需收紧**；wire 级 loopback「random ∈ 就绪集」断言在不放回语义下依然正确（ADR Consequences 已预记）。仅当 S14 未来要做 key 级归因时才需新决策（需记录实抽 key，超出当前事件面）。
- **🟡-1 归属建议**：一行守卫（keys.ts:166 加 `left === 0`）+ 一条重复 key 重建腿，量级最小；可由 T6 当场补腿清偿（S12b「T5 抓获 🟡 T6 补守卫」先例），或显式移交下一棒 T0，不留悬空。

## 债务清单（正本）

| # | 等级 | 内容 | 证据 | 归属建议 |
|---|---|---|---|---|
| 1 | 🟡 | `#sameMultiset` 重复 key 多重集平移漏判，热改后陈旧牌堆继续服务（无无效 key 泄漏；违背 ADR-0012 D2 与 JSDoc 契约） | 探针实测（rng≡0，`k1,k1,k2`→`k1,k2,k2` 下一抽 `k2`≠重建预期 `k1`）；`src/keys.ts:166`；plan 风险节「同值重复 key 合法」 | T6 补腿或 S14 T0 |
| 2 | 🟢 | STATUS 台账 S13 🚧 行暂夹于 12a/12b 之间（「12a 前 12b 后」字面已成立；过渡态排版） | docs/STATUS.md:48-50 | T7 收官翻账自然消解 |
| 3 | 🟢 | 「失败不回牌」无直接钉牌断言（行为由 keys.ts:140 结构保证；非契约违背） | keys.ts:140 + resolveApiKey 无重试环 | S14/S15 顺手一条测试 |

🔴×0。

---

# 清偿复验（增量，2026-09-04）— 🟡-1 **CONFIRMED**（commit `b08b26e`，HEAD）

- **复核口径**：增量复核（非第二次全量责任点）；四项 = ①diff 逐行 ②红绿签名与判别力 ③测试亲跑 ④🟢 债务维持。
- **① diff 逐行**：3 文件、+18/−2，零夹带——`src/keys.ts` 守卫 `left === undefined` → `left === undefined || left <= 0`（+2 行注释点名重复多重集平移场景与本审计出处）；`tests/keys.test.ts` +14（新用例「rebuilds the random deck when duplicate multiplicities shift」，判别点 = 热改后**立即首抽**断言 k1）；`docs/STATUS.md` 台账行 12a→12b→13 归位（本审计 🟢-2 一并清偿）。
- **② 判别力双推演**：
  - 整周期断言确实掩盖（假绿机理）：旧代码下热改后窗口三抽 = 陈旧尾抽 k2（deckPos=3 耗尽自然触发按新池重洗）+ 重洗后 k1,k2 → 排序 [k1,k2,k2] 恰等于新池多重集 → sorted 断言通过。与执行者「首版整周期断言 12 passed 假绿」吻合。
  - 立即首抽判别力成立：两抽后（deckPos=2）热改，旧代码下一抽 = 陈旧 deck[2] = k2——与本审计阶段 4/5 在 pre-fix 代码上的探针实测（d3=k2）互证；断言期望重建恒等首抽 k1 → 红 `expected 'k2' to be 'k1'`，签名与声称一致。
- **③ 亲跑数字**（node 22.23.2，串行）：`pnpm test` = **261 passed | 9 skipped (270)**（269+1 吻合；keys.test **12 tests** 全绿、apply.test **17** 零漂移）；`pnpm typecheck` 双面 exit 0；`pnpm lint` 0w0e 47 files。另以实际实现复跑判别探针：d3=**k1**（修复前同场景 k2）、d4/d5=k2,k2（整周期 = 新池多重集）；互异 key 重建、同多重集重排不重建两对照零回归。
- **④ 🟢-3 维持**：「失败不回牌」仍无直接钉牌断言（b08b26e 未触及该行为；新用例亦未钉）——处置 🟢 不变，归属建议 S14/S15 顺手一条测试。
- **复验后债务**：🟡×0；🟢×1（原 🟢-3）。债务清单 #1（🟡）、#2（🟢 STATUS 行序）均闭合。
