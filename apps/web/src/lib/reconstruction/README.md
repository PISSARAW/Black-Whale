---
titre: Reconstruction vivante
etage: 2
couvre:
  - apps/web/src/lib/reconstruction/**
  - apps/web/src/lib/components/reconstruction/**
depend-de: [01-le-canon, 05-la-visite, 09-la-facade-web]
revu-le: 2026-11-06
empreinte: 5f5a977
decisions: [adr-003, adr-005, adr-006]
---

# Reconstruction vivante

La route garde la reconstruction canonique, les présences, la lecture et les
interactions Nen. Les composants `apps/web/src/lib/components/reconstruction` présentent cet état :

- `ReconstructionWorkspace` organise la carte ou la scène, le point de vue et
  les panneaux ouverts à la demande.
- `ReconstructionViewport` assure le zoom et le déplacement de la carte. La
  sélection d’un personnage n’est pas déclenchée après un glissement.
- La carte regroupe les présences par pont. Un groupe ouvre la liste filtrée ;
  la sélection, le suivi et l’entrée en scène restent individuels. Les noms ou
  une technique Nen rétablissent les marqueurs détaillés.
- `ReconstructionTransport` permet la lecture et le choix d’un instant.
- `ReconstructionDrawer` gère le dialogue natif, Échap et le retour du focus.
- La chronologie, l’inspecteur et les filtres gardent leurs propres contrôles.

L’URL partageable conserve événement, observateur, vue, suivi et filtres. Les
changements locaux utilisent `replaceState` de SvelteKit afin de ne pas relancer
le chargement serveur à chaque événement. Le chargement initial reste celui de
la route ; le point de vue utilise sa propre requête annulable.
La comparaison utilise `window.location` : cette version de `replaceState` ne
met pas à jour `$page.url`, et une comparaison avec ce store crée une boucle.

`PerspectiveLoader` empêche une ancienne réponse annulée de remplacer la
projection courante ou d’interrompre son indicateur de chargement. La carte
masque les présences pendant le changement de point de vue.

Les scénarios navigateur sont dans `tests/reconstruction-navigation.spec.ts` :
carte, panneaux, recherche, suivi, zoom, filtres, scène 3D, plein écran, lecture et
liens de point de vue, sur ordinateur et mobile.
