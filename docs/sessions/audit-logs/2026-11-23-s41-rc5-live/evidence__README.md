# S41 rc.5 live evidence (scratch instance, redacted)

Runtime: the desktop app's bundled CLI (`…/Resources/runtime/cli/bin/dsh`, reports 0.2.2-rc.5) with `DSH_HOME=/tmp/dshws-s41/home-rc5`, profile `web`, port 3434, form H (hmr enabled).
Candidate: bare-name tarball packed from the S41 branch into /tmp/dshws-s41/candidate (production dist-artifacts untouched).
Browser: ZCode in-app browser, DOM (accessibility) snapshots. Host log and dump-config stderr were checked for errors after every step.

| Item | State | Result | Evidence |
|---|---|---|---|
| V1 | plugin ON | PASS | v1-dump-config.yml: web = dshws-chain / dshws-fetch-gate; ui-settings-web-search disabled; web-search-deepseek disabled; web-fetch-http and web-deepseek-api enabled; dump stderr 0 lines |
| V2 | plugin ON | PASS (list) / NOT RENDERED (overrides) | Built-in list = 子智能体, Agent 循环, 终端 (网页搜索与获取 absent). rc.5 detail page shows only the bundle's own row under 包含的组件; no overrides list is rendered |
| V3 baseline | plugin ON | problem reproduced | Detail page renders the developer README (语言权威声明, 成员准入标准, 快速开始 …); title/description fall back to package.json |
| V4 | plugin ON | PASS | Settings → 网页搜索 section renders: 4 member cards (未配置), 接管 web_fetch switch, DNS card "DoH 生效中" with reserved-range evidence line; footer 当前版本：0.2.2-rc.5 |
| Settings → 内置插件 | plugin ON | PASS | read-only inventory; no 网页搜索与获取 card; standard preset has tool-web enabled |
| V5 | toggle OFF via Plugins page | PASS | official card back in position 2 with its description; bundles without dsh-websearch; web config back to { fetchProvider: http }; both official rows enabled; host log unchanged |
| V6 | toggle ON again | PASS | official card hidden again; dump identical to V1 except the unrelated welcomeNoticeVersion user entry; user-layer patch unchanged |
| V7 baseline (before fix) | seeded user-layer web pin (dshws-tavily / dshws-fetch-gate), toggle OFF via Plugins page | BUG REPRODUCED | user-layer web entry survives; composed web row still dshws-tavily / dshws-fetch-gate with no dsh-websearch row; official page shows "dshws-tavily（未加载）" and "dshws-fetch-gate（未加载）", 保存 disabled; v7-dump-off-before-fix.yml |
| V3 (zh-CN) | T9 candidate | PASS | Title + description from locale/zh.json; detail region renders docs/plugin-page.zh.md; v3-detail-zh.txt |
| V3 (en) | T9 candidate, UI language English | PASS | Title + description from locale/en.json; detail region renders docs/plugin-page.en.md; v3-detail-en.txt |
| T5p | probe build | SEE t5p-probe-matrix.md | No plugin-side channel after the bundle is switched off on HMR hosts; desktop has HMR enabled |
