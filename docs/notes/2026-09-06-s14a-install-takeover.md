# S14a Agent Note — 装即接管 web_search（ADR-0013 实现注记）

> 2026-09-06，plan 014a T1-T4 交付注记。ADR-0013 为正本；本注记记录机制锚、实测
> 语义表与维护点，供 S15 手册（README/迁移/升级）直接取材。

## 1. 机制锚（宿主侧，alpha.3 源树 + 安装包 alpha.4 双核）

| 事实 | 锚 |
|---|---|
| id 定向覆盖别包行 config（无行属主校验） | vendor/include/src/index.ts:121-124（:66-75/:96-101 注释明文「后层可配置先层插入的行」） |
| config 整段替换、无深合并（重述全部键） | include/src/index.ts:121-124 + app-boot/README.md:139 |
| name 守卫不匹配即静默跳过（故不写） | include/src/index.ts:116-119 |
| 层序：base → 插件 bundle（安装序）→ 用户层 → home → --patch | apps/cli/src/profile-boot.ts:136-143；plugin.ts:62-68 |
| 卸载复原：patch 层纯派生态，空根全量重合成 | profile-boot.ts:104-122 + profile.ts:854-861；remove splice plugin.ts:77-87 |
| 漂移兜底是 schema 默认、非 base 值 | fiber.ts:50-62 + config-catalog.md:129-135 佐证 |

## 2. 本棒变更（全部产品面 = 一个文件）

- `cordis.patch.yml`：`- insert`（插件行，原样）+ `- id: web` + `config:
  {searchProvider: dshws-chain, fetchProvider: http}`。src 逻辑零变更。
- `tests/patch.test.ts`：三条结构断言（insert 行 / web 两键重述 + 无 name /
  不钉 fetch 链）——红〔web 断言 1 failed〕→ 绿〔3 passed〕。
- 设置页 intro 扩句（description 键，34 keys 维持）；runbook ADR-0013 增补；
  roadmap S15 迁移口径适配。

## 3. 实测语义表（S14a T2 四 dump + T1 测试，/tmp/dshws-s14a/ 留档）

| 场景 | 实测结果 |
|---|---|
| 安装（零用户层 patch） | `searchProvider: dshws-chain` + `fetchProvider: http`——装即接管 |
| 卸载（remove 单命令） | dump 与基线 **diff 零输出**——完整复原，优于旧口径（手删两行） |
| 用户层一行钉 `dshws-deepseek` | dump 用户层值赢——**终裁保留**；用户层整段替换丢 fetchProvider 键时由「无配置 + http 恒可用」路径兜住（README 教用户重述两键） |
| fetch | 恒为 `http`；切 `dshws-chain-fetch`（单成员 firecrawl）为手动可选 |

## 4. 行为语义（S15 手册口径）

- 「禁用官方 websearch」的真相：无禁用 API，**选择翻转**——`deepseek-official`
  保持注册但闲置；DeepSeek 搜索能力不消失（链内 `dshws-deepseek` 成员同
  `DEEPSEEK_API_KEY` 末位兜底，ADR-0004 D3 中立性不变）。
- 破坏性分析零回归：无任何 key 用户官方 provider 同样不可用（等价）；有
  DEEPSEEK key 用户链即刻就绪。
- anysearch 迁移新口径：**卸 anysearch（其 bundle 钉扎退出）→ 装本插件（钉扎即
  生效）**；同为 bundle 钉扎按安装序后写者赢；用户层终裁。
- 既有用户层两行者：同值不冲突可保留；卸载时需删（口径沿用）。

## 5. 维护点（ADR-0013 Consequences 落地）

1. **漂移防线**：base 未来给 web 行 config 加第三键会被重述掉（schema 默认兜底、
   非 base 值）——发版清单必查「追平重述 web config」；peer 域
   `>=0.1.2-alpha.3 <0.1.3` 同步核对。
2. patch.test 的结构断言是装载行为的**单元级哨兵**——改 patch 文件必须同步测试
   与 ADR-0013。
3. 设置页只做静态披露（无选择态 RPC——pluginInventory 无 config、web 行无
   settings namespace，S14 调研 §1.5 同结论）；GUI 接线状态显示属上游改造，v1
   scope-out。

## 6. 门墙（T4 提交态 3d09b59）

**273 passed | 9 skipped (282)**（+3 patch.test）；typecheck 双面 0；lint 0w0e
**50 files**；index.js 59.42 / index.d.ts 27.04 零漂移；**client.js 41.81→42.09 kB**
（intro 扩句）；pack 五件；i18n 34 keys + 18 files 零 CJK；前后 clean。
