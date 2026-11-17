# Étape 3 — échanges, identité et essais d’équilibrage

Cette étape approfondit les outils existants des quarante combattants. Elle
ajoute un banc reproductible et des situations pour les parties de test. Les
conditions, équipements, coûts et effets personnels du Nen suivent toujours
l’[audit](../../../../../docs/audit-hatsu-fighting.md). Les personnages de soutien
conservent leurs capacités de soutien et leurs coups physiques.

## Correction issue des mesures

Le premier relevé répète le léger debout pendant 600 ticks contre Bill au coin
droit, sans déplacement ni défense. Les PV infinis servent uniquement à prolonger
l’observation ; l’aura reste finie. Pour les quarante attaquants, la cible n’a
aucune frame observée avec hitstun et hitstop tous deux terminés. Une seule chaîne
atteint 30 à 40 contacts en dix secondes. Les timings de récupération existants
et le hitstun garanti aux routes permettent donc une répétition indéfinie au coin.

`groundedComboStun.ts` corrige cette situation par un réglage arcade :

- Les trois premières touches d’une chaîne conservent leur hitstun.
- À partir de la quatrième, le hitstun d’un coup physique au sol perd quatre
  frames par touche supplémentaire, avec un minimum d’une frame.
- La réduction s’applique après les bonus existants de contre et de mur.
- Elle concerne les normales et coups directionnels au corps à corps. Les
  projectiles, projections, Hatsu et cibles déjà aériennes gardent leurs règles.
- Les timings de départ, récupération, portée, dégâts, mobilité et coûts ne sont
  pas modifiés. Le blocage garde son blockstun ; aucune échappatoire automatique,
  armure, invulnérabilité ou technique de Nen n’est ajoutée.

Cela ne fixe pas un plafond universel de six touches : les mesures des répétitions
de légers atteignent au plus six touches avant qu’une défense soit possible.
Une route valide conserve sa confirmation et ses cancels. Les 160 routes restent
couvertes à plusieurs distances, dans les deux sens, au centre et au coin.

La règle utilise les contacts réellement résolus, sans compteur externe au
combat. Un projectile ne prend pas les propriétés de l’attaque que son propriétaire
effectue au moment de sa collision. Les juggles et leur plafond existant restent
distincts de la réduction du hitstun au sol.

## Replays et PvP

Le ruleset devient `clash-combat-5`. Les imports de replays antérieurs sont refusés
avec `replay-version` : leur simulation ne doit pas être silencieusement modifiée.
Le protocole PvP compose déjà sa version avec ce ruleset ; serveur et clients
doivent utiliser la même version. Les rapports historiques des étapes antérieures
conservent leurs anciennes versions et leurs mesures.

Un test enregistre une vraie pression de Feitan contre Bill, la reprise de garde,
puis resimule la séquence et compare les empreintes de fin et les checkpoints.

## Situations jouables et observations

Dans le laboratoire, ouvrir **Essais d’équilibrage · échanges et contre-jeu**.
Les deux fiches reprennent les plans et réponses déjà écrits pour chaque
personnage. Elles affichent aussi les paramètres physiques de référence : startup
et récupération du léger, portée et vitesse de marche. Ces valeurs excluent les
modificateurs temporaires et ne classent pas la puissance des personnages du manga.

Les sept situations sont :

| Situation                   | Question à éprouver                                                               |
| --------------------------- | --------------------------------------------------------------------------------- |
| Distance et coups ratés     | Peut-on faire manquer un lourd puis punir sa récupération ?                       |
| Approche et anti-air        | Quelles approches au sol et en saut sont trop prévisibles ?                       |
| Projectiles et soutien      | Peut-on avancer entre deux tirs avec les outils réels du personnage ?             |
| Frappe et projection        | Le saut, la déprojection et la punition d’une projection ratée fonctionnent-ils ? |
| Pression au coin            | Quand la garde revient-elle après une longue chaîne physique ?                    |
| Mise au sol et relevée      | Comment se comparent attaque immédiate, attaque retardée et riposte ?             |
| Préparation et interruption | La préparation réelle peut-elle être interrompue, et son refus expliqué ?         |

**Préparer cet essai** réinitialise la manche, choisit le placement et le mannequin,
restaure PV et aura finis et conserve les prémisses du terrain. Il ne fournit
aucun allié, équipement ou pouvoir supplémentaire. L’enregistrement ou la lecture
du mannequin doit être arrêté avant de préparer un essai. Si le combat est en
pause, reprendre pour jouer. Les situations manuelles demandent deux joueurs ;
alterner les rôles, les côtés et les distances, notamment entre soutien et attaque.

L’observation reste un avis du joueur : « une réponse a fonctionné », « aucune
réponse trouvée » ou « à vérifier en partie ». Décrire les commandes tentées avant
de conclure qu’un affrontement n’offre pas de contre-jeu. L’export JSON local
contient au plus quarante notes de 800 caractères, les identités, terrain, réglages
du mannequin et ressources. Il inclut le dernier avantage mesuré seulement après
récupération complète, avec le camp attaquant et la frame du contact. Il ne contient
ni instantané privé du combat ni prévision de Parallel Future et n’est pas envoyé
à un serveur. Les notes disparaissent en quittant le laboratoire : les exporter
avant la fin de la session.

## Vérification reproductible

Depuis la racine :

```sh
pnpm test:balance
pnpm test:balance --all-matchups
pnpm --filter @black-whale/web test:training-ui
pnpm lint
pnpm typecheck
pnpm test:ratchet
pnpm test -- -- --maxWorkers=3 --minWorkers=1 --testTimeout=20000
```

`exchangeProbe.ts` utilise uniquement les commandes et ticks ordinaires du moteur.
Le premier rapport couvre 240 échanges : quarante attaquants contre Bill, centre
et deux coins, avec chacun des deux camps comme attaquant. La garde est tenue
après trois touches. Le second couvre les 1 600 paires ordonnées du roster au
coin droit. Chaque essai dure 360 ticks. Les rapports conservent le nombre de
touches, la plus longue chaîne et la première garde/parade réellement obtenue.
Les PV infinis prolongent l’essai, l’aura reste finie et le décor interactif est
désactivé ; ces prémisses ne représentent pas une partie compétitive.

Les rapports de référence sont conservés dans
[`ui-tests/fighting-balance`](../../../ui-tests/fighting-balance/README.md).
Les tests des routes, défenses, projections, relevées, préparations, Hatsu,
entraînement, prédiction et replays complètent cette mesure ciblée.

Les tests de navigateur couvrent les préréglages, les ressources finies, le maintien
des prérequis de Phinks, l’export, le français et l’anglais, et les largeurs 1440,
390 et 320 px. Ils ne sont pas des observations de parties humaines.

Validation du 17 novembre 2026 : **15 438 tests réussis dans 687 fichiers**, dont
13 899 tests web dans 636 fichiers ; 18 tâches Turbo réussies. Les 17 contrôles
du cliquet, le lint global et les 17 tâches de typage passent, avec zéro erreur
ou avertissement Svelte. Le build de production et les contrôles du navigateur
passent également. La matrice de 240 échanges et celle des 1 600 paires
respectent leurs critères. Les avertissements de structure documentaire existants
restent distincts de ces résultats.

## Limite de qualification

La disparition de la répétition infinie de légers et les tests de régression ne
prouvent pas l’équilibre de tous les Hatsu ni des 1 600 affrontements complets.
Les parties humaines sur les sept situations restent nécessaires pour mesurer
les difficultés d’approche, les longues préparations, les avantages de terrain et
les échanges entre soutien et attaque. Aucun taux de victoire humain n’est déduit
de ce banc. Les prochaines retouches de coût, dégâts ou mobilité doivent partir
de ces observations, en conservant les conditions du Nen.
