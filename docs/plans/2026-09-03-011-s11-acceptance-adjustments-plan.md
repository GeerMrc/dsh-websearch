# Plan — 2026-09-03-011-s11-acceptance-adjustments-plan

> plan 是验收契约：R 验收条目是 progress 台账阶段验收的对照正本。本棒 = 用户验收反馈
> 调整棒（三项确认方向 + 治理清偿批）：①开关置灰未配置成员（纯 GUI）②多 key 改单槽
> 逗号值（S09 池化重构，ADR-0008 superseded → ADR-0011）③优先级列表过滤未配置成员
> （纯 GUI）。核心逻辑/契约类 TDD；回退类任务以「先改测试证红 → 实现 → 绿」执行。

## 目标

S11 交付用户验收反馈三项调整（2026-09-03 两轮方向确认 + 默认项披露）：
①未配置 key 的成员开关**置灰禁用**（行为零变化——链本就自动跳过）；
②多 key 形态改判**单槽逗号值**（每成员一个凭据 ref，值 = `k1,...,kN` 逗号串，上限 10
把 fail-loud + GUI `!` 说明；`keySelection` 三策略保留并作用于拆分后的 key 序列；
S09 多 ref 池回退，ADR-0008 superseded → ADR-0011）；
③优先级列表**过滤未配置成员**（只展示已配置成员的排序行）。
另承接阶段 0 移交治理清偿 ×3 + MEMBERS 导出前置（S11 溯源棒复用面）。

## 背景

任务源 = 2026-09-03 用户验收反馈两轮方向确认（第一轮三项方向已答；第二轮排期/random
变体/上限未获答 → 取推荐默认：调整先行 / 变体 B 不放回随机〔S12 ADR 定谳，仍可讨论〕/
上限 10——全程披露）；决策变更正本 = ADR-0008（superseded）+ ADR-0011（新）。

阶段 0 独立审核（2026-09-03，正本将随 T0 落
`docs/sessions/audit-logs/2026-09-03-s11-stage0-review-of-s10.md`）：对 S10 **PASS**——
🔴×0；测试面五子集亲跑零偏差 + 增量算术 +21 独立复算 + 三序一致亲证 + 语法校验循环
修法逐字落地亲证。**新抓获 🟡×3（记录更正类，T0 清偿）**：①stage2 audit-log 转录缺陷
（轮 1 原文缺失 + 轮 3 逐字重复两遍——转录脚本复用了被 resume 覆盖的 agent 输出文件）
②收官序列漏刷 progress 里程碑行括注（progress-M7:18/progress-M5:17——dont-do 第三条
家族第六次）③CHANGELOG 违序（S10 条目插于 S07 与 S09 之间，反向时间序破坏）。🟢×4：
session-10「十 commit」实为 9 / progress-M7 验收 H2 重复 / /tmp 实物挥发注记 /
**MEMBERS 模块私有未导出（S11 溯源复用面前置）**。

阶段 2 独立审核轮 1（2026-09-03，独立 Agent）：**NEEDS REVISION**（必改 M1-M6：波及面
grep 实测 providers 六文件 27 处 + e2e.real 七文件 8 处 extras 字面量无任务认领/
locales.spec extras 用例漏/D5 缺 memberId 联动定谳且链渲染用例必漂/T1-T4 合并「必有一
侧红」理由可证伪/T3 extras 计数 7 处更正 + R2 grep 定界；建议 1-7：order 场景改写为
gate 跳过腿净增覆盖/keys.test 九行为去留映射/排序按钮语义锁定/section.spec 参数涟漪
豁免/entry.spec verify-only/stage2 修复标 reconstructed/MEMBERS 本体导出）。本 plan 为
修订版：必改 + 建议全数吸收。正本将随 T0 落
`docs/sessions/audit-logs/2026-09-03-s11-stage2-plan-review.md`。

阶段 2 独立审核轮 2（同 Agent 点验）：**APPROVED**（M1-M6 全闭合——T1 认领数与 grep
实测逐一相符/locales.spec 对位/memberId 统一对齐键 + 可见序列交换语义推演自洽/「必有
一侧红」删除改产品态一致性/T3 七处逐一定位/R2 定界防误伤冻结面；建议 1-7 全到位；残留
O1 摸底旧行补指针、O2 #1 措辞消歧——均非阻塞已随批吸收；执行期提示：move 语义升级涟漪
含 controller.spec move 家族边界定义变化——两文件均在 T4 认领内）。正本将随 T0 落
`docs/sessions/audit-logs/2026-09-03-s11-stage2-plan-review.md`。

阶段 1 只读摸底实锚（2026-09-03 亲测，master@fbb817f）：

- 开关：`src/client/section.tsx` MemberCard switch（`disabled` 现仅无）——Clear 按钮
  已有 `disabled={!member.configured}` 同款 gate 惯例可平移
- 池面：`src/keys.ts`（refs 活端口/三策略/空池自抛 :80-85）；`src/index.ts` poolRefs/
  校验循环 :103-105/keyPool 工厂 :116-139；gate isReady 单 ref 布尔（credentials.ts:63-65）
  ——单槽化后 gate 零改动（configured = 值存在，逗号串整体有值即 true）
- extras 字段面：config.ts 五成员+anysearch 四件制品含 extraApiKeyEnvs（Settings/
  schema/MemberConfig/resolveConfig）；client controller.ts extraRefs（:91/:123-132）+
  SectionValue.extraApiKeyEnvs + MemberSectionValue；section.tsx ExtraKeyRow（:315，用点
  :276）+ 添加行；locales extraKeys/addKey/removeKey/refName 四键
- 轮换断言：loopback.test.ts 轮换场景 auths `['Bearer k1','Bearer k2','Bearer k3']`
  ——单槽化后值 'k1,k2,k3' 拆分轮换的 wire 断言**等价成立**（轮换对象从 ref 级变 key 级）
- 优先级列表：section.tsx chains 区双 ol 直渲 `snapshot.searchChain` 全量——过滤点
- 既有断言波及（穷举）：keys.test 九行为（池语义改写）/config.test extras 断言×N/
  settings.test 无 extras 依赖/apply.test extras 相关三行为（extra 就绪/extra 语法/拓扑
  不变）/client controller.spec extras 八行为 + extraRefs 快照/section.spec extras 三行为
  + 添加行/mock MEMBERS 六项不变/e2e.real resolved 字面量（机械删除 extras 行）/
  fake-ctx values 保留（单槽仍需 per-ref 区分值——不同 ref 间；单槽化后 values 按成员
  ref 保留）
  （**波及更正以 T1/T3/T4 认领为准——轮 1 M1-M6**；上行「apply.test 三行为」为轮 1
  修正前旧计数）

## 范围决策（D1-D7，供阶段 2 审核判定层级）

| # | 决策 | 依据 |
|---|---|---|
| D1 | 开关置灰：MemberCard switch 增 `disabled={!member.configured}`（沿 Clear 按钮 gate 惯例）；aria 语义随 disabled 原生呈现；行为零变化（链 credentialsReady 本就跳过未配置成员） | 用户方向确认（关切 1 选「置灰」）；section.tsx Clear 先例 |
| D2 | 单槽逗号值：**删除五成员+anysearch 的 extraApiKeyEnvs 四件制品字段**（Settings/MemberConfig/schema/resolveConfig——breaking config change，pre-release 无兼容承诺）；key 值 = 逗号串存单一凭据 ref；`keySelection` 三策略保留，**作用于 split(',') 后的 key 序列**（trim + 滤空）；上限 **10**：拆分后 >10 fail-loud（DshwsError codes.requestFailed + 明确 message，不新增错误码——沿用 S09 不扩码承诺） | 用户方向确认（关切 2 选「单槽逗号值」+ 轮询/顺序可选 + 上限 10 + `!` 说明）；ADR-0008 superseded |
| D3 | gate/链零改动：credentials isReady = ref 有值（逗号串整体有值即 configured——describe 布尔自动兼容）；KeyPool 空池口径 = 拆分滤空后无可用 key → 既有 credentialMissing（消息列 ref）；**轮换对象从 ref 级变 key 级**（round-robin 游标/random 语义不变） | ADR-0011；credentials.ts 单 ref 布尔模型复用 |
| D4 | GUI：附加 keys 列表区/ExtraKeyRow/添加行**整删**（locales extraKeys/addKey/removeKey/refName 四键删除回 19）；主 key 输入框即唯一入口（值可逗号串）；输入框下新增 `!` helper text 一行（格式 + 上限 10 说明，新 locale 键 `keyFieldNote` en/zh） | 用户方向确认；S06 locales parity 纪律 |
| D5 | 优先级列表过滤未配置：chains 区渲染行仅显示 configured=true 的成员。**id 联动定谳（轮 1 M4）**：MemberSnapshot 增 `memberId` 字段（deriveSnapshot 从 MEMBERS 填充）——过滤与「可见序列交换」都以 memberId 对齐；**排序语义升级**：moveSearchChainEntry 在全量链上对 delta 方向**跳过未配置成员**、与相邻已配置成员交换（未配置成员保持原位）——过滤后排序在可见集合内视觉有效（轮 1 建议 3，锁定 + jsdom 断言）；全未配置时列表区空态；数据面零改动（链 credentialsReady 跳过语义不变） | 用户方向确认；轮 1 M4 修法 + 建议 3 锁定 |
| D6 | 治理清偿批（T0）：①stage2 audit-log 修复——轮 3 去重 + 轮 1 以 **reconstructed 标注**从 plan 010 留痕节与审核会话记录判词级重建（逐字原文不可恢复——轮 1 建议 6）②progress-M7:18/progress-M5:17 里程碑行推进（家族第六次）③CHANGELOG 全文重排严格反向时间序（同日以 session 号降序决断：S10/S09/S08/…/S01）④session-10「十 commit」勘正 9 + progress-M7 验收 H2 去重 ⑤**导出 MEMBERS 本体**（单一事实源——轮 1 建议 7；S11 溯源棒复用面前置，纯导出零行为） | 阶段 0 抓获 🟡×3 + 🟢×4 |
| D7 | e2e 适配：轮换场景改单槽（值 'k1,k2,k3' → auths 轮换断言不变）+ **order 场景改写 = credentialsReady=false 跳过腿**（轮 1 建议 1：单槽化后无"第二 ref"，原 order 场景改造为「成员未配置 → 链跳过、由后续成员服务」——loopback 现无 gate 跳过腿覆盖，净增）+ random ∈ 集合；**牙齿探针重演**（策略改 order → 恒序红 → 还原） | wire 断言等价性（key 级轮换的实证不变） |

## 任务分解（WBS）

| 任务 | 内容 | 验收要点 | 类别 | 前置 |
|---|---|---|---|---|
| T0 | 治理批（master 直提）：本 plan 落盘 + 阶段 0/2 audit-log（**stage2 log 修复：轮 1 补全/轮 3 去重/标注三轮**）+ ADR-0008 标 superseded + ADR-0011 落盘 + 🟡×3 清偿（progress 两行/CHANGELOG 重排）+ 🟢×4 处置（十 commit 勘正/H2 去重/MEMBERS 导出/tmp 注记）+ STATUS 启动刷新 | `git status` 前置；CHANGELOG 序 grep 亲验（09-03 两棒在上）；MEMBERS 导出且全量绿 | 治理（机械豁免候选） | 阶段 2.5 批准 |
| T1 | config 回退：删除六成员 extraApiKeyEnvs 四件制品字段（含 anysearch）；**机械清理（轮 1 M1/M2 认领）**：tests/providers 六文件 27 处字面量 + tests/e2e.real 七文件 8 处字面量删 extras 行；config.test/settings.test 断言改写 | 先红（extras 断言失败/删除后缺口）→ 绿；typecheck 双面（**合并理由更正（轮 1 M5）：client 半场自带 MemberSectionValue 零导入 src/config、两 tsconfig 程序互斥——T1 单独提交技术全绿；合并真因 = 产品态一致性（node schema 先删则 GUI 附加 keys 写入被 schema 拒绝，产品态断裂）→ 沿 S07 M-1 跨侧同步纪律**，与 T4 合并为「回退批」一个 commit，红绿证据合并披露） | TDD（回退类） | T0 |
| T2 | keys.ts 单槽拆分轮换：refs()=单 ref；resolve 后 split/trim/滤空/上限 10 fail-loud；三策略作用于 key 序列；keys.test 九行为**去留映射（轮 1 建议 2）**：#2/#7/#8 保（单 key 语义）/#3/#5 改写为 key 序列上轮换与采样/#1 改写为主值未存（resolve undefined）→ 空池 fail-loud 列 ref/#4 改写为值变更后游标取模/#6 改写为空或纯逗号值 fail-loud 列 ref/#9 保留 | 先红（池语义断言失败）→ 绿 | TDD | T1 |
| T3 | index.ts 单 ref 化：poolRefs 删 extras/校验循环收单字段/keyPool 构造简化；apply.test extras 耦合 **7 处逐条**（就绪/tavily 语法/thunk 跳过/anysearch 语法/热改轮换/提交增 ref/提交删 ref——轮 1 M6 计数更正）删除或改写 + 单槽就绪行为 | 先红 → 绿；拓扑断言不动（六件不变） | TDD | T2 |
| T4 | client 回退 + 置灰 + 过滤（D1/D4/D5 与 T1 的 client 面合并）：extraRefs/ExtraKeyRow/添加行删除 + setKey 回两参 + 主输入框 `!` 说明（keyFieldNote 键）+ 开关置灰 + 优先级列表过滤未配置（D5：**MemberSnapshot 增 memberId** + **moveSearchChainEntry 语义升级为可见序列内交换**——delta 方向跳过未配置成员与下一个/上一个已配置成员交换，未配置成员保持原位；jsdom 断言锁定该语义）+ locales 四删一增 + controller.spec/section.spec 改写 + **locales.spec extras 用例删除/keyFieldNote parity 断言（轮 1 M3）** + entry.spec **verify-only**（轮 1 建议 5：零 extras 引用，核对无改动） | 先红 → 绿；jsdom 断言：置灰态/过滤态/可见序列交换/单槽保存载荷/`!` 文案；**「零漂移」收窄：node 侧链语义既有测试零漂移（轮 1 M4）**；section.spec save/clear 两用例参数涟漪豁免声明（轮 1 建议 4） | TDD | T3 |
| T5 | e2e 轮换场景改写（D7）+ 牙齿探针重演 | auths 轮换断言不变成立；探针红签名入 commit | 验证类（+牙齿） | T4 |
| T6 | 浏览器实测棒（scratch 3417 新建，**3416 用户查看实例零接触**）：开关置灰态（未配成员）/逗号填 3 把→轮换保存/超限 11 把拦截/优先级列表只显已配置/复原 | 断言全过留痕；s05b-s10 现场零接触 | agent 实测棒 | T5 |
| T7 | 门墙七命令（提交态）+ progress-M7 批次表/门墙表 + Agent Note（docs/notes/2026-09-03-s11-adjustments.md：单槽语义/回退决策/转录坑） | 门墙数字亲见；基线 266 → 新基线（extras 行为删改对冲，增量披露） | 门墙+文档 | T6 |
| T8 | 阶段 4/5 独立验证 | PASS / COMPLETE | 强制独立 | T7 |
| T9 | 收尾：session 记录 + STATUS/roadmap/CHANGELOG 原子收官（**progress 里程碑行含镜像行——家族第六次教训**）+ merge + 接力指令 | 6 件套齐 | 收尾 | T8 |

## 验收条目（R1-R5）

| # | 条目 | 对应反馈 |
|---|---|---|
| R1 | 开关置灰：未配置成员 switch disabled 断言（jsdom + 浏览器）+ 配置后可开 | 反馈① |
| R2 | 单槽逗号值：keys.test 拆分轮换/上限 fail-loud + loopback auths wire 轮换 + GUI 逗号保存（浏览器）+ `!` 说明渲染 + extras 字段 **src/ tests/ 定界零残留（grep）** | 反馈② |
| R3 | 优先级过滤：jsdom 未配置成员不渲染 + 浏览器列表只显已配置 + 数据面零改动（链语义既有测试零漂移） | 反馈③ |
| R4 | 门墙七命令（提交态）+ 增量披露（池化回退，build 预期缩减） | 门墙纪律 |
| R5 | 五子证据 + 治理清偿核验（stage2 log 修复/里程碑行/CHANGELOG 序） | 收官序列 |

## 验证矩阵

| 验证 | 时点 | 责任 | 证据落点 |
|---|---|---|---|
| config/keys/接线/client 红绿 | T1-T4 | 主 Agent | commit message |
| e2e 改写 + 牙齿探针 | T5 | 主 Agent | commit message |
| 浏览器断言 | T6 | 主 Agent | 证据 commit + /tmp/dshws-s11/ |
| 门墙七命令（提交态） | T7 + T8 复验 | 主 Agent → 独立 Agent | progress-M7 |
| R1-R5 对峙 + 三问 | T8 | 独立 Agent | audit-logs/…-s11-stage45 |
| 原子收官 | T9 | 主 Agent | 四件 diff |

## 高危命令预告

①/tmp/dshws-s11 scratch 自建 ②端口 3417 启停（--no-open；LISTEN 过滤 kill；**3416
用户查看实例零接触**）③scratch pnpm install ④浏览器自动化（fake 值 unset 复原）
⑤npm pack。不涉及 push/publish/删除/凭据真实值/依赖变更/治理产物删除。

## 债务归属映射（正本）

| 债务 | 等级 | 归属 |
|---|---|---|
| 🟡 stage2 audit-log 轮 1 缺失+轮 3 重复（阶段 0 抓获） | 🟡 | **T0 修复**（转录坑入踩坑节） |
| 🟡 progress 里程碑行漏刷（家族第六次） | 🟡 | **T0 清偿** |
| 🟡 CHANGELOG 违序（阶段 0 抓获） | 🟡 | **T0 重排清偿** |
| 🟢 session-10 十 commit→9 勘正 / progress-M7 H2 重复 / /tmp 挥发注记 | 🟢 | T0 顺手 |
| L-2 / fetch 排序 / 恢复默认按钮 / anysearch fetch 面 | 🟢 | 维持 |
| 多 key GUI 策略控件（keySelection 下拉） | 🟢 新登记 | 用户未要求 GUI 控件（配置文件项即可）；S12 策略棒再评估 |
| v2 backlog：余额/积分看板 | 🟢 v2 | 维持 |

## 风险

- **回退面横跨 node+client**：T1 单独提交技术全绿（两 tsconfig 程序互斥），但 node
  schema 先删则 GUI 附加 keys 写入被 schema 拒绝（产品态断裂）——T1/T4 合并为一个回退批
  commit（产品态一致性；红绿证据合并披露），沿 S07 M-1 跨侧同步纪律
- **提交态红线**：T1 已发生过「批内漏一文件带红 amend」——本棒每个文件改完立即跑该
  文件测试 + 批末全量，commit 前确认 HEAD 基点（T2 误 amend 教训）
- **单槽轮换与 gate 的时序**：gate configured=true 但值全为空串（用户存了 ","）——
  拆分滤空后空池 → credentialMissing fail-loud（诚实路径）；GUI 保存前校验非空非逗号
  拦截第一道
- **用户查看实例（3416）运行旧代码**：S11 落地后该实例不自动更新——接力指令注明
  重启方式，避免用户误判
