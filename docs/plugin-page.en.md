# dsh-websearch (multi-provider web search)

> A multi-provider search chain taking over DSH's web search and fetch: Tavily, Exa, Firecrawl and AnySearch degrade in your order, DeepSeek backs up for pay, and each provider rotates several keys.

## What it does

- **High-availability failover**: a failed member is skipped for the next; key pools rotate within a provider first; the search fails only when all have
- **Unified settings**: one language, region and domain allow/block list for every member; the tool row names the member that served it
- **DNS resilience**: encrypted resolution on restricted networks; healthy networks untouched
- **Install and take over**: enabled, it replaces the built-in "Web search and fetch"; disabled, the built-ins take back over and your settings are kept

## Settings

Settings → Web Search: API keys on the member cards (stored locally only), drag to reorder the chain, toggles for web_fetch takeover and DNS; changes apply from the next search.

## Off and compatibility

**The list switch hands back to the built-ins and restores on re-enable**; the detail page's "enable component" switch only deactivates the plugin itself (a state with no settings entry — switch it back on there). Compatible with DSH 0.1.5-rc.1 through 0.2.x (0.2.2-rc.5 included). **Install from the bare-name tarball on the releases page** — the scoped npm name cannot produce the settings UI (the startup log says so if the form is wrong).

Issues and releases: https://github.com/GeerMrc/dsh-websearch
