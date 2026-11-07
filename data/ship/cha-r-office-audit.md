# Bureau de la famille Cha-R — fidélisation des chapitres 379 & 380

Le repaire opérationnel de la famille mafieuse Cha-R au Pont 5 (`tier-5-cha-r-family-office`) est fidélisé d'après les planches des chapitres 379 et 380 de Yoshihiro Togashi (*Hunter x Hunter*, volume 36).

---

## 1. Planches relues & Scénographie canonique

Dans les chapitres 379 et 380, la Brigade Fantôme (Phinks, Feitan, Nobunaga) s'invite dans la planque des Cha-R pour négocier un accord de traque mutuelle :

1. **Salle principale à l'emblème** (`tier-5-cha-r-family-office-main-office`) :
   - **Écusson mural Cha-R** (Ch. 379, p. 14–15) : imposant panneau mural laqué noir avec encadrement mouluré et médaillon en relief doré/bronze représentant l'emblème clanique (idéogramme 茶 / motif héraldique). Éclairé par un spot directionnel plafonnier.
   - **Les trois portes spécifiques** sur le mur ouest (Ch. 379, p. 15) :
     - *Porte blindée à motif de coffre-fort* (`tier-5-cha-r-family-office-strongbox`) : vantail lourd d'acier, panneau central en relief biseauté, roue de verrouillage circulaire (volant de coffre à 3 branches) et rivets de sécurité périmétriques.
     - *Porte à tête de robot* (`tier-5-cha-r-family-office-robot-door`) : porte d'acier affleurante portant 4 encoches sombres caractéristiques disposées comme les yeux et la bouche d'un robot rétro, dissimulant l'accès secret vers les passages sous-jacents.
     - *Porte en bois* (`tier-5-cha-r-family-office-wooden-door`) : porte d'ébénisterie à quatre caissons moulurés avec poignée béquille en laiton antique.
   - **Bureau de commandement** (`tier-5-cha-r-family-office-desk`) : bureau en acajou foncé avec sous-main de cuir, téléphone à cadran rétro, lampe col-de-cygne allumée, cendrier avec cigarettes et dossiers de la mafia.

2. **Compartiment des couchettes** (`tier-5-cha-r-family-office-bedroom`) :
   - Scène d'interrogatoire culte (Ch. 379, p. 16) : Feitan assis sur la couchette supérieure métallique, jambes pendantes, toisant l'homme de main de la mafia allongé sur le lit inférieur, tandis que Phinks se tient debout à proximité.
   - **Lits superposés métalliques** tubulaires avec échelle intégrée, barres de retenue, matelas en mousse fine et couvertures froissées (olive et anthracite).
   - **Hautes étagères et bibliothèques** chargées d'archives, cartons d'inventaire, caisses d'armement et bouteilles de contrebande.

3. **Salle de vidéosurveillance** (`tier-5-cha-r-family-office-monitor-room`) :
   - Fermée par une **porte blanche** (`white door`, Ch. 380, p. 1–3) qui tranche nettement avec les cloisons industrielles du repaire.
   - **Mur d'écrans CCTV** : grande baie multi-moniteurs (12 écrans cathodiques en grille 4x3) émettant une lueur phosphorée bleutée et verdâtre, relayant les caméras espionnes des points névralgiques du niveau 5 (entrepôt, coursives, seuils).
   - **Table de veille opérateur** avec double écran de contrôle, clavier de sélection matriciel, joystick de commande PTZ et fauteuil pivotant.

4. **Couloir du bureau** (`tier-5-cha-r-family-office-hall`) :
   - Porte blindée d'entrée avec serrure électronique à carte/digicode et deux caméras de sécurité en potence.

---

## 2. Architecture & Intégration technique

- **Performance Three.js & `BanquetDetailBuilder`** :
  - Assemblage en deux sous-buffers (surfaces opaques Lambertiennes et surfaces luminescentes non éclairées pour les écrans et LEDs).
  - Nettoyage automatique GPU lors du déchargement du pont via `disposeBanquetDetails`.
  - Masquage des boîtes blueprint coarse en mode visite via `chaRSurfacePlan`.
- **Plan 2D interactif** (`cha-r-office.svelte`) :
  - Restitution détaillée des 4 pièces, des 3 portes singulières, de la porte blanche, des lits et de la baie d'écrans CCTV.
  - Bilingue FR / EN et accessible clavier/clic.
- **Règles ADR-002** :
  - Tous les fichiers font strictement moins de 500 lignes.
  - Complexité cyclomatique inférieure ou égale à 10 par fonction.
  - Fonctions limitées à 3 paramètres maximum via des options typées.
