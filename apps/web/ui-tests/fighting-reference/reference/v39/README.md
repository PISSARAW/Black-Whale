# Référence de commandes · clash-combat-39

Les 96 flux de commandes historiques sont réenregistrés avec le moteur courant,
qui inclut l’anticipation des projectiles et la défense continue contre les rafales.
Les prémisses initiales et les paquets de commandes restent identiques à l’archive
d’origine ; le recorder et le décodeur de production produisent les checkpoints.
Les 96 états finaux diffèrent de la référence d’origine v9.

Les archives précédentes restent intactes. `baseline.json` conserve la provenance,
les empreintes des commandes et de l’archive originale. `SHA256SUMS` protège cette
nouvelle archive. `sources.json` indique les empreintes du TypeScript de combat,
hors tests ; il ne représente pas une archive complète du bundle de production.

Le banc `revalidateCombatReference.ts` reste strict : un checkpoint différent est
rejeté. Le générateur `scripts/record-combo-reference.ts` refuse d’écraser un dossier
existant ; une nouvelle mesure doit être enregistrée dans un dossier neuf.
Les rapports matériels et de performance des versions précédentes restent historiques.

Les nouveaux essais de projectiles sont décrits dans
[PROJECTILE_DEFENCE.md](../../../../src/lib/fighting/PROJECTILE_DEFENCE.md).
