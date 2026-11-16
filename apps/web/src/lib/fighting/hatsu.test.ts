import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import { FIGHT_HATSU_AURA_COST } from './hatsu'
import { FIGHTING_ROSTER } from './roster'
import { EMPTY_INPUT, type FightSide, type FightState, type FighterId } from './types'

function opponentFor(id: FighterId): FighterId {
  return id === 'kurapika' ? 'chrollo' : 'kurapika'
}

function inRange(state: FightState): FightState {
  return {
    ...state,
    player: { ...state.player, x: 40 },
    opponent: { ...state.opponent, x: 50 },
  }
}

function advance(state: FightState, seconds: number): FightState {
  let next = state
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.02) {
    next = tickFight(next, EMPTY_INPUT, 0.02)
  }
  return next
}

describe.each(FIGHTING_ROSTER)('$name Hatsu', ({ id }) => {
  it.each<FightSide>(['player', 'opponent'])('is usable by the %s side', (side) => {
    const player = side === 'player' ? id : opponentFor(id)
    const opponent = side === 'opponent' ? id : opponentFor(id)
    const ready = inRange(beginFight(createFight(player, opponent)))
    const auraBefore = ready[side].aura

    const armed = performAttack(ready, side, 'special')

    if (id === 'yokotani') {
      expect(armed).toBe(ready)
      const home: FightState = {
        ...ready,
        environment: {
          stageId: 'heilly-hideout', morenaPresent: true,
          unlawfulIntruders: { player: side !== 'player', opponent: side !== 'opponent' },
        },
      }
      const summoned = performAttack(home, side, 'special')
      expect(summoned.lsdf?.[side]).toBeDefined()
      expect(summoned[side].attack).toBeNull()
      expect(summoned[side].aura).toBe(auraBefore - FIGHT_HATSU_AURA_COST)
      expect(advance(summoned, 0.4).impact).toBeNull()
      return
    }

    expect(armed[side].attack?.kind).toBe('special')
    expect(armed[side].aura).toBe(auraBefore - FIGHT_HATSU_AURA_COST)
    expect(advance(armed, 0.4).impact?.attacker).toBe(side)
  })
})
