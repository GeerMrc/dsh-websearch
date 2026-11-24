# Upstream issue draft — S41 方案 C

> **状态**：草稿（未提交）。提交目标：`deepseek-ai/deepseek-harness`。用户确认后才外发；
> 提交后把链接补进 [known-upstream-issues.md](known-upstream-issues.md) 问题 ⑧。
> 外发前自检：无本机路径、无内部 session 编号、复现步骤自包含、语气为「问规则」而非「报 bug 定罪」。

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
