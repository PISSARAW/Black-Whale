# Bureau de la famille Cha-R — fidélisation des chapitres 379 & 380

Le repaire opérationnel de la famille mafieuse Cha-R au Pont 5 (`tier-5-cha-r-family-office`) est fidélisé d'après les planches des chapitres 379 et 380 de Yoshihiro Togashi (*Hunter x Hunter*, volume 36).

---

## 1. Planches relues & Scénographie canonique

Dans les chapitres 379 et 380, la Brigade Fantôme (Phinks, Feitan, Nobunaga) s'invite dans la planque des Cha-R pour négocier un accord de traque mutuelle :

1. **Salle principale à l'emblème** (`tier-5-cha-r-family-office-main-office`) :
   - **Écusson mural Cha-R** (Ch. 379, p. 14–15) : imposant panneau mural laqué noir à bordure moulurée et équerres d'angle en laiton poli. Médaillon central en losange étagé (bronze et or) portant les barres héraldiques en relief. Éclairé par un double projecteur halogène plafonnier.
   - **Les trois portes spécifiques** sur le mur ouest (Ch. 379, p. 15) :
     - *Porte blindée à motif de coffre-fort* (`tier-5-cha-r-family-office-strongbox`) : vantail lourd en acier biseauté, panneau central en relief à renforts horizontaux, volant de coffre rotatif à trois branches et moyeu en laiton moleté, cadran à combinaison chiffrée, gonds cylindriques massifs et pênes de verrouillage périmétriques.
     - *Porte à tête de robot* (`tier-5-cha-r-family-office-robot-door`) : porte d'acier affleurante portant 4 encoches sombres caractéristiques disposées comme les yeux et la bouche d'un robot rétro, avec fente de badge magnétique et rainures dissimulant le passage secret.
     - *Porte en bois* (`tier-5-cha-r-family-office-wooden-door`) : porte d'ébénisterie à quatre caissons moulurés profonds, architrave sculptée, béquille et plaque de propreté en laiton patiné, et plaque de pied en laiton.
   - **Bureau de commandement** (`tier-5-cha-r-family-office-desk`) : table en acajou massif à double caisson de tiroirs avec poignées en laiton, sous-main en cuir cousu, téléphone rotatif lourd, lampe banquier col-de-cygne en laiton, dossiers d'archives manille avec feuillets, cendrier en laiton avec cigarette allumée et braise incandescente, plateau d'argent avec carafe à whisky en cristal et verres. Fauteuil de direction capitonné en cuir sombre et chaises visiteurs en bois sombre.
   - **Sol & Plafond** : tôle larmée d'acier avec cordons de soudure, incrustation centrale de parquet en acajou foncé délimitée par des profilés de transition en laiton poli. Plafond industriel à poutres en I d'acier, gaines de ventilation galvanisées à brides, chemins de câbles perforés et luminaires fluorescents protégés par des grilles grillagées.
   - **Surveillance discrète** : mini-dôme de caméra espionne au coin du plafond.

2. **Compartiment des couchettes** (`tier-5-cha-r-family-office-bedroom`) :
   - Scène d'interrogatoire culte (Ch. 379, p. 16) : Feitan assis sur la couchette supérieure métallique, jambes pendantes, toisant l'homme de main de la mafia allongé sur le lit inférieur, tandis que Phinks se tient debout à proximité.
   - **Lits superposés métalliques** tubulaires avec embouts soudés, échelons d'accès crantés, barres de retenue supérieures, matelas à bourrelets, oreillers marqués et couvertures plissées (anthracite et vert olive militaire).
   - **Étagères de stockage industrielles** à 4 niveaux avec croisillons en X métalliques, chargées de cartons d'archives, caisses d'armement en bois avec poignées en corde et pochoirs, conteneurs de contrebande et boîtes à outils.
   - **Casiers individuels en acier** avec fentes de ventilation persiennées et moraillons cadenassables.
   - **Sol** : sol d'acier avec tapis de passage en caoutchouc anti-fatigue. Mini-dôme de caméra d'angle.

3. **Salle de vidéosurveillance** (`tier-5-cha-r-family-office-monitor-room`) :
   - Fermée par une **porte blanche** (`white door`, Ch. 380, p. 1–3) laquée avec joint d'étanchéité acoustique sombre, poignée inox et ferme-porte hydraulique.
   - **Mur monumental de 12 écrans CCTV** : baie d'équipement en acier graphite (4 colonnes x 3 rangées) diffusant les images en direct des zones sensibles du niveau 5 (phosphores verts et bleus), avec voyants d'enregistrement tally rouges et diodes d'état vertes. Platines magnétoscopes/DVR inférieures avec fentes à cassettes et molettes jog. Passerelle supérieure de câblage.
   - **Poste de veille opérateur** : console ergonomique avec double moniteur panoramique orienté vers l'opérateur, moniteur auxiliaire vertical pour les télémétries, clavier rétroéclairé, pupitre à joystick PTZ pour le contrôle des caméras mobiles, téléphone rouge de ligne d'urgence, et fauteuil opérateur mesh sur pied étoilé 5 branches à roulettes.
   - **Sol & Plafond** : faux-plancher surélevé informatique anti-statique avec calepinage de dalles 60x60 cm et bande de sécurité jaune/noire devant la baie ; faux-plafond technique modulaire avec pavés lumineux encastrés, têtes d'extinction sprinkler et détecteurs de fumée. Deux caméras d'angle.

4. **Couloir du bureau** (`tier-5-cha-r-family-office-hall`) :
   - Porte d'entrée blindée coupe-feu avec serrure électronique connectée (lecteur de badge, clavier digicode et voyant vert).
   - **Double caméra de surveillance** extérieure montée sur potence d'acier avec pare-soleil et anneau LED infrarouge.
   - Porte blanche d'accès vers la régie de vidéosurveillance.

---

## 2. Architecture & Intégration technique

- **Performance Three.js & `BanquetDetailBuilder`** :
  - Découpage optimisé en deux sous-buffers (surfaces opaques Lambertiennes et surfaces luminescentes non éclairées pour les écrans, voyants LEDs et spots).
  - Gestion stricte de la mémoire GPU avec nettoyage complet lors du déchargement du pont via `disposeBanquetDetails`.
  - Masquage transparent des boîtes blueprint coarse en mode visite via `chaRSurfacePlan` pour éviter tout z-fighting tout en conservant les boîtes de collision pour la marche.
- **Plan 2D interactif** (`cha-r-office.svelte`) :
  - Restitution détaillée des 4 pièces, du parquet en acajou à liseré doré, des 3 portes singulières, de la porte blanche, des lits, des casiers, du faux-plancher technique et de la baie d'écrans CCTV.
  - Entièrement bilingue FR / EN et accessible clavier/clic.
- **Règles ADR-002 & .agents/AGENTS.md** :
  - Tous les fichiers font strictement moins de 500 lignes.
  - Modularité exemplaire : `chaROfficeDetailSurface.ts`, `chaROfficeArchitecture.ts`, `chaROfficeDoors.ts`, `chaROfficeSurveillance.ts`, `chaROfficeFurniture.ts`, `chaROfficeView.ts`.
  - Complexité cyclomatique inférieure ou égale à 10 par fonction.
  - Fonctions limitées à 3 paramètres maximum via des options typées.
