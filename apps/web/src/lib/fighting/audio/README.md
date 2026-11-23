# Identité sonore de Clash

Le combat réutilise les recettes de `../../audio/hatsuSounds.ts`, le bruit partagé
de `../../audio/hatsu/synth.ts`, les profils `NEN_PRESENTATION` et la réponse
acoustique `impulseResponse` de la visite.

- `profiles.ts` écrit la matière, le poids, le souffle et le motif de chacun des
  quarante combattants ; `catalogueProfiles.ts` couvre les autres identités.
- `stages.ts` et `stageAdditions.ts` couvrent les 33 terrains, leurs sols,
  leur réverbération et leurs motifs ; les salons ont une acoustique plus courte.
  La pression suit le temps, le pourcentage de PV restant, les combos, les points
  et les knockdowns. Le calcul respecte les formats à plusieurs barres de vie.
- `events.ts` et `states.ts` comparent les états immuables du moteur. Un coup dans
  le vide souffle à sa frame active ; une blessure, une parade et une esquive ont
  des réponses distinctes. Les projectiles annoncent leurs tirs réels, sans rafale
  audio qui continue quand Franklin est interrompu.
- `hatsu.ts` et `techniques.ts` associent les recettes aux techniques. Les copies
  de Chrollo utilisent la source du Hatsu ; Black Voice et Sun and Moon ont des
  accents propres. Les pages, le Bungee Gum, la forme de Biscuit, la projection de
  Hanzo, Pain Packer, Rising Sun et les gardes LSDF suivent leurs états réels.
- `bonolenov.ts` synthétise l'air et les résonances des orifices découverts de
  Bonolenov pendant ses danses, ses déplacements et ses frappes. La phrase suit
  les compteurs de mouvement et s'éteint au repos, sur interruption et pendant
  le hitstop ; le directeur applique également pause, mute et fin de manche.
- `director.ts` tient les ambiances, l'aura et la pression. Ten, Ren, Ken, Gyo,
  Ryu, Ko, In, En, Shu, Zetsu et On utilisent le vocabulaire sonore partagé.
  Zetsu ferme l'aura ; On gronde et bat de façon instable. Emperor Time ajoute
  maillons, battement double, frottement harmonique et retrait de l'ambiance.
  Chaque seconde de vie dépensée, hitstop compris, déclenche un battement.
- Le mécanisme de montre est discret dès le début d'une manche chronométrée :
  toutes les deux secondes, puis chaque seconde sous 30 s, chaque demi-seconde
  sous 10 s et chaque quart de seconde sous 5 s. À 15 s, la montre est remontée ;
  à zéro, ses cloches sonnent. Aucun faux compte à rebours en entraînement.
- `mixer.ts` place les événements en stéréo, limite les queues à 32 voix et possède
  toutes ses sources. La sortie passe par les faders et le limiteur communs. Le
  graphe du combat ne modifie jamais l'oreille ou la salle de la visite. La pause,
  l'onglet masqué et le mute coupent la sortie ; les états observés pendant ce
  silence ne sont pas rejoués. Sortir ou changer de manche libère les sources et
  conserve l'AudioContext partagé.

Les volumes d’impacts, déplacements, techniques, voix, interface, musique, ambiance,
tension et cinématiques sont mémorisés dans `black-whale:fighting-audio`, avec
sortie mono et préréglages Compétition et Accessibilité. Les faders généraux
du site s’appliquent à la sortie. La voix de bord et les voix de combat ont
chacune leur fader. Les prises courtes sont accordées au registre du combattant.
Le nom du Kaméo retentit à son entrée effective. Les annonces suivent le
départ, la manche décisive et le verdict confirmé.

Les voix françaises et anglaises suivent la langue du jeu. Les deux banques
de la voix de bord sont synthétisées hors ligne. En combat, les banques
propres aux deux combattants sont préchargées à la sélection de la langue et
du duel. Chaque combattant a ses prises d’effort, de douleur et d’appel. Les
modèles et les scripts de génération figurent
dans [les crédits des voix](../../../../static/audio/clash-voices/SOURCES.md).

Les contacts confirmés traversent les mises à jour groupées dans un historique
court qui couvre aussi les deux coups d’un échange simultané. En PvP, l’audio
suit les instantanés confirmés. La tête de lecture d’un replay repart en silence
après un saut. Burst, choc de Ko et parade ont priorité sous forte polyphonie.

Les contacts physiques combinent une attaque courte, le corps du choc et une
résonance qui reste présente sur de petits haut-parleurs. Les coups répétés
alternent quatre variations et les longues séries atténuent leur corps. Un
coup léger, une garde et un coup de chaîne ont des signatures propres. Les
pas suivent les transitions d’appui de la marche rendue, tandis que les
réceptions et les chutes se calent sur le retour au sol. Les interceptions
de projectiles suivent les collisions du moteur, même entre deux mises à jour
visuelles.

Les cinématiques ont leur propre fader et un repli sur la piste de victoire du
personnage. La détonation de la piste Sun and Moon est à 0,4 seconde, sur la
24e image de la scène.

Tests unitaires avec `pnpm --filter @black-whale/web test src/lib/fighting/audio`.
Le banc navigateur `node apps/web/scripts/check-fighting-audio.mjs` fait jouer
Kurapika contre Chrollo avec Luzurus et vérifie aussi le repli Sun and Moon.

Le jukebox du menu principal permet de préécouter les six pistes et de choisir
séparément la musique du menu et celle des combats. Le mode automatique garde
la programmation par terrain. Les registres Original, Grave et Clair modulent
les banques existantes. Le commentaire, facultatif, lit les événements confirmés
et laisse passer au moins sept secondes entre deux remarques. Le verdict a
priorité.

L’audiodescription, réglable séparément et incluse dans le préréglage
Accessibilité, charge une banque dédiée. Ses repères suivent les images
des 39 cinématiques et variantes, en français et en anglais. Pendant une
scène décrite, elle passe devant les annonces et atténue la bande-son à
l’endroit des répliques. La pause et le saut arrêtent la narration.

Les sous-titres des sons de combat sont disponibles dans Mixage et inclus dans
le préréglage Accessibilité. Ils fonctionnent avec la sortie audio coupée et
suivent les mêmes instantanés confirmés et règles de perception que le son.
Deux sous-titres au maximum s’affichent à la fois, avec priorité aux annonces et
aux alertes tactiques.
La pause, le changement de point de vue et le saut dans un replay effacent les
signaux en cours.

En sélection, chaque combattant a une réplique originale en français et en
anglais, jouée au choix du portrait. La fiche affiche le texte et permet de
réécouter la voix. Les listes de personnages des autres modes déclenchent
aussi la réplique à la sélection. Le fader des voix, le registre et le mode
silencieux s’appliquent. Une nouvelle sélection interrompt la phrase précédente.
Le banc navigateur `node apps/web/scripts/check-fighting-selection-voices.mjs`
vérifie les deux langues, la réécoute et l’interruption des répliques.

Quand les deux personnages ont un échange dans `presentation/rivalExchanges.json`,
la sélection du duel et le PvP privé jouent leurs deux prises, dans l’ordre
écrit. La fiche de sélection affiche les deux répliques avec leur locuteur.
Pour un duel sans échange écrit, le personnage choisi conserve sa phrase
individuelle.
