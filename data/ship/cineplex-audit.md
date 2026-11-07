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

En mode visite standard, `cineplexSurfacePlan()` écarte les parallélépipèdes bruts du blueprint (`tier-3-cineplex-food-counter`, `tier-3-cineplex-seating-island`, `tier-3-cineplex-screen-corridor-poster`, `tier-3-cineplex-concourse-pillar`, `tier-3-cineplex-ticket-windows`) pour injecter les modèles haute fidélité, tout en conservant leur emprise de collision.

## Projection 2D et plan SVG (`cineplex.svelte` & `cineplexPlan.ts`)

Le plan local SVG (`cineplex.svelte`) a été rehaussé pour correspondre fidèlement à la scène :
- Stand confiserie avec icône de machine à pop-corn dorée, vitrine chauffante et fontaine à soda.
- Billetterie avec 3 guichets vitrés et potelets à cordons de velours.
- Arche d'affiche "THE THING" au-dessus du passage central.
- Rampe descendante avec doubles mains-courantes et repères LED.
- Îlot central avec repère annoté d'Hisoka et de son pop-corn.
- Salle d'auditorium inférieure conservée à l'identique avec son écran de projection et ses rangées de sièges en gradin.

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
