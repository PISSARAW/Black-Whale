# Cinématiques de victoire de Clash

Les onze scènes (Hisoka, Chrollo, Kurapika, Feitan, Phinks, Franklin, Benjamin,
Tserriednich, Leorio, Halkenburg et Camilla) se jouent
pendant dix secondes après le verdict. Le gagnant, le vaincu et le lieu viennent
du combat courant, pour les deux côtés du duel. Les scènes ne modifient jamais
les PV, l'aura, les conditions des Hatsu ou le résultat synchronisé.

`playback.ts` gère le déclenchement, la pause, la fin et le passage de la scène.
`renderer.ts` travaille sur les modèles de la scène actuelle et restaure toutes
les transformations après chaque rendu. Chaque personnage possède sa propre
chorégraphie ; le cadrage et les accessoires utilisent les dimensions réelles
des deux modèles. Les effets sont libérés avec le canvas.

Le HUD et le panneau de résultats attendent la fin ou le passage de la scène.
Les replays, égalités et prévisions ne déclenchent pas une nouvelle victoire.
Les réglages de confort et de son s'appliquent également à ces séquences.

Le film d'Hisoka garde son verdict « VICTOIRE » ; les dix autres affichent
« FATALITY ». Uvogin ne fait pas partie de ce catalogue.
L'animation se joue localement, y compris en PvP : aucun événement réseau ni
dommage supplémentaire n'est envoyé. Chain Jail reste ici une pose après verdict,
sans contourner ses conditions dans la simulation du combat.

Le temps attend le premier rendu, s'arrête pendant une pause ou quand l'onglet
est masqué et reprend ensuite. Le son suit la même horloge. Échap, Entrée,
Espace, A à la manette ou le bouton « Passer » ouvrent les résultats immédiatement.
Si le canvas ou une ressource échoue, les résultats restent accessibles.

`playback.test.ts` couvre le catalogue croisé avec tout le roster et les arènes,
le chronométrage, les pauses, le passage et les rematches. `renderer.test.ts`
vérifie les modèles natifs des deux côtés, l'absence de mutation du combat,
la restauration des poses et matériaux et le repli après une erreur.
`node apps/web/scripts/check-fighting-victory.mjs` contrôle les onze séquences,
plusieurs lieux, les tailles extrêmes, un miroir et le mobile dans un vrai canvas.
Il vérifie aussi le déclenchement automatique et le chargement du son de chaque
personnage enregistré ; une entrée absente du contrôle fait échouer le script.
Les bandes sonores proviennent des onze démos et se trouvent dans
`apps/web/static/clash-victories/`.

Benjamin : « Le dernier ordre » utilise la paume gauche d'Air Blow, un écho de
soldat rappelant Benjamin Baton, une projection et dispersion stylisée de la cible,
puis un salut de la main droite. L'écho rappelle un héritage acquis avant le duel ;
aucun Hatsu n'est pris au vaincu. La dispersion est une exagération cinématique,
sans nouvelle règle attribuée au manga, dont le mécanisme complet d'Air Blow reste
inconnu. La démo et le jeu utilisent exactement le même renderer de victoire.
`render-benjamin-fatality.mjs` vérifie d'abord un K.-O. natif par Air Blow et exporte
600 images ; `compose-benjamin-fatality.mjs` ajoute le mix et fournit le son du jeu.

Tserriednich : « Tu arrives trop tard » reprend les planches de référence :
activation de Laplace, contact à la nuque, agenouillement, capuche retirée,
prise du poignet armé, tir dévié puis déplacement et contre final.
La démo se déroule contre Hisoka dans le casino VIP. La vision possède un
traitement désaturé avec hachures et vignette ; après réouverture des yeux,
les deux Tserriednich sont des corps complets et opaques aux couleurs natives.
Le corps de la vision poursuit sa pose tandis que le vrai se déplace.
Les copies temporelles partagent les géométries natives, possèdent leurs propres
matériaux et ne libèrent jamais les ressources des vrais modèles. Les bras
suivent une cinématique inverse à deux segments avec coudes abaissés et
relâchement progressif après le tir. L'apparence temporaire est restaurée.

La démo simule d'abord réellement 600 frames de futur, vérifie que leur lecture
suspend le temps réel, puis rouvre les yeux et déplace le corps avant un K.-O.
par projectile réel. La cinématique reconstruit ensuite ces deux perceptions en
dix secondes : elle n'ajoute ni dégâts de prévision, ni esquive automatique,
ni contrôle de bête gardienne. `tserriednichFilm.test.ts` vérifie cette continuité.
`check-tserriednich-fatality.mjs` contrôle P2, petites/grandes cibles, miroir,
mouvements réduits, mobile et déclenchement dans FightStage.

Chrollo : « Le festin du Soleil et de la Lune » remplace l'ancienne fermeture
du livre seule. Deux modèles squelettiques Indoor Fish du Nendex sortent du
livre ; les marques Soleil et Lune sont fixées à leurs crânes. Quatre passages
de morsure retirent progressivement des volumes du vaincu. Les poissons se
croisent et les marques se touchent à l'image 390, exactement à la fermeture
du livre et au début de l'explosion. Le verdict apparaît à huit secondes.

La combinaison des deux pouvoirs sur les poissons est une mise en scène demandée
pour Clash ; aucune nouvelle règle de marquage, pièce préparée ou attaque n'est
ajoutée à la simulation. La démo obtient d'abord un K.-O. Sun and Moon natif.
`chrolloFishFilm.test.ts` vérifie ce verdict, et `renderer.test.ts` vérifie le
contact exact des marques, la fermeture du livre et la restauration des modèles.
`check-chrollo-fish-fatality.mjs` contrôle les tailles, les deux côtés, le mobile,
le miroir et le déclenchement dans le jeu. Les anciens exports sont conservés.

Leorio : « L’étage supérieur » enchaîne six poings surgissant de la surface
puis un septième, plus ample, à l'image 348. La cible monte jusqu'à la section
de plafond à l'image 420, avec fissures et chute de débris. Le torse de Leorio
pivote à la taille pendant ses frappes au sol ; le dernier plan le montre
remettant ses lunettes. Le cadrage suit toute la montée, avec un plan fixe
contenant la hauteur complète lorsque les mouvements de caméra sont réduits.

La section supérieure est une extension temporaire du décor, adaptée au gabarit
des acteurs et à la palette du lieu. La projection, la répétition rapide et les
dégâts du plafond sont cosmétiques après verdict. Le film résout d'abord un
K.-O. réel avec Poing à distance ; il ne rajoute aucun dégât à la simulation.
`leorioFilm.test.ts` vérifie le projectile natif, et `renderer.test.ts` contrôle
le contact au sol, l'arrivée au plafond et la restauration des poses.

Halkenburg : « Une seule volonté » rassemble trois compagnons déjà consentants
derrière l'archer. Leur aura converge vers l'arc ; la main gauche tient la
poignée et la droite tire la corde. Grimmel part à l'image 300 et sa pointe
atteint exactement le point visé à l'image 324. La conscience déplacée est
représentée par une silhouette d'aura ; le corps reste intact, s'agenouille
puis rouvre les yeux sous une autre volonté. Le dernier plan revient sur
Halkenburg. Le titre Fatality est ici l'habillage du verdict arcade.

Le film prépare explicitement trois porteurs de plume consentants avant son
premier état enregistré, attend la charge native et vérifie la possession
réelle après le tir. La cinématique n'ajoute ni compagnon au combat courant,
ni pouvoir, ni dégâts. Les figures de soutien réutilisent les géométries humaines
partagées sans les détruire ; la silhouette de conscience ne possède que son
matériau. `halkenburgFilm.test.ts` vérifie les préconditions et le verdict natifs ;
`renderer.test.ts` vérifie les mains, le contact et la restauration des modèles.

Camilla : « Le Souffle » adapte la référence existante : le chat saisit le
torse réel entre ses deux pattes, écrase la cible puis ramène son énergie vers
Camilla allongée. Les pattes et les bras suivent les dimensions du vaincu ; le
lieu reste celui du match. Les 90 dernières images conservent exactement le
même corps et la même caméra : seuls les yeux s'ouvrent à l'image 554, puis
une unique inspiration commence à l'image 558. Le portrait masque le décor
et le titre central ; aucun nouvel accent sonore n'interrompt cette fin.

La scène accompagne toute victoire de Camilla, même sans mort préalable.
Cette reconstruction après verdict ne déclenche pas Cat's Name en simulation
et ne restaure pas de PV. Le film de validation conserve, lui, une véritable
séquence native de mort, consommation et résurrection avant le verdict.
`camillaFilm.test.ts` contrôle cette continuité ; `renderer.test.ts` vérifie
la prise, le portrait fixe et la restauration des modèles. Le contrôle navigateur
`check-camilla-fatality.mjs` couvre grandes et petites cibles, miroir, P2,
plusieurs lieux, confort réduit, mobile et déclenchement réel dans FightStage.
