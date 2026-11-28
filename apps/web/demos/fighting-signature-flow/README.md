# Signature flow — vertical match-cut edit

All 40 fighters, one slice of their real signature route each (`signatureCombos*.ts`,
played by `playSignatureCombo`), chained so that one fighter **starts a strike and the
next one finishes it**. Separate from `fighting-signature-matchcuts`, which cuts
between whole routes.

How a cut is built:

- `routes.ts` records every route in both facings and lists its strikes: the first
  active frame of each hitbox, the spark point (hitbox ∩ target hurtbox, or the hitbox
  centre on a whiff), the striker's root, momentum and spacing.
- `chain.ts` scores an outgoing strike against an incoming one (shape of the strike
  relative to the body, height, momentum, spacing, same facing), then picks the order
  of fighters and each fighter's entry/exit strikes by dynamic programming plus
  relocation search. Longer slices are preferred so each combo stays readable.
- `timeline.ts` plays four frames at half speed on each side of a cut, about real speed
  in between, and snaps every cut to an eighth note (150 BPM). The camera is authored
  (`cameraFrame`): the incoming shot is the outgoing camera **translated** so both spark
  points land on the same screen pixel, at the same distance, then eases back to its
  own framing.
- The page shows the simulation with `mode` set to `versus-ai`, so training collision
  boxes are not drawn. Nothing in the fight changes.

Text on screen is English (channel rule). Sound: `combo-edit-music.py` with the real
engine contacts as hit cues, a whoosh on each cut.

From the repository root:

```sh
node apps/web/scripts/render-signature-flow.mjs --stills=41,42
node apps/web/scripts/render-signature-flow.mjs
pnpm --filter @black-whale/web exec vitest run demos/fighting-signature-flow/flow.test.ts
```

Output: `output/fighting-signature-flow/Black-Whale-Clash-Signature-Flow.mp4`. The
renderer is its own script: each shot is loaded about 24 simulation frames early and
played uncaptured, because the scene clocks attack poses itself — without that pre-roll
the incoming fighter would show up in neutral instead of mid-strike.

Limits: the match compares engine hitboxes, not rendered silhouettes, so arms and
weapons of different body types still differ at the cut. A slice may stop before a
route's hatsu finisher; the last shot always plays to the end, then holds.
