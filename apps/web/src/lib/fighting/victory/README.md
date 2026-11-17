# Cinématiques de victoire de Clash

Les cinématiques enregistrées dans `catalogue.ts` se jouent pendant dix secondes
après le verdict. Le gagnant, le vaincu et le lieu viennent du combat courant,
pour les deux côtés du duel. Les scènes ne modifient jamais les PV, l’aura,
les conditions des Hatsu ou le résultat synchronisé.

`playback.ts` gère le déclenchement, la pause, la fin et le passage de la scène.
`renderer.ts` travaille sur les modèles de la scène actuelle et restaure toutes
les transformations après chaque rendu. Chaque personnage possède sa propre
chorégraphie ; le cadrage et les accessoires utilisent les dimensions réelles
des deux modèles. Les effets sont libérés avec le canvas.

Le HUD et le panneau de résultats attendent la fin ou le passage de la scène.
Les replays, égalités et prévisions ne déclenchent pas une nouvelle victoire.
Les réglages de confort et de son s'appliquent également à ces séquences.

Hisoka affiche « VICTOIRE », Melody affiche « FRIENDSHIP » et les autres
affichent « FATALITY ». Uvogin ne fait pas partie de ce catalogue.
L'animation se joue localement, y compris en PvP : aucun événement réseau ni
dommage supplémentaire n'est envoyé. Chain Jail reste une pose après verdict réservée aux membres réels de la Brigade.
Les autres adversaires déclenchent la variante Judgment Chain. Les morts de Furykov et Longhi face aux princes sont décrites dans [BEYOND_CURSE.md](./BEYOND_CURSE.md) et leurs victoires personnelles dans [PERSONAL_GUARDS.md](./PERSONAL_GUARDS.md).

Le temps attend le premier rendu, s'arrête pendant une pause ou quand l'onglet
est masqué et reprend ensuite. Le son suit la même horloge. Échap, Entrée,
Espace, A à la manette ou le bouton « Passer » ouvrent les résultats immédiatement.
Si le canvas ou une ressource échoue, les résultats restent accessibles.

`playback.test.ts` couvre le catalogue croisé avec tout le roster et les arènes,
le chronométrage, les pauses, le passage et les rematches. `renderer.test.ts`
vérifie les modèles natifs des deux côtés, l'absence de mutation du combat,
la restauration des poses et matériaux et le repli après une erreur.
`node apps/web/scripts/check-fighting-victory.mjs` contrôle tout le catalogue,
plusieurs lieux, les tailles extrêmes, un miroir et le mobile dans un vrai canvas.
Il vérifie aussi le déclenchement automatique et le chargement du son de chaque
personnage enregistré ; une entrée absente du contrôle fait échouer le script.
Les bandes sonores proviennent des démos et se trouvent dans
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

Kalluto : « La dernière danse du papier » commence par un fragment discret fixé
sur le haut du torse. La cible rit, puis 8 192 feuilles se déploient derrière
Kalluto et 4 096 autres forment les courants de coupe autour de la marque.
Les bandes du corps disparaissent progressivement, accompagnées de lambeaux
aux couleurs natives. Kalluto referme son éventail tandis que les papiers tombent.
La quantité de papier et la finition sont une amplification visuelle après
verdict, sans explosion ni nouvelle règle d'exécution dans le moteur.

Le film vérifie d'abord une véritable pose de papier sous In, un fragment
physiquement planté et un K.-O. obtenu par le flux guidé. Le marqueur de la
cinématique suit le corps réel, les bras gardent leurs articulations natives
et tous les matériaux sont restaurés après chaque rendu. Le rire, les feuilles
et les coupes utilisent la même horloge que les dix secondes de présentation.
`kallutoFilm.test.ts`, `renderer.test.ts` et `check-kalluto-fatality.mjs` couvrent
ces étapes, P2, miroir, tailles extrêmes, lieux et mobile.

Machi : « Le dernier point » exploite le pistage, la toile, le contrôle du
pantin, la ligature du cou, la découpe et la suture. Le fil initial et les
cinq commandes partent des positions des vrais doigts. Machi se rapproche
avant la découpe : les longues lignes de capture laissent place au travail
à courte distance. Quatre sections du modèle se séparent à l'image 282 ;
les sutures progressent à partir de 306 et les raccords se referment à 378.
Un dernier point tiré à 420 libère les sections, qui retombent au sol.

Les copies conservent les géométries natives et possèdent uniquement leurs
matériaux de sectionnement ; leur destruction ne libère jamais les ressources
des combattants. La couture de la cible est un tableau après verdict, sans
soin, résurrection ou contrôle supplémentaire dans la simulation. Le film
valide au préalable une vraie marque de pistage, une ligature maintenue et
un K.-O. par Fil tendu. Les tests contrôlent la continuité, les raccords,
les doigts, la restauration et la propriété des ressources.

Shizuku : « Rien à signaler » montre Deme-chan comme une massue, puis une
aspiration de sang stylisée par une ouverture. Le corps garde toute son échelle
jusqu'à la chute ; seule la phase de nettoyage postérieure à la mort permet
son absorption. Les traces ordinaires disparaissent ensuite, puis un bouton
entre en dernier à l'image 444. Deme-chan restitue ce même bouton à partir de
474 ; Shizuku le range avant de remettre ses lunettes et de demander « À qui ? ».
Les commandes de matière sont dites à voix haute avant leur aspiration.

Le modèle de la visite conserve sa bouche, ses yeux, ses dents et son tuyau
continu. La tête pivote au bout du tuyau pour rester droite ; les deux mains
rejoignent les prises physiques. Les objets de Nen portés par le vaincu se
dissipent au décès au lieu d'être aspirés. Aucun objet de la scène réelle,
aucune mémoire de Deme-chan et aucun PV n'est modifié par la présentation.
Le film préalable exige de vraies ouvertures et une mort par aspiration native.
Les contrôles couvrent les prises, l'ordre mort/nettoyage/dernier objet,
la restitution, les deux côtés, le miroir, les tailles et le mobile.

Bonolenov : « Le dernier mouvement » fait entendre les trous du corps, puis
matérialise la tenue et la lance natives de Prologue à l’image 72. Deux contacts
physiques de la pointe avec le sol marquent 132 et 168. Jupiter naît autour du
corps à 210 et poursuit la cible de 288 à 396 : sa surface atteint le torse réel
sur l’accord final. Le vaincu est écrasé de façon stylisée, puis la sphère se
dissipe et Bonolenov s’incline. Le cratère est temporaire, sans modification du
lieu. Le plan de confort contient toute la poursuite sans déplacement de caméra.

Le film préalable accomplit réellement Prologue, un coup de lance et les 90
frames de préparation de Jupiter avant un K.-O. par son projectile natif.
La présentation ne débloque aucune connaissance de Metamorphosen et ne change
aucune condition de portée auditive. Le geste de se couvrir les oreilles est
une réaction de la cible ; il n’interrompt pas le guidage. La tenue réutilise les
géométries partagées sans les détruire. Les contrôles couvrent le contact au sol,
la surface de Jupiter, la restauration, les tailles, P2, le miroir et le mobile.

Illumi : « Même après la mort » commence par son regard vide et une aiguille à
tête ronde. Il rejoint la cible par derrière et l’implante au crâne à l’image
132. Le corps perd sa liberté de mouvement puis s’agenouille ; deux aiguilles
supplémentaires arrivent au front à 282 et 300. La chute commence à 348. Le corps
sans vie se relève à partir de 420 et s’incline à 468, avant le portrait final.
Les trois pointes suivent les coordonnées locales de la tête pendant la chute,
le redressement et le salut. Les bras utilisent leurs deux segments physiques.

Le film natif valide une implantation sans dégâts, les ordres Éloigne-toi,
Approche et Reste, puis un véritable K.-O. physique. Illumi ne possède pas de
finisher offensif dans la simulation. Les aiguilles supplémentaires, la mort
mise en scène et le contrôle du cadavre restent une présentation après verdict :
aucun dégât, soin, contrôle supplémentaire ou résurrection n’est envoyé au jeu.
La caméra normale contient le corps entier pendant sa chute ; le réglage de
confort conserve un seul plan fixe. Les contrôles couvrent les contacts, les
articulations, la restauration, P2, les gabarits, le miroir et le mobile.


Biscuit : « Le soin de grâce » commence par Cookie massant sa main avec sa lotion,
puis révèle son corps naturel à l’image 210. Un unique direct touche le torse
réel à l’image 330 ; la cible suit la gravité native et touche le sol à l’image 357. Biscuit
reprend sa petite apparence à l’image 420 et fait terminer sa manucure par Cookie.
Les deux corps sont les modèles natifs du jeu, sans étirement des articulations.
La lotion reste un soin et ne devient jamais une arme. La démonstration obtient
d’abord un véritable K.-O. physique après une transformation native gratuite.
Aucune transformation, récupération de PV ou d’aura n’est appliquée au résultat
courant par la cinématique. Les poses, le cadrage réduit et les matériaux sont
restaurés après chaque rendu ; les géométries humaines partagées sont conservées.
`biscuitFilm.test.ts`, `renderer.test.ts` et `check-biscuit-fatality.mjs` couvrent
les deux côtés, les tailles extrêmes, le miroir, le mobile et le déclenchement.
`render-biscuit-fatality.mjs` exporte 600 images et `compose-biscuit-fatality.mjs`
compose la bande sonore du jeu et la vidéo de dix secondes.


La chute de Biscuit utilise `advanceAirborne`, la progression de KO de
`finishedFallPresentation`, `reactionPlan` et `fightGroundContact` comme le combat.
Le vaincu quitte sa garde, reçoit le coup, puis se couche sur le dos sans rotation
latérale. Les accessoires, cheveux et ombres ne déterminent pas le sol. Le rig
natif est emprunté sans avancer sa mémoire d’animation et tous ses changements
sont restaurés après le rendu. Le cadrage réserve la longueur du corps couché,
y compris avec la caméra réduite sur mobile. Le mix ne contient aucune réplique
française ; seuls les bruitages et l’annonce « Fatality » sont conservés.


Kurapika hors Brigade : « La dernière condition » active visuellement Emperor
Time, déploie Judgment Chain depuis le petit doigt droit, implante le pieu au
cœur à l’image 150 et annonce « N’utilise plus le Nen ». La tentative d’aura
commence à 294 ; la violation déclenche le pieu à 348. Une coupe interne montre
le cœur, ses vaisseaux et la chaîne qui se referme, puis le vaincu s’effondre sur
le dos avec la pose et les contacts au sol natifs. Kurapika revient en portrait. Aucune chaîne ne ligote le torse.

`troupeMember` choisit automatiquement cette variante pour les cibles hors
Brigade, y compris Hisoka, et choisit « La colère écarlate » pour les membres réels.
Le frame de lecture transporte la variante afin de sélectionner son titre et
son fichier sonore `kurapika-judgment.m4a`. Le mix comporte des battements,
maillons, rupture et annonce Fatality, sans réplique française. Le film de
validation résout une véritable implantation sans dégâts sous Emperor Time,
puis un véritable décès provoqué par une entrée de Nen interdite. Il ne change
ni les règles de Judgment Chain ni les conditions de Chain Jail.

`kurapikaJudgmentFilm.test.ts`, `renderer.test.ts` et `playback.test.ts` vérifient
le verdict, le petit doigt, l’absence de Chain Jail, le corps au sol, le choix de
variante et la restauration complète de la scène. `check-kurapika-judgment.mjs`
contrôle P2, petite/grande cible, miroir, mobile, confort réduit, déclenchement,
et le chargement du son propre à cette variante. L’export de dix secondes
provient de `render-kurapika-judgment.mjs` et `compose-kurapika-judgment.mjs`.

Kurapika face à la Brigade : « La colère écarlate » reprend le rythme brutal de
son combat contre Uvogin. Les yeux écarlates et les sourcils froncés précèdent
Chain Jail : la chaîne part du majeur droit à l’image 33 et ligote le torse à 63.
Kurapika frappe sept fois, en alternant corps et visage, aux images 84, 114,
144, 174, 204, 234 et 300. Le dernier coup projette la cible ; sa chute utilise
la gravité, le rig de KO et les contacts au sol du combat. La chaîne suit le
torse pendant la chute puis se retire entre 368 et 410. Le portrait final
conserve sa colère. Cette variante ne déploie pas Judgment Chain.

Le sélecteur réserve `kurapika-troupe` aux neuf membres jouables actuels de la
Brigade, en excluant Hisoka. La démo résout d’abord une vraie capture sans
dégâts, le Zetsu forcé et un K.-O. physique ; ses sept frappes condensent les
coups réels du combat. La présentation ne modifie jamais le résultat courant.
`kurapikaTroupe.test.ts` vérifie les sept contacts des poings sur chaque membre,
la chute et la restauration des modèles. `check-kurapika-troupe.mjs` contrôle
P2, les gabarits, les lieux, le mobile, le confort et le branchement dans Clash.
`render-kurapika-troupe.mjs` et `compose-kurapika-troupe.mjs` produisent dix
secondes en 1080p60 et `kurapika-troupe.m4a`, sans aucune voix.


Hanzo : « Derrière toi » laisse le corps natif en méditation, yeux fermés.
Un deuxième modèle complet apparaît à l’image 72, traverse une cloison solide
à 138 et rejoint le cou de la cible à 216. Les deux articulations de chaque
bras gardent leur longueur ; le double adapte sa hauteur et sa flexion au
gabarit de la victime. Il devient net pendant la prise, puis translucide lors
des traversées. Le corps physique reste opaque et immobile jusqu’au retour.

L’étranglement s’achève à 360. Le double relâche la prise avant 384 ; le vaincu
suit ensuite la pose de KO et les contacts physiques de `nativeFall.ts`, sur
le dos. Le double retourne continûment dans le corps à 468, avant le réveil
et le portrait final. La cloison est une scénographie locale après verdict :
elle n’ajoute ni collision, protection du corps, ni règle de Nen au combat.
Le mix contient le souffle, les traversées, la prise, la chute et Fatality,
sans réplique française. La caméra réduite conserve un plan fixe complet.

`hanzoFatalityFilm.ts` prépare un véritable combat, active Skill 4, fait flotter
le double et traverser l’adversaire, vérifie que le corps reste en place et
qu’un rappel à distance est refusé, puis obtient un K.-O. avec l’étranglement
natif du double. Le moteur termine la projection au verdict ; la cinématique
reconstitue le retour au corps sans nouvelle commande de rappel. Les tests
vérifient petites et grandes cibles, miroir, prise au cou, chute au sol,
restauration du rendu et absence de mutation du résultat. Les géométries humaines
partagées restent conservées lors de la libération du double.

`render-hanzo-fatality.mjs`, `compose-hanzo-fatality.mjs` et
`check-hanzo-fatality.mjs` produisent la vidéo de dix secondes, le son du jeu
`hanzo.m4a` et les vérifications navigateur (P2, mobile, miroir et confort).


Saiyu : « Les trois silences » utilise trois manifestations graphiques distinctes
de Mizaru, Kikazaru et Iwazaru. L’archive du projet ne possède pas leur anatomie
révélée : ces signes expriment leurs fonctions, sans inventer un modèle de bête.
Les contacts aux yeux, à l’oreille et à la bouche arrivent aux images 90, 162 et
234. Le cadre se ferme brièvement, le son s’étouffe puis la tentative de cri
reste muette. La cible porte successivement les mains à ses yeux, ses oreilles
et sa bouche. Le bâton natif s’allonge à 282, touche la surface réelle du torse
à 360 et projette le vaincu avec la gravité, la pose de KO et le sol du combat.

Les deux mains suivent deux prises réelles sur le bâton, sans étirer les bras.
Le film préalable obtient trois touches natives distinctes (bits 1, 3, 7), puis
un K.-O. natif avec le finisher. Aucun Zetsu automatique ni dégât supplémentaire
n’est ajouté. La cinématique de dix secondes est branchée aux victoires de Saiyu,
avec adaptation au lieu, à la cible et au côté gagnant. L’annonce « Fatality »
en anglais arrive à 8,1 secondes, après le retour du son, sans réplique française.
`saiyu.test.ts` vérifie contacts, prises, chute et restauration sur les gabarits
extrêmes et le miroir ; `saiyuFilm.test.ts` vérifie la simulation des deux côtés.
`check-saiyu-fatality.mjs` vérifie le mobile, le confort et le déclenchement réel.


La version sensorielle de Saiyu garde le cadre totalement noir de 98 à 130,
puis révèle des iris pâles sans reflets. À 162, la cible se prend les oreilles
et l’onde sonore s’aplatit ; le mix coupe tout son entre 174 et 282 (2,9–4,7 s).
Le plan frontal de 234 à 282 révèle une bouche ouverte et une main à la gorge :
la tentative de cri demeure muette. Les signes s’effacent rapidement après
contact pour dégager le visage. `saiyuPerception.ts` possède seulement ses
matériaux et la bouche temporaire ; la face native et les matériaux des yeux
sont restaurés après chaque rendu. Le compositeur vérifie aussi le silence
sur l’audio AAC exporté. La scène conserve une durée de dix secondes.

Bill : « Dernier rempart » joue désormais trois routes du jeu : Économie
(direct, crochet, balayage), Précision (direct, direct en avançant, crochet,
balayage), puis Croissance (coup bas, direct en avançant, crochet, revers,
coup d’épaule). `billComboTrack.ts` les exécute avec `performMove` et
`tickFight`, sans réinitialisation entre les routes. Une garde se réactive
à la première ouverture de chaque combo : les séries restent de 3, 4 et 5
contacts non bloqués. Les liaisons attendent la récupération réelle.

`billNativePose.ts` dessine les mêmes `bodyPlan`, animations personnelles,
déplacements, hitstops et réactions que le combat. La distance et la profondeur
s’ajustent aux surfaces physiques par lancer de rayon, sans modifier les angles
des articulations. Les 336 frames natives
occupent les images 0–342 du film. La dernière frappe raccorde à la chute
approuvée de `nativeFall.ts` à 343. `billFinalePose.ts` conserve le cadrage,
la réception, la germination finale et le portrait. Erigeron ne frappe,
ne porte et ne vieillit personne ; le résultat courant reste immuable.
Les tests vérifient les routes contre garde, leurs plans natifs, les gabarits,
le miroir, les deux côtés gagnants et la restauration du rendu.

`billFatalityFilm.ts` obtient aussi son K.-O. avec ces vrais enchaînements.
`render-bill-fatality.mjs`, `compose-bill-fatality.mjs` et
`check-bill-fatality.mjs` exportent dix secondes en 1080p60, le son du jeu
`bill.m4a` et les vérifications navigateur. Les douze impacts sonores suivent
les contacts enregistrés du moteur ; la fin conserve Fatality en anglais,
sans voix française.

Melody : « Un champ au printemps » lève sa flûte native pendant 48 images, puis
joue continuellement. Les ondes de musique atteignent la cible ; sa garde
s’abaisse et ses yeux se ferment entre 144 et 234. À 210, le décor réel laisse
place à la prairie subjective : 1 280 fleurs, des herbes, des collines et des
pétales. La cible contemple une fleur tenue dans sa main à 324 ; Melody continue
de jouer jusqu’au dernier plan. Le livre de Chrollo est rangé pendant l’illusion.

Cette fin est une capitulation hypnotique, sans exécution. Le film préalable
valide une vraie performance native, une écoute qui pacifie la cible, l’absence
de dégâts musicaux, puis une vraie victoire à la décision avec le perdant vivant.
Le renderer n’ajoute ni sommeil permanent, ni mort, ni effet de trois minutes.
L’arène et les matériaux, les poses et la position de la flûte sont restaurés
après chaque image. `melody.test.ts` vérifie les deux prises, l’embouchure, le
miroir et les gabarits ; `melodyFilm.test.ts` couvre les deux côtés du duel.
Le mix utilise une phrase de flûte originale et l’annonce anglaise « Friendship »
à 8,1 secondes, sans dialogue français. La scène est branchée aux victoires de
Melody et s’adapte à l’arène et aux acteurs du combat courant.


`check-saiyu-melody-victories.mjs` contrôle huit victoires réelles dans le
composant Clash, avec rematches, modes IA/local, deux côtés, deux arènes,
verdicts et chargement des sons. `saiyuMelodyPlayback.test.ts` couvre tous les
adversaires et lieux du catalogue ainsi que les quatre motifs de victoire.

`check-hanzo-bill-victories.mjs` vérifie le déclenchement dans Clash, les
rematches des deux côtés et les bandes sonores sans modifier le résultat.


Hinrigh : « Pièce à conviction » transforme au contact les trois objets de sa
mallette : caméra à 30, menottes à 54 et pistolet à 78. Le chat-caméra enregistre
la scène. Deux paires de pigeons rejoignent les poignets à 174 et les chevilles
à 222, puis redeviennent des attaches métalliques aux positions physiques des
membres. Le pistolet-serpent conserve son canon et tire une seule balle à 360.
La cible suit la chute native à partir de 372 ; les menottes continuent de
suivre ses mains rapprochées. Le pistolet redevient ordinaire au sol. Hinrigh
soulève le chat et le caresse au contact de son véritable modèle, sans masquer
son visage. Le verdict et l’annonce anglaise Fatality arrivent après huit
secondes, sans voix française. La caméra réduite conserve un plan fixe.

Le film valide la transformation d’une paire portée, une capture réelle sans
dégâts et un K.-O. physique. Le chat-caméra et le pistolet-serpent rappellent les
transformations du manga (chapitres 390–391), mais restent ici une mise en scène
après verdict : ils n’ajoutent ni équipement, ni tir, ni immobilisation durable
à la simulation. Les modèles natifs de Biohazard sont réutilisés ; seules les
ressources propres aux accessoires sont libérées. Le résultat reste inchangé.
`hinrigh.test.ts`, `hinrighFilm.test.ts`, `check-hinrigh-fatality.mjs` et
`check-hinrigh-victories.mjs` couvrent contacts, restauration, victoire native,
deux côtés, gabarits, miroir, lieux, mobile, confort, rematches et chargement du son.

`hinrighPlayback.test.ts` couvre tous les adversaires et lieux du catalogue,
les quatre motifs de victoire, les deux côtés, les modes IA/local et les
rematches. Le contrôle navigateur vérifie aussi la fin naturelle à dix secondes
et le retour aux résultats.


Terebellum : « Retour à l’envoyeur » reçoit deux coups de couteau et un coup
au torse. À 120, la blessure et le même couteau apparaissent dans la canette
maintenue dans sa main gauche. L’attaquant récupère physiquement la lame à 204 ;
la canette conserve sa déformation et sa trace. Terebellum pose la canette et
touche le torse adverse de sa main gauche avant les coups de 240 et 360.
Le dernier couteau se retrouve dans le front de celui qui l’a donné, avec un
gros plan avant la chute native à 384. Terebellum reprend sa canette abîmée et
boit sans blessure. L’annonce Fatality est en anglais, après huit secondes.

Les transferts ont lieu à l’instant du nouveau dommage, avec contact gauche
continu. Aucun dégât n’est stocké, aucune vieille blessure n’est soignée ou
réutilisée. Le pouvoir n’absorbe rien à distance : pour ses propres blessures,
le contact gauche suffit (chapitre 399). Le film obtient un vrai K.-O. par
Sweet Home et vérifie que Terebellum reste à ses PV maximaux. Une simulation
témoin identique, privée du seul transfert, confirme le dommage effectivement
dévié ; elle ne modifie pas la continuité du film. Le rendu après verdict ne
modifie aucun PV ni état de combat. Les bras gardent leurs longueurs et le
plus grand personnage fléchit les jambes pour rejoindre les petits gabarits.
Les poses, accessoires et matériaux sont restaurés et les sons suivent les dix
secondes. Les contrôles couvrent les deux côtés, tailles, miroir, lieux, confort,
mobile et rematches.

`terebellumPlayback.test.ts` couvre tous les adversaires et lieux du catalogue,
les quatre motifs de victoire, les deux côtés, les modes IA/local et les
rematches. Le contrôle navigateur vérifie la fin naturelle après dix secondes,
le chargement du son et le retour aux résultats sans mutation du combat.

Hisoka : « Regarde-moi » remplace le fil final comme cinématique par défaut.
Le Ren monte durant 96 images ; l’adversaire concentre le Gyo à 120. Le plan
subjectif à 180 révèle progressivement le visage sous le masque, puis les yeux
s’assombrissent et le sourire s’élargit de 240 à 294. Le dernier souffle s’arrête
à 390 ; la caméra montre ensuite la chute native sur le dos. Le vaincu reste
présent au sol pendant le portrait final. `hisokaThread.ts` conserve le précédent
rendu sans modifier sa démo autonome.

`hisokaFearFace.ts` possède ses seules géométries : bouche et dents interpolées,
plaques cicatricielles ajustées à la peau par rayons, ombres orbitales et creux
nasal. La tête et les matériaux originaux sont restaurés après chaque image.
`hisokaFearAura.ts` dessine le Ren et le Gyo même avec les flashes désactivés.
Le confort caméra conserve un plan large fixe. Le film ne change pas les règles :
`hisokaFearFilm.ts` vérifie une vraie préparation de Texture Surprise, le Ren
et le Gyo natifs sans dégâts ni annulation du masque de tissu, puis obtient
un vrai verdict avec les coups existants. La révélation du visage est subjective
et la mort de peur appartient à la mise en scène après verdict, sans nouveau
seuil de dégâts ou effet létal attribué au Ren.

`render-hisoka-fear.mjs`, `compose-hisoka-fear.mjs` et `check-hisoka-fear.mjs`
produisent les dix secondes en 1080p60 et `hisoka.m4a`. Les battements accélèrent
puis s’arrêtent à 6,5 s ; un silence précède la réception à 7,08 s. Seule l’annonce
anglaise Fatality est parlée. Les contrôles couvrent P2, les gabarits, le miroir,
le mobile, le confort, l’intégration dans Clash et l’immuabilité du résultat.

La révision de terreur déforme la géométrie privée des joues et de la mâchoire,
avec seize poses de bouche ajustées à la peau, un sourire ouvert et des dents
irrégulières. Un œil est plissé, l’autre dilaté, avec des pupilles minuscules.
Le cadrage suit l’orientation du corps afin de conserver l’inclinaison menaçante
de la tête. Deux pas de recul, des tremblements, des gouttes de sueur et les
gestes de protection, de gorge puis de poitrine prolongent la panique avant
la mort à 390. La géométrie partagée du visage reste intacte et se restaure
après chaque image. Les souffles et les derniers battements s’accélèrent
jusqu’à 6,5 s, avant le silence et la réception à 7,08 s.


Voconte : « Aller simple » fait du choix de la destination un piège. Voconte
franchit A à 90, s’écarte sur la passerelle de B et laisse sa cible le poursuivre
à 156. B est un cadre physique ancré sur un plancher en hauteur, dont le bord
s’arrête devant la sortie. La cible dépasse ce bord et tombe à partir de 186 ;
Voconte revient de B à A à 246, puis referme A sans toucher le vaincu.
La révélation de la hauteur précède le suivi de la chute et l’impact à 342.
La silhouette bascule sur le dos, les fissures et débris restent au sol,
puis le portrait final précède Fatality en anglais après huit secondes.

La trajectoire utilise `advanceAirborne` avec une élévation initiale ; son
échantillonnage au ralenti adapte la durée au gabarit pour garder l’impact à
5,7 secondes. Les deux portes gardent leurs positions. Seuls deux corps réels
circulent, sans fantôme, découpe de portail ou projectile téléporté. La hauteur
et le piège sont une chorégraphie après verdict, sans nouvelle règle de dégâts
ou de transport dans le combat natif. La simulation préalable démontre les
passages directionnels des deux combattants puis un K.-O. physique natif.

`voconte.test.ts` couvre gabarits, miroir, deux côtés, contacts au sol et
restauration des poses, matériaux, visibilité et brouillard. Le cadrage haut
écarte transactionnellement les panneaux qui masquent les combattants.
`voconteFall.test.ts` compare la chute à l’intégrateur réel et préserve les
anciens lancements au sol. `voconteFilm.test.ts` contrôle le verdict et la
continuité. `vocontePlayback.test.ts` parcourt tous les adversaires et lieux,
quatre motifs de victoire, IA/local et rematches. Les contrôles navigateur
`check-voconte-fatality.mjs` et `check-voconte-victories.mjs` vérifient le rendu,
le mobile, le confort, le son et le retour aux résultats à dix secondes.


Longhi et Furykov possèdent chacun une cinématique personnelle de dix secondes,
enregistrée après leurs victoires éligibles avec la cible et le lieu du combat.
Longhi fait signer Moonlight Act aux deux parties, montre la rupture et le
Zetsu, puis termine avec cinq coups physiques. Le contrat ne blesse pas et sa
signature reste volontaire. Furykov équipe une contre-arme adaptée à la cible,
avec déchiffrage et fabrication achevés avant le duel selon le scénario demandé.
Les quatre modèles et leurs effets sont des créations pour le jeu. Les deux
scènes finissent par une chute native et Fatality en anglais, sans voix française.

Le document commun se place dans la portée réelle des trois mains, sans
étirer les bras, et porte le nom de l’adversaire. Le cadrage et les accessoires
suivent les gabarits ; les poses, matériaux et ressources sont restaurés après
chaque image. `nativeComboBody.ts` partage avec Bill son rendu de poses natif,
sans changer sa chorégraphie. Les sons `longhi.m4a` et `furykov.m4a` suivent
l’horloge de la victoire, y compris après une revanche.

`personalGuardPlayback.test.ts` croise les deux personnages avec tout le roster,
les arènes, les deux côtés, IA/local et les quatre motifs de victoire.
`personalGuardTrack.test.ts` vérifie cinq vrais impacts contre chaque cible.
`personalGuard.test.ts` et `personalGuardFilm.test.ts` contrôlent les contacts,
la restauration et les conditions natives des Hatsu. Les scripts
`check-personal-guard.mjs` et `check-personal-guard-victories.mjs` couvrent les
démos, mobile, confort, sons et huit victoires automatiques avec revanches.

Theta : [Une balle d’avance](./THETA.md) utilise le chargeur comme leurre,
un coup de crosse puis l’unique balle restée dans la chambre.

Mizaistom : [Dernier avertissement](./MIZAISTOM.md) alterne deux cartons jaunes
retournés, des contraintes brèves et des frappes physiques après libération.

Rihan : [L’angle mort](./RIHAN.md) montre une prédation ciblée de Deme-chan
ou de Bungee Gum, son propre sceau de 48 heures, puis une fin physique.
