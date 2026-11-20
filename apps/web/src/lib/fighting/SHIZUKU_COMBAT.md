# Shizuku · référence du combat contre Pike

La [vidéo fournie](https://www.youtube.com/watch?v=offfAn5eRhA) est un montage
sonorisé du combat contre Pike. Elle montre l’observation de la portée de sa
soie au début, la prise de Blinky à deux mains vers 0:27, puis l’aspiration du
sang et les tentatives de Pike pour boucher ses blessures. La gestuelle calme
et la gestion de la distance guident cette adaptation. Les variantes de coups
du duel ne sont pas présentées comme des techniques nommées de l’animé.

`keyPosesShizukuReference.ts` complète les coups courts, les balayages au tuyau,
les frappes aériennes, l’avancée et le revers en retrait. Le marteau déjà
présent dans `shizukuStrikeMotion.ts` reste la frappe lourde à deux mains.
`shizukuToolMotion.ts` étend les trajectoires de Blinky aux dix frappes : les
rotations atteignent leur pose de contact sur la première frame active,
la conservent pendant les impacts et reviennent pendant la récupération.
Les trajectoires suivent le compteur du coup, y compris pendant le hitstop.

`shizukuGrip.ts` pose la main gauche en soutien du Blinky réellement attaché
à la main droite anatomique, dans les deux orientations. Le solveur articulaire
existant conserve les longueurs des bras et ne déplace pas la bouche de l’outil.
Les projections gardent leur propre contrôleur de prise.

`shizukuCombatAi.ts` privilégie les coups courts au contact et les frappes de
Blinky à distance intermédiaire. Une plaie réelle et exposée permet ensuite
l’aspiration du sang. `shizukuFootwork.ts` utilise une marche ordinaire pour
chercher une distance de 11 à 17 unités lorsque cette application est possible.
L’attaque reste stationnaire et interruptible ; la récupération d’aura et les
blessures bouchées restent prises en compte. Ces distances sont des réglages du jeu.

L’aspiration d’objet exige un projectile visible, matériel, admissible et dans
l’ouverture du tuyau. Le rejet offensif exige un véritable dernier objet stocké ;
le simple souvenir d’une aspiration de sang ne déclenche pas ce rejet.

## Sacrifier ce qui était stocké

Chaque aspiration avale **un seul** objet : le plus proche de la matière nommée,
réelle et non vivante, dans l’ouverture du tuyau (`blinkyTargeting.ts`). Les
autres objets de cette matière restent en vol ; une création de Nen ou une aura
émise n’est jamais candidate. Le tuyau exige un trajet libre : une couverture
réelle ou l’ombrelle de Feitan entre la bouche et la cible arrête l’aspiration,
pour un objet comme pour le sang (`blinkyPathClear`). Le sang exige en outre une
plaie ouverte non couverte. Seul le dernier objet avalé peut être restitué :
aspirer un nouveau danger abandonne définitivement le précédent, sans historique.
`blinkyTargeting.test.ts` vérifie ces règles.

Les règles existantes de `blinky.ts` et `blinkyFrames.ts` conservent les matières
admissibles, les plaies, les coûts, les dégâts et les possibilités de défense.
Cette adaptation utilise le ruleset `clash-combat-67-shizuku-pike`.

```sh
pnpm --filter @black-whale/web exec vitest run src/lib/fighting/shizukuReference.test.ts src/lib/fighting/shizuku.test.ts src/lib/fighting/blinkyPresentation.test.ts src/lib/fighting/comboMotion.test.ts src/lib/fighting/fightBodyMotion.test.ts src/lib/fighting/fightReplay.test.ts
node apps/web/scripts/check-shizuku-reference.mjs
```

`ui-tests/shizuku-reference/` montre les 14 commandes dans trois phases et les
deux orientations. Une quinzième scène simule un vrai coup, un retrait et
l’aspiration du sang par la plaie obtenue. Le rejet utilise un dernier objet
préparé dans la fixture. Les 30 planches et leur rapport sont écrits dans
`output/shizuku-reference/`.
