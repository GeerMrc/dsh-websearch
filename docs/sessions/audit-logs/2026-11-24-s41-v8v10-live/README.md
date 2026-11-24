# V8/V10 补测证据（2026-11-24，scratch 3434 = HEAD 产品构建）

- V8（官方 id 钉值在关闭后保留）：预置 `searchProvider: deepseek-search-api` / `fetchProvider: http`（官方 id）→
  插件页开关关闭 → 官方卡回来（browser 开关 false、卡可见，见 v8v10-browser.txt）→ dump：用户层 web 行原样保留
  （v8-after-off.yml），官方 id 未被触碰 ✓
- V10（带 dshws 钉值关闭后 60 秒存活）：预置 `dshws-tavily`/`dshws-fetch-gate` → 开→关 → 探活：HTTP 401 持续响应
  （curl 多次）、页面 >60 秒后 readyState complete / nav 在 / 开关 false（v8v10-browser.txt）；两份日志零
  uncaught/fatal；dump 正常（v10-after-off.yml）；dshws 钉值仍在（与已知的非确定性清除结论一致，T19 提示卡为主通道）
- 现场恢复：钉值清除、插件重新启用、dump 回到基线（final-restored.yml = web 行 dshws 钉值、官方卡隐藏）
