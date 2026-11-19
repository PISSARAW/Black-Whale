# Hanzo — corps-à-corps de l’examen Hunter

Les deux vidéos fournies guident la gestuelle :

- [Version 1999](https://www.youtube.com/watch?v=SFitXNQIkEY), notamment 0:40–0:55 :
  interception rapprochée, main ouverte relevée et corps relativement droit.
- [Version 2011](https://www.youtube.com/watch?v=go3WhJykMjw), notamment 1:05–1:25 :
  différence de vitesse, entrée au contact et maîtrise du corps adverse.

L’adaptation conserve une attente calme et peu oscillante. Les douze attaques
physiques ont des poses dédiées : main ouverte, tranchant de la main, paume de
contrôle, revers et attaques de jambes adaptées au duel. Chaque geste atteint
son contact au début des frames actives, le maintient puis revient à la posture.
La jambe de frappe se déplie depuis la vraie pose basse ou aérienne ; les
articulations restent limitées et les segments gardent leur longueur. La
correction d’appui de Hanzo suit les vertices des semelles après les rotations
de cheville, pour garder un pied au sol pendant ses frappes et ses déplacements.

La marche garde le haut du corps posé. Le dash avant dispose de trois temps
lisibles — poussée, déplacement, réception — sur 14 frames, contre 12 pour le
recul. Ces déplacements passent par la physique, les collisions et les
interruptions ordinaires. Leurs vitesses sont des réglages de jeu.

L’IA privilégie les approches physiques, alterne frappes hautes et basses,
contrôles rapprochés et projections. Son retrait exige une attaque effectivement
observée et le délai de réaction existant. Skill 4 devient une préparation
occasionnelle à grande distance. Son coût, sa préparation et la vulnérabilité
du corps endormi conservent leurs règles ; le double reste régi par le chapitre 372.

La lame dissimulée du bras droit est un équipement physique du chapitre 34,
visible dans la [référence 2011](https://www.youtube.com/watch?v=go3WhJykMjw).
Avant + L déclenche un estoc et arrière + L un revers avec retrait. Le métal
conserve sa longueur et coulisse dans son fourreau sur l’avant-bras : sortie
pendant la préparation, pleine extension au contact, rangement pendant la
récupération. Les deux orientations gardent l’arme au bras droit anatomique.
Les paumes, prises, frappes basses et gestes neutres conservent la lame rentrée.

Ces deux frappes sont utilisables sans aura et en Zetsu ; elles sont refusées
après confiscation et ne fournissent pas d’arme physique au double de Nen ni à
un voleur de Skill 4. Une confiscation pendant la préparation interrompt la
frappe avant le contact. Bas + L conserve son balayage physique. L’IA choisit
également les attaques de lame lorsque l’équipement est disponible.
Les noms, portées et durées restent des adaptations du duel. Les huit combos
fondamentaux et leurs confirmations restent disponibles. Le ruleset courant
est `clash-combat-69-hanzo-blade`.

```sh
pnpm --filter @black-whale/web exec vitest run src/lib/fighting/hanzoBlade.test.ts src/lib/fighting/hanzoCombat.test.ts src/lib/fighting/hanzoProjection.test.ts src/lib/fighting/duelComboSecond.test.ts src/lib/fighting/fighterMovement.test.ts src/lib/fighting/fightReplay.test.ts
node apps/web/scripts/check-hanzo-combat.mjs
```

Le contrôle navigateur utilise les figures et les poses de production : douze
frappes et quatre déplacements en préparation, contact et récupération, dans
les deux orientations, avec contrôle du bras armé, du déploiement et des refus
après confiscation ou projection. Le rapport et les captures sont dans
`/tmp/clash-hanzo-combat/` (`HANZO_COMBAT_OUTPUT` permet de changer la destination).
