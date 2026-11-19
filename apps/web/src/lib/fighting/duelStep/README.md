# Pas de simulation du duel · kaméos, lot 1

`engine.ts` orchestre une frame en quatre phases, sans changement de comportement
par rapport à l'ancien `stepFight` (vérifié par `engineCharacterization.test.ts`) :

1. `frame.ts` · `openFrame` : horloges partagées (Predator, Cat's Name, Empereur,
   hitstop), préparation et arène, avant tout mouvement de corps.
2. `actors.ts` · `stepActors` : entrées, IA, physique et horloges propres à chaque
   corps. Une fois par corps et par frame.
3. `contacts.ts` · `settleBodies` puis `resolveContacts` : collisions d'arène,
   jugements, paroles, commandes tamponnées et Hatsu, puis coups, projectiles,
   impacts et pushbox entre les deux corps.
4. `frame.ts` · `closeFrame` : compteur de frames, chrono de manche et fin au temps.

`settleBodies` mêle encore du travail par corps et du travail par paire. Le lot 3
de [KAMEOS.md](../KAMEOS.md) le sépare avant d'ajouter une seconde paire.
