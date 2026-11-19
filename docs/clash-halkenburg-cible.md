# Halkenburg : cible touchée et variante de scénario

Le ruleset `clash-combat-46` conserve Halkenburg dans son corps après une
flèche normale et affecte le combattant effectivement touché. Le partisan
sélectionné parmi les membres prêts s'endort. Groupe marqué, consentement,
volonté réunie et accès au Nen restent nécessaires ; le On est conservé.

Le chapitre 382 montre la flèche traversant Culdcept, Sumidori s'effondrant et
le corps de Shikaku occupé par Sumidori. Il ne montre pas Halkenburg obtenant
un personnage aléatoire et son Hatsu. Voir le
[résumé du chapitre 382](https://hunterxhunter.fandom.com/wiki/Chapter_382).

L'expérience de remplacement par un corps du roster reste disponible dans
la préparation scénarisée, uniquement avec la case « Variante hors canon »
cochée. L'option est absente des états ordinaires et validée comme booléen
dans le protocole PvP et les replays. Un appel direct ne contourne pas ce choix.

Cela ne complète pas encore l'arsenal d'Halkenburg : l'immobilisation de
120 frames, le prix en PV et le temps de réunion sont des réglages du duel.
Les échanges de conscience, leurs suites et la protection collective demandent
encore une représentation complète et sourcée.

Les tests ciblés couvrent les deux camps, la cible réelle, le sommeil du membre
choisi, le refus du transfert hors variante, le verrouillage du Nen par le On,
la validation réseau et la relecture déterministe de la variante.
Le contrôle navigateur exerce le choix et les commandes à 1100, 390 et 320 px.

Code : [Hatsu](../apps/web/src/lib/fighting/hatsu/halkenburg.ts),
[transfert de variante](../apps/web/src/lib/fighting/halkenburgTransfer.ts),
[préparation](../apps/web/src/lib/components/fighting/FightPreparationSetup.svelte),
[tests](../apps/web/src/lib/fighting/halkenburgVariant.test.ts),
[contrôle navigateur](../apps/web/scripts/check-halkenburg-variant-ui.mjs).
