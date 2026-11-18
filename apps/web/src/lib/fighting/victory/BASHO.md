# Basho — Le dernier vers

Dix secondes avec Great Hiker, l’adversaire et le décor du combat. Basho écrit
les trois vers de la composition attestée : « Tout ce que je frappe / Avec mon
poing / Prendra feu ». Les lettres apparaissent sous le pinceau, dont la pointe
suit leurs métriques réelles et se lève aux retours à la ligne. La feuille suit
la main gauche, puis est rangée avant les coups. L’écriture est montrée en
2,4 secondes pour la lecture ; le moteur conserve sa durée native d’une seconde.

Trois coups du poing droit touchent à 3,6, 5 et 6,4 secondes. Chaque impact
reprend un vers à l’écran et agrandit le feu porté par le corps réellement touché.
Basho retire son bras et recule après la dernière frappe. La victime noircie
s’effondre à partir de sept secondes ; les flammes retombent et laissent des
braises et une marque au sol. Basho se redresse, ressort la feuille et reprend
silencieusement sa lecture. Fatality apparaît à huit secondes et est annoncé
en anglais à 8,15 secondes. Aucune voix française.

La scène conserve le poème attesté et sa condition de contact du poing. Elle
ne reconnaît pas des textes arbitraires, ne note pas automatiquement la qualité
littéraire et n’ajoute ni paralysie, ni bonus général, ni autre sort. Les flammes
procédurales, le noircissement et la trace au sol sont des effets de présentation
après verdict, sans changement de PV, d’aura, de résultat ou de règles natives.
La composition reste intacte dans la poche puis dans la main du poète.

`bashoFatalityFilm.ts` obtient une vraie victoire continue par Great Hiker.
Des coups ordinaires affaiblissent d’abord la cible. Basho attend l’immobilité,
écrit le vrai poème, puis touche du poing une cible qui survit au contact.
Les pulsations natives de brûlure terminent le duel, sans nouveau coup. La preuve
vérifie la réserve de vie avant/après la pulsation fatale, son propriétaire,
son horloge et l’absence de nouvel impact : le verdict vient bien du feu.
Aucun PV, temps ou stock n’est réinjecté pendant le combat.

Les mains utilisent les articulations réelles ; les coudes restent bas pour
l’écriture et la lecture. Les coups suivent le torse des différents gabarits,
avec des genoux adaptés et un redressement après la dernière frappe. Les
réactions du buste et la chute utilisent le rig et les contacts au sol de Clash.
Les flammes suivent les articulations de la cible ; elles n’apparaissent pas
avant le premier contact. Le noircissement emploie des copies de matériaux,
sans disposer les géométries ou textures natives. Les poses, matériaux et
hiérarchies sont restaurés après chaque image, y compris lors d’une lecture
arrière. La caméra réduite reste fixe et les braises sont désactivables.

`basho.test.ts` vérifie les deux côtés, quatre gabarits, le miroir, l’écriture,
les contacts, la chute et la restauration. `bashoPlayback.test.ts` parcourt le
roster, les décors, deux côtés, IA/local, quatre motifs de victoire et revanches.
`check-basho-fatality.mjs` contrôle le mobile, le confort et les variantes ;
`check-basho-victories.mjs` contrôle quatre victoires/revanches avec le son et
le retour aux résultats.

Démo : `demos/fighting-showcase/basho-fatality.html`, paramètres `target`,
`stage`, `side=opponent`, `reduced`. Depuis `apps/web`,
`node scripts/render-basho-fatality.mjs` exporte 1080p30 ; `--inspect` capture
les plans de contrôle. Depuis la racine,
`node apps/web/scripts/compose-basho-fatality.mjs` produit le son du jeu et
assemble `output/fighting-basho-fatality/Basho-Fatality-10s.mp4`.
