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

## Écarts qui empêchent encore d'annoncer « 100 % »

Les extensions ci-dessus ne terminent pas tout l'arsenal rétrospectif. L'[audit des quarante
combattants](./audit-hatsu-fighting.md) conserve les limites par personnage.
Les écarts suivants restent ouverts et ne doivent pas être masqués par un taux
de couverture des profils ou un nombre de tests :

| Personnage | Extension ou correction encore nécessaire                                                                                                                                                                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Chrollo    | Lovely Ghostwriter reste à représenter avec identité manuscrite, impossibilité de prédire son propre avenir et un contexte de futur défini. Le repérage et l’En de Gallery Fake sont exécutables ; les interactions matérielles restantes, notamment le téléphone et les deux antennes physiques de Black Voice, doivent encore être contrôlées. |
| Hisoka     | Réseau de plusieurs liens simultanés, prothèses fonctionnelles et préparation post-mortem avec une véritable cause de mort admissible. L'interception et le colmatage sont désormais exécutables.                                                                                                                                                |
| Kurapika   | Ajouter les clauses de secret et de libération des otages de Judgment, la localisation et les autres questions de Dowsing Chain, puis le prêt de Stealth Dolphin à un tiers réel. Les chaînes ne doivent pas partager leurs restrictions par commodité.                                                                                          |
| Halkenburg | Représenter la protection collective et les consciences au lieu de réduire la possession à un arrêt temporaire du combattant.                                                                                                                                                                                                                    |

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
