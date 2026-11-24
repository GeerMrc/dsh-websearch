# S41 T20 控件尺度统一实测证据（脱敏归档）

来源是仓库外的 /tmp/dshws-s41/t20/。rc5-web.log 的令牌值已遮蔽；dump 为 --dump-config 全量；两张截图的前后对照见文件名。

| 归档文件 | 原文件字节数 | 原文件 sha256 前 16 位 | 内容 |
|---|---|---|---|
| after-unified-scale-screenshot.png | 101416 | — | 截图（before 为用户报告原图，after 为统一后实测） |
| archive.log | 61 | — | T20 实测工件 |
| before-user-reported.png | 203010 | — | 截图（before 为用户报告原图，after 为统一后实测） |
| dump.yml | 47008 | — | T20 实测工件 |
| install.log | 704 | — | T20 实测工件 |
| rc5-web.log | 82 | — | T20 实测工件（遮蔽 1 处令牌值） |
| record-entry.md | 1567 | — | T20 实测工件 |

归档时对全部归档文本做了模式扫描（令牌值、密钥形态、Bearer 值、JWT、凭据赋值），命中数为 0。
