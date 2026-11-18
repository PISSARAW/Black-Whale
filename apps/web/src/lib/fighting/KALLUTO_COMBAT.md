# Kalluto · référence du combat contre la Fourmi-Chimère

La [vidéo fournie](https://www.youtube.com/watch?v=NdSry0XmZ2Q), extraite de
l’épisode 96, guide les gestes : préparation sobre vers 0:37, bras armé déployé
vers 0:49, grand mouvement d’éventail vers 1:01 et rubans de papier dans la
seconde moitié du combat. Ces observations servent à la chorégraphie du duel.

`keyPosesKalluto.ts` donne aux neuf attaques normales des coupes de l’éventail
plutôt que les gestes génériques du roster. `keyPosesKallutoPaper.ts` sépare
la dispersion, le guidage du serpent, le balayage bas et la poupée d’écoute.
Le buste reste contenu ; les poignets et les manches dessinent les arcs.
Le bras continue à diriger le papier pendant la récupération. L’éventail reste
attaché à la main droite anatomique dans les deux orientations.

`kallutoScene.ts` et `kallutoPaperRibbon.ts` dessinent des fragments triangulaires
en hélice derrière chaque projectile du serpent. La pointe suit le projectile
réel ; les fragments visuels ne créent aucun impact supplémentaire. Le rendu
dépend de l’âge du projectile, respecte la réduction des mouvements et se
reconstruit après un retour arrière du replay.

`kallutoAi.ts` prépare la zone réellement sélectionnée, puis utilise le serpent.
Le balayage bas est réservé à la sélection des pieds : l’ancien choix aléatoire
pouvait marquer les pieds tout en attendant une marque au torse. La poupée
devient un choix occasionnel à distance ; les coupes courtes de l’éventail
servent au contact. La planification conserve ses conditions de récupération
d’aura. La visée par zones, les coups normaux et les probabilités d’IA sont des
adaptations de jeu, sans prétendre mesurer l’animé.

Le marquage matériel, les coûts, les dégâts, la garde, les coupures et les
conditions du serpent restent gérés par le moteur existant dans `kallutoPaper.ts`,
`kallutoFlight.ts` et `kallutoFrames.ts`.

Le changement des décisions d’IA utilise le ruleset `clash-combat-62-kalluto-serpent`
pour éviter de resimuler les anciens replays avec une autre stratégie.

```sh
pnpm --filter @black-whale/web exec vitest run src/lib/fighting/kalluto.test.ts src/lib/fighting/threeCombatKalluto.test.ts src/lib/fighting/kallutoReference.test.ts src/lib/fighting/fineControlEffects.test.ts
node apps/web/scripts/check-kalluto-reference.mjs
```

La scène de contrôle `apps/web/ui-tests/kalluto-reference/` montre quatre états
dans les deux orientations, avec les modèles et effets de production. Le serpent
y est précédé d’un véritable marquage. Captures : `output/kalluto-reference/`.
