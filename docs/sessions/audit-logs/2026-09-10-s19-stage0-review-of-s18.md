# Stage 0 前序审核 — S19（对象：Session 18；精简版）

> 参数头：骨架库 v2（audit-gate.md）| 阶段 0 | Session 19 | 输入指针：审核对象区间
> `c8799bd..7cc5f1f`（S18 五 commits + merge）；基线链采信 s18-stage4 正本（全量 401|13(414)
> exit0，数小时前亲跑）。相对骨架偏离说明：**精简版**（S18 阶段 4/5 刚完成，本棒为用户指令
> 清理棒）——a/c/d 子集面 + b 全量静态 + 增列 schemastery 未知键探针与移除棒前提核验。
> 执行方式：独立 spawn general-purpose Agent，只读 + 子集/静态/探针亲跑。

## 输出原文（逐字）

# Session 18 前序审核报告（精简版，独立审核 Agent）

## 一、四维核验

### a. 测试面增量判定 🟢
- `git diff --stat c8799bd..7cc5f1f`：26 files，+725/−119。代码面集中在 `src/providers/perplexity.ts`（+163 改造）与 `tests/providers/perplexity.test.ts`（+123）；其余 5 provider 及其测试各 ±2（UA/版本断言）；e2e loopback ±24；治理产物 8 件。区间与申报一致。
- 实跑子集：`pnpm vitest run tests/providers/perplexity.test.ts tests/e2e/loopback.test.ts` → **2 files / 36 passed (36)，0 fail，exit 0**（446ms）。与 s18-stage5 冒烟口径（loopback 15 + perplexity 21 = 36）逐位吻合。
- 与 s18-stage4 正本基线（全量 401|13(414) exit0）无冲突——本审核为精简版未重跑全量，采信数小时前的正本链。

### b. 静态 🟢
- `pnpm typecheck` → **exit 0**（tsc 两 program 全过）
- `pnpm lint` → **0 warnings 0 errors**（57 files, 96 rules, 27ms）
- `pnpm check:i18n` → **96 keys，union/en/zh parity holds；21 files 零 CJK 字面量，exit 0**

### c. git 🟢
- `git status --short` → 空输出，**working tree clean**
- `git rev-parse HEAD` → `7cc5f1fc9bdfb3fa7b022e349a094f5ba40e2000`
- `git cat-file -p 7cc5f1f` → **双亲 c8799bd + 1383674，merge --no-ff 亲证**
- 区间 5 commits（10e60a4/ea8d032/0933f66/6b8c060/1383674）+ merge 7cc5f1f，与申报一致。

### d. 交付物抽验 🟢
- session-18 记录：三★节齐（前序审核确认★ / 跨窗口启动指令★ / 开发规范强化★，行 7/56/79），当期格式九节全。
- ADR-0016（`docs/decisions/adr-0016-perplexity-agent-api-migration.md`）：`status: accepted` ✓；ADR-0015 两处勘注（行 30 落点勘注 + 行 39 关联）✓。
- roadmap（`docs/session-roadmap.md` 行 80）：S18 **✅ 2026-09-10**（0.3.1；401|13(414) exit0；死线解除）✓。
- CHANGELOG 最新条 = S18（0.3.1，含治理/诚实标注/跟踪分段）✓。
- audit-log ×4 在档（stage0/stage2/stage4/stage5，`docs/sessions/audit-logs/2026-09-10-s18-*.md`）✓。

## 二、债务三分级（下一棒 = 用户裁定的 Perplexity 移除棒）

- 🔴 ×0
- 🟡 ×1（既有）：web_fetch 完整替代（评估完成，实现归后续）——非 S18 引入。
- 🟢 **S18 遗留「真实 Perplexity 实测无 key」判 moot**：用户已裁定移除 Perplexity → 补 key 手动闭合路径（`perplexity.real.test.ts`）随移除棒一并消亡，不再构成追踪项。移除棒应同步：删 provider/测试/ADR 处置（0016 状态改 superseded/withdrawn 类）、settings section、CHANGELOG 披露。
- **schemastery 未知键行为实测**（`node -e` 探针 @deepseek-ai/schemastery，`Schema.object` 含 `model`/`apiKeyRef`，喂入附加 `someLegacyKey`+`nested` 未知键）→ **NO THROW，未知键原样透传保留在结果中**。结论：移除棒落地后，存量 settings.yaml 残留 `perplexity:` 节在新 schema 下**被静默忽略不报错**——不构成硬故障，但属「残尸配置无告警」的 🟢 级观察（移除棒可考虑收尾文档提示用户清理，非阻断）。

## 三、流程合规 🟢
当期格式三节齐 + 六阶段留痕（阶段 0 PASS / plan 两轮 APPROVED / 2.5 默认批准披露 / 阶段 4 R1-R5 PASS / 阶段 5 COMPLETE / audit-log ×4）+ 收官四件一致（STATUS.md 当前位置块「Session 18 ✅」+ roadmap 行 ✅ + CHANGELOG 最新条 + session 记录，四者同指 0.3.1/2026-09-10）。

## 结论：**PASS**

全部实跑命令：`git status --short` / `git rev-parse HEAD` / `git cat-file -p 7cc5f1f` / `git diff --stat c8799bd..7cc5f1f` / `git log --oneline c8799bd..7cc5f1f` / `pnpm vitest run tests/providers/perplexity.test.ts tests/e2e/loopback.test.ts`（36 passed exit0）/ `pnpm typecheck`（exit0）/ `pnpm lint`（0w0e）/ `pnpm check:i18n`（96 keys ok）/ `node -e` schemastery 探针（未知键 NO THROW 透传）。未做任何写操作。

---

## 附：移除决策事实正本（免费 key 核证，2026-09-10 独立调研 Agent）

**一句话判定：无任何面向普通用户的免费 Perplexity API key 途径**——API 纯预充值按量付费（pay-as-you-go credits），无 free tier/试用 credits，生成 key 前必须绑卡充值；唯一免费渠道 = 创业公司 [Perplexity for Startups](https://perplexity.ai/startups)（$5000 API credits，需申请审核）。

依据（出处 URL）：
1. [官方定价文档](https://docs.perplexity.ai/docs/getting-started/pricing)：整页无 free tier/免费额度表述；Search API $5/1000 次、Sonar/Agent 按 token+请求费。
2. [官方 API 计费 FAQ](https://www.perplexity.ai/help-center/en/articles/10354847-api-payment-and-billing)："API credits are available for purchase on a pay-as-you-go basis"；无充值即无余额。
3. Pro/Max 订阅不含 API 额度（官方 FAQ 明确 API 与订阅分离）；历史 Pro 附赠 $5/月 credit **已取消**（[Reddit 实证](https://www.reddit.com/r/perplexity_ai/comments/1rbcu0m/did_perplexity_remove_the_5_api_credit_that_comes/) + [CloudZero](https://www.cloudzero.com/blog/perplexity-api-pricing/)）。
4. 学生计划仅网页版 Pro 不含 API；无开发者/科研免费档（第三方"免费 Starter Tier"说法与官方不符）。
5. 最低进入 ≈ 几美元自选充值（绑卡强制）；[Apideck 指南](https://www.apideck.com/blog/how-to-get-your-perplexity-api-key)确认生成 key 需先加付款方式。
