# dsh-websearch 发布手册

> 适用：正式版本 `vX.Y.Z` 的发布。决策依据 [ADR-0026](decisions/adr-0026-oidc-release-and-three-sync-gate.md)，
> 版本号规则见 [ADR-0020](decisions/adr-0020-version-line-v010.md)，发布失败后的升级处置见 [upgrade.md](upgrade.md) §6。
> 本手册只写操作步骤、判据与失败处置；流程编排在 plan 048 的「发布序列」一节。

## 1. 不变量

| 编号 | 不变量 | 由谁保证 |
|---|---|---|
| I1 | tag `vX.Y.Z`、`package.json` 的 `version`、CHANGELOG 首个日期二级标题、`USER_AGENT`、npm 上的版本，五者是同一个版本 | `scripts/check-release.mjs --tag`，本地与流水线各跑一次 |
| I2 | tag 指向 `master` 上的提交，且就是发布流水线构建的那个提交 | 一致性门的 HEAD 与 master 断言；`fetch-depth: 0` |
| I3 | 版本号一个批次只变一次，变更时点是用户代码终审通过并明确确认 | 第 3 节前置核对 P1 |
| I4 | tag 推送后不再移动；发布失败不改写历史、不强推、不覆盖已发布版本 | 第 7、10 节 |
| I5 | 发布凭据来自 OIDC trusted publishing，不使用长期 token | `release.yml`；契约测试断言其中没有 `NPM_TOKEN` |

## 2. 角色与门控

- 主 Agent：执行各步，留命令原文、退出码与关键输出。
- 独立 Agent：在 Session 42 的阶段 4、5 核验。
- 用户：两个触发点。①代码终审通过并确认版本号；②对「打 tag」「推送」分别单独确认。
  npm 侧的 Trusted Publisher 配置、dist-tag 权限、吊销旧 token 由用户亲自操作，代理只在 npmjs 读信息。

## 3. 前置核对（打 tag 之前，逐项留痕）

| 编号 | 核对项 | 命令或位置 | 通过判据 |
|---|---|---|---|
| P1 | 用户确认在案 | session 记录 | 记有用户确认版本号的原文 |
| P2 | 工作树干净 | `git status --short` | 无输出 |
| P3 | 将被公开的未推送提交已出示 | `git fetch origin && git log --oneline origin/master..master` | 清单已给用户看过；其中的 token 值历史已按用户裁决处置 |
| P4 | 远端没有同名 tag | `git ls-remote --tags origin refs/tags/vX.Y.Z` | 无输出 |
| P5 | npm 上没有该版本 | `npm view @maricgeer/dsh-websearch@X.Y.Z version --registry https://registry.npmjs.org` | 报 `E404` |
| P6 | Trusted Publisher 配置有效（仅首次 OIDC 发布需要核期限） | npmjs.com → 包页 → Settings → Trusted Publisher | 配置存在。npm 规定新配置须在创建后 2 天内完成首次成功发布，过期后不能再用也不能编辑，只能删除重建 |
| P7 | 包元数据指向本仓库 | `package.json` 的 `repository.url` | `git+https://github.com/GeerMrc/dsh-websearch.git` |
| P8 | 网络与命令行登录 | `curl -sI https://registry.npmjs.org \| head -n 1`、`gh auth status` | `200`；已登录 |

P6 的配置项：GitHub Actions；仓库 `GeerMrc/dsh-websearch`；工作流文件名 `release.yml`（只填文件名）；
environment 留空；`Allow npm publish` 勾选。npm 保存配置时不做校验，填错只会在发布时报错。
截至 2026-11-24，`Allow npm dist-tag` 未勾选。npm 文档没有说明发布新版本时顺带移动 `latest` 是否需要这项权限，
这是首次发布唯一没有文档依据的未知项；若因此被拒，按第 10 节处置。

一切 npmjs 操作显式带 `--registry https://registry.npmjs.org`，因为本机默认 registry 是 npmmirror。

## 4. 版本变更（一个提交）

改三处，缺一处一致性门就会拒绝：

| 位置 | 改成 |
|---|---|
| `package.json` 的 `version` | `X.Y.Z` |
| `src/providers/shared.ts` 的 `USER_AGENT` | `'dsh-websearch/X.Y.Z'` |
| `CHANGELOG.md` | 在条目最上方新增 `## YYYY-MM-DD — vX.Y.Z …`，标题里必须带 `v` 前缀的版本号 |

`pnpm-lock.yaml` 不记录根包的版本，不需要改。`tests/user-agent.test.ts` 把 `USER_AGENT` 与 `package.json` 的版本钉在一起：
改了一处没改另一处，它就失败。

## 5. 本地门（在 feat 分支）

顺序与 `release.yml` 一致：

```sh
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run check:i18n
pnpm run build
node scripts/pack.mjs
node scripts/check-release.mjs --tarballs dist-artifacts
```

判据：全部退出码 0。`--tarballs` 这一次即非 tag 模式：校验两个 tarball 的内容，并扫描 HEAD 提交树里已提交的 host token 值。
扫描不含未提交的改动，所以本地这一次要在提交之后跑才有效。
随后来的是独立核验（Session 42 阶段 4），核验对象是版本变更后的提交。

在单独的克隆里做本节，不要在主检出里做：`node scripts/pack.mjs` 会写当前检出的 `dist-artifacts/`，而主检出的这个目录里
放着本机桌面端可能还在引用的裸名 tarball。执行机上的 npm 版本可能与流水线不同（写本手册时本机是 10.x、流水线是 11.x），`npm pack` 的产物随 npm 版本不同，
所以本地打出的 tarball 与发布出去的不是同一份字节。桌面端实测用的是本地这份；发布后按第 9 节核对 CI 打的那份。

## 6. 候选包装入桌面端实测（用户门控）

备份 `~/.dsh/profiles/desktop` 的 `package.json`、`cordis.patch.yml`、`pnpm-lock.yaml`，用 app 内置命令装入
第 5 节打出的裸名 tarball，重启 app，按 plan 048「发布序列」步骤 1 的验收项核对；不过则从备份还原并回到第 4 节。
桌面 profile 的依赖行会因此指向第 5 节那个克隆里的路径：把该克隆保留到第 11 节第 4 步做完，或在发布后改用 GitHub Release 里
CI 打的裸名 tarball。
这一步写生产 profile，只在用户当时明确指令后执行。

## 7. 合并、打 tag、推送

每一条带 ★ 的命令执行前单独取得用户确认。三段依次进行，前一段不过不进下一段。

```sh
# 7.1 草稿 PR 预演（plan 048 步骤 2a）：让 ci.yml 在候选提交上跑发布预演
git push -u origin <feat 分支>                                                 # ★ 公开推送，连同它带上的全部未推送提交
gh pr create --draft --base master --head <feat 分支> --title "vX.Y.Z" --body "<说明>"
gh pr checks --watch                                                           # 判据：CI 在 node 22 与 node 24 上都通过

# 7.2 合并与 tag
git checkout master
git merge --ff-only <feat 分支>
git tag -a vX.Y.Z -m "vX.Y.Z"                 # ★
node scripts/check-release.mjs --tag vX.Y.Z   # 与流水线同一调用
node scripts/pack.mjs
node scripts/check-release.mjs --tarballs dist-artifacts

# 7.3 推送（PC5：主干先、tag 后）

git push origin master                          # ★ 先推主干，等 CI（node 22/24）全绿
git push origin vX.Y.Z                          # ★ 再推 tag 触发 Release
```

顺序依据 `docs/patterns.md` PC5（兄弟仓实测过同批推送不触发 workflow）：先主干后 tag 的最坏态是「主干已推、tag 未推」＝
无发布、可安全重试；tag 先行的坏态是发布未经 CI 的提交。`git push --atomic` 仅在两步均不可行时使用，且推送后必须人工
确认 Release 工作流已触发（Actions 页），未触发则停下排查，不得移动 tag。

## 8. 流水线做什么

`Release` 工作流在 `v*` tag 上运行：全量门 → 安装 npm 11 → 一致性门（tag 模式）→ 打包 → tarball 校验 →
GitHub Release（附两个 tarball）→ `npm publish`（scoped 包，`--provenance`）。发布步失败时，最后一步会打印 npm 侧的
trusted publishing 原因（第 10 节）。

本地演练不到的部分：OIDC 换取发布凭据、`gh release create`、provenance 生成。它们只在首个 tag 上第一次真实发生。
重跑工作流读的是 tag 所在提交里的工作流文件，所以 tag 推送之后对 `release.yml` 的修改对这次发布不起作用。

## 9. 发布后核对

```sh
npm view @maricgeer/dsh-websearch@X.Y.Z version dist.integrity dist.attestations --registry https://registry.npmjs.org
gh release view vX.Y.Z --repo GeerMrc/dsh-websearch --json tagName,isDraft,isPrerelease,assets
git ls-remote --tags origin refs/tags/vX.Y.Z 'refs/tags/vX.Y.Z^{}'
git rev-parse 'vX.Y.Z^{}'
```

判据：

- npm 的 `version` 等于 `X.Y.Z`，`dist.attestations` 含 provenance 条目。
- GitHub Release 不是草稿、不是预发布，资产含 `maricgeer-dsh-websearch-X.Y.Z.tgz` 与 `dsh-websearch-X.Y.Z.tgz`。
- 远端 tag 指向的提交等于本地 tag 指向的提交。
- GitHub Release 里的裸名 tarball 是 CI 用 npm 11 打的，与桌面端实测用的本地那份不是同一份字节。下载后比对成员清单
  （`tar -tzf <文件> | sort`），两份清单应当一致。

`dist.attestations` 的字段形态取自 npm 注册表的通用返回，本包尚未有过带 provenance 的版本；首次发布后按实际所见修订本节。

## 10. 失败处置

| 中断态 | 现象 | 处置 | tag |
|---|---|---|---|
| 本地门或前置核对不过 | 未打 tag | 修复后回到第 3 节 | 无 |
| 流水线在发布步之前失败 | run 红；无 GitHub Release；npm 无该版本 | tag 已公开，按 I4 不移动。修复后以更高的补丁号走完整流程 | 不动 |
| GitHub Release 步瞬时失败 | run 红；Release 页无条目 | Actions 页 Re-run 同一个 run（同一提交、同一 tag） | 不动 |
| npm 发布步失败 | run 日志末尾有「Show npm's trusted-publishing diagnosis」一步的输出 | 按输出对照下表 | 不动 |
| 全部成功 | — | 第 9 节核对，再做第 11 节 | — |

发布步的失败原因对照。凡是只需要在 npm 侧改设置的，改完直接 Re-run 同一个 run，不需要新版本：

| 输出里的字样 | 含义 | 处置 |
|---|---|---|
| `verbose oidc Failed token exchange request with body message: …`，随后 `ENEEDAUTH` | 注册表拒绝换取凭据：配置过期，或仓库名、工作流文件名、`repository.url` 不匹配 | 用户删除并重建配置（过期），或核对 P6、P7；然后 Re-run |
| `silly oidc Skipped because incorrect permissions for id-token within GitHub workflow` | 工作流缺 `id-token: write` | 契约测试已锁定这一项；仍出现说明 tag 所在提交的工作流被改过，修复要走新版本 |
| `silly oidc Skipped because no id_token available` | runner 没有提供 OIDC ID token | 确认 `runs-on` 是 GitHub 托管的 runner；npm 不支持自托管 runner |
| `cannot manage dist-tags` | npm 侧未授权该发布者管理 dist-tag | 用户在 npm 勾选 `Allow npm dist-tag`；然后 Re-run（ADR-0026 决策 8） |
| `You cannot publish over the previously published versions` | 该版本已经在 npm 上（上一次运行在发布后才失败） | 按已发布处理，补做第 9 节核对 |
| `Cannot implicitly apply the "latest" tag because previously published version … is higher` | 版本号低于 npm 上的最高版本 | 违反版本规则；修正版本号后以新 tag 重发 |

npm 只把这些原因写进 runner 上的 verbose 日志，再以笼统的 `ENEEDAUTH` 结束，所以诊断步骤只认 `oidc` 记录器的行。
需要改代码或改工作流才能解决的失败：不移动 tag，修复后以更高的补丁号重发。旧 tag 与它的 GitHub Release 留作记录，
是否改成预发布或删除由用户决定。任何情况下不 `git push --force`、不 `git tag -f`、不删除已推送的 tag、不手工 `npm publish`。

## 11. 收尾

1. 核对通过后，用户吊销仓库 secret `NPM_TOKEN` 与 npm 侧对应的 token（ADR-0026 决策 9）。工作流不再读它，留着只是多一份长期凭据。
2. 写 session 记录，刷新 [STATUS.md](STATUS.md)。
3. 清理已合并的 feat 分支（删除类动作，单独确认）。
4. 可选：桌面端改用 npm 包名重装，清掉「钉本地 tgz」的债务（plan 048 步骤 4）。

## 关联

- [.github/workflows/release.yml](../.github/workflows/release.yml)、[.github/workflows/ci.yml](../.github/workflows/ci.yml)
- [scripts/check-release.mjs](../scripts/check-release.mjs)、[scripts/pack.mjs](../scripts/pack.mjs)
- npm 文档：https://docs.npmjs.com/trusted-publishers 、https://docs.npmjs.com/generating-provenance-statements
