# Parallel Future verification

Run `pnpm --filter @black-whale/web test:parallel-future`. For an existing Chrome
installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable.
`FUTURE_CHECK_OUTPUT` selects the report/screenshot directory (default:
`/tmp/black-whale-parallel-future-ui`).

The isolated Vite fixture renders the production `FightStage`, including WebGL,
the real engine's forecast, closed eyes, the preview slider and both perceptions.
It checks preparation, vision and divergence at desktop and mobile widths,
horizontal overflow, opening the eyes, switching perspective and English labels.
The arcade cases check that enemy preparation and divergence remain unannounced,
the HUD shows false damage, and ending the illusion reveals real health and position
at desktop and mobile widths. They also check the normal victory cinematic,
unlabelled false results, cancellation at reveal, and continuing only the perceived
round when Next round is pressed. The suite covers 25 cases.
Fixture cases deliberately hold simulation state still for screenshots.

Engine behavior, interruption, exact 600-frame duration, existing projectiles,
predicted death, real collisions, AI targeting, serialization and round reset are
covered by `src/lib/fighting/parallelFuture.test.ts`.
