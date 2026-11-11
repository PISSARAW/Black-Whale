# Salon de Nasubi — fidélisation du chapitre 382

Le salon reçoit le même traitement que le banquet : relecture des cases,
correction du plan partagé, puis détails originaux attachés aux objets de la
visite. Source éditoriale : Yoshihiro Togashi / Shueisha, tome 37, chapitre 382.
[Édition officielle chez VIZ](https://www.viz.com/shonenjump/hunter-x-hunter-chapter-382/chapter/16708).

## Cases relues et correction de disposition

Les [pages de lecture 3](https://www.scan-vf.net/hunter-x-hunter/chapitre-382/3)
et [4](https://www.scan-vf.net/hunter-x-hunter/chapitre-382/4) montrent deux
surfaces distinctes : le grand panneau paysager encadré face au roi, puis le
tableau de bataille au-dessus du manteau sur le mur latéral perpendiculaire.
La première reconstruction les confondait sur le mur du fond. Le nom historique
`great-window` reste l'identifiant du tableau de bataille pour préserver les
références aux objets ; il ne désigne aucune fenêtre.

Le panneau paysager est un objet opaque de type `painting`, utilisé ici pour
une surface encadrée. Cette catégorie ne tranche pas la technique du panneau
ou sa fonction d'écran : elle empêche surtout de créer une ouverture extérieure
et une lumière du jour que la case n'établit pas. Le paysage procédural reste
une interprétation originale et simplifiée.

Le fauteuil de repos large est placé sur l'axe du panneau paysager, conformément
au plan frontal fourni : Nasubi ferme la perspective et Halkenburg l'approche
par la gauche. Les deux enceintes encadrent immédiatement le panneau ; le manteau
et les sellettes restent sur le mur latéral perpendiculaire.
Les sièges gardent une assise basse, leur dossier et leurs accoudoirs rembourrés
étant dessinés au-dessus. Les tableaux secondaires sont de formats différents.
Les meubles latéraux et les piles laissent libres les passages et les caméras.

## Architecture et mobilier détaillés

- Voûte en berceau surbaissé à caissons, avec nervures et cadres transversaux.
  Le sommet reste sous les sept mètres du plan ; les piles carrées ont aussi
  une emprise de collision dans le plan partagé.
- Corniches superposées, soubassements et appliques à deux bras. Les moulures
  suivent les murs effectivement fermés et s'arrêtent aux portes.
- Cadres à plusieurs profils, petits ornements d'angle et sujets en silhouettes
  originales : paysage, portraits et évocation équestre du tableau de bataille.
  Ces sujets ne sont pas des fac-similés des œuvres dessinées par Togashi.
- Galerie haute de petits portraits sur les deux murs latéraux, afin de retrouver
  la densité de cadres du grand plan sans réduire la largeur de circulation.
- Panneau paysager élargi, avec ciel, eau, arbres en relief et encadrement
  architectural symétrique entre les deux enceintes.
- Manteau avec ouverture sombre, jambages, corniche, petits cadres,
  vases et ornement central en forme d'horloge. Aucun foyer allumé n'est ajouté.
- Sièges rembourrés avec accoudoirs courbes, coussins et boutons ; buffets et
  tables basses ; enceinte à trois haut-parleurs ; desserte nappée avec
  bouteilles et verres.
- Incrustations géométriques organisées autour de quatre longues bandes axiales,
  de traverses sombres et de losanges latéraux ; le centre reste largement libre.

Le catafalque du chapitre 413 reste identifié séparément sur le plan, comme
avant cette intervention. Sa présence dans le modèle architectural n'est pas
une affirmation qu'il figurait dans la scène du chapitre 382.

## Cohérence avec le banquet

Le décor est attaché au groupe de la salle dans `TierView`. Il suit sa visibilité,
se reconstruit à partir des structures présentes après un Hatsu, disparaît dans
la vue des provenances et libère ses géométries et matériaux au déchargement.
Il utilise le même constructeur fusionné que le banquet : deux lots maximum,
moins de 150 000 triangles et aucune lumière Three.js permanente supplémentaire.
Les points lumineux des appliques sont de petites surfaces, pas des sources
qui éclaireraient les pièces voisines.

Le plan local 2D projette désormais les mêmes espaces, portes et structures
que la visite. Les marqueurs du roi et du catafalque viennent de leurs meubles.
Trois angles sont proposés : le panneau paysager, le manteau latéral et la
voûte. Le roi est placé sur son fauteuil dans chacun d'eux.

## Limites

L'emprise de 24 × 16,64 m, la hauteur de 7 m, la courbure de la voûte, le nombre
et la position métrique des piles, les formats et placements individuels des
petits tableaux restent des estimations. Les couleurs ivoire, noyer, laiton,
bordeaux et vert paysager interprètent une source en noir et blanc. Les petits profils,
l'ornement d'horloge et les sujets des œuvres sont simplifiés. Aucun scan,
extrait ou texture du manga n'est embarqué dans l'application.
