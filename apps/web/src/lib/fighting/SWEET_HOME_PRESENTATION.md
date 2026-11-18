# Terebellum : absorption et transfert de blessure en type 1

Sweet Home reçoit un accent de 18 images de simulation (0,3 seconde) après
confirmation de `impact.transfer` ou `impact.objectTransfer`. Le rendu ne stocke
aucune blessure dans le combattant et ne retarde pas l’application des dégâts.

- Blessure de Terebellum : accent au corps, passage par la seule main gauche,
  puis sortie vers le destinataire effectivement touché.
- Blessure d’autrui : absorption par la main droite, passage vers la gauche,
  puis vers le corps ou le réceptacle réellement désigné par le moteur.
- Absorption sans réceptacle : le flux se termine dans la main gauche, avec
  une couleur de contrecoup distincte. Aucun faux transfert vers l’adversaire.
- Objet réel : la sortie suit la caisse effectivement endommagée, même après sa
  rupture. Les dégâts proviennent de `objectTransfer.damage`, car les dégâts
  corporels de l’impact sont alors nuls.

`sweetHomePresentation.ts` lit les transferts confirmés, une fois par séquence
d’impact. Une posture seule, un contact manqué ou un réceptacle détruit ne produit
aucun flux. Une reconstruction, un retour en arrière ou un changement de manche
ne rejoue pas un ancien transfert. Les blessures déjà présentes restent celles
du moteur ; le rendu ne présente pas leur transfert comme un soin.

`sweetHomeAnchors.ts` lit les mains anatomiques du modèle posé, sans les échanger
avec l’orientation du combattant. Les points restent stables pendant une pause et
suivent une reconstruction du modèle. `sweetHomeAccentScene.ts` anime le flux et
les accents ; il ne modifie ni les os, ni les corps, ni les objets. In et le Gyo
du point de vue sélectionné filtrent les ornements, sans masquer les conséquences
physiques. Le mouvement réduit et le réglage sans éclats retirent ces ornements.

`sweetHomeCamera.ts` conserve ces phases dans la vue de combat, après le filtrage
privé existant. Les coûts, les dégâts, les scores et les restrictions des mains
restent ceux du moteur.

Vérifications : `sweetHomePresentation.test.ts`, `terebellum.test.ts`, les tests
de préparation et de caméra. La fixture `ui-tests/fighting-sweet-home/` utilise
des instantanés de contact contrôlés : des commandes natives sont positionnées
à leurs vraies frames actives, puis `resolveFightImpacts` calcule la blessure et
son transfert. Aucun résultat de blessure ou de transfert n’est fabriqué.
`node apps/web/scripts/check-fighting-sweet-home.mjs` filme huit scénarios et
vérifie P2, In/Gyo, la pause active, le mouvement réduit et les largeurs 390/320 px.
Sorties : `output/clash-sweet-home/`, dont `sweet-home.mp4` et `report.json`.
`SWEET_HOME_CAPTURE_MODES=absorb,backlash` reprend ces captures ; une valeur vide
exécute seulement les contrôles complémentaires.
