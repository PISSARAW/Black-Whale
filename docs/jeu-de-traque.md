# Le jeu de traque — backlog et prompts

> **Objectif.** Un jeu solo à la première personne dans le Black Whale : une traque à travers le
> navire, un duel au contact fidèle aux principes du Nen, et une jonction stricte entre les deux —
> ce qu'on prépare pendant la traque décide du duel. Adversaire piloté par la machine ; un
> planificateur LLM est prévu mais **hors du prototype**.
>
> **Décision de départ : slice vertical.** On construit la boucle entière — traque, duel, jonction —
> sur le plus petit navire possible, plutôt que la moitié d'un jeu sur tout le navire. La seule
> question capable de tuer le projet est celle de la jonction, et aucune moitié seule n'y répond.
>
> **État au 2 août 2026 : les étapes 0 à 4 sont écrites et testées.** Le code ne dit pas encore si
> les critères de fin sont atteints — ce sont des questions de partie jouée, pas de compilation.
> Ce document reste le plan ; il faudra un compte rendu à part une fois les cinq gates passées.

**Références moteur existantes** : `apps/web/src/lib/tour/` (géométrie, collision, navigation,
atmosphère), `data/ship/blueprint.json` (409 spaces, 47 links), `packages/ability-modules`
(82 hatsu à conditions typées), `packages/perspective-engine` (états de croyance).

---

## 1. Les invariants de conception

Sept règles. Aucune tâche de ce backlog n'a le droit de les violer ; toute tâche qui semble
l'exiger est une tâche mal écrite.

| # | Invariant | Pourquoi |
| --- | --- | --- |
| I1 | **Aucune statistique de dégâts.** Le jeu demande « quelle condition, quel effet », jamais « combien ». | C'est la règle qui garantit qu'un hatsu sans compétence offensive reste jouable. |
| I2 | **Une seule jauge d'aura, trois usages concurrents** : savoir (En), préparer (aura posée), survivre (Ryu). | C'est toute la gestion. Trois jauges séparées suppriment le jeu. |
| I3 | **On peut gagner un duel sans jamais attaquer**, puisque l'épuisement est une condition de défaite. | Sans ça, I1 est un vœu pieux. |
| I4 | **Contre un chasseur intact, le joueur perd toujours.** La victoire se fabrique en amont. | Si le combat est gagnable au réflexe, la traque n'a plus d'intérêt. |
| I5 | **Le chasseur ne reçoit que ce qu'il perçoit.** Jamais la position réelle du joueur. | Un adversaire omniscient est imbattable et ennuyeux. |
| I6 | **Le jeu ne dessine rien que la reconstruction n'atteste pas.** Il consomme `blueprint.json`, il ne l'étend pas. | Le `/tour` a une thèse ; le jeu ne doit pas la contredire. |
| I7 | **Le `/tour` existant n'est pas modifié.** Le jeu lit les mêmes modules, il ne les réécrit pas. | Une régression sur `/tour` coûte plus cher que tout le prototype. |

---

## 2. Périmètre du prototype

### Dans

**Terrain** — un sous-ensemble contigu et entièrement attesté (`provenance: "panel"`) du pont 1.
Ancre : `interior-room-1004` (appartement de Tserriednich, 8 spaces : domestiques, WC, vestibule,
cuisine, salle à manger, salon, chambre, bain). Si 8 pièces se révèlent trop petites à l'étape 1,
étendre à `interior-room-1005` plus le segment de couloir `tier-1` qui les relie.

**Verbes — traque (4)** : Ten, Zetsu, En, l'entrave (un seul type de piège).
**Verbes — duel (6)** : Ryu, Gyo, In, Ko, Ken, la rupture.

### Hors

Pas de hatsu. Pas de types de Nen ni d'hexagone. Pas de vœux. Pas de blessures localisées. Pas de
leurre, d'alarme, de piège blessant. Pas de Shu ni de Ren. Pas de coupure de lumière. Pas de
scellement d'issues par le chasseur. Pas de multijoueur. **Pas de LLM.**

Chacun de ces éléments est bon, chacun s'ajoute plus tard sans rien casser, aucun n'est nécessaire
pour répondre à la question de l'étape 4.

### La question à trancher

> **Est-ce qu'une entrave posée quatre minutes plus tôt se sent, au moment du duel ?**

---

## 3. Les chiffres de départ

Valeurs de placement, à corriger dès la première partie jouée. Leur seul rôle est de rendre
l'arbitrage de l'étape 2 discutable.

| Poste | Coût | Note |
| --- | --- | --- |
| Réservoir d'aura | 100 | Plein au départ |
| Balayage de En, rayon 20 m | 15 | Ponctuel ; perceptible par ce qu'il balaye |
| Entrave posée | 25 | **Immobilisés** jusqu'à reprise ou déclenchement |
| Gyo | 5 / s | Continu |
| Ken | 6 / s | Continu |
| Ko | 20 | Ponctuel |
| Régénération | 4 / s | À l'arrêt seulement |
| Durée d'une partie | 10 min | |
| Vitesse de marche | 2,1 m/s | `WALK_SPEED`, déjà dans `navigation.ts` |

Ce que ces valeurs disent : **on ne peut pas se payer trois balayages et deux entraves.** C'est
exactement la tension qu'on veut mesurer.

---

## 4. Backlog du prototype

Cinq étapes, chacune avec son interrupteur. Une étape dont le critère de fin n'est pas atteint
arrête le projet à cet endroit — pour beaucoup moins cher que la suivante.

### Étape 0 — le bac à sable

| ID | Tâche | Sortie |
| --- | --- | --- |
| T0.1 | Route `/hunt` autonome, sans toucher à `/tour` | `apps/web/src/routes/hunt/+page.svelte` |
| T0.2 | Sélection du sous-ensemble de spaces + validation de contiguïté | `apps/web/src/lib/hunt/arena.ts` |
| T0.3 | Boucle de jeu à pas fixe, découplée du rendu | `apps/web/src/lib/hunt/loop.ts` |
| T0.4 | Navmesh dérivé de la géométrie (graphe pièce→pièce via les ouvertures) | `apps/web/src/lib/hunt/navmesh.ts` |
| T0.5 | État de partie typé + réducteur pur | `apps/web/src/lib/hunt/state.ts` |

**Critère de fin** — on marche dans les 8 pièces, la collision tient, le graphe de navigation est
connexe et testé.

### Étape 1 — se cacher

| ID | Tâche | Sortie |
| --- | --- | --- |
| T1.1 | Jauge d'aura + régénération à l'arrêt | `hunt/aura.ts` |
| T1.2 | Ten / Zetsu : bascule, coûts, effets sur la perception | `hunt/nen/states.ts` |
| T1.3 | En : balayage à rayon, test contre les corps, **et sa propre détectabilité** | `hunt/nen/en.ts` |
| T1.4 | Chasseur : patrouille, balayages périodiques, enquête sur un bruit | `hunt/hunter/patrol.ts` |
| T1.5 | Perception du chasseur : mémoire, dernière position crue (I5) | `hunt/hunter/belief.ts` |
| T1.6 | Retour joueur : pulsation de En reçue, direction, pas audibles | `hunt/feedback.ts` |
| T1.7 | Fin de partie au contact (aucun combat) + écran de fin | `hunt/outcome.ts` |

**Critère de fin** — traverser trois pièces est tendu. Si non, rien de ce qui suit ne le sauvera.

### Étape 2 — préparer

| ID | Tâche | Sortie |
| --- | --- | --- |
| T2.1 | Aura posée : immobilisation, reprise au contact, comptabilité | `hunt/nen/placed.ts` |
| T2.2 | Entrave : pose, déclenchement, durée de rétention | `hunt/nen/entrave.ts` |
| T2.3 | Le chasseur peut la trouver (équivalent Gyo côté IA) | `hunt/hunter/inspect.ts` |
| T2.4 | HUD : réservoir disponible vs immobilisé, lisible d'un coup d'œil | `components/hunt/AuraGauge.svelte` |
| T2.5 | Télémétrie locale : ce que le joueur dépense et quand | `hunt/telemetry.ts` |

**Critère de fin** — « savoir ou préparer » est une décision difficile. Si le joueur pose toujours
tout ou ne pose jamais rien, c'est l'économie qu'il faut corriger, pas le code.

### Étape 3 — le duel

| ID | Tâche | Sortie |
| --- | --- | --- |
| T3.1 | Ryu : répartition continue attaque/défense et par zone | `hunt/duel/ryu.ts` |
| T3.2 | Gyo : lecture de la concentration d'aura adverse | `hunt/duel/gyo.ts` |
| T3.3 | In : dissimulation de sa propre concentration — la feinte | `hunt/duel/in.ts` |
| T3.4 | Ko : engagement total, exposition totale | `hunt/duel/ko.ts` |
| T3.5 | Ken : endurance sans progression | `hunt/duel/ken.ts` |
| T3.6 | Résolution : Ko sur point exposé, ou épuisement (I3) | `hunt/duel/resolve.ts` |
| T3.7 | Rupture : couper la ligne de vue, retour à la traque | `hunt/duel/disengage.ts` |
| T3.8 | Rendu d'aura lisible : halo par zone, montée, extinction | `components/hunt/AuraOverlay.svelte` |
| T3.9 | IA de duel : répartit, feinte, engage — sans tricher (I5) | `hunt/hunter/duel.ts` |

**Critère de fin** — soixante secondes de répartition tiennent avec un rendu minimal. **C'est ici
que se joue le coût du projet** : si la lecture ne passe pas avec des poses simples et un halo
clair, il faut le savoir avant d'avoir animé quoi que ce soit.

### Étape 4 — la jonction

| ID | Tâche | Sortie |
| --- | --- | --- |
| T4.1 | Une entrave présente dans la pièce entre dans le duel | `hunt/duel/inherit.ts` |
| T4.2 | Les jauges d'entrée du duel sont celles que la traque a laissées | `hunt/duel/inherit.ts` |
| T4.3 | Reprendre son aura posée pendant le duel en la touchant | `hunt/duel/recover.ts` |
| T4.4 | Élimination sans contact : épuisement du chasseur → l'entrave tue | `hunt/outcome.ts` |
| T4.5 | Rapport de fin : ce que chacun a cru, quand, et ce que ça a coûté | `components/hunt/Debrief.svelte` |

**Critère de fin — la question.** La préparation se sent au moment du duel. Si non, les deux
moitiés ne communiquent pas, et c'est le moment de s'arrêter.

---

## 5. Backlog post-prototype

Rien ici n'est à commencer avant que l'étape 4 ait répondu oui. Ordre indicatif, par valeur
décroissante rapportée au coût.

### V1 — la profondeur

| Lot | Contenu |
| --- | --- |
| **Hatsu** | Brancher `packages/ability-modules` : le jeu lit la condition déclarée du module, il n'invente aucune valeur (I1). Une capacité au départ de partie. |
| **Familles d'usage** | Information, condition/négociation, matérialisation, déplacement, manipulation d'un tiers — chacune utile dans les deux phases. |
| **Types de Nen** | Rendements sur les principes voisins, pas de bonus de dégâts. À caler sur les fiches existantes. |
| **Pièges** | Alarme, blessure, leurre. Le leurre est le plus cher et le plus intéressant : il corrompt la croyance adverse. |
| **Blessures localisées** | Membre par membre ; une jambe touchée fait passer à 1,2 m/s, un bras annule les hatsu qui demandaient une main. |
| **Vœux** | Restriction acceptée au départ contre une capacité renforcée. Le seul chemin vers une victoire franche en duel. |
| **Shu et Ren** | Charger un objet ; la manette des gaz du duel. |

### V2 — le navire comme arsenal

| Lot | Contenu |
| --- | --- |
| **Lumière** | Couper les luminaires d'une pièce : le chasseur doit brûler du Gyo pour y voir. |
| **Son** | Exploiter la réverbération par volume déjà calculée dans `atmosphere.ts` ; le grondement de coque masque en bas, expose en haut. |
| **Les deux fenêtres** | Pont d'observation et fond du salon du Roi — les deux seules pièces où l'on se découpe en silhouette. |
| **Goulots calculés** | Les 368 ouvertures sont dérivées des murs partagés : les pièces à issue unique sont trouvables par le code. |
| **Le chasseur scelle** | Il ne patrouille plus, il ferme les issues une à une. La traque devient un siège. |
| **Ponts supplémentaires** | Chaque pont donne une partie de nature différente. Verticalité par les cages d'escalier. |

### V3 — le planificateur LLM

| Lot | Contenu |
| --- | --- |
| **Interface `Planner`** | `(perception: HunterPerception) => Promise<Intent>` — le scripté et le LLM l'implémentent tous les deux ; le scripté reste le défaut et le fallback. |
| **Sortie structurée** | `output_config.format` avec un schéma JSON. Jamais de prose parsée dans une boucle de jeu. |
| **Cadence** | Une intention toutes les quelques secondes, jamais par frame. L'exécution reste déterministe. |
| **Prompt caching** | Plan du pont et règles en préfixe stable ; l'état volatil strictement après le point de césure. |
| **Clé côté serveur** | Route serveur SvelteKit uniquement — la clé ne touche jamais le navigateur. |
| **Coût** | ~1,4 $/h de jeu sur un modèle rapide : clé apportée par l'utilisateur, ou local uniquement. Jamais sur le site public en anonyme. |
| **Journal du chasseur** | Son état de croyance rendu lisible en fin de partie. C'est le seul vrai gain du LLM sur le scripté. |

---

## 6. Contraintes de dépôt

Elles s'appliquent à chaque tâche et doivent figurer dans chaque prompt.

- **500 lignes par fichier de code, 3 paramètres par fonction** — ratchet ESLint décroissant.
  `hatsu.ts` (5 345 lignes) est le contre-exemple à ne pas reproduire : découper dès le départ.
- **Tests** — logique pure testée ; le rendu ne l'est pas. Convention `*.test.ts` à côté du module.
- **i18n FR/EN à parité** — toute chaîne visible passe par `lib/i18n`.
- **Aucune modification de `/tour`** (I7) ni de `data/ship/blueprint.json` (I6).
- **Réutiliser, ne pas réécrire** : `resolveMovement`, `wallsNear`, `theShip`, `spaceAt`,
  `crossingsOn`, `WALK_SPEED` existent déjà dans `lib/tour/`.

---

## 7. Les prompts

Un prompt par étape, à coller tel quel. Chacun suppose l'étape précédente terminée et validée.

### Prompt — Étape 0

```
Crée le bac à sable du jeu de traque, sans toucher au /tour existant.

Terrain : les 8 spaces de `interior-room-1004` dans data/ship/blueprint.json (appartement de
Tserriednich), tous de provenance "panel".

À produire, sous apps/web/src/lib/hunt/ :
- arena.ts : sélectionne le sous-ensemble de spaces, valide sa contiguïté, expose ses murs et
  ses ouvertures. Échoue au test si le sous-ensemble n'est pas connexe.
- navmesh.ts : graphe de navigation pièce→pièce dérivé des ouvertures partagées, plus un
  chemin le plus court entre deux spaces.
- state.ts : l'état de partie typé et son réducteur pur (aucun effet de bord, aucun accès DOM).
- loop.ts : boucle à pas fixe découplée du rendu.

Plus la route apps/web/src/routes/hunt/+page.svelte : on marche à la première personne dans les
8 pièces, avec la collision.

Réutilise lib/tour/ sans le modifier : resolveMovement, wallsNear, theShip, spaceAt, WALK_SPEED.
Contraintes : 500 lignes max par fichier, 3 paramètres max par fonction, tests *.test.ts pour
arena/navmesh/state, chaînes visibles via lib/i18n en FR et EN.

Critère de fin : on marche dans les 8 pièces, la collision tient, le graphe est connexe et testé.
```

### Prompt — Étape 1

```
Ajoute la traque au jeu : se cacher d'un chasseur, sans aucun combat.

Sous apps/web/src/lib/hunt/ :
- aura.ts : réservoir de 100, régénération de 4/s à l'arrêt seulement.
- nen/states.ts : Ten (défaut, visible au En) et Zetsu (invisible au En, aveugle au Nen).
- nen/en.ts : balayage à rayon 20 m pour 15 d'aura, détecte les corps dans le rayon — et est
  lui-même perceptible par tout corps qu'il balaye, sauf ceux en Zetsu.
- hunter/patrol.ts : patrouille sur le navmesh, balayages de En périodiques, enquête sur un bruit.
- hunter/belief.ts : la mémoire du chasseur. INVARIANT : il ne reçoit jamais la position réelle
  du joueur, seulement ce que son En, son ouïe et les traces lui donnent.
- feedback.ts : pulsation reçue avec sa direction, pas audibles filtrés par la pièce.
- outcome.ts : le contact met fin à la partie, écran de fin.

Partie de 10 minutes, objectif : atteindre une pièce marquée.

Contraintes de dépôt inchangées (500 lignes, 3 paramètres, tests, i18n, /tour intact).

Critère de fin : traverser trois pièces est tendu.
```

### Prompt — Étape 2

```
Ajoute la préparation : un seul type de piège, et l'arbitrage qu'il crée.

Sous apps/web/src/lib/hunt/ :
- nen/placed.ts : l'aura posée sort du réservoir disponible et y reste jusqu'à reprise au contact
  ou déclenchement. C'est la comptabilité centrale — teste-la sérieusement.
- nen/entrave.ts : pose pour 25 d'aura immobilisée, retient le chasseur quelques secondes au
  déclenchement, ne blesse pas.
- hunter/inspect.ts : le chasseur peut trouver une entrave posée sur un passage qu'il a une
  raison d'inspecter (équivalent Gyo côté IA). Il ne les voit pas toutes.
- telemetry.ts : journal local de ce que le joueur dépense et quand.

Plus apps/web/src/lib/components/hunt/AuraGauge.svelte : disponible vs immobilisé, lisible d'un
coup d'œil, sans chiffre à lire.

L'arbitrage à faire ressentir : avec 100 d'aura, on ne peut pas se payer trois balayages de En
et deux entraves.

Critère de fin : « savoir ou préparer » est une décision difficile. Si le joueur pose toujours
tout ou ne pose jamais rien, corrige les valeurs, pas le code.
```

### Prompt — Étape 3

```
Ajoute le duel. Il démarre pour l'instant dans des conditions identiques à chaque fois — aucun
héritage de la traque, c'est l'étape suivante.

Soixante à quatre-vingt-dix secondes, dans la pièce où le contact a lieu.

Sous apps/web/src/lib/hunt/duel/ :
- ryu.ts : répartition continue de l'aura entre attaque et défense et entre zones du corps.
  C'est LE contrôle du duel.
- gyo.ts : 5/s, révèle où l'aura adverse est concentrée.
- in.ts : dissimule sa propre concentration — la feinte.
- ko.ts : 20 d'aura, tout dans un point, exposition totale ailleurs.
- ken.ts : 6/s, encaisse sans progresser.
- resolve.ts : deux fins seulement — un Ko qui touche un point exposé, ou l'épuisement (à zéro
  d'aura, le Ten ne tient plus et le coup suivant est fatal). AUCUNE barre de vie, AUCUNE valeur
  de dégâts.
- disengage.ts : couper la ligne de vue et repasser en Zetsu met fin au duel et rend à la traque.
- ../hunter/duel.ts : l'IA répartit, feinte, engage. Elle ne triche pas : elle lit l'aura du
  joueur au Gyo comme le joueur lit la sienne.

Plus apps/web/src/lib/components/hunt/AuraOverlay.svelte : le rendu de l'aura par zone — halo,
montée, extinction. Poses simples, pas d'animation riche.

INVARIANT : on doit pouvoir gagner ce duel sans jamais attaquer, par attrition.

Critère de fin : soixante secondes de répartition tiennent avec ce rendu minimal. C'est l'étape
qui décide du coût du projet — si la lecture ne passe pas ici, on s'arrête avant d'animer.
```

### Prompt — Étape 4

```
Fais la jonction entre la traque et le duel. C'est la question que tout le prototype existe pour
trancher : est-ce qu'une entrave posée quatre minutes plus tôt se sent au moment du duel ?

Sous apps/web/src/lib/hunt/ :
- duel/inherit.ts : une entrave présente dans la pièce du contact est active dans le duel — le
  chasseur commence retenu. Et les jauges d'entrée des deux camps sont celles que la traque a
  laissées, pas des valeurs fixes.
- duel/recover.ts : le joueur peut reprendre son aura posée pendant le duel en la touchant, ce
  qui fait de « reculer vers ses propres pièges » une manœuvre réelle.
- outcome.ts : ajoute l'élimination sans contact. L'aura du chasseur descend avec ce qu'il
  dépense à chercher et à inspecter ; à zéro il ne tient plus son Ten, et une entrave ordinaire
  le tue.

Plus apps/web/src/lib/components/hunt/Debrief.svelte : le rapport de fin — ce que chacun a cru,
à quel moment, et ce que ça a coûté. Le même geste que le reste du site : un enregistrement qui
appartient à un moment et à un point de vue.

Critère de fin : la préparation se sent au moment du duel. Si non, les deux moitiés ne
communiquent pas — c'est le moment de s'arrêter et de le dire.
```

---

## 8. Risques et questions ouvertes

| Risque | Étape | Atténuation |
| --- | --- | --- |
| **La lisibilité de l'aura ne passe pas** sans animation riche. C'est le risque principal du projet. | 3 | L'étape 3 est conçue pour révéler ce risque avant tout investissement d'animation. |
| **Huit pièces sont trop petites** pour dix minutes de traque. | 1 | Étendre à `interior-room-1005` plus le couloir `tier-1` (≈ 18 spaces) ; prévu, pas d'obstacle. |
| **L'économie d'aura ne produit pas d'arbitrage.** | 2 | Ce sont des valeurs, pas du code. La télémétrie de T2.5 sert exactement à ça. |
| **Le duel et la traque restent deux jeux collés.** | 4 | C'est la question, et l'échec est un résultat valable. |
| **Le ratchet ESLint** — le code de combat va vouloir grossir. | toutes | Découpage par verbe imposé dès l'étape 0 : un fichier par principe du Nen. |
| **Le ton du site** — une archive qui affirme ne rien inventer, à côté d'un jeu. | — | Route séparée, voix propre. Le jeu ne modifie pas `blueprint.json` (I6). |

**Questions non tranchées.**

1. Le joueur est-il toujours la proie, ou un mode chasseur existe-t-il ? *(hors prototype)*
2. La partie est-elle un roguelike à parties courtes ou une campagne ? *(hors prototype)*
3. ~~Que se passe-t-il aux frontières du sous-ensemble d'arène ?~~ **Tranché en T0.2 : la question
   ne se pose pas.** Les 8 spaces attestés sont la totalité du tier `interior-room-1004` — la
   frontière de l'arène est la coque de l'appartement elle-même. Ni mur invisible, ni porte scellée
   par décret : le joueur est arrêté par les cloisons que la reconstruction dessine déjà, avec la
   collision du `/tour`. Si l'arène s'étend à `interior-room-1005` (risque « huit pièces trop
   petites »), la question se reposera pour de bon.
