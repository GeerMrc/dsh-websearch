# S41 阶段 4 audit-log（第 2 轮复审）— 执行回顾审核

## 参数头

- 骨架版本：库版本 v2（`references/six-stage.md` 阶段 4 骨架）
- 阶段：4（第 2 轮，同阶段复审）
- Session：41
- 输入指针：plan 正本 `docs/plans/2026-11-23-048-s41-takeover-docsplit-oidc-plan.md`（含「实测更正」节）；第 1 轮处置后的提交范围 `a66ef5d..d93c8a1`（主 Agent 在任务书里称 13 个，审核 Agent 自行 `git log` 复核为 14 个）；测试命令 `pnpm test`；静态检查命令 `pnpm run typecheck`、`pnpm run lint`、`pnpm run check:i18n`、`pnpm run build`；三个归档目录 `docs/sessions/audit-logs/2026-11-23-s41-rc5-live/`、`…-stage3-logs/`、`2026-11-24-s41-stage4-raw/`
- 相对骨架的偏离说明：复审续用第 1 轮审核 Agent 的上下文（同阶段复审）。任务书除指针外，要求逐条判断第 1 轮发现的吸收情况，并增补两项实验——经符号链接的绝对路径调用两个脚本（验证执行者新发现的 F24）、复核归档目录的索引与敏感内容。任务书里「13 个提交」是主 Agent 的误数，审核 Agent 已指出。
- 审核 Agent：同第 1 轮（general-purpose，与执行者上下文隔离）
- 输出原文落盘：本文件下一节（由脚本从审核 Agent 的输出文件逐字拼接，未经主 Agent 改写）

## 审核 Agent 输出原文（逐字，未经主 Agent 改写）

# S41 阶段 4 第 2 轮复审报告

**总体结论：NEEDS REVISION。** 性质与第 1 轮不同。执行者能自行修掉的必改只剩两类小项：1 条新引入的 lint 警告，以及归档和记录里的几处标注不实。R2、R5、R6、R8 仍然不能记 PASS，卡在阶段 2.5 的用户裁决上，不是执行者再改代码能解决的。

## 0. 第 1 轮发现的逐条吸收判断

| 编号 | 判断 | 提交 | 我取得的证据 | 仍开放的归属 |
|---|---|---|---|---|
| F1 全量测试红 | 已吸收 | `5e1b792` | 两个桩各补 `inject`；我亲跑全量 708 通过 / 17 跳过 (725)，退出码 0 | 无 |
| F2 R2、R6 不能记 PASS | 未变，如实 | 无 | 证据不变 | 待用户裁决 |
| F3 用户文档 | 已吸收 | `2df185d` | 补了命令行卸载不清钉值与删两键的方法；去掉了「在官方页重新选即可」；locale 不再承诺自动交还 | 两个未实测点：待阶段 5 实测 |
| F4 README 三处 | 已吸收 | `93c31d9` | `README.md:66`、`:173` 与 `README.en.md:41` 都已改 | 无 |
| F5 记录缺口与数字 | 已吸收 | `96929d5`、`d93c8a1` | T12 条目在；阻塞项三项；16 个、20/6/14、19/6/14 与日志一致；预演措辞已更正 | 两行旧文未同步，见 N3 |
| F6 roadmap 42 行 | 未变，如实 | 无 | 仍无 42 行 | 待用户确认 |
| F7 证据归档 | 已吸收 | `b3bcf1a` | 三个目录共 155 个文件入库，逐项核对见 4.2 | 归档的标注与摆放见 N2、N5 |
| F8 实例令牌在历史里 | 已确认，有处置计划 | 无 | 被动查看：3434 仍是 pid 95257 在监听 | 待阶段 6 停实例 |
| F9 发布门两处弱点 | 已吸收，有残留 | `3ef650f` | 非 git 目录退出码 2；命中只报 `文件:行号` | 残留见 N4 |
| F10 发布手册 | 已吸收 | `cb623b0` | 7.1 有了命令、判据、★；补了单独克隆提醒 | 小缺口见 N8 |
| F11 诊断步注释 | 已吸收 | `0665382` | 注释改为 verbose 与 silly 两级 | 无 |
| F12 README 缺证据的说法 | 已吸收 | `93c31d9` | 逃生口标「尚未实测」；CLI 卸载标「未单独实测」 | 无 |
| F13 源码注释 | 已吸收 | `0665382` | 只改了注释，运行时逻辑未动 | 模块去留待用户裁决 |
| F14 两份 ADR 的 Status | 已吸收 | `0665382` | 写明哪些已执行、哪些未发生 | 小问题见 N9 |
| F15「已演练」措辞 | 已吸收 | `93c31d9` | README、peer-range 注释、问题表 ③ 都标为暂定 | 无 |
| F16 组件开关 | 未变，如实 | 无 | 记录写明「只是推断，留给阶段 5」 | 待阶段 5 实测 |
| F17 T5p 证据缺口 | 部分 | `b3bcf1a` | 探针源码 5 个文件已归档；浏览器读数、CLI 卸载后的 dump、47 毫秒时序仍无原始文件；矩阵本身未标注 | 待阶段 5 重测或标注 |
| F18 V4 无快照 | 未变，如实 | 无 | 记录写了「只有叙述、没有快照」 | 待阶段 5 补快照 |
| F19 测试弱项 | 已吸收 | `72d9651` | 结构对齐带自检负控；tag 不存在的分支有了用例；npm 11 的位置断言到位 | 引入 1 条 lint 警告，见 N1 |
| F20 SOP 两处 | 已吸收 | `3f14a69` | §0 改为双语义；用例数改为指向台账 | 无 |
| F21 STATUS 未反映阻塞 | 延后，有留痕 | 无 | `docs/STATUS.md` 在本范围内未改 | 待阶段 6 |
| F22 问题表 ⑤ | 已吸收 | `93c31d9` | 写明依据是源码与用户报告，本轮无快照 | 无 |
| F23「全新克隆」表述 | 已吸收 | `96929d5` | T11 条目已更正 | 无 |
| 锚点台账 | 延后，有留痕 | 无 | `progress-M7.md` 未改 | 待阶段 6 |
| F24（执行者新发现） | 修复正确 | `14ec1d1`、`9dfee75` | 我用修复前版本复现了静默退出 0，修复后两种调用都正确，见 5.2 | 无 |

**留给阶段 5 的几项是否如实标注（第 6 项）**

- **F3 的两个未实测点：如实。** 记录第 227 行写明留给阶段 5。用户文档里一处已删，另一处只说两个开关不是同一操作，没有声称结果。
- **F16：如实。** 记录第 240 行写明只是推断。
- **F17：部分如实。** 记录承认缺口，但有一句已经过时：它还写「探针源码也没有归档」。另外 rc5-live 的 `INDEX.md` 第 5 行说「T5p 矩阵里标『无原始文件』的格子」，而归档的矩阵与原文件逐字节相同，里面没有这种标注。
- **F18：部分如实。** 记录第 215 行写了，但同一记录第 103 行仍是「V4 通过」。归档的 `evidence__README.md` 第 12 行仍是「V4 … PASS」，索引对这一行只写了「执行期原版」。
- **新的一点：** V3 的证据采于 `2df185d` 之前，现行文案没在 rc.5 上渲染过，记录里没有说明。

## 1. 参数头

- **环境**：macOS darwin 27.0.0 arm64，zsh；node v22.23.2，pnpm 11.7.0，vitest v4.1.11。
- **主仓库**：分支 `feat/s41-takeover-docsplit-oidc`，HEAD `d93c8a1b6797e171ea5fff8b986cf8835fa895d7`，`git status --short` 无输出。
- **提交范围**：`git log --oneline a66ef5d..HEAD` 与 `git rev-list --count a66ef5d..HEAD` 都是 **14 个**，不是 13 个（`3e3b972` 至 `d93c8a1`）。
- **实验目录**：`/tmp/dshws-s41/stage4/r2/`，另有指向新克隆的符号链接 `/tmp/dshws-s41/stage4/link`。
- **约束遵守**：
  - 主仓库零改动：HEAD 不变、无 stash、无新 tag、`dist-artifacts/` 两个 tarball 的 sha256 与第 1 轮相同。
  - 未读写或列出 `~/.dsh`，未启停 3434 实例，未进入 `home-rc5*`。
  - 令牌值一律 `token=<redacted>`，比对只用哈希前缀。
  - 重负载命令串行；所有 node、pnpm、vitest 命令都带了 PATH 前缀。
- **偏离与自述**：
  - 做过一次被动的 `lsof -iTCP:3434 -sTCP:LISTEN`。
  - 克隆里的 `pnpm install --frozen-lockfile` 按任务书原文执行，未加 `--registry`。
  - 在我自己的临时目录 `/tmp/dshws-s41/stage4/r2/nogit` 里跑过 `git init`、按显式路径 `git add`、`git commit`、`git rm --cached`、`git reset`，不涉及主仓库。
  - 一条调试命令把 scratch 实例进程令牌的前 5 个字符打到了我的工具输出里。这不是完整值，本报告不转载。
- **更正我第 1 轮的一处说法**：第 1 轮 F8 写「`e95c729` 里两个令牌值之一与实例令牌相同」。实际该文件只有 1 个不同的值，出现在 3 行，且就是实例当前的进程令牌。当时多出的那个「值」是 BSD sed 把反斜杠当成字符类成员造成的假象。结论不变，反而更强。已逐字归档的第 1 轮报告带着这句不准确的话。

## 2. 全量门结果（主仓库，串行）

| 命令 | 退出码 | 关键数字 |
|---|---|---|
| `pnpm run typecheck` | 0 | 两面 tsc 均无输出 |
| `pnpm run lint` | 0 | **1 warning**、0 errors；95 files、96 rules |
| `pnpm test` | 0 | Test Files 47 passed / 1 skipped (48)；Tests **708 passed / 17 skipped (725)**；Duration 5.27s |
| `pnpm run check:i18n` | 0 | check-locales 179 keys；check-cjk 43 files |
| `pnpm run build` | 0 | `lib/index.js` 155.68 kB，`lib/index.d.ts` 52.10 kB，`lib/client.js` 359.04 kB |

- 测试数从 720 到 725，多了 5 条：`pack.test.ts` 多 1，`package-meta.spec.ts` 多 1，`check-release.spec.ts` 多 3。
- lint 的那条警告在第 58 行 `tests/package-meta.spec.ts:58:16`：

  ```
  ! unicorn(prefer-string-starts-ends-with): Prefer String#startsWith over a regex with a caret.
  58 |     } else if (/^- /.test(line)) {
  ```

  执行者自己的 `f19-lint.log`、`f24-lint.log`、`f24b-lint.log` 里都有这 1 条，session 记录只写了「lint 退出码 0」。

## 3. R1–R8 逐条核验

| 条目 | 判定 | 证据 |
|---|---|---|
| R1 接管 | PASS | `cordis.patch.yml`、`tests/patch.test.ts` 在本范围内未改；全量里 10 passed；V1 的 dump 已归档且与原文件相同 |
| R2 交还 | **FAIL**（待用户裁决） | `handover.spec.ts` 14 passed，`handover-watch.spec.tsx` 19 passed；T7 仍未实现；矩阵已入库；V5 通过；V7 失败；V10、V11 未执行。限制与清理方法在 README 与用户文档里都已写全 |
| R3 文档分离 | PASS | `package-meta.spec.ts` 10 passed；locale 与两份用户文档在盘、进包；V3 证据已归档。证据对应的文案早于 `2df185d`，现行文案待阶段 5 的 V3 重做覆盖 |
| R4 发布门 | PASS | `check-release.spec.ts` 20 passed，`release-workflow.spec.ts` 8 passed；`grep -n "NPM_TOKEN\|NODE_AUTH_TOKEN" .github/workflows/release.yml` 退出 1；两份工作流用 `yaml` 解析都退出 0；步骤顺序未变（release.yml 的改动只有注释）；HEAD 全新克隆预演八步全部符合预期 |
| R5 上游对齐 | 部分受阻 | `peer-range.spec.ts` 23 passed；依赖对齐的记录数字已勘正；功能腿、带 key 的 e2e.real（17 条全跳过）、对齐清单留痕仍未做。rc.5 的钉已标为暂定。受阻分支例外待用户确认 |
| R6 rc.5 实测 | **FAIL**（待用户裁决与阶段 5） | 证据已入库，索引可核。V1、V2 前半句、V3、V5 通过；V6 只有 dump 半句；V4 只有叙述；V7 失败；V8、V10、V11 未执行 |
| R7 文档 | PASS | 手册、SOP、问题表、`upgrade.md` §6、两份 ADR 的勘正注都在；本范围 16 个改动文档共 54 条本地链接，断链 0 |
| R8 治理 | 部分（待用户确认） | 记录十节在，T12 条目与阻塞项已补；progress、STATUS 未改（延后到阶段 6）；roadmap 仍无 42 行 |

## 4. 提交卫生

### 4.1 `a66ef5d..d93c8a1`，14 个提交

- 没有混入无关文件，没有误提交的构建产物。
- 提交说明与所改文件相符，几个条数都对得上：F9 18 条、F24 的 20 条与 5 条、归档 55 + 67 + 33 = 155 个文件。
- `72d9651` 引入了 lint 警告，说明和记录都没提（N1）。
- `b3bcf1a` 一次入库 155 个文件、21,056 行，有摆放与重复问题（N5）。

### 4.2 归档目录核验

**索引与文件**

| 目录 | 索引行 | 只登记不归档的空文件 | 归档文件 | 盘上文件 | 与原文件逐字节相同 |
|---|---|---|---|---|---|
| `2026-11-23-s41-rc5-live` | 62 | 8 | 54 | 54 | 52 |
| `2026-11-23-s41-stage3-logs` | 76 | 10 | 66 | 66 | 65 |
| `2026-11-24-s41-stage4-raw` | 32 | 0 | 32 | 32 | 32 |

- 行与文件一一对应，没有缺文件的行，也没有未登记的文件，目录内没有未跟踪项。
- 三个「不相同」的都是做了遮蔽的文件。

**字节数与 sha256 前 16 位**

- 152 个归档文件里 149 个可以由归档文件复算，全部与索引一致。
- 3 个不能复算：`rc5-web.log`（1208 对 1175）、`rc5-web-nohmr.log`（393 对 360）、`f9-red.log`（4163 对 4085）。
- 这 3 个我拿 `/tmp/dshws-s41/` 下遮蔽前的原文件复算，与索引一致。
- 是否写清楚了：
  - rc5-live 写清楚了。第 4 行有「取自遮蔽前的原文件」，两行各注「遮蔽 1 处」。
  - stage3-logs 只写了一半。行内注了「遮蔽 2 处」，但没有那句「哈希取自遮蔽前、无法由归档文件复算」（N6）。
  - stage4-raw 没有遮蔽，不存在这个问题。「主 Agent 未改动内容」属实：32 个文件与我第 1 轮的原始日志逐字节相同。

**敏感内容**

- 三个目录共 155 个文本文件，按 10 类凭据形态和 2 个已知真实令牌值扫描，命中 0。
- 整个被跟踪树（716 个文本文件）里已知真实令牌值命中 0。
- 全树有 7 处形态命中，都在 `tests/e2e.real/`：6 处是读环境变量的赋值，1 处是占位形态的假 key（`tvly-` 后全是小写字母）。S41 没动过这个目录。

**不该入库或摆放不当的（N5）**

- rc5-live 里有 9 个文件不是 rc.5 实测证据，共 20,070 字节：`f1-red/green/full.log`、`f24-red/green.log`、`f24b-red/green.log`、`fresh-clone-rehearsal.log`、`t13-doc-tests.log`。
- 其中 8 个与 stage3-logs 里的同名文件内容相同，是跨目录重复。
- stage4-raw 里的 5 个 `red-*.yml` 是我第 1 轮做 diff 用的脱敏副本，与 rc5-live 的证据逐字节相同，占 233,754 字节。

## 5. 克隆预演与脚本实验

### 5.1 八步预演（HEAD `d93c8a1`）

| 步骤 | 命令 | 退出码 | 输出 |
|---|---|---|---|
| 1 | `git clone --branch feat/s41-takeover-docsplit-oidc /Volumes/IPFSJK/Zcode/dsh-websearch /tmp/dshws-s41/stage4/r2/clone` | 0 | 克隆 HEAD 为 `d93c8a1…` |
| 2 | `pnpm install --frozen-lockfile` | 0 | `Packages: +313`，`Lockfile is up to date`，Done in 1.1s |
| 3 | `pnpm run build` | 0 | 三个产物，大小同主仓库 |
| 4 | `pnpm exec vitest run tests/check-release.spec.ts tests/package-meta.spec.ts tests/patch.test.ts tests/release-workflow.spec.ts` | 0 | 4 files，48 passed（20、10、10、8） |
| 5a | `node scripts/pack.mjs` | 0 | `packed maricgeer-dsh-websearch-0.2.0.tgz + dsh-websearch-0.2.0.tgz → dist-artifacts/` |
| 5b | `node /tmp/dshws-s41/stage4/link/scripts/pack.mjs` | 0 | 输出与 5a 相同，两个 tarball 的 sha256 也与 5a 相同 |
| 6a | `node scripts/check-release.mjs --tarballs dist-artifacts` | 0 | `check-release: ok` |
| 6b | `cd /tmp/dshws-s41/stage4/link && node /tmp/dshws-s41/stage4/link/scripts/check-release.mjs --tarballs dist-artifacts` | 0 | `check-release: ok` |
| 7a | `node scripts/check-release.mjs --tag v0.2.1` | 1（预期） | 见下 |
| 7b | `cd /tmp/dshws-s41/stage4/link && node /tmp/dshws-s41/stage4/link/scripts/check-release.mjs --tag v0.2.1` | 1（预期） | 与 7a 逐字相同 |
| 8 | `git status --short` | 0 | 无输出 |

7a 与 7b 的输出：

```
check-release: tag v0.2.1 does not name the package.json version (0.2.0); expected v<version> with a stable triple
check-release: 1 problem(s)
```

tarball 现为 157,492 与 157,494 字节，比第 1 轮大，因为 locale 与用户文档改过。

### 5.2 F24：符号链接路径下的入口判定

**原因我用探针脚本确认了。** 经符号链接以绝对路径调用时，`process.argv[1]` 是原样的 `/tmp/…/link/probe-argv.tmp.mjs`，`import.meta.url` 是解析后的 `file:///private/tmp/…/r2/clone/probe-argv.tmp.mjs`。相对路径调用时两者一致。

**修复前的行为我复现了。** 把 `a66ef5d` 的两个脚本放进单独的临时副本，经符号链接以绝对路径调用：

| 脚本 | 经符号链接 | 相对路径（对照） |
|---|---|---|
| `check-release.mjs --tag v0.2.1` | 无输出，退出 0 | 退出 1，报 tag 与版本不符 |
| `check-release.mjs --tarballs dist-artifacts` | 无输出，退出 0 | 未跑 |
| `pack.mjs` | 无输出，退出 0，tarball 数 0 | 打出 2 个，退出 0 |

**修复后的审阅。** `isEntryPoint()` 对两侧都取真实路径再比较。我没能找到让它误判为「不是入口」的调用方式；HEAD 上 5b、6b、7b 都正确。修复正确。

### 5.3 F9：令牌扫描的加固

脚本取自 HEAD，在 `/tmp/dshws-s41/stage4/r2/nogit` 里实验，带值行是合成的：

| 场景 | 输出 | 退出码 |
|---|---|---|
| 非 git 目录，有带值行 | `check-release: token scan did not run: git grep exited with 128 (fatal: not a git repository (or any of the parent directories): .git)` | 2 |
| 非 git 目录，没有带值行 | 同上 | 2 |
| git 仓库，带值行已跟踪 | `check-release: evidence.log:1 carries a host token value`，合成值没有出现在输出里 | 1 |
| PATH 里没有 git | `check-release: Cannot read properties of undefined (reading 'trim')` | 2 |
| cwd 是仓库子目录 | `check-release: ENOENT: … package.json` | 2 |
| 带值行只在未跟踪文件里 | `check-release: ok` | 0 |
| 唯一带值的已跟踪文件不可读（chmod 000） | `check-release: ok` | 0 |
| 唯一带值的已跟踪文件被从工作区删掉 | `check-release: ok` | 0 |

- 前三个场景是第 1 轮要求修的，都修对了。
- 第四个场景仍然失败关闭，但报的是意外的 TypeError，不是设计的那句话。
- 最后两个场景仍然放行。此时 `git grep` 的退出码是 1，与新代码「退出码 1 即判干净」的规则相撞。

## 6. 发现清单

### 必改

**N1 lint 多了 1 条警告，记录没有披露。复发**（dont-do「计划项执行纪律」的子教训：门墙读数要读全输出，S37 曾有 26 条警告存活三轮）。**
- 位置：`tests/package-meta.spec.ts:58`，由 `72d9651` 引入，HEAD 上仍在。
- 修法：改成 `} else if (line.startsWith('- ')) {`。我在克隆里试过：lint 变为 0 warnings、0 errors，该文件 10 passed。同时在 T14 里把 lint 读数写成「0 警告 0 错误」。

**N2 归档里的两处标注不实。复发**（dont-do「收官证据链：声称完成而核心工件未落盘」，即第 1 轮 F18 的同一问题在归档件里原样保留）。**
- 位置一：rc5-live `INDEX.md` 第 5 行说「T5p 矩阵里标『无原始文件』的格子」，而归档的矩阵没有这种标注。
- 位置二：`evidence__README.md` 第 12 行仍写 V4 为 PASS，索引对它只注「执行期原版」。
- 修法：要么现在就在矩阵里标注，要么把索引这句话改成「阶段 5 标注」；给 README 那一行在索引内容列注明「V4、V6 的界面半句没有快照」。

**N3 session 记录里两处旧文没有跟上。复发**（dont-do「收官序列：漏刷新状态区」，同一文件两处口径不一）。**
- 位置一：第 103 至 104 行仍是「V4 通过」「收官时脱敏归档」，与第 215 行和已完成的归档不一致。
- 位置二：F17 一行仍写「探针源码也没有归档」，而 `b3bcf1a` 已经归档了 5 个探针源码文件。
- 修法：按本记录的惯例加勘正注，不删时点原文。

**N4 阶段 4 记 PASS 的程序性前提。**
- R2、R6（交还路线）、R5（受阻分支例外）、R8（roadmap 42 行）都依赖阶段 2.5 的用户裁决，目前未获答复。
- 按 plan 048 自己的规定，确认之前这些条目不记 PASS。这一条不是执行者能修的。

### 建议

**N5 F9 修复的两处残留。新。**
- PATH 里没有 git 时，报错分支自己抛 TypeError。退出码仍是 2，但 `result.stderr` 为空时应当给出设计的那句话。
- 带值的已跟踪文件不可读或被删时，`git grep` 退出码是 1，脚本判为干净。只在本地异常检出时出现，CI 不受影响。
- 修法：退出码 1 且 stderr 非空就报错；或改为扫提交树（`git grep … HEAD -- .`）。代码注释「git grep 对无命中和致命错误都退出 1」说得不准，我测到致命错误是 128 或「1 且带 stderr」。

**N6 归档的摆放与重复。复发**（pitfalls「不要跨载体誊写同一基线数字/行号清单」；S41 阶段 0 的 🟡-9 同族）。**
- 详见 4.2。建议把 9 个非 rc.5 文件移到 stage3-logs 并删去重复，`red-*.yml` 只留索引指向。

**N7 stage3-logs 的 `INDEX.md` 少一句说明。新。**
- 应补上 rc5-live 第 4 行那句：哈希取自遮蔽前的原文件，无法由归档文件复算。

**N8 `tests/pack.test.ts` 的新用例偏脆。新。**
- 它断言子进程 stderr 为空，又实跑两次 `npm pack`。换 npm 版本后 stderr 多一行提示就会红，每次还会往用户的 `~/.npm/_logs` 写两份日志。
- 建议只断言 tarball 存在，并给子进程指定临时 `npm_config_cache`。

**N9 发布手册 §5 与 §6 连起来有个副作用。新。**
- §5 让在单独克隆里打包，§6 又把「第 5 节打出的裸名 tarball」装进桌面端，profile 就钉上了一个临时克隆里的路径。
- 建议注明克隆要留到 §11 第 4 步，或改装 GitHub Release 里的 tarball。另外「本机 npm 是 10.x」是机器相关的事实。

**N10 ADR-0026 的 Status 有两处小瑕疵。新。**
- 引用了「F9」这个审核编号，没有给出处。
- 决策 8 没有归入「已执行」或「尚未发生」任何一边。

**N11 V3 证据早于现行文案，用户文档里有一句没有实测依据。新。**
- `evidence__v3-*.txt` 采于 `2df185d` 之前。新写的「搜索与抓取会失败」与问题表 ⑤ 自己注的「本轮未实跑搜索」不一致。
- 建议在 T12 条目里注明，由阶段 5 的 V3 重做覆盖。

**N12 记录与 SOP 的零碎缺口。复发**（pitfalls「不要让『现在到哪』依赖多源拼图」）。**
- 「未完成 / 遗留」没有记 OIDC 首发窗（npm 文档确认新配置须在 2 天内完成首次发布；plan 记的到期日是 2026-11-25，而发布已顺延）。
- SOP 第 91 行仍写「生产 3080 在役实录」，而 STATUS 写的是 3080 自 2026-10-11 起没有监听。这句是存量，但 `3f14a69` 刚改过同一句。
- 「交付物」表还没有列第 1 轮 audit-log、三个归档目录、`scripts/check-release.d.mts`，可留给阶段 6。

**N13 已验锚点台账仍待阶段 6 更新。**
- 行号与第 1 轮相同，提交指针有变化：`pack.mjs` 现在改到了 `9dfee75`，release.yml 到 `0665382`，SOP 到 `3f14a69`，问题表到 `93c31d9`。`src/index.ts` 与 ADR-0023 仍未变。

## 7. 总体结论

**NEEDS REVISION。**

必改项：

1. **N1** 修掉 `tests/package-meta.spec.ts:58` 的 lint 警告，记录里如实写读数。
2. **N2** 更正 rc5-live 索引第 5 行，给「V4 PASS」那行加说明。
3. **N3** session 记录第 103 行与 F17 一行补勘正注。
4. **N4** R2、R5、R6、R8 所依赖的 2.5 裁决。用户答复之前，这四条按证据不能记 PASS。

第 1 轮的 7 条必改里，F1、F3（文档部分）、F4、F5、F7 已吸收；F2、F6 属第 4 项。全量测试已回到全绿，F24 的两处修复正确，归档没有敏感内容且索引可核。
