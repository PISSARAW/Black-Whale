# Tactiques Nen et continuité des échanges

## 1. Intention personnelle et ressources

`nenTacticalIntent.ts` partage les priorités déjà écrites pour chaque personnage entre les deux sièges, le CPU et le contrôleur réactif. Une projection de budget permet de prévoir le coût ; elle ne crée ni capacité, ni consentement, ni équipement. L'exécution conserve les règles natives. La réserve visée et l'hystérésis évitent de repartir au contact après avoir récupéré juste assez d'aura pour un coup. Les catégories et maîtrises existantes définissent les distances. Un plan explicite reste prioritaire.

Validation : symétrie des 40 personnages, ressources absentes, pureté de l'évaluation et sortie de récupération.

## 2. Branches gagnées par la préparation

Une vraie touche physique renforcée par Ko ou un Ryu d'au moins 60 % ouvre une conversion personnelle supplémentaire. Il faut une confirmation, une maîtrise du renforcement et une fenêtre de douze frames d'attaque ; une seule branche ajoutée par séquence empêche les boucles. Les coûts et conditions du coup suivant restent contrôlés par le moteur. Un projectile ne valide pas par erreur la préparation du coup physique en cours.

Validation : contacts natifs pour les 40 personnages et absence de branche sans préparation.

## 3. Réactions continues et chutes motivées

Le recul des frappes ordinaires reste au sol ; balayages, projections, Ko critiques et techniques puissantes conservent leur chute. Le nouveau choc reprend une part bornée du déséquilibre précédent, y compris après un projectile, puis la dissipe en quatre frames de réaction. Aucune extension artificielle du hitstun ni déplacement visuel de la racine : le moteur conserve la séparation et les exceptions de traversée. Les auras continuent d'utiliser les couleurs natives.

Validation : 40 silhouettes, chutes décisives, garde et continuité bornée sans mutation de l'état.

## 4. Ripostes atteignables

`recoveryPunish.ts` évalue le temps restant, le démarrage du coup, le trajet à pied et le délai de réaction du style. L'observation de la récupération est suivie dans les deux sièges ; le délai déjà écoulé n'est pas compté une seconde fois et une réaction immédiate n'est pas accordée. Il refuse une cible invisible, un corps indisponible et une pression confirmée encore annulable. Les deux contrôleurs privilégient uniquement les ripostes admissibles et ne gardent plus automatiquement face à toute récupération. Les engagements Nen bénéficient d'une accentuation corporelle pendant leur retour en garde.

Validation : fenêtres de récupération sur les 40 personnages, distance, privation de vue, hitstun et pression annulable.

## 5. Comparaison reproductible à 60 images/s

La démonstration `demos/fighting-nen-benchmark` rejoue trois duels natifs avec les mêmes graines, personnages, conditions initiales et protocole de contrôle avant/après. Chaque tick simulé fournit une image encodée à 60 images/s ; aucune conversion d'une vidéo 30 images/s. Les replays sont vérifiés par resimulation et les rapports gardent les impacts réels. La caméra principale conserve son comportement natif, sans vue secondaire ni secousse. La comparaison montre des situations qui divergent en conséquence des décisions, pas des contacts scénarisés identiques.
