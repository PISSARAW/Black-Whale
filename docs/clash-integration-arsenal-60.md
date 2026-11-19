# Intégration des arsenaux avec les corps de soutien

Le ruleset 60 intègre les kaméos arrivés sur `main` après le ruleset 59.
Le catalogue des quarante combattants et les usages ajoutés précédemment
conservent leurs conditions ; les nouveaux corps de soutien ne doivent pas
devenir un moyen de suspendre les horloges de matière ou de terminer un prêt.

Le parcours des corps physiques couvre maintenant les acteurs du duel,
les réservistes, les invités et les kaméos. Il applique la même réconciliation
matérielle à ces corps quand ils attendent hors scène, sans faire avancer une
seconde fois leurs attaques. Sans corps supplémentaire, le parcours conserve
le même état du duel.

Une implantation des trois aiguilles d’Illumi sur Tubeppa est testée par le vrai
moteur de contact. Fermer la page termine son remodelage même après sa sortie
de scène ; les aiguilles réelles restent présentes. Un prêt de Dolphin demeure
occupé sur ce corps et sa terminaison retire uniquement son propre effet.
Les vues privées masquent la provenance étrangère sur le corps du kaméo.
La matière de Gallery Fake garde son parent et expire pendant hitstop, même
sur un corps en réserve. Les copies marquées par Sun and Moon conservent leur
exception distincte de persistance.

Le cache de scène du soutien suit aussi les changements de géométrie du corps,
comme celui du duel principal. Des aiguilles nouvellement implantées apparaissent
sur le modèle existant ; un déplacement seul ne reconstruit pas ses articulations.
Le test de scène vérifie apparition, retrait, réemploi et nettoyage du modèle.

Les 96 flux originaux sont réenregistrés dans une nouvelle référence `v60` ;
les références publiées jusqu’à `v59` sont conservées. Les tests des kaméos,
des arsenaux, des replays et du On accompagnent cette intégration. Le On reste
présent. Cette vérification de compatibilité ne certifie pas un arsenal à 100 %
et ne transforme pas les adaptations de soutien en conditions révélées du manga.
