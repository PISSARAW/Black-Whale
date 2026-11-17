# Réactivité locale et PvP

L’[étape 2](./STEP2.md) complète les profils graphiques, la lecture des contacts
et la qualification Xbox locale. Le diagnostic de manette mesure la lecture par
le navigateur ; il ne remplace pas une mesure physique manette-écran.

L’[étape 4](./STEP4.md) ajoute le protocole `clash-pvp-5`, les générations de
commandes et la qualification des reprises ; les rapports historiques ci-dessous
gardent leurs versions et périmètres d’origine.

Objectif : afficher plus tôt les contrôles des 40 personnages jouables
sans déléguer au navigateur le Nen, les contacts ou le résultat du duel.

## Comportement livré

En local, le corps contrôlé utilise la position du dernier tick terminé. L’ancien
interpolateur affichait encore le tick précédent au début de chaque pas ; cette
attente d’affichage, jusqu’à 16,7 ms à 60 Hz, disparaît pour P1 et P2 local.
Le moteur, ses pas fixes, les fenêtres de combo et les enregistrements ne changent pas.

En PvP, les contrôles sont lus sur chaque frame. Les commandes HTTP restent
séquencées et idempotentes, avec une requête en vol et un budget d’envoi borné.
Le flux privé SSE pousse les vues confirmées indépendamment du trajet des commandes.
Le client distingue réception et application effective, ignore les anciennes
révisions, réapplique ses intentions non consommées et amortit les petits écarts.

La prédiction est une simulation privée du moteur existant, depuis une vue déjà
filtrée. Seuls position, orientation, mouvement, pose, garde et animation du corps
contrôlé en sortent. Ni le HUD, ni les ressources, ni les effets de Hatsu, ni les
contacts, ni les résultats de replay n’utilisent cet état provisoire. Une réaction
confirmée (stun, hitstop, chute, K.-O.) reprend immédiatement la main.
Les positions publiques adverses sont extrapolées sur deux ticks au maximum.

Le travail de prédiction est limité à douze ticks. Lors d’une réconciliation,
quatre ticks restent disponibles pour les prochaines entrées : les délais de
reçus ne doivent pas saturer durablement la fenêtre de présentation. Cette
compression concerne l’animation ; seul l’accusé appliqué retire une intention.
Après 250 ms sans autorité fraîche, l’affichage revient au confirmé. Les états
de Parallel Future et Cat’s Name utilisent aussi ce repli pendant leur séquence
active. Les pages copiées de Chrollo sont couvertes. Le changement de corps de Hanzo
attend la confirmation ; les déplacements de sa projection confirmée sont anticipés.

C’est une prédiction de présentation avec réconciliation serveur. Le délai de
confirmation d’un impact reste celui du serveur. Ce n’est pas un rollback complet
à deux joueurs ni une garantie de qualité sur Internet.

## Vérifications reproductibles

Depuis `apps/web` :

```sh
pnpm exec vitest run src/lib/fighting/pvp src/lib/server/clashPvp.test.ts \
  src/lib/server/clashPvpHttp.test.ts src/lib/server/clashPvpStream.test.ts \
  src/lib/fighting/fightVisualPrediction.test.ts --maxWorkers=1 --minWorkers=1
RESPONSE_OUTPUT=/tmp/clash-response RESPONSE_SECONDS=45 \
  node scripts/check-fighting-response.mjs
node scripts/check-fighting-pvp.mjs
# Avec le serveur de production déjà lancé :
RESPONSE_BASE_URL=http://127.0.0.1:4177 node scripts/check-fighting-response-endpoint.mjs
```

Le banc produit des bundles client et serveur de production et utilise deux
contextes navigateur séparés. Seul le premier rend la scène WebGL. Le proxy
d’essai ajoute 100 ms d’aller-retour, du jitter et des pertes applicatives :
un reçu HTTP supprimé après application et une vue SSE sautée sur cent. Le banc
exige que le flux privé soit réellement actif. Le scénario utilise la salle de
banquet, le bloom, DPR 2 plafonné à 1,75, les déplacements ordinaires et une garde
adverse. Chaque personnage possède un passage avant/après. Le rapport compte aussi les
animations non observées avant l’essai suivant ; le passage « après » exige une
animation pour chaque essai. Les quantiles de délai portent sur les animations
observées, ce qui évite de présenter une absence d’animation comme un délai nul.

« Avant » reproduit l’ancien ordonnancement : réponse HTTP puis attente de 50 ms,
sans projection anticipée. Il utilise le même moteur et la même scène que
« après » ; ce n’est pas une compilation historique intégrale. La mesure part de
la mise en file d’un coup jusqu’au rendu effectif de sa première animation dans
la scène. Elle n’inclut pas le matériel d’entrée, le balayage de l’écran ni le
délai de confirmation des dégâts. CPU et GPU sont des diagnostics séparés de la
cadence présentée ; les requêtes GPU ANGLE Metal ne sont pas un temps écran.

La matrice déterministe couvre les seize confrontations ordonnées, chacune à
0/50/100/150 ms de RTT simulé, avec jitter, reçus dupliqués et vues manquées.
Chaque état serveur est comparé au moteur de référence ; le journal effectivement
admis est relu jusqu’à la même empreinte. Les autres tests couvrent les limites
de travail, les séquences reçues/appliquées, la confidentialité du Nen, les vues
désordonnées, les corps de flux annulés, les resets et la reprise de séquence.

## Extension au roster complet

`predictionPolicy.ts` utilise directement `FIGHTING_ROSTER` : aucun combattant
ni adversaire n’est sélectionné par une liste de quatre noms. Le transport,
les accusés reçus/appliqués et le journal local restent communs aux 40 identités.
Les commandes nommées (papier, Battle Cantabile, poème, appels, contrats,
conversation et gestes) passent par les mêmes conditions du moteur privé avant
leur réconciliation. Leurs états de Nen ne sont jamais publiés de façon provisoire.

La matrice de démarrage/réconciliation/replay couvre les **1 600 affrontements**.
Les 40 places P2, les 40 contrôles locaux et les conditions de Zetsu sont aussi
vérifiés. En complément des seize duels initiaux, quarante confrontations réparties
sur le roster utilisent chacune 0/50/100/150 ms de RTT simulé avec jitter et reçus
dupliqués. Les séquences temporelles sont testées séparément pour vérifier qu’un
tick de présentation ne déclenche jamais une prévision de 600 ticks.

```sh
RESPONSE_ROSTER=1 RESPONSE_AFTER_ONLY=1 RESPONSE_SECONDS=10 \
  RESPONSE_WARMUP_MS=3000 RESPONSE_OUTPUT=/tmp/clash-response-roster \
  node scripts/check-fighting-response.mjs
```

Le banc récupère la liste depuis le bundle serveur. Cette campagne mesure chacun
des 40 personnages, avec deux places privées, cinq entrées et dix secondes de
mesure nominale après échauffement. Le rapport indique les frames réellement
observées, les pics, la latence de démarrage et les éventuelles animations manquées.
La campagne historique ci-dessous conserve son périmètre de quatre références.

## Mesures des 40 personnages sur secteur

La campagne du 16 novembre 2026 sur Apple M5 / 16 Go, Chrome 157 / ANGLE Metal,
valide les 40 corps à **60 FPS**, avec **24 003 frames**, aucune au-delà de 25 ms,
et un intervalle p99 de **16,8 ms**. Les **200 essais sur 200** ont une animation
observée ; le démarrage visuel p95 varie de **12,5 à 18,9 ms** selon le personnage.
Le RTT imposé est de 100 ms, avec jitter, 80 reçus HTTP supprimés et 320 vues SSE
sautées sur l’ensemble de la campagne. Les ressources, contacts et verdicts restent
confirmés par le serveur.

Une première série a été interrompue quand le Mac, à 19 % de batterie en économie
d’énergie, a plafonné le navigateur à 30 Hz. Les 40 passages ont été refaits sur
secteur, avec les mêmes réglages de qualité (DPR 2 plafonné à 1,75, bloom, salle de
banquet). Les traces de la série interrompue sont identifiées séparément.

Chaque personnage affronte Chrollo ; Chrollo affronte Hisoka. Les 1 600 paires sont
couvertes par les tests déterministes, tandis que ces 40 passages mesurent le rendu.
Cinq essais par personnage constituent un contrôle court du roster, pas une mesure
de latence physique ni une validation exhaustive de tous les effets de Hatsu.
Les séquences temporelles et post-mortem conservent leur repli confirmé.

| Personnage | FPS | Démarrage visuel p95 |
| --- | ---: | ---: |
| Kurapika | 60,00 | 16,9 ms |
| Hisoka | 60,00 | 14,5 ms |
| Chrollo | 60,00 | 15,6 ms |
| Benjamin | 60,00 | 12,5 ms |
| Tserriednich | 60,00 | 12,5 ms |
| Feitan | 60,00 | 16,2 ms |
| Saiyu | 60,00 | 14,7 ms |
| Theta | 60,00 | 16,5 ms |
| Biscuit | 60,00 | 17,1 ms |
| Phinks | 60,00 | 15,3 ms |
| Franklin | 60,00 | 14,1 ms |
| Machi | 60,00 | 17,2 ms |
| Illumi | 60,00 | 16,2 ms |
| Kalluto | 60,00 | 14,4 ms |
| Bonolenov | 60,00 | 16,6 ms |
| Shizuku | 60,00 | 15,6 ms |
| Hinrigh | 60,00 | 16,6 ms |
| Mizaistom | 60,00 | 15,8 ms |
| Leorio | 60,00 | 17,0 ms |
| Hanzo | 60,00 | 16,7 ms |
| Rihan | 60,00 | 16,1 ms |
| Zakuro | 60,00 | 16,5 ms |
| Melody | 60,00 | 15,0 ms |
| Basho | 60,00 | 13,3 ms |
| Camilla | 60,00 | 16,0 ms |
| Halkenburg | 60,00 | 15,7 ms |
| Gel | 60,00 | 16,3 ms |
| Lynch | 60,00 | 14,5 ms |
| Luini | 60,00 | 14,5 ms |
| Bill | 60,00 | 15,9 ms |
| Furykov | 60,00 | 16,5 ms |
| Cluck | 60,00 | 15,5 ms |
| Beyond | 60,00 | 15,9 ms |
| Longhi | 60,00 | 16,3 ms |
| Musse | 60,00 | 18,9 ms |
| Padaille | 60,00 | 15,5 ms |
| Sayird | 60,00 | 15,9 ms |
| Terebellum | 60,00 | 15,8 ms |
| Voconte | 60,00 | 15,4 ms |
| Yokotani | 60,00 | 16,4 ms |

Les **5 489 tests ciblés** passent dans 29 fichiers : roster, P2, Zetsu, commandes
nommées, protocoles, combos, défense, Nen, séquences particulières et replays.
Le typage du périmètre et le build de production passent aussi après intégration
des dernières caméras. Les vrais endpoints sont vérifiés sur six confrontations
supplémentaires et leurs deux places privées.

Les données sont conservées dans
`ui-tests/fighting-response/reference/roster-2026-11-16.json`. Les limites de la
méthode et les empreintes des traces y figurent avec les conditions d’alimentation.

## Mesures de référence initiales

Sur Apple M5 / 16 Go, Chrome 157 avec ANGLE Metal, le passage intégré produit :

| Personnage | Démarrage visuel p95 avant → après | FPS après | Animations non observées avant → après |
| --- | ---: | ---: | ---: |
| Kurapika | 484,8 → 16,6 ms | 60,00 | 0 → 0 |
| Hisoka | 556,3 → 22,8 ms | 59,91 | 10 → 0 |
| Chrollo | 622,6 → 21,8 ms | 59,64 | 4 → 0 |
| Benjamin | 1 380,4 → 20,6 ms | 59,79 | 6 → 0 |

Les 92 essais « après » ont une animation observée. Le p99 des intervalles reste
à 16,8 ms pour les quatre personnages. Sur 12 786 frames « après », 27 dépassent
25 ms, avec un maximum de 100 ms : ce banc valide une cadence proche de 60 FPS,
pas l’absence de tout pic. Les quantiles « avant » portent seulement sur les
animations observées. Les 100 ms imposées par le proxy ne comprennent pas les
files d’attente et l’ordonnancement local ; les délais mesurés peuvent être supérieurs.

La campagne initiale de non-régression passe 1 641 tests dans 36 fichiers.
Après intégration des dernières fonctions de roster, replay et classement,
2 424 tests ciblés passent dans 19 fichiers. Ces campagnes se recouvrent : elles
ne s’additionnent pas. Le typage du périmètre, y compris la fixture de production,
est sans erreur ni avertissement. La compilation SvelteKit et le contrôle des
vrais endpoints de production passent pour les deux places et les quatre duels.
Le scénario d’interface à 1440/390/320 px utilise le repli HTTP sans WebGL ; les
huit passages du banc ci-dessus vérifient séparément le rendu WebGL.

Les résultats chiffrés et le contexte matériel sont conservés dans
`ui-tests/fighting-response/reference/2026-11-16.json`. Les traces de chaque frame
et les captures sont produites dans le dossier de sortie du banc. La cadence est
validée sur ce poste de référence ; un essai sur deux machines et un réseau réel
reste nécessaire pour évaluer le ressenti PvP commercial.
