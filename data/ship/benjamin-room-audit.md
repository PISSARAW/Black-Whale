# Chambre 1001 — salon de réception de Benjamin

Sources : Yoshihiro Togashi / Shueisha, tome 35, chapitres 363 et 366.
[Catalogue de l’édition officielle](https://www.viz.com/shonenjump/chapters/hunter-x-hunter).
Les pages ci-dessous désignent la pagination du chapitre, pas celle du tome.

## Cases et corrections

| Case                               | Ce qui est visible                                                                                                                                                                   | Traduction dans la visite                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 363, p. 13, vue plongeante         | Longue table rectangulaire bordée, cinq chaises à dossier droit sur chaque côté, fauteuil à une extrémité, petits objets répétés au centre ; les soldats se tiennent près des côtés. | Table, onze sièges et ornements centraux. Suppression du canapé, de la table basse et du buffet du programme-type, y compris de leurs collisions.               |
| 363, p. 13, mur du fond            | Paysage encadré avec petit cartel, panneaux muraux hauts et soubassement de bois vertical. Sol clair à longues lames et quadrillage sombre.                                          | Paysage géométrique sobre, cadre rectangulaire, lambris bas, panneaux clairs et lignes au sol. Retrait de la cavalerie, des bannières et de l’écusson inventés. |
| 366, p. 16, première case à droite | Benjamin assis, Balsamilco près d’une porte à panneaux, petit téléphone accroché au mur.                                                                                             | Téléphone vertical à combiné et cordon, sans console, classeurs ni voyants de transmission. Benjamin est assis dans cette vue.                                  |

Le chapitre 362 montre d’autres appartements, mais ne justifie pas l’ancien cadrage
d’un discours dans le 1001. Le cadrage `benjamin-living-guards` référence maintenant
le chapitre 363, événement 3. `benjamin-living-mural` conserve son identifiant pour
les liens existants et montre le paysage ; `benjamin-living-telephone` référence le
chapitre 366, événement 1. Les personnages sont ceux du catalogue temporel :
aucun soldat anonyme n’est ajouté au décor permanent.

## Plan partagé et rendu

La table, les sièges, le tableau et le téléphone sont des structures du plan partagé.
Leurs emprises alimentent les collisions et la carte locale, qui projette directement
ces structures au lieu de dessiner des rangs de gardes comme du mobilier fixe.
L’habillage utilise le plan parcouru : retirer ou déplacer un objet déplace son modèle.
Les volumes génériques sont remplacés par les détails dans la visite ; le mode
Sources conserve les structures documentaires sans l’habillage interprété.

Les bandes du sol et du plafond sont découpées selon le contour réel en L.
Le plafond ne déborde donc pas sur la salle à manger voisine. Aucun éclairage
supplémentaire, scan ou texture du manga n’est incorporé. Les géométries sont
fusionnées en deux lots au maximum et libérées au déchargement.

Les portes du 1001 ont deux panneaux rectangulaires en retrait, conformément au
chapitre 366, p. 16. Leur cadre et leurs panneaux remplacent les aplats dorés du
modèle générique ; ils restent attachés aux vantaux animés. Ce style s’applique
uniquement à l’intérieur du 1001.

Contrôle effectué sur les trois vues de la visite : réunion, paysage et téléphone.
Le dernier cadrage montre Benjamin assis et Balsamilco près du téléphone ; Furykov
n’est pas ajouté au premier plan d’une case qui ne le dessine pas. Les captures
locales sont conservées dans `test-results/benjamin-visual/` (hors versionnement).
La compilation et les 104 tests ciblés, dont les invariants du plan partagé,
passent. Les cadrages ont été revérifiés après leur dernier ajustement.

## Limites

L’enveloppe conserve les cloisons du programme-type du chapitre 363 : le manga ne
publie pas un relevé métrique individuel complet du 1001. Les dimensions, la
position des meubles dans cette enveloppe et les couleurs sont des choix de
reconstitution. Le motif exact du paysage et des panneaux mouchetés reste peu
lisible : le rendu évoque leurs masses sans prétendre identifier des personnages,
armoiries ou faits historiques. Aucune estrade ni pupitre tactique n’est attesté.
