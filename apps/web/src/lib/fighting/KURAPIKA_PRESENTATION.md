# Kurapika — accents des chaînes et manifestations majeures

Les cinq embouts et les chaînes articulées existants restent les modèles de référence.
La présentation distingue deux formats :

| Format                    | Déclenchements                                                      | Présentation                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type 1 — 18 frames, 0,3 s | Déploiement et retour des cinq chaînes, contact courant, Holy Chain | Éclat local sur l’embout, léger accent de caméra et impulsion dorée au soin réellement obtenu. Aucun encart ni arrêt du duel.                     |
| Type 2 — 84 frames, 1,4 s | Activation réelle d’Emperor Time                                    | Resserrage de trois anneaux de Nen et éclats sur les iris écarlates du modèle courant. Les yeux restent rouges tant que le mode est actif.        |
| Type 2                    | Capture effective par Chain Jail                                    | Resserrement visuel des spires existantes, impulsion autour de la cible et cadrage du lien puis de l’entrave.                                     |
| Type 2                    | Contact puis acquisition effective par Steal Chain                  | Flux le long de la liaison réelle, puis signal d’acquisition près de la main. Le vol n’est annoncé qu’une fois la capacité effectivement retenue. |
| Type 2                    | Implantation effective de Judgment Chain                            | Impulsion autour de la lame au cœur et affichage des clauses réellement implantées. La présentation ne provoque aucune violation ni exécution.    |

Les règles de caméra des chaînes courantes deviennent des accents après le filtrage
de confidentialité. Les gestes préparatoires d’une capacité majeure restent de type 1 ;
seul son résultat confirmé ouvre l’encart de type 2. Un nouveau résultat important peut
prendre le cadrage après 24 frames, sans attendre la fin d’une séquence précédente.

`kurapikaPresentation.ts` conserve des observations scalaires propres au rendu pour
chaque camp. Les horloges suivent les frames du duel, les annulations et les retours
de replay. Elles ne changent ni l’aura, ni la vie dépensée par Emperor Time, ni les
conditions de la Brigade, ni les contacts, ni les clauses ou les résultats du combat.

Les nouveaux effets et les chaînes cachées par In restent invisibles à l’observateur
sans Gyo valable. Stealth Dolphin conserve sa vue privée. Les effets supplémentaires
sont supprimés avec les flashes désactivés ; le mouvement réduit conserve les modèles
et les couleurs d’état sans animer les nouveaux accents.

```sh
pnpm --filter @black-whale/web exec vitest run src/lib/fighting/kurapikaPresentation.test.ts src/lib/fighting/kurapikaChains.test.ts src/lib/fighting/kurapika.test.ts
node apps/web/scripts/check-fighting-kurapika.mjs
```

La vérification visuelle utilise `ui-tests/fighting-kurapika/` et les composants de
production. Les cinq vidéos, captures mobiles et le rapport sont exportés dans
`output/clash-kurapika/` ; Chrome et ffmpeg sont requis.
