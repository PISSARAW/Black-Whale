# Qualification des commandes et de la cadence des six combattants

Cette campagne correspond à l’étape 2 du plan qui suit la
[référence figée](./BASELINE.md). Elle concerne Kurapika, Benjamin, Hisoka,
Chrollo, Feitan et Phinks. Le [rapport retenu](../../../ui-tests/fighting-qualification/README.md)
sépare les résultats logiciels des essais matériels encore nécessaires.

## Référence et versions

Le fichier `replays.tar.gz` de l’étape 1 reste intact. Son SHA-256 est vérifié
avant toute lecture. Les 96 variantes centre/droite/distance 6 des 48 routes
sur les deux terrains servent de séquences de rendu et de contrôle.

Lorsque le moteur mesuré a une autre version que la référence, le banc exécute
les paquets originaux et vérifie **chaque checkpoint original**, y compris
l’état initial. Il produit ensuite un nouvel enregistrement par le recorder de
production, sous la version du moteur mesuré, et le valide par son décodeur.
Une différence de simulation ou un snapshot devenu incompatible arrête le banc.
La version déclarée du replay conservé n’est jamais modifiée.

`revalidateCombatReference.ts` applique ce contrat. Les rapports indiquent les
versions d’origine et mesurée, les empreintes de la référence et du bundle
effectivement exécuté. Le bundle de production et ses sourcemaps sont conservés
pour permettre une reprise même si le checkout continue d’évoluer.

## Référence v17 après évolution des combos

Les nouvelles branches de Kurapika et Benjamin changent certains échanges,
y compris lorsqu’ils sont adversaires. La référence historique v9 demeure intacte.
`reference/v17` contient 96 réenregistrements des mêmes flux d’entrée, calculés
avec le moteur v17 et de nouveaux checkpoints de production. Les prémisses
initiales sont vérifiées ; 34 états finaux changent. La provenance et les sommes
de contrôle figurent dans le [dossier v17](../../../ui-tests/fighting-reference/reference/v17/README.md).
Cette archive reste conservée ; les rapports retenus sous v16 restent historiques.

## Référence v20 après correction de la mémoire d’observation

Le traitement des manifestations enregistre désormais ensemble la source,
la frame et la technique réellement vue. Ces informations participent aux
checkpoints et aux conditions d’acquisition de Skill Hunter. Les anciens
checkpoints v17 sont donc refusés ; ils ne sont pas réétiquetés.

Le chargeur utilise [reference/v20](../../../ui-tests/fighting-reference/reference/v20/README.md).
Les 96 flux d’entrée restent identiques aux originaux et chaque prémisse initiale
est vérifiée. Le recorder et le décodeur ont créé ces
checkpoints sous `clash-combat-20`. Le moteur courant utilise `clash-combat-21`
pour les [profils En qualifiés](./EN.md) ; la revalidation compare toujours tous
les checkpoints v20 avant de promouvoir une référence pour la mesure.
Les archives v9 et v17 et les anciens relevés de cadence restent historiques.

## Commandes et fenêtres

```sh
pnpm test:command-qualification
```

`commandQualification.ts` et `linkQualification.ts` utilisent la file de commandes,
les diagnostics et les gestes ordinaires du moteur. Les essais couvrent :

- Les six personnages sur P1 et P2, dans les deux orientations.
- Les lots de rendu à 120, 60, 30 et 20 Hz, avec simulation à 60 Hz.
- Un stun restant de 0, 1, 5, 6 et 7 frames : la dernière valeur doit être refusée,
  les valeurs dans la fenêtre doivent exécuter la commande au retour du corps.
- Les lourds avant/arrière, le léger bas et le léger aérien, avec vérification
  du coup réellement choisi après interprétation de la direction.
- Le gel du buffer pendant le hitstop, l’annulation d’une commande encore en file,
  le maintien, le relâchement, le retour au neutre et la reconnexion simulée.
- Les coups essayés sur les états réels des 96 routes, avant et après confirmation.
  Le rapport distingue admission, exécution immédiate et conservation du replay.
- La liaison Phinks lourd → poing chargé. Le banc tente une commande avant la
  récupération, puis chaque frame à partir du premier instant libre jusqu’au premier
  échec contre une garde réelle. Il conserve les points de part et d’autre de la
  limite. Depuis `clash-combat-23`, avant + léger → lourd de Kurapika est une chaîne,
  et depuis `clash-combat-26` lourd → arrière + lourd de Chrollo aussi. Le nouveau
  lien de Kurapika (arrière + lourd → avant + léger) n’apparaît dans aucun flux figé
  et se vérifie dans `duelComboDepth.test.ts`.
- Le quart de cercle avant du schéma classique (`controlScheme.test.ts`) : P1 et P2,
  deux orientations, directions tenues 1, 2 ou 3 frames (120, 60, 30 et 20 Hz),
  refus sans manipulation et expiration après la fenêtre de 15 frames.

Les états de stun et la position aérienne des sondes de file sont des prémisses
explicites du laboratoire ; ils ne représentent pas un combat humain. Les essais
de liaison repartent, eux, de préfixes réellement rejoués de la référence.

## Réception d’entrée, simulation et rendu

```sh
node apps/web/scripts/check-command-qualification.mjs
```

Le banc compile un bundle de production, puis pilote Chrome avec le GPU Metal.
Les contrôles passent par `createFightControls`, le mapping clavier/manette et
`createFightMatchRuntime`. Le clavier reçoit des événements Playwright ; la
manette est une **Xbox standard simulée**, clairement identifiée comme telle.

Cent appuis légers isolés sont demandés pour chacun des six personnages et
chacune des deux sources. L’état est restauré et un rendu neutre est attendu
avant chaque essai. La production de la première animation est observée dans
`Scene.onAfterRender` avec les données de l’état réellement posé par `FightScene`,
et non par la seule présence d’une attaque dans le moteur.

Le rapport conserve séparément arrivée, mise en file, exécution et première
soumission de rendu. L’origine est la réception de l’événement clavier, ou
l’installation de l’état de manette simulée avant son prochain polling. Toute
animation non observée reste un échec compté ; elle ne devient pas un délai nul.
Les essais navigateur vérifient aussi la perte de focus, la pause sans ticks,
le maintien du Hatsu et une seule commande lors de son relâchement.

Objectif logiciel proposé : aucun appui perdu et p95 arrivée → premier rendu
≤ cinq frames, soit 83,33 ms. **Ce délai ne comprend pas le périphérique,
le GPU jusqu’à la lumière émise ni le balayage de l’écran.** Il ne certifie donc
pas la cible de latence physique manette-écran du plan.

L’observation de rendu est optionnelle. Hors banc, `markFightRender` ne crée
aucun journal ; il n’écrit jamais dans la simulation ou les replays.

## Cadence et session continue

La matrice principale exécute les huit séquences de chaque personnage sur la
Tour Céleste sans interactions et la soute avec couverts : douze passages en
profil Équilibré, DPR appareil 2 plafonné à 1,25. Chaque passage comporte douze
secondes de chauffe puis trente secondes mesurées, avec file, recorder et
diagnostics actifs. Les séquences reviennent à leur snapshot initial entre elles.

Cinq passages supplémentaires en profil Qualité sollicitent les projectiles de
Franklin, Parallel Future, Cat’s Name, LSDF et la transformation de Biscuit.
Leurs effets doivent réellement se manifester par les commandes du moteur.
Ces charges complètent les six personnages de référence.

Une session de dix minutes parcourt les six personnages, cent secondes chacun,
sur le terrain interactif. Les changements de scène sont conservés dans les
traces brutes. Les douze premières secondes de chaque nouveau personnage sont
identifiées comme chauffe pour l’analyse de cadence en combat.

Les critères reprennent le banc existant :

- Moyenne ≥ 59 FPS ; intervalle p95 ≤ 17,5 ms et p99 ≤ 20 ms.
- Au plus 1 % d’intervalles > 25 ms ; travail CPU de rendu p95 ≤ 12 ms.
- Aucun échantillon perdu, aucune erreur de scène ou divergence de replay.
- Géométries et textures suivies entre les fenêtres de début et de fin de chaque
  segment prolongé. Cette indication ne mesure pas toute la mémoire du processus.

Les intervalles proviennent des callbacks du rendu 3D en Chrome headless. Ils
qualifient ce banc sur la machine décrite, pas le rafraîchissement physique de
tous les écrans. La charge et la mémoire libre du poste sont enregistrées.

## Reproduction et conservation

Les sorties sont dans `output/clash-command-qualification/` ;
`CLASH_QUALIFICATION_OUTPUT` change cette destination. Les paramètres
`QUALIFICATION_SECONDS`, `QUALIFICATION_WARMUP`, `QUALIFICATION_SOAK_SECONDS`,
`QUALIFICATION_LATENCY_TRIALS`, `QUALIFICATION_CASES` et
`QUALIFICATION_LATENCY_FIGHTERS` permettent un contrôle réduit.
`QUALIFICATION_ONLY_SOAK=1` réserve une reprise à la session continue ;
`QUALIFICATION_STRESS_GRAPHICS=performance` sélectionne explicitement ce profil
pour les scènes de charge. Un passage réduit
porte `fullScope: false` et ne constitue pas la campagne complète.

```sh
# Après une campagne complète, conserver les résultats sans remplacer un relevé :
pnpm exec tsx scripts/archive-command-qualification.ts
```

`QUALIFICATION_REFERENCE_DIRECTORY` choisit un nouveau dossier d’archive.
L’outil conserve rapports, traces, captures, bundle et checksums. Une destination
existante est refusée. Pour rejouer le bundle archivé, extraire `bundle.tar.gz`,
conserver `frozen-tapes.json` depuis les mesures, puis fournir
`QUALIFICATION_BUNDLE=/chemin/production` au contrôle navigateur.

## Reprise après correction du banc

La première session continue a été invalidée : un timestamp RAF légèrement
antérieur au démarrage produisait un indice −1. La simulation s’arrêtait ; le
rendu immobile ne constitue aucune preuve de cadence en combat. Cette trace est
conservée dans `initial-quality`, avec ses erreurs et son verdict négatif.

`soakSchedule.ts` borne désormais l’indice entre 0 et 5. Un test couvre le
premier callback antérieur au démarrage. Toutes les dix secondes, le contrôle
vérifie l’absence d’erreur et la progression par des replays terminés.

Le checkout ayant évolué entre les passages, la reprise restaure les sources
applicatives du bundle déjà mesuré, via ses sourcemaps :

```sh
pnpm exec tsx scripts/restore-command-qualification.ts
```

Le fichier `corrected-source-path.txt` indique la racine web restaurée.
`QUALIFICATION_SOURCE_ROOT` permet sa compilation ;
`QUALIFICATION_SOURCE_PROVENANCE` joint le manifeste `source-provenance.json`.
Les seules surcharges concernent `Fixture.svelte` et `soakSchedule.ts` : horloge
et contrôle de progression du banc. Les checkpoints originaux sont de nouveau
vérifiés par le moteur restauré. Le rapport conserve les empreintes des sources
restaurées, des surcharges et des deux bundles.

Les reprises sont archivées avec `--supplement`, dans un nouveau dossier.
Elles gardent `fullScope: false` ; elles complètent les passages valides sans
remplacer les échecs de la première campagne.

## Qualification matérielle restante

L’utilisateur ne dispose pas de manette pendant cette campagne. Les essais
Xbox physiques USB/Bluetooth et la latence manette-écran restent donc en attente,
ainsi que la qualification sur une deuxième machine.

Lorsque le matériel est disponible : utiliser le diagnostic Xbox existant pour
les boutons, axes, maintiens, relâchements, déconnexion et retour au neutre ;
exporter chaque transport séparément. Pour le délai physique, mesurer cent
appuis avec une instrumentation externe ou une capture rapide qui montre le
déclenchement physique et le premier changement de l’écran, en déclarant sa
précision temporelle. Un timestamp JavaScript ne remplace pas cette mesure.

## Archives v17 et moteur courant

Les captures v17 et leurs paquets d’entrée restent immuables. Depuis les
extensions rétrospectives, les états observés du moteur courant changent :
les captures dont les checkpoints divergent sont refusées, sans réécriture de leurs empreintes.
Les essais de fenêtres de commandes réutilisent ces entrées sous le moteur
courant et vérifient séparément qu’une sonde ne modifie pas la simulation.
Ils ne constituent pas une nouvelle certification des captures v17, ni une
nouvelle campagne de mesure du rendu ou du réseau.

Le contrôle d'intégrité compare les paquets v20 aux entrées originales v9 et
conserve l'empreinte de l'archive originale. Les corpus courants peuvent ajouter
des routes et adapter les commandes à la grammaire des combos ; leurs checkpoints
sont vérifiés sous leur propre version, sans remplacer les archives historiques.
