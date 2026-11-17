# Combos de Kurapika, Benjamin, Hisoka, Chrollo, Feitan et Phinks

Les six combattants ont huit exemples chacun dans l’Académie. Les quatre routes
initiales restent disponibles. `duelComboProfiles.ts` définit leurs timings et
leurs cancels indépendamment de ces exemples ; `duelComboLessons.ts` enseigne les
branches. Les directions avant/arrière suivent le personnage, avec les commandes
réellement choisies par le joueur, sans substitution automatique de coup.
`duelComboRosterProfiles.ts` et `duelComboRosterLessons.ts` ajoutent les quatre
profils suivants. Le catalogue total compte 184 routes pour quarante personnages.

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

Les quarante exercices de défense utilisent le lourd de Benjamin comme attaque
commune réellement punissable, indépendamment des nouvelles liaisons de Chrollo.

## Apprentissage et validation

Les exercices expliquent le coût, le placement et la différence liaison/cancel.
Le laboratoire affiche les choix après la touche, leurs commandes remappées,
leur coût et les conditions manquantes. La liste des coups montre les fenêtres
de cancel et les liaisons possibles. Les indications ne forcent aucun impact.

`duelComboDepth.test.ts` compare les résultats effectifs des branches, le timing
des liaisons, la garde après une coupure et les ressources/héritages requis.
`duelComboRoster.test.ts` vérifie les quatre nouveaux profils, leurs coûts,
les marques, les attachements et la conservation/consommation des rotations.
`combatRoutes.test.ts` vérifie les exemples dans les deux sens, à deux distances,
au centre et au coin, face à la garde après la première touche.
`combatSchool.test.ts` couvre les démonstrations à plusieurs cadences et leurs
replays ; `pvp/impactNetwork.test.ts` vérifie les commandes et impacts sous latence.

Le ruleset des replays passe à `clash-combat-7` : les anciens enregistrements
sont rejetés explicitement, car leurs timings et commandes ne correspondent
plus à cette simulation. Les valeurs de dégâts, portées et timings sont des
réglages de duel qui demandent aussi des essais avec des joueurs.
