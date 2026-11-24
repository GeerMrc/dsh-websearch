# S41 V8/V10 补测证据（脱敏归档）

来源是仓库外的 /tmp/dshws-s41/v8v10-evidence/。README.md 为结论正本；dump 为 --dump-config 全量输出。

| 归档文件 | 原文件字节数 | 原文件 sha256 前 16 位 | 内容 |
|---|---|---|---|
| README.md | 963 | 3393172e5cdc1337 | V8/V10 工件 |
| final-restored.yml | 47144 | f6886f534ac2f8fe | V8/V10 工件 |
| v10-after-off.yml | 46868 | c403763e72027cfb | V8/V10 工件 |
| v8-after-off.yml | 46863 | b50bdb53d6a281df | V8/V10 工件 |
| v8v10-baseline.yml | 47144 | f6886f534ac2f8fe | V8/V10 工件 |
| v8v10-browser.txt | 157 | 541347cd23d23b90 | V8/V10 工件 |

归档时对全部归档文本做了模式扫描（令牌值、密钥形态、Bearer 值、JWT、凭据赋值），命中数为 0。
