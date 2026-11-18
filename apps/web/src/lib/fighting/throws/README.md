# Projections personnelles

Couverture : `fighting/throws/**`, `superThrow.ts`, `throwCinematic*.ts`,
`throwPresentationLayer.ts`, `components/fighting/FightThrowCinematic.svelte`
et `FightThrowGuide.svelte`.

Les vingt premières paires appartiennent aux combattants du tableau. Chaque paire
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
| Franklin | Le lancer de cargaison | Le débarquement |
| Machi | Le point de croix | La bobine |
| Illumi | L’articulation inutile | Le pantin désaccordé |
| Kalluto | Le paravent blanc | La révérence interrompue |
| Bonolenov | La valse du guerrier | Prologue : le renversement / Le dernier accord |
| Shizuku | Un coup de balai | Le grand ménage |
| Hinrigh | La poignée de main des Xi-Yu | Le bras droit |
| Mizaistom | Veuillez rester ici | Fin de la déposition |
| Leorio | La consultation express | La visite à domicile |
| Hanzo | Dans votre dos | La chute de la lune |

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

Franklin soulève la cible à deux bras et la lance en hauteur ; sa super la porte
avant de la décharger en rotation. Aucun tir de doigt n’accompagne ces prises.
Machi croise un poignet et une cheville, puis enroule le torse dans sa super.
Les fils suivent les repères réels et respectent Nen, In et Gyo, sans créer
d’attachement de combat. Illumi plie les articulations et montre ses aiguilles
seulement si elles sont réellement disponibles ; aucune aiguille n’est implantée
et aucun contrôle mental n’est offert par le film. Kalluto dissimule la prise
physique derrière un écran de papier et finit sa super sur une révérence ; les
confettis n’infligent aucun dégât et ne plantent aucun papier de surveillance.
Bonolenov rythme la projection sur trois appuis. Sa super emprunte la lance déjà
invoquée par une préparation réelle de Prologue, dont la caméra cadre toute la
longueur. Sans elle, le même renversement physique porte le titre « Le dernier
accord ». Aucun Prologue, Jupiter ou costume n’est créé par une projection.

Shizuku oriente son vrai Blinky sous les jambes pour la normale et l’utilise comme
levier de rotation pour la super. La main de soutien rejoint l’outil et la caméra
cadre sa géométrie complète. Aucun être vivant n’est aspiré. Hinrigh présente
seulement des menottes effectivement portées et peut faire intervenir un pigeon
Biohazard déjà transformé, vivant et proche. Le film ne transforme ni ne crée
aucun objet et n’applique pas de nouvelle immobilisation. Mizaistom montre sa
carte jaune puis exécute une prise d’arrestation ; le retournement de carte reste
réservé à une véritable réclusion déjà obtenue. Aucune sommation ou cage n’est
offerte par la cinématique. Leorio déséquilibre au col pour la normale ; sa super
frappe le sol et fait surgir le poing émis existant sous le bassin adverse. Ce
poing représente l’unique impact de la super, sans projectile ni dégât ajouté.
Hanzo contourne réellement le corps pour sa normale et ferme ses jambes autour
des épaules pendant le retournement aérien de sa super. Il retrouve ses appuis
avant la reprise du combat, sans créer de double ni déclencher Hanzo Skill 4.

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
PvP/replay. Les tests de ce dossier couvrent les quarante chorégraphies et les témoins
conditionnels produits par les vraies commandes. `secondBatch.test.ts` vérifie
les trajectoires des attaquants, les formes réelles et les ressources préservées.
`thirdBatch.test.ts` couvre les accessoires conditionnels, la préparation réelle
de Prologue, la visibilité de In et l’absence de mutation de l’état par le rendu.
`fourthBatch.test.ts` contrôle les menottes réelles, le pigeon préparé, les refus
de Nen, le déplacement de Hanzo et l’absence de conséquence ajoutée par le rendu.

Depuis `apps/web`, `node scripts/check-fighting-throw-roster.mjs` capture les quarante
projections en P1/P2 et leurs quatre plans, puis les vingt vues en 320 px. Il
contrôle aussi la pause, le K.-O., le nettoyage et les mouvements réduits.
Résultats : `/tmp/black-whale-five-throws`.

`THROW_ROSTER_BATCH=second` sélectionne Feitan, Saiyu, Theta, Biscuit et Phinks
dans ce contrôle ou dans `scripts/render-fighting-throws.mjs`.
`THROW_ROSTER_BATCH=third` sélectionne Franklin, Machi, Illumi, Kalluto et Bonolenov.
`THROW_ROSTER_BATCH=fourth` sélectionne Shizuku, Hinrigh, Mizaistom, Leorio et Hanzo.
Pour chaque lot, le rendu exporte les dix films, cinq comparaisons normale/super et leurs aperçus GIF. Le répertoire
de sortie se règle avec `THROW_RENDER_OUTPUT`.
