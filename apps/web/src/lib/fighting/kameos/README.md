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
