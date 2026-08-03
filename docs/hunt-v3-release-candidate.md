# Hunt V3 — rapport de release candidate

**Date :** 2 août 2026  
**Statut :** candidate fonctionnelle, non promouvable

## Périmètre livré

- poursuite continue entre les zones d'un contrat, avec conservation de l'aura, des Hatsu, du chasseur, de l'horloge et de la télémétrie ;
- fermeture stratégique des issues par le chasseur, appliquée au graphe de navigation et à l'audition ;
- Ren, Shu, blessures et vœux branchés sur la simulation, l'état persistant et les commandes tactiles ;
- campagne locale versionnée avec progression, maîtrise, blessures et reprise après donnée corrompue ;
- replay déterministe partageable, fantôme interpolé dans la scène 3D et validation anti-altération ;
- éditeur de contrats, validation stricte et partage par URL ;
- audit d'équilibrage avec seuils de promotion explicites.

## Gates exécutés

| Gate                        | Résultat                   | Preuve                                                                                                                  |
| --------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Logique Hunt                | Réussi                     | 40 fichiers, 291 tests Vitest réussis                                                                                   |
| Chromium desktop            | Réussi                     | 4 parcours Playwright                                                                                                   |
| WebKit mobile (iPhone 13)   | Réussi                     | 4 parcours Playwright                                                                                                   |
| Contrat partagé             | Réussi                     | édition, encodage, navigation et sélection vérifiés dans les deux navigateurs                                           |
| Accessibilité des contrôles | Réussi dans le parcours    | régions nommées, états pressés et zone live vérifiés                                                                    |
| Typecheck global web        | Échoué hors périmètre Hunt | 297 erreurs et 12 avertissements dans 65 fichiers, principalement packages workspace non résolus et travaux concurrents |
| Échantillon d'équilibrage   | À produire                 | les gates et agrégations sont testés, mais cinq runs réels par cellule ne sont pas encore collectés                     |

## Critères d'équilibrage V3

Une cellule correspond à une combinaison terrain × Hatsu × profil de chasseur. Elle est promouvable si elle contient au moins cinq parties, un taux de victoire compris entre 25 % et 75 %, une durée moyenne de 240 à 600 secondes et un écart absolu moyen de dépense d'aura inférieur ou égal à 30.

L'audit retourne la cellule, la métrique fautive, la valeur réelle et l'intervalle attendu. Aucun ajustement de coût n'est présenté comme validé sans données de parties réelles.

## Décision de release

Le périmètre Hunt V3 est jouable et ses parcours critiques passent sur desktop et mobile. La candidate ne doit toutefois pas être étiquetée comme release finale avant :

1. la collecte de cinq runs minimum pour chaque cellule de la matrice et un audit sans anomalie ;
2. le rétablissement du typecheck global du workspace ;
3. une revue manuelle WCAG AA, clavier complet, tactile réel et audio sur appareil.

## Commandes reproductibles

```text
corepack pnpm --filter @black-whale/web test -- --run src/lib/hunt
corepack pnpm exec playwright test tests/hunt.spec.ts
corepack pnpm --filter @black-whale/web typecheck
```
