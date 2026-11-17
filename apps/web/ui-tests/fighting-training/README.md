# Clash training lab regression

Run `pnpm --filter @black-whale/web test:training-ui`.
The fixture uses the production simulation, training tools, overlay and scene.
It checks resource editing, resets, guard, actual frame advantage, pause/frame
advance, recording playback, and horizontal overflow at 1440, 390 and 320 px.
Screenshots and the report are written to `/tmp/black-whale-training-ui`.

The balance-trial panel is also checked: finite-resource setup, corner guard,
unchanged Phinks prerequisites, local observation export, English labels and the
expanded panel at all three widths. Exported notes are synthetic UI checks, not
human playtest results. See [step 3](../../src/lib/fighting/STEP3.md).
