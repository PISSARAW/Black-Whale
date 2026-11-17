# Entrée en On

La référence visuelle est [Gon dans The Last Mission](https://youtu.be/e9xImbJJVw8?t=90),
particulièrement le passage de 1:30 à 1:36 : rassemblement du ressentiment,
ouverture des bras, remontée d’une aura noire et indigo, iris dorés sur fond sombre.

L’entrée dure 108 frames de simulation (1,8 seconde à 60 Hz). `onAwakening.ts`
détecte le passage réel vers `nen.on` séparément pour chaque camp. Une commande
refusée, un rig reconstruit ou le chargement d’un état déjà en On ne relance pas
l’animation. Les retours de replay et changements de manche effacent sa mémoire.

Le geste corporel concerne seulement un personnage immobile au sol. Marche,
attaque, garde, saut et réactions restent prioritaires. Les volutes suivent
le rig courant, y compris après transformation ou reconstruction. La caméra
secondaire montre d’abord le corps puis le regard ; la vue principale conserve
le duel. Aucun coût, dégât, délai de commande ou état du moteur n’est changé.

`fightFigureEyes.ts` applique les iris dorés et les sclères sombres pendant toute
la durée effective du On. La reconstruction existante du modèle rétablit les
yeux normaux à sa fin. Les yeux physiquement fermés restent fermés. Les matériaux
partagés des autres personnages et du Nen ordinaire ne sont pas modifiés.

Avec la préférence système de mouvement réduit, le geste et le mouvement des
nouvelles volutes sont supprimés ; les yeux et les volutes statiques identifient toujours le On.
L’option sans flashes supprime l’onde de libération au sol.

Vérifications ciblées :

```sh
pnpm --filter @black-whale/web exec vitest run src/lib/fighting/onAwakening.test.ts src/lib/fighting/onAwakeningScene.test.ts
node apps/web/scripts/check-fighting-on.mjs
```

La seconde commande utilise le composant de production à travers
`ui-tests/fighting-on/`, contrôle activation, pause, attaque, deux joueurs,
épuisement et mobile, puis exporte une vidéo et les captures dans
`output/clash-on/`. Elle demande Chrome et ffmpeg comme les autres rendus du projet.
