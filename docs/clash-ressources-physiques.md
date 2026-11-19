# Corps et otages accessibles dans la préparation

Le ruleset **clash-combat-63** expose deux ressources déjà gérées par le moteur :
les cadavres matériels et les otages déjà retenus. Le On reste disponible.

Le menu de préparation, le protocole PvP et le lecteur de replay utilisent
maintenant le même catalogue de dix-sept choix. Les ressources ne sont installées
qu’en combat scénarisé. Le duel strict garde uniquement l’équipement personnel.
Les véritables appareils, dont les caméras, restent dans leur choix matériel
existant ; aucune archive de métadonnées n’est convertie en enregistrement réel.

## Commandes réellement jouables

Les commandes de contrôle des cadavres d’Illumi existaient pour le moteur et
l’IA mais manquaient du menu humain. Elles sont maintenant proposées à P1 et P2 :
implantation au contact avec les aiguilles physiques et le Nen requis, parole
imposée, ordre de déplacement et retrait au contact. La préparation interruptible
de soixante frames et le coût de trente points d’aura restent des réglages de duel.
Le corps reste le même objet matériel ; son contrôle ne le ressuscite pas et ne
révèle aucun souvenir du défunt. Un personnage sans le Hatsu ne reçoit pas ce
pouvoir en sélectionnant un cadavre. Application montrée au chapitre 100.

L’otage existe avant le combat et conserve le camp qui le retient. La commande
de libération agit sur cet individu matériel. Lorsqu’une clause de Judgment
impose une restitution, ses conditions de contact et son échéance restent
traitées par le contrat existant. Ajouter la ressource ne pose aucune chaîne
et ne déclare aucun consentement initial au Nen à la place d’une personne.

## Portée de la livraison

Cette passe ferme l’accès humain aux commandes natives et l’acceptation de
leurs ressources dans les échanges. Elle ne certifie pas la totalité de l’arsenal
d’Illumi : les contrats complets de copie et de prêt de cette application,
le conditionnement de Killua et les autres écarts de l’audit restent à examiner.

Les tests suivent l’implantation, les paroles, le retrait et la libération
par de vraies commandes P1/P2 enregistrées puis rejouées. Le catalogue complet
est accepté dans les deux formats d’échange ; un choix étranger est refusé.
La vue P2 inverse aussi le véritable détenteur d’un otage ; son identité
matérielle reste canonique. La prédiction du client est comparée au serveur
pour la libération et pour le contrôle du même cadavre.
Le contrôle UI utilise les vraies cases de préparation et les vrais boutons,
puis revient au duel strict pour vérifier l’absence de ressources ajoutées.

Validation : 3 044 contrôles généraux et 123 qualifications des commandes,
56 cas d’intégration au total, 24 contrôles du dépôt, lint des sources modifiées
et typage sans erreur ni avertissement. Les six parcours UI couvrent P1/P2 à
1100, 390 et 320 pixels. Les deux contrôles de chargement compilé passent.
