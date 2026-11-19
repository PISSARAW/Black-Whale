# Référence de combat 28

Les 96 flux de commandes originaux, rejoués sous `clash-combat-28` : lot 5 de la
[grammaire de combo](../../../../src/lib/fighting/COMBO_GRAMMAR.md). L’IA confirme ses
touches et presse sur garde (`aiComboFollowUp.ts`). Les flux figés sont des routes
d’entraînement sans IA : leurs états finaux ne changent pas depuis `v27`, mais les
replays contre l’IA d’avant `clash-combat-28` ne se rejouent plus à l’identique. Les
archives antérieures restent intactes.

`baseline.json` décrit chaque état initial et final, `replays.tar.gz` contient les
replays avec leurs checkpoints, `sources.json` identifie les sources utilisées et
`SHA256SUMS` permet de vérifier les fichiers archivés.
