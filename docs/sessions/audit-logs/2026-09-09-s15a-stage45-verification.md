# S15a 阶段 4/5 独立验证（初审 + 清偿复验）— 2026-09-09

> 审核对象：Session 15a（T0-T4，commits 50bff59/045c497/b40e962，基线 master 3b843e1）+ 清偿 9309e62。

## 初审裁定：BLOCKED（🔴×1 + 🟡×5）

**5 必改逐条**：
- M1 网关模式 CONFIRMED（常驻 available/ON 指引/OFF 委托/patch 钉）
- M2 文案面 CONFIRMED 代码 / 未过守卫（零测试覆盖——探针 a 0 红实证）
- M3 OFF 恢复 未过（可达性死：takeover 分路读 live.current()，settings 面翻转不可见——本插件 section 注册晚于 inject）
- M4 升级路径 CONFIRMED（dshws-search-only 沿用 + v2 版本标记重写）
- M5 skills 复制 CONFIRMED 代码 / 无测试

🔴：M3——settings 面 OFF 永远到不了 apply OFF 分路 → R3 三分之二不可达。
🟡Y-2：OFF 委托无 SSRF/截断/二进制防护（违反 truncated 契约+裸内网可达）。
🟡Y-3/4：toggle/gate 零行为测试。🟡Y-5：unused import。

## 清偿 9309e62
- M3：takeover 改读 settings describe dsh-websearch ns 的持久 fetchTakeover。
- Y-2：SSRF 守卫（isPublicAddress v4/v6）+ 二进制拒收 + truncated 诚实 + redirect:'error'。
- Y-3/4：fetch-gate 6 例 + toggle 行为 + controller 写路径。
- Y-5：unused import 删。

## 复验裁定：PASS（7 项全 CONFIRMED）
- 探针：available→false → fetch-gate 测试 1 红实证（洞闭）。
- 门墙：vitest exit0 354|9(363) · Errors/Unhandled 0 命中 · typecheck exit0 · lint exit0(1 旧 warning) · i18n 54 keys。
