---
titre: Tour et Clash — comparaison des 40 personnages
etage: 2
couvre:
  - apps/web/src/lib/tour/humanFigure.ts
  - apps/web/src/lib/tour/humanModelFinish.ts
  - apps/web/src/lib/fighting/fighterFigure.ts
  - apps/web/src/lib/fighting/fightFaceReadability.ts
  - apps/web/ui-tests/manga-cast/**
depend-de:
  - docs/decision/adr-005-la-ressemblance.md
revu-le: 2026-11-17
---

# Tour et Clash — les 40 personnages

Comparaison capturée à la révision `8e82775d3ee527ed4fe1cab77f69893e9b162831`,
déployée le 17 novembre 2026. Les quarante combattants apparaissent dans l'ordre du roster.

- [Planche des 40 visages](./visages.png)
- [Planche des 40 silhouettes](./silhouettes.png)
- [Identités, révision, disposition et empreintes des images](./manifest.json)

Chaque groupe contient quatre personnages : **Tour en haut, Clash en bas**.
Le nom est placé au-dessus de chaque colonne. Les fichiers gardent la résolution
native de chaque modèle, soit 360 × 500 pixels par vue.

## Conditions de comparaison

Les vrais constructeurs du jeu sont rendus en WebGL : `buildHumanFigure` pour Tour,
`buildFightFigure` pour Clash. Les deux vues utilisent le même angle frontal,
la même échelle de caméra, la pose de repos et un éclairage uniforme. L'aura est
désactivée et les formes de base sont utilisées. Les quarante paires sont aussi
disponibles dans le relevé des silhouettes ; aucune erreur de rendu n'a été relevée.

## Différences propres au combat

Les finitions des yeux et du visage viennent du constructeur commun. Clash conserve
ses adaptations de lisibilité : visage agrandi, ombrage de la peau, sourcils accentués
et yeux de Kurapika ajustés. Les équipements et les adaptations corporelles propres
au combat restent visibles sur la planche des silhouettes.

La fixture source se trouve dans `apps/web/ui-tests/manga-cast/main.ts` ; ses vues
`face` et `body` ont été capturées avec une rotation frontale nulle pour les deux modes.
