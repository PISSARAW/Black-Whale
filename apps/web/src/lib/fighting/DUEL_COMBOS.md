# Vingt-deux profils de combos

Kurapika, Benjamin, Hisoka, Chrollo, Feitan, Phinks, Machi, Biscuit, Franklin,
Hanzo, Illumi, Kalluto, Shizuku, Leorio, Saiyu, Bonolenov, Hinrigh, Mizaistom,
Gel, Lynch, Padaille et Zakuro ont huit exemples chacun dans l’Académie. Les quatre routes
initiales restent disponibles. `duelComboProfiles.ts` définit leurs timings et
leurs cancels indépendamment de ces exemples ; `duelComboLessons.ts` enseigne les
branches. Les directions avant/arrière suivent le personnage, avec les commandes
réellement choisies par le joueur, sans substitution automatique de coup.
`duelComboRosterProfiles.ts` et `duelComboRosterLessons.ts` ajoutent les quatre
profils suivants. `duelComboSecondProfiles.ts` et `duelComboSecondLessons.ts`
ajoutent quatre autres profils. `duelComboThirdProfiles.ts` et
`duelComboThirdLessons.ts` ajoutent Illumi, Kalluto, Shizuku et Leorio.
`duelComboFourthProfiles.ts` et `duelComboFourthLessons.ts` ajoutent Saiyu,
Bonolenov, Hinrigh et Mizaistom.
`duelComboFifthProfiles.ts` et `duelComboFifthLessons.ts` ajoutent Gel, Lynch,
Padaille et Zakuro.
Le catalogue compte 248 routes pour quarante personnages.

## Choisir sa fin après léger puis lourd

| Fin                 | Kurapika                | Benjamin                  | Compromis                                                           |
| ------------------- | ----------------------- | ------------------------- | ------------------------------------------------------------------- |
| Bas + lourd         | Balayage divinatoire    | Balayage tactique         | 0 aura, mise au sol et moindre éloignement                          |
| Avant + lourd       | Lariat divinatoire      | Charge blindée            | 0 aura, davantage de dégâts et de poussée, récupération plus longue |
| Technique offensive | Avant + spécial : fouet | Spécial neutre : Air Blow | Dégâts supérieurs ; 24 / 40 aura et conditions du pouvoir           |

La poussée d’une fin physique dépasse le seuil ordinaire de mise au sol. Les
coups intermédiaires restent sous ce seuil. Les fins n’accordent aucun cancel
supplémentaire ; la décroissance des dégâts et du hitstun ainsi que le plafond
de juggle s’appliquent toujours. Sur garde, seul le premier léger permet le
lourd déclaré, puis le défenseur retrouve son tour.

## Les deux premiers profils

Kurapika peut passer de léger à avant + léger, puis attendre la récupération pour
placer le lourd. Avant + léger **ne se cancel pas** vers lourd : c’est une liaison
ordinaire, rendue possible par son avantage sur touche et ses portées. Il peut
ensuite finir par le fouet ou le balayage. Une commande tardive laisse la cible
garder ; le buffer ordinaire de six frames reste applicable.

Benjamin peut prolonger léger → avant + léger → lourd par des cancels confirmés,
puis choisir Air Blow ou une fin physique. Leurs fenêtres de cancel sont définies
par attaque, relativement à la première frame active. Un coup dans le vide ou
paré n’autorise pas un cancel sur touche.

Chain Jail, Steal Chain, Holy Chain, Judgment Chain, Secret Window et Culdcept ne
deviennent pas des coups de combo. Leurs conditions actuelles sont conservées.
Air Blow exige toujours son héritage et le Nen disponible. Les préparations
restent des actions séparées après l’échange, avec leurs risques habituels.

## Quatre autres façons de convertir une ouverture

| Personnage | Fins physiques                                                            | Choix personnel                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hisoka     | Bas + lourd pour rester proche, arrière + lourd pour repousser            | Attacher Bungee Gum pour 40 aura, ou dépenser 55 aura dans le finisher si une liaison existe déjà ; le finisher consomme la liaison au contact                                      |
| Chrollo    | Bas + lourd pour les dégâts et la mise au sol, avant + léger pour pousser | Poser une marque Soleil avec la page Sun and Moon ouverte et une main libre, pour 24 aura et moins de dégâts immédiats ; lourd → arrière + lourd est une liaison après récupération |
| Feitan     | Balayage rapide ou grande taille qui repousse davantage                   | Prolongation rapide vers l’estoc du parapluie (24 aura), ou cinq frappes physiques sans dépense, soumises à la réduction du hitstun                                                 |
| Phinks     | Balayage proche ou grande frappe avant, en conservant les tours accumulés | Après récupération du lourd, placer le poing chargé ; une rotation complète est requise et toute la charge est engagée au départ du poing                                           |

Les quatre routes de base de chaque personnage sont conservées. Chez Hisoka,
le lourd avant reste un intermédiaire vers l’attache ; la poussée de fin utilise
le lourd arrière. Chez Chrollo, le léger avant est une frappe physique et ne
place aucun signet. Son marquage n’accorde ni vol ni explosion sans les autres
conditions. Pain Packer et Rising Sun restent des préparations soumises aux
blessures et à l’armure, sans nouveau cancel de combo.

L’exercice `hisoka:tether` effectue une vraie attache avant de laisser les corps
récupérer. `phinks:charged` effectue une rotation complète de 36 frames pour
2 aura et arrête le moulinet. Ces préparations passent par les commandes et le
temps ordinaires ; elles n’injectent pas de pouvoir gratuit. Leurs contacts
antérieurs sont séparés de l’essai de combo. En combat libre, le joueur doit
obtenir lui-même la liaison ou les tours avant l’ouverture.

Le poing de Phinks conserve son admission ordinaire : impossible de le lancer
pendant une attaque. La liaison attend la récupération du lourd, puis le poing
touche avant la fin du hitstun. Le guidage du laboratoire distingue cette attente
des tours manquants. Les corps restent vulnérables pendant les préparations.

Les profils déclarés peuvent mettre en mémoire une destination de cancel pendant
les six dernières frames avant le contact. Cette intention attend la confirmation
réelle, et le blocage n’autorise que la pression déclarée. Elle expire sur un coup
raté ou paré, sans lancer une attaque neutre retardée. L’aura et les conditions
sont revérifiées à l’exécution ; les liaisons après récupération conservent leur
timing propre. Ce buffer absorbe notamment une arrivée réseau légèrement anticipée.

Les quarante exercices de défense utilisent le lourd de Benjamin comme attaque
commune réellement punissable, indépendamment des nouvelles liaisons de Chrollo.

## Machi, Biscuit, Franklin et Hanzo

Machi choisit un balayage proche, une poussée ou une liaison lourd → arrière +
lourd. Son exercice de pistage pose d’abord une vraie aiguille pour 18 aura ; les
frappes suivantes conservent le repère sans le transformer en immobilisation.
Le finisher exige toujours une vraie ligature maintenue, absente des cancels physiques.

Biscuit garde ses fins physiques sans dépense et peut investir 24 aura dans le
direct du maître. Son exercice de vraie forme utilise la commande réelle avant
l’ouverture, sans coût ni soin, puis propose un finisher à 55 aura. Cette fin
reste indisponible sans la forme naturelle ; Cookie n’est jamais appelé.

Franklin choisit une fin physique ou un tir unique qui lance une rafale. Avant +
spécial coûte 24 aura et émet dix balles ; spécial neutre coûte 40 aura et en émet
vingt. `CombatRoute.hits` décrit les impacts attendus pour chaque commande :
l’exercice ne valide pas une rafale sur sa première balle. Le compteur réel
permet de compter deux balles arrivant dans la même frame sans inventer un
projectile ou un contact. Toute coupure du combo ou interruption de tir fait
échouer la route. Les projectiles conservent leurs déplacements et défenses.

Hanzo utilise une liaison avant + léger → arrière + lourd, puis choisit balayage
ou poussée. Ses quatre nouveaux exemples sont martiaux, sans créer un double ni
une invulnérabilité. Préparer la projection reste une action séparée qui expose
le corps endormi selon les règles existantes.

Les préparations `tracking` et `true-form` passent aussi par de vraies commandes.
Leur snapshot initial ne confond pas l’action préalable avec les impacts du combo.

## Illumi, Kalluto, Shizuku et Leorio

Illumi choisit le balayage, la poussée ou une liaison lourd → revers. Son nouvel
exercice de déguisement dépense réellement 20 aura et attend les 30 frames de
préparation avant les cinq frappes physiques. Le visage remodelé ne protège pas
des coups et les normales ne créent ni implantation ni marionnette. Les ordres
et l’implantation gardent leurs propres règles, sans nouvelle route de contrôle.

Kalluto peut finir physiquement ou, si un fragment existe dans la zone choisie,
convertir le lourd en serpent de papier. L’exercice plante un vrai papier dans le
torse pour 16 aura, puis le serpent coûte 24 aura et doit toucher par sa trajectoire
réelle. Un fragment aux pieds n’autorise pas le serpent visant le torse. La route
physique n’accorde aucun papier, aucune explosion ni poupée d’écoute.

Shizuku peut conserver l’aura avec le balayage ou la poussée, ou dépenser 24 aura
dans la frappe de Blinky, avec une route de départ bas plus longue. Les coups
laissent les plaies déjà gérées par le moteur, mais n’enchaînent pas automatiquement
l’aspiration du sang. Les conditions du tuyau, des plaies et de leur couverture
par les mains restent applicables ; aucun soin ni vol d’aura n’est ajouté.

Leorio doit convertir un revers engagé pour garantir le poing à distance à
40 aura. Son hitstun de duel laisse le temps au démarrage de 18 frames, au trajet
minimal de 12 frames et à la remontée de 4 frames. Le poing garde sa visée fixe,
sa portée et sa transmission au sol ; aucun coup de mêlée invisible ne remplace
le projectile. Une technique volée, le manque d’aura ou un corps aérien interdit
toujours le lancement. Les fins physiques restent disponibles sans dépense au sol.

Les préparations `disguise` et `paper` utilisent les commandes et le temps ordinaires.
Le laboratoire les termine avant de commencer le compteur de l’exercice.

## Saiyu, Bonolenov, Hinrigh et Mizaistom

Ces quatre profils offrent chacun un balayage proche sans aura, une fin qui
repousse davantage et des branches indépendantes des seize nouveaux exemples.
Saiyu choisit après confirmation un seul singe : Mizaru retire la vue (40 aura),
Kikazaru l’ouïe (24) ou Iwazaru la parole (20). Aucun Zetsu automatique.
Bonolenov lie sa lance à 12 aura après récupération du lourd, uniquement après
un vrai Prologue à 40 aura et 60 frames. Les danses ne sont pas des cancels.
Hinrigh prépare un vrai pigeon-menottes à 20 aura ; la capture ne fait aucun
dégât et le premier coup casse les menottes. La suite dépend du hitstun ordinaire.
Mizaistom montre réellement son carton à 40 aura et attend le préavis de 18 frames.
La cible peut garder ; les frappes et leur poussée ne déclenchent pas la détention.
Seule une nouvelle action interdite après le préavis enfreint la règle.
Les trois derniers profils enseignent aussi lourd → arrière + lourd après
récupération. Les préparations utilisent commandes, coûts, temps et inventaire
réels ; aucun état de pouvoir n’est injecté pour réussir une démonstration.

## Gel, Lynch, Padaille et Zakuro

Gel peut prolonger physiquement ou finir avec le bras-serpent : 24 aura pour la
frappe avant à longue allonge, 20 pour la variante basse qui termine plus près.
Aucun venin, drain ou effet de contrôle n’est ajouté à la transformation.
Padaille choisit réellement la main droite marteau, foret ou hache pour 20 aura.
Le foret conserve une poussée inférieure au seuil de mise au sol et peut se
convertir en balayage. La hache démarre plus lentement ; la main transformée ne
renforce pas les normales et n’ignore ni la garde ni les interruptions.
Lynch peut lier le revers après récupération ou préparer une question réelle.
Son exercice bas comporte deux poings sur cible consciente : deux réponses
privées à 10 aura chacune, sans bonus de dégâts, de hitstun ou de vulnérabilité.
Zakuro prépare une plaie réelle (2 santé, 1 aura) puis trois gouttes-yeux (8 aura,
3 unités de sang). Sa conversion physique conserve la réserve et les six poches ;
les gouttes ne font aucun dégât et ne garantissent pas une prise ou une projection.
Les questions et commandes de sang restent des préparations distinctes, avec
leurs conditions de parole, d’équipement, de Nen et de disponibilité du corps.

## Apprentissage et validation

Les exercices expliquent le coût, le placement et la différence liaison/cancel.
Le laboratoire affiche les choix après la touche, leurs commandes remappées,
leur coût et les conditions manquantes. La liste des coups montre les fenêtres
de cancel et les liaisons possibles. Les indications ne forcent aucun impact.

`duelComboDepth.test.ts` compare les résultats effectifs des branches, le timing
des liaisons, la garde après une coupure et les ressources/héritages requis.
`duelComboRoster.test.ts` vérifie les quatre nouveaux profils, leurs coûts,
les marques, les attachements et la conservation/consommation des rotations.
`duelComboSecond.test.ts` compare les quatre derniers profils et vérifie les
préparations, la validation d’une rafale entière, ses coûts et son interruption.
`duelComboThird.test.ts` vérifie les quatre profils suivants, le déguisement sans
bonus, les fragments de la bonne zone, les vraies frappes de Blinky et le délai
ainsi que les restrictions du poing transmis dans le sol.
`duelComboFourth.test.ts` vérifie les sens choisis, Prologue et la liaison de
la lance, les menottes ouvertes par les dégâts et le carton sans détention automatique.
`duelComboFifth.test.ts` vérifie les fins du bras-serpent, le choix des trois
outils, la prolongation du foret, les réponses payées et les réserves des gouttes.
`combatRoutes.test.ts` vérifie les exemples dans les deux sens, à deux distances,
au centre et au coin, face à la garde après la première touche.
`combatSchool.test.ts` couvre les démonstrations à plusieurs cadences et leurs
replays ; `pvp/impactNetwork.test.ts` vérifie les commandes et impacts sous latence.

Le ruleset des replays passe à `clash-combat-12` : les anciens enregistrements
sont rejetés explicitement, car leurs timings et commandes ne correspondent
plus à cette simulation. Les valeurs de dégâts, portées et timings sont des
réglages de duel qui demandent aussi des essais avec des joueurs.
