# dsh-websearch (multi-provider web search)

> Tavily, Exa, Firecrawl, AnySearch and DeepSeek in one search chain you order, taking over DSH's web search and page fetch: a failed member is skipped for the next, and each provider can rotate several keys.

## What it does

- **High-availability chain**: members are tried in your order; the search fails only when all have. The DeepSeek paid fallback stays out by default
- **Multi-key pools**: several keys per provider; a rejected key rotates within the provider before the chain degrades
- **Unified parameters**: one search language, region and domain allow/block list applies to every member
- **Transparent sourcing**: the tool row of every search and fetch shows which member served it
- **DNS resilience**: encrypted resolution on restricted networks; healthy networks untouched
- **Install and take over**: enabled, it replaces the built-in "Web search and fetch"; disabled, the built-in providers take back over

## Settings

Location: Settings → Web Search. Enter API keys on the member cards (stored only in your local credentials; the page shows counts); drag the search chain to reorder; one toggle each for web_fetch takeover and DNS. Changes apply from the next search; no restart needed.

## Turning the plugin off

**The switch in the plugin list removes everything this plugin contributes to the takeover** — the built-in search and fetch take over, and re-enabling restores your setup. The "enable component" switch on the detail page only deactivates the plugin itself (leaving a state with no settings entry); recover by switching it back on there.

## Compatibility

DSH 0.1.5-rc.1 through 0.2.x (0.2.2-rc.5 included); 0.1.5 and 0.1.6 hosts log one harmless patch warning at startup.

Issues, releases and upgrade notes: https://github.com/GeerMrc/dsh-websearch
