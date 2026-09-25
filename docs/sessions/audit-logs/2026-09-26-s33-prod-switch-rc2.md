# 生产切换执行记录：3080 → DSH 0.1.7-rc.2(+fork) + 插件 v0.1.3（2026-09-26 02:00-02:03）

**授权**：用户批准呈批件（「切生产:3080 更新版本吧帮我」2026-09-26）。执行前按 §二 完成**备份**：/Volumes/IPFSJK/Zcode/dsh-ops-backups/3080-pre-rc2-20260926-0200/（237M/652 文件+MANIFEST.sha256+BACKUP.md；含 credentials/settings.imported/anonymous-id/sessions/storages/attachments/llm-deepseek/profiles 清单；排除 logs 与 speech-to-text 模型）。

## 动作序列
profile 备份 → 依赖改指 v0.1.3 bare tarball（唯一一行 diff）→ pnpm install EXIT=0（node_modules 实证 0.1.3）→ 停 92540 → **017rc2 树起服**（新 pid 61344，DSH_HOME=~/.dsh，日志 web-3080-017rc2.log）。

## 验证（呈批件 §四 全过）
- 服务：http 401 健康；**零 error/TypeError**（readonly-stack 在生产 rc.2+fork 树零复发）
- 归属：`lsof -p 61344 cwd=/Volumes/IPFSJK/Zcode/dsh-harness-017rc2`（供版树=fix/readonly-stack-rc2 @ ebd42731c9 = rc.2 tag 477b4f4205+fork）
- dump 钉扎：searchProvider: dshws-chain（:452）/ fetchProvider: dshws-fetch-gate（:453）/ 插件行（:1345）
- GUI：徽标「已配置 API Key：5/10」；**生产链序保留**（1 AnySearch 主搜索→4 Firecrawl 兜底位）
- **真实搜索**：served-by: dshws-anysearch + 二请求 anysearch fetch 失败自动降级 tavily（链日志 18:02Z——生产降级链活体实证）
- 零触碰归属：.credentials.yaml mtime 09-22、settings.yaml.imported mtime 09-23（均早于操作窗口）
- 回滚位：017a2 树（03bffa9454）完整未动 + profile v0.1.2 备份在案（一级回滚分钟级）

## 保留偏差（诚实）
- fix/readonly-stack-rc2 分支尚未推上 fork 远端（github SSL 阻断，推送循环续试中）——呈批件 §三已声明此条件；分支内容=公开 tag+已推远的 03bffa9454 之 cherry-pick，可重建，风险可控；推上后本偏差消除。
- GitHub 侧（master/tag/Release）仍由编排器续试。
