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
  Terebellum, Voconte et Yokotani satisfont ce contrat.
- Chrollo possède un véritable état de **Bandit’s Secret** (`chrolloBook.ts`) :
  pages conservées, page ouverte dans la main droite et un seul signet **Double Face**.
  L’arsenal initial est celui du duel contre Hisoka : Sun and Moon et Black Voice ;
  ce choix ne suppose pas que Black Voice soit encore disponible sur le navire.
  **L** utilise la page ouverte, ou celle au signet si le livre est fermé ;
  **avant + L** vole au contact un Hatsu observé et ajoute sa page ;
  **arrière + L** ouvre la page suivante ; **bas + L** place le signet et ferme
  le livre, rouvre un livre fermé, ou retire le signet d’une page ouverte déjà marquée.
  **H** utilise la page au signet. Une page ouverte et une page au signet peuvent
  être actives ensemble. Fermer le livre libère les mains.
  Les actions de livre durent 16 frames au total, sans coût, déplacement, frappe
  ni annulation gratuite ; elles restent impossibles sous étourdissement.
  Changer une page coupe ses effets continus, sauf si le signet la maintient.
  Sun and Moon garde ses marques posthumes : L pose le Soleil à gauche ;
  H pose aussi le Soleil si le livre est ouvert, et la Lune à droite uniquement
  si le livre est fermé. Deux contacts sur une cible représentent la rencontre
  des marques ; charge et puissance restent réglées pour le duel.
  Black Voice exige une antenne au contact puis ordonne un recul limité à 90 frames,
  tant que sa page reste active. Le vol désactive le Hatsu adverse même quand sa page
  est refermée. L’entretien est abrégé ; les manches restent sous la limite canon
  d’une heure. Les conditions supplémentaires inconnues de Double Face ne sont pas
  inventées. Le HUD, le livre à droite, le livre fermé à la ceinture et le ruban
  rendent les états visibles. Livre et vols repartent à zéro à la manche suivante.
  Les commandes fonctionnent aussi en versus local et au tactile.
- Feitan mémorise les PV effectivement perdus pendant la manche (`feitanPain.ts`).
  Après une blessure, L revêt Pain Packer sans soin ni frappe ; H libère le soleil
  fixe de `feitanSun.ts`. Les blessures engagées augmentent la chaleur, le rayon et
  la durée, puis sont dépensées. L’armure protège de la chaleur, jamais des coups.
  Les valeurs, la dépense des blessures et la séparation L/H adaptent le manga au
  duel. La chaleur atteint les corps dans son cercle, traverse la garde et laisse
  fuir sans hitstun. Un soleil marque au plus un point par cible ; la Tour conserve
  sa victoire aux points, l’entraînement ne termine pas sur un K.-O. Zetsu et le vol
  du Hatsu dissipent l’armure et le soleil. `feitanScene.ts` dessine l’habit sur le
  rig et le périmètre de chaleur dans le monde ; le HUD affiche la douleur et l’état.
- Les autres Hatsu ont des effets propres : Three Monkeys scelle les sens, le projectile de Theta neutralise
  l'aura, le corps naturel de Biscuit renforce attaque et défense, tandis que
  LSDF apporte sa réponse défensive ; Sweet Home transfère les blessures.
- `fightStyles.ts` donne à chacun sa distance, son tempo, ses priorités d'IA et
  ses réglages de coups ; `normalFightMoves.ts` traduit ce profil en gestuelle.
- Biscuit commence sous sa petite apparence. **L sans direction** révèle son corps
  naturel, adulte et massif, jusqu'à la fin de la manche : aucun délai de six
  secondes, coût d'aura, coup d'activation ou effet copiable par Skill Hunter.
  `biscuitFormAction.ts` porte cette action corporelle et `biscuitFigure.ts` sa
  silhouette de combat. Les multiplicateurs de force et de résistance restent un
  équilibrage arcade. Cookie reste hors du duel ; avant + L est un « Direct du
  maître », sans massage offensif. La manche suivante rétablit la petite forme.
  `biscuitCamera.ts` cadre les deux silhouettes selon la largeur de l’arène, en
  gardant le corps naturel entre le HUD et les commandes tactiles.
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
  Leorio fait exception au format de quinze coups : dix coups physiques ordinaires
  et un seul Hatsu attesté, le poing transmis par une surface (chapitre 325).
  `leorioMoveset.ts` retire les variantes médicales, la double émission et le finisher.
  L (avec ou sans direction) et U déclenchent la même frappe au sol, pour 40 aura.
  `remotePunch.ts` fixe le point de sortie au contact du sol, limite la portée et
  fait voyager l’aura sous la surface sans collision avant la sortie du poing.
  Le délai, la portée et les dégâts sont des réglages arcade ; aucune poursuite
  automatique, onde diagnostique ou condition de faible santé n’est attribuée au manga.
  `keyPosesLeorio.ts` anime la frappe du sol et `remotePunchScene.ts` dessine le
  poing émis qui monte puis se rétracte. La garde, la parade et l’esquive restent actives.
- La troisième vague couvre Rihan, Zakuro, Melody, Basho, Camilla, Halkenburg, Gel,
  Lynch, Luini et Bill.
- Bill conserve ses dix coups physiques ordinaires et son Ken de garde du corps.
  `billMoveset.ts` ne garde qu’un Hatsu attesté : **Erigeron · Soutien** (chapitre 388),
  qui accélère la croissance d’un être vivant et peut favoriser le développement du
  Nen d’autrui, avec un effet faible sur les personnes non entraînées. Ce n’est ni
  un soin personnel, ni un bonus automatique d’attaque ou de défense.
  Le duel actuel ne propose pas de cible de soutien : L, avec ou sans direction,
  reste donc indisponible, sans dépense d’aura, frappe, annulation ou mise en buffer.
  L’interface explique cette limite du mode ; elle n’en fait pas une restriction
  canonique d’Erigeron. Les racines offensives/protectrices, floraisons et finisher
  à faible santé sont retirés. Les copies de Chrollo et de Stealth Dolphin conservent
  la même exigence de cible adaptée ; Erigeron demeure une capacité réelle et copiable.
  `billSupport.ts` et `hatsu/bill.ts` ne lui attribuent aucun effet de combat inventé.
- La quatrième vague ajoute Furykov, Cluck, Beyond, Longhi, Musse, Padaille, Sayird,
  Terebellum et Voconte.
- Yokotani utilise LSDF (chapitre 399) uniquement dans la **planque Heil-Ly**
  si **Morena est présente** et si son adversaire est déclaré **intrus en infraction**
  dans la préparation du duel. `fightEnvironment.ts` transmet ce scénario au moteur.
  L le présente à l’intrus et invoque sept gardes numérotés ; ils restent
  invulnérables, poursuivent la cible et l’escortent hors de la planque sans dégâts,
  points ni knockdown. L’expulsion termine la manche avec le verdict `expulsion`,
  sans animation de K.-O. ; en entraînement, le mannequin est replacé sans victoire.
  Les gardes disparaissent si Morena part ou si le lien de Nen est coupé.
  Yokotani lui-même reste vulnérable. La gravité supplémentaire des agressions
  augmente le niveau d’alerte, plafonné à cinq dans cette adaptation.
  `lsdf.ts`, `lsdfAction.ts` et `hatsu/yokotani.ts` portent ces règles ; `lsdfScene.ts`
  réutilise les gardes de la visite et montre Morena en arrière-plan.
  Le moveset conserve une seule technique LSDF, sans coup d’activation ni finisher
  offensif inventé. Les coups physiques ordinaires restent des abstractions arcade.
  Le coût d’aura et les vitesses de poursuite/escorte sont des réglages de duel.
- Hisoka distingue **L** (frappe qui attache sur contact non gardé), **→ + L**
  (rappel de la cible) et **← + L** (Hisoka se propulse vers la cible ancrée).
  Rappel et rebond exigent sa propre liaison tendue, attendent la fin du startup,
  ne frappent pas et s’interrompent sur un impact reçu. La liaison reste attachée
  une fois détendue ; Zetsu ou la perte du Hatsu la dissipe. **↓ + L** prépare au
  sol Texture Surprise sur le panneau plat de son vêtement : seul son aspect
  devient celui de la peau, sans soin, défense, esquive ni modification des
  collisions. Un contact reçu expose ce masque. Le support choisi, la préparation
  au sol et cette interruption sont des adaptations au duel. **H** exige une
  liaison et la consomme sur un coup réussi. `hisokaTechnique.ts` vérifie ces
  conditions à la commande et à l’activation ; `hisokaMoveset.ts` supprime les
  frappes des trois utilitaires. Les quatre gestes sont distincts dans
  `keyPosesHisokaSpecials.ts`. In cache réellement la liaison adverse jusqu’à Gyo.
- `hatsu/registry.ts` associe chaque combattant à un contrat `FighterHatsu`. Chaque
  Hatsu vit dans son propre module et reçoit les crochets de déclenchement, d'impact
  et de frame ; le Bungee Gum ne dépend donc plus de `engine.ts`.
- Furykov ouvre **Combo Master** avec L, sans frappe, déplacement ni protection.
  `comboMaster.ts` alerte immédiatement sur une attaque de Nen dissimulée déjà
  engagée contre lui ou sur une liaison cachée qui l’affecte ; aucun buffer ni
  action future n’est lu. Les projectiles ordinaires, le Nen visible et les tirs
  qui s’éloignent ou passent hors de sa hauteur ne déclenchent pas d’alerte.
  `FightComboMaster.svelte` affiche « ? » si la signature est illisible : dans
  cette adaptation, seul Gyo permet de la lire, sans dissiper In. La liste des
  personnes affectées ne reprend que les destinataires confirmés d’un effet
  représenté dans ce duel (actuellement Bungee Gum), jamais son auteur ni une
  victime future ; elle ne sonde pas les personnes hors arène. Zetsu, épuisement,
  sceau de On, vol du Hatsu ou mort dissipent la console. Une page copiée doit
  rester active ; la manche suivante repart sans console. Déchiffrage et fabrication
  sur plusieurs jours restent hors duel. Coût d’ouverture (40 aura), engagement
  et règle de lisibilité par Gyo sont des adaptations ; ses autres techniques
  restent martiales, sans bonus de dégâts ni esquive automatique.
- Cluck, Beyond, Musse et Sayird jouent en **martial pur**
  (`martialOnlyHatsu`) : leur seul Hatsu canon exige une préparation qu'un duel
  n'offre pas (oiseaux messagers, sacrifice
  posthume, familier espion). Leurs techniques restent des coups chargés de Ren,
  sans effet de Hatsu ; Chrollo ne peut donc rien leur copier.
- Little Eye reste un Hatsu réel de Sayird : il contrôle un petit animal réel
  (jusqu’à la taille d’un hamster) et transmet sa vue et son ouïe, sans agir sur
  une créature matérialisée par le Nen. Kurapika peut le retenir après drainage,
  sous l’identité `sayird:littleEye`, distincte des frappes martiales. Aucun animal
  cible n’est fourni en duel : le HUD nomme la capacité et précise cette limite ;
  chargement et usage restent indisponibles, sans verrouiller Emperor Time.
  Les coups de Sayird restent des adaptations martiales même quand Little Eye
  est retenu. La manche suivante rend la capacité à son propriétaire.
- Camilla suit le même régime de son vivant : Cat's Name est un Nen conditionnel
  (`onDeath`). Il ne s'éveille qu'à sa mort par un coup direct, dans un format
  qui se joue à la vie : le chat tue le meurtrier et Camilla revient.
- Sweet Home (`sweetHomeContacts.ts`, `sweetHomeImpact.ts`) vérifie les contacts
  pendant les frames actives, avant le recul : L/←+L/H transfèrent ses blessures
  à l'adversaire touché à gauche ; →+L absorbe à droite vers son propre corps
  touché à gauche ; ↓+L absorbe à droite sans réceptacle et blesse sa main gauche.
  Sans contact requis, la cible initiale garde les dégâts. Chaque blessure est
  déplacée une fois, sans nouvelle réduction ni esquive. Portée, frames et coups
  porteurs sont des abstractions du duel ; aucun objet-réceptacle n'est inventé.
- Hanzo utilise **Hanzo Skill 4** avec L : son corps reste endormi au sol, sans
  déplacement ni garde, pendant que les commandes pilotent le double. Haut/bas
  le font flotter ; il traverse l'adversaire et peut le frapper. Le corps conserve
  sa propre hurtbox : un coup ou un simple contact interrompt la projection, sans
  annuler les dégâts ni offrir l'invulnérabilité de relevée. Revenir près du corps
  puis L permet de le réintégrer sans repayer le coût. Le double ne lance pas
  d'objets physiques. H devient un étranglement à courte portée pendant la projection.
  Le coût d'aura, les 24 frames de préparation et les dégâts restent des réglages
  de duel. T (joueur 1), V (joueur 2) ou le bouton tactile permettent d'interpeller
  le corps à proximité : la parole interrompt aussi la projection, sans dégâts.
  La portée audible de 18 unités est une abstraction du duel.
- Benjamin commence le duel après les morts de Vincent, Musse et Shikaku :
  `benjaminBaton.ts` fixe les trois héritages et vérifie mort, loyauté, diplôme
  militaire et appartenance à son armée. Aucun coup ne crée de charge de dégâts.
  L = Air Blow depuis la paume gauche ; avant + L = oiseau de Secret Window
  attaché au contact, sans dégâts ni contrôle ; bas + L = rectangle de Culdcept
  chargé avant une fenêtre de capture ; H = rejouer la carte capturée, une fois.
  Les mécanismes complets d'Air Blow et de Culdcept restent inconnus : leur
  portée et la capture d'un projectile de Nen sont explicitement des adaptations
  de duel (`benjaminCanon.ts`), sans vol automatique du Hatsu entier. Les balles
  réelles et la flèche de Halkenburg ne sont pas capturables. U tire une rafale
  de trois balles réelles : l'arme reste utilisable sans aura et en Zetsu, et
  interrompre le tireur coupe la rafale. Le HUD et la scène montrent les
  héritages, l'oiseau, le rectangle, la carte et l'arme physique.
- `projectiles.ts` fait apparaître, avancer et expirer les tirs. Seuls les
  projectiles attestés sont propres au combattant ; les autres lancent une pierre,
  sans leur inventer de technique de Nen. Les collisions sont transmises à
  `combatImpact.ts`, qui leur applique la même garde, parade, aura et décision de
  score qu'aux coups physiques.
- Franklin tire **Double Machine Gun** avec U et L : les balles de Nen partent
  successivement des deux mains, en parcourant les dix doigts. U produit dix
  tirs, L vingt, et H une rafale prolongée sans seuil de PV adverse. Les variantes
  directionnelles changent la durée ou la hauteur de tir, sans ajouter de Hatsu.
  Les dégâts dépendent exclusivement des collisions des balles ; un impact reçu,
  Zetsu, un vol de capacité ou un sceau de On empêchent les émissions suivantes.
  Les doigts sectionnés, leurs chaînettes et les éclats au départ des tirs sont
  animés sur le rig de duel. La mutilation est une restriction permanente du
  personnage, pas une transformation à activer. Cadence, coûts et dégâts sont
  des réglages arcade ; les gardes Nen ne sont pas universellement ignorées.
- `FightScene.svelte` rend les deux rigs, le décor, les impacts et la caméra dans
  une seule scène WebGL. Les portraits de sélection restent des instantanés séparés.
- `stages.ts` liste les terrains. La soute et la Tour Céleste sont dessinées ici
  (`stageScenery.ts`, `stageHeavensArena.ts`) ; les salles du navire sont levées depuis
  le plan de la visite (`stageShipRoom.ts`) et la bande de combat y est dérivée de
  l'emprise et du mobilier (`stageLane.ts`). Le mobilier modélisé de la visite est repris
  tel quel (`stageRoomDetails.ts`) : une salle ajoutée que la visite habille doit y
  inscrire son constructeur. Le terrain ne modifie pas le barème ; LSDF exige
  toutefois la juridiction de la planque occupée par Morena.
- `/fighting` rend la sélection et les contrôles clavier/tactiles.
- Le HUD sépare vie, aura, temps et manches des ressources et restrictions des
  personnages, regroupées sous l'arène. `FightHealth` utilise la réserve maximale
  fournie par le moteur, avec un repère tous les 100 PV. Affichage donne accès aux
  PV exacts, aux détails tactiques, à la taille du HUD (100–130 %) et aux commandes
  tactiles automatiques. Le plein écran dépend du navigateur ; le manuel se replie.
  `pnpm --filter @black-whale/web test:hud` vérifie le roster et les états chargés
  de Chrollo, Kurapika et Benjamin ; voir `apps/web/ui-tests/fighting-hud/README.md`.
- Le type de combat est choisi avant le terrain : **Tour Céleste** se joue à
  dix points ou au TKO après trois knockdowns, **Combat K.-O.** à la vie (100 PV, décision
  après 90 secondes), et **Arcade** conserve la règle historique à dix points ou
  K.-O. en soixante secondes. Ces barèmes restent indépendants du terrain.
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

### Kurapika : chaînes et Emperor Time

- **Aura + H** (P2 : Alt + B), ou le bouton Emperor Time, active/coupe les yeux
  écarlates. L’efficacité atteint 100 % au niveau acquis : aucune réserve d’aura
  gratuite ni maîtrise de toutes les techniques. Le renforcement des normales et
  Holy Chain passent de 60 % à 100 %. Chaque seconde simulée, hitstop compris,
  consomme une heure de vie ; le compteur survit aux manches. Après trois heures
  d’usage continu, le moteur reproduit l’évanouissement observé et neuf heures
  d’inconscience, sans compresser ces durées en quelques secondes de duel.
- **L : Chain Jail**, chaîne du majeur. Une touche non gardée immobilise et force
  le Zetsu aussi longtemps que Kurapika la maintient. L libère ; perdre le Nen la
  dissipe. Le serment est mortel : tenter réellement ce coup sur un non-membre de
  la Brigade, Hisoka compris, tue Kurapika. L’IA évite cet usage interdit.
- **Avant + L / U : Dowsing Chain**, chaîne de l’annulaire. Arme physique de portée
  moyenne, elle peut intercepter les balles matérielles pendant sa phase active.
  U dirige cette chaîne attachée ; aucun projectile de chaîne détaché n’est créé.
  La détection des mensonges et la recherche hors combat n’ont pas de cible dans
  ce duel sans dialogue.
- **Bas + L : Holy Chain**, chaîne du pouce. Un soin après préparation, sans
  hitbox offensive : 18 PV normalement, 30 avec Emperor Time, plafonné à la vie maximale.
  Un coup reçu avant le soin l’interrompt ; il ne ressuscite pas.
- **Arrière + L : Steal Chain**, chaîne de l’index. La seringue doit toucher sans
  être gardée, puis maintenir sa connexion : interruption du porteur ou distance
  supérieure à 24 unités rompt le drainage. Elle retire 40 unités d’aura/seconde ;
  à épuisement, une capacité est retenue et son propriétaire ne peut plus l’utiliser.
  Aucun pouvoir n’est inventé pour un combattant martial sans Hatsu de duel.
- Avec une capacité retenue, **arrière + L sous Emperor Time** la charge dans
  Stealth Dolphin ; le prochain arrière + L l’utilise une seule fois, avec ses
  propres conditions, coût et effets. Emperor Time reste verrouillé jusqu’à cet
  usage et la fin de ses effets. Un nouveau arrière + L détache une gomme active ;
  les effets temporisés doivent finir. Le moteur conserve l’identité et les règles
  de la capacité empruntée. Un duel sans allié ne propose pas de prêt à un tiers.
- **H : Judgment Chain**, chaîne de l’auriculaire. Emperor Time et un contact à
  courte portée sont nécessaires ; aucun seuil arbitraire de PV. La règle annoncée
  est « reste en Zetsu ». Elle persiste après l’arrêt d’Emperor Time. La cible peut
  marcher et combattre physiquement : une demande d’aura, de Hatsu ou de tir Nen
  enfreint la règle et la tue. Les inputs neutres maintiennent le Zetsu pour éviter
  qu’un retour automatique au Ten enfreigne la règle à la place du joueur.

Références : chapitres 83–84 (chaînes, serment, efficacité), 361 et 364
(Steal Chain / Dolphin, coût en vie), 368–369 (inconscience). Les PV de soin,
vitesses de drainage, portées et préparations sont des réglages du duel ; la règle
unique de Judgment Chain adapte le choix de conditions au combat sans dialogue.
Les décès conditionnels terminent la manche dans tous les formats ; l’entraînement
rétablit les PV. `kurapika.test.ts` couvre ces transitions par le moteur réel.
