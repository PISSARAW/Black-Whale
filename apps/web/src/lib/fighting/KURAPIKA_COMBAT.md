# Kurapika · références de combat

Les deux vidéos fournies guident la gestuelle de Clash :

- [Kurapika contre Uvogin](https://www.youtube.com/watch?v=2QBT3Vz24vo) :
  frappe aérienne et rotation du buste vers 0:41, attitude contenue dans
  les échanges, puis entrave visible sur Uvogin autour de 2:05.
- [Combat collectif de Phantom Rouge](https://www.youtube.com/watch?v=IJbF-3J6PhI) :
  référence secondaire de mise en scène et de préparation, notamment les yeux
  écarlates et le bras ramené devant le buste vers 0:17. Les gestes du film
  servent à la chorégraphie ; les conditions des chaînes viennent du moteur
  et de ses contrats existants.

`keyPosesKurapikaReference.ts` donne neuf gestes physiques : directs courts,
crochet au corps, balayage, frappes aériennes, avancée et contre en retrait.
La main libre protège le buste ; les poses atteignent le contact au début
des frames actives et le conservent pendant leur durée.
`keyPosesKurapikaCasts.ts` distingue les cinq commandes de chaîne.
La main droite anatomique conserve les chaînes dans les deux orientations.

`kurapikaChainMotion.ts` réserve désormais le déploiement aux commandes
spéciales : un coup de poing, un coup de pied et le pistolet physique ne lancent
plus automatiquement une chaîne. Les chaînes déjà maintenues restent
indépendantes des frappes : Chain Jail peut notamment coexister avec Holy Chain.
`kurapikaWhipPath.ts` dessine une boucle derrière l’embout du fouet divinatoire,
en conservant sa destination et sa portée. Le mouvement réduit garde une ligne
simple. Les modèles, les cinq embouts, les contacts et l’interception des balles
restent ceux de production.

`kurapikaCombatAi.ts` privilégie les frappes courtes au contact, puis les chaînes
à distance. Chain Jail n’est proposée que contre une cible autorisée.
L’IA conserve le soin et les applications de Steal Chain et Dolphin.
`kurapikaFootwork.ts` ajoute un retrait après une attaque réellement observée
et une approche pendant sa récupération. Ces dashes ordinaires restent
vulnérables. Après une capture effective, Kurapika marche à portée de Judgment
Chain en conservant l’entrave ; l’implantation exige toujours Emperor Time
et un contact valide.

Les noms des coups physiques sont actualisés dans `kurapikaMoveset.ts`.
Les dégâts, les coûts d’aura, les durées, les conditions de la Brigade,
les clauses du jugement et le prix d’Emperor Time restent inchangés.
Le découpage en commandes, les distances et les décisions d’IA sont des
adaptations de jeu. Les décisions de simulation utilisent le ruleset
`clash-combat-63-kurapika-reference`.

```sh
pnpm --filter @black-whale/web exec vitest run src/lib/fighting/kurapikaReference.test.ts src/lib/fighting/kurapika.test.ts src/lib/fighting/kurapikaChains.test.ts src/lib/fighting/kurapikaPresentation.test.ts src/lib/fighting/movesets.test.ts src/lib/fighting/fightReplay.test.ts
node apps/web/scripts/check-kurapika-reference.mjs
```

`ui-tests/kurapika-reference/` échantillonne les 14 commandes en préparation,
phase active et retour, dans les deux orientations. Une quinzième planche
montre une capture obtenue par le moteur sur Phinks, cible autorisée du roster.
Les 30 planches et le rapport sont écrits dans `output/kurapika-reference/`.
