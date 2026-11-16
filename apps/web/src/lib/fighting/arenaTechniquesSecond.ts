import { technique, type ArenaTechnique } from './arenaTechniqueTypes'
import type { FighterId } from './types'

export const SECOND_ARENA_TECHNIQUES: Partial<Record<FighterId, ArenaTechnique>> = {
  rihan: technique(
    ['Chasse aux manifestations', 'Manifestation hunt'],
    [
      'Analyse puis envoie Predator contre une manifestation de Hatsu observée.',
      'Analyse, then send Predator against an observed Hatsu manifestation.',
    ],
    {
      condition: [
        'Ni caisse ni corps ne constituent une proie ; coût de 48 h sans Nen conservé.',
        'Neither crates nor bodies are prey; the 48-hour Nen cost remains.',
      ],
    },
  ),
  zakuro: technique(
    ['Sang éclaireur', 'Blood scout'],
    [
      'Envoie de vraies gouttes-yeux surveiller les trajets autour du couvert.',
      'Send actual eye-drops to observe routes around cover.',
    ],
    {
      condition: [
        'Plaie et réserve de son propre sang ; aucune création gratuite de sang.',
        'Requires a wound and his own blood supply; no free blood creation.',
      ],
      kind: 'special',
      move: 'downSpecial',
    },
  ),
  melody: technique(
    ['Concert dans l’arène', 'Arena concert'],
    [
      'La musique agit sur les auditeurs à portée, même derrière une caisse.',
      'Music affects listeners in range, including behind a crate.',
    ],
    {
      condition: [
        'Flûte, jeu continu et audition ; se couvrir les oreilles permet de résister.',
        'Flute, continuous performance and hearing; covering ears lets listeners resist.',
      ],
    },
  ),
  basho: technique(
    ['Couvert en flammes', 'Burning cover'],
    [
      'Après écriture du poème attesté, un coup de poing embrase la caisse touchée.',
      'After writing the attested poem, a punch ignites the crate it touches.',
    ],
    {
      condition: [
        'Poème rédigé et prêt ; le feu détruit le support sans inventer une attaque de zone.',
        'Written, ready poem; fire destroys the support without inventing an area attack.',
      ],
      kind: 'light',
    },
  ),
  camilla: technique(
    ['Pression balistique', 'Ballistic pressure'],
    [
      'Le pistolet détruit les couverts derrière lesquels se réfugie l’adversaire.',
      'The handgun destroys cover the opponent shelters behind.',
    ],
    {
      condition: [
        'Cat’s Name reste posthume et lié au meurtrier ; aucun chat commandable.',
        'Cat’s Name remains post-mortem and bound to the killer; no controllable cat.',
      ],
      kind: 'ranged',
    },
  ),
  halkenburg: technique(
    ['Flèche sans couvert', 'Cover-piercing arrow'],
    [
      'La flèche de possession ignore le couvert physique.',
      'The possession arrow ignores physical cover.',
    ],
    {
      condition: [
        'Partisans réels, marqués et consentants ; volonté collective chargée.',
        'Real, marked, consenting supporters; gathered collective will.',
      ],
    },
  ),
  gel: technique(
    ['Allonge du serpent', 'Serpent reach'],
    [
      'Le bras transformé frappe les couverts à sa portée.',
      'The transformed arm strikes cover within reach.',
    ],
    {
      condition: [
        'Pas de venin, de terrain toxique ni de propriété non révélée.',
        'No venom, toxic terrain or unrevealed property.',
      ],
    },
  ),
  lynch: technique(
    ['Interrogatoire au contact', 'Contact interrogation'],
    [
      'Questionne puis frappe pour obtenir une information privée utile au placement.',
      'Ask, then punch for private information useful to positioning.',
    ],
    {
      condition: [
        'Une personne consciente doit répondre par Body and Soul ; le décor ne parle pas.',
        'Body and Soul needs a conscious person; scenery cannot speak.',
      ],
    },
  ),
  luini: technique(
    ['Itinéraire préparé', 'Prepared route'],
    [
      'Traverse entre une pièce d’ancrage et sa destination visitée.',
      'Travel between an anchor room and its visited destination.',
    ],
    {
      condition: [
        'Préparation du scénario obligatoire ; ouvrir la porte invalide la pièce.',
        'Scenario preparation required; opening the door invalidates the room.',
      ],
    },
  ),
  bill: technique(
    ['Faire germer', 'Germinate'],
    [
      'Fait pousser la graine vivante du scénario dans le décor.',
      'Grow the scenario’s living seed in the scenery.',
    ],
    {
      condition: [
        'Graine réelle à portée ; aucune liane offensive ni forêt instantanée.',
        'Actual seed in reach; no attacking vines or instant forest.',
      ],
    },
  ),
  furykov: technique(
    ['Veille du terrain', 'Terrain watch'],
    [
      'Ouvre la console de Combo Master pour ses alertes de Nen dissimulé.',
      'Open the Combo Master console for concealed-Nen alerts.',
    ],
    {
      condition: [
        'Alerte liée à une menace réelle, sans déchiffrage instantané ni prédiction.',
        'Alert requires a real threat; no instant deciphering or prediction.',
      ],
    },
  ),
  cluck: technique(
    ['Courrier de l’arène', 'Arena courier'],
    [
      'Un pigeon réel rejoint le point de livraison préparé.',
      'An actual pigeon reaches the prepared delivery point.',
    ],
    {
      condition: [
        'Oiseau réel requis ; aucun bombardement ou escadron offensif inventé.',
        'Actual bird required; no invented bombing or attacking squadron.',
      ],
    },
  ),
  beyond: technique(
    ['Briser l’obstacle', 'Break the obstacle'],
    ['Une frappe martiale endommage le couvert proche.', 'A martial strike damages nearby cover.'],
    {
      condition: [
        'La malédiction préparée de Beyond ne devient pas un Hatsu de terrain.',
        'Beyond’s prepared curse does not become a terrain Hatsu.',
      ],
      kind: 'heavy',
    },
  ),
  longhi: technique(
    ['Trêve du terrain', 'Terrain truce'],
    [
      'Propose la trêve de Moonlight Act : démolir un couvert par une attaque viole aussi la trêve.',
      'Offer Moonlight Act’s truce: attacking cover also breaches the truce.',
    ],
    {
      condition: [
        'Deux signatures volontaires ; aucune règle imposée par simple contact.',
        'Two voluntary signatures; no rule imposed by mere contact.',
      ],
    },
  ),
  musse: technique(
    ['Fenêtre sur l’adversaire', 'Window on the opponent'],
    [
      'Pose le hibou au contact pour suivre l’adversaire qui se replie derrière un couvert.',
      'Attach the owl on contact to observe an opponent retreating behind cover.',
    ],
    {
      condition: [
        'Surveillance privée ; ni vision du futur ni dégâts du hibou.',
        'Private observation; neither future sight nor owl damage.',
      ],
    },
  ),
  padaille: technique(
    ['Outil de démolition', 'Demolition tool'],
    [
      'Transforme la main en marteau, puis frappe le couvert lors des activations suivantes.',
      'Transform the hand into a hammer, then strike cover on subsequent activations.',
    ],
    {
      condition: [
        'Les trois outils attestés restent disponibles par leurs commandes habituelles.',
        'The three demonstrated tools remain available through their usual commands.',
      ],
    },
  ),
  sayird: technique(
    ['Petit éclaireur', 'Small scout'],
    [
      'Un petit animal réel suit la cible et relaie sa vue et son ouïe dans l’arène.',
      'A real small animal follows the target and relays sight and hearing in the arena.',
    ],
    {
      condition: [
        'Animal réel approprié ; aucune créature de Nen créée pour l’occasion.',
        'Appropriate real animal; no Nen creature created for the occasion.',
      ],
    },
  ),
  terebellum: technique(
    ['Réceptacle de fortune', 'Improvised receptacle'],
    [
      'Active Sweet Home près d’une caisse pour lui transférer les blessures au contact de la main gauche.',
      'Activate Sweet Home near a crate to transfer injuries into it through left-hand contact.',
    ],
    {
      condition: [
        'Contacts simultanés réels ; le réceptacle reçoit les dégâts transférés.',
        'Actual simultaneous contacts; the receptacle takes the transferred damage.',
      ],
    },
  ),
  voconte: technique(
    ['Raccourci par les seuils', 'Doorway shortcut'],
    [
      'Relie les huisseries physiques pour contourner les couverts.',
      'Link physical door frames to bypass cover.',
    ],
    {
      condition: [
        'Il faut réellement franchir un seuil ; conditions complètes de Door inconnues.',
        'A threshold must actually be crossed; Door’s complete conditions remain unknown.',
      ],
    },
  ),
  yokotani: technique(
    ['Expulsion du périmètre', 'Perimeter expulsion'],
    [
      'LSDF expulse l’intrus hors du périmètre, sans lui infliger de dégâts.',
      'LSDF expels the intruder from the perimeter without dealing damage.',
    ],
    {
      condition: [
        'Planque Heil-Ly, Morena présente et intrus en infraction.',
        'Heil-Ly hideout, Morena present and an unlawful intruder.',
      ],
    },
  ),
}
