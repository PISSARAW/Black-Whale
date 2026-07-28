# Hatsu → potentiel maximal sur le site

> **Objectif.** Chaque hatsu du catalogue (`data/abilities/abilities.json`) doit impacter le site
> d'une manière ou d'une autre — carte, perspective, connaissance, identité, timeline, spoilers,
> simulation — tout en restant strictement fidèle au manga. Ce document mappe chaque capacité
> vers son expression maximale dans le moteur, identifie les primitives manquantes, et propose
> un ordre d'implémentation.

**Références moteur** : `packages/world-engine` (events + `WorldState`), `packages/nen-engine`
(plans, manifests, roue d'action, panneau « Pourquoi ? »), `packages/ability-sdk`
(`defineAbility`), `packages/ability-modules/bungee-gum` (module de référence).

---

## 1. Ce que le moteur sait déjà exprimer

| Primitive                                                                                                                                                                                                | Où                              | Utilisable pour                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------- |
| `EFFECT_CREATED` / `EFFECT_ENDED` + `EffectKind` (`ELASTIC_BINDING`, `ADHESIVE_BINDING`, `PERCEPTION_MASK`, `CONTROL_LINK`, `PORTAL`, `CURSE`, `AURA_MODIFIER`, `ABILITY_GRANT`, `CONSTRAINT`, `CUSTOM`) | world-engine                    | La quasi-totalité des hatsu persistants                         |
| `CONSCIOUSNESS_TRANSFERRED`                                                                                                                                                                              | world-engine + identity-engine  | Grimmel, Hanzo, possession                                      |
| `ENTITY_MOVED` (`SpatialEstimate` avec `precision`/`certainty`/`probability`)                                                                                                                            | world-engine + map-engine       | Téléportations, traques, estimations                            |
| `KNOWLEDGE_GRANTED` (`KNOWN`/`BELIEVED`/`SUSPECTED`/`DOUBTED`/`REJECTED`)                                                                                                                                | knowledge-engine                | Tout hatsu d'espionnage **et** de tromperie (croyances fausses) |
| `ABILITY_GRANTED`                                                                                                                                                                                        | world-engine                    | Vol, prêt, héritage de capacités                                |
| `BODY_STATE_CHANGED`                                                                                                                                                                                     | identity-engine                 | Morts, blessures, résurrections                                 |
| Kinds d'entités `NEN_ENTITY`, `AURA_ENTITY`, `PORTAL`, `CURSE`, `CONSTRUCT`, `COHORT`                                                                                                                    | world-engine                    | Bêtes de Nen, gardiens, marques, réseaux                        |
| Manifest d'interaction (`inputMode`, `overlays` dont `FUTURE` et `CONTROL_LINK`, `perspectiveTransition`)                                                                                                | nen-engine                      | UX dédiée par hatsu                                             |
| `PerspectiveModifier` (`hide`/`reveal`/`distort`/`replace`)                                                                                                                                              | nen-engine → perspective-engine | In, déguisements, illusions                                     |
| `revealedAtChapter` sur les events                                                                                                                                                                       | spoiler-engine                  | Révélation progressive des mécaniques                           |
| Branches de simulation (`SimulationStore`)                                                                                                                                                               | simulation-engine               | « Et si… » par hatsu                                            |

**Principe directeur** : un hatsu est poussé « à son max » quand il n'est plus un paragraphe de
description mais (1) un module qui émet des events typés rejoués par le world-engine, (2) un
manifest d'interaction qui change concrètement l'UI, (3) des conditions explicites affichées
dans le panneau « Pourquoi ? », et (4) une empreinte visible dans au moins un des cinq
« core questions » du README.

> **État au 27/07/2026 — objectif atteint : 81 hatsu sur 81 impactent le site.** Les sept
> primitives du §2 existent dans `world-engine`/`ability-sdk`, et chaque capacité du
> catalogue a un module qui émet des events typés, un manifest d'interaction, des conditions
> affichables et une empreinte dans au moins un engine. Le câblage est vérifié par un test
> (`apps/web/src/lib/server/nen-registry.test.ts`) : aucune capacité ne peut retomber à
> l'état de paragraphe de description. Les fiches ci-dessous restent la référence canon ;
> les mentions « à ajouter » du §2 sont historiques. Détail en fin de document (§6).

## 2. Primitives manquantes (à ajouter avant/pendant la vague de modules)

1. **`ABILITY_REVOKED`** — symétrique d'`ABILITY_GRANTED`. Indispensable pour Skill Hunter
   (la victime perd son pouvoir), Steal Chain, Benjamin Baton (transfert à la mort), Culdcept.
2. **`EFFECT_STATE_CHANGED`** (`ACTIVE`⇄`DORMANT`→`TRIGGERED`→`ENDED`) — l'état existe déjà sur
   `EffectInstance` mais aucun event ne le fait transiter. Nécessaire pour tout ce qui est
   piège/malédiction conditionnelle (Judgment Chain, Sun and Moon, Cat's Name, Desire Trap,
   marques de mensonge de Tserriednich).
3. **Coûts et compteurs** — champ `cost` du plan déjà prévu, mais aucun stockage : durée de vie
   (Emperor Time), niveaux/points (Contagion), valeur quotidienne (Guardian Coins), charge par
   rotation (Ripper Cyclotron), quota journalier (Love Dial). Proposition : `attributes` de
   l'effet + un event générique `EFFECT_ATTRIBUTE_CHANGED` (ou réutiliser `EFFECT_STATE_CHANGED`
   avec payload d'attributs).
4. **Post-mortem flag** — `attributes.postMortem: true` + invariant world-engine : un effet
   post-mortem **survit** à `BODY_STATE_CHANGED(DEAD)` de sa source (Sun and Moon, Without You,
   Cat's Name, Yomotsu Hegui, malédiction de Beyond, cœur de Hisoka).
5. **`ENTITY_APPEARANCE_CHANGED`** ou convention `PERCEPTION_MASK` + `attributes.appearsAs` —
   pour Texture Surprise, Metamorphosen, Convert Hands, Without You. Le perspective-engine
   rend `appearsAs` pour tous les observateurs sauf exceptions listées.
6. **Cohortes** — kind `COHORT` existe ; il faut la convention `attributes.memberIds` pour les
   réseaux (infectés de Morena, porteurs d'ailerons de Halkenburg, soldats de Benjamin,
   Eye-wogs de Tyson).
7. **Builders SDK à ajouter** (`ability-sdk`) : `perceptionMask()`, `controlLink()`, `portal()`,
   `curse()`, `constraint()`, `abilityGrant()`, `abilityRevoke()`, `knowledgeGrant()`,
   `soulSwap()` (double `CONSCIOUSNESS_TRANSFERRED` atomique), `spawnNenEntity()`,
   `postMortem()` (décorateur d'effet), `attributeCounter()`.

---

## 3. Archétypes et fiches par hatsu

Chaque fiche : **Canon** (contraintes manga), **Events** (ce que le module émet),
**Manifest** (UX), **Impact site** (la feature que ce hatsu débloque), **Priorité**
(P1 = vertical à fort impact d'arc, P2 = important, P3 = complétude).

### A. Liens, entraves et combat physique

Pattern : `EFFECT_CREATED` kind `ELASTIC_BINDING`/`CONSTRAINT`, overlays `TENSION`/`RANGE`/
`TRAJECTORY`, inputMode `DRAG` ou `CLICK`. Le map-engine dessine le lien entre les ancres.

#### Bungee Gum — Hisoka `bungee-gum` ✅ (module de référence)

- **Canon** : élastique + adhésif, rupture au-delà de ~10 m une fois séparé du corps, dissimulable
  avec In, programmable post-mortem (cœur/poumons, prothèses).
- **À pousser plus loin** : (1) condition `maxDistance(10)` sur les filaments détachés ;
  (2) variante In : effet doublé d'un `PERCEPTION_MASK` → visible uniquement en mode omniscient
  ou avec « Gyo » activé dans l'UI ; (3) post-mortem : après la mort de Hisoka (ch. 357),
  l'effet `attributes.postMortem` maintient la réanimation — la timeline montre le même hatsu
  dans deux ères distinctes ; (4) Texture Surprise en combo (prothèses).
- **Impact site** : le filament tendu entre deux entités sur la carte, avec jauge de tension ;
  le toggle « Gyo » qui révèle les pièges In posés dans les couloirs du Tier 3.
- **Priorité** : P1 (étendre le module existant).

#### Nen Stitches — Machi `nen-stitches`

- **Canon** : fils d'aura masquables par In ; résistance décroissante avec la longueur ;
  contrôle de cible façon marionnette ; sutures chirurgicales.
- **Events** : `ELASTIC_BINDING` (fil, `attributes.masked: true|false`), `CONTROL_LINK`
  (marionnette), effet de soin → `BODY_STATE_CHANGED` (INJURED→ALIVE).
- **Manifest** : `DRAG`, cibles `CHARACTER|OBJECT`, overlays `TENSION|CONTROL_LINK|AURA`.
- **Impact site** : deuxième consommateur du composant « filament » de Bungee Gum (mutualiser
  l'UI) ; démontre le heal typé.
- **Priorité** : P2.

#### Chain Jail / Steal Chain / Judgment Chain / Holy Chain / Dowsing Chain / Stealth Dolphin — Kurapika

Le **chapelet de Kurapika est un P1 absolu** : c'est le protagoniste de l'arc et le seul
personnage dont les cinq doigts couvrent cinq engines différents.

- **Chain Jail** (`chain-jail`) : `CONSTRAINT` sur cible + condition canon « cible ∈ Brigade »
  (serment). Violation → voir Judgment Chain sur lui-même. Le panneau « Pourquoi ? » affiche le
  serment : c'est exactement la pédagogie des vows du manga.
- **Judgment Chain** (`judgment-chain`) : effet `CURSE` **DORMANT** avec `attributes.rules[]`
  déclarées à l'activation ; `EFFECT_STATE_CHANGED→TRIGGERED` + `BODY_STATE_CHANGED(DEAD)` si
  violation. L'UI liste les règles actives sur chaque cœur enchaîné (Oito ? Bill ? — non :
  canoniquement posée sur lui-même et sur les cibles interrogées).
- **Dowsing Chain** (`dowsing-chain`) : n'émet pas d'effet physique mais du **knowledge** :
  `KNOWLEDGE_GRANTED(KNOWN, position de X)` + `ENTITY_MOVED` en `certainty: PROBABLE` pour la
  cible localisée. Détection de mensonge → `KNOWLEDGE_GRANTED(KNOWN, "X ment sur F")`.
- **Holy Chain** (`holy-chain`) : `BODY_STATE_CHANGED` (guérison) ; sous Emperor Time, guérison
  instantanée.
- **Steal Chain** (`steal-chain`) : `ABILITY_REVOKED` (victime) + `ABILITY_GRANT` (effet stocké) —
  c'est le vol de Little Eye au ch. 369.
- **Stealth Dolphin** (`stealth-dolphin`) : `ABILITY_GRANTED` à un tiers (Oito) avec
  `attributes.loan: true`, consommation → `ABILITY_REVOKED` automatique + ouverture des nœuds
  d'aura de l'emprunteur (Oito devient utilisatrice de Nen dans le worldState !).
- **Manifest** : `TARGET_SELECTION`, overlays `CONTROL_LINK|RANGE`, `customComponent:
'ChainInteraction'` avec sélection du doigt.
- **Impact site** : la chaîne Little Eye → Steal Chain → prêt à Oito → exécution par Oito est
  **la** démo du moteur : quatre events types différents sur une seule séquence canonique
  (ch. 369), traçable dans la timeline et visible dans la perspective d'Oito.
- **Priorité** : P1.

#### Emperor Time — Kurapika `emperor-time` (moduleKey existant)

- **Canon** : 100 % d'efficacité dans toutes les catégories ; **1 h d'espérance de vie par
  seconde** ; déclenché par les yeux écarlates (émotion) ou à volonté.
- **Events** : `AURA_MODIFIER` (`attributes: { allCategories: 1.0 }`) + compteur
  `lifespanSpentHours` incrémenté par `EFFECT_ATTRIBUTE_CHANGED` à chaque event couvert par
  l'activation.
- **Impact site** : **le coût le plus dramatique de l'arc, rendu visible** : un bandeau
  « Emperor Time actif — N heures de vie consommées depuis le ch. 358 » cumulé sur la timeline.
  Le lecteur voit littéralement Kurapika vieillir event par event. C'est l'exemple canonique du
  champ `cost` du `AbilityActionPlan`.
- **Priorité** : P1 (le module existe, ajouter le compteur).

#### Ripper Cyclotron — Phinks `ripper-cyclotron`

- **Canon** : +aura par rotation de bras, difficile à calibrer.
- **Events** : `AURA_MODIFIER` avec `attributes.charge: n` (incrément par interaction `rotate`).
- **Manifest** : `HOLD` (maintenir pour tourner), overlay `AURA`.
- **Impact site** : démo du pattern « charge accumulée » ; jauge sur la fiche personnage.
- **Priorité** : P3.

#### Double Machine Gun — Franklin `double-machine-gun`

- **Canon** : mutilation volontaire = restriction qui augmente la puissance.
- **Events** : `AURA_MODIFIER` + dégâts de zone (`BODY_STATE_CHANGED` en masse — massacre des
  soldats Cha-R).
- **Impact site** : fiche « Restrictions & serments » (voir §4) — Franklin est l'exemple
  pédagogique du vow volontaire.
- **Priorité** : P3.

#### Dance of the Serpent's Bite / Surveillance Paper Dolls — Kalluto

- **Canon** : confettis marqueurs ; poupée de papier = écoute à distance indétectable.
- **Events** : surveillance → `KNOWLEDGE_GRANTED` répétés à Kalluto sur tout ce qui se dit
  autour de la cible marquée (`CONTROL_LINK` kind avec `attributes.mode: 'listen'`) ; attaque →
  `CONSTRAINT`/dégâts.
- **Impact site** : dans la vue perspective de la Brigade, des faits arrivent « par Kalluto » —
  la provenance des connaissances (`sourceIds`) devient visible.
- **Priorité** : P2.

#### Battle Cantabile (Prologue / Jupiter / Metamorphosen) — Bonolenov

- **Canon** : nécessite danse + mélodie (condition d'activation) ; Metamorphosen = prendre
  l'apparence d'une personne côtoyée, durée ≤ temps passé avec le modèle.
- **Events** : Prologue/Jupiter → `EFFECT_CREATED` (CONSTRUCT arme/sphère) ; **Metamorphosen →
  `PERCEPTION_MASK` avec `attributes.appearsAs: 'hisoka'` + durée**.
- **Impact site** : sur le Black Whale, Bonolenov **est** le brouillard de guerre : il imite
  Hisoka, Zakuro, Lynch, Owl. La carte en mode « apparent » montre Hisoka au Tier 5 alors que
  le mode omniscient montre Bonolenov. C'est le hatsu qui justifie à lui seul le mode
  `perspectiveMode: 'apparent'` du status header.
- **Priorité** : P1.

#### Padaille (armes corporelles), Gel (bras-serpent), Saiyu (bâton + trois singes)

- **Events** : transformations → `CUSTOM`/`CONSTRUCT` ; **Trois Singes → trois effets
  `CONSTRAINT` distincts (`attributes.sense: 'sight'|'hearing'|'speech'`)** qui coupent des
  canaux de perception : la cible sous Mizaru ne génère plus de `KNOWLEDGE_GRANTED` visuels —
  intégration directe knowledge-engine.
- **Priorité** : P3 (P2 pour Saiyu si l'arc Zodiaques/Beyond est développé).

### B. Espionnage et connaissance (le knowledge-engine comme cible)

Pattern : ces hatsu n'altèrent presque pas le monde physique — leur output est du
`KNOWLEDGE_GRANTED`. Les pousser au max = rendre le **flux d'information** visible : qui sait
quoi, depuis quand, par quel canal, et avec quelle fiabilité.

#### Little Eye — Sayird → Kurapika → Oito `little-eye`

- **Canon** : sphère d'aura sur un petit animal (≤ hamster) ; perception de tout ce que voit et
  entend l'animal ; reste actif si l'utilisateur perd conscience ; volé puis prêté.
- **Events** : `CONTROL_LINK` (source: utilisateur, target: NEN_ENTITY animal) ; l'animal est
  une entité **mobile sur la carte** (`ENTITY_MOVED` pièce par pièce) ; chaque pièce traversée
  génère des `KNOWLEDGE_GRANTED` à l'utilisateur (occupants, conversations).
- **Manifest** : `TARGET_SELECTION` puis **perspectiveTransition `canFollowAura: true`** — on
  suit littéralement le cafard.
- **Impact site** : **la séquence reine du ch. 390** : rejouer la ronde des cafards d'Oito,
  pièce par pièce dans le secteur royal, et voir la matrice de connaissances de Kurapika se
  remplir en direct. Suivre l'animal = premier vrai usage de `canFollowAura`.
- **Priorité** : P1.

#### Secret Window — Musse → Benjamin `secret-window`

- **Canon** : trois hiboux ; écoute à travers les cloisons ; replay des observations passées.
- **Events** : trois `NEN_ENTITY` hiboux positionnés ; `KNOWLEDGE_GRANTED` au propriétaire ;
  **le replay canon = votre timeline-engine** : « revoir les enregistrements » est exactement
  `GET /world-state?eventId=passé` filtré par ce que le hibou a observé.
- **Impact site** : le mur d'écrans de Benjamin comme interface : une grille de flux (un par
  hibou/soldat) qui sont autant de perspectives filtrées. Après la mort de Musse →
  `ABILITY_GRANTED` à Benjamin (Benjamin Baton, voir G).
- **Priorité** : P2.

#### Body and Soul — Lynch `body-and-soul`

- **Canon** : un coup de poing après une question force le corps à répondre la vérité.
- **Events** : `KNOWLEDGE_GRANTED(KNOWN)` à Lynch **même si la cible ment** — le contraste
  entre la parole (fausse) et la réponse du corps (vraie) est exactement la différence
  `BELIEVED` vs `KNOWN`.
- **Impact site** : dans l'enquête Heil-Ly, les faits extraits par Lynch apparaissent avec un
  badge « vérité extraite » ; joli cas limite pour le panneau de comparaison de perspectives.
- **Priorité** : P3.

#### Melody (Enchanting Music) `melody-enchanting-music` + ouïe absolue (trait)

- **Canon** : la flûte apaise/capte l'attention ; son ouïe détecte mensonges et battements.
- **Events** : flûte → `AURA_MODIFIER` de zone (`attributes.mood`) sur un `COHORT` d'auditeurs ;
  ouïe passive → règle de perspective : Melody obtient des `KNOWLEDGE_GRANTED(SUSPECTED/KNOWN)`
  sur l'état émotionnel et les mensonges dans sa pièce.
- **Impact site** : la tentative d'évasion de Kacho/Fugetsu (ch. 390) vue par Melody est la
  perspective la plus riche du banquet : elle « entend » ce que la carte ne montre pas.
- **Priorité** : P2.

#### Love Dial 6700 — Chrollo `love-dial-6700`

- **Canon** : recherche d'une personne par critères ; nombre guide ; quota journalier.
- **Events** : `KNOWLEDGE_GRANTED` (position en `certainty: PROBABLE`, `precision: TIER`) —
  parfait pour le champ `probability` de `SpatialEstimate`.
- **Impact site** : la traque de la cible de Chrollo au Tier 3 = un cercle de recherche qui se
  resserre sur la carte au fil des appels. Compteur d'appels/jour = `attributeCounter`.
- **Priorité** : P2.

#### Cluck (oiseaux), Kalluto (voir A), Theta (projectile-test)

- Cluck : `CONTROL_LINK` de masse sur COHORT d'oiseaux — hors Black Whale, P3.
- Theta : son projectile est un **test de Zetsu** sur Tserriednich : event unique dont l'intérêt
  est le `KNOWLEDGE_GRANTED` (Theta apprend le niveau de contrôle du prince — et le cache).
  P3, mais la scène alimente la fiche Parallel Future.

### C. Déguisement, illusion, perception (le perspective-engine comme cible)

Pattern : `PERCEPTION_MASK` + `KNOWLEDGE_GRANTED(BELIEVED, fait faux)` aux observateurs.
La vérité n'existe qu'en mode omniscient ; chaque perspective voit `appearsAs`.

#### Texture Surprise — Hisoka `texture-surprise`

- **Canon** : n'importe quelle surface plane ; indétectable à l'aura une fois actif ; le
  toucher révèle la supercherie ; utilisé pour visage/membres/textes falsifiés.
- **Events** : `PERCEPTION_MASK` sur OBJECT ou BODY (`attributes: { appearsAs, tactileFail:
true, auraDetectable: false }`).
- **Impact site** : post-ch. 357, le « Hisoka reconstruit » : son corps porte des masques
  Texture Surprise permanents. En mode Gyo, rien ; au toucher, la vérité. Les faux documents
  (examens des gardes) deviennent des OBJECTs masqués que seule la perspective omnisciente lit
  correctement.
- **Priorité** : P1 (combo avec Bungee Gum, même vertical Hisoka).

#### Convert Hands — Chrollo `convert-hands`

- **Canon** : main droite → apparence de Chrollo ; gauche → apparence de la cible ; l'échange
  au contact ; les marques sur les paumes peuvent trahir.
- **Events** : deux `PERCEPTION_MASK` croisés — c'est le **swap d'apparence** (vs Grimmel, swap
  d'âme). L'identity-engine ne bouge pas ; seul le perspective-engine est trompé.
- **Impact site** : la scène canon (Chrollo/Hisoka au combat de sumo) prouve que le site sait
  distinguer _qui est où_ de _qui semble être où_. Sur le Black Whale : outil d'esquive dans la
  traque Hisoka vs Brigade.
- **Priorité** : P2.

#### Metamorphosen — Bonolenov → voir A (P1, brouillard de guerre du Tier 5).

#### Hanzo Skill 4 (double astral) `hanzo-skill-4`

- **Canon** : double traversant la matière pendant que le corps dort ; parole/contact sur le
  corps annule la projection.
- **Events** : spawn `AURA_ENTITY` double + **`CONSCIOUSNESS_TRANSFERRED` vers le double** ;
  le corps reste `bodyState: ALIVE` mais `mentalState: SLEEPING`. Annulation → retour.
- **Manifest** : `perspectiveTransition { canChangeBody: true, canFollowAura: true }`.
- **Impact site** : premier cas simple de conscience hors du corps — le tutoriel de
  l'identity-engine avant Grimmel. La garde de Marayam (ch. 390+) l'utilise canoniquement.
- **Priorité** : P1 (marchepied vers Grimmel).

#### In (technique de base, pas un hatsu)

- Convention transverse : tout effet peut porter `attributes.masked: true` → invisible dans
  toutes les perspectives sauf omnisciente ou observateur en Gyo. Un seul toggle UI (« Gyo »)
  sert Bungee Gum, Nen Stitches, les pièges, la marque de Beyond.

### D. Contrôle mental et manipulation

Pattern : `CONTROL_LINK` (source contrôleur → target contrôlé) + bascule de la roue d'action :
**les actions du contrôlé appartiennent au contrôleur**. Le perspective-engine doit montrer la
perte d'agentivité.

#### Needle People — Illumi `illumi-needle-people`

- **Canon** : aiguilles → contrôle total, corps jetables ; aussi remodelage de visage
  (aiguille dans le crâne = déguisement durable).
- **Events** : `CONTROL_LINK` (`attributes: { vector: 'needle', disposable: true }`) ; le
  remodelage = `PERCEPTION_MASK` durable (Illumi en « Gittarackur », ou infiltré parmi les
  soldats de Benjamin — utilisation exacte sur le Black Whale à suivre).
- **Impact site** : les pantins d'Illumi sur la carte avec un badge « contrôlé » et un lien
  pointillé vers Illumi en mode omniscient — invisible dans les perspectives naïves.
- **Priorité** : P2.

#### Black Voice — Chrollo (ex-Shalnark) `black-voice`

- **Canon** : antenne plantée = contrôle téléphonique complet ; seconde antenne en menace.
- **Events** : `CONTROL_LINK` (`attributes.vector: 'antenna'`) ; ordre vocal = l'action du
  contrôleur exécutée avec le corps de la cible (le module route l'`AbilityContext` : actorId =
  Chrollo, body = cible).
- **Priorité** : P3 (capacité disparue avec Shalnark — mais voir Skill Hunter : l'event
  `ABILITY_REVOKED` à la mort de Shalnark est un beau cas de timeline).

#### Order Stamp — Chrollo `order-stamp`

- **Canon** : anime des « objets » à tête, pas les vrais cadavres ; >200 pantins ; décapitation
  annule.
- **Events** : `CONTROL_LINK` de masse sur COHORT de copies Gallery Fake — le combo canon
  (Gallery Fake + Order Stamp, ch. 357) est un test de charge du moteur : 200 entités
  CONSTRUCT sur la carte de l'arène.
- **Priorité** : P3 (hors Black Whale, mais spectaculaire en simulation).

#### Momoze (« Are You Free? ») `momoze-guardian-solicitation`

- **Canon** : sollicitation répétée ; l'accord insère une araignée dans l'oreille → contrôle,
  drain d'aura.
- **Events** : bête = NEN_ENTITY ; phase 1 effet `CUSTOM` (sollicitation, DORMANT) ; accord →
  `EFFECT_STATE_CHANGED(TRIGGERED)` + `CONTROL_LINK`. Sa garde Hanzo ne voit rien : la bête
  n'émet des events visibles que dans les perspectives Nen.
- **Impact site** : la mort de Momoze (ch. 390) est un mystère en chambre close — le mode
  enquête (qui savait quoi, qui pouvait agir) est le cas d'usage rêvé du knowledge-engine.
- **Priorité** : P2.

#### Salé-salé (fumée de bienveillance) `salesale-guardian-smoke`

- **Canon** : conversion progressive ; les convertis portent des copies qui propagent ;
  retenir son souffle protège.
- **Events** : `AURA_MODIFIER` de zone + COHORT `convertis` qui **croît par contagion spatiale**
  (règle : présence prolongée dans la même pièce qu'un converti → probabilité de conversion).
- **Impact site** : une carte de chaleur épidémiologique sur le Tier 1 — deuxième moteur de
  contagion après Morena (mutualiser le composant).
- **Priorité** : P2.

#### Camilla (coercition du gardien) `camilla-guardian-coercion` — conditions inconnues.

- Effet `CUSTOM` DORMANT + fiche « inconnues » (voir §5 spoilers/canon). P3 en attendant canon.

#### Moonlight Act — Longhi `moonlight-act`

- **Canon** : contrat volontaire à termes explicites, récompenses/pénalités, exécuté par
  Manipulation.
- **Events** : `CONSTRAINT` (`attributes: { terms[], duration, reward, penalty }`) co-signé
  (deux `sourceIds`).
- **Impact site** : le **contrat affiché tel quel** dans l'UI (termes = conditions du panneau
  « Pourquoi ? ») — la matérialisation la plus littérale de « conditions explicables » du v3.
- **Priorité** : P2.

#### Illusions du jeu de Morena → voir F (Contagion, P1).

### E. Transport, topologie, espaces (le map-engine comme cible)

Pattern : kind `PORTAL`, `ENTITY_MOVED`, et surtout des **invariants spatiaux** : le Black
Whale est un graphe de lieux que ces hatsu court-circuitent ou verrouillent.

#### Magical Worm — Fugetsu `magical-worm`

- **Canon** : porte de départ → tunnel → trappe de sortie ; retour possible tant qu'on n'est
  pas complètement sorti ; à l'origine 1×/nuit, épuisant, retour ouvert par Kacho ; après la
  mort de Kacho, Fugetsu répète les trajets — développement suspect (piège ennemi ?).
- **Events** : deux entités PORTAL (Start/Return) + `ENTITY_MOVED` instantané entre lieux non
  adjacents ; compteur nocturne ; `attributes.suspicious: true` post-Kacho.
- **Manifest** : `TARGET_SELECTION` de lieu (parmi les lieux connus de Fugetsu — intersection
  avec le knowledge-engine !), overlay `TRAJECTORY`.
- **Impact site** : **les trajets impossibles enfin lisibles** : Fugetsu passe du Tier 1 au
  Tier 3 sans franchir les checkpoints ; la carte trace le tunnel en pointillé, le
  spoiler-engine le cache aux lecteurs pré-révélation. Ses déplacements = l'anomalie que
  les autres factions détectent (Benjamin sait qu'elle sort sans savoir comment → asymétrie de
  connaissance déjà modélisable).
- **Priorité** : P1.

#### Luini (portails en chambre scellée) `luini-spatial-teleportation`

- **Canon** : depuis une pièce à porte fermée, portails vers lieux déjà visités ; espace de
  transit privé ; si la porte de la pièce-ancre s'ouvre → pièce brûlée définitivement.
- **Events** : PORTAL réseau + **invariant d'invalidation** : `EFFECT_ENDED` automatique si un
  event d'ouverture de porte touche la pièce-ancre. « Lieux déjà visités » = requête sur
  l'historique de présence de Luini — le timeline-engine sert de condition d'activation.
- **Impact site** : l'infiltration Heil-Ly à travers les cloisons blindées (ch. 378+) devient
  jouable en simulation : quelles pièces Luini peut-il encore atteindre à l'event N ?
- **Priorité** : P1.

#### Marayam (isolement de la chambre 1013) `marayam-guardian-isolation`

- **Canon** : chambre 1013 derrière une barrière spatiale ; les sortants et extérieurs
  atteignent un **duplicata vide** et ne perçoivent plus les occupants réels.
- **Events** : effet `PORTAL`/`CUSTOM` sur LOCATION + **duplication du lieu** : `room-1013` et
  `room-1013-duplicate`. Les presences se séparent ; les perspectives extérieures voient le
  duplicata (SpatialEstimate vers le faux lieu, `certainty: CONFIRMED` pour eux — fausse
  certitude, exactement ce que permet le knowledge-engine).
- **Impact site** : première **bifurcation d'espace** du site : deux pièces superposées sur la
  carte, sélecteur « réel / perçu ». Biscuit et Hanzo dedans, Vergei furieux dehors — le
  huis clos du ch. 390+ est un niveau de puzzle à lui seul.
- **Priorité** : P1.

#### Voconte (portes du repaire) `voconte-hideout-doors` — réseau de portes Heil-Ly.

- `PORTAL` interne au repaire ; recombine la topologie. P3, s'appuie sur Luini.

#### Kurton (bateau/voiture) `kurton-vehicle-transformation`

- BODY→CONSTRUCT véhicule, passagers = aura-carburant (`attributes.fuel`). Évasion maritime
  potentielle : P3 tant que le canon n'avance pas.

#### Tokarine (relais logistiques) `transport-portals` — hors navire, P3.

#### Fun Fun Cloth — Chrollo `fun-fun-cloth`

- **Canon** : miniaturisation de tout objet/personne enveloppé, restitution intacte.
- **Events** : la cible **disparaît des presences** (contenue : `attributes.containedIn`) puis
  réapparaît ailleurs — un « transport d'entité par entité ». Utilisé pour exfiltrer les corps
  (canon : cadavres au combat de sumo).
- **Priorité** : P3.

#### Leorio — Remote Punch `leorio-remote-punch`

- **Canon** : frappe traversant une surface, sortie en un point choisi.
- **Events** : event d'attaque avec `TRAJECTORY` à travers la géométrie du navire.
- **Impact site** : petit mais mémorable : l'uppercut à distance en overlay sur la carte ;
  P3 (P2 si scène médicale de Leorio au Tier 3 développée).

#### Chrollo — Teleport `chrollo-teleportation` — `ENTITY_MOVED` forcé sur autrui sans ligne

de vue (canon : Nobunaga écarté). P3.

### F. Réseaux, niveaux et cohortes

#### Contagion (Et tu, Juliet) — Morena `contagion` — **P1, le boss de fin du moteur**

- **Canon** : ≤ 22 infectés par salive ; suivi position/état/points ; 1 niveau par meurtre
  d'ordinaire, 10 par Nen user, 50 par prince ; capacité unique à lvl 20 ; Member Zero à
  lvl 100 ; triple condition d'infection (jeu gagné en « Yes » + baiser + meurtre observé) ;
  triche → Manipulation Yes/No ; fin à la mort de Morena/cible ou jeu accompli.
- **Events** : COHORT `heil-ly-infected` (`memberIds`, cap 22) ; par membre un effet `CUSTOM`
  (`attributes: { level, kills }`) ; meurtre par un infecté → `EFFECT_ATTRIBUTE_CHANGED`
  (points selon la victime — le moteur **connaît** le statut Nen/prince de la victime !) ;
  lvl 20 → `ABILITY_GRANTED` (capacité générée, ex. Silent Majority ?) ; Morena voit tout →
  flux `KNOWLEDGE_GRANTED` permanent vers elle (position exacte de chaque membre).
- **Manifest** : `SEQUENCE` (jeu → baiser → meurtre observé), customComponent
  `ContagionDashboard`.
- **Impact site** : **le tableau de bord Heil-Ly** : liste des 22 slots, niveaux en direct,
  carte des kills, arbre « qui a infecté qui ». La montée en niveau pendant les massacres des
  Tiers 3-4 devient une visualisation de données temps-réel sur la timeline. Aucun autre hatsu
  ne fait autant travailler _tous_ les engines à la fois.
- **Priorité** : P1.

#### Silent Majority `silent-majority` (utilisateur : membre Heil-Ly non identifié)

- **Canon** : pantin visible du seul utilisateur ; victime choisie parmi 10 personnes à portée ;
  4 serpents, 44 s par serpent, 11 s à quatre ; désactivation prématurée → malédiction
  retournée ; serpents disparaissent hors Nen.
- **Events** : NEN_ENTITY pantin (`masked` sauf pour l'utilisateur) + serpents visibles ;
  compte à rebours = `attributes.drainSecondsRemaining` ; retournement = `CURSE` sur
  l'utilisateur.
- **Impact site** : **l'ownerId est inconnu** : `silent-majority-user` est un personnage
  anonyme (convention `mafia-heilly-soldier-XX`) — la fiche capacité affiche « utilisateur non
  identifié » tant que le canon ne tranche pas ; le mode enquête liste les suspects présents
  aux attaques (croisement presences × attaques = déduction offerte par le moteur).
- **Priorité** : P2.

#### Benjamin Baton → voir G. Eye-wogs (Tyson) :

- **Canon** : se fixent aux lecteurs du Livre, prélèvent l'aura, rendent du bonheur
  proportionnel à l'adhésion ; tabou → punition.
- **Events** : COHORT lecteurs + `AURA_MODIFIER` par lecteur (`levy`), violation de tabou →
  `EFFECT_STATE_CHANGED(TRIGGERED)`.
- **Priorité** : P3.

#### Halkenburg — Grimmel the Dissonance `grimmel-the-dissonance` — **P1**

- **Canon** : aura des porteurs d'aileron partageant sa volonté → armure « invincible » ; l'arc
  transperce tout ; la flèche **échange l'âme de la cible avec celle d'un porteur marqué choisi
  au hasard (Halkenburg inclus)** ; la conscience alliée prime dans le corps adverse ; l'autre
  dort jusqu'au sommeil/mort ; si le corps du porteur meurt d'abord, l'âme de la cible y
  retourne prioritaire ; Halkenburg risque sa vie à chaque tir.
- **Events** : COHORT porteurs + armure (`AURA_MODIFIER` de groupe) ; tir = `soulSwap()` :
  **deux `CONSCIOUSNESS_TRANSFERRED` atomiques** + états de sommeil (`metadata.mentalState:
'SUPPRESSED'`) ; règles de priorité encodées comme invariants world-engine ; cible aléatoire
  parmi `memberIds` (en simulation : choisir ; en canon : suivre le manga — le tir sur le
  garde, ch. 411+).
- **Manifest** : `TARGET_SELECTION`, overlay `TRAJECTORY` (la flèche traverse les murs !),
  `perspectiveTransition { canChangeBody: true, canChangeConsciousness: true }`.
- **Impact site** : **la raison d'être de l'identity-engine**. Le status header (« conscience
  suivie / corps occupé / perçu comme ») a été conçu pour ce hatsu. La vue « qui est dans quel
  corps » après le tir de Halkenburg est LA killer feature que aucun wiki ne sait rendre.
- **Priorité** : P1 — module vitrine n° 1 avec Contagion.

### G. Vol, prêt, héritage de capacités

Pattern : `ABILITY_GRANTED` / `ABILITY_REVOKED`, avec conditions historiques (serment,
académie, mort) vérifiées contre le timeline-engine.

#### Skill Hunter + Double Face — Chrollo `skill-hunter`, `double-face`

- **Canon** : 4 conditions en <1 h (voir la capacité, interroger, réponses, contact paume-
  couverture) ; la victime perd le pouvoir ; capacité morte si créateur mort (sauf post-mortem) ;
  Bookmark = 2 capacités simultanées / mains libres ; upgrade convoité via un trésor national
  Kakin.
- **Events** : vol = `ABILITY_REVOKED`(victime) + `ABILITY_GRANTED`(Chrollo,
  `attributes.storedIn: 'skill-hunter'`) ; mort d'un créateur → invariant : révocation
  automatique (Gallery Fake ⇠ mort de Kortopi, Black Voice ⇠ Shalnark — visible dans la
  timeline !) sauf `postMortem` (Sun and Moon maintenu).
- **Impact site** : **la page « livre de Chrollo » comme projection temporelle** : à chaque
  event, la liste des pages disponibles change (volées, perdues, maintenues post-mortem).
  Le lecteur fait défiler la timeline et voit le livre vivre. Les 4 conditions de vol en
  checklist = panneau « Pourquoi ? » à quatre lignes.
- **Priorité** : P1.

#### Benjamin Baton `benjamin-baton` (+ Air Blow, Culdcept, Secret Window hérités)

- **Canon** : hérite à la mort d'un loyaliste diplômé de l'académie militaire ; 4 étoiles dans
  la paume ; une capacité active continue sous son contrôle même volée/perdue.
- **Events** : invariant : `BODY_STATE_CHANGED(DEAD)` d'un membre du COHORT `benjamin-army` →
  `ABILITY_GRANTED`(Benjamin). Vincent → Air Blow ; Musse → Secret Window ; Shikaku → Culdcept.
- **Impact site** : le **compteur macabre de Benjamin** : sa fiche s'enrichit à chaque mort de
  ses hommes — la timeline raconte l'attrition de son armée par les capacités qu'il gagne.
  Miroir sombre de Skill Hunter : deux collectionneurs, deux mécaniques, même primitive.
- **Priorité** : P2 (l'invariant est P1 car il alimente la timeline automatiquement).

#### Culdcept `culdcept` — capture d'ability en carte ; échec canon contre la flèche de

Halkenburg (l'event « échec » est intéressant : un `EFFECT_CREATED` avorté, à
montrer dans la timeline du ch. 411). P3.

#### Rihan — Predator `rihan-predator`

- **Canon** : analyse solitaire d'une capacité cible → créature contre-mesure ; inefficace si
  infos fournies par autrui ; succès = Nen scellé 48 h.
- **Events** : phase d'analyse = accumulation de `KNOWLEDGE_GRANTED` **de Rihan uniquement**
  (l'invariant vérifie que les faits sur la cible ont Rihan pour unique observateur source —
  le knowledge-engine comme condition d'activation, unique dans le catalogue) ; succès →
  `ABILITY_REVOKED`(cible, dévorée) + `CONSTRAINT`(Rihan, 48 h).
- **Impact site** : la fiche de Rihan montre sa « jauge d'analyse » du gardien de Tserriednich —
  et le prix (48 h sans Nen) planifié sur la timeline.
- **Priorité** : P2.

#### Erigeron — Bill `erigeron` — croissance accélérée + **boost des capacités d'autrui**

(`AURA_MODIFIER` sur la cible, faible sur non-entraînés). Support discret du camp Woble ; P3.

### H. Malédictions et post-mortem

Pattern : `CURSE` DORMANT + déclencheur + `postMortem`. Le spoiler-engine excelle ici : la
plupart sont révélées tardivement (`revealedAtChapter`).

#### Sacrificial Curse — Beyond `beyond-sacrificial-curse`

- **Canon** : marque de naissance visible uniquement en Gyo ; éveille au Nen dès la naissance ;
  mort du sacrifice → mort de la cible désignée, malgré gardien, à grande distance ; Beyond
  peut déclencher en faisant mourir ses enfants ; la plus puissante jamais observée (Furykov).
- **Events** : `CURSE` DORMANT par enfant maudit (`masked: true`, cible scellée
  `attributes.target: <hidden>`), `revealedAtChapter: 415`.
- **Impact site** : **la bombe du ch. 415** : au cursor pré-415, les fiches de Furykov et
  consorts sont normales ; au cursor post-415, le mode Gyo révèle les marques et le graphe
  « sacrifice → cible royale » se déplie. Démonstration parfaite spoiler-engine + Gyo +
  malédiction. C'est l'actualité du manga : à traiter dans la prochaine vague.
- **Priorité** : P1 (fraîcheur canon).

#### Yomotsu Hegui — Gidal & les Have-Nots `yomotsu-hegui`

- **Canon** : des mois de préparation rituelle ; activation = brûler l'objet, boire les
  cendres, suicide au poignard ; drain d'aura post-mortem ; force fonction de proximité,
  contact visuel, préparation, résolution.
- **Events** : longue phase DORMANT (préparation, visible seulement en omniscient) → suicide
  (`BODY_STATE_CHANGED(DEAD)` volontaire) → `CURSE` postMortem sur la cible avec
  `attributes.strengthFactors`.
- **Impact site** : la campagne anti-Camilla en préparation dans l'ombre : le mode omniscient
  montre des jauges de haine qui montent depuis des mois — pédagogie du « prix » des
  malédictions.
- **Priorité** : P2.

#### Sun and Moon — Chrollo (ex-Aîné) `sun-and-moon` — marques `CURSE` DORMANT posées par

contact, contact soleil+lune → `TRIGGERED` explosion ; postMortem (persiste livre fermé).
Canon riche au combat de sumo ; sur le Black Whale, la menace des marques posées sur
Hisoka ? P2.

#### Cat's Name — Camilla `cats-name`

- **Canon** : contre-attaque post-mortem : tue le meurtrier, absorbe sa vie, ressuscite
  Camilla ; inutile si on refuse de la tuer.
- **Events** : `CURSE` DORMANT permanent sur BODY Camilla ; `BODY_STATE_CHANGED(DEAD)` de
  Camilla par un agresseur → `TRIGGERED` : mort de l'agresseur + `BODY_STATE_CHANGED(ALIVE)`
  de Camilla — **la seule résurrection mécanique du catalogue**.
- **Impact site** : en simulation : « que se passe-t-il si X tue Camilla ? » → le moteur répond
  correctement (X meurt, Camilla revit). Le panneau « Pourquoi ? » de l'action « tuer
  Camilla » affiche l'avertissement en mode omniscient et rien en mode naïf — exactement le
  piège tendu à Benjamin au ch. 387.
- **Priorité** : P1 (petit module, gros effet démonstratif en simulation).

#### Without You — Kacho/Fugetsu `without-you`

- **Canon** : à la mort de la première jumelle, prend son apparence/personnalité/souvenirs,
  visible de tous, traverse la matière, interagit avec Magical Worm ; post-mortem.
- **Events** : mort de Kacho → spawn NEN_ENTITY « Kacho » (`postMortem`,
  `attributes.appearsAs: 'prince-kacho'`) ; les observateurs croient Kacho vivante →
  `KNOWLEDGE_GRANTED(BELIEVED, 'kacho est vivante')` en masse — **fausse croyance générale
  orchestrée par le moteur**.
- **Impact site** : la fiche Kacho post-ch. 398 est le paradoxe rendu navigable : morte dans
  l'identity-engine (body DEAD), « présente » sur la carte comme NEN_ENTITY, vivante dans la
  perspective de Fugetsu et de Sencho. Trois vérités simultanées, une par engine.
- **Priorité** : P1.

#### Judgment Chain → voir A (P1, Kurapika).

#### Tserriednich (marques de mensonge) `tserriednich-guardian-lie-marks` — compteur 1/2/3

mensonges = `CURSE` à `attributes.lieCount` incrémental ; troisième → transformation.
L'interrogatoire de Theta vit sous cette épée de Damoclès : afficher le compteur sur sa
fiche dans la perspective de Theta (elle le sait). P2.

### I. Temporalité et précognition (le timeline-engine comme cible)

#### Parallel Future — Tserriednich `parallel-future` — **P1, le hatsu-signature du site**

- **Canon** : Zetsu fermé les yeux → vision des 10 prochaines secondes ; en maintenant Zetsu,
  vision constamment 10 s en avance, perception double (présent + futur) ; à la fin, autrui vit
  les 10 s prédites tandis que lui agit autrement grâce à sa connaissance.
- **Events/architecture** : c'est **littéralement une branche de simulation** : activer =
  `SimulationStore.fork(cursor)` de 10 s d'events prédits ; maintenir = fenêtre glissante ;
  conclure = la branche prédite **devient canon pour tous sauf Tserriednich**, dont les actions
  divergent — un merge sélectif de branche, la primitive la plus avancée du simulation-engine.
- **Manifest** : overlay `FUTURE` (prévu pour ça), customComponent `ParallelFutureView` :
  écran scindé présent/+10 s.
- **Impact site** : le lecteur voit ce que Tserriednich voit : deux cartes synchronisées à
  10 s d'écart. L'exécution de la scène Theta (esquive « impossible ») devient compréhensible
  frame par frame — la meilleure explication visuelle jamais faite de ce pouvoir.
- **Priorité** : P1 (après Grimmel/Contagion — dépend du merge de branches).

#### Emperor Time (coût temporel) → voir A.

#### Guardian Coins — Zhang Lei `zhanglei-guardian-coins` — accrual quotidien

(`attributes.value` +1/jour, reset au transfert) : le moteur a des jours story-time, la
pièce est un objet traçable donné à Hisoka/Brigade (canon ch. 395+) — sa circulation sur la
carte est un fil narratif. P2.

#### Lovely Ghostwriter — prédictions en poèmes ; capacité disparue (mort probable de Néon) —

fiche historique + event `ABILITY_REVOKED` daté, P3.

### J. Zones à règles, tribunaux, pièges

Pattern : `CONSTRAINT` de zone à `attributes.rules[]` lisibles — des mini-systèmes de lois
locales, affichés tels quels dans l'UI (fidélité manga = les règles sont toujours énoncées).

#### Cross Game — Mizaistom `cross-game`

- Cartes bleue/jaune/rouge = admission/contrôle/expulsion ; avertissement avant « Restraint » ;
  bref, réitérable, multi-cibles. Events : `CONSTRAINT` (parallélépipède, la cible parle mais
  ne bouge plus). Impact : l'outil judiciaire des Zodiaques — chaque usage documente une
  procédure (qui a été averti, quand). P2.

#### A Battle of Wits: LSDF — Yokotani `lsdf`

- Gardes invincibles anti-intrus **dont le niveau dépend du crime commis** ; ne blessent pas,
  expulsent ; conditionné à la présence de Morena au repaire. Events : `CONSTRAINT` de LOCATION
  - spawn CONSTRUCT proportionnel. Le repaire Heil-Ly devient une zone de règles visibles. P2.

#### Indoor Fish — Chrollo `indoor-fish` — poissons uniquement en pièce close (invariant :

l'effet s'`ENDED` si la pièce s'ouvre — même primitive que Luini inversée) ; blessures
indolores différées (BODY_STATE effectif à la fin de l'effet). P3.

#### Desire Trap — Luzurus `luzurus-guardian-desire-trap` — matérialise le désir de la cible

en appât ; satisfaction → piège + pseudo-coercition. `CUSTOM` DORMANT → `TRIGGERED`. P3.

#### Marayam / Luini / Voconte → déjà en E (zones spatiales).

### K. Soutien, soin, économie d'aura

- **Holy Chain** (voir A, P1 via vertical Kurapika) ; **Cookie** `magical-esthetician-cookie`
  (30 min = 8 h de sommeil : modifie l'état `fatigue` — utile si le site suit la fatigue des
  gardes pendant les tours de garde du secteur royal, P3) ; **Erigeron** (P3, voir G) ;
  **Biscuit Body Transformation** (`PERCEPTION_MASK` inversé : sa vraie forme est le masque
  levé — petite fiche amusante sur l'écart apparence/réalité, P3) ; **Melody** (P2, voir B).

---

## 4. Features transverses que cette vague débloque

1. **Le toggle « Gyo »** (mode de perception) : révèle tout effet `masked` — Bungee Gum piégé,
   marques de Beyond, pantin de Silent Majority, fils de Machi. Un seul développement, six
   hatsu servis.
2. **La fiche « Serments & restrictions »** sur chaque capacité : les conditions du
   `AbilityActionPlan` rendues en langage manga (Kurapika, Franklin, Yomotsu Hegui, Morena).
   La pédagogie Nen du site vient de là : _toute puissance a un prix affichable_.
3. **Provenance des connaissances** : chaque `KNOWLEDGE_GRANTED` porte `sourceIds` → l'UI peut
   répondre « comment Kurapika sait-il cela ? » (par Little Eye, cafard n° 3, ch. 390).
4. **Le mode enquête** : croiser presences × capacités actives × connaissances pour les
   mystères canon (meurtre de Momoze, identité du porteur de Silent Majority, taupe chez les
   Zodiaques — résolu : Saiyu).
5. **Simulation « et si »** : Cat's Name, Grimmel, Parallel Future et Luini donnent chacun des
   scénarios de branche spectaculaires et bornés (fidèles car le module refuse ce que le canon
   interdit).
6. **Post-mortem comme invariant** : la règle « le Nen s'intensifie après la mort » devient un
   comportement du reducer, pas une note de bas de page.

## 5. Fidélité manga : garde-fous

- **`canonStatus` et `revealedAtChapter` partout** : une mécanique non révélée au cursor du
  lecteur = effet affiché « capacité inconnue » (Silent Majority pré-identification, gardien de
  Camilla, Air Blow). Le spoiler-engine est le gardien de la fidélité.
- **Les inconnues restent inconnues** : statut `UNKNOWN` des conditions déjà supporté — le
  panneau « Pourquoi ? » doit dire « condition non révélée » plutôt qu'inventer (Culdcept,
  Camilla, Air Blow). Ne jamais combler un trou canon par une invention en mode canonique ;
  les hypothèses vivent dans les branches de simulation, marquées `canonStatus: 'speculative'`.
- **Les échecs canon comptent** : Culdcept vs flèche, Predator limité, Little Eye et les
  prédateurs d'insectes — modéliser aussi les limites, pas seulement les succès.
- **Sources** : chaque fiche de module devrait citer ses chapitres (`sourceIds` des events →
  chapitres de `chapters.json`).

## 6. Ordre d'implémentation proposé

| Vague | Modules                                                                       | Débloque                                                   | État                                       |
| ----- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| 1     | Chapelet Kurapika (6 chaînes) + Emperor Time (coût)                           | `ABILITY_REVOKED`, prêt, coût vital, vertical protagoniste | ✅                                         |
| 2     | Grimmel + Hanzo Skill 4 + Without You                                         | soulSwap, post-mortem, le trio identity-engine             | ✅                                         |
| 3     | Contagion + Silent Majority + LSDF (vertical Heil-Ly)                         | cohortes, niveaux, mode enquête                            | ✅                                         |
| 4     | Magical Worm + Luini + Marayam (vertical spatial)                             | portails, invariants de lieux, duplication d'espace        | ✅                                         |
| 5     | Hisoka (Bungee Gum étendu + Texture Surprise) + Metamorphosen + Convert Hands | Gyo, masques, mode « apparent »                            | ✅                                         |
| 6     | Skill Hunter + Benjamin Baton + malédiction de Beyond                         | héritage/vol, spoiler-engine ch. 415                       | ✅ + Cat's Name et Little Eye              |
| 7     | Parallel Future                                                               | merge sélectif de branches, overlay FUTURE                 | ✅ module + `SimulationEngine.mergeBranch` |
| 8     | P3 : les 38 capacités restantes                                               | complétude catalogue — 81/81                               | ✅                                         |

### Ce que la vague P1 a effectivement livré

- **world-engine** : `ABILITY_REVOKED`, `EFFECT_STATE_CHANGED`, `EFFECT_ATTRIBUTE_CHANGED`
  (compteurs et listes de cohorte), invariant post-mortem dans le reducer, vaisseaux de
  conscience non corporels (double astral), `eventSubjectIds` + `InMemoryBranchEngine.mergeInto`
  pour le merge sélectif, et le rendu Gyo / `appearsAs` dans `projectMapScene`.
- **ability-sdk** : découpé en `context`/`conditions`/`effects`/`interactions`/`define` ;
  builders `perceptionMask`, `controlLink`, `portal`, `curse`, `constraint`, `abilityGrant`,
  `abilityRevoke`, `knowledgeGrant`, `soulSwap`, `spawnNenEntity`, `attributeCounter` ;
  décorateurs `postMortem`, `masked`, `dormant`, `revealedAt`, `sourcedFrom` ; `defineAbility`
  accepte désormais des **actions** distinctes, un **coût**, des **modificateurs de
  perspective** et des **notes canon non bloquantes** (« condition non révélée » qui n'empêche
  pas une action que le manga montre).
- **23 modules** : bungee-gum (étendu), texture-surprise, chain-jail, judgment-chain,
  dowsing-chain, holy-chain, steal-chain, stealth-dolphin, emperor-time,
  grimmel-the-dissonance, hanzo-skill-4, without-you, contagion, magical-worm,
  luini-spatial-teleportation, marayam-guardian-isolation, battle-cantabile-metamorphosen,
  skill-hunter, double-face, beyond-sacrificial-curse, cats-name, little-eye, parallel-future.

### Ce que la vague P2 a ajouté

- **Invariant d'héritage** dans le reducer : un effet `ABILITY_GRANT` portant `inheritTo` et
  `memberIds` transfère automatiquement les capacités d'un membre à sa mort. Benjamin Baton
  n'a donc pas d'action « hériter » — la fiche de Benjamin s'enrichit toute seule au fil de
  l'attrition de son armée, et la timeline la raconte.
- **Nouvelles conditions SDK** : `declaredFlag` (retenir son souffle, avoir été averti) et
  `soleObserverOf`, qui fait du knowledge-engine la condition d'activation de Predator — seule
  capacité du catalogue dans ce cas.
- **20 modules** : nen-stitches, surveillance-paper-dolls, dance-of-the-serpents-bite,
  secret-window, melody-enchanting-music, love-dial-6700, convert-hands,
  illumi-needle-people, momoze-guardian-solicitation, salesale-guardian-smoke, moonlight-act,
  silent-majority, benjamin-baton, rihan-predator, yomotsu-hegui, sun-and-moon,
  tserriednich-guardian-lie-marks, cross-game, lsdf, zhanglei-guardian-coins.
- **Garde-fou de câblage** : `abilityModules` est le registre unique, et un test compare la
  liste enregistrée aux `moduleKey` du catalogue — les deux ne peuvent plus diverger.

### Ce que la vague P3 a bouclé

Les 38 capacités restantes, regroupées par faction plutôt qu'en 38 dossiers :
`chrollo-stolen` (Indoor Fish, Fun Fun Cloth, téléportation, Order Stamp, Gallery Fake,
Black Voice, Lovely Ghostwriter), `troupe` (Prologue, Jupiter, Blinky, Double Machine Gun,
Ripper Cyclotron), `royal-guardians` (Camilla, Tubeppa, Tyson, Luzurus), `heil-ly` (Voconte,
Bloody Mary, Padaille, Gel), `benjamin-inherited` (Air Blow, Culdcept, aura), `zodiacs`
(bâton et trois singes de Saiyu, Great Haiku, Cluck, Leorio), `biscuit`, `expedition`
(Kurton, Tokarine, Theta), `mafia` (Hinrigh, Lynch, Terebellum) et `woble` (Bill, Oito).

Deux points de fidélité que cette vague met à l'épreuve, conformément au §5 :

- **Les inconnues restent inconnues.** Le gardien de Camilla porte une condition `unrevealed`
  _bloquante_ : personne ne peut l'exécuter tant que le manga n'a pas dit comment. Air Blow,
  la téléportation sans nom de Chrollo et le hatsu propre à Oito portent des notes non
  bloquantes qui disent ce qui manque.
- **Les échecs canon comptent.** Culdcept a une action « capture avortée » qui produit un
  event : l'échec contre la flèche de Halkenburg (ch. 411) est visible dans la timeline au
  lieu d'être passé sous silence.

Chaque vague suit le pattern bungee-gum : module dans `ability-modules`, `moduleKey` renseigné
dans `abilities.json`, manifest + action wheel + panneau « Pourquoi ? », et une scène canon de
référence rejouable dans la timeline comme test d'acceptation.
