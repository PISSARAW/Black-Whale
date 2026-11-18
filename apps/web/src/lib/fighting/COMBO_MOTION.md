# Gestes de combo et concentration de l’aura

La présentation conserve les commandes, amorces, contacts, récupérations, dégâts
et règles de Nen du moteur. Elle ne modifie aucun état de combat.

Les 40 personnages possèdent des passages entre leurs frappes au sol, construits
à partir de la préparation du coup entrant, de la sortie du précédent et de
leur chorégraphie personnelle. Les passages explicitement dessinés de Kurapika
et d’Hisoka restent prioritaires. Une transition finit à la pose exacte du
contact entrant et conserve le transfert de poids jusqu’à cette image. Les
utilitaires (flûte, croissance, observation, etc.), projections aériennes et
chopes conservent leur présentation dédiée.

Les contacts physiques des 40 personnages orientent aussi la réaction de la
cible : recul, torsion, montée, compression ou perte d’appui. La direction et
l’amplitude sont mémorisées au contact, puis conservées après un cancel. Une
garde, parade, esquive ou un projectile ne fabrique aucune de ces réactions.

- Shizuku possède une préparation, une frappe et un freinage de Blinky pour le
  marteau et la frappe avant. L’outil décrit un arc dans l’espace du corps et
  reste dans la main droite dans les deux orientations. L’aspiration conserve
  sa visée verticale. Les réactions de compression et de rotation restent
  attachées au contact observé, même après un cancel.
- Kurapika possède des passages dessinés du retrait à la percée, de la percée
  au revers et du revers au fouet. La main rassemble le geste précédent avant
  de rejoindre la pose du nouveau contact à sa première image active.
- Franklin installe ses appuis avant la rafale, encaisse les émissions réelles
  dans l’épaule correspondante et relâche progressivement les bras. Aucun
  recul de présentation ne fabrique une balle.

`nenConcentration.ts` lit le Ryu et le Ko réellement engagés. Le Ryu conserve
une enveloppe fine dans les régions peu alimentées et épaissit les régions
renforcées. Le Ko ne conserve cette enveloppe que dans sa zone concentrée.
La sélection du membre frappant est une convention de présentation : le moteur
continue à arbitrer ses quatre zones, sans ajouter de répartition gauche/droite.
Elle lit la pose de contact utilisée par le rig, y compris les équipements et
les frappes à deux mains. Les jambes suivent leur propre orientation, même
pour un personnage dont l’arme reste dans la main droite.
Une frappe ordinaire ne crée aucune concentration supplémentaire.
L’enveloppe et les flux reprennent exactement `fighterAuraHex`, comme l’aura
du personnage, sans mélange vers un noyau blanc.

`nenConcentrationRig.ts` réutilise la géométrie des membres posés pour leur
enveloppe. Les anciens points Ko/Ryu et la bulle Ren sont masqués pendant cette
présentation afin de conserver une seule lecture de la distribution. La scène
possède ses matériaux et conserve la propriété des géométries au modèle.

`nenConcentrationScene.ts` fait voyager de courts flux par les articulations
du tronc vers les mains, les pieds ou la tête quand la distribution change.
L’horloge suit la simulation et se fige pendant le hitstop. Une reconstruction
du rig conserve l’avancement. In masque l’effet à l’adversaire sans Gyo.
Le mouvement réduit supprime les flux et conserve la concentration statique.
Le moteur dépense la concentration au contact : sa décharge reste visible
pendant le hitstop, puis se dissipe en six images de simulation. Cette trace
visuelle ne prolonge aucun bonus et cesse à un nouveau coup ou au Zetsu.

Vérifications : `comboMotion.test.ts`, `nenConcentration.test.ts`,
`fightBodyMotion.test.ts`, `fightRigPerformance.test.ts`, `fightPoseClock.test.ts`,
`combatRoutes.test.ts`, `franklinPresentation.test.ts`, `franklinEffects.test.ts`,
`kurapikaPresentation.test.ts`, `nenCombat.test.ts` et `fighterAura.test.ts`.
`rosterComboMotion.test.ts` couvre les 40 personnages, leurs transitions,
contacts physiques, couleurs, Ko/Ryu et orientations.

`node scripts/check-fighting-roster-motion.mjs`, depuis `apps/web`, vérifie
160 présentations WebGL (40 personnages × 2 orientations × Ryu/Ko), les flux
visibles pendant la redistribution, les couleurs des enveloppes et des flux,
les articulations finies et l’absence d’erreur graphique. Il produit un rapport
JSON et une capture par personnage. `ROSTER_MOTION_OUTPUT` choisit le dossier
de sortie. Ce banc ne mesure pas la cadence réelle d’un match à deux joueurs.

## Continuité physique des quarante combattants

Les transitions, réactions et chutes validées sur Hisoka–Machi,
Phinks–Kurapika et Shizuku–Franklin s’appliquent à tous les matchups du
roster, y compris les combats miroir, dans les deux orientations.
`fightPoseContinuity.ts` conserve pose et vitesse dans la scène : une
reconstruction du modèle lors d’une redistribution de Nen ne réinitialise
plus la transition. Le rassemblement et la libération suivent la préparation
personnelle du personnage ; le contact reste calé sur la première frame
active. La pose se fige pendant le hitstop.

`fightPhysicalProfile.ts` reprend le gabarit déclaré et la chorégraphie de
chaque combattant pour régler sa résistance visuelle, sa torsion, ses appuis
et le regroupement des jambes. La forme naturelle de Biscuit possède son
propre profil. Ces réglages ne changent ni dégâts, ni hitstun, ni hitboxes.

`fightHitResponse.ts` sépare la déformation locale, le mouvement du thorax,
puis celui du bassin et des appuis. La réponse dépend de la zone, du geste,
du Ko/contre réellement observé et du profil de la victime. Chaque impact
possède son identité ; une nouvelle frappe reprend le corps déséquilibré.
`fightFallResponse.ts` articule bras et jambes pendant la chute. Les gardes,
projectiles et techniques utilitaires conservent leur présentation dédiée.

`fightContactAlignment.ts` ajuste les frappes physiques ordinaires vers la
surface anatomique de la cible, après l’animation des deux corps. Les
corrections restent bornées, conservent la main de l’équipement et ne changent
pas les coordonnées du simulateur. Les marques d’impact, enveloppes et flux
suivent les membres et surfaces corrigés. Ryu, Ko et flux conservent exactement
la couleur `fighterAuraHex` du personnage.

La séparation des corps est commune au roster : `fightBodySeparation.ts`
mesure les volumes animés de la tête, du thorax et du bassin, en complément
des pushboxes du moteur. Elle corrige leurs chevauchements et relâche
progressivement l’écartement. Le corps immatériel d’une projection active de
Hanzo est une exception explicite ; In, Ken et l’invulnérabilité ordinaire
ne suppriment pas la solidité. Un saut peut franchir le rival lorsque leurs
volumes ne se recouvrent plus en hauteur. Les coordonnées logiques, les
ressources et les résultats des replays restent inchangés.

`referenceExchange.test.ts` conserve les trois premiers échanges comme
régressions. `fightPhysicalRoster.test.ts` couvre les quarante réactions,
transitions, reconstructions Nen, orientations et les 1600 matchups.
`fightBodySeparation.test.ts` contrôle les quarante gabarits, le mur, les
sauts et l’exception de projection.

Depuis `apps/web`, `node scripts/check-fighting-physical-roster.mjs` vérifie
160 présentations Chrome/WebGL : quarante combattants, deux orientations,
Ryu et Ko. Chaque cas exécute deux contacts natifs et vérifie réactions,
reconstruction du modèle, séparation des corps, couleurs des enveloppes et
flux, articulations finies et absence de mutation de l’état. Le rapport et
une capture par personnage sont écrits dans `PHYSICAL_ROSTER_OUTPUT`.
Ce banc contrôle la présentation ; il ne mesure pas la cadence GPU d’un match.

## Relevés et continuité après mise au sol

`fightGroundRecovery.ts` place le regroupement, l’appui puis la remontée
dans les dernières 48 % du compteur de mise au sol. Le corps retrouve sa
garde avant la reprise des commandes, y compris lors d’un reversal bufferisé
qui saute la pose `wakeup`. La protection de relevé conserve cette garde.
Les KO et corps endormis restent au sol. Aucun compteur ni règle ne change.
`fightGroundRecovery.test.ts` suit les quarante combattants jusqu’au reversal
natif et vérifie la continuité des articulations et l’intégrité du replay.

## Liaisons et appuis des combos

`fightComboTransfer.ts` conserve l’élan sortant, laisse le buste conduire les
bras, puis rassemble et pousse avec les jambes du profil personnel. Les
passages dessinés restent utilisés ; le contact entrant garde son image exacte.
La courte fenêtre de liaison prolonge la sortie du geste au lieu de ramener
immédiatement à la garde. `fightComboTransfer.test.ts` vérifie les quarante
contacts et la compression des appuis pendant une liaison.

## Réactions locales et déséquilibre conservé

Les réactions distinguent davantage tête, abdomen et perte d’appui : les bras
protègent le ventre, la jambe touchée cède et le thorax absorbe avant le bassin.
L’inclinaison du corps entier est réduite. Lors d’un combo confirmé, la réaction
suivante conserve un résidu borné du déséquilibre précédent, dissipé sur huit
images de simulation. Aucun résidu ne passe à un nouveau combat ou à une frappe
isolée après récupération. `fightHitBalance.test.ts` vérifie ces différences et
le transfert au cours de six combos natifs, sans mutation des états.

## Proximité, séparation et appuis

`fightClosePosture.ts` prépare le buste quand l’adversaire est proche, pour
réduire les débordements avant la correction de séparation. Le dégagement
restant tient compte du combattant ancré, du mur, du gabarit et de la victime
qui recule. Il se relâche sur six images, en restant figé pendant le hitstop.
`fightSeparationSupport.ts` maintient la semelle d’appui en coordonnées monde
avec une chaîne de deux articulations sans étirement (`fightLimbReach.ts`).
Un déplacement plus grand libère cet appui dans un pas de rattrapage de neuf
images. La mémoire survit à une reconstruction Nen et se réinitialise à la
manche. Les volumes centraux restent séparés et la projection immatérielle
explicite conserve son exception. `fightSeparationSupport.test.ts` vérifie
l’appui, les longueurs des segments et la préparation à courte distance.

## Surface commune du geste et de l’impact

L’alignement utilise maintenant une chaîne de deux segments, sans changer leur
longueur. Il rejoint progressivement la surface pendant la préparation puis
la tient au contact. Le point proche du membre est préféré au centre de la
zone ; `fightSurfaceContact.ts` mémorise cette surface pour l’effet du même
impact. Une petite silhouette au sol face à un adversaire plus de 30 % plus
grand frappe visuellement le thorax accessible : réaction et effet utilisent
cette même zone anatomique. La zone logique de défense Nen et les dégâts
restent ceux du moteur. Les armes conservent leurs gestes spécifiques.
`fightSurfaceContact.test.ts` mesure la distance réelle membre–surface dans
six matchups, deux orientations, et vérifie l’absence d’état visuel périmé.

## Rythme et flux continus

`fightStrikeRhythm.ts` accélère le prolongement du geste et allonge son freinage
visuel au cours de la récupération existante. Préparation, images actives,
contact, hitstop et durée totale restent inchangés ; les coups lourds ont un
contraste plus marqué. `fightStrikeRhythm.test.ts` vérifie les quarante profils.

`nenFluxRibbon.ts` remplace les points de redistribution par des rubans continus,
effilés, avançant à distance constante à travers les articulations posées. Le
trajet vers un pied passe par le bassin. L’enveloppe s’épaissit avec l’arrivée
du flux, plus fortement pour le Ko ; le trajet s’adapte à la préparation réelle
pour atteindre le membre au contact. Couleur native, révélation par Gyo,
mouvement réduit, consommation et hitstop gardent leurs contrats. Les géométries
de ruban sont réutilisées puis libérées. `nenFluxRibbon.test.ts` vérifie la
continuité, l’avancement, le suivi des articulations et la couleur conservée.
