# Hisoka : Bungee Gum et Texture Surprise, type 1

Les effets restent dans la vue de combat. Chaque accent dure 18 images de
simulation (0,3 seconde), sans vue secondaire ni interruption du duel.

- **Bungee Gum** : ondulation élastique à l’attache, mise en tension pendant la
  traction et la propulsion, avec un éclat rose bref sur le fil réel. Le modèle
  existant suit la main avant animée et le torse de la cible. Le fil disparaît
  immédiatement quand le lien n’existe plus.
- **Texture Surprise** : bref passage de trame sur le vêtement après la fin du
  startup ; passage inverse lorsque le déguisement est effectivement exposé.
  La couleur durable du tissu reste pilotée par `textureSurprise` et le modèle
  existant, sans changement des dégâts, des collisions ou de la défense.

`hisokaPresentation.ts` observe des instantanés scalaires : une entrée seule ne
crée pas d’attache, un contact bloqué ou raté n’en produit pas, et une frappe
ordinaire ne rejoue pas l’accent. Le retour dans le temps, le changement de
manche et le remontage de la scène ne rejouent pas les effets déjà présents.
Le temps de rendu ne fait pas avancer les accents ni l’ancre du fil.

`hisokaCameraPresentation.ts` ramène les événements du Gum, du tissu et de leurs
gestes spéciaux au type 1. Les cartes à distance conservent leur présentation.
La cinématique de victoire existante utilise son propre lecteur.

Les éclats suivent la visibilité effective du Gum, y compris In/Gyo et la place
de l’observateur. Les réglages sans éclats suppriment les ornements. En mouvement
réduit, le lien réel reste lisible, sans ondulation décorative ni passage sur le
tissu. Chaque scène libère uniquement ses propres ressources.

Vérifications :

- `hisokaPresentation.test.ts` : vrais gestes du moteur, conditions et 18 images,
  pause, P1/P2, remontage, changement de manche et absence de vue secondaire.
- `hisokaEffects.test.ts` : ancrage sur le rig, ressources, In/Gyo, mouvement réduit
  et disparition du fil.
- `node apps/web/scripts/check-fighting-hisoka.mjs` : captures des quatre gestes,
  vidéo, pause, P2, In/Gyo, largeurs 390/320 px et mouvement réduit.

La vidéo est générée dans `output/clash-hisoka/hisoka.mp4` avec son rapport de
contrôle. `HISOKA_CAPTURE_MODES=texture` permet de reprendre un seul geste.
