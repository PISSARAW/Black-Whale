# Halkenburg — deux modes de transfert

Complément du 18 novembre 2026 à l'[audit des personnages à quatre combats et plus](./clash-quatre-combats-et-plus.md), après le choix « les deux ». La première version utilisait `clash-combat-36`. L’extension aux équipes et aux transferts successifs utilise **`clash-combat-37`**.

Dans **Techniques et préparations**, choisir le mode avant le tir. La sélection est disponible en duel local, contre l'IA, en PvP et dans les équipes locales existantes. Le choix reste le même au round suivant. Il ne réécrit pas une flèche déjà lancée.

| Mode                                         | Effet                                                                                                                                                                                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Variante du roster**, sélection par défaut | Variante demandée précédemment : un corps aléatoire du roster remplace Halkenburg dans son camp, avec ses coups et son Hatsu. Les proportions de PV, le groupe consenti, les coûts et les règles existantes restent conservés.                                                 |
| **Transfert de conscience**                  | La flèche engage Halkenburg ou un partisan réellement présent. Sa conscience occupe le corps atteint ; celle de la cible occupe son corps d'origine et reste assoupie tant que l'autre est éveillée. Aucun nouveau personnage du roster n'est tiré et aucun PV n'est restauré. |

## Corps et contrôle

Le joueur continue à contrôler sa propre conscience lorsqu'elle est éveillée : le modèle, la position, les PV, les blessures, les armes et les munitions correspondent au corps réellement occupé. Le corps endormi reste présent, couché et vulnérable. Ses commandes de déplacement, garde, frappe et parole sont bloquées ; un simple délai de 120 frames ne met pas fin au transfert.

Si un partisan est sélectionné, son corps matériel de scénario devient le corps jouable de la conscience adverse. Le corps de la cible devient un allié autonome du camp d'Halkenburg. La représentation initiale du partisan est retirée du décor afin de ne pas dupliquer le corps. Son gabarit et ses statistiques physiques sont des réglages de duel ; aucun Hatsu personnel ni pistolet ne lui est inventé. L'allié utilise les ressources physiques du corps occupé et peut attaquer bas contre un corps couché.

Le transfert ne donne pas le Hatsu du corps occupé. **L’arc personnel d’Halkenburg suit désormais sa conscience** : les commandes « Arc de sa conscience » et « Flèche basse » restent disponibles dans le corps occupé. Elles exigent l’aura du corps, les huit secondes de volonté commune, un groupe marqué et consentant réellement présent, et une préparation vulnérable. Le tir bas utilise une trajectoire basse fixée au départ pour atteindre un corps couché ; il ne poursuit pas une cible. L’IA utilise aussi ces commandes. Les autres Hatsu personnels en corps étranger et leurs croisements non démontrés ne sont pas extrapolés.

## Transferts successifs

Chaque conscience possède une seule entrée et un seul emplacement dans le registre du moteur. Les liens conservent l’historique des tirs ; ils ne réappliquent pas d’anciens échanges à chaque frame. Une nouvelle flèche peut donc atteindre un corps déjà impliqué, passer par trois corps, puis quatre ou davantage, ou revenir dans un ancien corps. Les blessures et les réserves restent celles de chaque corps matériel. Depuis un corps partagé, seule la conscience sélectionnée part ; les autres occupants y restent.

Pour étendre les observations à ces configurations, le jeu retient **au plus une conscience éveillée par chaîne connectée**, la priorité à la dernière conscience injectée et une nouvelle priorité à une conscience revenue après la mort de son corps d’accueil. Une conscience déplacée retient le corps à rejoindre si son accueil meurt ; ce retour ne peut viser un cadavre. La mort d’un ancien hôte ne tue pas à distance une conscience qui l’a déjà quitté. Les cadavres ne sont jamais reconstruits. Ces règles d’enchaînement sont des **conventions de jeu explicites**, et non l’affirmation que tous ces croisements sont démontrés dans le manga.

## Équipes

Un Halkenburg encore indépendant peut choisir le transfert à son entrée depuis la réserve, même si une autre chaîne existe déjà. La variante du roster conserve ses techniques et sa place dans ce même monde ; elle ne remplace pas un corps déjà lié.

Les places du roster suivent leurs consciences. Un corps original mort ne fait pas perdre une vie si sa conscience survit ailleurs ; deux places ne créent pas deux copies d’un corps partagé. Les panneaux conservent le nom du personnage choisi et précisent le corps occupé ou l’attente de sa conscience.

Les réserves restent hors scène et ne deviennent pas des cibles à distance. Un Halkenburg appelé en relais conserve sa propre place du roster. Un transfert interrompt le retour automatique des relais en cours : le combattant présent reste engagé, et le relais consommé ne revient pas. Une chaîne engagée ne peut pas être mise en réserve pour suspendre ses blessures, son sommeil ou ses effets.

À la manche suivante du set, le prochain membre encore en lice entre sans effacer les transferts : corps occupés, PV, aura, munitions, corps morts et partisans consommés persistent. Les horloges du monde ne repartent pas de zéro lors du changement de membre. Une défaite au temps retire la place du set sans déclarer artificiellement morts le corps et sa conscience. Elle ne restaure ni une vie ni des PV à un cohabitant.

## Sommeil et décès

Les repères sont les [premières observations du chapitre 382](https://hunterxhunter.fandom.com/wiki/Chapter_382) et les [explications et conclusions d'Halkenburg au chapitre 404](https://hunterxhunter.fandom.com/wiki/Chapter_404). Ces synopsis secondaires permettent de retrouver les scènes ; les conclusions du prince ne deviennent pas des preuves supplémentaires sur tous les croisements possibles de pouvoirs.

- Pour deux consciences, une seule est éveillée ; la convention de chaîne ci-dessus généralise ce choix. **S'endormir volontairement** cède la priorité pendant trois secondes de duel ; à l'échéance, la conscience injectée retrouve sa priorité tant que les deux corps vivent. Halkenburg peut aussi donner cet ordre à un partisan consentant éveillé, à portée de voix. Il ne commande pas ainsi la conscience de l'ennemi.
- Si le corps occupé meurt en premier, le moteur suit la conclusion du prince : la conscience injectée est perdue et la conscience de la cible peut se réveiller dans le corps restant. Ce décès n'est pas annulé par une expiration de paralysie.
- Si le corps d'origine meurt en premier, la conscience de la cible retourne dans son propre corps, où les deux consciences coexistent ; elle a alors priorité. Le corps mort reste mort. Son joueur n'est pas déclaré éliminé tant que sa conscience survit dans l'autre corps.
- Si les deux corps sont détruits, aucun esprit vivant n'est reconstruit dans un corps neuf. Les pouvoirs post-mortem du corps occupé ne sont pas attribués automatiquement à une conscience étrangère. Les pouvoirs déjà présents de Camilla et d’Hisoka restent applicables aux coéquipiers dont la conscience n’a pas été transférée ; une résurrection réelle restaure leur vie dans le compteur de l’équipe.

La préparation de scénario **Sédatif pour le retour de conscience** adapte le résultat recherché au chapitre 404 : avant la mort du corps d'origine, la conscience injectée peut dépenser une fois cette ressource dans le corps occupé. La préparation restante maintient la conscience revenue assoupie. La durée est comprimée à dix secondes, comptées dès l'emploi ; le texte du chapitre évoque dix heures. Le moteur n'affirme pas comment une substance affecterait sélectivement des consciences et ne simule aucun mécanisme chimique.

## Présentation, réseau et replays

Le panneau distingue mode, corps matériel, conscience du joueur, sommeil et coexistence, et liste les corps de la chaîne avec leurs PV et leur état. Le rendu et les volumes de collision suivent les corps ; les corps supplémentaires sont libérés avec la scène. Leur identité matérielle reste stable pour le champ illusoire de Tserriednich.

Les commandes réseau transmettent uniquement un choix de mode ou une action. Elles ne peuvent fournir une conscience, un corps ou un résultat. Les replays de duel reconstruisent sélection, tirs successifs, sommeil et changements de contrôle. Le PvP conserve l’identité privée des consciences ; une flèche de transfert engagée et une chaîne active restent sous l’autorité confirmée du serveur, sans prédiction d’un nouveau corps. Les équipes restent dans le périmètre local existant : leurs outils de replay et leur PvP ne sont pas ajoutés par cette extension. Les snapshots reconnaissent le corps matériel actuel sans perdre les identités du roster choisies au départ. L'identité privée de l'autre conscience et la préparation adverse ne sont pas divulguées ; les positions et le sommeil des corps restent observables.

Les tests dédiés couvrent les deux places de joueur, les refus de conditions, les ressources conservées, les dégâts sur les corps endormis, les deux ordres de décès, la coexistence, la préparation de scénario, les alliés, le rendu, les données privées, les replays et le retour aux corps sélectionnés au round suivant en duel. L’extension couvre également les chaînes à trois et quatre corps, le départ d’un corps partagé, les anciens hôtes détruits, les places P1/P2, les réserves, le relais interrompu, les vies conservées par une conscience, les défaites au temps, la continuité du set, l’IA et la clause de Judgment Chain sur le nouvel arc.

Validation de l’extension : **58 tests dédiés réussis**, **35 suites et 3 150 tests au total** sur une copie isolée des sources de l’application (`a8bc09cf5` + cette extension). ESLint passe sur les fichiers modifiés ; Svelte/TypeScript ne signale aucune erreur ni aucun avertissement dans cette copie. Les régressions couvrent le moteur existant, les équipes, les anciens lots d’audit, les replays et la matrice de prédiction PvP du roster.

Les trois écarts de snapshots globaux observés dans le checkout partagé (Machi/Leorio et Voconte/Feitan) ont été reproduits à l’identique sans cette extension. Leurs références ne sont pas modifiées. Le test de registre encore fondé sur une paralysie de 120 frames vérifie désormais la variante du roster déjà demandée : charge réelle, coût conservé, corps remplacé et partisan engagé.

Vérification ciblée :

```sh
pnpm --filter @black-whale/web exec vitest run halkenburgSoul teamMatch teams/teams
```
