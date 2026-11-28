# Feitan — every combo (vertical)

Every combat route the game defines for Feitan, then his signature combo: basics,
Academy lessons, whiff punishes, wakeup routes and the six Kameo routes. Each one is
played by the production commands (`runBaselineRoute`, recorded as a replay and played
back frame by frame; `playSignatureCombo` for the signature). The overlay shows the
real inputs and move names from the moveset, the hit count and the combo damage.

`feitan:air` is left out on purpose: it fails in the game itself (Feitan lands before
the air heavy, which comes out standing and is blocked — `combatRoutes.test.ts` fails the
same way). `record.test.ts` pins that it is the only one.

The baseline runner reports the routes using the back heavy as incomplete because the
move ID is `feitan:shadowless-blade`, not the slot name; `record.ts` checks the combo
counter instead, like the route tests.

```sh
node apps/web/scripts/render-signature-flow.mjs --demo=feitan-combos --stills=70,740
node apps/web/scripts/render-signature-flow.mjs --demo=feitan-combos
TSX_TSCONFIG_PATH=apps/web/tsconfig.json node --import tsx --test apps/web/demos/fighting-feitan-combos/record.test.ts
```

Output: `output/fighting-feitan-combos/Black-Whale-Clash-Feitan-Every-Combo.mp4`
(1080 × 1920, English text, the edit's beat with the real contacts as hit cues).
