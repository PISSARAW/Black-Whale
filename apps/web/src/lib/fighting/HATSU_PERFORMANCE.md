# Hatsu lourds : cadence et émotions

Mesures du 17 novembre 2026 sur Apple M5, 16 Go, Chrome 157 / ANGLE Metal.
Profil **Qualité**, fenêtre 1280 × 900, DPR matériel 2 et plafond Qualité existant
de 1,75. Résolution, bloom, anticrénelage, effets et expressions sont conservés.

## Résultat en fenêtre visible

Sur secteur, mode économie d’énergie désactivé : 45 secondes mesurées par cas,
après 12 secondes de chauffe. Chaque cas vérifie deux boucles du replay moteur,
avec file de commandes, enregistrement et diagnostics actifs.

Le contrôle sans fenêtre dure 30 secondes par cas, après la même chauffe.

| Situation                     | FPS fenêtre | FPS sans fenêtre | Frame p95 / p99 en fenêtre | CPU rendu p95 en fenêtre |
| ----------------------------- | ----------: | ---------------: | -------------------------: | -----------------------: |
| Franklin, Double Machine Gun  |       60,00 |            55,94 |             17,6 / 17,7 ms |                   3,9 ms |
| Tserriednich, Parallel Future |       59,80 |            55,51 |             17,6 / 17,7 ms |                   2,8 ms |
| Camilla, The Cat’s Name       |       60,00 |            59,90 |             17,6 / 17,7 ms |                   2,5 ms |
| Yokotani, LSDF                |       59,95 |            50,37 |             17,6 / 17,7 ms |                   8,7 ms |
| Biscuit, forme naturelle      |       60,00 |            59,94 |             17,6 / 17,7 ms |                   2,1 ms |

**La qualification automatique stricte reste en échec.** En fenêtre visible,
le p95 de 17,6 ms dépasse son seuil historique de 17,5 ms, malgré une cadence
proche de 60 FPS. Le contrôle sans fenêtre reste plus lent sur Franklin et
Parallel Future. Les seuils restent inchangés et aucune frame lente n’est filtrée.
Ces résultats ne garantissent pas 60 FPS sur toutes les machines.

L’alimentation compte : pendant cette session, le navigateur visible plafonnait
à environ 30 FPS sur batterie en mode économie d’énergie, y compris avec un
rendu de 4 ms. Le branchement du Mac a rétabli environ 60 FPS sans recompilation.
Le banc enregistre désormais l’alimentation et la politique active avant et après
chaque mesure. Il ne modifie pas les réglages du système.

## Corrections retenues

- **LSDF** : les sept gardes complets partagent quatre géométries fusionnées par
  matériau et dessinées en instances. Sommets, couleurs, positions et segments
  du numéro sont conservés pour les neuf niveaux. Sur le scénario comparable,
  la médiane de la scène entière passe de 2604 à 1812 appels de dessin.
- **Reflets** : la caméra de reflet réutilise les matrices du corps déjà posé.
  La frame suivante recalcule normalement la pose ; les scènes indépendantes
  gardent leur mise à jour propre.
- **Décor** : les triangles entièrement rejetés par les deux plans de coupe sont
  retirés une fois. Les triangles traversant une limite gardent le clipping GPU
  d’origine et les étiquettes de provenance sont remappées. Les transformations
  locales du décor fixe ne sont plus recomposées à chaque rendu.
- **Parallel Future** : les 600 frames restent calculées par le même moteur.
  Une copie propre est figée récursivement ; ses blocs d’empreinte FNV sont
  réutilisés pour les préfixes déjà rencontrés, avec un cache limité à 64 entrées.
  Les données importées et mutables ne bénéficient pas de ce cache persistant.
  Les empreintes des replays existants sont conservées.

Les tentatives de regroupement dynamique des corps qui ralentissaient Metal ont
été retirées. Les modules des expressions et les 40 profils restent identiques
à la référence `5ec9b75a0`. Les visages natifs sont conservés.

## Preuves

La synthèse est dans
[`hatsu-verification.json`](../../../ui-tests/fighting-performance/hatsu-verification.json).
Les traces complètes restent dans `output/` à la racine du dépôt :

- `clash-hatsu-ac-before/` : référence sur secteur pour Parallel Future et LSDF ;
- `clash-hatsu-ac-after/` : les cinq cas en fenêtre visible, 45 secondes chacun ;
- `clash-hatsu-ac-strict/` : contrôle sans fenêtre, 30 secondes chacun ;
- `clash-hatsu-visuals/` : six couples de scènes principales figées ;
- `clash-hatsu-final-quality/` : exécutable conservé et série avec changement d’alimentation.

Les autres dossiers `clash-hatsu-*` conservent les diagnostics et les tentatives
rejetées. Les comparaisons visuelles vérifient le replay final, la frame et les
paramètres des expressions avant/après. La tolérance est de 0,2 % de pixels
différant de plus de trois niveaux sur un canal. Les vues secondaires restent
contrôlées pendant la campagne en mouvement : un seul contexte prédit est réutilisé.

Les 170 tests ciblés couvrent notamment les expressions des 40 personnages,
Parallel Future, LSDF, les replays et les poses dans les reflets. Les géométries
LSDF et les triangles conservés sont aussi comparés directement.

Les six comparaisons figées passent : cinq sont identiques pixel par pixel ;
LSDF présente 17 pixels dépassant trois niveaux de différence, avec des paramètres d’expression
strictement identiques. Les 23 tests du ratchet et le lint des fichiers modifiés
passent. La vérification de types globale reste bloquée par un fichier de
démonstration extérieur à ces changements : `nobunagaFatalityActors.ts:24`,
couleur fournie en chaîne à la place d’un nombre. Aucun diagnostic ne concerne
les fichiers de cette modification.

## Reproduire

Depuis la racine du dépôt, sur secteur :

```sh
FIGHT_PERF_SUITE=stress \
FIGHT_PERF_CASES=projectiles-quality,future-quality,post-mortem-quality,guards-quality,transformation-quality \
FIGHT_PERF_HEADLESS=0 FIGHT_PERF_SECONDS=45 FIGHT_PERF_WARMUP=12 \
FIGHT_PERF_OUTPUT="$PWD/output/clash-hatsu-quality" \
node apps/web/scripts/check-fighting-performance.mjs
```

`FIGHT_PERF_HEADLESS=1` reprend le protocole sans fenêtre. Les deux modes conservent
les mêmes seuils ; les échecs sont écrits dans `report.json` avant le code de sortie.
`FIGHT_PERF_RENDER_REF=5ec9b75a0` remplace seulement les cinq fichiers de référence
listés dans le rapport, sans modifier le checkout. `FIGHT_PERF_BUNDLE` réutilise
un exécutable figé.

Les requêtes GPU chronométrées ne sont plus actives dans la sonde par défaut :
elles perturbaient les mesures sur ce pilote. `FIGHT_PERF_GPU=1` les réactive pour
le diagnostic ; ces relevés doivent être distingués de la cadence normale.
`FIGHT_PERF_PROFILE=5` prélève un profil CPU après la fenêtre de mesure.

```sh
HATSU_VISUAL_BEFORE="$PWD/output/clash-hatsu-ac-before/production" \
HATSU_VISUAL_AFTER="$PWD/output/clash-hatsu-final-quality/production" \
node apps/web/scripts/check-fighting-hatsu-visuals.mjs
```

La vérification visuelle exige Python 3 et Pillow. Elle ne remplace pas la campagne
de cadence : ses scènes principales sont volontairement figées avant l’introduction
de la caméra de détail.
