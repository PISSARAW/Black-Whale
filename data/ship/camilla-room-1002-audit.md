# Chambre 1002 (Princesse Camilla) — fidélisation des chapitres 366, 389 et 413

La chambre 1002 de la princesse Camilla (deuxième enfant du roi Nasubi Hui Guo Rou, fille aînée de la deuxième reine Duazul) reçoit le traitement d'excellence et de rigueur appliqué au salon du Roi Nasubi et à la chambre de la reine Unma : relecture des cases, vérification de l'emprise partagée du gros œuvre d'appartement royal, et modélisation procédurale soignée du mobilier d'apparat, des tentures, du cercle des gardes Intouchables et du poste d'écoute de Musse. Sources éditoriales : Yoshihiro Togashi / Shueisha, tomes 35, 36, 37, 39, 40 ; chapitres 363, 366, 389, 413.

## Cases relues et scénographie canonique

La suite 1002 s'insère dans le gabarit standard d'appartement princier de la zone d'habitation du Pont 1 (`interior-room-1002`, chap. 363) et se déploie à travers trois espaces scéniques majeurs du manga :

1. **Le salon formel tapissé (Chapitre 389) — `tier-1-royal-residential-sector-room-1002-living`** :
   - *Rassemblement des Intouchables* : les gardes démunis de Camilla (*Have-Nots* / porteurs du sort kamikaze *Yomotsu Hegui* : Lisamsetta, Meshush, Mozbe, Sarahell, Umanma, Fukataki, Kako, etc.) sont réunis en cercle formel le long des parois du salon, assis sur des assises austères tournées vers le centre de la pièce.
   - *Vaste tapis d'apparat central* : le centre du salon est entièrement dégagé et recouvert d'un immense tapis royal pourpre/bordeaux bordé de galons et broderies dorées.
   - *Divan d'apparat / table de massage de Camilla* : la princesse Camilla trône sur une méridienne sculptée en acajou laqué ornée de volutes et de dorures, garnie d'un épais matelas de velours rose-pourpre capitonné, de traversins cylindriques en soie et de coussins moelleux. Elle y reçoit ses massages et y tient cour avec son autorité nonchalante. Un guéridon d'appoint supporte flacons d'onguents, parfums et service à thé en porcelaine fine.
   - *Parures murales* : murs lambrissés d'acajou avec cimaises dorées, grandes tentures et tapisseries d'apparat damassées suspendues aux parois, et appliques murales néoclassiques.

2. **La salle à manger privée (Chapitre 366) — `tier-1-royal-residential-sector-room-1002-dining`** :
   - *Dîner avec la reine Duazul* : Camilla dîne en tête-à-tête avec sa mère, la deuxième reine Duazul, abordant le choix de leurs robes avant d'annoncer froidement sa volonté d'éliminer Benjamin puis Halkenburg.
   - *Table de réception intime* : grande table en bois noble nappée d'une étoffe claire brodée, dressée avec le couvert royal (assiettes en porcelaine, couverts d'argent ciselé, verres à pied en cristal et carafes de vin).
   - *Chaires royales sculptées* : deux hautes chaises à dossier d'apparat sculpté (la chaise de la princesse Camilla et celle de la reine Duazul garnie de velours sombre).
   - *Buffet dressoir et lustre* : dressoir mural d'ébénisterie supportant vaisselle et carafes, surmonté d'un plafonnier/lustre d'apparat.

3. **Le vestibule d'entrée et le poste de Musse (Chapitre 366) — `tier-1-royal-residential-sector-room-1002-entrance`** :
   - *Poste de surveillance de la Première Armée* : Musse, soldat d'élite et officier de renseignement de Benjamin, est stationné au passage d'entrée de la suite pour espionner Camilla.
   - *Mobilier militaire d'écoute* : bureau d'observation en chêne et armature métallique, fauteuil de veille ergonomique, téléphone d'écoute à cadran avec combiné et boîtier enregistreur/amplificateur d'interception.
   - *Documents de renseignement* : chemises de surveillance, classeurs d'état-major et rapports de la Première Armée empilés sur le plan de travail.
   - *Perchoir d'observation Nen* : perchoir discret évoquant l'oiseau de surveillance Nen de Musse (*Secret Window* / Fenêtre Secrète).

## Architecture et mobilier détaillés

- **Salon formel (`-living`)** :
  - Tapis central : 12 × 5 m, bordures or, épaisseur fine au sol.
  - Méridienne d'apparat : 2.2 × 0.95 m, hauteur 0.85 m, piètement galbé acajou, matelas capitonné velours pourpre, traversin en soie, coussins d'ornement.
  - Guéridon de Camilla : plateau circulaire mouluré, pied tripode, flacons et nécessaire à thé.
  - Assises des Intouchables : 14 assises périphériques (coussins formels / tabourets bas austères) réparties le long des murs face au centre.
  - Tapisseries d'apparat : grandes toiles murales tissées damassées sur les parois nord et ouest.
  - Lambris muraux d'ébénisterie et cimaises dorées.
- **Salle à manger (`-dining`)** :
  - Table de repas royale : plateau 2.4 × 1.6 m, nappe blanche à retombée souple, vaisselle d'apparat complète.
  - 2 fauteuils de table de cour à haut dossier sculpté (Camilla et Duazul).
  - Buffet dressoir bas en acajou avec carafes et plats d'argent.
  - Lustre d'apparat suspendu au plafond.
- **Vestibule d'entrée (`-entrance`)** :
  - Bureau de surveillance de Musse : plateau 1.4 × 0.8 m avec caisson de tiroirs.
  - Fauteuil de bureau ergonomique.
  - Téléphone d'écoute militaire à cadran, combiné et fil d'interception.
  - Piles de dossiers de renseignement militaire.
  - Perchoir stylisé d'observation Nen.

## Cohérence technique et intégration à la visite

- **Intégration TierView** :
  - Les décors 3D sont rattachés aux sous-espaces de la suite (`-living`, `-dining`, `-entrance`) via `buildCamillaRoomDetails(options)` appelé dans `roomDetails`.
  - Fusion sous `BanquetDetailBuilder` en 2 batches maximum par pièce (surfaces opaques et points de lumière/dorures).
  - Zéro source lumineuse `THREE.Light` permanente.
  - Moins de 150 000 triangles au total et libération complète de toutes les ressources GPU via `disposeBanquetDetails`.
  - Masquage en mode analyse des structures (`reveal = true`).
- **Plan 2D et projection cartographique** :
  - Projection géométrique précise (`camillaPlan.ts`) positionnant le cercle des Intouchables, le divan de Camilla, la table de repas et le poste de Musse.
  - Ancrages dans `roomAnchors.ts` pour `tier-1-royal-residential-sector-room-1002` et ses sous-espaces (`-living`, `-dining`, `-entrance`) positionnant Camilla, Duazul, Musse et les Intouchables.
  - Enrichissement du composant SVG `prince-apartment.svelte` pour afficher distinctement les agencements de la chambre 1002.
- **Vues Manga scénarisées** :
  - 4 angles de caméra canoniques (`mangaCamillaViews.ts`) :
    1. `camilla-untouchables-circle` (Chapitre 389) : Plan d'ensemble du salon formel montrant les gardes Intouchables en cercle le long des murs autour du tapis central et du divan de Camilla.
    2. `camilla-massage-couch` (Chapitre 389, 413) : Cadrage resserré sur la méridienne de massage, les soieries et le guéridon d'appoint de Camilla.
    3. `camilla-duazul-dining` (Chapitre 366) : Vue de la salle à manger privée où Camilla et la reine Duazul dînent en tête-à-tête.
    4. `musse-surveillance-post` (Chapitre 366) : Vue du vestibule d'entrée cadrant Musse à son bureau d'écoute téléphonique.

## Limites d'interprétation

Les dimensions métriques précises des meubles, les détails du câblage du téléphone de surveillance et les motifs ornementaux des tapisseries constituent une reconstitution fidèle et raisonnée à partir des cases dessinées en noir et blanc par Yoshihiro Togashi. Aucun fac-similé ou scan d'œuvre protégée n'est intégré dans le code.
