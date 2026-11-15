# Fighting

`fighting` est le mode de duel 2D du Black Whale. Il reprend les personnages et
leurs Hatsu canoniques, mais utilise un moteur arcade autonome : aucune sauvegarde,
campagne ou règle n'est partagée avec l'Arena 3D.

## Contrat

- `roster.ts` décrit les combattants disponibles et leur identité visuelle.
- `fightStyles.ts` donne à chacun sa distance, son tempo, ses priorités d'IA et
  ses réglages de coups ; `normalFightMoves.ts` traduit ce profil en gestuelle.
- Les corps, visages, coiffures et costumes viennent du rig partagé de la visite
  (`tour/humanFigure.ts`) et des ressemblances déclarées dans `appearance.json`.
- `engine.ts` est le moteur pur : simulation déterministe à 60 images/s, mouvement,
  garde, impacts, aura, IA et verdict.
- `frameData.ts` décrit les phases de chaque coup en frames, ses boîtes, ses stuns,
  son hitstop, son recul et sa fenêtre de buffer.
- `FightScene.svelte` rend les deux rigs, le décor, les impacts et la caméra dans
  une seule scène WebGL. Les portraits de sélection restent des instantanés séparés.
- `stages.ts` liste les terrains. La soute et la Tour Céleste sont dessinées ici
  (`stageScenery.ts`, `stageHeavensArena.ts`) ; les salles du navire sont levées depuis
  le plan de la visite (`stageShipRoom.ts`) et la bande de combat y est dérivée de
  l'emprise et du mobilier (`stageLane.ts`). Le mobilier modélisé de la visite est repris
  tel quel (`stageRoomDetails.ts`) : une salle ajoutée que la visite habille doit y
  inscrire son constructeur. Un terrain ne change aucune règle.
- `/fighting` rend la sélection et les contrôles clavier/tactiles.
- Une partie dure soixante secondes et se termine par K.-O. ou décision aux points
  de vie restants.

Le joueur utilise Q/D ou les flèches pour se déplacer, Z ou flèche haute pour
sauter, S ou flèche basse pour garder, puis J, K et L pour les trois attaques.

La tranche verticale de référence est Kurapika contre Hisoka. Elle conserve le rig
procédural partagé : les coups sont posés par code et suivent les frames du moteur.
Le passage à des modèles glTF skinnés pourra remplacer cette couche de présentation
sans changer les règles, les boîtes ni les données de frame.
