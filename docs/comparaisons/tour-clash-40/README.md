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

Le contrat partagé accepte aussi des proportions contrôlées et optionnelles : longueur
du torse et des membres, largeur du bassin, pente des épaules et posture. Une omission
reste strictement neutre ; seules les ressemblances appuyées par les références du
catalogue activent ces écarts, de la même manière dans Tour et Clash.

Le même principe couvre maintenant les traits fins du visage. Les yeux, joues,
mâchoire, menton, sourcils, nez, bouche et cou peuvent être déclarés avec des bornes
strictes dans le catalogue ; le constructeur de tête commun les projette dans les deux
modes sans recopier une fiche faciale propre au combat.
Trente-six personnages à forte visibilité utilisent déjà cette voie, dont six membres de la
Brigade fantôme, douze figures royales et douze Hunters, Zodiaques ou chefs d’expédition ; les autres conservent
leurs directions historiques jusqu’à leur migration. La hauteur de tête des gabarits
particuliers, notamment Marayam et Zhang Lei, appartient elle aussi à cette déclaration bornée.
Les yeux ovales d’Oito restent une pièce de portrait dédiée, mais suivent désormais le contrat
commun `face-eye-*` et séparent contour, sclérotique, iris et reflet dans les deux modes.

La fixture source se trouve dans `apps/web/ui-tests/manga-cast/main.ts`. Son contrôle
reproductible couvre désormais cinq vues : corps frontal, visage frontal, trois-quarts,
profil et garde de combat. Les planches historiques ci-dessus restent la référence de la
révision indiquée ; une nouvelle capture ne les remplace qu'avec son manifeste de révision.
