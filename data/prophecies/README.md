# Prophéties — Lovely Ghostwriter

78 prophéties écrites dans le style des poèmes de Neon Nostrade, une par personnage
majeur de la Guerre de Succession — princes, reines, camp Woble, Hunters, Brigade
fantôme et les trois familles mafieuses.

## Statut : `apocryphal`

Aucune de ces prophéties n'existe dans le manga. Lovely Ghostwriter a disparu de
Skill Hunter avant le départ du Black Whale — Chrollo le constate quand Shizuku lui
demande de lire leur avenir, ce qui indique probablement la mort de Neon. Ces textes
sont donc un **document contrefactuel** : la dernière série de feuilles, si la
capacité avait encore fonctionné au moment de l'embarquement.

C'est pour ça que chaque enregistrement porte `"canonStatus": "apocryphal"` et non
`"canon"` comme le reste de `data/`. Rien ici ne doit être lu comme une source.

## Forme

Chaque poème suit la structure des prophéties du manga : un repère temporel, une
image-présage, un impératif, puis la ligne de destin — et vise ce que le personnage
veut réellement, pas ce qu'il annonce vouloir. Kurapika est prévenu du prix en
années, pas des Yeux ; Camilla apprend qu'elle ne mourra jamais et ne sera jamais
aimée ; Momoze, Salé-salé, Kacho, Woody, Vincent, Musse, Tuffdy, Luini, Lynch,
Padaille, Sumidori et Keeney reçoivent l'annonce de leur mort — Shikaku et
Halkenburg celle de leur corps seul.

Chrollo n'a pas de poème (`"blank": true`) : la capacité ne peut pas écrire l'avenir
de celui qui l'utilise, et c'est lui qui tient la page depuis Yorknew.

Une partie des Heil-Ly n'a, dans le registre, qu'un métier et une famille — aucune
scène. Leurs feuilles sont écrites depuis la règle de Contagion (le baiser, les
niveaux gagnés en tuant, la capacité au-delà du vingt-et-unième) et leur `reading`
le dit explicitement plutôt que d'inventer un événement.

## Champs

| champ         | rôle                                                     |
| ------------- | -------------------------------------------------------- |
| `subjectId`   | id dans `data/characters/characters.json` (vérifié)      |
| `factionId`   | recopié du registre des passagers                        |
| `desire`      | ce que le personnage veut vraiment — la cible du poème   |
| `poem`        | quatre vers ; vide si `blank`                            |
| `reading`     | glose : chaque image rattachée à son événement canonique |
| `foretells`   | nature de l'annonce (`death`, `capture`, `cost`…)        |
| `horizon`     | fenêtre couverte, en jours de voyage                     |
| `canonStatus` | toujours `apocryphal`                                    |

Les repères sont donnés en jours de voyage, pas en numéros de chapitre : le
catalogue `data/chapters` n'en contient que huit, et une référence chapitre
inventée serait précisément la précision que l'archive refuse de revendiquer.

Le fichier n'est branché sur aucune route. Le module `lovely-ghostwriter`
(`packages/ability-modules/src/chrollo-stolen/module.ts`) déclare un composant
`ProphecyPoem` qui n'existe pas encore — c'est le point d'accroche naturel.
