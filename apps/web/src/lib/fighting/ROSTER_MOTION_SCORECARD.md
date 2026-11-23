# Clash roster motion scorecard

Kurapika's `standingHeavy` is the 10/10 presentation reference. This scorecard
ranks authored motion depth, not damage, frame advantage or character strength.

## P0 baseline

- 40 playable fighters and 360 physical attacks audited;
- 81 dedicated clips and 279 generated roster clips;
- every attack has a finite contact pose and active-window coverage;
- 31 fighters still have no dedicated physical normal;
- full reports are generated with
  `pnpm --filter @black-whale/web exec tsx scripts/report-roster-motion-scorecard.ts`.

The five categories are mechanics, rhythm, contact, silhouette and identity.
Dedicated key poses, lower-body drive, fine joints, staged kinetic chains,
active coverage and authored recovery all raise the score. A generated clip is
therefore credited for being functional without being mistaken for finished
animation.

## First improvement wave

| Rank | Fighter      | Baseline | First priorities                     |
| ---: | ------------ | -------: | ------------------------------------ |
|    1 | Melody       |      6.7 | air light, back heavy, forward light |
|    2 | Mizaistom    |      6.7 | air light, back heavy, forward light |
|    3 | Camilla      |      6.8 | air light, back heavy, forward light |
|    4 | Gel          |      6.8 | air light, back heavy, forward heavy |
|    5 | Illumi       |      6.8 | air light, back heavy, forward heavy |
|    6 | Terebellum   |      6.8 | air light, back heavy, forward light |
|    7 | Tserriednich |      6.8 | air light, back heavy, forward light |
|    8 | Cluck        |      6.9 | air light, back heavy, forward light |
|    9 | Luini        |      6.9 | air light, back heavy, forward heavy |
|   10 | Machi        |      6.9 | air light, back heavy, low light     |

The first production wave starts with grounded fundamentals before polishing
air attacks: support mechanics, anticipation, contact silhouette, outcome-led
recovery and the character's free-hand/secondary-motion sentence.

## P1 — grounded fundamentals

The first wave now owns dedicated `standingLight`, `standingHeavy` and
`forwardLight` timelines: 30 new seven-key clips. Each has a semantic support
foot and opposite pivot, two-stage anticipation, a held active silhouette and
three recovery keys. Character-specific pelvis, chest, wrist, palm and foot
accents preserve ten distinct movement identities.

| Fighter      |  P0 |  P1 |
| ------------ | --: | --: |
| Melody       | 6.7 | 7.8 |
| Mizaistom    | 6.7 | 7.8 |
| Camilla      | 6.8 | 7.8 |
| Gel          | 6.8 | 7.6 |
| Illumi       | 6.8 | 7.7 |
| Terebellum   | 6.8 | 7.8 |
| Tserriednich | 6.8 | 7.7 |
| Cluck        | 6.9 | 7.8 |
| Luini        | 6.9 | 7.8 |
| Machi        | 6.9 | 7.7 |

The roster total is now 111 dedicated physical clips and 249 generated clips.

## P2 — low and directional control

The same ten fighters now own dedicated `lowLight`, `forwardHeavy` and
`backHeavy` timelines. Low attacks add measurable level compression, advancing
heavies drive the root forward from a lead-foot base, and retreating heavies
brake backward over the rear support instead of reusing the forward silhouette.

| Fighter      |  P1 |  P2 |
| ------------ | --: | --: |
| Melody       | 7.8 | 8.7 |
| Mizaistom    | 7.8 | 8.7 |
| Camilla      | 7.8 | 8.7 |
| Gel          | 7.6 | 8.6 |
| Illumi       | 7.7 | 8.7 |
| Terebellum   | 7.8 | 8.7 |
| Tserriednich | 7.7 | 8.6 |
| Cluck        | 7.8 | 8.6 |
| Luini        | 7.8 | 8.7 |
| Machi        | 7.7 | 8.6 |

The roster total is now 141 dedicated physical clips and 219 generated clips.
The first wave's remaining common priorities are `airLight`, `airHeavy` and
`lowHeavy`.

## P3 — low power and air completion

`lowHeavy`, `airLight` and `airHeavy` complete the first wave's nine physical
attacks. Low Heavy compresses over a rear support and lead pivot. Air attacks
remain unplanted, tuck the legs during anticipation, hold their active
silhouette and finish by preparing the descent rather than snapping to guard in
mid-air.

| Fighter      |  P2 |  P3 |
| ------------ | --: | --: |
| Melody       | 8.7 | 9.6 |
| Mizaistom    | 8.7 | 9.6 |
| Camilla      | 8.7 | 9.5 |
| Gel          | 8.6 | 9.5 |
| Illumi       | 8.7 | 9.5 |
| Terebellum   | 8.7 | 9.5 |
| Tserriednich | 8.6 | 9.5 |
| Cluck        | 8.6 | 9.5 |
| Luini        | 8.7 | 9.5 |
| Machi        | 8.6 | 9.5 |

All ten first-wave fighters now have 9/9 dedicated physical clips. The roster
total is 171 dedicated clips and 189 generated clips.
