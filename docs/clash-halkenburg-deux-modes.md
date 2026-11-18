# Halkenburg — deux modes de transfert

Complément du 18 novembre 2026 à l'[audit des personnages à quatre combats et plus](./clash-quatre-combats-et-plus.md), après le choix « les deux ». Les règles passent à `clash-combat-36`.

Dans **Techniques et préparations**, choisir le mode avant le tir. La sélection est disponible en duel local, contre l'IA et en PvP ; les matchs par équipes conservent pour l'instant la variante du roster. Le choix reste le même au round suivant. Il ne réécrit pas une flèche déjà lancée.

| Mode                                         | Effet                                                                                                                                                                                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Variante du roster**, sélection par défaut | Variante demandée précédemment : un corps aléatoire du roster remplace Halkenburg dans son camp, avec ses coups et son Hatsu. Les proportions de PV, le groupe consenti, les coûts et les règles existantes restent conservés.                                                 |
| **Transfert de conscience**                  | La flèche engage Halkenburg ou un partisan réellement présent. Sa conscience occupe le corps atteint ; celle de la cible occupe son corps d'origine et reste assoupie tant que l'autre est éveillée. Aucun nouveau personnage du roster n'est tiré et aucun PV n'est restauré. |

## Corps et contrôle

Le joueur continue à contrôler sa propre conscience lorsqu'elle est éveillée : le modèle, la position, les PV, les blessures, les armes et les munitions correspondent au corps réellement occupé. Le corps endormi reste présent, couché et vulnérable. Ses commandes de déplacement, garde, frappe et parole sont bloquées ; un simple délai de 120 frames ne met pas fin au transfert.

Si un partisan est sélectionné, son corps matériel de scénario devient le corps jouable de la conscience adverse. Le corps de la cible devient un allié autonome du camp d'Halkenburg. La représentation initiale du partisan est retirée du décor afin de ne pas dupliquer le corps. Son gabarit et ses statistiques physiques sont des réglages de duel ; aucun Hatsu personnel ni pistolet ne lui est inventé. L'allié utilise les ressources physiques du corps occupé et peut attaquer bas contre un corps couché.

Le transfert ne donne pas le Hatsu du corps occupé. Les usages personnels dans un corps étranger et leurs interactions non démontrées ne sont pas extrapolés. Le mode limite chaque corps à une seule paire liée ; les transferts successifs vers un troisième corps ne sont pas simulés. Cette limite de représentation ne constitue pas une restriction canonique affirmée.

## Sommeil et décès

Les repères sont les [premières observations du chapitre 382](https://hunterxhunter.fandom.com/wiki/Chapter_382) et les [explications et conclusions d'Halkenburg au chapitre 404](https://hunterxhunter.fandom.com/wiki/Chapter_404). Ces synopsis secondaires permettent de retrouver les scènes ; les conclusions du prince ne deviennent pas des preuves supplémentaires sur tous les croisements possibles de pouvoirs.

- Une seule conscience de la paire est éveillée. **S'endormir volontairement** cède la priorité pendant trois secondes de duel ; à l'échéance, la conscience injectée retrouve sa priorité tant que les deux corps vivent. Halkenburg peut aussi donner cet ordre à un partisan consentant éveillé, à portée de voix. Il ne commande pas ainsi la conscience de l'ennemi.
- Si le corps occupé meurt en premier, le moteur suit la conclusion du prince : la conscience injectée est perdue et la conscience de la cible peut se réveiller dans le corps restant. Ce décès n'est pas annulé par une expiration de paralysie.
- Si le corps d'origine meurt en premier, la conscience de la cible retourne dans son propre corps, où les deux consciences coexistent ; elle a alors priorité. Le corps mort reste mort. Son joueur n'est pas déclaré éliminé tant que sa conscience survit dans l'autre corps.
- Si les deux corps sont détruits, aucun esprit vivant n'est reconstruit dans un corps neuf. Les pouvoirs post-mortem du corps occupé ne sont pas attribués automatiquement à une conscience étrangère.

La préparation de scénario **Sédatif pour le retour de conscience** adapte le résultat recherché au chapitre 404 : avant la mort du corps d'origine, la conscience injectée peut dépenser une fois cette ressource dans le corps occupé. La préparation restante maintient la conscience revenue assoupie. La durée est comprimée à dix secondes, comptées dès l'emploi ; le texte du chapitre évoque dix heures. Le moteur n'affirme pas comment une substance affecterait sélectivement des consciences et ne simule aucun mécanisme chimique.

## Présentation, réseau et replays

Le panneau distingue mode, corps matériel, conscience du joueur, sommeil et coexistence. Le rendu et les volumes de collision suivent les corps ; les corps supplémentaires sont libérés avec la scène. Leur identité matérielle reste stable pour le champ illusoire de Tserriednich.

Les commandes réseau transmettent uniquement un choix de mode ou une action. Elles ne peuvent fournir une conscience, un corps ou un résultat. Les replays reconstruisent sélection, tir, sommeil et changements de contrôle. Les snapshots reconnaissent le corps matériel actuel sans perdre les identités du roster choisies au départ. L'identité privée de l'autre conscience et la préparation adverse ne sont pas divulguées ; les positions et le sommeil des corps restent observables.

Les tests dédiés couvrent les deux places de joueur, les refus de conditions, les ressources conservées, les dégâts sur les corps endormis, les deux ordres de décès, la coexistence, la préparation de scénario, les alliés, le rendu, les données privées, les replays et le retour aux corps sélectionnés au round suivant.

Validation du complément : **29 tests dédiés réussis**, contrôles ESLint réussis et vérification Svelte/TypeScript sans erreur ni avertissement. Les régressions couvrent notamment le moteur existant, les anciens lots d’audit, les replays et la matrice de prédiction PvP du roster.
