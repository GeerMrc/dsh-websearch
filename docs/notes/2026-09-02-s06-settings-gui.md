# Agent Note — S06 设置页 GUI client half 实录（2026-09-02，Session 06）

> S09 手册正素材：client half 的构建契约、类型面接点、测试基建与实测数字。安装/卸载命令
> 序列在 [S05b runbook](2026-09-02-s05b-install-runbook.md)（本棒 T8 复用其配方，端口 3412）。

## 1. client half 构建契约（本仓自备，宿主 preset 同构）

`tsdown.client.config.ts` 复刻宿主 `packages/client/tsdown.client.ts` 的四件套：
`format: 'cjs'` + `entryFileNames: 'client.js'` + `inlineDynamicImports: true` +
ModuleLoader banner/footer/intro（`id = 'dsh-websearch'`）。实测产物：16.52 kB（gzip
4.92 kB），external 恰三枚 require（`react` / `react/jsx-runtime` /
`@deepseek-ai/dsh-client-ui-primitives`）——react 零内联。**共享 outDir 纪律**：client 配置
必须 `clean: false`（node 先建、client 后加）；失败的 tsdown 试跑也会清 outDir（本棒实测把
pack 清单打缺过一次——验证时序注意）。

**manifest 三键**（宿主读取语法 `packages/client/modules/src/client/manifest.ts:196-206` 亲证）：

```json
"dsh": {
  "bundle": { "patch": "./cordis.patch.yml" },
  "client": {
    "platform": "web",
    "inject": ["@deepseek-ai/dsh-client-locale", "@deepseek-ai/dsh-client-ui-settings", "@deepseek-ai/dsh-api-remotes"],
    "external": ["@deepseek-ai/dsh-client-ui-primitives"]
  }
}
```

`inject` = 装载顺序边（这三家 client half 提供 `locale`/settings 契约/`remote` 运行时服务）；
`external` = 模块表请求——`dsh-client-ui-primitives` 在冻结模块表基线
（`packages/client/web/src/platform.ts` PLATFORM_MODULES）里，故外置包可请求。
`exports["./client"] = { "default": "./lib/client.js" }`（无 types 键——npm type face 保持
node half，ADR-0007 四键形态不破坏）。

## 2. 类型面接点（发布包 alpha.4 亲证路径）

- `ctx.locale` 合并：`@deepseek-ai/dsh-client-locale/client`（lib/types/client/index.d.ts:56 Context 声明）
- `ctx.remote` 合并：`@deepseek-ai/dsh-api-remotes/client`（:48）
- `ctx.slots` 合并：`@deepseek-ai/dsh-client-ui-renderer/client`（**第 13 个 devDep**——范本
  ui-settings-plugins index.ts:18 同款 type-only import；漏它 ctx.slots 不 typecheck）
- settings.section slot 契约类型：`@deepseek-ai/dsh-client-ui-settings/client`
- settings 值类型：`@deepseek-ai/dsh-settings/types` 子路径（`SettingsDescribeValue` /
  `SettingsNamespaceView`；**根导出没有这两个名**）；凭据：`@deepseek-ai/dsh-credentials`
  根（`CredentialInfo`）
- locale 字典增强目标：`@deepseek-ai/dsh-client-ui-slots` 根（`LocaleNamespaceMap` 声明合并，
  :27）；`TranslateNS` 的键域含 common 命名空间回退键（`LocaleKeysOf`），测试 stub 的 t 座
  要覆盖它

## 3. 客户端写通路（组件→远端，全部实测断言）

卡片动作链：`保存 key → controller.setKey → ctx.remote.credentials.set(ref, value) →
describe 刷新 → 状态点翻转`；`启停 → ctx.remote.settings.update('dsh-websearch',
{ <memberKey>: { enabled } }, expectedRevision) → revision 变化 + onChange 热生效（node half
S05a 链路）`；`credentials/reference-updated` 事件 → 重 describe → 快照刷新（控制器
`onReferenceUpdated` 适配 `ctx.remote.$on`）。ref 名 = 设置节 value 的 `apiKeyEnv` ?? 内建
默认名（DEEPSEEK/TAVILY/FIRECRAWL/EXA/PERPLEXITY_API_KEY），客户端缺省镜像 resolveConfig。

## 4. 测试基建（S09/GUI 后续棒的现成面）

- jsdom 组件测试 = per-file pragma `// @vitest-environment jsdom` + `@testing-library/react`，
  手造 props/ctx stub（上游 section.client.spec 同款；`as unknown as` 收窄）
- **发布版 ui-primitives 在 vitest 下必须 inline**：lib 运行时 import 自家 CSS module，
  externalized 依赖绕过 vite 转换报 `Unknown file extension ".css"`——vitest.config.ts
  `test.server.deps.inline = [/@deepseek-ai\/dsh-client-ui-primitives/]`（已落仓）
- 双面 typecheck：`tsconfig.json`（node，exclude client 面）+ `tsconfig.client.json`
  （dom lib + jsx react-jsx + types:[]，**extends 会继承 root 的 exclude，须显式 `exclude: []`**）
- 同卡片多按钮的查询用 `within(card)` 或 per-member aria-label（同名按钮 5 份是天然歧义）

## 5. 门墙终值（T7 收口，node v22.23.2 / pnpm 11.7.0）

- `pnpm test` → 22 files，**184 passed | 6 skipped (190)**（S05b 基线 157|6(163) → +27 passed，
  既有零破坏）
- `pnpm typecheck` → exit 0（node + client 双面）
- `pnpm lint` → 0 warnings 0 errors（38 files，96 rules——.tsx 入 lint 面）
- `pnpm build` → lib/index.js 49.00 kB + lib/index.d.ts 21.89 kB + **lib/client.js 16.52 kB**
  （gzip 12.34 / 4.83 / 4.92）
- `npm pack --dry-run` → 五件：cordis.patch.yml + package.json + lib 三件

tsdown 弃用警告 ×2 在档（`inlineDynamicImports`→`codeSplitting:false`、`external`→
`deps.neverBundle`；宿主 preset 同款语义，S09 升级演练时顺手迁移）。

## 关联

- 契约正本：`docs/plans/2026-09-02-006-s06-settings-gui-plan.md`（D1-D6、R1-R5）
- 机制：ADR-0006（GO + 构建契约）、S02 spike H1-H4（slot/locale/remote 实录）、S05a settings
  热改链路、[S05b runbook](2026-09-02-s05b-install-runbook.md)（安装配方）
- 下游义务：S07 排序 UI（本节链只读块是底座；settingsScope/store 快照机制再评估）、S09 手册
  （本 Note §1/§2/§4 直接入册）
