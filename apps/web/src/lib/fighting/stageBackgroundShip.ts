import { background } from './stageBackgroundTypes'

/** Arcade cameos, not assertions about passengers' canonical whereabouts. */
export const SHIP_BACKGROUNDS = {
  'whale-hold': background({
    cast: [
      ['phinks-magcub', 'Phinks'],
      ['franklin-bordeau', 'Franklin', 'seated'],
    ],
    image: ['whale', 'BLACK WHALE', 'CARGO CLUB', '05'],
    description: [
      'Une affiche de la baleine cache cinq petites lignes de pont.',
      'A whale poster hides five little deck lines.',
    ],
    secret: [
      'boat',
      'Un bateau de papier tangue près des caisses.',
      'A paper boat rocks beside the crates.',
    ],
  }),
  'heavens-arena': background({
    cast: [
      ['biscuit-krueger', 'Biscuit', 'seated', 'cheer'],
      ['leorio-paradinight', 'Leorio', 'seated', 'cheer'],
    ],
    image: ['hunter', 'CLASH ARENA', 'FRONT ROW', '200'],
    description: [
      'Un panneau de tournoi mêle licence de Hunter et couronne de champion.',
      'A tournament board combines a Hunter licence and a champion’s crown.',
    ],
    secret: [
      'card',
      'Une carte solitaire tourne au bord du premier rang.',
      'A lone card turns beside the front row.',
    ],
  }),
  'banquet-hall': background({
    cast: [
      ['nasubi-hui-guo-rou', 'Nasubi', 'seated', 'quiet'],
      ['melody', 'Melody', 'idle', 'cheer'],
    ],
    image: ['crown', 'KAKIN', 'GRAND BANQUET', '14'],
    description: [
      'Un portrait héraldique réunit une couronne et quatorze étoiles.',
      'A heraldic picture combines a crown and fourteen stars.',
    ],
    secret: [
      'cup',
      'Une tasse de thé semble saluer les combattants.',
      'A teacup seems to salute the fighters.',
    ],
  }),
  'vip-casino': background({
    cast: [
      ['prince-zhanglei', 'Zhang Lei', 'seated'],
      ['onior-longbao', 'Onior', 'seated', 'quiet'],
    ],
    image: ['coins', 'LUCKY WHALE', 'PRIVATE TABLE', '777'],
    description: [
      'Des pièces dessinent un arbre de famille sur une affiche de casino.',
      'Coins form a family tree on a casino poster.',
    ],
    secret: [
      'coin',
      'Un jeton doré oscille sans jamais tomber.',
      'A golden chip wobbles without falling.',
    ],
  }),
  'observation-deck': background({
    cast: [
      ['prince-kacho', 'Kacho', 'idle', 'cheer'],
      ['prince-fugetsu', 'Fugetsu', 'idle', 'cheer'],
    ],
    image: ['twins', 'TWO STARS', 'ONE HORIZON', '10 / 11'],
    description: [
      'Deux étoiles jumelles se répondent sur une affiche de traversée.',
      'Two twin stars face each other on a voyage poster.',
    ],
    secret: [
      'boat',
      'Un minuscule bateau de papier suit sa propre traversée.',
      'A tiny paper boat makes its own crossing.',
    ],
  }),
  'screening-room': background({
    cast: [
      ['hisoka', 'Hisoka', 'seated'],
      ['illumi', 'Illumi', 'seated', 'quiet'],
    ],
    image: ['reel', 'DOUBLE BILL', 'THE MAGICIAN RETURNS', '02'],
    description: [
      'Une affiche de cinéma annonce le retour d’un magicien avec une bobine stylisée.',
      'A cinema poster announces a magician’s return with a stylised reel.',
    ],
    secret: [
      'reel',
      'Une petite bobine continue sa projection imaginaire.',
      'A little reel keeps running its imaginary screening.',
    ],
  }),
  'supreme-court': background({
    cast: [
      ['mizaistom-nana', 'Mizaistom', 'idle', 'quiet'],
      ['botobai-gigante', 'Botobai', 'idle', 'quiet'],
    ],
    image: ['scales', 'SILENCE', 'THE COURT IS WATCHING', '01'],
    description: [
      'Une balance stylisée rappelle que le tribunal observe aussi le duel.',
      'Stylised scales recall that the court is watching the duel too.',
    ],
    secret: [
      'feather',
      'Une plume dorée penche doucement du mauvais côté.',
      'A golden feather slowly leans the wrong way.',
    ],
  }),
  'princes-burial-chamber': background({
    cast: [
      ['nasubi-hui-guo-rou', 'Nasubi', 'idle', 'quiet'],
      ['beyond-netero', 'Beyond', 'idle', 'quiet'],
    ],
    image: ['stars', 'FOURTEEN', 'UNDER THE SAME CROWN', '14'],
    description: [
      'Quatorze points d’or accompagnent un sceau royal sombre.',
      'Fourteen golden points accompany a dark royal seal.',
    ],
    secret: [
      'feather',
      'Une petite plume tourne lentement près du sceau.',
      'A small feather turns slowly beside the seal.',
    ],
  }),
  'heilly-hideout': background({
    cast: [
      ['morena-prudo', 'Morena', 'idle', 'quiet'],
      ['luini', 'Luini', 'seated', 'cheer'],
    ],
    image: ['spider', 'LEVEL UP?', 'NO FREE POINTS', '23'],
    description: [
      'Une araignée accompagne une affiche qui promet de gagner des niveaux.',
      'A spider accompanies a poster promising to gain levels.',
    ],
    secret: [
      'card',
      'Une fiche numérotée se balance à l’écart du combat.',
      'A numbered card swings away from the fight.',
    ],
  }),
  'royal-salon': background({
    cast: [
      ['nasubi-hui-guo-rou', 'Nasubi', 'seated', 'quiet'],
      ['beyond-netero', 'Beyond', 'idle', 'cheer'],
    ],
    image: ['crown', 'ROYAL WHALE', 'A VERY PRIVATE VIEW', '01-A'],
    description: [
      'Une couronne stylisée domine une affiche réservée au salon royal.',
      'A stylised crown dominates a poster reserved for the royal salon.',
    ],
    secret: [
      'cup',
      'Une tasse royale pivote sur son présentoir.',
      'A royal cup turns on its display.',
    ],
  }),
  'unma-salon': background({
    cast: [
      ['unma-hui-guo-rou', 'Unma', 'seated', 'quiet'],
      ['prince-benjamin', 'Benjamin', 'idle', 'quiet'],
    ],
    image: ['tea', 'FIRST QUEEN', 'AFTERNOON AUDIENCE', '01'],
    description: [
      'Une petite couronne se cache dans la vapeur d’un thé royal.',
      'A little crown hides in the steam of a royal tea.',
    ],
    secret: [
      'cup',
      'La petite tasse s’incline comme pour une révérence.',
      'The little cup tilts as though bowing.',
    ],
  }),
  'cha-r-warehouse': background({
    cast: [
      ['nobunaga-hazama', 'Nobunaga'],
      ['phinks-magcub', 'Phinks', 'idle', 'cheer'],
    ],
    image: ['cargo', 'HANDLE WITH CARE', 'EIGHT LEGS INSIDE?', '05'],
    description: [
      'Un bordereau de fret montre une caisse au contenu suspect.',
      'A freight label shows a crate with suspicious contents.',
    ],
    secret: [
      'spider',
      'Une araignée décorative grimpe le long d’une étiquette.',
      'A decorative spider climbs beside a label.',
    ],
  }),
  'central-dining-hall': background({
    cast: [
      ['basho', 'Basho', 'seated', 'cheer'],
      ['leorio-paradinight', 'Leorio', 'seated', 'cheer'],
    ],
    image: ['menu', 'TODAY’S SPECIAL', 'A HUNTER’S APPETITE', '05'],
    description: [
      'Un bol de nouilles fume sous le titre du menu du jour.',
      'A noodle bowl steams beneath the title of the daily menu.',
    ],
    secret: [
      'cup',
      'Une tasse de café refuse de rester bien droite.',
      'A coffee cup refuses to stay perfectly straight.',
    ],
  }),
  'cineplex-concourse': background({
    cast: [
      ['hinrigh-biganduffno', 'Hinrigh'],
      ['hisoka', 'Hisoka', 'idle', 'quiet'],
    ],
    image: ['cards', 'MAGIC HOUR', 'ONE TICKET · TWO FACES', '03'],
    description: [
      'Des cartes dédoublées annoncent une séance de magie.',
      'Doubled playing cards announce a magic show.',
    ],
    secret: [
      'card',
      'Un billet de cinéma fait un tour sur lui-même.',
      'A cinema ticket turns all the way around.',
    ],
  }),
  'cineplex-screen-corridor': background({
    cast: [
      ['nobunaga-hazama', 'Nobunaga'],
      ['bonolenov-ndongo', 'Bonolenov', 'idle', 'quiet'],
    ],
    image: ['reel', 'ONE MORE TAKE', 'QUIET IN THE CORRIDOR', '03-B'],
    description: [
      'Une bobine promet une prise supplémentaire dans ce couloir silencieux.',
      'A reel promises one more take in this silent corridor.',
    ],
    secret: [
      'reel',
      'Une bobine tourne à contre-sens du dessin de l’affiche.',
      'A reel turns opposite to the poster’s drawing.',
    ],
  }),
  'cha-r-office': background({
    cast: [
      ['brocco-li', 'Brocco Li', 'seated', 'quiet'],
      ['lynch-fullbokko', 'Lynch', 'idle', 'cheer'],
    ],
    image: ['fish', 'FAMILY BUSINESS', 'PLEASE TAKE A NUMBER', '05-C'],
    description: [
      'Un emblème dessiné associe un poisson et une affaire de famille.',
      'A drawn emblem combines a fish and a family business.',
    ],
    secret: [
      'coin',
      'Un jeton de négociation roule sur sa tranche.',
      'A bargaining chip rolls on its edge.',
    ],
  }),
  'police-atrium': background({
    cast: [
      ['mizaistom-nana', 'Mizaistom'],
      ['gel', 'Gel', 'idle', 'quiet'],
    ],
    image: ['badge', 'LOST & FOUND', 'ONE VERY SMALL CLUE', '03'],
    description: [
      'Un avis de recherche humoristique montre une étoile de police.',
      'A comic lost-and-found notice shows a police star.',
    ],
    secret: [
      'boat',
      'Un bateau miniature semble prêt pour la fontaine.',
      'A miniature boat seems ready for the fountain.',
    ],
  }),
  'hangar-entrance': background({
    cast: [
      ['cluck', 'Cluck'],
      ['sayird', 'Sayird', 'idle', 'quiet'],
    ],
    image: ['bird', 'SPECIAL DELIVERY', 'DESTINATION: ELSEWHERE', '05-H'],
    description: [
      'Un oiseau porte une lettre en forme de losange sur une affiche de livraison.',
      'A bird carries a diamond-shaped letter on a delivery poster.',
    ],
    secret: [
      'boat',
      'Un pliage attend son départ entre deux étiquettes.',
      'A folded paper boat waits to depart between two labels.',
    ],
  }),
  'hull-suspension': background({
    cast: [
      ['bill', 'Bill'],
      ['beyond-netero', 'Beyond', 'idle', 'cheer'],
    ],
    image: ['spring', 'MIND THE BOUNCE', 'THE WHALE HAS LEGS', '05-S'],
    description: [
      'Un ressort géant dessiné annonce les rebonds de la baleine.',
      'A giant drawn spring announces the whale’s bouncing.',
    ],
    secret: [
      'spring',
      'Un petit ressort imite très doucement les géants de la baie.',
      'A little spring gently imitates the bay’s giants.',
    ],
  }),
  'exterior-main-deck': background({
    cast: [
      ['leorio-paradinight', 'Leorio', 'idle', 'cheer'],
      ['biscuit-krueger', 'Biscuit', 'seated'],
    ],
    image: ['compass', 'BEYOND THE HORIZON', 'BRING A GOOD MAP', '01-A'],
    description: [
      'Une rose des vents invite à regarder au-delà de l’horizon.',
      'A compass rose invites a look beyond the horizon.',
    ],
    secret: [
      'boat',
      'Un bateau de papier prend le vent sans quitter le décor.',
      'A paper boat catches the wind without leaving the scenery.',
    ],
  }),
  'starboard-lifeboats': background({
    cast: [
      ['prince-kacho', 'Kacho', 'idle', 'quiet'],
      ['prince-fugetsu', 'Fugetsu', 'idle', 'quiet'],
    ],
    image: ['lifeboat', 'TWO SEATS', 'SAVE ONE FOR ME', '10 / 11'],
    description: [
      'Une image de canot réserve deux sièges sous deux étoiles.',
      'A lifeboat picture reserves two seats beneath two stars.',
    ],
    secret: [
      'boat',
      'Le plus petit canot du pont tient sur un présentoir.',
      'The deck’s smallest lifeboat fits on a display.',
    ],
  }),
}
