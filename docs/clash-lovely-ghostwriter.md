# Lovely Ghostwriter — écriture automatique et mois de scénario

Le ruleset **clash-combat-71** rend la page historique de Chrollo utilisable
avec les informations manuscrites du sujet, sa présence ou son portrait et
un futur mensuel défini. Les conditions sont celles de la scène de Neon et
des prédictions de la Brigade : voir [Neon Nostrade](https://hunterxhunter.fandom.com/wiki/Neon_Nostrade)
et le [chapitre 104](https://anna-movies.com/hunterhunter/manga-chapter-104).
Le **On reste présent** et continue d’empêcher un usage simultané du Nen.

## Contexte disponible

La préparation « Lovely Ghostwriter » fournit un participant **entièrement
fictif**, Naël Deren, sa feuille d’identité qu’il a personnellement remplie,
un portrait papier et un itinéraire de quatre semaines. Sa date de naissance
et son groupe sanguin appartiennent à ce personnage de scénario ; ils ne
complètent aucune biographie inconnue du manga. Les quatre quatrains sont
des textes originaux décrivant cet itinéraire, sans reprendre les poèmes du manga.

Le contexte mensuel est une donnée d’auteur explicite. La technique ne
fabrique pas une prédiction de victoire ou des futurs inputs adverses dans
un duel libre. Sans contexte valide pour le sujet, elle reste indisponible.
Le modèle peut terminer les vers à la semaine de décès déclarée dans le
scénario ; écrire cette information ne tue pas le sujet.

## Conditions matérielles et commande

Le nom, la date de naissance complète et le groupe sanguin doivent
correspondre aux données du sujet et rester lisibles sur **la même feuille
originale**. Une copie d’un autographe ne crée pas un nouvel acte d’écriture
personnelle. L’illusion de Texture Surprise ne change ni l’encre, ni l’auteur
réel, ni le sujet de cette feuille. Son propre avenir reste interdit, y compris
lorsque l’apparence du corps change.

Le sujet doit être visible ou disposer d’un portrait physique visible.
Un couvert coupe la lecture ; perdre la vue ne laisse pas lire les documents
par leurs seules métadonnées. Un portrait reproduit par Gallery Fake conserve
son image matérielle et la durée de sa copie. Il ne fournit pas une nouvelle
signature ni un nouveau pouvoir. Une surface couverte par Texture Surprise
ne devient pas un portrait utilisable par sa seule légende.

Chrollo doit avoir la page active, une main libre, un instrument d’écriture
et de l’encre réellement présents. Avec le livre tenu à droite, la main gauche
peut écrire. Ghostwriter au signet et Gallery Fake dans le livre ouvert
permettent de garder le portrait copié tout en écrivant : la commande dédiée
`history-ghostwriter` évite de confondre écriture et copie de la feuille.
Le bouton de l’arsenal et la commande habituelle du Hatsu utilisent les mêmes
vérifications de matériel, de vue et de portée.

L’écriture dure 90 frames et coûte 12 aura : réglages du duel. Le modèle de
Ghostwriter utilisé dans l’archive suit la véritable main qui écrit.
Le papier reçoit progressivement son encre. Un coup, une perte du livre,
du matériel, de la vue ou du contact utile interrompent l’opération et
laissent l’encre déjà déposée. Il n’y a ni dégâts, ni soin, ni points accordés.

## Lecture, IA et confidentialité

Le personnage ne reçoit pas automatiquement les vers dans ses souvenirs.
Après l’écriture, « Papier · Lire la feuille du participant » lit le document
présent. Les retours à la ligne des quatrains sont conservés et le dernier
vers tient sur le même canevas papier. Les documents et le participant réel
restent les mêmes entre les manches.

L’IA récupère le matériel disponible, choisit la page et écrit quand les
conditions sont réunies. Elle ne crée ni identité, ni portrait, ni futur.
Le mois encore caché et le texte non écrit ne sont envoyés à aucun joueur.
Les prévisions privées conservent le travail visible sans inventer les
informations occultées. Les replays complets conservent le mois du scénario,
les commandes réelles, l’encre produite et la lecture ultérieure.

Cette application ne certifie pas à elle seule les quarante arsenaux à 100 %.

L’encre provenant d’un matériel copié conserve le parent de sa matière Nen.
La fermeture de Gallery Fake et la limite de vingt-quatre heures effacent
cette encre, y compris pendant le hitstop, en conservant la véritable feuille
et l’identité manuscrite préexistante. Briser seulement le pot d’encre ne
supprime pas les traits déjà déposés, qui sont des parties détachées.
L’ancien texte caché sous une apparence n’est pas transmis au client pour
reconstruire une disparition prédite : l’autorité restitue le support réel.

## Vérification

Les 105 tests d’intégration passent, dont 24 nouveaux cas de Ghostwriter,
ainsi que les 24 contrôles du dépôt et les neuf tests des bundles compilés.
Les douze parcours UI couvrent le sujet présent ou son portrait, pour P1/P2
à 1100, 390 et 320 pixels, jusqu’à la lecture réelle de la prophétie.
Les 96 flux historiques de commandes sont conservés dans la référence 71.

La qualification des quarante combattants passe ses 3 167 cas, y compris le On.
La vérification Svelte et TypeScript termine sans erreur ni avertissement.

La compilation de production respecte le plafond inchangé de 500 000 octets
par fichier JavaScript : maximum 497 537 octets. Le parcours du jeu compilé
atteint la sélection, le terrain puis l’arène de Machi sans erreur JavaScript.
La génération de vérification utilise un dossier SvelteKit distinct pour éviter
les interférences avec les contrôles lancés dans les autres sessions.
