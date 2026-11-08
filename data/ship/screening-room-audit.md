# Salle de projection (Screening Room) — chapitre 359

La silhouette et l'organisation spatiale sont établies d'après la case de coupe du théâtre du Niveau 2 au chapitre 359 (« Niveau 2 — Salle de projection ») : une scène monumentale à cadre de scène sous son rideau, des loges d'honneur suspendues le long des parois latérales au-dessus du parterre, et l'écran de projection dressé sur la scène.

Source éditoriale : Yoshihiro Togashi / Shueisha, tomes 34 et 35.
Chapitre 359 chez VIZ / Shonen Jump.

## Relevé spatial et enveloppe canonique

- **Identifiant :** `tier-2-screening-room`
- **Pont :** Niveau 2 (Tier 2, catégorie publique)
- **Emprise relevée :** 87,5 m × 45,5 m (X de -87,5 à 0 ; Z de 7,0 à 52,5)
- **Hauteur sous plafond :** 10,0 m
- **Fonction narrative :** Amphithéâtre officiel de briefing des passagers du Niveau 2 plutôt que simple salle de cinéma commercial (contrairement au multiplexe du Niveau 3).

## Mobilier et éléments architecturaux fidélisés

### 1. Scène et cadre de proscénium (`stage`, `proscenium-port`, `proscenium-starboard`)

- Scène surélevée de 1,1 m en parquet de chêne sombre (`SCREENING_STAGE_FLOOR`), nez de marche et plinthes moulurées en acajou.
- Escaliers d'accès latéraux à 4 marches larges vers le parterre.
- Deux piles de proscénium monumentales de 2,4 × 4 m montant jusqu'à 10 m de hauteur, flanquées de cannelures dorées et surmontées d'un entablement classique.
- Grand arc de proscénium cintré et orné d'un cartouche sculpté doré enjambant les 35,5 m d'ouverture.
- Rampe d'avant-scène en acier avec feux de rampe ambrés intégrés.
- Pupitre de conférence officiel avec microphone col-de-cygne pour les annonces du personnel de bord.

### 2. Grand rideau et écran (`curtain`, `screen`)

- Grand rideau de scène en velours pourpre (`SCREENING_CURTAIN_CRIMSON`) drapé en plis verticaux généreux et embrasses à pompons de passementerie dorée.
- Lambrequin festonné sculpté en draperies à festons superposés sous la corniche du proscénium.
- Écran de projection panoramique blanc mat (`SCREENING_SCREEN_WHITE`) bordé d'un cadre absorbant en velours noir mat et structure d'entretoisement tubulaire en acier.

### 3. Loges d'honneur suspendues (`boxes-port-forward`, `boxes-port-aft`, `boxes-starboard-forward`, `boxes-starboard-aft`)

- Quatre coursives de loges privatives de 26 m de longueur chacune, suspendues à 4,4 m au-dessus du plancher de circulation pour permettre le passage libre des visiteurs en dessous.
- Portées par des consoles / corbeaux sculptés à volutes dorées ancrés dans les parois.
- Balustrade galbée à balustres dorés ouvragés et main courante capitonnée de velours carmin.
- Cloisons transversales délimitant des loges intimes équipées de fauteuils de club en velours capitonné et guéridons de courtoisie.
- Éclairage indirect encastré sous le soffite des loges diffusant une lumière chaude le long des promenades latérales.

### 4. Parterre et gradins (`seating-01` à `06`)

- 6 blocs de fauteuils étagés en gradins de vision progressive (+0,18 m de dénivelé par bloc de l'avant vers l'arrière).
- Allée centrale de 2 m de largeur dans l'axe de la scène et allées latérales de dégagement garantissant une circulation fluide du visiteur.
- Fauteuils rabattables à assise et dossier en velours pourpre, accoudoirs moulurés et piètements en fonte.
- Lampes de repérage de nez de rangée à faible intensité lumineuse.

### 5. Plafond et lustre

- Plafond à 10 m composé d'une grille de poutres à caissons profonds en acajou et moulures d'oves dorées.
- 5 grands lustres de prestige étagés en laiton patiné et pampilles de cristal suspendus le long de l'axe central.
- Downlights chauds en gorge et grilles de conditionnement d'air intégrées dans les caissons.

### 6. Parois périmétriques et cabine de projection

- Lambris d'appui d'acajou de 1,2 m de hauteur avec cadres de boiserie.
- Panneaux muraux supérieurs absorbants en damas pourpre encadrés de pilastres cannelés.
- Appliques murales à double bras en laiton poli à lueur ambrée.
- Enceintes surround d'ambiance en noyer et acier sombre réparties le long des parois.
- Portes d'accès aux loges suspendues depuis le foyer de coursive à 4,4 m de hauteur.
- 3 doubles portes d'évacuation canoniques avec barres anti-panique en laiton et blocs autonomes d'éclairage de sécurité (BAES) verts.
- Cabine de projection en fond de salle (mur est à X = 0) dotée de hublots optiques et d'une fenêtre d'observation.

### 7. Scénographie, son et éclairage de scène

- Pendillons et coulisses acoustiques en velours noir en arrière du cadre de scène.
- Pont d'éclairage scénique suspendu en treillis d'acier équipé de projecteurs orientables ambrés.
- Colonnes de diffusion acoustique de façade (line arrays) montées sur les piles de proscénium.
- Tapis d'allée cérémoniel carmin à bordures dorées le long de l'axe central (2 m de largeur) et chemins transversaux vers les issues nord et sud.

## Cadrages manga et points de vue canoniques (chapitre 359)

- `screening-room-overview` : Vue d'ensemble depuis le fond du parterre vers le proscénium, la scène, l'écran et les loges latérales.
- `screening-room-stage-proscenium` : Vue en contre-plongée depuis l'allée centrale vers le pupitre officiel et l'écran de briefing.
- `screening-room-vip-box` : Vue plongeante depuis la loge d'honneur bâbord vers le parterre et la scène.
- `screening-room-stage-looking-back` : Vue depuis le pupitre de scène embrassant les gradins, les lustres et la cabine de projection.

## Ancrages de projection 2D / 3D et Carte Locale

- Carte locale interactive bilingue [`screening-room.svelte`](file:///Users/henripissa/Documents/GitHub.nosync/Black-Whale/apps/web/src/lib/assets/maps/local/screening-room.svelte) avec fiches d'inspection détaillées.
- Ancrages de projection dans [`screeningRoomPlan.ts`](file:///Users/henripissa/Documents/GitHub.nosync/Black-Whale/apps/web/src/lib/components/map/projection/screeningRoomPlan.ts) enregistrés dans [`roomAnchors.ts`](file:///Users/henripissa/Documents/GitHub.nosync/Black-Whale/apps/web/src/lib/components/map/projection/roomAnchors.ts).
