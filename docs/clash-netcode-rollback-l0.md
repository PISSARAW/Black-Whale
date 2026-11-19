# Clash — rollback, lot L0 : mesures et inventaire

> Premier lot du [plan du netcode à rollback](clash-netcode-rollback.md). Aucune livraison
> joueur : ce lot mesure ce que coûterait une resimulation, vérifie que le moteur s'y prête et
> dresse les deux inventaires que les lots suivants consomment. Mesures du 19 novembre 2026.

## Ce que le lot établit

1. **Le moteur est déterministe sous rollback.** Sur 48 scénarios (les 40 personnages,
   5 bandes de stress, Chrollo à six pages, kaméos des deux côtés, arène interactive),
   chaque resimulation de 8 frames retrouve exactement l'empreinte du déroulé direct :
   **0 divergence sur 4 427 rollbacks par mode et par profil**, en Node comme dans Chrome
   (CPU normal et ralenti ×4).
2. **Aucune copie d'état n'est nécessaire.** Les états produits par le moteur ne sont jamais
   modifiés après coup : **0 mutation** détectée en gardant les états par référence. L'anneau
   de rollback peut donc conserver les objets du moteur tels quels ; `structuredClone` devient
   inutile, y compris pour l'état de Parallel Future.
3. **Hors Parallel Future, le budget tient sur une machine rapide, pas encore sur une lente.**
   Dans Chrome, une resimulation de 8 frames coûte 2,4 ms au p99 au pire des 39 autres duels.
   Avec le CPU ralenti ×4, quatre duels dépassent les 16,7 ms d'une frame au p99 (16,8 à
   56,5 ms) : le rollback maximal de 8 frames n'est pas tenable partout sur une machine lente.
4. **Parallel Future est le bloqueur.** L'activation de la vision calcule sa prévision dans
   un seul pas de 130 à 180 ms, et l'état transporte ensuite environ 2,4 Mo de frames prévues.
   Un rollback qui traverse cette frame gèle l'affichage. Voir [Parade proposée](#parallel-future).
5. **Les effets de présentation sont déclenchés par différence d'états.** Une correction de
   rollback peut donc rejouer à tort un impact ancien ou laisser un impact annulé à l'écran
   (lot L5).

## Banc

| Élément                                                            | Rôle                                                                      |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `apps/web/ui-tests/fighting-rollback-budget/scenarios.ts`          | 48 scénarios ; les stress rejouent les bandes du banc de performance      |
| `apps/web/ui-tests/fighting-rollback-budget/measure.ts`            | tick, instantané, empreinte, rollback de 8 frames, divergences, mutations |
| `apps/web/scripts/check-fighting-rollback.mjs`                     | bundle de production, Chrome, CPU ×1 et ×4 par CDP                        |
| `apps/web/ui-tests/fighting-rollback-budget/reference/budget.json` | rapport brut de référence (`--save`)                                      |

```sh
cd apps/web
pnpm test:rollback-budget                         # échoue sur divergence, mutation ou pire cas absent
node scripts/check-fighting-rollback.mjs --save   # réécrit la référence
ROLLBACK_ONLY=stress-future node scripts/check-fighting-rollback.mjs
```

Chaque scénario joue 900 frames (1 201 pour les bandes de stress). Toutes les 10 frames, le
banc reprend l'état d'il y a 8 frames et rejoue les mêmes paquets. Le mode `clone` copie
chaque état ; le mode `reference` garde l'objet du moteur et vérifie son empreinte au moment
de la reprise. Un pire cas qui ne se manifeste jamais fait échouer le banc. Les durées sont
rapportées, pas contrôlées : elles dépendent de la machine.

## Mesures

### Node (Vitest, Apple M5, 10 cœurs, 16 Go)

Mode `reference`, millisecondes. « Roster » agrège les 40 duels (pire valeur par colonne).

| Scénario                 | tick p99 | rollback p95 | rollback p99 | état max |
| ------------------------ | -------: | -----------: | -----------: | -------: |
| Roster hors Tserriednich |     1,07 |         2,77 |         7,50 |   7,2 Ko |
| Duels avec Tserriednich  |     1,74 |         5,14 |       177,49 | 2 491 Ko |
| Stress · Parallel Future |     0,96 |         3,82 |       135,66 | 2 421 Ko |
| Stress · projectiles     |     1,31 |         3,53 |         3,77 |  15,3 Ko |
| Stress · post-mortem     |     1,17 |         3,15 |         3,42 |   7,9 Ko |
| Stress · gardes LSDF     |     0,95 |         2,90 |         3,26 |   6,3 Ko |
| Stress · transformation  |     0,84 |         2,85 |         3,06 |   5,9 Ko |
| Chrollo, six pages       |     0,97 |         2,66 |         3,13 |   5,2 Ko |
| Kaméos des deux côtés    |     1,22 |         3,21 |         8,58 |   7,5 Ko |
| Arène interactive        |     0,95 |         3,45 |         4,18 |   5,1 Ko |

En mode `clone`, la copie de l'état de Parallel Future coûte 16 à 39 ms au p99 : c'est ce
qui rend le mode `reference` nécessaire. Ailleurs, la copie reste sous 0,6 ms.

Des pics isolés restent non attribués (77,7 ms sur un tick des kaméos en mode `reference`,
82,6 ms en arène en mode `clone`) ; ils ne se reproduisent pas dans l'autre mode du même
scénario et ressemblent à des pauses du ramasse-miettes. Le banc navigateur les recoupe.

### Chrome (bundle de production)

Bundle de production, Chrome 157 sans interface, sans rendu, même machine. Mode
`reference`, millisecondes. Chrome arrondit `performance.now()` à 0,1 ms : les valeurs sous
0,5 ms sont indicatives.

| Scénario                 | CPU ×1 tick p99 | ×1 rollback p99 | CPU ×4 tick p99 | ×4 rollback p95 | ×4 rollback p99 |
| ------------------------ | --------------: | --------------: | --------------: | --------------: | --------------: |
| Roster hors Tserriednich |            0,50 |            2,40 |            5,50 |           15,80 |           56,50 |
| Duels avec Tserriednich  |            0,70 |          155,20 |            3,60 |            8,40 |          501,60 |
| Stress · Parallel Future |            0,50 |           73,30 |            2,30 |            6,50 |          329,30 |
| Stress · projectiles     |            0,30 |            1,30 |            1,50 |            5,60 |            6,70 |
| Stress · post-mortem     |            0,30 |            1,30 |            1,40 |            5,20 |            5,80 |
| Stress · gardes LSDF     |            0,20 |            1,20 |            1,40 |            4,70 |            5,10 |
| Stress · transformation  |            0,30 |            1,10 |            1,40 |            5,20 |            5,80 |
| Chrollo, six pages       |            0,20 |            1,20 |            1,20 |            4,50 |            5,10 |
| Kaméos des deux côtés    |            0,30 |            1,70 |            1,20 |            2,00 |            5,90 |
| Arène interactive        |            0,20 |            1,00 |            1,30 |            5,10 |            5,80 |

Avec le CPU ×4, les duels qui dépassent 16,7 ms au p99 hors Tserriednich sont
`bonolenov-vs-zakuro` (18,0), `basho-vs-furykov` (18,0), `beyond-vs-yokotani` (16,8) et
`musse-vs-hisoka` (56,5, un pic isolé : son p95 vaut 15,8). Le banc ne rend rien : en jeu,
le coût du rendu s'ajoute à ces chiffres dans la même frame.

Conséquence pour D3 : sur une machine lente, la fenêtre de rollback doit se réduire d'elle-même
(par exemple à 4 frames quand le coût mesuré d'un pas dépasse un seuil), en compensant par un
délai d'entrée plus grand. La session de L2 mesure ce coût en continu.

## Parallel Future

Le pas d'activation de la vision de Tserriednich simule d'un coup les 600 frames de la fenêtre
de prévision (`parallelFutureForecast.ts`, `FUTURE_WINDOW_FRAMES`), puis les fige dans
`state.parallelFuture.frames`.

### La mémoïsation ne suffit pas (mesure du 19 novembre 2026)

Un rollback ne resimule que lorsqu'une entrée adverse a été mal prédite. Pour que la prévision
mise en cache serve, il faudrait que cette entrée mal prédite n'ait rien changé à l'état
d'activation ni à l'entrée adverse tenue à cette frame. Essai jetable (Vitest, non conservé) sur la bande de stress
Parallel Future, avec une entrée adverse « humaine » qui change toutes les 6, 12 ou 24 frames
et une prédiction « dernière entrée connue », pour chaque rollback de 1 à 8 frames qui
traverse l'une des 4 activations :

| Changement d'entrée adverse | rollbacks mal prédits traversant l'activation | prévision réutilisable |
| --------------------------: | --------------------------------------------: | ---------------------: |
|                tous les 6 f |                                            32 |                      0 |
|               tous les 12 f |                                            12 |                      0 |
|               tous les 24 f |                                            12 |                      0 |

**0 réussite sur 56.** La clé d'un cache serait pourtant bon marché : l'empreinte de l'état
d'activation coûte 0,14 à 0,39 ms pour un état de 5 à 10 Ko (les 2,4 Mo n'existent qu'après
la prévision). La mémoïsation reste utile en appoint, pas comme parade.

### Parade retenue : prévision calculée au fil de la lecture (D4, 19 novembre 2026)

Le moteur lit les frames prévues dans l'ordre :

- pendant la vision, `previewCursor` avance de 4 frames par pas (`stepVision`, présentation) ;
  l'IA adverse, propriétaire de la vision en versus-ai seulement, passe tout de suite en
  divergence ;
- pendant la divergence, `cursor` avance d'une frame par pas (`parallelFuture.ts`,
  `throws/selection.ts`) ; l'IA lit en plus les 60 frames suivantes (`steerFutureAi` dans
  `parallelFutureAi.ts`).

La prévision ne dépend que de l'état d'activation et des commandes tenues, fixés à
l'activation. La calculer par tranches donne les mêmes frames, à condition que la tranche
calculée à chaque pas soit une fonction de l'état seul (jamais du fait qu'on resimule) :

- `parallelFuture` garde, en données ordinaires, l'état prédit courant (5 à 10 Ko) et les
  frames déjà calculées ; chaque pas complète jusqu'à
  `max(previewCursor + 4, cursor + 1, cursor + 60 si l'IA possède la vision)`, plafonné à 600 ;
- chaque tranche est figée à part (`immutableFightSnapshot`) pour que l'empreinte réutilise
  les digests des frames déjà vues, au lieu de recopier tout le tableau.

Ce que cela coûte et change :

- **Jeu inchangé, replays non.** Les règles et les frames lues sont identiques, mais l'état
  contient désormais une prévision partielle, donc les empreintes diffèrent : `REPLAY_RULESET`
  et `PVP_RULESET` changent, et les anciens replays sont refusés comme à chaque changement de
  règles.
- **Coût par pas pendant la vision : 4 pas de prévision**, soit environ 2 ms au p99 dans
  Chrome (CPU ×1) et 9 ms ralenti ×4, d'après le p99 d'un pas ordinaire ; à mesurer sur les
  pas de prévision eux-mêmes. Une fois les 600 frames calculées (150 pas), plus rien.
- **Rollback juste après l'activation : environ 32 pas de prévision en plus** au lieu de 600,
  soit de l'ordre de 16 ms dans Chrome au p99 et 70 ms ralenti ×4. C'est beaucoup mieux que
  73 à 500 ms, sans tenir dans une frame sur une machine lente. Le levier restant est la
  vitesse de l'aperçu : 2 frames par pas au lieu de 4 divisent ce coût par deux, au prix d'un
  aperçu deux fois plus lent (présentation seulement). À trancher avec les mesures de L2.
- À adapter : la piste de caméra (`parallelFutureCamera.ts`, qui parcourt toutes les frames),
  l'empreinte (`fightReplayHash.ts`), le masquage (`pvp/view.ts`), la présentation
  (`parallelFuturePresentation.ts`) et les instantanés de replay.
- À prouver : sur les tests de Parallel Future existants, chaque frame lue par le moteur est
  identique à celle de la prévision complète actuelle.

### Alternative écartée

**Point de synchronisation à l'activation.** Le client ne calcule la prévision qu'une fois la
frame d'activation confirmée par les deux entrées. Un seul calcul par activation (130 ms en
CPU normal, jusqu'à 500 ms ralenti ×4 dans Chrome) : un gel visible à chaque activation, mais
aucun dans les rollbacks qui suivent.

## Registre des informations privées (D1-a)

Avec D1-a, chaque client reçoit l'état complet. Les champs ci-dessous, retirés aujourd'hui
par `apps/web/src/lib/fighting/pvp/view.ts` avant l'envoi, seront lisibles par un client
modifié. Chacun devra être masqué localement avant l'affichage, par le même code.

« Test » cite un test de vue privée (`privatePvpState` / `pvpSnapshot`) qui mentionne le
champ ; la mention ne prouve pas à elle seule que le masquage est vérifié. **Aucun** marque un
champ sans test de vue privée : c'est le travail à faire avant la bascule.

| Champ retiré                                                                              | Personnage, technique               | Test de vue privée                                       |
| ----------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------- |
| `halkSoul.mind`, `halkSedativeSpent`, `halkSoulMinds`, `halkSoulLinks`, `halkenburgModes` | Halkenburg, transfert de conscience | `halkenburgSoulChains`, `halkenburgSoulIntegration`      |
| `guardianWords`                                                                           | Tserriednich, gardien               | `fourCombatEvidence`, `kameos/pvp`                       |
| `toxinExposure`, `toxinClouds` adverses                                                   | Benjamin, toxine                    | `fourCombatIntegration`                                  |
| `futureStoredFrames`, `futureIllusionMode`, `futureIllusion`, `parallelFuture` adverse    | Tserriednich, Parallel Future       | `futureParticipants`, `fourCombatFuture`, `rosterFuture` |
| `gumHeartArmed`, `gumHeartPreparation`, `gumThrowReady`                                   | Hisoka, Bungee Gum                  | `fourCombatControl`, `bungeeNetwork`                     |
| `bungeeGum`, `gumNetwork`, projectiles de gomme                                           | Hisoka, réseau de gomme             | `bungeeNetwork`, `nenCombat/combat`                      |
| `gumCatch` dissimulé                                                                      | Hisoka                              | **Aucun**                                                |
| `luiniExit`                                                                               | Luini, passages                     | `twoCombatLuini`                                         |
| `luiniSelectedDestination`, `luiniComplete`                                               | Luini, passages                     | **Aucun**                                                |
| `bloodyMary.lastSeen`                                                                     | Bloody Mary                         | `twoCombatZakuro`                                        |
| `biohazardFootage`, `biohazardSignal`, enregistrements, appareils cachés                  | Biohazard                           | `biohazardDevices`, `threeCombatIntegration`             |
| déclarations des caméras du terrain                                                       | Biohazard, caméras                  | **Aucun**                                                |
| `dowsingReading`                                                                          | Dowsing                             | `dowsing`, `singleCombatArsenal`                         |
| `dowsingAcquaintances`, `dowsingLocation`                                                 | Dowsing                             | **Aucun**                                                |
| `judgmentPreset`                                                                          | Kurapika, Judgment Chain            | `judgmentClauses`                                        |
| `heardWords`                                                                              | paroles rapportées                  | `melodyInterrogation`, `twoCombatLuini`                  |
| `hunterInterview`, `chrolloHistorical` (téléphone, plan IA)                               | Chrollo                             | `judgmentClauses`, `retrospectiveIntegration`            |
| `chrolloBook` (pages, signet)                                                             | Chrollo, Skill Hunter               | `singleCombatArsenal`, `rosterFuture`                    |
| `heardCorpse`                                                                             | Illumi, cadavres                    | `fourCombatIntegration`                                  |
| `bodyAndSoulReplies`                                                                      | Lynch, Body and Soul                | `pvp/serverMatch`                                        |
| `secretWindow`, `secretWindowMode`                                                        | Secret Window                       | `singleCombatArsenal`, `pvp/serverMatch`                 |
| `sweetHomeObject`                                                                         | Terebellum, Sweet Home              | **Aucun**                                                |
| `melodyHearing`, `speechPulse`                                                            | Melody                              | `melodyInterrogation`                                    |
| `comboMaster`                                                                             | Combo Master                        | **Aucun**                                                |
| `predator` (connaissances, analyse)                                                       | Predator                            | `pvp/serverMatch`                                        |
| `kallutoPaper.heard`                                                                      | Kalluto, papier                     | `pvp/serverMatch`                                        |
| `battleCantabile` (modèles mémorisés)                                                     | Bonolenov, Battle Cantabile         | `fourCombatControl`, `multiCombatApplications`           |
| `hatsuEffects.witnessedHatsu`                                                             | tous, témoin de Nen                 | **Aucun**                                                |
| `bufferedAttack` adverse                                                                  | tous                                | **Aucun**                                                |
| `commandFeedback` adverse                                                                 | tous                                | **Aucun**                                                |
| `arsenalTrace`                                                                            | tous, IA                            | `threeCombatIntegration`, `rosterFuture`                 |
| Nen sous In, attaque dissimulée (sans Gyo)                                                | tous                                | `singleCombatArsenal`, `fourCombatControl`               |
| `enReadings` (points de contact d'En)                                                     | En                                  | `en/en`, `nenCombat/combat`                              |
| invités, réserves d'équipe, kaméos adverses                                               | équipes, kaméos                     | `rosterGuests`, `judgmentClauses`, `kameos/pvp`          |

Le spectateur (`pvp/spectator.ts`) applique ses propres retraits. Sous D1-a, il reçoit lui
aussi l'état complet s'il est alimenté par le flux d'entrées (L7) : à décider à ce moment-là.

## Effets de présentation déclenchés par les frames

Tous les observateurs ci-dessous comparent l'état affiché précédent à l'état courant. Une
correction de rollback remplace l'état courant par un état de même numéro de frame : ces
comparaisons voient alors une « nouvelle » différence (impact plus ancien, projectile
réapparu) ou n'apprennent jamais qu'un impact affiché n'a pas eu lieu.

| Observateur                                                                                                                                                                                                                  | Ce qu'il déclenche                       | Réinitialisation actuelle             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------- |
| `fighting/audio/director.ts` (`fightSoundEvents`)                                                                                                                                                                            | sons ponctuels, voix continues           | nouvelle manche seulement             |
| `fighting/cinematicDirector.ts` (`cinematicEvents`)                                                                                                                                                                          | accents, gros plans, plans de caméra     | frame qui recule, changement de duel  |
| `components/fighting/FightStage.svelte` (`fightImpactScene`)                                                                                                                                                                 | éclats et marques d'impact               | à vérifier                            |
| présentations par personnage : `benjaminPresentation`, `blinkyPresentation`, `bodyHatsuPresentation`, `feitanPresentation`, `hisokaPresentation`, `chrolloDetonation`, `chrolloAnimation`, `phinksImpact`, `phinksAnimation` | accents de type 1 et 2                   | clé de duel et frame, selon le module |
| `fightAttackTravel.ts`, `fightReactionPresentation.ts`, `throwCinematic.ts`, `onTechnique.ts`, `nenImpactResponse.ts`                                                                                                        | trajectoires, réactions, projections, On | à vérifier                            |
| `victory/personalGuardTrack.ts`, `victory/billComboTrack.ts`                                                                                                                                                                 | pistes de victoire                       | à vérifier                            |

Les leçons, défis et mesures du laboratoire (`fightLessonState`, `combatSchoolProgress`,
`fightChallenges`, `trainingMeasurement`…) suivent le même schéma mais ne tournent pas en PvP.

Conséquence pour L5 : plutôt que d'ajouter une annulation à chaque observateur, la session de
rollback peut ne leur présenter que des transitions **confirmées ou stables** pour les effets
ponctuels (sons d'impact, gros plans), et l'état prédit pour le seul rendu des corps. Le choix
se fera en L5 ; ce registre en donne le périmètre.

## Suite

- L1 peut commencer : le déterminisme qu'il suppose est vérifié.
- Parallel Future : prévision au fil de la lecture retenue (D4). Elle s'implémente avec L2,
  vitesse de l'aperçu à fixer d'après ses mesures.
- Avant la bascule (L6) : un test de vue locale pour chaque ligne **Aucun** du registre.
