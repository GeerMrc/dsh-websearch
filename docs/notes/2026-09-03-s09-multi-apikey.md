# S09 实录：多 APIKEY 池——多 ref 形态、轮换策略与 wire 级实证（2026-09-03）

> Session 09（feat/s09-multi-apikey-pool）技术实录，S12 手册正素材。
> 决策正本：ADR-0008；计划：docs/plans/2026-09-03-009-s09-multi-apikey-pool-plan.md。

## 池化形态（一句话版）

每成员 key 池 = `[apiKeyEnv, ...extraApiKeyEnvs]`（全部为 credentials ref，**零明文**）；
`keySelection`（order/round-robin/random，缺省 order = 现状零变化）每调用经 live config
读取；KeyPool 只负责**选 ref**，值解析三态（abort/解析失败/缺失）仍走 shared.ts 的
resolveMemberApiKey——provider 文件零改动。

## 热通路（本棒最深的坑）

- **refs 端口必须活端口**（每调用读 `live.current()`）：首版实现把池数组在载入期烘焙进
  端口，热增 ref 永不生效——T4 ② pre-stored-key 用例红（waitFor 超时）当场抓获。这正是
  plan 009 阶段 2 必改 1 警告的形态（「D1 端口形状与 T4 验收内部矛盾」），审核在计划期
  定谳、实现期仍踩到——活端口纪律（与链序 getter 同构）必须落在实现评审清单里。
- **re-prime 触发点 = settings 提交侧**：`reference-updated` 事件覆盖不了「key 先存、
  ref 后入池」（入池前该 ref 未被 gate watch）。`attachSettingsSection` 的 onChange 内
  **先 `live.refresh()` 再 `onCommitted()`**（后者 `gate.prime(全池 refs)`，加法幂等）——
  次序反了 prime 会取到 refresh 前的旧池（审核轮 2 R1 勘误，T4 ② 红线守护）。
- 无 settings 服务（entry 权威）= 载入期 prime 一次，无热增语义（与现状同构）。

## wire 级轮换实证

loopback server 到达记录扩载 Authorization（与 arrivals 平行）——轮换断言直接读
`['Bearer k1','Bearer k2','Bearer k3']`，穿透 provider 真实请求路径。牙齿证明：把
round-robin 场景临时改 order → auths 变 k1×3 恒序红 → 还原复绿（策略真实控制 wire）。

## GUI 要点

- 附加 keys 区每行 per-ref aria-label（ref 名 + 动作词）——多行同名按钮的 a11y/可测性
  同源教训（S06）延续。
- 整表 patch 语义：extraApiKeyEnvs 经 settings.update 整数组替换（宿主 mergeLayers 对
  数组整层替换）——与链排序同一回写模式。
- 纪律具象化：settings.yaml 只落 ref 名数组（extraApiKeyEnvs），key 值只落凭据层
  （.credentials.yaml refs）——浏览器断言分别对两文件取证。

## 测试线材

- fakeCtx 扩展 `values`（per-ref 可区分 key；缺省 'fake-key' 向后兼容）——轮换断言的
  前置（常量 key 无法区分轮换）。
- 随机策略分布不可精确断言：单测注入 rng 钉死取样；e2e 只断言「∈ 就绪集」成员资格。
