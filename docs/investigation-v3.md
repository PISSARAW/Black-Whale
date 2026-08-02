# Investigation V3 — livraison du moteur épistémique

## Vision

Investigation V3 ne traite plus une preuve comme une vérité binaire. La version introduit un moteur où les informations appartiennent à des points de vue, où plusieurs chemins peuvent établir une conclusion et où les interactions sociales ou Nen ont des conditions et des coûts explicites.

## Fonctionnalités livrées

### Registre de connaissance

- claims typés : fait, témoignage, croyance, mensonge ou déduction ;
- soutien et opposition à une proposition ;
- degrés de certitude : inconnu, possible, probable, établi ou contradictoire ;
- séparation des connaissances par personnage ;
- transmission d'une information avec atténuation de confiance ;
- conservation des sources ayant produit chaque claim.

### Raisonnement non linéaire

- plusieurs chemins de preuve possibles pour une même conclusion ;
- opérateurs `allOf`, `anyOf` et `noneOf` ;
- conclusions inexplorées, partielles, soutenues, établies ou réfutées ;
- score de progression et liste des propositions manquantes ;
- affichage en direct de la certitude dans l'onglet Déduction.

### Interrogatoires sociaux

- quatre postures : neutre, empathique, pressante et accusatrice ;
- confiance et stress propres à chaque témoin ;
- coopération refusée, prudente ou ouverte ;
- preuves utilisées comme levier ;
- persistance des dispositions dans la sauvegarde V6 ;
- migration transparente des sauvegardes V1 à V5.

### Hatsu systémique

- résolution depuis les règles du dossier plutôt que depuis des identifiants codés en dur ;
- validation de la cible et du type de capacité ;
- coût en heures de vie vérifié avant révélation ;
- résultats concluants, corroborants, limités ou interdits ;
- aucun gain de preuve lorsqu'un coût ou une règle bloque l'usage.

## Architecture

- `knowledge.ts` : perspectives et agrégation de certitude ;
- `reasoning.ts` : chemins de raisonnement et conclusions ;
- `interview.ts` : dynamique sociale des témoins ;
- `hatsuSystem.ts` : résolution générique des capacités ;
- `v3Runtime.ts` : adaptation des dossiers V2 au moteur V3 ;
- `progress.ts` : persistance versionnée de l'état social.

Les dossiers V2 restent compatibles. L'adaptateur transforme leurs preuves et hypothèses en propositions et chemins V3 sans migration éditoriale obligatoire.

## Hors périmètre de cette livraison

La campagne multi-dossiers, les scènes évoluant en temps réel, l'atelier visuel de création et le partage communautaire nécessitent des produits dédiés. Ils pourront s'appuyer sur ce moteur sans modifier ses contrats fondamentaux.

## Validation

La suite Investigation couvre le registre de connaissance, les contradictions, la transmission des informations, les chemins alternatifs, les verdicts partiels, les postures sociales, les migrations de sauvegarde et les règles Hatsu.
