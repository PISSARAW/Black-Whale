# Private usage statistics

Umami 3.5.0 runs in the production Compose stack with a separate PostgreSQL
database. Only `/_analytics/script.js` and POST `/_analytics/api/send` are
public. Its dashboard, authentication and read APIs have no public route or
host port. The website has no analytics unless `UMAMI_WEBSITE_ID` is set.

The private dashboard is at `https://admin.exploreblackwhale.com/analytics`,
behind the existing back-office login. It offers rolling 7/30-day periods,
traffic, pages, referrals, devices, sections, game starts/completions, active
time, selected Hatsu and Hatsu uses by section. Empty data and an unavailable
collector are displayed separately. API credentials stay server-side.

## Initial deployment

From a clean release checkout, run `python3 infrastructure/hetzner/enable-analytics.py`.
This generates unique secrets in `.env.production` (mode 0600), enables the
`analytics` Compose profile, starts Umami, changes its seeded administrator
password, registers the website without a share link, and starts backups.
Run the standard deployment afterwards; it reloads Caddy:

```sh
./infrastructure/hetzner/deploy.sh
```

Keep the generated environment values across releases. Re-running setup
retains the website ID and password. Never enable Umami share links or expose
its port. The database volume is `black-whale_umami_data`; daily custom-format
dumps are in `black-whale_umami_backups`, retained for 14 days on this host.
The main application database and its backups are separate.

## Event definitions

| Event              | Trigger                                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| pageview           | Initial page and pathname navigation, without query strings, hash or page title                                            |
| `section_enter`    | One per pathname entry; locale prefixes are combined                                                                       |
| `mode_interaction` | First key/pointer interaction in page content per pathname entry                                                           |
| `mode_start`       | Fighting changes from ready to fighting; Morena deals a new hand                                                           |
| `mode_complete`    | Fighting match ends; Morena records a newly completed hand                                                                 |
| `mode_action`      | A Morena command changes its game state                                                                                    |
| `mode_active_30s`  | 30 seconds of visible time, after interaction, with input during the last minute                                           |
| `hatsu_panel_open` | Hatsu picker changes from closed to open                                                                                   |
| `hatsu_select`     | Explicit activation, excluding session restoration                                                                         |
| `hatsu_blocked`    | Activation rejected by forced Zetsu or mode gate                                                                           |
| `hatsu_attempt`    | Document/Ship interaction with an active Hatsu                                                                             |
| `hatsu_use`        | First visual feedback per document/Ship interaction, a Tour cast result or body interaction, or a Morena technique command |

`hatsu_use` carries Hatsu, kind, mode, locale, and result. Tour results include
refusals and missing targets: a use is a cast attempt, not proof of success.
Morena's Hatsu key is its table technique. Fighting tracks starts/completions
through its UI runtime, excluding replay playback; it does not count AI
simulation frames or attacks as site Hatsu use. Active time is conservative:
hidden tabs, idle time over a minute, and unfinished 30-second blocks do not
count. These are activity signals, not unique people or a survey of preferences.

Only the referrer origin is retained. No search strings, chat, names typed by
visitors, persistent distinct IDs, heatmaps or session recording are enabled.
Umami uses its own anonymous visitor estimates; browsers/blockers can prevent
collection. Local development has no website ID. Automated browsers are
excluded, and an administrator can opt out on the public site with
`localStorage.setItem('umami.disabled', '1')`, then reload. Remove that key to
opt back in. No past interactions are reconstructed.

## Verification and recovery

Verify `/health` on public and admin hosts; `/analytics` must redirect an
unauthenticated request to login. Requests to `/_analytics/api/websites`,
`/_analytics/login` and GET `/_analytics/api/send` must return 404. A fresh
ordinary browser should generate one pageview and a `section_enter`; locale
navigation, explicit Hatsu selection, restoration, casts and game starts
must produce their distinct events.

To restore a dump, stop Umami and its backup worker, create a scratch database,
then use `pg_restore --no-owner --no-acl` with the selected custom-format dump.
Check website and event counts there before planning a replacement. To disable
collection, clear `UMAMI_WEBSITE_ID` and recreate web/admin. Keep the analytics
volumes to retain statistics. Never use `docker compose down -v` for rollback.
