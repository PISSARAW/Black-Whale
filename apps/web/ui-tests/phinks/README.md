# Ripper Cyclotron verification

`pnpm --filter @black-whale/web test:phinks` renders the production FightStage
and real engine at quarter/half right-arm turns, fifteen stored turns and the
released right punch, at desktop and mobile widths. The fixture keeps the chosen
simulation frame still for inspection. The check also uses the actual release
button, verifies English labels, horizontal overflow and browser errors.

Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to an installed Chrome executable if
Playwright's own Chromium is unavailable. `PHINKS_CHECK_OUTPUT` selects the
report/screenshot directory (default `/tmp/black-whale-phinks-ui`).

Engine behavior, fixed-step rotation count, interruption, single-punch charge,
ordinary damage, misses, blocks, Nen loss, copied use, AI and anatomical right-arm
animation in both facings are covered in `src/lib/fighting/phinks.test.ts`.
