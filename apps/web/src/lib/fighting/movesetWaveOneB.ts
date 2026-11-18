import { buildMoveset, type MovesetSpec } from './movesetFactory'
import { tuneFeitanMoveset } from './feitanMoveset'

const SPECS: readonly MovesetSpec[] = [
  {
    fighterId: 'feitan',
    mechanic: [
      'Approches basses, estocs au parapluie et tailles de sabre rapides. Les variantes directionnelles de L sont physiques. Après une blessure, L revêt Pain Packer ; H libère un soleil fixe proportionnel à la douleur. L’armure protège de la chaleur, pas des coups.',
      'Low approaches, umbrella thrusts and rapid sword cuts. Directional L attacks are physical. After an injury, L dons Pain Packer; H releases a stationary sun proportional to the pain. The outfit protects against heat, not strikes.',
    ],
    finisherCondition: [
      'Pain Packer doit être revêtu et chargé de blessures. Aucun soleil ne doit être actif.',
      'Pain Packer must be worn and charged with injuries. No sun may already be active.',
    ],
    labels: [
      'Estoc bref|Short Thrust',
      'Taille de sabre|Sword Cleave',
      'Entaille basse|Low Slash',
      'Fauchage éclair|Flash Sweep',
      'Pique aérienne|Aerial Point',
      'Lame descendante|Descending Blade',
      'Estoc en course basse|Low Running Thrust',
      'Taille au cou|Neck Cut',
      'Revers de retrait|Retreating Cut',
      'Pain Packer|Pain Packer',
      'Estoc de lame dissimulée|Concealed Blade Thrust',
      'Entaille rasante|Sweeping Slash',
      'Revers de lame|Blade Backslash',
      'Étranglement du bourreau|Executioner Choke',
      'Rising Sun|Rising Sun',
    ],
    speed: 0.78,
    power: 1.04,
    reach: 1.1,
    combos: [
      ['standingLight', 'forwardLight', 'forwardSpecial'],
      ['lowLight', 'standingHeavy', 'neutralSpecial'],
      ['airLight', 'airHeavy', 'downSpecial'],
    ],
  },
  {
    fighterId: 'saiyu',
    mechanic: [
      'L : Mizaru retire la vue ; → + L : Kikazaru retire l’ouïe ; ↓ + L : Iwazaru retire la parole. Chaque singe doit toucher ; répéter le même ne retire aucun autre sens. Aucun Zetsu automatique. Portée, garde et durée jusqu’à la fin de manche sont des adaptations du duel.',
      'L: Mizaru removes sight; → + L: Kikazaru removes hearing; ↓ + L: Iwazaru removes speech. Each monkey must hit; repeating one removes no other sense. No automatic Zetsu. Range, guard and duration until the round ends are duel adaptations.',
    ],
    finisherCondition: [
      'Au moins deux sens adverses doivent être scellés.',
      'At least two opposing senses must be sealed.',
    ],
    labels: [
      'Pointe du bâton|Staff Point',
      'Arc du prêtre|Priest Arc',
      'Frappe aux chevilles|Ankle Staff',
      'Balayage du singe|Monkey Sweep',
      'Pique céleste|Heavenly Poke',
      'Roue du bâton|Staff Wheel',
      'Pas du pèlerin|Pilgrim Step',
      'Pilier écrasant|Crushing Pillar',
      'Garde inversée|Reverse Guard',
      'Mizaru · Ne rien voir|Mizaru · See No Evil',
      'Kikazaru · Ne rien entendre|Kikazaru · Hear No Evil',
      'Iwazaru · Ne rien dire|Iwazaru · Speak No Evil',
      'Cercle du bâton|Staff Circle',
      'Prise du singe|Monkey Hold',
      'Bâton du prêtre · Frappe finale|Priest Staff · Final Strike',
    ],
    speed: 0.96,
    power: 0.98,
    reach: 3,
    combos: [
      ['standingLight', 'standingHeavy', 'neutralSpecial'],
      ['lowLight', 'forwardHeavy', 'downSpecial'],
      ['airLight', 'airHeavy', 'backSpecial'],
    ],
  },
  {
    fighterId: 'theta',
    mechanic: [
      'Pistolet réel et fondamentaux du Nen. L / U : tir ; direction + L : variantes de visée. Son Hatsu personnel reste inconnu.',
      'Real handgun and basic Nen. L / U: fire; direction + L: aiming variants. Her personal Hatsu remains unknown.',
    ],
    finisherCondition: [
      'Hatsu personnel inconnu : aucun finisher de Nen.',
      'Personal Hatsu unknown: no Nen finisher.',
    ],
    labels: [
      'Pique à la crosse|Pistol Jab',
      'Crosse descendante|Downward Stock',
      'Coup de crosse bas|Low Pistol Strike',
      'Fauchage de garde|Guard Sweep',
      'Coup plongeant|Diving Strike',
      'Crosse aérienne|Aerial Pistol Strike',
      'Pas de tir|Shooting Step',
      'Percée de garde|Guard Thrust',
      'Retraite armée|Armed Retreat',
      'Tir de pistolet|Handgun Shot',
      'Tir ajusté|Aimed Shot',
      'Tir bas|Low Shot',
      'Tir de couverture|Covering Shot',
      'Désarmement|Disarming Throw',
      'Hatsu inconnu|Unknown Hatsu',
    ],
    speed: 0.9,
    power: 0.92,
    reach: 2.3,
    combos: [
      ['standingLight', 'forwardLight', 'neutralSpecial'],
      ['lowLight', 'forwardHeavy', 'downSpecial'],
      ['airHeavy', 'backSpecial'],
    ],
  },
  {
    fighterId: 'biscuit',
    mechanic: [
      'L révèle le corps naturel pour toute la manche, sans frappe ni coût d’aura. Cookie reste hors du duel.',
      'L reveals her natural body for the whole round, without a strike or aura cost. Cookie stays outside the duel.',
    ],
    finisherCondition: ['La vraie forme doit être active.', 'True Form must be active.'],
    labels: [
      'Direct Shingen|Shingen Straight',
      'Crochet de maître|Master Hook',
      'Poing au corps|Body Jab',
      'Balayage de pierre|Stone Sweep',
      'Paume aérienne|Aerial Palm',
      'Marteau descendant|Descending Hammer',
      'Pas du maître|Master Step',
      'Épaule véritable|True Shoulder',
      'Paume de recul|Retreating Palm',
      'Vraie forme|True Form',
      'Direct du maître|Master Straight',
      'Poing de Ko|Ko Fist',
      'Ken parfait|Perfect Ken',
      'Projection Shingen|Shingen Throw',
      'Vraie forme · Impact total|True Form · Full Impact',
    ],
    speed: 0.86,
    power: 1.1,
    reach: 0.4,
    combos: [
      ['standingLight', 'standingHeavy', 'forwardSpecial'],
      ['lowLight', 'forwardLight', 'downSpecial'],
      ['airLight', 'airHeavy'],
    ],
  },
  {
    fighterId: 'phinks',
    mechanic: [
      'Ripper Cyclotron : rotations complètes du bras droit, puis un poing chargé sans bonus général.',
      'Ripper Cyclotron: complete right-arm rotations, then one charged punch without a global bonus.',
    ],
    finisherCondition: [
      'Un tour complet permet de libérer le poing droit.',
      'One full turn allows the right punch to be released.',
    ],
    labels: [
      'Direct de météore|Meteor Straight',
      'Crochet de la Brigade|Troupe Hook',
      'Poing rasant|Low Fist',
      'Fauchage brutal|Brutal Sweep',
      'Direct volant|Flying Straight',
      'Marteau aérien|Aerial Hammer',
      'Pas du cogneur|Brawler Step',
      'Épaule blindée|Armored Shoulder',
      'Revers de garde|Guard Backfist',
      'Ripper Cyclotron|Ripper Cyclotron',
      'Tour accéléré|Accelerated Turn',
      'Foreuse basse|Low Drill',
      'Fausse rotation|False Wind-up',
      'Prise de la Brigade|Troupe Grapple',
      'Ripper Cyclotron · Libération|Ripper Cyclotron · Release',
    ],
    speed: 1.04,
    power: 1.14,
    reach: 0.8,
    combos: [
      ['standingLight', 'forwardHeavy', 'forwardSpecial'],
      ['lowLight', 'standingHeavy', 'downSpecial'],
      ['airHeavy', 'neutralSpecial'],
    ],
  },
]

export const WAVE_ONE_MOVESETS_B = SPECS.map(buildMoveset)
  .map(tuneFeitanMoveset)
  .map((moveset) => {
    if (moveset.fighterId !== 'biscuit') return moveset
    return {
      ...moveset,
      moves: moveset.moves.map((move) =>
        move.slot === 'neutralSpecial'
          ? {
              ...move,
              auraCost: 0,
              tuning: {
                ...move.tuning,
                damage: 0,
                hitstun: 0,
                blockstun: 0,
                hitstop: 0,
                knockback: 0,
                lunge: 0,
              },
            }
          : move,
      ),
    }
  })
