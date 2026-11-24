# dsh-websearch (multi-provider web search)

> A multi-provider search chain taking over DSH's web search and fetch: Tavily, Exa, Firecrawl and AnySearch degrade in your order, DeepSeek backs up for pay, and each provider rotates several keys.

- **High-availability failover**: a failed member is skipped for the next; key pools rotate within a provider first; the search fails only when all have
- **Unified settings**: one language, region and domain allow/block list for every member; the tool row names the member that served it
- **DNS resilience**: encrypted resolution on restricted networks; healthy networks untouched
- **Install and take over**: enabled, it replaces the built-in "Web search and fetch"; disabled, the built-ins take back over and your settings are kept
- **Settings**: Settings → Web Search — keys on the member cards (stored locally), drag to reorder, web_fetch and DNS toggles; applies from the next search
- **Compatibility**: DSH 0.1.5-rc.1 through 0.2.x (0.2.2-rc.5 included); older hosts only log one harmless patch warning

Issues and releases: https://github.com/GeerMrc/dsh-websearch
