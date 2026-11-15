# Catégories de Nen dans `/tour`

Statut : spécification de simulation. Elle complète les règles canoniques sans
présenter ses valeurs numériques comme des données du manga.

## Principes

- L'**affinité naturelle** décrit la catégorie d'un utilisateur.
- La **maîtrise** décrit son entraînement dans chaque catégorie, de 0 à 100.
- La **réserve d'aura** paie les actions et leur entretien.
- Le **répertoire appris** est la seule source des capacités disponibles. Une
  catégorie ne donne jamais tous les pouvoirs de sa famille.
- Les techniques communes (Ten, Ren, Zetsu, Gyō, En, Ken, Kō, Ryū et Shū)
  restent indépendantes du répertoire de Hatsu.
- `unknown` reste une information valide pour les personnages dont l'affinité
  n'est pas établie.

## Efficacité de simulation

Pour une action d'une catégorie, le moteur combine une proximité sur
l'hexagone et la maîtrise de cette catégorie :

`efficacité = proximité × maîtrise / 100`

| Distance depuis l'affinité | Efficacité maximale de simulation |
| -------------------------- | --------------------------------: |
| Catégorie naturelle        |                             100 % |
| Voisine                    |                              80 % |
| Deux crans                 |                              60 % |
| Opposée                    |                              40 % |

La proximité ne remplace pas les conditions d'une capacité. Elle ajuste un
paramètre déclaré par l'action (puissance, portée, durée ou coût), jamais tous
les paramètres à la fois. La Spécialisation n'est pas une case générique : une
capacité spécialiste fonctionne uniquement selon ses propres règles. Une
affinité inconnue n'invente aucun bonus et emploie la maîtrise déclarée.

## Résolution d'une action

Toute action contextuelle déclare :

1. la capacité apprise qui l'autorise ;
2. sa catégorie principale et, si nécessaire, ses catégories auxiliaires ;
3. ses conditions (cible, portée, préparation et mode d'aura) ;
4. son coût initial et son entretien ;
5. le seul paramètre modulé par l'efficacité ;
6. ses changements du monde, traces et témoins possibles.

L'aperçu et l'exécution passent par le même résolveur. Un refus fournit un code
stable : capacité non apprise, Zetsu, aura insuffisante, cible incompatible,
hors de portée ou préparation absente.

## Boucle pilote

La zone de service du Tier 5 contient une porte verrouillée, un panneau de
commande, une caisse mobile et une personne à secourir. Elle doit pouvoir être
résolue sans Nen ou par six capacités de simulation clairement étiquetées :

- effort renforcé (Renforcement) ;
- impulsion distante (Émission) ;
- lien adhésif (Transformation) ;
- outil déterminé (Matérialisation) ;
- commande d'un objet marqué (Manipulation) ;
- lecture conditionnelle d'une trace (Spécialisation).

Les dégâts, le bruit, les traces, les témoins, les incidents et l'aura engagée
survivent au changement de pièce et à la sauvegarde. Le monde mémorise ce qui
s'est produit séparément de ce que chaque témoin en sait.

## Critères d'acceptation

- Une ancienne sauvegarde est migrée sans perte de progression.
- Un aperçu annonce le coût, les risques et la raison d'un éventuel refus.
- Deux profils différents obtiennent des résultats ou des coûts différents sur
  la même interaction.
- Un effet maintenu ne peut pas être rendu gratuit par sauvegarde/rechargement.
- Zetsu bloque les actions alimentées en aura ; Gyō peut révéler une trace et
  Ryū reste une répartition corporelle distincte de l'affinité.
- La zone pilote possède au moins une solution ordinaire sans Nen.
