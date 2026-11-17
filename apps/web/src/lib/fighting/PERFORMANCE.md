# Rendu du combat : référence de production

L’[étape 2](./STEP2.md) ajoute trois profils graphiques, le diagnostic Xbox et
une matrice de charges de Nen avec sessions prolongées. Les mesures historiques
ci-dessous restent la référence des quatre combattants initiaux.

Le banc mesure Kurapika, Hisoka, Chrollo et Benjamin avec le vrai moteur,
`FightStage`, le HUD, la caméra et les effets. Les composants Svelte sont compilés
et minifiés en mode production, puis servis par un serveur de prévisualisation.
Le build SvelteKit complet fait aussi l’objet d’un contrôle distinct en navigateur.

## Modifications

- Le calcul des appuis ne met plus à jour tous les descendants décoratifs du
  personnage. Three.js actualise les chaînes d’ancêtres nécessaires à chaque
  cheville et à la conversion dans le repère du sol. Le rendu met ensuite à jour
  le reste de la hiérarchie une fois. Les transformations obtenues sont identiques.
- Un changement de En n’invalide plus le modèle humain. La figure est déjà créée
  avec `nen.en = null` : le cercle et sa portée appartiennent à la scène des effets.
  Les changements d’aura, Gyo, In, Emperor Time et de forme gardent leur invalidation.
- La scène 3D conserve son anticrénelage MSAA ×4 et sa profondeur. Son image HDR
  est ensuite résolue une fois vers des passes plein écran sans MSAA ni tampon de
  profondeur inutile. Le bloom garde ses résolutions, ses seuils et son intensité.
  La vignette, la correction des valeurs invalides et la conversion des couleurs
  restent dans le même ordre.

Aucune modification des règles, dégâts, fenêtres de cancel, collisions, saisies,
entrées, fréquence de simulation ou format/règles des replays. Aucun effet supprimé,
aucune réduction de résolution et aucune baisse du nombre de ticks.

## Protocole

Référence source : `7209a4d4`. Les mesures utilisent des exports isolés de cette
révision, puis les seules optimisations ci-dessus. Les autres modifications
locales en cours ne font pas partie de ce comparatif.

Machine : Apple M5, Mac17,3, 10 cœurs CPU, 16 Gio de RAM. Chrome
157.0.8103.78, moteur WebGL matériel ANGLE/Metal Apple M5. Fenêtre 1280 × 900,
arène de 560 px. DPR 1 pour le contrôle standard ; DPR 2 pour la charge avec effets,
plafonné à 1,75 par le jeu. Caméra dynamique et réglages visuels par défaut.

Chaque passage comporte 12 s de chauffe puis 45 s mesurées. Les huit cas associent
un contrôle à la Tour Céleste et un combat avec effets dans la salle du banquet,
avec bloom, diagnostics de réactivité et enregistrement actif. Les commandes sont
celles d’une bande déterministe de 1 200 ticks. Chaque boucle rejoue réellement le
moteur et vérifie ses checkpoints. Le combat enregistré utilise aussi la vraie
file de commandes et le contrôleur de replay ; son état est comparé au replay.

L’ordre avant/après alterne entre les cas. Chaque passage ouvre un processus de
navigateur neuf. Les profils CPU sont recueillis après la fenêtre chronométrée.
Les temps GPU proviennent de requêtes WebGL asynchrones, sans attente forcée.
Le rapport conserve les valeurs brutes, y compris les pauses, et les dates,
empreintes de combat, résolutions, ressources graphiques et charges de la machine.

Budget de référence : moyenne ≥ 59 FPS ; intervalle p95 ≤ 17,5 ms et p99 ≤ 20 ms ;
au plus 1 % d’intervalles > 25 ms ; temps de rendu CPU p95 ≤ 12 ms ; au moins
une boucle de replay entière validée. Le percentile 95 signifie que 95 % des
images mesurées sont en dessous de cette valeur.

Le coût GPU est suivi séparément, avec une cible de marge p95 de 12 ms. Il n’est
pas utilisé comme équivalent de la cadence : le [pilote ANGLE/Metal](https://chromium.googlesource.com/angle/angle/+/main/src/libANGLE/renderer/metal/mtl_command_buffer.mm)
additionne les durées de ses buffers de commandes. La [requête WebGL](https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query/)
mesure l’exécution des commandes, pas la présentation sur l’écran. Une cible GPU
non atteinte reste signalée dans le comparatif, même quand la cadence passe.

## Résultats

Les huit cas passent le budget de cadence : **60,0 FPS**, p99 maximal **16,8 ms**,
**21 601 images après optimisation**, **aucun intervalle > 25 ms**, et seize boucles
complètes de replay validées. Les empreintes des huit combats sont identiques
avant/après. La référence tenait déjà 60 FPS ; le gain porte sur le travail de rendu.

Cas avec bloom, DPR 2 et enregistrement actif (45 s chacun) :

| Personnage | FPS avant → après | CPU p95 avant → après | Coût GPU moyen avant → après |
| ---------- | ----------------- | --------------------- | ---------------------------- |
| Kurapika   | 60,0 → 60,0       | 2,5 → 4,0 ms          | 16,1 → 13,4 ms               |
| Hisoka     | 60,0 → 60,0       | 6,1 → 5,0 ms          | 17,2 → 13,5 ms               |
| Chrollo    | 60,0 → 60,0       | 2,7 → 2,3 ms          | 15,3 → 13,9 ms               |
| Benjamin   | 60,0 → 60,0       | 2,3 → 2,8 ms          | 16,2 → 13,2 ms               |

Le coût GPU moyen observé baisse de 9 à 22 %. Le CPU p95 ne baisse pas uniformément :
Kurapika et Benjamin sont plus coûteux sur cette série, tout en restant sous le
budget. La charge et la pression mémoire de l’hôte varient ; ces différences ne
constituent pas une mesure isolée de chaque optimisation.

La cible de marge GPU p95 de 12 ms reste **non atteinte** sur les quatre cas avec
bloom : 18,0 à 20,3 ms après. Les pics ne diminuent pas uniformément, notamment pour
Chrollo. Le rapport distingue donc la cadence validée de la marge GPU encore limitée.
Le comptage déterministe des appuis passe, lui, de 137–198 à 12 mises à jour par
calcul (91–94 % de moins), avec un écart de position nul sur ce contrôle.

[Comparatif et critères](../../../ui-tests/fighting-performance/reference/comparison.json),
[mesures avant](../../../ui-tests/fighting-performance/reference/before.json),
[mesures après](../../../ui-tests/fighting-performance/reference/after.json).
Les traces par image, captures et profils bruts sont disponibles dans
`/tmp/fps-final-pairs/` sur la machine de référence ; les scripts les régénèrent.

## Reproduire

Depuis `apps/web`, `pnpm test:performance` compile et mesure les vingt cas :
standard, Retina, effets, bloom et combat enregistré, pour chacun des quatre
personnages. Les sorties restent dans `/tmp/black-whale-fighting-performance`.

```sh
FIGHT_PERF_OUTPUT=/tmp/fight-after \
FIGHT_PERF_SECONDS=45 FIGHT_PERF_WARMUP=12 \
FIGHT_PERF_CASES=kurapika-desktop,kurapika-live \
pnpm test:performance
```

Paramètres supplémentaires : `FIGHT_PERF_PROFILE=8` enregistre un profil CPU de
huit secondes hors mesure ; `FIGHT_PERF_BUILD_ONLY=1` prépare uniquement le bundle ;
`FIGHT_PERF_BUNDLE=/chemin/production` mesure un bundle déjà compilé.
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` remplace le chemin de Chrome installé.
Le lancement de référence utilise Metal sur macOS ; ne pas substituer SwiftShader
pour conclure sur les performances matérielles.

Préparer deux exports de la source avant/après, leur fournir le même dossier
`ui-tests/fighting-performance` et le même script `check-fighting-performance.mjs`,
installer leurs dépendances et exécuter `svelte-kit sync`. Compiler chaque export
avec `FIGHT_PERF_BUILD_ONLY=1` et deux répertoires de sortie distincts. Puis :

```sh
FIGHT_PERF_BEFORE_BUNDLE=/tmp/fight-before/production \
FIGHT_PERF_AFTER_BUNDLE=/tmp/fight-after/production \
FIGHT_PERF_BEFORE_REVISION=7209a4d4 \
FIGHT_PERF_AFTER_REVISION=revision-a-verifier \
FIGHT_PERF_OUTPUT=/tmp/fight-pairs \
FIGHT_PERF_SECONDS=45 FIGHT_PERF_WARMUP=12 \
node scripts/pair-fighting-performance.mjs
```

Pour ajouter les profils CPU à cette comparaison, définir
`FIGHT_PERF_PROFILE_CASES=kurapika-desktop,kurapika-live FIGHT_PERF_PROFILE=8`.

Le script conserve tous les passages, agrège les rapports et vérifie le budget.
`compare-fighting-performance.mjs avant.json apres.json comparatif.json` vérifie
également l’identité des cas, du navigateur, de la machine, du framebuffer et des
empreintes de combat. Une violation du budget donne un code de sortie non nul.

## Limites

La machine sert à d’autres travaux. Les ralentissements externes, la pression
mémoire et la planification du système peuvent modifier la cadence ; une variation
CPU entre deux passages ne prouve donc pas à elle seule le gain de l’optimisation.
Une première exploration de douze cas est conservée séparément, avec ses pauses
sous charge concurrente. Aucun échantillon lent n’est filtré du calcul.

Il s’agit de cadence `requestAnimationFrame` et de travail CPU/GPU en Chrome
headless, pas d’une mesure physique d’affichage ou de latence manette-écran.
La référence ne certifie ni tous les décors, ni tous les Hatsu, ni les autres
matériels, ni les changements de graphismes encore en cours. Les temps de chargement
et de compilation initiale sont hors fenêtre ; ils ne sont pas présentés comme des
performances à chaud. La validation des seize routes de combos, de la défense et
des replays est distincte du relevé de cadence.

Le détail des contrôles se trouve dans `reference/checks.json` : les sources TS du
combat autres que les trois fichiers de rendu modifiés ont la même empreinte
avant/après. Les 615 tests ciblés incluent les 128 variantes des seize combos,
la défense, la caméra, les animations, les replays et la chaîne de post-traitement.
Les huit comparaisons d’images utilisent les mêmes états et une horloge de rendu
figée. La faible différence de quantification après résolution MSAA est conservée
dans les statistiques ; les contrôles portent également sur les silhouettes, les appuis et le HUD.

Pour compter les mises à jour des appuis sans dépendre de la vitesse de la machine,
exécuter depuis la racine :

```sh
pnpm exec tsx --tsconfig apps/web/tsconfig.json apps/web/bench/fighting-rig.ts
```

`initial-sweep.json` conserve l’exploration initiale sous charge concurrente.
`work-in-progress.json` contient un contrôle complémentaire de quatre séquences de
20 s sur un instantané des graphismes locaux en cours de modification. Ce contrôle
court ne remplace pas le comparatif de la source commitée. `full-app.json` vérifie
aussi les quatre personnages sur la vraie page SvelteKit en production, dans la
salle du banquet, avec commandes clavier, enregistrement et cadence native, sans
requête de chronométrage GPU ajoutée.
