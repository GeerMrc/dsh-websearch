# Plan 046 — DSH 0.2.0-rc 线适配（v0.2.0 重定标）（Session 38）

> 2.5 终审：用户指令（2026-09-30）——上游确认有更新则做适配兼容开发，流程化实测验证后再打 v0.2.0 标；网络慢但 GitHub 可用。

## 背景（2026-09-30 实测）

- **上游新线**：六包（agent/web/settings/tools/credentials/system-prompt）各 30 版，新增 `0.2.0-rc.1/rc.2`（npm registry 全列表直证；上游 tag dsh-v0.2.0-rc.1/rc.2 已入本地 deepseek-harness 仓）
- **接缝面 diff（git diff dsh-v0.1.7-rc.2..dsh-v0.2.0-rc.2）**：settings/credentials/ui-slots **API 面零变更**（仅版本号+上游自家测试）；ui-tool slots 契约**纯增量**（ask-question 面板新接口，既有 tool.call.toolview 槽位声明未动）；ui-primitives 增量属性（Tooltip 新 openOnClick/portal/shortcutKeys 等，我们显式传参不受默认值变更影响）；typert 线**零 src 变更**（纯版本号）；cordis 仍 4.0.4
- **兼容门**：`evaluatePluginCompatibility` 未变——`semver.satisfies(runtimeVersion, requirement, {includePrerelease:true})`；0.2.0-rc.2 宿主下现行域（顶 0.1.7-rc.2）**必被拒** → 扩钉为硬需求
- **S37 阶段 0**：R-1/Y-1/Y-3 已清偿（本批前提交）；Y-2 归 T0

## rev1 修订（阶段 2 NEEDS REVISION M1-M7/S1-S7 全数吸收）

- **M1 fork 守卫**：rc.2 纯树仍带 CJS 裸赋值 bug（known-upstream-issues ①）；演练与 3423 均跑**守卫移植树** `fix/readonly-stack-020rc2`（= dsh-v0.2.0-rc.2 + cherry-pick fork 修复）——与生产同姿态；T6 更新 known-upstream-issues 增 0.2.0-rc 行
- **M2** 演练步骤补 `pnpm run build`
- **M3** 演练口改 **3434**（宪法演练窗）+ scratch home `/tmp/dshws-s38/home` + worktree 落 `/Volumes/IPFSJK/Zcode/dsh-harness-020rc2` + **终态清场步**（进程停/凭据副本删）
- **M4** T4 先停旧 3423 实例再切树；DSH_HOME 维持 `/tmp/dshws-s35/home`（风险注记：session 存储两 tag 间 194 行重构无兼容承诺——现有会话为可弃测试会话，settings/credentials 简单文件兼容）
- **M5** T1 扩钉同步 README.md/README.en.md 前置串四处；T2 措辞改「src/ 零变更」并列应动文件清单（package.json + README×2 + CHANGELOG + docs）
- **M6** 增 T4b：e2e.real 错误路径四例好窗实跑（立宪第 4 条；registry 现可达）+ 对齐矩阵结转裁定明示（四搜索上游未变，S37 矩阵结转有效——零源码变更）
- **M7** T0 落阶段 0 审核正本 + Y-2 两处悬空指针 file:line 化
- **S1** R2 加负控（0.1.8/0.3.0 必拒）+ rc.1⊂rc.2 祖先（187 commits）git 级证据 + gate 越权放行注记（includePrerelease 固有，现域同存）
- **S2** 矩阵=7 腿（同 S37 形状）；「三代提问」勘正为 S37 矩阵四时点
- **S3** gate 亲证点名 `incompatible-version` 失败码；tarball 安装成功即最早放行证据
- **S4** devDeps 留钉 0.1.7-rc.2（seam 零 src 下成立，明示）
- **S5** typert 注记统一落 CHANGELOG
- **S6** minimumReleaseAge 24h 窗应急：`pnpm clean --lockfile && pnpm install`
- **S7** Tooltip 新增面勘正为 openOnClick/focusDelayMs（portal/shortcutKeys 系既有）

## 任务分解

### P0 前置
| T0 | Y-2 清偿：处置表两处悬空指针（roadmap v2 候选节落锚——session-roadmap 增「v2 候选（非债务）」节收编两行；README 系实证指针改指 CHANGELOG/README 提交链）+ 上游扫描正本落档（30 版证据+新线判定） | 指针闭合 |

### PA 适配本体
| T1 | peer 扩钉：六包 peer 域 += `\|\| 0.2.0-rc.1 \|\| 0.2.0-rc.2 \|\| >=0.2.0 <0.3.0`（0.2.x 稳定线前瞻；0.1.8/0.1.9 稳定线维持排除——从未演练）；typert-protocol 维持 0.1.7-rc.2 精确钉（wire 零变，注记在 package.json 邻近或 CHANGELOG） | satisfies 双语义实测：host-gate 语义（includePrerelease:true）对 0.2.0-rc.2/0.1.7-rc.2/未来 0.2.0 三宿主全放行；npm plain 语义对 rc 钉全真 |
| T2 | 源码零变更的负面验证：`git diff` 仅 package.json；全套件 602/602 不回归 | 门墙全绿 |

### PB 演练与实测
| T3 | 3434 演练：deepseek-harness 仓建 `fix/readonly-stack-020rc2` 分支（dsh-v0.2.0-rc.2 + cherry-pick fork 守卫）→ worktree `/Volumes/IPFSJK/Zcode/dsh-harness-020rc2` → pnpm install（年龄窗拦则 clean --lockfile 重装）→ **pnpm run build** → scratch home `/tmp/dshws-s38/home`（凭据副本从生产拷）→ profile 装我们的 v0.2.0 双名 tarball（**安装成功即兼容门最早放行证据**，拒绝在安装期抛 `incompatible-version`）→ 3434 起服 → dump 三处钉扎 → 设置页+工具行冒烟 → **终态清场**（停进程/删凭据副本） | 演练日志归档 |
| T4 | ①停旧 3423 实例（017rc2 树 PID）→ cwd 切 `/Volumes/IPFSJK/Zcode/dsh-harness-020rc2`（守卫移植树）+ DSH_HOME 维持 `/tmp/dshws-s35/home` → 起服 → 兼容门放行亲证（无 incompatible 日志）→ **逐工具异题矩阵 7 腿**（同 S37 形状：4 成员单开×search/fetch，第四批全新提问，与 S37 四时点提问均异） | chain-log served-by 归档 |
| T4b | e2e.real 错误路径四例好窗实跑（registry 现可达；失败如实记录工件——立宪第 4 条） | 运行输出归档 |
### PC 验证与收官
| T5 | 阶段 4（独立全量）/ 阶段 5（三正交+新宿主冒烟复核） | 正本落档 |
| T6 | 收官：session-38 记录 + STATUS/roadmap/progress + CHANGELOG 适配批（DSH 0.2.0-rc 兼容声明）+ **v0.2.0 重定标准备**（本轮适配完成态 = 打标基线）+ 呈批推送序列（慢网对策：push 失败重试一次+带日期留痕） | 六件套 |

## 验收条目（R）

- R1 Y-2 指针闭合 + 上游扫描正本在档
- R2 peer 扩钉 satisfies 双语义矩阵全过：正例（0.2.0-rc.2/0.2.0-rc.1/0.1.7-rc.2/0.2.0 稳定四宿主全放行）+ **负控（0.1.8/0.3.0 必拒）** + gate 越权注记（0.3.0-rc.1 等——includePrerelease 固有，现域同存）+ rc.1⊂rc.2 祖先证据
- R3 演练：tarball 安装成功（安装期 gate）+ 起服无 `incompatible-version` + dump 三处钉扎 + 冒烟 + 终态清场
- R4 新宿主下逐工具矩阵 7 腿异题 PASS + T4b e2e.real 四例（或环境窗如实记录）
- R5 门墙 602/602 不回归；源码零变更（除 package.json）
- R6 收官六件套 + v0.2.0 打标基线就绪（tag 候令）

## 验证矩阵

| 面 | 触发 | 责任 |
|---|---|---|
| satisfies 双语义 | T1 | 阶段3（脚本留档） |
| 全量门墙 | T2+T5 | 阶段4 |
| 演练（新宿主） | T3 | 阶段3→阶段5复核 |
| 逐工具矩阵 | T4 | 阶段3→阶段5复核 |
| 用户路径冒烟 | 阶段5 | 独立 Agent |

## 债务归属

🟢 0.1.8/0.1.9 稳定线从未演练（如上游出，需独立呈批演练）· alexandria 2026-11-16（沿） · 慢网推送重试纪律（T6 内联）

## 风险

- 新宿主隐藏行为面（演练与 3423 双腿兜住；dump 钉扎对齐 S32 三线矩阵先例）
- 慢网：上游已取回本地（无再拉需求）；推送腿重试+留痕
- 0.2.0-rc 为预发布线：生产 3080 切换**不**随本轮（仍候令且生产是否上 rc 线属用户决策）
