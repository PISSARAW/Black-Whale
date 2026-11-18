# Benjamin : Air Blow et Culdcept, type 1

Ces trois accents durent 18 images de simulation (0,3 seconde) dans la vue
principale, sans interruption du duel ni vue secondaire.

| Geste                    | Déclenchement réel                                               | Accent                                                                                                 |
| ------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Air Blow                 | Entrée dans la phase active de l’attaque héritée                 | Trois arcs de pression brefs depuis la paume gauche anatomique, dans les deux orientations             |
| Capture par Culdcept     | Une carte apparaît après une interception acceptée par le moteur | Le rectangle rejoint la carte dans la main droite, avec réduction du cadre et retournement de la carte |
| Restitution par Culdcept | La carte est consommée et son projectile est émis                | La carte jouée pivote et s’efface ; le projectile réel poursuit sa trajectoire                         |

`benjaminPresentation.ts` observe des instantanés scalaires. Préparer le rectangle
ne constitue pas une capture. La disparition d’une carte seule ne prouve pas sa
restitution : l’attaque de restitution doit avoir émis son projectile et le
compteur d’émission doit avoir avancé. Une interruption conserve la carte selon
les règles existantes. Une nouvelle scène ne rejoue pas les effets déjà présents.

`benjaminAccentScene.ts` suit les mains du rig courant. Les arcs ne créent aucun
projectile et n’étendent pas la portée d’Air Blow. Le rectangle et la carte restent
les objets de `benjaminEffectScene.ts`, sans modification des dégâts, de
l’héritage, des coûts, de la fenêtre de capture ou du projectile capturé.

Les effets respectent In/Gyo et la place de l’observateur. Les réglages de confort
suppriment les ornements ; en mouvement réduit, les transformations transitoires
sont retirées, et la carte effectivement détenue reste lisible. Les ressources
du combattant ne sont pas libérées avec les accents.

`benjaminCameraPresentation.ts` réserve le type 1 à Air Blow et à Culdcept. Secret
Window, Benjamin Baton, l’arme physique et la cinématique de victoire gardent leurs
présentations existantes.

Vérifications :

- `benjaminPresentation.test.ts` : gestes du moteur, captures par collision,
  restitution unique, P1/P2, 18 images, pause, interruption, remise à zéro et
  absence de capture des balles physiques ou de la flèche de Halkenburg.
- `benjaminEffects.test.ts` : main gauche, cadre et carte, In/Gyo, confort,
  disparition de la carte jouée et propriété des ressources.
- `node apps/web/scripts/check-fighting-benjamin.mjs` : captures et vidéo des trois
  gestes, pause, P2, In/Gyo, mobile 390/320 px et mouvement réduit.

La démonstration utilise un projectile de Nen entrant préparé, puis la véritable
collision et la restitution du moteur. Elle écrit
`output/clash-benjamin/benjamin.mp4` et son rapport de contrôle.
