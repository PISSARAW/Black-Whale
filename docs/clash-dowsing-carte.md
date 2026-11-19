# Dowsing Chain : recherche sur un plan réel

Le ruleset **clash-combat-62** ajoute la localisation physique sur carte. Le On
reste disponible et scelle le Nen de celui qui l’active, comme auparavant.
Cette livraison ne certifie pas les quarante arsenaux à 100 %.

## Application représentée

Au chapitre 95, Kurapika demande un plan à Light et recherche Neon. Le
[dictionnaire officiel de NTV](https://www.ntv.co.jp/hunterhunter/dictionary/)
décrit le bout sphérique de la chaîne suspendu au-dessus d’une carte pour
indiquer l’emplacement recherché. La recherche ordinaire n’exige pas Emperor
Time ; les conditions supplémentaires de l’analyse vidéo restent indépendantes.

Le scénario peut fournir deux vrais plans imprimés de l’arène. Il faut accéder
à une feuille lisible, garder la main droite libre et conserver l’accès effectif
à Dowsing. La main gauche peut tenir le papier. Une recherche choisit un corps
rencontré dans le monde simulé, avec son identité physique persistante. Un relais,
un costume ou un personnage homonyme ne remplace pas ce corps.

La rencontre préalable délimite ici les sujets représentables par le simulateur ;
elle n’est pas présentée comme une condition universelle révélée du manga. Aucun
portrait, nom civil ou renseignement secret n’est fabriqué pour compléter un sujet.
La feuille représente uniquement la coupe de cette arène, sans carte du monde
ni étage de bateau que le scénario ne possède pas.

La concentration prend trente frames normales, puis le pendule indique un point
pendant quatre-vingt-dix frames normales. Avec le coût de trois points d’aura,
ces nombres sont des réglages de duel, pas des conditions canoniques. Un coup,
un accès perdu au papier, une main occupée, une source de Nen interrompue ou le
On annule la recherche. Judgment s’applique à la véritable activation.

## Papier, copies et perception

Le résultat est un point ponctuel du corps réellement recherché à la fin de
la concentration. Il est daté et ne suit pas ensuite ses déplacements. Un sujet
hors de la zone imprimée ne produit aucun point sur la carte. Aucun verdict de
mensonge, pensée privée ou révélation de Hatsu n’est associé à cette position.

Texture Surprise peut couvrir le diagramme ; le moteur ne lit pas à travers
cette surface et ne sait pas transformer un texte libre en une carte correcte.
Gallery Fake reproduit le diagramme visible en matière inerte, avec les mains,
le support parent et la durée réelle de cette copie. Une carte masquée ne donne
pas accès au diagramme caché par sa reproduction. Sa disparition interrompt
également le pendule pendant le hitstop, sans effacer un souvenir déjà acquis.

Chrollo doit avoir acquis la bonne page, la marquer et fermer le livre pour
libérer sa main. La fermeture de l’accès à cette page arrête son application.
Le papier réel n’est ni consommé ni transformé en Nen par cette interruption.

Le modèle existant de Kurapika garde ses articulations et sa chaîne à l’annulaire.
Le bout sphérique utilise le même ancrage de feuille que le document visible.
In/Gyo régissent la manifestation de Nen. La vue adverse reçoit uniquement le
pendule visible ; le sujet privé, sa provenance et le souvenir restent privés.
Le souvenir peut traverser une manche ; une concentration active ne le peut pas.

## Validation

Tests des deux côtés, de l’identité physique, des surfaces masquées, de Gallery
Fake et de son expiration, de la page réellement active, des vues privées,
du On, de l’IA, du modèle articulé et des commandes rejouées. Six parcours UI
exercent P1/P2 à 1100, 390 et 320 pixels. Les 96 anciens flux d’entrée sont
conservés dans la nouvelle référence sans modifier les références publiées.

Contrôles : 3 167 qualifications de combat, 88 cas d’intégration au total
(dont dix-huit nouveaux), 24 contrôles du dépôt, typage sans erreur ni
avertissement, lint des sources modifiées et six parcours UI réussis.

Le build sépare explicitement les modules de localisation et les catalogues
inertes. Les données de soutien de Bill sont extraites sans changement de
valeur ; l’écoute de Secret Window garde le même contrat. Les neuf tests de
chargement compilé passent, y compris une vraie recherche Dowsing. Le build
complet respecte la limite inchangée : 483 773 octets pour son plus gros
fichier JavaScript navigateur. Trois avertissements de cycles subsistent dans
le graphe complet ; ils ne sont pas masqués.
