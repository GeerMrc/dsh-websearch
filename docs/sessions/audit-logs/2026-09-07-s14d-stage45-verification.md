# Audit Log — S14d 阶段 4/5 独立验证（全量门墙 + 六点对峙 + 截图视觉 + 默认翻转探针 + 三问）

- **参数头**：审核库 v2｜阶段 4/5（全量门墙唯一责任点 + 六点对峙 + AI 视觉亲读 + 牙齿探针 + 三问快评）｜对象：Session 14d（兜底二选一默认无兜底 fail-loud + maxUses 10/{N} 同步 + 标题 ⓘ=description + key 输入脱敏，master @ `4a3e315`，执行链 46aeec5(T2-node+client)→f460668(T1+T3+T2-GUI)→d1c31d5(台账)→4a3e315(merge) 四枚亲证）｜输入指针：/tmp/dshws-s14a/screenshot-s14d.png（03:06，只读）+ session-14d 正本 + 仓内源码/测试｜基线：S14c master `4cddb97`（283|9(292)、43 keys、client.js 52.07 kB）｜纪律：除探针（完整还原亲证）与本日志落盘外零修改/零 git 写；3423/3432 用户检验窗实例全程零触碰。
- **输出原文**（独立 Agent 逐字落盘，2026-09-07；与执行 Agent 上下文完全隔离，只认证据）。

---

## ① 门墙数字表（实测 vs 声称）

| 门 | 声称 | 实测（亲跑 2026-09-07 凌晨） | 判定 |
|---|---|---|---|
| ① `pnpm test` | 284 passed \| 9 skipped (293) | **29 files（28 passed + 1 skipped 全 skip 文件 chain.real），284 passed \| 9 skipped (293)**，1.98s | 零偏差 |
| ② `pnpm typecheck` | 0 | `tsc --noEmit && tsc --noEmit -p tsconfig.client.json` **exit 0** | 零偏差 |
| ③ `pnpm lint` | 0w0e 50f | **0 warnings 0 errors，50 files（96 rules，26ms）** | 零偏差 |
| ④ `pnpm build` | 60.95+27.57+53.48 | **index.js 60.95 kB / index.d.ts 27.57 kB / client.js 53.48 kB** 逐位一致（vs S14c 基线：client.js 52.07→53.48 = +1.41 kB，二选一 choice 组 + placeholder/脱敏 + ⓘ 改接 description 的净增） | 零偏差 |
| ⑤ `pnpm pack` | 五件 | **5 files**：cordis.patch.yml + lib/client.js + lib/index.js + lib/index.d.ts + package.json；tarball 内 `cordis.patch.yml` 三条目亲读：`- insert: dsh-websearch` / `- id: web` + `searchProvider: dshws-chain` + `fetchProvider: http` / `- id: web-search-deepseek` + `disabled: true`（pack 至仓内临时目录验证后删除） | 零偏差 |
| ⑥ `pnpm check:i18n` | 48 keys | **48 keys union/en/zh parity + 18 files zero CJK**，exit 0（S14c 43 → 48 净 +5：fallbackChoiceGroup/None/Paid + keyPlaceholder + maskedKey，与 locales.ts:59-63 键联合亲读一致） | 零偏差 |
| ⑦ `git status` clean | clean | 验证首 / pack 后（**本审自遗 tgz 清除后**）/ 探针还原后 clean 亲证（porcelain 空，本日志落盘除外） | 零偏差 |

基线对账：283→284（+1）= controller.spec +1 用例（setDeepseekMaxUses 三合一，S14c 🟡-2 清偿）；43→48 keys、client.js +1.41 kB 与 T5 台账一致。**声称零偏差成立。**

**diff 范围附加核**：`git diff 4cddb97..4a3e315 --stat` = 17 files +329/−72；src 面**恰五文件**（controller.ts 3+/locales.ts 23+/section.tsx 60+/config.ts 4+/providers/deepseek.ts 2−2+）+ 测试四文件 + 文档七件——chain/core.ts、index.ts、settings.ts、keys.ts、websearch-row.tsx、其余五 provider 零触碰，与 plan 014d WBS 对应无越界。

## ② 六点对峙逐条结论

- **R1（enabled 默认 false 双面）PASS**。node 面 `src/config.ts:294-296`：`enabled: config.deepseek?.enabled ?? false` + S14d 注释（opt-in 零付费触达）——diff 亲证 `?? true` → `?? false` 翻转点即此一行；client 面 `src/client/controller.ts:133-134`：`enabled: section?.enabled ?? (member.key === 'deepseek' ? false : true)`（注释 "mirrors node resolveConfig"），五成员默认 on、唯 deepseek 默认 off。**双面锁定**：node `tests/config.test.ts:39` `expect(resolved.deepseek).toEqual({ enabled: false, apiKeyEnv: 'DEEPSEEK_API_KEY', keySelection: 'order' })`（其余五家 :40-43 均 `enabled: true`）；client `tests/client/controller.spec.ts:126-128` 空值派生断言 `member.key === 'deepseek' ? false : true`。apply.test:17 fixture 显式 `deepseek: { enabled: true }`（默认关后测兜底语义需显式开）——适配方向正确。
- **R2（maxUses 默认 10）PASS**。`src/providers/deepseek.ts:59` `export const DEEPSEEK_DEFAULT_MAX_USES = 10`（diff 亲证 `= 5` → `= 10`）；`resolveDeepSeekMemberOptions` :129 `config.maxUses ?? DEEPSEEK_DEFAULT_MAX_USES`；wire :218 `max_uses: this.options.maxUses` 透传。GUI `src/client/section.tsx:359` `const current = value ?? 10` 默认回显 + :388 输入 `value={draft === '' ? String(current) : draft}`。**测试锁**：deepseek.test :92 wire 断言引用常量 `DEEPSEEK_DEFAULT_MAX_USES`（常量翻转断言自动跟，良式）+ :210 `expect(base.maxUses).toBe(10)`；section.spec :506 `getAttribute('value')).toBe('10')`（注释 "S14d default is 10 (user ruling)"）。node resolveConfig :302 透传 `maxUses: config.deepseek?.maxUses`（undefined → provider 边界默认，explicit-defaulting 惯例保持）。**但两处 "(5)" 过时文案未随翻转同步（🟡-A，见⑥）**。
- **R3（hint {N} 实时插值）PASS**。section.tsx:367-369：`const hint = t('maxUsesHint').replace('{N}', String(parsed))`——插值对象是 `parsed`（输入框实时值：draft 空则 current、否则 parseInt(draft)），非 stale 默认（S14d 用户裁定注释亲读）；hint 双通道出口：ⓘ `Tooltip label` :374 + `aria-label` :375。locales.ts:115 `maxUsesHint: 'One request may search at most {N} times before it must answer.'` / zh 对应 `{N}` 位。**测试缺口：{N} 插值零直接断言（🟡-B）**——spec 全文件 grep `maxUsesHint` 零命中。
- **R4（标题 ⓘ=description）PASS**。section.tsx:237-246：`<h3>` 内 `{t('title')}` 后 `Tooltip label={t('description')}` + 按钮 `aria-label={t('description')}` + IconQuestionOutline14，S14d 注释明示「page ⓘ carries the description; the multi-key format moved into each card's input placeholder」。**测试锁**：section.spec:284-294——`queryByText(en.keyFieldNote)` 为 null（旧整段提示退役）+ focus ⓘ 后 tooltip 文本 === `en.description` + blur 消失 + 成员卡子树零 tooltip（页级唯一）。
- **R5（keyPlaceholder {ref} + maskedKey 脱敏）PASS（实现面）/ 测试缺口（🟡-B）**。section.tsx:574 `placeholder={t('keyPlaceholder').replace('{ref}', member.refName)}`（每卡实例化 ref 名）；:575 `value={draft === '' && member.configured && !editing ? t('maskedKey') : draft}`——已配置非编辑态显 `••••••••`；:576-577 `onFocus`（draft 空时 setEditing(true) 开新输入）/`onBlur`（setEditing(false) 还原脱敏）。locales.ts:121-122 `keyPlaceholder: '{ref} — multiple keys: APIKEY1,APIKEY2,… (max 10)'` + `maskedKey: '••••••••'`（zh :对应多 key 格式与圆点）。**测试面**：spec :24-30 `focusKey` 助手注明依赖此行为（"shows the masked value until focused"）供全部 key 用例前置，但**无任何用例直接断言 masked 显示值 / focus 后清空 / blur 还原 / placeholder 内容**——`grep -rn maskedKey|keyPlaceholder tests/` 除助手注释外零命中。
- **R6（兜底 choice 组两段）PASS**。section.tsx:479-502：`role="group" aria-label={t('fallbackChoiceGroup')}` 内两钮——「无兜底」:484 `aria-pressed={!member.enabled}` + :486 `disabled={!member.configured}` + onClick → `onToggleEnabled(member.key, false)`；「DeepSeek 付费」:494 `aria-pressed={member.enabled}` + :496 同禁用条件 + onClick → true；样式 `keySelButtonStyle(pressed, configured)`（S13 既有 choice 视觉语言复用，对称）。locales :118-120 三键（Group/None(fail loud)/Paid）。**测试锁**：section.spec:311 组存在 + :352 未配置双禁用 + :360-363 aria-pressed 两段互补断言；:300-317 兜底行零 key 面（无输入/无 save/clear/无 keySelection 组）+ footnote 已退役断言保持。fallbackNote 文案随 S14d 增补默认语义：「Off by default: web_search fails loud … unless you opt into the paid fallback here.」（locales.ts:111 / zh:163）——S14c 🟡-1「第 5 位」旧口径同笔清偿（现为「恒为链尾，不参与排序」）。

## ③ 截图 AI 视觉亲读（/tmp/dshws-s14a/screenshot-s14d.png，1280×720，03:06）

两轮全图 + 一轮裁剪放大（sips 裁 DeepSeek 行区域）AI 视觉：

- **maxUses=10 回显**：数字输入框显示 **10**，旁有「保存」按钮，标签「单次请求最多搜索次数」——**与 R2 一致亲见**。
- **ⓘ 图标**：maxUses 标签旁 ⓘ 可见；页标题旁 ⓘ 可见（tooltip 属 hover 态，静态截图不可展开——DOM 层由 spec:284-294 断言背书）。
- **choice 组两段**：DeepSeek 行右侧两枚小按钮，文本 OCR 两轮分别读作「无完成/无充值」（小字号中文 OCR 不稳）与「DeepSeek 付费」（两轮一致读对）——两段结构存在亲证；行首状态点**实心绿**（configured）+ badge「共用模型 Key」两轮一致。
- **pressed 态视觉不可辨（🟢-1）**：放大裁剪后 AI 报两按钮「visually similar in brightness」「inferred from text content」——`keySelButtonStyle` 的 pressed 对比（border l3/l2 + bg-layer-1/transparent + secondary/tertiary 文字）在深色主题下差异低于 AI 视觉分辨阈。**语义正确性不受影响**：aria-pressed 有断言（R6），且截图生成态为 scratch 显式 `enabled: true`（session-14d:19 自述「显示付费 pressed=兼容子句实证」）——付费 pressed 是该截图的预期态，AI 第一轮直觉读「DeepSeek 付费 appears selected」与之相符。判为可用性观察非缺陷。
- 脱敏 •••••••• 输入面：截图视角未展开成员卡（S14c 折叠默认），不可见——合理，非缺陷。

## ④ 牙齿探针（client 默认 false 有牙亲证）

1. **注入**：`src/client/controller.ts:134` 反改为 `enabled: section?.enabled ?? true`（模拟 S14d 前全成员默认 on）。
2. **红**：`npx vitest run tests/client/controller.spec.ts` → **1 failed | 20 passed**——精确命中 `init derives client defaults from an empty section value`：`AssertionError: expected true to be false` @ controller.spec.ts:128:30（即 deepseek 默认断言行）。判别力真实。
3. **还原**：Edit 逐字恢复原行 → `git diff` 空输出。
4. **复绿**：复跑 → **21 passed**。
5. **clean**：`git status --porcelain` 空（本日志除外）。

（node 面 `?? false` 的对称探针不重复执行：config.test:39 的 `toEqual({ enabled: false, … })` 为整对象字面断言，翻转必红，判别力由 client 面同构探针 + 该字面断言性质共同背书。）

## ⑤ 三问快评

- **安全（默认翻转的付费触达面）**：**双面 opt-in 闭合**——node resolveConfig（config.ts:296）与 client deriveSnapshot（controller.ts:134）默认 false，探针证明 client 面有牙、node 面有整对象字面断言；安装即零付费触达成立（patch 第三条目官方退役 disabled: true 依旧）。fail-loud 语义进用户可见文案（fallbackNote 尾句）。maxUses 输入整数校验三面（GUI/controller/schema）S14c 已验、S14d 仅改默认值未动链路；脱敏 maskedKey 仅显示层（value 投影），真实凭据不进 DOM draft——`type="password"` + masked 投影双层。无新增攻击面。
- **契约（node/client 镜像 + ADR 挂账）**：controller 注释明示 "mirrors node resolveConfig"，双面翻转同 commit（46aeec5）落地，镜像对称成立。48 keys parity exit 0。**ADR-0004/0013 的 D3/D6「付费优先实质不变」口径已被 S14d 事实翻转**（默认从「付费兜底在链尾」变为「无兜底，付费 opt-in」），两 ADR 现无 S14d 注记（grep 亲证，D6 最新注记停在 S14c）——session-14d:16/29 已显式挂账「注记归 S15 文档批」，属登记在案债务非隐瞒（🟡-C）。
- **前瞻（S15 素材）**：plan 014d 收官段 + session-14d :29-32 已列 S15 承接项（ADR-0004/0013 默认翻转注记、README 二选一语义/官方退役说明、3423/3432 收口待示意）。本审新增 🟡-A（两处 "(5)" 过时文案）与 🟡-B（三个新 GUI 行为零直接断言）建议随 S15 或下一棒顺手清偿；🟢-2（client 侧 `?? 10` 平行字面量）建议提为命名常量防单边漂移。S14c 双 🟡 均已清偿（fallbackNote 口径 + setDeepseekMaxUses 专测 :359-374），清账纪律良好。

## ⑥ 🟡/🟢 新发现（判别式同库 v2）

- **🟡-A（过时文案 ×2，同类，非阻塞）**：46aeec5 将默认 5→10 时两处 "(5)" 漏改——`src/client/controller.ts:105` JSDoc「`undefined` = provider default (5)」（实为 10）；`tests/providers/deepseek.test.ts:205` 用例标题 "defaults to 5 and flows a configured value…"（断言 :210 已是 `toBe(10)`，标题误导）。零功能影响（注释/标题层），AGENTS.md 要求 JSDoc 状态完整契约——建议下一棒顺手改 "(10)" 与 "defaults to 10"。
- **🟡-B（测试缺口，非阻塞）**：S14d 三个新 GUI 行为**零直接断言**——①maskedKey 脱敏显示/focus→editing/blur→还原（section.tsx:575-577）：spec 仅有 `focusKey` 流程助手（:24-30）间接依赖「focus 后才可输入」，无 masked 值渲染断言，删掉 :575 三元式测试仍全绿；②maxUsesHint {N} 实时插值（:369）：grep `maxUsesHint` tests/ 零命中，插值被破坏（如 replace 漏调）无守卫；③keyPlaceholder {ref} 插值（:574）：placeholder 内容零断言。缓解：行为局部简单 + locales 键有 parity 校验 + T5 截图人工亲见。建议补 2-3 用例（masked 显示→focus 清空→blur 还原；改输入后 hint 文本含新值；placeholder 含 refName 与多 key 格式）。
- **🟡-C（ADR 挂账确认，非阻塞、已登记）**：ADR-0004/0013 无 S14d 默认翻转注记，D6「付费优先实质不变」表述过时——session-14d 已显式归属 S15 文档批，本审仅确认挂账在案（非新债）。
- **🟢-1（可用性观察）**：choice pressed 视觉对比（border l3/l2 + bg-layer-1/transparent）深色主题下低于 AI 视觉分辨阈（裁剪放大三轮亲试）；语义由 aria-pressed 断言背书。若后续有用户反馈「看不出选中哪段」，可考虑 pressed 加 accent 边框——现状沿用 S13 key-selection 既有视觉语言，对称性优先，可接受。
- **🟢-2（平行字面量备注）**：section.tsx:359 `value ?? 10` 与 provider `DEEPSEEK_DEFAULT_MAX_USES = 10` 为平行字面量（client bundle 不依赖 node 面，边界使然）；本次 46aeec5 双改同步无漂移。建议 client 侧提为命名常量（如 `DEFAULT_MAX_USES`）并注释指向 provider 常量，防未来单边改。
- **🟢-3（台账正面核）**：session-14d 门墙行 284|9(293)/48 keys/53.48 kB 与本审①表逐位相同；S14c 双 🟡（fallbackNote 旧口径 + setDeepseekMaxUses 零专测）均在本批清偿亲证；「执行期一次带红提交当场 amend」红线自曝符合治理纪律。

## 总判定

**PASS / COMPLETE**——门墙七项零偏差、六点对峙全部实现面 PASS（R5 含测试缺口披露）、探针红→还原→复绿→clean 闭环、三问无阻塞项；新发现 🟡-A/B/C + 🟢×3 均非阻塞，S15 素材与清偿建议已列。
