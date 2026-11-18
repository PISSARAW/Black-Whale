# Clash · Bungee Gum · règles 25

Cette référence conserve les 96 flux de commandes de l’archive d’origine et
les rejoue sous `clash-combat-25`. Les états initiaux sont vérifiés avant tout
réenregistrement ; les paquets de commandes restent identiques. Les archives
précédentes, dont v24, restent conservées.

Le changement porte sur les attaches multiples d’Hisoka, les origines mains/pieds,
les ancrages du décor, la mobilité verticale, les objets rappelables et l’IA.
Les liens et objets participent aux snapshots, aux prévisions et à la visibilité
privée du PvP. Les objets réels gardent leur identité pendant rappel et relance.

`baseline.json` donne les empreintes par séquence, `sources.json` les sources
mesurées, `SHA256SUMS` la somme de l’archive `replays.tar.gz`.

Contrôles complémentaires : `bungeeNetwork.test.ts`, les suites Hisoka,
projectiles, arène, équipes, copies de Chrollo, En, Furykov, PvP et Parallel Future,
ainsi que `node apps/web/scripts/check-hisoka-network.mjs` sur ordinateur et mobile.
