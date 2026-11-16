# Fighting

`fighting` est le mode de duel 2D du Black Whale. Il reprend les personnages et
leurs Hatsu canoniques, mais utilise un moteur arcade autonome : aucune sauvegarde,
campagne ou règle n'est partagée avec l'Arena 3D.

## Contrat

- `roster.ts` décrit les combattants disponibles et leur identité visuelle.
- Le roster jouable compte quarante personnages. Il exige au moins un atout
  canonique utilisable en affrontement : aptitude martiale, arme, Hatsu offensif,
  défensif ou tactique, ou pouvoir conceptuel activable pendant le combat. Une bête
  gardienne passive, non maîtrisée par son prince, ne suffit pas à rendre ce prince
  jouable. Les pouvoirs qui exigent une préparation incompatible avec un duel sont
  exclus selon la même règle. Silent Majority en a été retiré pour cette raison :
  sa malédiction exige dix suspects à portée et son utilisateur, anonyme, n'a
  aucune aptitude martiale connue ; il reste présent dans la visite et l'enquête.
- Kurapika, Hisoka, Chrollo, Benjamin, Tserriednich, Feitan, Saiyu, Theta, Biscuit,
  Phinks, Franklin, Machi, Illumi, Kalluto, Bonolenov, Shizuku, Hinrigh, Mizaistom,
  Leorio, Hanzo, Rihan, Zakuro, Melody, Basho, Camilla, Halkenburg, Gel, Lynch,
  Luini, Bill, Furykov, Cluck, Beyond, Longhi, Musse, Padaille, Sayird,
  Terebellum, Voconte et Yokotani satisfont ce contrat. Chrollo
  dispose de Black Voice et Sun and Moon en plus de sa logique de copie via Skill Hunter.
- Les nouveaux Hatsu ont des effets propres : Rising Sun gagne en puissance avec
  les blessures, Three Monkeys scelle les sens, le projectile de Theta neutralise
  l'aura, la transformation de Biscuit renforce attaque et défense, tandis que
  Sweet Home et LSDF apportent des réponses défensives propres.
- `fightStyles.ts` donne à chacun sa distance, son tempo, ses priorités d'IA et
  ses réglages de coups ; `normalFightMoves.ts` traduit ce profil en gestuelle.
- Les corps, visages, coiffures et costumes viennent du rig partagé de la visite
  (`tour/humanFigure.ts`) et des ressemblances déclarées dans `appearance.json`.
- `engine.ts` est le moteur pur : simulation déterministe à 60 images/s, mouvement,
  garde, impacts, aura, IA et verdict.
- `frameData.ts` décrit les phases de chaque coup en frames, ses boîtes, ses stuns,
  son hitstop, son recul et sa fenêtre de buffer.
- `movesets.ts` et les fichiers `movesetWaveOne*` donnent à la première vague
  (Kurapika, Hisoka, Chrollo, Benjamin, Tserriednich, Feitan, Saiyu, Theta,
  Biscuit et Phinks) quinze coups identifiés : six normales, trois command normals,
  quatre techniques, une projection et un finisher conditionnel. Chaque fiche
  expose aussi sa mécanique propre et au moins trois routes courtes.
- La deuxième vague applique le même contrat à Franklin, Machi, Illumi, Kalluto,
  Bonolenov, Shizuku, Hinrigh, Mizaistom, Leorio et Hanzo.
- La troisième vague couvre Rihan, Zakuro, Melody, Basho, Camilla, Halkenburg, Gel,
  Lynch, Luini et Bill.
- La quatrième vague ajoute Furykov, Cluck, Beyond, Longhi, Musse, Padaille, Sayird,
  Terebellum et Voconte.
- Yokotani clôt le roster avec sa défense judiciaire LSDF. Les quarante
  combattants disposent ainsi de six cents coups définis et cent vingt routes
  courtes de combo.
- `hatsu/registry.ts` associe chaque combattant à un contrat `FighterHatsu`. Chaque
  Hatsu vit dans son propre module et reçoit les crochets de déclenchement, d'impact
  et de frame ; le Bungee Gum ne dépend donc plus de `engine.ts`.
- Furykov, Cluck, Beyond, Musse et Sayird jouent en **martial pur**
  (`martialOnlyHatsu`) : leur seul Hatsu canon exige une préparation qu'un duel
  n'offre pas (co-présence de plusieurs jours, oiseaux messagers, sacrifice
  posthume, familier espion). Leurs techniques restent des coups chargés de Ren,
  sans effet de Hatsu ; Chrollo ne peut donc rien leur copier.
- Camilla suit le même régime de son vivant : Cat's Name est un Nen conditionnel
  (`onDeath`). Il ne s'éveille qu'à sa mort par un coup direct, dans un format
  qui se joue à la vie : le chat tue le meurtrier et Camilla revient.
- `projectiles.ts` fait apparaître, avancer et expirer les tirs. Seuls les
  projectiles attestés sont propres au combattant ; les autres lancent une pierre,
  sans leur inventer de technique de Nen. Les collisions sont transmises à
  `combatImpact.ts`, qui leur applique la même garde, parade, aura et décision de
  score qu'aux coups physiques.
- `FightScene.svelte` rend les deux rigs, le décor, les impacts et la caméra dans
  une seule scène WebGL. Les portraits de sélection restent des instantanés séparés.
- `stages.ts` liste les terrains. La soute et la Tour Céleste sont dessinées ici
  (`stageScenery.ts`, `stageHeavensArena.ts`) ; les salles du navire sont levées depuis
  le plan de la visite (`stageShipRoom.ts`) et la bande de combat y est dérivée de
  l'emprise et du mobilier (`stageLane.ts`). Le mobilier modélisé de la visite est repris
  tel quel (`stageRoomDetails.ts`) : une salle ajoutée que la visite habille doit y
  inscrire son constructeur. Un terrain ne change aucune règle.
- `/fighting` rend la sélection et les contrôles clavier/tactiles.
- Le type de combat est choisi avant le terrain : **Tour Céleste** se joue à
  dix points ou au TKO après trois knockdowns, **Combat K.-O.** à la vie (100 PV, décision
  après 90 secondes), et **Arcade** conserve la règle historique à dix points ou
  K.-O. en soixante secondes. Les conditions restent indépendantes du terrain.
- Le jugement de la Tour attribue un point pour une touche nette, deux pour une
  touche critique et un point supplémentaire lorsqu'elle provoque un knockdown.

Le joueur utilise Q/D ou les flèches pour se déplacer (double appui : dash avant ou backdash), Z ou flèche haute pour
sauter, S ou flèche basse pour se baisser, Maj/I pour garder, J/K pour les coups,
direction + J/K pour les command normals, direction + L pour les techniques,
H pour le finisher et U pour le projectile propre au combattant. Espace est l'unique bouton Aura : maintenu seul il produit
Ren, avec garde Ken, avec bas Zetsu et avec haut Gyo. Le relâcher pendant l'amorce
d'un coup engage Ko. Ten est l'état de repos et Ryu dépend du timing de garde et
de riposte, sans touche dédiée.

La tranche verticale de référence est Kurapika contre Hisoka. Elle conserve le rig
procédural partagé : les coups sont posés par code et suivent les frames du moteur.
Le passage à des modèles glTF skinnés pourra remplacer cette couche de présentation
sans changer les règles, les boîtes ni les données de frame.

### Rig de combat et poses clés

- `fightRig.ts` donne au rig de la visite les articulations d'un duel, pour la
  scène de combat seulement : une poitrine qui pivote à la taille (tête et bras
  suivent), coudes, poignets, chevilles, et des pieds qui restent au sol quoi que
  fassent les genoux. `tour/` n'est pas modifié.
- `fightPose.ts` décrit une pose côté avant / côté arrière, pour un combattant
  tourné vers la droite ; tourné vers la gauche, elle est mise en miroir comme un
  sprite.
- `keyPoseTimeline.ts` épingle chaque pose clé à une phase de la frame data
  (startup, active, recovery) : anticipation pendant le startup, contact atteint
  en un ou deux frames et tenu pendant les frames actives (et le hitstop),
  recovery lente. Hors frames actives, les poses sont tenues deux frames.
- `fightStance.ts` donne la garde de chaque combattant (poitrine ouverte vers la
  caméra, rebond), ainsi que l'accroupi et le repli aérien communs.
- `keyPosesKurapika.ts` et `keyPosesHisoka.ts` posent leurs six normales à la
  main. Tous les autres coups de tous les combattants viennent de
  `fightGestures.ts` (jab, cross, uppercut, crochet, coups de pied, entaille,
  estoc, paumes de Nen, projection, finisher en trois frappes), distribués par
  famille dans `fightArchetypes.ts` : frappeur, kickeur, lame, lanceur, colosse.
  La famille est une lecture du manga ; elle ne change ni frame, ni boîte, ni
  dégâts. `keyPoseMoves.ts` sert la pose clé à la main avant l'archétype.
- `fightReactions.ts` dessine le coup reçu selon la zone touchée (tête, buste,
  mains, jambes), la chute sur le dos avec rebond, la relevée par l'accroupi, le
  K.-O. et le saut, sur la progression que mesure déjà `sceneMotion.ts`.
- `fightBodyMotion.ts` choisit le plan de chaque frame et fond la pose
  précédente dans la nouvelle à chaque changement (garde, coup, coup reçu), si
  bien que poitrine et poignets ne sautent jamais. Un combattant sans garde
  reçoit une garde simple. Seule la projection contrée reste dessinée par la
  scène.

## Mouvement et rendu

- `fighterMovement.ts` porte la marche (recul à 80 %), le dash (18 frames) et le
  backdash (16 frames) au double appui sous 14 frames, le prejump de 3 frames, un saut
  à deux gravités (environ 38 frames en l'air) dont la dérive horizontale est fixée au
  décollage, puis 3 frames de landing sans déplacement.
- `fightInterpolation.ts` : le moteur reste à 60 Hz ; le rendu interpole entre les deux
  dernières frames simulées, ce qui supprime la saccade sur un écran 120 Hz.
- `sceneMotion.ts` : fondu instantané vers un coup ou une touche, foulée réglée sur la
  distance parcourue, caméra amortie indépendamment du framerate.
- `aiCadence.ts` : l'IA décide toutes les 16 à 24 frames simulées, dans le tick.
  Les appuis du joueur sont mis en file et appliqués au début de la frame suivante.

## Duel et règles d’échange

- Bas + J/K produit une variante basse ; saut + J/K produit une attaque aérienne.
  Les coups bas exigent une garde accroupie et les aériens une garde debout.
- O (ou le bouton tactile O) projette à courte portée et traverse la garde.
  O pendant l’amorce adverse protège huit frames contre la projection. Une cible
  aérienne ou en hitstun/blockstun ne peut pas être projetée.
- Sur touche confirmée uniquement, chaque coup ne peut annuler que vers les
  destinations inscrites dans les routes de son combattant. Aucun cancel sur
  garde, esquive ou coup dans le vide ; la route universelle J → K → L disparaît
  pour les personnages dotés d’un moveset complet.
- Les Hatsu en buffer déclenchent leurs effets et paient leur coût au départ
  effectif du coup, après revalidation des ressources.
- Les frappes simultanées sont évaluées sur le même état ; un double K.-O.
  ou une arrivée simultanée à dix points donne une égalité.
- Les coups lourds, critiques et les projections provoquent une chute persistante.
  La relevée offre dix frames d'invulnérabilité et une fenêtre de cinq frames pour
  buffer un reversal ; une projection laisse quarante-huit frames d'avantage brut.
- Un lourd debout sert d'anti-air et lance la cible. Trois impacts aériens au maximum
  sont autorisés avant que la hurtbox cesse d'accepter un juggle.
- Le moteur distingue counter hit (startup/active adverse) et punish (recovery),
  applique leurs bonus de stun/dégâts, puis réduit les dégâts de 10 % par coup de
  combo jusqu'au plancher de 40 %.
- Les pushboxes varient entre station debout, accroupie, saut et chute. Au mur, le
  recul est absorbé par la limite de scène et le wall contact prolonge le stun.
- Un match se joue en deux manches gagnantes. Les PV, points et knockdowns sont
  réinitialisés entre les manches, contrairement au score de match.

## Modes locaux et entraînement

- **Contre l'IA** conserve le pilotage automatique et son choix de coups.
- **Versus local** transmet un second jeu d'inputs au même tick déterministe : P2
  utilise les flèches, Entrée/Alt et N/M/,/./ sur le clavier.
- **Entraînement** désactive la limite de temps et la fin par K.-O., affiche startup,
  active, recovery, avantage sur garde, compteur de combo/juggle, hitboxes et
  hurtboxes. Le dummy peut enregistrer puis rejouer déplacements, garde et attaques.
- Le netcode rollback n'est pas encore présent. Le moteur fixe et les entrées P1/P2
  séparées constituent la base de resimulation, mais le transport, la prédiction et
  la synchronisation d'état restent une couche réseau distincte.
