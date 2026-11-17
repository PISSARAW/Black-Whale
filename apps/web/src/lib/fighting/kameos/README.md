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
