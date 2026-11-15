# Fighting

`fighting` est le mode de duel 2D du Black Whale. Il reprend les personnages et
leurs Hatsu canoniques, mais utilise un moteur arcade autonome : aucune sauvegarde,
campagne ou règle n'est partagée avec l'Arena 3D.

## Contrat

- `roster.ts` décrit les combattants disponibles et leur identité visuelle.
- Les corps, visages, coiffures et costumes viennent du rig partagé de la visite
  (`tour/humanFigure.ts`) et des ressemblances déclarées dans `appearance.json`.
- `engine.ts` est le moteur pur : mouvement, garde, impacts, aura, IA et verdict.
- `/fighting` rend la sélection, la scène et les contrôles clavier/tactiles.
- Une partie dure soixante secondes et se termine par K.-O. ou décision aux points
  de vie restants.

Le joueur utilise Q/D ou les flèches pour se déplacer, Z ou flèche haute pour
sauter, S ou flèche basse pour garder, puis J, K et L pour les trois attaques.
