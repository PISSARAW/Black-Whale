import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, performMove, tickFight } from './engine'
import { activeHitbox, attackData, FIXED_STEP } from './frameData'
import { BUNGEE_REST_DISTANCE } from './hisokaTechnique'
import { hatsuFor } from './hatsu'
import { FIGHTING_ROSTER } from './roster'
import { canUseMovesetMove, moveForSlot } from './movesets'
import { EMPTY_INPUT, type FightSide, type FightState, type MoveSlot } from './types'

function ready(side: FightSide = 'player', attached = false): FightState {
  const state = beginFight(
    createFight('hisoka', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 25, aura: 100 },
    opponent: { ...state.opponent, x: 75, aura: 100 },
    bungeeGum: attached
      ? {
          owner: side,
          target: side === 'player' ? 'opponent' : 'player',
          hidden: true,
          retracting: false,
        }
      : null,
  }
}

function frames(state: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
  return state
}

function cast(state: FightState, side: FightSide, slot: MoveSlot): FightState {
  return performAuraAttack({
    state,
    side,
    kind: 'special',
    moveId: `hisoka:${slot}`,
    auraCharged: false,
  })
}

describe('Hisoka’s distinct elastic techniques', () => {
  it('loads the complete Hatsu registry', () => {
    for (const fighter of FIGHTING_ROSTER) expect(hatsuFor(fighter.id), fighter.id).toBeDefined()
  })
  it.each<FightSide>(['player', 'opponent'])(
    'only the neutral strike attaches, without automatically recalling (%s)',
    (side) => {
      const base = ready(side)
      const target = side === 'player' ? 'opponent' : 'player'
      const close = { ...base, [side]: { ...base[side], x: side === 'player' ? 65 : 35 } }
      const attached = frames(cast(close, side, 'neutralSpecial'), 30)
      expect(attached.bungeeGum).toMatchObject({ owner: side, target, retracting: false })
      const recast = cast(
        { ...attached, [side]: { ...attached[side], attack: null, aura: 100 } },
        side,
        'neutralSpecial',
      )
      expect(recast.bungeeGum?.retracting).toBe(false)
      expect(recast[target].x).toBe(attached[target].x)
    },
  )

  it.each(['forwardSpecial', 'backSpecial', 'finisher'] as const)(
    'rejects %s without an owned attachment, even through the direct API',
    (slot) => {
      const state = ready()
      const move = moveForSlot('hisoka', slot)!
      expect(canUseMovesetMove(state, 'player', move)).toBe(false)
      expect(cast(state, 'player', slot)).toBe(state)
      const foreign = ready('opponent', true)
      expect(cast(foreign, 'player', slot)).toBe(foreign)
      const stunned = { ...state, player: { ...state.player, hitStun: 5 } }
      expect(cast(stunned, 'player', slot).player.bufferedAttack).toBeNull()
    },
  )

  it.each<FightSide>(['player', 'opponent'])(
    'recall moves only the target after startup, without a hit (%s)',
    (side) => {
      const state = ready(side, true)
      const target = side === 'player' ? 'opponent' : 'player'
      const armed = cast(state, side, 'forwardSpecial')
      const startup = attackData('special', armed[side]).startup
      expect(armed[side].x).toBe(state[side].x)
      expect(frames(armed, startup - 1)[target].x).toBe(state[target].x)
      const first = frames(armed, startup)
      expect(first[target].x).not.toBe(state[target].x)
      expect(first[side].x).toBe(state[side].x)
      expect(activeHitbox(first[side])).toBeNull()
      const reeled = frames(first, 60)
      expect(Math.abs(reeled[target].x - reeled[side].x)).toBeCloseTo(BUNGEE_REST_DISTANCE)
      expect(reeled.bungeeGum).toMatchObject({ owner: side, retracting: false, hidden: true })
      expect(reeled[target].health).toBe(state[target].health)
      expect(reeled.score).toEqual(state.score)
      expect(reeled.impact).toBeNull()
    },
  )

  it.each<FightSide>(['player', 'opponent'])(
    'rebound launches Hisoka toward the attached anchor, never the target (%s)',
    (side) => {
      const state = ready(side, true)
      const target = side === 'player' ? 'opponent' : 'player'
      const armed = cast(state, side, 'backSpecial')
      const startup = attackData('special', armed[side]).startup
      expect(frames(armed, startup - 1)[side].x).toBe(state[side].x)
      const moved = frames(armed, startup + 5)
      expect(moved[side].x).not.toBe(state[side].x)
      expect(moved[target].x).toBe(state[target].x)
      expect(moved.bungeeGum).toMatchObject({ retracting: true, rebounding: true })
      expect(moved.impact).toBeNull()
      expect(moved[target].health).toBe(state[target].health)
      expect(activeHitbox(moved[side])).toBeNull()
    },
  )

  it('requires stored stretch and rechecks the link after buffered input and startup', () => {
    const state = ready('player', true)
    const slack = {
      ...state,
      opponent: { ...state.opponent, x: state.player.x + BUNGEE_REST_DISTANCE },
    }
    expect(cast(slack, 'player', 'backSpecial')).toBe(slack)
    const pending = cast(
      { ...state, player: { ...state.player, hitStun: 3 } },
      'player',
      'forwardSpecial',
    )
    expect(pending.player.bufferedAttack?.moveId).toBe('hisoka:forwardSpecial')
    const lost = frames({ ...pending, bungeeGum: null }, 10)
    expect(lost.player.attack).toBeNull()
    expect(lost.player.bufferedAttack).toBeNull()
    expect(lost.player.aura).toBeGreaterThanOrEqual(state.player.aura)
    const armed = cast(state, 'player', 'backSpecial')
    const cancelled = frames({ ...armed, bungeeGum: null }, 30)
    expect(cancelled.player.x).toBe(state.player.x)
    expect(cancelled.impact).toBeNull()
  })

  it('allows interruption and ends the aura link under forced Zetsu', () => {
    const state = ready('player', true)
    const moving = frames(cast(state, 'player', 'forwardSpecial'), 12)
    const interrupted = frames(
      { ...moving, player: { ...moving.player, hitStun: 5, attack: null } },
      1,
    )
    expect(interrupted.bungeeGum?.retracting).toBe(false)
    expect(interrupted.opponent.x).toBe(moving.opponent.x)
    const sealed = {
      ...state,
      player: {
        ...state.player,
        hatsuEffects: { ...state.player.hatsuEffects, forcedZetsuFrames: 60 },
      },
    }
    expect(cast(sealed, 'player', 'forwardSpecial')).toBe(sealed)
    expect(frames(sealed, 1).bungeeGum).toBeNull()
  })

  it('consumes the link on a landed finisher', () => {
    const state = ready('player', true)
    const finished = frames(performMove({ state, side: 'player', action: 'finisher' }), 45)
    expect(finished.impact?.attacker).toBe('player')
    expect(finished.bungeeGum).toBeNull()
  })
})
