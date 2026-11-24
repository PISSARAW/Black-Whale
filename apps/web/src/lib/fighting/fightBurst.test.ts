import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, tickFight } from './engine'
import { BURST_RECOIL_FRAMES, BURST_ZETSU_FRAMES, canBurst } from './fightBurst'
import { FIXED_STEP } from './fightClock'
import { packReplayInput, unpackReplayInput } from './fightReplayInput'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'

function comboVictim(state: FightState, side: 'player' | 'opponent', aura = 80): FightState {
  return {
    ...state,
    player: { ...state.player, x: 45 },
    opponent: { ...state.opponent, x: 53 },
    [side]: {
      ...state[side],
      x: side === 'player' ? 45 : 53,
      aura,
      hitStun: 18,
      comboHits: 3,
      comboDamage: 24,
      juggleCount: 1,
      pose: 'hit',
    },
  }
}

function frame(state: FightState, input: Partial<FightInput> = {}, opponent?: Partial<FightInput>) {
  return tickFight(
    state,
    { ...EMPTY_INPUT, ...input },
    {
      dt: FIXED_STEP,
      ...(opponent && { opponentInput: { ...EMPTY_INPUT, ...opponent } }),
    },
  )
}

describe('defensive Burst', () => {
  it('breaks a suffered combo, spends half the current reserve and repels without damage', () => {
    const ready = comboVictim(beginFight(createFight('kurapika', 'hisoka')), 'player')
    const enemyHealth = ready.opponent.health
    const enemyX = ready.opponent.x

    const burst = frame(ready, { burst: true }, {})

    expect(burst.burst).toEqual({ side: 'player', frame: 0, sequence: 1 })
    expect(burst.player).toMatchObject({
      burstZetsuFrames: BURST_ZETSU_FRAMES,
      hitStun: 0,
      comboHits: 0,
      comboDamage: 0,
      juggleCount: 0,
    })
    expect(burst.burstAvailable?.player).toBe(false)
    expect(burst.player.aura).toBeCloseTo(40.1667, 3)
    expect(burst.player.nen.mode).toBe('zetsu')
    expect(burst.opponent.health).toBe(enemyHealth)
    expect(burst.opponent.x).toBeGreaterThan(enemyX)
    expect(burst.opponent.hitStun).toBeGreaterThanOrEqual(BURST_RECOIL_FRAMES - 1)
  })

  it('cannot be spent in neutral or twice in one round, then returns next round', () => {
    const neutral = beginFight(createFight('kurapika', 'hisoka'))
    expect(frame(neutral, { burst: true }, {}).burst).toBeUndefined()

    let state = frame(comboVictim(neutral, 'player'), { burst: true }, {})
    const aura = state.player.aura
    state = frame(
      {
        ...state,
        player: { ...state.player, hitStun: 10, comboHits: 2 },
      },
      { burst: true },
      {},
    )
    expect(state.burst?.sequence).toBe(1)
    expect(state.player.aura).toBeGreaterThanOrEqual(aura)
    expect(canBurst(state.player, state.burstAvailable?.player)).toBe(false)

    const reset = nextRound({ ...state, phase: 'finished', winner: 'opponent', matchWinner: null })
    expect(reset.burstAvailable?.player).toBe(true)
    expect(reset.player.burstZetsuFrames).toBe(0)
    expect(reset.burst).toBeUndefined()
  })

  it('holds Zetsu for exactly two simulation seconds, excluding the activation frame', () => {
    let state = frame(
      comboVictim(beginFight(createFight('kurapika', 'hisoka')), 'player'),
      {
        burst: true,
      },
      {},
    )
    for (let i = 0; i < BURST_ZETSU_FRAMES; i += 1) state = frame(state, {}, {})
    expect(state.player.burstZetsuFrames).toBe(0)
    expect(state.player.nen.mode).toBe('zetsu')
    state = frame(state, {}, {})
    expect(state.player.nen.mode).toBe('ten')
  })

  it('lets the deterministic AI spend its Burst on a three-hit combo', () => {
    const state = comboVictim(beginFight(createFight('kurapika', 'hisoka')), 'opponent')
    const burst = frame(state)
    expect(burst.burst?.side).toBe('opponent')
    expect(burst.burstAvailable?.opponent).toBe(false)
  })

  it('appends Burst to replay and rollback inputs without changing older bits', () => {
    const old = packReplayInput({ ...EMPTY_INPUT, left: true, aura: true })
    const packed = packReplayInput({ ...EMPTY_INPUT, left: true, aura: true, burst: true })
    expect(packed).toBeGreaterThan(old)
    expect(unpackReplayInput(old)).toMatchObject({ left: true, aura: true, burst: false })
    expect(unpackReplayInput(packed)).toMatchObject({ left: true, aura: true, burst: true })
  })
})
