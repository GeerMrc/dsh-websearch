# Plan 023 — S23 UI/UX 全面对齐 DSH

> Session 23 | 2026-09-11 | 里程碑 M7（roadmap S23 行）
> 输入：阶段 0 gate PASS（🟡 roadmap S22 陈旧末列已 T0 `b845ebf` 清偿）+ 独立差距清单
> Agent 正本（D1-D18 + 已一致清单 + UNVERIFIED，结论已并入本计划；全文见本 session 记录）。
> 验收：差距清单→逐项对齐→复审 PASS（roadmap S23 行原文）；浏览器双主题实测亲验。

## 0. 裁定（产品决策，标注依据）

**锚定方言 = Models rowCard**（D12）：成员卡结构（状态点+开关）与 provider row 同构，
插件现行视觉本就追随该方言——D13（12x14 padding/gap 8-10）、D18（宽度 720）随之**维持现状**，
记录锚点决策即视为对齐。

**保留既有用户裁定（不做「对齐」，记录豁免）**：
- D6 保存反馈 auto-clear（S14i/S14o 用户裁定）——仅修注释漂移（多处写 2.5s 实为 1.5s）
- D7 开关 ON 绿 = 配置+启用语义（S12 用户裁定）
- D5 未配置点琥珀（未配置≠错误，插件语义）——不改红
- D11 maxUses 紧凑 stepper（S14g 用户裁定）

**UNVERIFIED 处置**：U1 视为一致（节头槽位）；U2 双主题渲染核验并入 T7 浏览器亲验；U3 词典
对照（discard/reset/unsaved 词族）→ 若 T6 引入 unsaved 概念则随 T6 局部对照，全面对照归 S15。

## 0.5 实现路径裁定（阶段 2 B1/B2 必改落位）

**B1 伪类通路**（插件 = 单文件 CJS 分发，无 CSS 产物通道；宿主 base.css 无全局 focus-visible）：
- **注入式 `<style data-dshws-styles>` 块**挂在 section 根部，用既有 `data-dshws-*` 属性选择器写 `:hover/:focus-visible/open` 态规则（先例 section.tsx:336/376/413）；**色值一律 token 化**（--dsw-alias-*），禁十六进制硬编码（D4/D8 是先例，S5）。
- **D3 文本输入迁移 `Input` 原语**（primitives Input.module.css 自带 :focus-within brand 边框，external 已请求）——focus 免费获得；伪类断言分工：jsdom 渲染断言只覆盖 `<style>` 文本/挂载与原语迁移，**真实伪类效果归 R2 浏览器亲验**（done 条件明示）。

**B2 草稿提升 = 路径 (a)**：staged draft 从六个子组件局部 state（key/endpoint/param/domain/geo/maxUses）提升到卡级（MemberCard 与 section 层 advanced 折叠聚合），**折叠不丢草稿**，dirty pill 语义闭合（对齐宿主 PluginCard.tsx:78 卡级 state.dirty 形态）。

## 1. 任务清单（TDD/视觉验证逐一；样式类以渲染断言+浏览器亲验为证据）

| # | 任务（差距项） | done 条件 |
|---|---|---|
| T1 | **D4 错误 token 统一**（§196 `--dsh-` 前缀拼写错 → `--dsw-alias-state-error-primary`；§435 删 `#f87171` fallback）+ D14 label-ⓘ gap 6→10 + D16 reduced-motion 豁免 | 单测/样式断言 + grep 零残留 |
| T2 | **D1 折叠指示符换 `IconChevronDownOutline14`**（三处：成员卡/详细配置/接管卡）+ 120-160ms 旋转过渡 | 渲染断言（svg 替代文字 ▾）+ 浏览器亲验 |
| T3 | **D2 卡片 hover/open 视觉态**（open = bg-layer-2 + border dimmed；折叠卡 hover 边框）+ **D10 卡体/footer border-top 分隔** | 浏览器亲验（开合差异可见） |
| T4 | **D3 input :focus**（迁移 Input 原语获 :focus-within）+ **D17 focus-visible**（注入式 style 块全覆盖；S2：T2 旋转过渡一并入 D16 豁免） | 渲染断言（原语挂载+style 块文本）+ 浏览器亲验 tab 走查 |
| T5 | **D8 select chevron 宿主参数**（#81858C / right 12px / padding-right 32px；**两处**：selectStyle 与 fallback 内联——S1） | 样式对照断言 + grep `#888`/`right 10px` 零残留 |
| T6 | **D9 dirty pill**（按 §0.5 B2 路径 a：draft 提升至卡级，折叠存活）：成员卡头 + 详细配置折叠头 unsaved 徽（宿主形态）；**unsaved 词典键随本任务落地**（i18n parity 在 T6 验，S3） | 渲染断言（改草稿→pill 现/保存→灭/折叠后仍现）+ 浏览器亲验 |
| T7 | **D15 提示形态统一**（三处自绘「！」圆徽 → IconQuestionOutline14 + Tooltip）+ **D6 注释漂移勘正**；0.8.0 + UA×5 + CHANGELOG + Note | i18n parity + 门墙四件 exit0 + 浏览器双主题亲验 |
| T8 | 收官：全量门墙 + 原子收官 merge + STATUS/roadmap/progress | 四件 exit0 数字亲见 |

## 2. 验证矩阵

| 验收 | 内容 | 责任 |
|---|---|---|
| R1 | T1-T7 每项渲染断言/样式断言红→绿 | 主 Agent |
| R2 | 浏览器双主题亲验（浅/深各一轮：折叠图标过渡/卡开合态/focus 走查/dirty pill） | 主 Agent |
| R3 | 全量门墙四件 exit0 | 独立 Agent（阶段 4） |
| R4 | **双审第一轮**：独立 Agent 对照差距清单逐项核销（D1-D18 每项 已对齐/裁定豁免/UNVERIFIED 处置） | 独立 Agent（阶段 4） |
| R5 | **双审第二轮（用户要求）**：复审 PASS 确认 | 独立 Agent（阶段 5，换 spawn） |

## 3. 高危命令预告

merge --no-ff（收官）；3423 换包重启（先告知后动；同版本 tarball 删 node_modules 条目强制重装）。无 push / 无仓外 rm。
