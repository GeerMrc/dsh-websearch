# dsh-websearch 升级演练手册

> 目的：每次升级（插件自身版本或宿主 dsh 版本）后按本手册走一遍安装→配置→搜索→降级→GUI 冒烟，全部通过才可声明兼容（AGENTS.md seam 纪律引用的正本）。

## 1. 版本演进表

| 版本 | 性质 | 要点 |
|---|---|---|
| 0.1.0（内部编号） | 初始 | 链核心 + Tavily/Exa/Firecrawl/DeepSeek 四成员 + GUI 骨架 |
| 0.2.0 | **breaking** | 兜底重构（ADR-0014）：删免费 fetch 地板；`fallbackMember` 单字段；legacy `fallbackProvider` 归一只读 |
| 0.3.x | patch | anysearch 成员（ADR-0009）、多 key 池（ADR-0008→0011/0012）、溯源徽标（ADR-0010） |
| 0.4.0 | **breaking** | Perplexity 移除 + 存量归一（ADR-0017 前身；legacy `dshws-perplexity` 值归一 `auto`） |
| 0.5.x–0.6.x | patch | P1/P2/P3 参数对齐上游、统一语言/区域/域名入口（ADR-0015/0018）、fetch 链接管（ADR-0019——**用户可见行为变更非 breaking**：web_fetch 改由插件链服务） |
| 0.7.x–0.9.x | patch | UI/UX 对齐宿主 0.8.0、上游 0.1.5-rc.2 适配 |
| **v0.1.0**（定档） | 版本线重置 | ADR-0020：内部编号归历史档；正式线从 v0.1.0 起，补丁位细迭代 |

## 2. 升级演练步骤（插件版本升级）

前置：node ≥ 22.19（nvm 切换）；升级目标 tarball。

1. **打包**：`pnpm install && pnpm run build && npm pack`。
2. **换包**：`dsh plugin --profile web remove dsh-websearch && dsh plugin --profile web add <新 tarball>`。同版本号会被跳过——预览场景须 bump 版本号再 pack。
3. **dump 对照**：`dsh --profile web --dump-config`——`searchProvider: dshws-chain` / `fetchProvider: dshws-fetch-gate` / insert 行三处落盘。
4. **浏览器 reload**：插件 client 走 `/plugins/*?rev=` 运行时路由，换包后必须整页刷新。
5. **凭据 gate**：设置页成员卡绿点 = credentials describe 就绪；配 key 后无需重启（热生效）。
6. **搜索一条**：会话里发起搜索，工具行 `[served-by: <成员id>]` 徽标亲见。
7. **降级验证**：关首位成员开关（或断其 key）再搜——链降级到下一成员，日志 `<dshHome>/logs/dsh-websearch.log` 有降级轨迹。
8. **GUI 冒烟**：排序拖动 / 折叠展开 / 兜底选择器 / web_fetch 两态开关各操作一次。

## 3. 宿主 dsh 版本升级演练（peer 域变更时）

以 0.1.5 采纳为例（S24/S25 实战，Note s24 是详细正本）：

1. **独立 worktree**：主树 checkout/merge = 生产即时换版本（symlink healing），升级一律走独立 worktree（如 `dsh-harness-015`）。
2. **peer 域刷新**：package.json peer 六条 + devDep 对齐目标版本；`pnpm install`。
3. **兼容排查清单**（Note s25 八项）：seam 接口 / credentials / settings / client 面 / primitives 传递依赖 / manifest（`dsh.bundle.patch` 嵌套形态）/ patch 钉扎 / 面板重做影响——逐项实测。
4. **门墙全量**：`pnpm run typecheck && pnpm run lint && pnpm run test && pnpm run build`。
5. **3423 冒烟**（dev 实例）：换包 → dump 对照 → 浏览器亲验（§2 步骤 3-8）。
6. **生产切换**：仅用户明确指令后进行（~/.dsh 同步 + 3080 验证——见 STATUS 接力口径）。

## 4. 漂移防线（升级后必查）

- **patch 钉扎**：`searchProvider: dshws-chain` + `fetchProvider: dshws-fetch-gate` 两行随包 patch 在位（ADR-0013 漂移防线——宿主 base 升级可能改写钉死行）。
- **id 撞名**：`dshws-*` 前缀与上游/第三方新注册 id 零冲突（升级后跑一轮全量测试的注册断言）。
- **seam 形状**：`WebSearchProvider`/`WebFetchProvider` 三方法 + 注册 API 未变（typecheck 即证）。
- **溯源替身卡片**（ADR-0010 维护点）：宿主 toolview 结构变化时同步替身卡片渲染。

## 5. 回退

- 插件回退 = remove 新包 + add 旧 tarball（配置 settings 节向后兼容：未知新字段被 schema 透传，无报错）。
- 宿主回退 = 切回原 worktree/分支重启实例；用户配置无需动。
