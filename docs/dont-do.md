# 不要做（Negative Instructions）

> 本文件记录 dsh-websearch 开发中**永久禁止的行为**。每条含三要素：❌ 错误做法 + ✅ 正确做法 +
> 来源（Session/任务编号/RCA 链接），缺一不可。
> **准入门槛**：新增条目必须经过 踩坑 → RCA → 确认是**系统性问题**后才写入，不写一次性问题
> （防清单噪音化——一次性问题记 session 记录即可）。已确认的系统性坑（超过 15 分钟才解决，
> 或导致回滚/数据丢失）不沉淀是治理失败。
> 组织方式：早期按主题分类，后期可按 Session 分组（`## <主题>（Session NN）`）追加。

## 依赖与版本（Session 01）

### ❌ 不要凭印象假设 peer 依赖的版本域

- **错误**：假设 `@deepseek-ai/cordis` 与 `@deepseek-ai/dsh-*` 同为 `0.1.2-alpha.x` 域——实测 npm 上 cordis 只有 `4.0.1-rc.1..4.0.2`（宿主 vendored 为 4.0.2；anysearch 存在证 peer 为 `>=4.0.1-rc.1 <5`）。按错误域写 package.json 将直接不可安装。
- **正确**：钉版本域前必查两处实锚——宿主 `vendor/cordis/package.json`（或 `node_modules` 实装版本）+ `npm view <pkg> versions`；dsh 系包与 cordis 系包分属两条版本线，分开核对。
- **来源**：Session 01 阶段 2 独立审核 F-001（🔴）；修订 commit `2f7ac3a`

### ❌ 不要信 npm `latest` dist-tag（对本仓库相关包失真）

- **错误**：`npm view <pkg> version`（= latest tag）判断可用版本——实测 `@deepseek-ai/dsh-settings` latest 指向 `0.0.1-rc.1` 旧线，而真实发布线 `0.1.2-alpha.2..4` 存在且 alpha.4 为最新；据此会误判「包未发布/无新版」。
- **正确**：判断发布态一律 `npm view <pkg> versions` 看全列表（必要时 `time --json` 看发布时间）；dist-tag 只作参考。钉 prerelease 域用显式 range（如 `>=0.1.2-alpha.3 <0.1.3`）。
- **来源**：Session 02 T1 双实锚核对时实测发现（`410d58f` 后）；ADR-0007 依赖钉版策略采纳

## 收官序列（Session 05b，三次复发后系统性确认；S07 扩化）

### ❌ 不要在收官/启动原子序列里漏刷新任何状态区（progress 四处 + STATUS 总览行/位置块）

- **错误**：收官或启动只刷新部分状态载体——progress 文件自身的状态区（里程碑行括注、「进行中」/「待启动」节、任务表 T 末行）漏刷；或 STATUS.md 内部里程碑**总览行**与「当前位置块」口径不同步（S06 收官刷了位置块与 M3 总览行，M4 总览行漏刷成 ⏳，S07 阶段 0 审核抓获 🟡-2）。后果 = 同文件或跨文件状态自相矛盾。
- **正确**：原子序列把状态区刷新当清单逐处打勾，缺一不可——①progress 里程碑行括注（**替换而非追加**——S05b T0 曾插入新行而旧行未删，同文件双行并存）②progress「进行中」清空并下移 ③progress「待启动」前移 ④本棒任务表 T 末行落完成态 ⑤STATUS 里程碑总览行（每个受影响里程碑，与位置块同口径）⑥STATUS 台账行 ⑦STATUS 当前位置块。收官与启动两时点同规则。
- **来源**：三次家族复发——S04 阶段 0 抓 progress-M1 同类（🟡，`c691caa` 清偿）、S05a 阶段 0 观察 S03 R 表标题、S05a 阶段 0 抓 progress-M3 状态区（🟡 Y-1，S05b T0 清偿）；第四次 = S07 阶段 0 抓 STATUS M4 总览行漏刷（🟡-2，S07 T0 清偿）——STATUS 单源规则掩护了它（位置块始终正确，总览行无人查）
