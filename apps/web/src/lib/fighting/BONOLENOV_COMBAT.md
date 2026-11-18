# Bonolenov — danse, déplacements et Prologue

Révision du 18 novembre 2026, à partir de la [vidéo fournie par l'utilisateur](https://www.youtube.com/watch?v=Kek_V_Cm0dU),
« [Hunter x Hunter] Bonolenov Fights Chimera Ant English Dub », Totero, 2 min 28 s.
La vidéo a été ouverte et examinée dans le lecteur YouTube, avec des arrêts sur
les phases de mouvement. Les repères ci-dessous correspondent à cette version.

## Références observées

| Repère dans la vidéo | Élément retenu                                                                                                             | Traduction dans le duel                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Début–0:47           | Changements d'orientation rapides et déplacement dansé autour de l'adversaire.                                             | Pas avec levée alternée des jambes, pivots du corps entier pendant les dashes. Le déplacement réel reste celui du moteur, sans téléportation ni esquive garantie.     |
| 1:07–1:17            | Orifices corporels et exemple de danse sur un appui, une jambe relevée, bras écartés.                                      | Préparation avec alternance des appuis et ouverture des bras. Les marques des orifices sont attachées au torse, aux bras et aux mains et suivent leurs articulations. |
| 1:27–1:42            | Référence au guerrier et apparition de la tenue de Prologue ; port de la lance et préparation du corps derrière la pointe. | Posture armée distincte du repos à gants. Lance portée par la main droite dans les deux orientations.                                                                 |
| Environ 1:42–1:47    | Estoc puis échange achevé.                                                                                                 | Préparation, extension de la main droite avec la hampe orientée vers la cible, contact tenu pendant les frames actives, puis récupération.                            |
| 1:57–fin             | Attitude posée après l'échange ; Prologue n'est plus montré comme une danse continue.                                      | Le fait de garder une lance préparée ne déclenche plus une danse ni une boucle musicale permanente au repos.                                                          |

Les scènes correspondent notamment au [chapitre 225](https://hunterxhunter.fandom.com/wiki/Chapter_225)
pour l'origine du corps-instrument et Prologue. La vidéo est la référence visuelle
de cette modification ; le lien de chapitre sert de repère narratif secondaire.

**Jupiter n'est pas exécuté dans cet extrait.** Ses conditions, sa préparation,
sa poursuite, ses dimensions et ses dégâts ne sont pas réinterprétés à partir de
cette vidéo. Metamorphosen et ses conditions de dialogue restent également
distincts de la séquence examinée.

## Changements

- `bonolenovPoses.ts` échantillonne la préparation à partir de ses compteurs
  simulés. Une rotation et une contre-rotation passent par le corps entier ;
  le torse ne se vrille pas de plusieurs tours sur le bassin. La danse retourne
  vers son orientation de départ et cède la place à la posture armée.
- `bonolenovLocomotion.ts` dessine les pas à partir de la distance réellement
  parcourue, et les pivots à partir du compteur du dash. Attendre sans bouger ne
  fait pas défiler une marche fictive.
- `keyPosesBonolenov.ts` remplace les neuf normales issues des gabarits génériques
  par des préparations et récupérations avec équilibre et rotation propres au
  personnage. **Ces neuf coups restent des adaptations de jeu** : la vidéo ne
  montre pas neuf attaques canoniques nommées, et leurs animations ne donnent
  pas de nouvelles propriétés de Nen.
- L'estoc mobilise le bras portant réellement la lance. Son orientation locale
  suit la hampe et l'avant-bras, en corrigeant l'ancien axe de pistolet. Les côtés
  de la pose sont inversés au changement d'orientation pour conserver la main
  droite anatomique.
- La préparation découvre le corps et monte les orifices sur les membres
  mobiles. Leur nombre, leur taille et leur disposition restent une évocation
  graphique du rig, pas un relevé anatomique exhaustif de chaque ouverture.
- Les mouvements de combat ordinaires découvrent également l'instrument. Le
  marqueur simulé `unwrapped` conserve cet état entre les coups et disparaît à
  la manche suivante ; le corps ne se rebande pas à chaque retour au repos.
- `audio/bonolenov.ts` fait résonner un souffle et trois partiels pendant les
  danses, frappes et déplacements. Les hauteurs et les accents suivent les
  compteurs de préparation, d'attaque et de dash, ou la distance parcourue.
  Cette phrase synthétisée évoque les ouvertures du corps : elle ne reprend
  pas l'enregistrement musical de l'anime.
- L'IA peut reculer par un dash ordinaire après observation suffisante d'une
  menace visible. Elle conserve le temps de réaction, la distance finie et la
  vulnérabilité du système commun. Avec Prologue préparé, elle propose l'estoc
  avant de recommencer une autre pièce et peut avancer vers sa portée.

## Adaptations et limites conservées

La durée et le coût de préparation sont des réglages du duel : 60 frames et
40 aura pour Prologue. L'estoc conserve ses ressources, sa portée et ses boîtes
existantes. La présentation ne déplace pas les collisions et ne donne pas
d'invulnérabilité, de parade automatique ni de bonus global.

Le duel conserve une phase où le joueur peut porter puis réutiliser la lance
jusqu'à la cessation ou l'interruption de Prologue. C'est une convention de jeu,
pas une règle de durée déduite du bref extrait. La fin de la danse visuelle ne
supprime pas implicitement les ressources de cette phase.

La fonction de pose lit les frames restantes de préparation. Une pause, un
hitstop ou un rendu répété du même état ne fait pas progresser cette danse. La
musique corporelle suit aussi les coups et les déplacements une fois les
orifices découverts. Le repos, l'interruption, le hitstop, la pause, le mute et la
fin de manche coupent ces voix avec une courte extinction sans clic. Le Jupiter
existant garde son événement sonore distinct ; la présence de la tenue de
Prologue seule ne déclenche plus une boucle sonore.

## Vérification reproductible

Intégration dans `main` : l'IA utilise sa mémoire d'observation existante
(`observedHabits`), avec le même délai avant le recul. Le correctif de lance
pour les projections cinématiques reste sur la branche de travail : ce système
n'est pas encore présent sur `main`. Le ruleset de replay porte le suffixe
`bonolenov`, car les déplacements d'IA et l'état des bandages sont simulés.

Depuis `apps/web` :

```sh
pnpm test src/lib/fighting/bonolenov.test.ts src/lib/fighting/bonolenovCombat.test.ts
pnpm test src/lib/fighting/audio/bonolenov.test.ts src/lib/fighting/audio/director.test.ts
node scripts/check-bonolenov-combat.mjs
```

Les nouveaux tests vérifient les appuis alternés, la stabilité du compteur de
danse, la fin de la boucle musicale, la main droite et l'orientation de la lance,
les orifices solidaires des bras et la réaction de l'IA sans immunité ajoutée.
Les tests existants conservent les contrôles de ressources, de dégâts, de
préparation interruptible, de copie et de réinitialisation entre manches.

La scène de vérification utilise `buildFightFigure` et `fightBodyMotion`, les
mêmes fonctions que le jeu. Elle échantillonne les neuf normales, les pas, les
pivots, Prologue et sa préparation dans les deux orientations et écrit ses
captures et `report.json` dans `/tmp/clash-bonolenov-combat`.
`BONOLENOV_COMBAT_OUTPUT` change ce dossier ; `BONOLENOV_COMBAT_FILM=1` ajoute une
séquence d'images à 60 frames simulées par seconde pour la revue visuelle.
Le script produit aussi `body-music.wav` avec le synthétiseur de production
dans un `OfflineAudioContext`. Il vérifie les niveaux de la danse, de l'estoc et
du pivot, le silence au repos et l'absence de saturation. Le montage est proposé
à 30 images par seconde, soit au ralenti de moitié, avec le son synchronisé.
