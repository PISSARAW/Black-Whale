# Luini et Voconte : passages, type 1

Les accents durent 18 images de simulation (0,3 seconde) dans la vue de combat.
Ils soulignent les changements confirmés du moteur, sans modifier les positions,
les coûts, les collisions, les dégâts ou la vulnérabilité des combattants.

- Luini : contour de la pièce effectivement ancrée ; ouverture puis repli de
  brefs contours aux points réels de départ et de retour. L’ouverture physique
  de la porte condamne définitivement l’ancrage, comme dans le moteur.
- Voconte : accents simultanés aux deux seuils lors de leur liaison effective,
  puis aux seuils d’entrée et de sortie d’un franchissement réel. Le contour
  se replie lorsque la fermeture est confirmée. Les cadres en bois restent
  présents ; la lumière indique l’état réel d’une liaison visible.

`passagePresentation.ts` observe l’ancrage, la récupération de préparation,
les positions avant/après l’activation de Luini, les réseaux et les enregistrements
`lastTransit` de Voconte. Un déplacement ordinaire, un franchissement en sens
inverse, un refus ou une préparation interrompue ne déclenchent aucun passage.
Les deux combattants peuvent emprunter les seuils de Voconte. Fermer un réseau
laisse fonctionner l’autre réseau lorsqu’il est encore actif.

Les lieux de Luini reçoivent un accent de passage seulement après un déplacement
réel. Les trajets accomplis terminent leur bref accent même si Stealth Dolphin
rend la capacité au retour. Une reconstruction, un retour en arrière ou un
changement de manche ne rejoue pas les événements déjà observés.

Les contours et la lumière de Nen suivent In, le Gyo et le camp du spectateur.
Les corps et les cadres physiques restent visibles. La pause fige les accents ;
les réglages sans éclats et de mouvement réduit retirent les ornements. Le rendu
utilise ses propres géométries et matériaux, libérés à la fermeture de la scène.

Vérifications : `passagePresentation.test.ts`, `luini.test.ts`, `voconte.test.ts`,
`remainingVisitHatsu.test.ts` et les tests de caméra. Le script
`node apps/web/scripts/check-fighting-passages.mjs` filme huit scénarios, puis
vérifie le passage en P2, In/Gyo, les cadres physiques, la pause, le mouvement
réduit et les largeurs 390/320 px. Vidéo et rapport : `output/clash-passages/`.
`PASSAGE_CAPTURE_MODES=transit,close` reprend ces séquences ; une valeur vide
relance les contrôles complémentaires.
