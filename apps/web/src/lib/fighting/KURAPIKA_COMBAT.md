# Kurapika · références de combat

Trois vidéos fournies guident la gestuelle de Clash :

- [Kurapika contre Uvogin](https://www.youtube.com/watch?v=2QBT3Vz24vo) :
  frappe aérienne et rotation du buste vers 0:41, attitude contenue dans
  les échanges, puis entrave visible sur Uvogin autour de 2:05.
- [Combat collectif de Phantom Rouge](https://www.youtube.com/watch?v=IJbF-3J6PhI) :
  référence secondaire de mise en scène et de préparation, notamment les yeux
  écarlates et le bras ramené devant le buste vers 0:17. Les gestes du film
  servent à la chorégraphie ; les conditions des chaînes viennent du moteur
  et de ses contrats existants.
- [Kurapika contre Uvogin, anime de 1999](https://youtu.be/x7y44OEt1VU) :
  garde haute verticale vers 4:40, disparition en pas-éclair et rémanence vers
  4:46, réception bras levé puis vrille horizontale vers 4:49–4:52, glissade
  basse et reprise sur un genou. Ces gestes enrichissent la garde et les dashes
  ordinaires : ils ne créent ni téléportation, ni invulnérabilité.

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

## Audit visuel équivalent à Feitan

Le verdict ne repose pas seulement sur les dégâts et les contrats Nen. Les trois
états de Kurapika doivent se reconnaître à leur silhouette : la mobilité sèche de
1999, le duel à mains nues et aux chaînes de 2011, puis la discipline de garde du
corps du Black Whale. Aucun de ces apports ne change une hitbox, une frame
d'invulnérabilité ou une condition de Hatsu.

| Source                                                                                                                                                                                          | Marqueur retenu                                                                          | Exécution dans Clash                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Uvogin 1999, 4:40                                                                                                                                                                               | Garde verticale, avant-bras haut                                                         | `KURAPIKA_1999_GUARD` ; la garde conserve le bras libre près du buste.                                                                                |
| Uvogin 1999, 4:46                                                                                                                                                                               | Disparition et réapparition en pas-éclair                                                | Trois rémanences de corps entier aux frames 1, 4 et 8 ; occultations graphiques aux frames 2–3 et 7. Le dash simulé reste celui de `fighterMovement`. |
| Uvogin 1999, 4:49–4:52                                                                                                                                                                          | Réception bras levé, vrille horizontale, glissade basse                                  | `KURAPIKA_BIG_BANG_GUARD` pendant le blockstun ; backdash en vrille puis reprise sur un genou.                                                        |
| Uvogin 2011, 0:41                                                                                                                                                                               | Frappe aérienne et rotation compacte                                                     | Poses `airLight`, `airHeavy` et frappes courtes dans `keyPosesKurapikaReference.ts`.                                                                  |
| Uvogin 2011, 2:05                                                                                                                                                                               | Entrave visible, puis approche sans relâcher                                             | Chain Jail reste maintenue pendant la marche vers la portée de Judgment Chain.                                                                        |
| Black Whale, [ch. 360](https://hunterxhunter.fandom.com/wiki/Chapter_360), [361](https://hunterxhunter.fandom.com/wiki/Chapter_361) et [364](https://hunterxhunter.fandom.com/wiki/Chapter_364) | Protection de Woble/Oito, arme de service, neutralisation de Sayird et Vincent avec Bill | Dégainé et visée à deux mains distincts des chaînes ; garde compacte, Steal Chain et Dolphin conservent leurs conditions réelles.                     |

Le Black Whale ne montre pas un troisième long duel solo comparable à Uvogin.
L'adaptation n'invente donc ni acrobatie ni technique offensive supplémentaire :
elle reprend les gestes attestés de protection en espace clos, le pistolet physique,
la contention et les chaînes d'information. En particulier, le tir n'utilise plus
la pose de lancement de Chain Jail : `kurapikaPoses.ts` lui donne un dégainé et une
visée propres à la période du navire. Le manga atteste l'arme tenue et mise en joue,
pas un tir de Kurapika dans ces scènes : la balle reste l'extrapolation de duel déjà
présente, explicitement matérielle, sans aura ni nouvelle capacité.

`kurapikaSpeedScene.ts` porte les rémanences de corps entier et l'occultation très
brève. Elles sont supprimées avec l'option de confort des flashes et restaurent
toujours le modèle réel à la fin. `kurapikaIdentity.test.ts` contrôle explicitement
que cette disparition n'accorde aucune invulnérabilité. La couleur passe du bleu
froid à l'écarlate sous Emperor Time, sans transformer la vitesse en effet de Nen.

### Points désormais conformes

1. silhouette de garde identifiable dans les deux adaptations d'Uvogin ;
2. vitesse visible par corps entiers, et non par une simple valeur numérique ;
3. disparition de montage séparée de la collision ;
4. vrille de retrait, glissade et reprise basse de 1999 ;
5. coups courts, frappe aérienne, main libre protectrice et chaînes distinctes de 2011 ;
6. pistolet, visée et retenue de garde du corps propres au Black Whale ;
7. Chain Jail limitée à la Brigade, Steal Chain/Dolphin et coût d'Emperor Time inchangés.

```sh
pnpm --filter @black-whale/web exec vitest run src/lib/fighting/kurapikaReference.test.ts src/lib/fighting/kurapika.test.ts src/lib/fighting/kurapikaChains.test.ts src/lib/fighting/kurapikaPresentation.test.ts src/lib/fighting/movesets.test.ts src/lib/fighting/fightReplay.test.ts
node apps/web/scripts/check-kurapika-reference.mjs
```

`ui-tests/kurapika-reference/` échantillonne les 14 commandes en préparation,
phase active et retour, dans les deux orientations. Une quinzième planche
montre une capture obtenue par le moteur sur Phinks, cible autorisée du roster.
Les 30 planches et le rapport sont écrits dans `output/kurapika-reference/`.
