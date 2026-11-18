# Appuis, intentions et conversions Nen

## 1. Anatomie partagée

`fightAnatomy.ts` définit la même enveloppe de mobilité pour les poses, les appuis et les contacts. Le solveur à deux segments conserve les longueurs et un plan de flexion lié au corps, y compris près de l'extension. Les limites s'appliquent aux silhouettes du roster sans modifier les données du combat, la couleur du Nen ou les exceptions de traversée. Un objectif hors de portée ne fait pas allonger un membre ni retourner un genou.

Validation : les quarante silhouettes gardent leurs longueurs, leurs articulations et un état de combat inchangé ; les contacts réalisables restent atteignables. Les tests de séparation gardent les vrais corps projetés comme seule exception existante de ce solveur.

## 2. Déplacements et récupération au sol

La marche utilise la garde complète et un pas chassé, sans cycle civil superposé. Le même rythme détermine la jambe libre et la jambe d'appui. Les transitions conservent ainsi les jambes comme le buste. L'avance propre au coup est distribuée pendant son démarrage et atteint sa portée avant le contact ; elle ne téléporte plus le corps à la commande. Le hitstop suspend cette avance. Les projections gardent leur placement natif.

La chute se pose avant les phases de rassemblement et de poussée du relevé ; ces dernières disposent d'une plus grande part de la récupération. Les durées d'indisponibilité et les conditions de réveil restent celles du moteur.

Validation : avances graduelles et figées pendant le hitstop pour les 40 personnages, 270 conversions natives et 124 vérifications de chutes/relevés.
