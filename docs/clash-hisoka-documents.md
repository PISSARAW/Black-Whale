# Texture Surprise sur un document physique

Cette extension du ruleset `clash-combat-55` représente le maquillage d'un écrit
sur son support. Le chapitre 106 montre Hisoka falsifier l'apparence de sa
prédiction ; le chapitre 55 établit le principe d'une surface rapportée.
Elle complète les [prothèses](./clash-hisoka-protheses.md), sans certifier
l'arsenal rétrospectif des quarante personnages à 100 %.

## Support, mains et lecture

Le scénario peut fournir explicitement deux documents ordinaires. Leur note
« Document 01 · 18:00 » est un accessoire de test, sans valeur de prédiction.
Une feuille vierge peut aussi être détachée du matériel d'écriture réellement
porté. Elle consomme une feuille de ce stock, sans fournir pinceau, encre ou Nen.
Le stock de trois feuilles et les distances de lecture sont des réglages de duel.

Prendre, porter, déposer et reprendre une feuille conservent son identité. Elle
occupe sa vraie main ; le livre et les autres objets continuent d'occuper les
leurs. Le corps projeté de Hanzo n'emporte pas les possessions du corps endormi.
Les réserves et les feuilles existantes restent les mêmes entre les manches.

La lecture exige une surface visible. Le texte mémorisé est celui qui a été lu,
avec sa manche et sa frame ; il ne se réécrit pas lorsque l'apparence change.
Montrer volontairement le document à un destinataire qui peut réellement le lire
utilise le contrat de communication de Judgment Chain. Un faux tatouage ou un
mot écrit ne change pas l'appartenance réelle à la Brigade. Le moteur ne déduit
pas automatiquement le sens d'un secret ou d'un mensonge d'un texte libre.

## Apparence et provenance du Nen

Le panneau permet de choisir une feuille au contact et de préparer jusqu'à
240 caractères, puis d'exécuter réellement Texture Surprise. Le contact est
revérifié à l'émission après le démarrage vulnérable de la technique. La limite
de saisie est une limite d'interface, pas une condition du manga.

L'encre et l'apparence restent deux données distinctes. Retirer l'apparence révèle
les mots sous-jacents. Aucune nouvelle prédiction, vérité, clause de Nen ou
propriété physique n'est créée. Un déguisement déjà posé sur le corps peut
coexister avec le document. Le texte est rendu comme du texte, sans interprétation
de balises HTML.

Chaque couche conserve son auteur physique, sa page ou son prélèvement exact.
Quitter la page supprime la couche du livre ; terminer le prêt supprime sa couche
empruntée. Les autres couches et le papier réel restent présents. Dolphin paie
avec la réserve prélevée et n'offre pas une deuxième application après retrait.
L'adversaire ne reçoit ni l'encre cachée, ni le brouillon, ni les souvenirs privés.

Gallery Fake peut produire un fac-similé inerte avec la gauche au contact de
l'original et la droite libre pour créer la copie. La copie conserve l'apparence
visible au moment de sa création, sans recevoir le Nen de son auteur. Cette
composition précise n'est pas montrée dans le manga : c'est une interprétation
explicite de la copie d'apparence, pas une preuve canonique supplémentaire.
La feuille copiée garde la durée de vie de sa matière, y compris pendant un arrêt
de combat ; prendre ou déposer la feuille ne remet pas son âge à zéro.

## Vérifications

Les tests `paperDocuments`, `paperTexture`, `paperTextureBorrowing`,
`paperDocumentCopy`, `paperDocumentIntegration` et `paperDocumentReplay`
exercent les commandes réelles, les deux origines, les mains, les stocks, la
lecture privée, Judgment, l'IA et les replays. Le script
`apps/web/scripts/check-paper-document-ui.mjs` vérifie les boutons et la saisie
pour P1/P2 à 1100, 390 et 320 pixels.

La réanimation préparée du cœur et des poumons et les réparations du visage
restent des travaux distincts. Le On demeure disponible comme exception filmique
explicitement conservée à la demande de l'utilisateur.
