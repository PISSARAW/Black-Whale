import { ERIGERON_SUPPORT } from './billSupportTuning'
import { buildMoveset } from './movesetFactory'
import type { FighterMoveset } from './movesetTypes'

/** Ordinary physical strikes plus the attested support ability, without invented plant attacks. */
export function billMoveset(): FighterMoveset {
  const base = buildMoveset({
    fighterId: 'bill',
    mechanic: [ERIGERON_SUPPORT.mechanicFr, ERIGERON_SUPPORT.mechanicEn],
    finisherCondition: ['', ''],
    labels: [
      'Direct du garde|Guard Straight',
      'Crochet|Hook',
      'Coup au corps|Body Blow',
      'Balayage|Sweep',
      'Direct aérien|Air Straight',
      'Liane d’obstacle|Obstacle Vine',
      'Garde du berceau|Cradle Guard',
      'Paume de croissance|Growth Palm',
      'Relève du garde|Guard Relief',
      'Erigeron · Soutien|Erigeron · Support',
      'Erigeron · Soutien|Erigeron · Support',
      'Erigeron · Soutien|Erigeron · Support',
      'Erigeron · Soutien|Erigeron · Support',
      'Croissance d’urgence|Emergency Growth',
      'Erigeron · Soutien|Erigeron · Support',
    ],
    speed: 0.98,
    power: 1,
    reach: 1.4,
    combos: [
      ['standingLight', 'standingHeavy'],
      ['lowLight', 'forwardHeavy'],
      ['airLight', 'airHeavy'],
    ],
  })
  return {
    ...base,
    moves: base.moves
      .filter((move) => move.category !== 'finisher')
      .filter((move) => move.category !== 'special' || move.slot === 'neutralSpecial')
      .map((move) =>
        move.category !== 'special'
          ? move
          : {
              ...move,
              auraCost: 0,
              cancelInto: [],
              tuning: {
                ...move.tuning,
                damage: 0,
                reach: 0,
                lunge: 0,
                hitstun: 0,
                blockstun: 0,
                hitstop: 0,
                knockback: 0,
              },
            },
      ),
  }
}
