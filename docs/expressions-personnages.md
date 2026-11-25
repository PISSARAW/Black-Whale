# Expressions des personnages

Le catalogue partagé contient **238 expressions et gestes**, répartis en 29 familles : les 22 familles émotionnelles et les 7 groupes de gestes du visage. Chaque entrée possède un identifiant stable, un libellé français, une pose numérique complète et un rythme d’animation. Les fichiers `apps/web/src/lib/tour/expressions/catalogue*.ts` portent les réglages artistiques.

## Aperçu

Ouvrir `/expressions`, également accessible depuis le menu principal de Clash. Choisir un personnage, Tour ou Clash, une expression et son intensité. L’aperçu permet le mélange avec une seconde expression, la lecture avec une durée, la pause et les vues de face ou de trois quarts. Les tempéraments et les masques restent respectés.

## Jouer une expression

Les expressions sont une couche de présentation. Elles ne sont pas ajoutées à `ArcadeFighter`, au réseau ou au hash des replays.

```ts
import { setHumanExpression } from '$lib/tour/expressions/expressionPlayer'

// Le temps est celui passé à model.animate ; durée omise = maintien.
setHumanExpression(model.root, {
  id: 'colere/colere-contenue',
  start: seconds,
  duration: 2.5,
  fade: 0.15,
  intensity: 0.8,
  secondary: { id: 'sourire/sourire-inquietant', weight: 0.25 },
})

// Libérer la consigne et retrouver l’expression automatique.
setHumanExpression(model.root)
```

Une scène peut aussi passer `expression` dans la couche de `model.animate(seconds, pose, { expression, motion })`. Cette consigne a priorité sur une consigne persistante uniquement pour cette image ; son absence rend la main à la consigne persistante. Les identifiants viennent de `EXPRESSION_CATALOGUE` et sont contrôlés par `setHumanExpression`.

Dans Clash, les coups reçus, le KO et les performances de Melody gardent la priorité. Le moteur adapte les consignes aux profils des combattants : Illumi reste impassible, les bouches masquées restent masquées. Dans Tour, les poses de flûte, de chute et de Zetsu conservent leurs contraintes. Les six réactions automatiques déjà liées à l’état du combat continuent de fonctionner ; les autres émotions peuvent être déclenchées par les dialogues et les scènes via cette API, sans inventer une cause émotionnelle dans la simulation.

## Rendu et ressources

Paupières et sourcils peuvent être asymétriques. Les pupilles se déplacent sur deux axes ; lèvres, mâchoire, nez et joues utilisent des contrôles indépendants. Les lèvres procédurales utilisent les morphs existants pour sourire ou inverser la courbure en moue. Les traits natifs, les dents et les signatures des personnages restent groupés.

Larmes, sueur et dents supplémentaires sont créées à la demande. La rougeur et la pâleur utilisent des matériaux propres au personnage, sans recolorer les matériaux partagés. Les effets et leurs matériaux sont libérés par les chemins de destruction des modèles. Les scènes cinématiques peuvent suspendre puis restaurer les expressions de Clash.

## Validation

- `catalogue.test.ts` : couverture de chaque expression, mélange, durée, horloge et isolation des consignes.
- `fightCatalogueExpression.test.ts` : les 238 entrées sur les modèles réels des 40 combattants, dans Tour et Clash ; priorité des impacts, effets et restauration.
- `node apps/web/scripts/check-expression-catalogue.mjs` : aperçu 3D, captures de plusieurs expressions, mélange et mise en page mobile. Les captures temporaires sont écrites dans `/tmp/black-whale-expression-catalogue` par défaut.
