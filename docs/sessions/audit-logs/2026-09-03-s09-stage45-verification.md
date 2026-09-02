# Session 09 阶段 4/5 独立验证输出（正本转录）

> **落盘说明**：本文件为 Session 09 阶段 4/5 独立验证 Agent 输出原文逐字（主 Agent 转录落盘，无敏感值）。

---

# S09 阶段 4/5 独立验证报告（T10）

验证人：独立 Agent（与执行者上下文隔离，全部结论基于本会话亲跑亲读）。环境 node v22.23.2 / pnpm 11.7.0；全程提交态 @6577856，验证后 `git status` 复验 clean，仓库零修改。

## 一、R1-R5 逐条对峙

**R1 池与策略可重放 — PASS**
- `pnpm vitest run tests/keys.test.ts` → **9 passed**（107ms）；`pnpm vitest run tests/e2e/loopback.test.ts` → **10 passed**（7 既有 + 3 轮换）
- 断言面亲读（tests/e2e/loopback.test.ts）：round-robin wire 级 `expect(server.auths).toEqual(['Bearer k1','Bearer k2','Bearer k3'])`（:255）；order 跳过未配置 primary（configuredRefs 仅 spare → `['Bearer spare-key'×2]`，:275）；random 6 连发 ∈ {k1,k2,k3} 成员资格断言、分布不设契约（:296-298，诚实口径）
- 牙齿证明：`git log -1 5162870` message 内嵌探针红签名（round-robin 临时改 order → auths k1×3 恒序 vs 期望轮换 → 还原复绿）
- 空池文案：src/keys.ts:83-84 抛 `codes.credentialMissing`（错误码不新增），消息列全池 `[refs.join(', ')]` + `(primary: refs[0])` —— 与 ADR-0008 Decision 3「列出主 ref 与池」逐字对齐；keys.test:109-120 双名断言守护

**R2 默认零变化 + 热生效 — PASS**
- `pnpm vitest run tests/apply.test.ts tests/settings.test.ts` → **17 + 6 = 23 passed**。三热通路行为亲读在案：keySelection 提交后下一搜即 round-robin（apply.test:102-129）、pre-stored-key 次序钉死（先配置值 → commitSettings 热增 → prime 吸纳翻转 available，:131-141）、热删 ref 池收缩（:143-153）
- `pnpm vitest run tests/providers` → **5 files 81 passed**；diff 亲证五文件仅机械补 `extraApiKeyEnvs: [], keySelection: 'order'` 字面量（XxxMemberConfig 转必填的类型配套），行为断言语句逐字未动
- config.test:43-47 缺省空 extras + order；:99-104 schema 拒绝非法 keySelection（T1 留痕兑现）；settings.test 缺省透传零漂移

**R3 GUI 多 key 通路 — PASS**
- `pnpm vitest run tests/client` → **4 files 51 passed**（controller 24 + section 16 + entry 6 + locales 5）。断言面亲读：extraRefs 快照（controller.spec:294）、全池 describe（:307）、setKey 显式 ref（:319）/池外拒绝（:330）/clearKey（:340）、addExtraKey 整表 patch + revision（:351）/空名重名拒绝（:366）、removeExtraKey 过滤 patch（:378）；section 行渲染 per-ref aria（:217）/追加（:236）/移除（:246）
- `pnpm check:i18n` → **exit 0：23 keys parity + 16 files 零 CJK**
- T8 实物核对：`/tmp/dshws-s09/settings-after-add.yaml` 含 `extraApiKeyEnvs: [TAVILY_SPARE_2]`；`home/settings.yaml` 现为 `extraApiKeyEnvs: []`；`home/.credentials.yaml` `refs: {}`（fake 值已清，record 半区 secret 为浏览器会话 grant 常规产物，非 API key）——与 c9bda05 message 三断言一一对上

**R4 门墙七命令（提交态串行亲跑）— PASS**
1. `git status --short` → 干净 @6577856（前置）
2. `pnpm test` → **25 files（24 passed + 1 skipped），237 passed | 8 skipped (245)** —— 与门墙表逐字一致
3. `pnpm typecheck` → **exit 0** 双面
4. `pnpm lint` → **0 warnings 0 errors（44 files，96 rules）**
5. `pnpm build` → **exit 0；index.js 52.61 kB / index.d.ts 25.19 kB / client.js 27.17 kB** —— 三件较 S08（49.00/21.89/20.54）全增长，新值与门墙表披露逐位吻合（D7 口径兑现；tsdown 弃用 ×2 = 台账既有 🟢）
6. `npm pack --dry-run` → **total files: 5**
7. `pnpm check:i18n` → **exit 0（23 keys + 16 files）**
末置 `git status --short` → 干净，HEAD 未动。

**R5 五子证据 — PASS（T10/T11 项按计划在途）**
- 隔离：亲证 `/tmp/dshws-s09/` 自建隔离；s05b（Sep2 17:28）/s06（19:55）/s07（21:53）mtime 均早于本棒窗（Sep3 01:35-01:37）；S08 为进程内 loopback 无 /tmp home；**3414 LISTEN=0**（lsof exit 1 零残留）；**3080 = PID 90269 未动**；实户 `~/.dsh/settings.yaml` mtime Sep3 00:26 早于棒窗零接触
- 门墙：见 R4（本 Agent 亲跑即 T10 复验）
- 收尾 / 翻转：T11 待做——按任务口径**不算 FAIL**
- audit-log：stage0（2026-09-03-s09-stage0-review-of-s08.md）+ stage2（…-s09-stage2-plan-review.md）在档亲见；stage45 = 本输出（按 plan 验证矩阵落盘正本）

## 二、三问交叉验证

**问 1 安全 — PASS**：scratch settings.yaml 只落 ref 名数组、key 值只入 .credentials.yaml 凭据层（三件实物亲读）；全仓扫描（sk-/tvly-/高熵串）唯 mock 显假形态（tvly-key/k1/k2/k3/fake-key/sk-fake-*/spare-key），dump 两件只含 ref 名；3414 kill 零残留 + 3080 隔离亲证。

**问 2 契约 — PASS**：①活端口——keys.ts `refs()`/`selection()` 每调用委托 ports（keys.ts:61-63/:78/:98），工厂接线 `refs: () => live.current()[memberKey]`（index.ts:122-126），热通路为真非构造期快照（T4 首跑即红的守护红线曾实抓此点）；②空池文案与 ADR-0008 Decision 3 一致（见 R1）；③单 ref 零变化——resolveConfig 显式 `?? []`/`?? 'order'` ×五成员（config.ts:253-286），池退化为 [primary]+order，全量 245 测试零破坏亲证；④**providers 零改动承诺亲证**：`git diff 564554f..HEAD -- src/providers/` 与 `9ade4ef..HEAD` 双双为空（T1 改的是 config.ts）；refresh→prime 次序（settings.ts:93-96）兑现审核轮 2 R1 勘误。

**问 3 前瞻 — PASS**：①S10 anysearch 底座就绪——`keyPool()` 工厂成员无关（index.ts:116-139 一行一成员）、gates/客户端 MEMBERS 镜像 + `#poolOf` 全泛化（controller.ts:47-56/:264-268），anysearch 按 ADR-0009 落 providers/anysearch.ts + 四件制品模板即自动入池享池化；②S11 溯源数据面就绪——loopback 已断言 served-by 双面（result content + 链日志行，loopback.test:94/:99/:177-178/:201），且 ADR-0008 Rationale 明示轮换不改 servedBy 语义；③多 key + anysearch 组合在实现面成立（池字段 per-member，无任何成员特判）。

## 三、发现清单

- 🔴 ×0
- 🟡 ×1：**台账测试增量算术差**——T9 commit 与 progress-M7 门墙表写「+30」，实测基线 211 → 245 = **+34**（keys 9 + apply 6 + config 4 + controller 8 + section 3 + locales 1 + loopback 3）。正面证据：门墙七数字全部亲跑吻合、245 总数正确、既有测试零破坏——实体强于记录，仅增量计数少记 4，建议 T11 台账顺手更正。
- 🟢 ×3：①index.ts:96-102 注释块同义两遍（「Entry-config pool names…fail the load here」句组重复，T3 注释更新残留，T11 可顺手收敛）；②T8 boot.log 含 scratch 本地会话 token（/tmp 一次性产物，实例已 kill，无泄露面）；③providers 测试机械补缺省行有逗号前空格风格疵（`'TAVILY_API_KEY' , extraApiKeyEnvs`），lint 0w0e 不拦。

## 四、最终结论

**PASS / COMPLETE** —— R1-R5 全条目 PASS（收尾/翻转两子项属 T11 计划内在途，非缺陷）；三问全 PASS；🔴×0，🟡×1（台账算术差，实体证据完好）。S09 具备进入 T11 收官条件；本报告即 stage45 正本素材，按 plan 验证矩阵落 `docs/sessions/audit-logs/2026-09-03-s09-stage45-verification.md`。