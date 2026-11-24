# S41 阶段 4 audit-log（第 3 轮复审）— 执行回顾审核

## 参数头

- 骨架版本：库版本 v2（`references/six-stage.md` 阶段 4 骨架）
- 阶段：4（第 3 轮，确认性复审）
- Session：41
- 输入指针：plan 正本 `docs/plans/2026-11-23-048-s41-takeover-docsplit-oidc-plan.md`（含「实测更正」节）；第 2 轮处置后的提交范围 `d93c8a1..56208f0`（6 个提交，审核 Agent 自行 `git log` 复核一致）；测试命令 `pnpm test`；静态检查命令 `pnpm run typecheck`、`pnpm run lint`、`pnpm run check:i18n`、`pnpm run build`；三个归档目录 `docs/sessions/audit-logs/2026-11-23-s41-rc5-live/`、`…-stage3-logs/`、`2026-11-24-s41-stage4-raw/`
- 相对骨架的偏离说明：复审续用前两轮审核 Agent 的上下文（同阶段复审）。任务书除指针外，点明了三处请它重点判断的地方（令牌扫描改扫提交树这一改动本身、归档重排后的索引对应、三个测试文件的改动），并要求 lint 报告警告数而不只报退出码。
- 审核 Agent：同前两轮（general-purpose，与执行者上下文隔离）
- 输出原文落盘：本文件下一节（由脚本从审核 Agent 的输出文件逐字拼接，未经主 Agent 改写）

## 审核 Agent 输出原文（逐字，未经主 Agent 改写）

# S41 阶段 4 第 3 轮复审报告

**总体结论：NEEDS REVISION。** 第 2 轮的 N1–N3、N5–N12 都已吸收，全量门五条全绿，归档重排后索引可核。执行者侧只剩 1 条必改：令牌扫描改成扫 HEAD 之后，有两处文档还写着旧的对象。R2、R5、R6、R8 仍卡在阶段 2.5 的用户裁决上，不因执行者的修改而改变。

## 0. 第 2 轮发现的逐条吸收判断

| 编号 | 判断 | 提交 | 我取得的证据 | 仍开放的归属 |
|---|---|---|---|---|
| N1 lint 警告 | 已吸收 | `21c637d` | `pnpm run lint`：0 warnings、0 errors | 无 |
| N2 归档两处标注 | 已吸收 | `be1c3c2` | rc5-live 索引第 5 行改为如实说明缺的是哪三格；`evidence__README.md` 那行注明 V4 只有叙述、V6 只有半句有 dump | 无 |
| N3 记录两处旧文 | 已吸收 | `56208f0` | 第 104 行与第 243 行各加了勘正注，时点原文保留 | 无 |
| N4 2.5 裁决 | 未变 | 无 | roadmap 仍无 42 行；STATUS、progress 未改 | 待用户裁决 |
| N5 令牌扫描残留 | 已吸收，带出新问题 | `be8ed79` | 已提交的带值文件被删或不可读时都能报出；PATH 里没有 git 时报 `git is not available` | 新问题见 M1、M3、M4 |
| N6 归档摆放与重复 | 已吸收 | `be1c3c2` | 9 个文件全部移走且齐全；跨目录重复为 0；5 个副本不再入库 | 无 |
| N7 stage3-logs 索引 | 已吸收 | `be1c3c2` | 第 6 行补上了那句话 | 无 |
| N8 pack 用例偏脆 | 已吸收 | `4ac06c1` | 不再断言 stderr；跑该文件前后 `~/.npm/_logs` 条目数都是 11；5 passed | 无 |
| N9 发布手册 | 已吸收 | `1a1cc63` | 写明 profile 会钉到克隆里的路径；npm 版本改为「可能与流水线不同」 | 无 |
| N10 ADR-0026 Status | 已吸收 | `1a1cc63` | 不再引用审核编号；决策 7、8 归为发布失败时的处置规则 | 无 |
| N11 V3 证据早于文案 | 一半吸收 | `1a1cc63` | 「搜索与抓取会失败」已删 | 现行文案待阶段 5 重做 V3 |
| N12 记录与 SOP | 一半吸收 | `1a1cc63`、`56208f0` | OIDC 首发窗已写入「未完成 / 遗留」；SOP 改为「哪个实例在役以 STATUS 为准」 | 「交付物」表未补，归阶段 6 |
| N13 锚点台账 | 延后 | 无 | `progress-M7.md` 未改 | 阶段 6 |

## 1. 参数头

- **环境**：macOS darwin 27.0.0 arm64，zsh；node v22.23.2，pnpm 11.7.0，vitest v4.1.11。
- **主仓库**：分支 `feat/s41-takeover-docsplit-oidc`，HEAD `56208f0cff0b5f86e5b9da7ce4704bc2fdba79a6`，`git status --short` 无输出。`git rev-list --count d93c8a1..HEAD` 为 6，与主 Agent 所称一致。
- **实验目录**：`/tmp/dshws-s41/stage4/r3/`，另有符号链接 `/tmp/dshws-s41/stage4/r3/link` 指向本轮克隆。
- **约束遵守**：主仓库零改动（HEAD 不变、无 stash、无新 tag、`dist-artifacts/` 两个 tarball 的 sha256 与前两轮相同）；未读写或列出 `~/.dsh`；未启停 3434；重负载命令串行；node 命令都带 PATH 前缀。
- **偏离与自述**：
  - 做过一次被动的 `lsof -iTCP:3434 -sTCP:LISTEN`，pid 95257 仍在监听。
  - 为核实 N8，两次只数了 `~/.npm/_logs` 的条目数，没有读内容。
  - 在主仓库只读地运行了一次 `node scripts/check-release.mjs --tarballs /tmp/dshws-s41/stage4/r3/clone/dist-artifacts`。它只读 HEAD 树和我克隆里的 tarball，没有写任何文件。
  - 在我自己的 `/tmp/dshws-s41/stage4/r3/exp/` 下跑过 `git init`、`git add`、`git commit`、`git merge`，不涉及主仓库。
  - 克隆里的 `pnpm install --frozen-lockfile` 按前两轮的原文执行，未加 `--registry`。

## 2. 全量门结果（主仓库，串行）

| 命令 | 退出码 | 关键数字 |
|---|---|---|
| `pnpm run typecheck` | 0 | 两面 tsc 均无输出 |
| `pnpm run lint` | 0 | **0 warnings**、0 errors；95 files、96 rules |
| `pnpm test` | 0 | Test Files 47 passed / 1 skipped (48)；Tests **710 passed / 17 skipped (727)**；Duration 5.67s |
| `pnpm run check:i18n` | 0 | check-locales 179 keys；check-cjk 43 files |
| `pnpm run build` | 0 | `lib/index.js` 155.68 kB，`lib/index.d.ts` 52.10 kB，`lib/client.js` 359.04 kB |

测试数从 725 到 727，多的 2 条都在 `tests/check-release.spec.ts`（现在 22 条）。

## 3. R1–R8 逐条核验

| 条目 | 判定 | 证据 |
|---|---|---|
| R1 接管 | PASS | patch 与其测试在本范围内未改；全量里 10 passed |
| R2 交还 | **FAIL**（待用户裁决） | `handover.spec.ts` 14 passed，`handover-watch.spec.tsx` 19 passed；T7 未实现；矩阵与探针源码已入库；V5 通过；V7 失败；V10、V11 未执行。限制与清理方法在 README 和用户文档里写全了 |
| R3 文档分离 | PASS | `package-meta.spec.ts` 10 passed；中英文结构对齐；V3 证据已归档。现行文案仍未在 rc.5 上渲染过，记录已写明留给阶段 5 |
| R4 发布门 | PASS | `check-release.spec.ts` 22 passed，`release-workflow.spec.ts` 8 passed；`grep -n "NPM_TOKEN\|NODE_AUTH_TOKEN" .github/workflows/release.yml` 退出 1；两份工作流解析退出 0；八步预演全部符合预期。扫描的残留问题见 M3、M4 |
| R5 上游对齐 | 部分受阻 | `peer-range.spec.ts` 23 passed；依赖对齐记录已勘正；功能腿、带 key 的 e2e.real、对齐清单留痕仍未做。受阻分支例外待用户确认 |
| R6 rc.5 实测 | **FAIL**（待用户裁决与阶段 5） | 证据已入库且索引标注如实；V7 失败；V8、V10、V11 未执行；V4 只有叙述 |
| R7 文档 | PASS | 手册、SOP、问题表、`upgrade.md` §6、两份 ADR 的勘正注都在；本范围 10 个改动文档 14 条本地链接，断链 0。手册第 71 行有一句没跟上，见 M1 |
| R8 治理 | 部分（待用户确认） | 记录十节在；roadmap 仍无 42 行；STATUS 与 progress 未改（归阶段 6） |

## 4. 提交卫生

### 4.1 `d93c8a1..56208f0`，6 个提交

- 没有混入无关文件，没有误提交的产物。
- `be8ed79` 的说明有一处不准：它写「被删或不可读时，git grep 退出码 1、无 stderr」。第 2 轮我测到的是：被删时无 stderr，不可读时 stderr 有一行 `Permission denied`。两种情况旧实现都判为干净，结论不受影响。
- 其余提交说明与所改文件相符。

### 4.2 归档重排核验

| 目录 | 索引行 | 只登记不归档 | 归档文件 | 盘上文件 | 与原文件相同 |
|---|---|---|---|---|---|
| `2026-11-23-s41-rc5-live` | 53 | 8（空文件） | 45 | 45 | 43 |
| `2026-11-23-s41-stage3-logs` | 78 | 10（空文件） | 68 | 68 | 67 |
| `2026-11-24-s41-stage4-raw` | 32 | 5（重复副本） | 27 | 27 | 27 |

- **一一对应**：三个目录都是行与文件一一对应，没有未登记的文件。
- **「不相同」的 3 个**是做过遮蔽的 `rc5-web.log`、`rc5-web-nohmr.log`、`f9-red.log`。它们的索引值与遮蔽前的原文件一致。两个索引都写明了这一点。
- **stage4-raw 的 5 条「未归档」行属实**：5 个 `red-*.yml` 与 rc5-live 里对应的证据文件 sha256 逐一相同，stage4-raw 里确实不再有这些文件。
- **移走的 9 个文件齐全**：8 个在 stage3-logs 里有同名同内容的文件，`fresh-clone-rehearsal.log` 改名为 `t11-fresh-clone-rehearsal.log`。rc5-live 里一个不剩。
- **不再有跨目录重复**：140 个归档文件共 130 种内容，重样的 10 个都在同一目录内，是内容本来就相同的日志。
- **敏感内容**：三个目录 143 个文本文件，按 10 类凭据形态和 2 个已知真实令牌值扫描，命中 0。全树 705 个文本文件里已知令牌值命中 0。

## 5. 克隆预演与令牌扫描实验

### 5.1 八步预演（HEAD `56208f0`）

| 步骤 | 命令 | 退出码 | 输出 |
|---|---|---|---|
| 1 | `git clone --branch feat/s41-takeover-docsplit-oidc /Volumes/IPFSJK/Zcode/dsh-websearch /tmp/dshws-s41/stage4/r3/clone` | 0 | 克隆 HEAD 为 `56208f0…` |
| 2 | `pnpm install --frozen-lockfile` | 0 | `Packages: +313`，`Lockfile is up to date`，Done in 1.1s |
| 3 | `pnpm run build` | 0 | 三个产物，大小同主仓库 |
| 4 | `pnpm exec vitest run tests/check-release.spec.ts tests/package-meta.spec.ts tests/patch.test.ts tests/release-workflow.spec.ts` | 0 | 4 files，50 passed（22、10、10、8） |
| 5a | `node scripts/pack.mjs` | 0 | `packed maricgeer-dsh-websearch-0.2.0.tgz + dsh-websearch-0.2.0.tgz → dist-artifacts/` |
| 5b | `node /tmp/dshws-s41/stage4/r3/link/scripts/pack.mjs` | 0 | 输出相同，两个 tarball 的 sha256 也相同 |
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

两个 tarball 各 12 个成员，成员列表相同，大小为 157,483 与 157,486 字节。

### 5.2 令牌扫描改扫 HEAD 树

带值行都是合成的，在 `/tmp/dshws-s41/stage4/r3/exp/` 下的一次性仓库里实验。「旧脚本」指 `d93c8a1` 的版本。

| 场景 | HEAD 脚本 | 旧脚本 |
|---|---|---|
| E1 带值行已提交 | 报出，退出 1 | 报出，退出 1 |
| E2 带值行已暂存、未提交 | **`ok`，退出 0** | 报出，退出 1 |
| E3 带值行只改在工作区 | **`ok`，退出 0** | 报出，退出 1 |
| E4 已提交，文件从工作区删掉 | 报出 | `ok` |
| E5 已提交，文件不可读 | 报出 | `ok` |
| E6 仓库没有任何提交 | 退出 2，`fatal: unable to resolve revision: HEAD` | 未跑 |
| E7 文件名以 `HEAD:` 开头 | **`ok`，退出 0** | 未跑 |
| E8 文件名含冒号 | **`ok`，退出 0** | 未跑 |
| E9 目录名含冒号 | **`ok`，退出 0** | 未跑 |
| E10 二进制文件里有带值字节 | **`ok`，退出 0** | 未跑 |
| E11 文件名含非 ASCII 字符 | 报出 | 未跑 |
| E12 PATH 里没有 git | 退出 2，`token scan did not run: git is not available (spawnSync git ENOENT)` | 第 2 轮测得是 TypeError |
| E13 在任何 git 仓库之外 | 退出 2 | 未跑 |
| E14 只有 `<redacted>` 标记 | `ok` | 未跑 |
| E15 带值行经合并进入 HEAD | 报出 | 未跑 |
| E16 带值行只在别的分支上 | `ok`（按设计） | 未跑 |

**改动本身是否正确**：对它声明的目的（扫 tag 将要发布的内容）是正确的。E4、E5 两个放行修掉了，E6、E12、E13 都是失败关闭。

**新的放行路径**：

- **E2、E3 是真实的收窄。** 暂存区或工作区里还没提交的带值内容不再被本地这一次扫描看到。对发布安全没有影响，CI 扫的是提交；但本地门从此要在提交之后跑才有意义。session 记录第 270 行如实写了这一变化，手册没跟上（M1）。
- **E6 没有提交时失败关闭。**
- **`HEAD:` 前缀的剥离本身没问题**，每行只剥一个。问题出在后面的解析：它按「不含冒号的文件名 + 冒号 + 行号」来切，路径里一有冒号就切不出来。E7 的原始输出是 `HEAD:HEAD:x.log:1:…`，剥掉一层后剩下 `HEAD:x.log:1:…`，被丢弃。E8、E9 同理。`git grep` 明明找到了匹配（退出 0），脚本却报 `ok`。E8、E9 在第 1 轮的 F9 修复之后就在，E7 是这次加前缀后新出现的组合。
- **E10 二进制文件同样丢报**，这是存量行为。仓库现在没有被跟踪的二进制文件，也没有含冒号的路径。

**一个稳妥的写法我验证过**：加 `-z` 后 `git grep -n` 的输出是「路径、行号、内容」三段，各用 NUL 结尾，冒号不再有歧义。对二进制文件用 `-c -z` 能得到 `HEAD:blob.bin␀1` 这样的计数行。

### 5.3 三个测试文件

- `tests/package-meta.spec.ts`：一行等价替换，没有弱化。
- `tests/pack.test.ts`：断言加强了（两个 tarball 都要存在），npm 日志重定向生效，没有看到新的不稳定。
- `tests/check-release.spec.ts`：两条新用例断言都实。一条钉住「工作区缺文件也要报」，一条钉住「没有 git 时给出设计内的报错」。
- 没有发现新的弱断言。没有任何用例钉住 E2、E3 的新语义（M3）。

## 6. 发现清单

### 必改

**M1 扫描对象的描述没有全部同步。新。**
- 位置一：`docs/release-runbook.md:71` 仍写「并扫描被跟踪文件里的 host token 值」。
- 位置二：`scripts/check-release.mjs:96` 的 JSDoc 仍写「`git grep -n` over the tracked files」。
- 同一类的两处小的：session 记录第 154 行的 T10 规则原文没有勘正注；ADR-0026 决策 4 的句子读起来像在检查 tarball 内容，实际扫的是提交树（存量）。
- 修法：前两处改成「HEAD 提交树里已提交的内容，不含未提交的改动」；第 154 行加勘正注。

**M2 阶段 4 记 PASS 的程序性前提。**
- R2、R6（交还路线）、R5（受阻分支例外）、R8（roadmap 42 行）都依赖阶段 2.5 的用户裁决，仍未获答复。按 plan 048 的规定，确认之前不记 PASS。

### 建议

**M3 新语义没有用例钉住，也没有在手册里说明。新。**
- E2、E3 的收窄只在 session 记录里披露。读手册的人不知道本地这一次扫描不含未提交的改动。
- 修法：加一条用例把语义钉住（例如「只暂存未提交的值不报」），或改成 HEAD 与暂存区、工作区取并集来扫。

**M4 路径含冒号或二进制文件时静默丢报。新。**
- 见 E7 至 E10。今天的仓库里没有这类文件，所以不是现实的放行，但它让「找到匹配却报 ok」成为可能。
- 修法：改用 `-z` 的分段输出来解析，或直接用 `-c -z` 按文件计数；再加一道兜底：`git grep` 退出 0 而解析不出任何位置时按「扫描未能完成」报错。

**M5 stage4-raw 索引里 5 条「未归档」行的文件名列是 `—`。新。**
- 文件名只出现在内容列的句子里，没法按名字对上。把原名放回第一列并注「未归档」即可。

**M6 `tests/check-release.spec.ts` 每跑一次会留下 9 个临时仓库。新（存量模式，新用例又多 1 个）。**
- `makeRepo` 建的仓库只有 3 条用例会删。系统临时目录里现在有 219 个 `dshws-release-*` 目录。
- 修法：在 `afterEach` 里统一删掉本次建的所有仓库。

**M7 留给后续阶段的各项（已有留痕）。**
- 「交付物」表还没列两轮 audit-log、三个归档目录、`scripts/check-release.d.mts`、`tests/pack.test.ts`：阶段 6。
- 现行用户文档在 rc.5 上的渲染：阶段 5。
- 锚点台账：阶段 6。

## 7. 总体结论

**NEEDS REVISION。**

必改项：

1. **M1** 把手册第 71 行和脚本第 96 行的扫描对象改成 HEAD 提交树。
2. **M2** R2、R5、R6、R8 所依赖的 2.5 裁决。用户答复之前，这四条按证据不能记 PASS。

第 2 轮的 3 条必改（N1、N2、N3）已吸收。第 2 轮的 10 条建议里，N5 至 N12 已吸收，N11 的后半和 N13 按计划留给阶段 5、阶段 6。本轮新发现的执行者侧必改只有 M1 一处，改两句话即可。
