# Melody, Basho et Rihan : interprétation, écriture, observation en type 1

Ces phases restent dans la vue de combat. Leurs accents transitoires durent
18 images de simulation (0,3 seconde), sans plan secondaire.

- Melody : préparation du souffle, puis pulsations discrètes autour de la flûte
  pendant l’interprétation effectivement commencée. Le mouvement de l’instrument
  suit `playingFrames`. Aucun son ni apaisement n’est créé par le rendu. La perte
  de la flûte, la garde, le mouvement et les autres interruptions gardent les
  effets du moteur. Un utilisateur empruntant la capacité doit disposer du vrai
  instrument ; son modèle est placé à hauteur de la bouche.
- Basho : le texte accepté apparaît progressivement selon `writingFrames`. Le
  crayon suit le tracé, et les deux articulations du bras droit rejoignent sa
  prise sans allonger les os. La feuille reste stable entre deux pas de
  simulation. Le poème complet et son accent de confirmation n’arrivent qu’à
  l’état `ready`. Une interruption retire la feuille inachevée.
- Rihan : repère discret près du regard, uniquement dans le point de vue de
  l’observateur. L’analyse et sa disponibilité suivent les faits acquis du moteur.
  La taille du repère cesse de progresser quand l’observation n’avance plus.
  Une manifestation absente ou invisible ne devient pas une analyse par le rendu.

`performancePresentation.ts` observe les étapes réelles. Son instantané de Rihan
ne conserve ni identifiant de proie, ni liste de pouvoirs connus, ni signature.
Un changement de spectateur efface les accents passés et masque l’observation
adverse. Le filtrage privé de la caméra précède `performanceCamera.ts`.
L’écoute cardiaque de Melody conserve également son filtrage privé et un accent
de type 1. La chasse, la dévoration et le sceau de Predator, ainsi que le feu
manifesté de Basho, conservent leurs présentations distinctes.

`performanceHatsuScene.ts` réutilise la flûte, le papier et le regard du modèle
actuellement posé. Les ancrages suivent une reconstruction du personnage.
`bashoWritingPresentation.ts` et `bashoWritingPose.ts` assurent l’encre et le geste.
Aucun changement des coûts, dégâts, conditions d’écriture, portée sonore ou
durée d’analyse. Le mouvement réduit fixe le crayon et la flûte et retire les
ornements, en conservant le papier et l’instrument physiques.

Vérifications : `performancePresentation.test.ts`, les tests métier des trois
personnages, de l’audition, des interactions de Predator et de la caméra. La
fixture interactive est `ui-tests/fighting-creative-hatsu/`.
`node apps/web/scripts/check-fighting-creative-hatsu.mjs` filme huit scénarios,
puis vérifie P2, le changement de point de vue, les interruptions, la pause,
le mouvement réduit et les largeurs 390/320 px. La proie de démonstration est une
manifestation réelle de Bungee Gum exécutée par Hisoka avant l’observation.
Sorties : `output/clash-creative-hatsu/`, dont `performance.mp4` et `report.json`.
`CREATIVE_HATSU_CAPTURE_MODES=writing,observation` reprend ces captures ; une
valeur vide exécute seulement les contrôles complémentaires.
