# Plan — 2026-09-06-014c-s14c-global-top-tools-collapse

> plan 是验收契约。本棒 = **S14c 插行棒：全局置顶 + 工具折叠区 + DeepSeek 恒链尾兜底
> + maxUses 配置化 + 官方入口随包退役**。用户四轮反馈 + 五决策点全部确认（AskUserQuestion
> ×4 获答 + ExitPlanMode 批准）。分支 `feat/s14c-chain-top-fallback-tail`。

## 最终布局

页头（标题+ⓘ+description）→ **顶部全局区恒显**（搜索链五家排序↑↓+默认序/钉死态+hint
「DeepSeek 恒为链尾兜底，不参与排序」+ 单成员超时 + 单次请求最多搜索次数〔maxUses，
宿主同款 label，hint 作用于 DeepSeek 兜底后端〕）→ **五卡折叠区**（头部：状态点+名+
开关；展开：key 输入+策略组+保存/清除；默认全收起；多 key 实现零损失）→ **DeepSeek
兜底行最末**（纯头部不可折叠：状态点+badge+ⓘ+付费兜底开关）→ 底部说明行删除。

## 决策（D1-D7，均用户确认）

- D1 顶部全局区恒显不可折叠；D2 折叠仅五卡、默认全收起；D3 **语义层恒链尾**（node：
  ORDERABLE 五家 + deepseek 恒拼尾 + 老钉死序过滤迁移；ADR-0004 D3/0013 D6 注记）；
  D4 仅 maxUses（config 化默认 5 替换常量，宿主同名同义；queries/结果数上限在宿主
  tool-web/seam 层为死配置不做——调研实证）；D5 **官方 web-search-deepseek 随包退役**
  （patch 第三条目 `- id: web-search-deepseek` + `disabled: true`：provider 注销 +
  设置卡消失 + 其 DEEPSEEK_API_KEY 单写点消失；卸载自动复原；ADR-0013 Decision 7
  增补）；D6 launch-static 注记（maxUses 与 baseURL/model 同 D2 纪律）；D7 scope-out：
  README 本体/宿主仓/fetch 面/queries 結果数上限。

## WBS

T0 治理批 → T1 布局重排（GUI：链卡置顶+超时随迁+maxUses 入顶+兜底行移末+删 footnote）
→ T2 排序域语义（node：config 拆分+恒尾拼接+老序过滤+ADR 注记+chain/config/apply 测试）
→ T3 折叠区（GUI：默认收起+头部展开+spec 存量断言改先展开+折叠态新断言）→ T4 maxUses
（node+GUI：config+provider 常量替换+wire 断言+顶部输入 patch 深合并）→ T4b 官方退役
（patch 第三条目+patch.test 三条目守卫+e2e dump 装卸断言）→ T5 门墙七命令 → T6 浏览器
验证（remove→add 换包重启 3423：顶部全局区/五卡折叠展开/兜底行最末/官方设置卡消失；
截图先 scrollIntoView）→ T7 阶段 4/5 独立验证 + 收尾 + merge `--no-ff` + 接力。

## 验收（R1-R7）

R1 布局全要素；R2 链尾语义（恒尾+过滤+注记互指+node/GUI 对称）；R3 折叠交互零损失；
R4 maxUses（默认 5+同款 label+wire 透传+深合并）；R5 门墙全绿（基线 277|9(286) 起算，
键数/测试数如实披露）；R6 浏览器亲见+隔离；R7 官方退役（e2e dump+浏览器卡消失+卸载
复原+patch.test 守卫含不误伤 web-fetch-http）。

## 阶段 0 gate

审 S14b **PASS**（🔴×0 🟡×0；计划模式限制替代证据链+翻案条款；正本
docs/sessions/audit-logs/2026-09-06-s14c-stage0-review-of-s14b.md）。基线 277|9(286)、
40 keys、client.js 47.47 kB、master `101b1c0`。

## 债务归属映射

本棒清偿：无在册 🟡（S14b 清干净）；badge 死分支若 T3 重构顺手触及则清（否则维持 S15）。
归 S15：README（含官方退役说明+手动复原法）/闲置卡措辞更新（闲置→已退役）/architecture
其余陈旧。维持：🟢×4+L-2+观察+v2。

## 高危预告

3423 重启+3432 stub 续用（查占/精确 kill/常驻零接触）；tarball remove→add；npm pack 非
publish；宿主仓零写；fake 键仅 env。
