# Combos signature

Un combo signature tient dans **un seul compteur**, du premier coup à la technique
finale, contre un mannequin qui garde dès qu’il le peut. Il passe par les vraies
commandes : déplacements et commandes de Hatsu sont des étapes à part entière.
Les définitions sont dans `signatureCombos.ts` et `signatureCombosSecond.ts`, le
lecteur de route dans `signatureComboRunner.ts` (étapes hors frappe dans
`signatureComboSteps.ts`) et les vérifications dans `signatureCombos.test.ts`
(miroir et deux distances de départ) et `signatureCombosSecond.test.ts`.
Ruleset `clash-combat-85`.

Deux routes contiennent une **coupure voulue** : fermer les yeux pour la vision de
Tserriednich, encaisser la riposte de Feitan. La frappe suivante ouvre un nouveau
compteur (`signatureComboCounts`).

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

## Dix secondes d’avance — Tserriednich (Spécialisation)

Recul tactique → Zetsu, yeux fermés → vision du futur → ouverture des yeux →
accélération vers l’angle sûr → Tir aux jambes → Pas princier → Coup de crosse →
Fauchage calculé → Angle mort. Une touche, la coupure de la vision, puis cinq touches
en un compteur.

- **Le recul protège le Zetsu.** La préparation de 30 frames reste vulnérable et
  s’interrompt sur un coup ; Recul tactique crée la place pour la mener.
- **La divergence est la seule récompense.** Pendant la divergence, l’adversaire
  rejoue les commandes de la vision et vise l’image prévue. Diverger — ici, une
  accélération qui passe à travers lui, hors de la trajectoire prévue — puis frapper
  avant le coup annoncé lui fait perdre l’échange. Contre Phinks, Feitan et Hisoka
  pilotés par l’IA, la route passe sans perdre un point de vie.
- **Le futur n’esquive jamais.** Yeux ouverts et immobile, Tserriednich reçoit le coup
  annoncé par la vision. Ni la vision ni l’accélération ne donnent d’invulnérabilité ;
  le passage garde tous les volumes touchables.
- **Angle mort par relance.** Le profil dérivé de Tserriednich active la relance
  (`relance: true`) : Fauchage calculé s’annule dans Angle mort, qui touche le corps
  que le fauchage vient de mettre au sol.

La garde du moteur n’est pas directionnelle : passer dans le dos ne casse pas une garde
par lui-même. C’est l’engagement de l’adversaire dans le futur prévu qui ouvre la route.

## Douleur en vitesse — Feitan (Transformation)

Entaille basse → Estoc en course basse → accélération traversante → Revers de retrait →
Taille de sabre → Fauchage éclair → encaisser volontairement une riposte → Pain Packer
→ projection vers la zone chaude → Rising Sun. Cinq touches, la coupure de la riposte,
puis la projection et la chaleur.

- **Accélération traversante.** Sur touche, l’Estoc en course basse s’annule dans un
  dash qui passe à travers l’adversaire (`dash: { forwardLight: 'through' }`) : c’est
  l’équivalent 2D des passages bas de la référence. Son pic est 1,4 fois celui du dash
  ordinaire, sans invulnérabilité : un coup rencontré pendant le passage touche.
- **Revers sorti du passage.** Seul un Revers de retrait lancé depuis l’accélération
  s’enchaîne dans la Taille de sabre (`accelInto`). La chauffe du Ren borne ce cycle
  (Taille → Estoc → Revers) à deux tours.
- **La riposte est réelle.** Pain Packer exige des blessures et refuse la route sans
  riposte. Il emmagasine exactement les points de vie perdus ; une riposte plus lourde
  donne un soleil plus large et plus brûlant.
- **Zone chaude.** Tant que la tenue de Pain Packer est portée, la projection de Feitan
  retient sa cible à ses pieds au lieu de la projeter (`comboCapture.ts`) : Rising Sun,
  centré sur Feitan, la brûle. La tenue protège Feitan de sa propre chaleur, pas des coups.

## Règles générales ajoutées

| Règle                   | Fichier                               | Effet                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accélération            | `dashCancel.ts`, `CancelGrammar.dash` | Sur touche, un coup listé s’annule dans un dash par double appui. Chauffe le Ren de 50, comme une relance : deux au plus avant la surchauffe. Le coup qui interrompt ce dash peut toucher un corps à terre. |
| Capture en combo        | `throwRules.ts`, `duelMoves.ts`       | Une projection qui termine une accélération saisit un corps étourdi ou à terre (jamais en l’air), le retient sans le projeter et peut s’annuler par ses chaînes écrites.                                    |
| Emperor Time en capture | `kurapikaActions.ts`                  | Activable pendant une capture ou une Chain Jail confirmée.                                                                                                                                                  |
| Passage                 | `signatureCrossing.ts`                | Une accélération `through`, ou le dash avant de Tserriednich pendant sa divergence, ignore les boîtes de poussée. Volumes touchables et gardes inchangés.                                                   |
| Chaînes d’accélération  | `CancelGrammar.accelInto`             | Un coup lancé depuis une accélération gagne les chaînes listées ; la chauffe du Ren les borne.                                                                                                              |
| Relance dérivée         | `DuelComboProfile.relance`            | Un profil à grammaire dérivée peut activer la relance (spécial → spécial plus tardif sur touche).                                                                                                           |
| Zone chaude             | `comboCapture.ts`                     | Sous Pain Packer revêtu, la projection de Feitan retient sa cible sans la projeter.                                                                                                                         |

Une commande entrée pendant le hitstop est perdue : le double appui d’une accélération
se joue après l’impact. Les combos signature ne sont pas encore proposés comme leçons
de l’Académie, dont les routes ne connaissent que des coups.
