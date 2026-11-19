# Hisoka — ordre préalable au cœur et aux poumons

Le ruleset **clash-combat-72** ajoute l’application post-mortem de Bungee Gum
montrée au [chapitre 357](https://www.viz.com/shonenjump/hunter-x-hunter-chapter-357/chapter/10538).
La cause d’asphyxie, l’ordre donné avant de mourir et le retour d’Hisoka sont
recoupés dans le [résumé de cette scène](https://supercorona.wordpress.com/2021/05/19/hunter-x-hunter-chapter-357-unfortunate-part-2/).
Le succès montré ne prouve pas une résurrection universelle.

## Préparation et contexte réel

Le panneau permet à Hisoka de programmer Bungee Gum **de son vivant**, avec
son Nen disponible. L’ordre appartient au corps physique qui le donne ; une
apparence, un autre corps, une projection ou un paquet client ne le remplacent
pas. L’IA peut préparer cet ordre dans une ouverture quand ses PV sont bas,
sans connaître sa future mort ni créer ses conditions.

La ressource de scénario « Hisoka · scène du chapitre 357 » est décochée par
défaut : choisir simplement un combat scénarisé n’impose pas cette mort.
La sélectionner déclare les faits
de ce préambule historique : ordre préalable réellement exécuté par le même
moteur, explosion, parties du corps endommagées, mort par asphyxie puis air
rétabli. Le cœur, les poumons, les voies aériennes et la viabilité sont des
**prémisses physiques explicites de ce succès rétrospectif**, pas des conditions
numériques révélées par le manga ni un diagnostic dérivé de zéro PV.
La reprise réussie motive cette viabilité ; le code n’invente pas un traitement
d’un cerveau ou d’un organe détruit.

Ce préambule ouvre un nouveau duel avec Hisoka blessé. Il ne réécrit pas le
verdict historique du combat contre Chrollo. Les blessures de la main gauche,
de la jambe droite, du visage et du cou restent présentes, avec des plaies
ouvertes. Aucune chair ni prothèse n’est créée par le pompage. Les blessures supplémentaires
déjà déclarées dans la préparation sont conservées.

## Mort et séquence

La mort enregistrée doit être **explicitement une asphyxie fatale**, avec
l’ordre antérieur, le même corps et le contexte viable. Un KO ordinaire, une
balle, un coup, la chaleur, une hémorragie, Judgment Chain ou la rupture d’un
serment ne sont jamais convertis en asphyxie. Un ordre manquant ne peut plus
être donné après la mort. Le On et les scellements empêchent la préparation ;
un On encore actif n’est pas effacé pour permettre le Nen post-mortem.

La réserve d’aura vivante peut être épuisée après l’ordre : le Nen post-mortem
ne recrée aucune aura utilisable par le combattant. Le On et les autres
scellements ne sont pas ignorés derrière ce cas d’épuisement.

La séquence consomme l’ordre, anime le torse et la tête sur le **rig humain
partagé** et restitue seulement la réserve de PV correspondant au traumatisme
physique déjà déclaré. Les membres perdus, les surfaces blessées et les plaies
ne guérissent pas. Le score, les manches gagnées et les PV adverses ne changent
pas. L’arsenal de colmatage, de prothèses et de Texture Surprise reste distinct.

Les huit unités d’aura de préparation, les 120 frames de mise en scène et la
moitié des PV attribuée au traumatisme dans le préambule sont des réglages de
duel. Le manga ne donne ni ces valeurs, ni une probabilité générale de succès.
La séquence suspend les actions du duel comme celle de Cat’s Name ; le temps
physique des copies, les sanctions et l’Emperor Time vivant continuent d’être
comptés. Deux décès préparés conservent chacun leur propre cause et leur corps.

## Persistance et confidentialité

L’ordre non dépensé reste sur le même corps entre les manches, y compris quand
le compteur de frames de la nouvelle manche revient à zéro. Sa date enregistrée
est une information de replay, pas une durée de validité inventée pour le Nen. Le préambule
historique n’est pas rejoué à chaque manche. Une identité de relais différente
n’est pas réanimée à sa place. Le programme interne et le certificat physique
adverse restent privés ; l’animation de pompage effectivement commencée est
visible. Le protocole accepte la commande typée et le scénario déclaré, jamais
un certificat d’organes fourni dans une commande client.

Les replays conservent la préparation, la mort et la séquence complète, pour
P1 comme pour P2. Les snapshots acceptent la consommation légitime des prémisses
du scénario. Cette étape ne certifie pas encore les quarante arsenaux à 100 %.

## Vérification

Les 40 tests dédiés couvrent l’ordre vivant, les causes refusées, les organes
non viables, l’épuisement et le On, l’IA, le rig partagé, les deux perspectives,
les replays complets, les snapshots, les relais et les commandes réellement
bloquées pendant le préambule. Les 49 tests d’équipes, les 22 tests de Camilla
et les six contrôles de son horloge d’Emperor Time passent également.
Les 251 tests d’intégration de la première passe incluent les sutures de Machi,
l’IA, Ghostwriter et le protocole PvP.

Les six parcours UI vérifient la commande et la scène historique pour P1/P2
à 1100, 390 et 320 pixels, sans erreur JavaScript. Le corps reste blessé après
la reprise. Les neuf tests de bundles compilés et les 24 contrôles du dépôt
passent ; le lint respecte les limites de complexité et de 500 lignes.

La qualification des quarante combattants passe ses 3 167 cas. Les 96 flux
de commandes originaux sont conservés ; après les corrections finales, leurs
enregistrements sont identiques octet pour octet à ceux déjà qualifiés, avec
une empreinte de sources actualisée.

La dernière vérification Svelte/TypeScript termine avec zéro erreur et zéro
avertissement. La compilation respecte le plafond inchangé de 500 000 octets
par fichier JavaScript : maximum 497 172 octets. Le catalogue des terrains
est chargé séparément, avec conservation de toutes ses données dans le test
du bundle compilé.

Le parcours du jeu de production sélectionne Hisoka et Theta, vérifie que la
scène est décochée par défaut, la choisit explicitement et démarre réellement
avec « FIGHT ». Le HUD passe de zéro PV à la réserve du traumatisme, sans erreur
JavaScript. Le script permanent est `check-clash-production-resuscitation.mjs`.
