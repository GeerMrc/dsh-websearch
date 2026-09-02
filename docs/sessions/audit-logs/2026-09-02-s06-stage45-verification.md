# Session 06 阶段 4/5 独立验证输出（正本逐字）

> **落盘说明**：本文件为 Session 06 阶段 4/5 独立验证 Agent 报告原文逐字（主 Agent 转录落盘）。
> 报告中 🟡 条件（提交态补丁）已由主 Agent 以 `899e2fd` 清偿并复跑门墙亲证（见 session-06 记录）。

---

# 独立审核报告 — 骨架库 v2 / 阶段 4+5 / Session 06

**审核对象**：/Volumes/IPFSJK/Zcode/dsh-websearch @ `feat/s06-settings-gui`，HEAD `de53d72`（亲见 `de53d727b4f`），基点 `9b59d7e`；T0 `3e4eb50` 亲见在 master。
**输入指针**：plan 006 / progress-M4 / Agent Note / T8 message / /tmp/dshws-s06/ 全部亲读亲见。
**偏离说明**：①工作区存在一处**未提交修改** `tests/client/section.spec.tsx`（stub `t` 补 `TranslateNS<'dsh-websearch'>` 签名）——门墙跑的是该脏树，已做提交态对照实验（见下）；②为验证提交态自洽，用 `git archive de53d72` 导出到 /tmp 跑 tsc（两仓零修改，实验副本已清理）；③审核简报中「dump-wired.yml:352-353 = dshws-chain/chain-fetch 接线终态」与实物不符，见 R4。

## 门墙实测数字表（串行亲跑，node v22.23.2 / pnpm 11.7.0）

| 命令原文 | 实测 | 声称 | 对峙 |
|---|---|---|---|
| `pnpm test` | Test Files **22 passed (22)**，Tests **184 passed \| 6 skipped (190)** | 22 files / 184\|6(190) | 逐位一致 |
| `pnpm typecheck`（tsc 双跑） | **exit 0**（node + client 双面） | 双面 exit 0 | 一致（*脏树上*） |
| `pnpm lint`（oxlint src tests） | **0 warnings and 0 errors**，**38 files**，**96 rules** | 0w0e 38f 96r | 逐位一致 |
| `pnpm build` | lib/index.js **49.00 kB**(gzip 12.34) + index.d.ts **21.89 kB**(4.83) + **lib/client.js 16.52 kB**(4.92) | 同 | 逐位一致；tsdown 弃用警告 ×2 现场亲见（与债务台账一致） |
| `npm pack --dry-run` | **total files: 5**（cordis.patch.yml 60B + package.json 2.7kB + lib 三件） | 五件 | 一致 |

耗时（1.34s vs ~1.05s）非契约数字，不计漂移。**门墙数字与声称零漂移，但对应的是工作区脏树**——提交态 `de53d72` 的 client 面 typecheck 实测 **exit 2**（8 处 TS2322：`(key: DshWsLocaleKey) => string` 不可赋给 `TranslateNS<"dsh-websearch">`，缺 `"ok"` 等 common 键）；把工作区脏版 spec 放入 archive 副本后 exit 0，证明该未提交修复是使门墙绿的全部必要补丁。

## R1-R5 逐条对峙

**R1 构建契约可重放 — PASS**。`lib/client.js` 在位（16,516 B）；banner `head -c 400` 亲见 `window.__ModuleLoader__.load({ id: "dsh-websearch", factory: (require) =>`（ModuleLoader 形 + id）；产物 grep：外部 require 恰三枚 `react` / `react/jsx-runtime` / `@deepseek-ai/dsh-client-ui-primitives`，`useState` 命中 2 处均为 `(0, react.useState)` 外部调用形态（lib/client.js:331-332），零实现内联；`exports["./client"]={"default":"./lib/client.js"}` 与宿主 `clientExportOf`（modules/src/index.ts:225-237，接受 `{default}` 形态）一致，`dsh.client` 三键与宿主 `parseDshClient`（:200-223，platform 必须 string :207-208 + inject/external optionalStringArray :210-211）及 `platform !== 'web'` 判定（:756）一致，wire 侧 manifest.ts:196-206 同名亲证；pack 五件清单亲见。

**R2 设置节注入可重放 — PASS**。jsdom：entry.spec.tsx 6 行为（inject 五面 :71、locale NS 注册 ：77、slot 契约 name/id/locale/label+component :84-95、双 disposer、活渲染 5 卡、save 达 `credentials.set`）；浏览器面：T8 message 断言①②原文 + 实物亲验（combo.js 5,126,016 字节含 `id: "dsh-websearch"` 工厂注册，与 message 逐位一致；page.html 含 dsh-websearch）。缺口（🟢，见下）：`order: 16` 实现存在（src/client/index.ts:44）但 spec 未断言。

**R3 provider 卡交互可重放 — PASS**。jsdom：controller.spec.ts 恰 10 行为（缺省镜像/describe 优先/凭据映射/set→refresh/set 失败不翻/clear/setEnabled patch 形状 `{tavily:{enabled:false}}, expectedRevision 0`/conflict 不翻/事件重 describe/dispose）+ section.spec.tsx 8 行为 + entry.spec 6 行为；浏览器面：T8 断言④⑤原文 + **服务端终态亲见**：`/tmp/dshws-s06/home/settings.yaml` = `dsh-websearch: deepseek: enabled: true`（⑥复原后），`.credentials.yaml` = `refs: {}`（fake 已清，仅剩 scratch 自生成的 browser-session grant，非测试写入值）。

**R4 链只读展示 — PASS**。jsdom：section.spec 第 8 行为（双 `<ol>` 逐项 = BUILT_IN 序 + `30000` 超时）+ controller.spec 行为 1-2（链值来自 describe value、缺省回退）；浏览器面：T8 断言③（双链有序列表 + 30000 ms）；实现：section.tsx:97-113 渲染 `snapshot.searchChain/fetchChain`。**简报表述偏差**：`dump-wired.yml:352-353` 实测为 `web` 插件 `searchProvider: deepseek-official` / `fetchProvider: http`；`dshws-chain/chain-fetch` 是**代码注册的 meta provider id**（src/chain/core.ts:214/:241），两 dump 均无此字符串（grep 零命中）；dump-wired 相对 dump-baseline 的全部差异 = 命令行头 + patch insert 的 dsh-websearch 一行（diff 亲见，与 cordis.patch.yml `- insert: id: dsh-websearch` 一致；dump-baseline 与 s05b 的 md5 相同 `0dec5df5…`，基线同源）。不构成 R4 失败——plan R4 条目本身不要求 dump 出现链行——但「352-353 = dshws-chain 接线终态」的说法与实物不符，属简报侧措辞偏差。

**R5 五子证据**：
- ①隔离 — **PASS**：git log 全 message 扫描（DSH_HOME/3412/3080/~/.dsh/s05b 模式）全部为声明性提及，零写操作命令；boot.log 亲见 `--port 3412` + `DSH_HOME` scratch；`lsof :3412` 无监听（kill 复原）；`/tmp/dshws-s05b/` 存活且其 home 全部 mtime 17:28（早于本棒 19:42 启动）；真实 `~/.dsh/settings.yaml` mtime Sep 2 18:23、`.credentials.yaml` Aug 31 23:46——均早于本棒，零接触成立。
- ②门墙 — **脏树 PASS / 提交态 FAIL**（🟡 发现，见下）：四命令数字零漂移；漂移哨兵 163→190（+27）与基线吻合，tests/client/ 单跑 27 passed 闭环。
- ③收尾 6 件套 — 阶段 4 时点核对：Agent Note（docs/notes/2026-09-02-s06-settings-gui.md）、progress-M4 台账、STATUS 🚧 行（docs/STATUS.md:40/:44-49）、stage0/stage2 audit-log 均已落盘；T10 件套（✅ 翻转/验收表回填/roadmap ✅/接力/--no-ff）未做**属预期**。
- ④翻转未做属预期（roadmap S06 行仍 ⏳，docs/session-roadmap.md:42 亲见）。
- ⑤parity + audit-log — **PASS**：locales.ts 15 键 union + `declare module '@deepseek-ai/dsh-client-ui-slots'`（:34-35）编译期 parity + locales.spec.ts:15 运行时镜像；stage45 audit-log 未落盘 = 本报告即正本素材（预期）。

## 阶段 5：交叉验证

1. **冒烟亲跑**：`pnpm vitest run tests/client/` → **4 files passed / 27 tests passed**（controller 10 + section 8 + entry 6 + locales 3）。
2. **安全/契约追问**：
   - **remote.session 裁剪（D1）真安全**：inject 的宿主语义是装载顺序边（manifest.ts JSDoc 亲读：「inject names package rows whose factories must arrive before this row materializes」），缺声明不削减能力；fail-loud 点在运行时 require 未落地模块（system.ts:209）。本包 src/client + tests/client `remote.session` 零引用（grep 亲证）；T8 combo 加载成功 + 六断言全过 = 运行时未触发缺声明失败。裁定：裁剪成立，无运行时风险。
   - **fake key 残留**：无。`.credentials.yaml` = `refs: {}` 亲见，无 `sk-fake` 值；文件内唯一 secret 为 scratch 实例自生成的 browser-session grant（应用自身行为，非本棒写入，不出 scratch）。真实 `~/.dsh` mtime 证据链零接触（见 R5①）。
   - **peerDependencies / type face（D6）**：亲见 peerDeps = cordis + dsh-credentials/dsh-settings/dsh-web 四项，**无 client 包** ✓；`exports["."]` 三键未变（types/import/default）→ npm type face 仍指 node half ✓；宿主 `clientExportOf` 对 `./client` 只取 `{default}`，无 types 键合法 ✓。
   - **高危预告 1-6 对勘**：①实际新增 **13 项** devDeps（D6 预告 12）——第 13 项 `dsh-client-ui-renderer` 已在 T6 message + 台账随批披露（🟢 已留痕范围微扩）；另 react 锚实际 `^18.3.1` vs D6 声明 `^18.2.0`（🟢，见下）。②③④⑤全部按配方执行且有实物；⑥「明确不做」清单零违反（无 remote、push 物理不可能、真实凭据/3080/s05b 零接触证据链齐）。**T8 `--no-open` 披露评估：诚实且可采信**——boot.log 原文 `opening the default browser; pass --no-open to disable` 与披露吻合；打开的是 scratch token URL，无数据风险，未越「明确不做」清单任何一项，属预告第 3 条「实例启动」的无害副作用。**定级建议 🟢**（已披露、已留痕、无授权面扩大）。
   - **代码抽读 2 处均一致**：①`deriveSnapshot`（controller.ts:99-122）逐字段镜像 `resolveConfig`（config.ts:191 起：链缺省 BUILT_IN_MEMBER_ORDER :116-117↔:194-195、超时 `??30000` :118↔:196、`enabled ?? true` :108、`apiKeyEnv ?? 默认 ref` :102↔:200 等）；②Save `disabled={draft === ''}`（section.tsx:173）、Clear `disabled={!member.configured}`（:182）——与 T8 断言③「Save-Clear disabled 初态」及 JSDoc 契约一致。
3. **三问 COMPLETE 判定**：
   - **T0-T8 完成度**：9 个提交（3e4eb50..de53d72）逐棒对应，全完成；T8 六断言有 message 转录 + combo/page/home 终态/boot.log 多源实物佐证，采信。
   - **缩水/偷跑**：无实质缩水。双链展示是 plan T5 显式对称扩展（非偷跑）；三处执行偏差（第 13 devDep、--no-open、locator click 挂起改 evaluate 合成点击）均已随批披露留痕。
   - **技术债显式化**：L-2 / settingsScope 观察 / tsdown 弃用 ×2（本次 build 现场亲见同款警告）/ firecrawl 观察——四项全部在 progress-M4 技术债表亲见，无遗漏。

## 新发现分级清单

- 🟡 **收官提交态不自洽**：`de53d72` 的 client 面 typecheck 实测 exit 2（8 处 TS2322，缺 `TranslateNS` common 键接受度）；工作区未提交的 `tests/client/section.spec.tsx` stub 修复是门墙绿的必要补丁（反证实验：放入后 exit 0 且无其他错误）。门墙声称数字真实（脏树亲跑复现），但「分支 HEAD = 可交付收官态」当前不成立。**处置：主 Agent 必须在 T10 前将该修复补提交**（并考虑在台账补一行披露）。
- 🟢 **entry.spec 未断言 `order`**：实现传 `order: 16`（src/client/index.ts:44），浏览器面导航位置有旁证（T8 ②），唯 jsdom 契约缺此一字段断言。
- 🟢 **react devDep 锚漂移**：实际 `^18.3.1` vs D6 声明 `^18.2.0`（react-dom `^18.2.0` 一致）；18 大版本内，全门墙绿，建议台账一句注记。
- 🟢 **审计简报措辞偏差**（非执行侧）：「dump-wired.yml:352-353 = dshws-chain/chain-fetch」与实物不符，该两行实为 web 插件 searchProvider/fetchProvider；dshws-chain 系代码注册 meta provider，不入 dump。
- 🟢 观察：vitest 跑 client 面时 vite 对 ui-primitives 发布包缺 `index.js.map` 报 sourcemap 警告（非失败，源于上游包产物）。
- 🔴：无。

## 三问 COMPLETE 判定

T0-T8 **全部完成**且证据链闭合；无范围缩水、无未披露偷跑；技术债四项全部显式化。**唯一未清项 = 🟡 提交态补丁**（工作区已就绪，待补提交）。

## 总结论

**PASS + COMPLETE**——条件生效中：主 Agent 补提交 `tests/client/section.spec.tsx` 类型修复后方可执行 T10 翻转；若不补提交则本判定降级为 FAIL（提交态门墙不可重放）。
