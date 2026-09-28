# S37 T0 门墙基线正本（2026-09-28 13:08 CST，分支 feat/s37-upstream-alignment-r2 @ 89044cc 后一提交）

## 双重身份
1. **S37 行为保持基线 N**：PB 质量批（T10-T14）逐任务对照此数，禁算术外推
2. **S36 阶段0 🔴 清偿**：本正本即 09-28 时点全量门墙在档凭据（S36 二轮阶段4/5 修复后终态门墙数字的独立落档——补齐 S36 记录中仅存自记的缺口）

## 实测数字（node v22.23.2 绝对路径，命令原文与输出）

| 命令 | 结果 |
|---|---|
| `npx vitest run --exclude 'tests/e2e.real/**'` | Test Files 35 passed (35)；**Tests 593 passed (593)**；EXIT=0 |
| `pnpm run typecheck`（= tsc 双面：host + client） | EXIT=0 |
| `npx oxlint src tests` | 0 warnings 0 errors（81 文件）；EXIT=0 |
| `pnpm run check:i18n` | 195 keys parity + 36 files zero CJK；EXIT=0 |

## 基线记录
- **N = 593**（35 文件；e2e.real 17 skip-gated 不计入）
- 与 S36 收官口径（593/593 双面 0）一致——树自 be288ff 后仅加 plan 045 文档提交，数字应零漂移，实测吻合 ✓


## T0③ DSH 上游 peer 域扫描结论（2026-09-28 13:1x CST，npm registry 可达窗）

- 六包（agent/web/settings/tools/credentials/system-prompt）各 **28 版**全列表；semver 7.8.4 `satisfies` 实测（/tmp 安装副本，非目测——dont-do semver 条目合规）
- 未覆盖 19 版/包 = 全部低于域下界的历史线（0.0.1-rc.x/0.1.0-rc.x/0.1.1-rc.x/0.1.2-alpha.x/0.1.3-alpha.2/0.1.5-alpha.x）——**有意排除的历史版本**
- 域顶之上零新版本（无 0.1.7-rc.3+/0.1.8/0.2.0-alpha）：**peer 域 `>=0.1.5-rc.1 <0.1.8 || … || 0.1.7-rc.2` 当前即完整，无需扩钉**
- 复核方式：npm view versions --json × 6 → satisfies 全量过滤
