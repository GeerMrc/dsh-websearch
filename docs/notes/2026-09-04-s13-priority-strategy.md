# S13 实录：优先级策略棒（ADR-0012 变体 B + keySelection 控件 + 调用顺序说明）（2026-09-04）

> Session 13（feat/s13-priority-strategy）技术实录。两级调用逻辑表在 12b 正本
> （docs/notes/2026-09-04-s12b-page-info-deepseek.md）基础上更新 random 行；S15 手册
> 引用本表。计划：docs/plans/2026-09-04-013-s13-priority-strategy-plan.md。

## ADR-0012 定谳：key 级 random = 不放回随机（洗牌牌堆）

| 策略 | 语义（ADR-0012 后） | 默认 | 配置入口 |
|---|---|---|---|
| order | 恒取第一把，失败不换把 | **默认** | 成员卡控件（S13 新增）/ settings `keySelection` |
| round-robin | 逐请求游标轮换 k1→k2→k3→k1（固定序） | — | 同上 |
| random | **不放回随机**：洗牌牌堆逐张抽，一轮内每把恰一次；抽尽按升序 Fisher-Yates 重洗（`j = i + floor(rng() × (n − i))`，rng≡0↔恒等排列）；拆分序列与牌堆多重集不一致即重建（热改逗号值后下一请求重洗）；失败消耗本次抽牌不回牌 | — | 同上 |

- **成员级（跨工具）不变**：顺序降级（ADR-0002/0004 正本）——本 ADR 只作用于 key 级。
- **升序公式取点**：rng≡0 → 恒等排列，既存钉牌单发断言（tests/keys.test.ts:66-71）
  零漂移——阶段 2 审核必改 M1 钉死（降序教科书公式会翻两条）。
- 牙齿：keys.test 新断言「恒值 rng 三连发 = 池排列」（现状有放回基线 [k1,k1,k1] 真红）
  +「热改池值重建腿」。红 2 failed\|9 passed → 绿 11 passed。

## GUI：成员卡 keySelection 控件 + hint

- 控件行（输入行与 footer 之间）：`role="group"`（aria-label = 成员名 + Key 策略）+
  三段 segmented button（aria-pressed 标当前项、data-testid `dshws-keysel-<key>-<policy>`、
  成员前缀 aria-label 防 identical-buttons 歧义〔S06 教训〕、未配置禁用 + opacity 0.4
  同 switch 惯例、pressed 视觉 = bg-layer-1 + border-l3〔Input wrapper 先例 token〕）。
- hint 行（控件行下，12px 三级字色）：`keySelectionHint` 模板插值当前策略名——
  zh「多把 key 按「{policy}」选取；单把失败不换把，直接降级下一成员。」两级语义在
  成员卡就地可见；页头 intro（跨工具降级句）与链卡 hint（默认序）不重复（12a/12b
  收敛面防文案回流）。
- patch 形态 `{ <member>: { keySelection } }`：宿主 mergeLayers 对 plain object 深合并
  （packages/settings/settings/src/index.ts:284-292），同成员兄弟字段（enabled/apiKeyEnv）
  不受影响——T5 浏览器棒实测兑现。

## 坑

- **Section 解构漏新 prop**：`WebSearchSettingsSection` 解构元组漏 `onSetKeySelection`
  ——六卡渲染即 ReferenceError，jsdom 批红 25 failed 当场暴露（非静默假绿；与「原语
  wrapper 假绿」家族对照：wrapper 假绿是断言过松，本次是渲染硬错）。新增 prop 时
  解构/传递/Props 三处逐一核对。
- **后台 webview locator click 不派发**：IAB 面板可见但后台态下，Playwright locator
  click 对快照可见元素两次超时（actionability 不过）；`dom_cua.click` 返回成功但无
  效果（假成功）。**可靠通路 = `cua.click` 坐标点击**（截图定位）。与 12b「后台态
  focus() 不生效（focusin 冒泡触发）」同族——后台 webview 的输入派发面整体不可信，
  逐动作以「预期效果出现」判定而非调用成功。
- **门墙表锚点**：progress 门墙表按棒分行（S09/S10、S11、12b 各占一行），编辑时
  锚串必须含中间行——「头部 + 目标行」连续匹配会失败。
