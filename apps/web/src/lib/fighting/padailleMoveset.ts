import { buildMoveset } from './movesetFactory'
import type { FighterMoveset, MoveTuning } from './movesetTypes'

const TOOL_TUNING: Record<string, Partial<MoveTuning>> = {
  neutralSpecial: {
    startup: 18,
    active: 4,
    recovery: 24,
    damage: 18,
    reach: 10,
    hitstun: 22,
    knockback: 4,
  },
  forwardSpecial: {
    startup: 12,
    active: 5,
    recovery: 20,
    damage: 14,
    reach: 12,
    hitstun: 18,
    knockback: 2,
  },
  downSpecial: {
    startup: 22,
    active: 4,
    recovery: 25,
    damage: 20,
    reach: 11,
    hitstun: 24,
    knockback: 3,
  },
  backSpecial: {
    startup: 8,
    active: 1,
    recovery: 9,
    damage: 0,
    reach: 0,
    hitstun: 0,
    knockback: 0,
    blockstun: 0,
    hitstop: 0,
  },
}

export function padailleMoveset(): FighterMoveset {
  const base = buildMoveset({
    fighterId: 'padaille',
    mechanic: [
      'Main droite : L marteau, avant + L foret, bas + L hache ; arrière + L reprend la main normale. Trois transformations choisies, sans hasard, bonus général ou arme ultime. Les frappes restent physiques : garde, distance et interruption comptent. Coûts et timings adaptés au duel.',
      'Right hand: L hammer, forward + L drill, down + L axe; back + L restores the normal hand. Three chosen transformations, without randomness, global buffs or an ultimate weapon. Physical strikes respect guard, distance and interruption. Costs and timings are duel tuning.',
    ],
    finisherCondition: ['', ''],
    labels: [
      'Direct gauche|Left Straight',
      'Coup de coude|Elbow Strike',
      'Coup au corps|Body Blow',
      'Balayage|Sweep',
      'Direct aérien|Air Straight',
      'Coup de pied descendant|Descending Kick',
      'Direct en avançant|Advancing Straight',
      'Coup d’épaule|Shoulder Strike',
      'Revers|Backfist',
      'Marteau · Main droite|Hammer · Right Hand',
      'Foret · Main droite|Drill · Right Hand',
      'Hache · Main droite|Axe · Right Hand',
      'Reprendre la main droite|Restore Right Hand',
      'Projection|Throw',
      'I’m Coming to Get You|I’m Coming to Get You',
    ],
    speed: 0.96,
    power: 1.12,
    reach: 1.8,
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
      .map((move) => {
        if (move.category !== 'special') return move
        return {
          ...move,
          variant: 'standing',
          guard: 'mid',
          auraCost: move.slot === 'backSpecial' ? 0 : 20,
          cancelInto: [],
          canon: {
            source: 'Hunter × Hunter, chapter 391 — Padaille versus Hinrigh',
            evidence: 'gameplay-abstraction',
            conditions: [
              'Transform the right hand into the selected hammer, drill or axe; reach the target physically.',
            ],
            prohibitions: [
              'No random selection, general damage buff, leg weapon, cannon, shield, armour, underground attack or ultimate execution.',
            ],
            narrativeCost:
              'Startup, aura costs, ranges and damage are duel tuning. The right hand remains part of his body.',
            narrativeEffect:
              'Hammer impact, drilling thrust or axe swing. No guaranteed impalement, dismemberment or guard bypass.',
          },
          tuning: {
            ...move.tuning,
            ...TOOL_TUNING[move.slot],
            lunge: 0,
            bottom: 3,
            top: 10,
            targetZone: 'torso',
            auraZone: 'hands',
          },
        }
      }),
  }
}
