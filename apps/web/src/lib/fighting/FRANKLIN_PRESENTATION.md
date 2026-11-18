# Franklin : départ et déroulement des rafales, type 1

Le premier tir reçoit un accent de 18 images de simulation (0,3 seconde), puis de
brefs accents suivent les émissions successives aux dix doigts. La vue de combat
reste continue, sans vue secondaire au lancement ou aux impacts des projectiles.

`franklinPresentation.ts` observe le compteur réel `attack.projectilesSpawned`.
Une entrée, la phase active seule ou la survie d’une balle ne créent aucun tir
décoratif. Les tirs observés déclenchent des accents de quatre images, avec les
mêmes mains alternées et le même index de doigt que le modèle natif. Les cônes
lumineux des doigts suivent les émissions des deux dernières images.

Les balles de Nen de Franklin ont un rendu plus fin, aligné sur leur trajectoire,
avec leur propre entrée dans le cache de géométries des projectiles.

`franklinAccentScene.ts` place les accents sur les articulations actuelles des
mains et les vrais nœuds de sortie des doigts. Il conserve un cache lié au rig,
renouvelé lors d’une reconstruction, sans parcourir toute la figure à chaque
image. Les capuchons et leurs chaînettes gardent leur animation existante.

Les variantes courte, neutre, ciblée, basse, double et prolongée conservent leurs
coûts, amorces, cadences et nombres de projectiles. Aucun impact, projectile,
dégât, recul ou bonus de défense n’est ajouté par la présentation.

Une interruption ou la perte du Nen coupe les accents et les futurs éclats ;
les balles déjà émises continuent selon le moteur. Une pause fige les accents.
Reconstruire une scène pendant une rafale ne rejoue pas son départ : seuls les
tirs suivants créent de nouveaux accents.

La visibilité suit la dissimulation réelle de l’attaque et le Gyo de
l’observateur, pour P1 et P2. Le réglage sans éclats et le mouvement réduit
suppriment les ornements ainsi que les anciens cônes lumineux des doigts. Les
projectiles de jeu restent lisibles selon les règles de perception existantes.
La cinématique de victoire conserve son propre lecteur.

Vérifications :

- `franklinPresentation.test.ts` : six variantes en P1/P2, vrais tirs, départ de
  18 images, alternance, pause, interruption, Nen, reconstruction et remise à zéro.
- `franklinEffects.test.ts` : doigt réellement émetteur, In/Gyo, mouvement réduit,
  anciens éclats, reconstruction du rig et propriété des ressources.
- `node apps/web/scripts/check-fighting-franklin.mjs` : quatre captures filmées,
  dix doigts, compteur des émissions, absence de vue secondaire, pause,
  interruption, P2, In/Gyo et largeurs 390/320 px.

La vidéo et son rapport sont générés dans `output/clash-franklin/`.
`FRANKLIN_CAPTURE_MODES=prolonged` reprend une seule séquence.
