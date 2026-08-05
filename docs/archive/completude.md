# Évaluation de complétude — Black Whale

> Audit statique du dépôt au 30 juillet 2026. Quatre axes : couverture du canon, complétude
> fonctionnelle, complétude technique, complétude UX / éditoriale.
> Aucun chiffre de ce document n'est estimé : chacun provient d'une mesure sur le dépôt, et les
> points non vérifiables sans base de données ni `node_modules` sont signalés comme tels.

---

## Verdict global

| Axe                      | Note         | Résumé en une ligne                                                                                                                                                                                                        |
| ------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Couverture du canon      | **6 / 10**   | Le catalogue des entités est solide (82 abilities, 223 personnages, 301 spaces) ; la **narration** ne l'est pas — 105 événements pour 62 chapitres, 8 fiches de chapitre sur 76, 11 arêtes de relations.                   |
| Complétude fonctionnelle | **6,5 / 10** | Les moteurs sont réels, pas des façades. Mais **4 routes sont entièrement en dur**, le graphe de relations est un littéral TypeScript, `/simulations` ne projette rien sur une carte et 3 écrans admin renvoient 405.      |
| Complétude technique     | **6 / 10**   | Dette déclarée quasi nulle (2 TODO, 0 `@ts-ignore`), 11 packages > 44 % de ratio de test — mais le catalogue des hatsu existe **en 5 exemplaires** et la couche visible du site n'utilise pas le moteur qui fait autorité. |
| UX / éditorial           | **5 / 10**   | Socle a11y et SEO sérieux, i18n FR/EN à 100 % de parité — mais **le filtre à spoilers est inactivable**, le crédit CC BY obligatoire est absent de l'interface, et il n'existe aucun `+error.svelte`.                      |

**Le projet n'est pas un README-fiction.** Les branches de simulation sont réellement persistées en
PostgreSQL, l'auth admin est correctement faite (HMAC + binding mot de passe + TTL + rate limit), la
reconstruction métrique du navire est connexe et vérifiée, les 82 abilities ont toutes un module.
C'est au-dessus de la moyenne du genre.

**Les deux problèmes qui doivent passer avant tout le reste** ne sont ni de la donnée ni de la
feature :

1. **Le crédit CC BY 4.0 n'apparaît nulle part dans l'interface** alors que `LICENSE-DATA`
   l'exige explicitement « in a deployed web interface — not only in source code ».
   `grep -rni "cc by\|creativecommons" apps/web/src` → **0 occurrence**. Le site déploie 38 cartes
   SVG et 223 fiches issues de `data/`. C'est une non-conformité du projet à sa propre licence.
2. **Le filtre à spoilers, promesse centrale du README, est inatteignable.** Le backend est complet
   (`lib/server/spoiler.ts`, 6 loaders qui le consomment, bandeaux traduits), mais **aucun contrôle
   de l'UI publique ne pose le cookie `userSpoilerLimit`** — le seul écrivain de cookie du projet
   est `apps/admin/src/routes/+layout.svelte:13`, et il écrit `adminSpoilerLimit`, un cookie
   _différent_. Le bouton « Spoilers » visible sur `/ship` (`ship/+page.svelte:607`) bascule un flag
   qui ne filtre rien.

---

## 1. Couverture du canon — 6 / 10

### 1.1 Volumétrie et taux de remplissage

Complétude = cellules non vides / (nb enregistrements × union des champs observés).

| Dataset              | Fichier                                                           | Volume                                                        | Champs creux                                                                                                                                                                        | Complétude                               |
| -------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Abilities            | `data/abilities/abilities.json`                                   | 82                                                            | `cards` 1/82, `userIds` 4/82, `inheritedFrom` 8/82, `secondaryCategories` 24/82. **Aucun champ chapitre.** Conditions et coût vivent dans les modules, pas dans le JSON — voir §1.3 | **71 %**                                 |
| Chapters             | `data/chapters/chapters.json`                                     | **16**                                                        | —                                                                                                                                                                                   | 100 % du fichier, **21 % des chapitres** |
| Characters           | `data/characters/characters.json`                                 | 223                                                           | `aliases` vide 172/223, `mangaAppearances` absent 113/223, `biography` 104/223, `nen` 48/223                                                                                        | **39 %**                                 |
| Factions             | `data/factions/factions.json`                                     | 22                                                            | —                                                                                                                                                                                   | 100 %                                    |
| Locations            | `data/locations/locations.json`                                   | 67                                                            | `entrances` 2/67, `exits` 5/67                                                                                                                                                      | **75 %**                                 |
| Prophecies           | `data/prophecies/prophecies.json`                                 | 78                                                            | 1 poème vide (documenté)                                                                                                                                                            | **91 %**                                 |
| Ship blueprint       | `data/ship/blueprint.json`                                        | 39 tiers · 301 spaces · 144 doors · 59 seals · 697 structures | champs optionnels typés                                                                                                                                                             | **88–100 %** selon la table              |
| **Log d'événements** | `data/events/events.json`                                         | **118**                                                       | `occurredAtLabel` 2/118, `isFlashback` 1/118                                                                                                                                        | **54 %**                                 |
| **Relations**        | `apps/web/src/routes/relationships/+page.server.ts:15` (littéral) | **11 arêtes**                                                 | —                                                                                                                                                                                   | voir §2                                  |

### 1.2 Le trou principal : la narration, pas le catalogue

> **Corrigé en partie.** Le log vit désormais dans `data/events/events.json`, à côté des autres
> jeux de données, et `backfill_timeline.mjs` le lit au lieu de le contenir. Il est passé de 105 à
> **118 événements**, aucun chapitre de l'arc n'est plus vide, et `chapters.json` est passé de 8 à
> **16 fiches**. Les invariants sont tenus par `apps/web/src/lib/server/event-log.test.ts`.

Ce que la correction a couvert :

- Le log est **de la donnée**, plus un littéral JavaScript de script : lisible, diffable et
  vérifiable sans base ni backfill. Les commentaires de curation qui vivaient dans le script sont
  conservés en champ `note`.
- **Ch. 358** (« Eve ») était le seul chapitre de l'arc sans événement curé : il en a quatre — la
  fête de la veille et l'attribution des cinq tiers, les règles d'engagement posées par Balsamilco,
  la recherche d'une sortie avec Oito, l'aura lue autour du berceau de Woble.
- Chapitres denses épaissis : **349** (règles du contest, Saiyu identifié comme l'homme de
  Pariston), **368** (Emperor Time payé 450 jours, classe de Nen actée), **371**, **375**, **406**,
  **410**.
- **Huit fiches de chapitre** écrites depuis Hunterpedia : 359, 368, 382, 383, 404, 405, 406, 413 —
  exactement les chapitres nommés par l'audit. Elles portent `charactersInvolved` et `location`,
  donc elles alimentent les trajectoires par chapitre, pas seulement l'affichage.
- Deux défauts préexistants trouvés par le garde-fou et corrigés : les chapitres 378 et 380
  portaient deux titres contradictoires dans le log (retenus : « Balance » et « Alarm », vérifiés
  sur Hunterpedia), et quatre `charactersInvolved` ne résolvaient vers personne (`zodiaques`,
  `prince tyson`, `all the princes`, `leurs gardes et allies`).

Ce qui reste ouvert :

- **51 chapitres sur 76 n'ont toujours qu'un seul événement.** La couverture est complète au sens
  « aucun chapitre vide », pas au sens « chaque scène est indexée ».
- **13 des 118 restent d'anciens bouchons auto-générés** (« Début du chapitre N », « Appearance of
  X ») requalifiés via `legacyTitles`. Le test interdit d'en réintroduire, il ne réécrit pas les
  existants.
- **60 chapitres sur 76 n'ont pas de fiche** dans `chapters.json`.
- **Cinq fiches héritées sont des récapitulatifs thématiques, pas des chapitres** : 340, 349, 377,
  378 et surtout 390, dont le titre (« Parasite ») et les huit entrées couvrent des scènes allant
  du ch. 357 au ch. 413 — la fuite de Kacho y est datée du 390 alors qu'elle est au 383. Les vrais
  titres sont respectivement « Special Mission », « Worm Toxin », « Scheme », « Balance » et
  « Clash: Part 1 ». Les refiler chapitre par chapitre est le prochain lot ; ce n'est pas fait ici
  parce que cela déplace des entrées existantes plutôt que d'en ajouter.
- Les nouvelles fiches n'ont **pas de champ `date`** : les dates de parution ne sont pas
  vérifiables depuis les sources consultées, et le champ n'est lu que pour le dernier chapitre
  (415, renseigné). Rien n'est estimé.

### 1.3 Trous nommés

**Personnages**

- **Kortopi et Shalnark sont absents de `characters.json`**, alors qu'ils sont tués dans l'événement
  `357.1` et cités comme `inheritedFrom` de `gallery-fake` et `black-voice`. Deux morts de la
  Brigade non représentables comme entités.
- **Salé-salé n'a aucun garde catalogué** (0), quand tous les autres princes en ont ≥ 4 (Benjamin 17,
  Camilla 15, Tubeppa 15, Halkenburg 14…).
- **7 personnages sans faction** : `beyond-netero`, `hisoka`, `hanal`, `kurton`, `ridge`,
  `silent-majority-user`, `theater-venue-announcer`.
- **8 sans chapitre de première apparition** exploitable (3 en `ch-unknown`, 5 en `null`).
- **113 sur 223 (51 %) sans `mangaAppearances`** — donc invisibles au filtre spoiler par chapitre.
- **29 sans position** sur le navire (dont 19 Heil-Ly de bas rang) → tombent sur
  `black-whale-unknown`.
- Point positif vérifié : **0 personnage dont le `shipLocation.room` ne résout pas** vers une pièce
  nommée.

**Abilities**

- **82 abilities ↔ 82 modules, 0 orphelin dans les deux sens.** Le garde-fou
  (`packages/ability-modules/src/index.ts`) est réel. Les 8 vagues de `docs/hatsu-potentiel.md` sont
  toutes livrées — 23 + 20 + 38 = 81, plus les 2 capacités de Feitan, moins `oito-hatsu` retiré
  (voir plus bas).
- ~~**2 `ownerId` cassés** : `benjamin-hui-guo-rou` et `oito-hui-guo-rou` n'existent pas dans
  `characters.json`.~~ **Corrigé** : `benjamin-aura` appartient à `prince-benjamin`, dans le
  catalogue comme dans le manifest du module, et la fiche le liste dans `nen.abilityIds`.
  `oito-hatsu` a depuis été retiré : le canon ne prête aucun hatsu propre à Oito — ses nœuds
  d'aura sont ouverts par Kurapika et elle emprunte Little Eye. L'entrée était une invention de la
  vague P3 pour ne pas laisser de trou dans le catalogue, et le module lui-même le disait dans son
  en-tête. Oito ne garde donc que `little-eye`, dont elle est déjà `userIds`. Un test refuse désormais tout `ownerId` que le
  registre des passagers ne porte pas (`nen-registry.test.ts`), et `data/CONVENTIONS.md` énonce la
  règle de slug (`prince-*`, `queen-*`) qui avait produit les deux fantômes.
- ~~**47 modules sur 81 n'ont pas de `cost`**~~ **Corrigé** : les 82 modules en déclarent un, et le
  plan le porte donc pour chaque capacité. Le coût reste dans le module plutôt que dans
  `abilities.json` : c'est le moteur qui fait autorité, et §3 reproche déjà au projet de tenir le
  catalogue des hatsu en cinq exemplaires — un sixième champ dupliqué aurait aggravé exactement ce
  défaut. Un test échoue si un module ne facture rien, ni sur la capacité ni sur aucune de ses
  actions.
- ~~**Feitan Portor** est présent comme personnage mais n'a ni bloc `nen` ni ability.~~
  **Corrigé** : Pain Packer et Rising Sun sont au catalogue avec leurs deux modules — l'armure
  empaquette les dégâts subis, le soleil les dépense —, Feitan a son bloc `nen`, et les deux
  capacités ont leur interaction sur le site (`pain-armour`, `sun-flare`) **et dans la visite** :
  l'emballage garde les punitions que la visite infligerait — expulsion par un garde, pièce qui ne
  laisse pas partir, règle rompue — et le soleil les dépense en rayon autour du visiteur, quatre
  mètres par coup gardé, sans distinguer ce qu'il attrape.
- Aucune ability ne porte de chapitre → impossible de mesurer la couverture des hatsu par chapitre.

**Intégrité référentielle**

- ~~**`justice-bureau`** est utilisé comme `factionId` par 5 personnages mais **n'existe pas dans
  `factions.json`** ; il est fabriqué à la volée dans `relationships/+page.server.ts:133`.~~
  **Corrigé** : la faction est déclarée dans `factions.json` et le rattrapage à la volée a été
  supprimé du loader. Plus aucun `factionId` de `characters.json` n'est orphelin.

**Navire** — le point le plus solide du dépôt

- **301 spaces, une seule composante connexe, aucune salle inaccessible.** 356 portes horizontales
  dérivées + 39 liens verticaux. **144/144 overrides de portes utilisés, 59/59 scellements
  effectifs, 39/39 tiers utilisés.** Aucun élément mort.
- **0 `locationId` du blueprint absent de `locations.json`.** Une seule vraie lacune :
  **`tier-3-political-ward`** — pièce du catalogue sans reconstruction métrique.
- Tier 2 est le plus pauvre (12 spaces contre 53 pour le Tier 1) ; 130 des 301 spaces n'ont aucune
  structure.

### 1.4 Dérives README ↔ données

| README                              | Données                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| « 282 reconstructed spaces »        | **301**                                                                               |
| « thirty-three [interiors] in all » | **34**                                                                                |
| « 37 hand-drawn SVG maps »          | ✅ exact (5 + 32)                                                                     |
| « 223 passengers »                  | ✅ exact                                                                              |
| « 83 abilities across 54 users »    | 82 (`oito-hatsu` retiré) ; 54 `ownerId`, tous résolvables (les 2 morts sont corrigés) |

---

## 2. Complétude fonctionnelle — 6,5 / 10

### 2.1 Route par route

| Route                       | Promesse README                                     | État réel                                                                                                                                     | Verdict     |
| --------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `/`                         | vitrine + métriques                                 | comptage à la volée depuis `data/`                                                                                                            | ✅ complet  |
| `/ship`                     | 5 tiers, 37 cartes, corps placés au curseur         | Prisma + `TimelineEngine`, spoiler, perspective, 38 SVG montés                                                                                | ✅ complet  |
| `/tour`                     | 5 ponts, 282 spaces, marche à la 1ʳᵉ personne       | 695 l, blueprint validé, three.js                                                                                                             | ✅ complet  |
| `/tour/sources`             | provenance de chaque surface                        | 503 l, ~15 blocs méthodologiques                                                                                                              | ✅ complet  |
| `/timeline`                 | ordre récit vs chronologique + spoiler              | les deux ordres implémentés via `ordinal`                                                                                                     | ✅ complet  |
| `/characters`               | 223 passagers                                       | 223 ✅ mais **le spoiler ne masque que `beyondLineage`**                                                                                      | ⚠️ partiel  |
| `/characters/[slug]`        | —                                                   | JSON + Prisma, 404 correct au-delà du cap                                                                                                     | ✅ complet  |
| `/compare`                  | deux POV côte à côte, désaccords marqués            | `comparePerspectives` réel, 1 074 l                                                                                                           | ✅ complet  |
| `/relationships`            | « alliances, rivalries, patronages and proxy wars » | **11 arêtes littérales dans le fichier serveur**, 0 faction de Hunters, 7 princes sur 14 sans relation                                        | 🔴 en dur   |
| `/abilities`                | 81 exécutables contre l'archive                     | la page itère `HATSU_PROFILES` (registre client), le bouton déclenche un effet visuel — **pas le `nen-engine`**. Aucun filtre spoiler.        | ⚠️ partiel  |
| `/perspectives`             | carte confirmé / probable / dernier connu           | moteurs réels mais l'UI affiche des **IDs bruts** et une liste de faits                                                                       | ⚠️ partiel  |
| `/simulations`              | « projects the outcome on the same map »            | branches persistées ✅, mais **une seule action exposée** (`bungee-gum/attach` par `hisoka`) et la « carte » = **trois compteurs numériques** | ⚠️ partiel  |
| `/perspectives/[character]` | cité nommément au README                            | **76 l, données `$derived([...])` en dur**                                                                                                    | 🔴 maquette |
| `/knowledge/[character]`    | —                                                   | 53 l en dur + graphe ASCII littéral                                                                                                           | 🔴 maquette |
| `/bodies/[id]`              | —                                                   | 40 l en dur, **0 lien entrant**                                                                                                               | 🔴 maquette |
| `/consciousness/[id]`       | —                                                   | 61 l en dur, **0 lien entrant**                                                                                                               | 🔴 maquette |
| `/health` (web)             | —                                                   | `{status:'ok'}` statique, **ne teste pas la DB** (l'admin, lui, fait `SELECT 1`)                                                              | ⚠️ partiel  |

Circonstance atténuante réelle : `robots.txt` **documente lui-même** les maquettes (« the placeholder
body/consciousness/knowledge detail pages carry no canon content yet »). Mais deux d'entre elles sont
**liées depuis l'UI** (`perspectives/+page.svelte:69` « Open subjective map », `:73` « Open knowledge
map ») : un visiteur qui suit ces boutons atterrit sur du faux contenu.

### 2.2 Back-office : trois écrans de création qui renvoient 405

`apps/admin/src/routes/{characters,facts,abilities}/+page.svelte` embarquent chacun une modale
`<form method="POST" use:enhance>` — et leurs `+page.server.ts` **n'exportent que `load`** (vérifié :
`grep -c "export const actions"` → 0, 0, 0 ; seul `events/new` en a un). SvelteKit répond « No
actions exist for this page ». Pire : `onsubmit={closeCreateModal}` ferme la modale au submit, donc
l'échec est **invisible**. ~990 lignes de formulaire non branchées ; le back-office n'a **qu'une
seule écriture fonctionnelle**.

### 2.3 Packages annoncés sans consommateur

| Package                                                                                       | Imports app | Verdict                                                                                                                   |
| --------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| `timeline-engine`, `nen-engine`, `domain`, `ability-modules`, `simulation-engine`, `database` | 2 à 4       | ✅ utilisés                                                                                                               |
| `identity-engine`, `knowledge-engine`, `perspective-engine`                                   | 1           | ✅ utilisés                                                                                                               |
| `world-engine`, `ability-sdk`                                                                 | 0 direct    | ✅ transitifs légitimes                                                                                                   |
| `spoiler-engine`                                                                              | 2           | ⚠️ 3 de ses 4 exports ne sont appelés que par leur propre test                                                            |
| **`map-engine`**                                                                              | **0**       | 🔴 **code mort** — 294 l + 11 tests, fonction reprise par `apps/web/src/lib/components/map/markerProjection.ts` (1 195 l) |
| **`config`**                                                                                  | **0**       | 🔴 code mort — 12 l                                                                                                       |
| **`contracts`**                                                                               | —           | 🔴 **répertoire vide**, décrit au README comme « Shared API and projection contracts »                                    |
| **`ui`**                                                                                      | —           | 🔴 **répertoire vide**, décrit comme « Shared Svelte components »                                                         |
| `apps/worker`                                                                                 | —           | 🔴 **répertoire vide** (pas même un `package.json`)                                                                       |

Bonus : `@tanstack/svelte-query` figure au tableau « Layer / Tech » du README et **n'est importé nulle
part**.

### 2.4 Schéma Prisma : 31 modèles, dont 4 totalement morts

`WorldEntity`, `SpatialObservation`, `LocationEdge`, `MapAssetManifest` : **0 occurrence** dans tout
le code, pas même dans un seed. `LocationEdge` est précisément ce que `/tour` recalcule à la volée
(`deriveDoorways`) plutôt que de le persister ; `MapAssetManifest` est doublé par le fichier TS
`lib/map/mapAssetRegistry.ts`.

À l'inverse — features **sans** persistance : le graphe de relations, toute la géométrie du navire
(301 spaces, 697 structures, importés au build depuis JSON), et le registre client des 82 hatsu.

### 2.5 Roadmap v5 : honnête

Les branches sont **réellement persistées** (transaction `WorldBranch` + `WorldEventRecord` +
`WorldProjectionSnapshot`, réhydratation depuis la DB dans `ensureLoaded()`). Le « plan avant
exécution » promis en bas du README est vrai : `planFor()` appelle `nenRuntime.planInState` avec
exactement la requête que `execute` enverra. Le « First vertical shipped » est mérité — sauf sur la
projection carte, qui n'existe pas.

---

## 3. Complétude technique — 6 / 10

### 3.1 Le problème central : le catalogue des hatsu existe cinq fois

| #   | Source                                                   | Entrées | LOC   |
| --- | -------------------------------------------------------- | ------- | ----- |
| 1   | `data/abilities/abilities.json`                          | 81      | 54 Ko |
| 2   | `packages/ability-modules/src/*/module.ts`               | 81      | 6 899 |
| 3   | `apps/web/src/lib/nen/hatsuRegistry.ts`                  | 81      | 1 478 |
| 4   | `apps/web/src/lib/i18n/messages/hatsu-fr.ts`             | 81      | 852   |
| 5   | `apps/web/src/lib/i18n/messages/hatsu-status/{en,fr}.ts` | 76 + 76 | 1 544 |

Intersection des identifiants entre (2) et (3) : **81/81**, aucun d'un seul côté. Deux déclarations
rigoureusement parallèles du même catalogue — **et elles ont déjà divergé** : **27 `name`
différents** (`benjamin-aura` : _Aura Manipulation_ vs _Aura de Benjamin_) et **48 `owner` de format
incompatible** (libellé `'Chrollo'` d'un côté, slug `'chrollo-lucilfer'` de l'autre).

**Et la couche visible du site n'importe jamais le moteur.** Vérifié :
`apps/web/src/lib/nen/` et `apps/web/src/lib/tour/` ne contiennent qu'**un seul** import
`@black-whale/*` — un `import type` dans `NenWhyPanel.svelte`. `hatsuRegistry.ts` n'a **aucun
import**.

> **8 992 LOC de pile canon** (`ability-modules` + `ability-sdk` + `nen-engine`, 77 tests) servent
> **une seule route de ~530 LOC** (`/simulations`).
> **12 740 LOC de pile parallèle** (`lib/nen/*` + `lib/tour/hatsu.ts` + i18n hatsu + `TourHatsuHud`)
> font tourner l'expérience hatsu **de tout le reste du site**, sans jamais toucher la première.

Preuve directe du gaspillage : les modules déclarent `interactionManifest`, `ui.componentKey`,
`allowedTargets`, `overlays` — écrits explicitement pour piloter l'UI. **0 consommateur dans
`apps/`.**

Exemple sur `chain-jail` : le module déclare `vow(...)`, `targetHasAffiliation('phantom-troupe')`,
`cost: { label: 'Serment : mort…', unit: 'vie' }` — déclaratif, vérifiable, testé. Le web déclare
`rule: 'usable only against Spiders…'` en texte libre, et **réimplémente la contrainte
impérativement** dans `hatsuInteractions.ts`.

**Troisième implémentation** : `lib/tour/hatsu.ts` réimplémente les hatsu pour la visite 3D
sur les mêmes clés `kind`. **67 des 82 techniques ont donc deux implémentations indépendantes** — et
l'une des deux (le DOM) a **0 test comportemental**.

### 3.2 Tests

| Workspace               | LOC src    | LOC test  | `it(`   | Ratio      |
| ----------------------- | ---------- | --------- | ------- | ---------- |
| `apps/web`              | 44 734     | 4 242     | 319     | 9,5 %      |
| **`apps/admin`**        | **2 151**  | **0**     | **0**   | **0 %**    |
| **`packages/database`** | **4 336**  | **0**     | **0**   | **0 %**    |
| `ability-modules`       | 6 899      | 975       | 29      | 14 %       |
| `identity-engine`       | 201        | 212       | 13      | **105 %**  |
| `knowledge-engine`      | 152        | 143       | 8       | 94 %       |
| `perspective-engine`    | 264        | 206       | 15      | 78 %       |
| `timeline-engine`       | 631        | 451       | 40      | 72 %       |
| `spoiler-engine`        | 76         | 53        | 3       | 70 %       |
| `world-engine`          | 818        | 438       | 16      | 54 %       |
| `nen-engine`            | 873        | 409       | 26      | 47 %       |
| **TOTAL**               | **63 706** | **7 844** | **528** | **12,3 %** |

- **0 test e2e, 0 test de composant, 0 mesure de couverture.** Aucun `jsdom`/`happy-dom`/
  `testing-library` déclaré → les **96 fichiers `.svelte` (27 649 LOC) sont hors couverture par
  construction**.
- **`apps/admin` : 0 test sur toute la surface d'authentification** (`session.ts` 82 l,
  `rate-limit.ts` 48 l, `hooks.server.ts` 45 l, `login/+page.server.ts` 55 l). Sans script `test`,
  donc **silencieusement sauté par `turbo test`**.
- **`packages/database` : 4 332 des 4 336 LOC échappent à tous les garde-fous** — hors
  `tsconfig.include` (jamais typecheckées), hors tests, et `no-explicit-any`/`no-console`
  explicitement désactivés pour ce chemin. Ce sont les backfills (`backfill_timeline.mjs` 1 117 l,
  `backfill_catalog_map.mjs` 1 042 l) **rejoués à chaque déploiement en production**.
- `hatsuInteractions.ts` (2 462 l) et `GlobalHatsuEffects.svelte` (3 030 l) : **4 et 0 tests
  comportementaux**. Les 4 tests existants ne valident que la forme de la table de routage. Par
  contraste, `tour/hatsu.test.ts` fait **88 tests comportementaux** — l'écart de rigueur entre les
  deux couches jumelles est frappant.
- Runner divergent : `spoiler-engine` sous **jest**, les 12 autres sous **vitest**.

### 3.3 Dette et sûreté de type

Le niveau de dette **déclarée** est exceptionnellement bas :

| Marqueur                                 | Occurrences                       |
| ---------------------------------------- | --------------------------------- |
| `TODO`                                   | **2**                             |
| `FIXME` / `HACK` / `XXX` / `@deprecated` | **0**                             |
| `@ts-ignore` / `@ts-expect-error`        | **0**                             |
| `console.log` hors `packages/database`   | **0**                             |
| `eslint-disable`                         | 10, tous justifiés en commentaire |

`strict: true` effectif partout, `no-explicit-any` en **erreur** dans `packages/**` (2 occurrences
sur 12 489 LOC). Mais **166 `any` dans les apps** (140 web + 26 admin), concentrés sur
`compare/+page.svelte` (32) et `lib/server/character-timeline.ts` (23), où la règle n'est qu'un
`warn`. **`noUncheckedIndexedAccess` absent partout** — c'est le flag manquant au meilleur rapport
effort/gain, vu l'usage massif de `Record<Kind, …>` dans la couche hatsu.

**Toutes les règles ESLint type-aware sont désactivées** (choix documenté dans `eslint.config.js`) :
perte de `no-floating-promises` et `no-misused-promises` sur une base fortement asynchrone.

Deux commentaires trompeurs à corriger : `knowledge-engine/src/index.ts:37` (`// Stub`) et
`timeline-engine/src/index.ts:68` (`// Stub implementation`) surmontent des implémentations
complètes. En revanche `timeline-engine/src/index.ts:213` est un vrai manque :
`getNearestSnapshot()` retourne `null` en dur alors que la JSDoc promet « Loads the nearest snapshot
then replays subsequent events » — `getWorldState` rejoue donc **tous** les événements à chaque
requête.

### 3.4 CI et infrastructure

**CI** (`.github/workflows/ci.yml`, un seul job) : lint → format:check → typecheck → build packages →
build apps → test. Manquent : **couverture, audit de dépendances, e2e, build d'image Docker,
contrôle de dérive de migration** (`prisma migrate diff --exit-code`) — ce dernier est critique
puisque le dev utilise `db push` et la prod `migrate deploy`. Pas de `concurrency:`, pas de
`timeout-minutes`, pas de Dependabot/Renovate, pas de `CODEOWNERS`.

Bruit à supprimer : la CI démarre un service `postgres:16-alpine` et passe `DATABASE_URL` à
`pnpm test`, mais **aucun test n'accède à une base** — tous les moteurs reçoivent un faux client
Prisma. Coût pur, et illusion d'une couverture d'intégration inexistante.

**Migrations Prisma** : le dossier existe bien (`20260726000000_initial/migration.sql`, 797 l) et la
cohérence est **parfaite** — 31 modèles ↔ 33 tables (les 2 en trop sont les jonctions implicites),
26 enums ↔ 26 types, diff vide dans les deux sens. Réserve : **une seule migration**, tout le reste
passe par `db push`.

**Infra** — le volet le plus mature du dépôt : `no-new-privileges`, secrets obligatoires via
`${VAR:?}`, healthchecks chaînés, `deploy.sh` qui refuse de déployer si `replace-with-` subsiste,
`backup.sh` qui **valide son propre dump avant rotation**. Manques : les Dockerfiles font
`COPY --from=builder /app /app` (l'image de prod embarque sources + devDependencies + toolchain), les
**sauvegardes ne quittent jamais l'hôte** (volume Docker local — perdre le serveur Hetzner perd la
base _et_ ses 14 jours de dumps), **la restauration n'est jamais testée automatiquement**, et il n'y
a **ni rollback ni tag d'image**, ni supervision (Sentry figure dans `packages/config`, package mort).

---

## 4. Complétude UX / éditoriale — 5 / 10

### 4.1 Conformité de licence — P0

Traité en tête de ce document. `LICENSE-DATA` exige la ligne
`Catalogue and ship maps by Ginks — https://github.com/PISSARAW/Black-Whale — licensed under CC BY 4.0.`
« wherever the material is displayed, including in a deployed web interface ». Le footer
(`+layout.svelte:225`) n'affiche que le copyright et le disclaimer Togashi/Shueisha. **Aucun lien
vers le dépôt dans le layout** — le seul lien GitHub du site pointe vers `blueprint.json` depuis
`/tour/sources`.

Correctif : deux clés dans `en.ts`/`fr.ts` + une ligne dans `.footer-legal`. Coût : 15 minutes.

### 4.2 Le filtre à spoilers — P0

Le backend est complet et soigné (`SPOILER_COOKIE = 'userSpoilerLimit'`, parsing durci contre `NaN`,
6 loaders consommateurs, bandeaux traduits). **Aucun contrôle de l'UI publique ne pose ce cookie** :
`grep -rn "document.cookie\|cookies.set" apps/web/src` → **0 résultat**. Le seul écrivain du projet
est l'admin, sur un cookie différent (`adminSpoilerLimit`).

Le seul bouton « Spoilers » visible (`ship/+page.svelte:607`) bascule
`mapState.filters.spoilersEnabled`, champ lu uniquement par `GlobalHatsuEffects.svelte` pour
sauvegarder un snapshot d'état. **Il ne filtre rien**, et il est stylé `class="danger"` avec un `!`.

Effet composé : si le cookie _était_ posé, une fiche au-delà de la limite déclenche
`throw error(404)` — et il n'existe **aucun `+error.svelte` dans tout le projet** (`find` → 0), donc
page SvelteKit brute, en anglais, hors layout, hors i18n.

Deux routes non filtrées par ailleurs : **`/abilities` ne lit aucun cookie** (les 81 capacités, dont
celles révélées ch. 400+, sont servies à un lecteur arrêté au ch. 350) et **`/characters` sert les
223 fiches** en ne masquant que `beyondLineage` — alors que l'helper `isVisibleAtSpoilerLimit()`
existe déjà et n'est simplement pas appelé.

### 4.3 État par route

| Route                                                                                                        | Nav                                       | `+error` | Empty                               | Responsive                       | SEO       |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | -------- | ----------------------------------- | -------------------------------- | --------- |
| `/`, `/ship`, `/timeline`, `/characters`, `/characters/[slug]`, `/compare`, `/relationships`, `/simulations` | ✓                                         | ✗        | ✓ (sauf `/compare`, `/simulations`) | ✓ `@media` + `clamp`             | ✓         |
| `/perspectives`, `/abilities`, `/tour`, `/tour/sources`                                                      | ✓                                         | ✗        | ✓                                   | ⚠️ Tailwind seul, **0 `@media`** | ✓         |
| `/perspectives/[character]`, `/knowledge/[character]`                                                        | orphelines (liées depuis `/perspectives`) | ✗        | ✗                                   | ⚠️ 1 breakpoint                  | `noindex` |
| `/bodies/[id]`, `/consciousness/[id]`                                                                        | **0 lien entrant**                        | ✗        | ✗                                   | 🔴 **0 breakpoint**              | `noindex` |

Le SEO est le volet le plus abouti : `canonical`, `og:*`, `twitter:*`, JSON-LD (`websiteSchema`,
`breadcrumbSchema`, `characterSchema`, `collectionSchema`), `site.webmanifest`, `lang` injecté
serveur, sitemap avec `hreflang` + `x-default` (11 routes + 223 fiches × 2 locales).

Deux anomalies dans `robots.txt` : `Disallow: /_map-preview` vise une route **qui n'existe pas**, et
`Disallow: /perspectives/*/` — le slash final fait que `/perspectives/kurapika` **n'est pas
couvert** ; la règle est inopérante (le `noindex` rattrape, mais l'intention est cassée).

Navigation : le header n'expose que 4 liens primaires, **masqués sous 800 px** ; les 6 sections
secondaires ne sont accessibles que via le tiroir (donc **JS requis**). Le libellé
`« CLASSIFIED / 05 SECTIONS »` en annonce **5** alors qu'il y en a **6**. La CommandPalette (`⌘K`) ne
liste que 8 destinations — `/tour` et `/tour/sources` en sont absents.

### 4.4 i18n — le point fort

Diff programmatique par import réel des modules :

| Catalogue                          | Clés EN   | Clés FR   | Manquantes |
| ---------------------------------- | --------- | --------- | ---------- |
| `messages/{en,fr}.ts`              | **1 152** | **1 152** | **0**      |
| `messages/hatsu-status/{en,fr}.ts` | 315       | 315       | **0**      |
| `hatsuRegistry.ts` ↔ `hatsu-fr.ts` | 81        | 81        | **0**      |

Parité **parfaite**, y compris sur les 227 valeurs-fonctions (pluriels/interpolations). Aucun
français détecté dans `en.ts`. L'absence de `hatsu-en.ts` n'est pas un trou : `hatsuRegistry.ts`
_est_ la source anglaise, `hatsu-fr.ts` un overlay par id — architecture documentée.

**Le trou est ailleurs : les 38 cartes SVG ne sont jamais internationalisées.**
**231 `<text>` + 67 `aria-label` littéraux**, tous en anglais — dont
`aria-label="Inspect map area"` **répété 50 fois à l'identique** (à la navigation clavier, 50 cibles
portent le même nom). Et **4 libellés français égarés dans ce corpus anglais** :
`central-courthouse.svelte:49` « Tribunal Central », `cineplex.svelte:63` « Cineplex (Multiplexe) »,
`general-cabins.svelte:90` « Corridor Principal », `prince-apartment.svelte:71` « Appartement
Princier ». Un visiteur EN voit du français, un visiteur FR voit de l'anglais.

Messages d'erreur serveur non traduits : `simulations/+page.server.ts:99,124`,
`characters/[slug]/+page.server.ts:78,82`.

### 4.5 Accessibilité

**Socle sérieux** : 0 `<img>` sans `alt` (il n'y a aucun `<img>`), 45 `<button>` dont **0 sans nom
accessible**, 53 des 56 éléments cliquables non-boutons portent `role` + `tabindex` + `onkeydown`
(les 3 restants sont des backdrops `role="presentation"`), `:focus-visible` global, skip-link
fonctionnel, `aria-current`, `aria-expanded`/`aria-controls`, focus renvoyé à la fermeture,
`prefers-reduced-motion`, 11 `aria-live`. Le tour 3D détecte le pointeur grossier et fournit un
joystick tactile + un fallback WebGL.

**Manques quantifiés** :

1. **46 `<svg>` sur 48 sans `role="img"`/`aria-label`** — les 38 cartes de pont sont des graphiques
   non étiquetés dont le lecteur d'écran ne lit que les `<text>` bruts.
2. **21 cartes sur 32 ont un handler vide** : `function handleElementClick(_elementId: string) {}`
   (« Room interactions are not wired up yet »). **~97 cibles tabulables sans aucun effet.**
3. **Contraste sur fond `#070a0c`** : `text-gray-600` → **2,63:1** (4 occurrences, dont le coût des
   abilities) ; `text-gray-500` → **4,11:1** (37 occurrences, échec AA) ; ivoire `/30`–`/45` →
   **2,52–4,46:1** (14 occurrences dans `/tour`). Conformes : `text-gray-400` 7,82:1, `bw-gold`
   8,76:1.
4. La palette Nen (`GlobalHatsuController.svelte:93`) n'a ni `role="dialog"`/`aria-modal`, ni
   fermeture par Échap, ni piège de focus — contrairement au tiroir de nav et à la CommandPalette
   qui, eux, les ont.

### 4.6 Éditorial

Chaque route complexe a une `intro` d'une phrase, mais **aucun onboarding pour les concepts durs**
(perspective subjective, `rulePolicy` `rule-compatible`/`strict-canon`/`sandbox`, corps vs
conscience). `/tour/sources` est excellent — mais ne couvre que la reconstruction du navire.

**Absents** : `/about`, `/sources` global, `/methodology`, `/credits`. Rien sur la provenance du
catalogue des 223 personnages, des chapitres, des abilities — alors que c'est précisément l'argument
du projet (« every record belongs to a time, a source, and a point of view »).

`/abilities` affiche 81 entrées en grille plate **sans recherche, sans filtre, sans tri**, alors que
`/characters` et la palette Nen en ont.

---

## 5. Plan priorisé

### P0 — à faire avant tout (≈ 1 journée)

| #   | Action                                                                                                      | Fichiers                              |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 1   | **Ajouter le crédit CC BY 4.0 + lien dépôt dans le footer**                                                 | `+layout.svelte:225`, `en.ts`/`fr.ts` |
| 2   | **Brancher un sélecteur de limite de spoilers** qui pose `userSpoilerLimit` (le backend est prêt)           | nouveau composant + `+layout.svelte`  |
| 3   | **Supprimer ou brancher le bouton « Spoilers » de `/ship`** — il ne filtre rien aujourd'hui                 | `ship/+page.svelte:607`               |
| 4   | **Créer `+error.svelte`** (web + admin) — 404 et 429 sortent en page brute                                  | `apps/web/src/routes/+error.svelte`   |
| 5   | **Retirer les 2 liens vers les maquettes** depuis `/perspectives`, ou dépublier les 4 routes stub           | `perspectives/+page.svelte:69,73`     |
| 6   | **Appliquer le spoiler à `/abilities` et à la liste `/characters`** (`isVisibleAtSpoilerLimit` existe déjà) | 2 `+page.server.ts`                   |

### P1 — écarts README ↔ réalité (≈ 1 semaine)

| #   | Action                                                                                                                                                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7   | **Sortir les 11 arêtes de relations du fichier serveur** vers `data/relations.json`, et les étendre (7 princes sur 14 n'ont aucune relation, 0 faction de Hunters)                              |
| 8   | **Brancher les 3 formulaires admin** (`export const actions` manquant sur `characters`, `facts`, `abilities`) — ou retirer les modales                                                          |
| 9   | **Rendre la `MapScene` de `/simulations` sur une vraie carte** — elle est déjà calculée, elle est réduite à trois `.length`                                                                     |
| 10  | **Exposer plus d'une action de simulation** (aujourd'hui : `bungee-gum/attach` par `hisoka` en dur)                                                                                             |
| 11  | **Corriger le README** : 301 spaces (pas 282), 34 intérieurs (pas 33) ; retirer `@tanstack/svelte-query` du tableau Tech ; retirer `contracts` et `ui` de l'arborescence tant qu'ils sont vides |
| 12  | Supprimer `packages/map-engine`, `packages/config`, `apps/worker`, `packages/contracts`, `packages/ui`, l'override eslint `tools/**`, `packages/database/package-lock.json`                     |

### P2 — dette structurelle (le vrai chantier)

| #   | Action                                                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 13  | **Unifier le catalogue des hatsu.** Faire de `apps/web/src/lib/nen/hatsuRegistry.ts` une **projection** de `packages/ability-modules`, pas une seconde déclaration. 27 `name` et 48 `owner` divergent déjà. Les modules exposent `interactionManifest` / `componentKey` écrits pour ça, avec 0 consommateur. |
| 14  | **Réconcilier les deux implémentations DOM (2 462 l) et 3D (2 554 l)** — 61 des 81 techniques sont écrites deux fois, dont une sans test comportemental                                                                                                                                                      |
| 15  | **Tests pour `apps/admin`** (2 151 l, 0 test, dont toute l'auth) et ajout d'un script `test` pour ne plus être sauté par `turbo test`                                                                                                                                                                        |
| 16  | **Faire entrer `packages/database/prisma/*.mjs`** (4 332 l rejouées en prod à chaque déploiement) dans le typecheck et les tests                                                                                                                                                                             |
| 17  | Ajouter jsdom/testing-library + au moins un parcours e2e (activation d'un hatsu, login admin)                                                                                                                                                                                                                |
| 18  | Activer `noUncheckedIndexedAccess` ; ajouter couverture, `pnpm audit`, `prisma migrate diff --exit-code` en CI ; supprimer le service postgres inutile de la CI                                                                                                                                              |
| 19  | **Exfiltrer les sauvegardes hors de l'hôte** et tester la restauration automatiquement                                                                                                                                                                                                                       |

### P3 — densification du canon

| #   | Action                                                                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 20  | **Passer les événements de `backfill_timeline.mjs` à `data/events.json`** — la donnée narrative est aujourd'hui du code, hors licence CC BY et hors portée des contributions                               |
| 21  | **Densifier : 46 des 62 chapitres de l'arc n'ont qu'un seul événement**, 68 chapitres sur 76 n'ont pas de fiche                                                                                            |
| 22  | ~~Corriger les 2 `ownerId` cassés (`benjamin-hui-guo-rou`, `oito-hui-guo-rou`)~~ (fait), ~~ajouter `justice-bureau` à `factions.json`~~ (fait), ajouter Kortopi et Shalnark, donner des gardes à Salé-salé |
| 23  | ~~Renseigner les 47 `cost` manquants (le README les promet)~~ (fait — dans les modules), ajouter un champ chapitre aux abilities                                                                           |
| 24  | Reconstruire `tier-3-political-ward` (seule pièce du catalogue sans géométrie)                                                                                                                             |
| 25  | i18n des 38 cartes SVG (231 `<text>` + 67 `aria-label`), corriger les 4 libellés français égarés                                                                                                           |
| 26  | Créer `/about` + `/sources` global ; corriger « 05 SECTIONS » → 06 ; ajouter `/tour` à la CommandPalette                                                                                                   |
| 27  | a11y : `role="img"` + `aria-label` sur les 46 SVG, remonter `text-gray-500`/`600`, brancher ou retirer les ~97 cibles tabulables inertes des cartes                                                        |

---

## Ce qu'il ne faut pas casser

- **Dette déclarée quasi nulle** : 2 TODO, 0 FIXME/HACK, **0 `@ts-ignore`**, 0 `console.log` hors
  scripts opérateur, 10 `eslint-disable` tous justifiés en commentaire.
- **11 des 14 packages non vides ont un ratio test/source > 44 %**, dont `identity-engine` 105 %.
- **La reconstruction du navire est irréprochable** : connexe, 0 salle inaccessible, 0 override mort,
  0 scellement inerte, 0 `locationId` orphelin.
- **Parité i18n parfaite** sur 1 152 + 315 clés, valeurs-fonctions incluses.
- **Cohérence schéma ↔ migration parfaite** et lockfile pnpm sain (17 importers).
- **Le SEO est complet** : JSON-LD, hreflang, sitemap dynamique sur 223 fiches.
- **Les commentaires du dépôt expliquent systématiquement le _pourquoi_** (le bug corrigé dans
  `backup.sh`, l'absence de `version:` dans `pnpm/action-setup`, la génération Prisma avant
  typecheck). C'est rare — à préserver.

---

## Méthode et limites

Audit statique du dépôt (hors `node_modules`, `.git`, `dist`, `build`, `.svelte-kit`), conduit par
quatre analyses parallèles puis contre-vérifié sur les affirmations les plus lourdes (cookie spoiler,
absence d'`actions` admin, absence de crédit CC BY, absence d'imports du moteur depuis `lib/nen`,
packages sans consommateur, `+error.svelte`, volumétrie du blueprint).

**Non vérifié faute d'environnement d'exécution :**

- **Aucun test n'a été exécuté** (`node_modules` absent). La connexité du navire a été revalidée par
  une réimplémentation Python de `deriveDoorways`, pas par `blueprint.test.ts`.
- **Aucune base PostgreSQL** : le nombre d'événements _réellement en base après seed + backfills_ et
  la synchronisation des 223 slugs `Character` n'ont pas pu être observés. Les chiffres portent sur
  les définitions statiques.
- Le **405 des formulaires admin** est déduit du contrat SvelteKit (page sans `actions` + POST),
  confirmé par l'absence d'`export const actions` — mais non observé au runtime.
- **La qualité fonctionnelle des 81 modules d'abilities** (6 899 l) n'a pas été auditée
  individuellement, seulement leur enregistrement et leurs métadonnées.
- Aucun rendu navigateur : les mesures de contraste sont calculées sur les variables CSS déclarées,
  et le responsive est déduit des breakpoints présents dans le code.
