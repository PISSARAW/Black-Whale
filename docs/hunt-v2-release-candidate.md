# Hunt V2 — rapport de release candidate

**Date :** 2 août 2026  
**Statut :** candidate non promouvable

## Résultat exécuté

| Gate                      | Résultat                | Preuve                                                        |
| ------------------------- | ----------------------- | ------------------------------------------------------------- |
| Logique Hunt              | Réussi                  | 29 fichiers, 258 tests Vitest réussis                         |
| Matrice de configurations | Réussi structurellement | 3 terrains × 3 Hatsu × 3 chasseurs × seeds                    |
| Desktop Chromium          | Bloqué                  | parcours Playwright présent, erreur Three.js pendant le rendu |
| Mobile Chromium           | Bloqué                  | même blocage de rendu                                         |
| Typecheck Hunt            | Bloqué par workspace    | lien local `@black-whale/ability-modules` non résolu          |
| Diff Hunt                 | Réussi                  | changements Hunt committés séparément                         |

## Rapport d’équilibrage

La matrice couvre 27 cellules avant multiplication par les seeds. Chaque cellule agrège : taux de
victoire, durée moyenne et écart moyen de dépense d’aura. Les métriques par partie couvrent En,
Zetsu, Hatsu, entraves, inspections, fausses pistes, pièces visitées et aura récupérée.

La structure et les agrégations sont testées, mais aucune modification de constantes n’est validée
dans cette candidate : les parcours réels doivent d’abord produire un échantillon pour chaque
cellule. Ajuster les coûts avant cet échantillon fabriquerait un résultat au lieu de le mesurer.

## Vérification navigateur

Le serveur répond à nouveau `200` après correction de l’initialisation réactive de l’arène. Le
briefing est présent dans l’arbre accessible avec les trois Hatsu, trois terrains, trois chasseurs et
le réglage audio. La session navigateur détecte ensuite une exception dans `TourScene.svelte` :
Three.js reçoit un objet sans `boundingSphere` depuis `driftApparitions`. Ce code appartient aux
changements `/tour` concurrents et n’est pas modifié par Hunt.

Les quatre tests reproductibles sont dans `tests/hunt.spec.ts` : deux parcours sur Chromium desktop
et les mêmes sur un profil iPhone 13.

## Accessibilité, tactile et audio

- commandes principales disponibles comme boutons tactiles d’au moins 44 px ;
- focus visible et états `aria-pressed` pour Nen, garde et techniques du duel ;
- région live sobre pour pièce, état Nen, contact et résultat ;
- trajectoires du débrief distinctes par couleur, forme et motif, avec alternative textuelle ;
- audio désactivé par défaut, activé après geste utilisateur, entièrement optionnel ;
- nœuds audio et listeners libérés à la sortie ;
- dette de simulation remise à zéro après suspension d’onglet.

## Bloqueurs de promotion

1. Corriger l’exception `driftApparitions` dans la branche `/tour` qui empêche l’hydratation fiable.
2. Restaurer les liens workspace pour que `@black-whale/ability-modules` soit résolu par le typecheck.
3. Exécuter les quatre parcours Playwright sans erreur console.
4. Exécuter plusieurs seeds par cellule et joindre les résultats mesurés.
5. Réaliser la revue manuelle Firefox/WebKit et WCAG AA.

## Commandes de validation

```text
pnpm --filter @black-whale/web test
pnpm --filter @black-whale/web typecheck
pnpm test:hunt:e2e
pnpm lint
```

La candidate peut être promue uniquement lorsque les cinq bloqueurs sont fermés et que les commandes
ci-dessus réussissent depuis une installation propre.
