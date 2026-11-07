# Chambre funéraire des princes — fidélisation des chapitres 358 et 371

La chambre funéraire secrète des princes reçoit le même traitement rigoureux que le banquet
inaugural du Pont 1, le salon du Roi Nasubi et le réfectoire central : relecture approfondie
des cases du manga, conformité stricte avec le plan du navire et habillage volumétrique
détaillé attaché aux structures de la visite.

Sources éditoriales : Yoshihiro Togashi / Shueisha, tomes 34, 36 et 37 (chapitres 358, 371,
383 et 413).

## 1. Cases relues et volume architectural

- **Chapitre 358** : Mention et implantation de la chambre funéraire royale sur la coupe
  annotée du navire (affectée au niveau 1-C, compartiment intérieur discret).
- **Chapitre 371, p. 18–21** : Révélation monumentale en double page de la chambre funéraire
  après l'assassinat de la 12e Princesse Momoze :
  - La salle est une rotonde parfaite (20,54 m de diamètre, 8 m sous plafond), bordée de
    parois sombres en pierre cérémonielle et couverte d'une coupole à anneau zénithal.
  - Au centre géométrique s'élève une machine/spire cylindrique rituelle imposante, garnie
    de cannelures verticales, de bas-reliefs sacrificiels et d'une couronne de pointes ou
    racines rayonnantes ancrées au sol.
  - Quatorze capsules/cercueils princiers sont disposés en cercle régulier (un angle de
    ~25,71° entre chaque capsule), le chevet orienté vers la machine centrale.
  - Quatorze conduits ou câbles partent du pied de la machine centrale pour alimenter chaque
    capsule. À mi-chemin, chaque câble traverse un récepteur/relais sphérique.
  - Le relais n°1, relié au cercueil où repose le corps de Momoze, est illuminé par une
    flamme de Nen incandescente. Le Roi Nasubi se tient debout à son chevet avec un garde
    et prononce : « Ma fille est toujours en vie... comme l'un des piliers qui soutiennent
    Kakin ».
  - Le sol est orné d'un réseau concentrique et radial de motifs géométriques en labyrinthe
    circulaire (circuits d'aura rituels), accompagné d'une résonance sourde (« オオオオ »).
- **Chapitres 383 et 413** : Le rituel d'accumulation et de sacrifice post-mortem des princes
  dans le cadre du tournoi de succession de Kakin.

## 2. Architecture et aménagements détaillés

- **Rotonde et coupole** :
  - Enveloppe circulaire rythmée par 14 pilastres et panneaux sombres en basalte poli.
  - Coupole zénithale à nervures radiales convergeant vers un anneau central supérieur.
- **Sol labyrinthique cérémoniel et éclairage ascendant** :
  - Contrairement aux pièces classiques du vaisseau éclairées par le plafond, la chambre
    est plongée dans l'obscurité en partie haute et tire sa clarté du sol.
  - Le réseau de méandres et circuits géométriques concentriques et radiaux émet une
    lumière blanche incandescente (`glow`), révélant les conduits d'aura sacrificielle.
  - Une gorge lumineuse court au ras du sol le long de la paroi circulaire extérieure,
    baignant le pied des pilastres d'une clarté ascendante.
  - L'échelle monumentale de la rotonde (plus de 20 m d'envergure) écrase visuellement
    la stature pourtant colossale du Roi Nasubi (2,3 m) et de son garde au chevet de Momoze.
- **Machine / Spire rituelle centrale (`reliquaire`)** :
  - Cylindre vertical massif de 2,2 m de hauteur et ~1,8 m de diamètre, cannelé avec 14 nervures verticales et deux cerclages de bronze.
  - Couronne de base rayonnante au sol composée de 28 dents triangulaires acérées (14 longues pointes entre les câbles et 14 pointes secondaires).
  - Collerette annulaire étagée accueillant 14 buses d'amarrage d'où jaillissent les câbles rituels.
  - Bas-relief rituel Kakin gravé en applique sur le torse : cadran rectangulaire d'or et d'obsidienne orné d'un anneau labyrinthique et d'un cœur émissif.
  - Dôme supérieur couronné d'une pointe sacrificielle et d'un conduit ombilical courbe reliant le sommet au pied de la machine.
- **Câblage rituel et relais d'aura** :
  - 14 lignes de câbles souples au sol reliant la machine centrale aux 14 cercueils.
  - 14 orbes métalliques de dérivation sur socle à mi-distance (rayon ~4,2 m).
  - Orbe n°1 allumé d'une lueur émissive chaude (énergie vitale de Momoze).
- **Les 14 capsules funéraires (`coffin-01` à `coffin-14`)** :
  - Surélévation sur berceaux courbes : deux paires d'arceaux transversaux sous la cuve décollant le cercueil du dallage.
  - Flancs ornés de bas-reliefs de volutes et vagues royales Kakin le long des parois.
  - Couvercle en voûte cintrée fendu sur toute sa longueur d'une crête / épine dorsale axiale en gradin.
  - Tête de capsule pourvue d'un portail cintré et d'une prise femelle recevant le câble de Nen.
  - Pied extérieur muni d'un encadrement droit et d'une plaque gravée au chiffre du prince.
  - **Capsule n°1 (Momoze)** : verrière translucide ouverte sur la silhouette du corps sous aura incandescente.
  - Filtrage `burialSurfacePlan` éliminant les boîtes brutes du blueprint pour restituer le modèle procédural pur.

## 3. Cohérence avec le banquet et le salon royal

- Le décor est rattaché au groupe de la salle dans `TierView`.
- Il utilise le constructeur fusionné `BanquetDetailBuilder` :
  - Exactement deux appels de rendu (surfaces opaques Lambert + éléments émissifs Basic).
  - Budget de rendu strictement inférieur à 150 000 triangles.
  - Aucune source lumineuse Three.js dynamique additionnelle.
  - Respect du mode preuve (`reveal: true`) : effacement strict en mode documentaire.
  - Libération intégrale des géométries et matériaux avec `disposeBanquetDetails`.
- Projection cartographique unifiée 2D (`burialChamberPlan.ts`, `princes-burial-chamber.svelte`,
  `roomAnchors.ts`) calquée sur l'architecture de `royalSalonPlan` et `banquetPlan`,
  garantissant le positionnement exact du Roi Nasubi au chevet du cercueil de Momoze.

## 4. Limites

Les tonalités sombres (basalte, bronze patiné, or terni) interprètent les planches en
noir et blanc de Yoshihiro Togashi. Les géométries des bas-reliefs sont simplifiées
pour garantir une fluidité parfaite à 60 images par seconde. Aucun scan ni texture
raster n'est incorporé, préservant la souveraineté du moteur procédural du projet.
