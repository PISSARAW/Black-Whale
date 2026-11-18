# Victoires personnelles de Longhi et Furykov

Les entrées `longhi` (« Tu avais signé ») et `furykov` (« La réponse était prête »)
rejoignent le catalogue de victoire, avec leurs propres sons. Les variantes
de défaite `beyond-curse-*` restent sélectionnées uniquement pour le porteur
vaincu par un prince, selon les règles de [BEYOND_CURSE.md](./BEYOND_CURSE.md).
Gagner n’active jamais la malédiction de Beyond.

## Longhi : Moonlight Act

Le papier d’aura affiche les clauses avant la signature : aucune attaque des
deux parties pendant cinq secondes, récompense d’un usage de Moonlight Act,
sanction d’une semaine de Zetsu en cas de rupture. Longhi signe à 108 ; l’autre
partie, libre de ses mouvements, signe à 144. Son nom apparaît sur le contrat.
La trêve de cinq secondes est le scénario de duel déjà présent dans le jeu,
pas la durée du traité du chapitre 401.

L’adversaire tente une attaque pendant la trêve. La rupture à 192 fait disparaître
son aura avant 228. La sanction n’inflige aucun dommage et n’exécute personne.
Longhi enchaîne alors ses coups physiques du jeu, puis le vaincu suit la chute
native à 415. Aucun contrat forcé, stylo offensif ou emprunt d’un autre Hatsu.

## Furykov : Combo Master

Furykov consulte une fiche de cible, avec déchiffrage et fabrication déjà
achevés **avant le combat**, conformément au scénario demandé. L’arme complète
est visible dès le premier plan, puis il l’équipe ; aucune progression accélérée
ou fabrication instantanée n’est ajoutée au duel.

`furykovCounterPlan.ts` choisit une création spécifique au profil adverse :

| Profil                                       | Arme préparée      | Mise en scène                            |
| -------------------------------------------- | ------------------ | ---------------------------------------- |
| Hisoka, Machi                                | Coupe-liens        | Capture puis section des attaches de Nen |
| Franklin, Illumi, Kalluto, Musse, Leorio     | Lame-bouclier      | Interception de projectiles              |
| Biscuit, Phinks, Benjamin, Bonolenov, Beyond | Poinçon de rupture | Pénétration d’une garde renforcée        |
| Autres adversaires                           | Lame d’allonge     | Frappes au-delà de la prise adverse      |

Ces modèles et leurs contre-effets sont des créations de cinématique pour le
jeu, sans prétention d’avoir été montrés dans le manga. Ce ne sont ni des
annulations universelles du Nen ni de nouvelles commandes de combat.

Le portable montre cible, déchiffrage terminé, fabrication terminée et arme
prête. Furykov la prend entre 114 et 180. Le contre arrive à 216 ; trois frappes
atteignent la surface physique du torse à 276, 336 et 414. La prise du manche
suit la vraie main droite et les segments du bras ne changent pas de longueur.
La chute native démarre à 415, puis le portrait conserve l’arme équipée.

## Chorégraphie commune et validation

`personalGuardTrack.ts` conserve les cinq touches de Longhi et l’ancienne route de Furykov dans une vraie
simulation, sans remise à zéro des PV, de la distance ou des récupérations.
Longhi utilise coup bas, direct en avançant, crochet, direct, crochet. La nouvelle séquence de Furykov utilise sa contre-arme préparée et trois contacts instrumentés. Les deux séries gardent leurs vrais plans de corps, hitstops,
déplacements et réactions. Leurs images natives occupent 228–414 du film.

`nativeComboBody.ts` extrait sans changement le rendu de corps déjà utilisé par
Bill ; Bill conserve son comportement. Le réglage de contact ajuste la distance
aux surfaces du modèle sans étirer les articulations. La réception utilise
`nativeVictoryFall` ; le corps reste présent au sol pendant le portrait à 510.
Toutes les poses, matériaux, yeux, géométries et caméras sont restaurés après
chaque rendu. Le verdict et les ressources du combat ne changent pas.

`personalGuardFilm.ts` vérifie les commandes natives du contrat et un vrai
K.-O. physique. Pour Furykov, le portable est conjuré par une vraie commande ;
la préparation achevée avant le duel est une hypothèse de scénario explicitement
signalée dans le rapport, et non des jours simulés ou une capacité instantanée.
`furykovCounter.test.ts` contrôle les quatre formes, la cible, les prises,
les trois contacts, les chutes et la restauration des scènes.

Les films durent dix secondes en 1080p60. Les mix suivent les contacts natifs,
les signatures ou l’alerte, la réception et l’annonce Fatality en anglais.
Aucune réplique française n’est parlée. La caméra réduite reste fixe.

```sh
node apps/web/scripts/render-personal-guard.mjs
node apps/web/scripts/render-personal-guard.mjs --longhi
node apps/web/scripts/compose-personal-guard.mjs
node apps/web/scripts/check-personal-guard.mjs
```

Sorties : `output/fighting-personal-guard/{furykov,longhi}/`.
Tests : `personalGuard.test.ts`, `renderer.test.ts`, `playback.test.ts` et les
tests de non-régression de `beyondCurse.test.ts`. Le contrôle navigateur couvre
les deux côtés, grands/petits adversaires, miroirs, trois lieux, mobile, confort,
le déclenchement réel, le son, le passage et l’immuabilité du résultat.
