# Combat de référence et caméra dynamique

Le combat de référence a été étendu aux quarante personnages jouables :
[finitions et couverture du roster](./ROSTER_QUALITY.md). Les timings, portées
et routes sont des réglages de jeu ; ils ne changent pas les conditions canoniques
des Hatsu. Les mesures historiques ci-dessous concernent les quatre personnages
de référence.

## Deux cent quatre-vingt-seize routes jouables

Chaque personnage possède quatre routes et un exercice de défense dans l’Académie.
Trente-quatre personnages ont chacun quatre exemples supplémentaires, avec des règles
de combo indépendantes des exercices : [choix et liaisons](./DUEL_COMBOS.md).
Les 144 routes ajoutées passent par les coups physiques ; les seize routes de
référence ci-dessous conservent leurs préparations de Nen.

Les directions avant / arrière sont relatives au combattant. Les touches ci-dessous
sont celles du clavier par défaut ; l’école affiche les commandes remappées.
Commencer à proximité de la cible. Une touche à portée maximale ne garantit pas
nécessairement toute la conversion.

| Personnage | Confirmation        | Départ bas                      | Grosse ouverture        | Conversion aérienne |
| ---------- | ------------------- | ------------------------------- | ----------------------- | ------------------- |
| Kurapika   | J → K → avant + L   | bas + J → avant + J → avant + L | arrière + K → avant + L | air J → air K       |
| Hisoka     | J → K → L           | bas + J → avant + J → L         | avant + K → L           | air J → air K       |
| Chrollo    | J → arrière + K → L | bas + J → K → L                 | avant + K → L           | air J → air K       |
| Benjamin   | J → K → L           | bas + J → avant + J → L         | arrière + K → L         | air J → air K       |

Les conversions aériennes commencent dans la descente d’un vrai saut. Les autres
routes utilisent du Ten et une réserve d’aura suffisante pour leur dernier Hatsu.
Kurapika termine avec le fouet divinatoire ; Hisoka avec une frappe d’attachement ;
Chrollo avec Sun and Moon, livre ouvert ; Benjamin avec Air Blow hérité.
Le rappel de gomme, les changements de page, Secret Window et Culdcept ne sont
pas présentés comme des coups garantis supplémentaires.

Les coups intermédiaires ont assez de hitstun pour leur suite et une poussée
inférieure au seuil de mise au sol. Les fins de route conservent leur rôle propre :
éloignement, mise au sol ou préparation d’une marque. La réduction progressive
des dégâts et la limite aérienne restent applicables.

## Cancels et défense

Les trente-quatre combattants approfondis disposent de profils de coups indépendants des exemples ;
les autres cancels sur touche suivent les liens déclarés de leurs routes. Sur garde, seule
la première attaque légère peut continuer vers le lourd de sa route de confirmation.
Le lourd bloqué ne peut pas se convertir gratuitement en Hatsu : le défenseur
retrouve un tour de jeu. Une parade au bon timing interrompt cette pression ; un
léger raté ne permet pas un cancel anticipé.

L’école propose quarante exercices de blocage puis punition, un par personnage.
Le mannequin commence réellement son attaque après une courte préparation.
La réussite exige un blocage puis une touche marquée `punish` par le moteur,
pendant la récupération adverse. Tous ces exercices utilisent le lourd de Benjamin,
dont la récupération offre une vraie fenêtre adaptée à tous les légers du roster.

## École et laboratoire

Ouvrir « École de combat · 296 routes et défense », choisir un personnage, puis
« Pratiquer » ou « Démontrer ». Le compteur progresse uniquement sur les contacts
réels de la bonne attaque, avec un compteur de combo continu. Une mauvaise suite,
une garde ou la fin du hitstun interrompt l’essai. Les indications distinguent
confirmation, fenêtre de cancel et saisie tardive.

Les démonstrations passent par les mêmes commandes, coûts et ticks que le joueur ;
elles ne forcent pas les touches ou la réussite. Les 296 sont validées à des lots
de rendu de 120, 60, 30 et 20 Hz. Elles supportent la pause et l’annulation d’une
commande encore en file. « Terminer l’exercice » rend le laboratoire libre.

Le laboratoire dispose aussi de « Garde après la première touche » et « Garde
aléatoire · confirmation ». La première reste armée même après un combo interrompu.
La seconde choisit sa réponse à chaque nouvelle attaque, de façon déterministe,
sans consommer le RNG du combat. Ces états se rejouent avec les replays.

Les règles de replay passent à `clash-combat-5` : les anciennes versions ne sont
pas compatibles avec ces nouveaux timings et sont refusées à l’import.

Le [réglage des échanges de l’étape 3](./STEP3.md) réduit progressivement le
hitstun après la troisième touche physique au sol. Il évite la répétition infinie
de légers au coin et conserve les trois premiers contacts des routes déclarées.
Le laboratoire fournit sept situations et un export local des observations pour
les parties d’équilibrage ; les essais automatisés ne remplacent pas ces parties.

## Caméra

La caméra suit le centre du duel, rapproche le cadre à courte distance et accompagne
brièvement les impacts confirmés. Elle élargit immédiatement le cadre si une
séparation ou un saut l’exige ; le rapprochement et le suivi sont amortis en fonction
du temps écoulé. Des marges protègent les corps, les pieds et les têtes sous le HUD.
Le cadrage spécial de Biscuit, de la projection de Hanzo et du chat de Camilla
reste prioritaire. Les minima imposés par les décors sont respectés.

Affichage → Confort visuel → Caméra dynamique : cadrage stable, modéré ou complet.
La préférence est sauvegardée, y compris avec les anciennes préférences de confort.
La réduction des animations du système impose le cadrage stable et désactive les
secousses. Le suivi nécessaire pour garder les corps à l’écran reste disponible.
La caméra n’écrit jamais dans la simulation, les positions ou les hitboxes.

## Vérifications

Les 2 368 cas de routes couvrent les deux orientations, deux distances de départ
et des situations au centre et au coin, contre une garde après le premier coup.
Les tests supplémentaires couvrent les parades, la fin de pression, les whiffs,
les exercices de défense, les démonstrations et leur relecture déterministe.

```sh
pnpm --filter @black-whale/web exec vitest run src/lib/fighting/combatRoutes.test.ts src/lib/fighting/combatSchool.test.ts src/lib/fighting/combatDefense.test.ts src/lib/fighting/combatCamera.test.ts src/lib/fighting/trainingGuard.test.ts
COMBAT_CHECK_GPU=hardware node apps/web/scripts/check-fighting-combat-school.mjs
```

`tests/fighting-combat-school.spec.ts` vérifie les seize démonstrations dans la
route réelle, l’essai manuel, la pause, le retour au laboratoire, la persistance
des réglages et leur adaptation à un écran de 390 px et à la réduction du mouvement.
Le script séparé vérifie le cadrage Three.js réellement rendu, produit des captures,
compare les empreintes moteur avec et sans capture et mesure le coût de la caméra.

## Mesure du 16 novembre 2026

Configuration : Mac17,3, Apple M5 (10 cœurs, 16 Go), Chrome 157.0.8103.78 en mode
headless, rendu matériel Metal vérifié dans WebGL, DPR 1, viewport 1280 × 900,
arène Tour Céleste de 560 px. Sources Vite en développement, charge des autres
applications non contrôlée. Chaque passe de rendu comporte deux secondes de
chauffe puis au moins cinq secondes de mesure.

| Personnage | Rendu p95, caméra stable | Rendu p95, caméra complète |
| ---------- | -----------------------: | -------------------------: |
| Kurapika   |                  18,5 ms |                    20,5 ms |
| Hisoka     |                  18,5 ms |                    18,3 ms |
| Chrollo    |                  18,7 ms |                    18,8 ms |
| Benjamin   |                  18,8 ms |                    18,9 ms |

Le p95 CPU de la caméra vaut 0,30 ms par lot de 250 mises à jour. Les p95 moteur
varient de 0,20 à 1,70 ms entre ces essais courts, avec et sans capture.

Ces intervalles entre rendus sont proches d’un rafraîchissement à 60 Hz, mais les
p95 dépassent 16,67 ms : ils ne certifient pas 60 FPS constants. Les courtes passes
successives ne suffisent pas à attribuer chaque différence à la caméra. Il reste
à mesurer des sessions longues en production, notamment sur écran Retina et sur
des configurations moins puissantes. La latence physique d’entrée n’est pas mesurée.

Le rapport brut contient les 32 contrôles de cadrage, les 32 essais moteur
(seize routes avec et sans capture, empreintes identiques), les timings de caméra
par lots de 250 appels et les nombres d’échantillons de rendu :
[`reference-performance.json`](../../../ui-tests/fighting-combat-school/reference-performance.json).
Le mode logiciel SwiftShader reste disponible en omettant `COMBAT_CHECK_GPU` ;
le mode matériel de ce script utilise Metal sur macOS et vérifie le pilote obtenu.

Validation de livraison : 626 tests unitaires réussis dans 21 fichiers, sept
parcours navigateur validés et 32 cas de cadrage réellement rendu. Build de
production, ESLint et formatage valides ; aucune erreur de typage. Quatre
avertissements antérieurs subsistent dans la route Infiltration.
