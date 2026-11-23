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
