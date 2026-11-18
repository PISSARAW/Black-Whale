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
