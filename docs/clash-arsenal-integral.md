# Clash — arsenal intégral et usage du Nen

## Exigence retenue le 17 novembre 2026

Les quarante personnages doivent avoir accès à toutes leurs techniques attestées,
à leurs applications et aux techniques de Nen qu'ils maîtrisent. L'IA doit savoir
préparer et utiliser ces actions ; la simple présence d'un coup dans un catalogue
ne suffit pas. Les fonctions de soutien, surveillance, transformation, déplacement,
soin, contrat et Nen post-mortem font partie du périmètre.

Deux décisions explicites de l'utilisateur s'appliquent :

- **Le On reste présent et utilisable**, avec ses commandes et son IA existantes.
  Cette exception demandée n'autorise pas l'invention d'autres pouvoirs.
- **L'arsenal est rétrospectif** : les techniques montrées à différentes époques
  doivent être disponibles, même acquises ou perdues entre-temps. La disponibilité
  historique élargie ne supprime pas leurs conditions d'exécution.

Un coût numérique de duel peut être réglé. Une obligation de contact, une ressource
matérielle, un serment, un consentement, une cause de décès, une durée explicitement
canonique ou une différence entre apparence et corps ne devient pas facultative.
Une condition inconnue reste inconnue. Les aptitudes non révélées ne sont pas
complétées par un pouvoir inventé.

## Passe livrée : utilisation des capacités existantes

`arsenalAiFirst.ts` et `arsenalAiSecond.ts` donnent un plan explicite à chacun des
quarante combattants. `arsenalAi.ts` ajoute des alternatives martiales ;
`movesetAi.ts` vérifie portée et admission avant de retenir une commande. Les
plans ne fournissent aucune ressource, blessure, page, signature ou cible manquante.
Les réponses aux menaces et aux habitudes observées restent prioritaires.

- Kurapika distingue soin utile, Chain Jail admissible, drainage, chargement de
  Dolphin, Judgment et gestion d'Emperor Time. L'IA ne réserve plus l'activation
  d'Emperor Time aux seuls PV bas et peut l'arrêter entre deux applications.
- Hisoka utilise traction et rebond sur sa liaison réelle. Chrollo referme le
  livre et utilise la Lune après le Soleil, plutôt que de recommencer le Soleil.
- Saiyu choisit les singes correspondant aux sens encore disponibles. Machi
  distingue suture, pistage, ligature et engagement final. Biscuit révèle son corps
  naturel sans coût d'aura avant ses attaques propres à cette forme.
- Bonolenov utilise Prologue, lance, Jupiter et un modèle réellement appris pour
  Metamorphosen. Zakuro peut déployer ses gouttes de surveillance puis rappeler son
  sang avant une nouvelle prise. Padaille utilise les trois outils montrés.
- Les plans de soutien et de surveillance tentent leurs commandes préparées ;
  Camilla conserve son déclenchement à la mort, Beyond ses coups physiques en
  l'absence de sacrifice et Theta son Hatsu personnel inconnu.
- `arsenalAiAction.ts` ajoute l'usage des armes à distance déjà représentées.
  `arsenalAiNen.ts` utilise In et Ko dans les cas retenus : même surcoût, même
  engagement et mêmes zones corporelles exposées que pour un joueur. Aucun futur
  privé ni commande cachée n'est utilisé pour reconnaître une ouverture.

`arsenalAi.test.ts` vérifie les quarante plans, les coûts et conditions par le
chemin réel du moteur, les ressources absentes, les trois singes, les outils,
les liens et Soleil/Lune. `arsenalAiNen.test.ts` vérifie In, Ko, la perception,
le refus sous Zetsu et la conservation explicite du On. Les imports d'un plan
avant le moteur restent testés : le hook de Predator est résolu à l'appel.

La première passe portait le ruleset à `clash-combat-8` : les décisions de l'IA font partie de la
simulation des replays. Les enregistrements d'un ruleset précédent sont refusés
plutôt que rejoués avec des décisions différentes. Le protocole PvP reprend
automatiquement cette version depuis `REPLAY_RULESET`.

## Extension jouable du 17 novembre 2026

Les commandes supplémentaires sont accessibles dans le panneau Techniques et
préparations, pour chacun des deux joueurs locaux et par le protocole PvP
validé côté arbitre. Les choix sont enregistrés par le mécanisme de replay du
panneau. La préparation ne fournit ni consentement ni équipement manquant.

- **Biscuit : Cookie** est une invocation de soutien distincte du corps naturel.
  Massage progressif de la fatigue, consentement pour autrui, traitement
  interruptible, et Piano Massage après **30 minutes de sommeil simulé**. Aucun
  dégât, soin de plaie ou transformation corporelle n'est associé au traitement.
  Cookie est volable séparément ; Dolphin consomme un seul traitement et reste
  chargé jusqu'à la fin de son effet.
- **Skill Hunter : acquisition** vérifie l'observation visuelle du Hatsu,
  l'entretien avec réponse audible et le contact de la paume sur la couverture,
  dans une heure simulée. Le contact offensif vise les mains et ne blesse pas.
  La victime perd le Hatsu concerné, sans perdre tout son Nen ou ses autres Hatsu.
- **Pages historiques :** Gallery Fake produit une copie inerte, sans pouvoir,
  avec deux mains libres et une durée de 24 heures. Order Stamp exige une copie
  humanoïde avec tête attachée et un ordre vocal ; la destruction de la tête
  arrête le contrôle. Les marques Sun/Moon maintiennent les copies après la
  fermeture de leur page. Convert Hands change l'apparence et préserve le corps,
  l'identité et les pouvoirs. Fun Fun Cloth enveloppe et restitue intact ; son
  contact et celui de Convert Hands ont une préparation interruptible. Indoor
  Fish requiert une pièce close et diffère les blessures jusqu'à disparition.
  La téléportation reprend l'application montrée sur autrui ; ses conditions
  complètes restent inconnues.
- **Love Dial 6700 :** saisie d'un profil de Nen, numéro conjuré, appel et
  indication privée de présence ou de coordonnées. Le quota quotidien existe
  dans le manga, mais **sa valeur n'est pas révélée**. Deux appels par jour et
  les seuils de localisation sont des réglages du scénario, jamais des nombres
  présentés comme canoniques.
- **Applications copiées :** une page acquise conserve l'identité de son Hatsu.
  Le panneau propose ses différentes commandes, avec leurs conditions natives.
  Bungee Gum donne accès à traction et rebond ; Texture Surprise reste séparé.
  Le changement de page interrompt les effets qui ne sont plus maintenus.
  Les corps, flûtes, aiguilles, munitions et réserves biologiques ne sont pas copiés.
  Dolphin propose également les applications admissibles du Hatsu chargé.
- **Hisoka :** colmatage des plaies sans restauration des PV ; interception
  préparée d'un projectile matériel puis renvoi du même objet. La force reçue
  peut blesser les mains. Aucune balle de Nen n'est absorbée automatiquement.
- **Longhi :** la sanction compte une semaine entière de simulation, y compris
  le hitstop, et conserve le temps restant entre les manches. La trêve de cinq
  secondes reste un contrat de scénario explicitement expliqué.

L'IA emploie Cookie dans une ouverture de récupération, prépare les copies,
les poissons ou le tissu quand le contexte le permet, et réutilise le plan du
Hatsu d'origine pour les commandes d'une page acquise. Elle prépare également
les interceptions physiques et les pansements d'Hisoka. Elle ne produit jamais
la réponse d'un joueur humain à l'entretien de Skill Hunter.

Les tests `cookie`, `skillHunterAcquisition`, `chrolloHistorical`,
`chrolloCopiedArsenal`, `hisokaArsenal` et `retrospectiveIntegration` couvrent
l'exécution, les pertes d'accès, les durées et les limites de confidentialité.
Les timestamps d'observation sont exclus des effets maintenus de Dolphin.

## Judgment Chain : clauses indépendantes et communication réelle

Les deux interdictions montrées sur Chrollo sont sélectionnables séparément ou
ensemble avant implantation : ne pas utiliser le Nen, ne pas communiquer avec
les membres réels de la Brigade. Les clauses sont annoncées au démarrage du
coup, puis copiées dans le sceau au contact du cœur sous Emperor Time. Changer
la préparation suivante ne réécrit jamais une chaîne déjà implantée.
L'interdiction de communication seule laisse le Nen disponible.

Le jugement vérifie les activations volontaires de Nen par les commandes de
combat, Gyo, En, Shu, In et la répartition manuelle. Une transformation physique
de Biscuit ou une arme à feu ne devient pas du Nen. Un autre sceau qui rend le
Nen impossible ne crée pas une violation fictive. Kurapika peut retirer sa
propre chaîne sans réactiver Emperor Time ; il ne retire pas celle d'autrui.

Les paroles adressées à un combattant présent ou à un réserviste réel passent
par un canal commun : portée de voix, audition, sommeil, parole disponible et
esprit libre. Hisoka n'est pas compté comme membre véritable ; un déguisement
ne change pas l'appartenance. Recevoir passivement une parole ou être simplement
à proximité ne constitue pas une communication initiée. Les questions de Lynch,
les avertissements de Mizaistom, l'entretien de Skill Hunter et les signatures
ou refus de contrat participent à ce contrôle. L'IA s'abstient des réponses
interdites et prépare deux clauses quand une réserve de la Brigade est présente.

Les commandes sont enregistrables et validées par le protocole PvP, y compris
le destinataire en réserve pour P2. Les choix non annoncés et les paroles reçues
restent privés. Une mort provoquée entre deux frames élimine bien le corps réel
avant la manche d'équipe suivante. Le ruleset de cette extension est **clash-combat-18**.
Les clauses de secret et de libération d'otages restent à réaliser ; cette passe
ne constitue pas une certification de toutes les applications de Judgment.

## Dowsing Chain : dépistage en face-à-face

Le panneau donne accès à trois questions : identité, état actuel du Nen et In.
Chaque joueur choisit sa propre réponse sincère ou son mensonge conscient.
Le silence ne produit aucun verdict. Le pendule indique le mensonge de la
réponse délibérément prononcée, sans restituer à sa place la vérité cachée.
Les paroles libres ne sont pas classées par une expression régulière ou une
comparaison omnisciente avec les données du combat. Le vocabulaire de questions
est encore limité à ces trois faits conscients représentés dans le duel.

Le dépistage ordinaire exige un sujet présent en face du regard de Kurapika,
une voix et une audition réelles. Il fonctionne sans Emperor Time. Perdre le
Nen, subir une interruption, fermer la page copiée ou rompre le face-à-face
interrompt le dépistage et retire la demande de réponse. Une lecture acquise
reste une information passée ; elle ne devient pas une sonde de l'état futur.
L'IA peut interroger et répondre pour son propre combattant ; elle ne fournit
jamais la réponse d'un joueur humain. Le On de l'interlocuteur reste utilisable.

Le modèle du pendule à l'annulaire est animé par les frames du dépistage.
In le cache à l'autre observateur ; Gyo rétablit sa visibilité. Les lectures
antérieures restent privées en PvP, et la perspective P2 traduit l'auteur de
la question. Les snapshots conservent le même résultat après restauration.
Le coût de trois points d'aura, la portée de voix et l'animation d'une seconde
et demie sont des réglages de duel. Le ruleset devient **clash-combat-19**.

La localisation par radiesthésie et les questions fondées sur d'autres souvenirs
restent à réaliser. Cette passe ne certifie donc pas l'intégralité de Dowsing Chain.
La distinction entre mensonge conscient et connaissance objective est recoupée
avec la description de [Kurapika](https://hunterxhunter.fandom.com/wiki/Kurapika),
notamment les chapitres 348 et 371 ; les synthèses ne remplacent pas les planches.

## Biohazard : caméra, arme et émetteur physiques

Le scénario peut fournir une caméra, une arme à six balles, un émetteur et son
récepteur à chaque camp. Ces stocks sont des réglages de préparation, jamais
une création d'objets par Biohazard. Le contact initial immobilise réellement
le corps et s'interrompt sur une perte de contact ou une incapacité.

- La caméra devient un chat mobile en conservant l'enregistrement. Elle capte
  seulement les corps visibles et les paroles audibles à sa position. Le chat
  revient sur ordre ; la lecture exige de retrouver physiquement la caméra.
  Aucune transmission vidéo à distance ni connaissance de l'intention d'autrui
  n'est donnée par une simple lecture.
- L'arme conserve son stock réel et sa trajectoire de balle. Son canon-serpent
  peut retourner le tir contre le porteur réel de l'arme. Ni la transformation
  ni une commande de tir ne recréent de munitions.
- L'émetteur devient une huître que son porteur avale et ressort à sa propre
  position. La forme dispose d'environ **deux heures simulées** ; le signal
  conserve sa batterie et son canal. Le récepteur produit une consultation
  datée, jamais une position automatiquement mise à jour. L'expiration de l'aura
  laisse l'objet physique là où il se trouve, y compris dans le corps.

Les mains, la main droite du livre ouvert, les membres réels d'une équipe, les
impacts sur le matériel et les interruptions sont pris en compte. Les copies
et Dolphin exigent les mêmes objets ; Dolphin consomme son usage et demeure
chargé tant que la transformation subsiste. Le matériel peut être endommagé.
L'IA rejoint les appareils par la marche ordinaire et utilise les trois formes.
Les enregistrements bruts restent privés côté arbitre en PvP ; seule une lecture
autorisée transmet son contenu au lecteur. Les replays conservent les appareils,
les stocks, les déplacements et les consultations. Le ruleset devient
**clash-combat-20** ; le On et les armes ordinaires restent disponibles.

La portée des capteurs, les batteries, les PV du matériel, le temps de contact,
le coût d'aura et la durée des formes autres que l'huître sont des réglages du
scénario. La valeur du quota journalier de Biohazard et une formule canonique
reliant masse et aura ne sont pas connues : aucun nombre n'est inventé comme
condition du manga. Les usages sont recoupés avec la synthèse de
[Hinrigh](https://hunterxhunter.fandom.com/wiki/Hinrigh_Biganduffno).
Les couteaux et le budget complet de matériel de Hinrigh restent à auditer.

## Dowsing Chain : analyse d'une véritable vidéo

Kurapika peut analyser un extrait effectivement enregistré et lu sur la caméra,
sous **Emperor Time**, après avoir rencontré la personne. La rencontre est
constatée dans la simulation par un face-à-face visible ; elle n'est jamais
accordée par le choix d'un personnage dans le menu. Cette mémoire reste acquise
entre les manches et appartient au corps réel d'un membre d'équipe. La portée
de reconnaissance de dix-huit unités est un réglage du duel.

Chaque joueur peut déclarer sincèrement ou mentir consciemment sur les trois
faits déjà représentés (identité, état du Nen, In). Il garde seul le contrôle
de sa déclaration. Le canal de voix existant vérifie parole, esprit libre et
interdictions de communication. Une caméra doit réellement capter son visage
et sa voix ; le support conserve chaque prise séparément, même pour des mots
identiques prononcés dans une seule frame.

Une lecture ordinaire révèle les images et les paroles, sans intention cachée.
Dowsing analyse la prise sélectionnée, conserve son résultat daté et ne consulte
pas le Nen actuel ou les pensées de la personne filmée. Un texte libre dont
l'intention n'est pas représentée donne un résultat **indéterminé**, jamais une
certification de sincérité. La perte de la caméra, de la vue, de l'audition ou
d'Emperor Time termine la concentration. Les frais de vie d'Emperor Time restent
comptés par l'horloge réelle ; les trois points d'aura sont un réglage du duel.

Les commandes, la sélection d'extrait et les résultats sont reproductibles après
snapshot et en PvP, y compris pour P2. La disponibilité des boutons ne révèle
pas l'intention cachée. Les rencontres, les analyses et les réponses restent
privées pour l'adversaire. L'IA analyse ses enregistrements admissibles sans
fabriquer de réponse humaine et passe aux prises qu'elle n'a pas encore étudiées.
Le ruleset devient **clash-combat-21**. Le On reste disponible, y compris pour
une déclaration volontaire ; l'analyse vidéo n'accorde pas Emperor Time à un
simple voleur de la chaîne.

Cette extension reprend l'usage vidéo du chapitre 348, recoupé avec
[Kurapika](https://hunterxhunter.fandom.com/wiki/Kurapika). Elle ne fournit pas
une base de connaissances universelle pour déterminer le vrai dans une phrase
libre ; les autres sujets conscients et la radiesthésie restent à représenter.

## Basho : trois compositions attestées et supports matériels

Great Hiker propose désormais les trois effets montrés aux chapitres 68, 402 et
404 : embraser ce que frappe le poing, brûler mortellement une personne qui ment
sciemment en réponse à ses questions, et écarter les faibles esprits avec un
papier protecteur. Les textes FR/EN sont des adaptations de leur sens ; aucune
phrase libre ne devient un souhait et aucune formule de qualité littéraire
n'est inventée. Référence de recoupement :
[Basho](https://hunterxhunter.fandom.com/wiki/Basho).

Le pinceau, l'encre et les feuilles sont un équipement physique. Basho commence
avec son matériel ; copier ou emprunter Great Hiker ne le fournit pas. Une
réserve présente dans la préparation scénarisée peut être ramassée et déposée
sans dupliquer son stock. Écrire occupe les deux mains, consomme une feuille dès
le début et reste interruptible. Un livre ouvert et un appareil tenu occupent
réellement leurs mains. Les compositions terminées restent distinctes : écrire
le poème contre les mensonges ne transforme pas ce papier en poème du poing.
Une copie matérielle par Gallery Fake suit la disparition de son support et ne
reproduit ni pouvoir actif ni marque Sun and Moon de l'original.

Le poème contre les mensonges demande une question audible et une réponse
volontaire à cette question. Les sujets actuellement représentés sont
l'identité, la disponibilité du Nen et l'usage de In. Une réponse sciemment
mensongère déclenche un décès par le feu, y compris dans un format aux points,
avec la bonne attribution pour les pouvoirs post-mortem. Le silence, une réponse
sincère ou du texte libre non interprété ne déclenchent rien. Une déclaration
structurée ne permet pas de contourner une question en cours.

Le talisman exige une bande réellement écrite et un contact physique. Sa pose
sur autrui est coopérative dans ce scénario ; ce choix ne crée pas un serment de
consentement du Nen. Il repousse les faibles esprits effectivement présents,
sans soin ni suppression d'une malédiction puissante. Un esprit suit le corps
visé, même lorsqu'un relais d'équipe change le combattant actif. Le papier reste
visible après la fin de son effet ; la disparition d'un support matérialisé le
retire réellement.

Les trois feuilles initiales, la seconde d'écriture, les 25 points d'aura, les
brûlures de contact et la minute du talisman sont des **réglages de duel**, pas
des quotas ou durées canoniques. L'IA utilise le matériel présent, les papiers
utiles et les questions sans fabriquer de réponse adverse. Les modèles visuels
réemploient le papier et le pinceau existants. Le PvP, les snapshots et l'import
complet des replays acceptent les dix ressources de préparation ; le test
d'export/import couvre également les appareils ajoutés précédemment. Le ruleset
est **clash-combat-22**. Le On demeure disponible et n'empêche pas de manipuler
un équipement ordinaire ; il ne donne pas accès à Great Hiker.

Cette extension rend les trois effets accessibles. Elle ne fournit pas une
compréhension universelle des mensonges en langage libre, ni une notation
littéraire des poèmes, ni un exorcisme universel.

## Emperor Time pendant une séquence post-mortem

La séquence de Cat's Name suspend le combat, mais le temps réellement vécu par
Kurapika continue de coûter sa vie si Emperor Time est actif. Le coût avance
sur les frames simulées jusqu'à sa mort effective ; ni un Dolphin encore chargé
ni un évanouissement ne créent un Emperor Time post-mortem. Le seuil de trois
heures et les neuf heures d'inconscience restent inchangés. Les tests couvrent
les deux côtés, la limite d'évanouissement et la re-simulation d'un replay.
Le ruleset passe à **clash-combat-23**. Le On est conservé.

## Hanzo : parole du double et corps séparé

Le double de Hanzo peut parler et écouter près de sa propre position, comme dans
l'échange avec Tuffdy au chapitre 372. L'interdiction générale de parole pendant
Skill 4 est retirée une fois sa préparation terminée. Une conversation près du
double ne déplace pas le corps endormi ; interpeller ce corps reste une action
distincte qui interrompt la projection. Les privations de parole, le sommeil et
la perte d'autonomie restent exécutés. Recoupement :
[Hanzo](https://hunterxhunter.fandom.com/wiki/Hanzo).

Le papier d'écoute de Kalluto reste planté sur le corps physique et ne reçoit pas
une voix émise à distance par le double. Les caméras enregistrent chaque corps
visible à sa position et captent la voix là où elle est émise. Une prise du
double n'est pas attribuée automatiquement au corps physique pour l'analyse de
Dowsing Chain : aucun lien d'identité authentifié n'est fabriqué. Les tests
couvrent les deux côtés, le rappel du corps, la parole empêchée, l'écoute par
papier, la caméra et les snapshots. Le ruleset devient **clash-combat-24**.
Cette correction n'invente aucun des autres skills numérotés non révélés.
Le On est conservé.

## Gallery Fake : repérage et En des copies

Le contact avec l'original permet désormais de relever les positions de ses
copies. L'utilisateur doit garder la main gauche au contact et Gallery Fake
actif ; le livre peut occuper sa main droite. Tenir l'original dans la main gauche
est un contact valable, sans exiger une troisième main. Le comportement reprend
le repérage des yeux au chapitre 109, recoupé avec
[Kortopi](https://hunterxhunter.fandom.com/wiki/Kortopi) et
[le résumé du chapitre 109](https://hunterxhunter.fandom.com/wiki/Chapter_109).

Le relevé distingue chaque copie réellement présente et les contacts à
l'intérieur de son volume. Une pièce copiée utilise son intérieur, sans devenir
une caisse pleine. Aucun rayon distant universel, identité mentale ou réserve
d'aura de la cible n'est révélé. Les dimensions sont les conventions du décor
de duel. Un appareil transporté suit les mains du porteur réel ; le matériel
d'écriture ramassé suit son corps. Un original humain reste lié au membre
réellement copié après un relais, plutôt qu'à la place active de son équipe.
Le repérage s'interrompt si le contact ou le pouvoir manque. La dernière
observation reste datée, sans mise à jour cachée après interruption.

Les résultats sont privés, l'interface P2 remappe correctement le corps
original et l'IA peut établir le contact avec un original disponible. Un contact
réel détecté dans une copie peut informer son déplacement même sans vision.
Un replay complet reproduit le suivi d'un appareil copié, ramassé puis transporté
par les commandes ordinaires.

La fabrication des copies conserve les propriétés matérielles représentées,
sans recopier les volontés, panaches de soutien, contrôleurs, ancrages ou visites
personnelles. Une fausse Morena ne remplace pas Morena et une fausse graine
n'est pas une cible vivante pour Erigeron. Les appareils suivent leurs collisions
propres ; ils ne deviennent pas des obstacles fixes à l'emplacement de leur
création lorsqu'ils sont portés. Les marques Sun and Moon ne sont pas dupliquées.
Les autres interactions matérielles non représentées restent à auditer.

Le contrôle des gestes est commun : Skill Hunter ne s'ouvre pas autour d'un
objet tenu à droite, Convert Hands vérifie la main qui touche, Fun Fun Cloth et
Gallery Fake exigent leurs deux mains, et Order Stamp demande une main disponible.
Toucher le corps endormi de Hanzo le réveille réellement. Le ruleset devient
**clash-combat-25**. Le On est conservé ; il n'accorde pas le repérage de Gallery Fake.

## Copies transportées et parties détachées

Ramasser une flûte ou des aiguilles copiées conserve maintenant leur provenance
matérielle. Le ramassage ne redémarre pas leur durée de vie et ne transforme pas
une copie en équipement permanent. Le contrôle s'applique aussi aux membres en
réserve et empêche de convertir des aiguilles matérialisées en stock réel lors
d'une nouvelle manche. Un équipement réel déjà possédé n'est pas remplacé par
une copie ramassée.

La modélisation distingue l'objet entier d'une pièce qui en est déjà séparée :
endommager l'arme ne transmet pas rétroactivement des dégâts à une balle déjà
tirée, ni détruire le matériel d'écriture à une feuille déjà écrite. Ces parties
conservent la durée et les conditions d'existence de leur copie d'origine. Les
balles et aiguilles lancées, papiers archivés, talismans et aiguilles implantées
ne deviennent pas permanents après séparation. Les marques réellement posées
restent distinctes des marques de l'objet dont on a seulement copié l'apparence.

La perte d'une flûte copiée arrête immédiatement la musique et sa pacification.
La disparition d'une aiguille de contrôle n'efface pas la lésion cérébrale déjà
représentée. Le matériel disparaît aussi pendant le hitstop ou si son créateur
meurt au cours de Cat's Name, sans faire avancer des attaques de marionnettes
pendant cette séquence. La vérification intervient à la fin de la frame réelle
et dans ses prévisions, avant de permettre l'usage suivant.

Bungee Gum reconnaît les objets physiques matérialisés sans les confondre avec
un faisceau d'aura. Les forces transmises à ses mains restent prises en compte.
Un objet copié retenu par la gomme, ou stocké dans la représentation de Culdcept
du duel, conserve sa provenance ; le stockage ne rend pas sa matière éternelle.
Cette correction n'apporte aucune preuve supplémentaire sur les conditions
encore inconnues de Culdcept. Blinky conserve son interdiction des objets de Nen.

En PvP, les pages masquées ne sont pas traitées comme des pages inexistantes :
le client conserve le matériel effectivement fourni par l'arbitre sans révéler
le contenu du livre adverse. Les projections privées et les outils de replay
conservent la même distinction. Le ruleset devient **clash-combat-26** et le On
reste conservé.

## Black Voice : téléphone original, deux antennes et contrôle persistant

Le matériel du chargement rétrospectif est explicitement celui prêté par Shalnark :
un téléphone original associé à deux antennes réelles. Ces objets ne sont pas
conjurés par Skill Hunter. Ils peuvent être rangés, déposés, ramassés et perdus ;
le passage à la manche suivante ne recrée ni téléphone perdu ni antenne implantée.
Une copie Gallery Fake conserve l'apparence matérielle, sans copier le lien Nen
qui fait fonctionner Black Voice.

La main qui implante l'antenne et celle qui utilise le téléphone sont réellement
disponibles : le livre ouvert occupe toujours la droite. Le contact offensif est
résolu par le moteur ; le panneau permet aussi l'implantation au contact d'une
personne réelle dans la préparation. Aucun cadavre, copie inerte, double de Hanzo
ou sujet déjà contrôlé n'est transformé en cible vivante admissible.
Le téléphone associé donne ensuite les ordres d'arrêt, d'approche, de recul et
d'attaque. Les personnes préparées frappent avec leur propre corps ; le contrôle
ne leur donne aucun Hatsu personnel de Chrollo. Les vitesses et dégâts de ces
coups ordinaires restent des réglages de duel.

Le contrôle n'expire plus après 90 images : l'antenne reste implantée jusqu'à son
retrait physique et l'ordre continue après rangement du téléphone. Un autre
combattant libre peut la retirer au contact. Mort du sujet, mort du manipulateur
ou perte de la page interrompent le Nen, sans effacer l'objet implanté. Le téléphone
original est nécessaire pour changer un ordre ou consulter la vue du sujet.
Cette image ne montre que son champ visuel représenté, avec une portée de scénario ;
privation de la vue et yeux fermés donnent une image vide. Elle ne révèle pas
les pensées, les pages cachées ou les décisions futures. Le relevé reste daté et privé.

L'IA prend son téléphone après une implantation réussie puis donne un ordre.
Les références corporelles de P2, les ordres persistants, les observations privées,
les objets copiés et l'export/import complet d'un replay sont testés.
Le ruleset est **clash-combat-27**. Le **On est conservé**.
L'auto-manipulation est distincte de ces ordres ; son contexte exécutable est précisé ci-dessous.
Les références sont les chapitres 95–96, 227 et 351–357, recoupés avec
[Shalnark](https://hunterxhunter.fandom.com/wiki/Shalnark) et le
[récapitulatif du chapitre 351](https://hunterxhunter.fandom.com/wiki/Chapter_351).

## Auto-manipulation de Black Voice : mission, budget et conséquences

L'application montrée par Shalnark au chapitre 227 est accessible depuis la page
historique de Black Voice : sortir une des deux antennes originales, l'implanter
sur son propre corps, prendre le téléphone associé puis activer le mode. Aucun
matériel ou Nen supplémentaire n'est créé par cette séquence. Le contrôle de soi
ne commence qu'à l'activation effective du téléphone ; la simple présence de
l'antenne ne donne aucune protection préventive fictive.

Le corps agit ensuite de façon autonome contre le combattant réel qui était
visible à l'activation. Son identité corporelle et son indice d'équipe sont
conservés. Les frappes passent par les coups physiques ordinaires, leurs boîtes
de contact, les gardes et les dégâts du moteur ; aucune frappe n'applique par
commodité une autre page de Chrollo. Les obstacles restent solides. Le budget
d'aura est réellement dépensé, sans remplir la réserve pour représenter la hausse
de débit. Les projectiles matériels ordinaires ne reçoivent pas ce bonus.

Le joueur ne peut ni donner d'ordres, ni ranger les objets, ni tourner une page
pour annuler volontairement la mission. Une interruption forcée du Nen, un retrait
physique de l'antenne par autrui ou la défaite du corps visé interrompent le mode.
Le passage à une manche suivante après un arrêt du combat ne permet pas de le
réinitialiser : mission, page, antenne et réserve d'aura restent engagées.

Après la mission, les douleurs musculaires et la faiblesse durent **au moins deux
jours simulés** ; elles persistent entre les manches et le temps avance aussi
pendant le hitstop et Cat’s Name. Deux jours constituent le minimum retenu dans
ce scénario pour les plusieurs jours indiqués au chapitre 227, jamais une durée
canonique exacte. Les multiplicateurs de force et de mobilité, l'affaiblissement
et les coûts sont des réglages du duel. Cette application d'une capacité copiée
n'attribue pas à Chrollo une performance physique chiffrée montrée chez Shalnark.
Les habitudes observées, rencontres et paroles reçues pendant la mission ne sont
pas ajoutées à ses souvenirs conscients ; les enregistrements d'appareils externes
restent des objets indépendants.

Le contexte actuellement exécutable est **un duel K.-O. contre un seul ennemi
visible**, sans autre personne ennemie visible dans la préparation. Le format
aux points et une mission contre plusieurs ennemis ne sont pas représentés par
une condition Nen inventée : l'action y reste indisponible. Le cas à plusieurs
ennemis montré chez Shalnark reste donc à généraliser avant certification complète.
L'IA peut préparer les quatre étapes à partir de son propre matériel dans une
situation de danger. Les missions, leurs effets et leur budget se rejouent par
export/import complet. Le ruleset devient **clash-combat-28** ; le **On reste présent**.

## Écarts qui empêchent encore d'annoncer « 100 % »

Les extensions ci-dessus ne terminent pas tout l'arsenal rétrospectif. L'[audit des quarante
combattants](./audit-hatsu-fighting.md) conserve les limites par personnage.
Les écarts suivants restent ouverts et ne doivent pas être masqués par un taux
de couverture des profils ou un nombre de tests :

| Personnage | Extension ou correction encore nécessaire                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chrollo    | Lovely Ghostwriter reste à représenter avec identité manuscrite, impossibilité de prédire son propre avenir et un contexte de futur défini. Le repérage de Gallery Fake et le téléphone avec les deux antennes de Black Voice sont exécutables. L’auto-manipulation est exécutable en duel simple ; restent sa généralisation à plusieurs ennemis et l’audit des applications et contacts de Sun and Moon. |
| Hisoka     | Réseau de plusieurs liens simultanés, prothèses fonctionnelles et préparation post-mortem avec une véritable cause de mort admissible. L'interception et le colmatage sont désormais exécutables.                                                                                                                                                                                                          |
| Kurapika   | Ajouter les clauses de secret et de libération des otages de Judgment, la localisation et les autres questions de Dowsing Chain, puis achever les éditeurs spécialisés du prêt de Stealth Dolphin. Les applications de Little Eye et d’Erigeron sur Oito non éveillée sont représentées. Les chaînes ne doivent pas partager leurs restrictions par commodité.                                             |
| Halkenburg | Représenter la protection collective et les consciences au lieu de réduire la possession à un arrêt temporaire du combattant.                                                                                                                                                                                                                                                                              |

| Hinrigh | Caméra-chat, canon-serpent et huître-émetteur sont exécutables avec du matériel réel. Auditer encore les couteaux, le budget matériel et les interactions restantes avant de certifier l'intégralité. |
| Basho | Les trois effets attestés sont accessibles avec leur matériel. Les réponses conditionnelles portent sur les faits représentés ; aucun jugement automatique de texte libre ni score littéraire universel. |
| Beyond | Ajouter une préparation sacrificielle réelle et une cible déclarée avant de simuler sa malédiction. |
| Furykov | Représenter les travaux de déchiffrage et de fabrication dans un contexte où leur durée est réellement possible. |

Le contrôle des autres personnages doit également comparer leurs applications
attestées, leurs contreparties et les commandes effectivement accessibles.
Un pouvoir partiellement connu ne peut pas recevoir une certification exhaustive.

Une technique est terminée lorsque son entrée joueur est accessible, ses conditions
sont exécutées, son effet et ses interruptions sont visibles, l'IA peut préparer
et employer son usage utile, et les copies, resets, prévisions et replays gardent
le même comportement. Une simple déclaration dans `NEN_CANON` ne valide pas ce point.

## Références vérifiées et limites de la vérification

Les chapitres 68, 95–106, 117–119, 123, 149, 351–357, 388, 401–406 sont les points de
référence pour ces extensions. L'[index officiel VIZ](https://www.viz.com/shonenjump/chapters/hunter-x-hunter?locale=en)
ne fournit pas toutes les planches en accès libre. Les synthèses de
[Chrollo](https://hunterxhunter.fandom.com/wiki/Chrollo_Lucilfer),
[Neon](https://hunterxhunter.fandom.com/wiki/Neon_Nostrade),
[Hisoka](https://hunterxhunter.fandom.com/wiki/Hisoka_Morow) et
[Longhi](https://hunterxhunter.fandom.com/wiki/Longhi) ont servi à recouper les
conditions ; elles ne remplacent pas une relecture intégrale des planches.
Le périmètre publié a également été vérifié jusqu'au [chapitre 420 sur VIZ](https://www.viz.com/shonenjump/hunter-x-hunter-chapter-420/chapter/51204), publié le 6 septembre 2026. Les manuscrits annoncés au-delà ne sont pas traités comme des chapitres publiés. Cette vérification de publication ne certifie pas à elle seule la couverture de chaque nouvelle technique.
Les poèmes apocryphes de `data/prophecies` ne servent jamais de prophéties
canoniques ou de prédictions d'une décision humaine future.

## Références corporelles : aucun membre fictif

Une référence à un membre inexistant d'une équipe ne désigne jamais par défaut
le combattant actif. Le contrôle vérifie l'existence du corps réel avant le
contact et avant tout rattachement. En duel sans équipe, seuls les indices zéro
correspondent à un corps présent. Ce contrôle empêche notamment de contourner
l'auto-manipulation en implantant une antenne sur un faux réserviste de son propre
camp. Le correctif porte le ruleset courant à **clash-combat-29**.

## Steal Chain : réserve réelle du donneur

Le contact effectif de la seringue impose désormais Zetsu pendant le drainage,
avant même que la réserve soit vide. La victime conserve ses actions physiques ;
un simple coup reçu par Kurapika ne détache pas automatiquement une seringue
encore reliée. La perte de portée ou du Nen nécessaire interrompt le prélèvement.

Chaque capacité réellement prélevée conserve la quantité d'aura effectivement
retirée, le corps du donneur et ses rendements de catégories au prélèvement.
Dolphin utilise ce stock pour l'activation et l'entretien des effets empruntés ;
le repos du porteur ne le remplit pas. Le bonus d'Emperor Time de Kurapika ne
remplace pas les rendements du donneur. La réserve personnelle du porteur reste
séparée, et aucun canal temporaire d'exécution ne subsiste dans l'état enregistré.
Un stock insuffisant refuse l'activation, même si le porteur dispose d'aura.
Le retour de la capacité vise le membre réellement volé, pas son remplaçant actif.

Cette correction porte le ruleset à **clash-combat-30**. Les coûts chiffrés restent
ceux du duel. Le prêt à un tiers réel reste un chantier ouvert ; cette passe ne
certifie pas l'arsenal intégral. Le On reste disponible.

Références : chapitres 361, 364, 369 et 388. Le maintien de Dolphin pendant le
sommeil de Kurapika et d'Oito doit rester distinct d'une nouvelle commande
volontaire pendant leur inconscience.

## Stealth Dolphin : prêt à un corps réel

Le panneau propose une injection de Dolphin chargé et inutilisé vers les corps
réels au contact, y compris les alliés qui attendent à leur portail. La main
droite doit être disponible. Une référence à un membre inexistant ou une cible
hors de portée ne crée ni destinataire ni dispositif. La portée chiffrée reste
un réglage de duel. Le transfert conserve l'unique capacité, son stock volé et
ses conditions ; il ne donne ni les autres Hatsu du donneur, ni son matériel.

Le prêt libère le stockage de Steal Chain. Kurapika peut conserver une seconde
capacité non chargée pendant que le premier Dolphin est prêté. Il ne peut pas
lever Emperor Time ni rééquiper ce Dolphin avant la résolution du prêt.
L'échéancier d'Emperor Time avance aussi lorsque son corps attend en réserve.
Le destinataire commande sa propre application dans le panneau ; les commandes
Dolphin n'émettent pas artificiellement de paroles audibles.

Le destinataire garde son identité, sa réserve personnelle et son propre Nen.
Son canal d'exécution emprunté est temporaire : aucun état d'Emperor Time ne lui
est enregistré. L'aura et les rendements restent ceux du donneur. Cookie et les
commandes utilitaires admises sont explicitement étiquetés « Dolphin prêté ».
L'IA destinataire utilise les mêmes chemins d'admission et les mêmes ressources.

L'inconscience de Kurapika est liée au destinataire. Une application déjà active
reste entretenue ; l'inconscience interdit de donner un nouvel ordre. La fenêtre
de trois heures suivie de neuf heures de sommeil reprend le cas observé avec
Little Eye aux chapitres 364 et 369 ; sa généralisation n'est pas une durée
universelle affirmée pour toutes les capacités dans le manga. Le Dolphin visible
uniquement par son porteur reste affiché durant cette inconscience.

Une fois l'application terminée, le destinataire peut demander la fin du prêt,
y compris avec un stock volé épuisé. Le Hatsu revient au corps du donneur et le
verrou de Kurapika est levé. Le passage de manche conserve un prêt encore chargé,
son stock, le corps lié et les horloges : il ne fournit pas un retrait gratuit.
Le changement d'équipier d'un porteur déjà en cours d'application reste bloqué
pour éviter de suspendre ses effets hors scène.

**Reste à terminer :** les destinataires initialement non éveillés et leur
initiation, les éditeurs spécialisés qui vivent hors des commandes d'arsenal
(hors composition de Basho, désormais achevée), ainsi que le masquage réseau complet des
informations privées de Dolphin. Cette passe ne clôt donc pas l'audit des quarante
personnages. Le On est conservé. Ruleset courant : **clash-combat-31**.

## Basho prêté : composition et provenance du papier

L'éditeur des trois poèmes attestés est désormais utilisable par le destinataire
d'un prêt de Dolphin. Le choix « Dolphin prêté » passe aussi par la commande PvP
typée du poème ; un sélecteur mal formé est refusé. L'écriture consomme une feuille
du kit réellement porté et l'aura du donneur. Le pinceau, l'encre, les deux mains
libres et l'écriture complète restent nécessaires. Le prêt ne les fournit pas.

Les feuilles, questions et talismans issus du prêt gardent leur provenance.
Le poème du poing attend un véritable coup de poing, le poème des réponses attend
une question et un mensonge volontaire, et le talisman n'écarte que les faibles
esprits. La fin de Dolphin retire ces effets empruntés sans rembourser la feuille
consommée ni arrêter un autre poème personnel. Une seconde composition ne réarme
pas l'unique usage. La parole est attribuée au corps visible réel, pas à l'identité
temporaire utilisée pour exécuter le Hatsu ; l'inconscience du prêt et le contrôle
actif de Black Voice bloquent la parole volontaire.

Le stock d'aura encore disponible est distinct de l'aura déjà engagée dans
l'application. Atteindre exactement le coût ne fait donc pas disparaître un effet
qui vient d'être payé ; l'aura engagée ne finance aucune seconde dépense. Ce canal
extérieur ne procure ni Ten ni rendement défensif à un corps resté en Zetsu.
Les coûts chiffrés demeurent des réglages de duel. Ruleset : **clash-combat-32**.
Le On reste présent. Les autres réserves de l'audit restent ouvertes.

Point de vigilance pour la suite : les trois oiseaux annoncés de Secret Window
ne doivent pas être transformés en trois espions interchangeables. L'écoute à
travers une barrière et l'oiseau posé au contact sont décrits ; la fonction du
troisième et la lecture exacte de la limite de simultanéité restent à traiter
sans inventer de pouvoir (chapitres 366, 373 et 389).

## Dolphin : restitution, fermeture et continuité des effets

La fin de l'application rend désormais immédiatement le Hatsu au corps du donneur,
sans confondre cette restitution avec la disparition du Dolphin équipé. Tant que
le dispositif reste présent, Emperor Time continue de coûter de la vie. Le
destinataire peut ensuite le fermer même sans aura personnelle ; le prêteur éveillé
peut aussi fermer un prêt déjà restitué via leur connexion commune. Une capacité
encore inutilisée ou une application maintenue ne bénéficie pas de ce raccourci.

Chaque prélèvement effectif possède son identifiant. Une ancienne restitution ne
peut donc pas effacer un vol plus récent du même Hatsu sur le même corps. Le Hatsu
exécuté au contact de la seringue est conservé avant que la blessure et Zetsu
n'interrompent l'action de la victime. La sélection de duel peut ainsi retenir une
Texture Surprise réellement en cours, au lieu de revenir systématiquement au
premier spécial une fois le drainage terminé ; cela n'ajoute aucune condition de
connaissance ou d'observation préalable à Steal Chain.

Les constructions qui apparaissent à la fin d'un démarrage sont suivies pendant
leurs propres hooks : Texture Surprise garde son prêt tant que le support reste
actif, et les autres Hatsu personnels du porteur ne rallongent pas cette utilisation.
Little Eye emprunté reste contrôlé pendant l'inconscience liée, comme dans le cas
montré d'Oito. La mort de l'animal met fin au contrôle et restitue le Hatsu avant
la fermeture de Dolphin. Les entités mortes ne restent pas comptées comme des
animaux contrôlés. L'observation sensorielle et l'activation complète de Little Eye
sur une personne non éveillée restent à compléter dans le chantier suivant.

Les commandes volontaires du panneau, y compris l'arrêt d'un soutien, ne passent
plus pendant un sommeil, un blackout ou une manipulation qui retire l'autonomie.
Les boutons concernés sont désactivés. Le On reste disponible. Cette passe porte
le ruleset à **clash-combat-33** ; elle ne clôt pas les autres réserves de l'audit.

## Little Eye : capture et perceptions réellement utilisables

Little Eye lance une boule d'aura qui doit atteindre un petit être vivant réel,
au plus de la taille d'un hamster. La capture n'est plus instantanée : un animal
qui quitte sa trajectoire peut être manqué. Une copie de Gallery Fake, une
créature de Nen, un animal mort ou un animal trop grand ne convient pas. Cette
boule ne blesse ni n'étourdit les combattants. Les vitesses, distances et tailles
de collision sont des réglages de la scène, pas des restrictions Nen annoncées
par le manga.

L'utilisateur reçoit maintenant une lecture de la vue et de l'ouïe de l'animal :
apparences, positions et aura effectivement visible, paroles à portée de son
corps. Cette lecture respecte l'orientation, les obstacles physiques de l'arène,
In et Gyo. Elle ne révèle ni pensée, ni mensonge intentionnel, ni technique
privée. Les doubles visibles de Hanzo sont distincts de son corps endormi. Le
flux est privé dans le PvP et conservé dans le replay. Le client reçoit ces
perceptions de l’arbitre, sans les reconstruire depuis des corps dont les données
Nen ont été masquées.

Les ordres de déplacement, d'orientation, d'arrêt et de libération passent par le
véritable utilisateur, y compris avec un prêt de Dolphin ou une page de Skill
Hunter. L'animal n'avance plus automatiquement vers un adversaire dont la
position serait connue sans observation. Il conserve son dernier ordre pendant
l'inconscience du porteur ; aucune nouvelle perception ou commande n'est alors
reçue. L'IA s'appuie elle aussi sur l'image reçue. Un projectile qui touche
réellement l'animal peut le tuer sans fabriquer un impact sur un combattant.

Le temps de vol fait partie de l'unique application prêtée : il ne permet pas de
rendre le Hatsu avant la capture puis de continuer à l'utiliser. Une libération
ou la mort de l'animal termine l'application ; le dispositif équipé et Emperor
Time conservent leur propre fermeture. Ruleset : **clash-combat-34**. Le On reste
présent. Les destinataires non éveillés, leurs nœuds d'aura et les autres réserves
listées plus haut restent à terminer ; cette passe ne certifie pas les 40
arsenaux à 100 %.

## Dolphin : destinataire non éveillée et ouverture des nœuds d'aura

La ressource de scénario « Reine Oito » installe une seule personne physique,
distincte des 40 combattants sélectionnables. Elle ne reçoit ni identité de
combattant d'emprunt, ni affinité, statistiques Nen, matériel ou Hatsu personnel.
Le prêt exige toujours un Dolphin chargé et inutilisé, la main droite disponible
et un contact de seringue à la position réelle du destinataire. Il libère le
stock de Steal Chain et garde le prêteur sous Emperor Time.

L'activation de Little Eye utilise exactement le stock d'aura prélevé au donneur.
Dolphin déclenche l'émission à proximité d'Oito ; la boule doit atteindre un
petit animal réel admissible.
Les ordres et les perceptions appartiennent à Oito, avec ses propres contrôles ;
ils ne sont pas attribués au corps de Kurapika ou d'un autre combattant. La
transmission de la vue et de l'ouïe s'arrête pendant le blackout partagé, tandis
que l'animal conserve son dernier ordre et que l'application continue. Le Hatsu
revient au donneur à la fin de cette application, mais Dolphin et le coût de vie
continuent jusqu'à leur fermeture.

Le prêt permet à Oito de voir l'aura avant sa première activation. L'activation
entrouvre ses nœuds, sans lui attribuer Ten ou une technique personnelle ; cette
ouverture reste après la fermeture du dispositif. Erigeron peut également être
prêté à ce corps non éveillé et faire pousser une vraie graine au contact avec
l'aura de Bill : c'est le mécanisme d'éveil montré pendant les leçons du chapitre
388, sans prétendre que cette combinaison précise a été montrée sur Oito.
L'ouverture des nœuds ne simule pas un apprentissage instantané du contrôle de
l'aura.

Ce corps vivant est une cible humaine de Black Voice, sous ses conditions
d'antenne et de téléphone. Gallery Fake en produit une copie physique inerte,
avec l'apparence d'Oito mais sans son prêt, ses perceptions ni ses nœuds ouverts.
Cette copie peut être commandée par Order Stamp ; elle ne devient pas une
utilisatrice de Nen.

La personne, son Dolphin équipé, l'animal contrôlé et une éventuelle boule déjà
émise sont conservés au changement de manche. Changer le score ne supprime donc
pas la contrainte d'Emperor Time. Le protocole PvP distingue le prêteur, le
donneur original et le propriétaire des contrôles du destinataire ; le replay
conserve l'injection, l'éveil, les commandes, la restitution et la fermeture.

Dolphin est visible au destinataire **et** à Kurapika, jamais aux autres
observateurs grâce à Gyo. Cette correction concerne aussi les prêts aux
combattants ; elle suit les chapitres [364](https://hunterxhunter.fandom.com/wiki/Chapter_364)
et [367](https://hunterxhunter.fandom.com/wiki/Chapter_367). Les images et les
paroles reçues par l'animal restent dans le flux privé du destinataire : la
connexion des deux esprits n'ajoute pas un transfert automatique de toutes ses
perceptions au prêteur.

Ruleset : **clash-combat-35**. Le On reste présent. Ces applications connues sont
exécutables ; les autres réserves de l'audit, notamment les éditeurs spécialisés,
Lovely Ghostwriter, les prothèses et liens multiples d'Hisoka, Judgment et les
consciences d'Halkenburg, restent ouvertes. Ce jalon ne certifie pas les 40
arsenaux à 100 %.

## Secret Window : corps marqué et flux privé partagé avec Benjamin

Le contact de Musse et celui de Benjamin utilisent maintenant la même application
de Secret Window. Le hibou transmet les gestes du corps réellement touché et les
paroles réellement prononcées par ce corps, sans révéler l'intention, la technique
cachée ou les pensées. Une garde ne remplace pas une esquive et n'empêche pas ce
contact non dommageable. Le contact reste soumis à la portée physique, à la grâce
de relevée et aux véritables évitements.

La cible est conservée par membre physique d'équipe. Quand elle passe au portail,
le hibou la suit ; le remplaçant n'hérite pas de son observation. Un Musse en
réserve continue à recevoir ses propres observations. Le flux reste privé en PvP,
y compris en réserve, et n'est pas recalculé depuis les informations masquées du
client. Un esprit inconscient ne reçoit pas de nouvelles observations ni de
paroles. Un ordre explicite permet de rappeler le hibou ; changer ensuite de cible
demande un nouveau contact.

Le bénéficiaire d'un Dolphin équipé utilise son stock emprunté pour conserver le
flux, même si sa propre réserve ou son Hatsu personnel ne sont pas disponibles.
Les entraves physiques au Nen et le sceau de On restent appliqués. Un changement
de manche ne supprime pas un hibou encore lié à ce prêt et ne libère donc pas
gratuitement le donneur ou le prêteur.

Références : contact et transmission au chapitre 373, héritage aux chapitres 373
et 389, fonctions connues résumées [ici](https://hunterworld.tokyo/en/musse/).
L'écoute par le hibou d'épaule du chapitre 366 et la relecture développée par
Benjamin au chapitre 413 restent à intégrer après cette correction du flux. La
fonction propre du troisième oiseau n'est pas inventée. Ruleset :
**clash-combat-36** ; le On reste présent et l'audit global reste ouvert.

## Secret Window : application d’écoute du hibou d’épaule

L’application du chapitre 366 est maintenant distincte de la pose au contact du
chapitre 373. Musse peut invoquer le hibou d’épaule avec bas + L ou le panneau
d’arsenal ; Benjamin l’utilise comme application de son héritage avec arrière + L
ou le même panneau. L’IA sait employer cette écoute. Ce geste n’inflige aucun
dégât et n’exige pas de toucher une personne.

Les paroles réellement prononcées à portée du scénario traversent les parois.
L’écoute ne fournit ni image, pensée, intention de mensonge, quantité d’aura ou
connaissance du futur. La portée de voix de 36 unités, le coût de 16 aura et les
temps d’animation sont des réglages du scénario, pas des conditions chiffrées du
manga. Le hibou de contact rapporte exclusivement la voix du corps marqué : les
paroles d’une personne voisine et celles d’un double de Hanzo ne deviennent pas
les paroles du corps surveillé.

Chrollo peut choisir cette application sur une page de Secret Window réellement
active ; fermer le livre sans signet l’interrompt. Le sélecteur de Dolphin
propose également cette application du même Hatsu. Son activation consomme
l’aura réellement prélevée, reste un seul usage et lie l’effet à Emperor Time
jusqu’à son terme. L’écoute d’un prêt actif est conservée entre les manches.
Un ordre d’arrêt ne rappelle pas le hibou déjà posé sur une autre cible.

Les deux commandes appartiennent au même Hatsu : voler Secret Window à Benjamin
scelle son écoute et son application au contact, sans sceller ses autres héritages.
Les paroles restent privées en PvP, y compris pour les membres en réserve ; elles
ne sont pas reconstruites depuis un état adverse masqué. Le panneau ancien de
Benjamin ne lit plus directement le nom technique de l’attaque adverse et son
marquage privé n’est plus envoyé au client adverse.

La représentation du hibou d’épaule sert de marqueur du flux privé ; elle ne
certifie pas une règle d’invisibilité non démontrée pour ce premier oiseau. Le
nombre exact et la simultanéité des trois types ne sont pas présentés comme une
restriction révélée. La fonction propre du troisième oiseau reste inconnue. La
relecture développée par Benjamin au chapitre 413 reste le chantier suivant.
Références : [fonctions montrées de Secret Window](https://hunterworld.tokyo/en/musse/),
[chapitre 366](https://hunterxhunter.fandom.com/wiki/Chapter_366).
Ruleset : **clash-combat-37**. Le On est conservé ; l’audit des autres arsenaux
reste ouvert et ce jalon ne certifie pas un achèvement à 100 %.

## Secret Window : relecture développée par Benjamin

Le scénario de préparation « historique de Musse » rend utilisable l’évolution
montrée au chapitre 413. Il exige Benjamin, l’héritage admissible de Secret Window
et le corps réel de Camilla, actif ou en réserve. Il déclare explicitement la
longue surveillance continue déjà accomplie ; aucune durée numérique n’est
inventée. Un duel ordinaire ne reçoit ni archive arbitraire ni Camilla fictive.

Le panneau permet de revenir entre les dernières observations historiques de
Musse, puis entre les gestes et paroles effectivement reçus par Benjamin pendant
le scénario. Les deux sources restent distinctes : le premier enregistrement ne
prétend pas montrer la résurrection de Camilla après la mort de Musse. Les vues
reçues ensuite viennent exclusivement du flux privé du hibou hérité, sans pensée,
nom technique caché, quantité d’aura ou futur de la cible. La limite de 256 vues
récentes concerne le cache de présentation du scénario, pas une limite de Nen
attribuée au manga.

La relecture exige le même hibou hérité et la surveillance préparée. Rappeler ce
hibou ou marquer une nouvelle cible ne reconstitue pas gratuitement cette
préparation. Une manche conserve l’héritage et le flux survivants ; un relais
conserve leurs propriétaires et les corps surveillés. Le blocage du Nen, le vol
de Secret Window et le On empêchent son utilisation. Fermer une relecture reste
une action d’interface d’un utilisateur conscient.

Cette évolution n’est pas accordée automatiquement à Musse, à une page générique
de Musse chez Chrollo ou à son prêt par Dolphin. Elle n’est pas présentée comme la
fonction inconnue du troisième hibou. Le PvP masque l’archive adverse, y compris
en réserve, et les commandes de relecture sont enregistrées dans les replays.

Références : chapitre 413, recoupé dans les analyses de
[VoraciousDrake](https://voraciousdrake.wordpress.com/2026/07/10/hxh-413-fealty/comment-page-1/)
et de [Shimesaba](https://note.com/shimesaba2525/n/n929d34dc3981?hl=en), avec le
contexte de la pose et de l’héritage au chapitre 373.
Ruleset : **clash-combat-38**. Le On est conservé. L’audit des quarante arsenaux
reste ouvert ; cette étape ne certifie pas un achèvement à 100 %.

## Judgment Chain : clause de réponse sincère

La clause utilisée contre Uvogin au chapitre 84 est sélectionnable avant
l’implantation réelle dans le cœur. Elle ne force pas Zetsu. Après la pose,
l’utilisateur peut prononcer une question à portée d’audition ; une personne
qui ne l’a pas entendue ne reçoit pas une question par télépathie. Le membre
physique qui a posé la chaîne reste identifié.

Les faits personnels déjà représentés — identité, état de Nen et emploi de In —
ont des réponses sincères ou mensongères calculées depuis le propre état du
répondant. Les questions et réponses rédigées passent également par la voix
réelle. Pour ces réponses libres, le joueur déclare explicitement son intention
consciente : aucune analyse de texte ne prétend établir une vérité inconnue du
scénario. La chaîne sanctionne le mensonge conscient ou le refus explicite de
répondre. Elle n’invente ni délai fatal au silence ni réponse obligatoire d’une
personne inconsciente ou manipulée.

Les paroles empruntent le circuit commun d’audition, des enregistrements, des
hiboux et de Dowsing. Une réponse au même fait produite par le circuit commun
reste donc soumise à la clause ; une déclaration sans rapport ne devient pas
automatiquement une réponse. L’IA sait poser la question représentée et répondre
sincèrement aux faits connus, sans fabriquer de connaissance pour une question
libre. Les commandes, intentions et clauses se conservent dans les snapshots et
replays ; le PvP les exécute auprès de l’arbitre.

La clause implantée reste active après l’arrêt d’Emperor Time et sous le sceau
du On ; cela n’autorise aucune nouvelle implantation sans les conditions du Nen.
Références : [chapitre 84](https://hunterxhunter.fandom.com/wiki/Chapter_84) et
[description officielle de Judgment Chain](https://www.ntv.co.jp/hunterhunter/dictionary/index.html).
Ruleset : **clash-combat-39**. Le On est conservé ; les clauses de secret et de
libération d’otages restent à achever, ainsi que les autres écarts du relevé.

## Kalluto : plusieurs poupées et corps réellement marqués

La surveillance du chapitre 225 conserve désormais un récepteur distinct pour
chaque personne effectivement marquée puis associée à une poupée. Créer une
seconde poupée ne remplace plus la première. Le papier collé, son propriétaire
et le corps surveillé gardent leur indice physique après un relais ; le
remplaçant ne reçoit ni cette marque ni l’écoute d’un autre membre.

Chaque récepteur rapporte seulement les paroles réellement prononcées autour
de son propre papier. Le corps endormi de Hanzo reste le point d’écoute quand
son double s’éloigne. La portée de voix de 18 unités reste un réglage du
scénario, pas une portée canonique du lien de Nen. Les paroles ne révèlent
aucune pensée, action silencieuse ou intention de mensonge. Un observateur
inconscient ou privé d’ouïe ne reçoit pas de nouvelles paroles ; aucune écoute
n’est reconstruite depuis un snapshot PvP masqué.

Le panneau affiche les récepteurs séparément, et chaque poupée physique possède
son modèle. Arrêter l’écoute conserve les poupées, les papiers et les souvenirs
déjà reçus. Réactiver une poupée exige une activation admissible. Une page de
Chrollo qui cesse d’être active interrompt tous ses récepteurs ; le signet conserve
son rôle. Manipulation offensive et surveillance gardent leurs accès distincts
lors d’un vol ou d’un prêt, avec le budget réel du donneur pour un effet emprunté.
Une manche conserve les papiers et les récepteurs déjà préparés.

Le contrôle de relais ne confond plus une rancœur passive avec un On déjà
activé. La rancœur reste sur son propriétaire et n’est pas donnée au remplaçant ;
le On actif et son sceau continuent à empêcher un relais qui suspendrait leurs
effets. Les flux et leurs paroles restent privés, y compris en réserve, et les
commandes de P2 se rejouent sans changer les corps marqués.

Références : [chapitre 225](https://hunterxhunter.fandom.com/wiki/Chapter_225) et
[applications du papier de Kalluto](https://hunterworld.tokyo/kaltzaoldyeck/).
Ruleset : **clash-combat-40**. Le On est conservé. Le stock matériel, son ramassage
et les autres interactions du papier restent à compléter avant de certifier
l’arsenal entier de Kalluto ; l’audit global reste ouvert.
