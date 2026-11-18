# Présentation et collection

L’[étape 9](../STEP9.md) ajoute des textes originaux et une garde-robe locale.
`dialogues.ts` couvre les quarante combattants sélectionnables ; `rivals.ts`
choisit huit échanges à partir des seules identités publiques. `ceremony.ts`
attend un verdict réel pour les fins, sans annoncer un pouvoir caché.

Les duels contre l'IA et en local jouent une introduction dans leur décor réel :
2,4 secondes par combattant, puis 1,6 seconde pour le signal de départ.
`introPlayback.ts` conserve le simulateur en phase `ready` jusqu'à la fin ;
`introMotion.ts` échantillonne une chorégraphie dédiée et `introCamera.ts`
cadre chaque personnage. Aucun Easter Egg n'est activé ou découvert.
Le mode bref conserve seulement le signal ; le mode désactivé lance directement
le combat une fois la scène chargée. Entrée, Espace, le bouton Passer et le bouton
principal d'une manette passent la scène. Pause et onglet masqué figent la lecture.
Les mouvements réduits conservent le cadrage de jeu et les poses ordinaires.
L'entraînement et les replays gardent leur lancement habituel.

`introPerformancesOne.ts` à `introPerformancesFour.ts` écrivent les quarante
préparations, chacune avec trois poses, trois clés de caméra et son rythme.
Hisoka invite l'adversaire pendant une orbite légèrement inclinée ; Benjamin
salue dans une contre-plongée ; Feitan remonte son col puis descend sur ses
appuis ; Bonolenov ouvre une courte phrase dansée. Les autres personnages ont
également leurs gestes et leurs trajectoires propres. Ces scènes cosmétiques
ne chargent aucun Hatsu et ne créent aucun accessoire de jeu.

`introPerformanceSample.ts` synchronise les articulations et la caméra sur
les mêmes temps forts. `introFreeCamera.ts` anime réellement l'angle orbital,
la hauteur, la distance et la visée en 3D, puis élargit continûment le cadre
à partir de la tête, des mains et des pieds animés (`introLandmarks.ts`).
Le cadrage suit les deux orientations et le format portrait. Les conventions
anatomiques des armes et accessoires restent celles du rig de combat.

`intro.test.ts` couvre l'horloge, le chargement, les échecs de rendu, les réglages,
les deux places des quarante combattants et l'absence de mutation du duel.
`introPerformances.test.ts` vérifie la couverture exacte du roster, l'unicité,
les temps forts, le retour en garde, la continuité et le cadrage des orbites.
`node scripts/check-fighting-introduction.mjs` (depuis `apps/web`) vérifie la scène
de production, le lancement automatique, les commandes de passage, six mises en
scène à deux temps distincts et le mobile dans la place P2.

`profile.ts` conserve les préférences dans une clé distincte de la carrière et
revalide les récompenses à partir de la sauvegarde solo existante. Les trois
routes donnent leurs titres ; Protéger et tenir débloque aussi la palette ivoire.
La palette ardoise est disponible immédiatement. Aucun déblocage compétitif.

`wardrobe.ts` modifie seulement les couleurs des tissus ordinaires, conserve les
panneaux de peau et rétablit les vêtements de référence pendant les apparences
transformées. `figures.ts` réutilise les constructeurs chargés à la demande,
sans modifier les collisions, événements, ressources, replays ou paquets PvP.
P1/P2 désignent les deux places physiques, indépendamment du spectateur.
