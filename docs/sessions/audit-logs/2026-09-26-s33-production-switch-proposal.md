# 生产切换呈批件 — 3080 → DSH 0.1.7-rc.2(+fork) + dsh-websearch v0.1.3

> **状态：待用户人工审核批准（本件仅呈批，未执行任何 ~/.dsh 写操作）**
> 呈批日期 2026-09-26 ｜ 编制：S33 T9 ｜ 前置条件全部满足：三线演练 PASS（rc.2+fork 全腿/015rc3/016a1 冒烟）、门墙 480|13(493) 全绿、npm @0.1.3 已发布（GitHub 推送网络受阻续试中，不阻塞本件——插件走本地持久 tarball 安装）

## 一、切换内容

| 项 | 现 | 目标 |
|---|---|---|
| 宿主供版树 | 017a2（0.1.7-alpha.2 + fix/readonly-stack-rewrite @ 03bffa9454） | **017rc2（0.1.7-rc.2 tag 477b4f4205 + fix/readonly-stack-rc2 @ ebd42731c9）** |
| 宿主差异 | alpha.2 | rc.2（rc 稳定线）+ fork 修复收编（上游已修 importer 站点；fork 守卫移植 CJS-anchor 站点——两站点全覆盖，回归 235/235） |
| 插件 | v0.1.2（bare 名持久 tarball） | **v0.1.3**（bare 名持久 tarball：`dist-artifacts/dsh-websearch-0.1.3.tgz`；npm 同版已发布） |
| 切换动作 | — | profile package.json 一行改指 v0.1.3 → pnpm install → 停 92540 → 017rc2 树起服 3080 → 验收集 |

**演练实证**（017rc2 树 + v0.1.3，3434 全腿）：readonly-stack 回归零复发；**legacy 设置迁移实证**（settings.yaml→.imported 自动改名、UI/模型/插件链序完整迁移——1 AnySearch 主搜索→4 Firecrawl 兜底位）；徽标 5/10、四绿点、7 开关；真实搜索 served-by anysearch×5 五 key 轮换；GUI 关成员→链表即时收缩+零 draw；**真实故障降级链**（tavily/exa fetch 失败自动降 firecrawl served-by×2）；装卸循环基座复原。

## 二、备份方案（先备份后切换；实测枚举 2026-09-26 阶段 5）

**备份对象**（~/.dsh 顶层实测清单 + 裁定）：

| 对象 | 实测 | 裁定 |
|---|---|---|
| `.credentials.yaml` | 1133B（模型+插件 APIKEY） | **必含**（核心不可再生） |
| `settings.yaml.imported` | 2277B（模型/语言等配置；注意生产已无 settings.yaml——0.1.7 迁移后形态） | **必含** |
| `.anonymous-user-id` | 37B | **必含** |
| `sessions/` | 35M（对话历史） | **必含**（用户明确不可丢） |
| `storages/` | 816K（workspace.json+session_projcache） | **必含** |
| `attachments/` | 201M（请求图片/对象） | **必含**（用户数据） |
| `profiles/web/package.json` + 依赖清单 | 插件引用行 | **必含**（回滚需要） |
| `llm-deepseek/files-v3.json` | 4K | 含（轻量） |
| `logs/` | 584K | 排除（可再生） |
| `speech-to-text/sensevoice` | 230M（模型文件） | **排除**（可重下载，注记获取方式） |

**目的地**：`/Volumes/IPFSJK/Zcode/dsh-ops-backups/3080-pre-rc2-<YYYYMMDD-HHMM>/`（持久卷、非 /tmp；与 dist-artifacts 同级风险面已知）。
**形式**：目录快照 + `MANIFEST.sha256`（逐文件校验和）+ `BACKUP.md`（时间/触发/树指针/插件版本）。
**恢复步骤**（呈批件附带演练过的恢复命令序列）：停 3080 → rsync 回写（--delete 排除 logs/speech-to-text）→ 旧树起服 → dump/徽标/搜索验证。

## 三、回退方案（两级）

- **一级（分钟级）**：停新进程 → 017a2 树（fix/readonly-stack-rewrite @ 03bffa9454）起服 3080 → profile 指回 v0.1.2 tarball → pnpm install → 验证。017a2 树本轮零触碰（3424 会话共用，未动）。
- **二级（数据级）**：任何数据面异常 → 恢复备份目录（§二 恢复步骤）→ 017a2 或 015 树起服。
- 前提补齐项：fix/readonly-stack-rc2 分支当前仅本地（github 网络阻断，推送循环续试中）——按 runbook 8a①，**该分支推上 fork 远端之前，本呈批件的 rc.2+fork 供版选项视为未满足前置**（用户批准时若仍未推上，将先补推或以纯 rc.2 tag 树为替代选项呈二次确认）。

## 四、切换后验证清单（执行时逐项留证）

横幅 0.1.7-rc.2-ebd4273 ｜ dump 三钉扎 ｜ 设置节+链序（AnySearch 首位）+徽标 5/10+四绿点 ｜ 真实搜索 served-by ｜ 装卸循环抽查 ｜ settings/credentials mtime 零触碰归属核对 ｜ 回滚位（017a2）存活确认。

## 五、请批示

□ 批准按本件执行（备份→切换→验证）
□ 批准但供版树改用纯 rc.2 tag（不含 fork 守卫——不推荐：CJS-anchor 站点失去守卫）
□ 暂缓（维持 0.1.7-alpha.2+fork+v0.1.2 现状；npm 侧 0.1.3 已发布不受影响）
