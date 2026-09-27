# 阶段 2 独立计划审核 — plan 036 增补批（2026-09-27）

- **提示词参数头**: 骨架库版本 v2（six-stage.md 阶段 2 提示词骨架·证伪优先）｜阶段 2｜Session 35 增补批（plan 036）｜输入指针：plan 正本 docs/plans/2026-09-27-036-dns-warmup-feedback-ui-plan.md + ADR-0022 勘注后正本 + 代码锚点（intercept/resolver/chain-core/index/section/测试现状）｜相对骨架偏离说明：无（代码锚点为事实槽位清单）

---

## 首轮结论：NEEDS REVISION（N1-N4 必改 + S1-S5 建议）

**N1（🔴）** T0 核心工件未落盘：git show a4d7d93 仅含 D3 勘注，D4 勘注（boot 预热/VITEST 门槛/lazy 红线关系）实物缺失而 commit 声称已落——命中 dont-do「声称完成而核心工件未落盘」（docs 变体）；STATUS/roadmap/session 登记同缺。
**N2（🔴）** prewarm 可观测性未定义：resolve 事件只在 layerLookup 内发（intercept.ts:273-281），prewarm 直调 resolver 则 R2「chain-log 出现 decision+resolve 行」不可达成；且预解析须落 family 0 键（undici {all:true} 形态）否则与首查键失配。
**N3（🔴）** 连接级判别式未钉死：到达 chain catch 的是 memberFetchFailure 包装 DshwsError（code=requestFailed、cause=原 TypeError、cause.code 才是 ECONNREFUSED 等；凭据失败共用 code）；MEMBER_TIMED_OUT 是 symbol 非 Error，plan 未表态；回调须覆盖搜索+抓取两链（共用 ChainOptions）。
**N4（🔴）** invalidateHost 与三键缓存制（`name:family` family 0/4/6）不符——单删一键其余存活；DohResolverLike 接口扩展的兼容面（fake resolver 破坏性）未提。
**S1** T3 无红→绿腿（section.spec 对 DNS 卡零断言；refreshDnsFace/expand→refreshCounts 先例现成应补用例）。**S2** T3 行级清单缺（description <p> 去留；先例是页面 ⓘ 与 description 并存）。**S3** 负缓存不作废应明示决策+断言。**S4** prewarm 异步续行 disposed 守卫/recheck 先行时序/定时触发 live 读 mode。**S5** VITEST 门槛已核实无风险（全测试面在 vitest 进程内、loopback 为进程内 server）；证红落点=可测助手。

## 处置（主 Agent 同日）

N1：D4 勘注以断言锚点补落（全角分号失配为根因——python replace 未断言，教训入册）；STATUS/roadmap/session-35 三处登记补齐。
N2：prewarm 改走层公开 lookup 路径（family 0 同键同事件流）。
N3：判别式=cause.code ∈ {ECONNREFUSED,ETIMEDOUT,ECONNRESET,EHOSTUNREACH,ENETUNREACH,EPIPE,EAI_AGAIN,UND_ERR_*}；MEMBER_TIMED_OUT 明示计入；单点注入覆盖两链。
N4：三键全删+小写归一；DohResolverLike 增可选成员。
S1-S5：section.spec 红绿腿入 T3 验收；行级清单落 plan；负缓存明示+断言；disposed 守卫与时序写明；门槛抽 resolveWarmupDelayMs(env) 助手先红。
