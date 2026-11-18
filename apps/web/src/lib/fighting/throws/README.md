# Projections personnelles

Couverture : `fighting/throws/**`, `superThrow.ts`, `throwCinematic*.ts`,
`throwPresentationLayer.ts`, `components/fighting/FightThrowCinematic.svelte`
et `FightThrowGuide.svelte`.

Les dix premières paires appartiennent aux combattants du tableau. Chaque paire
fournit des poses articulées pour les deux corps,
une trajectoire de prise et de chute, et une direction de caméra distincte.

| Combattant | Projection | Aura + projection |
|---|---|---|
| Kurapika | Le pendule du jugement | Le dernier maillon |
| Hisoka | Retour à l'envoyeur | Le trapèze |
| Chrollo | La page tournée | Le public participe / Double Face |
| Benjamin | Neutralisation réglementaire | Mise aux arrêts |
| Tserriednich | La pièce de collection | Le futur manqué / Composition brisée |
| Feitan | Le parapluie se referme | La petite roue |
| Saiyu | Le grand levier | La roue du singe |
| Theta | Désarmer la menace | Angle mort |
| Biscuit | La leçon de politesse | La correction magistrale |
| Phinks | L'essoreuse | Le changement de vitesse |

Ces gestes et leurs noms sont des créations arcade pour Clash. Les chaînes
réutilisent les maillons et le pendule de la visite, le gum son modèle existant,
et Chrollo son vrai livre en main droite. Le maillon final vise la cheville du
rig réel. Les prises physiques alignent les mains après l'animation des deux corps.

Feitan oriente son parapluie réellement porté sous le genou adverse ; sa super
déplace son propre corps pour la roue. Saiyu réutilise le bâton de la visite,
avec deux appuis manuels et un pied de perche conservé au sol pendant le saut.
La caméra tient compte de tout le bâton. L'arme confisquée de Feitan reste absente,
et le bâton de Saiyu respecte l'accès au Nen et la visibilité de In.
Theta range temporairement son propre pistolet et le reprend ensuite : aucune
balle n'est tirée. Biscuit conserve le corps réellement choisi, compact ou naturel,
sans transformation offerte par la super. Phinks fait tourner le corps adverse ;
la super inverse sa trajectoire, sans charger ni consommer Ripper Cyclotron.

## Commandes et règles

Les 40 combattants peuvent lancer une projection normale ou une super avec
Aura maintenue au moment de la commande. La super coûte 25 points de Nen au
départ effectif, augmente les dégâts de base de 50 %, le hitstop de 3 frames,
le hitstun de 6 et la poussée de 15 %. Un raté ou une déprojection conserve
le coût engagé. Le buffer réserve le choix sans prélever avant le départ.
Relâcher Aura ne déclenche pas un deuxième achat de Ko. Un manque de réserve
ou un Nen indisponible refuse la super ; la projection normale reste accessible
selon les contraintes physiques habituelles.

La récupération est d'au moins 54 frames pour la normale et 84 pour la super.
La mise au sol du défenseur couvre ce déroulement avec 8 frames supplémentaires.
La séquence occupe environ une seconde, ou une seconde et demie pour la super,
hitstop compris. Une super garde les mêmes possibilités de déprojection.
Les commandes locales, tactiles, manette, PvP et replays partagent ce chemin.
La règle de replay passe à `clash-combat-48`.

## Plans et conditions

`camera.ts` dirige quatre plans : détail de la prise ou de l'accessoire,
orbite lisant le renversement, angle d'impact, puis tenue du résultat. La prise
de Kurapika renforcée commence sur la cheville ; Chrollo est filmé depuis le
côté de son livre ; Benjamin reçoit une plongée de plaquage ; Tserriednich
commence sur une composition frontale. Les objectifs se recadrent sur les
repères réels, avec recherche continue du recul en portrait. Les gros plans
peuvent volontairement couper les corps, tandis que les plans d'action cadrent
les deux silhouettes. Les dernières frames retrouvent la caméra de combat.

L'habillage masque le HUD et les appels de dégâts pendant le film. Les bandes
et le titre disparaissent avec les préférences de mouvements réduits ou de
caméra stable. La pause et le hitstop figent les gestes, effets et plans.

Le pantin participant doit déjà exister, appartenir à Chrollo, être ordonné,
intact et proche. Sans lui, sa super reste une projection personnelle renforcée.
La silhouette prévue de Tserriednich provient d'une véritable branche divergente
et n'est visible que depuis son point de vue. Sans cette branche, sa super
reste physique. Aucun pantin, futur, attachement persistant ou effet de Chain Jail
n'est créé par une présentation. Le Nen inaccessible masque les accessoires
correspondants. Le rendu ne modifie ni les coordonnées ni les blessures du moteur.

## Vérification

`superThrow.test.ts` couvre le coût, la puissance et les refus des 40 combattants,
le buffer, les deux sièges, les déprojections, la dépense unique et les chemins
PvP/replay. Les tests de ce dossier couvrent les vingt chorégraphies et les témoins
conditionnels produits par les vraies commandes. `secondBatch.test.ts` vérifie
les trajectoires des attaquants, les formes réelles et les ressources préservées.

Depuis `apps/web`, `node scripts/check-fighting-throw-roster.mjs` capture les vingt
projections en P1/P2 et leurs quatre plans, puis les dix vues en 320 px. Il
contrôle aussi la pause, le K.-O., le nettoyage et les mouvements réduits.
Résultats : `/tmp/black-whale-five-throws`.

`THROW_ROSTER_BATCH=second` sélectionne Feitan, Saiyu, Theta, Biscuit et Phinks
dans ce contrôle ou dans `scripts/render-fighting-throws.mjs`. Le rendu exporte
les dix films, cinq comparaisons normale/super et leurs aperçus GIF. Le répertoire
de sortie se règle avec `THROW_RENDER_OUTPUT`.
