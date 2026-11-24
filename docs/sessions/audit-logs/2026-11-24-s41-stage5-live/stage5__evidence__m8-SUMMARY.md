# M8 — T5p two cells re-measured on the rc.5 scratch instance (stage 5, 2026-11-24)

Method: two uncommitted diagnostic builds of a scratch copy of HEAD `56208f0`
(`/tmp/dshws-s41/stage5/probe-build`), differing from HEAD only by logging probes in
`src/client/handover-watch.ts` (diffs: `m8-probe5.diff.txt`, `m8-probe6.diff.txt`).
No behaviour of the watch was changed. Readings were written to browser storage from the
page context and read back through the in-app browser. The instance (pid 95257) was never
restarted; toggles were driven from the Plugins page switch in a new tab of mine.

Raw files: `m8-faces-served-timing-samples.json`, `m8-toggle-off-on-readings.json` (probe5,
shared localStorage key), `m8-probe6-run1.json` … `m8-probe6-run9-off.json` (probe6, per-tab
sessionStorage key), `m8-run3-userlayer-after-handover.txt`, `m8-run3-dump-after-handover.yml`.

## Cell (b): `remote.pluginManager` is not served at apply time

| Context of the install | Samples of "watch faces served +N ms" | One-shot `ctx.get('remote.pluginManager')` at install |
|---|---|---|
| page load (probe5 ×3, probe6 ×12) | 30, 29, 27, 30, 32, 23, 23, 35, 21, 22, 24, 23, 35, 24, 22 ms (15 samples; 21–35 ms) | `undefined` in 15 of 15 |
| client half re-applied in a running page (bundle switched ON again, or CLI re-add of the same version) | 7, 3, 3, 4, 3, 4, 4, 3 ms (8 samples; 3–7 ms) | the face is already there (returns `PluginManagerFace`) |

Reading: reproduced. The executor's 47 ms is of the same order; the one-shot lookup misses on
every page load, so the inject-based wait in `src/client/handover-watch.ts` is needed.

## Cell (a): "the watch is stopped before `plugin-manager/changed` arrives"

| # | Page before the OFF | Time from the watch's install to the OFF click | Result (per-context log) |
|---|---|---|---|
| R1 | 3 reloads 8–16 s after a CLI add of the same version | 110 s | **survived**. Its own `received` lines were overwritten in the shared key; survival is proven by its later line `watch stopped (+116671ms); received=2`. The visible line `received (#1, +126517ms)` 69 ms after the click belongs to the watch in a second open tab, which survived as well |
| R2 | same page, after R1 OFF→ON | 116 s (3.5 s after ON) | stopped +64 ms; `received=2` (events #1, #2 of R1); event #3 not received |
| run 1 | single reload, 36 s after a CLI swap | 10.2 s | stopped +76 ms; `received=0` |
| run 2 | 3 reloads | 10.6 s | stopped +74 ms; `received=0` |
| run 3 | 3 reloads 21–29 s after a CLI remove+add of the same version | 184.8 s | **survived**: received (#1) 64 ms after the click; handover pass ran (see below) |
| run 4-A | same page as run 3, after run 3 OFF→ON | 246.9 s (56 s after ON) | stopped +45 ms; `received=2` |
| run 5 | same page, new watch from the ON | 19.7 s | stopped +47 ms; `received=0` |
| run 6 | same page, new watch from the ON | 135.1 s | stopped +82 ms; `received=0` |
| run 7 | single reload, no CLI operation for 11 min | 49.6 s | stopped +76 ms; `received=0` |
| run 8 | single reload, no CLI operation for 10 min | 128.1 s | stopped +57 ms; `received=0` |
| run 9 | CLI remove+add, then 3 reloads 12–19 s later (as in run 3) | 125.5 s | stopped +54 ms; `received=0` |

Executor's archived-era readings found in the same browser storage (`m8-localStorage-probe-readings-preexisting.txt`):
two OFF toggles 17.0 s and 3.4 s after subscribe, both `watch stopped`, no event received.

Totals over 13 OFF toggles with a reading: 11 stopped before any event (+45 … +82 ms after the
click); 2 survived the OFF and received the event. Of my 11 toggles, 7 were the first OFF since
the page load (R1 and run 3 survived; run 1, 2, 7, 8, 9 stopped) and 4 followed an earlier OFF→ON
in the same page (R2, run 4-A, run 5, run 6; all stopped).

## What happened in run 3 while the watch survived (the only survived toggle with pins seeded)

User layer before: `- id: web / config: searchProvider: dshws-tavily, fetchProvider: dshws-fetch-gate`
(hand-seeded, live-loaded by the instance). Log lines, in order (watch `2lte9a`):

    13:13:27.888  OFF clicked (Plugins page list switch)
    13:13:27.952  plugin-manager/changed received (#1, +184827ms)
    13:13:28.067  handover pass: bundle state disabled
    13:13:28.067  handover pass: snapshot {"status":"ready","revision":25,"user":{"searchProvider":"dshws-tavily","fetchProvider":"dshws-fetch-gate"}}; ops=[unset searchProvider, unset fetchProvider]
    13:13:28.392  handover pass: mutate accepted=true
    13:13:28.392  handover pass finished
    13:13:34.012  ON clicked → received (#2) → handover pass: bundle state enabled → finished

Afterwards the user-level file no longer carries the `web` row (byte-identical to the clean
reference, mtime 13:13) and `--dump-config` equals the clean-start dump. So the client channel
implemented in `src/client/handover-watch.ts` did fire on 0.2.2-rc.5 and its write did land.

## What is not known

- Which condition makes the client half survive the OFF. Refuted by the runs above: time since
  the page load alone (run 8 and 9 stopped at 125–128 s, run 7 at 50 s), a CLI re-install shortly
  before the load (run 9 repeated run 3's preparation and stopped), three rapid reloads (run 2, 9),
  and "no earlier OFF→ON in the page" as a sufficient condition (run 1, 2, 7, 8, 9 had none and
  stopped). After an earlier OFF→ON in the same page every observed toggle stopped (4 of 4).
- One untested hypothesis, consistent with both survived toggles: in R1 the two Playwright locator
  clicks right before the toggle timed out, which `docs/dont-do.md` ("输入派发与实测判定") records as
  the symptom of the host window being in the background. A throttled webview may defer the
  client half's teardown while the event handler and the settings write still run. I could not
  control the window state without hiding the browser pane the user's own tab is in, so this stays
  a hypothesis.
- The host-side half of T5p (teardown write rejected with `HMR transactions cannot be nested`;
  `ctx.on('dispose')` handlers not firing) was not re-measured: my probe builds instrument only the
  client watch. The host log lines from the executor's runs are still in `/tmp/dshws-s41/rc5-web.log`.
- R1/R2 readings were collected with a storage key shared by every tab of the origin; a second
  open tab also ran the probe, so lines written in the same millisecond could overwrite each other.
  Probe6 (runs 1–9) used a per-tab key.

## Supplementary: the third missing T5p cell ("CLI remove: the pins remain")

`m8-cli-remove-with-pins.txt` + `m8-cli-remove-with-pins.dump.yml`. HEAD candidate installed
(no probes), bundle enabled, `web` pins hand-seeded. `plugin --profile web remove dsh-websearch`
exited 0; the dump afterwards shows the `web` row still `searchProvider: dshws-tavily` /
`fetchProvider: dshws-fetch-gate` (now from the user layer alone), `ui-settings-web-search` and
`web-search-deepseek` enabled, no `dsh-websearch` row, stderr empty; the user-level file is
unchanged by the command. After re-adding the HEAD candidate the pins were still there 6 s later
(the candidate's own watch does not run for CLI operations).

## Side observations recorded during M8

- A CLI `plugin remove` + `plugin add` of the same version while the bundle is enabled tears the
  client half down and re-applies it in connected pages within about 12 ms (`watch stopped` →
  `install`), without any `plugin-manager/changed` (`received=0` each time).
- Switching the bundle OFF in the usual case unloads the client half 45–82 ms after the click;
  the list switch and the official card update in the same interval.
