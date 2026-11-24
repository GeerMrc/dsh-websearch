# S41 rc.5 实测证据（脱敏归档）

来源是仓库外的 scratch 目录 `/tmp/dshws-s41/`（实例停止后即不存在）。文件名里的 `__` 对应原路径的分隔符。
`token=` 后的宿主进程令牌值已替换为 `<redacted>`，其余内容逐字节照搬。「原文件 sha256 前 16 位」取自遮蔽前的原文件。
空文件不归档，只在这里登记。T5p 矩阵里标「无原始文件」的格子，这里补不出来：浏览器侧读数与 47 毫秒时序当时只留在会话的工具输出里。

| 归档文件 | 原文件字节数 | 原文件 sha256 前 16 位 | 内容 |
|---|---|---|---|
| evidence__README.md | 2792 | a808c0dab501c6d7 | 证据索引（执行期原版） |
| evidence__t5p-probe-matrix.md | 3070 | df6a40247144c215 | T5p 探针矩阵：形态 × 向量 × 通道结论 |
| evidence__v1-dump-config.yml | 46678 | 998bf81c2d74b041 | V1：插件启用时的 --dump-config 全量 |
| evidence/v1-dump-config.stderr | — | 0（空文件，未归档） | V1：dump 的 stderr |
| evidence__v2-plugins-list-on.txt | 533 | af94143f0f81f192 | V2：插件启用时插件页「内置插件配置 / 已安装插件」的无障碍树 |
| evidence__v2-detail-components-on.txt | 346 | 52576b59a09a2b46 | V2：rc.5 详情页「包含的组件」的无障碍树（不渲染覆盖列表） |
| evidence__v3-add.log | 549 | bf23c6f7b97a3a57 | V3：装入修正后候选包的输出 |
| evidence__v3-detail-zh.txt | 1173 | 2c616686b176d1f7 | V3：详情页中文渲染 |
| evidence__v3-detail-en.txt | 1048 | a4871c091bfa9cc0 | V3：详情页英文渲染 |
| evidence__v5-dump-config-off.yml | 46548 | b2b2e0864378d09a | V5：关闭插件后的 --dump-config（web 行回到基础层） |
| evidence/v5-dump-config-off.stderr | — | 0（空文件，未归档） | V5：dump 的 stderr |
| evidence__v5-plugins-list-off.txt | 656 | 3c58052d66736ecc | V5：关闭后插件页列表，官方卡回来 |
| evidence__v5-log-lines-before.txt | 20 | 5565237a7a8c615b | V5 之前的宿主日志行数 |
| evidence__v6-dump-config-on.yml | 46853 | 80f4bcde55046c69 | V6：重新启用后的 --dump-config |
| evidence/v6-dump-config-on.stderr | — | 0（空文件，未归档） | V6：dump 的 stderr |
| evidence__v7-dump-seeded.yml | 46962 | e9947dfb2d8e30c2 | V7：预置用户层钉值后的 --dump-config |
| evidence/v7-dump-seeded.stderr | — | 0（空文件，未归档） | V7：预置后 dump 的 stderr |
| evidence__v7-dump-off-before-fix.yml | 46713 | a5d4cfa78bbc46f7 | V7：关闭插件后（T8 修正前），钉值残留 |
| evidence/v7-dump-off-before-fix.stderr | — | 0（空文件，未归档） | V7：修正前 dump 的 stderr |
| evidence__v7-dump-off-after-fix.yml | 46713 | a5d4cfa78bbc46f7 | V7：关闭插件后（T8 修正后），钉值仍残留 |
| evidence/v7-dump-off-after-fix.stderr | — | 0（空文件，未归档） | V7：修正后 dump 的 stderr |
| evidence__v7-official-page-before-fix.txt | 523 | 318434d039d20bab | V7：关闭后官方卡显示「未加载」 |
| evidence__t8-install2.log | 550 | 4e6a01e79c6b67c8 | T8 修正：重新装入的输出 |
| evidence__t8-dump-reinstalled.yml | 46962 | e9947dfb2d8e30c2 | T8 修正：重新装入后的 --dump-config |
| evidence/t8-dump-reinstalled.stderr | — | 0（空文件，未归档） | T8 修正：dump 的 stderr |
| evidence__formN-init.log | 75 | c514cbf1cd7c6514 | 形态 N（人为禁用 hmr）：初始化输出 |
| evidence__formN-add.log | 489 | 51a1415ce90b376b | 形态 N：装入输出 |
| evidence__formN-dump.yml | 46773 | 70a345fa91035951 | 形态 N：--dump-config |
| evidence/formN-dump.stderr | — | 0（空文件，未归档） | 形态 N：dump 的 stderr |
| evidence__probe-add.log | 552 | 2dc761d0ed6b5568 | T5p 探针第 1 轮：装入输出 |
| evidence__probe-remove.log | 151 | 05f7ea1d2718d540 | T5p 探针第 1 轮：移除输出 |
| evidence__probe-log-lines-before.txt | 30 | 59cc24778638ba01 | T5p 第 1 轮之前的宿主日志行数 |
| evidence__probe2-add.log | 552 | 124e55d5fc96ecc8 | T5p 探针第 2 轮：装入输出 |
| evidence__probe2-remove.log | 151 | 6a3b08027050ffa5 | T5p 探针第 2 轮：移除输出 |
| evidence__probe2-log-lines-before.txt | 30 | be733da3c750fd77 | T5p 第 2 轮之前的宿主日志行数 |
| evidence__probe3-add.log | 552 | 9aaa88dccc694792 | T5p 探针第 3 轮：装入输出 |
| evidence__probe3-remove.log | 152 | 4027b923046bf64a | T5p 探针第 3 轮：移除输出 |
| evidence__probe3-log-lines-before.txt | 30 | 499c704226eac6f4 | T5p 第 3 轮之前的宿主日志行数 |
| evidence__probe4-add.log | 552 | c90f0236da330e7c | T5p 探针第 4 轮：装入输出 |
| evidence__probe4-remove.log | 151 | 142b4078ac9343b7 | T5p 探针第 4 轮：移除输出 |
| evidence__probe4-log-lines-before.txt | 30 | 71858399ddd0577a | T5p 第 4 轮之前的宿主日志行数 |
| evidence__t5p-cli-remove.log | 152 | 3ed3705e7d8fe55a | T5p：命令行移除（第 1 次） |
| evidence__t5p-cli-add.log | 309 | 7684ee13d08239d9 | T5p：命令行装入 |
| evidence__t5p-cli-remove2.log | 151 | 936c8f4891674010 | T5p：命令行移除（第 2 次） |
| evidence__t5p-cli-add2.log | 550 | e7c031e714172925 | T5p：命令行装入（第 2 次） |
| evidence__t5p-cli-remove3.log | 151 | 7e2ce5e6e412ddff | T5p：命令行移除（第 3 次） |
| evidence__fresh-clone-rehearsal.log | 2148 | eb7ec6f630c2b0e0 | T11：本地预演（首次为全新克隆；日志是同一克隆目录推进到 3eebf97 后的重跑） |
| evidence__t13-doc-tests.log | 472 | 433e4f6ce78e2a1b | T13：读取文档与工作流的 5 个测试文件 |
| evidence__f1-red.log | 3628 | 70400d051ea0dd6d | F1：两个客户端入口测试修复前（红） |
| evidence__f1-green.log | 332 | 28c3c50fe29e760a | F1：两个客户端入口测试修复后（绿） |
| evidence__f1-full.log | 8679 | 455cdacdb046bffb | F1：修复后的全量测试（703 通过 / 17 跳过） |
| evidence__f24-red.log | 2670 | 554dfc65f03745cd | F24：发布门经符号链接路径调用的用例，修复前（红：退出码 0、未检查） |
| evidence__f24-green.log | 271 | a809f1bb2668fe69 | F24：同上，修复后（绿） |
| evidence__f24b-red.log | 1503 | 4322513739cc38bb | F24：pack.mjs 经符号链接路径调用的用例，修复前（红：什么都没打包） |
| evidence__f24b-green.log | 367 | b6d480bbc117716b | F24：同上，修复后（绿） |
| rc5-web.log | 1208 | a6d28ce7e5f7e737 | scratch rc.5 实例的标准输出：启动地址与探针的宿主侧日志（遮蔽 1 处令牌值） |
| rc5-web-nohmr.log | 393 | 321b1a1f08e24b36 | 形态 N scratch 实例的标准输出（遮蔽 1 处令牌值） |
| tools__probe-patch.mjs | 3698 | 5c1cf8014326d501 | 探针源码（第 1 轮）：往构建产物里打补丁的脚本 |
| tools__probe2-blocks.txt | 1425 | a9e8738cc63f5817 | 探针源码（第 2 轮）：补丁块 |
| tools__probe3-blocks.txt | 1461 | c3283ef39aaec4b7 | 探针源码（第 3 轮）：补丁块 |
| tools__probe4.mjs | 3377 | 1a0d8e3ecf1064a5 | 探针源码（第 4 轮） |
| tools__pack-candidate.mjs | 939 | 6d02b21a38ac6e70 | 候选包与探针包的打包脚本 |

归档时对全部归档文本做了模式扫描（令牌值、密钥形态、Bearer 值、JWT、凭据赋值），命中数为 0。
