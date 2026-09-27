# DoH JSON fixtures — provenance

| File | Provenance | Sampled |
|---|---|---|
| `alidns-*.json` | **Live-sampled** from `https://dns.alidns.com/resolve` pinned to `223.5.5.5` (SNI `dns.alidns.com`), `accept: application/dns-json` — reachable from this network | 2026-09-27 (S35 T2) |
| `dnspod-*.json` | **Live-sampled** from `https://doh.pub/dns-query` pinned to `120.53.53.53` (SNI `doh.pub`), `accept: application/dns-json` — reachable from this network. Note the shape quirk: `Question` is an ARRAY here (object at AliDNS) | 2026-09-27 (S35 T2) |
| `cloudflare-doc.json` / `google-doc.json` / `quad9-doc.json` | **Doc-locked** — endpoints blocked from this network (TECHNICAL-REPORT §2.2 evidence 5); bodies reconstructed from each vendor's documented JSON response shape (Cloudflare `dns-json` / Google `/resolve` / Quad9 `:5053` docs — sources enumerated in ADR-0022 D6). Parsing shape is identical Google-style JSON; the lock records provenance, not a novel shape | 2026-09-27 (S35 T2) |

`alidns-nxdomain.json` locks a real `Status: 3` (NXDOMAIN) envelope with an Authority SOA row. Live rows carry the production TTLs observed at sampling time (tavily TTL=60 rotation, anysearch GTM TTL=1).
