# Commissariat Central de Police — fidélisation des chapitres 349, 378 et 393

Le commissariat central de police du Niveau 3 (`tier-3-central-police-station`, `tier-3-central-police-station-atrium`,
`tier-3-central-police-station-entrance`, `tier-3-central-police-station-safety-section`) reçoit le même
traitement architectural et volumétrique d'excellence que les grandes pièces d'apparat du navire :
relecture méticuleuse des cases du manga, respect strict des emprises du plan partagé, et habillage
procédural détaillé rattaché aux objets de la visite.

Sources éditoriales : Yoshihiro Togashi / Shueisha, tomes 34, 36 et 38 (chapitres 349, 378 et 393).
[Édition officielle chez VIZ](https://www.viz.com/shonenjump/chapters/hunter-x-hunter).

## 1. Cases relues et scénographie canonique

Les chapitres 349, 378 et 393 établissent le quartier général des forces de l'ordre publiques et de
l'Association des Hunters au Niveau 3 du Black Whale :

1. **La double page de l'atrium monumental (chapitres 378 et 393)** :
   - L'atrium principal (`tier-3-central-police-station-atrium`) s'élève sur une hauteur spectaculaire
     de 16 mètres sous plafond, couronné en son centre par un vaste lanternon de toiture zénithal
     (12 m × 8 m, surélévation de 2,5 m) inondant le hall d'une lumière diffuse.
   - Les parois latérales (bâbord et tribord) sont rythmées par quatre étages de galeries ouvertes
     (niveaux 1 à 4 à 3,4 m, 6,8 m, 10,2 m et 13,6 m de hauteur), desservant les bureaux des
     brigades et les salles d'interrogatoire.
   - Chaque galerie est protégée par une balustrade métallique de sécurité à balustres verticaux et
     main courante en laiton, portée par des consoles structurelles en encorbellement.

2. **La colonnade monumentale de huit piliers (chapitre 378)** :
   - Deux rangées de quatre colonnes carrées massives (1,6 m × 1,6 m, s'élevant jusqu'à 16 m)
     longent les galeries à bâbord et à tribord.
   - Ces piliers d'ordre colossal comportent un socle mouluré étagé, un fût rythmé de cannelures et
     de panneaux de pierre sombre, et des chapiteaux à corniches supportant les architraves du toit.

3. **La fontaine centrale à gradins (chapitres 378 et 393)** :
   - Au centre géométrique du grand dallage de granit (`at`: [0, -2.5]), une fontaine monumentale
     octogonale de 4,4 mètres de diamètre articule l'espace et la circulation du public.
   - Elle se compose d'une margelle octogonale en pierre de taille, d'un premier niveau de déversoirs
     à gradins concentriques, d'un piédestal central et d'une vasque supérieure à jets d'eau.

4. **La façade d'entrée et la marquise en fer forgé (chapitre 378)** :
   - Le mur sud donnant sur le vestibule d'entrée est surplombé d'une imposante marquise vitrée en
     fer forgé (`tier-3-central-police-station-marquee`, 8 m de large, base à 4 m) avec tirants
     métalliques et lanternes suspendues.
   - De part et d'autre de cette marquise sont accrochées deux grandes enseignes officielles
     (`sign-port` et `sign-starboard`) arborant le blason de la police royale de Kakin et l'inscription
     « CENTRAL POLICE ».
   - De lourdes doubles portes vitrées sécurisées contrôlent le passage entre l'atrium et le sas.

5. **Le guichet de sécurité publique et l'accueil (chapitres 349 et 378)** :
   - Le comptoir d'accueil de l'atrium (`tier-3-central-police-station-front-desk` à [7.5, -7])
     comporte un écran de protection blindé, un interphone et des registres d'émargement.
   - La section de sécurité publique (`tier-3-central-police-station-safety-section`) abrite le grand
     guichet d'accueil citoyen (`tier-3-central-police-station-safety-desk` à [-5.5, -14.6]), flanqué de
     classeurs d'archives judiciaires, de panneaux d'affichage d'avis de recherche et de banques de formulaires.

6. **Personnel et Zodiaque Mizaistom Nana (chapitres 378 et 393)** :
   - Mizaistom Nana (Zodiaque du Bœuf, Crime Hunter de rang étoilé) supervise directement les
     opérations policières du Niveau 3 depuis cet atrium.
   - Des officiers et agents de police kakinois en uniforme d'ordonnance patrouillent les galeries
     supérieures et assurent la faction au sol.

## 2. Architecture, sol, toiture, écrans et mobilier modélisés

- **Toit, lanterneau et éclairage zénithal (`policeStationArchitecture.ts`)** :
  - Plafond monumental à caissons profonds (16 m de hauteur sous plafond) avec réseau de poutres maîtresses longitudinales et transversales.
  - Lanterneau central surélevé de +2,5 m (culminant à 18,5 m) avec verrière à claire-voie et montants verticaux (mullions).
  - Fermes structurales en acier sous le lanterneau et poutres de faîte.
  - 4 lustres suspendus industriels à haute baie, accrochés à des câbles d'acier depuis le lanterneau avec abat-jour métalliques sombres, bagues en laiton et diffuseurs lumineux (`glow: true`).
- **Sol et dallages géométriques (`policeStationFloor.ts`)** :
  - Dallage bicolore en dalles de granit institutionnel avec bordures périphériques sombres.
  - Rosace octogonale concentrique entourant la margelle de la fontaine à `[0, -2.5]` avec goujons en laiton à chaque sommet et caniveau de drainage périphérique.
  - Allée centrale de circulation nord-sud et allées de stylobate reliant les fûts de colonnes.
  - Lignes de délimitation de file d'attente incrustées en laiton devant le comptoir d'accueil et le guichet citoyen.
  - Tapis d'entrée technique encastré avec profilés métalliques dans le sas d'entrée et seuils de transition en laiton.
- **Murs, colonnade et appliques murales (`policeStationArchitecture.ts`)** :
  - Colonnade de 8 piliers monumentaux de 16 mètres de hauteur avec socles moulurés, fûts à panneaux et chapiteaux supportant l'architrave.
  - Appliques murales doubles en laiton avec bras cintrés et diffuseurs lumineux (`glow: true`) sur chaque pilier (comme dans le salon royal).
  - Plinthes, cimaise / dado rail et corniche denticulée haute courant le long des murs périphériques.
  - Pilastres cannelés étagés sur les parois arrière.
  - 4 étages de galeries ouvertes latérales avec garde-corps métalliques et consoles en encorbellement.
  - Façades des bureaux d'étage avec portes d'accès, poignées en laiton et impostes vitrées à croisillons.
- **Écrans et télécommunications (`policeStationScreens.ts`)** :
  - Mur d'écrans CCTV monumental (matrice de 4 × 3 moniteurs de surveillance, 12 écrans) contre la paroi nord de l'atrium, avec châssis métallique, dalles lumineuses phosphorescentes (`glow: true`) et voyants LED de statut rouge/vert.
  - Pupitre de commandement de vidéosurveillance avec joysticks PTZ, claviers de commande et consoles d'opérateurs.
  - Panneau suspendu d'avis de sécurité et d'état des paliers (`status board`) avec affichage doré lumineux au-dessus de l'accueil.
  - Baies de télécommunications radio VHF/UHF avec cadrans de fréquence, oscilloscopes audio lumineux et barres de LED dans la section de sécurité.
  - Écran d'inspection à rayons X sur bras articulé au-dessus du scanner de bagages.
- **Mobilier d'accueil, d'attente et de consultation (`policeStationFurniture.ts`)** :
  - 4 bancs d'attente monumentaux en chêne massif avec coussins et dossiers capitonnés en cuir foncé le long des allées de colonnade.
  - Potelets de guidage en laiton avec cordes de velours bleu nuit délimitant la file de l'accueil.
  - Pupitre d'information et d'orientation publique sur colonne de bronze.
  - Comptoir d'accueil (`front-desk`) avec double poste informatique, registre d'émargement, encrier, passe-documents et lampe de banquier.
  - Guichet de sécurité publique (`safety-desk`) avec cloisons acoustiques en verre acrylique, terminaux de consultation, téléphones et chaises visiteurs.
  - Batterie d'armoires et meubles d'archives judiciaires à 4 tiroirs avec poignées en laiton et porte-étiquettes.
  - Tableau d'affichage en liège avec avis de recherche officiels et directives de police.
  - Fontaine à eau pour les usagers.
- **Poste de contrôle d'accès du sas d'entrée (`entrance security`)** :
  - Scanner à bagages à rayons X complet : tunnel plombé avec rideaux de lamelles de plomb, convoyeur motorisé à rouleaux en inox, moniteur d'analyse.
  - Portique de détection électromagnétique multizone avec voyants LED de passage.
  - Tourniquets de contrôle d'accès à tripode et lecteurs de badges magnétiques.
  - Pupitre d'émargement et de filtrage pour les sentinelles.
- **Figures et factionnaires (`policeStationOfficers.ts`)** :
  - Silhouette haute et reconnaissable de Mizaistom Nana (costume caractéristique, manteau long et chapeau melon).
  - Officiers de police kakinois au poste d'accueil, à l'entrée, en patrouille de galerie et à la sécurité publique.

## 3. Matériaux et conformité technique

- **Palette de teintes procédurales (`policeStationDetailSurface.ts`)** :
  - Pierre de taille et granit : `#7a838b`, `#9aa2aa`, `#4d535a`, `#8e979f`, `#3f464d`.
  - Ferronnerie et poutres métalliques : `#2a2f35`, `#1a1e22`.
  - Bleu nuit institutionnel de la police : `#1e354d`, `#1a2b3c`.
  - Cuivre et laiton d'ornement : `#c2a65d`, `#d4af37`.
  - Cuir d'ameublement : `#2c2621`.
  - Verre translucide et écrans lumineux : `#88b5c4`, `#3d708f`, `#f5ebd3`.
  - Voyants d'alerte : `#c0392b`, `#27ae60`.
  - Eau de fontaine : `#3a6b8c`.
- **Règles d'ingénierie logicielle (ADR-002 & CLAUDE.md)** :
  - Respect strict des limites de complexité cyclomatique ($\le 10$).
  - Tous les fichiers font strictement moins de 500 lignes (fichiers entre 70 et 256 lignes).
  - Encapsulation des paramètres de fonction ($\le 3$ paramètres par fonction).
  - Zéro émoji dans le code, les commentaires et l'interface.
  - 100% rendu procédural Three.js sans textures matricielles externes.
