# Référence de combat 25

Les 96 flux de commandes originaux, rejoués sous `clash-combat-25` : lot 2 de la
[grammaire de combo](../../../../src/lib/fighting/COMBO_GRAMMAR.md). Les flux figés
utilisent le schéma simplifié par défaut ; les supers de Kurapika et Benjamin y
perdent 20 % de dégâts. Le schéma classique et ses manipulations sont vérifiés par
`controlScheme.test.ts`, car aucun flux figé ne contient de quart de cercle.

Le numéro 24 est volontairement sauté : une autre branche l’utilise pour les
techniques avancées du Nen. Les archives antérieures restent intactes.

`baseline.json` décrit chaque état initial et final, `replays.tar.gz` contient les
replays avec leurs checkpoints, `sources.json` identifie les sources utilisées et
`SHA256SUMS` permet de vérifier les fichiers archivés.
