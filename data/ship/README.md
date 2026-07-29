# La reconstruction du Black Whale

`blueprint.json` est le vaisseau en tant que **géométrie**, et non en tant que
dessin. C'est ce que parcourt la visite virtuelle ([`/tour`](../../apps/web/src/routes/tour)).

Il ne remplace pas les plans SVG de `apps/web/src/lib/assets/maps` et ne touche
pas à la carte `/ship` : celle-ci répond à _qui est où à tel événement_,
celui-ci à _comment le vaisseau est bâti_. Aucun passager, aucun chapitre,
aucune chronologie n'entre ici.

## Repère et échelle

Les plans de ponts sont dessinés dans un `viewBox` de 1000 × 600. Une unité de
ce `viewBox` vaut **0,35 m**.

Ce facteur est fixé par la **taille des pièces**, pas par la longueur du
vaisseau : les plans sont schématiques, ils disent ce qui jouxte quoi, pas
combien ça mesure. Lus au pied de la lettre à 1 m par unité, ils donnent une
salle de banquet de 450 m de long — un volume que personne ne peut parcourir. À
0,35, on obtient un appartement princier de 12 × 7 m et une salle de banquet de
157 × 25 m sous 9 m de plafond, et les proportions des plans sont conservées
exactement. La coque reconstruite fait alors 175 m : c'est la longueur de la
reconstruction, pas une mesure du Black Whale.

```
x = (svg.x - 500) × 0,35     +x vers tribord
z = (svg.y - 300) × 0,35     +z vers la poupe
y = elevation                +y vers le haut
```

Les ponts s'empilent dans l'ordre de la coupe du chapitre 349, le Tier 1 en
haut :

| Pont | `elevation` | Plafond par défaut |
| ---- | ----------- | ------------------ |
| 1    | 72 m        | 5 m                |
| 2    | 54 m        | 5 m                |
| 3    | 36 m        | 6 m                |
| 4    | 18 m        | 4,5 m              |
| 5    | 0 m         | 4,5 m              |

## Structure

- **`tiers`** — un pont : son élévation, sa hauteur sous plafond par défaut et
  le tracé de sa coque, échantillonné depuis les courbes de Bézier du plan.
- **`spaces`** — un volume que le visiteur peut traverser. `footprint` est un
  polygone simple fermé (le dernier point n'est pas répété), concave autorisé.
  `ceiling` à `null` reprend celui du pont.
- **`links`** — les liaisons **verticales** seulement (escaliers, sas, cloisons
  entre ponts). Ce sont les seules connexions qui portent une position, parce
  que les deux espaces ne partagent aucun mur.

Les **piliers** ne sont pas stockés non plus : `columnPositions` en pose une
grille dans tout espace de plus de 420 m², parce qu'une salle de cette portée
serait bâtie sur poteaux et qu'un volume vide ne donne au visiteur aucun repère
de distance. Le rendu et les collisions lisent la même fonction : un pilier
qu'on voit est un pilier qu'on contourne.

### Les portes ne sont pas stockées

Deux espaces qui partagent une portion de mur communiquent ; un espace qui n'en
partage aucune est scellé. Les ouvertures sont calculées au chargement par
`deriveDoorways` à partir de la seule géométrie.

C'est délibéré : on ne peut pas laisser traîner une porte qui ne mène nulle
part après avoir déplacé une cloison de deux mètres. En revanche une salle
devenue inaccessible fait échouer `validateBlueprint`, donc la suite de tests.

### `locationId`

Rattache un espace à `data/locations/locations.json`, pour que la visite et le
catalogue parlent du même lieu. `null` signifie que la reconstruction a inventé
cet espace. Plusieurs espaces peuvent partager un `locationId` : le pont des
canots a une moitié bâbord et une moitié tribord pour une seule fiche.

### `provenance` — ce que le manga soutient vraiment

| Valeur     | Sens                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| `panel`    | Une planche montre la salle ; sa forme y est relevée.                    |
| `plan`     | Elle figure sur la coupe du vaisseau, qui n'en donne pas l'intérieur.    |
| `inferred` | Rien ne la montre. Elle existe pour que le pont soit continu.            |

C'est la même exigence que `positionProvenance` dans
[`../CONVENTIONS.md`](../CONVENTIONS.md) : la reconstruction doit avouer ce
qu'elle invente. Les surfaces `inferred` sont rendues dans une teinte froide et
portent un badge dans l'interface — un couloir déduit ne doit jamais passer
pour du canon. `source` est obligatoire dans tous les cas ; pour `inferred`,
elle dit pourquoi l'espace a été ajouté, et ne doit pas citer de chapitre.

## Modifier le vaisseau

Ce fichier s'édite à la main, comme le reste de `data/`. Après toute
modification :

```bash
pnpm --filter @black-whale/web test
```

`validateBlueprint` vérifie qu'aucun espace n'en chevauche un autre sur le même
pont, que chaque `locationId` existe, que toute salle du catalogue présente à
bord est reconstruite, et que **le vaisseau entier reste connexe** — de la
chambre funéraire du pont 1 aux entrepôts du pont 5.
