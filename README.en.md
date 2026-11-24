# dsh-websearch

> **Document split**: the plugin page shows [docs/plugin-page.en.md](docs/plugin-page.en.md) (named by the locale `meta.detail`; a Chinese UI reads [docs/plugin-page.zh.md](docs/plugin-page.zh.md)); this README is for development, installation and acceptance.
>
> **Language authority**: This file mirrors `README.md` (Chinese), which is the factual source of truth; when the two disagree, the Chinese file wins.
> Version line: from v0.1.0 (ADR-0020); **v0.2.0 = the DNS resilience layer** (ADR-0022 — a major architecture subsystem, the 0.2.x bump per ADR-0020). Internal dev numbers 0.2.0–0.9.0 are archived history — see CHANGELOG.

`dsh-websearch` is an out-of-tree unified web-search management plugin for deepseek-harness (`dsh`): zero host modification. It consolidates multiple search providers into one standard plugin with a user-configurable priority chain, full high-availability degradation, a multi-API-key pool, unified web_fetch takeover, and a settings-page GUI.

**Member admission bar** (ADR-0017): high availability + a free tier + multi-API-key support + upstream-aligned feature implementation.

| Member | Search | Fetch | Free tier |
|---|---|---|---|
| Tavily | ✔ | ✔ (/extract) | ✔ |
| Exa | ✔ | ✘ (upstream has no URL-fetch capability; never joins the fetch chain) | ✔ |
| Firecrawl | ✔ | ✔ (/v2/scrape) | ✔ |
| AnySearch | ✔ | ✔ (/v1/extract) | ✔ |
| DeepSeek (paid floor) | ✔ | ✘ | ✘ (paid; opt-in only) |

## Quick start

> ⚠️ **Known upstream host issues (not this plugin)** — see **[docs/known-upstream-issues.md](docs/known-upstream-issues.md)** (in Chinese; symptoms/affected versions/workarounds/self-check commands):
> 1. `dsh` **0.1.6-alpha.2**: every tool call crashes with `TOOL_RUNTIME_SCHEDULER.prepare` — avoid that version (use 0.1.5-rc.x / 0.1.6-alpha.1 / 0.1.7+).
> 2. `dsh` **0.1.7-alpha.2/rc.1 (half-fixed in rc.2)**: with tsx source launches the host logs `Plugin metadata … TypeError: Cannot assign to read only property 'stack'` at startup — npm-installed / built-output users are unaffected; source-launch users can use the [fork fix branch](https://github.com/GeerMrc/deepseek-harness/tree/fix/readonly-stack-rc2).

Prereqs: host `dsh` >= 0.1.5-rc.1 (peer range `>=0.1.5-rc.1 <0.1.8 || 0.1.6-alpha.1 || 0.1.6-alpha.2 || 0.1.7-alpha.1 || 0.1.7-alpha.2 || 0.1.7-rc.1 || 0.1.7-rc.2 || 0.2.0-rc.1 || 0.2.0-rc.2 || 0.2.2-rc.5 || >=0.2.0 <0.3.0` (S32/S33/S38/S41 full span — each rehearsed pre-release pinned explicitly, except that 0.2.2-rc.5 has so far only been exercised for install and the takeover switch, its search and fetch leg still to do; the range is guarded under both semver semantics by `tests/peer-range.spec.ts`; the 0.1.8 stable line stays excluded. The host compatibility gate admits 0.2.x pre-releases through `includePrerelease`, so an explicit pin records "rehearsed" rather than gating admission — see ADR-0027)), node >= 22.19.

```sh
# 1. Pack (repo root)
pnpm install && pnpm run build && node scripts/pack.mjs   # dual tarballs: bare dsh-websearch-<ver>.tgz (profile installs) + scoped (npm)

# 2. Install into the web profile (install-driven takeover, ADR-0013)
dsh plugin --profile web add /path/to/dsh-websearch-<version>.tgz

# 3. Verify composition (no instance / LLM needed)
dsh --profile web --dump-config
#    web row: searchProvider: dshws-chain / fetchProvider: dshws-fetch-gate
#    dsh-websearch insert row appears
```

**Install-driven takeover**: the plugin ships a `cordis.patch.yml` pinning `searchProvider: dshws-chain` and `fetchProvider: dshws-fetch-gate`, and hides the built-in "Web search and fetch" settings page while it is enabled (ADR-0024) — `plugin add` takes over in one command; disabling or uninstalling the plugin restores the composition and that page (measured on 0.2.2-rc.5 through the Plugins-page switch; a command-line uninstall was measured separately on rc.5). No user-layer patch needed. A `web` selection saved separately in the user layer is mostly not removed when the plugin is disabled and is not removed on uninstall; see the FAQ.

**Uninstall**: `dsh plugin --profile web remove dsh-websearch`. Known residue (honest disclosure): settings defaults and preset directories are not cleaned by remove (harmless; user-authored same-name directories are never overwritten).


## Install, upgrade, and notes

**Install** (peer range as above — covers the 0.1.5-rc line, the 0.1.6/0.1.7 pre-release and stable lines, the 0.2.0-rc line, 0.2.2-rc.5, and 0.2.x stables; 0.1.8 and 0.3.x excluded). **The only supported profile-install form is the bare-name tarball** (from v0.2.2; measured in PC6/M1: an install under the scoped npm name silently loses the client half — the settings "Web Search" section and tool-row badges never render while the host half keeps working; from 0.2.2 the plugin detects that form at startup and writes a loud warning into `<DSH_HOME>/logs/dsh-websearch.log` — rc.5 hosts print no plugin logs of their own):

```sh
# Option 1 (recommended): one-command install from the GitHub Release bare-name tarball (bump the version to upgrade)
dsh plugin --profile web add 'https://github.com/GeerMrc/dsh-websearch/releases/download/v0.2.2/dsh-websearch-0.2.2.tgz'
# Option 2: download the bare-name tarball from the releases page, then install locally
dsh plugin --profile web add <dsh-websearch-tarball>
# Option 3: pack from source (the bare-name tgz lands in dist-artifacts/)
git clone https://github.com/GeerMrc/dsh-websearch.git && cd dsh-websearch
pnpm install && pnpm run build && node scripts/pack.mjs
# Option 4: a file: dependency on the bare-name tarball in the profile package.json + pnpm install
```

The scoped npm package (https://www.npmjs.com/package/@maricgeer/dsh-websearch — the bare name `dsh-websearch` was rejected by npm's typo-squatting policy as too similar to the existing `dsh-web-search`, hence the scoped distribution name) is **for dependency resolution and registry distribution only** (CI, e2e) — do not install it into a profile: `add @maricgeer/dsh-websearch` fails to load even the host half, and the `dsh-websearch@npm:@maricgeer/dsh-websearch` dual-name alias loads the host half but silently drops the client half. Also note pnpm's `minimumReleaseAge` **silently** resolves to an older version without an exclusion entry — always verify the installed version on registry paths (PC6).

Installing takes over web_search / web_fetch (bundle-pinned install order, last writer wins) and hides the built-in "Web search and fetch" settings page while the plugin is enabled (ADR-0024); uninstalling restores the host defaults and that page. A `web` selection saved separately in the user layer is not removed by uninstall; see the FAQ. Reload the page after swapping the package (the client bundle is served from `/plugins/*?rev=` runtime routes).

**Upgrade**: full rehearsal manual at [docs/upgrade.md](docs/upgrade.md) (pack → swap → dump diff → GUI smoke → search → degradation). Same-version swaps are skipped — bump the version first for preview installs.

**CI / release** (from v0.2.0; OIDC and the consistency gate from ADR-0026): pushes and PRs to master run the full gate plus the release rehearsal (typecheck/lint/test/i18n/build on a node 22/24 matrix; pack both tarballs and check their contents). Pushing a `v*` tag is the release confirmation point: the pipeline runs the full gate and `scripts/check-release.mjs` (tag, package.json, CHANGELOG and `USER_AGENT` agree; the tag points at a commit on master) before publishing — dual-name tarballs attach to the GitHub Release and the scoped package publishes to npmjs.org through OIDC trusted publishing, with no long-lived token. The local release steps are in [docs/release-runbook.md](docs/release-runbook.md).

**Notes**:
- Key values never reach the client; the settings badge shows integer counts only (refs whitelisted to the five members, blocking cross-credential probing).
- After a host upgrade swaps the serving worktree, run `pnpm install && pnpm run build` in that worktree first so the profile links (symlink healing) resolve complete `lib/` outputs.
- From 0.1.6-alpha.1 the loader is non-transactional: a plugin startup failure surfaces as a FAILED fiber + log line (no whole-tree rollback); check `<dshHome>/logs/`.

## Migrating from the anysearch plugin (ADR-0013)

Uninstall first, then install — the bundle pin resolves by install order, last writer wins:

```sh
dsh plugin --profile web remove @anysearch/anysearch-dsh
dsh plugin --profile web add /path/to/dsh-websearch-<version>.tgz
```

- Id prefixes differ (`anysearch` vs `dshws-*`) — zero conflict; the plugin includes a `dshws-anysearch` member reusing `ANYSEARCH_API_KEY`.
- **Override/customization** (user-layer final say): if your user-layer `cordis.patch.yml` replaces the whole web row config, restate both `searchProvider` and `fetchProvider` keys — otherwise, with a firecrawl key configured, you hit `WEB_PROVIDER_AMBIGUOUS` (loud failure, not silent).

## Key configuration (multi-key single slot, comma values — ADR-0011)

Keys go through the host credentials service (credential-ref = env var name); **never plaintext in config files**. Resolution layers: process env > `~/.dsh/.credentials.yaml` > project .env > user .env; resolved per operation, hot.

One ref per member (defaults `TAVILY_API_KEY` / `EXA_API_KEY` / `FIRECRAWL_API_KEY` / `ANYSEARCH_API_KEY` / `DEEPSEEK_API_KEY`; renamable via `apiKeyEnv`). **Multiple keys = comma-separated values on the same ref** (e.g. `TAVILY_API_KEY=key1,key2,key3`), or the comma string directly in the GUI key input.

`keySelection` (default `round-robin`): `order` | `round-robin` | `random` (random-without-replacement, ADR-0012 — ascending Fisher-Yates deck; no redraw within a round).

## Settings-page GUI tour

After install, Web UI "Settings → Web Search":

- **Member cards** (collapsed by default; whole header clicks to expand): status dot, name, **key-count badge** (expanded only, a 14px circle matching the ? info icon: 0 = gray hollow circle, N = green count circle = the plugin's activation color, over 10 = warn color; hover shows `N of 10`, the count refreshes on expand), unsaved pill, enable switch; expanded = API key input (plaintext typing / •••• mask after save / clear), key-policy cycle chip, endpoint override (blank = default), per-member upstream-aligned parameters (ⓘ tooltips carry full semantics).
- **Search chain / Web Fetch chain**: two independently orderable chains (ADR-0019), effective on the next search.
- **Advanced fold**: fallback selector, timeout budget, DeepSeek maxUses, unified language/region (ADR-0015).
- **Provenance badge** (ADR-0010): session tool rows show `[served-by: <member-id>]`.
- **DNS resilience card** (v0.2.0, ADR-0022): member-card-style header with an on/off Switch; mode (auto/on/off), DoH preset (auto/CN/global/custom nodes), probe method (TCP/TLS), live detection status with evidence, and the Inspect resolution trace — see the section below.

## Chain semantics (ADR-0002 / ADR-0014)

- Ordered traversal: unregistered / disabled / credential-not-ready → skip; runtime failure or timeout (`perMemberTimeoutMs`, default 30000) → degrade to next; first success returns.
- Same-member key retry: pools with >1 key redraw up to 3 times before degrading (ADR-0012).
- All exhausted → `DSHWS_CHAIN_EXHAUSTED` (per-member failure summary attached; fail-loud).
- **Fallback** (`fallbackMember`, ADR-0014): `auto` (default — chain tail) | a tool member id (pinned tail) | `dshws-deepseek` (paid floor: joins only when ≤1 tool member is ready and its key is configured — a runtime guard, never a static append).
- Pinning a single member at the host layer (`searchProvider: dshws-tavily`) = direct connection, no degradation.

## web_fetch takeover (ADR-0019)

`fetchProvider` is pinned to `dshws-fetch-gate` (a runtime router):

- **Takeover ON** (`fetchTakeover: true`, default): web_fetch is served by the internal fetch chain — Firecrawl → Tavily → AnySearch in order (Exa never joins). Cloud-side extraction bypasses local proxy/SSRF restrictions.
- **Takeover OFF**: the gate falls back to a built-in http fetch (official-behavior-equivalent stand-in; the pinned patch means the official provider instance is never selected).
- The two-state toggle is hot in GUI and settings (next agent / next call).

## DNS resilience layer (v0.2.0, ADR-0022)

Process-level resolution high availability under side-router/controlled networks (applies to all upstream requests of this plugin; other processes untouched):

- **Automatic detection** (default `mode: auto`): a startup canary cross-checks member domains and enables DoH on poisoning evidence (e.g. 198.18.0.0/15 fake-ips); clean networks see zero behavior change (zero hits uninstall the patch).
- **DoH encrypted resolution**: bypasses transparent port-53 interception; regional preset pools (AliDNS/DNSPod for CN, Cloudflare/Google/Quad9 globally) with bootstrap auto-selection (RTT ranked).
- **Egress probing** (`dns.probe.method`): TCP-443 or TLS-Hello (SNI-carrying; default tcp) probes IP reachability, filtering CDN-rotation-stale unreachable IPs — the empirically effective measure on (SNI, IP) tuple-filtered networks.
- **Multi-level degradation**: DoH total failure falls back to system resolution exactly once; connect-level failures retry once after a fresh resolve, then degrade to the next member (no key-budget burn).
- **Privacy red lines**: hostnames in logs/traces are sanitized (non-member hosts hashed + last two labels); an active proxy environment suspends the layer (system path).
- Chain-log `[dshws-dns]` / `[dshws-chain] connect-flap` lines carry a 4-hex run key for concurrent-run attribution.

## Configuration reference (`dsh-websearch` section of cordis.yml)

> Sole source of truth = the `src/config.ts` schema; this is a common-fields excerpt. All fields are hot (next search). GUI writes share the schema.

```yaml
dsh-websearch:
  searchChain: []            # search chain; empty = tavily→exa→firecrawl→anysearch
  fetchChain: []             # fetch chain; empty = firecrawl→tavily→anysearch
  perMemberTimeoutMs: 30000  # per-member timeout budget
  fallbackMember: auto       # auto | member id | dshws-deepseek (paid floor)
  fetchTakeover: true        # web_fetch takeover toggle
  chainLogFile: true         # chain log at <dshHome>/logs/dsh-websearch.log
  searchCountry: ''          # unified region ISO 3166-1 alpha-2 (fan-out Exa/Firecrawl, ADR-0015)
  searchLanguage: ''         # unified language ISO 639-1 (fan-out Tavily, ADR-0015)
  searchIncludeDomains: ''   # unified domain allowlist (comma-separated; exclusive with exclude, ADR-0018)
  searchExcludeDomains: ''
  tavily:     { enabled: true, apiKeyEnv: TAVILY_API_KEY, baseURL: '', maxResults: 5,
                topic: general, timeRange: '', searchDepth: '', includeAnswer: basic,
                chunksPerSource: 3, filterByLanguage: false, includeDomainsMode: filter,
                startDate: '', endDate: '', exactMatch: false, keySelection: round-robin }
  exa:        { enabled: true, apiKeyEnv: EXA_API_KEY, baseURL: '', numResults: 5,
                type: auto, textFallback: true, startPublishedDate: '', endPublishedDate: '',
                category: '', maxAgeHours: 720, textVerbosity: '', includeSections: '',
                excludeSections: '', keySelection: round-robin }
  firecrawl:  { enabled: true, apiKeyEnv: FIRECRAWL_API_KEY, baseURL: '', tbs: '',
                safe: false, location: '', sources: '', categories: '', keySelection: round-robin }
  anysearch:  { enabled: true, apiKeyEnv: ANYSEARCH_API_KEY, baseURL: '', zone: cn,
                keySelection: round-robin }
  deepseek:   { enabled: false, apiKeyEnv: DEEPSEEK_API_KEY, baseURL: '', model: '',
                maxTokens: 0, maxUses: 5, keySelection: round-robin }
```

Combination constraints (fail-loud: on 0.1.5/0.1.6 hosts the settings validate hook rejects the write up front; on 0.1.7+ hosts this degrades to a loud resolve-time failure — ADR-0021; the cordis.yml load throw holds on both generations):
- `searchIncludeDomains` and `searchExcludeDomains` are mutually exclusive (ADR-0018).
- `exa.includeSections/excludeSections` require `exa.maxAgeHours: 0` or `-1` (upstream constraint).
- `firecrawl.tbs` must follow the official tbs grammar (`qdr:*` / `sbd:1` / `cdr:1,cd_min:…,cd_max:…`, comma-combined).

## FAQ / known behavior

- **Official web_fetch errors under a proxy**: host SSRF hard protection × TUN fake-ip (not a plugin bug). Enable `fetchTakeover` to route through the cloud extract chain.
- **Where did Perplexity go**: removed (ADR-0017 — no free API key tier available, fails the admission bar). Residual `perplexity:` sections in stored settings.yaml are harmless (schema passthrough); feel free to clean manually.
- **AnySearch vertical tag/params not implemented**: pending a key probe (registered S22).
- **Where the built-in "Web search and fetch" page went**: it is hidden while the plugin is enabled and "Settings → Web Search" takes over (ADR-0024); it comes back when the plugin is disabled or uninstalled. An escape hatch by design: writing `- id: ui-settings-web-search` with `disabled: false` into the profile's `cordis.patch.yml` forces the built-in page to show (the same approach as dsh-subagent-plus; measured working on 0.2.2-rc.5).
- **The built-in page shows "not loaded" after the plugin is disabled**: in 0.2.0 and earlier the built-in page was visible. A provider of this plugin selected and saved there lives in the user layer, outranks the bundle layer, and dangles once the plugin is off (`web_search` fails with `WEB_PROVIDER_CONFIGURED_MISSING`). While the plugin is enabled and detects the choice, a notice card at the top of the Web Search settings page clears it with one click ("Clear pinned selection"); after the plugin is disabled, picking the providers again on the restored built-in page and saving clears it too (the automatic choice for search plus the local direct fetch is the default); deleting `searchProvider` and `fetchProvider` (both together) from the `web` row of the profile's `cordis.patch.yml` and restarting the host works as well. An automatic handover at disable time is unreliable on rc.5: the host teardown runs inside an HMR transaction and its write is refused, and the client watch is usually unloaded before the event arrives (2 of 13 switches survived, 1 write succeeded); see the [session-41 record](docs/sessions/2026-11-23-session-41.md).
- **Upgrades**: see [docs/upgrade.md](docs/upgrade.md).

## More docs
- [docs/patterns.md](docs/patterns.md) — plugin-page intro-card and swap-verification patterns (PC1–PC3, reusable)
- [docs/known-upstream-issues.md](docs/known-upstream-issues.md) — known upstream DSH issues register (zh; symptoms/workarounds/self-checks, incl. the fork fix-branch usage)

- Architecture: [docs/00-architecture.md](docs/00-architecture.md)
- Decision records: [docs/decisions/](docs/decisions/) (ADR-0001..0027)
- Upgrade rehearsal manual: [docs/upgrade.md](docs/upgrade.md)
- Governance board: [docs/STATUS.md](docs/STATUS.md)
