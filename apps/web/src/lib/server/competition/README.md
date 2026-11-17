# Coordination compétitive

Une instance Node possède les salons PvP en mémoire et les fichiers durables du
répertoire `CLASH_DATA_DIR`. Le volume doit persister entre redémarrages. Plusieurs
workers écrivains ne sont pas pris en charge : utiliser un seul coordinateur.

Les identités sont authentifiées par `clashSeasons.identify`. Les jetons de place
et les sondes de connexion restent en mémoire ; ils ne sont jamais publiés dans
l’historique. Les événements terminaux proviennent du registre autoritaire.

Le journal durable précède l’attribution Elo. Un reçu permet de retenter celle-ci
sans compter deux fois une série, y compris au changement de mois. Un redémarrage
conserve les scores validés et interrompt sans vainqueur le match encore en cours.
Les participants peuvent le rejouer avec les règles ordinaires, sans restaurer
un corps depuis une vue privée du navigateur.
