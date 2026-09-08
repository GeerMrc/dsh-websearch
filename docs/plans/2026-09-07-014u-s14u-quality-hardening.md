# Plan — 2026-09-07-014u-s14u-quality-hardening

> 质量收口棒（双 Agent 深审触发的 🔴 清偿）：auto 兜底断裂 + order 盲重试 + loopback 外网依赖三 🔴 全清，耗尽摘要/预算/4xx 分流/文案/残渣 🟡 高价值项随批。分支 feat/s14u-quality-hardening。

## 审核锚（2026-09-07 双深审，audit-logs 正本随 T0 入库）
🔴① index.ts:163-168 × config.ts:328（enabled 默认 false × auto 只判 key → 地板挤出链，plan 014e D2 未实现）；🔴② keys.ts:77-79,160（hasMultiKeyPool 不看策略，order 3 draw 同 key 盲试）；🔴③ loopback.test.ts:206-241（fetch-search 真外网）；🟡④ errors.ts:105（draw 数当成员数）⑤ core.ts:177（per-draw 超时 3×）⑥ 4xx 无分流 ⑦ 文案/注释三处失真 ⑧ fetchsearch 错误族/exa 前缀/假警告/孤儿键/死代码/JSDoc。

## R1-R6
R1 auto 三态全象限；R2 order=1draw/轮询随机=3draw 换 key；R3 e2e 零外网；R4 耗尽摘要真实+成员预算≤1×；R5 门墙全绿（基线 305|9(314)）；R6 复审 PASS 无新 🟡+。

## 高危预告
3423 换包 remove→add / stub 3432 查占 / 宿主仓零写 / fake 键。
