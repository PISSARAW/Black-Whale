# Intégration de l’arsenal — ruleset 45

Le ruleset **clash-combat-45** réunit les développements de `main`
(`bb76fe426`) et les ancrages matériels de la branche d’arsenal
(`77603e3b`). Le On reste présent. L’[audit courant](./audit-hatsu-fighting.md)
reste ouvert.

Le réseau de Bungee Gum, ses membres d’émission, ses projectiles retenus et ses
accents graphiques sont conservés. Les connexions supplémentaires au contact
gardent leurs supports physiques et la provenance de leur Nen. La dépense de
Dolphin et les commandes de fin d’usage prennent en compte les deux applications.
Leurs champs d’état décrivent des connexions distinctes, sans dupliquer les objets.

Le rendu du papier utilise les projectiles réellement émis et les confettis
physiques restants. Les tests graphiques ne demandent plus trois projectiles
supplémentaires à une émission représentée par un seul lot. Le contrôle de la
réémission compare les identifiants avant et après la commande réelle.

Une dépendance entre l’aperçu des commandes d’ancrage et l’arsenal central faisait
dépasser le budget JavaScript après intégration. L’aperçu utilise directement son
gestionnaire avec le canal d’aura prélevée. Le plafond demeure de 500 000 octets
par fichier client ; la compilation produit un maximum de 497 042 octets.

## Références et validation

La bibliothèque `reference/v45` enregistre les 96 flux de commandes historiques
sans changer leurs paquets d’entrée. Chaque prémisse initiale est vérifiée ;
les résultats sont enregistrés sous le nouveau moteur. Les bibliothèques
précédentes, leurs empreintes et leurs versions restent conservées.

Une mesure indépendante des routes courantes a également enregistré et rejoué
980 cas, sans route incomplète. Elle reste distincte de la qualification des
commandes historiques.

La suite complète de combat a exécuté 373 fichiers : 355 réussis, 18 en échec,
avec 16 219 tests réussis, 29 échecs et 123 tests de qualification alors sans
bibliothèque de version 45. Les 29 échecs ont été reproduits sur le code exact
de `bb76fe426`, dont les 1 722 fichiers de combat de la copie de comparaison
ont été vérifiés par empreinte Git.

Les trois attentes obsolètes du rendu papier ont ensuite été corrigées et leurs
14 tests repassés. La bibliothèque historique versionnée rend à nouveau
exécutables les 123 tests de qualification. Les autres échecs hérités restent
à traiter ; cette intégration ne les présente pas comme des validations réussies.

Les vérifications d’interface couvrent les deux systèmes d’ancrage d’Hisoka,
l’interrogatoire libre et les récepteurs de papier, y compris sur mobile.
Les contrôles TypeScript et les règles du dépôt sont également exécutés.
Ces vérifications ne certifient pas un arsenal terminé à 100 %.
