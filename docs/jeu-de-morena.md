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

### 6.3 Ce qui reste à faire

Le §4 n'est pas fait : rien de tout ceci n'est encore branché sur `world-engine`
(`EFFECT_ATTRIBUTE_CHANGED`, `EFFECT_STATE_CHANGED`), ni sur `INFECTION_STEPS` de
`packages/ability-modules/src/contagion/module.ts`, ni sur un `ContagionDashboard`. Le
réducteur pur existe et il est testé (`apps/web/src/lib/tour/morena.test.ts`, 68 cas) : c'est
exactement la pièce que le §4.1 demandait, et elle est prête à être consommée par le moteur
quand les deux primitives manquantes seront branchées.
