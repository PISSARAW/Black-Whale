# Expressions pendant le combat

Les 40 combattants sélectionnables possèdent une direction explicite dans
`fightExpressionProfiles.ts`, vérifiée contre `FIGHTING_ROSTER`. Les six premiers
profils sont conservés. Les autres profils adaptent le regard, les sourcils,
la retenue, le sourire et la tension des épaules à chaque personnage.
Ces profils sont une direction artistique du jeu.

`fightExpressions.ts` lit la pose, l’attaque et les états de réaction existants.
La douleur prend priorité sur une attaque interrompue ; elle supprime immédiatement
l’effort et le sourire. La récupération du coup, le hitstun et le réveil pilotent
le retour à la concentration. La couche ne modifie ni simulation, ni ressources,
ni collisions, ni paquets ou empreintes des replays.

| Personnage   | Direction                                                                   |
| ------------ | --------------------------------------------------------------------------- |
| Kurapika     | Concentration précise, tension contenue.                                    |
| Hisoka       | Amusement et sourire joueur, interrompus par un impact.                     |
| Chrollo      | Calme analytique, réactions retenues.                                       |
| Benjamin     | Autorité sévère, effort puissant.                                           |
| Tserriednich | Dédain froid, irritation maîtrisée ; respecte les yeux fermés.              |
| Feitan       | Hostilité du regard, tension sous le col.                                   |
| Saiyu        | Vigilance narquoise, rictus et dents serrées natifs.                        |
| Theta        | Attention prudente, inquiétude contenue.                                    |
| Biscuit      | Candeur affichée et assurance de maîtresse ; forme naturelle plus sévère.   |
| Phinks       | Assurance provocatrice et effort appuyé.                                    |
| Franklin     | Placide et solide, crispation sobre de la mâchoire.                         |
| Machi        | Froideur attentive, regard tranchant.                                       |
| Illumi       | Visage impassible et regard noir fixe ; réaction surtout corporelle.        |
| Kalluto      | Réserve et application, curiosité discrète.                                 |
| Bonolenov    | Gravité et maîtrise ; posture expressive sous les bandages intacts.         |
| Shizuku      | Détachement, peu de variations du visage.                                   |
| Hinrigh      | Pragmatisme vigilant et assurance mesurée.                                  |
| Mizaistom    | Sérieux posé, autorité sans agitation.                                      |
| Leorio       | Franchise, détermination et réactions vives.                                |
| Hanzo        | Discipline attentive, effort nerveux mais contrôlé.                         |
| Rihan        | Observation analytique, concentration presque immobile.                     |
| Zakuro       | Aisance joueuse et sourire expressif.                                       |
| Melody       | Douceur attentive, inquiétude sans agressivité ; lèvres stables à la flûte. |
| Basho        | Assurance bourrue, effort franc.                                            |
| Camilla      | Arrogance altière, irritation très lisible.                                 |
| Halkenburg   | Gravité déterminée, tension sincère.                                        |
| Gel          | Assurance calme ; conserve rouge à lèvres et pupilles fendues.              |
| Lynch        | Défi direct, effort et douleur démonstratifs.                               |
| Luini        | Audace inquiétante, rictus denté caractéristique.                           |
| Bill         | Fatigue visible, vigilance protectrice et effort tenace.                    |
| Furykov      | Examen soupçonneux, réactions disciplinées.                                 |
| Cluck        | Attention sévère et vivacité.                                               |
| Beyond       | Confiance expansive, sourire aventureux.                                    |
| Longhi       | Attention réfléchie et fermeté retenue.                                     |
| Musse        | Discrétion professionnelle, tension mesurée.                                |
| Padaille     | Agressivité frontale et crispation marquée.                                 |
| Sayird       | Vigilance inquiète et réactions rapides.                                    |
| Terebellum   | Robustesse taciturne, mâchoire et épaules tendues.                          |
| Voconte      | Désinvolture alerte, léger sourire.                                         |
| Yokotani     | Courtoisie inquiétante ; conserve sourire large et paupières arquées.       |

## Modèles et intégration

`fightExpressionRig.ts` mémorise les transformations natives des yeux, sourcils
et pupilles. `fightExpressionFeatures.ts` adapte les bouches et paupières
particulières, en conservant leurs matériaux et leurs éléments visibles.
`fighterFigure.ts` enregistre le rig lors de la construction.
Chaque acteur conserve ses propres coefficients, même quand deux modèles
partagent leurs géométries. Les couleurs natives, y compris les yeux écarlates,
ne sont pas remplacées.

`fightExpressionMouth.ts` prépare trois morphs GPU sur la bouche existante :
effort, douleur et sourire. Le contour natif est subdivisé en ruban pour permettre
une courbure des lèvres. Les bouches natives de Melody, Gel, Saiyu, Luini et
Yokotani utilisent un pivot partagé avec leurs dents et détails, sans nouveau
mesh. Les yeux arqués de Yokotani remplacent ses yeux ordinaires déjà cachés. Les formes sont ajustées à la surface du visage une fois
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

`fightExpressions.test.ts` et `fightExpressionRoster.test.ts` vérifient les 40 profils, la priorité de la douleur,
les retours à la concentration, les deux orientations, la bouche masquée de
Feitan, l’indépendance entre acteurs, la suspension et les empreintes de replay.
Les suites des poses, du suivi de l’adversaire et des victoires complètent ce lot.

```sh
pnpm --filter @black-whale/web exec vitest run src/lib/fighting/fightExpressions.test.ts src/lib/fighting/fightExpressionRoster.test.ts
node apps/web/scripts/check-fighting-expressions.mjs
```

Le banc navigateur capture les trois états réels des 40 personnages avec la
caméra de combat. La douleur provient d’un coup effectivement reçu par le moteur.
Le cadre de détail éventuel d’une technique est exclu de la mesure de caméra.
Il contrôle ensuite la cadence avec et sans la couche, dans le même bundle et
avec les mêmes commandes par frame. Il reprend la sonde de rendu de l’étape 2.

Les sorties sont dans `output/fighting-expressions/` : vues complètes, détails
du visage, planches du roster, traces et `report.json`.
`FIGHT_EXPRESSIONS_SECONDS` fixe la durée de chaque passage ;
`FIGHT_EXPRESSIONS_REUSE=1` réutilise le bundle préparé. Ces contrôles courts sur
un poste ne remplacent pas toute la campagne de qualification de l’étape 2.

## Traits et états particuliers

- Illumi conserve son regard noir et son visage impassible ; la réaction passe
  principalement par le corps. Aucun sourire ni plissement forcé n’est ajouté.
- Feitan et Bonolenov conservent leurs couvertures physiques. La bouche sous le
  col ou les bandages ne reçoit pas de morph de visage découvert.
- Tserriednich conserve exactement la fermeture native de ses yeux pendant
  Parallel Future ; les expressions ne les rouvrent pas.
- Biscuit a une direction plus sévère dans sa forme naturelle. Le cache de bouche
  distingue aussi la géométrie de peau de cette forme.
- Les accents de tête et d’épaules de Melody cèdent la place à sa pose de flûte.
  Ses lèvres et ses dents restent ensemble ; la géométrie de la flûte est inchangée.
- La bouche du double de Hanzo conserve la transparence du modèle.

Le banc attend maintenant l’identité et la frame du modèle réellement dessiné
avant de capturer une expression : une ancienne scène encore en chargement ne
peut pas valider le personnage suivant. Les détails sont recadrés avec la caméra
principale, en excluant les vues secondaires des techniques.

La [vérification des Hatsu lourds](./HATSU_PERFORMANCE.md) complète ces essais avec
Parallel Future, LSDF, les rafales de Franklin, le chat de Camilla et la forme
naturelle de Biscuit. Elle conserve aussi les échecs du budget strict.
