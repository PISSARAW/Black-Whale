import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove } from './engine'
import {
  canUseMovesetMove,
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
    WAVE_ONE_FIGHTERS.filter((id) => !['theta', 'tserriednich', 'phinks'].includes(id)).forEach(
      assertCompleteMoveset,
    )
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
    WAVE_TWO_FIGHTERS.filter((id) => id !== 'hinrigh')
      .filter((id) => !['leorio', 'mizaistom', 'illumi'].includes(id))
      .forEach(assertCompleteMoveset)
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
    WAVE_THREE_FIGHTERS.filter(
      (id) => !['bill', 'camilla', 'gel', 'basho', 'melody', 'lynch', 'zakuro'].includes(id),
    ).forEach(assertCompleteMoveset)
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
      'terebellum',
      'voconte',
    ])
    WAVE_FOUR_FIGHTERS.filter((id) => !['musse', 'longhi', 'voconte', 'padaille'].includes(id)).forEach(
      assertCompleteMoveset,
    )
  })

  it('completes the roster with Yokotani', () => {
    expect(ROSTER_FINAL_FIGHTERS).toEqual(['yokotani'])
    const moveset = movesetFor('yokotani')!
    expect(moveset.moves.filter((move) => move.category === 'special')).toHaveLength(1)
    expect(moveset.moves.some((move) => move.category === 'finisher')).toBe(false)
    expect(moveForSlot('yokotani', 'neutralSpecial')?.tuning.damage).toBe(0)
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

  it('makes Dowsing Chain Kurapika’s standard weapon', () => {
    const kurapika = movesetFor('kurapika')!
    const standardSlots = new Set([
      'standingLight',
      'standingHeavy',
      'lowLight',
      'lowHeavy',
      'airLight',
      'airHeavy',
      'forwardLight',
      'forwardHeavy',
      'backHeavy',
      'forwardSpecial',
      'throw',
    ])
    const standardMoves = kurapika.moves.filter((move) => standardSlots.has(move.slot))
    expect(standardMoves).toHaveLength(11)
    expect(standardMoves.every((move) => move.nameEn.includes('Dowsing'))).toBe(true)
  })

  it('reserves Chain Jail for active Phantom Troupe opponents', () => {
    const chainJail = moveForSlot('kurapika', 'neutralSpecial')!
    const dowsingChain = moveForSlot('kurapika', 'forwardSpecial')!
    const versus = (opponent: FighterId) => {
      const state = beginFight(createFight('kurapika', opponent))
      return { ...state, player: { ...state.player, aura: 100 } }
    }
    expect(canUseMovesetMove(versus('hisoka'), 'player', chainJail)).toBe(false)
    expect(canUseMovesetMove(versus('hisoka'), 'player', dowsingChain)).toBe(true)
    expect(canUseMovesetMove(versus('chrollo'), 'player', chainJail)).toBe(true)
    expect(canUseMovesetMove(versus('illumi'), 'player', chainJail)).toBe(true)
  })

  it.each(WAVE_ONE_FIGHTERS.filter((id) => !['theta', 'tserriednich', 'phinks'].includes(id)))(
    '%s finisher is locked behind its unique condition',
    (fighterId) => {
      const base = beginFight(createFight(fighterId, opponentFor(fighterId)))
      const supplied = withFinisherCondition({
        ...base,
        player: { ...base.player, aura: 100 },
      })
      expect(finisherReady(base, 'player')).toBe(false)
      expect(finisherReady(supplied, 'player')).toBe(true)
      const armed = performMove({ state: supplied, side: 'player', action: 'finisher' })
      expect(armed.player.attack?.moveId).toBe(`${fighterId}:finisher`)
      expect(armed.player.aura).toBe(100 - moveForSlot(fighterId, 'finisher')!.auraCost)
    },
  )

  it.each(
    WAVE_TWO_FIGHTERS.filter((id) => id !== 'hinrigh').filter((id) => id !== 'bonolenov')
      .filter((id) => id !== 'hinrigh')
      .filter((id) => !['leorio', 'mizaistom', 'illumi'].includes(id) && id !== 'franklin'),
  )('%s wave-two finisher is conditionally locked', (fighterId) => {
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

  it.each(
    WAVE_THREE_FIGHTERS.filter(
      (id) => !['bill', 'camilla', 'gel', 'basho', 'melody', 'lynch', 'zakuro'].includes(id),
    ),
  )('%s wave-three finisher is conditionally locked', (fighterId) => {
    const base = beginFight(createFight(fighterId, opponentFor(fighterId)))
    const supplied = withFinisherCondition({
      ...base,
      player: { ...base.player, aura: 100 },
    })
    expect(finisherReady(base, 'player')).toBe(false)
    expect(finisherReady(supplied, 'player')).toBe(true)
    const executed = performMove({ state: supplied, side: 'player', action: 'finisher' })
    if (fighterId === 'rihan') {
      expect(executed.player.predator?.hunt?.preyId).toBe('bungee-gum')
      expect(executed.player.attack).toBeNull()
    } else expect(executed.player.attack?.moveId).toBe(`${fighterId}:finisher`)
  })

  it.each(WAVE_FOUR_FIGHTERS.filter((id) => !['musse', 'longhi', 'voconte', 'padaille'].includes(id)))(
    '%s wave-four finisher is conditionally locked',
    (fighterId) => {
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
    },
  )

  it('does not invent a damaging finisher for Yokotani', () => {
    const state = beginFight(createFight('yokotani', 'hisoka'))
    expect(finisherReady(state, 'player')).toBe(false)
    expect(performMove({ state, side: 'player', action: 'finisher' })).toBe(state)
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
      return {
        ...state,
        player: { ...player, kurapika: { ...player.kurapika!, emperorTime: true } },
      }
    case 'hisoka':
      return {
        ...state,
        bungeeGum: { owner: 'player', target: 'opponent', hidden: false, retracting: false },
      }
    case 'chrollo':
      return {
        ...state,
        player: {
          ...player,
          chrolloBook: { ...player.chrolloBook!, open: false, bookmark: 'sun-and-moon' },
        },
      }
    case 'benjamin':
      return {
        ...state,
        player: {
          ...player,
          hatsuEffects: {
            ...player.hatsuEffects,
            baton: {
              ...player.hatsuEffects.baton!,
              card: {
                id: 1,
                owner: 'opponent',
                fighterId: 'franklin',
                x: 50,
                y: 6.1,
                velocityX: -70,
                width: 0.6,
                height: 0.24,
                damage: 11,
                hitstun: 13,
                blockstun: 9,
                hitstop: 5,
                knockback: 2.2,
                targetZone: 'torso',
                shape: 'bullet',
                colour: '#ffffff',
                age: 0,
                lifetime: 120,
                matter: 'nen',
              },
            },
          },
        },
      }
    case 'feitan':
      return {
        ...state,
        player: {
          ...player,
          health: 70,
          hatsuEffects: {
            ...player.hatsuEffects,
            painPacker: { injuries: 0, packedDamage: 30, armour: true, sun: null },
          },
        },
      }
    case 'saiyu':
      return withOpponentEffect(state, 'senseSeals', 3)
    case 'biscuit':
      return { ...state, player: { ...player, biscuitTrueForm: true } }
    case 'franklin':
      return { ...state, opponent: { ...opponent, health: 40 } }
    case 'machi':
      return {
        ...state,
        player: { ...player, x: opponent.x - 6 },
        opponent: {
          ...opponent,
          machiThread: { owner: 'player', kind: 'bind', x: opponent.x, y: opponent.y },
        },
      }
    case 'kalluto':
      return withOpponentEffect(state, 'serpentMarks', 2)
    case 'shizuku':
      return { ...state, opponent: { ...opponent, openWounds: 1, x: player.x + 12, y: 0 } }
    case 'mizaistom':
      return withOpponentEffect(state, 'restrainedFrames', 60)
    case 'hanzo':
      return {
        ...state,
        player: {
          ...player,
          hanzoProjection: {
            bodyX: player.x,
            bodyFacing: player.facing,
            bodyNen: player.nen,
            startupFrames: 0,
          },
        },
      }
    case 'rihan':
      return {
        ...state,
        bungeeGum: { owner: 'opponent', target: 'player', hidden: false, retracting: false },
        player: {
          ...player,
          predator: {
            watching: true,
            known: ['bungee-gum'],
            hunt: null,
            sealFrames: 0,
            successes: 0,
            analysis: { owner: 'opponent', preyId: 'bungee-gum', observedFrames: 180 },
          },
        },
      }
    case 'melody':
      return withOpponentEffect(state, 'entrancedFrames', 60)
    case 'camilla':
      return { ...state, player: { ...player, health: 30 } }
    case 'halkenburg':
      return withOpponentEffect(state, 'possessedFrames', 60)
    case 'luini':
      return withPlayerEffect(state, 'teleportDodges', 1)
    case 'furykov':
      return { ...state, player: { ...player, comboHits: 3 } }
    case 'cluck':
      return { ...state, opponent: { ...opponent, health: 40 } }
    case 'beyond':
      return { ...state, player: { ...player, health: 40 } }
    case 'sayird':
      return { ...state, player: { ...player, comboHits: 2 } }
    case 'terebellum':
      return { ...state, player: { ...player, x: 46 }, opponent: { ...opponent, x: 51 } }
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
