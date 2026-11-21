# Combat historique — Hisoka contre Chrollo (chapitres 351 à 357)

Le lot P0 du scénario : les règles du combat à mort, le livre préparé de Chrollo, la
machine narrative des actes, et le monde que Chrollo exploite — foule simulée, gradins
jouables, chaîne des marionnettes et IA hiérarchique. Tout est logique pure et
déterministe ; le rendu et le moteur de duel s'y branchent.

- `acts.ts` — les sept chapitres et leurs 42 temps forts (acteur, plan chorégraphié,
  temps modifiable en semi-libre), la causalité tenue dans tous les modes et les
  fourchettes estimées de marionnettes par chapitre. Découpage et fourchettes sont
  des estimations de l'audit, à vérifier sur les cases ; les textes sont reformulés.
- `scenario.ts` — la machine d'état. `scripted` refuse tout écart, `semi-free` permet
  de sauter les seuls temps marqués `branchable` (ils deviennent des `divergences`),
  `free` accepte tout ordre. Un refus rend **le même objet**.
- `verdict.ts` — le verdict du match (Chrollo vainqueur par asphyxie) et la survie
  après le match sont deux pistes séparées ; les secours n'arrivent qu'après environ
  dix minutes narratives, la réanimation exige le verdict.
- `script.ts` — le replay canonique de référence, déterministe, et son empreinte FNV-1a.
- `checkpoints.ts` — sauvegarde par journal rejoué (jamais un état partiel), reprise au
  début de chaque chapitre et galerie de six séquences rejouables isolément.
- `knowledge.ts` — les déductions d'Hisoka et les secrets de Chrollo : le joueur Hisoka
  ne lit un secret qu'une fois la déduction faite ; les aides peuvent être coupées.
- `loadout.ts` — le livre préparé (Black Voice, Sun and Moon, Gallery Fake, Order Stamp,
  Convert Hands ; Double Face est le signet), installé contre n'importe quel adversaire.

Le format `heavens-death-match` (`../formats.ts`) n'apparaît pas dans le sélecteur du duel
libre : pas de points, pas de TKO, pas de manche, pas de chrono, et zéro PV ne termine
rien tant qu'aucune mort n'est enregistrée (`../fightOutcome.ts`).

## Le monde de Chrollo

- `stands/` — les gradins jouables. `geometry.ts` : surfaces du ring, de la fosse, des
  neuf rangées, des escaliers d'allée et du balcon (dessiné par `../stageHeavensArena.ts`,
  dimensions partagées dans `../heavensArenaLayout.ts`), rambardes ouvertes aux seules
  allées, sorties. `navigation.ts` : graphe et Dijkstra par types de déplacement
  (spectateur : marche et escaliers ; Chrollo : + sauts et chutes ; Hisoka : + course
  murale et poutre via Bungee Gum). `damage.ts` : cratères, sièges arrachés, feux,
  fumée qui réduit la visibilité.
- `crowd/` — la foule simulée : 260 spectateurs réels par défaut, place, apparence,
  peur, fuite par les sorties, bousculade, collisions, chute dans la fosse, projection,
  Bungee Gum, souffle, corps persistants, secours. Trois niveaux de détail (`lod.ts`) ;
  la nature réelle (humain, copie, contrôlé) n'est jamais exposée au rendu.
- `puppets/` — Gallery Fake → Soleil → Order Stamp → ordre collectif → bombes à deux
  marques. Fermer Gallery Fake efface les copies non marquées ; deux antennes Black Voice
  au plus ; charge de 3 s = souffle triple ; quorum de la nasse ; recensement réel
  (réserve hors de la vue d'Hisoka comprise).
- `chrolloPlan/` — l'IA hiérarchique : phase stratégique lue sur le scénario
  (`phases.ts`), tactiques par phase et réflexes (jamais de face-à-face, frappe dans le
  dos d'un Hisoka occupé puis repli, `tactics.ts`), gestes du livre page → signet →
  réouverture → page (`book.ts`), exécution (`execute.ts`), pont vers les temps forts
  (`bridge.ts`) et pas de simulation complet (`simulate.ts`). Le camp d'Hisoka et le
  moteur signalent leurs propres temps forts (`reported`) : blessures, ensevelissement.

`canonicalRun.test.ts` joue le plan du début à l'explosion finale en mode scripté, avec
un remplaçant du camp d'Hisoka, et vérifie qu'il se rejoue à l'identique.

Reste à brancher : l'entrée « Combat historique » du menu, le pas du monde dans la boucle
du duel (positions 3D des combattants ↔ voie 2D), le rendu de la foule depuis
`crowdInstances`, l'IA d'Hisoka (P1) et les blessures mesurées par le moteur (P1).
