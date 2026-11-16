# Phase 9 : analyse, équipes et classement durable

Cette phase poursuit les trois axes choisis après le plan initial en huit étapes.
Elle conserve le duel et ses règles ordinaires comme référence.

## Revoir une situation et essayer une réponse

`fightReplayPlayer.ts` reconstruit une position depuis l’état initial et les lots
de commandes enregistrés. Le curseur choisit un indice de paquet : un paquet peut
contenir zéro, une ou plusieurs frames. « Pas précédent » n’est donc pas présenté
comme une frame. La reconstruction garde les durées exactes, l’accumulateur, le RNG
et les commandes des panneaux ; les checkpoints restent vérifiés. Elle traite au
plus 240 paquets par rendu. Déplacer le curseur annule la recherche précédente.

Une divergence interdit la reprise du contrôle. Les états terminés, les vues PvP
privées, les spectateurs, les simulations de prévision et le format équipes ne
peuvent pas devenir un essai de duel. Un extrait encore en combat peut être repris
à sa dernière position, même si le fichier s’arrête à cet endroit.

`fightReplayPractice.ts` clone le véritable état du simulateur. P1 et P2 sont alors
manuels en versus local ; l’IA et les rétablissements de ressources du laboratoire
cessent. Aucune préparation, page copiée, arme, aura ou résurrection n’est fournie.
Les entraves, attaques et buffers déjà engagés restent présents. Parallel Future
conserve ses corps réels, sa vision et la commande d’ouverture des yeux ; Cat’s
Name garde sa séquence et sa cause de décès. Le rendu ne sert jamais de sauvegarde.

« Répéter cet essai » repart de la même position et vide les nouvelles commandes
en attente. « Retour à la relecture » retrouve le curseur suspendu ; « Quitter le
replay » retrouve ensuite le combat initial, sa pause et sa capture. Les frames de
l’essai n’entrent pas dans le fichier source, la carrière ou le classement. Une
revanche normale explicitement lancée recommence un duel ordinaire.

## Équipes locales et assistances par relais

`/fighting/teams` prépare deux groupes de trois personnages distincts, choisis
dans les quarante combattants, sur le terrain sélectionné. Les contrôles clavier,
manettes, tactiles et panneaux de Hatsu utilisent les commandes ordinaires. Il
s’agit de stocks successifs : chaque KO, défaite technique ou défaite au temps
élimine le corps effectivement en scène. Un double KO peut éliminer les deux.
Le dernier groupe encore vivant gagne ; l’élimination des deux groupes donne nul.

Le survivant garde ses PV et son aura. « Prochain combattant » utilise la frontière
de manche du moteur pour les manifestations, munitions et préparatifs ; les coûts
de vie, connaissances et conséquences que le moteur conserve restent attachés au
bon corps. Les réserves ne récupèrent ni santé ni aura hors scène.

Chaque groupe peut appeler une assistance une seule fois dans le set. C’est un
**relais temporaire**, avec un seul corps du groupe dans le duel à un instant donné.
Il n’y a pas de troisième attaquant simultané ni de bonus de dégâts. Le demandeur
doit rejoindre son bord, être au sol et libre, et avoir son Nen au repos. Les
projections, liens, contrats, manifestations ou états particuliers empêchent une
sortie qui suspendrait leurs conditions ou leur horloge. Les contrôles de repos sont
volontairement conservateurs : un corps engagé ne disparaît pas pour annuler une
faiblesse ou échapper à un coup.

L’allié entre au même bord avec son propre corps, ses ressources et son équipement.
Il marche, tente une fois un léger normal puis revient à pied ; après 120 frames
d’approche il tente le geste même si la cible reste trop loin. Le léger passe par
`performMove`, les collisions, coûts, gardes et interruptions du moteur. Le joueur
peut également commander le corps actuellement en scène ; ses engagements de Nen
peuvent empêcher la sortie. Un allié qui ne peut pas sortir reste la cible réelle.
Il est vulnérable, peut être projeté ou tué, et consomme son propre stock. Le leader
retiré ne fournit ni pouvoir ni aura à son remplaçant.

`moonlightParties.ts` attache les accords signés en équipes aux deux identités
effectives. Un remplaçant n’hérite pas d’une signature, d’une récompense ou d’une
sanction ; le signataire survivant garde son obligation. Le rendu du contrat ne
relie pas deux personnes qui ne l’ont pas signé. Cat’s Name est résolu avant de
compter les stocks ou de rendre un corps à son leader.

Ce format est local. Il n’est pas envoyé aux salons PvP, à la carrière ou au
classement. La capture et la reprise des replays à deux corps y sont indisponibles.
Les assistances simultanées nécessiteraient un moteur de cibles multiples et
restent en dehors de ce relais.

## Classement conservé après redémarrage

`clashSeasons.ts` accepte un stockage injecté. Le serveur courant utilise
`clashSeasonFile.ts` et conserve identités, saisons et identifiants des résultats
déjà comptés. Le fichier versionné est validé au chargement. Les jetons des
navigateurs sont retrouvés par leur SHA-256 ; le fichier ne contient pas leurs
valeurs utilisables comme identifiants d’accès.

L’écriture utilise un fichier temporaire privé (0600), sa synchronisation puis
un renommage atomique. Un échec laisse le précédent fichier intact et annule la
mutation en mémoire. Une inscription échouée ne délivre aucune identité ; un
verdict non écrit peut être retenté lors d’une nouvelle consultation du salon,
sans double comptage. Le duel reste terminé même si le disque est indisponible.
Une sauvegarde endommagée ne devient jamais automatiquement un classement vide.
Le panneau indique l’indisponibilité ; une réparation du fichier puis un
redémarrage permettent de le recharger.

Le chemin est `CLASH_DATA_DIR/seasons.json`, avec `.clash-data` comme répertoire
par défaut relatif au processus web. `.gitignore` exclut ce répertoire. En
production, définir **un chemin absolu sur un volume durable**, conservé entre
les versions du serveur, et sauvegarder ce volume. Une seule instance de
coordination écrit ce fichier. Ce stockage n’est pas une base partagée pour des
workers ou serveurs concurrents ; le déploiement multi-instance n’est pas ajouté.

Les règles mensuelles UTC, Elo, bornes et autorité des verdicts de la phase 8
restent identiques. Les invitations de combat restent volatiles ; les identités
et résultats validés survivent. Aucun résultat local, essai ou tableau de tournoi
ne peut alimenter ce classement.

## Vérifier

Les tests `fightReplayReview.test.ts`, `teamMatch.test.ts` et
`server/clashSeasonFile.test.ts` couvrent les reconstructions, coûts et corps du
Nen, les quarante entrées de relais, les éliminations réelles, les signataires,
la restauration du fichier, les échecs et les reçus uniques. Les suites de replay,
de Nen et de PvP restent des régressions complémentaires.

`node apps/web/scripts/check-fighting-phase9.mjs` vérifie les composants de
production : relecture, reprise et répétition, classement après deux vraies manches
serveur puis réouverture du registre, commande clavier d’approche du bord,
appel d’allié, pause, anglais et largeurs 1440, 390 et 320 px. Ce contrôle utilise
le rendu de secours ; il ne mesure pas la performance WebGL ou la latence physique.
