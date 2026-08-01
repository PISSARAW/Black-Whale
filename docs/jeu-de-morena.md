# Le jeu de Morena — spécification de mécanique

> **État.** Le jeu n'existe nulle part dans le code. `packages/ability-modules/src/contagion/module.ts`
> le réduit à une case de checklist (`INFECTION_STEPS = ['game-won-yes', 'kiss', 'witnessed-murder']`)
> qu'un appelant coche depuis l'extérieur. Ce document propose la mécanique qui remplit cette
> case : ce qu'est une partie, comment on la gagne, et — la partie utile — comment un hatsu
> pesant s'y branche. Le canon tient en quatre phrases (`data/abilities/abilities.json#contagion`) :
> **jeu de négociation mené jusqu'à un « Oui » final**, puis baiser, puis meurtre observé ;
> **tricher ou abandonner déclenche une Manipulation qui limite la réponse à Oui ou Non** ;
> avant les trois conditions la cible reste niveau zéro ; la partie s'achève à la mort de
> Morena, à la mort de la cible, ou quand elle est accomplie. Tout le reste ci-dessous est de
> la conception, marquée comme telle : `canonStatus: 'inferred'`.

---

## 1. Ce que le canon impose à la mécanique

Quatre contraintes, et elles suffisent à dessiner le jeu :

1. **Le jeu produit un mot, pas un score.** La sortie n'est pas « Morena gagne 12 points »,
   c'est une réponse, et cette réponse est « Oui ». Une mécanique qui ne finit pas sur une
   phrase prononcée par un joueur trahit la capacité.
2. **La sanction de la triche n'est pas l'exclusion, c'est la réduction du vocabulaire.**
   Le tricheur n'est pas jeté dehors : il perd le droit de dire autre chose que Oui ou Non.
   Donc le jeu doit avoir un **troisième coup** — sinon la sanction ne coûte rien. C'est la
   pièce que le canon force à inventer, et c'est la charnière de tout le reste : appelons-la
   la **contre-offre**.
3. **Abandonner = tricher.** Sortir de la pièce est puni comme la fraude. La géographie fait
   donc partie du plateau, et tout hatsu de porte ou de mur est un hatsu de ce jeu.
4. **La partie survit à tout sauf à trois morts.** Elle n'a pas d'horloge canon : elle a des
   fins. Une partie non close reste ouverte des tomes durant, ce que le moteur sait déjà
   représenter (`EffectInstance` `ACTIVE` sans expiration).

---

## 2. La mécanique

### 2.1 Le plateau

Deux joueurs, une pièce close, cinq échanges. Morena mène ; le visiteur répond. Deux
compteurs publics, deux cartes cachées.

| Élément                     | Visible ?         | Rôle                                                            |
| --------------------------- | ----------------- | --------------------------------------------------------------- |
| `desir` (carte du visiteur) | caché de Morena   | Ce que le visiteur veut vraiment. Morena gagne en le nommant.   |
| `prix` (carte de Morena)    | caché du visiteur | Le coût réel de chaque offre, sous ce qu'elle en dit.           |
| `emprise`                   | public            | La prise de Morena sur la table.                                |
| `prise`                     | public            | Celle du visiteur.                                              |
| `gages`                     | public            | Trois jetons : un bien, un secret, un nom. La monnaie du refus. |

### 2.2 L'échange

Morena pose une **offre** : elle nomme un désir et annonce un prix. Le visiteur répond par
un des trois coups :

- **Oui** — `emprise +1`, et `+2` de plus si l'offre nommait le vrai `desir`.
- **Non** — gratuit **s'il est adossé à une vérité sur elle énoncée à voix haute** (`prise +1`) ;
  sinon il coûte un gage et ne rapporte rien.
- **Contre-offre** — coûte un gage ; si Morena doit y répondre Non, `prise +2`. C'est le seul
  coup qui prend l'initiative, et le seul que la Manipulation retire.

Sans gage, il ne reste que Oui et Non : la sanction de la triche n'est donc pas un état
spécial du moteur, c'est **une faillite anticipée**. Un tricheur pris est un joueur ruiné au
tour un.

### 2.3 La fin

Au cinquième échange, le compteur le plus haut désigne qui pose la **dernière question** —
et la règle du jeu veut que la dernière réponse soit « Oui ».

- `emprise > prise` → Morena demande, le visiteur dit Oui : **première condition d'infection
  remplie** (`game-won-yes`). Restent le baiser et le meurtre observé.
- `prise >= emprise` → le visiteur demande, **Morena** dit Oui : la partie est _accomplie_,
  donc close (canon : « ou jusqu'à ce que le jeu soit accompli »), et elle ne peut plus être
  rouverte avec cette personne. C'est la seule victoire propre : on ne bat pas Morena, on
  **épuise sa partie**.

### 2.4 La triche

Toute information ou tout gage obtenu hors de la table est une fraude **si elle est détectée**.
La détection est un jet de la pièce, pas de Morena : ce que le lieu peut voir (LSDF au
repaire, En, contact physique). Non détectée, la triche est simplement un coup fort ; détectée,
elle ruine. C'est cet arbitrage qui rend le Nen intéressant à cette table plutôt que décisif.

**Corollaire canon dont on ne peut pas se passer : le baiser est un contact.** La deuxième
condition d'infection est le meilleur détecteur de fraude du jeu — et la meilleure occasion
d'en poser une (§3.4).

---

## 3. Les capacités qui changent l'issue

Vingt fiches, groupées par le vecteur qu'elles servent. Le critère de sélection : la capacité
doit modifier **un compteur, une carte cachée ou la clause de sortie** — pas seulement
impressionner. Format : ce qu'elle achète / ce qu'elle coûte / risque de détection.

### 3.1 Lire sa main

**Dowsing Chain** `dowsing-chain` — une question binaire par échange, pointée sur le `prix`
réel. L'outil anti-bluff parfait ; il transforme chaque Non en Non adossé (`prise +1` gratuit
tous les tours). Coût : la chaîne est visible et ne se met pas en Zetsu — détection quasi
certaine dès le deuxième usage. Bon pour un tour, ruineux pour cinq. **P1** (déjà un module).

**Parallel Future** `parallel-future` — dix secondes d'avance : on entend sa réponse avant de
parler. Sous Zetsu, rien à détecter — c'est la seule fraude que la pièce ne peut pas voir.
Contrepoids canon : dix secondes = un échange, et à la sortie de la vision tout le monde vit
les dix secondes _telles que prédites_, donc la table voit un joueur qui n'a rien changé. Une
partie gagnée à Parallel Future se lit après coup dans le journal. **P1**.

**Lovely Ghostwriter** `lovely-ghostwriter` — un quatrain avant de s'asseoir, qui nomme la
branche perdante. L'ability ne prédit pas l'avenir de son porteur : **quelqu'un d'autre doit
tirer pour vous**, ce qui met un tiers dans la partie et donne au jeu son premier vrai coup
social. **P2**.

**Secret Window** `secret-window` — les chouettes écoutent à travers la cloison : on connaît
les offres avant qu'elles soient posées. Aucun risque à la table (c'est du pré-jeu), mais au
repaire c'est une intrusion, et LSDF chiffre les gardes sur la gravité du délit. **P2**.

**Little Eye** `little-eye` — un hamster sur la table. Consomme presque rien, survit à
l'inconscience du porteur, ne ressemble pas à du Nen : l'espion le moins cher et le moins
détectable du catalogue. C'est l'option « honnête » de la lecture de main. **P1** (module
existant, et le fil Kurapika → Oito → Sayird est déjà écrit).

**Body and Soul** `body-and-soul` — un coup, une question, une réponse vraie sortie du corps
même si la bouche ment. Convertit une contre-offre en certitude. Mais frapper à la table,
c'est quitter la table : sanction immédiate. À réserver au dernier échange, quand la
Manipulation n'a plus le temps de mordre. **P2**.

### 3.2 Cacher la sienne

**Texture Surprise** `texture-surprise` — plus de tells : le visage et les mains mentent sans
aura détectable, et les gages se falsifient (un document, un sceau). Le canon donne lui-même
le contre : **le toucher révèle le faux** — et le jeu finit par un baiser. Gagner en Texture
Surprise, c'est gagner une partie qu'on ne peut pas conclure. La fiche la plus élégante du
lot. **P1**.

**Melody — Enchanting Music** `melody-enchanting-music` — le répertoire calme les émotions :
il ne lit pas Morena, il tait le visiteur, et une exécution donnée à fond capte l'attention
d'une salle jusqu'à trois minutes. Mécaniquement : suspend un échange sans que la suspension
compte comme un abandon. Le seul « passe » légal du jeu. **P2**.

**Three Monkeys** `saiyu-three-monkeys` — lui retirer vue, ouïe et parole. Elle ne peut plus
poser la dernière question, donc aucun Oui ne peut être arraché. Mais un jeu qu'elle ne peut
plus jouer est un jeu abandonné, et l'abandon est puni des deux côtés : on n'obtient pas une
victoire, on obtient une partie nulle payée au prix fort. Utile une seule fois, pour sauver
quelqu'un d'autre. **P3**.

### 3.3 Fabriquer des gages

**Guardian Coins** `zhanglei-guardian-coins` — une pièce par jour, dont la valeur et l'aura
montent avec le temps et **se réinitialisent au transfert**. C'est la seule monnaie
renouvelable du jeu, et elle est honnête : payer un refus avec une pièce de six mois, c'est
perdre six mois. Fait exister le mot « coût » dans une négociation. **P1** (module existant).

**Gallery Fake** `gallery-fake` — copier un gage. La copie est inerte et **disparaît au bout
de vingt-quatre heures** : la fraude n'est pas détectée à la table, elle est détectée le
lendemain, quand la partie est close et que Morena a été payée en fumée. C'est la seule
capacité qui déplace la détection _après_ la fin — donc le seul moyen de gagner en trichant
sans perdre pendant. Et la seule qui garantit une vengeance ultérieure. **P2**.

**Collaborative Drug Synthesis** `tubeppa-guardian-synthesis` — un composé comme enjeu, avec
la contrainte canon d'un partenaire : le gage exige un allié, donc une partie à deux têtes
contre une. **P3**.

### 3.4 Changer l'enjeu

**Moonlight Act** `moonlight-act` — contrat volontaire, termes explicites, durée, récompenses,
pénalités, exécution par Manipulation. C'est le seul hatsu du catalogue qui **transforme un
Oui gagné en obligation tenable** : sans lui, battre Morena ne produit qu'une phrase. Pièce
maîtresse : à brancher directement sur le résultat de la partie. **P1**.

**Judgment Chain** `judgment-chain` — posée sur soi : « je ne répondrai pas Oui ». La seule
immunité vraie à la Manipulation Oui/Non, au prix de mourir si on cède. Le jeu devient une
partie où l'un des deux joueurs a mis sa vie sur la table — et où Morena, qui a besoin du Oui
et pas du cadavre, doit renoncer. **P1**.

**The Sun and Moon** `sun-and-moon` — marquer par contact. Le baiser est un contact. Poser la
lune sur Morena au moment même où elle remplit sa deuxième condition retourne la mécanique
d'infection contre elle : elle ne peut plus toucher son porteur du soleil sans exploser. Le
Nen post-mortem de l'Ancien maintient les marques même livre fermé — donc la menace survit à
la mort de son poseur. **P1** (`sun-and-moon` est déjà jouable dans la marche).

**Cat's Name / Yomotsu Hegui / Malédiction de Beyond** `cats-name`, `yomotsu-hegui`,
`beyond-sacrificial-curse` — la famille du dissuasif : rendre sa propre mort coûteuse. Toutes
les trois répondent à la même clause (« la partie s'achève à la mort de la cible ») en la
rendant inacceptable pour Morena. Cat's Name a le défaut canon qui va bien ici : elle est
inutile si l'adversaire refuse de tuer directement — et Morena, précisément, ne tue pas ses
candidats, elle les recrute. **P2**.

**Desire Trap** `luzurus-guardian-desire-trap` — matérialise le désir de la cible en appât,
puis piège et pseudo-coercition. C'est le jeu de Morena joué par une bête : nommer la carte
`desir` de l'adversaire est exactement son ouverture. Le seul hatsu qui puisse **jouer sa
partie à sa place**, donc le seul qui puisse la battre à son propre coup. **P2**.

**« Are You Free ? »** `momoze-guardian-solicitation` — une bestiole qui redemande jusqu'à ce
qu'on accepte, et l'acceptation donne le contrôle. La parodie mécanique du jeu : un
extracteur de Oui sans négociation. Sa valeur ici est comparative — elle montre par contraste
ce que Morena, elle, exige en plus (le baiser, le meurtre), et pourquoi son réseau plafonne à
vingt-deux quand celui-ci ne plafonne pas. **P3**.

**Three-Lie Transformation** `tserriednich-guardian-lie-marks` — première coupure, deuxième
infection, troisième déshumanisation. Assise à cette table, la bête taxe le bluff : c'est le
seul dispositif qui rend une négociation honnête strictement meilleure qu'une malhonnête, et
il vaut pour les deux joueurs. Le meilleur « mode difficile » du jeu. **P2** (jouable dans la
marche, `lie-marks`).

### 3.5 Ne pas être la personne assise

**Skill Hunter** `skill-hunter` — voir la capacité en action, interroger son propriétaire et
**obtenir des réponses**, faire toucher l'empreinte, le tout en moins d'une heure. Une
négociation en cinq échanges dans une pièce close est le seul décor du canon où les trois
conditions tombent naturellement. La conclusion est celle qu'il faut écrire quelque part sur
ce site : **la façon dont Morena perd Contagion, c'est en jouant sa partie avec Chrollo.**
**P1** — et c'est la fiche qui justifie à elle seule d'implémenter le jeu.

**Black Voice / Needle People / Order Stamp** `black-voice`, `illumi-needle-people`,
`order-stamp` — asseoir quelqu'un d'autre. Le pantin n'a ni `desir` (rien à nommer, donc pas
de `+2` pour elle) ni gages propres (donc aucune contre-offre) : la procuration protège le
commanditaire et **plafonne la partie à un match nul**. Exactement le bon équilibre : le
tricheur le mieux caché est aussi celui qui ne peut pas gagner. **P2**.

**LSDF / Hideout Doors / Room 1013** `lsdf`, `voconte-hideout-doors`,
`marayam-guardian-isolation` — la géographie du plateau. LSDF n'existe que **tant que Morena
est au repaire** et gradue ses gardes sur la gravité du délit : c'est le détecteur de fraude
de la §2.4, déjà canon, déjà modulé. Les portes de Voconte décident ce que « sortir » veut
dire ; l'isolement de Marayam décide qui peut encore vous voir jouer. À implémenter comme
`CONSTRAINT` de lieu avec `attributes.rules[]` lisibles — le pattern est déjà celui du §J de
[hatsu-potentiel.md](hatsu-potentiel.md). **P2**.

---

## 4. Implémentation

### 4.1 Où ça vit

Extension du module existant plutôt que nouveau module : le jeu **est** la première condition
de Contagion, pas une capacité séparée.

```
packages/ability-modules/src/contagion/
  module.ts        // + actions: open-game, offer, answer, stake, flag-cheat, close-game
  game.ts          // état de partie pur (réducteur), sans dépendance moteur
```

Le réducteur est une fonction pure sur un état de ~8 champs (`round`, `emprise`, `prise`,
`gages`, `desir`, `prix`, `manipulated`, `outcome`) : testable seul, rejouable, et c'est ce
que la marche et le tableau de bord consomment tous les deux.

### 4.2 Événements

Rien de neuf à inventer côté world-engine — les primitives du §2 de
[hatsu-potentiel.md](hatsu-potentiel.md) suffisent :

- ouverture : `EFFECT_CREATED` `CUSTOM` `discriminator: 'game'`, `state: ACTIVE` ;
- chaque coup : `EFFECT_ATTRIBUTE_CHANGED` (`round`, `emprise`, `prise`, `gages`) — un
  échange = un event, donc la partie est **rejouable coup par coup sur la timeline** ;
- triche détectée : `EFFECT_STATE_CHANGED` → `TRIGGERED` + `CONSTRAINT` sur la cible
  (`attributes.allowedAnswers: ['yes','no']`) — c'est la Manipulation canon, et elle est
  affichable telle quelle dans le panneau « Pourquoi ? » ;
- fin : `state: ENDED` avec `reason: 'game-completed' | 'morena-dead' | 'target-dead'`, plus
  la coche `game-won-yes` de `INFECTION_STEPS` quand c'est Morena qui l'emporte.

L'ordre du jour est donc : brancher `EFFECT_ATTRIBUTE_CHANGED` et `EFFECT_STATE_CHANGED`
(primitives 2 et 3 du §2 de hatsu-potentiel), qui étaient déjà les deux manques identifiés.

### 4.3 UI

`ContagionDashboard` a déjà sa place dans le manifest (`ui.componentKey`). Le jeu y ajoute un
onglet **Partie** : les cinq échanges en colonnes, les deux compteurs, les gages dépensés, et
— la vue qui vaut le détour — la **frise des fraudes** : chaque coup joué sous hatsu marqué de
la capacité employée, avec la détection qui a réussi ou raté. Le site répond alors à une
question que le manga pose sans y répondre : _comment, exactement, quelqu'un a-t-il été
recruté ?_

### 4.4 Dans la marche

Le jeu est une rencontre de salle : Morena assise, cinq échanges, et la trentaine de kinds de
`TOUR_HATSU_KINDS` déjà jouables dans [hatsu.ts](../apps/web/src/lib/tour/hatsu.ts) qui
tombent d'elles-mêmes dans les cinq vecteurs — `dowsing`, `future`, `divination`, `paper-spy`
et `senses` lisent sa main ; `disguise` et `melody` cachent la vôtre ; `coin-growth` et
`growth` fabriquent les gages ; `contract`, `heart-vow`, `tribunal` et `desire-trap` changent
l'enjeu ; `puppet`, `clone` et `identity-swap` mettent quelqu'un d'autre à votre place. Le
plateau n'a besoin d'aucun nouveau verbe de marche : il a besoin d'une pièce, d'une chaise et
d'un compteur.

## 5. Garde-fous de fidélité

- `canonStatus: 'inferred'` sur toute la mécanique du §2 : cinq échanges, gages, compteurs et
  contre-offre sont une **reconstruction**, pas du manga. La fiche capacité doit le dire.
- Ce qui est canon et ne doit pas bouger : la finale en « Oui », la triple condition, la
  Manipulation Oui/Non pour triche **ou abandon**, le plafond de vingt-deux, le niveau zéro
  avant les trois conditions, les trois fins possibles.
- `revealedAtChapter` sur les events de partie : avant le chapitre où Morena explique son jeu,
  le tableau de bord affiche « procédure de recrutement inconnue ».

---

## 6. Ce qui est implémenté — et où le présent document a été plié

> Écrit après coup, contre le code. Le jeu existe désormais dans la marche :
> [`/tour/morena`](../apps/web/src/routes/tour/morena/+page.svelte), assis à la table du bureau
> du chef de la planque, avec le moteur WebGL de la visite et la même pièce.

### 6.1 Un écart assumé sur la §2

La mécanique livrée n'est **pas** les cinq échanges à `emprise`/`prise`/`gages` du §2. Elle est
les **douze cartes** que la biographie de Borksen décrit littéralement
(`data/characters/characters.json#borksen`, chap. 407-410) : sept questions dans la main de
Morena, cinq réponses dans celle de l'invité — Oui, Non, Retour, Joker, X. Un tour = une
question dépensée, puis une réponse retirée au hasard.

Le §2 reste une bonne reconstruction, mais elle est `inferred` de bout en bout là où les douze
cartes sont écrites dans les données du dépôt. À contrainte égale, on a pris la source.

Ce qui suit du §2 a **survécu tel quel**, parce que c'était le raisonnement utile :

- **La sanction est une réduction de vocabulaire, pas une exclusion** (§1.2). En douze cartes
  cela a une lecture littérale et c'est la bonne : Retour, Joker et X quittent la table. Il
  reste Oui et Non. `narrowTheAnswer()`.
- **Abandonner = tricher** (§1.3). `leaveTheTable()` applique exactement la même sanction, et
  ne fait pas sortir de la partie.
- **La triche n'est une triche que si elle est détectée** (§2.4), et la détection est le fait
  du _lieu_. `game.watch` vaut 1 parce que la partie se joue au repaire et que LSDF y est.
- **Le baiser est un contact** (§2.4, corollaire). C'est le détecteur qui démasque
  Texture Surprise, et c'est le contact qui permet le vol de Skill Hunter.

### 6.2 Les capacités

Le §3 est implémenté comme une table de données —
[`TABLE_TECHNIQUES`](../apps/web/src/lib/tour/morena.ts) — de vingt-six entrées, chacune
réduite à un verbe (`read`, `foresee`, `pass`, `recover`, `forge`, `shield`, `hide`, `proxy`,
`blind`, `rider`), une exposition de 0 à 1, et un drapeau `fraud`. Les cinq vecteurs du §3 sont
les cinq groupes de la table.

La technique jouée est celle que le visiteur porte déjà dans le dock Nen du site : la clé de la
table est le `HatsuInteractionKind` du registre, il n'y a donc pas de second roster à tenir à
jour, et une capacité absente de la table est une capacité qui n'a rien à dire à douze cartes —
ce que la page dit en toutes lettres plutôt que de la masquer.

Les fiches du §3 se retrouvent une par une, y compris leurs contrepoids :

| §3                                                                 | Rendu                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Dowsing Chain, la chaîne qui ne passe pas en Zetsu                 | `exposure: 0.55` — la plus exposée de la table                      |
| Parallel Future, la fraude que la pièce ne peut pas voir           | `exposure: 0`, `uses: 1`                                            |
| Texture Surprise, « gagner une partie qu'on ne peut pas conclure » | `forge`, démasqué par `takeTheDeal()`                               |
| Enchanting Music, le seul « passe » légal                          | `pass`, `fraud: false`, ne compte pas comme un abandon              |
| Three Monkeys, « une partie nulle payée au prix fort »             | `blind` → abandon + Manipulation des deux côtés                     |
| Guardian Coins, la monnaie honnête                                 | `recover`, `fraud: false`                                           |
| Gallery Fake, la détection déplacée _après_ la fin                 | rider `smoke`, payé au verdict                                      |
| Moonlight Act, « transformer un Oui en obligation tenable »        | rider `bound`                                                       |
| Judgment Chain, la seule immunité vraie                            | `shield` + rider `sworn` : mourir si on cède                        |
| The Sun and Moon, marquer au baiser                                | rider `moon`, ne paie que si `kissed`                               |
| Skill Hunter, « la façon dont Morena perd Contagion »              | rider `stolen` : exige la main jouée jusqu'au bout **et** le baiser |
| Black Voice / Order Stamp / Needle People                          | `proxy` : plafonné au match nul, `infectionAfter().level === null`  |
| Room 1013 / Hideout Doors                                          | `hide` : `watch → 0`, plus rien ne peut rapporter                   |

`payTheRiders()` règle le tout à la dernière carte. **Aucun rider ne change le mot** : ils
décident seulement ce que le mot valait. C'est la garantie de fidélité du §5 tenue au niveau
du code plutôt qu'au niveau de la fiche.

### 6.3 Le §4, fait — avec deux corrections au document

**Le §4.2 était périmé.** `EFFECT_ATTRIBUTE_CHANGED` et `EFFECT_STATE_CHANGED` n'étaient pas
« les deux manques identifiés » : les deux existent dans `packages/world-engine/src/events.ts`
et sont réduits dans `reducer.ts` (`changeEffectAttributes` gère `attributes` / `increments` /
`append`). Il n'y avait donc rien à ajouter au moteur, seulement à s'en servir.

**Le §4.1 avait raison sur l'emplacement**, et c'est ce qui a été fait — le réducteur a été
déplacé de la marche vers le paquet :

```
packages/ability-modules/src/contagion/
  game.ts     // l'état de partie pur, sans aucune dépendance moteur
  module.ts   // + open-game, ask, stake, refuse-stake, play-technique,
              //   leave-table, settle, close-game
```

`apps/web/src/lib/tour/morena.ts` ne garde que le dessin (où est la table, de quelle couleur
est chaque carte, `tableauOf`) et réexporte les règles. Il porte aussi la seule chose que le
paquet ne peut pas porter : la preuve à la compilation que chaque clé de `TABLE_TECHNIQUES`
nomme un `HatsuInteractionKind` que le registre publie réellement — un paquet sous `packages/`
n'a pas le droit d'aller chercher un type dans l'app, donc le contrôle se fait du côté où les
deux sont visibles.

Ce que les actions émettent, conformément au §4.2 :

| Coup                                                           | Événements                                                                                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `open-game`                                                    | `EFFECT_CREATED` `CUSTOM` `discriminator: 'game'`, `state: ACTIVE`, les règles en clair                                                    |
| `ask` / `stake` / `refuse-stake` / `play-technique` / `settle` | un `EFFECT_ATTRIBUTE_CHANGED` chacun — **un coup, un événement**, donc la partie est rejouable coup par coup                               |
| triche ou abandon détecté                                      | `EFFECT_STATE_CHANGED` → `TRIGGERED`, **plus** un `CONSTRAINT` portant `attributes.allowedAnswers: ['yes','no']` et ses `rules[]` lisibles |
| `close-game`                                                   | `EFFECT_STATE_CHANGED` → `ENDED` avec `reason: 'game-completed' \| 'morena-dead' \| 'target-dead'`                                         |

Deux points que le document ne prévoyait pas et qu'il fallait trancher :

- **Le hasard devait devenir rejouable.** Morena pioche au hasard, et une branche rejouée qui
  donnerait une autre main ne serait pas un rejeu. `seededRandom(ctx)` dérive la pioche de
  `ctx.eventId` et du tour courant plutôt que de `Math.random` : même événement, même carte.
- **`revealedAtChapter: 407`** sur tous les événements de partie, comme le §5 le demande.

Le lien avec `INFECTION_STEPS` est fait dans le sens qui convient : `infectionStepsFrom(game)`
rend ce que la main a réellement établi — `game-won-yes` si elle a été gagnée, `kiss` si le
baiser a été pris — et rien du tout si c'était un pantin sur la chaise. C'est ce que
`close-game` écrit dans `completedSteps`, et c'est ce que la condition `checklist` de `infect`
consomme. La case que quelqu'un cochait de l'extérieur est devenue le résultat d'une partie.

Testé sur 89 cas : 68 sur le réducteur (`apps/web/src/lib/tour/morena.test.ts`) et 21 sur le
branchement moteur (`packages/ability-modules/test/morena-game.spec.ts`), dont une négociation
complète appendue à une vraie `InMemoryBranchEngine` et relue dans l'état réduit.

### 6.4 Le §4.3, fait — et la clé qui ne servait à rien

`ContagionDashboard` existait comme _nom_ depuis l'écriture du module (`ui.componentKey`, et
`customComponent` dans le manifeste d'interaction) et comme rien d'autre : rien dans l'app ne
lisait `getUIComponent()`. Une clé que personne ne résout est une promesse que personne ne
tient, donc il a fallu écrire les deux moitiés.

- [`lib/nen/abilityComponents.ts`](../apps/web/src/lib/nen/abilityComponents.ts) — la table
  `componentKey → composant`, et `componentFor()` qui rend `null` pour tout le reste : la
  plupart des capacités n'ont rien à montrer au-delà du panneau « Pourquoi ? », et elles
  n'apparaissent pas. La table est volontairement presque vide, et un test le dit à voix haute
  pour que le jour où elle ne l'est plus, quelqu'un ait à le justifier.
- [`lib/nen/ContagionDashboard.svelte`](../apps/web/src/lib/nen/ContagionDashboard.svelte) —
  les vingt-deux emplacements avec leurs niveaux, la négociation en cours (tour, mains,
  cimetière, surveillance, verdict), les trois conditions, et la **frise des fraudes** : une
  ligne par coup joué sous aura, avec ce qu'il achetait et `VUE` / `RATÉE` en bout de ligne. La
  frise est lue depuis `game.log` plutôt que tenue à part — une frise qui pourrait contredire
  le journal serait une frise incitable.

Le garde-fou du §5 est dans le composant : sous `spoilerLimit < 407`, il n'affiche rien d'autre
que « procédure de recrutement inconnue ».

Monté sur `/tour/morena`, où une vraie partie existe. Le composant ne décide rien : on lui
passe un `MorenaGame` et une liste de membres, tous deux au format que le moteur écrit.

### 6.5 Ce qui reste

Rien de la spec. Le seul manque est un endroit du site où une partie de Morena existe _dans une
branche_ plutôt que dans la marche — `/simulations` est le candidat naturel, puisque
`data.branch.snapshot.effects` y est déjà en portée et que `componentFor()` sait désormais quoi
en faire.

---

## 7. Les cinquante-quatre autres

`TABLE_TECHNIQUES` compte **vingt-huit** entrées ; le catalogue en compte quatre-vingt-deux.
Le commentaire du code règle la question d'une phrase — « everything not in this list is a
capability that has nothing to say to twelve cards and a chair, which is most of them, and
saying so is part of the point » — mais cette phrase couvre en réalité **six** situations très
différentes, et deux d'entre elles sont des trous plutôt que des refus. Le registre attribue un
`kind` unique par capacité (vérifié : 82 profils, 82 kinds, aucune collision), donc aucune
absence ici n'est un artefact de clé : chacune est une décision.

### 7.1 Elles jouent les deux autres conditions, pas celle-ci

La partie n'est que la première des trois cases de `INFECTION_STEPS`. Ces capacités-là ne
touchent pas la main : elles attaquent le baiser ou le meurtre observé, c'est-à-dire les
conditions que la partie ne décide pas.

- **Metamorphosen** `mimicry` — l'apparence de quelqu'un à qui on a parlé, tenue au plus aussi
  longtemps qu'on a passé de temps avec lui. Sept questions dans une pièce close, c'est
  exactement le budget de temps que la capacité demande. Morena embrasse le mauvais visage.
- **Without You** `guardian` — une bête sans forme propre qui porte l'identité, la mémoire et
  la personnalité d'une morte. Elle peut s'asseoir, jouer, dire Oui : l'infection tomberait sur
  quelqu'un qui n'existe plus. C'est le `proxy` parfait, et il est canon.
- **Indoor Fish** `devour` — tue sans douleur ni sang, la victime restant consciente. Un meurtre
  que le témoin ne perçoit pas comme un meurtre ne remplit pas `witnessed-murder` : le
  knowledge-engine dirait `BELIEVED`, pas `KNOWN`. Le contre le plus élégant du catalogue à la
  troisième condition.
  (Ces deux-là sont aussi les deux premières lignes du §7.5 : un proxy assis à la table est
  précisément la façon dont on fait manquer le baiser.)
- **Fun Fun Cloth** `pocket` — escamoter le corps : même effet, par l'autre bout.
- **Silent Majority** `snakes` — fournit le meurtre, mais le pantin n'est visible que de son
  porteur. Qui, exactement, a observé ?
- **Yomotsu Hegui** `postmortem-curse` et **Cat's Name** `resurrection` — la famille du §3.4.
  Elles ne changent pas la main, elles changent le prix de votre mort ; le rider `deterred`
  (Beyond) exprime déjà ce prix, et trois sièges pour un seul effet auraient été trois
  exceptions au lieu d'un verbe.
- **« Are You Free ? »** `solicitation` — un extracteur de Oui sans négociation : un jeu
  concurrent, pas un coup dans celui-ci.

### 7.2 Elles sont le plateau

- **LSDF** `legal-defense` **est déjà dans le jeu** : c'est `watch: 1`. Elle n'a pas de siège
  parce qu'elle tient l'autre bout de la table.
- **Spatial Teleportation** `spatial` — Luini exige une pièce close à porte fermée, ce que la
  salle du jeu est par construction. Voisine de `hide`, avec l'inverse en plus : faire _entrer_
  un témoin.
- **Magical Worm** `portal`, **Transport Portals** `relay`, **Kurton** `vehicle` — des sorties.
  Sortir, c'est abandonner : elles ne font pas gagner, elles font perdre plus confortablement.
- **Bird Manipulation** `flock` — la messagerie d'avant et d'après.

### 7.3 Elles visent Contagion, pas la partie

Tout ce qui prend, hérite, analyse ou double une capacité arrive après le mot : **Culdcept**
`capture`, **Benjamin Baton** `inherit` (hériter de Contagion à la mort de Morena),
**Stealth Dolphin** `ability-loan`, **Double Face** `bookmark`, **Predator** `predator`.
Rihan mérite sa phrase : c'est le seul contre frontal à Contagion, et le canon lui interdit
de fonctionner sur des informations fournies par autrui — il faut donc avoir vu la partie
soi-même. C'est le pendant tardif de Skill Hunter, qui, lui, est assis à la table.

À côté : **Bloody Mary** `blood-search` (surveiller la salle), **Nen Stitches** `stitch` (fils
masqués par In — la procuration indétectable, quatrième `proxy` d'une liste qui en a déjà
quatre), **Great Hiker** `poetry` (le vers qui punit le mensonge : jumeau papier de `lie-marks`,
le seul cas où un siège aurait pu être doublé), **Biohazard** `animate` (un gage qui s'enfuit),
**Eye-wogs** `aura-levy` et **Diffusive Aura Smoke** `diffusive-smoke` — deux recruteurs rivaux,
et la fumée de Salé-salé est la vraie quasi-retenue : elle vend de la bienveillance progressive,
ce qu'un négociateur vend, et se contre en retenant son souffle, ce qu'un négociateur peut
faire.

**Emperor Time** `scarlet` a droit à la sienne : une heure de vie par seconde. Une partie de
sept questions se paierait en années. C'est le seul hatsu du catalogue dont le coût rend une
négociation littéralement inabordable — et c'est une fiche, pas un manque.

### 7.4 Ce que le jeu interdit

La moitié offensive du catalogue n'est pas _faible_ à cette table : elle est **interdite**.
Frapper, c'est quitter la table, et quitter la table déclenche la Manipulation. C'est la seule
table du site où la puissance est la mauvaise monnaie — et c'est pour ça que `truth-punch`
(Body and Soul) est chiffré `exposure: 1, uses: 1` : le seul coup violent qui achète quelque
chose est celui qu'on porte au dernier échange.

| Capacité                                          | `kind`                                               |
| ------------------------------------------------- | ---------------------------------------------------- |
| Bungee Gum, Aura Manipulation, Air Blow           | `elastic`, `enhance`, `blast`                        |
| Double Machine Gun, Ripper Cyclotron, Jupiter     | `barrage`, `windup`, `impact`                        |
| Prologue, Pain Packer, Rising Sun                 | `rhythm`, `pain-armour`, `sun-flare`                 |
| Dance of the Serpent's Bite, Snake Arm            | `shred`, `serpent`                                   |
| Priest Staff, I'm Coming to Get You, Remote Punch | `staff`, `weapon-body`, `remote-strike`              |
| Blinky, Aura Projectile, Damage: Sweet Home       | `vacuum`, `training-shot`, `damage-transfer`         |
| Chain Jail, Steal Chain, Holy Chain, Cookie       | `chain-bind`, `chain-rule`, `healing`, `restoration` |
| Body Transformation                               | `transformation`                                     |

Deux exclusions sont d'une autre nature — ce sont des **interdits d'identité**, pas de
violence : **Grimmel** `arrow` échange les âmes du tireur et de la cible, et
**Camilla's Guardian Coercion** `coercive-beast` contrôle totalement après des conditions que
le canon n'a pas révélées. Dans les deux cas le moteur ne saurait pas dire _qui_ a répondu Oui,
et l'infection a besoin de le savoir. Tant que le canon ne tranche pas : pas de siège.

### 7.5 Les cinq trous

La cinquante-quatrième absente est Contagion elle-même, qui est le jeu et non un coup. Des
cinquante-trois restantes, les sections précédentes en justifient quarante-huit. Cinq n'en
sont pas : ce sont des
capacités qui ont quelque chose à dire à douze cartes et à qui la table n'a pas encore ouvert
de ligne.

| À asseoir                      | Verbe                               | Pourquoi                                                                             |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------ |
| **Without You** `guardian`     | `proxy`, `exposure: 0.1`, `fraud`   | Le seul proxy qui rend l'infection sans objet plutôt que nulle.                      |
| **Metamorphosen** `mimicry`    | `proxy`, exposition liée à la durée | La seule capacité dont le canon fixe la durée sur le temps passé à parler.           |
| **Hanzo Skill 4** `projection` | `proxy` avec faille                 | Le corps dort ailleurs, le baiser n'atteint rien — mais un mot au corps annule tout. |
| **Teleport** `teleport`        | verbe neuf : `evict`                | Sortir l'autre de la table sans son accord : **faire abandonner l'adversaire**.      |
| **Cross Game** `tribunal`      | `evict`, `fraud: false`             | La carte rouge expulse. La version légale du même coup, avec avertissement.          |

`evict` est le seul verbe qui manque, et il n'ajoute pas d'exception : il applique
`leaveTheTable()` à l'autre siège. Deux capacités le partagent d'emblée, l'une frauduleuse et
l'autre non — ce qui est la bonne forme pour ce jeu.

### 7.6 Les cinq sièges, ouverts

Fait. `TABLE_TECHNIQUES` compte trente-trois entrées, et le verbe `evict` existe. Trois
décisions ont dû être prises que le tableau ne tranchait pas :

- **Une fraude de procuration vue annule la procuration.** `proxy` remet `proxied` à `false`
  quand la pièce voit le coup : ce qui portait le visage tombe, et la personne assise est celle
  qui l'avait envoyé. C'est ce qui rend les quatre proxys chers (`guardian`, `mimicry`,
  `projection`, `identity-swap`) réellement risqués, là où les quatre gratuits sont chiffrés à
  zéro exposition parce que le canon ne donne aucun moyen de les voir.
- **Metamorphosen s'use.** Le canon fixe sa durée sur le temps passé avec la personne copiée, et
  sept questions dans une pièce close sont exactement ce budget qui se dépense. D'où
  `wearsOff: true` et `exposureNow(move, game)`, qui ajoute douze points d'exposition par tour.
  C'est une règle partagée sur le mouvement, pas une fonction par capacité : une exception avec
  des étapes en plus n'aurait pas été mieux qu'une exception.
- **Le carton rouge s'obtient.** `evict` légal exige deux questions déjà posées — Mizaistom
  n'expulse personne qu'il n'a pas averti. Joué plus tôt, ce n'est simplement pas un coup.

`evict` fait ce que le tableau annonçait : la partie se clôt en `cancelled`, `ending:
'abandoned'`, `aftermath: ['evicted']`, et **la main n'est pas réduite** — c'est la seule sortie
de ce jeu qui ne passe pas par la Manipulation, puisque celle qui est partie n'est pas vous. Vu
en train de le faire, en revanche, c'est vous le tricheur et la partie continue sans le tour de
passe-passe.

## 8. Le dock, pendant la main

Une table où trente-trois techniques sur quatre-vingt-deux ont un siège, et un dock qui les
propose toutes, ne fait pas un choix : il fait une recherche. Tant qu'une main est en cours,
`/tour/morena` pose donc une **grille** sur le dock — `hatsuGate` dans
`apps/web/src/lib/nen/hatsuState.ts` :

```ts
export interface HatsuGate {
  admits: (kind: HatsuInteractionKind) => boolean
  reason: string
}
```

Trois choses, et rien de plus :

- **`activateHatsu` refuse** ce que la grille écarte. Le contrôle est là et pas dans le
  balisage du picker, parce que la même activation arrive par trois chemins — le picker, un lien
  qui émet `black-whale:activate-hatsu`, et la session mémorisée au montage. Une règle appliquée
  sur un chemin sur trois n'est pas une règle.
- **Le dock grise le reste** plutôt que de le cacher : savoir qu'une technique existe et ne sert
  à rien ici vaut mieux qu'une liste plus courte. La phrase affichée vient de la grille, jamais
  du dock — le dock est global et n'a pas à savoir ce qu'est une table de cartes.
- **Ce qui est déjà en main y reste.** La grille porte sur ce qu'on prend, pas sur ce qu'on
  porte : entrer dans une pièce ne désarme personne, ça empêche seulement d'aller en chercher
  une autre. Le visiteur assis avec Bungee Gum la garde, et le dock lui dit qu'elle est inerte.

La grille se lève dès que la main est finie, pour que lire le verdict et choisir autre chose
pour la donne suivante restent un seul geste. Sortir de table ne la lève pas : le canon laisse
le joueur assis après avoir tenté de partir, et la main continue.

C'est un mécanisme général et pas un détail de cette route : toute page qui a une raison de
n'admettre qu'une partie du registre ouvre une grille et la referme en partant.

## 9. Ce que la table montre

Le §6 a livré une partie jouable et muette : tout ce qu'un hatsu faisait à cette table se
lisait dans le panneau et dans le journal, et rien ne se voyait dans la pièce. Quatre choses
ont été rendues visibles, et le choix de ces quatre-là suit une seule règle — **on n'ajoute pas
un geste à un corps qui bouge déjà, on lui en retire un**. Morena respire et se tourne vers
qui s'est assis depuis le premier jour ; c'est en perdant l'un des deux qu'elle peut être vue
réagir.

- **La Manipulation part avec les cartes.** Retour, Joker et X quittaient la main entre deux
  images. Une `game-card` qui disparaît est désormais _emportée_ : elle glisse loin du visiteur,
  monte de sept centimètres et s'efface en 0,45 s. La direction ne nomme personne — c'est
  « à l'opposé de qui regarde », et la seule personne de l'autre côté de cette table est celle
  qui prend. La même sortie sert la prise de chaque tour, ce qui est correct : c'est le même
  geste. La règle du §6 (« une carte ne bouge pas ») tient — une carte qui s'en va n'est pas une
  carte posée.
- **Elle s'immobilise quand la pièce lui a parlé.** `dealerStage()` rend 3 au coup suivant un
  `played`/`seen` ou un `exposed`, et la respiration tombe à zéro. C'est la seule annonce du jet
  de détection ailleurs que dans le journal.
- **Elle cesse de vous trouver quand on lui prend les sens.** Stage 4 pour `senses`, et le
  suivi de caméra s'arrête. Le cap est conservé dans `Shown.facing` d'un rebuild à l'autre :
  une tête qui claquerait au nord se lirait comme un bug, pas comme une femme qui a perdu
  quelqu'un.
- **Elle a un visage.** La femme d'en face était dessinée sans traits, au motif que l'archive
  ne prête aucun caractère à personne. L'argument vaut pour une technique croisée dans une
  coursive ; il ne vaut pas ici, où la marche vous _assied_ à un mètre cinquante d'elle pour la
  durée d'une négociation, sans rien d'autre dans le cadre — à cette distance, une tête sans
  visage n'est pas de la retenue, c'est un manque que le lecteur doit s'expliquer à chaque
  tour. `$lib/tour/dealer.ts` la dessine donc telle qu'elle est publiée : blonde, cheveux longs
  partagés au milieu, yeux étroits sous des paupières lourdes, bouche fermée — et les sutures,
  qui sont tout ce qui fait que ce visage est le sien. Une couronne de points à la naissance
  des cheveux, une couture en pointillé qui en descend le long d'un côté du visage jusqu'à la
  mâchoire, et le même surjet autour de l'oreille de ce côté-là. Rien n'y est ombré : c'est
  dessiné comme le navire l'est, en aplats et en arêtes dures, pour que le seul visage à bord
  ne soit pas aussi la seule surface éclairée autrement que tout ce qui l'entoure. Un fichier
  à part, parce qu'un visage est un sujet — et parce que `TourScene` est déjà le plus long
  fichier de l'application.
- **Les yeux se vident quand on lui prend la vue.** Même règle du retrait : au stage 4, les
  iris ne sont pas dessinés. Les yeux restent ouverts et il n'y a plus personne derrière.
- **La prescience a un corps.** La carte que `foreseen` désigne se tient à quatre centimètres du
  bois avec un liseré bleu (`stage: 4`). Trois techniques achètent cette phrase — `dowsing`,
  `future`, `divination` — et aucune n'avait rien à regarder.
- **Le carton de Cross Game** est posé sur la table, bleu, puis jaune aux deux questions, puis
  rouge à l'expulsion. Le pont le dessine et le colore depuis Mizaistom : la table emprunte
  l'éventail plutôt que d'en inventer un second.
- **Little Eye rend son image.** L'insecte descendait sur l'éventail et personne ne voyait ce
  qu'il filmait : la marche incruste un second cadre dans le coin dès que la sphère est envoyée
  dans une pièce, et la table avait la mouche sans le cadre — c'est-à-dire la technique sans ce
  qu'elle est. `eyeFeed()` rend les deux positions que l'insecte a déjà : perché, il regarde la
  pièce, donc elle ; en train de filmer, il est au-dessus de l'éventail et pointé un peu au-delà
  des cartes, parce qu'une caméra braquée droit vers le bas n'a plus de haut et rendrait les
  cartes couchées. `TourScene` prend ce cadre par la prop `feed` et le dessine avec le même
  `renderInset()` que l'œil de la marche et que le film de la chouette — trois copies de la
  danse des ciseaux étaient deux de trop.
- **Secret Window pose un hibou et rend une bande.** La technique était une ligne de texte :
  `surveillance` retournait l'éventail et rien dans la pièce ne disait d'où. Musse n'envoie
  pourtant rien et ne pilote rien — elle _attache_ un oiseau, qui écoute à travers la cloison
  et conserve ce qu'il a vu. Le hibou est donc sur la cloison derrière Morena, au-dessus et
  décalé sur sa gauche (droit derrière, on filmerait sa nuque), dès que quelqu'un s'assoit avec
  la technique en main ; `spread: 0`, et il ne bouge ni à la lecture ni à la fin de la partie.
  C'est toute la différence avec la mouche d'en face : l'insecte est _piloté_ et descend, le
  hibou est passif et n'a jamais rien fait d'autre que filmer. Ce que la lecture change est à
  l'écran — `owlFilm()` rend le cadre depuis le perchoir, incrusté en bas à droite, dans le coin
  que la marche réserve déjà à la relecture, et non en haut où vit le direct de Little Eye. Et
  `owlSaw()` rend l'éventail _tel qu'il était_ : lu dans le transcript plutôt que stocké, il
  garde les questions qu'elle a dépensées depuis. Un flux est périmé dès qu'une carte tombe ;
  un enregistrement, non — c'est la seule chose que la chouette ait de plus que la mouche.
- **Double Face s'assoit à deux places.** Le signet n'est pas un coup et n'avait donc pas de
  siège : `worksAtTheTable` répondait non, ce qui est juste et laissait Chrollo dehors alors
  qu'il est précisément celui qui apporte le plus à cette table. Ce qu'il apporte, ce sont
  _deux_ des sièges existants. La donne tire donc au hasard deux pages parmi
  `DOUBLE_FACE_PAGES` filtrées par `worksAtTheTable` — la même liste que la marche, jamais deux
  fois la même page — et le jeu gagne un second emplacement, `bookmark: { kind, spent }`. Deux
  compteurs séparés, parce que deux coups uniques volés sont deux coups uniques : les dépenser
  d'une seule bourse ferait du ruban une façon de diviser par deux ce que Chrollo a pris. F joue
  la page ouverte, R celle du signet, exactement comme dans la marche — `playTechnique` prend
  `page`, et `TourScene` sait déjà que R est la seconde main. Tout ce qui interrogeait
  `game.technique === 'scout'` demande maintenant `spentOn(game, 'scout')` : une technique posée
  sous le ruban doit dessiner sa mouche comme n'importe quelle autre, sans quoi la table
  dessinerait le registre au lieu de la pièce.
- **Lovely Ghostwriter écrit sans qu'on le lui demande.** L'écriture automatique n'est pas un
  coup : la bête écrit quand elle écrit, et l'on ne montre jamais sa propre prophétie à son
  sujet. La technique quitte donc le bouton. Elle est la seule entrée de `UNBIDDEN`, et
  `askMorena` la déclenche au premier tirage — le premier moment où quelque chose arrive au
  joueur, c'est-à-dire la main de Morena qui se referme sur une de ses cinq cartes. Une seule
  fois : une prophétie qui se corrige ne vaut rien. La bête, elle, est là depuis la donne, du
  côté du joueur et à son coude — la seule manifestation de cette table qui appartienne à la
  personne assise et non à la pièce — et `stage` passe de l'attente à la page écrite, posée
  sous la plume. Ce que le quatrain dit est `theLosingBranch()` : la carte marquée, ou le Oui
  sur une donne propre. En vers, pas en nom de carte — une ligne annonçant « elle a marqué le
  Retour » serait la page en train de jouer la partie à la place du lecteur.
- **Parallel Future rembobine la table, pas l'horloge.** Le `rewind` de la marche avait été
  écarté ici : l'après-image se dessine à la position du visiteur et rien, à cette table, n'est
  fonction de l'horloge. Mais la règle canonique n'est pas une après-image — c'est que _tout le
  monde sauf son porteur_ continue de percevoir la prédiction. Dix secondes, à cette table,
  valent un échange : elle répond, elle plonge la main, et c'est passé. `previous` garde donc
  l'état d'il y a un échange (jamais imbriqué : un pas d'annulation, pas une bande), et jouer
  la technique le restaure — question rendue à l'éventail, carte rendue à la main — en gardant
  tout ce que l'aura sait : `read`, la dépense, le transcript, qui conserve les deux passages.
  L'ordre du `unspool` est délibéré : on part de la partie courante et l'on écrase les champs
  _de table_ depuis l'instantané, si bien qu'un champ ajouté plus tard survivra par défaut au
  rembobinage — ce qui est le bon défaut, la connaissance survit. `forced` retient ce qu'elle a
  tiré pendant les secondes effacées et `askMorena` le lui fait reprendre, avant même la
  prescience : une technique qui annonce ce qu'elle va faire ne peut pas primer sur ce qu'elle
  a déjà fait. Tant que `forced` n'est pas vide, `TourScene` reçoit `tint` et la pièce entière
  passe au bleu de Tserriednich — l'ambiante _est_ l'exposition ici, donc la teinter teinte tout
  ce dont la pièce est faite, brouillard et fond compris. Une marque posée sur la table serait
  une annonce ; la lumière qui n'est pas la bonne est la chose même.
- **Une carte face visible porte enfin sa figure.** Un rectangle coloré se lit comme _une
  carte_ et ne dit pas laquelle : tolérable tant que le seul regard posé sur la table était
  celui d'un visiteur qui avait le panneau ouvert à côté, plus du tout dès qu'une caméra est
  posée à une paume de son éventail — un flux de sept rectangles gris n'est pas une main qu'on
  a lue. Les douze dessins quittent donc `MorenaCardArt.svelte` pour `$lib/tour/cardArt.ts` et
  servent les deux consommateurs : le panneau les injecte dans un SVG vivant, la table les
  charge en `data:` URI et les pose en encre sur la couleur que la carte avait déjà. Une carte
  face cachée n'a pas de figure ici, parce qu'elle n'en a pas non plus sur le bois : `face`
  n'est renseigné qu'une fois `read` acquis. Le panneau suit la même règle — `MorenaPiles`
  retournait sept dos même après lecture, ce qui était une ligne de texte affirmant une chose
  que la page refusait ensuite de montrer.

Écarté sciemment : le `rewind` de Parallel Future. La marche sait le jouer, mais l'après-image
se dessine à la position du visiteur et rien à cette table n'est fonction de l'horloge — assis,
la vision ne montre rien. La carte soulevée dit la même chose et la dit depuis la chaise.
