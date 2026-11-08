# Grande salle de loisirs VVIP — Contrôle du chapitre 419

Audit de fidélisation de la grande salle de loisirs VVIP (`tier-1-vvip-recreation-hall`) située sur le pont 1 (Tier 1-A) du Black Whale.
Contrôle réalisé d’après les planches du chapitre 419 de Yoshihiro Togashi / Shueisha.

## 1. Planches consultées & Observations canoniques

| Chapitre | Planche / Case                 | Observation directe                                                                                                                                                                                                                                                                                               | Traduction dans le modèle                                                                                                                                               |
| -------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 419      | p. 17 (Plan général du pont 1) | Le plan de situation militaire positionne la grande salle de loisirs VVIP sur le flanc bâbord, en bordure du secteur résidentiel des princes (chambres 1001 à 1014), sur la route reliant le quartier royal aux accès de secours A et au casino.                                                                  | Salle rectangulaire de $30 \times 25$ m encadrée par le couloir principal VIP au nord ($z = -50$) et la coursive des princes au sud ($z = -25$).                        |
| 419      | p. 18 (Vue en contre-plongée)  | Grand hall monumental à double hauteur sous plafond (8 m). Deux escaliers latéraux symétriques s'élèvent depuis le sol pour desservir une galerie supérieure (mezzanine) faisant le tour du fond et des flancs de la salle. Garde-corps nobles et balustrades ouvragées. Colonnades de soutien sous la mezzanine. | Modélisation des deux escaliers à 14 marches chacun (largeur 2 m, hauteur 2,8 m), de la mezzanine en U avec balustrades à balustres tournés, et des colonnes cannelées. |
| 419      | p. 18 (Fin de chapitre)        | Confinement martial et verrouillage des accès du pont 1. Tserriednich traverse la zone de loisirs pour rejoindre l'itinéraire de secours menant au casino.                                                                                                                                                        | Vues canoniques dédiées avec cadrage emblématique des escaliers et staging de Tserriednich en transit.                                                                  |

## 2. Relevé métrique et enveloppe

- **Emprise au sol :** $X \in [26, 56]$ m (largeur 30 m), $Z \in [-50, -25]$ m (profondeur 25 m).
- **Surface totale :** $750\text{ m}^2$.
- **Élévation :** Sol à $Y = 128$ m, plafond à $Y = 136$ m (hauteur sous plafond : 8 m).
- **Mezzanine supérieure :** Plateforme en U à $Y = 130,8$ m (épaisseur de dalle 0,5 m, garde-corps de 0,95 m).
  - Volée gauche : $X \in [26, 29]$ m, $Z \in [-50, -25]$ m.
  - Volée fond : $X \in [26, 56]$ m, $Z \in [-50, -47]$ m.
  - Volée droite : $X \in [53, 56]$ m, $Z \in [-50, -25]$ m.
  - Trémie centrale ouverte : $X \in [29, 53]$ m, $Z \in [-47, -25]$ m.
- **Escaliers latéraux symétriques :**
  - Escalier gauche : centré à $X = 30$ m, montant de $Z = -28$ m à $Z = -33,2$ m (14 marches de 0,2 m).
  - Escalier droit : centré à $X = 52$ m, montant de $Z = -28$ m à $Z = -33,2$ m (14 marches de 0,2 m).

## 3. Mobilier de loisirs VVIP attesté et reconstruit

1. **Tables de billard d'apparat VVIP** (`billiards-table-01`, `billiards-table-02`) :
   - Dimensions : $3,0 \times 1,6$ m, hauteur 0,85 m.
   - Châssis en acajou sculpté et filets dorés, drap en feutre vert impérial, poches en cuir fauve et billes d'ivoire.
   - Râteliers muraux avec queues de billard sculptées.
2. **Salons de repos et de conversation VVIP** (`lounge-sofa-01`, `lounge-sofa-02`, fauteuils club `lounge-armchair-01` à `04`) :
   - Canapés capitonnés en cuir et velours bordeaux avec accoudoirs galbés.
   - Fauteuils club profonds et tables basses en marbre veiné et piètements dorés (`lounge-coffee-table-01`, `02`).
3. **Grand comptoir de rafraîchissement d'apparat VVIP** (`bar-counter`) :
   - Comptoir en bois noble avec plateau en marbre poli sous la mezzanine bâbord, longueur 5 m.
   - Tabourets de bar hauts avec assises rembourrées et repose-pieds en laiton.
   - Arrière-bar à étagères miroirs pour carafes en cristal et verres d'apparat.
4. **Tables de jeux de société / cartes** (`card-table-01`, `card-table-02`) :
   - Tables octogonales à incrustations de feutre avec chaises de bridge rembourrées.
5. **Appareils d'éclairage d'apparat** :
   - 4 grands lustres monumentaux en cristal à pampilles suspendus depuis le plafond à caissons ($Y = 136$ m) descendant à mi-hauteur avec sources lumineuses chaudes.
   - Appliques murales dorées à deux branches sur les piliers et parois.

## 4. Scénographie et Vues Manga

1. `vvip-recreation-double-staircase` (Chap. 419, p. 18) :
   - Cadre la vue principale depuis l'entrée sud en direction du double escalier latéral et de la mezzanine surplombante.
2. `vvip-recreation-mezzanine-balcony` (Chap. 419, p. 18) :
   - Vue plongeante depuis la galerie supérieure vers la nef centrale, les tables de billard et les salons de repos.
3. `vvip-recreation-tserriednich-transit` (Chap. 419, p. 17-18) :
   - Vue le long de l'axe de passage vers l'itinéraire de secours du casino avec staging du 4e Prince Tserriednich (`prince-tserriednich`).

## 5. Limites et hypothèses de reconstitution

- Les finitions intérieures exactes (teintes du marbre, nuances du cuir, disposition exacte des tables de jeux) ne sont pas détaillées planche par planche ; elles adoptent l'esprit néoclassique et palatial du Tier 1 (salle du banquet et quartier royal).
- Les escaliers et la mezzanine sont strictement confinés dans les limites géométriques de la coque sans créer de nouveau pont indépendant dans le modèle.
