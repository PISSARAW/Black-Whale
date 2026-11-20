# Proposition — une grammaire de combo pour Clash

**Statut :** proposition, non adoptée · **Date :** 2026-11-17
**Portée :** combat en duel de `lib/fighting` (profils, cancels, frames, Académie, IA, replays)
**Complète :** [DUEL_COMBOS.md](./DUEL_COMBOS.md), [COMBAT.md](./COMBAT.md), [STEP3.md](./STEP3.md)

---

## 1. Constat

Dix lots ont porté le catalogue à 328 routes pour quarante personnages. Aucun n’a
changé la **grammaire** qui produit les combos, et c’est elle qui les éloigne de
Street Fighter. Voici les six écarts, mesurés dans le code actuel.

### 1.1 Une liste blanche à la place d’une règle

Chaque coup déclare ses suites (`into: ['standingHeavy', 'forwardLight', …]` dans
[duelComboProfiles.ts](./duelComboProfiles.ts)). [bufferedCancel.ts](./bufferedCancel.ts)
refuse tout ce qui n’est pas dans `cancelInto`. Un combo n’existe donc que si
quelqu’un l’a écrit. Dans SF, la plupart des combos découlent de deux règles
communes à tout le casting :

- un normal _cancellable_ peut s’annuler dans un spécial ;
- un lien est possible dès que l’avantage sur touche couvre le démarrage du coup suivant.

Les target combos (chaînes écrites à la main) y restent l’exception. Ici, c’est le
seul mécanisme.

### 1.2 Les spéciaux sont des pouvoirs, pas des coups

Les slots `neutralSpecial`, `forwardSpecial`, etc. portent des Hatsu. Ceux-ci coûtent
de l’aura (sur une réserve de 100) et restent soumis à leurs conditions canoniques.
Plusieurs ne sont volontairement jamais des coups de combo (Chain Jail, Holy Chain,
Secret Window, Culdcept…). Les fins de route n’accordent aucun cancel supplémentaire.
La boucle centrale de SF (confirmer sur touche, annuler dans un spécial, puis dans
une super) n’a donc pas de support.

### 1.3 Des liens si larges qu’ils n’en sont plus

Mesure exacte, vérifiée contre le laboratoire pour les quarante personnages
(`moveFrameAdvantage.test.ts`) : pour une touche sur la première frame active,
`avantage = hitstun − (actif + récupération)`, et de même sur garde avec le blockstun.
Un lien passe si et seulement si l’avantage **dépasse** le démarrage du coup suivant ;
la fenêtre vaut `avantage − démarrage` frames. La table complète est générée dans
[FRAME_DATA.md](./FRAME_DATA.md).

| Coup (Kurapika)                       | Démarrage | Actif | Récup. | Touche | Garde |
| ------------------------------------- | --------: | ----: | -----: | -----: | ----: |
| Pique divinatoire (léger debout)      |         4 |     3 |      8 |     +6 |    −2 |
| Revers divinatoire (lourd debout)     |         8 |     4 |     14 |     +4 |    −4 |
| Percée divinatoire (avant + léger)    |         6 |     3 |      5 |    +15 |    +4 |
| Retrait divinatoire (arrière + lourd) |        10 |     4 |     16 |    +14 |    −4 |

Le lien « avant + léger → lourd » de Kurapika (démarrage 8) dispose donc d’une
fenêtre de **sept frames**, buffer de six frames en plus. Dans un SF, un lien se joue
typiquement sur une à trois frames.

Plus parlant encore : sur les 280 normaux et coups de commande au sol du roster,
**146 ont assez d’avantage pour se lier sur eux-mêmes**, et les quarante personnages en ont au moins un. Le léger debout de
Kurapika (+6, démarrage 4) se lie sur lui-même avec deux frames de marge ; ce sont
la poussée et la décroissance du hitstun de STEP3 qui arrêtent la répétition, pas
les frames. Le principe affiché dans COMBAT.md (« assez de hitstun
pour leur suite ») garantit les combos par construction, au lieu de les rendre
exigeants.

### 1.4 On réduit le hitstun au lieu des dégâts

[STEP3.md](./STEP3.md) retire quatre frames de hitstun par touche à partir de la
quatrième, pour casser les boucles de légers au coin. Les combos longs deviennent
alors impossibles, au lieu de simplement rapporter moins. SF garde un hitstun au sol
constant et applique un **damage scaling**.

### 1.5 Presque rien ne s’annule sur garde

Seul le premier léger peut continuer vers le lourd déclaré. Pression, frame traps
et hit-confirm reposent tous dans SF sur des normaux bloqués annulés en spéciaux.
Ici, le défenseur retrouve la main presque à chaque coup bloqué.

### 1.6 Deux forces, pas de manipulation

Léger et lourd, plus les directions, plus un bouton spécial. Aucune manipulation
(quart de cercle, dragon punch). Avec si peu de matière, les quarante personnages
partagent les mêmes squelettes (`J → K → L`).

## 2. Ce qui ne bouge pas

La refonte touche la grammaire, pas le canon. Les règles de
[clash-arsenal-integral.md](../../../../../docs/clash-arsenal-integral.md) restent
valables :

- Un Hatsu garde son coût, ses conditions, son contact obligatoire, ses ressources
  et ses serments. Si ses conditions manquent, le cancel est **refusé** ; il n’est
  jamais remplacé par un autre coup.
- Aucun pouvoir n’est inventé. Les nouveaux spéciaux (§ 3.2) sont **martiaux** ou
  relèvent des fondamentaux du Nen (Ten, Ken, Ko, Ryu, Shu) que le personnage maîtrise.
- Les préparations (Prologue, poème de Basho, Pain Packer…) restent des actions
  séparées, hors combo.
- Une démonstration passe par les vraies commandes et ne force aucune touche.

## 3. Grammaire proposée

### 3.1 Une hiérarchie de cancel générale

Chaque coup porte un **niveau de cancel**, ce qui remplace la liste `into` :

```ts
type CancelTier = 'none' | 'special' | 'super'
// normal 'special'  → peut s’annuler dans n’importe quel spécial ou super
// spécial 'super'   → peut s’annuler dans une super (Hatsu) dont les conditions tiennent
// 'none'            → ne s’annule pas (fins, coups lourds de punition)
```

La règle s’applique à tout le casting. Les chaînes écrites à la main subsistent sous
le nom `chains` pour les target combos propres à un personnage. Elles ne sont plus
le seul moyen de combiner.

### 3.2 Trois couches de coups

| Couche   | Contenu                                                     | Coût                      | Commande                                   |
| -------- | ----------------------------------------------------------- | ------------------------- | ------------------------------------------ |
| Normaux  | Léger, lourd et leurs variantes directionnelles actuelles   | 0                         | Inchangée                                  |
| Spéciaux | 2 ou 3 techniques martiales ou de Nen fondamental par perso | 0 ou faible (≤ 10 aura)   | Manipulation (236, 214, 623) ou simplifiée |
| Supers   | Les Hatsu combinables d’aujourd’hui                         | Aura, conditions intactes | Inchangée, depuis un spécial `super`       |

L’aura joue le rôle de la jauge de super. Les Hatsu non combinables (Chain Jail,
Secret Window…) restent hors de cette hiérarchie, comme aujourd’hui.

**Deux schémas de commande**, sur le modèle classique/moderne :

- _Classique_ : manipulations, dégâts pleins.
- _Simplifié_ : direction + spécial (le schéma actuel, que le tactile garde), avec
  environ 20 % de dégâts en moins sur les spéciaux. À régler en essais.

### 3.3 Des liens étroits

- Abaisser le hitstun des normaux pour que l’avantage sur touche tombe entre **+1 et +5**.
- Un lien laisse de **une à trois frames**. Le buffer de six frames reste réservé aux
  cancels ; les liens n’ont qu’un tampon réduit (deux frames, réglable au laboratoire).
- **Invariant testable** : aucun normal ne peut se lier sur lui-même (avantage sur
  touche < démarrage du même coup). C’est cet invariant qui empêche les boucles au coin,
  pas la décroissance du hitstun.

### 3.4 Damage scaling à la place de la décroissance du hitstun

- Supprimer la règle de STEP3 sur le hitstun au sol.
- Barème de départ : 100 % sur les deux premières touches, puis −10 points par touche,
  plancher à 10 %. Une super garde un plancher plus haut (par exemple 50 %).
- Starter léger : premier palier à 80 %, pour récompenser une ouverture au lourd.
- Le plafond de juggle aérien reste en place.

### 3.5 Les cancels sur garde

- Un normal `special` bloqué peut s’annuler dans un spécial.
- Chaque spécial reçoit un statut lisible sur garde : sûr (−2 et mieux) ou punissable
  (−6 et pire). La liste des coups l’affiche.
- La parade au bon timing interrompt toujours la pression.

### 3.6 Un hit-confirm humain

- Les chaînes légères sur touche (`J, J`) laissent assez de temps pour voir l’impact
  avant d’annuler (environ 12 à 15 frames entre la première touche et la fin de la
  fenêtre de cancel).
- Le laboratoire affiche l’avantage en frames de chaque coup, sur touche et sur garde.

## 4. Exemple : Kurapika et Benjamin

Les spéciaux ci-dessous sont des **exemples de forme**. Chaque technique martiale
doit être validée contre le canon avant d’être écrite.

| Route        | Aujourd’hui                                 | Proposé                                                                         |
| ------------ | ------------------------------------------- | ------------------------------------------------------------------------------- |
| Kurapika BnB | J → avant + L, attente, K → fouet (24 aura) | bas + J, bas + J (lien 2 f) → K (cancel) → fente martiale → [fouet si 24 aura]  |
| Benjamin BnB | J → avant + L → K → Air Blow (40 aura)      | J, J → avant + L (cancel) → charge d’épaule → [Air Blow si héritage et 40 aura] |
| Pression     | Le premier léger bloqué mène au lourd       | Normal bloqué → spécial sûr, ou spécial punissable pour forcer une réaction     |

## 5. Impact technique

| Zone                                                 | Changement                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------- |
| `duelComboTypes.ts`, `movesetTypes.ts`               | `CancelTier`, `chains`, statut sur garde                              |
| `bufferedCancel.ts`, `fighterAttacks.ts`             | La règle par niveau remplace la recherche dans `cancelInto`           |
| `frameData.ts` et les dix fichiers de profils        | Hitstun et récupération retouchés pour 40 personnages                 |
| Nouveau module de scaling                            | Remplace la décroissance du hitstun de STEP3                          |
| Nouveau lecteur de manipulations                     | Historique de directions, tolérances, schéma simplifié                |
| `fightInputBindings.ts`, `FightTouchControls.svelte` | Choix classique/simplifié                                             |
| Académie et `combatRoutes.test.ts`                   | Les 328 routes sont réécrites                                         |
| `arsenalAi*.ts`, `movesetAi.ts`                      | Hit-confirm et cancels sur garde pour l’IA                            |
| Replays                                              | Nouveau ruleset `clash-combat-*`, référence réenregistrée (v20 → v21) |

Tout ajout passe dans des fichiers neufs, conformément aux bornes de `CLAUDE.md`.
Plusieurs fichiers touchés dépassent déjà 500 lignes.

## 6. Plan par lots

0. **Mesure** (livré). Avantage statique dans la liste des coups et dans l’encart du
   laboratoire, table générée [FRAME_DATA.md](./FRAME_DATA.md) (`pnpm fighting:frames`).
   Sert de base de comparaison.
1. **Moteur** (livré). `CancelGrammar` dans `duelComboTypes.ts`, règles dans
   `duelComboGrammar.ts`, barème dans `comboDamageScale.ts`, actifs pour Kurapika et
   Benjamin seulement. Faute de spéciaux martiaux (décision 1), leurs fins physiques
   (bas + lourd, avant + lourd) tiennent le rôle des spéciaux, et le fouet et Air Blow
   celui des supers. Le buffer de six frames s’applique encore aux liens ; le réduire
   touche tout le roster et reste à décider. Le bonus d’ouverture au léger (80 %) n’est
   pas fait : il demande de mémoriser le premier coup du combo.
2. **Commandes** (livré). `motionInput.ts` lit la notation pavé numérique et le quart
   de cercle avant (2 3 6) sur les 15 dernières frames ; `controlScheme.ts` applique
   les deux schémas. En classique, la super de Kurapika (fouet) et de Benjamin
   (Air Blow) demande 236 + spécial ; sa commande directe est refusée sans retomber
   sur une autre attaque. En simplifié (par défaut, imposé en tactile, utilisé par
   l’IA et les démonstrations), la commande directe reste valable et ces supers
   perdent 10 % de dégâts (20 % au départ : l’Air Blow payant de Benjamin
   ne dépassait plus une fin gratuite). Le choix se fait dans Commandes → Schéma de commande.
   Le PvP reste en simplifié tant que les deux pairs n’échangent pas leur schéma.
   Ruleset `clash-combat-25` (24 est pris par une autre branche).
3. **Référence** (livré, sans essais joueurs). Hisoka, Chrollo et Feitan passent à la
   grammaire ; leurs normaux sont entre +2 et +3 sur touche, jamais au-dessus du
   démarrage de leur léger. Fins physiques : balayage et revers élastique (Hisoka),
   balayage et avant + léger (Chrollo), balayage et décapitation (Feitan). Supers :
   Bungee Gum et le finisher (Hisoka), Sun and Moon (Chrollo), estoc du parapluie
   (Feitan). Le lien lourd → arrière + lourd de Chrollo devient une chaîne : à +14,
   son lourd se liait aussi à son léger. **Phinks reste hors grammaire** (voir le lot 4). Les essais avec joueurs restent à faire. Ruleset `clash-combat-26`.
4. **Roster** (livré, sans revue canon de nouveaux spéciaux). `duelComboDerivedGrammar.ts`
   dérive la grammaire de chaque profil restant, sans coup ni pouvoir nouveau : les
   normaux de mise au sol non enchaînés deviennent les spéciaux, les Hatsu déjà placés
   en combo les supers, les anciens liens après récupération des chaînes. L’avantage
   est plafonné à +4 et au plus petit démarrage du personnage, donc aucun normal ne se
   lie plus à un autre ; une chaîne qui fermerait une boucle est écartée (chaînes
   écrites d’abord, anciens liens d’abord pour Bonolenov et Hinrigh, dont l’Académie
   enseigne lourd → arrière + lourd). Trente et un personnages passent ainsi.
   **Quatre restent hors grammaire** : Phinks (poing chargé), Leorio (poing à
   distance), Bonolenov (lance) et Padaille (foret puis balayage). Chacun place une
   technique lente qui ne s’annule pas par un lien après récupération ; ce lien exige
   un coup très positif qui se lie aussi au léger, d’où une boucle. Il faudrait rendre
   ces techniques annulables depuis le coup qui les prépare, ce qui touche leurs règles
   d’admission. Les liens d’une à trois frames restent propres à Kurapika et Benjamin.
   Ruleset `clash-combat-27`.
5. **Académie et IA** (livré). L’IA décide toutes les 16 à 24 frames, trop lentement
   pour une fenêtre de cancel ; `aiComboFollowUp.ts` répond donc à chaque frame à une
   touche ou une garde confirmée de son propre coup, une seule fois par contact, par les
   règles d’admission ordinaires. Sur touche (80 % des cas), elle chaîne jusqu’à trois
   touches puis finit par le Hatsu payable, sinon par une fin physique. Sur garde (50 %),
   elle ajoute une chaîne entre normaux, jamais une fin ni un Hatsu. Les tirages
   utilisent le RNG du combat, donc les replays restent déterministes. Contre un joueur
   immobile, son meilleur combo passe de deux à au moins trois touches. Les routes de
   l’Académie ont été adaptées lot par lot et toutes passent ; aucune n’est ajoutée, le
   total de 328 reste inchangé. Ruleset `clash-combat-28`.

Chaque lot change le ruleset de replay et garde les tests de combo verts.

## 7. Décisions ouvertes

1. **Spéciaux martiaux et canon.** Quelles techniques comptent comme « non inventées »
   pour les personnages dont le style martial est peu montré ?
2. **Manipulations sur mobile.** Le schéma simplifié suffit-il au tactile, avec sa
   pénalité de dégâts ?
3. **Troisième force.** Garder deux boutons avec des normaux directionnels (option
   recommandée) ou ajouter un coup moyen ?
4. **Compatibilité.** On accepte de casser tous les replays et la référence v20.
5. **Réglages.** Les valeurs des § 3.3 et 3.4 sont des points de départ ; elles
   demandent des parties avec des joueurs.

## 8. Critères de réussite

- Chaque personnage a au moins une route _normal → spécial → super_ issue des règles
  générales, sans entrée dans `chains`.
- Chaque personnage a au moins un lien d’une à trois frames.
- Un test vérifie qu’aucun normal ne se lie sur lui-même, pour les quarante personnages.
- Un combo de six touches inflige moins que la somme brute de ses coups, et la courbe
  est documentée.
- La liste des coups affiche l’avantage sur touche et sur garde, ainsi que le niveau de cancel.

## 9. Seconde phase : prolonger après le premier spécial

Après le lot 5, un combo s’arrête au premier spécial : il ne mène plus qu’à une super.
Les combos longs de certains jeux de combat récents reposent sur ce qui suit ce premier
spécial. Ces lots en reprennent les mécaniques avec des noms tirés du Nen.

1. **Relance et surchauffe du Ren** (livré, sans essais joueurs). `accelCancel.ts` :
   sur touche, un spécial de la grammaire s’annule dans un spécial placé **après lui**
   dans `specials`. L’ordre garde le graphe de cancel sans boucle. Une relance chauffe
   le Ren de 50 points sur 100. La jauge refroidit de 0,25 par frame, soit 200 frames
   pour une relance. À 100, le combattant est en surchauffe : aucune relance jusqu’à ce
   que la jauge soit vide. Les autres cancels ne changent pas. Le spécial relancé peut
   toucher le corps que son prédécesseur vient de mettre au sol (`FightAttack.accel`).
   Sans cela, la relance n’aurait aucune cible : les deux fins mettent au sol. Activé
   par `CancelGrammar.accel` pour Kurapika et Benjamin seulement. Route : léger → lourd
   → balayage → (relance) avant + lourd. Pas encore de version renforcée des spéciaux,
   ni d’affichage de la jauge. Ruleset `clash-combat-83`.
   **Accélération** (livré, sans essais joueurs) : sur touche, un coup listé dans
   `CancelGrammar.dash` s’annule dans un dash ordinaire par double appui (`dashCancel.ts`).
   Elle chauffe le Ren comme une relance. Elle sert aux [combos signature](./SIGNATURE_COMBOS.md)
   de Kurapika et d’Hisoka. Ruleset `clash-combat-84`.
2. **Frein** : couper un spécial en plein mouvement pour enchaîner, en priorité sur
   Phinks, Leorio, Bonolenov et Padaille (§ 6, lot 4).
3. **Feintes** : un spécial de 0 dégât à récupération courte, sur les profils de référence.
4. **État conditionné par la vie** : un serment choisi à la préparation, actif dans un
   tiers de la barre de vie, déclenchable en plein combo.
5. **Académie et IA** : routes de relance, décision de relance à chaque frame.

**Constat (antérieur au lot 1) :** après une fin qui met au sol, la super déclarée
(fouet de Kurapika, Air Blow de Benjamin) part mais ne touche pas, car elle ne frappe
pas un corps à terre. La route _fin physique → super_ n’existe donc que sur le papier.
