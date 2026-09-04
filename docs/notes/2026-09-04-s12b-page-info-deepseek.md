# S12b 实录：设置页信息收敛 + DeepSeek 双配置澄清（2026-09-04）

> Session 12b（feat/s12b-page-info-deepseek）技术实录；两级调用逻辑表与 DeepSeek 关系
> 结论是 S13 策略棒/S15 手册的正素材。计划：docs/plans/2026-09-04-012b-*.md。

## 两级调用逻辑（实测正本，src/keys.ts + src/chain/core.ts）

| 层级 | 语义 | 默认 | 配置入口 |
|---|---|---|---|
| **跨工具（成员级）** | **顺序降级**（非轮询）：每次请求从链首就绪成员开始，失败（429/断网/超时/成员错误）才降级下一就绪成员；caller abort 直传不降级 | 内置默认序（BUILT_IN_MEMBER_ORDER） | GUI 搜索链卡 ↑↓（S07）；settings `searchChain` |
| **同工具多 key（key 级）** | 请求前按策略选一把；**key 失败不换把重试**——直接链层降级下一成员 | `order`（恒第一把） | settings `keySelection`（热生效）；**GUI 控件 = S13 策略棒** |
| round-robin | 逐请求游标轮换 k1→k2→k3→k1 | — | 同上 |
| random | 随机采样 | — | 同上 |

**「APIKEY 搜索顺序」独立子页判定：不需要**——排序（链卡）+ 策略控件（成员卡，S13）
在现有页面承载，与宿主「单页分区」惯例一致。

## DeepSeek 双配置关系（实测正本，三处源码 file:line）

- 宿主模型 LLM（llm-deepseek/src/index.ts:88）、宿主官方 DeepSeek 搜索
  （web-search-deepseek/src/provider.ts:302）、本插件 dshws-deepseek（controller
  defaultRef）——**三者读同一凭据 ref `DEEPSEEK_API_KEY`，凭据层一份值**。
- **读取无冲突**（单存储单值；模型页配了 key 插件自动 configured）。
- **写入有覆盖面**：两处各写不同值 → 后写覆盖先写；最尖锐 = 插件多把池被模型页单把
  保存静默清掉（值语义丢失，无存储层损坏）。
- **未完全独立分离**（凭据层共用是设计；管理面——启停/链序/多把池——独立且插件卡为
  超集）。处置 = 卡面「共用模型 Key」badge 澄清（12b T2），不移除。

## UI 收敛（用户三轮①）

六卡重复 hint 段落 → 页头 h3 旁单个 IconQuestionOutline14（可聚焦 anchor + Tooltip）。
宿主无「!」圆圈图标（问号圆圈为最近似）；宿主设置页无 label 旁图标惯例——页头座席为
用户裁定例外。

## 坑

- **阶段 0 正本漏落盘**：审核执行在先、audit-log 未写盘即推进——阶段 2 复审以「悬空
  指针」抓获（dont-do ⑤ 家族）。教训：**审核完成即落盘，与续审转录同纪律**。
- **同版本 tarball 重复 add 被 pnpm 跳过**（S12a 已录）：12b 再次确认——scratch 重装
  必须 rm node_modules/<pkg>。
