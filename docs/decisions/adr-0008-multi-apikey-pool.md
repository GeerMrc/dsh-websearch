---
title: "ADR-0008: 每成员多 APIKEY 池（多凭据 ref）与选择策略（order/round-robin/random）"
status: accepted
date: 2026-09-03
type: feat
origin: 用户需求扩展（2026-09-03 批准的功能扩展计划；探索实测三探员定谳）
---

# ADR-0008: 多 APIKEY 池与选择策略

## Status

accepted（2026-09-03，功能扩展计划用户批准）

## Context

用户需求：每个 websearch 成员（Tavily/Exa 等）支持配置多个 APIKEY，并按策略（random 轮询/顺序等）选取发起请求；按余额/积分选 key 与余额看板列为 v2 缓议。现状：每成员单凭据 ref（`apiKeyEnv`，如 `TAVILY_API_KEY`），经宿主 credentials 服务逐操作解析（provider 不持 key）。

探索实测（2026-09-03，file:line 在档）：

1. 宿主 credentials ref 半区为**单值覆盖式**（`set(ref, value)` 整体覆盖；值须非空字符串）；ref 命名 `REF_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/`——`TAVILY_API_KEY_2` 类派生命名合法；ref 不可枚举（配置面从 settings schema 获知 ref 名）；`describe(refs[])` 支持批量。
2. settings 数组字段 patch = **整字段替换**（`mergeLayers` 对数组整层替换；`searchChain` 同款先例）——列表编辑可经 GUI patch。
3. key 明文入 settings（字面量 `apiKeys: string[]`）违反项目纪律「key 一律 credential-ref，禁入任何文件/快照」。
4. record 半区（`CredentialKey` + `ApiKeyRecord`）确有多值能力，但客户端 wire（`ctx.remote.credentials`）只暴露 describe/set/unset，无 record 读写方法——GUI 不可达。
5. 轮询落点：provider 构造时绑定 `resolveApiKey` thunk（每操作解析、跨调用无缓存）——在 index.ts 构造处替换 thunk 即可，provider 文件零改动；`CredentialGate.prime` 接受任意 ref 列表。
6. ui-primitives 无现成列表输入原语；链排序 UI（自绘条目行 + 整数组 patch 回写）为同构先例。

## Decision

1. **多 ref 形态**：每成员 config 新增 `extraApiKeyEnvs?: string[]`（附加凭据 ref 名；主 ref = 既有 `apiKeyEnv` 不动）。有效 key 池 = `[apiKeyEnv, ...extraApiKeyEnvs]`；派生命名约定 `<主ref>_<N>`（如 `TAVILY_API_KEY_2`）。**禁止字面量 key 数组**入 settings/cordis.yml（纪律不变）。
2. **选择策略**：每成员 config 新增 `keySelection?: 'order' | 'round-robin' | 'random'`，缺省 `'order'`：
   - `order`：取池中**首个就绪**（configured）ref——不配置即现状，默认行为零变化；
   - `round-robin`：就绪 refs 间轮转（游标成员内自持，进程内跨调用递进）；
   - `random`：每次调用在就绪 refs 中均匀随机。
   策略与池**每 search 调用时经 live config 读取**（settings 热通路，与启停同机制）。
3. **gate 语义**：成员就绪 = 池中**至少一个** ref configured；`CredentialGate` watch/prime 扩展到全池 refs；`credentials/reference-updated` 事件刷新重描述全池。全池皆未配置时才 `CREDENTIAL_MISSING`（错误信息列出主 ref 与池）。
4. **实现落点**：新 `src/keys.ts`（KeyPool：解析全池 → 过滤就绪 → 按策略选 ref → 解析值）；index.ts 构造处将每成员的 resolveApiKey thunk 换成池化 thunk——**provider 文件零改动**（thunk 签名不变）。
5. **GUI**：MemberCard 扩展附加 keys 列表（自绘，仿链排序模式：每行 ref 名 + describe 状态 + 保存/清除/移除 + 追加行；整表 patch 回写 `extraApiKeyEnvs`）；状态点反映池就绪态；typed locales 增键（parity/CJK 门禁随棒）。
6. **e2e**：loopback stub 记录 Authorization header——round-robin 三 key 三连发逐把轮换断言 / random 冒烟 / order 首个就绪断言。
7. **v2 缓议**：按余额/积分选 key 与余额定期统计/看板不在本 ADR 范围（需各 provider 余额 API 调研 + 看板 slot 选型，届时另立 ADR）。

## Rationale

- 多 ref 是唯一同时满足「key 零明文纪律 + GUI 可达（现有 wire 面）+ provider 零改动」的形态（实测三候选排除过程见 Context 3/4）。
- 策略读 live config（非构造期固定）与链序/超时热通路同构；`order` 缺省保证不配置 = 现状（增量最小）。
- 轮换只发生在凭据解析层，链编排/servedBy/错误摘要语义不变（成员仍是单调用单元）。

## Alternatives Considered

### 方案 A: settings 字面量 `apiKeys: string[]`
- 优点：无 ref 派生命名；GUI 直接编辑值列表。
- 排除理由：key 明文落 settings.yaml/快照——违反凭据零明文纪律；脱离 credentials 页生态与 configured 状态点。

### 方案 B: record 半区多值（ApiKeyRecord.env / GrantRecord）
- 优点：单逻辑 key 槽多值原生。
- 排除理由：客户端 remote credentials 面无 record 方法（宿主 wire 未开），改宿主 = 侵入；插件全链路（gate/客户端端口）在 ref 面，改造成本失衡。

## Consequences

### 正面后果
- 不配置 = 现状（单 ref 单 key）；配置即得轮换，热生效。
- provider 层零改动，5 成员（及后续 anysearch）统一受益。
- GUI 复用自绘列表先例，凭据全部走 credentials 服务（状态点/凭据页生态一致）。

### 负面后果 / 风险
- 派生 ref 名靠约定（`_2/_3`），凭据页看不到「属于哪池」的分组语义（描述性解决：README + 卡片行内 ref 名直显）。
- round-robin 游标为进程内状态，重启归零（可接受：轮换是负载分摊而非精确公平保证）。
- 随机策略无法在 e2e 精确断言分布（冒烟断言「就绪池内取样」）。
