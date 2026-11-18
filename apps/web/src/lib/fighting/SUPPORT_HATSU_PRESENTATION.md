# Bill, Cluck et Biscuit avec Cookie : soutien en type 1

Les effets de soutien restent dans la vue de combat. Les accents durent 18 images
de simulation (0,3 seconde), après confirmation du moteur.

- Bill : la plante réellement germée se déploie depuis la terre du pot ; un accent
  vert accompagne la croissance. Sans graine vivante à portée, aucun effet.
- Cluck : accent sur le pigeon réellement contrôlé, deux ailes indépendantes
  pendant la mission, puis accent de livraison au point effectivement atteint.
  Relâcher le contrôle ne produit aucune livraison. Le corps de l’oiseau reste
  physique ; son filament de Nen suit la main du contrôleur et le Gyo du point
  de vue sélectionné.
- Biscuit avec Cookie : apparition brève de la masseuse existante, bras et mains
  articulés vers le torse du destinataire. Le massage utilise un rythme lent,
  Piano Massage un geste alterné avec inclinaison du buste vers le corps endormi.
  Le soulagement est accentué seulement quand la séance restitue réellement de
  l’aura ; la fin du repos exige le seuil réel de trente minutes simulées.

`supportHatsuPresentation.ts` observe les faits acquis sans modifier le combat.
`supportHatsuScene.ts` anime la plante et les accents ; `cookieTreatmentScene.ts`
possède le modèle de Cookie et conserve ses supports anatomiques de la visite.
Les coûts, ressources, consentements, blessures, dégâts et temps de récupération
restent ceux du moteur. La forme véritable de Biscuit conserve sa présentation
distincte. Erigeron exécuté avec une identité empruntée est reconnu après le
retour au corps de Kurapika.

Les mouvements utilisent les images de simulation ou l’âge réel de la séance.
Une pause ne fait avancer ni les ailes ni les mains. Une reconstruction, un
changement de manche ou un retour en arrière ne rejoue pas les accents passés.
Une interruption masque Cookie et supprime les accents de traitement en cours.
In et le Gyo du spectateur filtrent Cookie ; le mouvement réduit conserve les
supports utiles dans une pose fixe et retire les ornements.

Vérifications : `supportHatsuPresentation.test.ts`, les tests de préparation,
Cookie, Bill, Cluck, des modèles et de la caméra. La fixture interactive est
`ui-tests/fighting-support/`. `node apps/web/scripts/check-fighting-support.mjs`
filme huit scénarios et vérifie P2, Gyo, interruption, pause, mouvement réduit
et les largeurs 390/320 px. Sorties : `output/clash-support/`, dont `support.mp4`
et `report.json`. `SUPPORT_CAPTURE_MODES=piano,massage` reprend deux captures ;
une valeur vide exécute seulement les contrôles complémentaires.
