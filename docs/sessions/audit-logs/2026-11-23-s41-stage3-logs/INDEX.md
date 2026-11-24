# S41 阶段 3 任务日志（脱敏归档）

来源是仓库外的 scratch 目录 `/tmp/dshws-s41/`。文件名即原文件名：`t<N>-red` 是该任务修复前的红证，`t<N>-green` 是修复后的绿证，
`f<N>-*` 是阶段 4 第 1 轮核验后各条修正的日志，`frozen*`、`fresh-*` 是 T3 对 lockfile 的正反验证。
令牌值已替换为 `<redacted>`；`f9-red.log` 里被遮蔽的两处是测试夹具插值拼出的合成值，不是真实令牌。
「原文件 sha256 前 16 位」取自遮蔽前的原文件，做过遮蔽的文件无法由归档文件复算，其余文件可以。
rc.5 实测本身的证据（dump、页面无障碍树、探针日志）在 `../2026-11-23-s41-rc5-live/`，这里只有任务级的红证与绿证。

| 归档文件 | 原文件字节数 | 原文件 sha256 前 16 位 | 内容 |
|---|---|---|---|
| f1-full.log | 8679 | 455cdacdb046bffb | 任务日志 f1-full.log |
| f1-green.log | 332 | 28c3c50fe29e760a | 任务日志 f1-green.log |
| f1-lint.log | 111 | eddf2354bd0b5d97 | 任务日志 f1-lint.log |
| f1-red.log | 3628 | 70400d051ea0dd6d | 任务日志 f1-red.log |
| f1-typecheck.log | 55 | 54e880f9cb3c7c7e | 任务日志 f1-typecheck.log |
| f3-i18n.log | 189 | 4f42e483f11ff8be | 任务日志 f3-i18n.log |
| f3-tests.log | 261 | 4fa3e5bdd2b2e245 | 任务日志 f3-tests.log |
| f4-lint.log | 110 | 663664f872d46ce4 | 任务日志 f4-lint.log |
| f4-tests.log | 312 | 18088914558cf450 | 任务日志 f4-tests.log |
| f9-green.log | 271 | c8b9446365b61ca7 | 任务日志 f9-green.log |
| f9-lint.log | 110 | 6c58b3f635bac98f | 任务日志 f9-lint.log |
| f9-red.log | 4163 | 3a384fb9b8aa4578 | 任务日志 f9-red.log（遮蔽 2 处令牌值） |
| f9-typecheck.log | 55 | 54e880f9cb3c7c7e | 任务日志 f9-typecheck.log |
| f13-lint.log | 110 | 8b11bb29c576c84a | 任务日志 f13-lint.log |
| f13-tests.log | 5680 | 726cdff7874cc88a | 任务日志 f13-tests.log |
| f13-typecheck.log | 55 | 54e880f9cb3c7c7e | 任务日志 f13-typecheck.log |
| f19-lint.log | 470 | 8b8cd23dc7ec1a4b | 任务日志 f19-lint.log |
| f19-tests.log | 368 | f96c9be5a21b539a | 任务日志 f19-tests.log |
| f19-typecheck.log | 55 | 54e880f9cb3c7c7e | 任务日志 f19-typecheck.log |
| f24-green.log | 271 | a809f1bb2668fe69 | 任务日志 f24-green.log |
| f24-lint.log | 469 | 0511843a1e39c207 | 任务日志 f24-lint.log |
| f24-red.log | 2670 | 554dfc65f03745cd | 任务日志 f24-red.log |
| f24-typecheck.log | 55 | 54e880f9cb3c7c7e | 任务日志 f24-typecheck.log |
| f24b-green.log | 367 | b6d480bbc117716b | 任务日志 f24b-green.log |
| f24b-lint.log | 470 | a30dfda7d0b12cb7 | 任务日志 f24b-lint.log |
| f24b-red.log | 1503 | 4322513739cc38bb | 任务日志 f24b-red.log |
| f24b-typecheck.log | 55 | 54e880f9cb3c7c7e | 任务日志 f24b-typecheck.log |
| fresh-neg.log | 498 | 527841cb57969293 | 任务日志 fresh-neg.log |
| fresh-pos.log | 3855 | d23dbcac5ba48a9a | 任务日志 fresh-pos.log |
| frozen-neg.log | 52 | 48c5524ed018957a | 任务日志 frozen-neg.log |
| frozen-neg2.log | 52 | 4db79f3757ace1eb | 任务日志 frozen-neg2.log |
| frozen.log | 52 | a250adf3201c207d | 任务日志 frozen.log |
| frozen2.log | 52 | c7ee955fd04272b3 | 任务日志 frozen2.log |
| t3-test.log | 266 | 2a443bcce25e9bc4 | 任务日志 t3-test.log |
| t3-tsc.log | — | 0（空文件，未归档） | 任务日志 t3-tsc.log |
| t4-install.log | 2125 | 03224a8814025f58 | 任务日志 t4-install.log |
| t5-green.log | 258 | 4b074011bb838897 | 任务日志 t5-green.log |
| t5-red.log | 2998 | 85832180e4c87b7f | 任务日志 t5-red.log |
| t5-related.log | 345 | 63197a687fc85be5 | 任务日志 t5-related.log |
| t6-green.log | 262 | 52504eda2135d64f | 任务日志 t6-green.log |
| t6-red.log | 830 | 9576d0507d75dda1 | 任务日志 t6-red.log |
| t6-tsc.log | — | 0（空文件，未归档） | 任务日志 t6-tsc.log |
| t8-green.log | 5673 | 37970ecf064ed906 | 任务日志 t8-green.log |
| t8-red.log | 921 | 7d76959c9e9bf4a1 | 任务日志 t8-red.log |
| t8-tsc-client.log | — | 0（空文件，未归档） | 任务日志 t8-tsc-client.log |
| t8-tsc.log | — | 0（空文件，未归档） | 任务日志 t8-tsc.log |
| t8b-green.log | 5673 | 07e2bbb9940d555d | 任务日志 t8b-green.log |
| t8b-red.log | 14203 | 1b689477ee29481b | 任务日志 t8b-red.log |
| t8b-tsc-client.log | — | 0（空文件，未归档） | 任务日志 t8b-tsc-client.log |
| t8b-tsc.log | — | 0（空文件，未归档） | 任务日志 t8b-tsc.log |
| t9-build.log | 1173 | cd81f2ddb6212e86 | 任务日志 t9-build.log |
| t9-green.log | 263 | f428e1ef04325b30 | 任务日志 t9-green.log |
| t9-green2.log | 304 | e90daa72c95dfa45 | 任务日志 t9-green2.log |
| t9-green3.log | 263 | 05aaec890fc9fc38 | 任务日志 t9-green3.log |
| t9-i18n.log | 189 | 4f42e483f11ff8be | 任务日志 t9-i18n.log |
| t9-red.log | 7922 | 1c187f3bc48e2f0b | 任务日志 t9-red.log |
| t9-tsc.log | — | 0（空文件，未归档） | 任务日志 t9-tsc.log |
| t10-build.log | 1173 | 759f1aac88ef866e | 任务日志 t10-build.log |
| t10-green.log | 271 | 38bba8d583085dd0 | 任务日志 t10-green.log |
| t10-real-neg.log | 235 | a67cd666e7fbce26 | 任务日志 t10-real-neg.log |
| t10-real-none.log | 154 | 009ea50508584020 | 任务日志 t10-real-none.log |
| t10-real-pos.log | 90 | 93367e7c5d770643 | 任务日志 t10-real-pos.log |
| t10-red.log | 841 | 04193561750cc5d6 | 任务日志 t10-red.log |
| t10-tsc.log | — | 0（空文件，未归档） | 任务日志 t10-tsc.log |
| t11-fix-tsc.log | — | 0（空文件，未归档） | 任务日志 t11-fix-tsc.log |
| t11-fix.log | 271 | a39083335828f2a3 | 任务日志 t11-fix.log |
| t11-fresh-clone-rehearsal.log | 2148 | eb7ec6f630c2b0e0 | 任务日志 t11-fresh-clone-rehearsal.log |
| t11-frozen.log | 52 | 5af78008a9aa33b0 | 任务日志 t11-frozen.log |
| t11-green.log | 267 | 0e13287214c0e0ae | 任务日志 t11-green.log |
| t11-install.log | 344 | b99d2beb56590ac2 | 任务日志 t11-install.log |
| t11-red.log | 5402 | 9b228c94f7637c7f | 任务日志 t11-red.log |
| t11-tsc.log | — | 0（空文件，未归档） | 任务日志 t11-tsc.log |
| t11b-green.log | 267 | 3fcc29822f02f1f4 | 任务日志 t11b-green.log |
| t11b-lint.log | 111 | ca8b2e87575d0fed | 任务日志 t11b-lint.log |
| t11b-red.log | 1795 | f48c77d0d0435961 | 任务日志 t11b-red.log |
| t11b-typecheck.log | 55 | 54e880f9cb3c7c7e | 任务日志 t11b-typecheck.log |
| t13-doc-tests.log | 472 | 433e4f6ce78e2a1b | 任务日志 t13-doc-tests.log |
| t14-full2-test.log | 8791 | fb71024a89684da1 | 任务日志 t14-full2-test.log |

归档时对全部归档文本做了模式扫描（令牌值、密钥形态、Bearer 值、JWT、凭据赋值），命中数为 0。
