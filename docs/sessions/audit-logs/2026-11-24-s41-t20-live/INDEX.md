# S41 T20 控件尺度统一实测证据（脱敏归档）

来源是仓库外的 /tmp/dshws-s41/t20/。rc5-web.log 的令牌值已遮蔽；dump 为 --dump-config 全量；两张截图的前后对照见文件名。

| 归档文件 | 原文件字节数 | 原文件 sha256 前 16 位 | 内容 |
|---|---|---|---|
| after-unified-scale-screenshot.png | 101416 | 12e5630570ee2902 | 截图（before 为用户报告原图，after 为统一后实测） |
| archive.log | 132 | b4698d4b03e17bf6 | T20 实测工件（原文件含归档脚本事后补写的完成行；归档副本是补写前的 61 字节） |
| before-user-reported.png | 203010 | 9ea39f83b3a1eae9 | 截图（before 为用户报告原图，after 为统一后实测） |
| dump.yml | 47008 | 6c52e02aa48006bf | T20 实测工件 |
| install.log | 704 | 5deb000da003106b | T20 实测工件 |
| rc5-web.log | 82 | 20b6dfe4e4c6a02b | T20 实测工件（遮蔽 1 处令牌值） |
| record-entry.md | 1567 | 7949ebd336fc10f6 | T20 实测工件 |

归档时对全部归档文本做了模式扫描（令牌值、密钥形态、Bearer 值、JWT、凭据赋值），命中数为 0。
