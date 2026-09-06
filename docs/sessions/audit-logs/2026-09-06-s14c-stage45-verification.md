# Audit Log — S14c 阶段 4/5 独立验证（全量门墙唯一责任点 + R1-R7 对峙 + 三问 + 探针）

- **参数头**：审核库 v2｜阶段 4/5（全量门墙唯一责任点 + R1-R7 对峙 + 安全/契约/前瞻三问 + 牙齿探针）｜对象：Session 14c（全局置顶 + 折叠区 + DeepSeek 恒链尾 + maxUses + 官方入口随包退役，分支 feat/s14c-chain-top-fallback-tail @ `4cddb97`，执行链 e8112b3(T0)→f5376ae(T2)→b031bf2(T4n amend)→fe31b94(T1/T3/T4g amend)→69e32c5(T4b)→3903bf1(T5 amend)→4cddb97(台账) 七枚亲证）｜输入指针：plan 014c 正本 + progress-M7 台账 S14c 段 + /tmp/dshws-s14a 双截图与 boot-verify4.log + /tmp/dshws-s14c/ 三 dump（均只读）｜基线：S14b master `101b1c0`（277|9(282)、40 keys、client.js 47.47 kB）｜要点转录（本提示词）：①门墙七命令亲跑对照零偏差②R1-R7 逐条对峙（file:line/实测）③三问④牙齿探针（withFallbackTail 反改不过滤直接 concat → config.test 红 → git checkout 完整还原复绿 clean 亲证）｜纪律：除探针外零修改/零 git 写；禁 kill/重启 3423/3432（用户检验窗实例）；/tmp 只读。

- **输出原文**（独立 Agent 逐字落盘，2026-09-06；与执行 Agent 上下文完全隔离，只认证据）：

---

## ① 门墙数字表（实测 vs 声称，对照 T5/门墙表 S14c 行）

| 门 | 声称 | 实测（亲跑 2026-09-06/09-07 夜） | 判定 |
|---|---|---|---|
| ① `pnpm test` | 29 files，283 passed \| 9 skipped (292) | **29 files（28 passed + 1 skipped 全 skip 文件 chain.real），283 passed \| 9 skipped (292)**，2.09s（9 skipped = e2e.real 六文件 8 + chain.real 整文件 2→实际按例计 9；vite 对第三方包 sourcemap 的 ENOENT 警告非本项目错误） | 零偏差 |
| ② `pnpm typecheck` | 双面 0 | `tsc --noEmit && tsc --noEmit -p tsconfig.client.json` **exit 0** | 零偏差 |
| ③ `pnpm lint` | 0w0e 50 files | **0 warnings 0 errors，50 files（96 rules，25ms）** | 零偏差 |
| ④ `pnpm build` | index.js 60.95 / index.d.ts 27.57 / client.js 52.07 kB | **60.95 / 27.57 / 52.07 kB** 逐位一致（vs 基线 59.78/27.04/47.47：index.js +1.17 = 恒尾过滤 + maxUses 链；client.js +4.60 = 布局重排 + 折叠 + MaxUsesRow；index.d.ts +0.53 = `DeepSeekSettings.maxUses` 等公共类型） | 零偏差 |
| ⑤ `pnpm pack` | 五件 + patch 三条目 | **5 files**：cordis.patch.yml + lib/client.js + lib/index.d.ts + lib/index.js + package.json；tarball 内 `cordis.patch.yml` **三条目亲读**：`- insert: dsh-websearch` / `- id: web` + `searchProvider: dshws-chain` + `fetchProvider: http` / `- id: web-search-deepseek` + `disabled: true`（pack 至仓内临时目录验证后删除，未触 /tmp） | 零偏差 |
| ⑥ `pnpm check:i18n` | 43 keys + 18 files | **43 keys union/en/zh parity + 18 files zero CJK**，exit 0；node 计数 en=43 / zh=43 复核 | 零偏差 |
| ⑦ `git status` clean | clean | 验证首 / build+pack 后 / 探针还原后**三次 clean 亲证**（porcelain 空） | 零偏差 |

基线对账：277→283（+6）与 40→43 keys（-footnote +4）相符，与 T5 台账拆解（settings 适配 + patch 守卫 1 + provider 1 + section 4-3 改写）一致。**T5 声称零偏差成立（R5 PASS）。**

**diff 范围附加核**：`git diff 101b1c0..HEAD --stat` = 21 files +545/−88；src 面**恰五文件**（config.ts 45+/controller.ts 31+/locales.ts 15+/section.tsx 140+/providers/deepseek.ts 13+）+ cordis.patch.yml +2（第三条目）——chain/core.ts、index.ts、settings.ts、keys.ts、websearch-row.tsx、其余五 provider **零触碰**，与 plan 014c WBS 逐项对应无越界。

## ② R1-R7 逐条结论

- **R1 PASS**。`src/client/section.tsx` 亲读全要素：
  - **全局卡置顶恒显**：`<section data-testid="dshws-chains">` :253-318 渲染于 `<div data-testid="dshws-members">` :319 **之前**（DOM 序）；卡内含 ChainStateBadge :256（默认序/钉死态）+ chainDefaultHint + `ORDERABLE_LABELS.join(' → ')` :259（:343 = `MEMBERS.filter(≠deepseek)` **五家**）+ **chainTailHint** :261 + 排序行 :262-307（`showChains` 门控：至少一成员 configured）+ 零可用预警 :308-312 + **超时行** :313-315（`{t('timeout')}: {snapshot.timeoutMs} ms`）+ **MaxUsesRow** :316——排序行受配置门控、hint/超时/maxUses 恒显（S14c 改判 12a 反馈④，spec :163-171 断言「无成员配置时全局卡仍在、排序行隐藏」）。
  - **五卡折叠默认收起**：MemberCard :519 `useState(false)`；头部 :523-548 恒显（状态点/名/展开钮 `data-testid="dshws-member-toggle-<key>"` + `aria-expanded`/开关）；展开体 :549-608 `{open ? (<> … </>) : null}` **fragment**（key 输入 + 策略组 + hint + footer 保存/清除）。
  - **兜底行最末（filter 分流）**：:321 `snapshot.members.filter(≠deepseek).map(MemberCard)` → :332-336 `filter(==deepseek).map(DeepSeekFallbackRow)`——deepseek 恒为 members 容器最后一个子元素。
  - **footnote 删除**：`grep -rn fallbackFootnote src tests docs/plans` → src **零残留**（仅 section.spec:310 `queryByTestId('dshws-fallback-footnote')` 为 **null 断言** + plan 014b 历史文档）；`DshWsLocaleKey` 键联合（locales.ts:17-60）无 fallbackFootnote。
  - **四新用例亲读**（section.spec，本审亲跑 33 passed）：:484-493 全局卡置顶（`compareDocumentPosition & DOCUMENT_POSITION_FOLLOWING` DOM 序断言 + `maxUsesLabel` 输入 `value='5'` 默认回显）；:495-509 默认收起三重 null（apiKey/group/Save）+ expand 后三重 truthy（**多 key 面零损失**）+ 头部恒交互；:511-517 兜底行最末（6 子元素，末位 `dshws-fallback-deepseek`）；:519-526 `onSetMaxUses(3)` 转发。改写用例：:401-419 过滤尾 = Firecrawl（DeepSeek 非行）。
- **R2 PASS**。`src/config.ts` 亲读：:16-22 `ORDERABLE_SEARCH_MEMBER_ORDER` **五家**（t,e,p,f,a）；:29 `DEEPSEEK_FALLBACK_MEMBER_ID`；:38-41 `withFallbackTail` = filter(deepseek) + 尾拼；:36 `BUILT_IN_MEMBER_ORDER` = [...五家, deepseek] = **t,e,p,f,a,d**（DeepSeek 从 anysearch 前〔S14b 序 t,e,p,f,d,a 第 5 位〕让位到**绝对末位**）。resolveConfig :286-291：searchChain 恒经 withFallbackTail（老钉死序含 deepseek 自动过滤迁移）；fetchChain 显式 `.filter(≠deepseek)`（DeepSeek 非 fetch 成员）。**测试新不变量亲读**：config.test :5-17（BUILT_IN 六序 + fetch 五家）+ :19-24（`['deepseek','not-registered-yet']` → `['not-registered-yet','deepseek']` 过滤重拼）；apply.test :175-183（钉死 deepseek 首 → 全员 500 错误摘要 walk 序仍 tavily→deepseek，**deepseek 不可前置**行为变更注记）；settings.test :47-54（setSource 老序）/ :56-68（refresh）/ :70-77（fetchChain 排除 deepseek）/ :117-122（hooks 单元素链）/ :126-149（真实 seam：attach 老序 doc → 过滤重拼 / commit exa → 尾拼 / detach 回落 entry）。**ADR 注记互指闭环**：ADR-0004 Status 注记 :15（→ 正本见 ADR-0013；D3 链中立性实质不变——DeepSeek 末位兜底）↔ ADR-0013 :14-15 amend 声明（三 ADR 注记互指）+ **D6 S14c 注记 :65-66**（「D3 表述随 S14c 改判为『五家排序域 + DeepSeek 固定链尾兜底』，付费优先实质不变」）。**controller 镜像**：controller.ts :52 `ORDERABLE_MEMBER_IDS`（filter deepseek）+ :143 searchChain 显式序 `.filter(≠DEEPSEEK_MEMBER_ID)`；controller.spec :132-140 默认五家断言（S14c 注记「mirrors the node half」）。
- **R3 PASS**。spec :495-509（见 R1：默认收起断言 + expand 后多 key 面零损失 + 折叠态头部交互保留）；entry.spec :133-134 存量保存用例**改写先展开**（`fireEvent.click(getByTestId('dshws-member-toggle-tavily'))` 前置）；section.spec 全文件 11 处 `expand()` 前置适配（grep 计数亲证）。
- **R4 PASS**。**全链亲读**：config.ts :61-65（`DeepSeekSettings.maxUses?` JSDoc——S14c host parity 同名同义 + Launch-static D6 纪律）+ :171（schema `z.number().step(1).min(1)` 整数校验）+ :215-216（`DeepSeekMemberConfig.maxUses`）+ :300（resolveConfig 透传）；provider：deepseek.ts :59 `DEEPSEEK_DEFAULT_MAX_USES = 5`（:111 JSDoc "was the `DEEPSEEK_MAX_USES` constant" 替换亲证）+ :129（resolve 默认注入 options.maxUses）+ **:218 wire `max_uses: this.options.maxUses` 透传**；测试：deepseek.test :92（wire 断言 `max_uses: DEEPSEEK_DEFAULT_MAX_USES`）+ :204-216（S14c host parity describe：默认 5 / 配置 2 双断言）。**GUI**：MaxUsesRow（section.tsx :349-400）——:357 `current = value ?? 5` **默认 5 回显** / :359 `Number.isInteger(parsed) && parsed >= 1` **整数校验**（非法禁保存）/:355-364 staged draft + 成功清 draft / :369-373 ⓘ maxUsesHint；绑定 :56 `onSetMaxUses → controller.setDeepseekMaxUses`；controller :252-260 整数拒绝 + `updateSettings(NS, { deepseek: { maxUses } }, revision)` **深合并 patch**（deepseek 成员键下，兄弟字段保留）；section.spec :519-526 转发断言。
- **R5 PASS**。见①表，七命令零偏差。
- **R6 PASS**。①`/tmp/dshws-s14a/screenshot-s14c-global-top.png`（136789 bytes，02:21）**AI 视觉亲读**：全局卡置顶——搜索链徽标「内置默认序」+ 链说明 **Tavily → Exa → Perplexity → Firecrawl → AnySearch** + 尾注「DeepSeek 恒为链尾兜底，不参与排序」+ 「单成员超时: 30000 ms」+ **「单次请求最多搜索次数」数字输入 = 5 + 保存按钮** + ⓘ；**五卡折叠**（仅头部状态点/名/▾/开关，无 key 输入面）；**DeepSeek 兜底行最末**（绿点 + 「共用模型 Key」badge + ⓘ + 开关绿 ON）；侧栏 5 节（通用设置/模型/插件/网页搜索/Agent 预设）。②`screenshot-s14c-official-retired.png`（95698 bytes，02:22）**AI 视觉亲读**：插件列表主面板**恰 4 卡**（终端/Agent 循环/Subagent/预览面板）——**无「网页搜索」官方卡**（对照台账「原第 4 位」消失，R7 浏览器腿）。③`boot-verify4.log` 亲读：`dsh web: http://127.0.0.1:3423/?token=qiqIs75diysPyw-y9vYTwQLZbHDYcUFugP6LgZHSygA`（02:20，与双截图 02:21/02:22 时序吻合；3423/3432 全程零触碰）。
- **R7 PASS**。①cordis.patch.yml 三条目（tarball 内亲读，见①-⑤）+ patch.test :34-42 守卫亲读：`- id: web-search-deepseek` 存在 + 正则 `- id: web-search-deepseek\n\s+disabled: true`（行级 disabled）+ `not.toMatch(/- id: web-fetch-http/)`（**不误伤 fetch 行**）；本审亲跑 patch.test **4 passed**。②`/tmp/dshws-s14c/` 三 dump 亲读：**dump-installed.yml :349-358**——web 行 `searchProvider: dshws-chain` + `fetchProvider: http`，**web-search-deepseek 行 `disabled: true` 亲证**（provider 注销 + 设置卡消失的派生态根源）；dump-baseline.yml :348-356（`deepseek-official`、官方行无 disabled 基线态）；**`diff dump-baseline.yml dump-restored.yml` 零输出**（remove 单命令完整复原）。③ADR-0013 **Decision 7** :67-70 在档（随包退役三效果 + 卸载自动复原 + 本插件链不依赖官方 provider）+ Consequences :111-113 边界披露（见③安全问）。

## ③ 三问结论

- **安全**：**maxUses 输入整数校验三面闭合**——GUI（section.tsx:359 `Number.isInteger && >=1`，非法禁保存）/ controller（:253 非整数或 <1 → `{ok:false}` 拒绝）/ schema（config.ts:171 `z.number().step(1).min(1)`，YAML 面拒绝）；三层独立，GUI 绕过（编程 API）仍有 controller+schema 兜底。**官方退役的用户层钉死边界在档**：ADR-0013 Consequences :111-113 明文「用户层另行钉 `searchProvider: deepseek-official` 会 CONFIGURED_MISSING 硬错（文档化）；web-fetch-http 行不受影响」。凭据面：maxUses 走 settings patch 不触 credential ref；官方退役消灭宿主设置卡 `DEEPSEEK_API_KEY` 单写点（D5 披露，After-模型页/env 仍在，语义为「单写点收敛」非「写点清零」——fallbackNote/sharedWithModelsDetail 两处覆盖措辞仍准确）。
- **契约**：**恒尾语义与 ADR-0004 D3 改判一致**：ADR-0004 Status 注记（:15，D3 实质不变 + 正本互指 ADR-0013）+ ADR-0013 D6 S14c 注记（:65-66「五家排序域 + DeepSeek 固定链尾兜底」）+ 付费优先实质不变（opt-out 开关仍在兜底行）——闭环。**BUILT_IN 派生态 t,e,p,f,a,d 行为变更披露在案**：ADR-0013 D6 注记 + f5376ae 提交信息（「DeepSeek 让位 anysearch 之后为绝对兜底」）+ apply.test:175-178 / config.test:21-23 测试注释（"deepseek left the orderable domain"）——**但用户可见文案 fallbackNote 的「第 5 位」未随改判（🟡-1，见④）**。**43 keys parity**：check-locales exit 0 + locales.spec zh/en 键集排序相等断言 + node 计数 43/43 复核（-fallbackFootnote +maxUsesLabel/maxUsesHint/chainTailHint/configure 净 +3，加 40 = 43）。
- **前瞻**：**S15 素材在档**——plan 014c 债务归属 :52-53（README 含**官方退役说明 + 手动复原法** / 闲置卡措辞更新〔闲置→已退役〕/ architecture 其余陈旧）+ progress-M7 :26（S15 正素材清单含 ADR-0013 装即接管/退役）；**台账对齐**：progress-M7 S14c 批次 :169-186 T0-T6 翻账与执行链七枚/门墙数字逐项一致，T7 待执行（本审计为其输入）；STATUS 活跃债务 🟢×4（fetch 排序/恢复默认/anysearch fetch 面/CSS module 化）与 S14b 口径一致——**badge 死分支已 T1 顺手清偿出列**（section.tsx 现 MemberCard 无 badge 分支，grep 亲证），列表正确。

## ④ 🟡/🟢 新发现（判别式同库 v2）

- **🟡-1（文案矛盾，非阻塞）**：`fallbackNote` 位置括注未随 S14c 链序改判更新——locales.ts:106（en "(5th in the built-in order)"）/ :153（zh「内置序第 5 位」）。该文案为 S14b 时期产物（当时 `BUILT_IN_MEMBER_ORDER = t,e,p,f,d,a`，`git show 101b1c0:src/config.ts` 亲证 deepseek 第 5 位，措辞准确）；S14c 改判后 BUILT_IN = t,e,p,f,a,d（deepseek **第 6 位绝对末位**），同屏新增 chainTailHint（「恒为链尾兜底，不参与排序」）与 ADR-0013 D6 注记均新口径，唯此括注停留旧序——**同屏两套位置口径自相矛盾**。零功能影响（纯说明文案）。建议下一棒/S15 改「恒为链尾兜底」（删位置数字）或「链尾末位」。
- **🟡-2（测试缺口，非阻塞）**：`controller.setDeepseekMaxUses` **零专测**——controller.spec 20 用例 grep `maxUses|MaxUses|deepseekMaxUses` 零命中：整数校验拒绝路径（controller.ts:253）、updateSettings patch 载荷 `{ deepseek: { maxUses } }`、revision 透传、`deepseekMaxUses` 快照回读均无断言；GUI 面 section.spec:519-526 仅覆盖 props 转发（onSetMaxUses mock）。缓解事实：实现仅 9 行 + typed 同进程边界 + node 面 schema/provider/wire 有测试。建议补 3 用例（成功 patch 载荷 / 校验拒绝 not-ok / init 回读快照）。
- **🟢-1（镜像对称备注）**：controller `deriveSnapshot` 对**显式** fetchChain 不过滤 deepseek（:145 原样保留，仅默认值用五家 :144），node `resolveConfig` 显式 fetchChain 过滤（config.ts:290）——两半不对称。UI 已不渲染 fetch 链（12a 移除 fetch block，section.spec:155 断言），零用户可见影响；建议随 🟡-2 补测时一并对齐或注记（fetchChain 快照现为死字段候选）。
- **🟢-2（S15 归档确认）**：00-architecture §6 注记（:100-104，S14a 口径「官方 provider 闲置」语义仍隐含在位）与 §9 索引 ADR-0013 行（:150，未提 D7 官方退役）未涵盖 S14c 退役——已在 S15 债务（「architecture 其余陈旧」）射程内，S15 更新需带「闲置→已退役」口径（与 plan 债务归属「闲置卡措辞更新」同源）。
- **🟢-3（台账正面核）**：STATUS 活跃债务 🟢×4 与 progress/plan 口径三处一致；S14c 批次 T5 门墙行数字与本审①表逐位相同；session-14c 骨架「T7 补全」占位符合治理流程（本审计即 T6.5/T7 前置输入）。

## ⑤ 牙齿探针（withFallbackTail 有牙亲证）

1. **注入**：`src/config.ts` `withFallbackTail` 反改为 `return [...chain, DEEPSEEK_FALLBACK_MEMBER_ID]`（去掉 filter——模拟老序 deepseek 中间位存活 + 双写尾）。
2. **红**：`npx vitest run tests/config.test.ts` → **1 failed | 13 passed**——精确命中「老序过滤」新不变量用例 `keeps an explicit chain verbatim, tolerating member ids that are not registered yet`：`AssertionError: expected [ 'dshws-deepseek', …(2) ] to deeply equal [ 'dshws-not-registered-yet', …(1) ]`（老序 deepseek 首位存活 + 尾部重复 = 判别力真实）。
3. **还原**：`git checkout -- src/config.ts` → **shasum-256 `6597365d…b6dd2` 与探针前逐字节一致**。
4. **复绿**：复跑 config.test → **14 passed**。
5. **clean**：`git status --porcelain` 空输出亲证（本 audit log 落盘除外，属授权交付物）。

## ⑥ 总判定

**PASS / COMPLETE**——R1-R7 七条全 PASS（file:line/实测/AI 视觉/dump 四类证据齐）；门墙七命令亲跑零偏差；三问全过（安全三面校验闭合 + CONFIGURED_MISSING 边界在档 / 契约注记互指闭环 + parity 43/43 / 前瞻 S15 素材与台账对齐）；牙齿探针红签名精确→还原→复绿→clean 闭环；执行链七枚逐枚核对与任务书一致；diff 范围无越界。🟡×2（fallbackNote 位置文案过时 / setDeepseekMaxUses 零专测）均非阻塞，归 T7 收尾裁量或 S15；🟢×3 备注在档。放行 T7 收尾（session-14c 补全 + STATUS/roadmap/CHANGELOG + merge `--no-ff` + 接力指令）。
