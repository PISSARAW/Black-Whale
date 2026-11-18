# Gel, Padaille et Leorio : type 1

La vue de combat reste continue pendant les transformations, la transmission et
leurs impacts. Les accents de transformation durent 18 images de simulation
(0,3 seconde). Aucun changement de coût, de dégât, de portée ou de collision.

- Gel : transformation progressive du bras droit, accent au poignet, extension
  pendant la frappe puis rétraction. Le serpent suit la main réellement posée,
  remplace sa représentation et disparaît si la technique est interrompue.
- Padaille : croissance brève du marteau, du foret ou de la hache effectivement
  choisi, sur la main droite anatomique en P1 et P2. Le retour à la main normale
  suit la commande de restitution. Une perte du Nen supprime l’outil sans rejouer
  une transformation volontaire.
- Leorio : anneau d’entrée au contact du sol, impulsion sur la transmission
  existante et ouverture progressive au point d’émergence fixé par le moteur.
  Le poing conserve son délai, sa fenêtre de frappe unique et sa rétraction ;
  la trace ne devient jamais une attaque souterraine.

Les bras et outils physiques restent visibles sous In. L’émission de Leorio
respecte la dissimulation propre au projectile, le camp du spectateur et son Gyo.
Les vues P1/P2 transmettent ce spectateur au rendu des projectiles.

Les accents, l’extension, le foret et la transmission utilisent le temps de
simulation. Une pause les fige. Le mouvement réduit retire les anneaux décoratifs
et la rotation du foret, sans masquer les outils ni le poing utiles au combat.
Une reconstruction ne rejoue pas une sélection passée.

`bodyHatsuPresentation.ts` observe le bras actif et l’outil réellement sélectionné.
`bodyHatsuScene.ts` anime ces changements sur le modèle existant et ne libère que
ses propres ressources. `remotePunchScene.ts` utilise l’âge du véritable
projectile pour les étapes de transmission et d’émergence.

Vérifications : `bodyHatsuPresentation.test.ts`, les tests métier des trois
personnages et `remainingVisitHatsu.test.ts`. Le script
`node apps/web/scripts/check-fighting-body-hatsu.mjs` capture six séquences,
vérifie l’absence de vue secondaire, P2, In/Gyo, la pause, le mouvement réduit et
les largeurs 390/320 px. La vidéo et le rapport sont générés dans
`output/clash-body-hatsu/`. `BODY_HATSU_CAPTURE_MODES=drill,leorio` reprend seulement
ces séquences ; une valeur vide relance uniquement les contrôles complémentaires.
