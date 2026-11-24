# S41 阶段 5 实测证据（脱敏归档）

来源是仓库外的 `/tmp/dshws-s41/stage5/evidence/`，由阶段 5 的独立交叉验证 Agent 产生，主 Agent 未改动内容。
报告正本在 `../2026-11-24-s41-stage5-r1.md`。M1–M8 各项对应的文件名见报告「实测结果表」；`m8-SUMMARY.md` 是 T5p 两格重测的汇总。
文件名前的数字前缀（`00-` 至 `99-`）是该 Agent 的操作序号，不是任务编号。

| 归档文件 | 原文件字节数 | 原文件 sha256 前 16 位 | 内容 |
|---|---|---|---|
| stage5__evidence__00-baseline-dump-asfound.yml | 47117 | efd472ec82ee5927 | 阶段 5 独立交叉验证 Agent 的实测证据 00-baseline-dump-asfound.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5__evidence__00-baseline-rows.txt | 3219 | 241a6bda00d52c22 | 阶段 5 独立交叉验证 Agent 的实测证据 00-baseline-rows.txt |
| stage5__evidence__00-before-swap-detail-zh-prevcandidate.txt | 5896 | 8a195a572856db8b | 阶段 5 独立交叉验证 Agent 的实测证据 00-before-swap-detail-zh-prevcandidate.txt |
| stage5__evidence__00-before-swap-plugins-list-prevcandidate.txt | 3007 | b56507faa84cb1f5 | 阶段 5 独立交叉验证 Agent 的实测证据 00-before-swap-plugins-list-prevcandidate.txt |
| stage5__evidence__31-after-cli-add-head-list-after-refresh.txt | 3007 | 8c296d790f7d6099 | 阶段 5 独立交叉验证 Agent 的实测证据 31-after-cli-add-head-list-after-refresh.txt |
| stage5__evidence__31-after-cli-add-head-list-nointeraction.txt | 2648 | 084ed3b397498b16 | 阶段 5 独立交叉验证 Agent 的实测证据 31-after-cli-add-head-list-nointeraction.txt |
| stage5__evidence__31-after-reload-landing.txt | 1601 | c2048da650f0f924 | 阶段 5 独立交叉验证 Agent 的实测证据 31-after-reload-landing.txt |
| stage5/evidence/31-cli-add-head.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 31-cli-add-head.stderr.txt |
| stage5__evidence__31-cli-add-head.stdout.txt | 549 | 69d02891a906ffdf | 阶段 5 独立交叉验证 Agent 的实测证据 31-cli-add-head.stdout.txt |
| stage5__evidence__31-host-plugin-log-dsh-websearch-redacted.txt | 10417 | 5b3efc1fbca93a68 | 阶段 5 独立交叉验证 Agent 的实测证据 31-host-plugin-log-dsh-websearch-redacted.txt |
| stage5__evidence__40-account-menu.txt | 3239 | bfc9b922fc30efbd | 阶段 5 独立交叉验证 Agent 的实测证据 40-account-menu.txt |
| stage5__evidence__40-more-menu.txt | 3173 | 1b5ddb256b8fd0f8 | 阶段 5 独立交叉验证 Agent 的实测证据 40-more-menu.txt |
| stage5__evidence__50-userlayer-after-fetch-off.txt | 794 | 7f11ffddc6c1ff48 | 阶段 5 独立交叉验证 Agent 的实测证据 50-userlayer-after-fetch-off.txt |
| stage5__evidence__52-userlayer-after-restore.txt | 1049 | 8c517fd9b3d98eac | 阶段 5 独立交叉验证 Agent 的实测证据 52-userlayer-after-restore.txt |
| stage5/evidence/99-final-cli-add-head.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 99-final-cli-add-head.stderr.txt |
| stage5__evidence__99-final-cli-add-head.stdout.txt | 552 | bb7aa510962fdd5e | 阶段 5 独立交叉验证 Agent 的实测证据 99-final-cli-add-head.stdout.txt |
| stage5/evidence/99-final-cli-remove.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 99-final-cli-remove.stderr.txt |
| stage5__evidence__99-final-cli-remove.stdout.txt | 151 | a648b200f8eaffe7 | 阶段 5 独立交叉验证 Agent 的实测证据 99-final-cli-remove.stdout.txt |
| stage5/evidence/99-final-dump-config.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 99-final-dump-config.stderr.txt |
| stage5__evidence__99-final-dump-config.yml | 47008 | 6c52e02aa48006bf | 阶段 5 独立交叉验证 Agent 的实测证据 99-final-dump-config.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5__evidence__99-final-install-head.txt | 1554 | 43e1dc838818ca9c | 阶段 5 独立交叉验证 Agent 的实测证据 99-final-install-head.txt |
| stage5__evidence__99-final-plugins-list.txt | 3007 | 8c296d790f7d6099 | 阶段 5 独立交叉验证 Agent 的实测证据 99-final-plugins-list.txt |
| stage5__evidence__99-final-state.txt | 3539 | de67d28220fb03f3 | 阶段 5 独立交叉验证 Agent 的实测证据 99-final-state.txt |
| stage5__evidence__b-token-scan-binary-probe.txt | 845 | f5df65a50fcf4ffa | 阶段 5 独立交叉验证 Agent 的实测证据 b-token-scan-binary-probe.txt |
| stage5__evidence__INDEX.txt | 6236 | d3e357ea25564cc2 | 阶段 5 独立交叉验证 Agent 的实测证据 INDEX.txt |
| stage5__evidence__m0-clean-start-rows.txt | 2364 | dbf3f8068ff0ded5 | 阶段 5 独立交叉验证 Agent 的实测证据 m0-clean-start-rows.txt |
| stage5__evidence__m0-dump-clean-start-headcandidate.yml | 47008 | 6c52e02aa48006bf | 阶段 5 独立交叉验证 Agent 的实测证据 m0-dump-clean-start-headcandidate.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5__evidence__m0-dump-clean-start-prevcandidate.yml | 47008 | 6c52e02aa48006bf | 阶段 5 独立交叉验证 Agent 的实测证据 m0-dump-clean-start-prevcandidate.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5__evidence__m0-rows-clean-start-headcandidate.txt | 1898 | 4e4b93fe3b2d3e39 | 阶段 5 独立交叉验证 Agent 的实测证据 m0-rows-clean-start-headcandidate.txt |
| stage5__evidence__m1-tools__v3-compare.mjs | 6876 | 84e8706615032862 | 阶段 5 独立交叉验证 Agent 的实测证据 m1-tools__v3-compare.mjs |
| stage5__evidence__m1-v3-detail-en-headcandidate.txt | 6675 | 33ae1ad67aab8a47 | 阶段 5 独立交叉验证 Agent 的实测证据 m1-v3-detail-en-headcandidate.txt |
| stage5__evidence__m1-v3-detail-zh-headcandidate-after-pagereload.txt | 6325 | 096387269ac3e036 | 阶段 5 独立交叉验证 Agent 的实测证据 m1-v3-detail-zh-headcandidate-after-pagereload.txt |
| stage5__evidence__m1-v3-detail-zh-headcandidate-noreload.txt | 5927 | 78a3103d9a3ee31e | 阶段 5 独立交叉验证 Agent 的实测证据 m1-v3-detail-zh-headcandidate-noreload.txt |
| stage5__evidence__m1-v3-plugins-list-en.txt | 3127 | fb72f1a489acef12 | 阶段 5 独立交叉验证 Agent 的实测证据 m1-v3-plugins-list-en.txt |
| stage5__evidence__m1-v3-settings-general-after-switch-back-zh.txt | 8575 | 1dff9119eae433d0 | 阶段 5 独立交叉验证 Agent 的实测证据 m1-v3-settings-general-after-switch-back-zh.txt |
| stage5__evidence__m1-v3-settings-general-after-switch-to-en.txt | 5406 | 01c1835cd5f2a15f | 阶段 5 独立交叉验证 Agent 的实测证据 m1-v3-settings-general-after-switch-to-en.txt |
| stage5__evidence__m1-v3-text-comparison.log | 2449 | 4e85b68df07838c4 | 阶段 5 独立交叉验证 Agent 的实测证据 m1-v3-text-comparison.log |
| stage5__evidence__m1-v3-text-comparison.txt | 2396 | 636700bd950f9306 | 阶段 5 独立交叉验证 Agent 的实测证据 m1-v3-text-comparison.txt |
| stage5__evidence__m1-v4-settings-default-view-zh.txt | 5254 | d014ca90743b4006 | 阶段 5 独立交叉验证 Agent 的实测证据 m1-v4-settings-default-view-zh.txt |
| stage5__evidence__m1-v4-settings-websearch-section-zh.txt | 6294 | a6e300076e1b6ee7 | 阶段 5 独立交叉验证 Agent 的实测证据 m1-v4-settings-websearch-section-zh.txt |
| stage5__evidence__m2-dump-while-off-via-plugins-page.yml | 46703 | 679f1714441658fb | 阶段 5 独立交叉验证 Agent 的实测证据 m2-dump-while-off-via-plugins-page.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5__evidence__m2-plugins-list-after-off.txt | 3130 | bedf41c1b77972de | 阶段 5 独立交叉验证 Agent 的实测证据 m2-plugins-list-after-off.txt |
| stage5__evidence__m2-plugins-list-after-on-again.txt | 3007 | 8c296d790f7d6099 | 阶段 5 独立交叉验证 Agent 的实测证据 m2-plugins-list-after-on-again.txt |
| stage5__evidence__m2-plugins-list-before-off.txt | 3007 | 8c296d790f7d6099 | 阶段 5 独立交叉验证 Agent 的实测证据 m2-plugins-list-before-off.txt |
| stage5__evidence__m2-rows-while-off.txt | 2036 | b2d82f672ff44bf5 | 阶段 5 独立交叉验证 Agent 的实测证据 m2-rows-while-off.txt |
| stage5__evidence__m2-settings-websearch-after-re-enable.txt | 6126 | 7d83afdf9b53f5ab | 阶段 5 独立交叉验证 Agent 的实测证据 m2-settings-websearch-after-re-enable.txt |
| stage5__evidence__m2-settings-websearch-after-restore.txt | 6136 | adc7304f520c3733 | 阶段 5 独立交叉验证 Agent 的实测证据 m2-settings-websearch-after-restore.txt |
| stage5__evidence__m2-settings-websearch-after-uncheck-fetch-takeover.txt | 9605 | c10079e78b8dd48d | 阶段 5 独立交叉验证 Agent 的实测证据 m2-settings-websearch-after-uncheck-fetch-takeover.txt |
| stage5__evidence__m3-after-cli-remove-detail-nointeraction.txt | 5896 | 8a195a572856db8b | 阶段 5 独立交叉验证 Agent 的实测证据 m3-after-cli-remove-detail-nointeraction.txt |
| stage5__evidence__m3-after-cli-remove-plugins-list-after-refresh.txt | 2781 | 0fd1950ab7797dbf | 阶段 5 独立交叉验证 Agent 的实测证据 m3-after-cli-remove-plugins-list-after-refresh.txt |
| stage5__evidence__m3-after-cli-remove-plugins-list.txt | 3131 | 714c2d198bf87117 | 阶段 5 独立交叉验证 Agent 的实测证据 m3-after-cli-remove-plugins-list.txt |
| stage5/evidence/m3-cli-add-back-head.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m3-cli-add-back-head.stderr.txt |
| stage5__evidence__m3-cli-add-back-head.stdout.txt | 550 | ef387f8b4ff458cf | 阶段 5 独立交叉验证 Agent 的实测证据 m3-cli-add-back-head.stdout.txt |
| stage5/evidence/m3-cli-remove-head.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m3-cli-remove-head.stderr.txt |
| stage5__evidence__m3-cli-remove-head.stdout.txt | 151 | c1a7ce7a3d1d3b69 | 阶段 5 独立交叉验证 Agent 的实测证据 m3-cli-remove-head.stdout.txt |
| stage5/evidence/m3-cli-remove-prep.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m3-cli-remove-prep.stderr.txt |
| stage5__evidence__m3-cli-remove-prep.stdout.txt | 152 | b8354f7864906112 | 阶段 5 独立交叉验证 Agent 的实测证据 m3-cli-remove-prep.stdout.txt |
| stage5/evidence/m3-dump-after-cli-add-back-headcandidate.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m3-dump-after-cli-add-back-headcandidate.stderr.txt |
| stage5__evidence__m3-dump-after-cli-add-back-headcandidate.yml | 47008 | 6c52e02aa48006bf | 阶段 5 独立交叉验证 Agent 的实测证据 m3-dump-after-cli-add-back-headcandidate.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5__evidence__m3-dump-after-cli-remove-headcandidate-withsettingsrow.stderr.txt | 100 | 69151d6f8053d70a | 阶段 5 独立交叉验证 Agent 的实测证据 m3-dump-after-cli-remove-headcandidate-withsettingsrow.stderr.txt。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5__evidence__m3-dump-after-cli-remove-headcandidate-withsettingsrow.yml | 46703 | 679f1714441658fb | 阶段 5 独立交叉验证 Agent 的实测证据 m3-dump-after-cli-remove-headcandidate-withsettingsrow.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5/evidence/m3-dump-after-cli-remove-headcandidate.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m3-dump-after-cli-remove-headcandidate.stderr.txt |
| stage5__evidence__m3-dump-after-cli-remove-headcandidate.yml | 46703 | 679f1714441658fb | 阶段 5 独立交叉验证 Agent 的实测证据 m3-dump-after-cli-remove-headcandidate.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5__evidence__m3-dump-after-cli-remove-prevcandidate.yml | 46703 | 679f1714441658fb | 阶段 5 独立交叉验证 Agent 的实测证据 m3-dump-after-cli-remove-prevcandidate.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5__evidence__m3-plugins-list-after-cli-add-back.txt | 3007 | 8c296d790f7d6099 | 阶段 5 独立交叉验证 Agent 的实测证据 m3-plugins-list-after-cli-add-back.txt |
| stage5__evidence__m3-rows-after-cli-add-back-headcandidate.txt | 3000 | 423bcdb9fd48e9a1 | 阶段 5 独立交叉验证 Agent 的实测证据 m3-rows-after-cli-add-back-headcandidate.txt |
| stage5__evidence__m3-rows-after-cli-remove-headcandidate.txt | 1944 | 427e0556040f83e6 | 阶段 5 独立交叉验证 Agent 的实测证据 m3-rows-after-cli-remove-headcandidate.txt |
| stage5__evidence__m3-rows-after-cli-remove-prevcandidate.txt | 3139 | 614c2d08b90db42e | 阶段 5 独立交叉验证 Agent 的实测证据 m3-rows-after-cli-remove-prevcandidate.txt |
| stage5/evidence/m4-dump-off-after-auto-save.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m4-dump-off-after-auto-save.stderr.txt |
| stage5__evidence__m4-dump-off-after-auto-save.yml | 46703 | 679f1714441658fb | 阶段 5 独立交叉验证 Agent 的实测证据 m4-dump-off-after-auto-save.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5/evidence/m4-dump-off-after-reselect-save.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m4-dump-off-after-reselect-save.stderr.txt |
| stage5__evidence__m4-dump-off-after-reselect-save.yml | 46863 | b50bdb53d6a281df | 阶段 5 独立交叉验证 Agent 的实测证据 m4-dump-off-after-reselect-save.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5/evidence/m4-dump-off-with-pins.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m4-dump-off-with-pins.stderr.txt |
| stage5__evidence__m4-dump-off-with-pins.yml | 46868 | c403763e72027cfb | 阶段 5 独立交叉验证 Agent 的实测证据 m4-dump-off-with-pins.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5__evidence__m4-handedit-locale-en-live-check.txt | 3118 | 0259c7d169031b8d | 阶段 5 独立交叉验证 Agent 的实测证据 m4-handedit-locale-en-live-check.txt |
| stage5__evidence__m4-official-page-after-click-fetch-provider.txt | 2177 | ab4c1881ab58f7b7 | 阶段 5 独立交叉验证 Agent 的实测证据 m4-official-page-after-click-fetch-provider.txt |
| stage5__evidence__m4-official-page-after-click-search-provider.txt | 1644 | 9b117f8b04879f68 | 阶段 5 独立交叉验证 Agent 的实测证据 m4-official-page-after-click-search-provider.txt |
| stage5__evidence__m4-official-page-after-save.txt | 2020 | a4cda72f6dd61298 | 阶段 5 独立交叉验证 Agent 的实测证据 m4-official-page-after-save.txt |
| stage5__evidence__m4-official-page-after-select-search-official.txt | 1925 | cf771bd9f57e9a12 | 阶段 5 独立交叉验证 Agent 的实测证据 m4-official-page-after-select-search-official.txt |
| stage5__evidence__m4-official-page-before-reselect.txt | 1320 | 53a747567ddae213 | 阶段 5 独立交叉验证 Agent 的实测证据 m4-official-page-before-reselect.txt |
| stage5__evidence__m4-official-page-both-reselected-before-save.txt | 2018 | 28d9220c5c0f8726 | 阶段 5 独立交叉验证 Agent 的实测证据 m4-official-page-both-reselected-before-save.txt |
| stage5__evidence__m4-official-page-search-auto-after-save.txt | 1664 | 40b116bbc08240a0 | 阶段 5 独立交叉验证 Agent 的实测证据 m4-official-page-search-auto-after-save.txt |
| stage5__evidence__m4-official-page-search-auto-before-save.txt | 1662 | 4fd7a8526d504689 | 阶段 5 独立交叉验证 Agent 的实测证据 m4-official-page-search-auto-before-save.txt |
| stage5__evidence__m4-plugins-list-after-off-with-pins.txt | 3130 | bedf41c1b77972de | 阶段 5 独立交叉验证 Agent 的实测证据 m4-plugins-list-after-off-with-pins.txt |
| stage5__evidence__m4-plugins-list-after-on-again.txt | 3007 | 8c296d790f7d6099 | 阶段 5 独立交叉验证 Agent 的实测证据 m4-plugins-list-after-on-again.txt |
| stage5__evidence__m4-rows-after-auto-save.txt | 1496 | 73ea470b78b0812b | 阶段 5 独立交叉验证 Agent 的实测证据 m4-rows-after-auto-save.txt |
| stage5__evidence__m4-rows-after-reselect-save.txt | 1737 | 9af0e5e0356d8ef7 | 阶段 5 独立交叉验证 Agent 的实测证据 m4-rows-after-reselect-save.txt |
| stage5__evidence__m4-rows-off-with-pins.txt | 1443 | be716573e1d54fd4 | 阶段 5 独立交叉验证 Agent 的实测证据 m4-rows-off-with-pins.txt |
| stage5__evidence__m4-userlevel-before-save.txt | 757 | 616d019ab9851e26 | 阶段 5 独立交叉验证 Agent 的实测证据 m4-userlevel-before-save.txt |
| stage5__evidence__m4-userlevel-step1-pinned.txt | 968 | 4cfa583bdf4ef745 | 阶段 5 独立交叉验证 Agent 的实测证据 m4-userlevel-step1-pinned.txt |
| stage5__evidence__m5-detail-after-component-back-on.txt | 6325 | 096387269ac3e036 | 阶段 5 独立交叉验证 Agent 的实测证据 m5-detail-after-component-back-on.txt |
| stage5__evidence__m5-detail-after-component-off.txt | 6315 | 626fcfd45cd9ed20 | 阶段 5 独立交叉验证 Agent 的实测证据 m5-detail-after-component-off.txt |
| stage5__evidence__m5-detail-before-component-off.txt | 6325 | 096387269ac3e036 | 阶段 5 独立交叉验证 Agent 的实测证据 m5-detail-before-component-off.txt |
| stage5__evidence__m5-detail-component-off-bundle-on-again.txt | 6315 | 626fcfd45cd9ed20 | 阶段 5 独立交叉验证 Agent 的实测证据 m5-detail-component-off-bundle-on-again.txt |
| stage5/evidence/m5-dump-component-back-on.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m5-dump-component-back-on.stderr.txt |
| stage5__evidence__m5-dump-component-back-on.yml | 47008 | 6c52e02aa48006bf | 阶段 5 独立交叉验证 Agent 的实测证据 m5-dump-component-back-on.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5/evidence/m5-dump-component-off-bundle-on-again.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m5-dump-component-off-bundle-on-again.stderr.txt |
| stage5__evidence__m5-dump-component-off-bundle-on-again.yml | 47091 | d80190e99f1a5e1d | 阶段 5 独立交叉验证 Agent 的实测证据 m5-dump-component-off-bundle-on-again.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5/evidence/m5-dump-component-off.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m5-dump-component-off.stderr.txt |
| stage5__evidence__m5-dump-component-off.yml | 47091 | d80190e99f1a5e1d | 阶段 5 独立交叉验证 Agent 的实测证据 m5-dump-component-off.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5__evidence__m5-plugins-list-component-off-bundle-off.txt | 3130 | bedf41c1b77972de | 阶段 5 独立交叉验证 Agent 的实测证据 m5-plugins-list-component-off-bundle-off.txt |
| stage5__evidence__m5-plugins-list-component-off-bundle-on-again.txt | 3007 | 8c296d790f7d6099 | 阶段 5 独立交叉验证 Agent 的实测证据 m5-plugins-list-component-off-bundle-on-again.txt |
| stage5__evidence__m5-plugins-list-component-off.txt | 3007 | 8c296d790f7d6099 | 阶段 5 独立交叉验证 Agent 的实测证据 m5-plugins-list-component-off.txt |
| stage5__evidence__m5-rows-component-back-on.txt | 1799 | f178a68754f260d5 | 阶段 5 独立交叉验证 Agent 的实测证据 m5-rows-component-back-on.txt |
| stage5__evidence__m5-rows-component-off-bundle-on-again.txt | 1554 | 3c780dae1875d18a | 阶段 5 独立交叉验证 Agent 的实测证据 m5-rows-component-off-bundle-on-again.txt |
| stage5__evidence__m5-rows-component-off.txt | 2802 | 84af750b1dc6266a | 阶段 5 独立交叉验证 Agent 的实测证据 m5-rows-component-off.txt |
| stage5__evidence__m5-settings-builtin-section-component-off.txt | 9592 | c7537760b97ee123 | 阶段 5 独立交叉验证 Agent 的实测证据 m5-settings-builtin-section-component-off.txt |
| stage5__evidence__m5-settings-dialog-component-back-on.txt | 8575 | b9e2c81ab7a6b92c | 阶段 5 独立交叉验证 Agent 的实测证据 m5-settings-dialog-component-back-on.txt |
| stage5__evidence__m5-settings-dialog-component-off.txt | 5195 | 099fe2833232fa37 | 阶段 5 独立交叉验证 Agent 的实测证据 m5-settings-dialog-component-off.txt |
| stage5__evidence__m6-after-cli-swap-back-to-head-bundle-off-then-on.txt | 3007 | 8c296d790f7d6099 | 阶段 5 独立交叉验证 Agent 的实测证据 m6-after-cli-swap-back-to-head-bundle-off-then-on.txt |
| stage5__evidence__m6-after-cli-swap-back-to-head-bundle-off.txt | 3130 | bedf41c1b77972de | 阶段 5 独立交叉验证 Agent 的实测证据 m6-after-cli-swap-back-to-head-bundle-off.txt |
| stage5__evidence__m6-after-cli-swap-back-to-head-list-after-refresh.txt | 3140 | 1208180a663b22d7 | 阶段 5 独立交叉验证 Agent 的实测证据 m6-after-cli-swap-back-to-head-list-after-refresh.txt |
| stage5__evidence__m6-after-cli-swap-back-to-head-list-before-refresh.txt | 3132 | 2a7b597dc7610cd4 | 阶段 5 独立交叉验证 Agent 的实测证据 m6-after-cli-swap-back-to-head-list-before-refresh.txt |
| stage5/evidence/m6-cli-add-back-head.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m6-cli-add-back-head.stderr.txt |
| stage5__evidence__m6-cli-add-back-head.stdout.txt | 552 | 0f220a5ef4d82936 | 阶段 5 独立交叉验证 Agent 的实测证据 m6-cli-add-back-head.stdout.txt |
| stage5/evidence/m6-cli-add-prod.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m6-cli-add-prod.stderr.txt |
| stage5__evidence__m6-cli-add-prod.stdout.txt | 552 | 69a86bd6d1d3fb7a | 阶段 5 独立交叉验证 Agent 的实测证据 m6-cli-add-prod.stdout.txt |
| stage5__evidence__m6-cli-and-dump.txt | 3389 | f7b63b670fb0406b | 阶段 5 独立交叉验证 Agent 的实测证据 m6-cli-and-dump.txt |
| stage5/evidence/m6-cli-remove-head.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m6-cli-remove-head.stderr.txt |
| stage5__evidence__m6-cli-remove-head.stdout.txt | 151 | cee8be64304f3717 | 阶段 5 独立交叉验证 Agent 的实测证据 m6-cli-remove-head.stdout.txt |
| stage5/evidence/m6-cli-remove-prod.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m6-cli-remove-prod.stderr.txt |
| stage5__evidence__m6-cli-remove-prod.stdout.txt | 151 | 33140cdd8820a0e2 | 阶段 5 独立交叉验证 Agent 的实测证据 m6-cli-remove-prod.stdout.txt |
| stage5__evidence__m6-detail-prod-package.txt | 20826 | 91d7511f7d80db40 | 阶段 5 独立交叉验证 Agent 的实测证据 m6-detail-prod-package.txt |
| stage5/evidence/m6-dump-after-cli-swap-back-to-head.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m6-dump-after-cli-swap-back-to-head.stderr.txt |
| stage5__evidence__m6-dump-after-cli-swap-back-to-head.yml | 47008 | 6c52e02aa48006bf | 阶段 5 独立交叉验证 Agent 的实测证据 m6-dump-after-cli-swap-back-to-head.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5/evidence/m6-dump-prod.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m6-dump-prod.stderr.txt |
| stage5__evidence__m6-dump-prod.yml | 46905 | a322ccefc63e4f5e | 阶段 5 独立交叉验证 Agent 的实测证据 m6-dump-prod.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5__evidence__m6-official-page-with-prod-plugin-on.txt | 1368 | bcf13b74277b4cc5 | 阶段 5 独立交叉验证 Agent 的实测证据 m6-official-page-with-prod-plugin-on.txt |
| stage5__evidence__m6-plugins-list-prod-bundle-off-then-on.txt | 3132 | 2a7b597dc7610cd4 | 阶段 5 独立交叉验证 Agent 的实测证据 m6-plugins-list-prod-bundle-off-then-on.txt |
| stage5__evidence__m6-plugins-list-prod-bundle-off.txt | 3122 | 992a0fc1d6c89a75 | 阶段 5 独立交叉验证 Agent 的实测证据 m6-plugins-list-prod-bundle-off.txt |
| stage5__evidence__m6-plugins-list-prod-package-after-pagereload.txt | 3008 | 4ab8372e950fc61b | 阶段 5 独立交叉验证 Agent 的实测证据 m6-plugins-list-prod-package-after-pagereload.txt |
| stage5__evidence__m6-plugins-list-prod-package-second-refresh.txt | 2999 | 709e29b349371ed5 | 阶段 5 独立交叉验证 Agent 的实测证据 m6-plugins-list-prod-package-second-refresh.txt |
| stage5__evidence__m6-plugins-list-prod-package.txt | 2999 | 709e29b349371ed5 | 阶段 5 独立交叉验证 Agent 的实测证据 m6-plugins-list-prod-package.txt |
| stage5__evidence__m6-swap-back-to-head.txt | 2330 | 2587194bc48d55dc | 阶段 5 独立交叉验证 Agent 的实测证据 m6-swap-back-to-head.txt |
| stage5/evidence/m7-dump-escape-hatch-removed.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m7-dump-escape-hatch-removed.stderr.txt |
| stage5__evidence__m7-dump-escape-hatch-removed.yml | 47008 | 6c52e02aa48006bf | 阶段 5 独立交叉验证 Agent 的实测证据 m7-dump-escape-hatch-removed.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5/evidence/m7-dump-escape-hatch.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m7-dump-escape-hatch.stderr.txt |
| stage5__evidence__m7-dump-escape-hatch.yml | 47064 | fc1eadc6d1aefd66 | 阶段 5 独立交叉验证 Agent 的实测证据 m7-dump-escape-hatch.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5__evidence__m7-official-page-escape-hatch-fetch-menu.txt | 1599 | b8c4272ddccd815b | 阶段 5 独立交叉验证 Agent 的实测证据 m7-official-page-escape-hatch-fetch-menu.txt |
| stage5__evidence__m7-official-page-escape-hatch-search-menu.txt | 1817 | 8b23ba3b069db4f6 | 阶段 5 独立交叉验证 Agent 的实测证据 m7-official-page-escape-hatch-search-menu.txt |
| stage5__evidence__m7-official-page-escape-hatch.txt | 1368 | bcf13b74277b4cc5 | 阶段 5 独立交叉验证 Agent 的实测证据 m7-official-page-escape-hatch.txt |
| stage5__evidence__m7-plugins-after-escape-hatch-removed-nointeraction.txt | 3007 | 8c296d790f7d6099 | 阶段 5 独立交叉验证 Agent 的实测证据 m7-plugins-after-escape-hatch-removed-nointeraction.txt |
| stage5__evidence__m7-plugins-list-escape-hatch-on-nointeraction.txt | 3140 | 1208180a663b22d7 | 阶段 5 独立交叉验证 Agent 的实测证据 m7-plugins-list-escape-hatch-on-nointeraction.txt |
| stage5__evidence__m7-plugins-list-escape-hatch-removed.txt | 3007 | 8c296d790f7d6099 | 阶段 5 独立交叉验证 Agent 的实测证据 m7-plugins-list-escape-hatch-removed.txt |
| stage5__evidence__m7-rows-escape-hatch-removed.txt | 1783 | 1acb795bbbea7d56 | 阶段 5 独立交叉验证 Agent 的实测证据 m7-rows-escape-hatch-removed.txt |
| stage5__evidence__m7-rows-escape-hatch.txt | 1773 | 7b19bd1e76c00c1f | 阶段 5 独立交叉验证 Agent 的实测证据 m7-rows-escape-hatch.txt |
| stage5__evidence__m8-cli-readd-probe6.txt | 552 | cf9d9dec052a52f6 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-cli-readd-probe6.txt |
| stage5/evidence/m8-cli-remove-with-pins.dump.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m8-cli-remove-with-pins.dump.stderr.txt |
| stage5__evidence__m8-cli-remove-with-pins.dump.yml | 46868 | c403763e72027cfb | 阶段 5 独立交叉验证 Agent 的实测证据 m8-cli-remove-with-pins.dump.yml |
| stage5/evidence/m8-cli-remove-with-pins.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m8-cli-remove-with-pins.stderr.txt |
| stage5__evidence__m8-cli-remove-with-pins.stdout.txt | 152 | e0e12acb91c43733 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-cli-remove-with-pins.stdout.txt |
| stage5__evidence__m8-cli-remove-with-pins.txt | 2981 | 5b5dd35c46ae91ab | 阶段 5 独立交叉验证 Agent 的实测证据 m8-cli-remove-with-pins.txt |
| stage5__evidence__m8-cli-swap-to-probe.txt | 1456 | 98f1c58b10eadbe2 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-cli-swap-to-probe.txt |
| stage5__evidence__m8-cli-swap-to-probe6.txt | 552 | 6eadb0aa081d5169 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-cli-swap-to-probe6.txt |
| stage5__evidence__m8-faces-served-timing-samples.json | 876 | 5179f3106d1415b3 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-faces-served-timing-samples.json |
| stage5__evidence__m8-localStorage-probe-readings-preexisting.txt | 876 | fcc093d2f4087015 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-localStorage-probe-readings-preexisting.txt |
| stage5__evidence__m8-probe5.diff.txt | 2584 | 2bf5fbac935f8bd8 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-probe5.diff.txt |
| stage5__evidence__m8-probe6-run1.json | 3653 | 7317edf5b7f92ce3 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-probe6-run1.json |
| stage5__evidence__m8-probe6-run2.json | 7236 | ee336b4ff8e584fd | 阶段 5 独立交叉验证 Agent 的实测证据 m8-probe6-run2.json |
| stage5__evidence__m8-probe6-run3-a.json | 2928 | 1a7d53fe53a795b8 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-probe6-run3-a.json |
| stage5__evidence__m8-probe6-run3-b.json | 4847 | cf1755ee327e7fa1 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-probe6-run3-b.json |
| stage5__evidence__m8-probe6-run3-off-list.txt | 3130 | bedf41c1b77972de | 阶段 5 独立交叉验证 Agent 的实测证据 m8-probe6-run3-off-list.txt |
| stage5__evidence__m8-probe6-run4-a.json | 549 | 06b8b1b86dfcaed7 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-probe6-run4-a.json |
| stage5__evidence__m8-probe6-run5-off.json | 591 | 42d6dbb65b8f5323 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-probe6-run5-off.json |
| stage5__evidence__m8-probe6-run5-on.json | 578 | 344a069f7bd4b083 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-probe6-run5-on.json |
| stage5__evidence__m8-probe6-run6-off-list.txt | 3130 | bedf41c1b77972de | 阶段 5 独立交叉验证 Agent 的实测证据 m8-probe6-run6-off-list.txt |
| stage5__evidence__m8-probe6-run6-off.json | 619 | 347723cdaecbcc68 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-probe6-run6-off.json |
| stage5__evidence__m8-probe6-run6-on.json | 2647 | f8d055ac6f996118 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-probe6-run6-on.json |
| stage5__evidence__m8-probe6-run7.json | 1334 | ddbecd4c6a1b9064 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-probe6-run7.json |
| stage5__evidence__m8-probe6-run8.json | 1239 | f28376245229c482 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-probe6-run8.json |
| stage5__evidence__m8-probe6-run9-a.json | 2181 | 23bf90b7941c198b | 阶段 5 独立交叉验证 Agent 的实测证据 m8-probe6-run9-a.json |
| stage5__evidence__m8-probe6-run9-off.json | 1448 | 56f2751b0ace25e4 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-probe6-run9-off.json |
| stage5__evidence__m8-probe6.diff.txt | 3817 | a0a983f2e2d4f4d3 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-probe6.diff.txt |
| stage5/evidence/m8-run3-dump-after-handover.stderr.txt | — | 0（空文件，未归档） | 阶段 5 独立交叉验证 Agent 的实测证据 m8-run3-dump-after-handover.stderr.txt |
| stage5__evidence__m8-run3-dump-after-handover.yml | 47008 | 6c52e02aa48006bf | 阶段 5 独立交叉验证 Agent 的实测证据 m8-run3-dump-after-handover.yml。未归档，只登记字节数与哈希（完整 dump 约 46 KB 一份，结论以同目录的 *-rows-*.txt 摘录与报告为准；原文件随 scratch 目录消失） |
| stage5__evidence__m8-run3-userlayer-after-handover.txt | 1719 | 758254c87f225f0d | 阶段 5 独立交叉验证 Agent 的实测证据 m8-run3-userlayer-after-handover.txt |
| stage5__evidence__m8-SUMMARY.md | 7680 | f692fdb45ee76d98 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-SUMMARY.md |
| stage5__evidence__m8-toggle-off-on-readings.json | 1521 | 9b61c7b47f025fba | 阶段 5 独立交叉验证 Agent 的实测证据 m8-toggle-off-on-readings.json |
| stage5__evidence__m8-tools__probe5-patch.mjs | 2703 | ea2043cbecea2781 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-tools__probe5-patch.mjs |
| stage5__evidence__m8-tools__probe6-patch.mjs | 4255 | 271db56ee7f10da6 | 阶段 5 独立交叉验证 Agent 的实测证据 m8-tools__probe6-patch.mjs |

归档时对全部归档文本做了模式扫描（令牌值、密钥形态、Bearer 值、JWT、凭据赋值），命中数为 0。
