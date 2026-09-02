# Agent Note — S05b 安装端到端与卸载复原实录（2026-09-02，Session 05b）

> S09 手册（README/迁移/升级）的正素材：以下命令全部在本棒 scratch 环境实测（D1 配方），
> 含一处 manifest 缺陷的发现与修复（§2——S09/升级手册必须沿嵌套形态表述）。

## 1. 安装端到端精确命令（scratch 隔离配方，D1）

```sh
export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"   # node ≥22.19
cd /Volumes/IPFSJK/Zcode/deepseek-harness                    # 源码启动 cwd（仓根）
export DSH_HOME=/tmp/dshws-s05b/home                         # scratch 隔离（绝不指向 ~/.dsh）

pnpm dsh --profile web --dump-config        # 首条命令即 auto-scaffold web 模板 profile
pnpm dsh plugin --profile web add /tmp/dshws-s05b/dsh-websearch-0.1.0.tgz
# 用户层接线（架构 §6 两行——bundle 的 insert 行由 dsh.bundle.patch 自动并入，无需手写）：
cat > $DSH_HOME/profiles/web/cordis.patch.yml <<'EOF'
- id: web
  config:
    searchProvider: dshws-chain
    fetchProvider: dshws-chain-fetch
EOF
pnpm dsh --profile web --dump-config        # 验证：web 行标量翻转 + dsh-websearch insert 行
```

- **auto-scaffold**：profile 目录缺 package.json 时按 `PROFILE_TEMPLATES` 初始化（app-boot/
  profile.ts:805-814；web 模板 = dsh-base + dsh-web-app，patchReload 'live'）——首条 dsh 命令
  即完成，无显式 init。
- **对照观测面 = `--dump-config`**：与 boot 共用同一组合函数（profile.ts:846-861），无实例/
  无 LLM/无 key 即可读出最终选择标量。三态对照实测：基线（deepseek-official/http）→ 接线
  （dshws-chain/chain-fetch）→ 卸载复原（与基线逐字节一致，diff 零输出）。

## 2. manifest 缺陷：`dsh.bundle.patch` 必须嵌套（T2 发现，`fdffe9e` 修复）

- **症状**：安装警告 `dsh-websearch declares no dsh.bundle — installed as a plain dependency,
  not a profile layer`，bundles 不追加、bundle patch 不生效。
- **根因**：S03 T1 把 ADR-0007/S02 记录中的「`dsh.bundle.patch` manifest 键」转写成 package.json
  **平铺顶层键**——宿主读取语法是 `manifest.dsh?.bundle?.patch`（app-boot/profile.ts:832-834，阶段 4 校正），
  即嵌套形态 `{"dsh": {"bundle": {"patch": "./cordis.patch.yml"}}}`（上游 dsh-base/dsh-web-app
  两包实测均此形态）。平铺键从未被任何代码读取——S03-S05a 四棒零安装验证（安装端到端恰是
  S05b 范围），缺陷潜伏三个棒次由本棒 T2 实测暴露。
- **修复**：package.json 平铺键 → `dsh.bundle.patch` 嵌套对象。重装后三处落盘全过：dependencies
  翻 `file:` tarball / `dsh.profile.bundles` 自动追加 `dsh-websearch` / dump 组合树出现 insert 行。
- **S09 义务**：手册与升级文档中该键一律写嵌套形态并附本节症状描述（用户可自诊）。

## 3. 卸载复原精确命令（remove 的 reconcile 行为，S-5 预注册兑现）

```sh
pnpm dsh plugin --profile web remove dsh-websearch   # dependencies 清空 + bundles 自动 splice 回模板
# 用户层两行删除（cordis.patch.yml 恢复 []）
pnpm dsh --profile web --dump-config                 # 与安装前基线 diff = 零输出（逐字节一致）
```

- `remove` 的 reconcile（apps/cli/src/plugin.ts:81-84，`wasDependency && !stillBundle → splice`；阶段 4 校正）
  实测与源码预期一致：bundles 自动回 `[dsh-base, dsh-web-app]`，无残留。
- 复原判定 = `--dump-config` 与安装前基线 **diff 零输出**（本棒 dump-baseline.yml 与
  dump-restored.yml 逐字节一致实测）——上游行为完整复原的机制级证据。

## 4. 用户 with-key 实测槽位（D4/D5；S06 不被阻塞）

scratch home 已保留在**接线态**（`/tmp/dshws-s05b/home`；/tmp 易失，重建 = 重放 §1 命令序列）。
用户实测步骤（真实 key 任选一成员，如 TAVILY_API_KEY）：

```sh
export DSH_HOME=/tmp/dshws-s05b/home
cd /Volumes/IPFSJK/Zcode/deepseek-harness
# ① 配 key（scratch 凭据层，与 ~/.dsh 隔离）——用现有 web 凭据页或
#    对 scratch home 的 .credentials.yaml 写入（GUI 起实例后浏览器操作最直观）
pnpm dsh web --port 3411            # ② 起实例（非 3080）；浏览器开日志里的 token URL
# ③ 设置页或凭据页写入 TAVILY_API_KEY 值 → 发起一次网页搜索
# ④ 断言：搜索结果 content 首行 = [served-by: dshws-tavily]（或当前链首可用成员）；
#    宿主日志可见 [dshws-chain] served-by 行；换 key/停用成员可复验降级链
```

验收口径（roadmap S05b）：`web_search` 经 dshws-chain 出真实结果且 content 首行 `[served-by: …]`。
本机五 key 全 unset 实证（阶段 1），故该槽位由用户择机执行；M3 里程碑行保持 🚧 待回填
（S10/M6 同构），S06 启动不阻塞。

## 5. 隔离纪律执行面（阶段 4 审计清单）

全程命令的 `DSH_HOME` 均指向 `/tmp/dshws-s05b/home`（仅 T-prep 的 pack 与门墙四命令在包仓
执行）；实例端口 3411（3080 零接触，kill 用 `lsof -ti :3411` 精确收尾）；`~/.dsh` 全程零写入；
scratch credentials 零写入（with-key 槽位属用户）。

## 关联

- 契约正本：`docs/plans/2026-09-02-005b-s05b-install-e2e-restore-plan.md`（D1-D5、R1-R5）
- 安装机制：ADR-0006/0007 + S02 spike H2；宿主 `apps/cli/src/plugin.ts`（reconcile）、
  `packages/boot/app-boot/src/profile.ts`（loadProfile/组合）
- 下游义务：S09 手册（§1/§2/§3 命令与嵌套键直接入册）；S06 GUI（settings describe/mutate +
  credentials 写通路——接线态 scratch 即可复用）；用户 with-key 槽位回填后 STATUS M3 行翻 ✅
