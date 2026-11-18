import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  performMove,
  tickFight,
  nextRound,
  performAuraAttack,
} from './engine'
import { performArsenalAction } from './arsenalExecution'
import { ILLUMI_UNPINNED_FRAMES } from './illumiDisguise'
import { reconcileIllumiFaces } from './illumiDisguiseClock'
import { EMPTY_INPUT, type FightState, type FightSide } from './types'
import { privatePvpState } from './pvp/view'
import { beginCatsName } from './camillaCat'

function ready(side: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight(
      side === 'player' ? 'illumi' : 'hisoka',
      side === 'opponent' ? 'illumi' : 'hisoka',
      {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: { needleStock: { player: false, opponent: false } },
      },
    ),
  )
  return { ...state, [side]: { ...state[side], aura: 100 } }
}
function frames(state: FightState, count = 35): FightState {
  for (let frame = 0; frame < count; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function select(state: FightState, side: FightSide = 'player'): FightState {
  return performArsenalAction(
    { state, side, command: { action: 'illumi-face-mode', target: 'unpinned-hisoka' } },
    performAuraAttack,
  )
}
function disguise(state: FightState, side: FightSide = 'player'): FightState {
  return performMove({
    state,
    side,
    action: 'special',
    input: { ...EMPTY_INPUT, [side === 'player' ? 'left' : 'right']: true },
  })
}

describe('Illumi’s attested face alteration with and without physical needles', () => {
  it.each<FightSide>(['player', 'opponent'])(
    'prepares Hisoka’s face without needles, powers, clothes or combat bonuses for %s',
    (side) => {
      const state = ready(side)
      expect(disguise(state, side)).toBe(state)
      const selected = select(state, side)
      expect(selected[side].illumiDisguisePlan).toBe('unpinned-hisoka')
      const started = disguise(selected, side)
      expect(started[side].illumi?.preparation).toBe(30)
      expect(started[side].illumi?.disguised).toBe(false)
      expect(started[side].attack).toBeNull()
      expect(started[side].aura).toBe(80)
      const altered = frames(started)
      expect(altered[side].illumi).toMatchObject({
        disguiseMode: 'unpinned-hisoka',
        disguised: true,
        disguiseOrigin: { source: 'personal' },
      })
      expect(altered[side].illumi!.disguiseExpiresAt! - 30).toBe(ILLUMI_UNPINNED_FRAMES)
      expect(altered[side].id).toBe('illumi')
      expect(altered[side].maxHealth).toBe(state[side].maxHealth)
      expect(altered[side].equipment).toEqual(state[side].equipment)
      expect(altered.bungeeGum).toBeNull()
    },
  )
  it('expires by actual elapsed frames, including frozen combat, without regranting the model’s arsenal', () => {
    const state = frames(disguise(select(ready())))
    const expiresAt = state.player.illumi!.disguiseExpiresAt!
    expect(reconcileIllumiFaces({ ...state, frame: expiresAt - 1 }).player.illumi?.disguised).toBe(
      true,
    )
    const expired = frames({ ...state, frame: expiresAt - 1, hitstop: 10 }, 1)
    expect(expired.player.illumi?.disguised).toBe(false)
    expect(expired.player.id).toBe('illumi')
    expect(expired.player.health).toBe(state.player.health)
  })
  it('carries a completed physical disguise and its remaining duration across a round', () => {
    const state = frames(disguise(select(ready())))
    const next = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(next.player.illumi?.disguised).toBe(true)
    expect(next.player.illumi!.disguiseExpiresAt).toBe(
      state.player.illumi!.disguiseExpiresAt! - state.frame,
    )
  })
  it('expires at its elapsed deadline while Cat’s Name freezes ordinary combat actions', () => {
    let state = frames(disguise(select(ready())))
    state = {
      ...state,
      frame: state.player.illumi!.disguiseExpiresAt! - 1,
      opponent: { ...state.opponent, id: 'camilla', health: 0 },
    }
    state = beginCatsName(state, 'opponent', 'player')
    expect(state.catsName).toBeTruthy()
    state = frames(state, 1)
    expect(state.catsName?.frame).toBe(1)
    expect(state.player.illumi?.disguised).toBe(false)
  })
  it('conceals the next choice, exact deadline and acquisition from the opposing client', () => {
    const state = frames(disguise(select(ready())))
    const enemy = privatePvpState(state, 'opponent').opponent
    expect(enemy.illumi?.disguised).toBe(true)
    expect(enemy.illumi?.disguiseMode).toBe('unpinned-hisoka')
    expect(enemy.illumiDisguisePlan).toBeUndefined()
    expect(enemy.illumi?.disguiseExpiresAt).toBeUndefined()
    expect(enemy.illumi?.disguiseOrigin).toBeUndefined()
  })
  it('witnesses the actual Illumi technique on manifestation and does not misidentify it as Hisoka’s Hatsu', () => {
    const prepared = disguise(select(ready()))
    expect(frames(prepared, 29).opponent.hatsuEffects.witnessedHatsu).toBeNull()
    const observed = frames(prepared, 30)
    expect(observed.opponent.hatsuEffects.witnessedHatsu).toBe('illumi')
    expect(observed.opponent.hatsuEffects.witnessedMoveId).toBe('illumi:backSpecial')
    const blind = {
      ...prepared,
      opponent: {
        ...prepared.opponent,
        hatsuEffects: { ...prepared.opponent.hatsuEffects, senseSeals: 1 },
      },
    }
    expect(frames(blind).opponent.hatsuEffects.witnessedHatsu).toBeNull()
  })
})
