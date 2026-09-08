# S14w 实录：环境前提（OpenClash fake-ip）+ 主备用法（S15 手册素材正本）（2026-09-08）

> Session 14w 配套实录。取证正本 = plan 014v（S14v）；本文是 S15 README「环境前提节」
> 与「主备用法节」的直接素材。

## 一、web_fetch 与 fake-ip DNS 不相容（环境前提，非插件缺陷）

**现象**：宿主官方 web_fetch 对 github.com / reddit.com / pytorch.org 等报
`URL hostname "…" resolves to a non-public IP address`；清华/中科大/阿里镜像正常。

**根因**（三因相撞，实测在案）：① 代理 DNS 用 fake-ip 模式，代理域名解析到保留段
`198.18.x.x`（实测 reddit=198.18.3.77 / github=198.18.0.19）；② 宿主 `web-fetch-http`
的 SSRF 防护要求解析结果为公网 unicast IP，保留段直接拒连（源码 network.ts）；
③ 插件不在 web_fetch 路径（fetchProvider=官方 http），无从修起。

**解法 A（推荐，一劳永逸）**：代理侧 DNS 改回真实 IP——OpenClash（LuCI → 服务 →
OpenClash → 插件设置 → 模式设置）把运行模式从 **Fake-IP（TUN）** 切到 **Redir-Host 系**
（Redir-Host 混合/增强）。透明代理照常分流，防护看到真实公网 IP 放行。代价：首连多一次
真实解析稍慢；个别依赖 fake-ip 的场景（游戏 IP 直连规则等）体验有差。**生效判据**：
`dig +short github.com` 不再返回 `198.18.x.x`。

**解法 B（保守，白名单式）**：保持 Fake-IP，在「DNS 设置 → Fake-IP 过滤
（fake-ip-filter）」加需要被抓取的域名（`+.github.com` 等）。仅清单内域名恢复；agent
可能抓任意域名，清单会持续增长——治标。

**解法 C（插件侧替代路径）**：注册 firecrawl.com key（免费额度约 500 次抓取，以官网
为准）→ 插件设置页 Firecrawl 卡配 key → 打开「web_fetch 切到本插件链」选项。web_fetch
改由 firecrawl 云端服务器抓取（实测 api.firecrawl.dev 在本网络可达），绕开 DNS/封锁/
反爬。约束：插件 fetch 链当前仅 firecrawl 一个成员（无 key 切链 = web_fetch 零可用成员
失败）；云端额度有限；单一通道无冗余——是**可达性**方案而非高可用方案。

**DDG 免费地板边界**：出口 IP 被 DuckDuckGo 反爬封锁时（HTTP 202 + 首页壳，实测本网络
即如此）免费地板不可用；S14v 起报错点名 `anti-bot challenge shell (HTTP 202)`，不会再
误读为解析 bug。地板可用性 = DDG 对出口 IP 的信誉，插件侧不可修。

**octet-stream 已知限制**：官方 web_fetch 拒收 `application/octet-stream`（如
SHA256SUMS 文本文件按二进制类型下发时）——宿主行为，记录在案。

## 二、主备用法（链序即主备序）

**语义**（机器可读正本 = tests/e2e/loopback.test.ts「primary/standby」场景）：

- 首位成员 = **主搜索工具**：请求先由它服务；失败先在**它自己的多把 key 之间**重试
  （逗号单槽多 key，至多 3 次尝试含首次；order 策略不换把）；
- 其后按链序降级，每家成员各自享有同等的成员内重试；
- 末位就绪成员 = **链内兜底位**（自定义兜底 = 把选定成员排到链序最后）；
- 内置地板（付费 DeepSeek / 免费 Fetch）殿后，作为最后一道网。

**配置步骤**：设置页 → 网页搜索 → 搜索链卡片 ↑↓ 排序（首位=主、末位=兜底位；S14w 起
两端有角色徽标）；各成员卡填 key（多把逗号分隔）；未配 key 的成员自动不占位。

**暖启动披露**：成员内多 key 重试门在**首次实际抽 key 后**才知池大小——服务启动后的
第一次搜索若主力即失败，该次只有 1 次尝试（此后每次都是 3 次）。已知行为，择机改预热
（登记 v2 候选）。

## 三、实测建议（用户操作）

1. OpenClash 切 Redir-Host → `dig github.com` 验证 → 3423 实例里重试 web_fetch
   （github/pytorch 应恢复）。
2. 注册 1-2 家搜索 key（tavily/exa 免费额度）→ 填入成员卡 → 排到 anysearch 前后 →
   实测主备降级（可观察 served-by 署名变化与降级日志）。
