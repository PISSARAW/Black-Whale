# Kaméos complets — plan de conception

Statut : lots 0 à 2 faits (caractérisation, scission du pas dans `duelStep/`, état
dans `kameos/`) ; le reste est une **proposition**. Nom de travail « Kaméo » (terme de MK) ;
un nom propre à Clash est à choisir pour l'interface.

## Objectif

Un second personnage des quarante accompagne chaque combattant. Il entre sur appel,
agit **en même temps** que son leader, puis ressort. C'est un vrai `ArcadeFighter` :
son corps, ses PV, son aura, son Nen et ses Hatsu, soumis aux mêmes collisions, coûts
et conditions que le moteur ordinaire. Il se distingue du relais de
[PHASE9.md](./PHASE9.md), où un seul corps par groupe est en scène.

## Diagnostic : le moteur est un duel

| Mesure (hors tests)                                        | Valeur        |
| ---------------------------------------------------------- | ------------- |
| Fichiers qui lisent `.player` / `.opponent`                | 142           |
| Occurrences de `state.player` / `state.opponent`           | ~2 840        |
| Bascules `side === 'player' ? 'opponent' : 'player'`       | 138           |
| `types.ts` / `engine.ts`                                   | 498 / 484 l.  |

Il n'existe pas de « cible » distincte de « l'autre camp » : chaque Hatsu, chaque
collision, chaque règle considère que l'adversaire est `state[otherSide]`. Généraliser
`FightState` à N corps reviendrait à réécrire ces 2 840 accès. **On ne le fait pas.**

## Architecture retenue : duel principal + projections de duel

Le duel principal reste `player` contre `opponent`. Les kaméos vivent à côté :

```ts
// kameos/types.ts
interface KameoSlot {
  fighter: ArcadeFighter      // corps complet
  phase: 'reserve' | 'entering' | 'acting' | 'leaving' | 'eliminated'
  call: KameoCallId | null    // neutre / avant / arrière
  cooldownFrames: number      // recharge avant le prochain appel, 0 = prêt
  phaseFrames: number         // durée passée dans la phase
}
// FightState.kameos?: Partial<Record<FightSide, KameoSlot>>
```

Champ optionnel et absent par défaut : tous les replays existants gardent leur checksum.

### Projection de duel

Pour toute interaction kaméo ↔ adversaire, on construit une **vue de duel** où le
kaméo occupe le slot de son camp : `{ ...state, player: kameo, opponent: state.opponent }`.
On y exécute les fonctions existantes (`performMove`, résolution des coups, Hatsu),
puis on **fusionne** : le kaméo retourne dans son slot, l'adversaire modifié retourne
dans le duel principal. Le code de 2 840 lignes ne voit toujours qu'un duel.

Le point dur est le **double pas**. Pendant une frame, l'adversaire avance déjà dans
le duel principal. Dans la projection, il doit rester **cible passive** : il reçoit
les coups sans faire avancer ses horloges, son IA, ses effets ni sa garde une deuxième
fois. Il faut donc scinder `stepFight` en deux :

- `stepActor` : entrées, IA, horloges, mouvement. Une fois par corps et par frame.
- `resolveContacts` : hitbox contre hurtbox, dégâts, stun, effets de contact. Une fois
  par **paire** (leader↔adversaire, kaméo↔adversaire).

Cette scission est le premier vrai chantier et conditionne tout le reste.

### Collisions et projectiles

- `fightCollisionScene.ts` teste aussi le coup actif de l'adversaire contre la hurtbox
  du kaméo. Si le coup touche le kaméo, on le résout dans la projection inverse, avec
  le kaméo comme cible.
- Un coup qui touche les deux corps dans la même frame en choisit un seul, le plus
  proche dans l'ordre de l'attaque. Pas de dégâts doublés.
- `FightProjectile` gagne `body: 'main' | 'kameo'` pour l'émetteur. La cible reste
  « l'autre camp », plus la hurtbox du kaméo adverse s'il est en scène.
- Pushbox : le kaméo ne pousse pas son leader. Il est séparé de l'adversaire comme
  un corps ordinaire.

### Juggle et combos

`juggleCount`, `comboHits` et `hitStun` vivent sur la **cible**, ils sont donc
naturellement partagés entre leader et kaméo. L'échelle de dégâts existante s'applique
sans bonus kaméo.

## Règles Nen (cohérence avec l'existant)

- Le kaméo dépense **son** aura et prend **ses** dégâts. Il ne transmet ni aura ni
  pouvoir à son leader, et l'inverse non plus, comme pour le relais.
- **Appel** : il faut la jauge pleine et le leader capable d'agir (`canAct`). Le kaméo
  doit avoir son Nen au repos, contrôle repris de `restingNen` (`teamRelayRules.ts`).
- **Sortie** : un kaméo engagé (projection, lien, contrat, manifestation, horloge)
  **ne sort pas**. Il reste en scène et vulnérable jusqu'à ce que l'engagement se
  libère. C'est la règle du relais : on ne disparaît pas pour annuler une faiblesse.
- **Mort** : un kaméo qui tombe à 0 PV est mort et passe `eliminated` pour le match.
  Le leader continue. Une vraie mort se produit au lieu d'une invulnérabilité à la MK.
- **Hatsu ciblés** (chaînes, contrats, pages de Chrollo, Cat's Name…) : un registre
  `kameos/hatsuEligibility.ts` classe chaque Hatsu en *autorisé en kaméo*,
  *autorisé, cible = corps principal adverse* ou *interdit en kaméo*. Le défaut est
  **interdit**, on ouvre au cas par cas. Les Hatsu adverses ne visent jamais le kaméo,
  sauf par contact physique réel.

## Contrôles et IA

- Un bouton d'appel, plus une direction (neutre / avant / arrière) pour choisir parmi
  trois appels propres à chaque kaméo, définis dans `kameos/calls/<id>.ts`.
- Une fois appelé, le kaméo est piloté par un script court : approche, geste, retour.
  Chaque geste passe par `performMove` dans la projection. Il n'est jamais piloté au
  stick, le joueur garde son leader.
- L'IA adverse apprend à appeler son kaméo (`kameos/ai.ts`), branchée dans
  `opponentAttack` par un import.

## Lots

Chaque lot laisse la base verte (comparée à la base) et ne grossit aucun fichier
hors borne.

0. **Caractérisation.** Tests de checksum sur un panel de replays et de matchs IA,
   pour prouver qu'un match sans kaméo reste identique bit à bit à chaque lot.
1. **Scission `stepActor` / `resolveContacts`** dans `engine.ts`, à comportement
   constant. `engine.ts` est à 484 lignes : on extrait avant d'ajouter.
2. **État** : dossier `kameos/`, champ optionnel dans `types.ts`. Le fichier est à
   498 lignes, il faut d'abord sortir un bloc (`EMPTY_INPUT`, types annexes) pour
   faire de la place.
3. **Projection de duel** : construction, fusion, cible passive, tests unitaires.
4. **Collisions secondaires et projectiles** avec `body`.
5. **Appel, script, jauge**, d'abord avec un seul kaméo pilote (proposition : Bill ou
   Hanzo, sans Hatsu ciblé).
6. **Rendu** : troisième rig dans la scène, entrée/sortie, jauge dans le HUD, liste
   des appels dans la move list.
7. **Registre d'éligibilité Hatsu** et ouverture progressive aux quarante.
8. **Replays** (codec, snapshot), puis **PvP** (`serverMatch`, prédiction,
   réconciliation). Le PvP passe en dernier : la prédiction client devra aussi
   prédire le kaméo.

Hors périmètre initial : carrière, classement et tournoi, jusqu'à validation du lot 8.
Les équipes de trois et les kaméos ne se combinent pas au départ.

## Risques

- **Double pas** : un effet qui s'exécute deux fois dans la même frame (horloge,
  poison, contrat) fausse un match sans bruit. Les tests de caractérisation du lot 0
  sont le garde-fou.
- **Hatsu dépendants de l'identité du duel** : c'est ce qui justifie le défaut
  « interdit ».
- **Coût du rendu** : trois rigs complets plus les effets. À mesurer avec
  `check-fighting-*` avant d'ouvrir les quarante.
- **PvP** : l'empreinte d'état autoritaire doit inclure les kaméos dès le lot 2.

## Décisions ouvertes

1. Mort réelle du kaméo (proposé) ou kaméo non létal ?
2. Kaméos choisis parmi les quarante (proposé) ou liste dédiée ?
3. Modes ouverts au départ : versus local et entraînement (proposé) ?
4. Nom dans l'interface.
