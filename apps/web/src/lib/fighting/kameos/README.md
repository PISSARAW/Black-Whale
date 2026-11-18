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
