# Prêt Dolphin : réserve du donneur et relais

Le ruleset `clash-combat-47` raccorde le canal du combattant supplémentaire
aux réserves d'aura prélevée déjà utilisées par les autres applications de
Stealth Dolphin. Le destinataire exécute le Hatsu avec la quantité et les
affinités conservées du donneur. Sa propre aura ne paie pas l'usage et ne
compense pas une réserve prélevée insuffisante.

Le prêteur reste relié au destinataire pendant son attaque et ses projectiles.
Les dépenses et les effets maintenus sont répercutés vers Kurapika, qui continue
à payer Emperor Time. La technique ne retourne plus prématurément à son
propriétaire pendant que le tiers l'utilise.

Le relais d'un allié ayant reçu Dolphin redevient possible : les personnes dont
Dowsing a mémorisé l'apparence sont des connaissances conservées, pas une
technique active à suspendre. Les entraves, sceaux, effets actifs et corps
engagés restent soumis aux contrôles de relais existants.

Le volontaire tiré du roster reste une adaptation de scénario. L'injection à
une personne ou à un allié réellement présent est un autre chemin, conservé.
Ces corrections ne certifient pas l'ensemble de l'arsenal de Kurapika à 100 %.

Code : [canal du tiers](../apps/web/src/lib/fighting/dolphinLoan.ts),
[réserve commune](../apps/web/src/lib/fighting/dolphinRosterSupply.ts),
[relai](../apps/web/src/lib/fighting/teamRelayRules.ts),
[tests de réserve](../apps/web/src/lib/fighting/dolphinRosterSupply.test.ts),
[tests d'injection et relais](../apps/web/src/lib/fighting/dolphinLoanTeam.test.ts).
