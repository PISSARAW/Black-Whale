# Biohazard visual check

Run `node apps/web/scripts/check-hinrigh-biohazard.mjs` from the repository root.
Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an installed Chrome/Chromium.
`HINRIGH_CHECK_OUTPUT` overrides `/tmp/black-whale-hinrigh`.

The fixture uses the production engine, FightScene and inventory/capture UI.
It checks handcuff transformation, flight, physical capture and release at desktop
and phone widths. No attack damage or score is awarded by the pigeon.
