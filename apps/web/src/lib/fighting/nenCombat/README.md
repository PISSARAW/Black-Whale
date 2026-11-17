# Techniques avancées au combat

Le contrat et l’inventaire des usages sont dans [NEN_COMBAT.md](../NEN_COMBAT.md).

| Module                           | Responsabilité                                                        |
| -------------------------------- | --------------------------------------------------------------------- |
| `sight.ts`, `ocularInput.ts`     | Vue, Gyo oculaire normal et version faible                            |
| `bodyGyo.ts`, `guardKo.ts`       | Engagement corporel et Ko défensif sans nouvelle capacité personnelle |
| `guardInput.ts`, `protection.ts` | Garde manuelle, protection locale et aide de l’arme en Shu            |
| `reading.ts`, `gyoScene.ts`      | Lecture de la répartition présente, sans savoir privé ni prédiction   |
| `padChords.ts`                   | Associations Xbox sans entrées de mouvement parasites                 |
| `copy.ts`                        | Explications bilingues des compromis                                  |
| `lessons.ts`, `lessonState.ts`   | Six exercices reposant sur le vrai moteur et des contacts effectifs   |

Les dimensions, pourcentages et coûts du duel sont des réglages arcade. Les
nouveaux champs optionnels de présentation ou d’engagement sont déclarés par
augmentation de module pour conserver la borne de `types.ts`. Le On reste dans
son module existant ; les techniques avancées ne suppriment pas son contrat.
