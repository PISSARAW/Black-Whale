# Arena V2 — backlog détaillé

> **Objectif.** Faire d’Arena un laboratoire de duel Nen spatial, explicable et rejouable : un
> joueur choisit un Hatsu à règles complètes, affronte une IA qui apprend sans tricher, puis revoit
> ce que chacun percevait et pourquoi chaque échange a été gagné.
>
> **Point de départ.** La V1 possède un moteur déterministe, Ten/Ren/Zetsu, Ryu/Gyo/In/Ken/Ko,
> feinte, garde active, trois doctrines adverses, visée corporelle, décor solide, Hatsu par familles,
> trois difficultés, progression locale, audio synthétisé et 33 tests ciblés.
>
> **Définition de fini V2.** Les huit gates de ce document sont validées dans l’ordre, les replays
> sont reproductibles, quatre Hatsu ont leurs règles individuelles, l’IA ne consomme aucune donnée
> qu’elle n’a pas perçue, deux terrains attestés produisent des décisions différentes et une épreuve
> peut être partagée sous forme d’URL.

---

## 1. Invariants

| ID  | Invariant                                                                        | Conséquence                                                                      |
| --- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| I1  | Aucun point de vie ni statistique de dégâts.                                     | La résolution reste qualitative : blocage, touche, chute, KO, épuisement.        |
| I2  | Toute puissance crée une vulnérabilité lisible.                                  | Un Hatsu sans condition, coût ou contre est refusé.                              |
| I3  | Le moteur reste pur et déterministe.                                             | Temps, hasard, commandes et Hatsu entrent comme données explicites.              |
| I4  | L’IA ne lit que sa perception et sa mémoire.                                     | Aucun accès direct à l’intention, au Ryu caché ou au Hatsu non révélé du joueur. |
| I5  | La géométrie vient exclusivement de la reconstruction.                           | Aucun mur, couvert ou terrain inventé dans Arena.                                |
| I6  | Les règles canoniques priment sur l’équilibrage.                                 | On ajuste cadence et coût, jamais la nature d’un Hatsu attesté.                  |
| I7  | Toute mécanique est explicable dans le replay.                                   | Une décision qui ne peut pas être journalisée n’entre pas dans la boucle.        |
| I8  | Clavier, souris, tactile et mouvement réduit sont fonctionnellement équivalents. | Aucun geste indispensable n’existe sur une seule surface.                        |
| I9  | FR et EN restent à parité.                                                       | Toute chaîne visible passe par les catalogues i18n.                              |
| I10 | La V1 reste une base jouable pendant le chantier.                                | Chaque epic se termine par un commit réversible et des tests verts.              |

---

## 2. Priorités, tailles et gates

- **P0** : nécessaire à la définition de fini.
- **P1** : nécessaire à une V2 publiable, mais peut suivre le chemin critique.
- **P2** : amélioration différable sans casser la promesse V2.
- Tailles : **S** ≤ 1 jour, **M** 2–3 jours, **L** 4–6 jours, **XL** à redécouper.
- Un ticket n’est terminé qu’avec logique pure testée, i18n, accessibilité et note de provenance si
  une donnée canonique est introduite.

Ordre des gates : `R replay → M mouvement → H Hatsu → A IA → E épreuves → T terrain → S partage → Q QA`.

---

## 3. Epic R — replay explicable

**But.** Faire du journal déterministe la source commune du replay, du débrief et de l’IA.

| ID  | P   | Taille | Dépend de | Tâche                                                                                                | Sortie attendue             |
| --- | --- | ------ | --------- | ---------------------------------------------------------------------------------------------------- | --------------------------- |
| R1  | P0  | M      | —         | Définir `ArenaCommand`, `ArenaFrame` et `ArenaReplay` versionnés.                                    | `lib/arena/replay/types.ts` |
| R2  | P0  | M      | R1        | Enregistrer commandes, seed, setup, doctrine, difficulté et Hatsu ; jamais des snapshots redondants. | `recorder.ts`               |
| R3  | P0  | M      | R1        | Rejouer depuis l’état initial et vérifier un checksum final.                                         | `player.ts`                 |
| R4  | P0  | L      | R2        | Produire une projection par perspective : réalité, joueur, adversaire.                               | `perspective.ts`            |
| R5  | P1  | M      | R3        | Contrôles lecture/pause/vitesse/pas à pas et scrubber.                                               | `ReplayControls.svelte`     |
| R6  | P1  | M      | R4        | Panneau « pourquoi » : offense, défense perçue, timing, portée, couvert et conséquence.              | `ExchangeInspector.svelte`  |
| R7  | P1  | S      | R2        | Export/import JSON avec migration de version et validation stricte.                                  | `codec.ts`                  |

### Critères d’acceptation R

- Rejouer deux fois le même journal donne le même checksum, score et état d’aura.
- Une donnée sous In est absente de la perspective adverse sans Gyo, mais présente dans la réalité.
- Le scrubber reconstruit un état ; il ne mute pas l’état live.
- Un replay d’une version inconnue échoue avec une erreur lisible, sans chargement partiel.

**Gate R** — trois matchs complets rechargés depuis JSON aboutissent bit pour bit au même résultat.

---

## 4. Epic M — posture, trajectoires et locomotion

**But.** Remplacer la résolution « distance + zone » par un engagement spatial lisible.

| ID  | P   | Taille | Dépend de | Tâche                                                                          | Sortie attendue                  |
| --- | --- | ------ | --------- | ------------------------------------------------------------------------------ | -------------------------------- |
| M1  | P0  | M      | R1        | Ajouter orientation corporelle indépendante du vecteur de déplacement.         | `combat/types.ts`, `movement.ts` |
| M2  | P0  | L      | M1        | Définir trajectoire, anticipation, impact et récupération pour chaque attaque. | `combat/trajectory.ts`           |
| M3  | P0  | M      | M2        | Résoudre esquive latérale, pas arrière et contre sans iframe arbitraire.       | `combat/evasion.ts`              |
| M4  | P1  | M      | M1        | Ajouter poussée, séparation et ring-out provoqué.                              | `combat/push.ts`                 |
| M5  | P1  | L      | M2        | Étendre les zones à gauche/droite quand l’animation sait les rendre.           | `combat/body.ts`                 |
| M6  | P1  | M      | M2        | Afficher anticipation et trajectoire sans révéler une attaque sous In.         | `AttackTelegraph.svelte`         |
| M7  | P2  | M      | M3        | Ajouter accroupissement et relevé, avec équivalents tactiles.                  | route + contrôles                |

### Critères d’acceptation M

- Une attaque touche uniquement si sa trajectoire intersecte le volume corporel au temps d’impact.
- Sortir latéralement de la trajectoire esquive ; reculer sans sortir de portée ne suffit pas toujours.
- Un ring-out est attribué à la dernière poussée valide et apparaît dans le replay.
- Les contrôles tactiles permettent attaque, garde et esquive sans geste simultané impossible.

**Gate M** — dix échanges sont compréhensibles sans ouvrir le panneau de calcul.

---

## 5. Epic H — Hatsu individuels

**But.** Remplacer les familles génériques par des règles canoniques persistantes et contrables.

### Infrastructure commune

| ID  | P   | Taille | Dépend de | Tâche                                                                                       | Sortie attendue               |
| --- | --- | ------ | --------- | ------------------------------------------------------------------------------------------- | ----------------------------- |
| H1  | P0  | L      | R1        | Définir l’interface `ArenaHatsu`: conditions, commandes, événements, projection et cleanup. | `lib/arena/hatsu/contract.ts` |
| H2  | P0  | M      | H1        | Adapter les modules existants sans dupliquer leur catalogue ni leur texte canonique.        | `adapter.ts`                  |
| H3  | P0  | M      | H1        | Persister attaches, marques, charges et projectiles dans l’état déterministe.               | `effects.ts`                  |
| H4  | P1  | M      | H1        | UI de condition/coût/contre et raison exacte d’un lancement refusé.                         | `HatsuReadout.svelte`         |

### Hatsu 1 — Bungee Gum

| ID  | P   | Taille | Dépend de | Tâche                                                    | Acceptation spécifique                       |
| --- | --- | ------ | --------- | -------------------------------------------------------- | -------------------------------------------- |
| HB1 | P0  | M      | H3        | Attacher un fil au corps ou à une structure visée.       | Deux extrémités persistantes et sourcées.    |
| HB2 | P0  | L      | HB1, M2   | Traction, rappel et limite d’élasticité.                 | Le fil déplace sans traverser les murs.      |
| HB3 | P1  | M      | HB2       | Piège sur fil existant et rupture volontaire.            | L’adversaire peut le lire avec Gyo.          |
| HB4 | P1  | M      | HB1       | Rendu et son dont la tension est dérivée de la longueur. | Mouvement réduit : fil fixe, sans pulsation. |

### Hatsu 2 — Ripper Cyclotron

| ID  | P   | Taille | Dépend de | Tâche                                                     | Acceptation spécifique                      |
| --- | --- | ------ | --------- | --------------------------------------------------------- | ------------------------------------------- |
| HR1 | P0  | M      | H1        | Compter les rotations commandées et exposer la charge.    | Aucune charge automatique par temps écoulé. |
| HR2 | P0  | M      | HR1, M2   | Transformer les rotations en seuils qualitatifs d’impact. | Les seuils sont testés et visibles.         |
| HR3 | P1  | S      | HR1       | Autoriser interruption, abandon et perte de charge.       | Une touche nette annule la préparation.     |

### Hatsu 3 — Double Machine Gun

| ID  | P   | Taille | Dépend de | Tâche                                                   | Acceptation spécifique                           |
| --- | --- | ------ | --------- | ------------------------------------------------------- | ------------------------------------------------ |
| HD1 | P0  | L      | H3, M2    | Émettre une salve de projectiles orientés et datés.     | Aucun hitscan invisible.                         |
| HD2 | P0  | M      | HD1       | Couverture, dispersion et consommation continue d’aura. | Une structure attestée bloque chaque projectile. |
| HD3 | P1  | M      | HD1       | Suppression de zone influençant la doctrine adverse.    | L’IA connaît la zone, pas les futurs impacts.    |

### Hatsu 4 — Battle Cantabile: Jupiter

| ID  | P   | Taille | Dépend de | Tâche                                                | Acceptation spécifique                               |
| --- | --- | ------ | --------- | ---------------------------------------------------- | ---------------------------------------------------- |
| HJ1 | P0  | M      | H1        | Préparation rythmique interruptible.                 | Le tempo est dans les commandes du replay.           |
| HJ2 | P0  | M      | HJ1, M2   | Impact de proximité après phrase complète.           | Hors rythme : refus, pas attaque affaiblie inventée. |
| HJ3 | P1  | M      | HJ1       | Signature audio spatialisée et télégraphie visuelle. | Jouable sans son via indicateur visuel équivalent.   |

### Hatsu suivants

| ID  | P   | Taille | Dépend de | Tâche                                                                                                              |
| --- | --- | ------ | --------- | ------------------------------------------------------------------------------------------------------------------ |
| H5  | P2  | L      | H1        | Holy Chain : immobilité, concentration, restauration et interruption.                                              |
| H6  | P2  | L      | H1, R2    | Pain Packer/Rising Sun : mémoire des impacts reçus et transformation conditionnelle.                               |
| H7  | P2  | XL     | R3, H1    | Parallel Future : prévisualisation puis remboursement déterministe des dix secondes. À redécouper avant démarrage. |

**Gate H** — les quatre Hatsu P0 ont chacun une condition, un coût, un contre, une manifestation et
un test de replay ; aucun ne passe par l’ancien effet générique.

---

## 6. Epic A — IA adaptative et non omnisciente

| ID  | P   | Taille | Dépend de | Tâche                                                                        | Sortie attendue    |
| --- | --- | ------ | --------- | ---------------------------------------------------------------------------- | ------------------ |
| A1  | P0  | M      | R4        | Définir `OpponentPerception` comme unique entrée du décideur.                | `ai/perception.ts` |
| A2  | P0  | M      | A1        | Mémoire bornée : zones visées, distance favorite, réponses aux feintes.      | `ai/memory.ts`     |
| A3  | P0  | L      | A2        | Adapter Contreur, Entraveuse et Artilleur à cette mémoire.                   | `ai/doctrines/`    |
| A4  | P1  | L      | A1, H     | Donner à chaque doctrine un Hatsu individuel et ses conditions.              | loadouts typés     |
| A5  | P1  | M      | A2        | Ajouter le Trompeur : In, fausses préparations et variation de tempo.        | quatrième doctrine |
| A6  | P1  | M      | R6        | Expliquer après match chaque décision IA depuis perception + mémoire.        | débrief IA         |
| A7  | P2  | M      | A3        | Tests adversariaux vérifiant qu’aucune donnée cachée n’améliore la décision. | tests anti-triche  |

### Critères d’acceptation A

- Remplacer la position réelle cachée du joueur sans modifier `OpponentPerception` ne change aucune décision.
- La mémoire oublie ou décote les observations anciennes selon une règle testée.
- Deux habitudes opposées du joueur produisent des adaptations mesurables après plusieurs échanges.
- Le débrief cite l’observation ayant motivé la décision, jamais une variable interne inaccessible.

**Gate A** — une revue automatisée échoue si un module `ai/` importe `CombatState` directement.

---

## 7. Epic E — initiation et épreuves tactiques

| ID  | P   | Taille | Dépend de | Tâche                                                                | Sortie attendue           |
| --- | --- | ------ | --------- | -------------------------------------------------------------------- | ------------------------- |
| E1  | P0  | M      | R3        | Schéma `ArenaChallenge` : setup, règles, objectifs, échecs et score. | `challenges/types.ts`     |
| E2  | P0  | M      | E1        | Évaluateur pur consommant le journal, jamais le DOM.                 | `challenges/evaluate.ts`  |
| E3  | P0  | L      | E2        | Initiation : Ryu, garde, In/Gyo, Ko et récupération.                 | 5 défis                   |
| E4  | P1  | L      | E2, H     | Maîtrise Hatsu : une épreuve par Hatsu individuel.                   | 4 défis                   |
| E5  | P1  | M      | E2, T     | Épreuves spatiales : couvert, esquive, ring-out et angle mort.       | 4 défis                   |
| E6  | P1  | M      | E1        | Sélecteur, progression locale et reprise du dernier défi.            | route `/arena/challenges` |
| E7  | P2  | S      | E2        | Médailles fondées sur maîtrise, jamais sur puissance permanente.     | grades S/A/B/C            |

**Gate E** — chaque principe fondamental est enseigné par une action obligatoire, pas par un texte à fermer.

---

## 8. Epic T — terrains attestés

| ID  | P   | Taille | Dépend de | Tâche                                                                                  | Sortie attendue             |
| --- | --- | ------ | --------- | -------------------------------------------------------------------------------------- | --------------------------- |
| T1  | P0  | M      | M2        | Auditer les pièces candidates : provenance, surface, couvert, lignes de vue et spawns. | `docs/arena-v2-terrains.md` |
| T2  | P0  | M      | T1        | Généraliser setup et sélection de terrain sans géométrie parallèle.                    | `terrain/catalogue.ts`      |
| T3  | P0  | L      | T2        | Intégrer un second terrain attesté contrastant avec la salle de banquet.               | terrain jouable             |
| T4  | P1  | M      | T2        | Calculer hauteur, couvert partiel, goulots et ring-out depuis la géométrie.            | `terrain/tactics.ts`        |
| T5  | P1  | M      | T3        | Adapter navigation et doctrine IA au terrain choisi.                                   | contexte tactique           |
| T6  | P2  | M      | T2        | Ajouter un troisième terrain seulement si sa question tactique est unique.             | terrain optionnel           |

### Critères d’acceptation T

- Chaque structure tactique renvoie à un `Structure` existant et à sa provenance.
- Les spawns sont atteignables, hors solide et séparés par une distance compatible avec les doctrines.
- Le second terrain change statistiquement les décisions de distance ou de couvert sur la matrice IA.

**Gate T** — une revue de provenance et trente simulations par terrain passent sans géométrie inventée.

---

## 9. Epic S — partage asynchrone

| ID  | P   | Taille | Dépend de | Tâche                                                                                | Sortie attendue     |
| --- | --- | ------ | --------- | ------------------------------------------------------------------------------------ | ------------------- |
| S1  | P0  | M      | R7        | Encoder setup + commandes dans un payload compact, versionné et signé par checksum.  | `share/codec.ts`    |
| S2  | P0  | M      | S1        | Charger un replay partagé via URL avec confirmation avant remplacement de la partie. | `/arena/replay`     |
| S3  | P1  | L      | S1, E1    | Partager une épreuve : terrain, Hatsu, doctrine, seed et objectifs.                  | lien d’épreuve      |
| S4  | P1  | L      | R4        | « Affronter ce fantôme » : rejouer les décisions enregistrées comme doctrine.        | ghost adapter       |
| S5  | P1  | M      | S4        | Comparer deux solutions à la même épreuve.                                           | vue comparative     |
| S6  | P2  | M      | S1        | Limiter taille, profondeur et durée des payloads non fiables.                        | validation sécurité |

**Hors V2** : matchmaking, serveur temps réel, classement global, comptes et anti-cheat compétitif.

**Gate S** — un lien ouvert dans une session vide reproduit le checksum annoncé sans appel réseau obligatoire.

---

## 10. Epic Q — présentation, accessibilité et QA

| ID  | P   | Taille | Dépend de | Tâche                                                                             | Sortie attendue       |
| --- | --- | ------ | --------- | --------------------------------------------------------------------------------- | --------------------- |
| Q1  | P0  | M      | M2        | Articuler les poses attaque, garde, esquive, chute et relevé.                     | stages combatant      |
| Q2  | P0  | M      | H         | Aura et manifestation propres aux quatre Hatsu, sans masquer la lecture tactique. | effets visuels        |
| Q3  | P1  | M      | H         | Audio spatial : Ryu, In, rupture de Ken, épuisement et signatures Hatsu.          | graphe audio Arena    |
| Q4  | P0  | M      | tous      | Parité fonctionnelle clavier/souris/tactile et navigation clavier des menus.      | audit contrôles       |
| Q5  | P0  | S      | tous      | Mouvement réduit, contraste, texte alternatif et annonces live non bavardes.      | audit a11y            |
| Q6  | P0  | M      | tous      | Matrice 4 Hatsu × 4 doctrines × 3 difficultés × 2 terrains.                       | smoke simulations     |
| Q7  | P0  | M      | tous      | Playtests instrumentés : durée, précision, aura, répétitions et abandons.         | rapport d’équilibrage |
| Q8  | P1  | M      | Q7        | Ajuster uniquement constantes et cadences, avec justification avant/après.        | commit balance        |
| Q9  | P1  | S      | tous      | Budget performance : frame time, allocations, audio nodes et taille replay.       | seuils CI             |
| Q10 | P0  | S      | tous      | Revue spoiler, provenance, FR/EN et compatibilité sauvegardes V1.                 | checklist release     |

### Seuils de sortie

- 60 FPS médian sur la machine de référence ; aucune allocation croissante après dix replays.
- 100 % des commandes accessibles au tactile et au clavier.
- Zéro erreur Arena dans `svelte-check`, ESLint et tests.
- Aucun Hatsu ne dépasse 60 % de victoire sur l’ensemble doctrine/terrain à difficulté égale après
  le premier cycle de playtest ; un écart canonique documenté peut déroger à ce seuil.
- Un match standard produit un replay compressé inférieur à 100 Ko.
- Aucun changement V2 ne modifie `data/ship/blueprint.json`.

**Gate Q** — checklist release signée et rapport de playtest joint au tag V2.

---

## 11. Chemin critique et lots de livraison

| Lot                          | Tickets                          | Résultat démontrable                               |
| ---------------------------- | -------------------------------- | -------------------------------------------------- |
| V2.1 — vérité rejouable      | R1–R4, R7                        | Un match se rejoue depuis trois perspectives.      |
| V2.2 — duel spatial          | M1–M4, M6                        | Esquive, trajectoire et ring-out sont explicables. |
| V2.3 — premier Hatsu complet | H1–H4, HB1–HB4                   | Bungee Gum agit sur corps et décor.                |
| V2.4 — adversaire honnête    | A1–A3, A6–A7                     | L’IA apprend sans accès omniscient.                |
| V2.5 — roster                | HR1–HR3, HD1–HD3, HJ1–HJ3, A4–A5 | Quatre Hatsu et quatre doctrines.                  |
| V2.6 — apprendre             | E1–E7                            | Initiation et épreuves évaluées depuis le replay.  |
| V2.7 — varier et partager    | T1–T5, S1–S5                     | Deux terrains et défis partageables.               |
| V2.8 — release               | Q1–Q10                           | V2 publiable, accessible et équilibrée.            |

Le lot suivant ne commence pas tant que la gate du précédent n’est pas satisfaite. Les tickets P2
ne bloquent jamais une gate sauf s’ils deviennent nécessaires à un critère mesuré.

---

## 12. Convention de commit et définition de terminé

Un commit par ticket ou sous-fonctionnalité cohérente :

```text
feat(arena-replay): record deterministic commands
feat(arena-hatsu): attach Bungee Gum to structures
test(arena-ai): reject hidden-state access
```

Checklist obligatoire pour fermer un ticket :

- [ ] invariants concernés cités dans la PR ou le commit ;
- [ ] logique pure couverte par un test nominal et un test de refus ;
- [ ] événement inscrit dans le replay et projeté selon la perception ;
- [ ] textes FR/EN à parité ;
- [ ] commande clavier et tactile ;
- [ ] comportement `prefers-reduced-motion` vérifié ;
- [ ] aucune modification non justifiée de `/tour` ou du blueprint ;
- [ ] tests Arena, typecheck ciblé et `git diff --check` verts ;
- [ ] critère d’acceptation du ticket démontré, pas seulement compilé.
