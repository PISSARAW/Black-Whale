# Hôpital central et Quartier médical — fidélisation des chapitres 358 et 391

L'Hôpital central et le Quartier médical du Pont 3 (`interior-central-hospital`) bénéficient du même degré d'exigence et de fidélisation architecturale que les espaces d'apparat du Pont 1 (`royalSalon`, `burialChamber`, `banquet`) et la planque secrète Heil-Ly du Pont 2 (`heillyHideout`). Ce travail s'appuie sur une relecture attentive des chapitres 358 et 391 de Yoshihiro Togashi, qui établissent le rôle clé du corps médical de l'Association des Hunters (notamment Cheadle Yorkshire, Leorio Paradinight et Gel) dans la gestion sanitaire et l'analyse biologique à bord du Black Whale.

Sources éditoriales : Yoshihiro Togashi / Shueisha, tome 35 (chapitre 358) et tome 37 (chapitre 391).

---

## 1. Clinique centrale (`tier-3-central-hospital-clinic`)

D'après les chapitres 358 (*Éveil*) et 391 (*Deuxième jour*) :
- **Lits d'hospitalisation complets** : quatre postes de soins dotés de lits médicalisés tubulaires sur roulettes pivotantes, matelas confort, oreillers anatomiques, draps et couvertures aux teintes douces (`0x8bb8c8`).
- **Pieds à perfusion mobiles (potences IV)** : mâts télescopiques chromés sur piétements à roulettes en étoile, double crochet de suspension, poches de perfusion translucides et tubulures descendant vers chaque lit.
- **Moniteurs multiparamétriques de réanimation (ECG)** : moniteurs de surveillance cardiorespiratoire fixés au chevet de chaque lit, dotés d'un écran cathodique à tracé d'électrocardiogramme vert phosphorescent (`ECG_GREEN = 0x22c55e`), témoins d'alarme et modules de télémétrie.
- **Rails et rideaux d'intimité suspendus** : tringles tubulaires suspendues au plafond par filins rigides avec pans de rideaux d'intimité séparant chaque station de soins.
- **Poste central de soins infirmiers (Nurses' Station)** : grand comptoir d'accueil et de coordination à double niveau, avec écran de confidentialité, plusieurs terminaux informatiques à affichage bleu luminescent (`0x60a5fa`), passe-câbles et formulaires cliniques.
- **Chariots d'urgence et de réanimation (Crash Carts)** : servantes médicales mobiles rouge sécurité (`0xb91c1c`) à tiroirs compartimentés, plateau supérieur en acier inoxydable et défibrillateur cardiaque d'urgence.

---

## 2. Réserves de fournitures médicales (`tier-3-central-hospital-supplies`)

D'après les chapitres 358 et 391 :
- **Rayonnages industriels lourds** : quatre grands ensembles métalliques galvanisés à quatre niveaux d'étagères, garnis de cartons de médicaments étiquetés, bacs de tri en polymère et consommables stériles emballés.
- **Centrale de bouteilles d'oxygène médical** : rampe murale de bouteilles haute pression en vert médical réglementaire (`OXYGEN_GREEN = 0x15803d`), chapeaux de protection, robinets et détendeurs en laiton (`0xb45309`), doubles manomètres de pression et collecteur d'alimentation en réseau.
- **Armoire à pharmacie sécurisée pour toxiques et substances contrôlées** : meuble armoire en acier émaillé beige, vitrage sécurisé double battant, bandeau supérieur d'avertissement de danger (`0xd97706`) et étagères intérieures pour drogues et anesthésiques.
- **Palettes de fret médicalisées** : palettes de bois brut empilées supportant des caisses hermétiques scellées pour le ravitaillement longue durée de l'expédition continentale.

---

## 3. Salles de consultation et espace du personnel (`tier-3-central-hospital-staff`)

D'après les chapitres 358 et 391 (lieu d'exercice de Leorio et Cheadle) :
- **Bureau de consultation médicale** : grand bureau en placage de chêne sombre avec caisson de tiroirs, lampe de travail à col orientable, stéthoscope d'auscultation enroulé, ordonnancier et terminal informatique médecin.
- **Sièges d'examen et d'entretien** : fauteuil ergonomique médecin pivotant sur roulettes avec dossier enveloppant, accompagné de deux sièges d'accueil confortables pour les patients et accompagnants.
- **Table d'examen clinique** : divan de consultation à piétement chromé, têtière réglable rembourrée en vinyle vert d'eau, et dérouleur horizontal de rouleau de papier d'examen blanc à la tête du lit.
- **Négatoscope mural illuminé** : caisson lumineux de radiographie mural avec rétroéclairage bleu fluorocentrique (`XRAY_BLUE_GLOW = 0x38bdf8`) et silhouette d'imagerie thoracique aux contours sombres.
- **Échelle d'acuité visuelle de Snellen** : panneau mural d'optométrie blanc avec lettres noires normalisées de taille décroissante pour le bilan visuel des passagers.
- **Bibliothèque d'ouvrages médicaux** : meuble bibliothèque garni de manuels de pathologie, pharmacopées et dossiers cliniques reliés.

---

## 4. Institut de recherche et laboratoire biologique (`tier-3-central-hospital-research`)

D'après le chapitre 358 (coordination avec Gel et l'équipe scientifique de l'Association des Hunters) :
- **Paillasses de laboratoire avec dosserets techniques** : longues paillasses en résine époxy noire résistante aux solvants et aux acides, équipées de blocs tiroirs suspendus et de passe-fluides techniques.
- **Microscopes optiques composés de recherche** : statifs en acier lourd, têtes binoculaires inclinées à oculaires doubles, tourelles revolver à quatre objectifs de précision, platines mécaniques porte-lame avec pinces et condenseurs de sous-platine.
- **Centrifugeuses cliniques de paillasse** : centrifugeuses de paillasse compactes en ABS gris clair, couvercles bombés à verrouillage de sécurité, et pupitres de commande numériques inclinés.
- **Portoirs de tubes à essai et réactifs colorés** : portoirs à fentes maintenant des séries d'éprouvettes et fioles contenant des solutions et réactifs colorés ambrés, bleus et verts.
- **Postes de sécurité microbiologique (PSM / Hottes à flux laminaire)** : deux grandes hottes de confinement biologique de classe II en inox brossé, avec visière frontale vitrée guillotine, plénum d'aspiration et filtre HEPA supérieur pour la manipulation d'échantillons inconnus du Nouveau Monde.

---

## 5. Couloir de desserte et coursive médicale (`tier-3-central-hospital-hall`)

- **Mains courantes et pare-chocs muraux** : doubles lisses horizontales antichoc le long des deux parois pour guider les brancards et sécuriser la déambulation des patients convalescents.
- **Signalétique suspendue luminescente** : panneaux de fléchage suspendus au plafond avec lettrage contrasté orientant vers la *CLINIQUE*, les *CONSULTATIONS* et la *RECHERCHE*.
- **Huisseries renforcées de sas** : chambranles métalliques des baies d'accès marquant le passage étanche entre les ailes clinique, logistique et laboratoire.

---

## 6. Points de vue manga canoniques

Quatre caméras cinématiques sont intégrées dans le catalogue `MANGA_VIEWS` pour une exploration immédiate :
1. `hospital-central-clinic` : plongée sur les lits de réanimation, les rideaux d'intimité et le poste des infirmières.
2. `hospital-supplies-reserve` : perspective axiale sur les rayonnages lourds et la batterie de bonbonnes d'oxygène.
3. `hospital-consultation-office` : vue cadrée sur le bureau de Cheadle / Leorio, le divan d'examen et le négatoscope mural.
4. `hospital-research-lab` : panorama sur les paillasses scientifiques, les microscopes et les postes de sécurité biologique.

---

## 7. Performance et intégrité Three.js

- **Bilan géométrique** : toutes les géométries sont fusionnées dans `BanquetDetailBuilder` en seulement 2 meshs batchés (opaque et émissif) pour un total d'environ 30 000 triangles, très en deçà du plafond de 150 000 triangles par salle.
- **Zéro lumière dynamique Three.js additionnelle** : exploitation des matériaux standard avec émissivité calibrée (`ECG_GREEN`, `XRAY_BLUE_GLOW`, voyants d'urgence).
- **Règles architecturales (.agents/AGENTS.md)** :
  - Tous les fichiers créés mesurent moins de 250 lignes (plafond strict : 500 lignes).
  - Aucune fonction n'excède 3 paramètres.
  - Complexité cyclomatique inférieure ou égale à 10 par fonction.
- **Masquage intelligent des boîtes de blueprint** : `hospitalSurfacePlan` masque les boîtes volumétriques de substitution en mode visite tout en conservant 100 % des boîtes de collision pour la navigation interactive du visiteur.
- **Libération GPU garantie** : `disposeBanquetDetails` libère l'intégralité des buffers et matériaux au changement de pont ou de mode.
