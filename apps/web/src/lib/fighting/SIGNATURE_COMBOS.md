# Combos signature

Un combo signature tient dans **un seul compteur**, du premier coup à la technique
finale, contre un mannequin qui garde dès qu’il le peut. Il passe par les vraies
commandes : déplacements et commandes de Hatsu sont des étapes à part entière.
Les définitions sont dans `signatureCombos.ts`, le lecteur de route dans
`signatureComboRunner.ts` et les vérifications dans `signatureCombos.test.ts`
(miroir et deux distances de départ). Ruleset `clash-combat-86` (84 pour Kurapika et Hisoka, 85 pour Chrollo et Benjamin).

Les réglages ci-dessous (fenêtres, coûts, durées) sont des réglages de duel, pas
des mesures du manga.

## Verdict écarlate — Kurapika

Direct bas → Pas et direct → Crochet au corps → accélération arrière → Contre en
retrait → Fouet divinatoire → accélération avant → Capture divinatoire → Emperor Time
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
Carte basse → Rappel élastique → Vrille du clown → ancrage au plafond → Rebond de
gomme vertical → Hache aérienne → Exécution élastique. Six touches : le Rappel et le
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
- **Plongeon.** En combo, lancer la Hache aérienne pendant le rebond lâche l’ancrage
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
et ferme le livre. Combo : Pique du voleur → Coup de pied d’arrêt → Contre du voleur →
Fauchage silencieux → accélération → Paume rapide → page au signet. La Lune rejoint le
Soleil et les deux marques détonent. Six touches ; aucun Hatsu n’est volé pendant le combo.

- Paume rapide s’enchaîne dans la page au signet par une chaîne écrite ; l’accélération
  part du Fauchage silencieux (`duelComboRosterProfiles.ts`).
- Sans Soleil préparé, la page au signet ne pose que la Lune : pas de détonation.

## Commandement absolu — Benjamin

Préparation : Secret Window marque la cible, puis le Rectangle d’aura capture un projectile
de Nen adverse (référence : Franklin ; Culdcept ne garde qu’une carte, le reste de la
rafale touche Benjamin). Combo : Direct militaire → Percée de garde → Marteau royal → Air
Blow → accélération avant → Plaquage du premier prince → Rectangle d’aura → rafale de
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

Direct Shingen → Pas du maître → Crochet de maître → Balayage de pierre → accélération
avant → Projection Shingen → Vraie forme → Ken parfait → Poing de Ko → Impact total.
Huit touches ; Ken parfait 28, Poing de Ko 20, Impact total 40 en combo (55 hors combo).

- **Vraie forme pendant la capture** (`biscuitFormAction.ts`) : révéler le corps naturel
  ne frappe pas et ne démarre aucun coup ; pendant une capture de combo, la Projection
  continue. La forme reste pour la manche : puissance (×1,35, `hatsu.ts`), inertie du
  corps plus lourd (`fightPhysicalProfile.ts`) et portée (×1,12, `biscuitForm.ts`).
- **Chaînes de techniques** : capture → Ken parfait → Poing de Ko → Impact total sont
  des chaînes écrites ; aucun normal ne s’annule pour autant dans Ken parfait ou Poing
  de Ko (`duelComboDerivedGrammar.ts`).

## Dix tours, un poing — Phinks

Démarrer Ripper Cyclotron → accélération arrière en tournant → esquive basse en tournant
→ saut croisé → atterrissage derrière la cible → Direct de météore → Crochet de la Brigade
→ Épaule blindée → terminer le dernier tour → libérer Ripper Cyclotron. Quatre touches.

- **Rotation en mouvement** (`phinksCyclotron.ts`), dans tous les combats : le bras droit
  continue de tourner pendant les déplacements, les sauts, l’accroupi et les coups
  ordinaires. La garde, un coup reçu, une prise, une projection, une autre technique ou
  la libération l’arrêtent. Les coups ne reçoivent aucun bonus.
- **Esquive basse** (`phinksLowDodge.ts`) : bas maintenu + double appui avant, Phinks
  avance d’environ six unités accroupi au lieu de dasher.
- **Saut croisé** : le moteur ne pousse pas deux corps dont l’un dépasse 7 de hauteur ;
  après l’esquive, le saut passe au-dessus de la cible.
- **Libération en combo** (`phinksComboRelease.ts`) : avec au moins un tour complet, le
  poing droit annule un coup ordinaire confirmé dont la chaîne écrite le nomme (Épaule
  blindée), avance de 4 et atteint le corps que ce coup a mis au sol. Seule la
  libération consomme les tours.

## Règles générales ajoutées

| Règle                   | Fichier                               | Effet                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accélération            | `dashCancel.ts`, `CancelGrammar.dash` | Sur touche, un coup listé s’annule dans un dash par double appui. Chauffe le Ren de 50, comme une relance : deux au plus avant la surchauffe. Le coup qui interrompt ce dash peut toucher un corps à terre. |
| Capture en combo        | `throwRules.ts`, `duelMoves.ts`       | Une projection qui termine une accélération saisit un corps étourdi ou à terre (jamais en l’air), le retient sans le projeter et peut s’annuler par ses chaînes écrites.                                    |
| Emperor Time en capture | `kurapikaActions.ts`                  | Activable pendant une capture ou une Chain Jail confirmée.                                                                                                                                                  |
| Chaînes des spéciaux    | `duelComboGrammar.ts`                 | Un spécial de la grammaire garde aussi ses chaînes écrites. Seule Paume rapide → page au signet (Chrollo) en déclare une ; aucun normal n’ouvre la page au signet.                                          |
| Portée prolongée        | `accelCancel.ts`                      | Un coup annulé depuis un coup qui a atteint un corps à terre l’atteint aussi : la portée tient jusqu’à la fin de la route.                                                                                  |
| Corps plaqué au sol     | `groundedPin.ts`, `combatDamage.ts`   | Un coup de route (accélération, prise) qui atteint un corps à terre le pousse de 1,5 au plus.                                                                                                               |

Une commande entrée pendant le hitstop est perdue : le double appui d’une accélération
se joue après l’impact.

## Dans l’Académie

École de combat → « Combos signature » propose chaque combo en pratique et en
démonstration (`signatureSchool.ts`, `FightSignatureLessons.svelte`). L’exercice suit
les étapes réellement jouées : un coup qui démarre, une accélération, Emperor Time,
la pose de l’ancrage. Chaque touche doit prolonger le même combo ; une garde, un coup
hors route ou une cible qui se relève fait échouer l’essai. La démonstration passe par
les mêmes commandes de relecture, et l’ancrage par `match.queue`. Tous les combos y
figurent : la préparation est jouée au lancement de l’exercice, le tir est une étape
(commande Tir) et chacune de ses balles compte comme une touche du combo.
