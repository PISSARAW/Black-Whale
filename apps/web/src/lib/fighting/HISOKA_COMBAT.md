# Hisoka — grammaire complète de combat

Hisoka ne reçoit pas un style différent inventé pour chaque adversaire. Les combats
canoniques alimentent une seule grammaire : calme provocateur, lecture du corps,
frappe physique, carte réelle, attache cachée, changement soudain de distance et
mensonge visuel. Les scénarios historiques ajoutent ensuite les objets et les corps
qui existaient réellement dans la scène.

## Corpus retenu

Les trois références vidéo fournies correspondent à Kastro, Gon et Gotoh. Elles
sont traitées comme des illustrations animées de ces combats ; le manga tranche
pour les règles, les coûts et les limites de la simulation.

- **Examen Hunter — Togari, Geretta et les candidats.** Cartes réelles, précision
  létale, déplacements économes et changement brutal d'intention. Ces scènes
  qualifient la carte et les normaux, pas un projectile de Nen.
- **Kastro — chapitres 52–55.** Hisoka accepte une blessure, cache ses fils avec
  `In`, emploie ses bras et ses cartes comme accessoires, fixe plusieurs attaches,
  désorganise la concentration de Kastro et recouvre ensuite les coutures avec
  Texture Surprise. Le jeu conserve donc une apparence trompeuse distincte de la
  chair, des PV et de la réparation physique.
- **Gon à la Tour Céleste — chapitres 61–63.** Hisoka invite l'approche, domine au
  corps-à-corps, pose une attache sans en faire l'ouverture automatique de chaque
  échange, attire Gon dans son poing et rappelle enfin un débris. C'est la référence
  principale de l'IA de duel ordinaire.
- **Razor — chapitres 163–168.** Bungee Gum arrête et renvoie une balle physique,
  mais la force traverse les doigts. L'interception du jeu exige donc un objet vu,
  une main libre, une préparation payée et peut blesser les mains ; elle n'est ni
  une parade universelle ni une annulation de dégâts.
- **Gotoh — chapitres 327–329.** Hisoka lit les salves de pièces, les évite avant de
  tendre une géométrie élastique, puis renvoie de la matière réellement interceptée.
  Cette référence gouverne la lecture des projectiles, le pas de retrait et le
  renvoi, sans prescience de l'entrée adverse.
- **Chrollo — chapitres 351–357.** Le mode `heavens-death-match` possède sa propre
  foule et son propre plan : plafond, décapitations, têtes attachées, double feinte,
  otage, corps lancés, faux Chrollo, marteau humain, amputations, programmation
  post-mortem, résurrection, prothèses et immobilisation de Machi. Ce scénario ne
  doit pas être réduit au duel arcade générique.
- **Shalnark et Kortopi — chapitre 357.** Ces exécutions qualifient l'Hisoka revenu
  à la vie : plus de contrat de spectacle équitable, attaque au moment choisi et
  usage immédiatement létal de ses outils existants. Elles ne créent pas un nouveau
  Hatsu.
- **Black Whale, patrouilles et Tserriednich — chapitre 420.** Hisoka tue les soldats
  avec des lames physiques avant qu'ils ne tirent. Contre Laplace's Devil, il attaque
  le corps prédit, croit voir le cadavre et ne reçoit aucune information sur la
  divergence réelle. L'IA vise donc `futurePerceivedTarget`; les collisions et le
  verdict restent attachés au vrai prince.

## Corps, cartes et rythme

Les attaques physiques emploient des poses propres dans `keyPosesHisoka.ts`,
`physicalStrikeWaveSevenDexterity.ts` et `standingStrikesWaveSeven.ts`. La main
dessine une carte ou un revers, les jambes portent les talons, balayages et attaques
aériennes. `hisokaCardPoses.ts` sépare le lancer de carte de la paume ouverte qui
pose Bungee Gum. La carte de `projectiles.ts` est un objet physique : elle peut être
interceptée, aspirée ou attachée ; elle n'est pas une émission d'aura.

`hisokaFootwork.ts` réalise le motif vu contre Gon et Gotoh : retrait court après
lecture d'une menace, puis retour engagé pendant la récupération. Ce déplacement
est maintenant branché dans `opponentMovement.ts` et `counterplayOpponent.ts`.
Il conserve les frames de démarrage et de récupération du dash, les collisions,
les murs, les blessures et la garde. Il ne donne ni téléportation ni invulnérabilité.

## Bungee Gum

La commande neutre pose une attache au contact non gardé. Une attache réelle peut
ensuite :

- rappeler la cible ou un objet ;
- propulser Hisoka vers un support, y compris le plafond ;
- changer de main ou de pied ;
- rester cachée avec `In` jusqu'à Gyo ;
- retenir et relancer une carte ;
- préparer un piège de surface ;
- être consommée par l'exécution élastique.

L'IA ne commence pas chaque échange par le Gum. Elle alterne cartes, talons,
balayages et frappes, puis exploite une attache confirmée. Ses choix emploient la
position qu'Hisoka perçoit : l'après-image de Tserriednich, jamais la position réelle
cachée par Laplace's Devil.

## Interception de Razor et Gotoh

`hisokaCatch.ts` ne supprime pas la force de l'objet. La fenêtre de préparation
coûte de l'aura, occupe une main et laisse Hisoka vulnérable. L'IA attend désormais
plusieurs frames d'observation du projectile identifié avant de préparer cette
fenêtre. Elle ne réagit ni à un faisceau d'aura, ni à un projectile vivant, ni à un
objet invisible ou sans trajectoire entrante. Le renvoi réutilise exactement l'objet
capturé.

## Texture Surprise, blessures et résurrection

Texture Surprise reste une apparence appliquée à un support réel. Elle peut masquer
les plaies, les coutures ou les prothèses de Bungee Gum, mais ne soigne pas et ne
recrée aucun membre. Un contact lourd peut déchirer le masque. Après le combat contre
Chrollo, les prothèses, le colmatage des plaies et la contraction programmée du cœur
et des poumons sont des états distincts avec leur propre coût et leurs conditions.

## Chrollo : scénario historique

Le livre du death match conserve les cinq pages explicitement préparées pour cette
scène. Il ne doit pas passer par la synchronisation du deck arcade 4+1, qui ferait
disparaître Gallery Fake. Les gestes visibles restent : tourner, marquer, fermer et
rouvrir le livre. Chrollo crée l'armée hors du regard d'Hisoka ; Hisoka cherche,
décapite, improvise avec la foule et ne connaît que les pages qu'il a réellement
déduites.

## Tserriednich : le cadavre mensonger

Le chapitre 420 n'autorise aucune résistance spéciale d'Hisoka à Laplace's Devil.
Lorsqu'il était dans le champ au moment de l'activation, `futureIllusion.ts` conserve
son corps matériel parmi les participants. `opponentAwareness.ts`, Bungee Gum et
l'IA suivent l'écho perçu. Les attaques sur cet écho peuvent produire pour Hisoka
des impacts, blessures et même une victoire apparente ; la santé, la position et le
score réels du prince restent inchangés jusqu'à la révélation.

Un nouveau soldat entrant après l'activation n'est pas trompé. Sortir du rayon,
rompre le Zetsu ou épuiser la réserve met fin au mensonge. Ces règles sont celles du
prince, pas une faiblesse artificielle ajoutée au moveset d'Hisoka.

## Présentation

Les fils visibles partent de la main posée et atteignent le corps ou l'objet réel.
Les fils cachés restent absents du point de vue adverse sans Gyo. Les accents de
contact, traction, propulsion, relâchement et Texture Surprise sont courts et suivent
le temps de simulation. Le lancer de carte est lui aussi indexé sur la frame de
simulation : la respiration de la garde ne peut plus changer sa silhouette entre
deux replays identiques.

Le death match porte sa propre caméra de foule et de plafond. Le monde illusoire de
Tserriednich utilise sa propre présentation asymétrique : Hisoka voit le faux corps,
le joueur du prince garde l'état réel.

## Validation

```sh
pnpm --filter @black-whale/web exec vitest run \
  src/lib/fighting/hisoka.test.ts \
  src/lib/fighting/hisokaCombat.test.ts \
  src/lib/fighting/hisokaArsenal.test.ts \
  src/lib/fighting/hisokaTexture.test.ts \
  src/lib/fighting/hisokaPresentation.test.ts \
  src/lib/fighting/hisokaEffects.test.ts \
  src/lib/fighting/futureParticipants.test.ts \
  src/lib/fighting/futurePerception.test.ts \
  src/lib/fighting/heavensDeathMatch/chrolloPlan/chrolloPlan.test.ts
```

Les tests doivent couvrir les deux sièges, les attaches visibles et cachées, les
objets physiques, les blessures aux mains, les prothèses, le scénario Chrollo et le
leurre de Tserriednich. Une simple présence de noms de coups ne suffit pas : les
simulations longues doivent constater cartes, contacts et déplacements réellement
exécutés par l'IA.
