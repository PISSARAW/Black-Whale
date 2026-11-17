# Étape 2 — réactivité, contacts et performances

Cette étape porte sur les commandes, la lecture des contacts, les sessions longues
et les profils pour machines modestes. La cible de manette demandée est **Xbox**,
via la disposition standard du navigateur. Les pouvoirs, conditions, coûts,
collisions et ticks à 60 Hz restent ceux de l’[audit Nen](../../../../../docs/audit-hatsu-fighting.md).

## Profils graphiques

Pause → Affichage & son → Confort visuel → Qualité graphique.

| Profil      | DPR maximal | MSAA de la scène avec bloom | Bloom décoratif               |
| ----------- | ----------: | --------------------------: | ----------------------------- |
| Performance |           1 |                           0 | Non                           |
| Équilibrée  |        1,25 |                           2 | Oui, si le terrain en dispose |
| Qualité     |        1,75 |                           4 | Oui, si le terrain en dispose |

Qualité conserve le rendu précédent et les préférences anciennes. Un écran de
DPR inférieur n’est jamais agrandi artificiellement. Changer de profil reconstruit
uniquement la scène : simulation, positions, manifestations et perception du Nen
restent identiques. Les buffers, matériaux temporaires et contextes WebGL sont
libérés même si un chargement asynchrone se termine après la fermeture.

Les réglages de caméra, secousses, flashs et contraste restent indépendants.
Les géométries de projectiles sont partagées par forme ; les projectiles des
pistolets des gardes du corps utilisent une petite balle métallique ; Theta et
Musse conservent leurs profils de tir propres. Les matériaux des pierres
sont réutilisés et libérés avec la scène. Les projectiles restent des objets
distincts pour les positions, collisions, perceptions et enveloppes de Shu.
La réduction des animations imposée par le système reste prioritaire.

La vue prédite de Parallel Future réutilise son contexte graphique entre deux
visions, sans refaire les shaders à chaque apparition. Masquée, elle ne rend
aucune image ; changer de point de vue détruit la vue privée conservée. Le moteur
calcule toujours les 600 ticks et fournit seul les états autorisés.

## Lecture des contacts

Une touche utilise des étincelles dorées, une garde des segments bleus et une
parade un anneau blanc. La forme complète la couleur. Une esquive ou une
invulnérabilité confirmée par le moteur ne produit plus les étincelles, flashs et
secousses d’un coup reçu. Les sons existants suivent les résultats réels : choc,
garde, parade métallique et souffle d’évitement. Aucun signal n’est déduit d’un
Hatsu caché ; le rendu consomme le résultat public du contact.

## Diagnostic Xbox local

Pause → Commandes → Manettes → Vérifier ma manette.

1. Brancher la manette Xbox et appuyer sur un bouton pour la rendre visible au navigateur.
2. Choisir le transport réellement utilisé : USB ou Bluetooth.
3. Démarrer la mesure, relâcher les commandes, puis tester A/B/X/Y,
   LB/RB, LT/RT, Start/Back, les clics de sticks et la croix.
4. Tester un maintien puis un relâchement de X : la charge est tenue, puis
   la commande Hatsu est émise une seule fois au relâchement.
5. Laisser le stick au repos puis l’incliner progressivement : l’hystérésis
   existante active au-dessus de 0,5 et maintient au-dessus de 0,3.
6. Débrancher et rebrancher, puis vérifier l’absence d’attaque fantôme.
7. Arrêter et exporter le rapport ; répéter séparément pour USB, Bluetooth et
   chaque navigateur/machine ciblés.

Les essais de manette ne sont pas transmis au combat pendant la capture.
Fermer le panneau arrête la capture ; reprendre exige un retour au neutre.
Le journal garde au plus 80 événements et les 600 derniers intervalles de lecture.
Les axes, boutons nommés selon Xbox et commandes reconnues sont visibles.
Les valeurs analogiques de LT et RT sont affichées séparément.
Une disposition non standard reste signalée, sans mapping inventé.

L’export local contient le diagnostic, le navigateur, le viewport, le DPR et le
transport déclaré, sans état de combat ni envoi à un serveur. Le p95 mesure
l’intervalle entre lectures par le navigateur, **pas la latence physique
manette-écran**. Celle-ci exige un essai matériel distinct avec affichage réel.

## Charges de rendu et sessions longues

Le banc de [performance](./PERFORMANCE.md) ajoute quinze combinaisons : cinq
séquences sur chacun des trois profils graphiques.

- Franklin : salves réelles traversant l’arène.
- Tserriednich : préparation et calcul effectif de Parallel Future.
- Camilla : mort réelle par projectile de Benjamin, puis Cat’s Name.
- Yokotani : planque Heil-Ly, Morena présente et intrus déclaré ; gardes LSDF.
- Biscuit : transformation corporelle existante.

Les prémisses sont enregistrées dans l’état initial. Toutes les activations
passent par les commandes et refus réels ; les changements de manche passent par
les commandes de panneau, sans tick. Les profils graphiques rejouent les mêmes
états. Un scénario qui n’a pas effectivement montré son effet attendu échoue.

Les ressources du laboratoire sont maintenues pour charger le rendu en continu.
Camilla commence à un PV sans santé infinie afin de mourir réellement. Ces
réglages de test ne sont pas des propriétés ou des coûts canoniques du Nen.

Les intervalles sont ceux de la caméra principale : la vue supplémentaire de
Parallel Future ne compte pas comme une seconde image présentée. Le coût CPU et
GPU et les ressources décrivent ce rendu principal ; les autres callbacks restent
dans les traces brutes et leur charge contribue à la cadence réellement observée.
Les frames lentes sont conservées. Une scène en échec, des mesures tronquées,
des intervalles nuls ou un replay divergent ne peuvent pas valider le budget.
La dérive des géométries et textures compare les fenêtres de début et de fin.

Une session dure jusqu’à dix minutes ; la campagne prolongée vise au moins cinq
minutes après échauffement. Les budgets restent ceux de la référence : 59 FPS
moyens, p95 ≤ 17,5 ms, p99 ≤ 20 ms, au plus 1 % > 25 ms et CPU de rendu p95 ≤ 12 ms.
La durée GPU n’est pas assimilée au temps écran.

Depuis la racine :

```sh
pnpm --filter @black-whale/web test:step2-ui
FIGHT_PERF_SECONDS=30 FIGHT_PERF_WARMUP=8 pnpm --filter @black-whale/web test:performance:stress
FIGHT_PERF_SECONDS=300 FIGHT_PERF_CASES=projectiles-performance pnpm --filter @black-whale/web test:performance:stress
```

Le contrôle UI utilise un bundle de production, un DPR de 2 et les largeurs 1280
et 390 px. Il vérifie le framebuffer, l’identité de la simulation, les contacts,
la persistance, les deux langues et une **manette Xbox simulée explicitement
identifiée**. Il ne certifie pas une manette physique ou plusieurs machines.
Le [rapport UI](../../../ui-tests/fighting-step2/reference.json) conserve les huit
contrôles : trois profils, trois contacts, isolation des essais Xbox et réutilisation
de la vue privée. Les captures incluent aussi le panneau Xbox sur petit écran.

## Qualification

Campagne du **17 novembre 2026** : Apple M5, Mac17,3, dix cœurs, 16 Gio,
Chrome 157.0.8103.78 headless, GPU matériel ANGLE/Metal, viewport 1280 × 900,
DPR appareil 2, arène de 560 px. La charge des autres travaux du poste varie.

| Passage                                                       | Mesure après échauffement  | Résultat                                                                    |
| ------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------- |
| Matrice initiale, avant partage des géométries de projectiles | 15 cas × 30 s, chauffe 8 s | 14/15 dans le budget ; LSDF Qualité à 55,54 FPS sous forte charge           |
| Parallel Future après réutilisation de la vue                 | 30 s, chauffe 8 s          | 59,47 FPS, p99 16,8 ms ; un contexte de prévision                           |
| Franklin Performance après partage des géométries             | 300 s, chauffe 12 s        | 59,97 FPS, 17 995 images, p99 16,8 ms, CPU p95 8,7 ms ; 15 replays vérifiés |
| Contre-test LSDF Qualité                                      | 45 s, chauffe 12 s         | 59,94 FPS, p99 16,8 ms, CPU p95 10,1 ms ; budget respecté                   |

Le contre-test LSDF conserve l’empreinte de combat de la première passe.
Le premier échec reste dans le rapport : la charge moyenne à une minute y monte
d’environ 9 à 13, contre 8,2 à 6,0 pendant le contre-test. Ces relevés successifs
ne permettent pas d’attribuer tous les écarts à un seul facteur ou de garantir
la cadence sous n’importe quelle charge.

L’essai prolongé ne perd aucun échantillon ; entre ses fenêtres de début et de
fin, le nombre de géométries et de textures ne croît plus. La matrice initiale
montrait encore une hausse de 243 géométries sur Franklin Performance ; le cache
de formes corrige cette accumulation sans modifier les projectiles du moteur.
Les trois profils partagent la même empreinte de combat pour chacun des cinq
scénarios. Les statistiques GPU ne certifient pas la latence physique d’affichage.

Rapports conservés avec les empreintes des fichiers compilés :
[matrice initiale](../../../ui-tests/fighting-performance/reference/step2-initial-matrix.json),
[vue réutilisée](../../../ui-tests/fighting-performance/reference/step2-future-reuse.json),
[session prolongée](../../../ui-tests/fighting-performance/reference/step2-soak.json),
[contre-test LSDF](../../../ui-tests/fighting-performance/reference/step2-guards-recheck.json).
Les captures et traces par image restent dans les répertoires de sortie sous `/tmp/`.

Les tests automatisés couvrent le logiciel et les scénarios ci-dessus. La
qualification physique Xbox en USB/Bluetooth et les autres machines restent à
valider avec le matériel de l’utilisateur ; aucun résultat physique n’est déduit
d’une injection de boutons ou de Chrome headless.

Validation logicielle finale : **15 146 tests réussis dans 685 fichiers**, dont
13 607 tests web dans 634 fichiers ; 18 tâches de test Turbo réussies. Les autres
packages réutilisent leurs résultats valides. Le lint global, les 17 tâches de
typage et les 17 contrôles du cliquet passent ; Svelte ne signale ni erreur ni
avertissement. Le build SvelteKit de production et les huit contrôles du navigateur
passent également. Les avertissements de structure documentaire antérieurs restent
distincts de ces contrôles de code.

```sh
pnpm lint
pnpm typecheck
pnpm test:ratchet
pnpm test -- -- --maxWorkers=3 --minWorkers=1 --testTimeout=20000
pnpm --filter @black-whale/web build
```
