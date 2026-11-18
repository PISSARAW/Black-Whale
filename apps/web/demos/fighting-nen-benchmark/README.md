# Comparaison Nen à vitesse normale — 60 images/s

Trois vrais duels de douze secondes : Hisoka/Machi, Kurapika/Phinks,
Kalluto/Franklin. P1 utilise le contrôleur réactif public avec un plan de base
identique (`pressure`, `ryu`, aucune technique imposée) ; P2 utilise le CPU natif.
Les intentions personnelles proviennent du moteur, sans scénario de touches.
Les graines sont `20261118 + 47 × chapitre`, et `117 + chapitre` pour P1.
Le format knockout et les ressources initiales restent ceux de `createFight`.
Aucun soin, recharge, consentement ou support n'est injecté pendant le duel.

```sh
NEN_LABEL=APRÈS NEN_BENCHMARK_OUTPUT=/tmp/clash-after \
  node apps/web/scripts/render-nen-benchmark.mjs
```

Le script utilise Chrome, Playwright et ffmpeg. Une image est capturée pour
chaque tick de 1/60 s : 720 images par duel, 60 images/s, vitesse 1×.
Il n'y a ni interpolation de vidéo 30 images/s, ni duplication de frames.
La scène, les auras et le son utilisent les composants natifs. Le cadrage
principal reste actif ; les vues secondaires et le tremblement sont désactivés
pour rendre la comparaison des corps lisible.

Pour l'avant/après livré, le même dossier de démonstration et le même script
sont exécutés sur l'archive du moteur `f0f4978733ce3677fd2d1990b9c004c0fe7e0fb5`
puis sur les quatre améliorations. Seuls les moteurs diffèrent. Les commandes
peuvent diverger lorsque les situations divergent ; les six replays enregistrent
les commandes réellement jouées et vérifient leurs checkpoints par resimulation.
Les fichiers `bout-N-evidence.json` contiennent les coups, impacts et ressources.
`combat-report.json` indique les erreurs navigateur, la cadence et la vérification.

Voir [les cinq points et leurs limites](../../src/lib/fighting/NEN_TACTICS.md).

Assembler les trois comparaisons côte à côte (son de la version après) :

```sh
node apps/web/scripts/compare-nen-benchmark.mjs /tmp/clash-before /tmp/clash-after /tmp/clash-comparison
```
