# Note — S24 上游 0.1.5-rc.2 升级预演（2026-09-12）

> 性质：预演棒（独立 worktree + 插件 spike 分支），主树/3423/~/.dsh 零接触。决策呈用户（A 采纳/B 暂缓/C 放弃）。

## 1. 版本事实

- 本地基线 0.1.2-alpha.3（fetch 曾停 09-02，已刷新）；上游最新 **0.1.5-rc.2**（`fb2c4b9e69`，09-10，846 commits 重量级 minor：Session V3/agentLoop 异步/ctx.agent 移除/Inbox+面板 API 重做/V41-Flash 默认模型含图片/Sidebar/文件上传）。
- **media_budget_exceeded 上游无修复**（744 commit 标题 + 4 份 release notes + pi-ai 0.84.3-0.85.1 零命中；错误码不存在于 DSH 代码库——归 ninfer 后端，另见独立报告）。

## 2. 预演结果（全部实测亲见）

- worktree `/Volumes/IPFSJK/Zcode/dsh-harness-015` @ `fb2c4b9e69`：pnpm install + build **exit0**。
- 插件 spike `d43997a`（分支 feat/s24-upgrade-015）：peer 六条 → `>=0.1.5-rc.1 <0.1.6`，devDep 十三条 → `0.1.5-rc.2`；**typecheck 零改动通过**（seam/credentials/client 类型面未破）。
- **上游打包缺口（适配主成本）**：`dsh-client-ui-primitives@0.1.5-rc.2` 的 lib/index.js 运行时 import clsx/shiki/@shikijs/micromark×9/mdast×2/anser/katex 而依赖声明为空——宿主 workspace 掩盖、外挂消费者全炸；解法 = 我方 devDependencies 补声明 19 个（运行时仍走宿主模块表，无体积代价）。**建议向上游报 issue**。
- 全量门墙对 0.1.5-rc.2：test **448|13(461) exit0** / tc 0 / lint 0 / i18n 0 / build 0。
- 3424 试验实例（worktree 启动 + 0.8.2 tarball + 复制凭据的 scratch home）：插件节挂载/搜索链/详细配置折叠/接管卡+Web Fetch 链/成员卡+搜索参数 grid/Key 行内联 全要素亲证；**设置写路径往返持久化**（exactMatch on→off 落盘实证，0.1.5 settings 服务 + validate/revision 机制兼容）。验毕实例已停、凭据副本已清。

## 3. 采纳时的分步方案（决策 A 后执行）

1. harness 主树 dev merge-forward（既有 7 步 playbook；351 本地 commits × 846 上游，冲突面中危）
2. 插件 master 合 spike + 换包 3423（重启自主树）+ test:gui 回归
3. **生产 ~/.dsh 仅凭用户明确指令**：healing symlink 语义 = 主树合并即改生产版本；附带 **anysearch peer `<0.1.2` 兼容风险**（需用户裁定 anysearch 去留/升级/由 dsh-websearch 接替）；**Session V3 对旧会话可读性未验**（预演未覆盖，采纳时首验项）
