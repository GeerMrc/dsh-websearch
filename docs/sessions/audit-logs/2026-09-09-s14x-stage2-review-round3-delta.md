# S14x 阶段 2 计划审核·轮 3（DeepSeek 条件禁用增量）— 2026-09-09

> 审核对象：用户补充规则的技术增量（DeepSeek 参与条件 = 选中 && readyCount≤1 && key 有效）。方向成立，四点中三点确认。以下为输出原文（逐字要点）。

## 裁决：NEEDS REVISION（必改×3）

**点 1 相容性确认**：新守卫不合成 id、不做值域重映射、单一参与条件——与"删 auto 三元合成缝"裁定不冲突（热读本身不是被删对象；index.ts:119-121 明文 pool ports live 纪律；settings 面与凭据面分离，resolveConfig 构造性看不见 readyCount）。**必改写法约束**：(1) append-only——chain.push(DEEPSEEK_FALLBACK_MEMBER_ID)，严禁 chain[len-1]= 替换式；(2) 静态层先行——resolveConfig 对 deepseek 点名的静态产出 = 五可排序成员（点名 id 从排序域剥离）；getter 除守卫外零逻辑；守卫注释写明凭据面不可见性原因；(3) **readyCount 种群钉死**：只数五个工具成员的 enabled && pool.ready()（keys.ts:94-96 逐调用同步热读），**排除 deepseek 自身**——否则"1 家就绪+deepseek 已配+选中"自数成 2 在主场景自杀。

**点 2 措辞框架**：意图/资格二分——fallbackMember 命名意图；链在调用时只在成员合格时实现。工具成员合格 = enabled+credentials（selection-skip 缝）；deepseek 合格 = 点名+计数≤1+pool ready（装配缝）。不可实现的意图一律降级为 auto 链（两路径可观测序列与 auto 完全一致：skip 成员不入 failures；守卫失败序中无该 id）。**说"实现降级为 auto 链"，绝不说"值回退为 auto"**。边界句：direct pin（ctx.web 注册面，ADR-0002 D5）不受 readyCount 影响。

**点 3 接线确认**：controller deriveSnapshot 现有输入（SectionValue per-member enabled + facts configured）足够推导 readyCount；注意 deepseek key configured 必须走派生 refName（不得复制 controller.ts:162 硬编码写法——该投影本就在替换范围内）；客户端 readyCount 同样排除 deepseek 并注明。

**点 4 测试象限补面**（三条核心批准但不够）：④ 1 工具就绪+deepseek key 已配+选中→计数=1→尾参与（**自排除钉死测试**，最高价值）；⑤ 2 家配 key 其中 1 家 enabled=false→计数=1→参与（enabled 面）；⑥ 选中+计数≤1+pool 未就绪→auto 链（守卫第三子句独立断言；注：就绪≥2 场景的"摘要无 deepseek 行"与 gate-skip 不可分辨，真正独占行为是 readyCount 子句）；⑦ controller/section spec：fallbackDeepseekEligible 随 facts 1→2 与 enabled 开关翻转、选择器项增删、存量不合格→显示 auto+说明句。建议补：钉序含 deepseek id 守卫不双入；③ 镜像（后配 key 尾出现）；② 断言 deepseek 严格最后。
