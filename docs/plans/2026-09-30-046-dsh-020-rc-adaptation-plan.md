# Plan 046 — DSH 0.2.0-rc 线适配（v0.2.0 重定标）（Session 38）

> 2.5 终审：用户指令（2026-09-30）——上游确认有更新则做适配兼容开发，流程化实测验证后再打 v0.2.0 标；网络慢但 GitHub 可用。

## 背景（2026-09-30 实测）

- **上游新线**：六包（agent/web/settings/tools/credentials/system-prompt）各 30 版，新增 `0.2.0-rc.1/rc.2`（npm registry 全列表直证；上游 tag dsh-v0.2.0-rc.1/rc.2 已入本地 deepseek-harness 仓）
- **接缝面 diff（git diff dsh-v0.1.7-rc.2..dsh-v0.2.0-rc.2）**：settings/credentials/ui-slots **API 面零变更**（仅版本号+上游自家测试）；ui-tool slots 契约**纯增量**（ask-question 面板新接口，既有 tool.call.toolview 槽位声明未动）；ui-primitives 增量属性（Tooltip 新 openOnClick/portal/shortcutKeys 等，我们显式传参不受默认值变更影响）；typert 线**零 src 变更**（纯版本号）；cordis 仍 4.0.4
- **兼容门**：`evaluatePluginCompatibility` 未变——`semver.satisfies(runtimeVersion, requirement, {includePrerelease:true})`；0.2.0-rc.2 宿主下现行域（顶 0.1.7-rc.2）**必被拒** → 扩钉为硬需求
- **S37 阶段 0**：R-1/Y-1/Y-3 已清偿（本批前提交）；Y-2 归 T0

## 任务分解

### P0 前置
| T0 | Y-2 清偿：处置表两处悬空指针（roadmap v2 候选节落锚——session-roadmap 增「v2 候选（非债务）」节收编两行；README 系实证指针改指 CHANGELOG/README 提交链）+ 上游扫描正本落档（30 版证据+新线判定） | 指针闭合 |

### PA 适配本体
| T1 | peer 扩钉：六包 peer 域 += `\|\| 0.2.0-rc.1 \|\| 0.2.0-rc.2 \|\| >=0.2.0 <0.3.0`（0.2.x 稳定线前瞻；0.1.8/0.1.9 稳定线维持排除——从未演练）；typert-protocol 维持 0.1.7-rc.2 精确钉（wire 零变，注记在 package.json 邻近或 CHANGELOG） | satisfies 双语义实测：host-gate 语义（includePrerelease:true）对 0.2.0-rc.2/0.1.7-rc.2/未来 0.2.0 三宿主全放行；npm plain 语义对 rc 钉全真 |
| T2 | 源码零变更的负面验证：`git diff` 仅 package.json；全套件 602/602 不回归 | 门墙全绿 |

### PB 演练与实测
| T3 | 3434 式演练：deepseek-harness 仓 `git worktree add /tmp/dsh-harness-020rc2 dsh-v0.2.0-rc.2` → pnpm install → profile 装我们的 v0.2.0 双名 tarball → 起服（3425 演练口，DSH_HOME=scratch）→ **兼容门放行亲证**（启动日志无 incompatible 拒绝）→ dump 钉扎（searchProvider/fetchProvider/insert 行）→ 设置页+工具行冒烟 | 演练日志归档 |
| T4 | 3423 宿主切换：017rc2 树 → 020rc2 树（同 DSH_HOME，配置/凭据不动）→ 起服 → **逐工具异题矩阵**（4 工具单开隔离，全新提问第四批：与 0608/0714/0717/0720 三代提问均不同） | chain-log served-by 全绿归档 |

### PC 验证与收官
| T5 | 阶段 4（独立全量）/ 阶段 5（三正交+新宿主冒烟复核） | 正本落档 |
| T6 | 收官：session-38 记录 + STATUS/roadmap/progress + CHANGELOG 适配批（DSH 0.2.0-rc 兼容声明）+ **v0.2.0 重定标准备**（本轮适配完成态 = 打标基线）+ 呈批推送序列（慢网对策：push 失败重试一次+带日期留痕） | 六件套 |

## 验收条目（R）

- R1 Y-2 指针闭合 + 上游扫描正本在档
- R2 peer 扩钉 satisfies 双语义全过（三宿主×六包矩阵）
- R3 演练：兼容门放行亲证 + dump 三处钉扎 + 冒烟
- R4 新宿主下逐工具矩阵异题 PASS
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
