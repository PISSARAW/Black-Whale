# Combos signature

Un combo signature tient dans **un seul compteur**, du premier coup à la technique
finale, contre un mannequin qui garde dès qu’il le peut. Il passe par les vraies
commandes : déplacements et commandes de Hatsu sont des étapes à part entière.
Les définitions sont dans `signatureCombos.ts`, le lecteur de route dans
`signatureComboRunner.ts` et les vérifications dans `signatureCombos.test.ts`
(miroir et deux distances de départ). Ruleset `clash-combat-84`.

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

## Règles générales ajoutées

| Règle                   | Fichier                               | Effet                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accélération            | `dashCancel.ts`, `CancelGrammar.dash` | Sur touche, un coup listé s’annule dans un dash par double appui. Chauffe le Ren de 50, comme une relance : deux au plus avant la surchauffe. Le coup qui interrompt ce dash peut toucher un corps à terre. |
| Capture en combo        | `throwRules.ts`, `duelMoves.ts`       | Une projection qui termine une accélération saisit un corps étourdi ou à terre (jamais en l’air), le retient sans le projeter et peut s’annuler par ses chaînes écrites.                                    |
| Emperor Time en capture | `kurapikaActions.ts`                  | Activable pendant une capture ou une Chain Jail confirmée.                                                                                                                                                  |

Une commande entrée pendant le hitstop est perdue : le double appui d’une accélération
se joue après l’impact. Les deux combos ne sont pas encore proposés comme leçons de
l’Académie, dont les routes ne connaissent que des coups.
