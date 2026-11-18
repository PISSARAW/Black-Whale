# Kaméos de soutien — plan de conception

Statut : lots 0 à 4 faits (caractérisation, scission du pas dans `duelStep/`, état,
projection de mêlée et catalogue des six kaméos de soutien dans `kameos/`) ; le reste
est une **proposition**. Nom de travail « Kaméo » (terme de MK) ; un nom propre à
Clash est à choisir pour l'interface.

## Objectif (révisé : kaméos de soutien)

Le kaméo est un **personnage du bateau qui ne fait pas partie des quarante**. Il entre
sur appel à côté de son leader, déclenche un Hatsu de **soutien** (soin, défense,
boost, attaque, piège, zone) puis ressort. Il a un vrai corps en scène : il peut être
frappé, et il meurt pour de bon. Ce n'est plus un combattant complet joué à côté du
leader, comme dans la première version de ce plan.

Ce choix résout aussi la limite du lot 3. Le kaméo n'a pas besoin de ses propres
horloges de Hatsu : son effet est posé **sur le leader allié ou sur l'adversaire**,
dans les champs `hatsuEffects` que le moteur fait déjà avancer une fois par frame.
Chrollo pose ces mêmes effets sur lui-même quand il vole les pages des princes
(`chrolloPageEffects.ts`). Le mécanisme est donc déjà éprouvé.

### Candidats : Hatsu canon déjà adaptés dans le moteur

Ces onze personnages existent comme `FighterId`, avec une entrée dans
`hatsu/registry.ts`, mais hors du roster jouable (`fighterDefinition` retombe sur
le premier combattant). Leurs données canon sont dans `data/abilities/abilities.json`.

| Rôle            | Personnage | Hatsu canon                  | Effet déjà dans le moteur                      |
| --------------- | ---------- | ---------------------------- | ---------------------------------------------- |
| Soin            | Tubeppa    | Collaborative Drug Synthesis | +8 PV et `synthesisFrames`                     |
| Défense         | Marayam    | Room 1013 Isolation          | `isolationFrames` (240) : hors d'atteinte      |
| Défense         | Kacho      | Without You                  | `kachoGuards` (1 garde)                        |
| Esquive         | Fugetsu    | Magical Worm                 | `wormDodges` (1 esquive par la porte)          |
| Boost           | Zhang Lei  | Guardian Coins               | `coinCharges` : dégâts +10 %, reçus −8 %/pièce |
| Affaiblissement | Tyson      | Eye-wogs                     | `eyeWogFrames` : drain d'aura                  |
| Attaque         | Morena     | Contagion                    | drain d'aura cumulé (3 paliers)                |
| Piège           | Luzurus    | Desire Trap                  | `desireFrames` : immobilise 90 frames          |
| Piège           | Momoze     | Are You Free?                | `momozeFrames` (120)                           |
| Zone            | Salé-salé  | Diffusive Aura Smoke         | `smokeFrames` (180)                            |

Exclus ou à trancher :

- **Gidal** (Yomotsu Hegui) : le lanceur doit se suicider. C'est incompatible avec un
  soutien.
- **Kacho** : Without You ne s'active, dans le canon, qu'à la mort d'une des jumelles.
  L'adaptation existante l'ignore.
- **Tokarine** (portails), **Kurton** (véhicule), **Yushohi** (Stand By Me),
  **l'utilisateur de Silent Majority** : présents dans les données, absents du moteur.
  L'effet de Stand By Me n'est pas révélé dans le canon.
- Les **Bêtes gardiennes** agissent sans contrôle conscient du prince, et le canon les
  empêche d'attaquer directement les autres princes. Il faut décider si le kaméo est
  le prince, la bête, ou les deux.

### Ce qui change dans les lots

- Lots 0 à 3 : inchangés. Le corps en scène réutilise `KameoSlot` et la projection
  pour **être frappé**, et pour les rares appels offensifs au contact.
- Lot 4 (révisé) : catalogue `kameos/catalogue.ts`. Pour chaque kaméo : son rôle, la
  source canon (identifiant d'ability), ses trois appels avec leurs frame data, et
  la cible de l'effet (leader allié ou adversaire). Les effets réutilisent les champs
  `hatsuEffects` existants.
- Lot 5 : appel, entrée, effet, sortie. Le corps en scène passe par `rosterGuests`
  (rôle `'kameo'`) pour hériter des projectiles et du ciblage.
- Le registre d'éligibilité aux Hatsu (ancien lot 7) disparaît : un kaméo n'utilise
  que l'effet de soutien que le catalogue lui donne.

## Diagnostic : le moteur est un duel

| Mesure (hors tests)                                  | Valeur       |
| ---------------------------------------------------- | ------------ |
| Fichiers qui lisent `.player` / `.opponent`          | 142          |
| Occurrences de `state.player` / `state.opponent`     | ~2 840       |
| Bascules `side === 'player' ? 'opponent' : 'player'` | 138          |
| `types.ts` / `engine.ts`                             | 498 / 484 l. |

Il n'existe pas de « cible » distincte de « l'autre camp » : chaque Hatsu, chaque
collision, chaque règle considère que l'adversaire est `state[otherSide]`. Généraliser
`FightState` à N corps reviendrait à réécrire ces 2 840 accès. **On ne le fait pas.**

## Architecture retenue : duel principal + projections de duel

Le duel principal reste `player` contre `opponent`. Les kaméos vivent à côté :

```ts
// kameos/types.ts
interface KameoSlot {
  fighter: ArcadeFighter // corps complet
  phase: 'reserve' | 'entering' | 'acting' | 'leaving' | 'eliminated'
  call: KameoCallId | null // neutre / avant / arrière
  cooldownFrames: number // recharge avant le prochain appel, 0 = prêt
  phaseFrames: number // durée passée dans la phase
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

**Constat du lot 3.** La mêlée se sépare proprement : `resolveMeleePair`
(`combatImpact.ts`) résout les coups entre deux corps sans horloge, observateur ni
verdict, et la projection l'utilise telle quelle. Le reste de `settleBodies` ne se
sépare pas sans toucher aux personnages :

| Étape de la frame                         | Nature                                   |
| ----------------------------------------- | ---------------------------------------- |
| `stepActors` (physique, frames d'attaque) | par corps, réutilisable                  |
| `resolveMeleePair`                        | par paire, réutilisable                  |
| `advanceHatsuFrames`                      | les 40 `onFrame` lisent la paire entière |
| paroles, ouïe de Melody, jugements        | lisent la paire entière                  |
| commandes tamponnées                      | par corps, mais via l'état               |
| projectiles, `resolveFightOutcome`        | monde, une fois par frame                |

Faire tourner `advanceHatsuFrames` dans une projection ferait avancer deux fois les
horloges de l'adversaire. Un kaméo n'a donc **aucune horloge de Hatsu** tant que les
`onFrame` concernés n'ont pas de forme par corps. C'est la raison technique du défaut
« interdit » du registre (lot 7) : seuls les coups physiques sont sûrs aujourd'hui.

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
  `kameos/hatsuEligibility.ts` classe chaque Hatsu en _autorisé en kaméo_,
  _autorisé, cible = corps principal adverse_ ou _interdit en kaméo_. Le défaut est
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
