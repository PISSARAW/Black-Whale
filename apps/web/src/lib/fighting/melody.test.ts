import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAttack, performMove, tickFight } from './engine'
import { FIXED_STEP } from './fightClock'
import { activeHitbox } from './frameData'
import { hatsuFor } from './hatsu'
import { moveForSlot, movesetFor, finisherReady } from './movesets'
import { MELODY_STARTUP } from './melodyRules'
import { EMPTY_INPUT, type FightState, type FightSide, type FightInput } from './types'

function ready(side: FightSide = 'player'): FightState {
  const base = beginFight(
    createFight(
      side === 'player' ? 'melody' : 'hisoka',
      side === 'opponent' ? 'melody' : 'hisoka',
      { mode: 'versus-local', formatId: 'knockout' },
    ),
  )
  return {
    ...base,
    player: { ...base.player, x: 44, aura: 100 },
    opponent: { ...base.opponent, x: 54, aura: 100 },
  }
}
function frames(
  state: FightState,
  count: number,
  input = EMPTY_INPUT,
  opponentInput = EMPTY_INPUT,
): FightState {
  for (let i = 0; i < count; i++) state = tickFight(state, input, { dt: FIXED_STEP, opponentInput })
  return state
}
const play = (state: FightState, side: FightSide = 'player') =>
  performAttack(state, side, 'special')

describe('Melody’s continuous music', () => {
  it.each<FightSide>(['player', 'opponent'])(
    'prepares, then continuously pacifies an audible listener with no attack or damage (%s)',
    (side) => {
      const state = ready(side)
      const listener = side === 'player' ? 'opponent' : 'player'
      const armed = play(state, side)
      expect(armed[side].attack).toBeNull()
      expect(armed[side].aura).toBe(92)
      expect(armed[side].x).toBe(state[side].x)
      expect(frames(armed, MELODY_STARTUP - 1)[listener].hatsuEffects.entrancedFrames).toBe(0)
      const singing = frames(armed, MELODY_STARTUP + 120)
      expect(singing[side].melodyPerformance?.playingFrames).toBe(120)
      expect(singing[listener].hatsuEffects.entrancedFrames).toBe(1)
      expect(singing[listener].hitStun).toBe(0)
      expect(singing[listener].health).toBe(state[listener].health)
      expect(singing[side].aura).toBeLessThan(92)
      expect(singing.score).toEqual(state.score)
      expect(singing.impact).toBeNull()
      expect(activeHitbox(singing[side])).toBeNull()
      expect(performAttack(singing, listener, 'light')).toBe(singing)
    },
  )

  it('stops with L, even without aura, releasing the listener immediately', () => {
    const singing = frames(play(ready()), 30)
    const empty = { ...singing, player: { ...singing.player, aura: 0 } }
    const stopped = play(empty)
    expect(stopped.player.melodyPerformance).toBeUndefined()
    expect(stopped.opponent.hatsuEffects.entrancedFrames).toBe(0)
    expect(stopped.player.aura).toBe(0)
  })

  it.each<Partial<FightInput>>([
    { left: true },
    { right: true },
    { jump: true },
    { down: true },
    { guard: true },
    { coverEars: true },
  ])('interrupts the breath with input %j', (partial) => {
    const singing = frames(play(ready()), 30)
    const stopped = frames(singing, 1, { ...EMPTY_INPUT, ...partial })
    expect(stopped.player.melodyPerformance).toBeUndefined()
    expect(stopped.opponent.hatsuEffects.entrancedFrames).toBe(0)
  })

  it('lets ordinary guard hear music, but ear covering trades guard and attacks for freedom', () => {
    const singing = frames(play(ready()), 30, EMPTY_INPUT, { ...EMPTY_INPUT, guard: true })
    expect(singing.opponent.hatsuEffects.entrancedFrames).toBe(1)
    const covered = frames(singing, 1, EMPTY_INPUT, {
      ...EMPTY_INPUT,
      coverEars: true,
      guard: true,
    })
    expect(covered.opponent.hatsuEffects.entrancedFrames).toBe(0)
    expect(covered.opponent.blocking).toBe(false)
    expect(performAttack(covered, 'opponent', 'light')).toBe(covered)
    expect(frames(covered, 1).opponent.hatsuEffects.entrancedFrames).toBe(1)
  })

  it('affects hearing and range, including entry and exit after the music has started', () => {
    const singing = frames(play(ready()), 30)
    const outside = frames({ ...singing, opponent: { ...singing.opponent, x: 90 } }, 1)
    expect(outside.opponent.hatsuEffects.entrancedFrames).toBe(0)
    const entered = frames({ ...outside, opponent: { ...outside.opponent, x: 54 } }, 1)
    expect(entered.opponent.hatsuEffects.entrancedFrames).toBe(1)
    const deaf = frames(
      {
        ...entered,
        opponent: {
          ...entered.opponent,
          hatsuEffects: { ...entered.opponent.hatsuEffects, senseSeals: 2 },
        },
      },
      1,
    )
    expect(deaf.opponent.hatsuEffects.entrancedFrames).toBe(0)
    const blind = frames(
      {
        ...deaf,
        opponent: {
          ...deaf.opponent,
          hatsuEffects: { ...deaf.opponent.hatsuEffects, senseSeals: 1 },
        },
      },
      1,
    )
    expect(blind.opponent.hatsuEffects.entrancedFrames).toBe(1)
  })

  it('an already travelling projectile interrupts the performer and releases the listener without delay', () => {
    const base = ready()
    const state = { ...base, opponent: { ...base.opponent, x: 90 } }
    const singing = frames(play(state), 25)
    const fired = performAttack(singing, 'opponent', 'ranged')
    const hit = frames(fired, 80)
    expect(hit.player.health).toBeLessThan(base.player.health)
    expect(hit.player.melodyPerformance).toBeUndefined()
    expect(hit.opponent.hatsuEffects.entrancedFrames).toBe(0)
  })

  it('ends on aura exhaustion, instrument loss and forced Zetsu', () => {
    const singing = frames(play(ready()), 30)
    for (const changed of [
      { ...singing.player, aura: 0, auraExhausted: true },
      { ...singing.player, melodyFlute: false },
      {
        ...singing.player,
        hatsuEffects: { ...singing.player.hatsuEffects, forcedZetsuFrames: 60 },
      },
    ]) {
      const stopped = frames({ ...singing, player: changed }, 1)
      expect(stopped.player.melodyPerformance).toBeUndefined()
      expect(stopped.opponent.hatsuEffects.entrancedFrames).toBe(0)
    }
  })

  it('rejects singing in the air, without a flute, without Nen or while stunned', () => {
    const state = ready()
    for (const changed of [
      { ...state.player, y: 3 },
      { ...state.player, melodyFlute: false },
      { ...state.player, hitStun: 5 },
      { ...state.player, aura: 7 },
      { ...state.player, nen: { ...state.player.nen, mode: 'zetsu' as const } },
      { ...state.player, hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1 } },
    ]) {
      const invalid = { ...state, player: changed }
      expect(play(invalid)).toBe(invalid)
    }
  })

  it('uses a single Hatsu, no offensive finisher and no impact-based stun', () => {
    const state = ready()
    expect(movesetFor('melody')?.moves.filter((move) => move.category === 'special')).toHaveLength(
      1,
    )
    expect(moveForSlot('melody', 'finisher')).toBeNull()
    expect(finisherReady(state, 'player')).toBe(false)
    expect(
      hatsuFor('melody').onImpact({
        state,
        side: 'player',
        defenderSide: 'opponent',
        source: 'melody',
        blocked: false,
        concealed: false,
      }),
    ).toBe(state)
    for (const input of [{}, { down: true }, { right: true }, { left: true }])
      expect(
        performMove({
          state,
          side: 'player',
          action: 'special',
          input: { ...EMPTY_INPUT, ...input },
        }).player.melodyPerformance,
      ).toBeDefined()
  })

  it('resolves simultaneous performers without side priority', () => {
    const base = ready()
    const both = { ...base, opponent: { ...base.opponent, id: 'melody' as const, equipment: ['flute' as const] } }
    const singing = frames(play(play(both), 'opponent'), MELODY_STARTUP)
    expect(singing.player.melodyPerformance).toBeUndefined()
    expect(singing.opponent.melodyPerformance).toBeUndefined()
    expect(singing.player.hatsuEffects.entrancedFrames).toBe(0)
    expect(singing.opponent.hatsuEffects.entrancedFrames).toBe(0)
  })

  it('a stretched Bungee Gum link breaks the stationary performance by pulling its caster', () => {
    const singing = frames(play(ready()), 30)
    const pulled = frames(
      {
        ...singing,
        bungeeGum: { owner: 'opponent', target: 'player', hidden: false, retracting: true },
      },
      1,
    )
    expect(pulled.player.melodyPerformance).toBeUndefined()
    expect(pulled.opponent.hatsuEffects.entrancedFrames).toBe(0)
  })

  it('resets the performance and its influence between rounds', () => {
    const singing = frames(play(ready()), 30)
    const reset = nextRound({ ...singing, phase: 'finished', winner: 'player' })
    expect(reset.player.melodyPerformance).toBeUndefined()
    expect(reset.player.melodyHearing).toBeUndefined()
    expect(reset.opponent.hatsuEffects.entrancedFrames).toBe(0)
  })
})
