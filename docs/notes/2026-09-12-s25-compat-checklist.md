# Note — S25 兼容性逐项排查清单（上游 0.1.5-rc.2，2026-09-12）

| # | 项 | 方法 | 结果 |
|---|---|---|---|
| ① | web seam（WebSearch/FetchProvider + Request/Result 类型 + WebError） | rc.2 types.ts 亲读 + 插件 typecheck 零改动 + 448 测试 | ✅ PASS（接口逐字未变） |
| ② | credentials（credentialRef/四层解析/热刷新） | typecheck + credentials 测试 + 3424 真实 key 实测写路径 | ✅ PASS |
| ③ | settings（installSection/validate hook/revision 乐观锁） | settings 测试全绿 + 3424 exactMatch 往返持久化 | ✅ PASS |
| ④ | client 面（slots/locale/remote/renderer/settings client 导入） | client 129 测试 + 3424 节挂载 | ✅ PASS |
| ⑤ | primitives（Button/Icon×2/Tooltip 导出面） | build + 3424 UI 渲染亲证 | ✅ PASS（**注意：上游未声明 19 个传递依赖，我方 devDeps 已补**——建议上游报 issue） |
| ⑥ | manifest inject/external + tsdown externals | build 产物 + 3424 运行时加载 | ✅ PASS |
| ⑦ | cordis.patch.yml 钉扎（searchProvider/fetchProvider 键 + web-search-deepseek id） | rc.2 bundle base patch 亲读：`:439 searchProvider: deepseek-official` 仍在；packages/web/web-search-deepseek 包存在 | ✅ PASS（钉扎面有效） |
| ⑧ | 面板 API 重做对设置节挂载影响 | 3424 浏览器亲证：settings 导航含网页搜索、节渲染/折叠/写路径全要素 | ✅ PASS（settings 节路径未受 sidebar 重做影响） |

**结论**：八项全 PASS，无适配性缺陷；唯一新增负担 = primitives 传递依赖补声明（已落 package.json）。
