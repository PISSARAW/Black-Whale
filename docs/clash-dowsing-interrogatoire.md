# Dowsing Chain : interrogatoire libre

Cette extension du ruleset **clash-combat-43** complète l’[audit courant](./audit-hatsu-fighting.md).
Le On et son sceau du Nen restent présents.

L’interrogatoire ne se limite plus aux trois faits prédéfinis. L’utilisateur
peut rédiger puis prononcer une question ; le répondant peut rédiger sa réponse
et déclarer son intention consciente. La chaîne indique un mensonge conscient,
sans fournir la réponse vraie ni une connaissance absente du scénario.
Les 160 caractères du champ sont une limite de saisie, pas une condition du Nen.

La question et la réponse passent par la voix réelle. L’utilisateur doit rester
concentré, voir le répondant de face et pouvoir l’entendre. La main droite doit
être disponible pour manipuler la chaîne : un appareil tenu dans cette main
empêche l’interrogatoire et l’analyse vidéo, jusqu’à son dépôt. Un relais ne
remplace pas les deux personnes physiques de l’interrogatoire.

Le silence ne reçoit pas de verdict. Une parole libre sans intention représentée
n’est pas classée automatiquement comme sincère. Une réponse explicitement
identifiée mais sans intention représentée reste indéterminée. L’IA ne fabrique
pas de réponse aux questions rédigées dont elle ne connaît pas la réponse.
Pour les trois faits prédéfinis, le texte reste produit depuis l’état du
répondant ; les commandes vocales communes sur le même fait sont également lues.

Les paroles atteignent les appareils et les récepteurs réellement admissibles.
Une caméra peut enregistrer la réponse et son comportement simulé ; revoir le
clip ne révèle pas directement son intention privée. L’analyse ultérieure exige
toujours Emperor Time, une rencontre personnelle préalable, le visage enregistré
et l’accès à la véritable caméra. Elle ne reconstitue pas une rencontre manquante.

Judgment et les autres conséquences d’une réponse volontaire restent applicables.
Si une clause tue le répondant, aucune nouvelle lecture n’est produite après sa
mort. Le répondant peut parler sous le On sans perdre ce pouvoir ; l’utilisateur
de Dowsing ne peut pas activer la chaîne quand son propre Nen est scellé.
Les lectures restent privées en PvP et les questions et réponses de P2 sont
enregistrées dans les replays avec leurs textes complets.

Références : détection de mensonge montrée dès le
[chapitre 68](https://hunterxhunter.fandom.com/wiki/Chapter_68), explication
face-à-face et vidéo du chapitre 348 ; récapitulatif des applications chez
[HUNTER×WORLD](https://hunterworld.tokyo/krapika/).
La [recherche sur carte physique](./clash-dowsing-carte.md) est ajoutée au ruleset 62.
Les autres écarts de l’audit restent ouverts :
cette étape ne certifie pas un achèvement à 100 %.

## Accès vidéo unique — ruleset 61

Un ancien chemin de commande acceptait aussi une paire `caméra|numéro` issue
de métadonnées de parole. Il pouvait contourner la rencontre du corps réel,
le visage filmé, la disponibilité de la main et les autres conditions de la
lecture vidéo. Ce chemin est retiré ; il ne fournit plus de verdict, même
sous Emperor Time. Les métadonnées historiques seules ne sont pas une vidéo.

La commande visible du lecteur continue à sélectionner un échantillon du
véritable appareil. Le moteur recoupe ce qui est lu avec l’enregistrement,
la rencontre personnelle, le visage, l’accès à la caméra, les sens et la
main droite. Les paroles libres sans intention représentée restent indéterminées.
Les tests vérifient le rejet de l’ancien chemin pour P1 et P2 tout en conservant
une analyse positive du véritable enregistrement.

La recherche directionnelle déjà adaptée dans le duel respecte désormais
également la main de la chaîne et les clauses implantées de Judgment. Cette
correction ne remplace pas une recherche sur carte physique par une direction
abstraite ; cette partie reste à compléter. Le On est conservé.
