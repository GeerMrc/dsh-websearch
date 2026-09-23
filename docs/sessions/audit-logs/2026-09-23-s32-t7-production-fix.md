# S32 T7 生产修复记录（~/.dsh 3080）

**授权留痕**：用户裁定原文（2026-09-23 AskUserQuestion）——「修死 tgz，树不切（推荐）：把生产 profile 的依赖换成 v0.1.2 新 tarball 并放置在持久路径（非 /tmp），宿主树维持 016a1。树是否切新版本另发指令。消除 profile 不可重装的地雷。」

## 动作序列（备份 → 改指 → 装 → 重启 → 验证）
1. 备份 profile package.json → /tmp/dshws-s32/profile-web-package.json.bak
2. `~/.dsh/profiles/web/package.json` 唯一一行 diff：`file:/tmp/dshws-s29/dsh-websearch-0.1.1.tgz`（死路径）→ `file:/Volumes/IPFSJK/Zcode/dsh-websearch/dist-artifacts/dsh-websearch-0.1.2.tgz`（持久路径）
3. profile 内 `npm_config_minimum_release_age=0 pnpm install` EXIT=0（394ms；node 22.23.2）——node_modules/dsh-websearch version=0.1.2 实证
4. 3080 重启（旧 pid 83310 → 新 pid 69290；runbook §2 流程；预告短暂中断）
5. 验证（S30 验收集）：
   - 健康：http 401 ✓；无 error/dshws 报错行
   - 进程归属：`lsof -p 69290 cwd = /Volumes/IPFSJK/Zcode/dsh-harness-016a1`（供版树不变实证）
   - dump 三钉扎：searchProvider: dshws-chain（:351）/ fetchProvider: dshws-fetch-gate（:352）/ 插件行（:560）（t7-prod-dump.yaml）
   - 浏览器（token 首访 E5-E9…）：设置「网页搜索」节渲染 ✓；Tavily 徽标「已配置 API Key：5/10」✓（v0.1.2 key-count RPC 于 016a1 宿主实证——跨代 codec 修复生产生效）；四成员绿点 ✓；7 开关（四成员+fetch 接管+两参数）✓
   - 零触碰：settings.yaml mtime 09-23 12:49（早于本操作窗口 19:0x+，旧常驻实例 12:49 持久化所致——S07 dont-do 先例归属口径）；.credentials.yaml mtime 09-22 未动

## 结果
- C3 死路径地雷消除：profile 可重装（持久路径 tarball 双版本在档：v0.1.2 + v0.1.1 回滚副本）
- 回滚路径：package.json 指回 dist-artifacts/dsh-websearch-0.1.1.tgz + pnpm install + 重启（树不动）
- 横幅版本快验文本截取不可靠，以 dump（016a1 tag 树产物）+ cwd 实证替代
