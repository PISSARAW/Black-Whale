# Feitan — apparition de Pain Packer et Rising Sun

Deux manifestations distinctes prolongent les gestes de combat existants :

- **Pain Packer** : à l’apparition réelle de l’armure, le manteau se matérialise
  depuis le bas, puis le torse, les manches et la capuche. Un liseré de Nen et
  deux filaments entourent la formation. La révélation dure 72 frames (1,2 s).
  La caméra secondaire passe du corps à la capuche et à sa grille.
- **Rising Sun** : après la préparation réelle du geste, le noyau déjà visible
  atteint sa taille finale en 12 frames, avant la première impulsion de chaleur
  à la frame 15. Une couronne de plasma et des protubérances se déploient pendant
  78 frames (1,3 s). La caméra passe du porteur protégé au soleil.

La tenue et le noyau reprennent les modèles de référence du projet. Les matériaux
de révélation sont propres à chaque tenue ; les ressources partagées conservent
leur apparence. La tête et le manteau ordinaires restent visibles tant que leur
section de protection n’est pas complètement formée. L’armure suit les articulations
et les reconstructions du porteur, y compris avec Skill Hunter.

Les effets suivent les frames de simulation et l’âge réel du soleil : une pause
ne les fait pas progresser. Retour de replay, nouvelle manche et interruption
effacent la formation en cours. Le mouvement réduit affiche directement la tenue
complète et une couronne statique. L’option sans flashes supprime l’accent lumineux
supplémentaire de la couronne.

Les blessures exigées, les coûts, la protection thermique et les impulsions de
chaleur restent ceux du moteur. La limite de chaleur montre sa portée réelle dès
la naissance du soleil ; le rendu n’ajoute ni délai de dégâts ni protection physique.

```sh
pnpm --filter @black-whale/web exec vitest run src/lib/fighting/feitanPresentation.test.ts src/lib/fighting/feitanScene.test.ts src/lib/fighting/painPackerRig.test.ts src/lib/fighting/feitanPain.test.ts
node apps/web/scripts/check-fighting-feitan.mjs
```

La vérification visuelle utilise `ui-tests/fighting-feitan/` et le composant de
production. Elle exporte `pain-packer.mp4`, `rising-sun.mp4`, les captures mobiles
et `report.json` dans `output/clash-feitan/` (Chrome et ffmpeg requis).
