# Clash — plan du netcode à rollback

> **Objectif.** Le PvP de Clash doit donner, jusqu'à environ 150 ms d'aller-retour, la même
> sensation qu'un duel local : chaque joueur voit ses propres coups partir au délai d'entrée
> choisi et les coups adverses apparaître à leur vraie frame, corrigés par resimulation. Le
> serveur reste l'unique source des verdicts de manche et de match.
>
> **État de départ (19 novembre 2026).** Le PvP est autoritaire côté serveur
> ([PVP.md](../apps/web/src/lib/fighting/PVP.md)) : `pvp/serverMatch.ts` avance le moteur à
> 60 Hz sur sa propre horloge, les entrées arrivent par HTTP et les vues repartent par SSE.
> Le client ne prédit que son propre corps, pendant au plus 12 frames, et extrapole la position
> adverse pendant 2 frames. Ce n'est pas un rollback des deux joueurs : à 100 ms, une attaque
> adverse apparaît après au moins un aller simple (environ 3 frames à 100 ms), et ses premières
> frames ne sont jamais montrées.
>
> **Définition de « réussi ».** Voir la section [Critères d'acceptation](#critères-dacceptation).

## Ce qui rend le chantier faisable

Le moteur a déjà les trois propriétés qu'un rollback exige.

| Propriété               | Où                                            | Constat                                                                        |
| ----------------------- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| Pas pur `état → état`   | `tickFight` (`fighting/engine.ts`)            | aucune écriture extérieure ; le son de Melody est un état, pas un effet        |
| Aléa porté par l'état   | `FightState.rng`, graine dans `fightState.ts` | aucun `Math.random` ni horloge dans la simulation (seulement sélection, rendu) |
| Détection de divergence | `fightReplayHash.ts`, lecteur de replays      | les replays rejouent déjà les entrées et comparent des empreintes périodiques  |
| Entrées compactes       | `packReplayInput` / `unpackReplayInput`       | les entrées maintenues tiennent dans un entier par frame                       |

### Budget mesuré

Sonde jetable lancée le 19 novembre 2026 sous Vitest/Node, Apple M5, 40 duels de 600 frames,
`versus-local` sans IA, entrées pseudo-aléatoires (garde, saut, aura, Hatsu, déplacements) :

| Mesure                  |     p50 |     p95 |     p99 |     max |
| ----------------------- | ------: | ------: | ------: | ------: |
| `tickFight`             | 0,09 ms | 0,18 ms | 0,32 ms |  5,4 ms |
| `structuredClone(état)` | 0,02 ms | 0,03 ms | 0,07 ms | 0,10 ms |
| `fightReplayHash`       | 0,06 ms | 0,09 ms | 0,21 ms | 0,44 ms |
| État sérialisé (JSON)   |  4,4 Ko |  4,7 Ko |  4,9 Ko |  5,0 Ko |

Une resimulation de 8 frames coûte donc environ 2,6 ms au p99 sur cette machine, sur une
frame de 16,7 ms qui doit aussi contenir le rendu. **Ces chiffres ne valent pas garantie :** Node n'est pas un navigateur, le M5 n'est pas une machine modeste, et la sonde n'a
déclenché ni Parallel Future (qui stocke des frames de prévision dans l'état), ni Chrollo
avec plusieurs pages, ni kaméos. Le lot L0 refait la mesure sur ces pires cas.

> **Mise à jour L0 (19 novembre 2026).** Mesures complètes, dans Chrome et avec le CPU ralenti
> ×4, dans le [rapport du lot L0](clash-netcode-rollback-l0.md) : moteur déterministe sous
> rollback, états réutilisables sans copie, Parallel Future comme seul bloqueur, fenêtre de
> 8 frames trop large sur une machine lente.

## Ce qui bloque

1. **L'information cachée.** Un rollback exige que chaque client possède l'état complet et
   toutes les entrées adverses. Aujourd'hui, `pvp/view.ts` retire avant l'envoi la vision de
   Parallel Future, Secret Window, Body and Soul, Melody Hearing, le buffer adverse, les pages
   conservées, les attaques dissimulées par In sans Gyo et les points de contact d'En.
   Avec un rollback, ces données sont dans la mémoire du navigateur : un client modifié peut
   les lire. C'est la décision D1.
2. **Le temps appartient au serveur.** Le client n'envoie aucun numéro de frame et le serveur
   applique les commandes au tick où elles arrivent. Un rollback veut des entrées horodatées
   par frame et une horloge partagée entre les deux clients.
3. **Les commandes sémantiques.** Les 14 variantes de `PvpCommand` (poème, Moonlight, questions
   de Lynch, papier de Kalluto, Bloody Mary…) sont appliqués hors du pas de simulation. Ils
   doivent entrer dans le flux d'entrées par frame, avec un ordre déterministe entre camps.
4. **Le transport.** HTTP + SSE ajoute en-têtes, files et relances. Le délai cumulé et l'absence
   de redondance des entrées sont incompatibles avec un rollback de quelques frames.
5. **Les effets de présentation.** Caméra (`cinematicDirector.ts`), gros plans, audio, VFX et
   sons de victoire suivent les frames simulées. Une resimulation peut annuler un impact déjà
   montré : chaque effet doit pouvoir être retiré ou confirmé.

## Décisions

**D1 — Information cachée. Tranchée le 19 novembre 2026 : voie (a).** Le rollback s'applique
aux 40 personnages, sans mode de repli selon la sélection. La fuite possible vers un client
modifié est acceptée en connaissance de cause ; la confidentialité à l'écran et l'arbitrage
serveur des résultats restent garantis. Les voies écartées sont conservées pour mémoire.

- **(a) État complet sur les clients, filtrage local (retenue).** C'est le modèle des jeux de
  combat commerciaux. Les clients honnêtes appliquent toujours `view.ts` avant l'affichage ;
  le serveur rejoue les entrées confirmées et reste seul juge du résultat. Coût : un client
  modifié peut voir les informations privées (équivalent d'un « wallhack »). Le classé garde
  son intégrité de résultat, pas sa confidentialité.
- **(b) Rollback limité aux combattants sans information privée.** Les duels qui engagent un
  Hatsu à vision privée restent sur le mode actuel. Coût : deux expériences de jeu selon la
  sélection, et une liste de personnages concernés à établir en L0.
- **(c) Rollback avec secrets chiffrés révélés à la frame d'effet.** Juste mais très coûteux :
  chaque Hatsu privé doit séparer son engagement de sa révélation. Hors de portée de ce plan.

**D2 — Topologie. À trancher avant L3.** Recommandé : **relais serveur** par WebSocket. Le serveur reçoit les
entrées horodatées, les retransmet immédiatement à l'adversaire et simule en retard, une fois
les deux entrées d'une frame connues. Le pair-à-pair WebRTC gagne la moitié du trajet serveur,
mais demande STUN/TURN, expose les adresses IP et sépare l'arbitre du chemin des entrées. Il
reste une option de L7.

**D3 — Délai d'entrée. À trancher avant L6.** Recommandé : 2 frames par défaut, réglable de 0 à 4 dans les options,
avec un rollback maximal de 8 frames. Au-delà, la frame locale attend (gel bref) plutôt que
de resimuler davantage.

**D4 — Prévision de Parallel Future. Tranchée le 19 novembre 2026 : calcul au fil de la
lecture.** La prévision de 600 frames n'est plus calculée d'un coup à l'activation mais par
tranches, au rythme où le moteur la lit. Le jeu ne change pas ; `REPLAY_RULESET` change parce
que l'état porte une prévision partielle. La mémoïsation a été mesurée et écartée (0 réussite
sur 56 rollbacks mal prédits). Détail et coûts : [rapport L0](clash-netcode-rollback-l0.md#parallel-future).

## Architecture cible

```
client A                         serveur (relais + arbitre)                 client B
--------                         --------------------------                 --------
entrées frame N+délai ─────────► horodate, valide, relaie ───────────────► file d'entrées
simulation prédictive            simulation confirmée (frame min A,B)        simulation prédictive
rollback si entrée ≠ prédite     empreinte toutes les 30 frames ──────────► comparaison
présentation filtrée (view.ts)   verdicts de manche et de match              présentation filtrée
```

- **Session** (`pvp/rollback/session.ts`) : anneau de 9 états (frame courante − 8), entrées
  locales et distantes par frame, prédiction « dernière entrée connue », point de confirmation.
- **Synchronisation** (`pvp/rollback/timeSync.ts`) : chaque client estime son avance sur
  l'adversaire et ralentit d'une frame toutes les N frames s'il est trop en avance, à la
  manière de GGPO. Aucun client ne saute de frame.
- **Entrées** (`pvp/rollback/frameInput.ts`) : `{ frame, bits, commands[] }`. Chaque paquet
  répète les entrées non confirmées (redondance), jusqu'à 8 frames.
- **Arbitre** (`pvp/rollback/refereeMatch.ts`) : remplace l'horloge propre de
  `AuthoritativeClashMatch` par « avancer quand les deux entrées de la frame sont connues ».
  Une place silencieuse au-delà de l'échéance reçoit son entrée répétée, puis la suspension
  existante (3 s) et l'abandon (30 s) s'appliquent sans changement de contrat.
- **Présentation** : les effets portent l'identifiant de la frame qui les a produits. Un effet
  dont la frame est resimulée sans lui est retiré (son coupé, plan de caméra abandonné).

Les règles du combat et du Nen ne changent pas ; seule la forme de la prévision de Parallel
Future change (D4), ce qui change `REPLAY_RULESET`. Un match à rollback produit
le même replay qu'un match local qui aurait reçu les mêmes entrées par frame.

## Lots

Chaque lot est livrable seul, derrière l'option `rollback` du salon, l'ancien mode restant
la valeur par défaut jusqu'à L6. Tous les nouveaux fichiers respectent les bornes de
`CLAUDE.md` ; aucun fichier existant ne grossit pour accueillir ce code.

**L0 — Mesures et inventaire (aucune livraison joueur). Fait : [rapport](clash-netcode-rollback-l0.md).**
Banc permanent `rollbackBudget.test.ts` (ou script `check-fighting-rollback.mjs`) dans le
navigateur réel : coût de `tickFight`, clone et empreinte sur les pires cas (Parallel Future
actif, Chrollo à plusieurs pages, kaméos, terrain interactif). Recensement des données retirées
par `view.ts`, par personnage : avec D1-a, chacune doit avoir un filtre appliqué localement
avant l'affichage, et la liste sert de registre public de ce qu'un client modifié peut lire.
Recensement des effets de présentation déclenchés par frame. _Fini quand_ : un tableau
p50/p95/p99 par personnage, y compris sur un profil CPU ralenti ×4, et le registre des
informations privées, chacune reliée à son filtre local et à son test.

**L1 — Commandes dans le pas de simulation.**
Les `PvpCommand` deviennent des éléments de l'entrée d'une frame, appliqués dans un ordre fixe
(place 1 puis place 2) au début du pas. Le mode actuel adopte ce chemin sans changer de
comportement visible. _Fini quand_ : les tests `pvp/*.test.ts` et les replays de référence
passent, et deux simulations alimentées par les mêmes entrées par frame donnent la même
empreinte pour les 40 personnages.

**L2 — Session de rollback locale.**
`session.ts`, prédiction, anneau d'états, resimulation et détection de désynchronisation,
testés **sans réseau** : deux sessions reliées par un faux canal à délai, gigue et pertes.
_Fini quand_ : 10 000 frames par personnage avec 0 à 150 ms de délai simulé finissent avec des
empreintes identiques entre A, B et une simulation de référence.

**L3 — Transport WebSocket et relais.**
Route WebSocket sur l'adaptateur Node (vérifier le passage par Caddy, déjà compatible avec
les WebSockets), authentifiée par le jeton de place existant. Paquets binaires compacts,
redondance des entrées, ping applicatif. _Fini quand_ : `check-fighting-pvp.mjs` joue un duel
complet entre deux contextes navigateurs à travers le relais.

**L4 — Arbitre en retard confirmé.**
`refereeMatch.ts` simule à partir des entrées confirmées, publie les verdicts et une empreinte
toutes les 30 frames. Un client en désaccord demande un état complet et repart de là (même
chemin que la divergence actuelle). _Fini quand_ : un client falsifiant ses propres empreintes
ou ses verdicts n'obtient aucun résultat différent côté serveur.

**L5 — Présentation réversible.**
Caméra, gros plans, audio et VFX deviennent annulables par frame. _Fini quand_ : un banc force
des rollbacks de 8 frames sur un impact de Hatsu et vérifie qu'aucun gros plan d'impact réussi
ni son d'impact ne reste à l'écran.

**L6 — Réglages joueur et bascule.**
Option du délai d'entrée, indicateur de connexion (frames de rollback moyennes, délai), refus
des files classées au-delà d'un seuil de qualité. Bascule par défaut des files non classée puis
classée. _Fini quand_ : les critères d'acceptation ci-dessous sont mesurés en production sur
de vraies connexions.

**L7 — Pistes ultérieures, non engagées.** Pair-à-pair WebRTC, spectateurs alimentés par le
flux d'entrées plutôt que par des vues, coordinateur partagé pour plusieurs instances serveur.

## Critères d'acceptation

- À 100 ms d'aller-retour simulé avec gigue de 10 ms et 2 % de pertes : délai d'entrée local
  de 2 frames, rollback moyen ≤ 4 frames, aucune frame locale gelée au p99.
- Aucune désynchronisation sur 1 000 matchs simulés couvrant les 40 personnages et les trois
  formats ; chaque désynchronisation provoquée volontairement est détectée en ≤ 30 frames.
- Rendu tenu à 60 FPS au p99 pendant les rollbacks, sur la configuration de référence et sur
  un profil CPU ralenti ×4.
- Les verdicts, ressources et classements ne viennent que du serveur ; un replay de match
  rollback se relit avec le lecteur existant.
- Les informations privées restent masquées à l'écran pour tout client non modifié (D1-a),
  vérifié par les tests de confidentialité existants rejoués sur la vue locale.

## Risques

| Risque                                                 | Parade                                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Pic de `tickFight` (5,4 ms observé une fois)           | L0 attribue le pic ; resimulation étalée ou plafond de rollback abaissé          |
| Parallel Future gonfle l'état et le clone              | mesuré en L0 : états gardés sans copie ; prévision au fil de la lecture (D4)     |
| Effets de présentation déclenchés deux fois            | identifiant de frame sur chaque effet (L5)                                       |
| Commandes textuelles longues (poème, parole) en paquet | envoyées une seule fois avec accusé, référencées par identifiant dans les frames |
| Fuite d'information cachée (D1-a)                      | décision assumée et documentée ; le résultat reste arbitré par le serveur        |
| Registre de salons en mémoire d'un seul processus      | inchangé par ce plan ; un redémarrage coupe les matchs comme aujourd'hui         |

## Hors périmètre

Changement des règles de combat, équilibrage, nouvelle jauge, matchmaking par région et
hébergement multi-instance. Les corrections repérées en chemin vont dans
[decoupage-notes.md](decoupage-notes.md).
