# Bonolenov verification

The isolated Vite fixture renders the production `FightStage` with WebGL and
real engine states: dance preparation, conjured Prologue attire and spear,
Jupiter pursuit, and a Metamorphosen appearance earned through a spoken
exchange. Both local sides expose the same technique and conversation buttons.

Run `node scripts/check-bonolenov.mjs` from `apps/web`; set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for an installed Chrome and
`BONOLENOV_CHECK_OUTPUT` for screenshots. The script checks mobile and desktop,
FR/EN, both owners, horizontal overflow and the technique buttons.

`src/lib/fighting/bonolenov.test.ts` verifies preparation, interruptions,
Jupiter pursuit and earshot, shared time, speech conditions, appearance expiry,
round reset, copied prerequisites and the absence of generic combat bonuses.
