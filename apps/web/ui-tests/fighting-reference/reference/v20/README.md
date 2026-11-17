# Référence de commandes · clash-combat-20

Les 96 flux de commandes historiques sont réenregistrés après la correction du
traitement des frames de Longhi et de la mémoire des manifestations observées.
Les conditions, équipements et capacités du Nen ne sont pas étendus. La mémoire
conserve maintenant source, frame et technique, conformément aux conditions de
Skill Hunter et à l’observation de Dowsing Chain déjà représentées.

Les paquets restent identiques aux originaux ; chaque empreinte initiale est
vérifiée avant simulation. Le recorder et le décodeur de production créent les
nouveaux checkpoints. 34 états finaux diffèrent de l’archive originale v9.
Les tests rejettent les checkpoints v17 devenus incompatibles et valident ceux
ci intégralement ; aucun ancien replay n’est simplement réétiqueté.

Les archives v9 (`../replays.tar.gz`) et v17 (`../v17`) restent intactes.
`baseline.json` conserve la provenance, l’empreinte des paquets et le commit de
base. `SHA256SUMS` protège la nouvelle archive. `sources.json` décrit le TypeScript
de combat, hors tests, et ne remplace pas une archive du bundle de production.
Les précédentes qualifications de cadence et de matériel restent historiques.

Le générateur refuse d’écraser une référence existante :

```sh
CLASH_COMBO_REFERENCE_OUTPUT=/tmp/clash-reference-new pnpm exec tsx scripts/record-combo-reference.ts
```

`revalidateCombatReference.ts` vérifie chaque checkpoint avant toute promotion.
