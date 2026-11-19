# Hisoka — distance, contre et objets réels

## Références de combat

Les extraits fournis guident les intentions et les silhouettes, pas une copie
image par image de leurs chorégraphies :

- [Togari](https://www.youtube.com/watch?v=yOrF1nTUsEI) : calme face à une arme,
  interception puis exploitation du projectile adverse.
- [Gotoh](https://www.youtube.com/watch?v=Q9HFkSyhizg) : réception et renvoi
  d’objets physiques, tension du Gum et déplacement par des supports.
- [Kastro](https://www.youtube.com/watch?v=rJNZ9fg4Rb4) : cartes tranchantes,
  préparation discrète et tromperie ; Texture Surprise déguise une surface.
- [Gon](https://www.youtube.com/watch?v=jtoRa7kK33g) : attitude relâchée,
  corps à corps, gestion de la distance et rappel élastique.

## Traduction dans Clash

`hisokaAi.ts` alterne coupes de cartes, coups de pied et balayages. Le contact
du Gum est une option, puis une attache réelle autorise rappel ou propulsion.
Le finisher est privilégié sur un adversaire déjà en hitstun à portée, avec
une attache existante. Texture Surprise ne remplace plus une attaque au hasard.

`hisokaFootwork.ts` utilise les observations ordinaires : délai de réaction,
retrait court devant une menace à portée, retour sur une récupération observée,
approche espacée à moyenne distance. Les pas utilisent le dash physique,
avec trajectoire, durée, collisions et limites du terrain ; aucune esquive
garantie, téléportation ou invulnérabilité n’est accordée. Un corps occupé,
immobilisé ou privé de vue ne bénéficie pas de ce choix. Le joueur conserve
les commandes ordinaires et les mêmes profils de mouvement lorsqu’il joue Hisoka.

À distance, l’IA peut payer la préparation de sa prochaine carte, puis lancer
un vrai projectile. Le même objet peut être rappelé et relancé par le réseau
existant. Le rappel d’une attache corporelle sélectionnée passe avant une
nouvelle préparation de carte. Le seuil de réserve d’aura est abaissé à 40
pour laisser davantage de place aux échanges physiques.
À moins de 14 unités, les décisions de rappel et de relance des cartes laissent
la priorité au corps à corps, afin qu’un objet lié n’occupe pas tous les choix.

Une interception exige un objet frontal réellement perçu et une observation
du projectile correspondant. Sa fenêtre coûte de l’aura et immobilise la
préparation ; la force reçue blesse toujours les mains. Les objets vivants et
les projectiles d’aura ne deviennent pas des cartes renvoyables. Les ancrages
restent limités aux supports réels du niveau.
Cette décision peut remplacer la garde générique lors d’un vrai choix de l’IA,
sans contourner sa cadence, le hitstun, la disponibilité du Hatsu ou ses coûts.

`hisokaLocomotion.ts` conserve les épaules relâchées pendant les pas courts.
`hisokaCardPoses.ts` sépare le lancer physique (armement, détente du coude,
fouetté du poignet, récupération) de la paume d’attache. Ces poses suivent les
phases simulées, dans les deux orientations, et se figent avec le combat.

Les distances, coûts, seuils, délais et le choix de finir sur un hitstun sont
des conventions de jeu 2D. Ils ne prétendent pas mesurer les vitesses ou les
capacités exactes du personnage dans les extraits.

## Vérification

`hisokaCombat.test.ts` couvre les choix physiques, la priorité du Gum,
la préparation payante, la réaction et ses limites, les interceptions,
le lancer animé, une simulation complète avec l’IA et le replay déterministe.
Les suites existantes Hisoka, réseau Gum, arsenal et défense des projectiles
couvrent les contacts, les interruptions, les objets et leurs dégâts réels.

`node apps/web/scripts/check-hisoka-combat.mjs` capture la scène de production :
lancer et échange dans les deux orientations, combat IA, pause, absence
d’erreurs navigateur et affichage à 390/320 px. Les captures et le rapport
sont écrits dans `output/hisoka-combat/`.
