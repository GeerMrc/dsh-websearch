# Audit Log — S14b 阶段 4/5 独立验证（全量门墙唯一责任点 + R1-R6 对峙 + 三问）

- **参数头**：审核库 v2｜阶段 4/5（全量门墙唯一责任点 + R1-R6 对峙 + 三问 + 牙齿探针）｜对象：Session 14b（DeepSeek 兜底行重构 + 双审计修复，分支 feat/s14b-deepseek-fallback-row @ `319b107`，commit 链 0bfad6c→bc5871b→2294e7c→a3cf96b→a747d59→5eea160→319b107 七枚）｜输入指针：plan 014b 正本 + progress-M7 台账 S14b 段 + /tmp/dshws-s14a 浏览器实物（只读）+ 安装包｜基线：S14a master `1df5507`（273|9(282)、34 keys、client.js 42.09 kB）｜要点转录（本提示词）：①门墙七命令亲跑对照零偏差②R1-R6 逐条对峙（file:line/实测）③安全/契约/前瞻三问④牙齿探针（删 DeepSeekFallbackRow 分流 → 两新用例红 → 完整还原复绿 clean 亲证）｜纪律：除探针外零修改/零 git 写/禁 kill 或重启 3423/3432（用户检验窗实例）；/tmp/dshws-s14a 只读。

- **输出原文**（独立 Agent 逐字落盘，2026-09-06；与执行 Agent 上下文完全隔离）：

---

## ① 门墙数字表（实测 vs 声称，对照 T5/门墙表 S14b 行）

| 门 | 声称 | 实测（亲跑 2026-09-06） | 判定 |
|---|---|---|---|
| ① `pnpm test` | 29 files，277 passed \| 9 skipped (286) | **29 files（28 passed + 1 skipped），277 passed \| 9 skipped (286)**，1.88s | 零偏差 |
| ② `pnpm typecheck` | 双面 0 | `tsc --noEmit && tsc --noEmit -p tsconfig.client.json` **exit 0** | 零偏差 |
| ③ `pnpm lint` | 0w0e 50 files | **0 warnings 0 errors，50 files（96 rules）** | 零偏差 |
| ④ `pnpm build` | index.js 59.78 / index.d.ts 27.04 / client.js 47.47 kB | **59.78 / 27.04 / 47.47 kB** 逐位一致（vs 基线：index.js 59.42→59.78 = 错误文案增量；client.js 42.09→47.47 = 兜底行 + 链块修复；index.d.ts 零漂移） | 零偏差 |
| ⑤ `pnpm pack` | 五件 | **5 files**：cordis.patch.yml + lib/client.js + lib/index.d.ts + lib/index.js + package.json（pack 至 /tmp/dshws-s14b-verify-pack 亲跑） | 零偏差 |
| ⑥ `pnpm check:i18n` | 40 keys + 18 files 零 CJK | **40 keys union/en/zh parity + 18 files zero CJK**，exit 0 | 零偏差 |
| ⑦ `git status` clean | clean | 验证首（门墙前）/中（build+pack 后）/末（探针还原后）**三次 clean 亲证** | 零偏差 |

基线对账：273→277（+4 = fallback 2 + 链块 2）与 34→40 keys（+6）相符。**T5 声称零偏差成立（R5 PASS）。**

## ② R1-R6 逐条结论

- **R1 PASS**。`src/client/section.tsx` 亲读全要素：分流 :247-249（`member.key === 'deepseek'` → DeepSeekFallbackRow）；组件 :390-421——动态状态点 :396/:399（configured → configured/notConfigured 文案 + statusDotStyle 绿/橙）、label :400、共用 badge :401（`sharedWithModels` + `title=sharedWithModelsDetail` 扩句）、**ⓘ Tooltip** :402-406（`fallbackNote`，side=bottom，aria=`fallbackInfo`）、**内嵌付费兜底开关** :408-418（role=switch、aria-label=`${label} ${fallbackSwitch}`、`disabled={!configured}` 未就绪禁用、`onClick → onToggleEnabled(member.key, !enabled)` 绑既有 setEnabled 通路）、**无 key 输入面**（组件签名仅 member/t/onToggleEnabled，不接收 onSaveKey/onClearKey/onSetKeySelection）；底部 fallbackFootnote :263-267（`dshws-fallback-footnote`）。fallbackNote 四点语义逐点核对 locales.ts:103/:147（①接管+官方入口闲置 ②链内第 5 位兜底 ③共用 key 两处后写覆盖 ④无前序可用兜底 + 付费 opt-out）。两新用例亲读：`tests/client/section.spec.tsx:270-288`（行存在 + badge + ⓘ tooltip 内容 + **五重无输入面判别**：apiKey label/group/Save/Clear/keysel-hint 全 query null + footnote）与 `:313-328`（未配置 disabled / 已配置 checked + click 转发 `('deepseek', false)`）；**section.spec 亲跑 29 passed**。
- **R2 PASS**。两用例亲读 + 亲跑（含于 29 passed）：`:290-301` disabled 视觉（textContent 含 chainDisabledNote + **`style.opacity === '0.45'` 直断言** + moveUp 仍可用 + 有 enabled 成员时无预警）；`:303-311` 零可用预警（仅 deepseek configured 但 disabled → `dshws-chain-no-usable` 存在且文本精确等于 chainNoUsableWarning）。红绿推演：去 opacity/标注 → 前两断言红；去预警行 → getByTestId 红；判别力真实（实现 :283-297 视觉 / :321-325 预警 `every(m => !(m.configured && m.enabled))` 亲读）。
- **R3 PASS**。`src/chain/core.ts:196-201` 新文案亲读：`(chain order: ${order.join(', ')})` + 指引句 `enable or configure a member on the dsh-websearch settings page (DeepSeek falls back through the Models-page key)`；JSDoc 同步改写（列的是链序非 configured 集）。新判别 `tests/chain/search-chain.test.ts:150-161`：ghost-a/ghost-b（全未配置）+ 正则 `/chain order: …\); enable or configure a member/`——退回旧 `(configured:` 标签必不匹配。**grep 全仓（ts/tsx/js，排除 node_modules）`(configured:` 命中仅 3 类非残留**：credentials.test.ts:6 与 section.tsx:150/:183（TypeScript 类型注解 `configured: boolean`）+ search-chain.test.ts:156（注释引用旧标签说明历史）——**src 面错误文案旧串零残留**；lib/index.js 构建产物含 "chain order" 亲证。chain+keys+apply+errors 亲跑 **44 passed**。
- **R4 PASS**。`docs/00-architecture.md` 亲读：§6 :100-104 ADR-0013 注记**置顶**（节首 blockquote：随包 patch 装即接管 + remove 单命令复原 + 旧口径历史化声明）；:106 旧口径段落标注「旧口径，2026-09-06 前的形态」保留；:118 卸载半句 + disabled 建议勘注（〔注记：…S15 README 重审〕）；§7 :124 勘注（「二选一启用」表述过时 + S14b 兜底行口径）；§9 :134-150 决策索引 **0001-0013 齐整无缺枚**（stage0 审计口径「0008-0013 六枚全缺」→ 本棒补齐六枚；任务书「八枚」系笔误，实物为准）。台账 `docs/progress/progress-M7.md`：入账超报勘注行 :335（〔勘注 2026-09-06，S14b T4〕🟢×3 vs 两行，时点快照不回改）；新债两笔 :333（宿主闲置设置卡 🟢 → S15 README「已知行为」节）+ :334（architecture 其余陈旧 🟢 → S15）；S14b 段 :169-189 T0-T6 翻账齐。
- **R5 PASS**。见①表，七命令零偏差。
- **R6 PASS（含 🟡-1 截图证据缺口，详④）**。①截图 `/tmp/dshws-s14a/screenshot-s14b-fallback-row.png` **126934 bytes PNG 1280×720 非空亲读（AI 视觉双模型交叉）**——内容为设置页第一屏：标题「网页搜索」+ zh description + Tavily/Exa 完整卡 + Perplexity 半截卡（视口底边截断）；**DeepSeek 兜底行/footnote/链卡在视口之下未入图**；②`boot-verify3.log:2` token 行亲读（`dsh web: http://127.0.0.1:3423/?token=…`，23:21，与截图 23:22 时序吻合）；③**tarball 安装副本** `/tmp/dshws-s14a/home/profiles/web/node_modules/dsh-websearch/lib/client.js` **md5 与 HEAD 构建逐字节一致**（7352c3d6…），40 个 locale 键名全部在产物 + fallback 四键（fallbackSwitch/fallbackInfo/fallbackNote/fallbackFootnote）+ 链块两键在 + zh 专属文案（「付费兜底」「没有已启用的已配置成员」）在；④3423 实例存活亲证（PID 35714 LISTEN；`DSH_HOME=/tmp/dshws-s14a/home` → 加载的正是上述安装副本；进程环境含 DEEPSEEK_API_KEY（redacted 确认存在）→ T6 所述「绿点/switch checked」的 configured 前提与环境事实自洽）；3432 存活（PID 33373）——**两实例全程零触碰**。
- **附加核 PASS**：阶段 0 🟡×4 落点逐项对上（正本 audit-log :21-25）——①architecture 旧口径→T4 注记 :100-104/:106/:118 ✓ ②错误文案→T3 core.ts ✓ ③宿主闲置卡→台账 S15 行 :333 ✓ ④入账超报→勘注行 :335 ✓。**node 面 diff 范围亲证**：`git diff 1df5507..HEAD --stat` src/ 仅三文件（core.ts 10 行 / locales.ts 18 行 / section.tsx 95 行）；`git diff 1df5507..HEAD -- src/chain/core.ts` **纯 JSDoc + 错误文案字符串**（选择门/降级/超时/aborted 传播零改）——「链逻辑/成员注册/凭据通路零改动」成立。

## ③ 三问结论

- **安全**：**GUI 面 deepseek 凭据写通路消失亲证**——DeepSeekFallbackRow 不接收 onSaveKey/onClearKey/onSetKeySelection（section.tsx:390-393 签名），MemberCard（唯一渲染 key 输入/Save/Clear 的组件）经分流 :248-249 永不收到 deepseek；`grep setKey|clearKey` 全 GUI 调用点仅 MemberCard（section.tsx:435/:444/:494）。「共享 ref 逗号池毒化聊天鉴权」的入口在 GUI 已封死。setEnabled 走 settings 远端写 enabled 标志（controller.ts:214-223），不触凭据 ref。**XSS 零新增面**：src/ 无 dangerouslySetInnerHTML/innerHTML/document.write（grep 空）；新 UI 全部为静态 locale 字符串 + ui-primitives Tooltip/Button 组合。注：controller.setKey('deepseek',…) 作为编程 API 仍可达（GUI 不可达）——符合计划「删 key 输入（GUI 面）」口径，硬拒绝属未来可选加固。
- **契约**：**ADR-0004/0013 中立性兼容**——付费 opt-out 通路保留 = 兜底行内嵌开关（fallbackNote 明文 "Turn it off to opt out of paid DeepSeek search entirely" / zh「关闭开关即完全停用付费 DeepSeek 搜索」；switch 绑既有 setEnabled 热闸）；ADR-0004 D3「付费 DeepSeek 末位兜底、开箱零付费副作用」+ ADR-0013「中立性实质不变」与 core.ts 链语义零改（本审 diff 级亲证）共同闭合。**fallbackNote 与 12b note 不矛盾**：sharedWithModelsDetail（12b）"the last save wins" ↔ fallbackNote（S14b）"edits on either side overwrite the other" 同一后写覆盖语义、两处措辞互恰；且 GUI 写点删除后该泛化表述仍正确（模型页/env 等其余写点仍在）。disabled 视觉 + 零可用预警与 chain 现有 config 模型（enabled 为 per-member 热闸）一致。
- **前瞻**：S15 素材在册——新形态语义（fallbackNote 四点 + fallbackFootnote + noMemberConfigured 指引句，均为 README「已知行为」/迁移素材）；遗留债务与台账对齐：progress-M7 :333（宿主闲置卡披露正文）/:334（architecture 其余陈旧）+ plan 债务映射的 S15 清单（README 三悬空/runbook 收口/「第 5 位」措辞勘注）全在册；维持项（🟢×4 + L-2 + 观察 + v2）未动。本审新增：截图补拍（④🟡-1）与 MemberCard 死分支清理（④🟢-1）为 T7/S15 候选。

## ④ 🟡/🟢 新发现（判别式同库 v2）

- **🟡×1（证据链，非实现缺陷）——归档截图未含兜底行本身**：`screenshot-s14b-fallback-row.png`（1280×720 固定视口）经两个独立视觉模型交叉亲读，一致裁定视口仅含 Tavily/Exa 完整卡 + Perplexity 半截卡；**DeepSeek 兜底行、fallbackFootnote、链卡均在首屏之下未入图**。T6 台账（progress-M7:188）声称「亲见：五完整卡 + DeepSeek 兜底行〔绿点+badge+ⓘ+switch checked〕+ footnote + 链卡无预警；截图归档」——声称细节与环境事实自洽（3423 进程环境实有 DEEPSEEK_API_KEY → 绿点前提成立；zh 文案确在安装产物；boot-verify3.log 23:21 与截图 23:22 时序吻合；「五完整卡」的表述本身也说明执行者见过滚动后视口，否则不会区分五卡与截图首屏三卡），**但归档截图这一证据物不构成对兜底行形态的独立证明**。处置建议：T7 收尾补拍一张滚动至 DeepSeek 行的截图归档（3423 实例存活可直接目验，零重启）；不阻塞判定——形态正确性由 29 个 jsdom 用例（含五重无输入面判别）+ 安装副本 md5=HEAD 构建 + 进程环境自洽三重佐证。
- **🟢×4（注记）**：①`src/client/section.tsx:457` MemberCard 残留 `member.key === 'deepseek'` badge 死分支（deepseek 已分流永不入 MemberCard，不可达；对称性残留，S15 清理候选）；②controller.setKey('deepseek',…) 编程 API 仍可达（GUI 已封死，符合计划口径；硬拒绝为可选加固）；③build 出现 tsdown 弃用警告（`external` → `deps.neverBundle`、`inlineDynamicImports` → `codeSplitting: false`）——上游工具演进注记，S15+ 顺带；④任务书 R4「§9 索引 0008-0013 八枚」系笔误：stage0 正本口径为六枚缺（:22「0008-0013 六枚全缺」），实物已补齐六枚、索引 0001-0013 完整。

## ⑤ 牙齿探针（红→完整还原→复绿→clean 亲证）

探针：把 section.tsx:248 分流条件临时改为 `false ?`（deepseek 恢复走 MemberCard 六卡形态，DeepSeekFallbackRow 仍定义但不可达）→ 跑两新用例：**2 failed，失败签名精确**——`Unable to find an element by: [data-testid="dshws-fallback-deepseek"]` + `Unable to find an accessible element with the role "switch" and name "DeepSeek paid fallback"`（证明两用例真实盯兜底行存在性与其专属付费兜底开关语义，非恒真断言）。还原：`git checkout -- src/client/section.tsx` → porcelain 0 → **复跑 section.spec 29 passed** → `git status` clean 亲证。探针前后工作树零残留。

## ⑥ 总判定

**PASS / COMPLETE**（门墙七项零偏差；R1-R5 全 PASS；R6 PASS 含 🟡×1 截图证据缺口——建议 T7 补拍归档，不阻塞；🟡×4 阶段 0 债全落点；node 面范围约束（core.ts 纯文案）diff 级亲证；三问全过；探针红签名 + 还原复绿 clean 闭环。merge `--no-ff` 前置条件满足，收尾时建议一并处置 ④🟡-1 补图与 🟢-1 死分支〔后者可归 S15〕。）
