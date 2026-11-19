# Chrollo — référence Zeno et Silva

[Référence fournie : Zeno et Silva contre Chrollo](https://www.youtube.com/watch?v=YjZqKuGid5Q).
Les échanges observés guident les intentions : observation calme, déplacements
courts pour sortir de l’axe, contres rapprochés, couteau de Ben et main occupée
par le livre. Ce travail ne reproduit pas le combat image par image.

## Déplacements et décisions

`chrolloFootwork.ts` engage des dashes physiques après le délai de lecture
ordinaire : retrait devant une frappe à portée, retour sur une récupération
observée et approche espacée à moyenne distance. Chaque pas conserve ses
collisions et sa durée. Il peut échouer, être interrompu ou être empêché par
le bord de l’arène. Le hitstun, l’immobilisation et la perte de vue empêchent
ces décisions ; aucun input adverse, forecast privé ou bonus d’invulnérabilité
n’est utilisé.

`chrolloAi.ts` alterne main libre, contre, coude, coups de pied et balayage.
Les changements de page ne servent plus à combler une distance vide. Le vol
reste soumis à l’observation, aux réponses réelles de l’adversaire et au contact.
Le chemin Soleil, fermeture du livre et Lune conserve ses conditions existantes.

`chrolloEquipmentAi.ts` prépare le couteau de Ben par la commande matérielle du
joueur, avec les 12 images de récupération existantes. Une arme confisquée ou
lancée n’est pas remplacée. L’IA ne reçoit ni arme supplémentaire ni pouvoir
des Zoldyck. Ses pages et son arsenal historique restent ceux du jeu.

## Corps, livre et couteau

`chrolloPhysicalPoses.ts` distingue les frappes de la main libre, les contres,
le coude et les coups de pied. La main droite ne transforme plus le livre en
massue pendant ces gestes. Une coupe utilise le vrai couteau équipé.
Les noms des coups et leur allocation d’aura suivent le geste : les coups de
pied chargent les pieds, les frappes de main et de coude chargent les mains.

Le livre ouvert occupe la main droite ; le couteau est alors ancré au poignet
gauche. Livre fermé ou Nen indisponible, il utilise la droite libérée.
`chrolloBodyStance.ts` abaisse ce bras avant d’ajouter locomotion et attaques.
La convention anatomique reste correcte lorsque le personnage change de côté.
Le lancer conserve son geste de main et son unique projectile physique.

`chrolloWeapon.ts` limite les contacts de lame aux frappes de main prévues.
Un coude, un talon ou un balayage ne produit plus de blessure au couteau ni
de poison. Les règles existantes d’un impact gardé, de contention précoce et
de paralysie s’appliquent aux vraies coupes.

Le livre initial de Clash et Double Face correspondent au système déjà présent
dans le jeu ; ils ne sont pas présentés comme l’équipement exact de cette scène
de Yorknew. La mobilité, les portées, les coûts et le poison restent des réglages
du duel 2D, pas des mesures tirées de l’anime.

## Vérification

`chrolloCombat.test.ts` couvre les choix de l’IA, la préparation et la perte du
couteau, les deux mains, le livre protégé, coupe contre coup de pied, lecture
et limites des pas, ancrage du vrai objet 3D, combat natif et replay déterministe.
Les suites Chrollo, acquisition, arsenal historique et équipement continuent
de vérifier leurs règles propres.

`node apps/web/scripts/check-chrollo-combat.mjs` capture la scène de production
avec main libre, couteau, coup de pied et livre fermé dans les deux orientations,
puis un combat avec l’IA. Pause, erreurs navigateur et largeurs 390/320 px sont
contrôlées. Captures et rapport : `output/chrollo-combat/`.
