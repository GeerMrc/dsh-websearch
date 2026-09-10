# Stage 4/5 双审 — S23（正本；用户要求的「实施后独立再审核」= 两轮独立 spawn）

## Stage 4（第一轮，agent_9c8dfacd）：PASS-WITH-NOTES

- 门墙亲跑：test **446|13(459) exit0** / tc 0 / lint 3w0e / i18n 140 keys。
- **D1-D18 核销表**：13 项已对齐（file:line 全档）/ 4 项裁定豁免（D5/D6/D7/D11，plan §0 用户先例）/
  2 项方言维持（D13/D18 随 D12 锚定 Models rowCard）。
- 破坏探针：删 focus-visible 规则 → 当时零红（**抓获断言缺口**）；改 useLiftedDraft 忽略 lifted →
  T6 折叠存活测试双红（D9 防回归网真实有效）。
- T4 偏差（弃 Input 原语改 style 块 :focus）判定**可接受**——B1 绑定的是通路裁定，效果等价。
- 缺陷×3 → `a6ddf2c` 全清偿：① websearch-row.tsx 同类 token 残留（--dsw-alias-danger+#f87171）；
  ② style 块零测试锚（补六规则族内容断言）；③ advanced chevron 漏挂 data-dshws-chevron。

## Stage 5（第二轮，agent_0171398f，换 spawn）：COMPLETE-WITH-NOTES

- 清偿复验三项全 **CONFIRMED**；全量 test 亲见 **447|13(460) exit0**。
- 安全：注入式 style 块纯静态模板字面量、全 token 化、零插值——无注入面。
- 契约：useLiftedDraft 未提升调用方行为不变（lifted undefined 回退 local）；i18n 141 keys parity。
- 完整度：T0-T8 全落位；R2 浏览器证据落档为收官条件（本记录同批兑现）。
- 前瞻 NOTE：S15 素材面须接线 plan 023 §0 豁免裁定清单 + 0.8.0 对齐批（收官批一并落）。

## R2 浏览器双主题亲验（主 Agent，0.8.0 换包 @3423）

- 深色：三处 svg chevron 零 ▾ 字形；advanced 折叠草稿（CN）→ 折叠 → 「未保存」pill 现 → 复开草稿存活；
  成员卡 endpoint 草稿 → 折叠 → pill（dshws-unsaved-tavily 可见性亲证）→ 复开草稿存活。
- 浅色：设置节截图亲证无对比问题/无视觉破损（卡片头/状态点/开关清晰）。
- style 块在 DOM 实挂且四规则族（focus-visible/hover/reduced-motion/input:focus）文本亲证。
- 测试草稿未保存不落盘（settings.yaml 复核干净）；主题恢复深色。
