# S35 阶段 5 独立交叉验证（收官前，2026-09-28）

## 提示词参数头

- 骨架版本：库版本 v2（阶段 5 变体：S35 收官前交叉验证）
- 阶段：5（S36 → S35）
- Session：35
- 输入指针：session-35 记录；plan 035（R1-R8）；阶段 4 正本（2026-09-28-s35-stage4-full-verification.md）；ADR-0022
- 偏离说明：无（采信阶段 4 数字；冒烟限只读）

## 审核 Agent 输出要点（逐字原文见对话留痕；本正本存结论与新发现全文）

判定：**COMPLETE**。冒烟三件套全过（3423 LISTEN + DoH decision/resolve 行 + 健康探针 401 非 000）；阶段 4 三处日志声称在活体逐字复现。

安全维：resolveForGuard 不绕过私网过滤（gate 每址 isPublicAddress，intercept.ts:399-421）；阶段 5 三修复亲验在位；脱敏闭环；外部输入面（双 face schema/encodeURIComponent/TLS 严格/代理只读）。
- [S-1 🟢低] intercept.ts:243 decision 事件 onEvent 链无 try/catch——canary 窗口内敌意 volatile 写致 settling 拒绝 unhandled rejection（lookup 不受影响）；建议 C4 同款守卫。

契约维：8 面错误族闭合无已知开放逃逸；config 兼容承诺机制在位（缺省→auto→懒 canary→零命中卸载）；Remote 三方法契约逐镜。

前瞻维：已归属项全有指针；新遗漏：
- [F-1 🟢] DNS 状态 chip init 拉取非轮询债未入 plan 035 债务归属映射表（one-home 缺行）
- [F-2 🟢微] onSetDnsScope 死插线（section.tsx:323/555/576 传递零消费）
- [F-3 🟢微] ADR-0022 Status 行 T6/T11 触发器漂移（转正时自然消除）

dont-do 复发比对：13 条全「不命中」。

处置记录（主 Agent）：S-1 → C4 守卫补位（TDD）；F-1 → plan 035 债务表补行；F-2 → 死插线全链清除；F-3 → 随 T11 ADR 转正一并更新。
