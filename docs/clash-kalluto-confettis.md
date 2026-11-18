# Kalluto : réemploi des confettis

Cette extension de l’[arsenal rétrospectif](./clash-arsenal-integral.md) correspond
aux rulesets **clash-combat-42** puis **48**. Le On est conservé, avec ses blocages du Nen.
L’audit des quarante arsenaux reste ouvert.

## Application représentée

Le chapitre 226 montre le papier dispersé puis concentré par la manipulation de
Kalluto. Dans le duel, une préparation de marquage contient le fragment planté et
le reste des confettis. Les douze préparations du chargement sont des lots de
matériel de scénario, pas douze morceaux individuels ni une limite du Hatsu.

Depuis le ruleset 48, un seul lot est divisé en trois trajectoires identifiées,
chacune avec son fragment et ses confettis. Le stock ne diminue qu'une fois.
Le nombre de trajectoires et les budgets totaux de dégâts et de résistance
restent des réglages du duel, répartis entre les chemins.

Le papier encore en vol peut se rassembler depuis ses positions actuelles,
même sans salve neuve ni confettis au sol. Aucun projectile, identifiant ou lot
supplémentaire n'est créé lors de cette redirection. Les nuages disponibles
peuvent également converger ensemble, en partageant un seul budget de dégâts.

Après dispersion, les confettis existent dans l’arène. Une nouvelle commande de
courant coupant reprend le même lot disponible, avec le même identifiant,
sans dépenser une nouvelle salve. Pendant son vol, ce lot ne peut pas être émis
une seconde fois. Sa position suit celle du projectile réel, puis il retombe à
son dernier emplacement. Les manches conservent cette matière.

Relâcher volontairement la manipulation conserve le papier ordinaire. Une
nouvelle activation exige encore un accès admissible au Hatsu, le matériel
d’éventail représenté et une main disponible. L’origine universelle du papier
et les conditions absolues d’un usage sans éventail ne sont pas révélées :
ces commandes n’en déduisent ni conjuration gratuite ni interdiction canonique.

## Emprunt et interactions matérielles

Dolphin peut maintenir cette manipulation continue après sa première émission.
Les commandes suivantes reprennent exclusivement ses confettis réellement
disponibles ; elles ne permettent pas un second marquage frais. Le prêt reste
lié à Emperor Time et utilise l’aura réellement prélevée. Relâcher le contrôle
termine l’application et rend la capacité au donneur.

Une capture physique par Bungee Gum ou un stockage réel empêchent le lot de
réapparaître au sol. Blinky peut aspirer les confettis ordinaires présents à son
embout. Un autre objet devenant le dernier objet aspiré ne recrée pas le papier
déjà avalé. Une expulsion réelle remet ce même lot en circulation.

Une copie issue de Gallery Fake conserve sa provenance et expire avec elle.
Sa matière conjurée ne devient pas du papier ordinaire admissible à Blinky.
In ne masque pas le papier réel ; pour une copie conjurée dissimulée, la vue et
le rendu adverses respectent Gyo. Le snapshot privé ne livre pas les lots cachés.

## Vérification et limites

Les tests exécutent les émissions, reprises, captures, prêts et replays de P2.
Ils revalident au départ la marque réelle, le matériel, la main et l'accès au
Nen. Le retrait d'une marque ou de l'éventail pendant la préparation ne permet
pas une émission devenue invalide.
Le contrôle d’interface couvre 1 100, 390 et 320 pixels, les récepteurs multiples,
le réemploi sans dépense supplémentaire et le dépôt puis ramassage du matériel.
Les identifiants et stocks restent identiques après ces opérations.

Quatre échecs hérités de l'exercice `kalluto:serpent` au bord de l'arène restent
ouverts : déplacer les corps après la préparation laisse les confettis à leurs
positions réelles, trop loin pour garantir la chaîne avant le retour de garde.
Les tests n'ont pas été affaiblis pour présenter ces situations comme réussies.

La compilation de production reste sous le plafond inchangé de 500 000 octets
par fichier client : maximum de 498 989 octets. Les métadonnées du moveset de
Kalluto rejoignent le catalogue existant ; les constantes de coût sont séparées
du moteur et leur ancien export est conservé. Un test charge le moteur compilé
et exerce l'émission réelle. Le test de compilation partielle des combos garde
son avertissement de bloc vide, reproduit sur la base `bb76fe426` ; les sept
autres tests de ce fichier réussissent.

Le ramassage manuel des confettis dans une réserve, les autres cibles physiques
et les interactions restantes demeurent à compléter. Cette extension ne certifie
pas l’arsenal complet de Kalluto ou des autres personnages.

Références : [chapitre 226](https://hunterxhunter.fandom.com/wiki/Chapter_226),
[applications du papier](https://hunterworld.tokyo/en/kaltzaoldyeck/).
