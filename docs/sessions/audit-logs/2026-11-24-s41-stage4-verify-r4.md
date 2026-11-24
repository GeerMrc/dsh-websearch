# S41 阶段 4 audit-log（第 4 轮复审，最终确认）— 执行回顾审核

## 参数头

- 骨架版本：库版本 v2（`references/six-stage.md` 阶段 4 骨架）
- 阶段：4（第 4 轮，确认性复审）
- Session：41
- 输入指针：plan 正本 `docs/plans/2026-11-23-048-s41-takeover-docsplit-oidc-plan.md`；提交范围 `56208f0..fd65f13`（第 3 轮之后到阶段 6 收尾，审核 Agent 自行 `git log` 复核为 8 个）；阶段 5 第 1 轮报告 `2026-11-24-s41-stage5-r1.md` 及其证据归档 `2026-11-24-s41-stage5-live/`；阶段 6 的收官文档（progress-M7、STATUS、roadmap、CHANGELOG、dont-do）；测试命令 `pnpm test`；静态检查命令 `pnpm run typecheck`、`pnpm run lint`、`pnpm run check:i18n`、`pnpm run build`
- 相对骨架的偏离说明：复审续用前三轮审核 Agent 的上下文。任务书请它同时从阶段 4 的角度复核阶段 5 必改项的处置，并给了六项重点（解析改动、工作流加固、证据归档、阶段 6 文档、全量门与八步预演、R1–R8 最终判定）。审核 Agent 在自己的克隆里模拟过 T17（建本地 tag），主仓库未受影响。
- 审核 Agent：同前三轮（general-purpose，与执行者上下文隔离）
- 输出原文落盘：本文件下一节（由脚本从审核 Agent 的输出文件逐字拼接，未经主 Agent 改写）

## 审核 Agent 输出原文（逐字，未经主 Agent 改写）

# S41 阶段 4 第 4 轮复审报告（最终确认）

**总体结论：NEEDS REVISION。** 全量门五条全绿，八步预演通过，第 3 轮的 M1、M3、M5、M6、M7 和 N13 已吸收。执行者侧仍有 4 组必改：

- 这次重写的令牌扫描有两处缺陷：同一文件多处匹配时行号输出 `NaN`；含非法 UTF-8 字节的行仍被放过，阶段 5 的必改 #4 只处置了一半。
- 阶段 5 必改 #1 点名的位置里，ADR-0024 的 Status 和后果两处没有改，另有几份文档留着同类过头句。
- `progress-M7.md` 有两个悬空指针和一句把未完成写成已完成的话。

R2、R5、R6、R8 仍然只能由用户裁决解决。

## 0. 第 3 轮与阶段 5 发现的逐条吸收判断

### 第 3 轮 M1–M7，以及 N11 后半、N13

| 编号 | 判断 | 提交 | 我取得的证据 |
|---|---|---|---|
| M1 扫描对象的描述 | 已吸收 | `678cce1`、`999b6c3` | 手册第 71 行、ADR-0026 第 51 行、脚本头注释、release.yml 第 65 行的步骤名都写成 HEAD 提交树 |
| M2 2.5 裁决 | 未变 | 无 | 只能由用户解决 |
| M3 新语义没有用例、手册没说明 | 已吸收 | `678cce1`、`999b6c3` | 新增用例「scans the committed tree only」；手册第 71 行写明「已提交的」 |
| M4 冒号路径与二进制丢报 | 部分吸收 | `678cce1` | 冒号路径和以 `HEAD:` 开头的路径现在都能报出；二进制只修了一半，还引入了行号 `NaN`。见 K1、K2 |
| M5 stage4-raw 索引的「未归档」行 | 已吸收 | `725430e` | 5 行的原文件名已放回第一列；27 行对应 27 个文件 |
| M6 测试往系统临时目录留仓库 | 已吸收 | `678cce1` | 在主仓库跑了一次全量后，`dshws-release-*` 目录数仍是 219，没有新增 |
| M7 留给后续阶段的各项 | 已吸收 | `fd65f13` | 交付物表补齐；锚点台账已更新；V3 由阶段 5 重做。遗留见 K4、S3、S4 |
| N11 后半：现行文案的 V3 | 已做，又有新缺口 | 阶段 5 M1 | 阶段 5 通过了，但用的是 `6de6a17` 之前的文案；之后的改写还没在 rc.5 上渲染过 |
| N13 锚点台账 | 已吸收 | `fd65f13` | S41 台账与 S40 锚点表都在；两处提交指针过期，见 S3 |

### 阶段 5 报告的必改 #1–#5

| 编号 | 判断 | 证据 |
|---|---|---|
| #1「从不触发」一类表述 | **未处置到位** | 源码注释、测试头注释、ADR-0024 决策 4、问题表 ⑥、README、session 记录的 T5p 条目已改。ADR-0024 的 Status 与后果节没改，另有 4 份文档有残留，逐处见 K3 |
| #2 组件开关的后果与恢复 | 已吸收 | `docs/plugin-page.zh.md:42-46` 及英文版；问题表 ⑦ |
| #3 恢复「官方页重新选择并保存」 | 已吸收 | `docs/plugin-page.zh.md:36-41` 及英文版；`README.md:178` 及英文版 |
| #4 令牌扫描放过二进制文件 | **未处置到位** | git 会报「Binary file matches」的那些形态现在能报出；git 自己不报的形态仍然放过。见 K2 |
| #5 扫描对象写成 tarball 内容 | 已吸收 | ADR-0026 第 51 行；release.yml 第 65 行 |

阶段 5 的建议 #6、#8、#9 已做（`d37e973`），#14、#15、#16、#18 已做。#7、#10 至 #13、#17 没有处置，都登记在 session 记录「没有处置的独立审核建议」里。

## 1. 参数头

- **环境**：macOS darwin 27.0.0 arm64，zsh，git 2.54.0，locale 为 `C.UTF-8`；node v22.23.2，pnpm 11.7.0。
- **主仓库**：分支 `feat/s41-takeover-docsplit-oidc`，HEAD `fd65f13f5c433a452f650b83063e7601147ef29d`，`git status --short` 无输出。`git rev-list --count 56208f0..HEAD` 为 8。`package.json` 版本仍是 0.2.0，`USER_AGENT` 仍是 `dsh-websearch/0.2.0`。
- **实验目录**：`/tmp/dshws-s41/stage4/r4/`。
- **约束遵守**：主仓库零改动，`dist-artifacts/` 两个 tarball 的 sha256 不变；没有探活 3434；没有读写或列出 `~/.dsh`。
- **偏离与自述**：
  - 在主仓库跑过几条只读的 `git grep`，查 HEAD 树。
  - 在我的克隆里模拟过 T17：建了本地 tag `v0.2.1` 和两个提交，验完用 `git reset --hard fd65f13` 复原。主仓库没有任何 checkout、tag 或 reset。
- **更正我自己的三处**：
  - 第 3 轮我把 `git grep -z -n` 的输出描述成「三段、各用 NUL 结尾」，那是只看了单条匹配的样本。实际每条记录是「路径 NUL 行号 NUL 内容 LF」。这次的 `NaN` 与这个描述有关。
  - 第 1 轮我写「全量测试红了 9 个提交」。实际从 `82b3a86` 到 `a66ef5d` 连续 11 个提交都是红的。记录第 396 行和 dont-do 沿用了 9。
  - 第 2 轮我接受执行者删掉「在官方页重新选择即可清除」的做法。阶段 5 实测证明那句话本来是对的，当时应当要求补测而不是删除。

## 2. 全量门结果（主仓库，串行）

| 命令 | 退出码 | 关键数字 |
|---|---|---|
| `pnpm run typecheck` | 0 | 两面 tsc 均无输出 |
| `pnpm run lint` | 0 | **0 warnings**、0 errors；95 files、96 rules |
| `pnpm test` | 0 | Test Files 47 passed / 1 skipped (48)；Tests **715 passed / 17 skipped (732)**；Duration 5.44s |
| `pnpm run check:i18n` | 0 | check-locales 179 keys；check-cjk 43 files |
| `pnpm run build` | 0 | `lib/index.js` 155.68 kB，`lib/index.d.ts` 52.10 kB，`lib/client.js` 359.04 kB |

与记录一致：`check-release.spec.ts` 25 条，`release-workflow.spec.ts` 10 条，其余文件的条数没变。

## 3. R1–R8 最终判定

| 条目 | 判定 | 证据 |
|---|---|---|
| R1 接管 | PASS | patch 与其测试未改；V1、V5 有归档证据 |
| R2 交还 | **FAIL**（待用户裁决） | 单元测试全绿；T7 未实现。V5 通过，V11 由阶段 5 测通；V7 是非确定性的（13 次关闭里 1 次清除）；V10 未执行。清理方法已写入用户文档与 README |
| R3 文档分离 | PASS | 10 passed；V3 在阶段 5 通过。现行文案的渲染还欠一次，见 S4 |
| R4 发布门 | PASS（验收子句成立） | 契约测试 25 与 10 全绿；`grep -n "NPM_TOKEN\|NODE_AUTH_TOKEN" .github/workflows/release.yml` 退出 1；两份工作流解析退出 0；八步预演通过。加固代码里的缺陷 K1、K2 在子句之外 |
| R5 上游对齐 | 受阻（待用户裁决） | `peer-range.spec.ts` 23 passed；功能腿、带 key 的 e2e.real（17 条全跳过）、对齐清单留痕都没做 |
| R6 rc.5 实测 | **FAIL**（待用户裁决） | V1 至 V6、V11 有证据；V7 非确定性；V8、V10 未执行 |
| R7 文档 | PASS（子句成立） | 手册、SOP、问题表、`upgrade.md` §6、两份 ADR 的勘正注都在；本范围 18 个改动文档 48 条本地链接，断链 0。文档间的残留矛盾句见 K3 |
| R8 治理 | 部分（待用户裁决） | 记录十节齐全、没有占位；progress 台账与锚点已更新；STATUS 与 roadmap 都写「未收官」，口径一致；roadmap 仍无 42 行 |

## 4. 提交卫生（`56208f0..fd65f13`，8 个提交）

- 没有混入无关文件，没有误提交的产物。
- `725430e` 的说明写「47 份完整 dump 只登记字节数与哈希」，实际是 21 份完整 dump 加 26 个空文件。索引本身是对的，仓库内文档没有引用这个数。
- 其余提交说明与所改文件相符。

## 5. 克隆预演与实验

### 5.1 八步预演（HEAD `fd65f13`）

| 步骤 | 命令 | 退出码 | 输出 |
|---|---|---|---|
| 1 | `git clone --branch feat/s41-takeover-docsplit-oidc /Volumes/IPFSJK/Zcode/dsh-websearch /tmp/dshws-s41/stage4/r4/clone` | 0 | 克隆 HEAD 为 `fd65f13…` |
| 2 | `pnpm install --frozen-lockfile` | 0 | `Packages: +313`，`Lockfile is up to date`，Done in 1.1s |
| 3 | `pnpm run build` | 0 | 三个产物，大小同主仓库 |
| 4 | `pnpm exec vitest run tests/check-release.spec.ts tests/package-meta.spec.ts tests/patch.test.ts tests/release-workflow.spec.ts` | 0 | 4 files，55 passed（25、10、10、8） |
| 5a | `node scripts/pack.mjs` | 0 | `packed maricgeer-dsh-websearch-0.2.0.tgz + dsh-websearch-0.2.0.tgz → dist-artifacts/` |
| 5b | `node /tmp/dshws-s41/stage4/r4/link/scripts/pack.mjs` | 0 | 输出相同，tarball 的 sha256 也相同 |
| 6a | `node scripts/check-release.mjs --tarballs dist-artifacts` | 0 | `check-release: ok` |
| 6b | 经符号链接的绝对路径，同上 | 0 | `check-release: ok` |
| 7a | `node scripts/check-release.mjs --tag v0.2.1` | 1（预期） | 见下 |
| 7b | 经符号链接的绝对路径，同上 | 1（预期） | 与 7a 逐字相同 |
| 8 | `git status --short` | 0 | 无输出 |

7a 的输出：

```
check-release: tag v0.2.1 does not name the package.json version (0.2.0); expected v<version> with a stable triple
check-release: 1 problem(s)
```

### 5.2 令牌扫描的解析改动

上一轮 E1–E16 里受影响的重测结果如下。带值行都是合成的。

| 场景 | 上一轮 | 本轮 |
|---|---|---|
| E7 文件名以 `HEAD:` 开头 | `ok` | 报出 `HEAD:x.log:1`，退出 1 |
| E8 文件名含冒号，两行带值 | `ok` | 报出 `a:b.log:1` 和 `a:b.log:NaN` |
| E9 目录名含冒号 | `ok` | 报出 `dir:x/HEAD:y.log:1` |
| E10 二进制：`NUL 01 02 token NUL FF` | `ok` | 仍是 `ok`，退出 0 |
| E17 三个文件，其中两个文本文件各有多行匹配 | 未测 | 文本文件的第一处正确，第二处是 `NaN`；二进制文件报「binary file」 |
| E18 文件名含换行 | 未测 | 退出 2，`unexpected git grep output` |
| E19 文件名含通配符、路径魔术字符、空格、引号 | 未测 | 5 个全部报出，行号正确 |
| E20 把残缺清单直接喂给 `tokenFiles` | 未测 | 6 种畸形输入都抛错；空串返回空数组 |
| E1、E4、E5、E6、E11 至 E16 | 不变 | 与上一轮相同 |
| E2、E3：只暂存或只改工作区 | `ok` | 仍是 `ok`；现在有用例钉住 |

**缺陷一：同一文件第二处及以后的行号是 `NaN`。** `tokenLines` 按 NUL 切分后取第 1、4、7… 个字段当行号。git 的实际输出是每条记录「路径 NUL 行号 NUL 内容 LF」，路径每条都重复。原始字节如下：

```
H E A D : a : b . l o g \0 1 \0 x token=… \n H E A D : a : b . l o g \0 3 \0   token=… \n
```

门照样失败，不会放行，但给出的位置是错的。25 条用例里没有一个文件带两行匹配。

**缺陷二：含非法 UTF-8 字节的行仍然放过。** 我用 18 种文件形态各建一个仓库，清单这一步 `git grep -z --full-name -c` 就没报出来的有 5 种：

- `NUL 01 02 token NUL FF`
- `NUL 01 02 token FF`
- `token NUL FF`
- `token FF`（没有 NUL）
- gzip 头加 token 再加 LF

规律是：带值的那一行里有非法 UTF-8 字节，git 的正则在 `C.UTF-8` locale 下就不匹配。PNG、gzip 这类文件正是这种形态。阶段 5 建议的 `-a` 不管用，5 种都仍然不报。

**有效的修法我验证过**：给 `git grep` 加 `LC_ALL=C`，5 种全部报出，退出 0。主仓库的 HEAD 树在 `LC_ALL=C` 下仍然无命中（退出 1）。Linux 上是否同样漏报，我没有条件测。

### 5.3 工作流三处加固

- `persist-credentials: false`：两份工作流的 checkout 步骤解析后都带这个设置。之后的步骤没有一处需要这份检出凭据：一致性门只用本地 git，`gh` 用 `GH_TOKEN`，发布走 OIDC。
- `ci.yml`：解析出的 `permissions` 是 `{"contents":"read"}`。
- npm 版本断言：位于 `npm install -g npm@11` 之后、`npm publish` 之前。我在本机用 `bash -e` 原样跑了一遍，npm 是 10.9.8，输出 `npm >= 11.21.0 required, found 10.9.8`，退出 1，符合设计。
- 契约测试对三项都有实断言：两份工作流的每个 checkout 步骤、`ci.permissions` 的全等、版本断言的位置。
- 没有发现新问题。

### 5.4 阶段 5 证据归档

- 索引 180 行：133 行对应 133 个文件，一一对应；21 行是「未归档，只登记字节数与哈希」的完整 dump；26 行是空文件。
- 21 行登记的字节数与哈希，我拿 `/tmp/dshws-s41/stage5/evidence/` 下的原文件逐个复算，全部一致。
- 130 个归档文件与原文件逐字节相同；另 3 个是工具脚本，哈希与索引一致。
- 敏感内容：四个归档目录共 277 个文本文件，按 10 类凭据形态和 2 个已知真实令牌值扫描，命中 0。全树 841 个文本文件里已知令牌值命中 0。

### 5.5 阶段 6 文档

- **接力指令**：与 `.session-start` 的当期格式一致，五个语义点齐全，并写明裁决之后才生效。
- **CHANGELOG**：新条目的标题不含版本号。我在克隆里模拟了 T17：版本号改成 0.2.1 并打 tag，而 CHANGELOG 不动时，门报 `CHANGELOG's first dated heading does not mention v0.2.1`，退出 1；在它上面加上 `## 2026-11-25 — v0.2.1 发布` 后这条消失。S41 条目不会被误认成版本条目。
- **数字抽验**：记录里的 710/17 (727)、715/17 (732)、lint 0 警告、11 次关闭里 2 次存活 1 次写入，与我的实跑和阶段 5 报告一致。

## 6. 发现清单

### 必改：执行者侧仍可修

**K1 令牌扫描对同一文件的多处匹配输出 `NaN` 行号。新。**
- 位置：`scripts/check-release.mjs` 的 `tokenLines`，`678cce1` 引入。
- 修法：先按 LF 切记录，再按 NUL 取行号；补一个文件带两行匹配的用例。

**K2 令牌扫描仍然放过含非法 UTF-8 字节行的文件，阶段 5 必改 #4 未处置到位。新（与第 1 轮 F9、第 2 轮 N5、第 3 轮 M4 同族）。**
- 修法：给三处 `git grep` 调用加 `LC_ALL=C`，补一个带 0xFF 字节的二进制用例。

**K3 阶段 5 必改 #1 未处置到位：过头句残留。复发**（dont-do「计划项执行纪律：不要静默丢弃条目」，以及本 session 新入册的「不要把少数几次观测写成全称结论」）。**
- `docs/decisions/adr-0024-takeover-and-symmetric-handover.md:15`：「rc.5 实测表明在已发布的图形界面宿主上不成立」。这一行是阶段 5 报告点名的。
- 同文件 `:16`：「决策 6 的逃生口未实测」。阶段 5 已测通。
- 同文件 `:106`：「rc.5 上尚不成立」。
- 同文件 `:112`：「交还在 rc.5 上不成立：经插件页、命令行关闭时都不会清除」。这一行也是阶段 5 点名的。
- 同文件 `:115`：「V11 与 Session 42 步骤 1 实测，均未做」。V11 已做。
- `docs/00-architecture.md:120-121`：「插件被关闭后自己没有执行通道……在 rc.5 上不成立」。
- `docs/desktop-adoption.md:100`：「插件被关闭后自己没有执行通道」。
- `docs/plans/2026-11-23-048-s41-takeover-docsplit-oidc-plan.md:247`：「但在 rc.5 上没有被触发的时机」，紧跟在勘正注之后。
- 同文件 `:250`：「V8、V10、V11 未执行」。
- `docs/sessions/2026-11-23-session-41.md:332`：交付物表里「后两者在 rc.5 上没有触发时机」，与同一记录第 348 行的「偶发生效的尽力通道」矛盾。
- `README.md:41`、`:66`，`README.en.md:41`、`:67`：「不随关闭或卸载清除」是全称说法，与第 178 行的「13 次里 1 次清除」不一致。

**K4 `docs/progress/progress-M7.md` 有悬空指针和一句过头话。复发**（pitfalls「不要提前预写收官状态（悬空引用）」；dont-do「收官证据链」）。**
- `:690`：R4 行写「独立复核见下方『收尾确认』」，文件里没有这一节。
- `:717` 附近：锚点行写「复核结果见 session-41 记录的 T16 条目」，T16 条目里没有。
- `:689`：R3 行写「阶段 5 用现行文案在 rc.5 上重做 V3 通过」，而同文件 `:719` 写「改写后的文案在 rc.5 上的渲染待下次实测」。前者不成立。

### 只能由用户裁决解决的项

- **U1 交还路线**，连带 T6、T8 的去留。决定 R2 和 R6。阶段 5 的新事实（守卫 13 次里 2 次存活）应当纳入裁决。
- **U2 受阻分支例外与 key 窗口**。决定 R5。
- **U3 roadmap 编号 42 行与 Session 42 的拆分**。决定 R8。
- **U4 未推送历史里的令牌值如何处置。**
- **U5 是否同意草稿 PR 预演的公开推送。**
- **U6 阶段 5 提前执行的追认。** 见 S5，阶段 6 也需要一并追认。

### 建议

- **S1 解析器的两处小口子。新。** `tokenFiles('')` 返回空数组，`HEAD:\0 3\n` 这种空路径记录也被接受。清单这一步退出 0 却没有记录时应当报错；行号可以拿清单里的计数核对。
- **S2 提交说明里的「47 份」应更正为 21 份。新。**
- **S3 锚点表两处提交指针过期。新。** SOP 最后一次改动是 `1a1cc63`，表里写 `3f14a69`；release.yml 是 `999b6c3`，表里写 `d37e973`。
- **S4 几处措辞偏满。新。** 「T0–T16 都已执行」没有带出 T12 的 V8、V10 未执行；交付物表写「T16 定稿」，而 ADR-0024 仍是 proposed；STATUS 写「待裁决 3 项」，同一块里列了 6 项；progress 的 R2 行没有提 V10 未执行和 V11 已测通。
- **S5 阶段 6 也是在阶段 4、阶段 5 未通过时执行的。新。** 记录把阶段 5 的提前执行标为待追认，对阶段 6 没有标。
- **S6 一项债务从台账里消失。新。** 「3080 是否有意停机」原先在 STATUS 里，现在只剩 plan 的债务表里有。

## 7. 总体结论

**NEEDS REVISION。**

- 执行者侧仍可修的必改：K1、K2（`scripts/check-release.mjs`），K3（11 处文档残留），K4（`progress-M7.md` 三处）。
- 只能由用户裁决：U1 至 U6。在这些裁决作出之前，R2、R5、R6、R8 按证据不能记 PASS。
- R1、R3、R4、R7 的验收子句成立。
