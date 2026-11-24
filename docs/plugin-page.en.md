# dsh-websearch (multi-provider web search)

Tavily, Exa, Firecrawl, AnySearch and DeepSeek in one search chain that you order yourself: when the first member fails the next one takes over, and each provider can rotate several API keys. Once enabled, the agent's web search and page fetches are served by this plugin.

## What it does

| Provider | Search | Fetch | Free tier |
|---|---|---|---|
| Tavily | yes | yes | yes |
| Exa | yes | no | yes |
| Firecrawl | yes | yes | yes |
| AnySearch | yes | yes | yes |
| DeepSeek (paid fallback) | yes | no | none; off by default |

- **Chain failover**: members are tried in the order you set. A member with no key, a disabled member, or a failed or timed-out request moves on to the next; the search fails only when every member has failed, and the error lists each member's reason.
- **Key rotation**: a provider can hold several keys. When one is rejected, the next key of the same provider is tried before the chain degrades.
- **Source badge**: the tool row of every search and fetch shows which member actually served it.
- **DNS resilience**: on networks where name resolution is restricted, it switches to encrypted resolution and probes the route first; on a healthy network it changes nothing.

## Settings

Location: Settings → Web Search. Changes apply from the next search on.

- **Provider cards**: enter API keys, enable or disable a provider, override its endpoint, tune its search parameters.
- **Search chain**: reorder the members; the first one is the primary search.
- **Take over web_fetch**: on, page fetches go through the plugin's cloud fetch chain; off, they use plain local HTTP.
- **DNS resilience**: on, off, or automatic.
- **Advanced**: fallback member, timeouts, one shared search language and region, and more.

API keys stay in your local credential store; the page only shows how many keys each provider has.

## Takeover and handover

- **While this plugin is enabled**: the built-in "Web search and fetch" settings page is hidden in the Plugins page, and this plugin decides which provider serves search and fetch.
- **When this plugin is disabled or uninstalled**: the built-in settings page comes back and search and fetch return to the built-in providers.
- **One exception**: if an earlier version let you pick one of this plugin's members on the built-in settings page, that choice lives in the host layer and is not removed when the plugin is disabled.
  The built-in page then shows it as not loaded, and search and fetch fail. To clear it: stop the host, open `cordis.patch.yml` in the active profile directory
  (`~/.dsh/profiles/desktop/` for the desktop app), delete both `searchProvider` and `fetchProvider` under the `web` row, then start the host again.
  Uninstalling the plugin from the command line leaves this choice in place as well.

## Turning the plugin off

Use the switch next to dsh-websearch in the plugin list. The plugin's detail page also carries an "enable component" switch;
it is a different operation from the list switch, so use the list switch to turn this plugin off.

## Compatibility

DSH 0.1.5-rc.1 through 0.2.x (0.2.2-rc.5 included). On 0.1.5 and 0.1.6 hosts the startup log carries one extra warning about an unmatched patch entry of this plugin; it is harmless.

Development, packaging and the full configuration reference are in the project README: https://github.com/GeerMrc/dsh-websearch
