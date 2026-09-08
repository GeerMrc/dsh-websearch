# S14v 阶段 4/5 独立验证 — 2026-09-08

> 审核对象：Session 14v（T1 202 识别 + T2 UA，commits 5255d16 + e24d90c，基线 master 1683f41）。
> 以下为审核输出原文（逐字）。

---

## 🔴 清单（阻塞项）

无。

## 🟡 清单（新债/瑕疵）

无。新债探查细节：

- 202 注释与实测事实一致：src/providers/fetchsearch.ts:108-112 写 "observed 2026-09-08: both html and lite endpoints, with or without a browser user-agent"，与 plan 取证锚 🟡-A「实测 html/lite 双端点同 202、带浏览器 UA 同 202」逐点吻合（lite 仅作取证事实陈述，代码只走 html 端点，无端点 fallback 失真）。
- UA 常量 JSDoc（fetchsearch.ts:26-29）"DuckDuckGo does not require it, but a bare header set is an unnecessary bot fingerprint" 与 plan 🟡-B「本例中非决定因素，可白捡的防御性修正」口径一致，未夸大 UA 作用。
- plan T1 红定义（「mock 202 壳期待新消息实得旧消息」）与测试断言（tests/providers/fetchsearch.test.ts:82-83）及探针实测失败消息逐字对应。
- e24d90c 为纯测试类型补齐（`.then(()=>null)` → throw 收窄、RequestInit 标注），无行为变化，typecheck 已亲证转绿。
- 收尾翻账（STATUS/CHANGELOG/session 记录）不在本分支：按 S14u 先例（T9 收官翻账在 T8 复审后、merge 前），S14v 处于 T4 审核时点，属计划内时序，非债。

## 🟢 清单（证据）

**1. 计划符合性**
- 🟢 src/providers/fetchsearch.ts:113-118 — `if (response.status === 202)` 单列抛错，消息含 `anti-bot challenge shell (HTTP 202)` 与 `unavailable in this network`（:116）。
- 🟢 badResponse 码不变 — 202（:115）与 200 零结果（:122）均 `codes.badResponse`；diff 确认 `parsed no results from the HTML endpoint`（:122）为原行未动。
- 🟢 DDG_USER_AGENT 常量（:30-31）进请求头 `'user-agent': DDG_USER_AGENT`（:95），桌面 Chrome 131 串。
- 🟢 tests/providers/fetchsearch.test.ts:67-95 — 202 壳 vs 200 零结果区分断言：blocked 断言含 anti-bot 短语双段；empty 断言 `not.toContain('anti-bot')` + `toContain('parsed no results')`。
- 🟢 tests/providers/fetchsearch.test.ts:97-106 — UA 头断言存在：`headers['user-agent']` 匹配 `/Mozilla\/5\.0/`。
- 🟢 不改面未触碰 — `git diff master..HEAD --name-only` 仅 3 文件（plan 文档、fetchsearch.ts、fetchsearch.test.ts）；src 变更仅 fetchsearch.ts；anysearch.ts / chain / config.ts diff 为 0 行。

**2. 探针牙齿**
- 🟢 `if (response.status === 202)` → `if (false)` 后 fetchsearch 单文件测试 **EXIT=1**，S14v T1 用例红，失败消息：`expected 'Fetch search parsed no results from t…' to contain 'anti-bot challenge shell (HTTP 202)'`（fetchsearch.test.ts:82:29）——正是「旧消息替代新消息」的定性红。还原后 `git diff --exit-code` = 0、`git status --porcelain` = 0 行。

**3. 门墙亲跑（串行，PATH 前缀 node v22.23.2）**
- 🟢 `pnpm exec vitest run` → **exit 0**，Test Files 29 passed | 1 skipped (30)，**Tests 317 passed | 9 skipped (326)**；`grep -cE "Errors|Unhandled" /tmp/v-review.log` = **0**（无 Errors/Unhandled 行）。
- 🟢 `pnpm run typecheck` → **exit 0**（tsc --noEmit × 2 项目）。
- 🟢 `pnpm run lint` → **exit 0**（0 warnings 0 errors，52 files）。
- 🟢 `pnpm run check:i18n` → **exit 0**（48 keys parity + 19 files 零 CJK 字面）。

**4. git 状态**
- 🟢 工作树干净（审核全程结束仍 0 行）；HEAD = e24d90c10860385695bcae6b7337352b90b65b8f = 期待值；merge-base(master, HEAD) = 1683f41 = master HEAD，即自 master 直接分出，无夹带提交。

## 符合性结论

T1（202 反爬识别）、T2（浏览器 UA 头）与 plan docs/plans/2026-09-08-014v-s14v-fetch-floor-honesty.md 的任务定义逐条吻合；「不改（披露）」面（anysearch 超时语义、共享预算、chain core、octet-stream）零触碰；R1/R2 单测钉死、R3 门墙全绿、取证锚与注释/断言三方互证无失真。

## 门墙数字汇总

| 门 | exit | 关键数字 |
|---|---|---|
| vitest run | 0 | 317 passed \| 9 skipped (326)；Errors/Unhandled 0 匹配 |
| typecheck | 0 | 两 tsconfig 全过 |
| lint | 0 | 0 warnings 0 errors / 52 files |
| check:i18n | 0 | 48 keys parity；19 files 零 CJK |

## 总结论：**PASS**（🔴×0 🟡×0，R1-R4 中 R4 达成——无新 🟡+）
