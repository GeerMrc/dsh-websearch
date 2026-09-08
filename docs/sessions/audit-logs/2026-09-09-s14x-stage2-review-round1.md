# S14x 阶段 2 计划审核·轮 1（兜底删除基础面）— 2026-09-09

> 审核对象：初版方案（删 fetch 地板 + fallbackProvider 收敛 DeepSeek opt-in）。以下为输出原文（逐字）。

## 审核结论：NEEDS REVISION（必改×6 + 建议×4）

维度 1 抽样复核 5/5 命中（config.ts:38/52-63/195/320-324、index.ts:165-180/247-254、controller.ts:160-162/281-286、section.tsx:566-617 均与盘点一致）。

**R1｜'auto'→none 迁移与 schema 收敛自相矛盾**：union 缩域后显式 'auto'（cordis.yml 手写或存量）在 loader 与 installSection 注册处同样 fail-loud，不会迁移为 none；controller 从不写 'auto'，无存量自动迁移通道。必须二选一：(a) schema/输入型保留 'auto' 为 legacy 别名、resolveConfig 映射（Resolved 域仍二值）；(b) 改口 'auto' 亦 fail-loud，迁移表只保留「未设→none」。

**R2｜noMemberConfigured 文案正主是 src/chain/core.ts:253-259**（消息尾句 "(DeepSeek falls back through the Models-page key)" 在 none 默认下为假）；index.ts 全文无该文案。按原盘点执行会漏掉核心文案交付。

**R3｜apply.test.ts「四用例翻语义」实为 ≥7 用例**：:8（拓扑）、:15（S14u 回归翻 false）、:29（免费地板 available→false）、:50-67（宪法 V-05 两处 true 断言失效，结构 false→true→false）、:69-75（默认+key ready→false）、:179-208（耗尽摘要 - dshws-deepseek: 行消失致 indexOf -1 断言崩）、:210-252（超时降级依赖默认 auto 尾）。

**R4｜tests/settings.test.ts 未入清单**：:41/:51/:61/:67/:135/:140/:143/:147 共 8 处断言「resolver 恒追加 DeepSeek 尾」，none 默认下全部翻转或需钉 'deepseek'——套件必红的漏项。

**R5｜「locales 清键」不覆盖须改写的四句**：fallbackNote(:113/:167 两句含 tri-state 默认句)、chainOrderHint(:123/:177「内置地板」句——S14w 句，none 默认下为假)、chainTailHint(:117/:171 无条件断言)、chainNoUsableWarning(:114/:168 归因句随三态→二态重写)。

**R6｜缺 fail-loud 拒收证明测试**：Config({fallbackProvider:'fetch'}) throws 的 schema 负测不存在；resolved 缺省值无断言。按 R1 定案后补负测/映射测。

建议：S1 loopback union 缩域+注释清理（:78 available 断言经核对可存活）；S2 补零 key 默认链 fail-loud 行为断言（头面行为）；S3 CHANGELOG 附存量 'fetch' 自救口径；S4 ADR-0013 D1 同源措辞一并注记、withFallbackTail 顺手剥死 id、index gates 注释随删改写。

维度 6 排除项（已核实无遗漏）：cordis.patch.yml 无关字段；导出面仅 MEMBER_ERROR_CODES.fetchsearch；README/架构文档无提及；ADR-0014 编号空闲；S14u/S14v 交叉自洽（202 报错随成员整删）。
