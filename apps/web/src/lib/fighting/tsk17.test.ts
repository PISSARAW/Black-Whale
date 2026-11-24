import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, tickFight } from './engine'
import { TSK17_BASE_DPS, TSK17_ZETSU_MULTIPLIER, releaseTsk17, tsk17TickDamage } from './tsk17'
import { CATS_NAME_FRAMES } from './camillaCat'
import { EMPTY_INPUT, type FightState } from './types'

const DT = 1 / 60

function duel(playerHp = 300, opponentHp = 300): FightState {
  const base = beginFight(createFight('benjamin', 'camilla'))
  return {
    ...base,
    mode: 'versus-local',
    player: { ...base.player, health: playerHp },
    opponent: { ...base.opponent, health: opponentHp },
  }
}

describe('TSK-17 biological weapon (Benjamin vs Camilla)', () => {
  it('releases TSK-17 via the Context button, poisoning both fighters and accelerating in Zetsu (x1.45)', () => {
    const start = duel()
    const afterContext = tickFight(
      start,
      { ...EMPTY_INPUT, context: true },
      { dt: DT, opponentInput: EMPTY_INPUT },
    )
    expect(afterContext.tsk17?.releasedBy).toBe('player')
    expect(afterContext.player.tskPoisoned).toBe(true)
    expect(afterContext.opponent.tskPoisoned).toBe(true)

    const tenTick = tsk17TickDamage(afterContext.player)
    const zetsuTick = tsk17TickDamage({
      ...afterContext.player,
      nen: { ...afterContext.player.nen, mode: 'zetsu' },
    })
    expect(tenTick).toBeCloseTo(TSK17_BASE_DPS / 60)
    expect(zetsuTick).toBeCloseTo((TSK17_BASE_DPS * TSK17_ZETSU_MULTIPLIER) / 60)
  })

  it('awards victory to Benjamin if Benjamin reaches 0 HP first (Cat’s Name fails without a living target)', () => {
    const poisoned = releaseTsk17(duel(0.05, 50), 'player')
    const resolved = tickFight(poisoned, EMPTY_INPUT, { dt: DT, opponentInput: EMPTY_INPUT })
    expect(resolved.catsName).toBeUndefined()
    expect(resolved.phase).toBe('finished')
    expect(resolved.winner).toBe('player')
    expect(resolved.player.health).toBe(0)
  })

  it('triggers Cat’s Name if Camilla reaches 0 HP first and persists tskPoisoned into Round 2', () => {
    const poisoned = releaseTsk17(duel(50, 0.05), 'player')
    let state = tickFight(poisoned, EMPTY_INPUT, { dt: DT, opponentInput: EMPTY_INPUT })
    expect(state.catsName).toBeDefined()
    expect(state.catsName?.victimSide).toBe('opponent')
    expect(state.catsName?.killerSide).toBe('player')

    for (let i = 0; i < CATS_NAME_FRAMES; i++) {
      state = tickFight(state, EMPTY_INPUT, { dt: DT, opponentInput: EMPTY_INPUT })
    }
    expect(state.phase).toBe('finished')
    expect(state.winner).toBe('opponent')
    expect(state.opponent.tskPoisoned).toBe(true)

    const round2 = nextRound(state)
    expect(round2.roundNumber).toBe(2)
    expect(round2.opponent.tskPoisoned).toBe(true)
    expect(round2.player.tskPoisoned).toBeUndefined()
    expect(round2.tsk17).toBeUndefined()
  })

  it('awards victory to Benjamin on same-frame simultaneous 0 HP', () => {
    const poisoned = releaseTsk17(duel(0.05, 0.05), 'player')
    const resolved = tickFight(poisoned, EMPTY_INPUT, { dt: DT, opponentInput: EMPTY_INPUT })
    expect(resolved.catsName).toBeUndefined()
    expect(resolved.phase).toBe('finished')
    expect(resolved.winner).toBe('player')
  })

  it('lets Benjamin overtake Camilla in the death race by activating On alongside TSK-17', () => {
    const start = releaseTsk17(duel(12, 10), 'player')
    const withOn = {
      ...start,
      player: { ...start.player, on: { grudge: 80, sealFrames: 0 } },
    }
    let state: FightState = withOn
    for (let frame = 0; frame < 150 && state.phase === 'fighting' && !state.catsName; frame++) {
      state = tickFight(
        state,
        { ...EMPTY_INPUT, aura: true, hatsu: frame === 0 },
        { dt: DT, opponentInput: EMPTY_INPUT },
      )
    }
    expect(state.phase).toBe('finished')
    expect(state.winner).toBe('player')
    expect(state.catsName).toBeUndefined()
  })
})
