# 生产切换执行记录：3080 插件 v0.1.3 → v0.2.0（宿主 017rc2 不动；2026-09-30 02:26-02:36 CST）

**授权**：用户指令原文「切生产端`:3080`做确认没问题后，准备清场」（2026-09-30）。
**runbook**：upgrade.md §2.1（S36-T14 备案）逐项执行——目标树=017rc2（当前生产宿主，不动）。

## 动作序列

1. **备份点**：/Volumes/IPFSJK/Zcode/dsh-ops-backups/3080-pre-020plugin-<ts>/（profile 三件套 + .credentials.yaml〔600 权限，内容零触碰〕+ tarball 引用行抄录 + MANIFEST.sha256 + BACKUP.md）
2. **换包**：profile 依赖行 `file:…dsh-websearch-0.1.3.tgz → …dsh-websearch-0.2.0.tgz`（唯一 diff）→ rm 旧 node_modules/dsh-websearch → `pnpm install --no-frozen-lockfile`（node v22.23.2 绝对路径）→ 实证 installed=0.2.0、peer 域含 0.1.7-rc.2（运行宿主在域内）
3. **重启**：停 61344 → 017rc2 树起服（新 pid 76655，DSH_HOME=~/.dsh，boot log /tmp/prod3080-020boot.log）；宿主横幅 `0.1.7-rc.2-ebd4273-dirty` 亲证未动

## 验收（§2.1 清单全过）

- 服务/门：boot log **0 incompatible/error**；插件 boot 金丝雀 4 域名污染 → DoH 自动启用 + 5 域名预热
- 设置页：网页搜索节 + **DNS 韧性卡**（DoH 生效中 + 保留段证据行）+ web_fetch 接管开；**链序保留**（1 AnySearch 主搜索 → 4 Firecrawl 兜底，钉死配置未被覆写）
- 凭据零丢失：.credentials.yaml mtime 09-27、settings.yaml.imported mtime 09-23（均早于操作窗口）+ 四成员 key draw 正常
- **真实搜索**：served-by: dshws-anysearch ×5（18:30:28-46）
- **web_fetch**（接管开）：ISS 词条正文 served-by dshws-anysearch（18:34:05）
- **错误路径活体**（模型追抓第二 URL 触发，非合成）：`member dshws-anysearch failed (AnySearch API error (HTTP 422): Unable to extract content from the URL. [extract_failed] (request_id: 3a6d2e2f-…)); degrading to next member (request-level HTTP 422)` → key draw firecrawl → **served-by: dshws-firecrawl（18:35:10）**——上游 detail 全量透出 + 跨成员降级兜底，生产实时实证
- 回滚位：依赖行改回 0.1.3 tarball + pnpm install + 重启 = 分钟级一级回滚；备份目录数据级兜底

## 清场（同批执行）

- 停 3423（73887）/3434（72806）两 scratch 实例（3434 旧启动器残留通知核实未复活）；浏览器两失效标签页关闭，留 3080 页
- 删 /tmp/dshws-s38、/tmp/dshws-s35（含凭据副本，正本 ~/.dsh 未触碰）+ 本批 /tmp 日志（证据已归档仓内）
- 删历届残留 scratch：dshws-s14a/s32/s33/s35-smoke/s34-release-body.md（各届证据均在仓内 audit-logs）
- 保留：017rc2 树（生产宿主+回滚）、020rc2 worktree（守卫树，未来 0.2.0 稳定线宿主升级的验证基线）、dist-artifacts
