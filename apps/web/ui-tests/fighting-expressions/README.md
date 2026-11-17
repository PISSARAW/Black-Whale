# Expressions des six combattants

Ce banc monte `FightStage` et utilise les modèles et animations du combat.
Le [contrat des expressions](../../src/lib/fighting/EMOTIONS.md) précise le périmètre.

Les états de concentration, d’effort et de douleur sont produits par le moteur ;
les deux orientations sont vérifiées. Le banc conserve les empreintes de combat
pendant les captures figées et contrôle l’absence d’erreur de scène ou de shader.
Les détails du visage sont des recadrages de la caméra habituelle, agrandis pour
la planche de comparaison ; les images complètes restent conservées.

La cadence est relevée en profil Équilibré, avec trois secondes de chauffe puis
le même temps de mesure avec la couche suspendue et activée. Les commandes sont
cadencées par les frames de simulation, indépendamment du rendu. Les traces RAF
et le temps CPU de rendu proviennent de la sonde de l’étape 2. Le rapport déclare
le poste, la charge système, le moteur graphique et chaque échec de budget.

```sh
FIGHT_EXPRESSIONS_SECONDS=15 node apps/web/scripts/check-fighting-expressions.mjs
```

Les sorties sont conservées dans `output/fighting-expressions/`.

Le relevé retenu est conservé dans `verification.json` : douze passages de douze
secondes, trois secondes de chauffe chacun, sur Apple M5 avec GPU Metal.

| Personnage | FPS couche suspendue | FPS avec expressions | CPU p95 avec expressions |
| ---------- | -------------------: | -------------------: | -----------------------: |
| Kurapika   |                60.00 |                60.00 |                   3.5 ms |
| Benjamin   |                60.00 |                60.00 |                   2.9 ms |
| Hisoka     |                60.00 |                60.00 |                   1.1 ms |
| Chrollo    |                60.00 |                60.00 |                   2.8 ms |
| Feitan     |                60.00 |                59.84 |                   3.2 ms |
| Phinks     |                60.00 |                60.00 |                   1.0 ms |

Tous ces passages respectent les budgets de ce contrôle court. La suspension
conserve les géométries de bouche préparées ; elle compare les mises à jour
faciales et les accents corporels, sans prétendre isoler tout le coût GPU des
morphs. Les durées ne remplacent pas la session longue de l’étape 2.

Une première passe utilisait les heures de fin de rendu pour les intervalles ;
elle est conservée séparément dans `report-initial.json`. Elle contenait notamment
un passage de Benjamin à 30 FPS, non reproduit lors de la comparaison RAF.
La charge système varie : ces reprises ne prouvent pas la cause de cet écart.
