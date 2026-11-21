# Combat historique — Hisoka contre Chrollo (chapitres 351 à 357)

Premier lot P0 du scénario : les règles du combat à mort, le livre préparé de Chrollo et
la machine narrative qui orchestre les actes. Aucun rendu ni aucune IA ici : ce dossier
dit **ce qui doit arriver, dans quel ordre et qui le sait**.

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

Reste à brancher : l'entrée dans le menu, la traduction des événements du moteur en temps
forts, la foule simulée, les gradins jouables et l'IA hiérarchique de Chrollo.
