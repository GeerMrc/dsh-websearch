# 不要做（Negative Instructions）

> 本文件记录 dsh-websearch 开发中**永久禁止的行为**。每条含三要素：❌ 错误做法 + ✅ 正确做法 +
> 来源（Session/任务编号/RCA 链接），缺一不可。
> **准入门槛**：新增条目必须经过 踩坑 → RCA → 确认是**系统性问题**后才写入，不写一次性问题
> （防清单噪音化——一次性问题记 session 记录即可）。已确认的系统性坑（超过 15 分钟才解决，
> 或导致回滚/数据丢失）不沉淀是治理失败。
> 组织方式：早期按主题分类，后期可按 Session 分组（`## <主题>（Session NN）`）追加。

## 依赖与版本（Session 01）

### ❌ 不要凭印象假设 peer 依赖的版本域

- **错误**：假设 `@deepseek-ai/cordis` 与 `@deepseek-ai/dsh-*` 同为 `0.1.2-alpha.x` 域——实测 npm 上 cordis 只有 `4.0.1-rc.1..4.0.2`（宿主 vendored 为 4.0.2；anysearch 存在证 peer 为 `>=4.0.1-rc.1 <5`）。按错误域写 package.json 将直接不可安装。
- **正确**：钉版本域前必查两处实锚——宿主 `vendor/cordis/package.json`（或 `node_modules` 实装版本）+ `npm view <pkg> versions`；dsh 系包与 cordis 系包分属两条版本线，分开核对。
- **来源**：Session 01 阶段 2 独立审核 F-001（🔴）；修订 commit `2f7ac3a`

### ❌ 不要信 npm `latest` dist-tag（对本仓库相关包失真）

- **错误**：`npm view <pkg> version`（= latest tag）判断可用版本——实测 `@deepseek-ai/dsh-settings` latest 指向 `0.0.1-rc.1` 旧线，而真实发布线 `0.1.2-alpha.2..4` 存在且 alpha.4 为最新；据此会误判「包未发布/无新版」。
- **正确**：判断发布态一律 `npm view <pkg> versions` 看全列表（必要时 `time --json` 看发布时间）；dist-tag 只作参考。钉 prerelease 域用显式 range（如 `>=0.1.2-alpha.3 <0.1.3`）。
- **来源**：Session 02 T1 双实锚核对时实测发现（`410d58f` 后）；ADR-0007 依赖钉版策略采纳

## 收官序列（Session 05b，三次复发后系统性确认；S07 扩化）

### ❌ 不要在收官/启动原子序列里漏刷新任何状态区（progress 四处 + STATUS 总览行/位置块）

- **错误**：收官或启动只刷新部分状态载体——progress 文件自身的状态区（里程碑行括注、「进行中」/「待启动」节、任务表 T 末行）漏刷；或 STATUS.md 内部里程碑**总览行**与「当前位置块」口径不同步（S06 收官刷了位置块与 M3 总览行，M4 总览行漏刷成 ⏳，S07 阶段 0 审核抓获 🟡-2）。后果 = 同文件或跨文件状态自相矛盾。
- **正确**：原子序列把状态区刷新当清单逐处打勾，缺一不可——①progress 里程碑行括注（**替换而非追加**——S05b T0 曾插入新行而旧行未删，同文件双行并存）②progress「进行中」清空并下移 ③progress「待启动」前移 ④本棒任务表 T 末行落完成态 ⑤STATUS 里程碑总览行（每个受影响里程碑，与位置块同口径）⑥STATUS 台账行 ⑦STATUS 当前位置块。收官与启动两时点同规则。
- **来源**：三次家族复发——S04 阶段 0 抓 progress-M1 同类（🟡，`c691caa` 清偿）、S05a 阶段 0 观察 S03 R 表标题、S05a 阶段 0 抓 progress-M3 状态区（🟡 Y-1，S05b T0 清偿）；第四次 = S07 阶段 0 抓 STATUS M4 总览行漏刷（🟡-2，S07 T0 清偿）——STATUS 单源规则掩护了它（位置块始终正确，总览行无人查）

## 隔离法证（Session 07）

### ❌ 不要把「~/.dsh 零接触」写成绝对主张——mtime 核对无法归因常驻进程写入

- **错误**：隔离审计用 `ls -la ~/.dsh`（或 stat mtime）核对后写「`~/.dsh` 全程零写入/零接触」——常驻进程（如 3080 停靠实例）会在本棒窗口内向默认 home 写 UI 状态（S07 实测：`~/.dsh/settings.yaml` 的 `welcomeNoticeVersion` 于 21:42 落窗），mtime 变化与本棒动作无关，但绝对主张被下一轮审核用同一证据推翻（S07 阶段 4/5 🟡-1）。
- **正确**：隔离主张一律写**「本棒动作零接触」**并附归属证据链——①本棒全部命令的 DSH_HOME 指针清单 ②涉事文件的键内容核对（无本棒命名空间键）③写入时点 vs 本棒动作时窗对照 ④窗口内新进程排查（ps）。mtime 只作「本棒动作后未变」的下限证据，不作归属证明。
- **来源**：S07 阶段 4/5 独立验证 🟡-1（`~/.dsh/settings.yaml` mtime 21:42 归因常驻 3080 实例 welcomeNoticeVersion 持久化，宿主 ui-settings-general/src/index.ts:16；session-07 记录措辞处置清偿）；S06 同款绝对主张未被查验属漏网，下不为例。

## 输入派发与实测判定（Session 14 入册；12b/S13 两棒复发定谳）

### ❌ 不要以「调用成功」判定 webview 后台态输入动作已生效

- **错误**：IAB 面板可见但宿主窗口处于后台态时，认为 `focus()` / Playwright locator click / `dom_cua.click` 调用成功返回即动作已生效——12b 实测 `focus()` 不生效（须 focusin 冒泡触发等价事件）；S13 实测 locator click 两次超时（actionability 不过）+ `dom_cua.click` 假成功无任何效果。
- **正确**：每个输入动作以「**预期效果出现**」判定（UI 状态变化亲见/断言通过），不以调用返回值判定；可靠通路 = `cua` 坐标点击（截图定位后按坐标派发）+ focusin 冒泡等价事件触发。
- **来源**：session-12b T4 手法沉淀 + session-13 T5 坑（docs/sessions/2026-09-04-session-13.md 踩坑节）；S14 阶段 0 审核 🟢① 复评入册（家族第 2 次跨棒，2026-09-06）

## 收官证据链（Session 12 阶段 0 定谳，S11 事故入册）

### ❌ 不要在收官序列里「声称完成而核心工件未落盘」——STATUS 预写收官指针前必须逐一 `ls` 实物

- **错误**：收官提交（S11 b23097b）把 STATUS 台账行写成 ✅ 并指向 session 记录路径，但该记录文件从未写入（T9 序列里「session 记录 + 接力指令」步骤被跳过）；roadmap 未更新、CHANGELOG 缺条目同批发生。下一 session 的标准自举入口（记录 + 启动指令）不存在而看板声称存在。
- **正确**：①**session 记录随 T0 创建骨架、逐阶段补内容**，收官时只做补全与核对，不做从零撰写（缺口无处藏）；②收官原子序列加「实物存在性核对」清单步——本棒收官应收工件逐一 `ls`/`git log --diff-filter=A` 亲证在档后，才允许 STATUS/roadmap 写 ✅；③指针写进看板前先验文件存在（悬空引用规则）。
- **来源**：S12 阶段 0 独立审核 🔴1（docs/sessions/audit-logs/2026-09-04-s12-stage0-review-of-s11.md；session-11 记录全历史从未存在 + STATUS:46 悬空指针 + progress-M7:73 T9 声称与实物相反）；S12 T0 修复（session-11 reconstructed 补落 + 本条目入册）

### ❌ 不要在阶段 4/5 gate 未翻案前把验收入账改成 PASS——翻转必须有复验证据先落盘

- **错误**：阶段 4/5 独立验证在盘正本为 BLOCKED（补完清单三腿在档），收官提交却把台账 T8 行写成「PASS / COMPLETE（R1-R5 逐条 PASS）」，复验输出零落盘——入账与正本直接矛盾，且按 plan 自身条文（R1/R3 含浏览器腿、jsdom 断言点名交付）该翻转在证据上不可能成立。
- **正确**：验收结论只能由**在盘 audit-log 正本**背书；BLOCKED→PASS 翻转必须先补齐正本点名的证据腿（断言/探针/浏览器腿实做或正式改判债务入台账），复验输出落盘后，才在同一原子序列里更新台账行；时点原文不删、勘误注记跟随（沿 S10 T10 先例）。
- **来源**：S12 阶段 0 独立审核 🔴2（stage45 正本 BLOCKED vs b23097b 的 progress-M7 T8「PASS / COMPLETE」；补完清单 docs/sessions/audit-logs/2026-09-03-s11-stage45-verification.md）；S12 T0 撤销入账 + T3/T5/T7/T8 证据闭合

### ❌ 不要在开发调试中触碰默认生产环境 ~/.dsh（3080）——开发实例固定 3423

- **错误**：开发/换包/实测时误把插件装进（或在）`~/.dsh` 默认环境、改其 settings/凭据/profile 依赖，或起 3080 当调试实例——污染用户日常生产安装（现装 anysearch 插件，与 dsh-websearch 后装者赢互斥，ADR-0013）。
- **正确**：一切开发调试走 3423 固定端口 + `/tmp/dshws-s14a/home` scratch 家目录；动 `~/.dsh` 的唯一合法前提 = 用户明确指令原文（交付后安装/升级生产），且操作前复述留痕。
- **来源**：用户环境裁定 2026-09-12（环境盘点确认 `~/.dsh` 从未装过 dsh-websearch 后定谳）。

## 依赖域与 semver 判定（Session 32 T0 入册）

### ❌ 不要以数值直觉断言「semver 范围覆盖某预发布版」——必须用真实 semver 实测 satisfies

- **错误**：以 `0.1.6-alpha.1 < 0.1.6` 的数值序直觉断言「peer `>=0.1.5-rc.1 <0.1.6` 覆盖 0.1.6-alpha.1 无需放宽」（S30 CHANGELOG 原句）。node-semver 预发布排除规则：预发布版仅当**同一 [major,minor,patch] tuple 且带预发布的比较子**存在时才被放行——本例唯一预发布比较子是 tuple 0.1.5 的下界，0.1.6 预发布一律 false。结果：生产 0.1.6-alpha.1 树 + 插件 v0.1.1 自切换日起 peer 未满足（false-green 审核被双重独立审核同时漏过，7 天后才被实测纠偏）。
- **正确**：任何「范围覆盖 X」断言必须以真实 semver（node_modules 内任一副本即可）跑 `satisfies(X, range)` 实测留痕再落笔；含预发布版的 peer 域用「稳定区间 + 逐个预发布显式钉」（如 `>=0.1.5-rc.1 <0.1.8 || 0.1.6-alpha.1 || …`），并随上游每个新预发布逐钉扩展。
- **来源**：S32 阶段 0/2 独立审核实锤（semver 6.3.1/7.8.4/7.8.5 三副本一致判定；audit-logs 2026-09-23-s32-t0-stage0-audit.md §3b）；CHANGELOG S30 条勘误 2026-09-23。

## 跨版本兼容分类（Session 32 T6 入册）

### ❌ 不要把上游「字段/协议改名」判为纯编译级——必须核对每一消费代的运行时读取点

- **错误**：T2 兼容矩阵将 typert strict codec `schema`→`create` 更名定为「纯编译级破坏，运行时零感知」（沿用上游注释的字段意图推断）。实况：0.1.5/0.1.6 client 的 `parseInput` 在**每次调用时**执行 `codec.schema.parse(value)`——`create` 单字段在旧宿主= `undefined.parse` 崩溃，key-count 徽标静默消失（无报错、无日志）。3434 015rc3 演练首轮抓获。
- **正确**：凡跨代兼容断言，逐一列出各消费代的**运行时校验/读取代码路径**（旧 client parseInput、旧 loader requireStrictCodec、新 loader create 工厂）再下分类结论；跨代协议字段用「双字段并存」（各代只读己方、两侧均无逐键排斥）保单一构建。最终裁决只能来自 3434 实例演练，不来自源码注释推断。
- **来源**：S32 T6 演练抓获 + 44488b7 修复（tests/key-counts.test.ts 跨代 shape 测试红→绿）；upgrade.md 三线矩阵与 ADR-0021「同族适配模式库」。


## 交接证据链（Session 35 阶段 4/5 入册；两现后系统性确认）

### ❌ 不要向审核方交接「枚举式」commit 清单——交接链一律以 git log 全量为准

- **错误**:：给阶段 0/2/4/5 审核 Agent 的输入里手工枚举 commit hash 清单时省略 docs-only 提交（S34 收官链省略 1fb2a3b；S35 执行链声称 13 个、实际 15 个——漏 4edc5b1/6c2e360 两个治理产物提交）。内容均计划内且 session 记录有载，但审核方复核 `git log` 后须自行发现差异，消耗审核预算并留下「枚举不可信」的复发记录（两棒连现）。
- **正确**：交接只给**范围锚点**（起点 hash + HEAD）+ 一句「自行 `git log <start>..HEAD` 复核全量」；确需点名个别提交时以 git log 输出为准现场生成，不凭记忆誊写。
- **来源**：S34 阶段 0 🟢② + S35 阶段 4 问题 1（docs/sessions/audit-logs/2026-09-27-s35-stage4-review.md §0/§5-1）；两现跨棒，入册防第三现。


## 客户端 Remote 挂载（Session 35 plan 036 入册；阶段 4/5 抓获）

### ❌ 不要对同一命名空间发起第二个懒 `$mount`——追加大面必须并入既有贡献单次安装

- **错误**：为 `dshws-websearch` 命名空间的 DNS 三方法单独写 `mountDnsRemote`（第二个懒 `$mount`），与 keyCounts 的懒挂载并发：后挂载者永不落定（无报错无超时的静默悬挂），refreshDnsFace 整体沉默，UI 状态面永陈旧。
- **正确**：向既有命名空间追加方法时，把新描述符**并入既有贡献**（`keyCountsContribution.descriptors` 数组拼接），保持全插件对该命名空间**恰好一次 `$mount`**（mountContribution 本义即按命名空间分组一次安装）；两消费点共用合并后的挂载面。
- **来源**：S35 plan036 T4 复测实锤（rc.2 状态面全静默 → API 直探 ok:true 定位挂载层 → 单贡献合并修复后 rc.3 卡点亮）；阶段 4/5 F8 建议。

## 同族请求面的对称性（Session 35 T11 入册；实测抓获）

### ❌ 不要让任一请求面的错误处理偏离同族模式——新面必须镜像既有面的全部分支

- **错误**：anysearch 的 extract 面（web_fetch 成员面）在 `!response.ok` 时只抛裸 `Anysearch API error (HTTP ${status})`，而同文件 search 面与其余 4 个 provider 的全部 8 个请求面都已带 `unfoldHttpErrorDetail` 响应体展开——上游 422 携带的可行动信息「Unable to extract content from the URL.」被丢弃，用户与开发者只见裸状态码，根因排查被迫绕道上游直查（T11-B 整条根因链的诱因）。
- **正确**：为任一 provider 新增请求面（search/fetch/scrape）时，错误路径必须逐分支镜像同族面（响应体 best-effort 解析、detail 拼接、abort-mid-body 归位为 aborted、httpStatus 挂载）；评审/验收清单含「8 面错误路径对称性审计」一项。real 层 e2e 只有 happy-path 锚不住这类缺陷——错误路径断言必须落在单测（mock 信封）+ 对齐 checklist 的错误列。
- **来源**：S35 T11-A 逐工具实测抓获（dd5a9df 修复，红→绿 20/20；audit-logs/2026-09-28-s36-t8-rc15-evidence/ 含修复前后对照日志行）。

## 运行时环境启动（Session 35 T11-D 入册；node20 家族第二现）

### ❌ 不要在 agent/自动化 shell 里裸用 PATH 解析的 node 启动 DSH 实例——必须 nvm 绝对路径

- **错误**：重启 3423 实例时直接 `node --import tsx/esm apps/cli/src/bin.ts web …`，agent 沙箱 shell 的 PATH 将 `node` 解析到 v20.18.3（低于 engines `^22.19 || >=24`）：进程**静默秒退、退出码 0、零输出**——无任何报错，极易误诊为沙箱拦截/key 文件权限/配置损坏（本次曾疑 key 权限，实测权限未动）。家族先例：S33 lefthook 在 node20 下崩溃（CHANGELOG 2026-09-26）。
- **正确**：一切实例启停/构建/打包命令显式用 nvm 绝对路径（`/Users/aibot/.nvm/versions/node/v22.23.2/bin/node`；含 `PATH=` 前缀方式给 pnpm script 传导）；遇「秒退+零输出」先 `node -v` 核版本，再做沙箱最小监听复现，最后才查配置层。
- **来源**：S35 T11-D 事故复盘（session-35 记录 T11-D 节：排除法全程留痕）。

## 上游适配验证纪律（Session 35 T11 入册；用户裁定升级为常备门槛）

### ❌ 不要只测 happy-path 就宣布上游适配完成——每次插件功能/适配变更必须逐成员×逐面×双路（happy+error）对齐确认

- **错误**：real 层 e2e（tests/e2e.real/*）只锚 happy-path（live query 200），anysearch fetch 面 422 信封裸抛这类错误路径缺陷全链路逃逸（单测曾有 mock 429 用例但未覆盖 extract 面 422 形态；real 层零错误路径）——直到用户逐工具人工实测才暴露。插件每次随上游/DSH 版本做适配时，若沿用同口径，同类「适配不兼容/功能不完整」缺陷将持续漏到用户侧（用户明令禁止）。
- **正确**：每次插件功能扩展、上游 API 适配、DSH 版本跟进，必须按 `docs/upstream-alignment-checklist.md` 对齐矩阵逐成员×逐面确认：端点、方法、请求形状、鉴权头、期望响应、**错误路径（确定性触发：invalid-key 401 / 不存在资源 4xx）断言错误消息携带上游 detail**；矩阵留痕入当期 session 记录，缺一格即不得宣布该面适配完成。
- **来源**：S35 T11 全程（用户两次裁定：「与上游确认再定方案」「未来每次都逐工具对齐确认」）；dd5a9df 缺陷逃逸链与 T4 回归锁定（e2e.real 错误路径用例）。


## 计划项执行纪律（Session 37 阶段 4 入册；当场抓获）

### ❌ 不要静默丢弃计划任务清单里的条目——执行中发现不做，必须留裁定痕迹

- **错误**：T14（杂项批）执行时被 lint 复零工作占据，四项计划内容（testid 前缀化/大小写统一/字符串手术换映射/魔法数收口）静默未做且提交信息零提及——阶段 4 独立审核以「🔴 声称完成而工件未落盘」家族标准逮住，被迫补做批。
- **正确**：执行中判定某计划项不做（被挤占/审后判不值得/依赖缺失）→ 当场在 session 记录或提交信息留改判（「不做+理由+去向」），或拆入债务表；禁止无声消失。子教训：**门墙读数读全输出**——`oxlint | tail -1` 只见 Finished 行，26 条警告存活三轮任务未被察觉。
- **来源**：S37 阶段 4 🔴-1（audit-logs/2026-09-28-s37-stage45-review.md；补做批 d2d9e8a）。

## 桌面端/构建环境（Session 40 入册；含一次用户目击的主进程崩溃弹窗）

### ❌ 不要在 shell 里直跑 Electron app 二进制取版本/探测——Electron 忽略 --version 直接启动 GUI，管道断裂即 EPIPE 主进程崩溃弹窗

- **错误**：在只读 dmg 挂载卷上 `"$APP/Contents/MacOS/DeepSeek Harness" --version`——Electron 不认识该 flag 直接启动整个 app；随后宿主命令被取消、stdout 管道关闭，app 主进程继续写管道 → `Uncaught Exception: Error: write EPIPE` 崩溃弹窗（用户目击「好像安装有问题」，实为管道断裂非安装缺陷）。副作用：意外完成 profiles/desktop 骨架初始化。
- **正确**：读版本一律 `PlistBuddy -c 'Print :CFBundleShortVersionString' <app>/Contents/Info.plist`（零进程启动）；启动 GUI 一律 `open -a`；确需捕获 GUI 进程 stdout（如取 host token）时以受管后台任务 `tee` 落盘且**绝不关闭其管道**，验完 `osascript quit` + `open -a` 恢复标准启动。
- **来源**：S40 T2 事故（desktop-adoption §9 T2 事故记录节；截图目击 + 根因链）。

### ❌ 不要对 GUI 启动的进程跑 `ps eww`——会把登录 shell 继承的全部凭据倾倒进输出

- **错误**：为找桌面 host token 对官方 app 主进程 `ps eww -p <pid>`——输出包含 GITHUB_TOKEN/NPM_TOKEN 等真实凭据（工具结果即泄漏面；本批未写入任何交付物）。
- **正确**：诊断 GUI 进程用 `ps -p <pid> -o command=`（仅命令行）；token/机密类信息走受控落盘日志（如上条的 tee 法），不进终端回显。
- **来源**：S40 T5c 取证过程（教训自获，未造成外泄）。

### ❌ 不要把 dev 常驻进程用 `nohup … &` 挂在会结束的前台工具调用下——会话清理会 SIGTERM 它

- **错误**：`nohup pnpm run start:desktop … &` 后前台调用结束，约 2 分钟后 dev.ts 被 `terminated`（SIGTERM；nohup 只挡 SIGHUP 不挡组信号）。
- **正确**：长驻进程用宿主的受管后台任务机制，或独立终端/tmux。
- **来源**：S40 T3 第三次启动失败现场（dev-desktop8.log 尾行 `terminated`）。

### ❌ 不要信任长期未构建/换树后的主 checkout 直接 build——先 `pnpm run clean`，且 hoisted 旧链接要按判据清扫

- **错误**：直接 `pnpm run build` 撞陈旧 `lib/` 产物（tsdown RESOLVE_ERROR 报 exports 子路径缺失）；清了 lib 又撞 `.pnpm/node_modules` 里旧布局包的 hoisted 符号链接（acp-demo/dsh-examples/landlock 家族，pnpm 与 clean 均不修剪）与未跟踪残渣目录（`native/landlock-run/`，重构前遗留）——同一目标连续五关。
- **正确**：换树/久未构建先 `pnpm run clean`；投影/解析报包 ENOENT 时按「symlink 且 target 缺失或无 package.json」精确清扫 `.pnpm/node_modules` 顶层与 @scope 两层；疑似残渣目录先 `git ls-files <dir>` 确认零跟踪再删。完整 runbook 见 upstream-sync-sop §3/§6。
- **来源**：S40 T3 五关全过程（audit-logs/2026-09-30-s40-desktop-adoption/ build-full→dev-desktop11 时序）。

## 证据与凭据、结论的写法（Session 41 入册；三轮独立核验与一轮交叉验证抓获）

### ❌ 不要在测试夹具里贴真实的令牌或密钥字面量

- **错误**：把 scratch 实例的真实进程令牌当作测试数据写进 `tests/check-release.spec.ts` 的三行字面量，随提交进了历史；发布预演的令牌扫描抓到时已经提交了两回。
- **正确**：夹具里的敏感值一律用插值拼出合成字面量，让文件里没有可被匹配的 `token=<值>`；发布门的扫描覆盖 `tests/`，不给任何目录开豁免；证据归档前先遮蔽。
- **来源**：Session 41 T11、`3eebf97`；audit-logs `2026-11-23-s41-stage3-logs/`
- **详见**：`docs/decisions/adr-0026-oidc-release-and-three-sync-gate.md` 决策 4

### ❌ 不要把少数几次观测写成全称结论，也不要因为「没实测」就删掉一句面向用户的说法

- **错误**：探针里 2 次看到客户端守卫在事件前被退订，就记成「在 rc.5 上从不触发」；审核指出用户文档里一句清除钉值的说法没有实测，执行者没有去测，而是把它删了。阶段 5 独立实测 13 次：2 次存活、1 次写入成功；那句话是对的。
- **正确**：写下「从不」「一定」之前先数样本量，样本少就写「多数」并标明次数；被指出没有实测，就去做实测，测不了就标「未验证」，不删也不留。
- **来源**：Session 41 T5p、阶段 4 第 1 轮 F3、阶段 5 第 1 轮 #1 与 #18；audit-logs `2026-11-24-s41-stage5-r1.md`
- **详见**：`docs/sessions/2026-11-23-session-41.md` 的 T5p 与 T15 条目

### ❌ 不要改了共享入口之后只跑相关子集，也不要只看门墙的退出码

- **错误**：客户端入口接入交还守卫后，每个任务只跑了自己的测试文件，全量测试红了 11 个提交才被阶段 4 抓到；同一时期 lint 有 1 条警告，执行者只看退出码，记录里写「退出码 0」。
- **正确**：改动了被多处依赖的入口（如 `src/client/index.ts` 的 `apply`），就跑所有导入它的测试文件；门墙的读数写「退出码加数字」，lint 写明警告数。
- **来源**：Session 41 阶段 4 第 1 轮 F1、第 2 轮 N1；`5e1b792`、`21c637d`

### ❌ 不要把决定技术路线的宿主行为建立在继承来的说法上

- **错误**：「桌面端没有 HMR」承自兄弟仓，没有在目标宿主版本上核实；T6、T8 两条通道都建在这个前提上。
- **正确**：凡是决定路线的宿主行为，先读目标 tag 的源码，再在该版本的实例上实测；兄弟仓的「已验证」只算线索。
- **来源**：Session 41 T5p；`docs/decisions/adr-0024-takeover-and-symmetric-handover.md` 的 Status 与决策 4

### ❌ 不要用 `pnpm add` 给严格 lockfile 的仓库加依赖而不核对 diff

- **错误**：`pnpm add -D <包>` 触发 pnpm 的时间敏感解析，顺带升级了四个无关的传递依赖，lockfile 出现大片无关变更。
- **正确**：手改 `package.json`，只把需要的 lockfile 条目并进去；在干净目录里对冻结安装做正反两个方向的验证（正向退出码 0，旧 lockfile 配新清单必须报过期）。
- **来源**：Session 41 T3

### ❌ 不要在整文件改写的脚本里复用同一变量名，也不要只凭脚本的回显判定写入成功

- **错误**：更新 STATUS.md 的脚本写成 `fs.writeFileSync(t = f, t.replace(a, b))`——第一个参数对 `t` 的赋值先于第二个参数求值，写入内容变成了路径字符串本身；124 行 / 34KB 的治理单源看板被毁成 14 字节的一行自指路径，随提交入库，提交说明还写着「STATUS 同步」。主 Agent 只看了脚本打印的「updated」与 git status 的 M 标记，没有打开文件核验。
- **正确**：整文件改写一律「读入 → 改 → 写回同一个已读入的变量」，路径与内容用不同的变量；写入后立即用行数或字节数断言（治理单源类文件尤甚）；提交前对被改文件做一次内容抽验，而不是只看 diff 状态标记。
- **来源**：Session 41 T19 独立审核必改-1（提交 `2f72733`；T19 独立审核报告发现 1）；修复见其后的修正提交
- **详见**：`docs/sessions/audit-logs/2026-11-24-s41-t19-review-r1.md`

### ❌ 不要在 live-web 实测用例里断言公网页面的文案字面量

- **错误**：三家 provider 的 extract 实测断言 `content.toContain('Example Domain')`——IANA 改版 example.com 为多语言通知页后两家用例失败，尽管链路本身（200 + text + markdown）完全正常；Firecrawl 同型用例只断言结构（长度>0）而幸免。
- **正确**：live-web 断言只钉**结构**（statusCode、body.kind、truncated）+ **体量**（长度阈值）+ **主题词**（对大小写不敏感的 /example/i 一类），不钉页面 copy；页面文案是第三方随时可变的资产。
- **来源**：Session 41 e2e.real 首次带 key 实跑（用户 2026-11-24 提供窗口）；修复见同日 test(s41-e2e) 提交
