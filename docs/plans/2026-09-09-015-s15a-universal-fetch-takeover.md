# Plan — 2026-09-09-015-s15a-universal-fetch-takeover

> 用户 2026-09-09 需求：安装插件 = 接受弃用官方 web_fetch（初心：官方默认在代理/网络
> 环境下报错体验差）；在插件设置页加"全模式接管"开关——开启时自动扫全全部 shipped
> 预设并替换所有模式下的 web_fetch。制定可行计划 + 独立审核 + 用户终审后推进。
> 分支 feat/s15a-universal-fetch-takeover（自 master 3b843e1）。

## 一、官方完整搜索链路（探查正本）

```
宿主 profile（web）
├─ bundle patch: - id: tool-web disabled: true       ← 宿主层工具已关
├─ seam (ctx.web): searchProvider=dshws-chain ✔ / fetchProvider=http
└─ Agent 预设（3+1 个 shipped，每会话装配）
   ├─ standard  有 tool-web 行 fetch:true  ← web_fetch 注册来源①
   ├─ ptc       有 tool-web 行 fetch:true  ← 来源②
   ├─ cordis    有 tool-web 行 fetch:true  ← 来源③（创造模式=standard 全量+自指）
   └─ minimal   无 tool-web 行             ← 本来就没有
```

三条硬约束（探查正本 §2/§3/§4）：
- **用户根不能 shadow shipped id**（先到先得静默跳过）→ 不能靠同名目录覆盖。
- **没有宿主级运行时改预设行 config 的通道**（文件是唯一编辑面）→ 每会话的
  tool-web 行 config 只来自预设文件本身。
- **fetchProvider 钉到 registered-but-unavailable** → web_fetch 工具可见但每次调用
  抛 WEB_PROVIDER_CONFIGURED_UNAVAILABLE（结构化错误，模型可读）。

## 二、可选策略与裁定

| # | 策略 | 优点 | 缺点 | 裁定 |
|---|---|---|---|---|
| A | 修改 shipped 预设文件（node_modules 里直接改 fetch:false） | 全模式覆盖最彻底 | 修改宿主已装包=升级即丢+零内核侵入红线 | ❌ 排除 |
| B | 每个含 web_fetch 的 shipped 预设各生成一份仅搜索副本（新 id）+ default 切到 standard 副本 | 覆盖默认+提供全部模式的仅搜索版 | 手动选 PTC/创造模式时 web_fetch 仍回来 | ✅ 部分 |
| C | fetchProvider 钉到自有 disabled provider（调用时返回明确错误"web_fetch 已由本插件接管，请用 web_search"） | 零文件修改+全模式覆盖（连手动选原版也生效） | web_fetch 工具仍在列表里（模型看到但调用报错）| ✅ 与 B 组合 |
| D | S14z2 现状（只造 standard 副本+切默认） | 已实现 | 不覆盖 PTC/创造模式 | 升级为 B+C |

**推荐组合：B + C（互补防线）**——B 让三个主要模式都有干净的仅搜索预设（默认即接管
+选择器里可选 PTC·仅搜索/创造·仅搜索）；C 在 seam 层兜底——即使有人手动选了原版预设，
web_fetch 调用时也只会得到一句明确指引（不会碰网络报红错）。两层互补 = 真正的全模式覆盖。

用户点 1「备份」回应：B 从不修改原件（每次从 shipped 现抄），无需备份——原件永远完好，
shipped 升级后下次加载自动跟上。

## 三、设计

### 3.1 设置页新开关（B 面）

「接管 web_fetch（全模式）」toggle，默认开（安装即生效）：
- ON：为 standard/ptc/cordis 各生成一份仅搜索副本（`dshws-<id>-search-only`，
  从当前 shipped 同名预设实时再生成 fetch:false diff）+ default 切到 standard 副本。
- OFF：删除全部插件生成的副本 + default 恢复为 standard。
- 生成物带版本标记（同 S14z2）；用户自撰同名目录永不覆写。

### 3.2 seam 兜底（C 面）

当开关 ON 时，插件注册一个 `dshws-fetch-disabled` fetch provider（available()=false，
描述明确"web_fetch 已由 dsh-websearch 接管"），cordis.patch.yml 的 fetchProvider 钉到
该 id——任何 web_fetch 调用都会收到结构化错误而非网络报错。
当开关 OFF 时，fetchProvider 恢复为 http（官方通道）。

### 3.3 代码结构

```
src/preset-authoring.ts  扩展：ensureAllSearchOnlyPresets()（多预设版）
src/fetch-blocker.ts     新增：disabled fetch provider 注册
src/index.ts             接线：开关读取（config.fetchTakeover 默认 true）+ authoring + blocker
src/client/section.tsx   设置页新 toggle 行
cordis.patch.yml         fetchProvider 钉 dshws-fetch-disabled（静态；OFF 时运行时反注册）
```

## 四、任务

- T0 本计划 + 分支。
- T1（TDD）preset-authoring 扩展：多预设生成/清除 + preset.yml 差异化命名（仅搜索·标准
  /仅搜索·PTC/仅搜索·创造）+ 单测（含 minimal 跳过/未知 shipped 处理）。
- T2（TDD）fetch-blocker provider + cordis.patch.yml fetchProvider 改钉 + seam 行为单测
  （registered-but-unavailable 错误码 + 错误消息含指引）。
- T3（TDD）client 面：新 toggle + locales（en/zh）+ i18n parity。
- T4 门墙 + CHANGELOG + 0.2.1。
- T5 独立复审 → T6 merge --no-ff → T7 3423 部署实测（全模式验证）+ 翻账。

## 五、验收（用户视角）

R1 安装后任何新模式会话（标准/PTC/创造）都无 web_fetch 可用（预设副本面）；
R2 即使手动选了原版预设，web_fetch 调用得到的是一句"已由本插件接管，请用 web_search"
指引（而非网络报错）（seam 兜底面）；
R3 设置页 toggle OFF 后完全恢复官方行为（副本清除+默认复原+fetchProvider 回 http）；
R4 minimal 模式不受影响（本来就没有 web_fetch）；
R5 门墙全绿 + 独立复审 PASS。

## 六、边界

不动搜索链/重试/兜底语义；不修改任何 shipped/官方文件（副本策略+seam 策略都不碰原件）；
用户自选预设的自由保留（但 seam 兜底兜住）。
