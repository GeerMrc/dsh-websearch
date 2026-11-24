# S41 T19 交还提示卡实测证据（脱敏归档）

来源是仓库外的 /tmp/dshws-s41/t19/。dump 为 --dump-config 全量输出；websearch-section-with-pin.txt 是设置页无障碍树的三段对照
（带钉值 → 点击清除后 → 第二轮循环）；seam-pin-notice-screenshot.png 是带提示卡的设置页截图。报告与逐项结论见 session-41 记录的 T19 条目。

| 归档文件 | 原文件字节数 | 原文件 sha256 前 16 位 | 内容 |
|---|---|---|---|
| archive.log | 61 | — | T19 实测工件 |
| dump-after-clear.stderr | 0 | — | T19 实测工件 |
| dump-after-clear.yml | 47008 | — | T19 实测工件 |
| dump-final.stderr | 0 | — | T19 实测工件 |
| dump-final.yml | 47008 | — | T19 实测工件 |
| dump-fresh.stderr | 0 | — | T19 实测工件 |
| dump-fresh.yml | 47008 | — | T19 实测工件 |
| dump-pinned.stderr | 0 | — | T19 实测工件 |
| dump-pinned.yml | 47117 | — | T19 实测工件 |
| install.log | 703 | — | T19 实测工件 |
| rc5-web.log | 82 | — | T19 实测工件（遮蔽 1 处令牌值） |
| record-entry.md | 1639 | — | T19 实测工件 |
| seam-pin-notice-screenshot.png | 142535 | — | 提示卡的视觉证据（截图，无文本可扫） |
| settings-dialog-open.txt | 4019 | — | T19 实测工件 |
| websearch-section-with-pin.txt | 15733 | — | T19 实测工件 |

归档时对全部归档文本做了模式扫描（令牌值、密钥形态、Bearer 值、JWT、凭据赋值），命中数为 0。
