# ADR-003 : La visite habitée — les personnages nommés dans /tour, leur Nen, leurs hatsu

**Statut :** Accepté — livré le 2026-08-03 (phases 0 à 3)
**Date :** 2026-08-03
**Décideur :** mainteneur unique du dépôt
**Dépend de :** ADR-001 (« le canon compile ») — s'y conforme ; ADR-002 (découpage 500) — s'y conforme
**Périmètre :** `/tour` (apps/web/src/lib/tour, lib/nen), `data/characters`, `data/ship`, `packages/contracts`
**Hors périmètre (explicitement pour plus tard) :** les hatsu qui dépendent d'autres personnages, et les interactions des hatsu avec les autres personnages — voir §6.

---

## 1. Contexte

La visite est aujourd'hui **vide de personnes**. Les seules silhouettes humaines
qu'elle dessine sont fournies par les jeux joués dans la marche (combattants de
Hunt, fantôme du run précédent), la donneuse de Morena et les avatars de Silent
Majority. Or le huis clos du manga n'est pas un vaisseau vide : c'est un
vaisseau **gardé** — des postes fixes devant chaque quartier de prince, des
servantes à l'intérieur, des reines qu'on ne croise pas, un roi qu'on ne voit
qu'une fois.

Deux décisions antérieures encadrent ce constat, et dans les deux sens :

- `docs/tour-immersion.md`, « Ce qu'on ne fait pas » : **pas de passagers** —
  « deux cent mille silhouettes qui ne sont pas dans le manga seraient la plus
  grosse invention du site ». Cette décision **reste en vigueur**.
- ADR-001, principe 1 : une déclaration par fait, tout le reste est projection.
  Or la donnée existe déjà, complète et jamais consommée par le tour :

| Fait vérifié le 2026-08-03 | Valeur |
| --- | --- |
| Personnages dans `data/characters/characters.json` | 224, tous avec `shipLocation` |
| … dont avec `mapTrajectory` (position par chapitre) | 223 |
| Étapes de trajectoire au total | 374 |
| Étapes résolues **directement** vers ≥ 1 espace du blueprint via `space.locationId` | 363 (**97 %**) |
| Ids de lieu non résolus | 2 seulement : `tier-3-political-ward` (×7), `black-whale-1` (×4) — tous deux présents dans `locations.json` au niveau secteur |
| Primitives de rendu déjà en place | kind `avatar` (« a canonical character represented in the living reconstruction »), 9 rôles dans `humanProfiles.ts` (dont `guard`, `nen-guard`, `steward`), `humanFigure`/`humanAura` consommant `NenTechniqueState`, poses, identité stable |
| Chemin de cast déjà en place | `castInTour(world, kind, input)` + `TOUR_HATSU_KINDS` (78 kinds portés) |

Le chantier n'est donc pas d'inventer une population : c'est de **brancher une
projection** — exactement le geste que l'ADR-001 prescrit.

---

## 2. Décision

Peupler la visite avec les **personnages nommés du canon, et eux seuls**,
placés par leur `mapTrajectory` au chapitre courant de la marche, rendus par
les primitives existantes (`avatar` + `humanProfiles`), avec provenance au
viseur ; puis leur donner leur **Nen porté** (Ten/Zetsu/Ren selon poste et
contexte) et leurs **hatsu d'office** (cast automatique via le même
`castInTour` que le visiteur, piloté par une conduite pure, seedée et
budgétée).

Trois principes, dans l'ordre de la doctrine :

### 2.1 Nommés seulement — la ligne « pas de figurants » ne bouge pas

Chaque silhouette de la visite est un `character.id` de `data/`. Pas de foule
générée, pas de garde générique « pour meubler » : un couloir que le canon ne
peuple pas **reste vide**, comme un couloir sans luminaire reste noir. La
sensation des 200 000 passagers reste au canal déjà décidé (la rumeur sonore,
vagues 2.5 + 3.2 de `tour-immersion.md`). Corollaire : viser une silhouette
ouvre sa provenance — nom, présence « ici depuis ch. N » (`mapTrajectory`),
source — dans le même geste que le futur `TourProvenancePanel` de Tour 2.0.

### 2.2 Le canon compile la distribution — zéro nouvelle déclaration

La distribution (qui est où, à quel événement, habillé comment) est une
**projection pure** — le world state de la timeline × `blueprint.json` —
jamais une table écrite à la main dans `apps/web` :

- **Position : le dernier événement de la timeline, comme `/ship`.** Le tour
  ne re-dérive pas les positions depuis `mapTrajectory` : il consomme **la même
  projection que la carte** — `selectEvent` (dernier événement sous le cap,
  surchargeable par `?eventId`) puis `timeline.getWorldState({ eventId })`,
  servie par son load serveur (`routes/ship/+page.server.ts` fait exactement
  cela aujourd'hui). `mapTrajectory` reste la déclaration canonique ; la chaîne
  `data/ → events → getWorldState` est unique et déjà celle de `/ship` — une
  divergence carte/visite devient impossible par construction. Coût : le même
  replay que `/ship` paie déjà ; le chantier 4 de l'ADR-001 (snapshots)
  profitera aux deux en même temps.
- **Placement dans la géométrie** : les présences du world state (des
  `locationId`) → espaces du blueprint via le champ `space.locationId` qui
  existe déjà (97 % de résolution directe sur les 374 étapes de trajectoire
  aujourd'hui). Un id qui résout vers un secteur (plusieurs espaces) donne un
  poste **déterministe** (seed = `characterId`) parmi les espaces du secteur.
- **Garde-robe** : le rôle (`shipLocation.role`) se projette sur les profils
  existants de `humanProfiles.ts` (`guard`, `nen-guard`, `steward`, `witness`…)
  par une table de correspondance **fermée et exhaustive** — un rôle non mappé
  est un échec de build, pas un civil par défaut.
- **Contrats** : `packages/contracts` reçoit les invariants, vérifiés par le
  canon-lint de l'ADR-001 : toute étape de trajectoire résout vers un espace ou
  un secteur du blueprint ; tout `fromChapterId` existe dans `chapters.json` ;
  tout rôle a une garde-robe ; `mapPresenceFromChapterId` borne l'apparition.
  Les 2 ids non résolus (11 étapes) deviennent le premier échec de ce lint —
  et se corrigent **dans `data/`**, pas par un cas particulier dans le code.
- **Spoiler** : le dernier événement retenu est borné par **le cap de spoiler
  du lecteur** (le `SpoilerFilter` du layout racine existe déjà ; le tour ne le
  consomme pas encore — c'est ici qu'il commence). Un personnage n'apparaît pas
  avant `mapPresenceFromChapterId`, un mort au-delà du cap ne fuit pas sa mort,
  une identité gérée (`temporalIdentityManaged`, ex. le faux Woble) s'affiche
  sous l'identité valable **au cap**, pas sous sa révélation — bornes que le
  world state porte déjà pour la carte.

### 2.3 Le moteur reste le seul interprète — les personnages castent par la même porte que le visiteur

Le Nen et les hatsu automatiques n'introduisent **aucune** nouvelle
implémentation de technique :

- **Le Nen porté** (phase 2) passe par le contrat déjà consommé par
  `humanFigure` : `NenTechniqueState`. **Qui a une aura est un fait de canon,
  pas un fait de rôle** : aura si et seulement si le champ `nen` de
  `characters.json` est renseigné (un utilisateur confirmé par le manga) ;
  aucune aura pour qui n'a canoniquement pas de Nen **ou dont la maîtrise est
  inconnue** — l'absence du champ couvre les deux cas, et l'ambiguïté se résout
  dans la donnée, jamais par inférence dans le code (un garde n'a pas d'aura
  *parce que garde*). État vérifié le 2026-08-03 : 50/224 personnages ont le
  champ, et il est **incomplet** — Babimyna et Furykov, utilisateurs confirmés,
  ne l'ont pas. La complétion est un chantier de `data/` (phase 0), sourcé
  chapitre par chapitre. L'état de base est une **conduite de poste** : Ten en
  faction, Zetsu pour qui se cache, Ren en alerte (un cast du visiteur dans la
  pièce, une apparition hostile). La conduite est un module pur, testé, sans
  aucun fait de catalogue en dur.
- **Les hatsu d'office** (phase 3) : un personnage ne caste que les techniques
  **que le canon lui donne** (`abilities.json`, `ownerId`) et que la visite
  **porte déjà** (`kind ∈ TOUR_HATSU_KINDS`). Le cast passe par
  `castInTour` — mêmes règles, mêmes coûts, mêmes refus (« inert », « no
  target ») que le visiteur ; l'origine est la position du personnage, la cible
  est choisie dans sa pièce. La couche nouvelle — la **conduite** — décide
  uniquement *quand* et *où*, jamais *quoi ni comment* : zéro
  `cost`/`condition`/`rule` écrit en dur dans `apps/web` (cible mesurable de
  l'ADR-001, principe 3). Elle est **seedée** (`characterId × chapitre × tick`,
  jamais d'aléa non reproductible) et **budgétée** (K effets PNJ simultanés,
  cooldowns) pour que la même marche soit rejouable en test.
- Après le chantier 3 de l'ADR-001, la conduite lit le profil depuis
  `hatsuRegistry.gen.ts` sans changer d'API — elle est écrite contre le type
  `HatsuProfile`, pas contre le fichier.

**Ce que ce principe interdit :** un « comportement » qui serait une septième
déclaration de faits de catalogue (l'ADR-001 en compte déjà six). Les
paramètres de conduite (cadence de patrouille, rayon d'alerte) sont de la mise
en scène, pas du canon — ils vivent dans le module de conduite, en constantes
commentées, et n'affirment rien sur les techniques.

### 2.4 Les bêtes gardiennes — présentes et dormantes

Dans le salon de chaque prince qui en possède une, sa bête de Nen est là. Elle
**n'active jamais sa compétence** : elle se balade dans la pièce, et émet un
son quand le visiteur interagit avec elle. Rien d'autre.

- **Qui en possède une est un fait de canon, déclaré dans `data/`.** La liste
  n'est écrite nulle part dans `apps/web` : phase 0 ajoute au personnage du
  prince une déclaration `guardianBeast` (chapitre source, silhouette) validée
  par canon-lint — nécessaire parce que la dérivation depuis `abilities.json`
  seule est incomplète (la bête de Woble protège sans avoir de technique au
  catalogue, alors que neuf princes ont une ability `*-guardian-*`). Un prince
  sans déclaration n'a pas de bête ; une bête sans chapitre source ne passe pas
  le lint.
- **Le rendu est déjà payé.** `nenCreatureFigure.ts` tient les silhouettes des
  créatures de Nen (dont `tyson-guardian`, `wog`, `medusa`, `chimera`…) pour
  les effets de cast ; la bête posée les réutilise. La déambulation passe par
  le champ `spread` des apparitions (le même que les poissons d'Indoor Fish) ;
  le son d'interaction passe par le viseur existant et la banque
  `lib/audio/hatsu/guardians`.
- **Dormante, au sens du moteur.** La bête posée est l'état `DORMANT` de la
  primitive `EFFECT_STATE_CHANGED` (`docs/hatsu-potentiel.md`) : sa présence ne
  déclenche rien, et la **conduite de la phase 3 exclut les kinds de bêtes**
  (`coercive-beast`, `coin-growth`, `lie-marks`…) — ils restent castables par
  le visiteur comme aujourd'hui, mais jamais d'office. Le jour où une bête doit
  agir (interactions ultérieures, §6), c'est le passage `DORMANT → TRIGGERED`
  par le module, pas une extension de la conduite.
- **Note de fidélité, assumée :** dans le manga, une bête gardienne n'est
  visible que d'un utilisateur de Nen. La décision ici est de la montrer par
  défaut (elle est la raison d'entrer dans le salon) ; la lecture stricte —
  visible sous Gyo seulement, via le flag `hidden` qui existe déjà — reste une
  bascule d'une ligne si la doctrine tranche autrement plus tard.

---

## 3. Options considérées

| Option | Verdict |
| --- | --- |
| A. Figurants procéduraux (foule générée par pont, gardes génériques) | ⛔ contredit frontalement `tour-immersion.md` et « le canon compile » : la plus grosse invention possible du site |
| B. **Personnages nommés projetés depuis `data/`, Nen et hatsu par le moteur** | ✅ retenue — zéro déclaration nouvelle, 97 % du placement déjà résolu par la donnée, primitives de rendu et de cast déjà en place |
| C. Scripter des scènes (cutscenes posées à la main dans le tour) | ⛔ recrée `arenaDefinition` en pire : des faits de mise en scène en dur dans `apps/web`, non dérivés, non lintés ; et fige ce qui doit rester une projection du chapitre courant |
| D. Attendre la fin complète de l'ADR-001 avant toute présence | ⛔ inutilement conservateur : les phases 1-2 ne touchent à aucun fait de catalogue hatsu ; seule la phase 3 frôle le gel du chantier 3, et elle n'ajoute **aucune technique nouvelle** (voir §5) |

---

## 4. Conformité ADR-002 — comment ce chantier s'écrit

- **Tout le code nouveau** vit dans `apps/web/src/lib/tour/cast/` (nom au sens
  théâtral : la distribution), en modules ≤ 500 lignes brutes, complexité ≤ 10,
  ≤ 3 paramètres (objet `options` au-delà). **Aucun ajout à la liste
  d'exemptions ESLint** — elle ne peut que rétrécir (ADR-002 §1).
- `lib/tour/apparitions.ts` (1 827 l) et `lib/tour/morena.ts` sont au lot TS de
  l'ADR-002. Ce chantier **ne les grossit pas** : la distribution émet ses
  apparitions depuis `cast/`, et le branchement dans `apparitions.ts` (ou sa
  façade, si le lot TS est passé) tient en quelques lignes d'appel. Si le lot
  TS est en vol sur ces fichiers, ce chantier attend son commit (règle des
  24 h de l'ADR-002).
- `lib/tour/hatsu.ts` (5 345 l, exempté legacy) n'est **pas modifié** : la
  conduite consomme `castInTour` et `TOUR_HATSU_KINDS`, déjà exportés.
- Les tests suivent le patron du tour : modules purs testables sans canvas
  (`distribution.test.ts`, `conduite.test.ts` en miroir), même exigence de
  déterminisme que `hatsu.test.ts`.

Modules cibles (indicatifs — noms ajustables, principes non) :

| Module | Responsabilité |
| --- | --- |
| `cast/distribution.ts` | pure : (world state du dernier événement, blueprint) → postes `{characterId, spaceId, tierId, at, role}` |
| `cast/stations.ts` | pure : choix déterministe d'un poste dans un espace ou un secteur (seed = characterId) |
| `cast/wardrobe.ts` | table fermée rôle canonique → profil `humanProfiles` + tenue (`gown` reines, `suit` roi…) |
| `cast/presence.ts` | bornes temporelles lues depuis la projection : `mapPresenceFromChapterId`, identités gérées, cap de spoiler |
| `cast/beasts.ts` | pure : déclarations `guardianBeast` → apparitions dormantes (silhouette, `spread`, son au viseur) |
| `cast/nen.ts` (phase 2) | conduite d'aura : poste → Ten/Zetsu ; événements → Ren ; émet des `NenTechniqueState` |
| `cast/conduite.ts` (phase 3) | quand/où caster : seed, budget K, cooldowns → appels `castInTour` |
| `cast/index.ts` | façade |

---

## 5. Plan par phases (chacune livrable seule)

| # | Phase | Contenu | Effort | Risque |
| --- | --- | --- | --- | --- |
| 0 | **Donnée & contrats** | Résoudre les 2 ids de lieu (11 étapes) dans `data/` ; compléter la 224ᵉ `mapTrajectory` ; **compléter le champ `nen`** des utilisateurs confirmés (50/224 aujourd'hui ; Babimyna, Furykov… manquants), sourcé chapitre par chapitre ; **déclarer `guardianBeast`** sur chaque prince qui en montre une (chapitre source, silhouette) ; invariants zod dans `packages/contracts` (trajectoires ↔ blueprint, rôles ↔ garde-robe, chapitres existants, bêtes sourcées) ; canon-lint vert | ~1-2 j | nul |
| 1 | **La distribution** | Load serveur du tour : `selectEvent` (dernier événement ≤ cap) + `getWorldState` — la même projection que `/ship` ; `cast/{distribution,stations,wardrobe,presence}` ; rendu en apparitions `avatar` (identité stable = characterId) ; viser → provenance (nom, « ici depuis ch. N », source) ; perf : figures animées dans la pièce du visiteur et ses voisines seulement (patron `silentRooms` existant), postes statiques ailleurs | ~3-4 j | faible |
| 1b | **Les bêtes gardiennes** | `cast/beasts.ts` : une apparition dormante par déclaration `guardianBeast`, dans l'espace du prince ; silhouettes `nenCreatureFigure` réutilisées ; déambulation par `spread` ; son au viseur (`lib/audio/hatsu/guardians`) ; aucune compétence activée | ~2 j | faible |
| 2 | **Le Nen porté** | `cast/nen.ts` : aura si et seulement si `nen` renseigné dans characters.json — Ten en faction, Zetsu pour les identités cachées, Ren en alerte (cast du visiteur à portée, apparition hostile dans la pièce) ; pas d'aura pour les non-utilisateurs et les cas inconnus ; rendu par `humanAura` existant ; Gyo du visiteur révèle ce que `appearsAs`/`hidden` masquent, comme pour le reste de la marche | ~2-3 j | faible |
| 3 | **Les hatsu d'office** | `cast/conduite.ts` : cast automatique, seedé, budgété, via `castInTour`, restreint aux techniques du porteur dont le `kind` est **déjà** dans `TOUR_HATSU_KINDS` — **zéro technique nouvelle, zéro kind nouveau** : le gel du chantier 3 de l'ADR-001 est respecté à la lettre. Le read-out attribue chaque cast à son auteur | ~1 sem | moyen — c'est la phase à ne pas commencer si le chantier 3 (unification Nen) est en vol sur les mêmes profils |

**Scène d'acceptation canon** (le patron des 8 vagues de `hatsu-potentiel.md` :
une scène rejouable comme test) : au dernier événement sous cap ch. 361, la
pièce 1014 contient Oito, Woble et leurs gardes nommés (Kurapika y est depuis
ch-358 dans la donnée) — **les mêmes présences que `/ship` au même événement,
c'est le test** —, les sept reines sont dans Queen's Room 01-07, Nasubi dans
les King's Living Quarters, les couloirs du pont 1 sont gardés et **le reste du
vaisseau est vide**. La bête de Woble déambule au 1014, muette et dormante ;
viser et interagir produit son cri, et rien d'autre. En phase 2, Kurapika et
les gardes utilisateurs portent une aura, Oito et Woble n'en portent aucune ;
en phase 3, un cast du visiteur dans le couloir met le poste en Ren.

**Vérification** (dans la ligne Tour 2.0) : tests unitaires purs sur
`distribution`/`presence`/`conduite` (déterminisme : même seed → même marche) ;
smoke Playwright `/tour` : marche jusqu'au 1014 au cap ch. 361 → gardes
présents, viser un garde → provenance ; garde-fou doctrinal inversé : **un
couloir que le canon ne peuple pas ne contient personne** (l'équivalent du
« couloir sans luminaire doit rester noir ») ; budget `renderer.info` inchangé
hors pièce habitée.

---

## 6. Hors périmètre — et conçu pour l'accueillir

Ce que cet ADR **ne fait pas**, et laisse prêt :

1. **Les hatsu qui dépendent d'autres personnages.** Les cinq techniques
   aujourd'hui inertes dans la visite le sont précisément parce qu'elles
   agissent sur des personnes : Needle People (`needle`), Body and Soul
   (`truth-punch`), Yomotsu Hegui (`postmortem-curse`), Damage: Sweet Home
   (`damage-transfer`), Aura Projectile (`training-shot`). Le jour où la marche
   contient des personnes nommées, elles deviennent portables : c'est un
   ADR/vague ultérieur, **après** le chantier 3 de l'ADR-001 (ce sont des kinds
   nouveaux pour le tour, donc sous le gel). Le modèle de cible de la phase 1
   (une apparition `avatar` a un `characterId` stable et visable) est
   l'interface qu'elles attendront.
2. **Les interactions des hatsu existants avec les personnages.** Un Order
   Stamp sur un garde, un Chain Jail sur un membre de la Brigade, la Contagion
   de Morena gagnant un personnage nommé : chacun est une règle de module
   (ADR-001, principe 3 — le moteur interprète), pas une règle de tour. Elles
   viendront par les modules, la distribution n'aura rien à apprendre.
3. **Emplois du temps, dialogues, déplacements scénarisés.** La trajectoire
   par chapitre suffit à cet ADR ; toute granularité plus fine devra être
   sourcée (événements de `events.json`) avant d'être animée.

---

## 7. Conséquences

**Plus facile ensuite :** les cinq hatsu « à personnes » ont leur sol ; la
provenance au viseur s'étend naturellement aux personnages ; la fidélité
augmente là où le manga la met (des couloirs gardés, pas des foules) ; le tour
consomme enfin le cap de spoiler, ce qui le fait entrer dans le rang commun de
l'ADR-001.

**Plus difficile / coûts :** le tour devient dépendant du chapitre — chaque
capture de référence CI se fait **à cap fixé** ; la table garde-robe est une
liste fermée à maintenir quand `data/` gagne des rôles nouveaux (mais c'est un
échec de build, donc visible) ; la phase 3 ajoute une source d'événements dans
la boucle du tour (budgétée, mais réelle).

**À revisiter plus tard :** patrouilles (déplacement entre postes) quand une
source le justifie ; réactions des personnages aux hatsu du visiteur au-delà de
l'alerte (fuite, riposte) — c'est la frontière avec le jeu d'infiltration, qui
a déjà sa propre couche.

---

## Actions immédiates

1. [x] Valider cet ADR (ou l'amender) et le ranger en `docs/adr-003-la-visite-habitee.md`.
2. [x] Phase 0 — `guardianBeast` déclaré sur les dix princes, champ `nen` complété, invariants écrits dans `packages/contracts` (`inhabitants.ts`, quatre règles, chacune montrée en train de refuser dans `canon-lint.spec.ts`).
3. [x] Phase 1 — `lib/tour/cast/` ouvert (huit modules purs + façade, aucun au-delà de 500 lignes, aucune entrée ajoutée à la liste d'exemptions), load serveur du tour branché sur `selectEvent` + `getWorldState`.
4. [x] Phases 1b, 2 et 3 livrées : bêtes dormantes, aura portée, conduite seedée et budgétée — aucune technique nouvelle, aucun `kind` nouveau, le gel du chantier 3 de l'ADR-001 tient.

---

## Ce que la livraison a changé au plan

Cinq écarts, tous dans le sens de l'ADR plutôt que contre lui.

1. **`tier-3-political-ward` n'était pas un défaut de donnée.** C'est un secteur,
   et l'ADR prévoyait déjà le poste déterministe dans un secteur : la résolution
   descend l'arbre de `locations.json`, aucune retouche de `data/` n'a été
   nécessaire. **`black-whale-1` non plus** : c'est le vaisseau lui-même, et
   c'est exactement ce que les planches donnent pour les annonceurs — à bord,
   pièce inconnue. Plutôt que d'inventer un poste, l'invariant
   `trajectories-reach-the-ship` accepte explicitement la racine et la marche ne
   dessine personne. La règle est dite à voix haute au lieu de laisser un trou.
2. **`guardianBeast.standsWith`.** La bête de Woble était indéplaçable : le vrai
   Woble n'a aucune trajectoire. Le champ nomme le corps dont l'animal garde la
   position — l'enfant présenté comme Woble, au 1014, autour du berceau où
   ch. 358 fait sentir l'aura — sans inventer une position pour le prince ni
   classer la bête sous quelqu'un d'autre. Le lint l'exige dès qu'un
   propriétaire n'est jamais placé.
3. **Le champ `nen` de Babimyna et Furykov porte `confirmed: true` sans
   catégorie.** Aucune planche ne nomme leur catégorie ; l'affirmation est
   l'utilisateur, pas la catégorie, et l'invariant `nen-claims-say-what` refuse
   désormais un bloc `nen` qui n'en dirait ni l'un ni l'autre.
4. **L'exhaustivité de la garde-robe est un test, pas un invariant zod.** La
   table vit dans `apps/web` et `packages/contracts` ne lit jamais le site :
   `wardrobe.test.ts` échoue sur un rôle non habillé *et* sur un costume que
   plus personne ne porte, et le contrat garde la moitié qui le regarde (un
   corps placé déclare un rôle). Même logique pour les silhouettes de bêtes, où
   `scripts/silhouettes.test.ts` tient les deux listes ensemble.
5. **La banque de sons des bêtes est `lib/audio/hatsuSounds.ts`** (quatre voix
   de créature déjà enregistrées), et non `lib/audio/hatsu/guardians`, qui
   n'existe pas. Seize silhouettes pour quatre voix, assignées par ce que
   l'animal est bâti — en inventer une cinquième aurait été inventer une bête.

Restent explicitement hors périmètre, comme prévu au §6 : les cinq hatsu « à
personnes », les interactions des hatsu existants avec les personnages, et toute
granularité plus fine que la trajectoire par chapitre.

---

_Sources : lecture du dépôt au 2026-08-03 — `data/characters/characters.json`
(224 entrées, 100 % `shipLocation`, 223 `mapTrajectory`, 374 étapes, 97 % de
résolution directe vers `blueprint.json` via `space.locationId`, 2 ids non
résolus ; champ `nen` renseigné sur 50/224, absent chez Babimyna et Furykov
pourtant confirmés), `data/abilities/abilities.json` (9 abilities
`*-guardian-*`, aucune pour la bête de Woble), `data/ship/blueprint.json`
(409 espaces), `routes/ship/+page.server.ts` (`selectEvent` +
`timeline.getWorldState({ eventId })` — le mécanisme repris tel quel),
`lib/tour/apparitions.ts` (kind `avatar`, champs `spread` et `hidden`),
`lib/tour/nenCreatureFigure.ts` (silhouettes de créatures, dont
`tyson-guardian`), `lib/tour/humanProfiles.ts` (9 rôles),
`lib/tour/humanFigure.ts` (`NenTechniqueState`), `lib/tour/hatsu.ts`
(`castInTour`, 78 `TOUR_HATSU_KINDS`), `docs/tour-immersion.md` (« pas de
passagers »), `docs/adr-001-le-canon-compile.md`, `docs/adr-002-decoupage-500.md`._
