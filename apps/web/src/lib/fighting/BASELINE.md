# Référence reproductible des six combattants

Cette étape mesure Kurapika, Benjamin, Hisoka, Chrollo, Feitan et Phinks sans
modifier leurs règles. `combatBaseline.ts` définit les prémisses communes ;
`combatBaselineRoutes.ts`, `combatBaselineSituations.ts` et `combatBaselineTape.ts`
produisent les commandes, observations et replays.

## Version figée et comparaison

Depuis la racine :

```sh
pnpm test:combat-reference
# Recalculer avec les sources archivées, même après évolution du checkout :
pnpm test:combat-reference --frozen
```

La référence conservée dans `apps/web/ui-tests/fighting-reference/reference/`
contient le catalogue des coups et routes, les versions combat/replay/PvP, la
graine, les résultats et les empreintes SHA-256 des sources, y compris le code
non commité et les modules compilés des packages. L’archive `sources.tar.gz`
conserve aussi ces fichiers et le manifeste indique Node et pnpm. Un commit seul ne décrit pas
l’état de ce checkout. Les fichiers d’environnement ne sont pas lus.

La commande copie les sources avant de charger le moteur, puis exécute les
mesures dans cette copie isolée. Les imports de packages du workspace pointent
aussi vers la copie ; seuls les outils et dépendances externes installés sont
réutilisés. Les modifications du checkout pendant le calcul ne changent donc
pas la simulation mesurée. La copie temporaire est supprimée en fin d’exécution.

La commande écrit les mesures détaillées et les replays JSON dans
`output/clash-combat-reference/`. `CLASH_REFERENCE_OUTPUT` change cette destination.
Elle échoue si un résultat, une définition, une prémisse ou une version diffère.
Un changement des sources est signalé séparément : une retouche sans effet sur
le combat peut conserver les résultats. La référence existante n’est jamais
écrasée par une comparaison. `--freeze` sert uniquement à créer la première
référence et refuse de remplacer un fichier existant.

La bibliothèque figée `replays.tar.gz` se décompresse en fichiers
`.bw-replay.json`, importables dans la page Replays de Clash. Choisir un replay,
revenir au paquet 0 et utiliser « Essayer depuis cette frame » pour repartir de
son état réel. Cette reprise est un essai local à deux joueurs ; les réglages
automatiques du mannequin sont retirés par le mécanisme ordinaire de reprise.

Les anciens replays restent liés à leur version du moteur. Leur réimport après
une modification incompatible nécessite la version de source correspondante ;
on ne remplace pas leur version déclarée pour contourner ce contrôle.

## Les 48 routes et leurs mesures

Les huit routes de chaque combattant sont exécutées avec deux orientations,
deux distances (4 et 6 unités), au centre et au coin, sur les deux terrains :
**768 cas**. L’adversaire est Chrollo, sauf pour Chrollo qui affronte Hisoka.
Le défenseur garde après la première touche.

- Tour Céleste : interactions désactivées.
- Soute du Black Whale : interactions activées, caisses ordinaires à 34 et 66.
- Combat K.-O., entraînement, 300 PV et 100 aura finis, Ten initial ordinaire.
- Graine `0x434c4153`, simulation à 60 Hz.
- Chaque route est observée pendant au plus 240 ticks, puis jusqu’à 180 ticks
  supplémentaires pour mesurer la récupération et le placement final.

Les routes Hisoka `tether` et Phinks `charged` passent d’abord par la préparation
réelle de l’Académie. Le snapshot initial conserve l’attache ou les rotations,
les frames écoulées, l’aura et les PV résultants. Cette préparation précède le
replay de conversion ; elle est déclarée dans `route.preparation`, pas présentée
comme une ressource gratuite. Les autres conditions initiales restent celles du
duel : livre de Chrollo et héritages ordinaires de Benjamin notamment.

Le rapport distingue dégâts de combo, perte de PV, contacts, coût débité lors des
commandes explicites, aura initiale/finale, mise au sol au dernier contact,
distance au contact et placement après récupération. Le coût des commandes
n’est pas la variation nette d’aura : récupération, entretien et exécutions
différées peuvent aussi modifier celle-ci. Les actions automatiques du mannequin
restent dans la simulation, mais ne sont pas comptées comme commandes explicites.

Une conversion incomplète est conservée dans `findings.json` ; elle n’est jamais
réparée par une touche forcée. La comparaison vérifie la stabilité de ce qui a
été observé, pas la qualité compétitive d’un résultat connu.

## Sept situations, 84 états de départ

Dans le jeu : entraînement → pause → entraînement → **Référence · six combattants**.
Choisir personnage, situation et terrain, puis lancer. Ce lancement remplace
l’entraînement courant et remet les ressources, la graine et les états à leurs
valeurs de référence. P1 est toujours le personnage étudié ; P2 est Benjamin,
sauf pour les projectiles où il est Franklin. Les sept essais restent aussi
accessibles dans les outils ordinaires d’équilibrage pour consigner un avis.

Chaque combinaison est enregistrée pendant 240 ticks. Les numéros ci-dessous
sont relatifs au début de la séquence, avec le premier paquet numéroté 0.

| Situation           | Positions P1 / P2 | Séquence enregistrée                                                    | Manipulation humaine à comparer                                                   |
| ------------------- | ----------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Distance            | 40 / 60           | Lourd P2 à 0 ; marche P1 de 12 à 35 ; lourd P1 à 38                     | Avancer plus tôt/tard, faire manquer et vérifier la punition réellement obtenue   |
| Approche / anti-air | 40 / 60           | Saut avant P1 à 0, avance jusqu’à 29 ; lourd P2 à 24                    | Comparer marche, saut et dash ; changer le timing du défenseur                    |
| Projectiles         | 20 / 80           | Rafales de Franklin à 0, 90, 180 ; garde debout P1 depuis 20            | Comparer garde, accroupissement, saut et avance ; observer l’effet des couverts   |
| Frappe / projection | 46 / 50           | Projection P1 à 0 ; projection P2 à 1 pour la déprojection              | Alterner frappe, projection, déprojection, saut et projection à vide              |
| Coin                | 87 / 93           | Légers P1 répétés ; P2 garde après trois contacts                       | Chercher quand la garde revient, varier la pression puis inverser les côtés       |
| Relevée             | 44 / 50           | Projection P1 à 0 ; légers entre 45 et 99 ; mannequin en riposte légère | Comparer pression immédiate, attente et garde ; observer la protection de relevée |
| Préparation         | 44 / 50           | Spécial P1 à 0 et 100 ; léger P2 à 8 et 108 ; lourd P2 à 40             | Tester les prérequis, le coût et l’interruption propres au personnage             |

Les situations manuelles démarrent avec P2 manuel ; seule la relevée utilise le
mannequin « garde puis riposte légère ». Les scripts sont des exemples fixes,
pas des solutions optimales ni des validations automatiques de tous les choix.
La rafale haute peut manquer un corps accroupi et les caisses peuvent l’intercepter.

Pour la préparation : Kurapika conserve les restrictions de ses chaînes ;
Benjamin ses héritages ; Hisoka doit obtenir une attache ; Chrollo sa page et
ses mains disponibles ; Feitan doit subir une blessure réelle avant Pain Packer ;
Phinks doit achever une rotation. Le premier refus de Feitan sans blessure est
un résultat attendu. Aucun état de départ des sept situations ne fournit de
charge, blessure, marque ou liaison.

## Validation et limites

Chaque replay passe par le décodeur de production, ses checkpoints et une
resimulation complète à deux cadences de lecture (60 et 20 appels/seconde).
Les états finaux doivent être identiques à l’enregistrement. Les tests couvrent
aussi la déprojection sans dégâts, le retour effectif de la garde au coin, les
projectiles réellement créés, les prérequis et le rejet d’un replay altéré.

```sh
pnpm --filter @black-whale/web exec vitest run src/lib/fighting/combatBaseline.test.ts
pnpm exec vitest run scripts/combat-reference-compare.test.ts
node apps/web/scripts/check-combat-reference.mjs
```

Le contrôle navigateur lance les 84 états deux fois, compare leurs empreintes,
vérifie FR/EN et les largeurs 1440, 390 et 320 px. Il monte le composant de
production ; il ne mesure pas le rendu 3D ni la latence matérielle.
Les parties humaines, l’équilibre des affrontements et les mesures de l’étape 2
restent distincts de cette référence automatisée.
