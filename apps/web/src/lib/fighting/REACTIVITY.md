# Réactivité locale et PvP

Objectif : afficher plus tôt les contrôles de Kurapika, Hisoka, Chrollo et Benjamin
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
complexes non couverts (Parallel Future, Cat’s Name, pages de Chrollo hors du
périmètre) utilisent aussi ce repli.

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

## Mesures de référence

Sur Apple M5 / 16 Go, Chrome 157 avec ANGLE Metal, le passage intégré produit :

| Personnage | Démarrage visuel p95 avant → après | FPS après | Animations non observées avant → après |
| ---------- | ---------------------------------: | --------: | -------------------------------------: |
| Kurapika   |                    484,8 → 16,6 ms |     60,00 |                                  0 → 0 |
| Hisoka     |                    556,3 → 22,8 ms |     59,91 |                                 10 → 0 |
| Chrollo    |                    622,6 → 21,8 ms |     59,64 |                                  4 → 0 |
| Benjamin   |                  1 380,4 → 20,6 ms |     59,79 |                                  6 → 0 |

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
