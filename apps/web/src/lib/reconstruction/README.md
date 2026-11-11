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
projection courante ou d’interrompre son indicateur de chargement.
`observedBy` applique le point de vue partout : carte, liste des personnages
et avatars de la scène 3D. Tant que la projection d’un personnage est absente
(chargement ou échec), il ne voit personne : jamais de repli sur le canon.

Les preuves (`evidence.ts`) portent des faits (chapitre, base de datation,
source résolue), jamais une phrase ni un identifiant interne. L’inspecteur les
formule dans la langue du lecteur.

`reconstructAt.ts` réunit la projection temporelle hors de la page Svelte. Les
événements du moteur y sont bornés par chapitre et séquence locale, car leur
ordinal appartient à une autre branche que celui des événements narratifs. La
résolution d’un pont remonte la hiérarchie des lieux une seule fois par état.

Le chargement serveur applique la limite de spoilers aux débuts et fins de
présence, aux premières apparitions des lieux et au chapitre de révélation des
événements du monde. Il construit aussi l’index des sources par identifiant
d’événement narratif avant d’envoyer les données au navigateur.

Les scénarios navigateur sont dans `tests/reconstruction-navigation.spec.ts` :
carte, panneaux, recherche, suivi, zoom, filtres, scène 3D, plein écran, lecture et
liens de point de vue, sur ordinateur et mobile.
