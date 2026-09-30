# S40 桌面端采用批 — 证据工件索引

> 执行日期 2026-09-30；正本叙述与验收结论见 [../../desktop-adoption.md §9](../../desktop-adoption.md) 与 [../../sessions/2026-09-30-session-40.md](../../sessions/2026-09-30-session-40.md)。官方 dmg 二进制不入库（sha512 `6b88f10d…37`，字节数 369,764,183，源 `download.deepseek.com/desktop/dsh-latest-macos-arm64.dmg`）。

| 工件 | 内容与判读 |
|---|---|
| `official-app.log` | 官方 app 以输出捕获模式直启的日志：更新通道实锤（`Checking for update` → `0.2.0-rc.2 is not available (latest: 0.2.0-rc.2, downgrade is disallowed)`）+ host `dsh web: http://127.0.0.1:19387/?token=…`（token 供浏览器验证，已失效无妨） |
| `web-3423.log` | T4 基线实例启动日志（守卫树 + 插件 v0.2.0，scratch home） |
| `runtime-assets.json` | T3 关 5：mac-arm64 运行时载荷 15 项资产清单（node/python/wheels 的 url+sha256），配合预热脚本使用（SOP §6） |
| `dev-carrier.mjs` | T5b：dev 形态 carrier 载体脚本（显式目录复刻 `runDesktopCli`，绕 cli.js 自定位缺陷）——SOP §4(c) 引用件 |
| `build-full.log` | T3 关 1 现场：陈旧 `lib/` 产物致 tsdown RESOLVE_ERROR（`api-trust`/`claim-support` 子路径不在 exports） |
| `build-clean.log` | T3 关 1 清偿：`pnpm run clean` 后全量构建成功（exit=0，含 client artifacts 记录行） |
| `dev-desktop.log` ~ `dev-desktop11.log` | T3 五关全过程时序：`dev-desktop*.log` 2-3=悬空链接期（acp-demo/landlock ENOENT）、4-5=Electron 下载与主 checkout 层级误用、6-7=landlock/dsh-examples 残渣清扫期、8=`fetch failed`（undici 挂死）、9=错误缓存目录期（空转）、10-11=成功态（运行时冒烟全过 + `dsh web: …19387` + inspectors 9229/9222/9230） |
