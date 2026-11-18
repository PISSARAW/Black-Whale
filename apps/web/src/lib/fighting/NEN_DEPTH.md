# Maîtrises et applications du Nen dans Clash

Les profils distinguent affinité, apprentissage et rendement. Les niveaux 0/1/2
sont des seuils opérationnels du jeu : non vérifié, fondation du duel, application
répertoriée. Ils ne constituent pas des notes canoniques de puissance.
`nenMastery.ts` recoupe le catalogue de catégories avec les capacités qualifiées
par `nenCanon.ts`. L’affinité ne débloque aucune technique à elle seule.
L’entrée historique « projectile de Theta » ne lui accorde donc pas un tir de Nen.
Les fondamentaux physiques communs au duel restent une adaptation explicitée.

Les affinités inconnues restent inconnues ; les coefficients neutres des inconnus
et spécialistes sont des réglages arcade, pas une nouvelle table canonique.
Emperor Time améliore le rendement des actions disponibles sans augmenter le
niveau appris, fournir un objet ou supprimer une condition.

`nenCategories.ts` distingue davantage les rendements tout en conservant le
maximum antérieur. Le niveau appris sert à l’admission des applications et au
contrôle, sans seconde pénalité identique appliquée aux dégâts.

## Applications accessibles

`nenApplications.ts` et le panneau des tactiques proposent des commandes de maintien
ordinaires : Ryu offensif, Ken, Shu sur un support disponible et l’action personnelle
existante. Une application n’ajoute ni projectile, ni matériel, ni propriété nouvelle.
Les commandes passent par les entrées et admissions du moteur, donc les replays et
les conditions propres continuent de s’appliquer. Shu ne couvre plus une pierre
fictive dans une main vide ; le lancer physique ordinaire reste une adaptation.

## Opérations hybrides

`nenOperations.ts` sépare impact, transmission, construction, propriété, contrôle et
soin. Le contact ne moyenne plus toutes les catégories d’un Hatsu. La transmission
module la durée des seuls projectiles dont l’Émission est déclarée ; elle n’ajoute
pas cette catégorie à toute construction. Les durées de contrôle arcade gardent
leur facteur propre, sans modifier serment, consentement ou Zetsu imposé. Les
balles physiques, objets en Shu et sphères matérialisées conservent leur matière.

## Réserve, débit et engagements

`nenBudget.ts` calcule le débit disponible séparément de la réserve restante.
Le débit de base est un réglage dérivé du contrôle qualifié et du style martial.
Les projectiles émis engagent six points et les supports en Shu quatre, jusqu’à
leur disparition ou dissipation. Projection de Hanzo, musique active et suture
ont leur engagement propre ; aucun nouvel entretien n’est imposé aux serments
ou aux capacités post mortem. Ces valeurs sont des réglages du duel.

Les engagements diminuent l’aura mobilisable sur le corps et l’admission d’une
nouvelle attaque de Nen, sans retirer deux fois son coût ni rendre la matière
physique inoffensive. La disparition d’un projectile libère le débit mais ne
rembourse pas la réserve. Les deux camps et les prévisions recalculent leur
budget depuis les mêmes effets vivants à chaque frame.

## Liaisons et temps de transfert

`nenTransfer.ts` conserve la dernière répartition au contact et l’interpole vers
la nouvelle zone lors d’un cancel ou d’une commande manuelle. Une entrée maintenue
ne recommence pas le transfert ; les parts restent conservées. L’engagement initial
depuis le neutre utilise la préparation du coup existante. Biscuit bénéficie de
son contrôle enseigné ; les autres cadences sont des réglages de style.

Un Ko offensif ne se libère pas au milieu d’un transfert inachevé. Un changement
de zone de Ko défensif paie son engagement une seule fois et traverse une posture
intermédiaire avant la concentration complète. Interruption et Zetsu annulent le
transfert ; hitstop et pause suivent les ticks autoritaires et le replay. Les
flux de présentation lisent ces parts effectives, sans modifier leurs couleurs.

## Doctrine, choix et information

`nenCombatDoctrine.ts` applique une tendance par affinité : contact pour le
Renforcement, distance pour l’Émission, portée intermédiaire pour les supports
matérialisés ou manipulés. Les plages personnelles priment : Bill soutient,
Leorio cherche une frappe distante reliée au sol, Franklin maintient son barrage,
Kalluto garde ses papiers à portée. Une affinité inconnue reste inconnue et
conserve le style écrit. Les émetteurs sans réserve reviennent au combat physique.

`nenDoctrineActions.ts` réordonne les seuls coups déjà proposés par les plans
personnels. L’IA prépare le Ryu au contact ou le Ren à distance quand ses ressources
le permettent, après les lectures et protections existantes. Les zones faibles
ne sont exploitées que via une lecture Gyo valable ; aucune catégorie, condition
ou commande secrète adverse n’est utilisée par cette couche.

Le panneau des applications affiche le profil propre, les catégories dont une
application est répertoriée, le débit disponible et le transfert effectif. Une
maîtrise non établie est présentée comme telle. Les distances, coefficients et
seuils restent des réglages du duel, à équilibrer en combat.
