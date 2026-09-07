# Plan — 2026-09-07-014e-s14e-fetch-fallback

> S14e 插行棒：免费 fetch 搜索兜底（DDG HTML 抓取成员）+ fallbackProvider 二选一（安装自动默认）+ 链 hint 收进「内置默认序」ⓘ。用户方向修正（"无兜底"非本意）+ 双 AskUserQuestion 裁定。

## D1-D6
- D1 新成员 `dshws-fetch-search`：HTTP 抓取 html.duckduckgo.com/html/?q= 免 key；正则解析 result__a/result__snippet；href 解码 uddg 参数；gate 恒 ready（无凭据需求）；perMemberTimeoutMs 照常。
- D2 `fallbackProvider?: 'deepseek' | 'fetch' | 'auto'`（settings 字段，默认 auto）；链解析：orderable 五家 + 兜底成员（auto→deepseek key ready ? deepseek : fetch）；deepseek.enabled 不再是 GUI 开关（字段兼容保留，接线恒 true；选择唯一入口=fallbackProvider）。
- D3 GUI 兜底行：两段 [DeepSeek 付费 | Fetch 免费]（pressed=snapshot.fallbackProvider，显式或安装默认推导）；写 settings 热生效。
- D4 链卡 hint 收进「内置默认序」badge：加边框+ⓘ 圆图标 hover Tooltip=「内置默认序：五家（兜底搜索工具：付费 DeepSeek APIKEY 或 免费 Fetch websearch）」；删两行写死文字。
- D5 不可达语义：DDG 网络失败→该成员请求失败→链尽 fail-loud（无更低层，诚实披露）。
- D6 scope-out：README/ADR 注记（S15）；Bing 抓取（否决）。

## R1-R5
R1 fetch-search 成员（解析单测+免 key gate+超时）；R2 fallbackProvider（auto 默认推导/显式切换/链尾只拼选中者）；R3 GUI 切换+链 ⓘ badge；R4 门墙全绿（基线 285|9(294)）；R5 浏览器亲见。

高危预告：同前（3423/3432 查占/换包 remove→add；宿主仓零写；fake 键）。
