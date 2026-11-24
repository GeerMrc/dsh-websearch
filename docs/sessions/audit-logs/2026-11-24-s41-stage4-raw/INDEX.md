# S41 阶段 4 第 1 轮核验的原始输出（脱敏归档）

来源是仓库外的 `/tmp/dshws-s41/stage4/logs/`，由阶段 4 第 1 轮的核验 Agent 产生，主 Agent 未改动内容。
报告正本在 `../2026-11-24-s41-stage4-verify-r1.md`；这里的 `b-*` 是全量门，`e-*` 是全新克隆的八步预演，`f-*` 是先红后绿抽样与失败引入提交的定位。
归档时 HEAD 已前移到修正提交之后，修正提交的绿证在任务日志归档的 `f<N>-*` 里。

| 归档文件 | 原文件字节数 | 原文件 sha256 前 16 位 | 内容 |
|---|---|---|---|
| stage4__logs__b-build.log | 1180 | 35ddf3472cd5efcb | 阶段 4 第 1 轮核验 Agent 的原始输出 b-build.log |
| stage4__logs__b-check-i18n.log | 196 | af51deca4d62af34 | 阶段 4 第 1 轮核验 Agent 的原始输出 b-check-i18n.log |
| stage4__logs__b-lint.log | 117 | 0431635134d0ad31 | 阶段 4 第 1 轮核验 Agent 的原始输出 b-lint.log |
| stage4__logs__b-test.log | 12053 | 19df1316e60f3af5 | 阶段 4 第 1 轮核验 Agent 的原始输出 b-test.log |
| stage4__logs__b-typecheck.log | 62 | 99b66d1ad52dcb43 | 阶段 4 第 1 轮核验 Agent 的原始输出 b-typecheck.log |
| stage4__logs__c-link-check.log | 260 | 2976cf6fc3c7a704 | 阶段 4 第 1 轮核验 Agent 的原始输出 c-link-check.log |
| stage4__logs__c-subsets.log | 2260 | 540540f0ebacd550 | 阶段 4 第 1 轮核验 Agent 的原始输出 c-subsets.log |
| stage4__logs__c-wf-ci.yml.json | 860 | f718d1c93e89168a | 阶段 4 第 1 轮核验 Agent 的原始输出 c-wf-ci.yml.json |
| stage4__logs__c-wf-release.yml.json | 1525 | 0e740025d2230561 | 阶段 4 第 1 轮核验 Agent 的原始输出 c-wf-release.yml.json |
| stage4__logs__d-log-stat.txt | 19464 | dfc709ce8b9a7e3b | 阶段 4 第 1 轮核验 Agent 的原始输出 d-log-stat.txt |
| stage4__logs__e-build.log | 1159 | a19404546df38946 | 阶段 4 第 1 轮核验 Agent 的原始输出 e-build.log |
| stage4__logs__e-check-tag.log | 150 | 8557232a4ee78ace | 阶段 4 第 1 轮核验 Agent 的原始输出 e-check-tag.log |
| stage4__logs__e-check-tarballs.log | 25 | c035b8732e061623 | 阶段 4 第 1 轮核验 Agent 的原始输出 e-check-tarballs.log |
| stage4__logs__e-clone.log | 59 | 3e9ecaae962c1361 | 阶段 4 第 1 轮核验 Agent 的原始输出 e-clone.log |
| stage4__logs__e-contract-tests.log | 416 | dd7e2e0b07355296 | 阶段 4 第 1 轮核验 Agent 的原始输出 e-contract-tests.log |
| stage4__logs__e-install.log | 2031 | ddec1ce65627fcf4 | 阶段 4 第 1 轮核验 Agent 的原始输出 e-install.log |
| stage4__logs__e-pack.log | 94 | 2e9bb8edff6079ad | 阶段 4 第 1 轮核验 Agent 的原始输出 e-pack.log |
| stage4__logs__e-status.log | 7 | 19eaf43821a7660e | 阶段 4 第 1 轮核验 Agent 的原始输出 e-status.log |
| stage4__logs__e-tarball-bare.list | 275 | 73e845a04168e616 | 阶段 4 第 1 轮核验 Agent 的原始输出 e-tarball-bare.list |
| stage4__logs__e-tarball-scoped.list | 275 | 73e845a04168e616 | 阶段 4 第 1 轮核验 Agent 的原始输出 e-tarball-scoped.list |
| stage4__logs__f-clone-full-test.log | 12048 | 2d53760f18735e30 | 阶段 4 第 1 轮核验 Agent 的原始输出 f-clone-full-test.log |
| stage4__logs__f-suite-red-introducer.log | 7773 | b95d64e86b972495 | 阶段 4 第 1 轮核验 Agent 的原始输出 f-suite-red-introducer.log |
| stage4__logs__f-t5-green.log | 370 | 9ca2520dc1007b21 | 阶段 4 第 1 轮核验 Agent 的原始输出 f-t5-green.log |
| stage4__logs__f-t5-red.log | 3199 | 8a1a11d6b0d0e4b1 | 阶段 4 第 1 轮核验 Agent 的原始输出 f-t5-red.log |
| stage4__logs__f-t10-red-green.log | 1594 | 7d9e1fec0b6da573 | 阶段 4 第 1 轮核验 Agent 的原始输出 f-t10-red-green.log |
| stage4__logs__f-t11b-green.log | 404 | 10346177dd0b472f | 阶段 4 第 1 轮核验 Agent 的原始输出 f-t11b-green.log |
| stage4__logs__f-t11b-red.log | 2039 | d13ba4fb6d6de562 | 阶段 4 第 1 轮核验 Agent 的原始输出 f-t11b-red.log |
| stage4__logs__red-v1-dump-config.yml | 46678 | 998bf81c2d74b041 | 阶段 4 第 1 轮核验 Agent 的原始输出 red-v1-dump-config.yml |
| stage4__logs__red-v5-dump-config-off.yml | 46548 | b2b2e0864378d09a | 阶段 4 第 1 轮核验 Agent 的原始输出 red-v5-dump-config-off.yml |
| stage4__logs__red-v6-dump-config-on.yml | 46853 | 80f4bcde55046c69 | 阶段 4 第 1 轮核验 Agent 的原始输出 red-v6-dump-config-on.yml |
| stage4__logs__red-v7-dump-off-before-fix.yml | 46713 | a5d4cfa78bbc46f7 | 阶段 4 第 1 轮核验 Agent 的原始输出 red-v7-dump-off-before-fix.yml |
| stage4__logs__red-v7-dump-seeded.yml | 46962 | e9947dfb2d8e30c2 | 阶段 4 第 1 轮核验 Agent 的原始输出 red-v7-dump-seeded.yml |

归档时对全部归档文本做了模式扫描（令牌值、密钥形态、Bearer 值、JWT、凭据赋值），命中数为 0。
