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
