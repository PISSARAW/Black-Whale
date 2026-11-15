# Fighting

`fighting` est le mode de duel 2D du Black Whale. Il reprend les personnages et
leurs Hatsu canoniques, mais utilise un moteur arcade autonome : aucune sauvegarde,
campagne ou règle n'est partagée avec l'Arena 3D.

## Contrat

- `roster.ts` décrit les combattants disponibles et leur identité visuelle.
- Le roster jouable compte onze personnages. Feitan, Saiyu, Theta, Biscuit et
  Marayam rejoignent les six combattants initiaux ; Chrollo dispose désormais de
  Black Voice et Sun and Moon en plus de sa logique de copie via Skill Hunter.
- Les nouveaux Hatsu ont des effets propres : Rising Sun gagne en puissance avec
  les blessures, Three Monkeys scelle les sens, le projectile de Theta neutralise
  l'aura, la transformation de Biscuit renforce attaque et défense, et la chambre
  1013 de Marayam annule le prochain impact.
- `fightStyles.ts` donne à chacun sa distance, son tempo, ses priorités d'IA et
  ses réglages de coups ; `normalFightMoves.ts` traduit ce profil en gestuelle.
- Les corps, visages, coiffures et costumes viennent du rig partagé de la visite
  (`tour/humanFigure.ts`) et des ressemblances déclarées dans `appearance.json`.
- `engine.ts` est le moteur pur : simulation déterministe à 60 images/s, mouvement,
  garde, impacts, aura, IA et verdict.
- `frameData.ts` décrit les phases de chaque coup en frames, ses boîtes, ses stuns,
  son hitstop, son recul et sa fenêtre de buffer.
- `hatsu/registry.ts` associe chaque combattant à un contrat `FighterHatsu`. Chaque
  Hatsu vit dans son propre module et reçoit les crochets de déclenchement, d'impact
  et de frame ; le Bungee Gum ne dépend donc plus de `engine.ts`.
- `projectiles.ts` fait apparaître, avancer et expirer les tirs. Seuls les
  projectiles attestés sont propres au combattant ; les autres lancent une pierre,
  sans leur inventer de technique de Nen. Les collisions sont transmises à
  `combatImpact.ts`, qui leur applique la même garde, parade, aura et décision de
  score qu'aux coups physiques.
- `FightScene.svelte` rend les deux rigs, le décor, les impacts et la caméra dans
  une seule scène WebGL. Les portraits de sélection restent des instantanés séparés.
- `stages.ts` liste les terrains. La soute et la Tour Céleste sont dessinées ici
  (`stageScenery.ts`, `stageHeavensArena.ts`) ; les salles du navire sont levées depuis
  le plan de la visite (`stageShipRoom.ts`) et la bande de combat y est dérivée de
  l'emprise et du mobilier (`stageLane.ts`). Le mobilier modélisé de la visite est repris
  tel quel (`stageRoomDetails.ts`) : une salle ajoutée que la visite habille doit y
  inscrire son constructeur. Un terrain ne change aucune règle.
- `/fighting` rend la sélection et les contrôles clavier/tactiles.
- Une partie dure soixante secondes et se termine par K.-O., à dix points Tour
  Céleste, ou par décision (points Tour puis vie restante).

Le joueur utilise Q/D ou les flèches pour se déplacer, Z ou flèche haute pour
sauter, S ou flèche basse pour se baisser, Maj/I pour garder, J/K pour les coups,
L pour le Hatsu et U pour le projectile propre au combattant. Espace est l'unique bouton Aura : maintenu seul il produit
Ren, avec garde Ken, avec bas Zetsu et avec haut Gyo. Le relâcher pendant l'amorce
d'un coup engage Ko. Ten est l'état de repos et Ryu dépend du timing de garde et
de riposte, sans touche dédiée.

La tranche verticale de référence est Kurapika contre Hisoka. Elle conserve le rig
procédural partagé : les coups sont posés par code et suivent les frames du moteur.
Le passage à des modèles glTF skinnés pourra remplacer cette couche de présentation
sans changer les règles, les boîtes ni les données de frame.

## Duel et règles d’échange

- Bas + J/K produit une variante basse ; saut + J/K produit une attaque aérienne.
  Les coups bas exigent une garde accroupie et les aériens une garde debout.
- O (ou le bouton tactile O) projette à courte portée et traverse la garde.
  O pendant l’amorce adverse protège huit frames contre la projection. Une cible
  aérienne ou en hitstun/blockstun ne peut pas être projetée.
- Sur touche confirmée uniquement : J → K → L, dans la fenêtre `cancelEnd`.
  Aucun cancel sur garde, esquive ou coup dans le vide ; aucune boucle inverse.
  Kurapika et Hisoka disposent du hitstun nécessaire aux trois coups.
- Les Hatsu en buffer déclenchent leurs effets et paient leur coût au départ
  effectif du coup, après revalidation des ressources.
- Les frappes simultanées sont évaluées sur le même état ; un double K.-O.
  ou une arrivée simultanée à dix points donne une égalité.
