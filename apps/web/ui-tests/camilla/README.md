# Cat’s Name visual regression

Run `node apps/web/scripts/check-camilla-cat.mjs` from the repository root.
Use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for an installed Chrome/Chromium.
`CAMILLA_CHECK_OUTPUT` selects the screenshot/report directory (default:
`/tmp/black-whale-camilla`).

The fixture renders the production FightScene and sequence overlay. It advances
real simulation frames after a projectile-attributed death, captures summon,
capture, absorption, resurrection and the final verdict at 1280 and 390 pixels,
and checks full revival, a consumed murderer, frozen combat time and no JavaScript
errors. The fixture has no automatic combat loop: each image shows a reproducible
simulation state. It does not require a database or the main route server.
