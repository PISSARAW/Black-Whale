# Référence de commandes · clash-combat-17

96 flux de commandes historiques sont réenregistrés avec le moteur v17 après
l’ajout des branches de Kurapika et Benjamin. Les prémisses initiales de chaque
flux sont vérifiées contre leur empreinte historique avant simulation. Les
paquets restent identiques ; le recorder et le décodeur de production produisent
les nouveaux checkpoints. 34 états finaux changent. Aucun ancien replay n’est
simplement réétiqueté.

L’archive d’origine `../replays.tar.gz` (règles v9) reste inchangée. Sa somme
SHA-256 est conservée dans `baseline.json`, avec la version et l’empreinte source
d’origine. Les anciens rapports matériels et de performance restent historiques.

`SHA256SUMS` protège la nouvelle archive. `sources.json` couvre le TypeScript de
combat, hors tests ; son périmètre est explicite et ne représente pas une archive
complète du bundle de production. Les 328 routes actuelles, dont les huit nouvelles
branches des deux premiers profils, sont testées séparément par l’Académie.

Pour enregistrer une autre référence dans un dossier neuf :

```sh
CLASH_COMBO_REFERENCE_OUTPUT=/tmp/clash-reference-new pnpm exec tsx scripts/record-combo-reference.ts
```

Le générateur refuse d’écraser un dossier contenant déjà une référence. Le banc
`revalidateCombatReference.ts` reste strict : chaque checkpoint doit correspondre
pour permettre une nouvelle mesure à partir de cette archive.
