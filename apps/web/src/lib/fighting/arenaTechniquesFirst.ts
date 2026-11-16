import { technique, type ArenaTechnique } from './arenaTechniqueTypes'
import type { FighterId } from './types'

export const FIRST_ARENA_TECHNIQUES: Partial<Record<FighterId, ArenaTechnique>> = {
  kurapika: technique(
    ['Chaîne de démolition', 'Chain demolition'],
    ['La chaîne divinatoire brise un couvert à distance.', 'Dowsing Chain breaks distant cover.'],
    {
      condition: ['Pas de Chain Jail sur le décor.', 'Never applies Chain Jail to scenery.'],
      kind: 'special',
      move: 'forwardSpecial',
    },
  ),
  hisoka: technique(
    ['Point d’ancrage', 'Anchor point'],
    [
      'Colle Bungee Gum à une caisse ; une seconde activation le propulse vers elle.',
      'Attach Bungee Gum to a crate; activate again to pull yourself towards it.',
    ],
    {
      condition: [
        'Trajet physique, sans invulnérabilité ; la rupture du support coupe le lien.',
        'Physical travel, no invulnerability; breaking the support breaks the link.',
      ],
      kind: 'special',
      utility: 'gum',
    },
  ),
  chrollo: technique(
    ['Décor piégé', 'Marked scenery'],
    [
      'Marque deux objets réels de Soleil et de Lune ; les pousser au contact déclenche l’explosion.',
      'Mark two real objects with Sun and Moon; pushing them into contact triggers the explosion.',
    ],
    {
      condition: [
        'Page Sun and Moon active ; livre fermé pour employer la main droite. Marques posthumes conservées.',
        'Sun and Moon must be active; close the book to use the right hand. Post-mortem marks persist.',
      ],
      kind: 'special',
      utility: 'marks',
    },
  ),
  benjamin: technique(
    ['Ligne de tir', 'Firing lane'],
    [
      'Air Blow frappe le couvert ; la mitraillette peut ensuite exploiter la brèche.',
      'Air Blow strikes cover; the machine gun can then exploit the breach.',
    ],
    {
      condition: [
        'Héritage acquis avant le duel ; règles complètes d’Air Blow inconnues.',
        'Inherited before the duel; Air Blow’s full rules remain unknown.',
      ],
    },
  ),
  tserriednich: technique(
    ['Futur du terrain', 'Terrain forecast'],
    [
      'La vision simule aussi les déplacements et la destruction du décor.',
      'The vision also simulates movement and destruction of scenery.',
    ],
    {
      condition: [
        'Zetsu et yeux fermés ; la prévision ne modifie pas l’arène réelle.',
        'Zetsu and closed eyes; forecasting does not change the real arena.',
      ],
    },
  ),
  feitan: technique(
    ['Fournaise', 'Furnace'],
    [
      'Rising Sun consume aussi les caisses dans son rayon ; les couverts ne bloquent pas sa chaleur.',
      'Rising Sun also burns crates in its radius; cover does not block its heat.',
    ],
    {
      condition: [
        'Blessure reçue puis Pain Packer ; réactiver après avoir revêtu l’armure.',
        'Suffer an injury, then prepare Pain Packer; activate again after putting on the armour.',
      ],
    },
  ),
  saiyu: technique(
    ['Approche des trois singes', 'Three-monkey approach'],
    [
      'Lance Mizaru vers l’adversaire pour lui retirer la vue au contact.',
      'Send Mizaru towards the opponent to seal sight on contact.',
    ],
    {
      condition: [
        'Les singes affectent les sens du vivant ; aucune zone de silence magique.',
        'The monkeys affect living senses; no magical silence field.',
      ],
    },
  ),
  theta: technique(
    ['Tir sur couvert', 'Cover shot'],
    [
      'Le pistolet endommage une caisse dans la ligne de tir.',
      'The handgun damages a crate in the firing line.',
    ],
    {
      condition: [
        'Interaction balistique ; Hatsu personnel inconnu.',
        'Ballistic interaction; personal Hatsu unknown.',
      ],
      kind: 'ranged',
    },
  ),
  biscuit: technique(
    ['Passage en force', 'Force a passage'],
    [
      'Un coup physique ouvre une brèche dans le couvert ; le corps naturel frappe plus fort.',
      'A physical blow opens a breach in cover; her natural body hits harder.',
    ],
    {
      condition: [
        'Cookie ne devient pas une attaque ni un soin instantané.',
        'Cookie does not become an attack or an instant heal.',
      ],
      kind: 'heavy',
    },
  ),
  phinks: technique(
    ['Percée du Cyclotron', 'Cyclotron breach'],
    [
      'Le poing chargé détruit le couvert ; sans tours, commence le moulinet.',
      'The charged fist destroys cover; with no turns, start winding.',
    ],
    {
      condition: [
        'Les rotations doivent être réellement accomplies ; les tours sont engagés dans un seul poing.',
        'Rotations must actually complete; all turns are committed to one punch.',
      ],
    },
  ),
  franklin: technique(
    ['Démolition en rafale', 'Barrage demolition'],
    [
      'Les balles de Nen grignotent les couverts, puis les tirs suivants traversent la brèche.',
      'Nen bullets wear down cover, then later shots pass through the breach.',
    ],
    {
      condition: [
        'Aucun percement universel du Nen ou des gardes.',
        'No universal piercing of Nen or guards.',
      ],
      kind: 'ranged',
    },
  ),
  machi: technique(
    ['Déplacer le couvert', 'Move cover'],
    [
      'Attache un fil à une caisse proche puis la tire vers elle.',
      'Attach a thread to a nearby crate and pull it towards her.',
    ],
    {
      condition: [
        'Fil maintenu, portée limitée ; une interruption libère le support.',
        'Maintained thread, limited range; interruption releases the support.',
      ],
      kind: 'special',
      utility: 'thread',
    },
  ),
  illumi: technique(
    ['Dégager l’accès', 'Clear access'],
    [
      'Une frappe physique détruit un obstacle proche.',
      'A physical strike destroys a nearby obstacle.',
    ],
    {
      condition: [
        'Needle People exige un crâne vivant ; aucune manipulation de caisse inventée.',
        'Needle People requires a living skull; no invented crate manipulation.',
      ],
      kind: 'heavy',
    },
  ),
  kalluto: technique(
    ['Papier de repérage', 'Listening paper'],
    [
      'Place le papier de surveillance selon les commandes de son Hatsu.',
      'Deploy surveillance paper through the existing Hatsu commands.',
    ],
    {
      condition: [
        'Écoute liée au papier réellement posé ; aucun radar omniscient.',
        'Listening depends on paper actually planted; no omniscient radar.',
      ],
      kind: 'special',
      move: 'downSpecial',
    },
  ),
  bonolenov: technique(
    ['Jupiter dans le décor', 'Jupiter through scenery'],
    [
      'La sphère écrase les caisses rencontrées pendant sa poursuite.',
      'The sphere crushes crates encountered during pursuit.',
    ],
    {
      condition: [
        'Nouvelle danse et portée sonore ; interrompre la musique dissipe la sphère.',
        'Requires a new dance and sound range; interrupting the music dispels the sphere.',
      ],
      kind: 'ranged',
    },
  ),
  shizuku: technique(
    ['Nettoyage du passage', 'Clear the passage'],
    [
      'Blinky aspire une caisse réelle au contact du tuyau et conserve le dernier objet rejetable.',
      'Blinky vacuums a real crate in front of the nozzle and retains the last ejectable object.',
    ],
    {
      condition: [
        'Ni êtres vivants, ni objets de Nen ; le rejet restitue la caisse, sans duplication.',
        'No living beings or Nen objects; ejection restores the crate without duplication.',
      ],
      kind: 'special',
      utility: 'vacuum',
    },
  ),
  hinrigh: technique(
    ['Couvert mobile', 'Mobile cover'],
    [
      'Déploie les pigeons-menottes réels au milieu des couverts.',
      'Deploy the real handcuff pigeons among cover.',
    ],
    {
      condition: [
        'Objets et stock réels ; Biohazard conserve leur fonction, sans mur de Nen.',
        'Actual objects and inventory; Biohazard preserves their function, without a Nen wall.',
      ],
    },
  ),
  mizaistom: technique(
    ['Ordre dans l’arène', 'Arena command'],
    [
      'Annonce l’ordre de Cross Game ; le décor fournit des voies pour y obéir.',
      'Issue the Cross Game order; scenery provides paths for complying.',
    ],
    {
      condition: [
        'Avertissement avant contrainte, sans dégâts ni champ d’interdiction invisible.',
        'Warning before restraint, without damage or an invisible prohibition field.',
      ],
    },
  ),
  leorio: technique(
    ['Frappe sous le couvert', 'Punch beneath cover'],
    [
      'L’aura traverse le sol sous les caisses ; le poing émergent peut les briser.',
      'Aura travels underground beneath crates; the emerging fist can break them.',
    ],
    {
      condition: [
        'Surface continue, point de sortie fixé ; aucun projectile aérien.',
        'Connected surface, fixed exit point; no airborne projectile.',
      ],
    },
  ),
  hanzo: technique(
    ['Traversée du double', 'Double traversal'],
    [
      'Le double passe à travers les couverts physiques pour changer l’angle d’approche.',
      'The double passes through physical cover to change its approach.',
    ],
    {
      condition: [
        'Le vrai corps reste endormi et vulnérable de son côté du couvert.',
        'The real body remains asleep and vulnerable on its side of cover.',
      ],
    },
  ),
}
