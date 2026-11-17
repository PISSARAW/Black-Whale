# Finition des quarante combattants

Les quarante personnages jouables suivent le même contrat de présentation et
d’apprentissage que Kurapika, Hisoka, Chrollo et Benjamin. Les réglages de combat
restent des adaptations du duel ; les conditions des pouvoirs restent celles du
moteur existant.

## Chorégraphie

`rosterChoreographyFirst.ts` et `rosterChoreographySecond.ts` donnent à chaque
personnage ses choix de frappes, sa préparation, son transfert de poids, ses
poignets et son retour en garde. Les neuf normales et coups directionnels ont
une silhouette de contact tenue pendant leur fenêtre active, puis rejoignent
la garde propre au personnage. Les directions sont relatives au combattant.

`rosterTechniqueDirection.ts` et `rosterTechniqueGestures.ts` distinguent notamment
écriture, observation, offre de contrat, console, arc, fils, aiguilles, éventail,
sang, transformation, croissance et porte. Ces gestes n’ajoutent ni équipement,
ni collision, ni effet de Nen. Les clips spécifiques déjà écrits dans
`keyPoseMoves.ts` et les poses dépendant de l’état restent prioritaires. Les
identités anciennes exclues du roster conservent le repli par famille.

`rosterSustainedMotion.ts` maintient l’écriture de Basho, la consultation de
Furykov et l’observation de Rihan. Le poignet et le stylo de Basho suivent le
compteur simulé ; une pause ne fait pas avancer l’écriture. Les interruptions,
la garde et les mains occupées passent avant ces gestes. Le papier et le stylo
gardent leur main anatomique quand l’auteur change de côté.

## Modèles et sélection

`tour/humanModelFinish.ts`, appelé par `buildHumanFigure`, ajoute des contours de paupières, pupilles, fibres d’iris
et reliefs du visage adaptés à la forme déjà déclarée. Les détails suivent les
yeux fermés, les transformations et les articulations. Kurapika conserve son
visage spécifique ; les bandages de Bonolenov et le col de Feitan restent des
occlusions ; les yeux noirs d’Illumi gardent leur traitement propre. Les buffers
sont mis en cache et ne sont pas recréés à chaque frame. Tour, Chasse, Infiltration,
Arène et Clash utilisent cette même finition de proximité. Le modèle lointain garde
ses trois masses simples. `fighterModelFinish.ts` conserve une façade compatible
et idempotente pour les anciens appelants.

Les portraits utilisent désormais `buildFightFigure` et `fightBodyMotion`, comme
le combat, avec l’équipement réel et la garde personnelle. La capture statique
applique immédiatement la pose, sans enregistrer la première frame du fondu.
Sayird dispose de paramètres faciaux explicites dans `mangaLikeness.ts`.

Les vingt-cinq descriptions génériques des vagues suivantes utilisent maintenant
leurs plans et contre-jeux individuels. Les sept derniers titres sont propres
aux personnages. `FightFighterDossier.svelte` donne pour chacun le plan de jeu,
le pouvoir et ses conditions, le contre-jeu et les exercices de l’Académie,
en français et en anglais, avec les touches configurées.

## Combat et apprentissage

`combatRoutes.ts` couvre les quarante combattants : quatre routes de base par personnage,
et cent soixante-huit exemples avancés pour quarante personnages, soit 328 routes avec
démonstration et entraînement manuel. Kurapika et Benjamin ont douze routes chacun ;
les trente-huit autres en ont huit. Leurs profils indépendants sont décrits dans
[`DUEL_COMBOS.md`](./DUEL_COMBOS.md). Les 144 autres
routes de `rosterCombatRoutes.ts` utilisent les coups physiques ; elles ne
transforment pas les soutiens ou préparations en Hatsu offensifs. Les seize
routes des personnages de référence sont conservées.

Les cancels sur touche suivent un graphe sans cycle. Les coups intermédiaires
gardent suffisamment de hitstun et limitent leur poussée pour permettre la suite.
Sur garde, seul le premier léger dispose du lien de pression déclaré vers son
lourd ; la pression s’arrête ensuite. Les projections, les coûts, les conditions
des capacités et les règles de juggle restent appliqués par le moteur ordinaire.

Quarante exercices enseignent aussi le blocage puis la punition réelle. Le
mannequin utilise Benjamin pour tous : sa récupération laisse une
fenêtre adaptée à leur léger. Aucun ralentissement artificiel n’est ajouté au
mannequin pendant l’exercice.

## Vérifications reproductibles

- `rosterQuality.test.ts` : couverture exacte du roster, chorégraphies distinctes,
  validité des coups et routes, modèles articulés dans les deux sens, partage des
  géométries, absence de mutation du combattant, écriture et interruptions.
- `fightPoseClock.test.ts` : maintien du contact pour les neuf coups de chacun des
  quarante personnages, puis retour à la garde.
- `combatRoutes.test.ts` : 2 624 situations, deux sens, deux distances, centre et
  coin, avec garde adverse après la première touche.
- `combatSchool.test.ts` : démonstrations à 120, 60, 30 et 20 lots de rendu par
  seconde, défense des quarante personnages et relecture déterministe des routes.
- `combatFundamentals.test.ts` et `combatDefense.test.ts` : graphe sans cycle,
  parades, échecs à vide et fin réelle de pression.
- `node apps/web/scripts/check-fighting-roster.mjs` : quarante portraits réellement
  rendus, fiches FR/EN, sélecteur des quarante exercices, quatre routes et leurs
  démonstrations pour chacun, puis écrans de 390 et 320 px. Le rapport, les captures
  et la planche des quarante personnages sont écrits dans
  `/tmp/black-whale-roster-quality` par défaut.
