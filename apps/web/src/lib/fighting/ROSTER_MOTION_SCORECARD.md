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

## P4 — second-wave grounded fundamentals

The next ten fighters receive dedicated `standingLight`, `standingHeavy` and
`forwardLight` timelines with semantic support, opposite-foot pivot, staged
pelvis-to-chest drive, held contact and three recovery keys.

| Fighter  | Baseline |  P4 |
| -------- | -------: | --: |
| Musse    |      6.9 | 7.9 |
| Padaille |      6.9 | 7.7 |
| Rihan    |      6.9 | 7.8 |
| Theta    |      6.9 | 7.9 |
| Yokotani |      6.9 | 7.8 |
| Basho    |      7.0 | 7.9 |
| Beyond   |      7.0 | 7.8 |
| Leorio   |      7.0 | 7.9 |
| Longhi   |      7.0 | 7.8 |
| Lynch    |      7.0 | 7.9 |

Their motion accents preserve the intended discipline: Musse observes, Padaille
keeps his weapon hand narrow, Rihan analyses, Theta stays drilled, Yokotani
braces, Basho protects the writing hand, Beyond and Lynch commit their mass,
Leorio boxes straight and Longhi turns with precise wrists.

The roster total is now 201 dedicated physical clips and 159 generated clips.

## P5 — second-wave low and directional control

The second wave adds dedicated `lowLight`, `forwardHeavy` and `backHeavy`
timelines. The shared directional contract now also guarantees that Forward
Light plants the lead foot and pivots the rear foot in both waves; low and
retreating routes remain based over the rear support.

| Fighter  |  P4 |  P5 |
| -------- | --: | --: |
| Musse    | 7.9 | 8.7 |
| Padaille | 7.7 | 8.7 |
| Rihan    | 7.8 | 8.7 |
| Theta    | 7.9 | 8.7 |
| Yokotani | 7.8 | 8.7 |
| Basho    | 7.9 | 8.6 |
| Beyond   | 7.8 | 8.6 |
| Leorio   | 7.9 | 8.6 |
| Longhi   | 7.8 | 8.6 |
| Lynch    | 7.9 | 8.6 |

The roster total is now 231 dedicated physical clips and 129 generated clips.
The second wave's remaining common priorities are `lowHeavy`, `airLight` and
`airHeavy`.

## P6 — second-wave low power and air completion

Dedicated `lowHeavy`, `airLight` and `airHeavy` clips complete the second wave.
Low Heavy keeps its rear support and lead pivot in both facings. Air attacks
tuck, hold contact, prepare descent and never acquire a planted-foot constraint.

| Fighter  |  P5 |  P6 |
| -------- | --: | --: |
| Musse    | 8.7 | 9.6 |
| Padaille | 8.7 | 9.5 |
| Rihan    | 8.7 | 9.5 |
| Theta    | 8.7 | 9.6 |
| Yokotani | 8.7 | 9.5 |
| Basho    | 8.6 | 9.5 |
| Beyond   | 8.6 | 9.4 |
| Leorio   | 8.6 | 9.5 |
| Longhi   | 8.6 | 9.5 |
| Lynch    | 8.6 | 9.5 |

All ten second-wave fighters now have 9/9 dedicated physical clips. The roster
total is 261 dedicated clips and 99 generated clips.

## P7 — final-wave grounded fundamentals

The final eleven fighters now own dedicated `standingLight`, `standingHeavy`
and `forwardLight` timelines. Each route has a seven-key anticipation, held
contact and recovery chain, with character-specific root, torso, wrist and leg
accents plus explicit support and pivot feet.

| Fighter    | Baseline |  P7 |
| ---------- | -------: | --: |
| Phinks     |      7.0 | 7.9 |
| Zakuro     |      7.0 | 7.8 |
| Franklin   |      7.2 | 8.0 |
| Sayird     |      7.2 | 8.0 |
| Voconte    |      7.2 | 8.0 |
| Bill       |      7.3 | 8.0 |
| Biscuit    |      7.3 | 8.0 |
| Furykov    |      7.3 | 8.0 |
| Halkenburg |      7.3 | 8.0 |
| Hinrigh    |      7.3 | 8.0 |
| Saiyu      |      7.3 | 8.0 |

The roster total is now 294 dedicated physical clips and 66 generated clips.

## P8 — final-wave low and directional control

Dedicated `lowLight`, `forwardHeavy` and `backHeavy` routes give the final wave
distinct compression, forward drive and backward braking. Their runtime support
now follows the move semantics: advancing attacks plant the lead foot, while low
and retreating attacks remain based over the rear foot.

| Fighter    |  P7 |  P8 |
| ---------- | --: | --: |
| Phinks     | 7.9 | 8.6 |
| Zakuro     | 7.8 | 8.6 |
| Franklin   | 8.0 | 8.7 |
| Sayird     | 8.0 | 8.7 |
| Voconte    | 8.0 | 8.7 |
| Bill       | 8.0 | 8.7 |
| Biscuit    | 8.0 | 8.8 |
| Furykov    | 8.0 | 8.8 |
| Halkenburg | 8.0 | 8.7 |
| Hinrigh    | 8.0 | 8.7 |
| Saiyu      | 8.0 | 8.8 |

The roster total is now 327 dedicated physical clips and 33 generated clips.

## P9 — final-wave low power, air completion and certification

Dedicated `lowHeavy`, `airLight` and `airHeavy` clips close the final gap. Low
Heavy anchors over the rear support in both facings; air attacks tuck during
anticipation, hold contact, remain unplanted and prepare their descent during
recovery.

| Fighter    |  P8 |  P9 |
| ---------- | --: | --: |
| Phinks     | 8.6 | 9.4 |
| Zakuro     | 8.6 | 9.4 |
| Franklin   | 8.7 | 9.4 |
| Sayird     | 8.7 | 9.5 |
| Voconte    | 8.7 | 9.4 |
| Bill       | 8.7 | 9.4 |
| Biscuit    | 8.8 | 9.5 |
| Furykov    | 8.8 | 9.6 |
| Halkenburg | 8.7 | 9.4 |
| Hinrigh    | 8.7 | 9.5 |
| Saiyu      | 8.8 | 9.5 |

All 40 fighters now pass the same nine-slot contract: 360/360 physical attacks
use dedicated choreography, with no generated roster or archetype fallback.

## P10 — outcome-driven contact weight

The same contact no longer falls into one universal recovery. Every one of the
360 physical attacks now branches visually after its active window: confirmed
hits carry momentum through the target, guarded attacks recoil from resistance,
and misses overextend before returning to guard. Heavy and directional attacks
amplify the response, while low and air routes preserve their own support rules.

This layer is presentation-only. It reads the public hit/block confirmation and
does not alter frame data, collision, damage, replay state or the golden
Kurapika heavy, which retains its more specific authored outcomes.

## P11 — synchronized impact punctuation

Physical contacts now share one public punctuation profile across particles,
camera and synthesized sound. Light, heavy and decisive contacts receive ranked
accents; head and low hits shift the lens toward the anatomical target; guards
recoil in the opposite direction; counters, punishes, knockdowns and wall hits
add a short wave, directional rays, low thump and transient crack.

The profile depends only on the already resolved public impact. Evasions remain
silent, comfort settings still control flashes and shake, and neither combat
state nor replay hashes are changed by the presentation layer.

## P12 — velocity-led limb smears

Fast hands and knees now leave a short, tapered smear between their previous
and current rendered positions. The scene selects only the fastest limb for a
light and at most two for a heavy, colours the trace from the attack's declared
aura, rejects model-refresh teleports and reuses a fixed pool of 24 meshes.

Trails are presentation-only, freeze during hitstop, clear on rewind or round
change, and disappear immediately when flashes or reduced motion are enabled.
They clarify acceleration between authored keys without becoming persistent
motion blur or hiding the contact silhouette.

## P13 — fight-only body volume

Combat surfaces now receive a cached three-tone directional key plus a narrow
camera-facing rim. The bake replaces the tour's broad vertical split only on
solid front-facing fighter surfaces; ink shells, transparent details, eyes and
equipment retain their authored materials, while the face keeps its more
specific close-up treatment.

The result adds readable shoulder, limb and clothing volume without runtime
lights, shadow maps, extra meshes or per-frame material work. Shared geometry
still shares one cached combat variant across the roster.

## P14 — premium hero vertical slice

Kurapika and Hisoka establish the reusable finish target for the roster. Their
combat models now enlarge the hands slightly, expose a knuckle plane and retain
the existing articulated skeleton, fixed limb lengths and authored attacks.
Kurapika's canonical suit is corrected from neutral black to a readable dark
navy, with restrained construction seams and lower eyelids mounted on his
custom head. Hisoka's existing fitted waistcoat gains deep side planes, bright
fasteners, dark shoulder and wrist accents, a sharper nose bridge and a lower
lip plane; every joint detail follows the live rig.

The pass is fight-only apart from Kurapika's corrected source palette, adds no
simulation state, and caps the new vertical-slice decoration at fourteen meshes
per fighter. Other roster models remain unchanged so the result can be reviewed
as a controlled visual benchmark before P16 propagation.

## P15 — complete fight staging

Every stage now receives the same restrained combat composition above its own
authored scenery: one soft floor pool frames the full lane, while one faint
identity-coloured halo behind each fighter separates hair, shoulders and limbs
from busy rooms without flattening the backdrop. High-contrast mode increases
the separation slightly; reduced motion needs no alternate path because the
layer is stable rather than animated.

Contact shadows are also kept on the deck during jumps instead of rising with
their model root. They broaden with height, return to their authored footprint
on landing and remain excluded from gameplay bounds. The complete layer costs
three meshes, no dynamic lights or shadow maps, reads interpolated presentation
positions only and never mutates combat, replay or camera state.
