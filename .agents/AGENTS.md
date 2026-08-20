# Règles Strictes pour les Agents (Black Whale)

Ces règles sont absolues et doivent être respectées par tous les agents IA travaillant sur ce projet (refactorisation, création de fichiers, etc.). Elles reflètent l'ADR-002 et le fichier `CLAUDE.md`.

## 1. Complexité Faible (Cyclomatic Complexity <= 10)
Ne génère **que** du code avec une complexité cyclomatique faible.
- Interdiction de créer des fonctions avec de trop nombreuses branches (`if`/`else`, `switch`, etc.).
- Si une fonction devient trop complexe (complexité > 10), tu **dois** extraire la logique dans des sous-fonctions dédiées.

## 2. Longueur Maximale (Max 500 Lignes)
- **Pas de code de plus de 500 lignes** par fichier.
- Cette limite inclut les espaces, commentaires et lignes vides.
- Si tu modifies un fichier qui est déjà proche de la limite (ou au-dessus), tu as l'interdiction stricte de rajouter du code à l'intérieur. Tout nouvel ajout doit être extrait dans un nouveau fichier (`.ts`, `.svelte`) importé par le fichier parent.

## 3. Paramètres Limités (Max 3 Paramètres)
- **Pas de fonctions de plus de 3 paramètres**.
- Si une fonction requiert plus de 3 variables en entrée, tu dois obligatoirement encapsuler ces paramètres dans un objet (par exemple, utiliser un objet d'options typé avec TypeScript).
