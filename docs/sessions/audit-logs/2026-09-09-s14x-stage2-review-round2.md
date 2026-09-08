# S14x 阶段 2 计划审核·轮 2（兜底工具显式指定层）— 2026-09-09

> 审核对象：修订版（新增 fallbackMember 指定层）。语义层（用户裁定的可观测行为）全部认可；必改为落地层修正。以下为输出原文（逐字要点）。

## 审核结论：NEEDS REVISION（必改×4 + 建议×5）

**必改 1｜落定单字段接线**：统一单字段 fallbackMember（'auto' 为显式默认可写值），fallbackProvider 降级为 schema 域内 legacy 别名（四值：'deepseek'|'none'|'auto'|'fetch'），resolveConfig 归一 + 一条优先级规则（fallbackMember 存在即权威），GUI 只写 fallbackMember。依据：两字段写路径必产生「同设冲突」与「等价双表示」（deep-merge 无法 unset 兄弟字段，controller.ts:289-292 先例）；本仓单源治理先例 = S14u 把链尾资格收敛 SOLELY by fallbackProvider；legacy 值必须在 schema 域内（dsh-settings register 对存量 section 即校验非法即抛——"An invalid stored section fails the registration itself"）。

**必改 2｜修正回退实现落点**：指定剥离为 resolveConfig 静态行为；删除 index.ts order getter 的 auto 尾替换分支（:165-175）与 pools.deepseek.ready() 热读；「指定失效→自动」由既有 selection-skip 涌现（等价性：静态剥离序 [span减D, D] 与 [span含D] 在走链/available()/耗尽摘要上逐项相同，唯一差异 noMemberConfigured 的 order 字符串）；橙标为纯 GUI 派生态。禁止在 getter 加与 resolveConfig 平行的运行时状态读取缝（S14u 修过的那类缝）。

**必改 3｜ADR-0014 显式 amend B2 规则 2** 的 fail-loud 倾向并记录等价性依据；B2 文档加 superseded 注记指回 ADR-0014（方案只 supersede ADR-0004 D3 + ADR-0013 D6 + B2 文档，未提规则 2 改判）。

**必改 4｜第一轮六必改显式回填进定稿任务清单**；「S14u 语义一字不动」限定为 MEMBER_DRAWS=3（core.ts:150）、NON_RETRYABLE_HTTP_STATUSES（errors.ts:99）、createChainExhaustedError 格式（errors.ts:118-132），明确排除 noMemberConfigured 文案；点名负测交付物（config.test 仿 :114-121 模式加两例）。

建议：S1 loopback 指定场景新增 + exhaustion 保留 legacy 字段写法兼测别名；S2 链卡指定成员锁定尾行、徽标跟随、选择器含未就绪指定者橙标；S3 locales 键增删估算与四句改写清单落文档；S4 快照投影 canonical 单值（fallbackSelection + fallbackEffective），legacy 值不渗入 SectionSnapshot；S5 README/迁移口径显式零 key breaking 面（apply.test.ts:29-34 反转即钉子）。

B2 对账：落点1/2/5 吸收；落点3（auto 合成）/落点4（gates 一般化）消解；规则1 吸收（strip-from-span）；规则2 改判回退+橙标；规则3 照抄。触发源差异（S14v DDG 实证 ≠ B2 原设场景）应记入 ADR Context。
