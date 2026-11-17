# Expressions pendant le combat

Le premier lot concerne Kurapika, Benjamin, Hisoka, Chrollo, Feitan et Phinks.
Il ajoute concentration, effort et douleur aux modèles de combat existants.
Les profils sont une direction artistique du jeu.

`fightExpressions.ts` lit la pose, l’attaque et les états de réaction existants.
La douleur prend priorité sur une attaque interrompue ; elle supprime immédiatement
l’effort et le sourire. La récupération du coup, le hitstun et le réveil pilotent
le retour à la concentration. La couche ne modifie ni simulation, ni ressources,
ni collisions, ni paquets ou empreintes des replays.

| Personnage | Direction du premier lot                                                 |
| ---------- | ------------------------------------------------------------------------ |
| Kurapika   | Regard concentré, sourcils tendus, effort contenu                        |
| Benjamin   | Concentration sévère, effort marqué dans les épaules                     |
| Hisoka     | Léger sourire de base, regard joueur ; sourire interrompu par la douleur |
| Chrollo    | Variations retenues, douleur moins démonstrative                         |
| Feitan     | Regard resserré et posture ; bouche conservée sous le col physique       |
| Phinks     | Assurance, léger sourire et effort plus appuyé                           |

## Modèles et intégration

`fightExpressionRig.ts` mémorise les transformations natives des yeux, sourcils
et pupilles. `fighterFigure.ts` enregistre le rig lors de la construction.
Chaque acteur conserve ses propres coefficients, même quand deux modèles
partagent leurs géométries. Les couleurs natives, y compris les yeux écarlates,
ne sont pas remplacées.

`fightExpressionMouth.ts` prépare trois morphs GPU sur la bouche existante :
effort, douleur et sourire. Le contour natif est subdivisé en ruban pour permettre
une courbure des lèvres. Les formes sont ajustées à la surface du visage une fois
à la construction, y compris sur la tête particulière de Kurapika. Le cache
partage les géométries préparées ; aucune géométrie n’est recréée à chaque frame,
et aucun mesh ni appel de dessin facial supplémentaire n’est ajouté.

`fightExpressionMotion.ts` complète `fightBodyMotion.ts` après la pose du corps.
Il anime le visage, une légère respiration et la tension des épaules. La tête
s’ouvre légèrement vers la caméra ; les pupilles continuent à viser l’adversaire.
Les transitions suivent le temps de présentation, avec une réaction immédiate
à un impact puis un relâchement progressif. Un retour en arrière de l’horloge
réinitialise le mélange.

La couche peut être suspendue par sa présentation propriétaire (`rig.active`).
Les cinématiques de victoire empruntent les transformations et morphs neutres,
puis restaurent exactement l’expression du combat via leur transaction de rendu.

## Vérification

`fightExpressions.test.ts` vérifie les six profils, la priorité de la douleur,
les retours à la concentration, les deux orientations, la bouche masquée de
Feitan, l’indépendance entre acteurs, la suspension et les empreintes de replay.
Les suites des poses, du suivi de l’adversaire et des victoires complètent ce lot.

```sh
pnpm --filter @black-whale/web exec vitest run src/lib/fighting/fightExpressions.test.ts
node apps/web/scripts/check-fighting-expressions.mjs
```

Le banc navigateur capture les trois états réels des six personnages avec la
caméra de combat. La douleur provient d’un coup effectivement reçu par le moteur.
Le cadre de détail éventuel d’une technique est exclu de la mesure de caméra.
Il contrôle ensuite la cadence avec et sans la couche, dans le même bundle et
avec les mêmes commandes par frame. Il reprend la sonde de rendu de l’étape 2.

Les sorties sont dans `output/fighting-expressions/` : vues complètes, détails
du visage, planche des six personnages, traces et `report.json`.
`FIGHT_EXPRESSIONS_SECONDS` fixe la durée de chaque passage ;
`FIGHT_EXPRESSIONS_REUSE=1` réutilise le bundle préparé. Ces contrôles courts sur
un poste ne remplacent pas toute la campagne de qualification de l’étape 2.
