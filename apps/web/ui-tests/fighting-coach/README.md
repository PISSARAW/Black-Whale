# Clash learning and replay coach regression

Run `pnpm --filter @black-whale/web test:coach-ui`.

The script builds a production Vite bundle of the actual lesson and replay review
components, then opens it in headless Chromium with 3D APIs disabled. The fixture
uses the real engine, recorder, replay controller and rehearsal actions. Initial
positions are explicit lab premises; contacts, checkpoints and progress are never
fabricated. No running game server or GPU is required.

The check completes the real Phinks interruption exercise, analyses a verified
recording without moving its displayed cursor, seeks to a finding, takes control,
repeats and returns to the same replay state. It checks French and English labels,
cancellation, browser errors and horizontal overflow at 1280, 390 and 320 px.
Screenshots, the bundle and `report.json` are written to
`/tmp/black-whale-step5-browser`; set `COACH_CHECK_OUTPUT` to choose another path.

`scenarios.ts` is shared with the diagnostic unit tests. Its low heavy is actually
guarded and either left unanswered or punished by a real light. It also supports
mirrored P2 recordings and batches of several simulation frames.

See [step 5](../../src/lib/fighting/STEP5.md) for the perception boundaries, bounded
analysis and distinction between a measured what-if and a guaranteed response.
