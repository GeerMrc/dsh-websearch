# Note s32 — 上游三线兼容矩阵（0.1.5-rc.3 / 0.1.6-alpha.2 / 0.1.7-alpha.2）

> S32 T2 独立审核 Agent 产出（与执行上下文隔离；全文原样归档，驱动 T3/T4）。
> 基线 dsh-v0.1.5-rc.2（fb2c4b9e69）↔ A=dsh-v0.1.5-rc.3（a4c74a91e0）/ B=dsh-v0.1.6-alpha.2（ddefc45fbc）/ C=dsh-v0.1.7-alpha.2（00102833df）。
> 三 worktree 已构建（install+build EXIT=0，build-logs /tmp/dshws-s32/build-logs/）。

## 三行结论

| 线 | 判定 |
|---|---|
| A 0.1.5-rc.3 | **零适配**——277 变更文件除仓库内部门禁脚本外全为版本号/README；12 seam src diff 全空 |
| B 0.1.6-alpha.2 | **破坏 2 项**（typert strict codec `schema`→`create`〔commit e459e32637，纯编译级〕；ui-primitives 新增未声明传递依赖 simple-icons/diff）+ peer 放宽卫生项；运行时论证大概率零感知，3434 实测确认 |
| C 0.1.7-alpha.2 | **破坏 4 项**（B 的 2 项 + settings `installSection` 删除→volatile-Config 模型〔commit 601d6761e4，017a2 settings 整包重写〕+ 三图标改名 `*Outline14`→`*Outline/Medium*`〔commit 4937343a5e〕）+ 清单项（cordis→4.0.4/schemastery→3.18.4/typert-protocol→0.1.7-alpha.2） |

## 逐 seam 摘要（正本=审核 Agent 报告，此为索引）

1. web seam：A/B/C src diff 全空（provider 类型/注册 API/config 键原样）——PASS ×3
2. credentials：src 三线逐字节相同；client remote.credentials 面 diff 空——PASS ×3
3. settings：A/B 无 diff；**C 整包重写**——`installSection`/`register` 删除，`SettingsForms` 新模型（namespace=profile 插件条目；describe 只列 Config 含 `.volatile()` 字段条目；update 经 configEditor 写 profile patch；`settings/updated` 删、`document-updated` 留）；**client wire 面（SettingsDescribeValue/SettingsNamespaceView/update 签名）不变**（插件 controller 只读 ns/value/revision，编译不受影响）；迁移先例 = 017a2 web-search-deepseek/src/index.ts:95-104
4. client faces：A 全未动；B locale 删 json.collapseNode/expandNode（插件自有词典不含 json.*、不导入 Json 组件）；B/C slots/register/inject 签名逐字相同（纯加法）——PASS ×3
5. ui-primitives：Button 逐字同；Tooltip 加法 props；**C 三图标旧名不存在**（section.tsx:17/websearch-row.tsx:32/fetch-row.tsx:22 值导入编译失败）；传递依赖 B/C 新增 simple-icons/diff（宿主 bundle 运行时提供，仅插件测试解析需要 devDep）
6. manifest/安装机制：`dsh.client.platform/inject/external` 契约三线不变；ModuleLoader banner 同形（C 多可选 chunk 字段）；`dsh plugin` B/C 移入 dsh-plugin-manager 包但 dsh.bundle.patch 清单键检测与 file:tarball 流保留；requiredStartupEntryIds 为宿主自有条目（插件条目失败仅 warn）
7. cordis.patch.yml 钉扎：基座补丁 `searchProvider: deepseek-official`/`fetchProvider: http` 行与 `web-search-deepseek` id 三线在位——插件补丁覆盖目标持续有效——PASS ×3
8. typert-protocol+gateway：A 空；**B 起 strict codec 字段 `schema`→`create: () => TypertSchema`**（C 再加可选 decode/encode）——插件 key-counts-remote.ts 两处编译失败；**运行时非破坏论证**：client 仅 requireStrictCodec 模式检查、参数原样上送，解码在宿主 gateway 用宿主自产 descriptor（codec.create().parse）；binding 校验结构化（service/serviceKey/namespace），插件宿主半场构造器未变；$mount 签名三线相同
9. agent/tools/system-prompt：插件仅类型级增强、零监听；B 的 agent/created payload 加法不影响；插件不消费 PtcSdkLanguage——PASS ×3
10. cordis 4.0.2→4.0.4：插件消费面（ctx.effect/on/inject/logger、Service/Context 类型）零改动；peer `>=4.0.1-rc.1 <5` 覆盖；vendor loader 1.0.4/1.0.5 nontransactional 重做（3434 覆盖装卸循环）
11. 目标包 peer：C 线 `dsh-settings@0.1.7-alpha.2` peers `schemastery ~3.18.4`、`dsh-typert-protocol` peers `cordis ~4.0.4`
12. locale 键/Json 组件：插件零涉及——PASS ×3

## 适配动作清单（T4 输入）

- B/C-1 [seam 8]：`src/client/key-counts-remote.ts` 两 codec `schema: …` → `create: () => …`（wire 对 name/'refs' 不动）
- C-2 [seam 3]：`src/settings.ts` 双径重做——旧径（A/B）：`installSection` 特性探测保留；新径（C）：Config 热字段 `.volatile()` + `resolveConfig` 读时求值（`Volatile<T>`），client 半场零改动；**单一构建跨三线**（运行时探测，见 ADR-0021）
- C-3 [seam 5]：三图标双名兼容——新名真导入 + 旧名局部模块增强声明，运行时 `?? ` 回退（externals 由宿主按版本提供）
- 清单 [seam 5/11]：devDeps 14 包→0.1.7-alpha.2 + cordis 4.0.4 + schemastery 3.18.4 + 新增 simple-icons/diff；dependencies typert-protocol→0.1.7-alpha.2（watch-item：其 cordis ~4.0.4 peer 在 A/B 宿主为告警级，3434 亲测）；peer 六条全跨度放宽
- 豁免（已论证）：preset-authoring 的 dsh-agent-presets 包改名（仅测试调用）；agent-presets settings.update 在 C 抛 not volatile 被 catch 兜底降级 clearAllSearchOnlyPresets

## 3434 演练必测运行时点（矩阵明列）

1. B/C：key-count Remote describeKeyCounts 往返（stale schema 字段改后无静态保证）
2. C：设置节端到端（describe 出现 dsh-websearch / commit 热生效 / profile patch 新持久化位 + importLegacyDocument 迁移）
3. C：agent-presets 迁移降级路径无 unhandled rejection
4. B/C：nontransactional loader 装卸循环（add→reconcile→remove 基座回归）
5. B/C：gateway invocation receiver proxy 下 describeKeyCounts 不触私有字段
6. C：agent/created serial 化下插件条目失败仅 warn

## 关键证据文件

插件面 src/{settings.ts,client/key-counts-remote.ts,client/section.tsx,client/websearch-row.tsx,client/fetch-row.tsx,package.json}；上游 017a2 packages/settings/settings/src/{index.ts,types.ts,schema.ts}、017a2 web-search-deepseek/src/index.ts:95-104（volatile 先例）、{016a2,017a2} typert/protocol/src/types.ts、017a2 ui-primitives/src/icons/index.tsx。
