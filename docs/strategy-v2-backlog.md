# Strategy V2 — backlog détaillé de publication

> **Objectif.** Transformer le scénario Strategy jouable en expérience publiable : une campagne de
> huit tours, subjective, déterministe, conforme au moteur Nen, explicable, accessible et testée sur
> les données de production.
>
> **Point de départ.** Le mode possède un scénario fermé à trois factions, douze lieux, objectifs
> asymétriques, points de commandement, brouillard de guerre, diplomatie, blessures, éliminations,
> personnalités adverses, Hatsu tactiques, sauvegarde par historique et 24 tests ciblés.
>
> **Définition de fini V2.** Toutes les gates P0 sont validées dans l’ordre, un replay donne le même
> checksum que la partie d’origine, aucune information cachée ne fuit, les Hatsu publiés passent par
> le moteur Nen, et le scénario est jouable au clavier, à la souris et au tactile en FR et en EN.

---

## 1. Invariants

| ID      | Invariant                                    | Conséquence                                                                 |
| ------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| STR-I01 | La simulation n’est jamais canonique.        | L’interface et les exports portent toujours la mention « branche simulée ». |
| STR-I02 | Le chapitre initial borne toute information. | Un Hatsu, membre, lieu ou objectif révélé plus tard est absent.             |
| STR-I03 | Le moteur est déterministe.                  | Seed, commandes et décisions adverses suffisent à reconstruire la partie.   |
| STR-I04 | Chaque faction ne lit que sa perspective.    | Carte, IA, journal et Hatsu consomment la même projection subjective.       |
| STR-I05 | Une conséquence est explicable.              | Aucun tirage ne produit une blessure sans facteurs et trace consultables.   |
| STR-I06 | Les règles Nen priment sur l’équilibrage.    | On ajuste coûts et cadence, jamais la nature attestée d’un Hatsu.           |
| STR-I07 | Un pacte modifie réellement le monde.        | Confiance, dette et trahison influencent ordres et mémoire adverse.         |
| STR-I08 | Les données géographiques restent partagées. | Aucun lieu ou voisinage parallèle n’est inventé dans Strategy.              |
| STR-I09 | FR et EN restent à parité.                   | Aucun texte visible n’est écrit directement dans la route finale.           |
| STR-I10 | Clavier, tactile et souris sont équivalents. | La carte ne constitue jamais l’unique moyen de donner un ordre.             |

---

## 2. Priorités, tailles et ordre des gates

- **P0** : bloque la publication.
- **P1** : requis pour la qualité V2, mais peut suivre le chemin critique.
- **P2** : amélioration reportable en V2.1.
- Tailles : **S** ≤ 1 jour, **M** 2–3 jours, **L** 4–6 jours, **XL** à redécouper.
- Un ticket n’est fermé qu’avec logique pure testée, refus testé, i18n, accessibilité et provenance.

Ordre des gates :

`S scénario → R replay → P perspective → N Nen → C conflits → D diplomatie → U UX → Q QA → X release`

---

## 3. Epic S — contrat de scénario éditorial

**But.** Remplacer l’assemblage implicite du store par un contenu versionné, validé et publiable.

| ID       | P   | Taille | Dépend de | Tâche                                                                                                            | Sortie attendue              |
| -------- | --- | ------ | --------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| STR2-S01 | P0  | M      | —         | Définir `StrategyScenarioV2` : version, chapitre, seed, durée, factions, lieux, objectifs, événements et échecs. | `strategy/scenario/types.ts` |
| STR2-S02 | P0  | M      | S01       | Créer un registre de scénarios et refuser les identifiants ou versions inconnus.                                 | `scenario/registry.ts`       |
| STR2-S03 | P0  | L      | S01       | Écrire « Guerre des gardes — chapitre 359 » avec roster et lieux éditorialement validés.                         | `scenarios/guards-359.ts`    |
| STR2-S04 | P0  | M      | S03       | Définir un objectif public et un objectif secret propre à chaque faction jouable.                                | catalogue d’objectifs        |
| STR2-S05 | P0  | M      | S03       | Sourcer positions, appartenances, capacités et événements initiaux.                                              | notes de provenance          |
| STR2-S06 | P0  | S      | S01       | Valider doublons, lieux absents, objectif impossible et durée incohérente.                                       | validateur + tests           |
| STR2-S07 | P1  | M      | S02       | Ajouter trois difficultés par paramètres, sans branches de règles cachées.                                       | presets typés                |
| STR2-S08 | P1  | L      | S02       | Ajouter un second scénario contrasté « Mafia et Heil-Ly ».                                                       | scénario jouable             |
| STR2-S09 | P2  | M      | S02       | Autoriser un bac à sable explicitement non équilibré.                                                            | preset sandbox               |

### Critères d’acceptation S

- Le scénario peut être chargé sans base complète depuis une fixture déterministe.
- Chaque objectif est atteignable dans la durée avec les unités initiales.
- Modifier la version invalide proprement une sauvegarde ancienne ou déclenche une migration testée.
- Le validateur échoue sur toute référence absente et affiche l’identifiant fautif.

**Gate S** — le scénario principal est validé, sourcé et jouable depuis son seul contrat versionné.

---

## 4. Epic R — commandes, replay et sauvegarde

**But.** Faire du journal de commandes la vérité commune de la reprise, du débrief et du diagnostic.

| ID       | P   | Taille | Dépend de | Tâche                                                                                     | Sortie attendue         |
| -------- | --- | ------ | --------- | ----------------------------------------------------------------------------------------- | ----------------------- |
| STR2-R01 | P0  | M      | S01       | Versionner `StrategyCommand`, `StrategyTurn` et `StrategyReplay`.                         | `replay/types.ts`       |
| STR2-R02 | P0  | M      | R01       | Enregistrer seed, scénario, ordres, diplomatie, Hatsu et décisions IA.                    | recorder pur            |
| STR2-R03 | P0  | L      | R02       | Rejouer une campagne complète depuis l’état initial.                                      | `replay/player.ts`      |
| STR2-R04 | P0  | M      | R03       | Calculer un checksum stable du résultat, des relations et des connaissances.              | checksum final          |
| STR2-R05 | P0  | M      | R01       | Valider taille, schéma et valeurs de chaque sauvegarde avant rejeu.                       | codec strict            |
| STR2-R06 | P0  | M      | R05       | Migrer la sauvegarde V1 actuelle ou expliquer son incompatibilité sans perte silencieuse. | migration V1→V2         |
| STR2-R07 | P1  | M      | R03       | Ajouter lecture, pause, pas à pas et scrubber par tour.                                   | `StrategyReplay.svelte` |
| STR2-R08 | P1  | S      | R05       | Importer et exporter un replay JSON sans données personnelles.                            | commandes UI            |
| STR2-R09 | P2  | M      | R08       | Produire un lien compact signé par checksum.                                              | codec URL               |

### Critères d’acceptation R

- Dix replays successifs d’une même campagne donnent le même checksum.
- Une sauvegarde tronquée, surdimensionnée ou d’une version inconnue n’est jamais partiellement jouée.
- La reprise conserve tour, blessures, relations, connaissances, effets Nen et résultat final.
- Le replay ne dépend ni de l’horloge système ni de l’ordre d’énumération des objets JavaScript.

**Gate R** — trois campagnes victoire/défaite/reprise sont identiques bit pour bit après rejeu.

---

## 5. Epic P — perception et brouillard de guerre

**But.** Garantir qu’une faction, l’IA et l’interface ne consomment jamais la réalité omnisciente.

| ID       | P   | Taille | Dépend de | Tâche                                                                                      | Sortie attendue              |
| -------- | --- | ------ | --------- | ------------------------------------------------------------------------------------------ | ---------------------------- |
| STR2-P01 | P0  | M      | R01       | Définir `StrategyPerspective` et ses quatre états spatiaux.                                | contrat subjectif            |
| STR2-P02 | P0  | L      | P01       | Projeter alliés, ennemis, relations, effets et connaissances depuis le world engine.       | projecteur pur               |
| STR2-P03 | P0  | M      | P02       | Alimenter carte, journal et objectifs uniquement depuis cette projection.                  | suppression lectures réelles |
| STR2-P04 | P0  | M      | P02       | Donner à l’IA la projection de sa propre faction, jamais celle du joueur.                  | entrée IA unique             |
| STR2-P05 | P0  | M      | P02       | Vieillir confirmation → probable → dernière position → inconnue selon une règle explicite. | dégradation testée           |
| STR2-P06 | P0  | M      | P02       | Empêcher rapports de combat et Hatsu de révéler un acteur non observé.                     | projection des événements    |
| STR2-P07 | P1  | M      | P03       | Ajouter une vue liste équivalente à la carte.                                              | panneau accessible           |
| STR2-P08 | P1  | M      | P05       | Expliquer source et âge d’un renseignement sélectionné.                                    | inspecteur d’intel           |

### Critères d’acceptation P

- Une position non observée est absente du DOM, du payload UI et de l’entrée du décideur adverse.
- Une rencontre révèle uniquement ce que les survivants ou capteurs ont effectivement observé.
- Changer d’observateur reconstruit la scène ; aucun marqueur précédent ne subsiste.
- Les quatre états restent distinguables sans couleur.

**Gate P** — audit automatisé de non-fuite vert pour joueur, deux IA et replay omniscient.

---

## 6. Epic N — Hatsu conformes au moteur Nen

**But.** Remplacer les familles tactiques génériques par des activations validées et persistées.

| ID       | P   | Taille | Dépend de | Tâche                                                                                                   | Sortie attendue      |
| -------- | --- | ------ | --------- | ------------------------------------------------------------------------------------------------------- | -------------------- |
| STR2-N01 | P0  | L      | R01, P02  | Définir l’adaptateur `StrategyNenAction` vers `NenRuntime`.                                             | contrat d’adaptation |
| STR2-N02 | P0  | M      | N01       | Construire la roue depuis `abilitiesByOwner` et les actions réellement disponibles.                     | sélecteur Hatsu      |
| STR2-N03 | P0  | M      | N01       | Afficher conditions, coût, portée, cible et raison exacte d’un refus.                                   | panneau d’activation |
| STR2-N04 | P0  | L      | N01       | Appliquer les événements Nen à la branche Strategy puis les projeter subjectivement.                    | effets persistants   |
| STR2-N05 | P0  | M      | N04       | Nettoyer expiration, source éliminée, malédiction post-mortem et fin de scénario.                       | cycle de vie testé   |
| STR2-N06 | P0  | L      | N04       | Publier un premier roster de quatre Hatsu individuels couvrant intel, mobilité, contrôle et protection. | matrice Hatsu        |
| STR2-N07 | P1  | L      | N06       | Ajouter interactions et contres entre les quatre Hatsu.                                                 | tests croisés        |
| STR2-N08 | P1  | M      | N04       | Autoriser l’IA à planifier un Hatsu depuis sa perception et sa mémoire.                                 | planificateur Nen IA |
| STR2-N09 | P2  | L      | N06       | Étendre le roster uniquement après revue canonique et playtest.                                         | nouveaux adaptateurs |

### Critères d’acceptation N

- Une activation interdite ne coûte rien, ne crée aucun événement et explique chaque condition non satisfaite.
- Aucun nom, propriétaire ou effet n’est dupliqué hors du catalogue Nen.
- Tout effet actif apparaît dans le replay, la sauvegarde et les perspectives autorisées.
- Les quatre Hatsu P0 possèdent chacun condition, coût, cible, durée, contre et cleanup.

**Gate N** — matrice 4 Hatsu × 3 factions × 3 états de cible verte, refus compris.

---

## 7. Epic C — rencontres et conséquences explicables

**But.** Remplacer le tirage binaire par une résolution qualitative fondée sur la situation.

| ID       | P   | Taille | Dépend de | Tâche                                                                  | Sortie attendue         |
| -------- | --- | ------ | --------- | ---------------------------------------------------------------------- | ----------------------- |
| STR2-C01 | P0  | M      | R01, P02  | Définir `EncounterContext`, facteurs et résultats qualitatifs.         | types de conflit        |
| STR2-C02 | P0  | L      | C01       | Résoudre nombre, surprise, garde, état, renseignement et avantage Nen. | résolveur pur           |
| STR2-C03 | P0  | M      | C02       | Ajouter retraite, poursuite et ordre conditionnel « ne pas engager ».  | commandes enrichies     |
| STR2-C04 | P0  | M      | C02       | Produire une explication structurée sans fuite d’identité.             | journal de causalité    |
| STR2-C05 | P0  | M      | C02       | Tester blessure, élimination, capture, repli et défense réussie.       | matrice de tests        |
| STR2-C06 | P1  | M      | C03       | Ajouter escorte et interception d’une unité nommée.                    | ordre d’escorte         |
| STR2-C07 | P1  | M      | C04       | Afficher le détail complet dans le débrief après la partie.            | inspecteur de rencontre |

### Critères d’acceptation C

- Un même contexte et une même seed produisent le même résultat et la même explication.
- Une unité ne connaît pas l’identité d’un assaillant non observé.
- La garde change un facteur visible ; elle ne force pas arbitrairement la victoire.
- Chaque élimination peut être reconstruite depuis commandes, perceptions et événements Nen.

**Gate C** — aucun résultat de la matrice de conflits ne dépend d’un tirage non journalisé.

---

## 8. Epic D — diplomatie et mémoire des factions

**But.** Faire des accords un système durable plutôt qu’un modificateur de destination.

| ID       | P   | Taille | Dépend de | Tâche                                                                             | Sortie attendue         |
| -------- | --- | ------ | --------- | --------------------------------------------------------------------------------- | ----------------------- |
| STR2-D01 | P0  | M      | R01       | Versionner confiance, peur, dette, hostilité, pactes et griefs.                   | état relationnel        |
| STR2-D02 | P0  | M      | D01       | Définir offres typées : information, passage, protection, menace et pacte.        | commandes diplomatiques |
| STR2-D03 | P0  | L      | D02, P02  | Évaluer une offre depuis les connaissances, objectifs et mémoire du destinataire. | évaluateur pur          |
| STR2-D04 | P0  | M      | D01       | Mémoriser refus, promesse tenue, dette remboursée et trahison.                    | journal relationnel     |
| STR2-D05 | P0  | M      | D03       | Empêcher un accord de transmettre une information que l’émetteur ignore.          | projection des échanges |
| STR2-D06 | P1  | M      | D04       | Ajouter contre-proposition et expiration d’un accord.                             | cycle de négociation    |
| STR2-D07 | P1  | M      | D04       | Expliquer au débrief pourquoi une faction a accepté, refusé ou trahi.             | inspecteur diplomatique |

### Critères d’acceptation D

- Une trahison survit à la sauvegarde et influence les décisions ultérieures.
- Une information échangée conserve sa source, sa date et sa confiance.
- Un pacte expiré ne bloque plus les rencontres et produit un événement explicite.
- L’IA ne négocie qu’avec les faits de sa perspective.

**Gate D** — pacte tenu, pacte refusé et trahison se rejouent avec mémoire identique.

---

## 9. Epic U — interface, accessibilité et localisation

**But.** Rendre la campagne compréhensible et jouable sur toutes les surfaces supportées.

| ID       | P   | Taille | Dépend de | Tâche                                                                        | Sortie attendue              |
| -------- | --- | ------ | --------- | ---------------------------------------------------------------------------- | ---------------------------- |
| STR2-U01 | P0  | M      | S03       | Créer un briefing en trois gestes : doctrine, objectif, menace.              | onboarding rejouable         |
| STR2-U02 | P0  | L      | P03       | Rendre la carte sélectionnable et synchronisée avec la liste d’unités.       | interaction bidirectionnelle |
| STR2-U03 | P0  | L      | —         | Concevoir la version mobile par panneaux carte/ordres/journal.               | responsive complet           |
| STR2-U04 | P0  | M      | U02       | Garantir ordre de focus, retour de focus et raccourcis documentés.           | navigation clavier           |
| STR2-U05 | P0  | M      | U03       | Garantir cibles tactiles de 44 px et aucun survol indispensable.             | audit tactile                |
| STR2-U06 | P0  | M      | —         | Ajouter annonces ARIA pour ordre, résolution, événement, blessure et fin.    | live regions sobres          |
| STR2-U07 | P0  | M      | —         | Vérifier contraste AA, zoom 200 %, mouvement réduit et lecture sans couleur. | rapport a11y                 |
| STR2-U08 | P0  | L      | tous      | Déplacer tous les textes Strategy vers les catalogues FR/EN.                 | parité i18n                  |
| STR2-U09 | P1  | M      | R07       | Ajouter filtres de journal : intel, diplomatie, Nen, conflit.                | journal navigable            |
| STR2-U10 | P1  | M      | C07, D07  | Enrichir le bilan : efficacité PC, zones, pactes, pertes et Hatsu.           | débrief complet              |

**Gate U** — campagne complète au clavier, tactile et lecteur d’écran, en FR et EN, sans carte obligatoire.

---

## 10. Epic Q — qualité, équilibrage et performance

| ID       | P   | Taille | Dépend de | Tâche                                                                             | Sortie attendue        |
| -------- | --- | ------ | --------- | --------------------------------------------------------------------------------- | ---------------------- |
| STR2-Q01 | P0  | M      | tous      | Construire fixtures minimales sans dépendre de la base de production.             | factories Strategy     |
| STR2-Q02 | P0  | L      | S, R, P   | Ajouter tests d’intégration de huit tours avec checksum.                          | campagnes automatisées |
| STR2-Q03 | P0  | L      | U         | Ajouter Playwright : partie, pacte, Hatsu, conflit, reprise, victoire et défaite. | suite navigateur       |
| STR2-Q04 | P0  | M      | N, C, D   | Exécuter la matrice factions × Hatsu × doctrines × événements.                    | smoke simulations      |
| STR2-Q05 | P0  | M      | Q04       | Instrumenter durée, victoire, PC inutilisés, abandons, pactes et pertes.          | rapport playtest       |
| STR2-Q06 | P0  | M      | Q05       | Équilibrer uniquement constantes et cadence avec avant/après documenté.           | commit balance         |
| STR2-Q07 | P0  | S      | tous      | Rendre build, typecheck, lint et tests verts depuis un checkout propre.           | CI obligatoire         |
| STR2-Q08 | P0  | S      | R         | Fixer sauvegarde < 100 Ko et replay de huit tours < 50 ms.                        | budgets CI             |
| STR2-Q09 | P1  | M      | P, U      | Mesurer temps de projection, marqueurs et taille du bundle Strategy.              | budget performance     |
| STR2-Q10 | P1  | S      | Q05       | Ajouter télémétrie anonyme opt-in ou rester explicitement sans collecte.          | décision produit       |

### Seuils initiaux d’équilibrage

- 35–65 % de victoire pour chaque faction à difficulté normale sur 500 seeds.
- Aucun objectif ne produit plus de 70 % de victoire indépendamment de la faction.
- Une partie standard dure 12–25 minutes et utilise au moins deux familles d’actions.
- Moins de 10 % des tours se terminent avec 5 PC inutilisés après onboarding.
- Aucun Hatsu individuel n’explique seul plus de 40 % des victoires.

**Gate Q** — CI verte, rapport de 500 simulations et session de playtest humain signée.

---

## 11. Epic X — release et exploitation

| ID       | P   | Taille | Dépend de | Tâche                                                           | Sortie attendue          |
| -------- | --- | ------ | --------- | --------------------------------------------------------------- | ------------------------ |
| STR2-X01 | P0  | M      | S, Q      | Auditer données, spoilers, licences et provenance.              | checklist éditoriale     |
| STR2-X02 | P0  | M      | Q07       | Construire l’image web depuis un checkout propre.               | artefact immutable       |
| STR2-X03 | P0  | S      | X02       | Ajouter healthcheck et smoke HTTP de `/strategy`.               | test de déploiement      |
| STR2-X04 | P0  | M      | X03       | Déployer en staging et jouer les parcours de référence.         | procès-verbal de recette |
| STR2-X05 | P0  | S      | X04       | Documenter rollback, sauvegardes incompatibles et purge locale. | runbook                  |
| STR2-X06 | P0  | S      | X05       | Publier et surveiller erreurs, latence et reprise pendant 48 h. | V2 publique              |
| STR2-X07 | P1  | S      | X06       | Classer incidents et décider V2.0.1 ou V2.1.                    | bilan post-release       |

**Gate X** — staging signé, rollback répété, production en 200 et aucun P0 ouvert.

---

## 12. Chemin critique et lots recommandés

| Lot                      | Tickets          | Résultat démontrable                                   |
| ------------------------ | ---------------- | ------------------------------------------------------ |
| V2.1 — contenu versionné | S01–S06          | Le scénario principal est un contrat validé et sourcé. |
| V2.2 — vérité rejouable  | R01–R06          | Toute campagne se rejoue avec le même checksum.        |
| V2.3 — guerre subjective | P01–P06          | Joueur et IA ne voient que leur perspective.           |
| V2.4 — Nen réel          | N01–N06          | Quatre Hatsu passent par le moteur Nen.                |
| V2.5 — conséquences      | C01–C05          | Chaque rencontre est déterministe et expliquée.        |
| V2.6 — politique         | D01–D05          | Accords, dettes et trahisons survivent au replay.      |
| V2.7 — expérience        | U01–U08          | La campagne est accessible, responsive et bilingue.    |
| V2.8 — release candidate | Q01–Q09, X01–X05 | Une RC mesurée passe staging et rollback.              |
| V2.9 — publication       | X06–X07          | V2 publique observée pendant 48 h.                     |

Le lot suivant ne commence pas tant que la gate précédente n’est pas satisfaite. Un ticket P2 ne
bloque jamais la V2 sauf s’il devient nécessaire à un critère P0 mesuré.

---

## 13. Definition of Done d’un ticket

- [ ] invariant(s) concerné(s) cités dans la PR ou le commit ;
- [ ] critère d’acceptation démontré, pas seulement compilé ;
- [ ] test nominal, test de refus et test de replay si l’état change ;
- [ ] projection joueur et IA vérifiée si une information est créée ;
- [ ] textes FR/EN à parité ;
- [ ] clavier et tactile couverts pour toute nouvelle action ;
- [ ] mouvement réduit et alternative non sonore vérifiés ;
- [ ] provenance ajoutée pour toute donnée canonique ;
- [ ] aucun accès omniscient introduit dans l’IA ou l’interface ;
- [ ] tests Strategy, typecheck ciblé, lint et `git diff --check` verts ;
- [ ] commit limité à une fonctionnalité cohérente.

Convention de commit :

```text
feat(strategy-scenario): version succession scenario contract
feat(strategy-perspective): project last-known enemy positions
feat(strategy-nen): execute Little Eye through Nen runtime
test(strategy-replay): verify full-campaign checksum
fix(strategy-a11y): restore focus after turn resolution
```

---

## 14. Hors périmètre V2

Multijoueur synchrone, comptes joueurs, classement global, économie persistante, génération de
scénarios par LLM, campagne procédurale infinie, éditeur public et nouveaux Hatsu non encore
modélisés dans le moteur Nen. Ces sujets relèvent d’une V2.1 ou V3 et ne retardent pas la publication.
