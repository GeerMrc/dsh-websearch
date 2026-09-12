# S26 T7 — git 定档：敏感信息扫描 + 分支清理（阶段 3 留痕）

> 日期：2026-09-13；执行：主 Agent（可机械复核的扫描与清理，非审核面）。

## 敏感信息全历史扫描（427 commits）

- 模式一（key 形态 `sk-…`/`tvly-…`/`fc-…`/长 token）：命中文件 2 个（S12 plan/audit-log），逐条人工复核 = **全部假阳性**（`ask-question-row.tsx` 文件名匹配 `sk-`、locale 示例 `sk-aaa...,sk-bbb...` 占位串、`Tooltip.tsx` 等）。**零真实凭据**。
- 模式二（赋值式 `api_key/token/secret/password/credential = "…"` ≥20 字符）：全历史 **零命中**。
- 入库文件面：无 .env / 无凭据数据文件（credentials 相关仅源码与设计文档）。
- .gitignore 覆盖 `.env`；`*.tgz` 本棒已补忽略。

## 分支清理

- 清理前 61 分支 = master + feat/s26-release-hardening + 59 个 feat/*。
- `git branch --merged master` 实测 59 个全已合入、`--no-merged` 除当前棒外为 0 → `git branch -d` 全删。
- 清理后：`master` + `feat/s26-release-hardening`（当前棒，T9 merge 后亦删）。

## tag v0.1.0（时点调整披露）

plan 将 tag 排在 T7；实际延至 **T9 merge --no-ff 之后**打在 master 合并提交上（tag 应指向发布态 master，而非未合并的分支尖端）。附注 tag message 含 ADR-0020 定档说明。

## 远端

无远端（用户裁定：仅准备不推送）——本扫描即为推送前准备件。
