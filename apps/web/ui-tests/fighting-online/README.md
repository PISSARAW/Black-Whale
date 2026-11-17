# Clash online services regression

Run `pnpm --filter @black-whale/web test:online-ui`.

The fixture renders the actual online identity, matchmaking, history, series,
report and bracket components. A Vite middleware calls the production HTTP
adapter, authoritative registry and private file stores in a fresh temporary
directory. `/__test/*` helpers exist only in this fixture. The match helper runs
real commands through two ordinary rounds; it never edits health or supplies a
combat winner. The tournament helper explicitly leaves a real started match,
which must be labelled as a forfeit rather than a KO.

Four isolated browser contexts check ranked/casual separation, cancellation,
owner-only session restoration, two real completed matches, exactly one Elo
update, recovery from a saved identity after coordinator restart, private reports
and a public bracket derived from a server forfeit. French and English labels,
browser errors and overflow at 1280, 390 and 320 px are covered. 3D APIs are disabled;
this is a services and interface check, not a GPU or physical Internet test.

Screenshots and a token-free `report.json` are written to
`/tmp/black-whale-step6-browser`, or `ONLINE_CHECK_OUTPUT`. Per-run private data and
the recovery-code download live in its fresh `data-*` directory. The test never
uses the application’s ordinary season volume. See [step 6](../../src/lib/fighting/STEP6.md).
