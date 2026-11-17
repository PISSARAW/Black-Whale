# Démo Hisoka × Chrollo

Montage de 87 secondes, en français, exporté en MP4 H.264 / AAC, 1920 × 1080 à
30 images/s. Le simulateur de production tourne à 60 Hz. Les personnages, le décor
de la Tour céleste, les collisions, coûts, annulations de coups et effets proviennent
du mode fighting. Le format K.-O. permet de montrer les échanges sans arrêter le
combat à dix points. Chaque chapitre repart d’un duel local neuf, avec 100 aura ;
les ressources évoluent normalement pendant les plans.

Depuis la racine du dépôt, avec les dépendances installées, Chromium et FFmpeg :

```sh
node apps/web/scripts/render-fighting-showcase.mjs --inspect
node apps/web/scripts/render-fighting-showcase.mjs
```

Sortie : `output/fighting-showcase/Hisoka-vs-Chrollo-Tour-Celeste.mp4`.
`FIGHT_SHOWCASE_OUTPUT` remplace le dossier de sortie ;
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` remplace le navigateur. Le script utilise
Chrome sur macOS si disponible, sinon le Chromium de Playwright.

`combat-report.json` conserve les commandes, impacts, techniques observées et
combos confirmés. L’export vérifie Ten, Ren, Zetsu, Gyo, Ken, Ryu, Ko, In, En et
Shu, les combos des deux combattants, Bungee Gum, Texture Surprise, la détonation
Sun and Moon et Black Voice. Aucun compteur de combo ni dégât n’est fabriqué.

L’audio est rendu hors ligne avec les recettes, le mixeur stéréo et le directeur
sonore du jeu. L’horloge virtuelle permet d’exporter chaque image sans dépendre
de la cadence réelle de capture.

Le montage ne modifie aucun fichier du jeu. Les libellés et l’habillage propres
à la vidéo sont dans `Showcase.svelte`, les séquences dans `choreography.ts`.

## Version continue

```sh
node apps/web/scripts/render-fighting-showcase.mjs --continuous --inspect
node apps/web/scripts/render-fighting-showcase.mjs --continuous
```

Sortie distincte : `output/fighting-continuous/Hisoka-vs-Chrollo-Combat-Continu.mp4`.
Cette version dure 39,2 secondes et utilise 60 images/s. Un unique état de combat
évolue jusqu’au K.-O., sans coupe, téléportation ni réinitialisation des PV et de
l’aura. `continuousChoreography.ts` compose les échanges ; `continuousDirector.ts`
enchaîne les commandes dès les confirmations, approches et récupérations réelles.
Les ressources conservent les coûts du jeu et récupèrent par Ten ou Zetsu.

Le rapport dénombre 22 combos confirmés et 55 contacts, avec moins de 0,6 seconde
d’immobilité simultanée maximale. L’export vérifie aussi la continuité temporelle,
l’absence de soin, l’impact critique en Ko et l’exécution finale. La première
vidéo est conservée.

## Caméra rapprochée et duel stratégique

```sh
node apps/web/scripts/render-fighting-showcase.mjs --cinematic --inspect
node apps/web/scripts/render-fighting-showcase.mjs --manga --inspect
node apps/web/scripts/render-fighting-showcase.mjs --manga
```

`--cinematic` reprend le duel continu avec une caméra 3D rapprochée.
`--manga` emploie la nouvelle chorégraphie de `mangaChoreography.ts`, inspirée
des pièges préparés de Chrollo et des contre-attaques élastiques d’Hisoka. Le
duel dure environ 37 secondes, en 1080p à 60 images/s. Il reste continu, sans
replay, ralenti, soin ni remise à zéro des ressources.

L’ajout de On est la variante du jeu issue de _The Last Mission_, explicitement
signalée dans la vidéo ; il n’est pas présenté comme faisant partie du duel du
manga. Le serment est réellement activé après les blessures, scelle les Hatsu,
puis s’épuise sur quatre gardes en Ken. La marque initiale de Sun and Moon
persiste pendant le combat jusqu’au piège final. Le rapport vérifie ces étapes.

`cinematicCamera.ts` compose une piste de caméra indépendante de la simulation :
suivi des deux corps, zooms sur les combos, Hatsu, activation de On et impacts
critiques, anticipation des sauts et retours progressifs au cadre d’ensemble.
Les 35 déclenchements ne coupent jamais le combat. Chaque image est contrôlée
pour garder les deux corps dans le cadre, sous le HUD. Le rendu applique cette
piste à la vraie caméra 3D via les callbacks de scène et restaure la caméra
de production après chaque passe ; aucun fichier applicatif n’est modifié.

Sortie : `output/fighting-manga/Hisoka-vs-Chrollo-Duel-Strategique.mp4`.
Les deux vidéos précédentes sont conservées.

Référence éditoriale du duel : [chapitre 351, Shōnen Jump+](https://shonenjumpplus.com/episode/10834108156630860138).
Les sources canoniques et les adaptations de jeu des capacités sont indiquées
dans `src/lib/fighting/chrolloCanon.ts`, `hisokaTechnique.ts` et `onTechnique.ts`.

## Kurapika × Benjamin — salle de bal

```sh
node apps/web/scripts/render-fighting-showcase.mjs --ballroom --inspect
node apps/web/scripts/render-fighting-showcase.mjs --ballroom
```

Sortie distincte : `output/fighting-ballroom/Kurapika-vs-Benjamin-Salle-de-Bal.mp4`.
Le décor est la grande salle du banquet du pont 1, utilisée comme salle de bal.
Le duel continu dure environ 45 secondes, en 1080p60, avec les deux Ren déjà
actifs à la première image. Chaque combattant utilise Ten, Ken, Ryu, Ko et On ;
les deux frappes critiques en Ko sont vérifiées séparément.

Benjamin Baton fournit les trois héritages disponibles dans le jeu : Air Blow,
Secret Window et Culdcept. Une carte de projectile de Nen capturée avant le duel
est déclarée dans la préparation ; Benjamin la rejoue réellement par Culdcept.
Les chaînes de Kurapika restant attachées à sa main, elles ne sont pas traitées
comme des projectiles capturables. La vue de présentation rend le hibou privé
de Benjamin visible au spectateur, sans changer la perception ni le simulateur.

Kurapika emploie Dowsing Chain, Holy Chain (un soin réellement calculé), Steal
Chain, le chargement de Stealth Dolphin et Judgment Chain. Chain Jail est exclue :
Benjamin n’est pas membre de la Brigade, donc son utilisation tuerait Kurapika.
Emperor Time est activé après la récupération ; le drain aboutit, la chaîne du
jugement est implantée et la tentative de Ren de Benjamin viole sa règle. La
victoire de Kurapika avec Emperor Time toujours actif est vérifiée dans le moteur.

`ballroomDirector.ts` suit les techniques des deux camps, les conditions des
Hatsu, le seul soin autorisé et les événements de victoire. La simulation ne
réinitialise ni positions, ni aura, ni blessures pendant le combat.

## Version longue avec gros plans simultanés

```sh
node apps/web/scripts/render-fighting-showcase.mjs --ballroom-long --inspect
node apps/web/scripts/render-fighting-showcase.mjs --ballroom-long
```

Sortie : `output/fighting-ballroom-long/Kurapika-vs-Benjamin-Version-Longue.mp4`.
Cette version dure 100,83 secondes en 1080p60, avec 20 combos confirmés et 132
contacts. Les combattants commencent avec 600 PV et leurs Ren actifs pour soutenir
le duel prolongé ; aucune ressource n’est réinitialisée en cours de combat. Seule
Holy Chain restaure des PV. Les versions précédentes sont conservées.

`longBallroomChoreography.ts` ajoute six séquences de rafales : approches aériennes,
replis, garde contre les tirs, retours au corps-à-corps et contrôle au pendule. Les
réserves d’aura se reforment sous une pression physique réelle. Emperor Time est
activé avant ces derniers échanges et réactivé après récupération pour terminer
par Steal Chain, Stealth Dolphin et Judgment Chain.

`closeupTrack.ts` suit les vrais états des chaînes et les activations d’Emperor
Time. Une seconde caméra rend la même scène au même instant dans un panneau de
détail, sans replay, ralenti ni arrêt de la vue principale. Les yeux écarlates
occupent quatre secondes et les chaînes environ huit secondes. Pour lire les yeux
ou une pointe implantée, le panneau masque uniquement les corps ou le hibou qui
les occultent ; la vue principale garde tous les acteurs et effets. Le détail ne
modifie ni les riggings, ni les attaques, ni les ressources.

Le cadrage principal anticipe le panneau et garde les deux corps à sa gauche.
L’export vérifie chaque image de la piste de caméra, la continuité, les commandes,
les combos, six séquences à distance, les pouvoirs et la victoire sous Emperor
Time. Les captures `detail-*.jpg` permettent de revoir les plans des chaînes et
des yeux avant l’encodage.

L’export audio compacte les cibles exponentielles consécutives identiques de
Web Audio pendant le calcul hors ligne. La comparaison de 96 000 échantillons
contre le calcul natif conserve une erreur RMS relative de 0,000134 ; les effets,
les panoramiques, les changements de cible et les autres automations restent
programmés par le directeur sonore de production.

Pour calculer séparément les pistes, `--audio-only` exporte le WAV et
`--picture-only` crée un MP4 sans son suffixé `-picture.mp4`. Les deux commandes
rejouent les mêmes états et vérifications, ce qui permet leur calcul en parallèle
puis un assemblage sans réencoder la vidéo.

## Feitan × Tserriednich — Rising Sun / Laplace Devil

```sh
node apps/web/scripts/render-fighting-showcase.mjs --solar --inspect
node apps/web/scripts/render-fighting-showcase.mjs --solar
```

Sortie distincte : `output/fighting-solar/Feitan-vs-Tserriednich-Rising-Sun.mp4`.
Un duel de 47,28 secondes dans le salon de Tserriednich, en 1080p60. Feitan engage
une attaque lourde ; le direct du prince l’interrompt par un vrai contre. Les
combos et ripostes alimentent les blessures de Pain Packer jusqu’à 100, sans
remplissage artificiel. Feitan revêt l’armure puis lance Rising Sun.

Tserriednich ferme simultanément les yeux en Zetsu pendant la préparation du
soleil. Le moteur prévoit 600 frames : rester dans la trajectoire initiale
aboutirait à sa mort par la chaleur. Il ouvre les yeux et se déplace réellement
hors du cercle : aucune immunité ni esquive automatique n’est ajoutée. Le soleil
expire après ses 320 frames, puis la divergence s’achève après 600 frames. Le
prince conclut par des frappes physiques, avec le K.-O. après ces deux échéances.

`solarDirector.ts` audite les blessures, l’armure, le soleil et la branche prédite ;
`showcase-solar-validation.mjs` vérifie l’ordre narratif, le contre, l’absence de
soin/réinitialisation, le futur mortel, zéro dégât solaire réel et la fin naturelle
des deux techniques. `SolarStatus.svelte` affiche les réserves et durées réelles.
La présentation rend la bête personnelle privée de Tserriednich visible au
spectateur, comme pour le hibou de Benjamin dans la vidéo précédente ; les règles,
les collisions et la perception des combattants restent celles du jeu.

### La fausse image touchée par Rising Sun

La version finale est `Feitan-vs-Tserriednich-Vision-de-Laplace.mp4`. Pendant la
chaleur, un panneau simultané montre ce que Feitan perçoit : les frames réelles de
la branche prédite, où l’image de Tserriednich subit 156 PV de brûlure puis un
K.-O. prédit. Le grand cadre conserve le véritable prince, indemne du soleil.
Ce n’est pas une collision annulée sur son vrai corps ni un second combat.

`solarVision.ts` emploie `futureVisibleState(state, 'player')`, la perception du
joueur Feitan, et retire de cette présentation la bête personnelle privée qu’il
ne voit pas. Le cadrage et le panneau sont vérifiés sur les 320 frames communes
pour ne masquer aucun des deux corps réels. `SolarPrediction.svelte` distingue
les dégâts de l’image et le verdict prédit. `--solar --prediction-only` rend ce
segment de présentation ; `compose-solar-vision.mjs` l’assemble avec la vue réelle
et la piste audio déjà exportées, sans changer la simulation ni son résultat.

## Mizaistom × Biscuit — contrôle, transformation et On

```sh
node apps/web/scripts/render-fighting-showcase.mjs --judgment --inspect
node apps/web/scripts/render-fighting-showcase.mjs --judgment
```

Sortie : `output/fighting-judgment/Mizaistom-vs-Biscuit-Duel-Strategique.mp4`.
Le duel de 53,95 secondes se déroule à la Cour suprême, en 1080p60. Les deux
combattants commencent avec 750 PV et 100 aura, puis leurs ressources évoluent
sans soin ni réinitialisation. Le rapport dénombre 29 combos et 92 contacts.

Mizaistom ouvre les échanges et varie pressions hautes, attaques basses et
approches aériennes. Biscuit utilise Ten, Ren et Ryu sous sa petite apparence.
Un contre de Mizaistom interrompt son engagement. Les deux avertissements Cross
Game dépensent réellement 40 aura chacun ; chaque déplacement volontaire après
l’ordre retourne le carton et produit la prison de 90 frames.

Biscuit rassemble son aura sous contrainte. Mizaistom engage une attaque avant
la fin de la deuxième prison ; elle révèle son corps naturel à la sortie et
l’interrompt avec un contre confirmé. La transformation reste corporelle, sans
soin ni coût de Hatsu. Ses conversions à trois touches et changements de niveau
font ensuite reculer l’adversaire.

Biscuit active On avant Mizaistom. Ils échangent des coups physiques en On pendant
7,5 secondes de combat actif, et les deux serments sont encore actifs lors de sa
victoire. On reste la variante du jeu issue de The Last Mission, signalée dans
l’habillage ; aucun Hatsu n’est lancé pendant qu’il scelle le Nen des utilisateurs.

`judgmentDirector.ts` vérifie chaque frappe exécutée, les avertissements, la
contrainte, la transformation, le Nen de Biscuit et les impacts en On. Les deux
attaques volontairement engagées puis interrompues alimentent les vrais contres ;
aucune frappe terminée ne manque sa cible. `showcase-judgment-validation.mjs`
contrôle l’ordre narratif, les deux contres, les ressources et le verdict.
La caméra anticipe le volume du corps naturel et ses sauts, sans couper les corps.

## Chrollo × Camilla — Cat’s Name

```sh
node apps/web/scripts/render-fighting-showcase.mjs --cats --inspect
node apps/web/scripts/render-fighting-showcase.mjs --cats
```

Sortie : `output/fighting-cats-name/Chrollo-vs-Camilla-Nen-Post-Mortem.mp4`.
Le duel continu dure 33,63 secondes en 1080p60 dans le salon de Camilla.
Les deux combattants commencent avec 500 PV. Chrollo place 61 contacts,
29 combos confirmés, des approches aériennes et trois marques Sun and Moon.
Camilla ne touche que trois fois ; Chrollo conserve 476 PV avant le retournement.
Chaque frappe exécutée atteint sa cible, sans coupe ni remise à zéro.

La frappe fatale arrive à 30,28 secondes. La mort réelle de Camilla déclenche
Cat’s Name sans commande manuelle : apparition, capture, mort du meurtrier,
absorption et résurrection en 120 frames natives. Camilla regagne ses PV par
ce seul effet, Chrollo est consommé, puis le moteur attribue la victoire à Camilla.
La caméra anticipe le volume du chat et recule progressivement ; le verdict
reste absent jusqu’à la fin de la résurrection. `showcase-cats-validation.mjs`
vérifie le minutage, les contacts, les phases et l’origine du seul soin.

### Retournement spectaculaire

```sh
FIGHT_SHOWCASE_OUTPUT=output/fighting-cats-spectacle node apps/web/scripts/render-fighting-showcase.mjs --cats-spectacle --picture-only
node apps/web/scripts/compose-cats-spectacle.mjs
```

Sortie : `output/fighting-cats-spectacle/Chrollo-vs-Camilla-Cat-s-Name-Spectaculaire.mp4`.
Les 1 817 premières images (30,28 secondes) proviennent de la vidéo précédente.
Le nouveau segment suit les mêmes 120 frames natives de Cat’s Name au ralenti
quatre fois, puis prolonge le verdict d’une seconde : durée finale 40,63 secondes.
L’apparition est suivie en contre-plongée rapprochée, la caméra cadre ensuite
les pattes et Chrollo, puis la circulation d’énergie et le corps de Camilla.
Le dernier plan rapproche son visage après la résurrection et déplace le verdict
sur le côté. Les silhouettes de suivi des corps absorbés sont désactivées.

`catsCrushPresentation.ts` ajoute seulement une compression visuelle entre les
pattes pendant la prise ; les transformations sont restaurées après le rendu.
La mort, l’absorption, les PV et la victoire restent ceux du moteur. Le calcul
vidéo utilise une horloge de présentation déterministe. L’audio original est
étiré uniquement pendant le Nen post mortem, avec un impact grave et une note
sur la résurrection. Le script d’assemblage vérifie que contacts, combos et ordre
des événements correspondent au duel original.

### Prise entre les pattes et visage à la résurrection

```sh
node apps/web/scripts/render-fighting-showcase.mjs --cats-grip --picture-only
node apps/web/scripts/compose-cats-spectacle.mjs --grip
```

Sortie distincte : `output/fighting-cats-grip/Chrollo-vs-Camilla-Prise-et-Resurrection.mp4`.
Le début est repris de la même vidéo de référence : 1 817 images, 30,28 secondes
et 29 combos. La fin conserve le minutage du montage spectaculaire (40,63 s).

`catsGripRig.ts` oriente les deux pattes natives vers le torse, raccorde les bras
et place les doigts au contact des côtés du corps. `catsCrushPresentation.ts`
maintient la posture capturée pour que le corps ne tombe pas hors de la prise.
L’écrasement horizontal précède l’apparition de l’énergie ; la contraction vers
la bête commence ensuite, puis le moteur consomme réellement Chrollo à la frame 84.
Ces poses et bras sont une animation de présentation et conservent les règles
et les ressources de la simulation. Les transformations sont restaurées après rendu.

`camillaFaceCamera.ts` vise la face avant réelle de la tête, avec un cadrage de
portrait qui suit le redressement. Les yeux sont fermés avant la résurrection
puis s’ouvrent sur 18 images ; les autres objets sont masqués dans ce seul plan.
Le visage est donc visible frontalement au moment où les PV sont restaurés.
`showcase-cats-inspection.mjs` vérifie séparément prise, compression, absorption,
face morte et face ressuscitée. Les distances des doigts au torse, l’ordre des
effets et l’alignement de la caméra sont archivés dans `presentation-audit.json`.

### Réveil dramatique, aura discrète

```sh
node apps/web/scripts/render-fighting-showcase.mjs --cats-face --picture-only
node apps/web/scripts/compose-camilla-awakening.mjs
```

Sortie : `output/fighting-cats-awakening/Chrollo-vs-Camilla-Reveil-Dramatique.mp4`.
Le montage reprend les 2 265 premières images (37,75 secondes) de la version
« prise et résurrection », y compris les trente secondes de combos et la prise
complète de Cat’s Name. Seul le portrait final est recalculé, sans changer la durée
finale de 40,63 secondes ou le verdict.

`camillaPortraitLight.ts` masque les cinq peaux d’aura sur la tête pendant le
portrait et réduit à 8 % la lumière de Nen sur le corps. Les uniformes partagés
et les visibilités sont restaurés après chaque passe. La caméra se rapproche
du visage ; les paupières restent fermées douze images après le retour des PV,
puis s’ouvrent sur quatre images. Une baisse sonore précède le regard et un
impact grave souligne son ouverture. Le gros plan reste frontal et suit la tête.

## Hisoka — Le dernier fil, cinématique de victoire de dix secondes

```sh
node apps/web/scripts/render-hisoka-victory.mjs --inspect
node apps/web/scripts/render-hisoka-victory.mjs --film-only
node apps/web/scripts/render-hisoka-victory.mjs --audio-only
node apps/web/scripts/compose-hisoka-victory.mjs
```

Sorties distinctes : `output/fighting-hisoka-victory/Hisoka-Le-Dernier-Fil.mp4`
(démo complète) et `Hisoka-Victoire-10s.mp4` (les dix secondes seules).
Le moteur courant rejoue le duel continu, puis Hisoka abaisse les PV adverses
par des frappes physiques, récupère son aura en Zetsu, attache Bungee Gum et
s'éloigne. Le finisher natif rappelle réellement Chrollo et provoque le K.-O.
Aucun PV, résultat ou déplacement de combat n'est fabriqué par la présentation.

`hisokaVictoryFilm.ts` étire cette fin sur 600 images : tension (2 s), rappel
(1,5 s), impact et chute (1 s), puis portrait avec carte et sourire (5,5 s).
`hisokaVictoryScene.ts` suit la vraie main pour l'insert et la face avant réelle
pour le portrait. `hisokaVictoryTether.ts` affine le fil entre la vraie main et
la cible native pendant les gros plans. La carte est un accessoire de présentation ; les deux segments
du bras sont orientés vers sa prise. Les poses, visibilités et caméras sont
restaurées après chaque rendu. Le modèle et la tenue restent ceux du jeu.

La sortie est en 1080p60 ; le combat initial est échantillonné à 30 Hz et les
600 images de la cinématique à 60 Hz. L'audio utilise le directeur sonore du jeu,
complété par trois accents synthétiques pour la traction, le choc et la carte.
`combat-report.json` conserve le résultat natif, la continuité et la piste de
présentation ; `presentation-audit.json` conserve les contrôles du portrait.

### Plan fixe, yeux ouverts, une inspiration, fin

```sh
node apps/web/scripts/render-fighting-showcase.mjs --cats-still --picture-only
node apps/web/scripts/compose-camilla-still.mjs
```

Sortie : `output/fighting-cats-still/Chrollo-vs-Camilla-Le-Souffle.mp4`.
Le montage conserve les 37,75 premières secondes de la version « prise et
résurrection ». Le portrait final dure seulement 90 images (1,5 seconde).
`camillaStillPose.ts` fixe tous les os et transformations, ainsi que le temps des
shaders de Nen. Le corps et la caméra gardent exactement la même matrice avant
et après l’ouverture des yeux. Les animations de redressement et de célébration
ne sont donc plus visibles dans le portrait.

Les yeux restent fermés jusqu’à 38,48 secondes, s’ouvrent rapidement, puis une
unique inspiration synthétisée et filtrée accompagne le regard. Le montage coupe
à 39,25 secondes, immédiatement après ce souffle. Aucun impact grave ni musique
ne vient après l’ouverture. Le verdict central est masqué dans ce seul plan fixe.

### Hisoka — portrait et sourire corrigés

```sh
node apps/web/scripts/render-hisoka-victory.mjs --portrait-only
node apps/web/scripts/compose-hisoka-portrait.mjs
```

Sorties : `Hisoka-Le-Dernier-Fil-Corrige.mp4` et
`Hisoka-Victoire-10s-Corrigee.mp4`, dans `output/fighting-hisoka-victory/`.
Le montage conserve les 2 629 premières images et l'audio de la démo d'origine ;
seules les 330 images du portrait sont remplacées. La cinématique garde ses
600 images, dix secondes, et la démo sa durée de 49,3167 secondes.

`hisokaNaturalSmile.ts` remplace la grande bouche plate asymétrique par des
lèvres fermées de 0,056 unité de large. La courbe neutre et la courbe souriante
sont projetées sur la vraie peau par rayons, avec un décalage de 0,0012 unité,
puis interpolées sans dents rapportées. La tête et le torse sont au repos dans
ce portrait ; la caméra reste frontale. Les ressources de géométrie du modèle
ne sont pas modifiées et les poses sont restaurées après chaque passe.

## Chrollo — La dernière page, victoire de dix secondes

```sh
node apps/web/scripts/render-chrollo-victory.mjs --inspect
node apps/web/scripts/render-chrollo-victory.mjs --film-only
node apps/web/scripts/render-chrollo-victory.mjs --audio-only
node apps/web/scripts/compose-chrollo-victory.mjs
```

Sorties : `output/fighting-chrollo-victory/Chrollo-La-Derniere-Page.mp4`
et `Chrollo-Victoire-10s.mp4`. Le duel reprend la chorégraphie stratégique,
puis termine par une vraie rencontre des marques Sun and Moon. Le moteur
conserve le Soleil sur Hisoka, le signet de Sun and Moon et le livre fermé
nécessaires à la Lune. Chrollo récupère son aura par le Zetsu natif avant la fin.
Aucun dégât, marque, déplacement ou résultat de combat n'est ajouté au rendu.

`chrolloVictoryFilm.ts` produit 600 images finales : préparation et livre (3 s),
explosion et chute (2 s), puis livre fermé et portrait (5 s). Les deux couvertures
atteignent leur fermeture complète à l'image 180 de la cinématique, exactement
sur l'image du début de la détonation. Le livre tenu est une chorégraphie de
présentation des charnières du modèle natif ; elle ne change pas l'état de la
page ou du signet dans la simulation. Les gros plans masquent le corps qui
occulterait le livre et le portrait.

`chrolloVictoryScene.ts` conserve les deux mains en contact avec le livre grâce
à `cinematicArmReach.ts`, remet tête et torse au repos, puis restaure chaque
transformation après rendu. `chrolloVictoryBlast.ts` amplifie visuellement
la vraie détonation derrière Chrollo, avec cœur lumineux, onde et braises ;
la profondeur reste derrière lui pour garder son visage et le livre lisibles.

La démo dure 45,3667 secondes en 1080p60 ; le combat est échantillonné à 30 Hz,
la cinématique à 60 Hz. Le son utilise le directeur sonore du jeu et des accents
synthétiques : froissement des pages, claquement du livre et choc grave.
Le claquement et le choc commencent tous deux à la même milliseconde que
l'explosion. `combat-report.json` conserve les règles et les temps natifs ;
`presentation-audit.json` conserve les angles des couvertures et les contacts.

### Chrollo — mise en scène renforcée

```sh
node apps/web/scripts/render-chrollo-victory.mjs --spectacle --inspect
node apps/web/scripts/render-chrollo-victory.mjs --spectacle
node apps/web/scripts/compose-chrollo-spectacle.mjs
```

Sorties : `output/fighting-chrollo-spectacle/Chrollo-La-Derniere-Page-Spectaculaire.mp4`
et `Chrollo-Victoire-Spectaculaire-10s.mp4`. L'ouverture de 2 122 images provient
de la démo précédente ; seules les 600 images finales sont recalculées.
Le script d'assemblage exige les mêmes événements, PV finaux et vainqueur natifs.

La cinématique enchaîne la marque du Soleil (0–1,25 s), les pages et le signet
(1,25–2,5 s), la fermeture rapprochée (2,5–3 s), la détonation (3–4 s),
l'orbite et la sortie à pied (4–7 s), puis le regard final (7–10 s).
La couverture est complètement fermée à l'image 180, au début de l'explosion.

`chrolloSpectacleBook.ts` ajoute des pages illustrées et des couvertures à emblème,
trois feuillets mobiles et un mouvement du signet. `chrolloSpectacleCamera.ts`
compose les inserts, le travelling circulaire et le dernier rapprochement.
`chrolloSpectacleBlast.ts` remplace les sphères uniformes par des flammes et
fumées turbulentes calculées par shader, 48 débris balistiques, 80 braises et
une onde au sol. Un flash bref marque le choc. `chrolloSpectacleMotion.ts`
fait réagir le bas du manteau et ajoute les pas de sortie : ces déplacements
appartiennent à la présentation après le résultat, pas à la simulation.
La pose du visage reste neutre, les pieds sont posés au sol et les géométries
partagées ne sont jamais déformées. Toutes les transformations sont restaurées.

La nouvelle piste sonore conserve le combat, réduit l'ambiance avant le choc,
puis ajoute froissement, tension grave, claquement, souffle, débris et quatre pas.
La durée totale reste 45,3667 secondes et la fin seule dure dix secondes.

## Kurapika × Chrollo — Le jugement écarlate

```sh
node apps/web/scripts/render-kurapika-victory.mjs --inspect
node apps/web/scripts/render-kurapika-victory.mjs --film-only
node apps/web/scripts/render-kurapika-victory.mjs --audio-only
node apps/web/scripts/compose-kurapika-victory.mjs
```

Sorties : `output/fighting-kurapika-victory/Kurapika-Le-Jugement-Ecarlate.mp4`
et `Kurapika-Victoire-10s.mp4`. Le duel local de la Tour céleste commence avec
400 PV par combattant, puis n'effectue aucun soin, changement de PV ou reset.
Chrollo utilise son livre, Sun and Moon et Black Voice ; Kurapika alterne combos,
Dowsing Chain et récupération native. `kurapikaVictoryDirector.ts` attend les
vraies fenêtres d'annulation pour les routes physiques.

`kurapikaVictoryFilm.ts` active réellement Emperor Time avant la capture.
Chain Jail cible Chrollo, membre autorisé de la Brigade : la touche ne fait
aucun dégât, immobilise la cible et force son Zetsu. Un dernier coup lourd
physique donne le K.-O. pendant cette immobilisation. Le moteur conserve
Emperor Time et Chain Jail au résultat ; la victoire ne provient pas de dégâts
inventés de la chaîne. La démo dure 48,3833 secondes, dont 600 images finales
(10 secondes) en 1080p60.

La fin montre les yeux, le lancement depuis le majeur, l'enroulement, le coup
final, puis le relâchement du brin libre. Les quatre dernières secondes
rapprochent la caméra du visage frontal et des deux iris écarlates natifs.
Le visage et les yeux gardent leur géométrie ; seuls tête et torse reviennent
au repos dans le portrait, et les couches d'aura qui occultent les traits sont
masquées. Les transformations sont restaurées après chaque rendu.

`kurapikaVictoryChains.ts` réutilise les vrais maillons et la griffe du jeu.
La spirale de présentation suit le torse réel, y compris pendant la chute,
et le brin libre suit la vraie main. `kurapikaSteel.ts` ajoute un éclairage
argenté aux maillons de présentation ; les chaînes du combat restent celles
du jeu. `kurapikaVictoryCamera.ts` compose les six types de plans.
L'audio utilise le directeur sonore du jeu, complété par un sifflement,
un verrouillage métallique, le choc physique et les maillons qui retombent.

### Kurapika — variante Fatality

```sh
node apps/web/scripts/render-kurapika-fatality.mjs --inspect
say -v Daniel -r 100 -o output/fighting-kurapika-fatality/fatality-raw.aiff 'Fatality.'
ffmpeg -v error -y -i output/fighting-kurapika-fatality/fatality-raw.aiff -af 'aresample=48000,asetrate=36000,aresample=48000,atempo=1.12,highpass=f=90,lowpass=f=6000,aecho=0.8:0.7:90|180:0.28|0.15,loudnorm=I=-16:TP=-2:LRA=7' -ar 48000 -ac 2 output/fighting-kurapika-fatality/fatality-announcer.wav
node apps/web/scripts/render-kurapika-fatality.mjs
node apps/web/scripts/compose-kurapika-fatality.mjs
```

Sorties distinctes : `output/fighting-kurapika-fatality/Kurapika-Le-Jugement-Fatal.mp4`
et `Kurapika-Fatality-10s.mp4`. La variante reprend les 2 303 images de combat
précédant la cinématique d'origine et recalcule seulement 600 images finales.
Les événements, les PV finaux et le vainqueur natifs doivent être identiques.

`kurapikaFatalityFilm.ts` retime la même capture puis le même résultat : capture
à 1,5 s, traction et résultat à 4,25 s, chute au sol à 5,5 s, puis quatre secondes
de regard écarlate. La Fatality est une chorégraphie de présentation du résultat,
avec suspension, resserrement et chute ; elle n'ajoute pas de dégâts à Chain Jail
ni de nouvelle règle dans le moteur. Le K.-O. natif reste issu du coup physique.

`kurapikaFatalityPose.ts` suspend le prisonnier à 0,95 m, pose ses membres entravés,
retire le poing de Kurapika, puis fait tomber le corps avec les chaînes.
Les quatre tours de maillons passent d'un rayon de 0,29 à 0,205 m sur la traction.
`kurapikaFatalityCamera.ts` suit le poing, la suspension, le resserrement et la chute.
`kurapikaFatalityLighting.ts` assombrit le décor sans modifier les matériaux
partagés ; un éclairage de sol isole les personnages. `kurapikaFatalityDust.ts`
ajoute poussière, éclats et fissures de présentation sur l'impact. Les matrices,
visibilités et matériaux sont restaurés après chaque passe. Le visage de
Kurapika garde sa géométrie et les iris rouges natifs.

Le titre « FATALITY » accompagne une annonce anglaise synthétisée localement
avec la voix système Daniel, grave et réverbérée. Aucun son de Mortal Kombat
n'est utilisé. La tension, les chaînes, la traction et le choc sont synthétisés
pour cette variante ; le combat conserve sa bande-son avant la cinématique.

### Feitan — Fatality Pain Packer / Rising Sun

```sh
node apps/web/scripts/render-feitan-fatality.mjs --inspect
node apps/web/scripts/render-feitan-fatality.mjs --film-only
node apps/web/scripts/render-feitan-fatality.mjs --audio-only
node apps/web/scripts/compose-feitan-fatality.mjs
```

Sorties : `output/fighting-feitan-fatality/Feitan-Rising-Sun-Fatality.mp4`
(combat de 33,367 s, puis Fatality de 10 s), et `Feitan-Fatality-10s.mp4`.
1080p, 60 images/s, H.264 / AAC stéréo. La composition reprend l'annonce
Daniel synthétisée pour Kurapika dans `output/fighting-kurapika-fatality`.

Une seule simulation Feitan × Hisoka accumule les blessures, équipe Pain Packer,
puis libère Rising Sun. Les PV initiaux de démonstration sont fixés à 400 avant
la première image ; aucun soin ni réinitialisation n'intervient ensuite.
Le K.-O. est causé par les pulsations de chaleur natives. L'export vérifie les
blessures, l'ordre armure / soleil / victoire et la continuité du combat.

Les 600 images finales retiment ces événements : déploiement de l'armure à 1,5 s,
fermeture de la cagoule à 2,7 s, ignition à 3,5 s, vague de chaleur à 4,5 s,
combustion à 5 s, résultat natif à 6 s et portrait final à 7 s.
`feitanFatalityPose.ts` repose le rig et resynchronise les sept articulations de
l'armure sur le corps. `feitanFatalitySun.ts` ajoute une photosphère turbulente,
des filaments, une onde au sol, une dissolution incandescente et des cendres.
Les flammes et la fumée réutilisent `chrolloSpectacleBlast.ts`.
Les poses, matériaux, visibilités et caméra sont restaurés après chaque rendu.
La bande-son associe verrous métalliques, tension grave, grondement solaire,
vague thermique, crépitement et annonce Fatality.

### Phinks — Ripper Cyclotron

```sh
node apps/web/scripts/render-phinks-fatality.mjs --inspect
node apps/web/scripts/render-phinks-fatality.mjs
node apps/web/scripts/compose-phinks-fatality.mjs
```

Sortie : `output/fighting-phinks-fatality/Phinks-Fatality-10s.mp4`, 600 images,
10 secondes, 1920 × 1080, 60 images/s, H.264 / AAC stéréo. Le mix réutilise
l'annonce Daniel de `output/fighting-kurapika-fatality`.

`phinksFatalityFilm.ts` simule un seul duel Phinks / Kurapika : les coups de
préparation diminuent réellement les PV, puis Zetsu récupère l'aura avant la
charge. Six tours complets sont payés par le moteur et consommés dans un seul
Ripper Cyclotron qui donne le K.-O. L'export vérifie le vainqueur, les six tours,
l'identité du coup et l'absence de soin ou de réinitialisation. La vidéo conserve
seulement les dix secondes de finition ; le rapport garde aussi le combat natif.

Le montage ouvre sur Phinks, montre les six moulinets entre 0,6 et 3,8 s,
retient le poing chargé, puis frappe à 4,5 s. Les modèles, les vêtements et les
visages sont ceux du jeu. `phinksFatalityPose.ts` fait tourner le bras droit à
l'épaule, avec coude légèrement plié, puis place le coup avec deux segments
articulés. `phinksFatalityEffects.ts` dessine trois rubans d'aura, la compression
du poing et la fragmentation stylisée de Kurapika après le résultat natif.
Les 210 fragments, les fissures de sol, les débris et la poussière sont des effets
de présentation ; aucune règle de désintégration n'est ajoutée au combat.

Le dernier plan et l'annonce Fatality commencent à 7 s. Le son accompagne chacun
des six tours par une impulsion montante, coupe brièvement avant le choc, puis
superpose un impact unique, le souffle et le cliquetis des fragments. Les poses,
matériaux, visibilités et caméra sont restaurés après chaque passe de rendu.

### Franklin — Double Machine Gun

```sh
node apps/web/scripts/render-franklin-fatality.mjs --inspect
node apps/web/scripts/render-franklin-fatality.mjs
node apps/web/scripts/compose-franklin-fatality.mjs
```

Sortie : `output/fighting-franklin-fatality/Franklin-Fatality-10s-Corrigee.mp4`, 600 images,
10 secondes, 1920 × 1080, 60 images/s, H.264 / AAC stéréo. Le mix réutilise
l'annonce Daniel de `output/fighting-kurapika-fatality`.

`franklinFatalityFilm.ts` simule un duel Franklin / Kurapika. Des coups physiques
préparent réellement les PV ; Zetsu récupère l'aura, puis Franklin prend sa distance
et exécute une rafale prolongée native. Les quarante projectiles émis provoquent
trente-huit impacts et le K.-O. Aucun dégât, soin ni rechargement n'est ajouté.
Le rapport conserve les identifiants des balles, leurs émissions, leurs impacts,
le résultat et la continuité. La vidéo conserve seulement dix secondes de finition.

Le montage montre les cinq canons de la main droite, les extrémités basculées et
les chaînes, puis les deux mains en tir. `franklinFatalityPose.ts` repose les bras
avec deux segments articulés et oriente les poignets dans l'espace du parent pour
respecter les proportions du rig. `franklinFingertipRig.ts` place quatre doigts
et un pouce opposé sur chaque paume, avec des longueurs différentes. Chaque
orifice affleure l'extrémité de son doigt et son axe vise la cible ; les traceurs
suivent exactement cet axe. Les extrémités sectionnées pendent sous les doigts
et les quatre maillons suivent la liaison, hors de la trajectoire du tir.
La géométrie des pièces, les vêtements et le visage proviennent du jeu ; les
corrections de position sont propres à cette démo.

La première balle part à 2,6 s, le résultat natif intervient à 5,833 s, la chute
se termine à 6,417 s et l'annonce Fatality commence à 7 s. Les traceurs, flammes
de bouche, étincelles, marques d'impact et réactions du corps suivent les émissions
et contacts enregistrés. Les trajectoires sont adaptées au placement de la scène.
La fumée et la poussière accompagnent la chute, puis le portrait final de Franklin.
Ces détails de présentation n'ajoutent aucune nouvelle règle au combat.

Le mix associe chaque tir à un son bref, alterné en stéréo entre les deux mains,
et chaque contact à un impact distinct. Les poses, matériaux, visibilités et caméra
sont restaurés après chaque passe de rendu.

### Inventaire vérifié des cinématiques — 17 novembre 2026

Une fatality doit rendre la mise à mort lisible dans la scène. Un K.-O. natif,
une explosion ou un carton de victoire ne suffisent pas à la valider.

| Personnage | État du lot |
| --- | --- |
| Kurapika | Fatality : Chain Jail, traction, chute et verdict écarlate |
| Feitan | Fatality : Pain Packer, Rising Sun et incinération |
| Phinks | Fatality : six rotations, Ripper Cyclotron et pulvérisation |
| Franklin | Fatality : Double Machine Gun, impacts multiples et chute ; canons corrigés |
| Hisoka | Cinématique de victoire : rappel au Bungee Gum, K.-O., carte et sourire ; mise à mort non explicite |
| Chrollo | Cinématique de victoire explosive : fermeture du livre et Sun and Moon ; sort de la victime insuffisamment lisible |
| Camilla | Référence initiale dans un autre chat ; non réauditée ici |

Le bilan vérifié dans cette série est donc de quatre fatalities et de deux
cinématiques de victoire à convertir. Camilla reste comptée séparément comme
référence. Les effets partagés de choc et de cratère portent désormais les noms
`cinematicImpactEffects.ts` et `cinematicCrater.ts`, avec `cinematicEase.ts`
pour l'interpolation ; Phinks et Franklin ne dépendent d'aucun autre personnage.

## Benjamin — Le dernier ordre

```sh
node apps/web/scripts/render-benjamin-fatality.mjs --inspect
node apps/web/scripts/render-benjamin-fatality.mjs
node apps/web/scripts/compose-benjamin-fatality.mjs
node apps/web/scripts/check-benjamin-fatality.mjs
```

Sortie : `output/fighting-benjamin-fatality/Benjamin-Fatality-10s.mp4`,
600 images, dix secondes, 1920 × 1080, 60 images/s, H.264 et AAC stéréo.
`--audio-only` sur le script de composition régénère uniquement le son.

Un duel continu contre Tserriednich est résolu par le moteur : Air Blow de
la paume gauche donne le K.-O. Les PV, l'aura et le verdict ne sont jamais
réécrits par le film. Les dix secondes suivantes utilisent directement
`victory/benjamin.ts`, comme les victoires normales du jeu, avec la cible et
l'arène du match. La démo accepte `target`, `stage`, `side=opponent` et `reduced`
dans son URL pour contrôler tailles, lieux, P2 et confort visuel.

Le gros plan d'ouverture montre deux plaques militaires de souvenir ; un écho
de soldat apparaît et rejoint la paume gauche. Benjamin avance à bout portant,
déchaîne Air Blow à 4,5 s, projette puis disperse la cible en fragments stylisés.
Il salue de la main droite ; le verdict Fatality et l'annonce commencent à 7 s.
La chaîne reste sous le menton et le salut conserve les articulations natives.

L'écho est un rappel visuel de Benjamin Baton, acquis avant le duel. Il ne vole
pas le Hatsu du vaincu. La projection, la dispersion et les plaques sont une mise
en scène arcade ; le mécanisme complet d'Air Blow n'est pas établi par le manga.
Le mix associe cliquetis des plaques, souffle spectral, pas militaires,
compression d'air, explosion unique, débris et voix locale Daniel.

Le lot compte désormais cinq fatalities (Kurapika, Feitan, Phinks, Franklin,
Benjamin) et deux cinématiques de victoire (Hisoka et Chrollo).

## Tserriednich — Tu arrives trop tard

`tserriednich-fatality.html` joue dix secondes contre Hisoka au casino VIP,
avec le renderer de victoire utilisé dans Clash. La vision désaturée précède
la réouverture des yeux, puis deux corps opaques montrent la divergence.
La prise du poignet, le tir dévié et le contre final emploient des bras articulés
sans étirement. Les paramètres `target`, `stage`, `side` et `reduced` permettent
les contrôles des autres modèles et lieux.

`node apps/web/scripts/render-tserriednich-fatality.mjs` exporte 600 images.
`node apps/web/scripts/compose-tserriednich-fatality.mjs` ajoute le son et fournit
la bande du jeu. `node apps/web/scripts/check-tserriednich-fatality.mjs` contrôle
les deux côtés, les tailles extrêmes, le miroir, le mobile et le déclenchement réel.

## Chrollo — Indoor Fish × Sun and Moon

```sh
node apps/web/scripts/render-chrollo-fish-fatality.mjs --inspect
node apps/web/scripts/render-chrollo-fish-fatality.mjs
node apps/web/scripts/compose-chrollo-fish-fatality.mjs
node apps/web/scripts/check-chrollo-fish-fatality.mjs
```

Sortie : `output/fighting-chrollo-fish-fatality/Chrollo-Indoor-Fish-Fatality-10s.mp4`,
600 images en 1080p60 et dix secondes de son. Le duel natif se termine par Sun
and Moon, puis le renderer de victoire de Clash joue les deux poissons marqués,
les morsures et leur croisement. Le contact des marques, la fermeture du livre
et la détonation partagent l'image 390 (6,5 s). Le verdict Fatality arrive à 8 s.

La démo joue contre Hisoka au casino VIP. `target`, `stage`, `side=opponent` et
`reduced` permettent de contrôler l'adaptation. Le mix et l'animation remplacent
la scène de Chrollo dans les victoires normales, sans modifier le résultat.
Cette combinaison est une chorégraphie arcade demandée pour le jeu. Les vidéos
précédentes restent disponibles ; le lot courant comporte sept fatalities
et une cinématique de victoire pour Hisoka.

## Leorio — L’étage supérieur

```sh
node apps/web/scripts/render-leorio-fatality.mjs --inspect
node apps/web/scripts/render-leorio-fatality.mjs
node apps/web/scripts/compose-leorio-fatality.mjs
node apps/web/scripts/check-leorio-fatality.mjs
```

Sortie : `output/fighting-leorio-fatality/Leorio-Fatality-10s.mp4`, 1080p60,
600 images et dix secondes avec son. La démo utilise le modèle natif de Leorio
contre Hisoka au casino VIP et le renderer de victoire de production. Les
paramètres `target`, `stage`, `side=opponent` et `reduced` restent disponibles.

Les six coups à distance précèdent un uppercut à 5,8 s ; la caméra suit la
projection jusqu'au plafond à 7 s. Fissures et débris accompagnent le choc,
puis Leorio remet ses lunettes. Le son synchronise les frappes au sol, les
sorties des poings, les impacts et l'annonce à huit secondes. L'exagération
de la projection est une chorégraphie après le verdict natif, sans changer
la simulation. Le lot comporte désormais huit fatalities et la victoire
d'Hisoka.

## Halkenburg — Une seule volonté

```sh
node apps/web/scripts/render-halkenburg-fatality.mjs --inspect
node apps/web/scripts/render-halkenburg-fatality.mjs
node apps/web/scripts/compose-halkenburg-fatality.mjs
node apps/web/scripts/check-halkenburg-fatality.mjs
```

Sortie : `output/fighting-halkenburg-fatality/Halkenburg-Fatality-10s.mp4`,
600 images en 1080p60 avec dix secondes de son. La démo oppose Halkenburg à
Hisoka dans le salon du neuvième prince. Trois compagnons alimentent l'arc,
Grimmel part à 5 s, frappe à 5,4 s, puis le transfert de conscience prend
le relais. Le gros plan des yeux de la cible montre le changement de volonté.

Le moteur résout d'abord le scénario avec trois compagnons consentants, la
charge complète et une possession réelle. Le renderer de victoire reconstruit
ensuite ces étapes sans modifier l'état natif. Le mix associe trois voix
synthétiques, la tension de corde, le départ de flèche et le transfert.
`target`, `stage`, `side=opponent` et `reduced` permettent les contrôles des
modèles et décors. Le lot compte dix cinématiques de victoire.

## Camilla — Le Souffle, intégré à Clash

```sh
node apps/web/scripts/render-camilla-fatality.mjs --inspect
node apps/web/scripts/render-camilla-fatality.mjs
node apps/web/scripts/compose-camilla-fatality.mjs
node apps/web/scripts/check-camilla-fatality.mjs
```

Sortie : `output/fighting-camilla-fatality/Camilla-Fatality-10s.mp4`,
600 images en 1080p60 avec dix secondes de son. La démo conserve une véritable
mort et résurrection Cat's Name contre Chrollo dans le salon de Camilla avant
de montrer le renderer utilisé dans le jeu. `target`, `stage`, `side=opponent`
et `reduced` permettent de vérifier les autres acteurs et décors.

La prise à deux pattes, l'écrasement et l'absorption précèdent 90 images de
portrait immobile. Les yeux s'ouvrent à l'image 554 ; l'unique inspiration
commence à l'image 558. La composition reprend la bande originale de la
référence « Le Souffle » en conservant sa fin, sans nouvelle annonce.
Dans Clash, cette chorégraphie accompagne toute victoire sans modifier les
règles natives de Cat's Name. Le catalogue compte désormais onze cinématiques.


## Kalluto — La dernière danse du papier

```sh
node apps/web/scripts/render-kalluto-fatality.mjs --inspect
node apps/web/scripts/render-kalluto-fatality.mjs
node apps/web/scripts/compose-kalluto-fatality.mjs
node apps/web/scripts/check-kalluto-fatality.mjs
```

Sortie : `output/fighting-kalluto-fatality/Kalluto-Fatality-10s.mp4`,
600 images en 1080p60 avec son. Le film montre la même séquence que les victoires
de Kalluto dans Clash : papier discret fixé à 1,4 s, rire de la cible à 1,7 s,
nuée de 12 288 feuilles, convergence à 4,7 s puis déchirure à partir de 5,3 s.
La cible par défaut est Franklin au casino VIP. `target`, `stage`, `side=opponent`
et `reduced` permettent les contrôles d'adaptation.

Le verdict préalable vient d'un vrai fragment planté et d'un flux guidé dans
le moteur. Le volume spectaculaire, la destruction stylisée et le rire sont
une chorégraphie après verdict ; les PV et le résultat restent intacts.
Le catalogue compte désormais douze cinématiques de victoire.

## Machi — Le dernier point

```sh
node apps/web/scripts/render-machi-fatality.mjs --inspect
node apps/web/scripts/render-machi-fatality.mjs
node apps/web/scripts/compose-machi-fatality.mjs
node apps/web/scripts/check-machi-fatality.mjs
```

Sortie : `output/fighting-machi-fatality/Machi-Fatality-10s.mp4`,
600 images en 1080p60 avec son. La cible par défaut est Hisoka à la Tour
Céleste. Machi piste le corps, referme sa toile et commande le pantin,
puis se rapproche pour la découpe à 4,7 s. Elle recoud les quatre sections
à partir de 5,1 s, les réunit à 6,3 s et tire le dernier point à 7 s.
Le pantin se défait et les sections tombent ; Machi conserve son calme.

Cette chorégraphie amplifie les usages des fils fournis comme référence.
Le moteur résout au préalable un vrai pistage, une vraie ligature maintenue
et un K.-O. par Fil tendu, sans modifier les PV pour le film. Le renderer de
victoire est celui de Clash, adapté aux deux modèles et au lieu courant.
`target`, `stage`, `side=opponent` et `reduced` permettent les contrôles.
Le catalogue compte désormais treize cinématiques de victoire.

## Shizuku — Rien à signaler

```sh
node apps/web/scripts/render-shizuku-fatality.mjs --inspect
node apps/web/scripts/render-shizuku-fatality.mjs
node apps/web/scripts/compose-shizuku-fatality.mjs
node apps/web/scripts/check-shizuku-fatality.mjs
```

Sortie : `output/fighting-shizuku-fatality/Shizuku-Fatality-10s.mp4`,
600 images en 1080p60 avec son. Deme-chan frappe à 1,4 s, aspire le sang
par l'ouverture à 2,3 s ; la cible tombe à 4,7 s. Le corps inerte est nettoyé
à partir de 5,7 s. Les traces suivent, puis le bouton entre en dernier à 7,4 s.
Deme-chan le recrache à 7,9 s ; Shizuku le range puis remet ses lunettes.
La voix française désigne le sang et le corps avant l'aspiration. La dernière
réplique « À qui ? » accompagne sa recherche du propriétaire du bouton.

Le film oppose Shizuku à Franklin à la Tour Céleste. Le moteur crée de vraies
ouvertures par les coups de Deme-chan, puis résout le K.-O. par aspiration du
sang. Le nettoyage et le bouton sont des éléments cosmétiques après verdict.
`target`, `stage`, `side=opponent` et `reduced` contrôlent l'adaptation dans
la même scène de production. Le catalogue compte quatorze cinématiques.


Bonolenov — « Le dernier mouvement » : `bonolenov-fatality.html` présente dix
secondes de Prologue et Jupiter sur le renderer du jeu. Le film valide d’abord
une danse complète et le K.-O. natif par Jupiter. `render-bonolenov-fatality.mjs`
exporte 600 images, `compose-bonolenov-fatality.mjs` produit la musique corporelle,
les impacts et le son réutilisé par Clash ; `check-bonolenov-fatality.mjs` contrôle
les gabarits, les lieux, P2, le miroir, le confort, le mobile et le déclenchement.


Illumi — « Même après la mort » : `illumi-fatality.html` utilise le renderer de
victoire de Clash pour les dix secondes d’implantation, perte de volonté, mort
et salut du cadavre. Le film préalable valide les trois ordres natifs et un
K.-O. physique, sans ajouter de finisher à Illumi. `render-illumi-fatality.mjs`
exporte 600 images ; `compose-illumi-fatality.mjs` produit le son synchronisé et
`check-illumi-fatality.mjs` contrôle l’intégration, P2, les tailles et le mobile.
Le catalogue compte désormais seize cinématiques.


Biscuit — « Le soin de grâce » : `biscuit-fatality.html` présente dix secondes
de soin par Cookie, transformation native, direct au torse et retour au soin.
Le film obtient un K.-O. physique après la transformation gratuite ; la lotion
reste un soin. `render-biscuit-fatality.mjs` exporte 600 images en 1080p60,
`compose-biscuit-fatality.mjs` produit le son de la vidéo et de Clash,
et `check-biscuit-fatality.mjs` contrôle les modèles, les lieux, P2 et le mobile.
Sortie : `output/fighting-biscuit-fatality/Biscuit-Fatality-10s.mp4`.
Le catalogue compte désormais dix-sept personnages avec cinématique de victoire.


Kurapika contre la Brigade — « La colère écarlate » : `kurapika-troupe.html`
présente dix secondes de capture éclair, sept coups au corps et au visage,
puis une projection finale inspirée de son affrontement avec Uvogin. Les yeux
restent écarlates et le visage en colère. La démo affronte Chrollo dans la cale ;
`target`, `stage`, `side=opponent` et `reduced` permettent les adaptations.
Seuls les neuf membres jouables réels de la Brigade sont acceptés.

`kurapikaTroupeFilm.ts` obtient une capture Chain Jail native, sans dégâts,
le Zetsu forcé puis un K.-O. physique. Le renderer est celui de Clash et choisit
automatiquement cette variante après une victoire de Kurapika sur la Brigade.
Les cibles hors Brigade conservent leur variante Judgment Chain.
`render-kurapika-troupe.mjs` exporte 600 images en 1080p60 ;
`compose-kurapika-troupe.mjs` ajoute les chaînes, les coups et la tension
instrumentale, sans voix. `check-kurapika-troupe.mjs` vérifie le déclenchement,
le son, les deux côtés, les gabarits, les lieux, le mobile et le confort.
Sortie : `output/fighting-kurapika-troupe/Kurapika-Brigade-Fatality-10s.mp4`.

## Saiyu — Les trois silences

`node apps/web/scripts/render-saiyu-fatality.mjs --inspect` produit les plans de
contrôle ; la même commande sans `--inspect` exporte 600 images en 1080p60.
`node apps/web/scripts/compose-saiyu-fatality.mjs` ajoute le mix et l’annonce anglaise « Fatality » à 8,1 s,
également chargé dans Clash. `check-saiyu-fatality.mjs` contrôle le déclenchement,
le son, P2, le miroir, les petites et grandes cibles, le mobile et le confort.

La démo affronte Hisoka à la Tour Céleste ; `target`, `stage`, `side=opponent`
et `reduced` permettent les adaptations. Trois touches natives retirent les
sens avant le vrai K.-O. par le bâton. La mise en scène utilise les signes de
chaque sens, conserve les modèles natifs et n’invente pas l’anatomie des singes.
Sortie : `output/fighting-saiyu-fatality/Saiyu-Fatality-Sens-Annonce-10s.mp4`.
La version sensorielle montre un noir complet, des yeux sans regard, les mains
aux oreilles, une onde sonore devenue plate et une bouche ouverte en cri muet.
Le mix est entièrement silencieux entre 2,9 et 4,7 secondes.

## Melody — Un champ au printemps

`node apps/web/scripts/render-melody-fatality.mjs --inspect` exporte les plans
de contrôle ; sans `--inspect`, le script exporte 600 images en 1080p60.
`compose-melody-fatality.mjs` ajoute la phrase de flûte originale et l’annonce
« Friendship » en anglais. `check-melody-fatality.mjs` contrôle le déclenchement,
les deux côtés, les tailles, le miroir, les lieux, le mobile et le confort.

La démo oppose Melody à Chrollo dans la salle de banquet. `target`, `stage`,
`side=opponent` et `reduced` permettent les adaptations. La prairie est une
perception du personnage enchanté ; Melody ne tue pas avec sa musique.
La simulation préalable obtient une victoire native à la décision, après une
vraie performance qui pacifie la cible sans lui infliger de dégâts.
Sortie : `output/fighting-melody-fatality/Melody-Friendship-10s.mp4`.
