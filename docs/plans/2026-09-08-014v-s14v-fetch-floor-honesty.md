# Plan — 2026-09-08-014v-s14v-fetch-floor-honesty

> 用户实测报错触发的 S15 前插棒（质量收口第二棒）：5090 会话树（session-cedce8ec + 子代理
> 3948f089，2026-09-08 20:46-21:13）实测取证 → 定性 → 本插件面修复。分支
> feat/s14v-fetch-floor-honesty。

## 取证锚（盘上 session.jsonl.zstd 正本，verbatim）

- **web_fetch 16 调用 11 错**：`resolves to a non-public IP address` ×10（reddit/
  forums.developer.nvidia.com/documentation.ubuntu.com/pytorch.org/github.com/
  raw.githubusercontent.com/conda-forge.org/dev-discuss.pytorch.org/docs.nvidia.com/
  9to5linux.com）+ `unsupported content type "application/octet-stream"` ×1
  （SHA256SUMS）；成功 5 次全为国内镜像（tuna/ustc/aliyun）。
- **web_search 27 调用 6 错**：全部 `DSHWS_CHAIN_EXHAUSTED`（成员 anysearch +
  dshws-fetch-search 地板）；成功 21 次全 `served-by: dshws-anysearch`。

## 定性（三组根因，两组非本插件）

1. **web_fetch non-public-IP = 宿主 SSRF 防护 × 本机 fake-ip DNS，非本插件**：插件不在
   web_fetch 路径（fetchProvider 钉官方 http provider）；宿主 `web-fetch-http/network.ts`
   要求 DNS 解析全为公网 unicast，而本机 Clash/Surge TUN fake-ip 模式把代理域名解析到
   198.18.x.x（实测 reddit=198.18.3.77 / github=198.18.0.19 vs 镜像站真实 IP）→ 判非公网
   拒连。成功/失败域名按是否走 fake-ip 完美二分。**修复不在插件侧**；环境解法（真实 IP
   DNS 域名分流）或配 FIRECRAWL_API_KEY 后把 web_fetch 切本插件链（firecrawl 服务端抓取
   绕过本地网络）→ 归 S15 手册披露（README 环境前提）。
2. **web_search 耗尽 = 本插件面**（S14 时代构建下的实测，问题在当前构建同样成立）：
   - 🟡-A **fetch-search 诊断混淆**：DDG 对本网络出口 IP 恒回 **HTTP 202 + 3KB 首页壳**
     （反爬 anomaly；实测 html/lite 双端点同 202、带浏览器 UA 同 202——出口 IP 信誉问题，
     重试/换端点/换 UA 均无解）；202 ∈ response.ok → 落进解析 → 零结果 → 报
     `parsed no results from the HTML endpoint`——读起来像解析 bug，实为端点反爬封锁。
   - 🟡-B **裸 UA 指纹**：请求仅带 content-type，无 user-agent——不必要的指纹暴露（本例
     中非决定因素，但裸请求头是可白捡的防御性修正）。
3. **不改（披露）**：anysearch MEMBER_TIMEOUT×3 / TypeError: fetch failed ×3 = 上游与
   代理链路波动（成功 21 次证明通路本身健康；快失败已按 S14u 语义换 key 重试，挂起受
   共享预算封顶 = 定稿语义）；octet-stream 拒收 = 宿主行为（记录已知限制）。

## 任务

- **T0** 本计划 + 分支（治理锚：用户指令 2026-09-08「再正式开启下一轮 session 15 前，
  将这些错误 / 技术债务等一并添加进去，一并彻底优化/完善好」= 执行预授权；2.5 以计划包
  本形态随汇报呈报）。
- **T1（TDD）fetch-search 202 反爬识别**：HTTP 202（DDG anomaly 壳）不再落「parsed no
  results」——202 单列报 `DuckDuckGo returned an anti-bot challenge shell (HTTP 202);
  the free fetch fallback is unavailable in this network`（badResponse 码不变，消息区分；
  真零结果〔200 壳〕保留原消息）。红：mock 202 壳期待新消息实得旧消息。
- **T2（TDD）浏览器 UA 头**：请求补 `user-agent`（固定常量，桌面 Chrome 串）；断言请求
  头携带。
- **T3 门墙**（vitest exit0 + Errors 行口径 / typecheck / lint / i18n）+ 收尾翻账。
- **T4 独立 Agent 审核**（S14u 先例口径：计划符合性 + 探针 + 新债探查）→ merge --no-ff。

## 归 S15（随手册）

README 环境前提节：fake-ip DNS 与官方 web_fetch 不相容（分流/真实 IP 解法；firecrawl
key + 切链替代路径）；DDG 地板在受限网络的可用性边界；octet-stream 已知限制。

## 验收 R1-R4

R1 202 壳与 200 零结果消息可区分（单测钉死）；R2 UA 头携带（单测钉死）；R3 门墙 exit0
全绿；R4 独立审核 PASS 无新 🟡+。
