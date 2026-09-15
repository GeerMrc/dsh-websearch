# dsh-websearch

> **Language authority**: This file mirrors `README.md` (Chinese), which is the factual source of truth; when the two disagree, the Chinese file wins.
> Version line: from **v0.1.0** (ADR-0020). Internal dev numbers 0.2.0–0.9.0 are archived history — see CHANGELOG.

`dsh-websearch` is an out-of-tree unified web-search management plugin for [deepseek-harness](https://github.com/) (`dsh`): zero host modification. It consolidates multiple search providers into one standard plugin with a user-configurable priority chain, full high-availability degradation, a multi-API-key pool, unified web_fetch takeover, and a settings-page GUI.

**Member admission bar** (ADR-0017): high availability + a free tier + multi-API-key support + upstream-aligned feature implementation.

| Member | Search | Fetch | Free tier |
|---|---|---|---|
| Tavily | ✔ | ✔ (/extract) | ✔ |
| Exa | ✔ | ✘ (upstream has no URL-fetch capability; never joins the fetch chain) | ✔ |
| Firecrawl | ✔ | ✔ (/v2/scrape) | ✔ |
| AnySearch | ✔ | ✔ (/v1/extract) | ✔ |
| DeepSeek (paid floor) | ✔ | ✘ | ✘ (paid; opt-in only) |

## Quick start

Prereqs: host `dsh` >= 0.1.5-rc.1 (peer range `>=0.1.5-rc.1 <0.1.6`), node >= 22.19.

```sh
# 1. Pack (repo root)
pnpm install && pnpm run build && npm pack   # produces dsh-websearch-<version>.tgz

# 2. Install into the web profile (install-driven takeover, ADR-0013)
dsh plugin --profile web add /path/to/dsh-websearch-<version>.tgz

# 3. Verify composition (no instance / LLM needed)
dsh --profile web --dump-config
#    web row: searchProvider: dshws-chain / fetchProvider: dshws-fetch-gate
#    dsh-websearch insert row appears
```

**Install-driven takeover**: the plugin ships a `cordis.patch.yml` pinning `searchProvider: dshws-chain` and `fetchProvider: dshws-fetch-gate` — `plugin add` takes over in one command; `plugin remove` fully restores (zero dump diff). No user-layer patch needed.

**Uninstall**: `dsh plugin --profile web remove dsh-websearch`. Known residue (honest disclosure): settings defaults and preset directories are not cleaned by remove (harmless; user-authored same-name directories are never overwritten).

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

- **Member cards** (collapsed by default; whole header clicks to expand): status dot, name, **key-count badge** (expanded only: 0 = gray hollow circle, N = brand-colored count pill, over 10 = warn color; hover shows `N of 10`, the count refreshes on expand), unsaved pill, enable switch; expanded = API key input (plaintext typing / •••• mask after save / clear), key-policy cycle chip, endpoint override (blank = default), per-member upstream-aligned parameters (ⓘ tooltips carry full semantics).
- **Search chain / Web Fetch chain**: two independently orderable chains (ADR-0019), effective on the next search.
- **Advanced fold**: fallback selector, timeout budget, DeepSeek maxUses, unified language/region (ADR-0015).
- **Provenance badge** (ADR-0010): session tool rows show `[served-by: <member-id>]`.

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

Combination constraints (dual-path fail-loud: settings validate hook rejects the write + cordis.yml load throws):
- `searchIncludeDomains` and `searchExcludeDomains` are mutually exclusive (ADR-0018).
- `exa.includeSections/excludeSections` require `exa.maxAgeHours: 0` or `-1` (upstream constraint).
- `firecrawl.tbs` must follow the official tbs grammar (`qdr:*` / `sbd:1` / `cdr:1,cd_min:…,cd_max:…`, comma-combined).

## FAQ / known behavior

- **Official web_fetch errors under a proxy**: host SSRF hard protection × TUN fake-ip (not a plugin bug). Enable `fetchTakeover` to route through the cloud extract chain.
- **Where did Perplexity go**: removed (ADR-0017 — no free API key tier available, fails the admission bar). Residual `perplexity:` sections in stored settings.yaml are harmless (schema passthrough); feel free to clean manually.
- **AnySearch vertical tag/params not implemented**: pending a key probe (registered S22).
- **Idle web-search-deepseek card on the host settings page**: inert after takeover (its key field is a single-value write to `DEEPSEEK_API_KEY`) — known behavior; do not configure multi-keys there.
- **Upgrades**: see [docs/upgrade.md](docs/upgrade.md).

## More docs

- Architecture: [docs/00-architecture.md](docs/00-architecture.md)
- Decision records: [docs/decisions/](docs/decisions/) (ADR-0001..0020)
- Upgrade rehearsal manual: [docs/upgrade.md](docs/upgrade.md)
- Governance board: [docs/STATUS.md](docs/STATUS.md)
