import { CROSS_GAME_COST, CROSS_GAME_DISPLAY } from './crossGameTuning'
import { buildMoveset } from './movesetFactory'
import type { FighterMoveset } from './movesetTypes'

/** Physical moves are ordinary arcade combat; only the demonstrated yellow card is playable. */
export function mizaistomMoveset(): FighterMoveset {
  const base = buildMoveset({
    fighterId: 'mizaistom',
    mechanic: [
      'L (avec ou sans direction) : carton jaune et ordre « Ne bougez plus : ni déplacement, ni nouvelle attaque. » Obéir évite toute entrave ; désobéir retourne le carton et impose une contrainte brève, sans dégâts ni silence. Le délai de réaction de 0,3 s, la portée, le coût et la durée sont adaptés au duel.',
      'L (with any direction): yellow card and order “Do not move or start another attack.” Obeying avoids restraint; disobeying flips the card and briefly confines the target, without damage or silence. The 0.3 s reaction window, range, cost and duration are duel tuning.',
    ],
    finisherCondition: ['', ''],
    labels: [
      'Direct|Straight',
      'Coup de paume|Palm Strike',
      'Coup au corps|Body Blow',
      'Balayage|Sweep',
      'Direct aérien|Air Straight',
      'Coup descendant|Descending Strike',
      'Direct en avançant|Advancing Straight',
      'Coup d’épaule|Shoulder Strike',
      'Revers|Backfist',
      'Cross Game · Carton jaune|Cross Game · Yellow Card',
      'Cross Game|Cross Game',
      'Cross Game|Cross Game',
      'Cross Game|Cross Game',
      'Projection|Throw',
      'Cross Game|Cross Game',
    ],
    speed: 1,
    power: 1.04,
    reach: 1.2,
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
              input: 'L · carton jaune / yellow card',
              auraCost: CROSS_GAME_COST,
              cancelInto: [],
              canon: {
                source: 'Manga — Cross Game, yellow card',
                evidence: 'manga-shown',
                conditions: [
                  'Show the yellow card and issue a warning. Restrain only if the order is ignored.',
                ],
                prohibitions: [
                  'No restraint on hit, direct damage, silence, offensive zone or invented verdict.',
                ],
                narrativeCost:
                  'A warning before restraint. Range, order, recovery and duration are duel adaptations.',
                narrativeEffect:
                  'The reversed yellow card confines a disobedient target in a rectangular enclosure; speech remains possible.',
              },
              tuning: {
                ...move.tuning,
                startup: CROSS_GAME_DISPLAY,
                active: 1,
                recovery: 0,
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
