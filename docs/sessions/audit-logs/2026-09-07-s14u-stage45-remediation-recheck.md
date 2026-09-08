# S14u 阶段 4/5 清偿复验（第二轮）— 2026-09-07

> 审核对象：清偿提交 b61622c（🔴-1 + 🟡-1/2/3 四项处置）。同一独立 Agent 续审。
> 以下为复验输出原文（逐字）。

---

## 逐项裁定

**1. 🔴-1 vitest exit=1 —— CONFIRMED**
- 亲跑两次：`exit=0` ×2；`/tmp/recheck.log`、`/tmp/recheck2.log` 中 `Errors`/`Unhandled` grep 零匹配（不只看 Tests 行）。
- 修复写法正确：tests/chain/search-chain.test.ts:640-647 改为 promise 创建时即挂 `.then(throw, caught)` handler，advance 后 `await settled`，并留注释说明「later .then() would leave the window unhandled」。
- 数字保持 315 passed | 9 skipped (324)。

**2. 🟡-1 core.ts 缩进 —— 未过（部分清偿，残留 1 行）**
- 主体已归位：try（:181，8sp）、`} catch`（:207，8sp）、catch 闭合（:233，8sp）均正确。
- 残留：**draw-for 循环的闭合括号 core.ts:234 停在 8 空格**，其开括号在 :171（6sp）——应为 6 空格。现状 ：233/:234 两个 `}` 同列连排，catch 闭合与 for 闭合无法从缩进区分归属（awk 精确测量：`171:[6sp]` / `233:[8sp]` / `234:[8sp]` / `237:[6sp]`）。
- 缓解证据：`git diff -w 50c6f1a..b61622c -- src/chain/core.ts` 为空——本次 core.ts 104 行变更全部为纯空白重排，零逻辑改动。
- 修法：:234 删 2 个前导空格即净。

**3. 🟡-2 index.ts:128 —— CONFIRMED**
`selection: () => live.current()[memberKey].keySelection ?? 'round-robin'` —— 兜底保留（keySelection 类型可选，删除不可行），字面与 resolveConfig 六处权威默认归一。

**4. 🟡-3 enabled 架空注释 —— CONFIRMED**
- src/config.ts:73-78：`DeepSeekSettings.enabled` JSDoc 改为「Client-facing switch, `false` unless set. Since S14u this flag no longer governs chain membership — the fallback member is named solely by `fallbackProvider` — it only feeds the settings-page snapshot.」——与实况（resolveConfig `?? false` + gates 恒真）一致，双重失真均已勘正。
- src/client/controller.ts:10-11 头注释（「deepseek fallback's client-facing flag defaulting to `false`」）与 ：142-143（「Client-facing flag (S14d default off); chain membership itself is governed solely by fallbackProvider (S14u)」）两处 opt-in 旧叙事清偿。

**5. git 状态 —— CONFIRMED**
工作树 0 条（`git status --short` 空），HEAD = `b61622c`，单提交、范围恰为四项清偿的 5 个文件（core.ts/controller.ts/config.ts/index.ts/search-chain.test.ts），无夹带。

## 最终裁定：PASS

初审唯一阻断项（🔴-1）已清偿并双跑验证；🟡 级按初审口径为非阻断项，其中 🟡-2/🟡-3 清偿，🟡-1 残留 core.ts:234 一行 2 空格（登记在案，下次触碰该文件时顺手归位，不构成阻断）。

**门墙一句话**：vitest exit=0 ×2（315 passed | 9 skipped，零 Errors/Unhandled）；typecheck exit 0；lint 0 warnings 0 errors；i18n 48 keys parity + 19 files 零 CJK 泄漏。

---

## 执行者后记（非审核原文）

🟡-1 残留一行当场清偿（9dc0bb6：:234 归位 6 空格，chain 测试 + typecheck 复跑 exit 0）——未按「下次顺手」挂账，2 空格的清偿成本低过台账登记成本。
