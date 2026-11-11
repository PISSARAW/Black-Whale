# Notes de découpage (ADR-002)

Ce que les lots ont vu passer sans y toucher. Une ligne par constat : ce qui est
ici est un travail à faire ailleurs, jamais un edit glissé dans un commit de
déplacement.

## Méthode

- **Un découpage ne fait pas baisser la complexité.** Le seuil `max-lines`
  s'éteint quand le fichier est coupé ; `complexity` se mesure par fonction et
  suit la fonction dans son nouveau chemin. Un lot qui déplace sans rien
  d'autre fait donc _grandir_ la liste d'exemptions (un chemin devient N), ce
  que le cliquet refuse. La sortie est d'extraire les sous-expressions en
  fonctions nommées — du déplacement, pas une correction — dans le même commit.
  Constaté au lot MP : sept fonctions, aucune ligne de logique changée.

## Lot MP — `markerProjection`

- Rien à signaler : aucune envie de correction sur les 1 430 lignes déplacées.

## Costume Silent Majority — `humanCostume`

- Repéré, non corrigé : la coque `nen-zetsu-trace` (transparente, écrit la profondeur) entoure
  le corps et masque, selon l'ordre de tri, tout tissu dessiné avec `glow(jacket, 0.98)` placé
  loin de l'axe du corps. Les manches de Silent Majority prennent donc le noir opaque (`dark`) ;
  le tissu à 0,98 des autres silhouettes reste exposé au même tri.

## Postes devant une porte — `cast/quarters.ts`

- Repéré, non corrigé : `standingOutsideDoor` range les gardes par `seedOf(id) % 5`, donc deux
  gardes de la même porte peuvent tomber sur le même point. C'est le cas de Bladge et Nagmum
  devant la 1012 : ils sont dessinés l'un dans l'autre tant que Bladge ne marche pas.

## Mode Stratégie — `simulation.svelte.ts`, `+page.svelte`

- Repéré, non corrigé : Cat's Name (`strategy/catsName.ts`) désigne comme meurtrier la première
  unité adverse du lieu par ordre d'identifiant, pas celle qui a frappé Camilla.
- Le reste de l'audit du mode (objectif « confirmer des hostiles » qui compte les passants,
  « Rompre le pacte » sans pacte qui marque traître, retour aux factions sans `init`, garde
  invincible, unité éliminée sélectionnable en français…) attend son propre lot.
