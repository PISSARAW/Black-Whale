# Replays, réactivité et affrontements de référence

Le panneau « Replays de matchs » capture le duel dès sa préparation. Un match
terminé est sauvegardé automatiquement ; « Enregistrer l’extrait » conserve une
séquence intermédiaire. La bibliothèque garde les cinq dernières sauvegardes dans
IndexedDB. Export et import JSON permettent de les déplacer ; sans stockage local,
la bibliothèque reste disponible en mémoire et invite à exporter.

La lecture propose pause, reprise, redémarrage et vitesses 0,5× / 1× / 2×. Quitter
restaure le combat suspendu avec son état de pause. Les commandes de combat ne
modifient pas le replay. La même bibliothèque est accessible depuis la sélection.
La capture est bornée à vingt minutes et 300 000 paquets ; l’import à 16 Mo.

## Reproductibilité

`fightMatchRuntime` applique les commandes au prochain tick réel. Il journalise
les entrées maintenues, les commandes ponctuelles et les lots de ticks exacts, y
compris les fractions de frame et les commandes sans avance du temps. L’état initial
conserve le RNG, la préparation et les valeurs spéciales du laboratoire. Les
commandes des panneaux et les resets sont des changements d’état bornés par deux
empreintes ; les autres frames sont recalculées par le moteur.

Le lecteur refait la simulation et compare des empreintes initiales, périodiques,
de changement de phase et finales. Une divergence arrête la lecture avec un message.
Version de fichier et version des règles sont contrôlées. Les empreintes détectent
des régressions ; elles ne constituent pas une signature d’authenticité.

L’architecture accepte le roster et les modes existants. La validation approfondie
de cette livraison porte sur **Kurapika, Hisoka, Chrollo et Benjamin**, y compris
leurs seize combinaisons, l’IA, un match complet avec changement de manche, les
commandes refusées et les resets du laboratoire. Les autres personnages ne sont
pas certifiés par cette suite de référence.

## Diagnostic de réactivité

En entraînement libre, ouvrir « Diagnostic de réactivité ». Chaque commande
ponctuelle indique sa réception, l’attente avant application, le passage éventuel
en buffer, son exécution ou son refus et sa raison. Le journal garde 80 tentatives,
affiche les 20 dernières de P1 ou P2 et leur attente p95. Il suit les ticks simulés,
y compris le hitstop ; la pause suspend le moteur. Les fenêtres de buffer expirées,
les remplacements et les annulations de file sont distincts.

Cette mesure commence à la réception de l’événement par le jeu. Elle ne mesure
**pas** la latence physique de la manette, du système ou de l’écran.

## Vérifications reproductibles

Depuis la racine :

```sh
pnpm --filter @black-whale/web exec vitest run src/lib/fighting/fightReplay.test.ts src/lib/fighting/fightReplayController.test.ts src/lib/fighting/fightReplayPanels.test.ts src/lib/fighting/fightResponseDiagnostics.test.ts src/lib/fighting/referenceMatchups.test.ts
node apps/web/scripts/check-fighting-replays.mjs
```

Le script de performance utilise Chrome installé sur macOS, ou
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Il écrit le rapport et une capture dans
`/tmp/black-whale-replay-performance` (modifiable par `REPLAY_CHECK_OUTPUT`).
Il mesure séparément le moteur à 60 ticks/s et les intervalles entre rendus réels
Three.js, avec le HUD et le panneau de replay. Pour chaque personnage, une passe
avec et sans enregistrement utilise les mêmes entrées. Les empreintes finales du
moteur doivent rester identiques. Les quantiles et le nombre d’échantillons sont
conservés, ainsi que le navigateur, le GPU déclaré, le viewport et le matériel.

`tests/fighting-replays.spec.ts` vérifie sur le serveur de production la sauvegarde,
l’export, la persistance après rechargement, la lecture vérifiée, le retour au duel,
les imports invalides, le diagnostic du laboratoire et les contrôles à 390 px.

Les 32 situations d’affrontement couvrent pour chacun des quatre personnages :
garde basse contre garde debout, anti-air sur un saut réel, déprojection simultanée,
pression aux deux coins, récupération après un whiff et invulnérabilité de relevée
limitée, ainsi que refus d’un Hatsu sans ressource ni engagement de coût.

## Mesure du 16 novembre 2026

Version isolée fondée sur `abd4092f` avec les seuls ajouts de cet objectif.
Mac17,3, Apple M5 (10 cœurs, 16 Go), Chrome 157.0.8103.78, viewport
1280 × 900, DPR 1, arène de 560 px, WebGL **logiciel SwiftShader**.
Sources Vite en développement ; charge des autres applications non contrôlée.

Après 300 ticks de chauffe, 1 800 ticks sont mesurés par personnage et par mode
de capture (14 400 mesures au total). Le p95 du moteur vaut **0,10 ms** avec et
sans capture pour les quatre personnages ; p99 : 0,20 ms. Aucun échantillon moteur
ne dépasse 16,67 ms. Les quatre empreintes finales sont identiques entre les deux
modes. L’horloge du navigateur est quantifiée : ces chiffres ne permettent pas
d’attribuer un coût précis aux très petits écarts.

| Personnage | Rendu p95 sans capture | Rendu p95 avec capture | Échantillons sans / avec |
| --- | ---: | ---: | ---: |
| Kurapika | 63,5 ms | 62,0 ms | 91 / 94 |
| Hisoka | 144,2 ms | 107,3 ms | 74 / 84 |
| Chrollo | 52,0 ms | 56,3 ms | 103 / 96 |
| Benjamin | 176,9 ms | 68,2 ms | 52 / 80 |

Le rendu logiciel ne tient donc pas le budget de 60 FPS. Ces courtes passes
successives ont des variations importantes et ne permettent pas d’isoler le coût
de capture côté rendu. Une validation graphique commerciale exige encore des
mesures en production sur GPU matériel, sur plusieurs configurations et pendant
des sessions plus longues. La latence physique d’entrée reste à mesurer séparément.

Le rapport brut est conservé dans
[`reference-performance.json`](../../../ui-tests/fighting-replay-lab/reference-performance.json).

Validation de livraison : 358 tests unitaires réussis dans 15 fichiers, quatre
parcours Playwright réussis sur le build isolé de production, build, ESLint et
formatage valides. Le typage ne signale aucune erreur ; quatre avertissements
antérieurs subsistent dans la route Infiltration.
