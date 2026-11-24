# dsh-websearch (multi-provider web search)

Tavily, Exa, Firecrawl, AnySearch and DeepSeek in one search chain you order yourself, taking over DSH's web search and page fetch.

## Features and advantages

| Provider | Search | Fetch | Free tier |
|---|---|---|---|
| Tavily | yes | yes | yes |
| Exa | yes | no | yes |
| Firecrawl | yes | yes | yes |
| AnySearch | yes | yes | yes |
| DeepSeek (paid fallback) | yes | no | none; off by default |

- **High availability**: a failed member is skipped for the next one; the search fails only when every member has. Each provider can rotate several keys.
- **Unified settings**: one search language, region and domain allow/block list applies to every member.
- **Transparent sourcing**: the tool row of every search and fetch shows which member served it.
- **DNS resilience**: encrypted resolution kicks in on restricted networks; healthy networks are untouched.
- **Install and take over**: enabled, it replaces the built-in "Web search and fetch"; disabled, the built-in providers take back over.

## Install and use

- After install the takeover works with zero configuration; enter API keys per member under Settings → Web Search (stored only in your local credentials; the page shows counts only).
- After swapping or upgrading the package, restart DSH — or toggle the plugin off and on — for the new version to take effect.
- Setting changes apply from the next search; no restart needed.

## Notes

- Disabling the plugin hands search and fetch back to the built-in providers; the plugin's settings are kept and apply again on re-enable.
- The "enable component" switch on the detail page only deactivates the plugin itself and leaves a state with no settings entry; recover by switching it back on there.
- A selection saved on the official settings page by an older version must be cleared before the chain takes effect: disable the plugin and re-save a choice on the restored page, or use the one-click notice card at the top of the settings page.
- Uninstalling from the command line does not clear that selection.

## Version and compatibility

- The installed version is shown under the detail page's source information; upgrade by uninstalling, then installing the new version.
- Compatible with DSH 0.1.5-rc.1 through 0.2.x (0.2.2-rc.5 included). 0.1.5 and 0.1.6 hosts log one harmless patch warning at startup.
