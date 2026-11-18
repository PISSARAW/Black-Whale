# Mizaistom — Dernier avertissement

Dix secondes de Cross Game avec les modèles, le vaincu et l’arène du match.
Le carton jaune est sorti à 42. Une première attaque volontaire à 144 retourne
le carton et fige le corps dans le quadrillage blanc. Mizaistom prend position ;
la contrainte se lève à 234 avant le coup physique à 236. Un second avertissement
à 258 précède la nouvelle désobéissance à 300. La seconde immobilisation se
termine à 390, puis la frappe physique à 392 projette la cible à travers un
panneau du décor à 414. Le portrait final précède Fatality en anglais après huit
secondes. Aucun dialogue français n’est joué.

Chaque confinement dure les 90 images de la règle arcade existante. La victime
conserve exactement la même pose pendant chaque intervalle : ni souffle, ni
suivi des mains de Mizaistom ne font bouger le corps enfermé. La cage ne se
resserre pas et ne blesse pas. Les gestes et impacts finaux constituent une
chorégraphie après verdict ; ils ne prétendent pas démontrer un effet inconnu
du carton rouge. Le panneau est un accessoire physique présent avant le premier
avertissement, accordé à la palette du lieu. Il se brise au passage de la cible,
dont la trajectoire et la chute utilisent l’intégrateur et les poses natifs.

Les mains sont positionnées avec les deux vrais segments des bras. La posture
s’abaisse pour les petites cibles. La caméra réduite garde un plan fixe ; le
carton, les quadrillages, les débris et la poussière restent lisibles sans flash.
Toutes les poses, matériaux et visibilités des acteurs sont restaurés après
chaque rendu ; les accessoires possèdent leurs seules ressources privées.

`mizaistomFatalityFilm.ts` prouve deux avertissements natifs, l’obéissance sans
sanction, les tentatives d’attaque bloquées après désobéissance, la libération
brève et l’absence de dégâts du pouvoir. Une vraie victoire physique suit,
sans remise à zéro ni soin. `mizaistom.test.ts` vérifie ces preuves, les prises,
les poses figées, la chute, le miroir temporel de la lecture et la restauration.
`mizaistomPlayback.test.ts` parcourt les adversaires, lieux, deux côtés, modes
IA/local et motifs de victoire. Les scripts `check-mizaistom-fatality.mjs` et
`check-mizaistom-victories.mjs` vérifient variantes, miroir, mobile, confort,
chargement du son, déclenchement et revanches dans le canvas réel.

Démo : `demos/fighting-showcase/mizaistom-fatality.html` ; paramètres `target`,
`stage`, `side=opponent`, `reduced`. `render-mizaistom-fatality.mjs` exporte la
vidéo 1080p30, `--inspect` seulement les plans de contrôle.
`compose-mizaistom-fatality.mjs` produit `static/clash-victories/mizaistom.m4a`
et assemble `output/fighting-mizaistom-fatality/Mizaistom-Fatality-10s.mp4`.
La piste dure exactement dix secondes et ne parle que pour l’annonce anglaise.
