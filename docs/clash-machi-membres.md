# Machi — raccordement des avant-bras originaux

Le ruleset **clash-combat-70** ajoute l’application montrée au chapitre 55 :
Nen Stitches reconnecte les avant-bras sectionnés d’Hisoka. Les vaisseaux,
les nerfs, les os et les muscles sont raccordés ; Machi demande ensuite de
ménager les bras pendant leur guérison. Cette action ne crée pas de tissu
et ne ressuscite pas un patient. Voir le [résumé du chapitre 55](https://hunterxhunter.fandom.com/wiki/Chapter_55).

## Préparer et utiliser

Dans la préparation de scénario, « avant-bras sectionnés, membres originaux
au sol » donne une blessure réelle et les deux membres correspondants.
Leurs identifiants matériels désignent le corps et le membre précis.
Une apparence identique, un autre coéquipier ou une copie Gallery Fake
ne remplacent pas le véritable avant-bras manquant.

Le patient vivant consent au soutien et relâche l’aura des bras : maintenir
Zetsu, ou concentrer Ko ailleurs que dans les mains. Machi doit avoir une
véritable aiguille, ses deux mains libres, assez d’aura et rester près du
patient et du membre. Sa trousse personnelle est du matériel ordinaire ;
Chrollo et un porteur de Dolphin doivent apporter leur propre aiguille,
via l’équipement initial ou une récupération matérielle.

Les boutons « Nen Stitches · Rattacher l’avant-bras gauche / droit » sont
accessibles dans l’arsenal. Chaque opération dure 90 frames et coûte 20
aura : ces valeurs et les distances sont des réglages du duel. Un coup,
un déplacement du patient, le retour de l’aura aux mains, la perte de
l’aiguille, d’une main disponible ou de la source interrompent la suture.
Le membre reste alors au sol ; l’aura déjà engagée ne revient pas.

Une opération terminée rétablit ce membre et la fonction de sa main,
sans ajouter de PV ni de points. Le membre original quitte le sol ;
aucun second exemplaire ne peut être rattaché. Les blessures et les
membres consommés sont conservés entre les manches. Le modèle humain
partagé garde ses articulations et la matière réelle de l’avant-bras.
Le fil de travail vise le véritable coude du patient.

## Livre, Dolphin, IA et réseau

Chrollo utilise la page active au signet, livre fermé, pour libérer ses
deux mains. Fermer le canal avant la fin interrompt l’opération.
Dolphin dépense la réserve du donneur et consomme un seul usage :
rattacher l’autre avant-bras demande un nouvel usage acquis. L’opération
reste occupée pendant le travail ; sa fin ne détruit pas le tissu raccordé.
Un prêt externe dépend encore du véritable prêteur et d’Emperor Time.

L’IA utilise une opération admissible sans fournir le consentement, le
membre ou l’aiguille à la place du patient. Le menu expose également les
options matérielles de fil et de suture auparavant définies mais omises.
La sélection de scénario et les commandes passent les mêmes validateurs
PvP. Les replays reproduisent les deux opérations et le maintien de Zetsu.
La provenance privée du prêt reste masquée à l’adversaire.

Le **On reste présent**. Cette application des avant-bras ne certifie pas
à elle seule les quarante arsenaux à 100 %.

## Vérification

Les 18 nouveaux cas de suture et les 188 tests d’intégration ciblés passent,
ainsi que les 3 167 contrôles de combat, les 24 contrôles du dépôt et les
neuf tests des bundles compilés. Les 18 parcours UI couvrent Machi, le livre
et Dolphin pour P1/P2 à 1100, 390 et 320 pixels. La compilation aboutit
et les types ne signalent aucune erreur ni avertissement. Le découpage des
catalogues purs maintient chaque bundle JavaScript sous 500 000 octets.

Le contrôle `check-clash-production-arsenal.mjs` passe aussi sur la version
de production : 120 sélections réelles à la souris (40 personnages à
1100, 390 et 320 pixels), puis entrée dans l’arène avec Machi, sans erreur
JavaScript. Le pied de page du sélecteur suit le défilement normal et ne
recouvre plus les cases de combattants.
