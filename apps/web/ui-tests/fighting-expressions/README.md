# Expressions des 40 combattants

Ce banc monte `FightStage` et utilise les modèles et animations du combat.
Le [contrat des expressions](../../src/lib/fighting/EMOTIONS.md) précise le périmètre.

Les états de concentration, d’effort et de douleur sont produits par le moteur ;
les deux orientations sont vérifiées pour chaque personnage du roster réel. Le banc conserve les empreintes de combat
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

Les nouvelles sorties sont conservées dans `output/fighting-expressions-roster/` ;
`FIGHT_EXPRESSIONS_OUTPUT` choisit une autre destination. Le banc lit le roster
et les noms depuis la fixture ; `FIGHT_EXPRESSIONS_FIGHTERS` sélectionne une liste
réduite et force `fullRoster: false`. `qualified` exige une campagne complète et
au moins huit secondes de mesure par passage. Le rapport est enregistré après
chaque passage et conserve les erreurs et la progression.

Les planches `expressions-roster-01.png`, etc. regroupent huit personnages chacune.
`expressions-specials.png` présente les visages particuliers. Le manifeste du
bundle réellement exécuté figure dans le rapport.

## Référence historique des six premiers personnages

Les sorties initiales dans `output/fighting-expressions/` et `verification.json`
sont conservées. Elles décrivent le premier lot, avant l’extension du roster.

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

## Vérification du roster complet

La campagne du 17 novembre 2026 couvre les **40 personnages** : 160 captures
validées et 80 passages A/B, sans erreur de scène ou de shader. Chaque passage
mesure huit secondes après trois secondes de chauffe, en profil Équilibré sur
Apple M5, GPU Metal, vue 1280 × 900 et DPR appareil 2.

Avec expressions, les moyennes vont de **59,75 à 60,00 FPS**. Les intervalles
p95 et p99 restent au plus à 16,8 ms ; le temps CPU p95 de rendu va de 2,1 à
8,5 ms, sous le budget de 12 ms. Les 80 passages respectent les seuils.

Le manifeste, les profils de source et les relevés sont dans
`verification-roster.json`. Les traces brutes et les cinq planches de portraits
sont dans `output/fighting-expressions-roster-full/`.

| Personnage   | FPS suspendu | FPS actif | CPU rendu p95 actif |
| ------------ | -----------: | --------: | ------------------: |
| Kurapika     |        60.00 |     60.00 |              3.0 ms |
| Hisoka       |        60.00 |     60.00 |              4.5 ms |
| Chrollo      |        60.00 |     60.00 |              3.4 ms |
| Benjamin     |        60.00 |     60.00 |              3.3 ms |
| Tserriednich |        60.00 |     60.00 |              3.6 ms |
| Feitan       |        60.00 |     60.00 |              8.5 ms |
| Saiyu        |        59.88 |     60.00 |              4.4 ms |
| Theta        |        60.00 |     60.00 |              3.7 ms |
| Biscuit      |        60.00 |     60.00 |              3.9 ms |
| Phinks       |        60.00 |     60.00 |              3.9 ms |
| Franklin     |        60.00 |     60.00 |              4.5 ms |
| Machi        |        60.00 |     60.00 |              4.5 ms |
| Illumi       |        59.88 |     60.00 |              4.3 ms |
| Kalluto      |        60.00 |     59.75 |              4.3 ms |
| Bonolenov    |        59.88 |     60.00 |              4.2 ms |
| Shizuku      |        60.00 |     60.00 |              4.4 ms |
| Hinrigh      |        60.00 |     59.75 |              4.1 ms |
| Mizaistom    |        60.00 |     60.00 |              4.2 ms |
| Leorio       |        60.00 |     60.00 |              5.4 ms |
| Hanzo        |        60.00 |     60.00 |              5.4 ms |
| Rihan        |        60.00 |     60.00 |              4.4 ms |
| Zakuro       |        60.00 |     60.00 |              4.6 ms |
| Melody       |        60.00 |     60.00 |              4.6 ms |
| Basho        |        60.00 |     60.00 |              4.2 ms |
| Camilla      |        60.00 |     60.00 |              4.1 ms |
| Halkenburg   |        60.00 |     59.88 |              3.9 ms |
| Gel          |        60.00 |     60.00 |              3.9 ms |
| Lynch        |        60.00 |     60.00 |              3.7 ms |
| Luini        |        60.00 |     60.00 |              4.2 ms |
| Bill         |        60.00 |     59.88 |              3.8 ms |
| Furykov      |        60.00 |     60.00 |              3.3 ms |
| Cluck        |        60.00 |     60.00 |              2.8 ms |
| Beyond       |        60.00 |     60.00 |              2.4 ms |
| Longhi       |        60.00 |     60.00 |              3.0 ms |
| Musse        |        60.00 |     60.00 |              2.5 ms |
| Padaille     |        60.00 |     60.00 |              2.1 ms |
| Sayird       |        60.00 |     60.00 |              2.1 ms |
| Terebellum   |        60.00 |     60.00 |              2.1 ms |
| Voconte      |        60.00 |     59.75 |              2.1 ms |
| Yokotani     |        60.00 |     59.88 |              5.0 ms |

Ces essais courts concernent les coups physiques du banc. Ils ne remplacent
pas la session longue ni les charges de Hatsu de l’étape 2 ; la charge du poste
est consignée pour chaque passage.
