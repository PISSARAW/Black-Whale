# Cinéplexe du Tier 3 — fidélisation du chapitre 393

Le Cinéplexe du Tier 3 (`interior-cineplex`, pont 3) reçoit une fidélisation complète
au même niveau d'exigence que la salle de réception, le Ministère de la Justice
et les suites princières : analyse scrupuleuse des planches du chapitre 393,
reconstitution haute fidélité en 3D dans la visite virtuelle, projection 2D et plan
local SVG enrichi, cadrages manga canoniques et ancrage spatial des passagers.
Source éditoriale : Yoshihiro Togashi / Shueisha, tome 38, chapitre 393.

## Contexte narratif et case d'établissement

Dans le chapitre 393, Lynch Fullbokko et Zakuro Custard (membres exécutifs de la
famille mafieuse Xi-Yu) patrouillent au Tier 3 à la recherche d'Hisoka.
Ils pénètrent dans le grand hall public du cinéma où une grande case d'établissement
révèle l'intégralité du concourse sous une haute structure architecturale :
- Le stand de restauration et confiserie sur le flanc bâbord (Ouest).
- La billetterie avec ses guichets vitrés sur le flanc tribord (Est).
- Les affichages de films en caissons lumineux et l'enseigne monumentale "THE THING" au-dessus du passage central.
- La large rampe descendante protégée par des rambardes menant vers le hall distributeur des 8 salles de projection.
- Un îlot circulaire de sièges rembourrés au centre du hall où Hisoka / Bonolenov (sous son apparence) s'installe tranquillement en mangeant du pop-corn.

## Éléments reconstitués dans la visite 3D (`TierView`)

Les éléments 3D sont générés via `BanquetDetailBuilder` pour s'intégrer au moteur de visite :

1. **Stand de confiserie et pop-corn (`tier-3-cineplex-concession`)** :
   - Grand comptoir en bois sombre et bandeau de marbre poli avec plinthe en retrait.
   - Machine à pop-corn commerciale avec cage vitrée, cuve chauffante rouge vif, dôme en relief de pop-corn soufflé doré et rangée de godets rayés rouge et blanc sur le toit.
   - Vitrine chauffante avec étagère lumineuse pour snacks chauds (nachos et bretzels).
   - Fontaine à sodas multi-robinets en inox brossé avec bac d'égouttement et pile de gobelets en carton.
   - Caisses enregistreuses tactiles orientées vers le personnel.
   - Panneau de menus suspendu "FOOD & DRINKS" rétro-éclairé détaillant formules, pop-corn et sodas.
   - Poubelles d'extrémité encastrées avec volets basculants métalliques.

2. **Îlot de sièges d'Hisoka (`tier-3-cineplex-seating-island`)** :
   - Banquette circulaire capitonnée en cuir bordeaux/prune sur socle en bois de 3,4 m de diamètre.
   - Colonne architecturale centrale avec tablette basse en marbre.
   - Seau de pop-corn rayé débordant de maïs doré et gobelet de soda avec paille laissés sur la table d'appoint, matérialisant la présence d'Hisoka dans la scène du chapitre 393.

3. **Billetterie (`tier-3-cineplex-ticket-desk`)** :
   - Comptoir officiel de billetterie en bois massif et plateau supérieur en marbre.
   - 3 guichets vitrés séparés par des montants en acier, munis d'interphones circulaires et de fentes passe-billets.
   - Postes informatiques et claviers des agents de billetterie.
   - 4 écrans électroniques suspendus affichant horaires des séances, titres de films et attributions de salles ("TICKETS & SÉANCES", salles 1 à 8).
   - Lignes de guidage d'attente avec potelets en laiton poli à tête sphérique et cordons en velours rouge.

4. **Couloir des salles et rampe descendante (`tier-3-cineplex-screen-corridor`)** :
   - Grand panneau d'affiche suspendu "THE THING" avec sous-titre "NOW SHOWING · SCREENS 1 - 8" et flèches directionnelles d'accès aux auditoriums.
   - Pilier central monumental en pierre de 1,6 m de section et 6 m de haut, revêtu de caissons d'affiches de cinéma rétro-éclairés.
   - Rampe descendante vers le hall des salles : moquette de cinéma, balisage lumineux au sol (profilés LED ambre et bleu), doubles garde-corps tubulaires en laiton et inox le long des deux bordures.

5. **Foyers latéraux (`tier-3-cineplex-foyer-port`, `tier-3-cineplex-foyer-starboard`)** :
   - Allées bordées d'affiches de cinéma sous verre avec cadre rétro-éclairé et tapis de circulation.

6. **Toiture & Plafond (`cineplexCeiling.ts`)** :
   - Grille de faux-plafond à caissons acoustiques en retrait et poutres laquées acajou.
   - Conduits et gaines CVC cylindriques métalliques suspendus avec brides et tiges d'acier.
   - Spots encastrés à halo chaleureux et haut-parleurs surround Dolby Atmos intégrés dans chaque travée.
   - Enseignes lumineuses directionnelles suspendues ("SCREENS 1 - 8 ↓", "← FOOD & DRINKS", "TICKETS →").

7. **Sols & Moquette Art-Déco (`cineplexFloor.ts`)** :
   - Moquette moelleuse aubergine/bordeaux avec trame géométrique art-déco de losanges et étoiles dorées.
   - Margelles de marbre sombre et profilés de transition en laiton poli le long des façades de comptoirs.

8. **Murs & Boiseries Acoustiques (`cineplexWalls.ts`)** :
   - Panneaux muraux acoustiques en tissu capitonné avec cadres acajou et baguettes laiton.
   - Appliques murales art-déco à double faisceau (éclairage tamisé haut/bas).
   - Plinthes et corniches continues en bois massif et métal doré.
   - Portes d'issues de secours avec barres de panique inox et boîtiers lumineux "EXIT" verts.

9. **Hall Distributeur & Salles de Projection 1 à 8 (`cineplexScreensHall.ts`, `cineplexAuditorium.ts`)** :
   - **Hall des salles (`tier-3-cineplex-screens-hall`)** : 8 portails architecturaux avec boîtiers numériques lumineux ("SALLE 1" à "SALLE 8"), rideaux d'entrée en velours lourd et affichettes numériques "Now Showing".
   - **Auditoriums (`tier-3-cineplex-screen-1` à `screen-8`)** : écran géant incurvé argenté avec estrade basse et velours noir mat absorbant, gradins étagés surélevés par paliers avec nez de marche LED bleus, rangées de fauteuils de cinéma en velours bordeaux avec accoudoirs et porte-gobelets, cabine de projection vitrée en paroi arrière avec lentille de projection lumineuse, panneaux acoustiques muraux et issue de secours frontale.

En mode visite standard, `cineplexSurfacePlan()` écarte les parallélépipèdes bruts du blueprint (`tier-3-cineplex-food-counter`, `tier-3-cineplex-seating-island`, `tier-3-cineplex-screen-corridor-poster`, `tier-3-cineplex-concourse-pillar`, `tier-3-cineplex-ticket-windows`) pour injecter les modèles haute fidélité, tout en conservant leur emprise de collision.

## Projection 2D et plan SVG (`cineplex.svelte` & `cineplexPlan.ts`)

Le plan local SVG (`cineplex.svelte`) a été rehaussé pour correspondre fidèlement à la scène :
- Stand confiserie avec icône de machine à pop-corn dorée, vitrine chauffante et fontaine à soda.
- Billetterie avec 3 guichets vitrés et potelets à cordons de velours.
- Arche d'affiche "THE THING" au-dessus du passage central.
- Rampe descendante avec doubles mains-courantes et repères LED.
- Portails d'accès miniaturisés et annotés des 8 salles de projection (S1 à S8).
- Îlot central avec repère annoté d'Hisoka et de son pop-corn.
- Salle d'auditorium inférieure avec écran de projection, gradins et rangées de fauteuils.

`cineplexSpotAnchors` ancre avec précision les personnages clés de la scène :
- `hisoka` et `bonolenov-ndongo` sur l'îlot central.
- `lynch-fullbokko` et `zakuro-custard` dans le hall face à l'îlot.
- `hinrigh-biganduffno` à proximité pour la négociation.
- Repères structurels : `concession`, `tickets`, `ramp`.

## Cadrages Manga Canoniques (`mangaCineplexViews.ts`)

- `cineplex-establishing-shot` (conservé) : vue générale d'ensemble entre confiserie, guichets et couloir des salles (chap. 393).
- `cineplex-concession-popcorn` : cadrage rapproché sur le comptoir confiserie et la machine à pop-corn.
- `cineplex-ticket-windows-booths` : cadrage frontal sur les guichets de billetterie et les panneaux de séances.
- `cineplex-screens-descending-ramp` : perspective plongeante dans la rampe avec garde-corps vers les salles.
- `cineplex-hisoka-seating` : cadrage centré sur l'îlot de banquette où Hisoka déguste son pop-corn.
- `cineplex-auditorium-screen` : vue immersive en contre-plongée depuis les gradins vers l'écran géant incurvé.
- `cineplex-screens-hall-concourse` : perspective le long du couloir des 8 salles avec leurs portails lumineux.
- `cineplex-ceiling-coffer-marquee` : plan en contre-plongée révélant les caissons de toiture, gaines CVC et l'enseigne "THE THING".

