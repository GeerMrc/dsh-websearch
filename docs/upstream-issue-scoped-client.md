# Upstream issue — S41 方案 C（已外发；**含已被推翻的诊断，见勘误**）

> **状态**：已发出（2026-11-25，用户批准）。上游仓库 issues 关闭，改走 Discussions（Q&A 分类）：
> https://github.com/deepseek-ai/deepseek-harness/discussions/14267
> 链接已归档进 [known-upstream-issues.md](known-upstream-issues.md) 问题 ⑧。
>
> **⚠️ 勘误（同日晚，发帖后数小时）**：帖内「What we ruled out」一节的结论**已被推翻**——我们当时
> 「三处身份一致仍不采纳」的实验（M1）漏翻了 client bundle 构建时打进 `__ModuleLoader__.load({ id })`
> 的注册 id（硬编码裸名）；对齐全部三方（insert 行 name == 包清单 name == client 注册 id）后，scoped
> 第三方插件在 0.2.2-rc.5 上**全功能**（实测：设置页节完整渲染）。问题实质从「scoped 行不被采纳」
> 收窄为「**三方相等规则未文档化**」。回帖勘误草稿见文末（待用户批准外发）。

---

**Title:** Third-party plugin installed under a scoped package name: host half loads, client half is silently never adopted

**Host version:** 0.2.2-rc.5 (desktop app runtime; also reproduced with the packaged `dsh` CLI)

**Plugin:** a third-party plugin distributed on npm under a scoped name (`@scope/<name>`), with the bundled `cordis.patch.yml` inserting the plugin under its bare registration id (`<name>`), and a client half declared via the package manifest's `dsh.client` (platform/inject/external).

## What happens

Three install forms of the *same* package tarball into a profile, on the same host:

| Install form | Host half | Client half |
|---|---|---|
| scoped direct: `add @scope/<name>` | does not load (bare insert-row name cannot resolve) | — |
| dual-name alias: `<name>@npm:@scope/<name>` | loads, providers register, tools work | **silently missing** (settings section never renders, toolview badges absent) |
| bare-name tarball (manifest `name` flipped to `<name>` at pack time): `add file:...tgz` | loads | works fully |

The dual-name alias form is the trap: everything on the Node side looks healthy — zero activation failures, the boot client-module graph contains the plugin's row, and the combo URL (`/plugins/??<id>/client.js&rev=…`) returns 200 — but the client fiber/apply is never adopted, with no warning anywhere.

## What we ruled out

We made the identities fully consistent — bundled patch insert row `id` **and** `name` both set to the scoped name, package manifest name scoped, installed under the scoped path — and the client half was **still** not adopted (settings section absent). With the bare-name tarball of the same commit, everything works. So the failure does not depend on the insert-row identity the plugin controls; it tracks the scopedness of the package manifest name.

## Reproduction

1. Take any plugin whose manifest name is scoped and whose client half is declared per the docs (`dsh.client` in package.json).
2. Install it into a profile with the dual-name alias (`<name>@npm:@scope/<name>@<version>`), or `file:`-install a tarball whose manifest keeps the scoped name.
3. Restart the host, open the web/desktop client.
4. Observe: host-side contributions work; the plugin's settings section / client widgets never render; no log line explains why.

## The ask

Could you document (or fix) how the browser-side client loader pairs a plugin's loader-entry id/name with the client-module graph row:

- Is a bare manifest name a hard requirement for third-party plugins' client halves on current hosts?
- If the pairing is intentional, a startup warning for the unadopted client row would have saved us a full debugging session — silent omission is the painful part.
- If it is not intentional, the scoped-identity case (insert row id+name = manifest name, both scoped) looks like it *should* pair but does not.

Happy to provide the exact tarballs and dump outputs. Workaround we ship for now: distribute a bare-name tarball for profile installs and warn at plugin startup when the install form is known to lose the client half.

---

## 回帖勘误草稿（待用户批准后发至 #14267）

**Self-correction and the answer to our own question**

We need to correct the "What we ruled out" section above: our triple-consistency experiment had a missing leg. We aligned the bundled patch insert-row `name` and the package manifest name, but our client bundle's `__ModuleLoader__.load({ id })` registration id was still hardcoded to the bare name — and the pairing rule turns out to be a **three-way exact string equality**:

> insert-row `name` == package manifest `name` == the client bundle's build-time registration `id`

With all three aligned under the scoped name, a scoped third-party plugin works fully on 0.2.2-rc.5 (settings section and badges render — verified live). This also matches the host's own shared client preset (`packages/client/tsdown.client.ts` stamps `id = manifest.name`) and the `@fixture/live-client` e2e.

So the remaining ask narrows to documentation rather than a fix: could the three-way equality rule (and the fact that the insert-row `id` field is not part of client pairing) be documented for third-party plugin authors? The silent failure modes made this hard to diagnose — a row that never generates (`resolveMeta` → null) or a bundle that "loads without registering" both surface only as a missing settings section.

One form stays structurally unsupported on the plugin side: the dual-name alias (`bare-dir@npm:scoped-name`) — `nearestPackage` requires the manifest name to equal the resolvable directory name, which an alias can never satisfy.

(We shipped the fix as v0.2.3: the client build now stamps the id from the manifest name, and our bare-name tarball pack flips all three legs together.)
