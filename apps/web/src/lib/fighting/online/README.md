# Services compétitifs Clash

Les types et composants clients de l’étape 6 réutilisent les identités de saison
et les places PvP. Le serveur coordonne les files, séries et tableaux dans
`server/competition`. Aucune commande de ce service n’est un verdict de combat.

Les séries sont au premier à deux matchs gagnés ; chaque match conserve les
manches et règles ordinaires du moteur. Le point d’entrée est `/fighting/pvp/online`.
Les pages PvP existantes servent à jouer les matchs et à les regarder.
