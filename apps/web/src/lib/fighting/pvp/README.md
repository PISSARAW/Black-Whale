# PvP privé

Le contrat utilisateur et l’autorité sont décrits dans [PVP.md](../PVP.md).
L’[étape 4](../STEP4.md) précise les générations de commandes et les limites de
la resimulation privée.

- `client.ts` valide les vues, coordonne transport, génération et présentation.
- `serverMatch.ts` est le seul arbitre qui avance le moteur et attribue les ticks.
- `rollback/frameInput.ts` définit l'entrée d'une frame (commandes et contrôles tenus des
  deux places) et le pas commun `stepPvpFrame` : place 1 puis place 2, puis le tick. L'arbitre
  l'utilise ; la session de rollback (lot L2 de
  [clash-netcode-rollback.md](../../../../../../docs/clash-netcode-rollback.md)) l'utilisera.
- `controlUpload.ts` exige manche/génération à la frontière HTTP ; `inputReceipt.ts`
  distingue les reçus courants des réponses périmées.
- `controlGate.ts` exige le relâchement après une nouvelle génération de duel.
- `inputPipeline.ts` conserve les paquets immuables et les retransmet jusqu’à reçu.
- `snapshotStream.ts` gère SSE, annulation et remplacement des flux muets.
- `prediction.ts` et `predictionHistory.ts` reconstruisent une présentation privée
  bornée ; aucun résultat de cette simulation ne repart au serveur.
- `view.ts` et `spectator.ts` filtrent les informations avant leur transmission.

Les tests de ce dossier couvrent les deux places, le roster, délais/gigue/pertes
applicatives, replays, coûts, consentements, interruptions et informations privées.
Les scénarios de `controlEpoch.test.ts` ne changent aucun pouvoir du Nen.
