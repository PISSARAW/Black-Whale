# Ministère de la Justice — fidélisation du chapitre 400

Le Ministère de la Justice (`interior-justice-bureau`, pont 2) reçoit une
fidélisation de même niveau que la salle de réception (salon royal) et les
quartiers princiers : relecture attentive des planches du chapitre 400,
reconstitution haute fidélité en 3D dans la visite, projection 2D précise
dans le plan local, cadrages manga dédiés et ancrage des passagers.
Source éditoriale : Yoshihiro Togashi / Shueisha, tome 38, chapitre 400.

## Cases relues et distribution spatiale

Les pages 194 à 199 du chapitre 400 montrent plusieurs pièces distinctes
de l'institution judiciaire :

1. **Hall d'accueil (`tier-2-ministry-of-justice-lobby`)** :
   Le hall public d'entrée avec comptoir d'accueil et d'enregistrement,
   registre d'émargement officiel, poste de contrôle de sécurité et
   filtrage avant l'accès au couloir intérieur. La façade monumentale reprend
   désormais le cadrage de référence : trois travées vitrées autour des portes
   centrales, piles massives, auvent horizontal profond, claire-voie haute,
   plafond quadrillé et médaillon institutionnel ovale laissé sans inscription.

2. **Parloir d'enregistrement (`tier-2-ministry-of-justice-visitation`)** :
   Les deux cases de référence montrent une seule enceinte vitrée ouverte en L,
   et non une rangée de cabines. Une longue banque sépare les visiteurs de la
   zone protégée ; deux tabourets ronds sont disposés devant elle. À l'intérieur,
   une chaise pivotante fait face au comptoir. Un poste de greffe avec bureau,
   chaise et meuble à tiroirs occupe le côté droit, tandis qu'une porte et un
   grand panneau encadré structurent le mur du fond. Le centre reste dégagé.

3. **Bureau judiciaire / salle d'interrogatoire 1010 (`tier-2-ministry-of-justice-deputy-office`)** :
   La pièce porte la plaque officielle extérieure « 1010 » sur le couloir
   gardé. L'intérieur est agencé en bureau d'instruction magistral :
   un grand bureau formel en acajou avec sous-main en cuir, lampe de banquier
   en laiton à abat-jour vert, plumier et dossiers de procédure scellés au ruban ;
   deux chaises visiteurs rembourrées en vis-à-vis pour les auditions (où
   confèrent Kaiser, Melody, Fugetsu et le double de Kacho) ; et des
   bibliothèques toute hauteur garnissant les murs du fond et latéraux du sol
   au plafond (3,8 m), divisées en travées serrées chargées de tomes de lois,
   jurisprudences et registres d'archives.

4. **Couloir du bureau (`tier-2-ministry-of-justice-hall`)** :
   Circulation solennelle reliant les différentes pièces, avec plinthes en pierre,
   signalétique des portes et luminaires encastrés.

## Modélisation 3D et visite virtuelle (`TierView`)

Les éléments 3D sont construits avec le générateur fusionné `BanquetDetailBuilder` :

- `dressOffice1010Architecture` : bibliothèques toute hauteur à travées multiples,
  plaque de porte 1010, boiseries d'appui.
- `dressVisitationArchitecture` : vitrage transparent en L avec montants fins,
  longue banque, deux tabourets visiteurs, chaise protégée, bureau latéral,
  meuble à tiroirs, porte et éclairage fluorescent.
- `dressLobbyArchitecture` : portique scanner de sécurité, tourniquets, banquettes
  d'attente, tableau d'affichage officiel et atrium d'entrée fidèle à la façade
  de référence (vitrage, piles, auvent, claire-voie et plafond quadrillé).
- `dressMagistrateDesk`, `dressVisitorChair`, `dressReceptionCounter` : mobilier
  détaillé avec garnitures, accessoires et assises.

En mode visite standard, `justiceSurfacePlan()` écarte les volumes approximatifs
du blueprint pour afficher les géométries détaillées, tout en conservant leur
emprise de collision pour la marche du visiteur. En mode `reveal`, les boîtes
de provenance du blueprint reprennent leur place.

## Projection 2D et Cadrages Manga

- Le composant `justice-bureau.svelte` s'appuie désormais sur `justiceBureauPlan.ts`
  pour garantir la correspondance métrique exacte avec le modèle du paquebot.
- `roomAnchors.ts` positionne Melody et Kaiser précisément sur les chaises visiteurs
  du bureau 1010 d'après le chapitre 400.
- Trois nouveaux cadrages manga (`MANGA_JUSTICE_BUREAU_VIEWS`) permettent de se
  placer dans l'angle exact des cases :
  - `justice-office-1010-interrogation` : vue sur le bureau de magistrat et les bibliothèques.
  - `justice-visitation-partition` : vue frontale sur la banque et l'enceinte vitrée en L.
  - `justice-lobby-reception` : vue sur l'accueil et le poste de contrôle.

## Limites d'interprétation

La structure exacte sur cinq étages du Ministère de la Justice demeure schématique
dans le manga (chapitre 349 et 400). Les dimensions des meubles, le profil des
moulures, le nombre précis de tomes par étagère et les teintes bois/vert/laiton
sont des restitutions d'après des planches en noir et blanc.
