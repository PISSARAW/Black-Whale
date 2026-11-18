# Clash et les applications issues de plusieurs combats

Audit du 17 novembre 2026. Ce plan applique aux autres personnages la démarche
employée pour Hisoka : partir des actions montrées, conserver leurs conditions,
puis les rendre utilisables sur les corps, objets et informations réels du duel.
Il couvre vingt personnages ayant au moins deux affrontements exploitables et
Kalluto comme cas collectif à traiter séparément. Le diagnostic ci-dessous précède les modifications du moteur. La
[livraison des six personnages prioritaires](./clash-six-prioritaires.md) précise
les applications implémentées et les trois adaptations de gameplay demandées.

## Périmètre et preuves

Le périmètre vient du chat [Lister les combats du roster Clash](codex://threads/01a1eb7d-8ae4-7c20-b7fd-04e84dd83b40)
et du roster actuel de quarante personnages. « Deux combats » signifie **au moins
deux affrontements distincts**. L'adaptation animée d'un duel du manga ne crée
pas un deuxième affrontement. Plusieurs adversaires d'une opération continue ne
suffisent pas non plus à multiplier artificiellement les combats.

Les scènes brèves comptent lorsqu'elles permettent d'observer une application :
le poing de Leorio contre Ging en est un exemple. Une présence collective, une
victoire rapportée ou un entraînement sans opposition ne fournit pas à elle seule
une nouvelle chorégraphie personnelle. Les références ci-dessous sont des index
et synopsis recoupés ; elles ne constituent pas une certification planche par
planche de toutes les adaptations.

Les films élargissent le corpus de Machi, Kurapika, Leorio et Biscuit. Leurs
applications doivent porter une provenance distincte. Une marionnette de Feitan
affrontée par Hisoka dans un film ne démontre pas un nouveau pouvoir du véritable
Feitan. Voir les index de [Phantom Rouge](https://hunterxhunter.fandom.com/wiki/Hunter_%C3%97_Hunter%3A_Phantom_Rouge)
et de [The Last Mission](https://hunterxhunter.fandom.com/wiki/Hunter_%C3%97_Hunter%3A_The_Last_Mission).
Le On reste disponible selon la décision existante du projet ; cette exception
n'attribue pas à tous les personnages les capacités de Jed.

Hisoka est déjà traité par les liens multiples, les ancrages au décor, la traction
verticale et le rappel des objets. Les onze personnages du
[lot à une seule séquence](./clash-combats-uniques.md) restent dans leur audit.
Saiyu, Gel, Cluck, Beyond, Longhi, Voconte et Furykov n'ont pas deux affrontements
personnels exploitables établis dans ce classement. La blessure puis l'arrestation
de Camilla par Furykov appartiennent à la même opération ; sa présence ultérieure
aux côtés de Benjamin ne lui attribue pas les attaques de ce dernier.

## Diagnostic initial des six priorités

| Ordre | Personnage     | État constaté                                                                                                                                                                                                                                                  | Amélioration à réaliser et validation attendue                                                                                                                                                                                                                                                                                                                                          |
| ----- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | **Hinrigh**    | [Biohazard](../apps/web/src/lib/fighting/biohazard.ts) ne représente que des objets de type menottes ; le lancement transforme puis envoie un oiseau.                                                                                                          | Donner une fonction persistante à chaque objet transformé : arme-serpent qui tire ses vraies munitions, caméra-chat qui enregistre et huître qui dissimule le traceur. Transformer l'objet effectivement touché ; conserver son identité et sa fonction après transformation. Vérifier qu'une caméra ne fournit aucune image de ce qu'elle n'a pas filmé.                               |
| 2     | **Chrollo**    | [Black Voice](../apps/web/src/lib/fighting/hatsu/chrollo.ts) pose un compteur puis impose le recul. Il ne gère pas deux antennes comme des objets récupérables, ni plusieurs corps commandés. Les copies et les ordres de marionnettes existent déjà.          | Modéliser téléphone, deux antennes, implantation, retrait et ordres sur les cibles présentes. Faire interagir ces ressources avec Gallery Fake, Order Stamp, Convert Hands et Sun and Moon sans confondre leurs règles. Tester qu'une antenne retirée libère sa cible et que deux antennes occupées interdisent une troisième implantation.                                             |
| 3     | **Machi**      | Le [fil actuel](../apps/web/src/lib/fighting/machiThread.ts) distingue marquage et ligature avec une portée fixe ; la suture utilise une valeur de soin.                                                                                                       | Représenter les attaches, la longueur et la perte de résistance lorsque le fil est détaché. Relier la suture à des blessures identifiées ; une reconnexion exige le membre conservé. Tester fil court sous traction, fil allongé, rupture et continuité du suivi. Aucune résurrection ni repousse de membre.                                                                            |
| 4     | **Luini**      | [Spatial Transfer](../apps/web/src/lib/fighting/luiniSpatial.ts) respecte pièce close, lieu déjà visité et annulation par ouverture, mais déplace tout le corps vers une destination liée ou la première disponible.                                           | Permettre le choix parmi les lieux réellement visités et les sorties partielles montrées, notamment à travers une porte ou un plafond. Garder la partie sortie exposée aux coups. Tester la possibilité de frapper Luini pendant son apparition et la perte de l'ancrage si la porte est ouverte.                                                                                       |
| 5     | **Kurapika**   | [Judgment](../apps/web/src/lib/fighting/judgmentRules.ts) ne propose que Zetsu et absence de contact avec la Brigade. [Dolphin](../apps/web/src/lib/fighting/kurapikaDolphin.ts) exécute l'emprunt sur Kurapika. Le pendule interroge déjà un adversaire réel. | Ajouter les clauses attestées de secret et d'otages, le prêt à un tiers effectivement présent, puis la localisation et l'analyse d'enregistrements par Dowsing. Tester qu'Oito reçoit et emploie l'aptitude prêtée tandis que le coût d'Emperor Time demeure à Kurapika. Traiter le remboursement de l'aptitude et la fin de l'effet.                                                   |
| 6     | **Halkenburg** | La [flèche actuelle](../apps/web/src/lib/fighting/hatsu/halkenburg.ts) endort un partisan et immobilise la cible pendant 120 frames. Aucun transfert durable de contrôle n'est représenté.                                                                     | Séparer corps et conscience, choisir le participant marqué par le hasard déterministe et transférer réellement le contrôle. Faire suivre sommeil, réveil et décès des corps concernés. Ajouter la protection collective attestée en scénario. Tester un corps occupé capable d'agir, l'autre conscience endormie et les règles de réveil, au lieu d'une simple expiration de paralysie. |

Ces écarts sont visibles dans le code. Leur traduction numérique reste un choix
de jeu : les deux secondes de possession ou les portées actuelles ne sont pas des
limites canoniques. Les conditions de Biohazard et la conservation des fonctions
sont décrites pour [Hinrigh](https://hunterxhunter.fandom.com/wiki/Hinrigh_Biganduffno) ;
la résistance des fils pour [Machi](https://hunterxhunter.fandom.com/wiki/Chapter_78) ;
les passages pour [Luini](https://hunterxhunter.fandom.com/wiki/Luini).
Les applications de [Dolphin à Oito](https://hunterxhunter.fandom.com/wiki/Chapter_364),
les [antennes de Black Voice](https://hunterxhunter.fandom.com/wiki/Chapter_352)
et le [transfert de Halkenburg](https://hunterxhunter.fandom.com/wiki/Chapter_404)
fixent les autres critères. Les mécanismes inconnus ne doivent pas être complétés
par des conditions supposées.

Lovely Ghostwriter relève d'un scénario avec identité manuscrite et avenir
défini : son option existe, mais son exécution reste indisponible dans le duel.
Ce chantier complète l'arsenal rétrospectif de Chrollo ; il ne justifie pas une
prédiction automatique des entrées futures d'un autre joueur.

## Les vingt personnages et leurs références de travail

« Existant » décrit un comportement trouvé dans le code, sans certifier toutes
ses interactions. « À vérifier » désigne une piste d'audit, pas une capacité
annoncée absente. Les six écarts prioritaires sont détaillés plus haut.

| Personnage                                                                     | Deux références ou davantage                                                                 | Travail propre au personnage                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[Kurapika](https://hunterxhunter.fandom.com/wiki/Kurapika)**                 | Majtani ; Uvogin ; capture de Chrollo ; Vincent avec Bill.                                   | Les cinq chaînes ont des usages distincts. Compléter contrats, information et prêt à un tiers. Chain Jail conserve sa restriction exclusive à la Brigade ; les autres chaînes n'en héritent pas. Référence complémentaire : Oito pour le prêt, hors duel.                                                                           |
| **[Chrollo](https://hunterxhunter.fandom.com/wiki/Chrollo_Lucilfer)**          | Assassins de Yorknew et Indoor Fish ; Zeno et Silva ; Hisoka.                                | Les pages, le signet et plusieurs combinaisons existent. Approfondir les antennes, les corps intermédiaires et les enchaînements de préparation. Deux pages actives ne signifient pas deux mains disponibles.                                                                                                                       |
| **[Benjamin](https://hunterxhunter.fandom.com/wiki/Benjamin_Hui_Guo_Rou)**     | Lion de son introduction ; Camilla ch. 373 ; nouvelle confrontation ch. 416.                 | Existant : héritage de Vincent, Musse et Shikaku, et arme matérielle. Auditer les tirs, les ressources militaires et les applications récentes de l'héritage ; distinguer arme biologique et Hatsu. Les mécanismes non révélés d'Air Blow et Culdcept restent signalés comme adaptations.                                           |
| **[Tserriednich](https://black-whale-nexus.sarbast.dev/chapters/420)**         | Assassinat tenté par Theta ; Benjamin ; soldats royaux ; rencontre avec Hisoka ch. 420.      | Parallel Future possède déjà préparation, vision de dix secondes et divergence. Vérifier le cycle de disponibilité de la bête et les tirs des ch. 418–420. Distinguer contrainte démontrée et estimation du prince, notamment pour la recharge. Une mort dans la vision ne doit pas tuer le corps réel.                             |
| **[Feitan](https://hunterxhunter.fandom.com/wiki/Feitan_Portor)**              | Bêtes de l'Ombre, intervention collective ; mafieux avec Phinks ; Zazan.                     | Existant : blessures réellement subies, armure et soleil comme danger du terrain. À vérifier : feintes à l'épée, arme dissimulée dans le parapluie et espace permettant la fuite. Test décisif : un adversaire qui quitte la zone ne reçoit pas une exécution automatique. Seule Rising Sun est une variante montrée.               |
| **[Biscuit](https://hunterxhunter.fandom.com/wiki/Biscuit_Krueger)**           | Binolt ; Bara ; entraînements avec opposition ; troupes Shadow dans le film.                 | Existant : changement de forme, fondamentaux de Nen, Cookie et traitement consenti. À vérifier : variété des séquences de feinte, esquive et frappe selon la forme. Le passage à la forme naturelle ne soigne pas les blessures. Cookie exige temps et interruption réels ; le repos reste distinct d'un soin instantané de combat. |
| **[Phinks](https://hunterxhunter.fandom.com/wiki/Phinks_Magcub)**              | Mafieux et joueurs de Greed Island ; Gorilla ; habitants transformés de l'Étoile filante.    | Les rotations effectives et leur consommation par un coup droit existent déjà. Vérifier le choix tactique du nombre de tours et l'engagement face à une cible mobile. Un coup raté dépense la charge ; un coup ordinaire ne reçoit pas ce renforcement. Aucun nouveau Hatsu n'est nécessaire.                                       |
| **[Franklin](https://hunterxhunter.fandom.com/wiki/Franklin_Bordeau)**         | Enchères de Yorknew ; fusillade du requiem.                                                  | La rafale émet déjà des projectiles successifs depuis les dix doigts. À vérifier : balayage, couverture de plusieurs axes et changement de cible dans les scènes à plusieurs ennemis. Tester les vrais couverts et l'arrêt de la cadence après interruption, sans transformer la rafale en dégât inévitable de zone.                |
| **[Machi](https://hunterxhunter.fandom.com/wiki/Machi_Komacine)**              | Bêtes de l'Ombre ; capture de Gon et Killua ; marionnettes avec Nobunaga dans Phantom Rouge. | Les liens, le suivi et la suture existent sous une forme simplifiée. Leur donner des points d'attache et une résistance liée à leur état. Le film apporte des références de mise en scène ; il ne suffit pas à justifier un nouveau pouvoir de fils.                                                                                |
| **[Illumi](https://hunterxhunter.fandom.com/wiki/Illumi_Zoldyck)**             | Cibles de l'examen ; opération des Dix Doyens ; poursuite du convoi et Needle People.        | Existant : aiguilles matérielles, implantation et déguisement physique. Auditer séparément les ordres aux Needle People, le contrôle des cadavres et le conditionnement montré chez Killua. Ces effets ne deviennent pas une unique paralysie temporaire. Les aiguilles ordinaires n'implantent pas automatiquement le contrôle.    |
| **[Bonolenov](https://hunterxhunter.fandom.com/wiki/Bonolenov_Ndongo)**        | Fourmi au pistolet ; Lynch et Zakuro ; Lynch sous une deuxième apparence.                    | Existant : Prologue, lance, Jupiter et Metamorphosen avec temps appris. La sélection de forme est liée à l'adversaire actuel. Étendre aux modèles réellement rencontrés en scénario pour reproduire Hisoka puis Zakuro puis Lynch. Une apparence ne donne ni leur Nen ni leurs souvenirs.                                           |
| **[Shizuku](https://hunterxhunter.fandom.com/wiki/Shizuku_Murasaki)**          | Baise et Ivlenkov aux enchères ; requiem ; Pike.                                             | Blinky traite déjà objets matériels, commandes et plaies ouvertes. Auditer le retrait des preuves, le dernier objet restituable et la fermeture des plaies. Tester qu'un pansement réel interrompt le drainage concerné, tandis qu'une personne vivante ou une création de Nen n'est pas aspirée comme un objet ordinaire.          |
| **[Hinrigh](https://hunterxhunter.fandom.com/wiki/Hinrigh_Biganduffno)**       | Soldats royaux ; Padaille, Quorolle et Tevelares ; planque Heil-Ly avec Nobunaga.            | Élargir les menottes-oiseaux aux armes, à la caméra et au traceur. L'infiltration fournit des applications aussi importantes que les coups. Toucher un équipement, préserver sa fonction et perdre un objet réellement détruit doivent avoir des conséquences.                                                                      |
| **[Leorio](https://hunterxhunter.fandom.com/wiki/Leorio_Paradinight)**         | Hisoka dans les marais ; Tonpa et Sommy ; poing contre Ging ; Shura dans The Last Mission.   | Le poing actuel voyage par une surface et vise un point. Étendre les supports seulement avec une géométrie connectée et rendre lisible la sortie du poing. Les frappes multiples et déductions médicales montrées par Ging ne deviennent pas automatiquement des capacités démontrées par Leorio.                                   |
| **[Hanzo](https://hunterxhunter.fandom.com/wiki/Hanzo)**                       | Gon ; Pokkle, résultat rapporté ; assassinat de Tuffdy montré.                               | Le double et le corps endormi existent déjà. Vérifier traversée d'obstacle, étranglement et exposition du corps laissé derrière. Test décisif : toucher ou appeler ce corps rappelle réellement Hanzo. Ne pas inventer Hanzo Skill 1, 2 ou 3 pour remplir les emplacements de coups.                                                |
| **[Zakuro](https://hunterxhunter.fandom.com/wiki/Zakuro_Custard)**             | Bille ; Bonolenov sous l'apparence d'Hisoka avec Lynch.                                      | Bloody Mary gère déjà plaie ouverte, sang limité, perfusion, capture, projection, éclaireurs et rappel. Une blessure subie peut satisfaire l'ouverture : ne pas imposer une seconde automutilation. Auditer endurance des gouttes, information effectivement vue et conservation du sang après retour.                              |
| **[Camilla](https://hunterxhunter.fandom.com/wiki/Camilla_Hui_Guo_Rou)**       | Opération Musse puis gardes et Benjamin ch. 373 ; Benjamin ch. 416, opération distincte.     | Le chat post-mortem et le pistolet existent. Auditer l'attribution de la cause de mort et les situations sans assassin vivant identifiable. Le dilemme biologique évoqué ch. 416 est une question posée par Benjamin, pas une réponse canonique qui permet de programmer un contre garanti.                                         |
| **[Halkenburg](https://hunterxhunter.fandom.com/wiki/Halkenburg_Hui_Guo_Rou)** | Shikaku ; Vict ; Balsamilco.                                                                 | Remplacer la courte immobilisation par le transfert réel de conscience ; conserver consentement, marque et volonté commune. Les conséquences de la mort de son corps et du sommeil du corps hôte exigent des états persistants. Les applications de protection relèvent aussi du groupe présent.                                    |
| **[Lynch](https://hunterxhunter.fandom.com/wiki/Lynch_Fullbokko)**             | Perigord ; Hanal ; Bonolenov sous deux apparences.                                           | Existant : question audible, cible consciente et information privée. Vérifier l'identité réelle sous déguisement et l'incapacité après un coup trop fort. La réponse vient de ce que connaît la cible ; elle ne révèle pas automatiquement les secrets qu'elle ignore et ne doit pas être diffusée à Zakuro.                        |
| **[Luini](https://hunterxhunter.fandom.com/wiki/Luini)**                       | Meurtres des gardes de l'entrepôt Cha-R ; confrontation mortelle contre Nobunaga.            | Les conditions spatiales sont déjà implémentées. Ajouter sélection des sorties et passage partiel vulnérable. Les victimes trouvées après coup apportent moins de chorégraphie que la sortie surprise montrée ; elles ne justifient ni portail offensif à distance ni corps intangible.                                             |

Les extensions des ch. 416–420 sont à rapprocher des synopsis de
[416](https://black-whale-nexus.sarbast.dev/chapters/416),
[419](https://black-whale-nexus.sarbast.dev/chapters/419) et
[420](https://black-whale-nexus.sarbast.dev/chapters/420).
Ces archives sont des analyses de fans ; l'[index officiel VIZ](https://www.viz.com/shonenjump/chapters/hunter-x-hunter?locale=en)
permet de retrouver l'édition. Une interprétation des règles de recharge, de la
transmission héréditaire ou d'une mort prédite doit rester identifiée comme telle
tant que la formulation exacte du passage n'est pas rapprochée de sa mécanique.

## Kalluto et les scènes collectives

[Kalluto](https://hunterxhunter.fandom.com/wiki/Kalluto_Zoldyck) dispose du duel
contre Longhorn Beetle, participe à l'opération des Dix Doyens et au combat
collectif contre les habitants transformés. Il entre dans un lot de personnages
ayant plusieurs interventions, mais son deuxième corpus ne fournit pas autant
d'actions individuelles qu'un second duel détaillé.

Il peut rejoindre la passe de validation : confettis déposés sur des parties du
corps, attaque dirigée vers ces marques, éventail et écoute par poupée. Ces usages
existent déjà dans [Kalluto Paper](../apps/web/src/lib/fighting/kallutoPaper.ts)
et [Listening](../apps/web/src/lib/fighting/kallutoListening.ts). L'écoute transmet
des paroles prononcées près de la cible marquée ; elle ne lit pas les pensées.
L'opération des Dix Doyens ne permet pas de lui attribuer les techniques d'Illumi.

## Livraison et validation par personnage

Chaque fiche d'application doit associer une scène précise, l'action observée,
ses ressources, ses conditions, la commande, le rendu et un résultat vérifiable.
Le [contrat actuel](../apps/web/src/lib/fighting/techniqueContracts.ts) distingue
preuve manga et abstraction de jeu ; le compléter avec la provenance de l'œuvre,
du chapitre ou de l'épisode et un statut distinct pour les films. Séparer les
valeurs de duel de ces preuves : coût en aura, durée de préparation et dégâts
ne deviennent pas des nombres du manga.

L'ordre recommandé est Hinrigh, Chrollo, Machi et Luini pour les interactions
matérielles, puis Kurapika et Halkenburg pour les tiers et la conscience.
Bonolenov et Illumi suivent avec la sélection des modèles et des sujets contrôlés.
Les douze autres personnages passent ensuite par les situations de validation
du tableau ; une application déjà correcte est conservée.

Une livraison comprend la commande accessible aux deux joueurs, l'IA limitée à
ses informations, le rendu de la même action et les interactions avec vol,
emprunt, Zetsu et interruption. Les tests doivent couvrir une réussite, un refus
de condition et une interruption ayant des conséquences matérielles. Vérifier
la confidentialité PvP et la reconstruction déterministe des replays dès qu'un
effet transmet une information ou change le contrôle d'un corps.

Les cinématiques de vingt secondes pourront ensuite assembler ces actions
attestées. Elles doivent respecter l'état du combat : Hinrigh ne fait tirer
qu'une arme réellement présente, Chrollo n'utilise que les antennes disponibles
et Feitan ne produit pas une variante inconnue de Pain Packer pour varier sa fin.
