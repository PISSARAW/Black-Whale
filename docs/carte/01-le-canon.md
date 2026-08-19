---
titre: Le canon
etage: 1
couvre:
  - data/**
  - packages/canon-compiler/**
  - packages/database/**
  - packages/canon-engine/src/world/**
depend-de: [11-les-donnees, 03-l-identite]
revu-le: 2026-08-05
empreinte: cc875a3
decisions: [adr-001, adr-006]
---

# Le canon

Ce territoire gère le cycle de vie d'un fait : où il est déclaré, ce qu'il devient, et qui peut le réécrire.

## Promet

- `data/**` : L'unique source de vérité où les faits du monde (personnages, lieux, événements) sont déclarés.
- `packages/canon-compiler` : Le processus de compilation qui lit les données JSON et les projette dans la base de données.
- `packages/database` : Le stockage persistant des faits, accessible de manière centralisée.
- `packages/canon-engine/src/world` : Le moteur qui consomme la base de données pour réduire les faits en un état pur du monde, prêt à être exploité par les autres systèmes.

## Refuse

- Les fichiers dans `data/**` ne contiennent aucune logique de code, uniquement des déclarations statiques.
- `packages/database` ne doit pas être altéré directement par des applications clientes ; toutes les écritures (déclarations de faits) se font via le compilateur.
- Les états générés par `packages/canon-engine/src/world` ne peuvent pas réécrire la source de vérité. Un fait ne se modifie qu'à la racine (`data/**`).

## Trajet

1. **Déclaration** : Un fait est écrit ou modifié dans un fichier JSON sous `data/**`.
2. **Compilation** : `packages/canon-compiler` s'exécute, valide la structure du fait, et le transforme.
3. **Persistance** : Le compilateur pousse le fait validé et transformé dans `packages/database`.
4. **Réduction** : `packages/canon-engine/src/world` lit l'état depuis la base et construit la représentation en mémoire de la scène ou du monde pour le reste de l'application.

## Frontières

- **Source -> Compilateur** : La validation stricte assure que le compilateur ne travaille que sur des faits conformes au contrat.
- **Compilateur -> Base de données** : Le compilateur a des droits d'écriture, ce qui en fait le seul acteur capable d'insérer des faits originaux.
- **Base de données -> Moteur Canon** : Le moteur n'effectue que des lectures structurées et des réductions d'état, sans altérer la base de faits.

## Invariants

- Un fait déclaré dans `data/**` est absolu jusqu'à sa prochaine modification manuelle.
- La base de données reflète toujours la dernière compilation réussie de `data/**`.
- Aucun sous-système (comme la simulation ou l'interaction) ne peut modifier un fait du canon de son propre chef.
