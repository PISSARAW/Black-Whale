# Extrémités procédurales et références GLB

Cette fiche fixe le contrat du chantier mains et pieds partagé par Tour et Clash.

## Cible

La qualité proche doit être comparable à un GLB à la caméra de combat, sans reproduire
son poids brut pour chaque personnage. Le corps procédural reste la base ; seules les
extrémités proches gagnent un sous-rig, tandis que les distances moyenne et lointaine
conservent leurs représentations actuelles.

| Niveau | Distance | Représentation |
| --- | ---: | --- |
| Proche | 0–8 m | main et pied skinnés |
| Moyen | 8–24 m | extrémités procédurales fusionnées |
| Lointain | au-delà de 24 m | trois masses du LOD humain |

Le budget de production est déclaré dans
`apps/web/src/lib/tour/humanExtremityBudget.ts`. Il limite une main à 1 500 triangles
et 16 os, un pied à 900 triangles et 4 os, et l'ensemble à quatre draw calls ajoutés.

## Mesurer les références

```sh
node apps/web/scripts/report-glb-extremities.mjs Hisoka.glb Feitan.optimized.glb
```

Le rapport lit directement le conteneur GLB : poids, primitives, sommets, triangles,
matériaux, skins, animations et nœuds dont le nom évoque une extrémité. Un fichier sans
noms anatomiques reste utilisable comme référence visuelle, mais pas comme contrat de rig.

Mesure du 25 novembre 2026 :

| Référence | Poids | Sommets | Triangles | Os du skin |
| --- | ---: | ---: | ---: | ---: |
| `Hisoka.glb` | 28 317 540 octets | 35 751 | 55 416 | 28 |
| `Feitan.optimized.glb` | 5 670 484 octets | 43 641 | 59 494 | 28 |

Les deux fichiers portent le corps entier dans une primitive unique. Le rapport ne prétend
donc pas attribuer leurs triangles aux seules mains et chaussures ; il fixe le plafond de
référence et confirme les ancrages main, pied et orteil disponibles dans leurs squelettes.

## Invariants

- `hand-left`, `hand-right`, `foot-left` et `foot-right` restent les ancrages publics.
- Les objets tenus gardent leur échelle et leurs règles physiques.
- Les hitboxes et longueurs de membres restent indépendantes de la finition graphique.
- Aucun buffer ni tableau d'animation n'est alloué pendant une frame.
- Le passage au LOD moyen ne change ni la simulation ni les contacts.

`humanExtremityBudget.test.ts` contrôle les ancrages et la borne géométrique de la base
procédurale avant l'introduction du sous-rig.
