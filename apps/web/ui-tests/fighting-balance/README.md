# Grounded exchange measurements

Run `pnpm test:balance --all-matchups` at the repository root. Output defaults to
`/tmp/black-whale-fighting-balance`; override it with `FIGHT_BALANCE_OUTPUT`.

`reference/2026-11-17.json` covers 240 scripted exchanges: forty attackers, both
seats, center and both corners, against Bill. `reference/matchups-2026-11-17.json`
covers all 1,600 ordered roster pairs at the right corner. After three hits the
defender holds guard. These are standing-jab pressure probes with infinite HP,
finite aura and no arena interactions. They check actual defensive contacts and
bounded strings; they are not full-match win rates or human playtests.

`reference/baseline-2026-11-17.json` preserves the earlier 600-tick no-defense
probe on `clash-combat-4`: all forty fighters sustained their corner string.
Its `ready` counter is the number of observed frames with zero hitstun and
hitstop, not a measure of input latency. The current reference attempts guard
explicitly rather than inferring it from that counter.

The [step 3 contract](../../src/lib/fighting/STEP3.md) describes the precise
hitstun change, seven human trial situations and qualification still pending.
