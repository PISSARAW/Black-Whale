# Appuis, intentions et conversions Nen

## 1. Anatomie partagée

`fightAnatomy.ts` définit la même enveloppe de mobilité pour les poses, les appuis et les contacts. Le solveur à deux segments conserve les longueurs et un plan de flexion lié au corps, y compris près de l'extension. Les limites s'appliquent aux silhouettes du roster sans modifier les données du combat, la couleur du Nen ou les exceptions de traversée. Un objectif hors de portée ne fait pas allonger un membre ni retourner un genou.

Validation : les quarante silhouettes gardent leurs longueurs, leurs articulations et un état de combat inchangé ; les contacts réalisables restent atteignables. Les tests de séparation gardent les vrais corps projetés comme seule exception existante de ce solveur.
