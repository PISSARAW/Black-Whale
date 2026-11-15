import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove } from './engine'
import {
  finisherReady,
  moveForAction,
  moveForSlot,
  movesetFor,
  WAVE_ONE_FIGHTERS,
} from './movesets'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'

const opponentFor = (id: FighterId): FighterId => (id === 'hisoka' ? 'kurapika' : 'hisoka')

describe('wave one movesets', () => {
  it('gives ten fighters the complete requested move structure', () => {
    expect(WAVE_ONE_FIGHTERS).toEqual([
      'kurapika',
      'hisoka',
      'chrollo',
      'benjamin',
      'tserriednich',
      'feitan',
      'saiyu',
      'theta',
      'biscuit',
      'phinks',
    ])
    for (const fighterId of WAVE_ONE_FIGHTERS) {
      const moveset = movesetFor(fighterId)!
      const count = (category: (typeof moveset.moves)[number]['category']) =>
        moveset.moves.filter((move) => move.category === category).length
      expect(moveset.moves).toHaveLength(15)
      expect(count('normal')).toBe(6)
      expect(count('command')).toBe(3)
      expect(count('special')).toBe(4)
      expect(count('throw')).toBe(1)
      expect(count('finisher')).toBe(1)
      expect(moveset.combos.length).toBeGreaterThanOrEqual(3)
      expect(new Set(moveset.moves.map((move) => move.nameFr)).size).toBe(15)
    }
  })

  it('maps stance and direction to six normals, three commands and four specials', () => {
    const fighter = createFight('kurapika', 'hisoka').player
    const input = (partial: Partial<typeof EMPTY_INPUT>) => ({ ...EMPTY_INPUT, ...partial })
    expect(moveForAction(fighter, 'light', input({}))?.slot).toBe('standingLight')
    expect(moveForAction(fighter, 'heavy', input({ down: true }))?.slot).toBe('lowHeavy')
    expect(moveForAction({ ...fighter, y: 3 }, 'light', input({}))?.slot).toBe('airLight')
    expect(moveForAction(fighter, 'light', input({ right: true }))?.slot).toBe('forwardLight')
    expect(moveForAction(fighter, 'heavy', input({ left: true }))?.slot).toBe('backHeavy')
    expect(moveForAction(fighter, 'special', input({}))?.slot).toBe('neutralSpecial')
    expect(moveForAction(fighter, 'special', input({ right: true }))?.slot).toBe('forwardSpecial')
    expect(moveForAction(fighter, 'special', input({ down: true }))?.slot).toBe('downSpecial')
    expect(moveForAction(fighter, 'special', input({ left: true }))?.slot).toBe('backSpecial')
  })

  it('uses fighter-specific short cancel routes instead of a universal chain', () => {
    const kurapika = movesetFor('kurapika')!
    const hisoka = movesetFor('hisoka')!
    expect(kurapika.combos).not.toEqual(hisoka.combos)
    expect(moveForSlot('kurapika', 'standingHeavy')?.cancelInto).toEqual([
      'kurapika:forwardSpecial',
    ])
    expect(moveForSlot('kurapika', 'backHeavy')?.cancelInto).toEqual([])
    expect(kurapika.combos.every((route) => route.length <= 3)).toBe(true)
  })

  it.each(WAVE_ONE_FIGHTERS)('%s finisher is locked behind its unique condition', (fighterId) => {
    const base = beginFight(createFight(fighterId, opponentFor(fighterId)))
    const supplied = withFinisherCondition({
      ...base,
      player: { ...base.player, aura: 100 },
    })
    expect(finisherReady(base, 'player')).toBe(false)
    expect(finisherReady(supplied, 'player')).toBe(true)
    const armed = performMove({ state: supplied, side: 'player', action: 'finisher' })
    expect(armed.player.attack?.moveId).toBe(`${fighterId}:finisher`)
    expect(armed.player.aura).toBe(45)
  })
})

function withFinisherCondition(state: FightState): FightState {
  const player = state.player
  const opponent = state.opponent
  switch (player.id) {
    case 'kurapika':
    case 'theta':
      return withOpponentEffect(state, 'forcedZetsuFrames', 60)
    case 'hisoka':
      return { ...state, bungeeGum: { owner: 'player', target: 'opponent', hidden: false } }
    case 'chrollo':
      return withOpponentEffect(state, 'sunMoonMarks', 1)
    case 'benjamin':
      return withPlayerEffect(state, 'batonCharges', 3)
    case 'tserriednich':
      return withPlayerEffect(state, 'futureSight', 1)
    case 'feitan':
      return { ...state, player: { ...player, health: 35 } }
    case 'saiyu':
      return withOpponentEffect(state, 'senseSeals', 2)
    case 'biscuit':
      return withPlayerEffect(state, 'transformationFrames', 120)
    case 'phinks':
      return withPlayerEffect(state, 'cyclotronTurns', 4)
    default:
      return { ...state, player, opponent }
  }
}

function withPlayerEffect(
  state: FightState,
  key: keyof FightState['player']['hatsuEffects'],
  value: number,
): FightState {
  return {
    ...state,
    player: {
      ...state.player,
      hatsuEffects: { ...state.player.hatsuEffects, [key]: value },
    },
  }
}

function withOpponentEffect(
  state: FightState,
  key: keyof FightState['opponent']['hatsuEffects'],
  value: number,
): FightState {
  return {
    ...state,
    opponent: {
      ...state.opponent,
      hatsuEffects: { ...state.opponent.hatsuEffects, [key]: value },
    },
  }
}
