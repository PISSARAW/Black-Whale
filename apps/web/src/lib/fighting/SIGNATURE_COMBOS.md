# Combos signature

Un combo signature tient dans **un seul compteur**, du premier coup à la technique
finale, contre un mannequin qui garde dès qu’il le peut. Il passe par les vraies
commandes : déplacements et commandes de Hatsu sont des étapes à part entière.
Les définitions sont dans `signatureCombos.ts`, `signatureCombosBookArmy.ts`,
`signatureCombosBiscuitPhinks.ts` et `signatureCombosSecond.ts`, le lecteur de route dans `signatureComboRunner.ts` (étapes
hors frappe dans `signatureComboSteps.ts`) et les vérifications dans
`signatureCombos.test.ts` (miroir et deux distances de départ) et les suites propres à
chaque lot. Ruleset `clash-combat-88` (84 pour Kurapika et Hisoka, 85 pour Chrollo et
Benjamin, 86 pour Biscuit et Phinks).

Deux routes contiennent une **coupure voulue** : fermer les yeux pour la vision de
Tserriednich, encaisser la riposte de Feitan. La frappe suivante ouvre un nouveau
compteur (`signatureComboCounts`).

Les réglages ci-dessous (fenêtres, coûts, durées) sont des réglages de duel, pas
des mesures du manga.

## Verdict écarlate — Kurapika

Direct bas → Pendule rasant → Crochet au corps → accélération arrière → Rappel du geôlier
→ Fouet divinatoire → accélération avant → Verdict écarlate → Emperor Time
→ Judgment Chain. Sept touches, 59 aura (fouet 24, Judgment Chain 35).

- **Variante Brigade** (`kurapika:scarlet-verdict-troupe`) : Chain Jail remplace la
  capture, contre un membre de la Brigade seulement. Contre tout autre adversaire,
  Chain Jail reste soumise à son serment : l’emprisonnement échoue et Kurapika meurt
  (en Entraînement, le serment est rompu sans tuer le corps).
- Emperor Time s’active pendant une capture ou une Chain Jail confirmée, et la
  capture s’annule dans Judgment Chain. Judgment Chain garde ses conditions :
  Emperor Time actif et contact.

## Élastique meurtrier — Hisoka

Entaille de carte → Attache Bungee Gum → accélération arrière pour tendre le lien →
Carte basse → Rappel élastique → Tête de marteau → ancrage au plafond → Rebond de
gomme vertical → Trapèze meurtrier → Exécution élastique. Six touches : le Rappel et le
Rebond déplacent les corps sans frapper.

- **Une barre d’aura pleine.** Tant que la cible reste prise dans le combo
  (`comboAuraCost.ts`), le Rappel et le Rebond d’un lien déjà posé coûtent 5 aura,
  comme les commandes de réseau ; l’Exécution qui conclut un combo tenu par la tension
  élastique coûte 40 au lieu de 55. Hors combo, les
  coûts ne changent pas.
- **Tension élastique** (`elasticHold.ts`) : tant qu’Hisoka manœuvre un lien qui tient
  une cible déjà prise dans son combo (rappel, rebond, lien en mouvement, pose d’un
  ancrage, vol qui suit un rebond), l’étourdissement de la cible ne s’écoule pas. Le
  combo dispose de 132 frames de tension au plus ; le budget se recharge à la fin du
  combo. Pendant ce temps, ses coups peuvent toucher le corps tenu, même à terre.
- **Plongeon.** En combo, lancer Trapèze meurtrier pendant le rebond lâche l’ancrage
  du plafond, reprend le lien sur la cible et fait plonger Hisoka pour que les frames
  actives arrivent au sol.

## Préparation

Un combo peut déclarer une `preparation` : des étapes jouées par les vraies commandes,
à portée de contact, avant le combo. Le combo commence une fois les deux corps revenus
au neutre ; le laboratoire remet alors l’aura à 100 et le mannequin oublie la touche de
préparation, comme pour un nouvel exercice. Marques, pages et cartes ne viennent que de
là : aucune n’apparaît pendant le combo. L’étape `incoming` fait tirer l’adversaire
(son attaque à distance ordinaire) dès que la technique du joueur est active.

## Double page — Chrollo

Préparation : la page active pose le Soleil, puis Double Face place Sun and Moon au signet
et ferme le livre. Combo : Pique du voleur → Coup de pied d’arrêt → Pas du voleur →
Fauchage silencieux → accélération → Page tranchante → page au signet. La Lune rejoint le
Soleil et les deux marques détonent. Six touches ; aucun Hatsu n’est volé pendant le combo.

- Page tranchante s’enchaîne dans la page au signet par une chaîne écrite ; l’accélération
  part du Fauchage silencieux (`duelComboRosterProfiles.ts`).
- Sans Soleil préparé, la page au signet ne pose que la Lune : pas de détonation.

## Commandement absolu — Benjamin

Préparation : Secret Window marque la cible, puis le Rectangle d’aura capture un projectile
de Nen adverse (référence : Franklin ; Culdcept ne garde qu’une carte, le reste de la
rafale touche Benjamin). Combo : Direct militaire → Percée du premier prince → Marteau royal → Air
Blow → accélération avant → Commandement absolu → Rectangle d’aura → rafale de
mitraillette → Jouer la carte. Neuf touches, 84 aura (Air Blow 40, Rectangle 20, carte 24).

- **Secret Window** donne l’information seulement : avec ou sans marque, le combo inflige
  exactement les mêmes dégâts (`signatureCombosBookArmy.test.ts`).
- **Rafale** : arme réelle, jamais capturée. La carte jouée est celle de la préparation ;
  sans carte, Jouer la carte reste refusée.
- **Prise de Culdcept** (`culdceptHold.ts`) : le Rectangle ouvert depuis une capture de
  combo garde le corps tenu tant qu’il dure ; actif, il s’annule dans la rafale. La rafale
  qui a tiré ses trois balles s’annule dans Jouer la carte. Les tirs qui prolongent un
  combo visent le corps au sol.

## Retour à la vraie forme — Biscuit

Direct Shingen → Leçon de posture → Crochet de maître → Balayage de pierre → accélération
avant → Correction absolue → Vraie forme → Ken parfait → Poing de Ko → Impact total.
Huit touches ; Ken parfait 28, Poing de Ko 20, Impact total 40 quand il conclut Ken parfait → Poing de Ko sur une cible tenue (55 sinon).

- **Vraie forme pendant la capture** (`biscuitFormAction.ts`) : révéler le corps naturel
  ne frappe pas et ne démarre aucun coup ; pendant une capture de combo, la Projection
  continue. La forme reste pour la manche : puissance (×1,35, `hatsu.ts`), inertie du
  corps plus lourd (`fightPhysicalProfile.ts`) et portée (×1,12, `biscuitForm.ts`).
- **Chaînes de techniques** : capture → Ken parfait → Poing de Ko → Impact total sont
  des chaînes écrites ; aucun normal ne s’annule pour autant dans Ken parfait ou Poing
  de Ko (`duelComboDerivedGrammar.ts`).

## Dix tours, un poing — Phinks

Démarrer Ripper Cyclotron → accélération arrière en tournant → esquive basse en tournant
→ saut croisé → atterrissage derrière la cible → revenir à portée → Direct de météore
→ Crochet de la Brigade → libérer immédiatement Ripper Cyclotron. Trois touches ; les
déplacements ont déjà complété les tours consommés par la libération.

- **Rotation en mouvement** (`phinksCyclotron.ts`), dans tous les combats : le bras droit
  continue de tourner pendant les déplacements, les sauts, l’accroupi et les coups
  ordinaires. La garde, un coup reçu, une prise, une projection, une autre technique ou
  la libération l’arrêtent. Les coups ne reçoivent aucun bonus.
- **Esquive basse** (`phinksLowDodge.ts`) : bas maintenu + double appui avant, Phinks
  avance d’environ six unités accroupi au lieu de dasher.
- **Saut croisé** : le moteur ne pousse pas deux corps dont l’un dépasse 7 de hauteur ;
  après l’esquive, le saut passe au-dessus de la cible.
- **Libération en combo** (`phinksComboRelease.ts`) : avec au moins un tour complet, le
  poing droit annule un coup ordinaire confirmé dont la chaîne écrite le nomme (Crochet
  de la Brigade), avance de 4 et atteint le corps touché. Seule la libération consomme
  les tours.

## Dix secondes d’avance — Tserriednich (Spécialisation)

Seconde condamnation → Zetsu, yeux fermés → vision du futur → ouverture des yeux →
accélération vers l’angle sûr → Tir aux jambes → Pas déjà vu → Coup de crosse →
Fauchage calculé → Tir de divergence. Une touche, la coupure de la vision, puis cinq touches
en un compteur.

- **Le recul protège le Zetsu.** La préparation de 30 frames reste vulnérable et
  s’interrompt sur un coup ; Seconde condamnation crée la place pour la mener.
- **La divergence est la seule récompense.** Pendant la divergence, l’adversaire
  rejoue les commandes de la vision et vise l’image prévue. Diverger — ici, une
  accélération qui passe à travers lui, hors de la trajectoire prévue — puis frapper
  avant le coup annoncé lui fait perdre l’échange. Contre Phinks, Feitan et Hisoka
  pilotés par l’IA, la route passe sans perdre un point de vie.
- **Le futur n’esquive jamais.** Yeux ouverts et immobile, Tserriednich reçoit le coup
  annoncé par la vision. Ni la vision ni l’accélération ne donnent d’invulnérabilité ;
  le passage garde tous les volumes touchables.
- **Tir de divergence par relance.** Le profil dérivé de Tserriednich active la relance
  (`relance: true`) : Fauchage calculé s’annule dans Tir de divergence, qui touche le corps
  que le fauchage vient de mettre au sol.

La garde du moteur n’est pas directionnelle : passer dans le dos ne casse pas une garde
par lui-même. C’est l’engagement de l’adversaire dans le futur prévu qui ouvre la route.

## Douleur en vitesse — Feitan (Transformation)

Entaille basse → Croisement funèbre → accélération traversante → Lame sans ombre →
Taille de sabre → Fauchage éclair → encaisser volontairement une riposte → Pain Packer
→ Retour de supplice vers la zone chaude → Rising Sun. Cinq touches, la coupure de la riposte,
puis la projection et la chaleur.

- **Accélération traversante.** Sur touche, Croisement funèbre s’annule dans un
  dash qui passe à travers l’adversaire (`dash: { forwardLight: 'through' }`) : c’est
  l’équivalent 2D des passages bas de la référence. Son pic est 1,4 fois celui du dash
  ordinaire, sans invulnérabilité : un coup rencontré pendant le passage touche.
- **Revers sorti du passage.** Seule Lame sans ombre lancée depuis l’accélération
  s’enchaîne dans la Taille de sabre (`accelInto`). La chauffe du Ren borne ce cycle
  (Taille → Croisement → Lame sans ombre) à deux tours.
- **La riposte est réelle.** Pain Packer exige des blessures et refuse la route sans
  riposte. Il emmagasine exactement les points de vie perdus ; une riposte plus lourde
  donne un soleil plus large et plus brûlant.
- **Zone chaude.** Tant que la tenue de Pain Packer est portée, la projection de Feitan
  retient sa cible à ses pieds au lieu de la projeter (`comboCapture.ts`) : Rising Sun,
  centré sur Feitan, la brûle. La tenue protège Feitan de sa propre chaleur, pas des coups.

## Les trois interdits — Saiyu (contrôle sensoriel)

Pointe du bâton → Perche du singe → Mizaru → Balayage du singe → Kikazaru → accélération
derrière la cible → Cercle du bâton → Iwazaru → Queue balayante → Frappe finale. Neuf
touches. Chaque singe touche séparément et scelle son propre sens ; aucun ne provoque de
Zetsu. Mizaru s’annule dans le Balayage par sa chaîne écrite (une chaîne de super, bornée
par le Ren) ; après le passage, `accelInto` enchaîne Cercle, Iwazaru, Queue balayante et Frappe.

## Leçon de tir — Theta (fondamentaux et arme réelle)

Tir de couverture → accélération avant → Pique à la crosse → Crosse descendante → Fauchage
de garde → accélération arrière → Tir bas → Tir de contrôle → Décision impossible → Tir ajusté. Huit
touches. Aucun Hatsu personnel : le pistolet réel et le corps à corps. Une balle qui touche
confirme son tir, qui peut alors s’annuler comme un coup au contact.

## Feu de suppression — Franklin (émission)

Tir rasant → accélération derrière la salve → Direct blindé → Marteau de la Brigade →
Croisement balistique → recul court → Double Machine Gun → Salve croisée → Rideau de balles →
Rafale prolongée. 103 touches : les cinq salves tirent en entier (10, 20, 10, 20 et 40
balles) avant de s’annuler, et chaque balle compte dans le combo. Une salve qui prolonge le
combo vise le corps au sol, le maintient à terre le temps de son hitstun et ne le repousse
pas. Franklin reste interruptible : un coup reçu arrête ses tirs.

## Fil court — Machi (transformation)

Préparation : l’Aiguille de pistage marque la cible, sans immobiliser. Combo : accélération
avant → Pique de fil → Coude de la couturière → Ligature au contact → pas de côté en gardant
le fil court → Balayage cousu → Suture punitive → Tension finale. Six touches. Le
Coude qui touche en combo ouvre une vraie plaie, que Nen Stitches pourra suturer. Une cible
ligaturée ne peut pas se défendre : son combo continue tant que la ligature tient. Le
Balayage cousu et Suture punitive gardent le fil en main ; Suture punitive recoud la cible
qu’elle saisit. La ligature disparaît si Machi lâche le fil (tout autre coup) ou dépasse sa portée.

## Consigne implantée — Illumi (manipulation)

Aiguille basse → Pas sans présence → Paume Zoldyck → accélération avant → Projection Zoldyck →
Implantation crânienne « Reste » → accélération arrière → Ordre · Approche → Aiguille de recul →
nouvelle projection (`signatureCombosTroupeZoldyck.ts`). Sept touches. L’aiguille spéciale placée
au crâne prive la cible d’autonomie et la maintient dans le combo (`comboRestraintHold.ts`). Sans
aiguilles physiques, l’implantation échoue et la route s’arrête.

## Serpent de papier — Kalluto (manipulation)

Préparation : Planter le papier sur le torse. Combo : Confettis rasants → Éventail tranchant →
Revers de papier → Éventail lunaire → Fauchage de l’éventail → accélération arrière → Danse de la
morsure → Morsure du serpent (`signatureCombosTroupeZoldyck.ts`). Onze touches (3 fragments
convergents par morsure). Sans fragment réellement planté, la convergence est refusée.

## Cantabile céleste — Bonolenov (matérialisation)

Préparation : Prologue · Danse ininterrompue (60 frames). Combo : Battement bas → Poing rythmé →
Coude tribal → Ronde guerrière → accélération avant → Prologue · Lance → Pas spiralé → recul dans
la portée du son → Jupiter (danse ininterrompue de 90 frames, sphère lancée). Six touches puis
lancement de Jupiter. Aucun raccourci de danse : interrompre la musique annule la matérialisation.

## Nettoyage clinique — Shizuku (matérialisation)

Coup de Blinky → Tuyau rasant → Marteau aspirant → accélération avant → Frappe de Blinky (qui
ouvre une plaie) → Prise au manche → Balayage ménager → recul face à la cible → Aspiration du
sang (`signatureCombosTroupeZoldyck.ts`). Six touches puis aspiration du sang. Blinky n’aspire
que le sang sortant de plaies ouvertes non bouchées ; sans plaie, le finisher reste bloqué.

## Ménagerie urbaine — Hinrigh (matérialisation)

Transformer les menottes en pigeon jusqu’à la capture au contact → accélération avant → Coup bas
discret → Pigeon de métal → Crosse animale → Fauchage de la famille → accélération avant →
Capture de la Xi-Yu → recul → couteau réel lancé en conclusion
(`signatureCombosHunters.ts`). Six touches. Les animaux restent les objets transformés et les
couteaux sont finis (stock réellement décrémenté).

## Audience interrompue — Mizaistom (contrôle conditionnel)

Direct → Coup de paume → accélération arrière → Cross Game · Carton jaune → désobéissance adverse
déclenchant Restraint → accélération avant → Direct en avançant → accélération avant → Projection
→ Balayage (`signatureCombosHunters.ts`). Rupture volontaire au carton jaune (2 puis 3 touches).
Si l’adversaire obéit à l’ordre d’arrêt, aucun confinement ne se déclenche et la route s’arrête.

## Sous le plancher — Leorio (émission)

Direct → Direct d’urgence → Crochet → Balayage → accélération arrière → frappe du sol et Poing à
distance sous la cible → accélération avant → Diagnostic bas → Projection
(`signatureCombosHunters.ts`). Sept touches. Le poing surgit au point visé lors de la frappe au
sol et ne suit jamais un adversaire en mouvement.

## Corps vide — Hanzo (projection astrale)

Pas sans trace → Projection du double astral → traversée de la cible → Paume aérienne astrale →
descente derrière elle → Main ouverte → Tranchant de la main → Pas du plafond → Double astral ·
Étranglement (`signatureCombosHunters.ts`). Cinq touches depuis le dos. Le corps endormi demeure
exposé au sol et tout contact avec celui-ci interrompt immédiatement la projection.

## Analyse parfaite — Rihan (Predator)

Accélération arrière → observation d’une manifestation de Nen en direct (fiche 5 facettes) →
Prédation ciblée → accélération avant → Avancée → Balayage → accélération avant →
Projection (`signatureCombosLot2A.ts`). Fonctionne uniquement contre une manifestation observable
et entièrement comprise.

## Limier écarlate — Zakuro (Bloody Mary)

Préparation : ouverture d’une blessure réelle. Combo : Gouttes-yeux → accélération avant → Direct
→ Crochet → Avancée → Balayage → accélération avant → Coup d’épaule → Projection → rappel du sang
(`signatureCombosLot2A.ts`). Le rappel scelle les plaies sans jamais soigner Zakuro.

## Battement désaccordé — Melody (flûte)

Revers défensif → accélération arrière → Musique envoûtante jusqu’à l’apaisement (0 dégât) →
arrêt de la flûte → retour à portée → Coup bas → Balayage →
accélération avant → Projection (`signatureCombosLot2A.ts`).

## Le poing qui brûle — Basho (Great Hiker)

Recul défensif → écriture ininterrompue du haïku attesté → double accélération avant → Direct en
avançant → Crochet → Balayage → accélération avant → Coup d’épaule → Projection
(`signatureCombosLot2A.ts`).

## Deuxième vie — Camilla (Cat’s Name)

Gifle royale → Revers princier → Fauchage insolent → accélération arrière → Tir de pistolet →
mort réelle causée par l’adversaire en Zetsu → Cat’s Name capture le meurtrier, absorbe sa vie et
ressuscite Camilla (`signatureCombosLot2A.ts`). Aucun déclenchement volontaire tant qu’elle vit.

## Lot 2B — Halkenburg, Gel, Lynch, Luini et Bill

- **Halkenburg** (*Garde de l’unisson*) : fondamentaux martiaux et accélération ; sans partisans
  consentants en 1v1, la flèche collective reste impossible (`signatureCombosLot2B.ts`).
- **Gel** (*Mâchoire allongée*) : bras serpent bas puis allongé en chaîne d’accélération, sans
  venin inventé (`signatureCombosLot2B.ts`).
- **Lynch** (*Body and Soul*) : question audible puis Direct déclenchant la réponse intérieure,
  suivi de la route de capture (`signatureCombosLot2B.ts`).
- **Luini** (*Passage clos*) : accélération traversante vers l’angle mort et capture ; sans pièces
  closes, aucune téléportation gratuite (`signatureCombosLot2B.ts`).
- **Bill** (*Garde rapprochée*) : fondamentaux de protection ; Erigeron reste strictement non
  offensif (`signatureCombosLot2B.ts`).

## Lot 3 — Furykov, Cluck, Beyond, Longhi, Musse, Padaille, Sayird, Terebellum, Voconte et Yokotani

- **Furykov** (*Lecture du garde*), **Cluck** (*Vol de messagers*), **Longhi** (*Clair de lune*),
  **Sayird** (*Petit œil*) et **Yokotani** (*Droit de retrait*) : routes martiales complètes à
  accélérations respectant la nature non offensive ou conditionnelle de leurs capacités
  (`signatureCombosLot3A.ts`, `signatureCombosLot3B.ts`).
- **Beyond** (*Pression du Ren*) : enchaînement martial sous Ren (`downSpecial → dash(forward) →
  forwardSpecial → forwardHeavy → throw`), distinct de la malédiction sacrificielle hors duel.
- **Musse** (*Fenêtre discrète*) : préparation Secret Window au contact (information seule, sans
  bonus de dégâts), puis enchaînement jusqu’au tir de pistolet réel.
- **Padaille** (*Outil tranchant*) : matérialisation réelle de la perceuse (`forwardSpecial`,
  20 aura) annulée dans le balayage et la capture.
- **Terebellum** (*Transfert de blessure*) : enchaînement avec prise Sweet Home (`neutralSpecial`)
  et accélération avant vers la capture.
- **Voconte** (*Porte de service*) : accélération traversante vers l’angle mort et capture, sans
  téléportation gratuite hors lieux réels.

## Coût réduit — Saiyu et Franklin

Tant que la cible reste prise, chaque technique après la première du combo coûte un tiers
de son aura (`comboHalfPrice.ts`). La première paie le prix plein ; hors combo, rien ne
change. Saiyu termine avec 18 aura, Franklin avec 36.

## Règles générales ajoutées

| Règle                    | Fichier                                 | Effet                                                                                                                                                                                                       |
| ------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accélération             | `dashCancel.ts`, `CancelGrammar.dash`   | Sur touche, un coup listé s’annule dans un dash par double appui. Chauffe le Ren de 50, comme une relance : deux au plus avant la surchauffe. Le coup qui interrompt ce dash peut toucher un corps à terre. |
| Capture en combo         | `throwRules.ts`, `duelMoves.ts`         | Une projection qui termine une accélération saisit un corps étourdi ou à terre (jamais en l’air), le retient sans le projeter et peut s’annuler par ses chaînes écrites.                                    |
| Emperor Time en capture  | `kurapikaActions.ts`                    | Activable pendant une capture ou une Chain Jail confirmée.                                                                                                                                                  |
| Chaînes des spéciaux     | `duelComboGrammar.ts`                   | Un spécial de la grammaire garde aussi ses chaînes écrites. Seule Paume rapide → page au signet (Chrollo) en déclare une ; aucun normal n’ouvre la page au signet.                                          |
| Portée prolongée         | `accelCancel.ts`                        | Un coup annulé depuis un coup qui a atteint un corps à terre l’atteint aussi : la portée tient jusqu’à la fin de la route.                                                                                  |
| Corps plaqué au sol      | `groundedPin.ts`, `combatDamage.ts`     | Un coup de route (accélération, prise) qui atteint un corps à terre le pousse de 1,5 au plus.                                                                                                               |
| Passage                  | `signatureCrossing.ts`                  | Une accélération `through`, ou le dash avant de Tserriednich pendant sa divergence, ignore les boîtes de poussée. Volumes touchables et gardes inchangés.                                                   |
| Chaînes d’accélération   | `CancelGrammar.accelInto`               | Un coup lancé depuis une accélération gagne les chaînes listées ; la chauffe du Ren les borne.                                                                                                              |
| Relance dérivée          | `DuelComboProfile.relance`              | Un profil à grammaire dérivée peut activer la relance (spécial → spécial plus tardif sur touche).                                                                                                           |
| Zone chaude              | `comboCapture.ts`                       | Sous Pain Packer revêtu, la projection de Feitan retient sa cible sans la projeter.                                                                                                                         |
| Chaînes des supers       | `duelComboGrammar.ts`, `accelCancel.ts` | Un super garde ses propres chaînes écrites ; les suivre chauffe le Ren comme une relance, ce qui borne la boucle fin physique → super.                                                                      |
| Tir confirmé             | `shotConfirm.ts`                        | Une balle qui touche confirme l’attaque qui l’a tirée (tir ou salve de Hatsu) ; ses annulations sur touche deviennent possibles. Gardée ou évitée, elle ne confirme rien.                                   |
| Salve complète           | `ComboMove.windowStart`                 | Une salve ne s’annule qu’après son dernier tir (Franklin). L’accélération respecte aussi ce début de fenêtre.                                                                                               |
| Corps tenu par une salve | `groundedPin.ts`                        | Une balle de route qui atteint un corps à terre l’y maintient le hitstun de sa salve et ne le pousse pas.                                                                                                   |
| Coût réduit              | `comboHalfPrice.ts`                     | Saiyu et Franklin : un tiers du prix pour chaque technique après la première, tant que la cible reste prise.                                                                                                |
| Ligature / contention    | `comboRestraintHold.ts`, `fighterPhysics.ts` | Une cible ligaturée (Machi), marionnette crânienne (Illumi), menottée (Hinrigh) ou confinée par Cross Game (Mizaistom) reste dans son combo tant que la contention physique tient.                        |

Une commande entrée pendant le hitstop est perdue : le double appui d’une accélération
se joue après l’impact (une salve en provoque une frame sur deux ; un joueur qui tient la
direction n’est pas gêné, la démonstration lit le suivi d’appuis du moteur).

## Dans l’Académie

École de combat → « Combos signature » propose chaque combo en pratique et en
démonstration (`signatureSchool.ts`, `FightSignatureLessons.svelte`). L’exercice suit
les étapes réellement jouées : un coup qui démarre, une accélération, Emperor Time,
la pose de l’ancrage. Chaque touche doit prolonger le même combo ; une garde, un coup
hors route ou une cible qui se relève fait échouer l’essai. La démonstration passe par
les mêmes commandes de relecture, et l’ancrage par `match.queue`. Tous les combos y
figurent : la préparation est jouée au lancement de l’exercice, le tir est une étape
(commande Tir) et chacune de ses balles compte comme une touche du combo.
