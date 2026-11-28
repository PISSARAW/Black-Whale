# Who hits hardest — viral edit (vertical, 19.2 s)

Twelve bars at 150 BPM, every cut on the grid:

| Bars     | Section | What happens                                                                                                   |
| -------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| 1        | hook    | #1 finisher (Franklin's barrage) in slow motion, frozen on the hit, "Who hits hardest?"                        |
| 2–6      | build   | 20 fighters, one strike each, a cut every beat, match-cut on the strike                                        |
| 7–8      | rush    | 16 more fighters, a cut every half beat, speed lines                                                           |
| 9 (half) | brake   | freeze, black and white, "Top 3", the music cuts out                                                           |
| 9–12     | drop    | #3 Beyond, #2 Biscuit, #1 Franklin: half speed into the hit, inverted impact frame, freeze, damage counting up |
| end      | end     | "Who's your main?"                                                                                             |

The ranking is the real signature combo damage from the simulator (95, 105, 163). The
chain reuses `fighting-signature-flow` (routes, strike matching, camera); each chain slot
plays one real strike-to-strike slice. Effects (impact frames, punch-in, shake, speed
lines, flashes) are computed per frame in `effects.ts`, so the render is deterministic.
Music: `scripts/viral-edit-music.py`, built from the instruments of `combo-edit-music.py`.

```sh
node apps/web/scripts/render-signature-flow.mjs --demo=viral-edit --stills=36,444
node apps/web/scripts/render-signature-flow.mjs --demo=viral-edit
TSX_TSCONFIG_PATH=apps/web/tsconfig.json node --import tsx --test apps/web/demos/fighting-viral-edit/film.test.ts
```

Output: `output/fighting-viral-edit/Black-Whale-Clash-Who-Hits-Hardest.mp4`.
