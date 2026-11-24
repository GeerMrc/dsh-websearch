# S41 T19 交还提示卡实测证据（脱敏归档）

来源是仓库外的 /tmp/dshws-s41/t19/。dump 为 --dump-config 全量输出；websearch-section-with-pin.txt 是设置页无障碍树的三段对照
（带钉值 → 点击清除后 → 第二轮循环）；seam-pin-notice-screenshot.png 是带提示卡的设置页截图。报告与逐项结论见 session-41 记录的 T19 条目。

| 归档文件 | 原文件字节数 | 原文件 sha256 前 16 位 | 内容 |
|---|---|---|---|
| archive.log | 133 | 982ab62b65dff9d5 | T19 实测工件（原文件含归档脚本事后补写的完成行；归档副本是补写前的 61 字节） |
| dump-after-clear.stderr | 0 | e3b0c44298fc1c14 | T19 实测工件 |
| dump-after-clear.yml | 47008 | 6c52e02aa48006bf | T19 实测工件 |
| dump-final.stderr | 0 | e3b0c44298fc1c14 | T19 实测工件 |
| dump-final.yml | 47008 | 6c52e02aa48006bf | T19 实测工件 |
| dump-fresh.stderr | 0 | e3b0c44298fc1c14 | T19 实测工件 |
| dump-fresh.yml | 47008 | 6c52e02aa48006bf | T19 实测工件 |
| dump-pinned.stderr | 0 | e3b0c44298fc1c14 | T19 实测工件 |
| dump-pinned.yml | 47117 | efd472ec82ee5927 | T19 实测工件 |
| install.log | 703 | 7f4718a792320348 | T19 实测工件 |
| rc5-web.log | 82 | 07037ccaf167c1ef | T19 实测工件（遮蔽 1 处令牌值） |
| record-entry.md | 1639 | 5e2d9526054d7d66 | T19 实测工件 |
| seam-pin-notice-screenshot.png | 142535 | 98a254271a62d02f | 提示卡的视觉证据（截图，无文本可扫） |
| settings-dialog-open.txt | 4019 | d37b54539c59afcb | T19 实测工件 |
| websearch-section-with-pin.txt | 15733 | 25692c20b8aa3a68 | T19 实测工件 |

归档时对全部归档文本做了模式扫描（令牌值、密钥形态、Bearer 值、JWT、凭据赋值），命中数为 0。
