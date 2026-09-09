# Plan — 2026-09-09-014z-s14z-fetch-removal-and-logging

> 用户 2026-09-09 裁定（AskUserQuestion 未获答，按 12s/12t 先例取消息正文默认，一字可驳回）：
> ①web_fetch 工具彻底移除——「不管官方的还是自己弃用的，全部清除，只使用本插件接管搜索」；
> ②链路可观测性——「可以不以 Error 提示，但整个过程要有具体信息用于回溯/排查」→ 插件自建文件日志。
> 分支 feat/s14z-fetch-removal-and-logging（自 master 1709d47）。

## 一、事实基础（本日查证）

- web_fetch 工具注册权在 **Agent 预设层**（standard/ptc/cordis 预设自带 `tool-web` 行
  `fetch: true`，逐会话注册）；web-app bundle 层 tool-web 已 disabled。**插件补丁只能
  管 seam（谁来服务），管不了工具存在性** → 彻底移除 = 用户级预设覆写
  （`$DSH_HOME/.agent-presets/<id>/`，全量预设副本 + `fetch: false`）。
- 插件内自有的 fetch 链（dshws-chain-fetch + firecrawl scrape 面）在移除决定下成死代码。
- 链路日志现状：插件已实现全量链路语句（served-by/failed/redrawing/degrading），走
  `ctx.logger.info`；宿主 CLI 服务**无 info 级导出器**，发射后沉没；会话日志只有
  成员级 served-by 与工具错误。

## 二、任务

- **T0** 本计划 + 分支。
- **T1（TDD）插件面**：
  a. 停止注册 fetch 链（ChainFetchProvider/dshws-chain-fetch + firecrawl scrape 面）；
     fetchChain 配置字段保留读入但不再消费（README 注明）——死代码清除（用户裁定
     「自己弃用的也清除」）。相关测试收口。
  b. **文件日志 sink**：`$DSH_HOME/logs/dsh-websearch.log`（DSH_HOME env，缺省
     `~/.dsh`；append；启动时 >1MB 轮转 .old）；链路全部既有语句 + 新增
     **draw 级 key 行**（keyPool thunk 包装：`draw dshws-anysearch key …ab12`）。
     Config 开关 `chainLogFile?: boolean`（默认 true；部署可变选择走 Config 纪律）。
- **T2 用户实例预设覆写**：`.agent-presets/plugin-search-only/`（standard 全量副本 +
  tool-web `fetch: false`；preset.yml 名称「标准·仅插件搜索」）；新会话验证模型工具
  面无 web_fetch。
- **T3** 门墙 + 部署 3423 + 实测：真实搜索 → `tail` 文件日志见全链路（draw/key 轮换/
  降级/兜底/served-by）+ 预设会话无 web_fetch + 翻账汇报。

## 三、验收

R1 预设覆写会话的工具面无 web_fetch（模型无法调用）；R2 文件日志含链序/draw key/
轮换/降级/served-by 全链路可回溯；R3 门墙 exit0 全绿；R4 插件源内无 fetch 链注册
残留；R5 翻账完整。

## 四、边界

不动：搜索链/重试/兜底语义（S14u-S14y 定稿）、cordis.patch.yml 的 seam 钉扎
（searchProvider 不变；fetchProvider 留 http——工具已不存在，seam 指向无害）、
轨迹页可见性（v2 候选）。历史文档冻结只注不改。
