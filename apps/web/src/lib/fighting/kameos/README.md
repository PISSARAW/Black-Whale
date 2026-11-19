# Kaméos · lot 2 de [KAMEOS.md](../KAMEOS.md)

État seulement : aucun kaméo n'entre encore en scène.

- `types.ts` : `KameoSlot`, un corps complet par camp, avec sa phase, son appel,
  son temps de recharge et sa durée dans la phase. `FightState.kameos` est absent
  dans un duel ordinaire, ce qui laisse les empreintes de replay inchangées.
- `state.ts` : `withKameos` attache les kaméos avant la première frame. Le kaméo
  est construit comme un leader (santé du format, équipement, aiguilles d'Illumi)
  et doit être distinct de son propre leader.
- `rounds.ts` : à la frontière de manche, un kaméo vivant revient en réserve avec un
  corps neuf, en gardant ce que le moteur conserve (durée de vie de Kurapika,
  connaissances de Predator, aiguilles). Un kaméo mort reste mort.

`kameos.test.ts` vérifie qu'un kaméo en réserve est inerte : le duel se joue à
l'identique, empreinte comprise, avec ou sans partenaires.

## Lot 3 · projection de mêlée

- `projection.ts` : `projectDuel` place le kaméo dans le slot de son leader, sans
  `kameos` ni morts en attente dans la vue. `mergeDuel` rend chaque corps à sa place
  et garde les effets sur le monde (adversaire, hitstop, impact, score, rng). La mort
  du kaméo l'élimine sans être comptée comme celle de son camp.
- `contacts.ts` : `resolveKameoContacts` résout la mêlée kaméo ↔ leader adverse avec
  `resolveMeleePair`. La cible est passive : aucune horloge ne bouge. Appelée après
  la paire principale, elle ne laisse pas un même coup toucher deux corps.

`impact.attacker` et les champs indexés par camp (score, projectiles, Bungee Gum…)
désignent le **camp**, pas le corps. Les effets de Hatsu sur contact sont attribués
au camp ; le registre du lot 7 les fermera aux kaméos par défaut. Rien n'est encore
branché dans `stepFight` : aucun kaméo n'entre en scène avant le lot 5.

## Lot 4 · catalogue des kaméos de soutien

- `catalogue.ts` : les six kaméos de la première version (Tubeppa, Marayam,
  Zhang Lei, Morena, Luzurus, Salé-salé). Pour chacun : son rôle, son ability canon
  dans `data/abilities/abilities.json` et le chapitre où elle apparaît, son mode de
  livraison, ses frames de présence, son temps de recharge et son coût d'aura.
  Ces valeurs de timing sont un réglage de jeu, pas du canon.
- `effects.ts` : `deliverKameoEffect` paie l'aura du kaméo, puis applique l'adaptation
  du Hatsu qui existe déjà (`hatsuFor(id)`). Sur le leader allié, c'est `onTrigger`.
  Sur l'adversaire à portée, c'est `onImpact`, et une esquive (isolement, portes,
  gardes) est consommée à la place de l'effet. Le piège de Luzurus reste au sol 300
  frames et se déclenche une fois au contact d'un adversaire au sol.

L'effet vit dans les `hatsuEffects` du leader ou de l'adversaire. Le pas ordinaire le
fait avancer une seule fois par frame, et un test le vérifie. `withKameos` n'accepte
que des personnages du catalogue.

## Lot 5 · appel, présence, effet, sortie

- `runtime.ts` : le bouton `kameo` (`FightInput.kameo`) appelle le kaméo depuis la
  réserve, si le leader peut agir et si le kaméo a assez d'aura. Avec la direction
  tenue en même temps, il apparaît à côté (+3), devant (+8) ou derrière (−6) son
  leader. Le cycle est ensuite entering → acting → leaving → reserve, puis 600 frames
  de recharge. L'effet tombe une seule fois, `startup` frames après le début de
  `acting`. Un kaméo frappé avant de partir est interrompu, sans effet, et un leader
  à terre fait partir son kaméo.
- `ai.ts` : en versus IA, le camp IA appelle son kaméo quand le rôle s'y prête : soin
  sous 60 % de PV, défense face à une attaque proche, piège à moyenne distance, etc.
  La décision est déterministe.
- `contacts.ts` · `resolveNearerKameoContacts` : un kaméo plus proche de l'attaquant
  que son leader, et dans la hitbox active, encaisse le coup à sa place. C'est la
  convention de `rosterGuests`. Ensuite, `resolveKameoFrameContacts` traite les coups
  qui ont manqué le leader mais restent à portée du kaméo.
- `frame.ts` est branché dans `stepFight` entre `settleBodies` et `resolveContacts`.
  Sans kaméo, l'état ressort inchangé, et les empreintes de caractérisation aussi.

Le bit `kameo` est ajouté **en dernier** dans `REPLAY_INPUT_KEYS` : les replays
existants gardent le sens de chacun de leurs bits.

## Lot 6 · rendu, HUD, touches, écran de préparation

- `scene.ts` : dessine le corps de chaque kaméo avec l'apparence de son personnage
  dans la visite (`kameoAppearance`, par exemple `prince-tubeppa` ou `morena-prudo`).
  Le corps grandit à l'entrée et s'efface à la sortie. Il prend la pose `special`
  pendant `acting`. Un kaméo mort reste au sol pendant la seule manche de sa mort.
- `stageScene.ts` compose cette scène avec celle des corps invités. `FightScene.svelte`
  ne change que son chemin d'import et reste à 499 lignes.
- `hud.ts` et `FightKameoBadge.svelte` : sous la jauge d'aura, le nom, le rôle et
  l'état (prêt, recharge, en scène, aura épuisée, mort), avec une barre de recharge.
- `selection.ts` et `FightKameoPicker.svelte` : l'écran de préparation propose un
  kaméo par camp (section 05). `+page.svelte` les attache à la création du match.
- Touches par défaut, réassignables au clavier : `<` pour P1 et `Backspace` pour P2.
  À la manette, c'est le bouton 16 (Guide), le seul bouton standard encore libre.

Le piège de Luzurus n'a pas encore de visuel au sol.

### Tubeppa · animation et expressions

`tubeppaMotion.ts` pose Tubeppa sur le même squelette articulé que le roster :
ajustement des lunettes à l’entrée, préparation à deux mains, geste de soutien
sur la frame effective du soin, relâchement et retrait. Les clés suivent les
compteurs simulés de chaque phase ; les deux orientations conservent la main
droite pour les lunettes. Les appuis utilisent le verrouillage des pieds du roster.
Les impacts et la chute utilisent ses réactions communes et prennent priorité sur
le soutien ; le corps reste au sol jusqu’à la fin de la manche.

Le profil analytique dans `expressionProfiles.ts` anime yeux, sourcils et bouche
avec les morphs, le cache, la respiration et les transitions du roster. Les lunettes
et les boucles restent solidaires de la tête. Aucun changement aux dégâts, au soin,
aux collisions, aux ressources ou aux données des replays.

`tubeppaMotion.test.ts` vérifie le cycle réel, la frame du soin, un impact du moteur,
les orientations, les appuis, les caches, les expressions indépendantes, les empreintes
et la mort. `node apps/web/scripts/check-tubeppa-animation.mjs` capture une planche
du modèle de production ; `TUBEPPA_ANIMATION_FILM=1` ajoute les frames du cycle complet.
`TUBEPPA_ANIMATION_OUTPUT` choisit le dossier des captures.

### Marayam · animation et expressions

`marayamMotion.ts` donne au jeune enfant un salut timide de la main droite à l’entrée,
un sursaut et une posture protectrice sur la frame d’activation de l’isolement,
puis un relâchement et un retrait. C’est une direction artistique du soutien arcade :
la pose montre sa réaction à la protection, sans lui attribuer le contrôle conscient
de sa Bête gardienne. `supportAnimation.ts` partage les articulations, les appuis,
les réactions aux impacts et la chute avec Tubeppa et le roster.

Les yeux, les sourcils et la bouche expriment concentration, effort et douleur.
La bouche conserve son trait ondulé avec des morphs dédiés ; le short suit les
hanches, le nœud papillon le torse. `marayamMotion.test.ts` contrôle le vrai cycle,
la frame d’isolement, un impact réellement reçu, les deux orientations, les appuis,
les morphs indépendants, les retours en arrière de présentation et les empreintes.

`KAMEO_ANIMATION_CHARACTER=marayam node apps/web/scripts/check-tubeppa-animation.mjs`
capture Marayam dans le banc partagé. `KAMEO_ANIMATION_OUTPUT` choisit le dossier ;
`KAMEO_ANIMATION_FILM=1` ajoute les frames du cycle complet. Les anciennes variables
`TUBEPPA_ANIMATION_*` restent compatibles.

### Zhang Lei · animation et expressions

`zhangLeiMotion.ts` lui donne une attitude posée, un salut mesuré à l’entrée,
une préparation puis un geste de la main droite ouverte à la frame du bonus de
pièce. Il relâche ensuite les bras et se retire. Cette direction artistique du
soutien arcade montre son accompagnement du bonus de la Bête gardienne.
`supportAnimation.ts` partage les articulations, les appuis, la respiration,
les réactions aux impacts et la chute avec les autres personnages.

Son regard mi-clos, ses plis nasaux et sa bouche utilisent les expressions du
roster, avec une amplitude retenue ; les points du front et la moustache restent
solidaires de la tête. Le plastron suit le torse, les plis du pantalon suivent les
hanches et les genoux. `zhangLeiMotion.test.ts` vérifie le cycle réel et la frame
du bonus, un coup réellement reçu, les deux orientations, les appuis, la stabilité
des traits, les morphs indépendants et les empreintes de replay.

`KAMEO_ANIMATION_CHARACTER=zhanglei node apps/web/scripts/check-tubeppa-animation.mjs`
capture le modèle de production. `KAMEO_ANIMATION_FILM=1` ajoute le cycle complet.

### Morena · animation et expressions

`morenaMotion.ts` pose la main aux lèvres, puis l’invitation sur la frame de Contagion,
le relâchement et le retrait, avec les règles de portée et d’infection existantes.
`supportHandContact.ts` suit la tête avec la main droite, comme pour les lunettes de Tubeppa.
Le profil calme anime le regard et la bouche courbe ; la douleur prime sur le sourire.
`morenaHairMotion.ts` anime les longueurs par morphs GPU, avec cuir chevelu fixe,
géométries partagées, poids indépendants et rééchantillonnage lors des retours de replay.
Les cicatrices et bijoux suivent la tête, la robe et les bottes leurs articulations.
`morenaMotion.test.ts` vérifie le cycle, l’infection à portée, les contacts, les appuis,
les impacts, les deux orientations, les caches, les traits et la mort.
`KAMEO_ANIMATION_CHARACTER=morena node apps/web/scripts/check-tubeppa-animation.mjs`
capture les états de production ; `KAMEO_ANIMATION_FILM=1` ajoute le cycle complet.

### Luzurus · animation et expressions

`luzurusMotion.ts` échantillonne une entrée nonchalante, un examen de l’emplacement,
un geste vers le sol sur la vraie frame de création du piège, puis le retrait.
Cette direction artistique conserve les règles et la durée du piège existant.
Le profil de `expressionProfiles.ts` anime le regard fatigué, la bouche et les
sourcils ; douleur, appuis et chute utilisent les transitions communes du roster.
`luzurusPuffMotion.ts` anime les deux houppes sans déplacer le crâne ni les attaches,
avec un cache de géométries et des poids indépendants, rééchantillonnés en replay.
`luzurusMotion.test.ts` vérifie le vrai cycle, la création puis l’activation du
piège après le départ, un coup reçu, les deux orientations, les morphs et la mort.
`KAMEO_ANIMATION_CHARACTER=luzurus node apps/web/scripts/check-tubeppa-animation.mjs`
capture ses expressions ; `KAMEO_ANIMATION_FILM=1` ajoute le cycle complet.

### Salé-salé · animation et expressions

`salesaleMotion.ts` pose un salut expansif, une préparation du souffle, l’ouverture
des bras sur la vraie frame de brume, puis le relâchement et le retrait.
Cette gestuelle accompagne l’adaptation arcade de la Bête gardienne ; les règles
de portée, d’effet et de coût restent celles du moteur. Le profil de kaméo partage
les transitions du roster et donne priorité à la douleur sur le sourire et l’effort.
`fightExpressionToothedMouth.ts` déforme ensemble le contour natif et les dents,
sans remplacer leur topologie ni ajouter de mesh. Le cache partage les géométries,
avec des poids indépendants et une restauration commune après prêt cinématique.
`salesaleMotion.test.ts` vérifie le cycle, l’effet à portée, un coup reçu, les
orientations, les appuis, les dents contenues dans la bouche, les caches et la mort.
`KAMEO_ANIMATION_CHARACTER=salesale node apps/web/scripts/check-tubeppa-animation.mjs`
capture ses expressions ; `KAMEO_ANIMATION_FILM=1` ajoute le cycle complet.

## Lot 8 · replays et PvP

- **Replays.** Rien à changer : l'instantané initial (`encodeFightSnapshot`) garde les
  kaméos, et le bit `kameo` est enregistré. `replay.test.ts` vérifie qu'un match avec
  kaméos s'enregistre, et qu'un appel se relit à l'identique à deux cadences.
- **PvP.** `PvpSetup.kameos` est optionnel. Il est omis quand aucun camp n'a de kaméo,
  donc un tel setup garde son empreinte. `parseKameoPicks` n'accepte que des clés
  `player` / `opponent` et des identifiants du catalogue. Le serveur attache les
  kaméos à la création du match. Dans la vue privée, le kaméo adverse est masqué comme
  le leader adverse, et l'échange de perspective (`localPerspective`) montre à
  chaque joueur son propre kaméo côté `player`. Le ruleset passe à `clash-pvp-6`.
- L'écran de création du duel privé propose le même sélecteur de kaméos.

## Kaméos dans les combos

`buffer.ts` conserve une pression manuelle pendant le hitstop : le corps et ses
horloges restent figés, puis l’appel part à la première frame libre. La direction
est mémorisée relativement au leader. Réserve, recharge, aura et capacité d’agir
sont vérifiées à la saisie et à la reprise ; un appel devenu invalide est abandonné.
Le HUD indique « Appel mémorisé ». Ce comportement utilise le ruleset de replay v66,
également inclus dans le ruleset PvP.

`comboLessonCatalogue.ts` fournit six exercices par combattant (240 routes), dans
Académie du Nen → Combos & défense. Le sélecteur affiche les six soutiens du
personnage choisi. `comboRosterRoutes.ts` décrit les chaînes et liens natifs de la
grammaire actuelle de main. Les neuf personnages aux séquences les plus courtes
appellent certains soutiens avec l’attaque d’ouverture ; les autres appels suivent
la première touche. Les commandes et conditions de chaque route l’indiquent.

Luzurus immobilise une cible au sol et permet une frappe après récupération.
Zhang Lei renforce un contact réel avec sa pièce ; Marayam protège la fin et la
récupération ; Tubeppa soigne un combattant blessé ; Morena et Salé-salé doivent
atteindre une cible à portée. Franklin conserve sa rafale et son coût d’aura.
Pour le dernier revers d’Hisoka, l’exercice lit le startup natif et les frames
restantes du soutien afin que l’effet arrive avant ou sur le contact.

Les exercices exigent les touches continues et l’effet réellement reçu avant leur
fin. Un appel payé, hors de portée ou interrompu ne suffit pas. Les timings,
coûts, gardes, évitements, interruptions et conditions des Hatsu ne changent pas.
Tubeppa commence avec 40 PV manquants dans son exercice ; les autres préparations
n’accordent aucun Hatsu gratuit au leader. Les soutiens n’ajoutent pas de touche
ni de prise aérienne. Le bouton tactile utilise `FightKameoCall.svelte` dans les
outils tactiles de main.

`comboScenarios.ts` exécute les mêmes commandes natives pour mesurer les limites.
Il distingue la chaîne physique (`comboGuaranteed`), le soutien reçu avant sa fin
(`supportInCombo`), leur réussite conjointe (`guaranteed`), la première frame où
le défenseur peut agir et le contact éventuel de sa riposte. Les délais ignorent
le hitstop ; les frames de contact et de reprise incluent la simulation complète.
Le délai zéro suit l’appel de la route (ouverture ou première touche).

### Validation sur main

Le banc Chrome mesure 4 480 situations et lance 100 exercices avec le rendu WebGL.
Les 240 routes passent au centre et au coin, contre la garde et contre un léger
entré dès la reprise (960 cas immédiats). Pour Luzurus, contre la garde après
la première touche :

| Retard de l’appel (frames actives) | Routes garanties, centre + coin |
| ---------------------------------- | ------------------------------- |
| 0                                  | 80 / 80                         |
| 10                                 | 6 / 80                          |
| 30                                 | 0 / 80                          |
| 60                                 | 0 / 80                          |

Avec l’appel immédiat, retarder la finition de Luzurus de 5, 10 ou 20 frames reste
garanti dans les 80 cas ; à 90 frames, le défenseur reprend la main dans les 80 cas.
Le mannequin est Chrollo, sauf pour Chrollo qui affronte Hisoka. Ces résultats
concernent les distances et ressources des exercices, et la grammaire actuelle
sur main. Les autres soutiens n’obtiennent pas l’immobilisation de Luzurus.

`comboCalls.test.ts` couvre les quarante leaders dans les deux camps, puis les
240 exercices au centre et au coin dans les deux orientations. `rosterScenarios.test.ts`
vérifie les appels tardifs, l’aura épuisée et une finition trop tardive. Les
cadences et replays passent par `combatSchool.test.ts`.

Les exercices de soutien appartiennent à `COMBAT_SCHOOL_ROUTES`. Les routes
natives de `COMBAT_ROUTES` restent seules utilisées pour déclarer les combos du
combattant : des exercices avec des soutiens différents peuvent partager les
mêmes coups sans ajouter de doublons au manuel ni modifier les annulations.

`node apps/web/scripts/check-fighting-kameo-combos.mjs` produit `timings.json`,
`report.json` et les captures dans `KAMEO_COMBO_OUTPUT` (par défaut
`output/kameo-roster/chrome`). Les catalogues inertes sont isolés dans
`clash-kameo-catalogues` ; le test de partitionnement vérifie leurs données et
leur chargement, sans relever le budget JavaScript de 500 kB.
