# Hisoka : Bungee Gum et Texture Surprise, type 1

## Attaches multiples et objets physiques

`bungeeNetwork.ts` conserve des attaches indépendantes, avec origine anatomique
main droite/gauche ou pied droit/gauche, cible, dissimulation et sélection par
camp. `bungeeCommands.ts` prépare les ancrages au sol, aux supports en hauteur
et aux objets réels présents. La hauteur des pièces vient du blueprint ; à la
Tour Céleste, le support est la poutre d’éclairage. Le pont d’observation ouvert
ne fournit pas de plafond. Aucun mur n’est inventé aux limites du ring.

Le panneau « Bungee Gum » est accessible pendant le combat et dans les techniques
du menu pause. L ajoute un lien sur un vrai contact non gardé ; → + L rappelle
la cible ou l’objet sélectionné ; ← + L propulse le corps vers le support choisi,
y compris verticalement. Le finisher exige une attache active sur l’adversaire
et ne consomme que celle-ci. Les autres liens restent en place.

« Lier la prochaine carte » prépare un vrai lancer U. La carte peut s’arrêter,
être rappelée puis relancée : son identifiant et ses propriétés physiques sont
conservés, sans duplication. Les collisions ordinaires, la garde et l’expiration
du Shu restent actives. Un trajet ne frappe qu’une fois ; une carte immobile ou
tenue ne frappe pas. Détacher le Gum laisse tomber l’objet réel.

Les préparations sont interruptibles et les mouvements suivent les collisions
physiques, sans dégâts automatiques ni invulnérabilité. Un impact interrompt la
traction, un support détruit retire son lien, Zetsu ou la perte du Hatsu retire
les attaches. La suspension en hauteur dépense de l’aura et la gravité reprend
après interruption ou détachement. Les prévisions utilisent le même réseau ;
PvP et spectateurs masquent séparément chaque lien dissimulé et les préparations
privées. Les cartes réelles restent visibles sous In.

La borne de quinze attaches par camp, les portées, les préparations de 18 images,
les coûts de 12 aura par ancrage, 5 par rappel/propulsion, 6 pour préparer une
carte et le maintien à 3 aura/s en hauteur sont des réglages du duel.
Références : chapitres 54–55 (cartes, mouchoir et attaches multiples), 62–63
(rappel de Gon et pierre), 162/165/168 (ballon), 351/353–355 (pied, plafond,
objets et attaches simultanées). Texture Surprise reste un déguisement de surface.

`bungeeNetwork.test.ts` couvre les commandes réelles, la préparation vulnérable,
la montée/chute, le rappel des caisses et cartes, l’identité des objets, les deux
camps, In/Gyo, les spectateurs et le replay déterministe. Le contrôle navigateur
`node apps/web/scripts/check-hisoka-network.mjs` vérifie la scène et les commandes
sur ordinateur et mobile. Le réseau fait partie des snapshots et du protocole
PvP courants ; les archives des versions précédentes restent conservées.

## Accents de présentation

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
