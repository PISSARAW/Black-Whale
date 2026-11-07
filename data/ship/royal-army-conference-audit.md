# Salle de conférence de l'armée royale de Kakin — fidélisation des chapitres 350 et 380

La salle de conférence de l'armée royale de Kakin (située au Pont 4, identifiant spatial `tier-4-royal-army-conference-room` / intérieur `interior-royal-army-conference` / sous-espace `tier-4-royal-army-conference-room-floor`) bénéficie du traitement de fidélisation canonique de référence appliqué au salon du Roi Nasubi (chap. 382), à la chambre de la reine Unma (chap. 403) et à la chambre 1002 de la princesse Camilla (chap. 366, 389) : relecture approfondie des cases du manga, respect strict de l'emprise architecturale militaire et modélisation procédurale soignée de l'ensemble du mobilier de commandement et d'analyse tactique. Sources éditoriales : Yoshihiro Togashi / Shueisha, tomes 34, 36, chapitres 350 et 380.

## 1. Cases relues et scénographie canonique

La salle est le centre d'opération, de coordination de la sécurité générale et de commandement des forces militaires royales sur le *Black Whale* :

1. **Scène du briefing de sécurité militaire (Tome 36, Chapitre 380, p. 189)** :
   - *L'estrade et le pupitre de conférence* : l'officier conférencier de l'armée royale se tient sur l'estrade de présentation, à côté d'un pupitre biseauté intégrant microphones col de cygne et dossiers de briefing opérationnel.
   - *Le grand écran de projection vierge mural (`screen`)* : suspendu au mur nord immédiatement derrière l'orateur, un grand écran blanc de 7,5 m de large par 3 m de haut est logé dans un carter technique métallique à retombée motorisée.
   - *Le tableau mural de cartes tactiques (`chart-board`)* : disposé sur la paroi latérale ouest à gauche de l'écran, un grand panneau d'affichage clair de 5 m de long sur 2,5 m de haut présente les cartes détaillées des cinq ponts du navire, des quadrillages métriques et des plans de zonage de sécurité.
   - *La grande table de conférence en U (`table-head`, `table-port`, `table-starboard`)* : trois imposants segments de table en bois sombre et profilés d'acier forment un fer à cheval ouvert vers l'estrade et l'écran de projection. Chaque poste est équipé d'un micro de conférence encastré, de sous-mains de travail, de bloc-notes d'état-major et de carafes d'eau.
   - *Les 15 fauteuils de conférence (`chair-01` à `chair-15`)* : quinze sièges ergonomiques de commandement à haut dossier rembourré, accoudoirs profilés et piètement à cinq roulettes entourent la table en U (5 le long de la table de tête face au sud, 4 sur l'aile bâbord face à l'est, 4 sur l'aile tribord face à l'ouest, et 2 aux extrémités sud).

2. **Réunion de crise et coordination inter-armes (Chapitre 350)** :
   - Les représentants des différents corps de sécurité et officiers d'état-major s'y réunissent pour analyser les menaces de rébellion, de meurtre et les mouvements suspects entre les ponts civils et militaires.
   - Éclairage fonctionnel intense assuré par des rangées de plafonniers néons techniques industriels.
   - Goulottes techniques et chemins de câbles au sol assurant l'interconnexion sécurisée des terminaux.

## 2. Relevé métrique et architecture 3D

- **Volume de la pièce** :
  - Dimensions : 20 m de largeur (axe X : `[-10, 10]`) × 15 m de profondeur (axe Y : `[-7.5, 7.5]`).
  - Hauteur sous plafond : 5,0 m (axe Z : `[0, 5.0]`).
- **Écran de projection mural (`screen`)** :
  - Emprise : 7,5 m × 0,22 m, centré en `[0, -7.38]`, base à 1,0 m, hauteur 3,0 m (sommet à 4,0 m).
  - Détails : toile blanche mate antireflet, bordure noire de cadrage 16:9, carter d'enroulement supérieur en aluminium brossé et support mural tubulaire.
- **Panneau de cartes tactiques (`chart-board`)** :
  - Emprise : 0,22 m × 5,0 m, situé en `[-9.88, -3.0]`, base à 1,1 m, hauteur 2,5 m.
  - Détails : tableau blanc/beige magnétique avec cadre d'aluminium profilé, carte stylisée des ponts du *Black Whale*, grille de coordonnées militaires, repères de secteurs et porte-feutres inférieur.
- **Pupitre de conférencier (`lectern`)** :
  - Emprise : 1,0 m × 1,0 m, situé en `[-0.75, -3.25]`, hauteur 1,1 m.
  - Détails : caisson biseauté en chêne foncé et acier anthracite, plan incliné avec rebords pour documents, double micro col de cygne avec bonnette acoustique noire, voyant de contrôle et micro-enceinte de retour.
- **Table en U (3 éléments)** :
  - `table-head` : 7,5 m × 1,2 m × 0,75 m centré en `[0, -0.65]`.
  - `table-port` : 2,5 m × 3,6 m × 0,75 m centré en `[-2.5, 1.95]`.
  - `table-starboard` : 2,5 m × 3,6 m × 0,75 m centré en `[2.5, 1.95]`.
  - Finitions : plateau en chêne foncé à chanfrein acier, bande centrale passe-câbles avec trappes escamotables, micros de conférence individuels col de cygne et dossiers de briefing.
- **Les 15 sièges de conférence (`chair-01` à `chair-15`)** :
  - Emprise : 0,7 m × 0,7 m × 1,05 m pour chaque fauteuil.
  - Structure : colonne centrale pneumatique sur piètement étoile à 5 branches avec roulettes, assise et dossier haut galbé en cuir texturé anthracite, accoudoirs incurvés en métal brossé.

## 3. Conformité technique et intégration

- **TierView** :
  - Prise en charge dans `roomDetails` pour `tier-4-royal-army-conference-room-floor` via `buildRoyalArmyConferenceDetails(options)`.
  - Regroupement des géométries avec `BanquetDetailBuilder` en 2 batches maximum.
  - Respect strict du budget Three.js (< 150 000 triangles, zéro lumière permanente `THREE.Light`, libération complète GPU via `disposeBanquetDetails`).
- **Vues manga scénarisées** :
  - `royal-army-briefing-audience` : vue d'ensemble depuis l'assemblée vers l'estrade, l'écran et le tableau de cartes (chap. 380, p. 189).
  - `royal-army-lectern-stage` : vue rapprochée sur l'orateur, le pupitre et ses micros col de cygne devant l'écran géant.
  - `royal-army-tactical-maps` : cadrage focalisé sur le panneau de cartes tactiques du navire.
  - `royal-army-u-table-command` : vue plongeante valorisant la disposition d'état-major en fer à cheval et les 15 postes d'officiers.
- **Cartographie 2D et SVG** :
  - `royalArmyConferencePlan.ts` fournissant la projection géométrique exacte et `royalArmyConferenceSpotAnchors`.
  - Ancrages dans `roomAnchors.ts` raccordant les officiers et l'orateur.
  - Composant SVG `royal-army-office.svelte` enrichi des 15 sièges, de la forme en U exacte, du pupitre et des panneaux muraux.
