# L’héritage de Beyond

Deux variantes après verdict : `beyond-curse-furykov` et `beyond-curse-longhi`.
Le prince demeure `frame.fighter` et le gagnant du duel ; le porteur demeure
le perdant. La variante sélectionne un autre réalisateur, habillage et son,
indépendamment de leurs nouvelles victoires personnelles `longhi` et `furykov`.

## Déclenchement et scénario

Le duel doit être terminé par `knockout`, avec le porteur à zéro PV, face à
Benjamin, Camilla, Tserriednich ou Halkenburg. Les points, décisions au temps,
TKO, expulsions, égalités, entraînements, prévisions et replays sont exclus.
Les autres adversaires gardent leur propre cinématique habituelle.

Un K.-O. du moteur n’est pas en soi une mort : la cinématique montre un coup
de grâce supplémentaire puis la mort du porteur à l’image 72. Le sceau ne
s’éveille qu’ensuite. L’hypothèse de scénario est explicite dans le code et le
rapport : **le prince de ce duel était la cible désignée avant le combat**.
Ce choix ne prétend pas révéler les cibles encore inconnues du manga et
n’ajoute pas une règle de vengeance automatique sur n’importe quel tueur.

Le sceau sous la langue et le Nen après la mort proviennent des révélations
de Longhi (401) et Furykov (413). L’œil agrandi, les filaments et la mort du
prince sont une représentation imaginée pour cette Fatality, sans nouvelle
prétention canonique sur l’aspect ou les étapes exactes de la malédiction.

## Dix secondes à 60 images/s

| Image | Action |
| --- | --- |
| 60 | Coup physique du prince sur la surface réelle du torse |
| 72 | Mort du porteur, début de sa chute native |
| 156 | L’œil sous la langue s’ouvre, plan rapproché |
| 234 | Le Nen post mortem sort du corps |
| 306 | La malédiction atteint le prince désigné |
| 336–431 | Gros plan sur la lutte et la panique du prince |
| 432 | Mort du prince et seconde chute native |
| 510 | Fatality, les deux corps restent présents |

Les deux effondrements utilisent `nativeVictoryFall`, ses contacts physiques
et ses poses de KO. Aucun `root.rotation.z` n’imite une chute. Les rôles sont
permutés seulement dans le contexte de rendu de la seconde chute ; les données
du combat restent immuables. Aucun événement de malédiction, dommage, changement
de vainqueur, retour à la vie ou modification des Hatsu n’est envoyé au moteur.

La caméra de confort garde un plan large fixe et les effets ne nécessitent
aucun clignotement. La transaction restaure modèles, yeux, poses, matériaux,
caméra et accessoires après chaque image ; seuls les objets créés sont libérés.
Le mix partage les mêmes repères pour les deux porteurs et ne contient aucune
réplique française. Seule l’annonce « Fatality » est parlée en anglais.

## Vérification et export

`beyondCurse.test.ts` contrôle la sélection sur tout le roster, les exclusions,
les deux côtés, les quatre princes, les deux chutes et la restauration complète.
`beyondCurseFilm.ts` produit d’abord un vrai K.-O. dans une simulation continue.
`check-beyond-curse.mjs` vérifie les huit associations dans le navigateur puis
dans le composant Clash, le mobile, le confort réduit, les sons et le passage.

Depuis la racine :

```sh
node apps/web/scripts/render-beyond-curse.mjs
node apps/web/scripts/render-beyond-curse.mjs --longhi
node apps/web/scripts/compose-beyond-curse.mjs
node apps/web/scripts/check-beyond-curse.mjs
```

Sorties : `output/fighting-beyond-curse/{furykov,longhi}/` en 1080p60, dix secondes.
Les sons intégrés se trouvent dans `static/clash-victories/beyond-curse-*.m4a`.
