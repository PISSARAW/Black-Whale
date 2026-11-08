# Cabine de la capsule de sauvetage — fidélisation du chapitre 383

La cabine de la capsule de sauvetage n°1 au Pont 1-C (`tier-1-lifeboats-port-pod-cabin`) est fidélisée d'après les planches des pages 55 à 65 du chapitre 383 de Yoshihiro Togashi (_Hunter x Hunter_, volume 37), représentant la tentative d'évasion tragique des princesses Kacho et Fugetsu Hui Guo Rou.

---

## 1. Planches relues & Scénographie canonique

Dans le chapitre 383 (« Évasion »), Senritsu (Melody) joue de sa flûte lors du banquet hebdomadaire, plongeant l'assistance dans une hallucination de 3 minutes. L'agent de justice Keeney en profite pour escorter Kacho et Fugetsu vers la baie de lancement des canots :

1. **Absence délibérée de sièges passagers** (Ch. 383, pp. 60–65) :
   - Contrairement aux représentations navales classiques, la capsule de Togashi ne comporte aucun siège ou banquette.
   - Les passagers se tiennent debout sur le pont circulaire et s'agrippent aux mains courantes tubulaires courant le long de la coque.

2. **Coque nervurée étanche** (`dressRibbedShell`) :
   - Paroi sphérique à 16 facettes isolées en titane clair.
   - Huit nervures structurales cintrées d'acier (couples de renfort) convergeant vers le dôme du plafond.
   - Mains courantes de maintien de sécurité jaune à hauteur de taille (Y = 1,05 m).
   - Bandes d'éclairage de secours luminescentes rouges à la base de chaque nervure.

3. **Plancher segmenté radial** (`dressRadialDeck`) :
   - Seize dalles d'acier taillées en secteurs radiaux rayonnant depuis le socle central jusqu'à la coque extérieure.
   - Cordons de soudure sombres entre les secteurs, plaques de roulement antidérapantes et anneaux d'arrimage escamotables en laiton.

4. **Mât central et large socle étagé** (`dressCentralPostAndBase`, Ch. 383, p. 65) :
   - Large socle circulaire étagé (diamètre 2,2 m, hauteur 0,45 m) à gradins antidérapants et trappes d'accès techniques.
   - Colonne structurale cylindrique de 0,42 m de diamètre s'élevant jusqu'au plafond (hauteur sous plafond 2,6 m), renforcée par quatre goussets à sa base et munie de colliers d'ancrage pour harnais de survie.

5. **Écoutille ronde étanche** (`dressRoundHatch`, Ch. 383, p. 60) :
   - Sas d'accès circulaire massif avec joint d'étanchéité néoprène.
   - Vantail autoclave d'acier à six pênes de verrouillage coniques radiaux et charnière articulée renforcée.
   - Volant de serrage rotatif à 3 branches en laiton poli avec moyeu central moleté.
   - Soupape d'égalisation de pression et diodes d'état d'étanchéité (verte : verrouillé, rouge : ouvert).

6. **Console de pilotage de l'écoutille** (`dressHatchConsole`, Ch. 383, p. 60) :
   - Pupitre d'instruments bas incliné placé immédiatement sous l'écoutille ouverte.
   - Écran cathodique de télémétrie de bord cyan (taux d'oxygène, pression cabine 101,3 kPa, CO2).
   - Écran de navigation ambre (trajectoire d'éjection et guidage inertiel).
   - Bouton d'éjection rouge rétroéclairé protégé sous un clapet de sécurité jaune/noir.
   - Interrupteurs à bascule chromés, voyants d'état et combiné radio d'interphone.

7. **Meuble de secours latéral** (`dressHatchCabinet`, Ch. 383, p. 60) :
   - Armoire étanche métallique située à droite de la console.
   - Portes doubles à fermoirs de compression chromés.
   - Plateau supérieur équipé de deux bouteilles d'oxygène comprimé vert anglais à manomètres en laiton, d'une trousse médicale de premier secours blanche à croix rouge et de fusées de détresse pyrotechniques orange.

---

## 2. Architecture & Intégration technique

- **Moteur Three.js & `BanquetDetailBuilder`** :
  - Assemblage optimisé en deux sous-buffers (surfaces opaques Lambertiennes et surfaces luminescentes non éclairées pour les écrans, voyants et le plafonnier anti-déflagrant).
  - Nettoyage automatique GPU lors du déchargement du pont via `disposeBanquetDetails`.
  - Masquage des boîtes blueprint coarse en mode visite via `podCabinSurfacePlan`.
- **Plan 2D interactif** ([`lifeboats.svelte`](file:///Users/henripissa/Documents/GitHub.nosync/Black-Whale/apps/web/src/lib/assets/maps/local/lifeboats.svelte)) :
  - Bilingue français / anglais et accessible clavier/souris.
  - Baie de lancement à gauche (cradles, bassin, trappe de coque) et intérieur de la capsule à droite.
  - Présence scénographique des princesses Kacho et Fugetsu lors de l'évasion du chapitre 383.
- **Règles Strictes ADR-002** :
  - Tous les fichiers font strictement moins de 500 lignes.
  - Complexité cyclomatique inférieure ou égale à 10 par fonction.
  - Fonctions limitées à 3 paramètres maximum via des options typées.
