# Reconstruction V2 — backlog détaillé

> **Objectif.** Publier un atlas spatio-temporel éditorial, explicable et partageable : chaque
> position, déplacement et absence doit pouvoir être relié à une preuve, lu depuis la perspective
> d’un personnage et distingué d’une déduction ou d’une interaction Nen.
>
> **Point de départ.** La version actuelle possède la chronologie canonique, la coupe globale, la
> scène 3D, le suivi d’un personnage, les différences temporelles, les trajectoires animées, les
> perspectives calculées par le moteur, les sources techniques, les URLs partageables et les Hatsu
> physiques. Huit tests unitaires couvrent les nouvelles projections pures.
>
> **Définition de fini V2.** Les gates `D → E → P → N → U → Q → R` sont validées dans l’ordre,
> les parcours essentiels fonctionnent sur mobile et au clavier, chaque affirmation visible possède
> une provenance compréhensible, aucune interaction Nen ne peut être prise pour du canon et la route
> de production passe ses smoke tests.

---

## 1. Invariants

| ID  | Invariant                                                                    | Conséquence                                                          |
| --- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| I1  | Une absence de position signifie « inconnue », jamais « hors du navire ».    | Les états inconnus restent explicitement représentés.                |
| I2  | Corps, conscience, apparence et identité perçue sont quatre axes distincts.  | Aucun déplacement de corps ne simule un transfert de conscience.     |
| I3  | Canon, dérivation et inférence ne partagent jamais le même rendu sans badge. | Toute projection transporte son niveau de preuve.                    |
| I4  | Une perspective ne lit que ce que son observateur sait à l’événement choisi. | Le client ne filtre pas naïvement la vérité objective.               |
| I5  | La limite de spoilers s’applique avant sérialisation.                        | Rien de masqué ne fuite dans le HTML, l’URL, les attributs ou l’API. |
| I6  | Un Hatsu agit sur la visite, pas sur le registre canonique.                  | Les effets visiteurs sont isolés et réinitialisables.                |
| I7  | La géométrie vient du blueprint partagé.                                     | Aucun plan parallèle propre à Reconstruction.                        |
| I8  | Toute animation possède un équivalent statique.                              | `prefers-reduced-motion` conserve toute l’information.               |
| I9  | FR et EN restent à parité.                                                   | Toute chaîne visible passe par les catalogues i18n.                  |
| I10 | Une URL partagée restaure une lecture, jamais une mutation.                  | Les paramètres sont validés et sans effet sur le canon.              |

---

## 2. Priorités, tailles et gates

- **P0** : bloque la publication.
- **P1** : nécessaire à la promesse éditoriale V2.
- **P2** : amélioration différable après publication.
- **S** : moins d’une journée ; **M** : 1–2 jours ; **L** : 3–5 jours ; **XL** : à redécouper.
- Un ticket est fini avec logique testée, FR/EN, accessibilité, gestion des spoilers et documentation
  de provenance lorsqu’il introduit une donnée.

Ordre des gates :

`D données → E explicabilité → P perspectives → N narration → U usage → Q qualité → R release`

---

## 3. Epic D — données et provenance éditoriale

**But.** Remplacer les identifiants techniques par des preuves qu’un lecteur peut vérifier.

| ID       | P   | Taille | Dépend de | Tâche                                                                                                          | Sortie attendue                |
| -------- | --- | ------ | --------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| REC2-D01 | P0  | M      | —         | Définir `ReconstructionClaim` : sujet, prédicat, valeur, intervalle, précision, certitude, sources et méthode. | `lib/reconstruction/claims.ts` |
| REC2-D02 | P0  | M      | D01       | Définir `ReconstructionSourceView` avec chapitre, page, description, type et lien interne autorisé.            | projection serveur typée       |
| REC2-D03 | P0  | L      | D02       | Résoudre les `sourceIds` vers les lignes `Source` et produire un libellé de repli honnête.                     | loader enrichi                 |
| REC2-D04 | P0  | L      | D01       | Rattacher chaque présence historique et transition du world engine à ses claims.                               | index événement → claims       |
| REC2-D05 | P0  | M      | D03       | Afficher chapitre, page et description dans le panneau de preuve.                                              | `EvidencePanel.svelte`         |
| REC2-D06 | P0  | M      | D01       | Ajouter la méthode : explicite, calcul temporel, héritage de dernière position ou inférence éditoriale.        | badges + explication           |
| REC2-D07 | P1  | M      | D04       | Calculer une métrique de couverture par événement : sourcé, partiel, non sourcé.                               | indicateur de couverture       |
| REC2-D08 | P1  | L      | D04       | Créer un validateur éditorial détectant claim sans source, intervalle impossible et certitude incohérente.     | test d’intégrité global        |
| REC2-D09 | P2  | M      | D03       | Lier une source au lecteur de chapitre lorsque l’édition et les droits le permettent.                          | lien contextuel                |

### Critères d’acceptation D

- Un déplacement affiché ouvre au moins une source ou une explication de dérivation.
- Une page inconnue est libellée « page non consignée », sans valeur inventée.
- Une position probable ne peut pas être rendue comme attestée par simple précision `EXACT_ROOM`.
- Le validateur produit l’événement, l’entité et la règle violée dans chaque erreur.

**Gate D** — 100 % des changements affichés dans le parcours de référence ont une provenance
compréhensible ; zéro claim invalide dans le validateur.

---

## 4. Epic E — explicabilité et comparaison temporelle

**But.** Répondre à « qu’est-ce qui a changé ? » et « pourquoi la carte affirme-t-elle cela ? ».

| ID       | P   | Taille | Dépend de | Tâche                                                                            | Sortie attendue             |
| -------- | --- | ------ | --------- | -------------------------------------------------------------------------------- | --------------------------- |
| REC2-E01 | P0  | M      | D01       | Extraire le calcul de snapshot et de diff hors de `+page.svelte`.                | `snapshot.ts`, `diff.ts`    |
| REC2-E02 | P0  | L      | E01       | Tester arrivées, départs, changements de précision et world events prioritaires. | matrice de tests            |
| REC2-E03 | P1  | L      | E01       | Comparer deux événements librement, pas seulement deux voisins.                  | sélecteur A/B               |
| REC2-E04 | P1  | M      | E03       | Afficher les états ajouté, retiré, déplacé, requalifié et devenu inconnu.        | `TemporalComparison.svelte` |
| REC2-E05 | P1  | M      | D04, E01  | Créer « Pourquoi cette position ? » depuis la chaîne de claims appliqués.        | `WhyPositionPanel.svelte`   |
| REC2-E06 | P1  | L      | E01       | Représenter corps, conscience et apparence dans le diff.                         | diff identitaire typé       |
| REC2-E07 | P1  | M      | E06       | Rendre les transferts de conscience sans tracer un faux déplacement corporel.    | transition dédiée           |
| REC2-E08 | P2  | M      | E03       | Exporter un résumé texte accessible de la comparaison.                           | copie/presse-papiers        |

### Critères d’acceptation E

- Comparer A à B puis B à A inverse correctement chaque changement.
- Une baisse de précision est visible même si le `locationId` ne change pas.
- Le panneau « pourquoi » reconstitue l’ordre exact des claims, sans lire le DOM.
- Un transfert de conscience ne crée aucune trajectoire de corps.

**Gate E** — cinq scénarios de référence sont explicables intégralement depuis l’interface et leurs
diffs sont couverts par des tests déterministes.

---

## 5. Epic P — perspectives et ignorance

**But.** Faire de la subjectivité une lecture complète, pas seulement un filtre de marqueurs.

| ID       | P   | Taille | Dépend de | Tâche                                                                                | Sortie attendue                 |
| -------- | --- | ------ | --------- | ------------------------------------------------------------------------------------ | ------------------------------- |
| REC2-P01 | P0  | M      | —         | Versionner la réponse de `/reconstruction/perspective`.                              | contrat JSON stable             |
| REC2-P02 | P0  | M      | P01       | Valider observateur, événement et limite de spoilers côté serveur.                   | erreurs 400/404 sûres           |
| REC2-P03 | P0  | L      | P01       | Projeter positions visibles, faits connus, croyances et informations périmées.       | `PerspectiveProjection` complet |
| REC2-P04 | P0  | M      | P03       | Distinguer « invisible », « inconnu », « cru ailleurs » et « dernière information ». | quatre états visuels            |
| REC2-P05 | P1  | L      | P03       | Comparer perspective du personnage et canon objectif côte à côte.                    | vue scindée                     |
| REC2-P06 | P1  | L      | P03       | Comparer deux personnages au même événement.                                         | divergences explicites          |
| REC2-P07 | P1  | M      | P05       | Expliquer chaque divergence par connaissance, croyance ou absence de transmission.   | panneau de divergence           |
| REC2-P08 | P1  | M      | P01       | Ajouter cache serveur borné par observateur, événement et spoiler.                   | cache instrumenté               |
| REC2-P09 | P2  | M      | P05       | Synchroniser survol et sélection entre les colonnes comparées.                       | interaction liée                |

### Critères d’acceptation P

- Une entité invisible n’est pas envoyée comme marqueur secret au client.
- Une croyance fausse est visible comme croyance, jamais comme position canonique.
- Changer la limite de spoilers invalide le cache et retire les faits postérieurs.
- Une erreur de perspective laisse la vue canonique utilisable.

**Gate P** — trois personnages aux connaissances divergentes produisent trois cartes réellement
différentes, vérifiées par tests serveur et sans fuite de spoilers.

---

## 6. Epic N — narration et fronts simultanés

**But.** Donner une porte d’entrée éditoriale à un atlas qui ne doit pas exiger la mémoire du manga.

| ID       | P   | Taille | Dépend de | Tâche                                                                           | Sortie attendue            |
| -------- | --- | ------ | --------- | ------------------------------------------------------------------------------- | -------------------------- |
| REC2-N01 | P0  | M      | D         | Définir `ReconstructionStory` : étapes, cadrage, texte, personnages et sources. | schéma versionné           |
| REC2-N02 | P0  | M      | N01       | Créer un registre et un validateur de parcours.                                 | `stories/registry.ts`      |
| REC2-N03 | P1  | L      | N02       | Parcours « Guerre de succession ».                                              | parcours éditorial complet |
| REC2-N04 | P1  | L      | N02       | Parcours « Mafia et Heil-Ly ».                                                  | parcours éditorial complet |
| REC2-N05 | P1  | L      | N02       | Parcours « Brigade fantôme ».                                                   | parcours éditorial complet |
| REC2-N06 | P1  | M      | N02       | Afficher les fronts simultanés à un événement.                                  | panneau des fronts         |
| REC2-N07 | P1  | M      | N06       | Filtrer par faction, pont, personnage et importance narrative.                  | filtres combinables        |
| REC2-N08 | P1  | M      | N02       | Ajouter introduction, progression, sortie et reprise d’un parcours.             | lecteur guidé              |
| REC2-N09 | P2  | M      | N08       | Générer une carte de partage d’une étape, avec texte alternatif.                | capture partageable        |

### Critères d’acceptation N

- Chaque parcours comporte une accroche sans spoiler, un chapitre requis et une fin explicite.
- Une étape ne référence que des événements et personnages existants.
- Les fronts simultanés indiquent clairement « même moment », « avant » ou « après ».
- La lecture libre reste disponible sans lancer de parcours.

**Gate N** — les trois parcours sont relus éditorialement, intégralement sourcés et terminables au
clavier comme au tactile.

---

## 7. Epic U — onboarding, mobile et accessibilité

**But.** Rendre la reconstruction compréhensible et manipulable sur toutes les surfaces.

| ID       | P   | Taille | Dépend de | Tâche                                                                                     | Sortie attendue      |
| -------- | --- | ------ | --------- | ----------------------------------------------------------------------------------------- | -------------------- |
| REC2-U01 | P0  | M      | D, E      | Concevoir une entrée en trois gestes : temps, preuve, perspective.                        | onboarding rejouable |
| REC2-U02 | P0  | L      | —         | Transformer la grille trois colonnes en navigation mobile par panneaux.                   | shell responsive     |
| REC2-U03 | P0  | M      | U02       | Garantir des cibles tactiles de 44 px et un scrubber manipulable.                         | audit tactile vert   |
| REC2-U04 | P0  | M      | —         | Définir l’ordre de focus, les raccourcis et le retour de focus après panneau.             | navigation clavier   |
| REC2-U05 | P0  | M      | —         | Ajouter annonces ARIA pour événement, lecture, perspective et Hatsu.                      | live regions sobres  |
| REC2-U06 | P0  | M      | —         | Vérifier contrastes, zoom 200 %, texte agrandi et thèmes de certitude sans couleur seule. | audit WCAG AA        |
| REC2-U07 | P1  | M      | —         | Sauvegarder préférences de mouvement, densité de marqueurs et dernier mode.               | préférences locales  |
| REC2-U08 | P1  | M      | U02       | Ajouter un mode « liste » équivalent à la coupe.                                          | vue non graphique    |
| REC2-U09 | P2  | S      | U01       | Ajouter un glossaire contextuel des termes du manga et de la méthode.                     | bulles accessibles   |

### Critères d’acceptation U

- Le parcours principal est réalisable à 320 px sans défilement horizontal.
- Aucun état de certitude ne dépend uniquement de la couleur ou de l’animation.
- Fermer un panneau restitue le focus au contrôle qui l’a ouvert.
- La vue liste donne les mêmes positions, sources et actions que la carte.

**Gate U** — parcours manuel validé au clavier, VoiceOver/NVDA, écran tactile et mouvement réduit.

---

## 8. Epic H — Hatsu éditoriaux et 3D

**But.** Garantir que les Hatsu physiques restent utiles, explicables et séparés du canon.

| ID       | P   | Taille | Dépend de | Tâche                                                                                  | Sortie attendue           |
| -------- | --- | ------ | --------- | -------------------------------------------------------------------------------------- | ------------------------- |
| REC2-H01 | P0  | M      | —         | Afficher en permanence « interaction visiteur » pendant un effet Nen.                  | statut non canonique      |
| REC2-H02 | P0  | M      | —         | Réinitialiser le monde Nen lors d’un changement d’événement ou de perspective.         | isolation temporelle      |
| REC2-H03 | P0  | L      | —         | Tester activation, ciblage, changement de scène et nettoyage des effets.               | tests d’intégration Hatsu |
| REC2-H04 | P1  | M      | D         | Relier divination aux changements attestés suivants sans révéler au-delà des spoilers. | lecture future sûre       |
| REC2-H05 | P1  | M      | D         | Relier recherche et surveillance aux traces et sources autorisées.                     | résultat documentaire     |
| REC2-H06 | P1  | M      | —         | Localiser les rapports physiques au lieu d’afficher leurs identifiants internes.       | rapports FR/EN            |
| REC2-H07 | P1  | M      | —         | Fournir un retour équivalent sans WebGL.                                               | interaction 2D            |
| REC2-H08 | P2  | L      | H03       | Ajouter les tickers persistants uniquement aux techniques qui en ont besoin.           | cycle de vie borné        |

### Critères d’acceptation H

- Changer d’événement supprime toute marque, attache, portail ou altération visiteur.
- Aucun rapport brut comme `marked` ou `vision-ended` n’est visible en production.
- Une technique refusée explique sa cible, sa condition ou son coût manquant.
- Le résultat documentaire ne révèle aucune information au-delà de la limite de spoilers.

**Gate H** — matrice représentative de chaque famille de Hatsu validée en 2D, 3D, FR et EN.

---

## 9. Epic Q — architecture, tests et observabilité

**But.** Réduire le risque d’une route monolithique et rendre les régressions détectables.

| ID       | P   | Taille | Dépend de | Tâche                                                                                   | Sortie attendue         |
| -------- | --- | ------ | --------- | --------------------------------------------------------------------------------------- | ----------------------- |
| REC2-Q01 | P0  | L      | E01       | Extraire état temporel, lecture, sélection et suivi de la page de plus de 1 400 lignes. | contrôleurs dédiés      |
| REC2-Q02 | P0  | M      | Q01       | Tester le contrôleur de lecture : pause, fin, saut et cadence sémantique.               | tests unitaires         |
| REC2-Q03 | P0  | L      | P, U      | Ajouter tests navigateur : timeline, filtres, perspective, URL et erreur serveur.       | suite Playwright        |
| REC2-Q04 | P0  | M      | D         | Ajouter fixtures minimales déterministes sans dépendre de la base complète.             | factory de fixtures     |
| REC2-Q05 | P0  | M      | —         | Construire tous les paquets workspace avant `svelte-check`.                             | pipeline typecheck vert |
| REC2-Q06 | P0  | M      | —         | Journaliser latence du loader, réduction d’événements et API de perspective.            | métriques structurées   |
| REC2-Q07 | P1  | M      | Q06       | Définir budgets : loader, perspective, WebGL, taille JS et nombre de marqueurs.         | seuils CI               |
| REC2-Q08 | P1  | S      | —         | Ajouter une erreur WebGL spécifique et un retour direct à la coupe.                     | fallback testé          |
| REC2-Q09 | P1  | M      | —         | Tester les migrations de schéma de l’URL partageable.                                   | codec versionné         |

### Critères d’acceptation Q

- `svelte-check`, ESLint, Prettier, tests unitaires et Playwright passent dans un checkout neuf.
- Les tests navigateur n’utilisent ni délais arbitraires ni données de production.
- Une API de perspective lente ou en échec n’empêche pas la vue canonique.
- Les budgets échouent avec un message nommant la régression et sa mesure.

**Gate Q** — deux exécutions CI consécutives passent sur un checkout propre, sans retry.

---

## 10. Epic R — release et production

**But.** Publier la route avec données, migrations, supervision et retour arrière maîtrisés.

| ID       | P   | Taille | Dépend de | Tâche                                                                      | Sortie attendue       |
| -------- | --- | ------ | --------- | -------------------------------------------------------------------------- | --------------------- |
| REC2-R01 | P0  | M      | D, Q      | Auditer les données de production et générer le rapport de couverture.     | rapport signé         |
| REC2-R02 | P0  | M      | Q05       | Construire l’image Docker web depuis un checkout propre.                   | image immutable       |
| REC2-R03 | P0  | M      | R01       | Exécuter migrations et backfills sur une copie récente de production.      | répétition documentée |
| REC2-R04 | P0  | S      | R02       | Ajouter healthcheck et smoke test HTTP de `/reconstruction`.               | script automatisé     |
| REC2-R05 | P0  | M      | R03, R04  | Déployer en staging et vérifier les parcours de référence.                 | PV de recette         |
| REC2-R06 | P0  | S      | R05       | Documenter rollback applicatif et compatibilité de la base.                | runbook               |
| REC2-R07 | P0  | S      | R05       | Publier en production et contrôler SEO, logs, erreurs et temps de réponse. | V2 publique           |
| REC2-R08 | P1  | S      | R07       | Observer 48 h et classer les anomalies bloquantes ou différables.          | bilan post-release    |

### Smoke tests obligatoires

1. `/reconstruction` répond 200 avec et sans cookie de spoiler.
2. Un événement partagé par URL est restauré après rechargement.
3. Une perspective autorisée répond et une perspective invalide échoue proprement.
4. Le passage coupe → scène charge WebGL ou affiche son fallback.
5. Une panne contrôlée de base produit l’état d’erreur, jamais un navire vide canonique.
6. Aucun log ne contient de secret, requête brute sensible ou stack visible au lecteur.

**Gate R** — staging validé, rollback répété, production en 200 et aucun P0 ouvert.

---

## 11. Ordre d’exécution recommandé

### Lot 1 — vérité éditoriale

`D01 → D02 → D03 → D04 → D05 → D06 → D08`

La publication ne commence pas tant que la provenance visible reste un identifiant technique.

### Lot 2 — moteur explicable

`E01 → E02 → E03 → E04 → E05 → E06 → E07`

### Lot 3 — subjectivité complète

`P01 → P02 → P03 → P04 → P05 → P07 → P06 → P08`

### Lot 4 — expérience éditoriale

`N01 → N02 → N03/N04/N05 → N06 → N07 → N08`

Les trois parcours peuvent avancer en parallèle après validation du registre.

### Lot 5 — publication utilisable

`U02 → U03 → U04 → U05 → U06 → U01 → U08`

### Lot 6 — Hatsu sûrs

`H01 → H02 → H03 → H06 → H04/H05 → H07`

### Lot 7 — qualité et release

`Q01 → Q02 → Q04 → Q03 → Q05 → Q06 → Q07 → R01…R08`

---

## 12. Découpage de la release

### V2 publiable

- tous les tickets P0 ;
- REC2-E03 à E07 ;
- REC2-P03 à P07 ;
- trois parcours N03–N05 ;
- REC2-N06 à N08 ;
- REC2-U07 et U08 ;
- REC2-H04 à H07 ;
- REC2-Q07.

### Après V2

- lien direct vers un lecteur de planches selon les droits disponibles ;
- captures sociales générées ;
- synchronisation avancée des vues comparées ;
- glossaire enrichi ;
- tickers Hatsu supplémentaires ;
- export texte de comparaison.

---

## 13. Definition of Done d’un ticket

- comportement observable livré, sans placeholder ni identifiant technique visible ;
- logique métier hors composant quand elle peut être pure ;
- tests positifs, limites et échecs ;
- FR/EN à parité ;
- clavier, tactile, lecteur d’écran et mouvement réduit considérés ;
- limite de spoilers testée côté serveur ;
- provenance documentée pour toute donnée canonique ;
- aucun fichier utilisateur ou changement parallèle inclus dans le commit ;
- un commit cohérent et réversible par fonctionnalité.

---

## 14. Tableau de pilotage initial

| Gate | Tickets requis | État initial | Condition de passage                        |
| ---- | -------------- | ------------ | ------------------------------------------- |
| D    | D01–D06, D08   | À faire      | provenance humaine et validateur verts      |
| E    | E01–E07        | Partiel      | comparaison A/B et « pourquoi » testés      |
| P    | P01–P08        | Partiel      | aucune fuite, deux comparaisons subjectives |
| N    | N01–N08        | À faire      | trois parcours relus et terminables         |
| U    | U01–U08        | À auditer    | recette mobile, clavier et lecteur d’écran  |
| H    | H01–H07        | Partiel      | séparation canon/Nen et matrice de tests    |
| Q    | Q01–Q09        | Partiel      | CI propre, E2E et budgets verts             |
| R    | R01–R08        | À faire      | staging, rollback puis production stable    |
