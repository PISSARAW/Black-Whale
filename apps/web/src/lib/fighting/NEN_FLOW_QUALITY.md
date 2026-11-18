# Appuis, intentions et conversions Nen

## 1. Anatomie partagée

`fightAnatomy.ts` définit la même enveloppe de mobilité pour les poses, les appuis et les contacts. Le solveur à deux segments conserve les longueurs et un plan de flexion lié au corps, y compris près de l'extension. Les limites s'appliquent aux silhouettes du roster sans modifier les données du combat, la couleur du Nen ou les exceptions de traversée. Un objectif hors de portée ne fait pas allonger un membre ni retourner un genou.

Validation : les quarante silhouettes gardent leurs longueurs, leurs articulations et un état de combat inchangé ; les contacts réalisables restent atteignables. Les tests de séparation gardent les vrais corps projetés comme seule exception existante de ce solveur.

## 2. Déplacements et récupération au sol

La marche utilise la garde complète et un pas chassé, sans cycle civil superposé. Le même rythme détermine la jambe libre et la jambe d'appui. Les transitions conservent ainsi les jambes comme le buste. L'avance propre au coup est distribuée pendant son démarrage et atteint sa portée avant le contact ; elle ne téléporte plus le corps à la commande. Le hitstop suspend cette avance. Les projections gardent leur placement natif.

La chute se pose avant les phases de rassemblement et de poussée du relevé ; ces dernières disposent d'une plus grande part de la récupération. Les durées d'indisponibilité et les conditions de réveil restent celles du moteur.

Validation : avances graduelles et figées pendant le hitstop pour les 40 personnages, 270 conversions natives et 124 vérifications de chutes/relevés.

## 3. Priorité des intentions

Le contrôleur local et le CPU natif cessent les nouvelles dépenses offensives pendant leur récupération. Les mouvements défensifs restent possibles ; aucun Zetsu n'est commandé au contact. Le contrôleur ne remplace plus un ordre de retraite par une série de coups ordinaires. Les seuils d'entrée et de sortie gardent une marge distincte, même pour une technique coûteuse.

Validation : pour les quarante combattants, les deux contrôleurs honorent la récupération, s'éloignent et ne créent ni aura ni matériel. Les 58 scénarios de l'arsenal et ses conditions restent valides.

## 4. Conversions exécutées et redistribution

Les deux contrôleurs utilisent `nenComboDecision` : ils choisissent une continuation réellement prête, ou commandent un vrai transfert si le temps restant le permet. Le contrôleur rapide ne bloque plus une continuation derrière son délai de décision ordinaire. Les styles de proximité approchent pour leur première préparation physique avant de dépenser leur Hatsu ; les styles de distance conservent leur portée.

Une branche supplémentaire exige maintenant la répartition requise dans la zone du coup suivant. La question de Lynch, un contrat de Longhi et les autres utilitaires sans frappe ne deviennent pas des branches offensives. Les techniques gardent leurs conditions natives ; aucune charge, cible, signature ni ressource n'est créée. Les flux utilisent la couleur existante de chaque propriétaire. Le CPU ne remplace pas sa répartition offensive pendant une frappe engagée.

Validation : les quarante combattants consomment une branche gagnée sur une vraie touche, avec redistribution native quand nécessaire ; les 270 conversions précédentes restent valides. Les combats autonomes enregistrent les conversions consommées, au lieu de se limiter au compteur de touches.
