# Qualification des six combattants — 17 novembre 2026

Le [protocole](../../src/lib/fighting/COMMAND_QUALIFICATION.md) décrit les critères
et la reproduction. La qualification logicielle de base est acquise sur ce poste,
avec des échecs dans quatre scènes de charge en Qualité. La qualification
matérielle reste ouverte : l’utilisateur n’avait pas de manette.

## Provenance

- Référence immuable : `clash-combat-9`, 96 séquences issues des 48 routes.
- Moteur mesuré : `clash-combat-13`. Les 200 checkpoints originaux sont tous
  vérifiés avant toute nouvelle captation ; aucun replay original n’est réétiqueté.
- Apple M5, 10 cœurs, 16 Gio, Chrome avec GPU Metal, vue 1280 × 900, DPR appareil 2.
- Profil Équilibré pour les six personnages ; douze secondes de chauffe et
  trente secondes mesurées par terrain. Le banc observe le rendu 3D de production.
- Poste partagé très chargé pendant les mesures (load average consigné dans les
  rapports). Les résultats ne constituent pas une certification sur d’autres postes.

## Commandes et rendu

882 essais de file, direction et buffer réussissent ; 45 402 sondes de fenêtre
sur les 96 routes concordent entre admission et démarrage réel. Les deux côtés,
les deux orientations et les cadences de polling 120/60/30/20 Hz sont couverts.
Le buffer accepte les six dernières frames de stun ; à sept, la commande est
refusée. Le hitstop conserve la commande. Les tests couvrent aussi relâchement,
neutre après reconnexion, hystérésis des axes et effacement au changement de focus.

Les trois liaisons mesurées contre une garde réelle conservent leurs dernières
marges garanties : Kurapika 6 frames, Chrollo 4, Phinks 5 après récupération.
La frame suivante échoue dans chaque cas ; la commande avant récupération ne
part pas immédiatement.

1 200 appuis isolés sont observés jusqu’à leur première animation : cent par
personnage au clavier, cent avec une manette Xbox **simulée**, zéro animation
manquante. Les six contrôles de focus, pause et relâchement unique du Hatsu passent.
Le refus du Hatsu de Feitan sans blessures respecte sa condition ordinaire.

| Personnage | FPS neutre | FPS interactif | p95 clavier → rendu | p95 manette simulée → rendu |
| ---------- | ---------: | -------------: | ------------------: | --------------------------: |
| Kurapika   |      59.90 |          60.00 |             28.5 ms |                     26.4 ms |
| Benjamin   |      60.00 |          59.70 |             24.2 ms |                     25.7 ms |
| Hisoka     |      59.54 |          59.87 |             24.2 ms |                     26.1 ms |
| Chrollo    |      59.57 |          59.00 |             26.2 ms |                     26.9 ms |
| Feitan     |      59.60 |          59.37 |             22.8 ms |                     23.2 ms |
| Phinks     |      59.67 |          59.90 |             23.1 ms |                     25.3 ms |

Les douze passages respectent tous les critères du protocole : moyenne ≥ 59 FPS,
p95 ≤ 17,5 ms, p99 ≤ 20 ms, au plus 1 % au-dessus de 25 ms et CPU rendu p95 ≤ 12 ms.
Les délais d’entrée sont logiciels ; ils excluent périphérique, affichage et
balayage physique de l’écran.

## Charges supplémentaires en Qualité

| Scène          |   FPS | CPU rendu p95 | Verdict |
| -------------- | ----: | ------------: | ------- |
| projectiles    | 59.64 |       15.5 ms | Échec   |
| future         | 57.34 |       10.3 ms | Échec   |
| post-mortem    | 58.94 |       16.7 ms | Échec   |
| guards         | 47.34 |       26.3 ms | Échec   |
| transformation | 59.97 |       11.9 ms | Réussi  |

Les effets sont réellement manifestés et leurs replays vérifiés. Le coût CPU des
projectiles, les à-coups de Parallel Future et Cat’s Name, et la charge LSDF
empêchent de déclarer le profil Qualité qualifié. LSDF atteint une médiane de
2 556 appels de dessin ; les projectiles, 1 230. Ces observations orientent le
profilage, sans prouver à elles seules la cause de tous les ralentissements.

## Session continue et reprise

La session continue initiale est **invalide** : un indice −1 au premier callback
RAF a arrêté la simulation. Son rendu immobile et ses FPS ne sont pas retenus.
Le rapport initial conserve son verdict négatif et l’erreur. Le correctif borne
l’indice et le contrôle vérifie la progression toutes les dix secondes.

La reprise restaure les sources applicatives du bundle mesuré. Seuls l’horloge
et le contrôle de progression du banc changent ; les empreintes des surcharges
sont jointes au rapport. Le moteur reste `clash-combat-13`.

La session corrigée de 600 secondes est **réussie** : 346 replays terminés
et vérifiés, cinq transitions, aucun échantillon perdu et aucune erreur.

| Personnage | FPS prolongés | Intervalle p95 | Intervalle p99 | CPU p95 | Dérive géométries / textures |
| ---------- | ------------: | -------------: | -------------: | ------: | ---------------------------: |
| Kurapika   |         59.99 |        16.7 ms |        16.8 ms |  5.2 ms |                        0 / 0 |
| Benjamin   |         59.81 |        16.8 ms |        16.8 ms |  5.7 ms |                        0 / 0 |
| Hisoka     |         59.73 |        16.7 ms |        16.8 ms |  5.7 ms |                        0 / 0 |
| Chrollo    |         59.85 |        16.7 ms |        16.8 ms |  3.4 ms |                        0 / 0 |
| Feitan     |         59.66 |        16.8 ms |        16.8 ms |  4.9 ms |                        0 / 0 |
| Phinks     |         59.89 |        16.8 ms |        16.8 ms |  2.7 ms |                        0 / 0 |

Ces compteurs ne mesurent pas toute la mémoire du processus. Les douze premières
secondes de chaque personnage sont exclues de ces statistiques de cadence ; les
traces brutes conservent les changements de personnage et la chauffe.

### Reprise des quatre échecs en Performance

Le même bundle applicatif corrigé est utilisé. Les charges sont reprises avec
les mêmes durées, en profil Performance, dans un rapport distinct.

| Scène       |   FPS | CPU rendu p95 | Verdict |
| ----------- | ----: | ------------: | ------- |
| projectiles | 59.90 |       10.8 ms | Réussi  |
| future      | 58.74 |        3.8 ms | Échec   |
| post-mortem | 60.00 |        8.0 ms | Réussi  |
| guards      | 59.84 |       15.2 ms | Échec   |

Le profil Performance permet aux projectiles et à Cat’s Name de respecter les
critères sur ce poste. Parallel Future conserve une moyenne insuffisante et des
à-coups ; LSDF dépasse encore le budget CPU de 12 ms. La charge du poste varie
entre les passages : cette reprise ne prouve pas à elle seule que le changement
de profil explique tout l’écart. Les échecs Qualité restent conservés.

Les prochains travaux de cadence sont donc : profiler les allocations et le
travail de simulation/rendu pendant Parallel Future ; regrouper ou instancier
les éléments répétés de LSDF et des projectiles ; reprendre exactement ces
charges après chaque correction, sans assouplir les seuils.

## Vérification du code

Les 122 tests applicatifs et les 3 tests de calcul des métriques passent ; le
lint ciblé est vert. Le contrôle TypeScript global du checkout reste bloqué
par une erreur extérieure à ce lot dans `judgmentAction.ts:49` : un objet
`{ text, recipient }` est transmis à une fonction attendant une chaîne.
Les campagnes de rendu utilisent les bundles archivés, indépendamment de cette
évolution du checkout.

## Archives et reproduction

```sh
pnpm test:command-qualification
node apps/web/scripts/check-command-qualification.mjs
```

`Fixture.svelte` monte le composant de production ; `inputDriver.ts` utilise les
contrôles et la file ordinaires. `renderProbe.ts` observe le travail CPU et le
rendu effectif. L’observation optionnelle ne modifie aucun état de simulation.

Les dossiers sous `reference/2026-11-17/` conservent rapports, traces brutes,
captures, bundles avec sourcemaps et SHA-256. `initial-quality` conserve la
campagne initiale, y compris les échecs ; les reprises sont des suppléments
explicitement identifiés. Aucun verdict global positif ne masque ces limites.

Restent à mesurer : manette physique USB/Bluetooth, latence physique jusqu’à
l’écran, et deuxième machine. Les injections ne remplacent aucun de ces essais.
