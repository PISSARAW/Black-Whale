# Armes de service des gardes du corps

**U** utilise le pistolet des gardes du corps jouables : Kurapika, Bill, Furykov,
Rihan, Musse, Theta, Longhi, Sayird, Basho, Melody, Hanzo et Biscuit. Les chaînes
de Kurapika restent sur les commandes de Hatsu ; **avant + L** dirige toujours
Dowsing Chain et conserve son interception des balles.

Les balles sont des objets physiques, sans coût d’aura, émission, renforcement
par Shu, dissimulation par In, ni bonus d’Emperor Time. Le pistolet reste utilisable
en Zetsu, sans réserve d’aura ou après un vol de Hatsu. Il ne contourne ni une
immobilisation, ni le hitstun, ni la récupération du tir précédent. Le double de
Hanzo ne reçoit pas l’équipement de son corps.

La garde, la parade, le saut et les couverts gardent leurs règles de collision.
Blinky peut aspirer une balle matérielle lorsque son embout est réellement aligné.
Le Hatsu et le pistolet sont indépendants : voler une capacité ne vole pas l’arme.

## Manga et adaptations

Kurapika, Bill, Furykov, Theta et Musse portent explicitement une arme à feu dans
l’arc de succession : voir notamment les chapitres 361, 363, 370, 373 et 385–387.
Les inventaires de [Kurapika](https://hunterxhunter.fandom.com/wiki/Kurapika#Equipment),
[Bill](https://hunterxhunter.fandom.com/wiki/Bill#Equipment) et
[Furykov](https://hunterxhunter.fandom.com/wiki/Furykov#Equipment) distinguent ces
armes de leurs capacités de Nen.

Le même pistolet de service est fourni aux autres gardes du roster comme équipement
du duel. Cela ne prétend pas qu’un modèle, un calibre ou un tir particulier ait
été montré pour chacun. Vitesse, dégâts, portée et cadence sont des réglages de
jeu. Les profils déjà spécifiques de Theta et Musse sont conservés.

Kurapika tient son pistolet à gauche, laissant les chaînes à droite. Les autres
pistolets de service sont dessinés à droite et rangés entre les tirs. L’animation
distingue sortie de l’arme, visée, bref éclat au départ du coup et retour au holster.
La hauteur de départ suit Melody et les deux formes de Biscuit ; les gros plans
nomment le pistolet, sans le confondre avec leur Hatsu.

## Code et vérification

`bodyguardFirearms.ts` déclare l’équipement et la balistique commune.
`projectiles.ts`, `nenProjectiles.ts`, `nenActionRules.ts`, `fightAttackCost.ts` et
`fightAttackIntent.ts` distinguent les balles réelles des techniques de Nen.
`serviceHandgun.ts` et `bodyguardFigure.ts` ajoutent l’arme physique ; `mussePoses.ts`
fournit la visée et le recul sans remplacer les gestes des Hatsu.

`bodyguardFirearms.test.ts` couvre les deux camps, le tir sans Nen, la charge,
les restrictions corporelles et l’équipement visible. `scripts/check-bodyguard-firearms.mjs`
vérifie la scène et les libellés à 1280 et 390 px.

Le ruleset devient `clash-combat-22` : les anciens enregistrements sont refusés
par le lecteur courant et restent archivés. La référence `reference/v22` rejoue
les commandes historiques sous les règles actuelles sans modifier les archives
précédentes.
