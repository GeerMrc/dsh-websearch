- T19 交还路线落地（2026-11-24 用户裁决后新增，见 plan 048 附录）。裁决：关闭时的自动交还只是偶发生效的尽力通道，可靠的清除放在
  启用期间——检测到宿主层钉值时在「网页搜索」设置页顶部显示提示卡并可一键清除；T8 的尽力通道保留。
  - 实现（d86655e）：src/handover.ts 增 pinnedSelections；控制器在 #refreshSection 里从 describe 的 web 行 **user 段**检测
    （resolved 段不算——随包层的钉不是用户钉），新增端口 mutateSettings 经 remote.settings.mutate 下发 unset 路径操作
    （rc.5 网关自带该面，宿主半区零改动）；设置页提示卡只在有钉值时出现，只读文档时按钮禁用；中英文各 5 条新词条。
  - 测试先红后绿：handover 4 条、控制器 6 条、设置页 4 条；全量 731 通过 / 17 跳过（748），lint 0 警告，typecheck、check:i18n、
    build 均为退出码 0。
  - rc.5 实测（scratch 实例重启、HEAD 候选包装入、预置用户层钉值，两轮清除循环）：提示卡渲染正确（标题、说明、两行钉值、按钮）；
    点击「清除钉值」后提示卡消失，用户层 web 行整段删除，dump 的 searchProvider 回到随包钉值 dshws-chain；重载页面后提示卡
    随钉值重现。证据 /tmp/dshws-s41/t19/（脱敏后归档），含无障碍树前后对照与截图各一。
  - 文档：用户文档与 README 的清除方法改为三条（提示卡一键清除为主，官方页重选与手改文件为辅）；ADR-0024 转 accepted；
    架构注记与决策索引同步。
