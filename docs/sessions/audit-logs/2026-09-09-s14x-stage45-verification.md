# S14x 阶段 4/5 独立验证（初审轮）— 2026-09-09

> 审核对象：Session 14x（commits 13ef0fa/c32c590/f4c4a4e/5578281/074aea2，基线 master 19a1cbd）。以下为输出原文（逐字）。

## 🔴 清单（1 项）
- **R-1｜zh.chainOrderHint 撒谎文案残留**（src/client/locales.ts:183）：中文侧为 master 原文未改——「…其后仍有内置地板（付费 DeepSeek 或免费 Fetch）」。免费 Fetch 成员已随 ADR-0014 彻底删除、DeepSeek 也已非常驻内置地板。en 侧同句已改写，zh/en 不同步且 zh 对用户撒谎；经链卡 ⓘ Tooltip 实际渲染。逃逸原因：check-locales 只查键 parity；locales.spec 只断言新增 6 键的 zh 值，未断言四句改写后的 zh 值。

## 🟡 清单（6 项）
- Y-1 zh.chainNoUsableWarning 未随 en 重写（因果归因不准）
- Y-2 ④号自排除测试的 enabled 变体缺口（探针第一变体 0 红）
- Y-3 lint 1 warning：tests/config.test.ts 死导入
- Y-4 apply.test:153-155 热切换 vi.waitFor 空转（回调内零断言）
- Y-5 loopback fallbackProvider union 死臂 'fetch'
- Y-6 过时注释两处（controller.ts:149 / config.ts:87-88 仍称 fallbackProvider）

## 🟢 清单（符合项摘要）
删除面无残留（fetchsearch/FETCH_FALLBACK/码族全清）；fallbackMember 单字段+legacy 归一+优先级+双负测；静态剥离（strip+pin/deepseek 不静态入链/死 id 剥除）；参与守卫 append-only 三子句 + readyToolMemberCount 只数五工具（构造性排除+注释钉死）；client 选择器动态选项/锁定尾行/徽标跟随/降级=auto/快照 canonical/refName 派生；en 四句改写+键 50→52；7 象限钉子全落地；S14w 主备场景零改动声明属实（diff 0 行）；ADR-0014 与三轮正本逐项对账一致；版本/CHANGELOG/exports 面符。

## 探针牙齿（三选三全真红，还原后 diff 空）
| 探针 | 注入 | 结果 |
|---|---|---|
| a | readyToolMemberCount 彻底不过滤 | 6 红（④自排除真红；enabled 变体 0 红→Y-2） |
| b | chain.push 改替换式 | 2 红（reorder+loopback ④——替换式驱逐指定尾被钉死） |
| c | 选择器逻辑反置 | 5 红（含五工具选项断言） |

## 门墙实测
vitest exit 0（329 passed | 9 skipped；grep 'Errors |Unhandled' 0 匹配）/ typecheck exit 0 / lint exit 0（1 warning=Y-3）/ check:i18n exit 0（52 keys）。

## 总结论：BLOCKED（R-1+Y-1 zh 侧两句欠账；其余工程契约条款逐条符合，三个探针有牙齿）
