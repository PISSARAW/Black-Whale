# Hisoka : blessures physiques, prothèses et apparence

Le ruleset **clash-combat-53** rend exécutables le remplacement de la main gauche
et de la partie basse de la jambe droite par Bungee Gum, puis leur apparence
avec Texture Surprise. Le On reste présent et utilisable.

Le [chapitre 357](https://hunterxhunter.fandom.com/wiki/Chapter_357), également
décrit dans [ce compte rendu du chapitre](https://supercorona.wordpress.com/2021/05/19/hunter-x-hunter-chapter-357-unfortunate-part-2/),
montre ces remplacements après le retour à la vie d'Hisoka. Le remplacement en
caoutchouc et son apparence sont distincts de la réparation de chair réelle.

## Préparer une blessure réelle dans le scénario

La préparation scénarisée propose, pour chaque combattant actif, une main gauche
et une partie basse de jambe droite endommagées. Cette prémisse est explicite :
elle ne crée aucun Nen, aucune prothèse et aucun Hatsu supplémentaire.
Les réservistes gardent leur propre corps. Le vol d'une technique ne transfère
pas les blessures de son propriétaire.

Le moteur conserve les blessures dans `bodyDamage`, séparément des remplacements
dans `gumProstheses`. La main endommagée ne peut pas tenir un objet. Dans ce réglage
de duel, la mobilité est réduite de moitié avant un remplacement admissible.
La santé du format reste une mesure distincte ; former une prothèse ne restitue
aucun PV et n'efface aucune blessure.

Les blessures persistent entre les manches et suivent leur corps pendant les
relais d'équipe. Un relais ne suspend pas un remplacement en Nen actif.

## Former et utiliser le caoutchouc

La commande **Former les prothèses** remplace uniquement les parties effectivement
endommagées. Le coût de duel est de huit unités d'aura par partie. Un corps intact
ne gagne pas de membre supplémentaire. Le remplacement rétablit la prise de la
main et la mobilité représentées dans le duel.

**Appui élastique du pied** utilise la jambe existante au sol pour lancer une
avancée progressive. Le profil appartient au corps réel, y compris pendant
une exécution prêtée. Le déplacement conserve les collisions et les possibilités
de défense du duel. La commande ne redémarre pas un dash déjà engagé.

Une prothèse garde son acquisition : pouvoir personnel, page de Skill Hunter ou
prélèvement exact de Dolphin. La page de Bungee Gum doit rester admissible.
Un prêt de Texture Surprise ne forme pas de caoutchouc. Dolphin utilise sa réserve
prélevée, même si celle du destinataire est vide ; une réserve personnelle élevée
ne complète pas un prélèvement insuffisant. Former les remplacements compte comme
une application maintenue. Le même prêt ne les reforme pas après leur retrait.

Le maintien vérifie le Nen disponible et les conditions du prêt. Retirer le Nen
laisse les blessures présentes. Les valeurs de coût, de mobilité et de récupération
sont des réglages de duel ; le chapitre ne les chiffre pas et ne montre pas ici
une expérience de maintien des prothèses sous Zetsu.

## Texture Surprise sur son support

Le panneau permet de choisir **le tissu** ou **les prothèses** pour la prochaine
application. Les commandes ordinaires de la technique restent utilisables ;
Hisoka dispose aussi d'un bouton d'application dans le panneau. Le support en
caoutchouc doit exister réellement. L'apparence est liée à son identifiant et
cesse si ce support disparaît.

L'utilisateur doit disposer séparément de Texture Surprise. Chrollo respecte les
pages et le signet nécessaires à la composition. Un prêt de Texture Surprise peut
recouvrir du caoutchouc du livre ; une page de Texture Surprise peut recouvrir un
remplacement prêté. Chaque effet conserve son origine et sa réserve.

Retirer l'apparence laisse le remplacement en caoutchouc fonctionnel. Retirer le
remplacement laisse la blessure réelle et supprime l'apparence privée de support.
Les géométries articulées et les matériaux partagés des autres figures restent
intacts. Une apparence de peau conserve une matière sous-jacente de Nen.

In masque le caoutchouc non recouvert à la vue ordinaire ; le propriétaire et Gyo
peuvent le voir. Les instantanés adverses masquent les origines d'acquisition et
les choix de support préparés. Une apparence couvrante ne leur révèle pas les
blessures cachées ni la matière qu'elle recouvre.

## Mains, commandes et vérifications

Une interception exige une main réellement disponible. La main gauche redevient
admissible après son remplacement ; le livre continue d'occuper la droite.
L'objet reçu occupe ensuite sa main, même si le Nen qui l'entourait est détaché.
Il n'est ni dupliqué ni libéré de l'inventaire par la fin de Dolphin. Un prêt
terminé ne redémarre pas son interception entre deux commandes d'une même frame.

L'IA utilise les mêmes commandes pour former les remplacements utiles, choisir
leur surface, appliquer un déguisement admissible et utiliser l'appui élastique.
Les nouvelles commandes passent par le protocole sémantique et le replay du
panneau. Les prémisses mal formées et les corps fournis par un client sont refusés.

Les suites `gumProstheses`, `gumProsthesesBorrowing`, `gumProsthesesPhysics`,
`gumProsthesesReplay` et `gumProsthesisFigure` couvrent ces chemins, P1/P2, les
deux réserves, le rendu, In/Gyo, le On et le replay. Le script
`apps/web/scripts/check-hisoka-prostheses-ui.mjs` exerce les boutons réels à
1100, 390 et 320 pixels.

Les [réparations superficielles du visage et du cou](./clash-hisoka-visage.md)
sont ajoutées au ruleset 59. La réanimation préparée du cœur et des poumons
et les autres supports de Texture Surprise restent des travaux distincts.
Ce jalon ne certifie pas les arsenaux des quarante personnages à 100 %.
