# Feitan — références du combat contre Zazan

Les deux vidéos fournies servent de référence aux gestes de Black Whale Clash :

- [Début du combat](https://www.youtube.com/watch?v=WzdasEZq1sA) : les échanges
  autour de 0:58 montrent le sabre et le bras libre ; les séquences autour de
  1:27–1:57 insistent sur les bonds et le passage très bas sous les attaques.
- [Suite du combat](https://www.youtube.com/watch?v=T3RY6RsKHFE) : les passages
  autour de 0:20–1:23 montrent les approches rapides, les changements de hauteur
  et l’emploi du parapluie ; la suite montre la blessure et la riposte solaire.

Les douze attaques physiques ont des poses dédiées dans `keyPosesFeitanBlade.ts`.
Les estocs prolongent leur pointe pendant les frames actives ; les tailles
poursuivent leur arc après le contact, puis le bras revient à la garde. Les
coupes lourdes arment le sabre au-dessus de la tête. Les deux orientations
conservent le sabre dans la main gauche anatomique, avec le parapluie dans la
droite. Une courte trace suit la lame réelle pendant les tailles actives.
`feitanLocomotion.ts` abaisse les appuis par les hanches et les genoux, avec un
bras armé fléchi pendant les déplacements et les bonds.

La comparaison avec la première vidéo corrige le bras armé vers 0:58 et les
appuis bas vers 1:57. Dans la seconde, les passages vers 1:02–1:07 guident la
prise du manche à la bouche et la toile bordeaux portant un crâne noir. Le
parapluie se déploie radialement en 10 frames et reste ouvert dans une fenêtre
totale de 54 frames. Sa commande d’arsenal, sa préparation vulnérable et son
interruption sur impact restent effectives. La toile masque la vision ; elle
n’accorde ni bouclier ni invulnérabilité. Le tir possède sa propre pose de visée.

`feitanCombat.ts` règle les attaques courtes, les estocs et les revers de retrait.
Avant + L, bas + L et arrière + L sont des frappes physiques sans dépense d’aura,
utilisables en Zetsu et soumises à la présence de l’arme. Leurs noms, coûts,
portées et durées sont des adaptations du duel, pas des mesures de l’animé.
La marche avant passe de 36,38 à 43,28 unités/s, soit environ +19 %.
Le recul conserve 96 % de cette vitesse. Le dash avant culmine à 140 unités/s
sur 14 frames ; le retrait culmine à 124 unités/s sur 12 frames. Ces accélérations
restent des déplacements physiques soumis aux collisions et aux interruptions.
Les cancels confirmés et les règles de garde restent appliqués par le moteur.
Les projections existantes restent des chorégraphies de jeu.

L’IA conserve sa sélection personnelle d’attaques physiques dans le sélecteur
d’arsenal et alterne attaques basses, pointes et tailles. Elle exploite son parapluie
ouvert, utilise des dashes finis et alterne certaines approches avec un vrai saut,
préparation comprise. Un retrait face à une attaque exige une observation et le
délais de réaction du moteur. Une attaque haute observée peut provoquer un
accroupissement ; une attaque basse peut provoquer un saut avec préparation.
Ces gestes restent soumis aux collisions ordinaires. Elle ne lit aucune entrée cachée, ne se téléporte
pas, et ne gagne aucune invulnérabilité. Après une blessure réelle et avec de
l’espace et au moins 20 % de sa vie perdue (minimum 20 PV), elle peut préparer
Pain Packer ; le soleil exige ensuite sa tenue
chargée. Les règles de [Pain Packer et Rising Sun](./FEITAN_PRESENTATION.md)
continuent de gérer les blessures, la protection et la chaleur.

Ces corrections ont été introduites avec `clash-combat-65-feitan-motion` et sont
conservées dans les rulesets suivants.
Les replays et clients d’une version antérieure ne doivent pas être mélangés.

### Boucle du jab (`clash-combat-78`)

Le léger debout de Feitan démarre en 3 frames. Le lourd debout, l’avant + léger et
l’arrière + lourd laissaient +4 sur touche : le jab s’y liait, puis se rechaînait
dans le lourd et l’avant + léger. Comme Feitan suit la grammaire de cancels, la
réduction du hitstun au sol (`groundedComboStun.ts`) ne s’applique pas à lui, et la
boucle jab > lourd > avant + léger enchaînait 60 touches au coin sans garde possible.
Ces trois normaux perdent une frame de hitstun (+3 sur touche) : plus aucun link
vers le jab. Le bas + léger garde +4, car rien ne se rechaîne vers lui. Les cancels,
les dégâts et les timings ne changent pas. `groundedLinkLoops.test.ts` vérifie, pour
chaque personnage à grammaire, qu’aucun link ne mène à un coup qui se rechaîne vers
le coup de départ.

Le jeu adapte ces gestes à un plan de combat en 2D : les déplacements circulaires
et les changements de caméra de l’animé ne peuvent pas être reproduits à l’identique.

```sh
pnpm --filter @black-whale/web exec vitest run src/lib/fighting/feitanCombat.test.ts src/lib/fighting/feitanPain.test.ts src/lib/fighting/feitanUmbrella.test.ts src/lib/fighting/feitanScene.test.ts
node apps/web/scripts/check-fighting-feitan-combat.mjs
node apps/web/scripts/check-fighting-feitan.mjs
```

La planche de contrôle utilise les modèles, les poses et l’arme de production :
12 attaques et 4 déplacements, dans trois phases et les deux orientations.
Les captures et les positions des contacts sont dans `output/clash-feitan-combat/`.
