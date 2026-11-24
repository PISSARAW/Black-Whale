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

## P16 — roster-wide premium finish

The Kurapika/Hisoka extremity treatment now covers all forty fighters. Hands
gain a readable palm and knuckle plane, while shoes receive the same restrained
silhouette lift used by the vertical slice. Scaling follows the declared body:
children remain delicate, slim fighters stay precise, and broad fighters carry
more mass. Kurapika and Hisoka retain their exact P14 proportions and authored
tailoring.

This completes rather than duplicates the shared close-up face finish already
mounted on every declared likeness. The additions remain children of the live
hand, knee and shoe joints, so all 360 physical attacks, held equipment and
special forms keep their existing transforms. Tour models are unchanged; the
finish exists only on Clash figures and adds at most two general-purpose meshes
to either fighter.

## P17 — articulated anatomy prototype

Kurapika now carries deformable shoulder, elbow and knee masses on the existing
combat skeleton. Each mass follows its live hinge, broadens across the bend and
compresses along the limb as the joint closes. Heavy, low and air attacks
therefore retain a continuous body volume through their most extreme keys
instead of reading as rigid tapered tubes meeting at an empty pivot.

The pass is visual and fight-only: it does not move a joint, change a bone
length, alter ground contact, touch hitboxes or enter simulation and replay
state. The elbow and knee geometry is shared, while the existing shoulder cap
is reused rather than duplicated. Kurapika remains the controlled prototype
before the anatomy treatment is propagated to the rest of the roster.

## P18 — responsive extremities and tailoring

Kurapika's hands now close through a cached vertex morph instead of carrying one
open silhouette through every contact. The thumb follows the grip while the
chain and service pistol retain their own scale: the hero hand enlargement is
now baked into skin geometry rather than inherited by every held child. Shoes
compress across planted weight and lengthen subtly through low and air kicks.

Two outlined lower-jacket panels and the existing tie respond to attack travel,
horizontal velocity and airborne cadence. Their motion is deterministic, so
hitstop and replay retain the same image; it adds no cloth simulation, gameplay
state or collision. P18 remains a Kurapika prototype and contributes four
clothing meshes while sharing both hand-morph and hem geometry.

## P19 — gameplay-camera identity lock

Kurapika's recognisable value pattern is now protected at the actual fight
camera: two darker tips break the outer blond bob, two restrained blue edges
hold the lapel line against the dark-navy jacket, and a silver band identifies
the chain hand without materialising an attack chain at rest. The existing
white collar and black tie receive a small width correction rather than a glow.

The P14 jacket seams are also remounted on the torso, so they finally follow
chest twist instead of remaining figure-level decoration. Five cached meshes
carry the new identity contract, each sized to retain at least a three-pixel
axis in a 560-pixel fight viewport. No aura, UI marker, light, combat state or
camera rule is introduced.

## P20 — controlled roster rollout

The P17–P19 foundation now covers all forty fighters. Every combat skeleton
receives proportional shoulder, elbow and knee continuity; every authored hand
can close through the shared grip morph; and every shoe responds to support or
kick load. Hand mass is baked into skin geometry across the roster, leaving the
joint itself at unit scale so books, firearms, chains, fans and other held
objects keep their authored proportions.

Franklin retains the one deliberate exception: his ten sectioned fingers are
the hand rig itself, not held equipment, and keep their authored scaled wrist so
their muzzle positions remain aligned with the emitted bullets.

Existing flexible garments are opted into deterministic follow-through by name:
ties, sashes, jacket tails, hems, coats, robes and skirts move only when their
model actually declares one. Kurapika retains the two P18 lower-jacket panels;
no generic coat is invented for another fighter. Each likeness also exposes the
same 560-pixel camera contract through its authored head, torso and hand anchors,
while Kurapika keeps his five bespoke P19 accents.

The rollout shares one joint buffer and a bounded set of hand morph variants.
It changes presentation transforms only, adds no simulation or replay state and
keeps the existing nine-move choreography contract intact.

## Refonte des styles par vagues de cinq

Le banc de départ a joué les 40 combattants contre Benjamin avec les mêmes
commandes. Il a mesuré cinq déplacements et neuf attaques physiques à trois
distances, soit 1 280 situations. La proximité mécanique compare les
trajectoires, les temps de frappe, les portées, les dégâts et les déplacements
à l’impact. Elle sert à choisir les comparaisons à visionner. Avant la refonte,
40 lourds bas reprenaient un balayage, 40 lourds arrière un revers et 36 lourds
aériens une plongeante. Un clip dédié pouvait donc rester très proche d’un
autre à la caméra de duel.

La direction de chaque vague lie l’allure, le placement, le choix de frappe et
la récupération aux conditions ou au comportement de son Hatsu. Les styles
martiaux sont des adaptations de Clash. Les techniques conservent leurs
conditions de déclenchement. Pour Theta, la lecture du combat part des gestes
de garde du corps et du pistolet attesté.

La colonne « Proche avant refonte » indique le voisin mécanique le plus proche
dans le banc, indépendamment de sa vague. La dernière colonne décrit la
direction de conception. Les sept premières vagues l’appliquent en jeu.

| Vague | Combattant   | Proche avant refonte | Direction à la caméra et en combat                                                                                                                                  |
| ----- | ------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Mizaistom    | Terebellum           | Cross Game inspire une ligne à défendre. Pas courts, avant-bras de barrage, interception montante et renvoi hors de la zone.                                        |
| 1     | Terebellum   | Mizaistom            | Sweet Home inspire un combat à portée de mains. Appuis larges, réception de la droite, saisie basse et transferts de poids lents et lourds.                         |
| 1     | Cluck        | Sayird               | Le relais du pigeon inspire des traversées vives. Appuis légers, rotations, frappe en passage puis sortie hors de portée.                                           |
| 1     | Sayird       | Cluck                | Little Eye inspire une garde d’observation. Gestes courts sous couverture, pas d’entrée bref et coups directs dès l’ouverture.                                      |
| 1     | Camilla      | Musse                | Cat’s Name inspire l’appât et la riposte. Avance droite et mesurée, retrait vif, gifles et paumes. Le retour d’entre les morts garde sa condition.                  |
| 2     | Musse        | Camilla              | Secret Window et le pistolet suggèrent une silhouette fermée et calme. Tenir un axe, observer, pivoter brièvement puis reprendre la ligne de tir.                   |
| 2     | Hinrigh      | Longhi               | Biohazard invite à contourner. Une main de contact, des pas autour du matériel, des frappes qui orientent le rival vers un objet disponible.                        |
| 2     | Longhi       | Hinrigh              | Moonlight inspire l’offre et la distance de négociation. Paume offerte, retrait contrôlé, défense du poignet et châtiment des entrées brusques.                     |
| 2     | Voconte      | Hinrigh              | Door inspire un jeu de seuils. Arrêts marqués, pivots, protection d’un côté de la porte et reprise d’axe dès un franchissement.                                     |
| 2     | Furykov      | Voconte              | L’observation du Nen suggère de petites sondes et des changements de largeur de garde. Mettre l’accent sur la reconnaissance d’une ouverture réelle.                |
| 3     | Beyond       | Padaille             | Le corps massif et la ténacité donnent une marche lourde, une pression continue et des coups qui engagent le tronc. La malédiction reste préparée.                  |
| 3     | Padaille     | Lynch                | Les transformations corporelles doivent changer l’angle, la portée et le risque de chaque outil. Bras droit et main libre restent lisibles en mouvement.            |
| 3     | Lynch        | Padaille             | Body and Soul inspire une marche directe vers la portée du poing. Poser la question, fermer l’angle puis frapper depuis des appuis stables.                         |
| 3     | Rihan        | Basho                | Predator inspire l’observation patiente. Petits retraits, feintes sobres, frappes de maintien de distance et vraie fenêtre pour l’analyse.                          |
| 3     | Basho        | Rihan                | Le haïku exige une main libre et un temps d’écriture. Retraits de protection, garde asymétrique et bras armé seulement à la reprise.                                |
| 4     | Bonolenov    | Rihan                | Battle Cantabile donne des pas syncopés, rotations et contacts calés sur la danse. La silhouette descend ou s’ouvre selon le rythme joué.                           |
| 4     | Halkenburg   | Bonolenov            | La flèche collective inspire la protection du temps de charge. Posture d’archer, reculs rectilignes et bras qui dégagent un axe de tir.                             |
| 4     | Bill         | Rihan                | Erigeron inspire une progression régulière au contact. Pas solide, paumes ouvertes, posture de protection pendant le soutien.                                       |
| 4     | Yokotani     | Mizaistom            | LSDF inspire une ligne à tenir et une expulsion. Barrière d’avant-bras et pas latéral dans la pose, avec une vraie distinction entre combat et juridiction.         |
| 4     | Melody       | Theta                | Le souffle et la flûte inspirent le tempo. Déplacements souples et continus, gestes arrondis et reprises courtes qui dégagent les mains.                            |
| 5     | Saiyu        | Zakuro               | Bâton et singes imposent une longue distance. Travail des deux mains sur la hampe, changements de prise et frappes qui couvrent les angles.                         |
| 5     | Zakuro       | Saiyu                | Bloody Mary inspire la traction et l’enroulement. Dos et bras accompagnent le matériel déjà déployé, appuis dissymétriques, reprises courtes.                       |
| 5     | Gel          | Lynch                | La transformation du bras droit change sa silhouette. Épaules dissymétriques, esquives courbes et allonge qui se retire après le contact.                           |
| 5     | Illumi       | Voconte              | Les aiguilles demandent un alignement précis. Un bras reste bas, le poignet dominant conduit le contact et le pas se coupe net au lancer.                           |
| 5     | Machi        | Illumi               | Les fils demandent des écarts de mains et un axe de traction. Petite garde, pivots francs et frappes brèves qui n’occupent pas les deux mains inutilement.          |
| 6     | Luini        | Voconte              | La pièce ancrée inspire l’aller-retour. Appuis fuyants, couteau près du corps et attaque brève à l’arrivée, avec les franchissements autorisés.                     |
| 6     | Theta        | Sayird               | Le comportement de garde du corps inspire la discipline des angles. Crosse et pistolet visibles, déplacements courts et garde stable en service.                    |
| 6     | Tserriednich | Hinrigh              | Parallel Future inspire la préparation suivie d’une reprise rapide. Phase immobile, trajet direct après réouverture des yeux et feintes de tempo.                   |
| 6     | Leorio       | Shizuku              | Le poing transmis par une surface inspire l’axe de boxe et l’abaissement franc. Frappes directes en haut, ancrage net avant la transmission.                        |
| 6     | Hanzo        | Machi                | La projection impose de protéger le corps réel. Distinguer appuis de l’assassin, immobilité du corps endormi et flottement du double.                               |
| 7     | Kurapika     | Shizuku              | Les chaînes se tendent et se relâchent à des distances distinctes. Main dominante, ancrages et rappel doivent rester visibles dans les déplacements et les frappes. |
| 7     | Hisoka       | Machi                | Bungee Gum inspire la tension puis la relance. Mains dissymétriques, corps qui s’allonge ou se replie et reprises de distance élastiques.                           |
| 7     | Benjamin     | Beyond               | Air Blow et la discipline militaire donnent des axes directs. Marche lourde, arrêt sec, charges sans détour et récupération engagée.                                |
| 7     | Biscuit      | Illumi               | La forme naturelle donne un contraste de masse et de cadence. Frappes sobres en forme courante, appuis et inertie lisiblement différents après transformation.      |
| 7     | Franklin     | Phinks               | Les émissions des dix doigts imposent une base stable. Pas lourds, mains ouvertes entre deux rafales et percussion de près avec les épaules.                        |
| 8     | Shizuku      | Leorio               | Blinky mène la silhouette. Préserver le maniement à deux mains dans les coups et réexaminer surtout les appuis, la récupération et les trajets courts.              |
| 8     | Feitan       | Hanzo                | Garder la garde basse et les coupes courtes. Pain Packer inspire le contraste entre l’économie du duel physique et l’explosion après blessure.                      |
| 8     | Phinks       | Franklin             | La rotation du bras droit donne le sens du mouvement. Distinguer les coups physiques simples, la mise en charge et la frappe qui engage toute sa masse.             |
| 8     | Kalluto      | Illumi               | L’éventail conduit l’orientation du corps. Préserver les ouvertures asymétriques, le pas léger et l’alternance entre papier et main libre.                          |
| 8     | Chrollo      | Basho                | Le livre impose une main occupée et des déplacements de conservation. Garder l’identité du livre ouvert, du changement de page et de la main rendue libre.          |

La vague 1 modifie les neuf coups normaux, les prises, les variantes purement
martiales de Cluck et Sayird, la marche avant et arrière, les deux ruées, la
garde, la posture accroupie, le saut, l’atterrissage, l’esquive arrière et la roulade. Les corps, le placement et les
choix de l’IA utilisent les nouveaux réglages dans le duel normal. Ce changement
de simulation passe au règlement `clash-combat-96`.

### Axe du corps et frappes J/K au sol

Le modèle garde son axe vertical quand les pieds sont au sol. La flexion et
l’inclinaison passent par le buste articulé à la taille. Les appuis et la rotation
du bassin donnent la direction à la frappe. Si les deux appuis restent derrière
le bassin dans le sens du mouvement, le buste se redresse autour de la taille
et les pieds restent au sol. L’alignement de la main ou du pied
vers le rival intervient après une touche ou une garde confirmée sur J et K.

Les trente-cinq combattants des sept premières vagues disposent de séquences
J/K entièrement dessinées. La validation compare les articulations
après la passe de contact et vérifie les ruées dans les deux sens de part et
d’autre de l’adversaire. La correction de l’axe est entrée avec `clash-combat-97`.

### Vague 2

Musse contrôle l’axe à la main avant et au coude, avance à petits pas et recule
vite. Hinrigh entre en diagonale dans sa pose, cherche le contact de la paume et
pivote autour de son appui. Longhi offre la paume, marque un temps et rétablit
la distance avec le talon ou un retrait. Voconte cadence son avance autour
d’un départ sec et d’un freinage net, avec l’avant-bras pour fermer le passage.
Furykov sonde de la main et du pied avant, puis revient avec le bras arrière
quand l’adversaire s’engage.

Chaque combattant dispose de neuf trajectoires de frappe, d’une tentative de
prise et d’une locomotion propres. La forme, le rythme de récupération et
l’engagement au sol sont réglés par coup. Les prises réussies conservent leurs
chorégraphies de projection et les quatre techniques martiales de Furykov
adoptent leur propre geste. Les pouvoirs gardent leurs déclencheurs du duel.
Ce changement de simulation passe au règlement `clash-combat-98`.

### Vague 3

Beyond avance avec une garde lourde, engage l’épaule et reprend appui après
l’impact. Padaille mesure de la main libre et décompose trois gestes à main nue,
dont le marteau descendant sur K. Lynch ferme l’écart rapidement et alterne ses
poings dans l’axe. Rihan dévie de la paume, pivote au coude et sort brièvement
de portée pour préparer la riposte. Basho maintient une main disponible et
pose ses appuis avant chaque accent du poing.

Les neuf coups de base, les tentatives de prise et les déplacements des cinq ont
leurs propres poses. Les projections réussies utilisent leurs séquences dédiées.
Les quatre commandes spéciales de Beyond représentent des frappes martiales.
La transformation de Padaille, la question de Lynch, Predator et la préparation
des poèmes utilisent leurs conditions propres. L’Académie adapte le pas de retour
de Lynch à sa nouvelle distance de reprise. Le règlement courant est
`clash-combat-99`.

### Vague 4

Bonolenov croise les pas, monte sur un appui et dessine un cercle avec les bras.
Son genou ou son talon marque le temps fort avant le retour à la mesure. Sa
ruée avant exécute une pirouette; le retrait s’ouvre sur un pivot plus court. Halkenburg tient une visée
mains nues, recule en ligne et lance son poing arrière après un temps de tension.
Bill avance à couvert derrière une paume puis pousse des deux mains. Yokotani
barre l’entrée de l’avant-bras et écarte de la paume ou de l’épaule. Melody
travaille sur une levée et un contretemps, avec des retraits souples qui dégagent
les mains.

La vague couvre les neuf coups, les entrées de prise, la posture de garde et
les déplacements des cinq. Les projections réussies utilisent leurs séquences
dédiées. La lance de Prologue, la flèche de Grimmel, la croissance d’Erigeron,
l’expulsion de LSDF et la flûte de Melody gardent leurs déclencheurs propres.
Après Prologue, les neuf coups ordinaires de Bonolenov utilisent la pointe,
la hampe ou le talon de la lance et leur portée suit le contact choisi. Il
garde sa prise en mouvement, en garde et en l’air.
Cette vague utilise le règlement `clash-combat-100`.

### Vague 5

Saiyu tient la distance avec le bout du bâton, le balaie à deux mains et change
de prise entre l’avance et le retrait. Zakuro accroche de la main avant et tire
avec le coude arrière, puis recule sur un changement d’appui. Gel enroule
l’épaule avant de détendre le bras droit et sort de portée sur K arrière.
Illumi avance dans l’axe, s’arrête court et frappe du bout des doigts ou du
tranchant de la main. Machi écarte de la paume, ramène du crochet et change
d’appui avec les mains séparées comme pour tendre un fil.

Les neuf coups, les entrées de prise, la garde, les deux directions de marche
et de ruée, le saut et l’atterrissage ont chacun leurs poses et leurs rythmes.
Les projections réussies utilisent leurs séquences dédiées. La gestuelle de
Gel est jouable à main nue sous Zetsu. Le bras-serpent peut prolonger ses
frappes au poignet quand son Nen est disponible. Cette vague utilise le règlement
`clash-combat-103`.

### Vague 6

Luini garde le couteau près du corps, pique en entrant puis ressort sur un
revers. Theta protège son axe de la paume gauche et frappe de la crosse droite
à courte portée. Tserriednich mesure de la main et laisse passer un temps
avant le revers. Leorio avance en garde de boxe, abaisse ses appuis puis
remonte en uppercut. Hanzo enchaîne une paume brève avec un talon de pivot
et se replie sur des pas courts.

Les neuf coups normaux, les entrées de prise, la marche, les ruées, la garde,
la position basse, le saut et l’atterrissage ont leurs propres poses. Les
projections réussies utilisent leurs séquences dédiées. Le passage de Luini,
la vision de Tserriednich, le poing transmis par Leorio et le double de Hanzo
restent des commandes distinctes. Les deux orientations de la crosse et de
la paume libre de Theta sont vérifiées. L’Académie recale les exercices de
punition de Hanzo, Luini et Theta sur leurs nouveaux appuis. Le règlement
utilisé était `clash-combat-104`.

### Vague 7

Kurapika mesure de la main droite, ramène ses appuis après la frappe et
conserve le crochet au corps sur K. Hisoka retient le poignet avant de le
détendre et rebondit du talon. Benjamin ferme l’axe de la paume, puis engage
l’épaule sur un appui solide. Franklin couvre de la main ouverte et abat
les deux bras sur K. Biscuit dévie avec la paume et remonte sous la garde en
forme compacte. Dans sa forme naturelle, elle élargit ses pas, abaisse son
centre de gravité et passe au direct du bras arrière puis au crochet du bras
avant.

Les neuf coups, les entrées de prise, la garde et les déplacements ont leurs
propres poses. La mobilité de Biscuit change lors de la révélation, avec une
ruée plus longue et un saut plus bas. Les déclencheurs des chaînes, de la gomme,
des héritages et des rafales restent propres à leurs techniques. L’Académie
adapte les exercices de Kurapika et d’Hisoka et règle séparément les distances
des deux formes de Biscuit. Le règlement courant est `clash-combat-105`.
