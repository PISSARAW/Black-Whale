# Cour Suprême — fidélisation des chapitres 349, 371, 376 et 379

La Cour Suprême du Niveau 1 (`tier-1-supreme-court`, Pont 1-B) constitue la plus haute juridiction
officielle du Black Whale. Elle bénéficie d'une fidélisation monumentale calquée sur les grandes salles
d'apparat du navire (salle de banquet royale, salon du Roi Nasubi) :
analyse approfondie des cases canoniques, respect rigoureux des emprises et hauteurs du plan partagé,
et habillage procédural 100% Three.js.

Sources éditoriales : Yoshihiro Togashi / Shueisha, tomes 34, 36 et 38 (chapitres 349, 371, 376 et 379).
Édition officielle chez VIZ Media.

---

## 1. Scénographie Canonique et Cases Relues

1. **L'institution judiciaire suprême (chapitre 349 et 371)** :
   - Située sur le pont 1-B, la salle d'audience d'apparat s'étend sur une emprise colossale de 42 mètres
     de long sur 28 mètres de large, sous une hauteur sous plafond de 8 mètres.
   - Le mur d'honneur oriental est dominé par le Grand Sceau de la Cour Suprême (`tier-1-supreme-court-seal`),
     un imposant emblème circulaire sculpté en bas-relief placé au-dessus du siège du juge.

2. **L'audience de la Princesse Camilla (chapitres 376 et 379)** :
   - Au matin du troisième jour (10:05), la Cour Suprême se réunit sous la présidence solennelle du Grand
     Magistrat Cleapatro pour juger l'attaque armée de la Deuxième Princesse Camilla contre le Premier Prince Benjamin.
   - Les camps des deux princes s'affrontent non par le Nen, mais par le verbe, les statuts juridiques et leurs
     conseillers respectifs (Balsamilco pour Benjamin, les juristes de la Seconde Reine pour Camilla).
   - Cleapatro rend une sentence souveraine qui lie les princes de la couronne : confinement dans la zone VIP,
     superviseurs judiciaires assignés à chaque sortie de prince, et perquisition générale de toutes les résidences
     du Niveau 1 par l'Armée royale.

3. **Dispositif spatial du tribunal** :
   - **L'Estrade et le Banc du Magistrat Suprême** (`tier-1-supreme-court-bench` à [118, 38.5]) :
     Estrade monumentale à gradins et escaliers en acajou massif surélevée d'un mètre vingt au-dessus de la salle.
     Banc de 11,4 m de large en acajou sculpté et cuir, trône directorial, marteau de juge et codex de lois.
   - **Les Bureaux des Greffiers et Assesseurs** (`clerk-left` à [115, 33.5] et `clerk-right` à [115, 43.5]) :
     Deux tables plus basses placées au pied de l'estrade, équipées de registres, presses de sceaux et sténotypes.
   - **Le Pupitre Central / Barre des Témoins** (`podium` à [108, 38.5]) :
     Lutrin en bois sculpté placé face au magistrat, d'où Camilla et les témoins déposent.
   - **Les Tables de l'Accusation et de la Défense** (`prosecution` à [102, 33] et `defence` à [102, 44]) :
     Grandes tables de conseil de 7 mètres de long flanquées de fauteuils, dossiers d'instruction et carafes.
   - **Les Bancs du Public en Gradins** (`benches-south-1/2` et `benches-north-1/2` à x = 105) :
     Quatre rangées de bancs étagés de 20,9 mètres de long accueillant les escortes des princes, les dignitaires
     et les observateurs officiels.

---

## 2. Architecture, Sol, Toit et Mobilier Modélisés

- **Plafond et Luminaires (`supremeCourtArchitecture.ts`)** :
  - Plafond monumental à caissons en noyer et or avec poutres maîtresses longitudinales et transversales.
  - 6 grands lustres dorés d'apparat suspendus par des chaînes en laiton avec branches en bronze et diffuseurs lumineux chaleureux (`glow: true`).
  - Entablement et corniche à denticules ceinturant la salle à 8 mètres de hauteur.
  - Pilastres cannelés classiques avec chapiteaux corinthiens le long des parois.
  - Appliques murales doubles en laiton sur chaque pilastre.
  - Grand portail d'entrée monumental à double battant et fronton sculpté sur le mur ouest (x = 80.5).
- **Sol et Estrade Cérémoniale (`supremeCourtFloor.ts`)** :
  - Parquet noble bicolore à damier et encadrements foncés sur l'emprise de 42 × 28 m.
  - Estrade du juge à trois paliers étagés (+0.4m, +0.8m, +1.2m) avec escaliers et limons en laiton.
  - Coureur d'apparat en tapis rouge cardinal bordé d'un liseré en clé grecque dorée le long de l'axe central.
  - Gradins surélevés supportant les bancs latéraux nord et sud.
- **Grand Sceau de la Cour Suprême (`supremeCourtSeal.ts`)** :
  - Disque polyédrique à 16 pans en laiton et feuille d'or au point [122.35, 38.5].
  - Fond bleu lapis-lazuli (`COURT_SEAL_BLUE`).
  - Couronne de lauriers dorés en bas-relief, balance de la justice centrale sculptée et soleil royal de Kakin.
- **Mobilier d'Audience (`supremeCourtFurniture.ts`)** :
  - Banc de Cleapatro : façade moulurée en acajou, marteau en bois tourné avec billot sonore, registres de lois reliés cuir, lampe de banquier en laiton et trône en cuir boutonné.
  - Bureaux des greffiers gauche et droit : bacs à pièces à conviction, encriers, presses à sceaux, sténotypes.
  - Pupitre de témoin central avec microphone sur flexible et rampe d'appui.
  - Tables d'avocats et de procureurs avec fauteuils, dossiers et carafes de cristal.
  - Bancs d'audience de 20,9 m capitonnés en cuir foncé avec accoudoirs moulurés.
  - Balustrade en bois (barre du tribunal) avec portillon central en laiton séparant la cour du public.
- **Figures et Protagonistes (`supremeCourtActors.ts`)** :
  - Grand Magistrat Cleapatro en toge cérémoniale noire à parements pourpres et rabat blanc.
  - Greffier de séance et factionnaires judiciaires de Kakin.

---

## 3. Matériaux et Conformité Technique

- **Palette de teintes procédurales (`supremeCourtDetailSurface.ts`)** :
  - Bois nobles : Acajou (`#3a2318`), Noyer (`#4a3222`).
  - Métaux précieux : Or (`#d4af37`), Laiton poli (`#c2a65d`).
  - Parquet et marbre : Granit clair (`#6d543f`), Granit sombre (`#422f20`).
  - Tapis d'apparat : Rouge cardinal (`#7a1820`), Liseré doré (`#b8923a`).
  - Cuir et étoffes : Cuir foncé (`#241d19`), Émail lapis-lazuli (`#1b3554`).
  - Éclairage : Diffuseur chaleureux (`#fdf3d8`).
- **Conformité stricte aux règles ADR-002 et CLAUDE.md** :
  - Limite stricte de 500 lignes par fichier (tous les modules entre 60 et 250 lignes).
  - Encapsulation des paramètres ($\le 3$ paramètres par fonction).
  - Complexité cyclomatique strictement $\le 10$.
  - Zéro émoji dans le code, les commentaires et l'interface.
  - Rendu 100% procédural Three.js (aucune texture matricielle externe).
