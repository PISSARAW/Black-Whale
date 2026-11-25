---
titre: Visages lisibles dans Clash
etage: 2
couvre:
  - apps/web/src/lib/fighting/fightFaceReadability*
  - apps/web/src/lib/fighting/fightIdentityPortrait*
  - apps/web/src/lib/fighting/fighterFacing*
  - apps/web/ui-tests/fighting-face-readability/**
depend-de: [05-la-visite, 07-les-modes]
revu-le: 2026-11-17
decisions: [adr-002]
---

# Reconnaissance des combattants

La tête regarde l’adversaire de trois quarts (0,9 radian) plutôt que de profil
strict. Le corps, les gestes, les collisions et les directions des attaques
conservent leurs orientations. La rotation d’un changement de côté reste lissée.
Les poses particulières, les yeux fermés, les masques et les déguisements restent
ceux du moteur et du catalogue d’apparences.

`fightFaceReadability.ts` agrandit légèrement la tête dans le plan de l’écran autour
du vrai bas de visage, sans gonfler sa profondeur, renforce les sourcils et calcule
trois tons sur les normales de la peau. Les cheveux, moustaches et barbes restent
ainsi au contact du crâne et du menton dans la vue de trois-quarts. Les buffers sont
clonés puis partagés : le modèle commun de la visite conserve ses propres couleurs.
Aucun maillage, triangle, éclairage dynamique ou passage de rendu n’est ajouté.
Les matériaux gardent leur transparence, notamment pour la projection de Hanzo.

Le cadrage dynamique peut davantage se rapprocher lors d’un échange rapproché.
Les limites existantes gardent les deux corps visibles pendant les sauts, les
changements de côté et les formes spéciales. Les distances minimales des terrains
et le réglage de caméra stable restent prioritaires.

Les jauges affichent aussi un portrait de l’identité choisie : une image de
112 × 112 pixels du même modèle, sans équipement hors champ. La file de génération
est séquentielle ; chaque identité est calculée une seule fois par chargement de
l’application, puis réutilisée. Le contexte temporaire est libéré immédiatement.
Il n’y a ni boucle d’animation ni rendu 3D permanent pour ces portraits. Une absence
de WebGL conserve le nom et les jauges. Cette image fixe ne révèle pas un état Nen.

## Vérification

- `fightFaceReadability.test.ts` vérifie les quarante combattants et les six kaméos,
  l’ancrage du menton, la profondeur inchangée, la parenté des cheveux et barbes,
  la topologie inchangée, la conservation des signatures et le partage des buffers.
- `fightIdentityPortrait.test.ts` vérifie la mise en cache, la génération séquentielle,
  la libération des contextes et le repli en cas d’indisponibilité.
- Les suites de caméra, de direction et de roster couvrent les cadrages et les poses.
- Le banc `apps/web/ui-tests/fighting-face-readability` compare les mêmes modèles avant/après,
  expose tous les combattants et mesure 180 images avec statistiques de rendu.

Depuis `apps/web`, construire puis servir le banc avec :

```
pnpm exec vite build --config ui-tests/fighting-face-readability/vite.config.ts
pnpm exec vite preview --config ui-tests/fighting-face-readability/vite.config.ts
```

Ce banc mesure les deux personnages dans une scène simple. Ses FPS ne constituent
pas une promesse de cadence pour tous les téléphones ou tous les terrains.
