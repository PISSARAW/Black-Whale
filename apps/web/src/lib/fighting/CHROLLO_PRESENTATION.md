# Présentation de Chrollo

Les animations accompagnent les états exécutables du moteur. Elles ne changent
ni les conditions d’acquisition, ni les mains disponibles, ni les dégâts.

| Niveau             | Déclenchement                                                                     | Présentation                                                                                    |
| ------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Type 1, 18 images  | Ouverture/fermeture, page, signet, pose d’une marque                              | Charnières du vrai livre, mouvement du ruban et accents dorés, sans vue secondaire              |
| Type 2, 84 images  | Acquisition réussie                                                               | Livre, nouvelle page et regard ; l’adversaire perd effectivement la technique                   |
| Type 2, 84 images  | Gallery Fake, Order Stamp, Convert Hands, Fun Fun Cloth, Indoor Fish, Black Voice | Apparition de la copie ou des poissons, capture du tissu et cadrage sur la manifestation réelle |
| Type 2, 84 images  | Détonation Sun and Moon non décisive                                              | Explosion localisée sur la cible, sans modifier le combat                                       |
| Type 3, 3 secondes | Détonation Sun and Moon qui remporte la manche                                    | Dernier contact des symboles, explosion, chute et regard de Chrollo                             |

## Déclenchement

`chrolloAnimation.ts` conserve des instantanés scalaires et compte les images de
simulation. Une pause fige les accents ; reconstruire une scène déjà affectée ne
rejoue pas une acquisition. Les changements de manche et retours dans le temps
réinitialisent l’observation.

Une nouvelle entrée de `skillHunterStolen`, attribuée à Chrollo, établit
l’acquisition. Sélectionner une page historique ne suffit pas. Les copies,
ordres, apparences, captures et poissons doivent exister dans l’état courant.
Les ressources manquantes et contacts refusés ne produisent aucune manifestation.

`chrolloEffectScene.ts` anime les charnières et le signet du modèle porté, puis
les objets existants de la préparation et de `retrospectiveScene.ts`. Les
ressources décoratives lui appartiennent ; leur destruction ne libère aucune
géométrie du combattant. Les effets respectent In/Gyo et les réglages de confort.
Les poissons suivent leur compteur de simulation, y compris pendant une pause.

## Sun and Moon fonctionne

La route vérifiée par le moteur est : page Sun and Moon ouverte, frappe Soleil,
Double Face et fermeture du livre, puis seconde technique pour la Lune. La pose
de la seconde marque consomme les deux marques et applique les dégâts existants.

`chrolloDetonation.ts` exige une transition observée : marques consommées, PV
diminués et nouvel impact Sun and Moon attribué, sans garde, esquive ou
invulnérabilité. Le type 3 exige en plus un verdict de victoire par KO. Une
sauvegarde déjà terminée, l’entraînement, un futur simulé et une mort provisoire
pendant Cat’s Name ne suffisent pas.

Le lecteur de victoire utilise la variante `chrollo-sun-moon` uniquement avec
cette preuve. La séquence peut être passée, respecte le chargement et la pause,
et son rendu restaure la scène après chaque image. Les autres victoires gardent
leur présentation existante.

## Vérification

- `chrolloAnimation.test.ts` : vrais gestes du moteur, acquisition conditionnelle,
  Sun/Moon non létal et décisif, pause, durée, passage et verdict de Camilla.
- `chrolloEffects.test.ts` : charnière réelle, reconstruction du rig, confort,
  visibilité et restauration transactionnelle du rendu décisif.
- `node apps/web/scripts/check-fighting-chrollo.mjs` : dix démonstrations du moteur,
  captures et vidéos, place P2, pause, largeurs 390/320 px et mouvement réduit.

Le script écrit `output/clash-chrollo/chrollo.mp4` et son rapport dans le même
dossier. `CHROLLO_CAPTURE_MODES=book,acquisition` permet de reprendre une sélection.
