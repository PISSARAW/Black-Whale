import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove } from './engine'
import {
  finisherReady,
  moveForAction,
  moveForSlot,
  movesetFor,
  ROSTER_FINAL_FIGHTERS,
  WAVE_FOUR_FIGHTERS,
  WAVE_ONE_FIGHTERS,
  WAVE_THREE_FIGHTERS,
  WAVE_TWO_FIGHTERS,
} from './movesets'
import { EMPTY_INPUT, type FighterId, type FightState } from './types'

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
    WAVE_ONE_FIGHTERS.forEach(assertCompleteMoveset)
  })

  it('gives the second wave ten equally complete movesets', () => {
    expect(WAVE_TWO_FIGHTERS).toEqual([
      'franklin',
      'machi',
      'illumi',
      'kalluto',
      'bonolenov',
      'shizuku',
      'hinrigh',
      'mizaistom',
      'leorio',
      'hanzo',
    ])
    WAVE_TWO_FIGHTERS.forEach(assertCompleteMoveset)
  })

  it('gives the third wave ten equally complete movesets', () => {
    expect(WAVE_THREE_FIGHTERS).toEqual([
      'rihan',
      'zakuro',
      'melody',
      'basho',
      'camilla',
      'halkenburg',
      'gel',
      'lynch',
      'luini',
      'bill',
    ])
    WAVE_THREE_FIGHTERS.forEach(assertCompleteMoveset)
  })

  it('gives the fourth wave ten equally complete movesets', () => {
    expect(WAVE_FOUR_FIGHTERS).toEqual([
      'furykov',
      'cluck',
      'beyond',
      'longhi',
      'musse',
      'padaille',
      'sayird',
      'silentmajority',
      'terebellum',
      'voconte',
    ])
    WAVE_FOUR_FIGHTERS.forEach(assertCompleteMoveset)
  })

  it('completes the roster with Yokotani', () => {
    expect(ROSTER_FINAL_FIGHTERS).toEqual(['yokotani'])
    ROSTER_FINAL_FIGHTERS.forEach(assertCompleteMoveset)
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

  it.each(WAVE_TWO_FIGHTERS)('%s wave-two finisher is conditionally locked', (fighterId) => {
    const base = beginFight(createFight(fighterId, opponentFor(fighterId)))
    const supplied = withFinisherCondition({
      ...base,
      player: { ...base.player, aura: 100 },
    })
    expect(finisherReady(base, 'player')).toBe(false)
    expect(finisherReady(supplied, 'player')).toBe(true)
    expect(
      performMove({ state: supplied, side: 'player', action: 'finisher' }).player.attack?.moveId,
    ).toBe(`${fighterId}:finisher`)
  })

  it.each(WAVE_THREE_FIGHTERS)('%s wave-three finisher is conditionally locked', (fighterId) => {
    const base = beginFight(createFight(fighterId, opponentFor(fighterId)))
    const supplied = withFinisherCondition({
      ...base,
      player: { ...base.player, aura: 100 },
    })
    expect(finisherReady(base, 'player')).toBe(false)
    expect(finisherReady(supplied, 'player')).toBe(true)
    expect(
      performMove({ state: supplied, side: 'player', action: 'finisher' }).player.attack?.moveId,
    ).toBe(`${fighterId}:finisher`)
  })

  it.each(WAVE_FOUR_FIGHTERS)('%s wave-four finisher is conditionally locked', (fighterId) => {
    const base = beginFight(createFight(fighterId, opponentFor(fighterId)))
    const supplied = withFinisherCondition({
      ...base,
      player: { ...base.player, aura: 100 },
    })
    expect(finisherReady(base, 'player')).toBe(false)
    expect(finisherReady(supplied, 'player')).toBe(true)
    expect(
      performMove({ state: supplied, side: 'player', action: 'finisher' }).player.attack?.moveId,
    ).toBe(`${fighterId}:finisher`)
  })

  it.each(ROSTER_FINAL_FIGHTERS)('%s final finisher is conditionally locked', (fighterId) => {
    const base = beginFight(createFight(fighterId, opponentFor(fighterId)))
    const supplied = withFinisherCondition({
      ...base,
      player: { ...base.player, aura: 100 },
    })
    expect(finisherReady(base, 'player')).toBe(false)
    expect(finisherReady(supplied, 'player')).toBe(true)
    expect(
      performMove({ state: supplied, side: 'player', action: 'finisher' }).player.attack?.moveId,
    ).toBe(`${fighterId}:finisher`)
  })
})

function assertCompleteMoveset(fighterId: FighterId): void {
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
    case 'franklin':
      return { ...state, opponent: { ...opponent, health: 40 } }
    case 'machi':
      return withOpponentEffect(state, 'stitchedFrames', 60)
    case 'illumi':
      return withOpponentEffect(state, 'needleFrames', 60)
    case 'kalluto':
      return withOpponentEffect(state, 'serpentMarks', 2)
    case 'bonolenov':
      return withPlayerEffect(state, 'cantabileFrames', 120)
    case 'shizuku':
      return { ...state, opponent: { ...opponent, health: 50 } }
    case 'hinrigh':
      return withPlayerEffect(state, 'biohazardFrames', 60)
    case 'mizaistom':
      return withOpponentEffect(state, 'restrainedFrames', 60)
    case 'leorio':
      return { ...state, player: { ...player, health: 45 } }
    case 'hanzo':
      return withPlayerEffect(state, 'cloneDodges', 1)
    case 'rihan':
      return withOpponentEffect(
        withPlayerEffect(state, 'predatorFrames', 60),
        'forcedZetsuFrames',
        60,
      )
    case 'zakuro':
      return withOpponentEffect(state, 'bloodBoundFrames', 60)
    case 'melody':
      return withOpponentEffect(state, 'entrancedFrames', 60)
    case 'basho':
      return withPlayerEffect(state, 'haikuFrames', 60)
    case 'camilla':
      return withPlayerEffect({ ...state, player: { ...player, health: 30 } }, 'catCounters', 1)
    case 'halkenburg':
      return withOpponentEffect(state, 'forcedZetsuFrames', 60)
    case 'gel':
      return withOpponentEffect(state, 'venomFrames', 60)
    case 'lynch':
      return withOpponentEffect(state, 'soulExposedFrames', 60)
    case 'luini':
      return withPlayerEffect(state, 'teleportDodges', 1)
    case 'bill':
      return withPlayerEffect({ ...state, player: { ...player, health: 50 } }, 'growthFrames', 60)
    case 'furykov':
      return withPlayerEffect(
        { ...state, player: { ...player, comboHits: 3 } },
        'comboFocusFrames',
        60,
      )
    case 'cluck':
      return withPlayerEffect(state, 'birdFrames', 60)
    case 'beyond':
      return withOpponentEffect({ ...state, player: { ...player, health: 40 } }, 'curseFrames', 60)
    case 'longhi':
      return withOpponentEffect(state, 'contractFrames', 60)
    case 'musse':
      return withPlayerEffect(state, 'secretWindowDodges', 1)
    case 'padaille':
      return withPlayerEffect(state, 'weaponFrames', 60)
    case 'sayird':
      return withPlayerEffect(state, 'littleEyeDodges', 1)
    case 'silentmajority':
      return withOpponentEffect(state, 'silentMarks', 2)
    case 'terebellum':
      return withPlayerEffect(state, 'sweetHomeCharges', 1)
    case 'voconte':
      return withPlayerEffect(state, 'doorDodges', 1)
    case 'yokotani':
      return withPlayerEffect(state, 'lsdfGuards', 1)
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
