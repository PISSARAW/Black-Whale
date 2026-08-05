---
titre: Ajouter une salle
etage: 1
couvre:
  - data/ship/blueprint.json
  - apps/web/src/lib/tour/blueprint.ts
  - apps/web/src/lib/tour/geometry.ts
depend-de: [05-la-visite, 11-les-donnees]
revu-le: 2026-08-05
empreinte: 000000
decisions: [adr-006]
---

# Ajouter une salle au navire

1. **Ouvrir `data/ship/blueprint.json`.** Chaque salle est un polygone avec un `id`, un
   `tier` (étage), une liste de `walls` et des `fixtures` optionnels.
2. **Dessiner le polygone.** Les coordonnées sont en mètres, origine au centre du navire.
   Le sens des points doit être anti-horaire pour que l'intérieur soit du bon côté.
3. **Déclarer les murs porteurs.** Tout mur qui touche une autre salle doit être partagé
   exactement ; `geometry.ts` en déduit les portes.
4. **Placer les luminaires.** Sans luminaire, la salle est noire. Ajouter un `lamp` dans
   `fixtures` ou s'assurer qu'un luminaire voisin l'atteint.
5. **Vérifier la connectivité.**
   ```
   pnpm --filter @black-whale/web test tour/blueprint.test.ts
   ```
6. **Vérifier le rendu.** Lancer `pnpm --filter @black-whale/web dev` et visiter /tour.
