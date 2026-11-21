import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { recordFightDeath, resolvePostMortemDeaths } from './fightDeaths'
import { privatePvpState } from './pvp/view'
import { EMPTY_INPUT, type FightState } from './types'

function duel(): FightState {
  const state = beginFight(createFight('hisoka', 'chrollo', { mode: 'versus-local' }))
  return { ...state, player: { ...state.player, x: 40, aura: 100 }, opponent: { ...state.opponent, x: 60 } }
}
function frames(state: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
  return state
}

describe('Hisoka’s gum order around the heart, in an ordinary duel', () => {
  it('reaches the heart order through the arsenal rather than the gum network family', () => {
    const ordered = performArsenalCommand(duel(), 'player', { action: 'gum-heart' })
    expect(ordered.player.gumHeartPreparation).toBe(18)
    expect(ordered.player.aura).toBe(80)
    expect(ordered.player.gumCatch).toBeUndefined()
  })

  it('arms after its vulnerable preparation on real frames, and hides it from the other player', () => {
    const armed = frames(performArsenalCommand(duel(), 'player', { action: 'gum-heart' }), 20)
    expect(armed.player.gumHeartArmed).toBe(true)
    expect(privatePvpState(armed, 'opponent').opponent.gumHeartArmed).toBeUndefined()
  })

  it('restarts the heart once at 1 HP after asphyxia, never after another death', () => {
    const armed = frames(performArsenalCommand(duel(), 'player', { action: 'gum-heart' }), 20)
    const dead = { ...armed, player: { ...armed.player, health: 0 } }
    const choked = resolvePostMortemDeaths(
      recordFightDeath(dead, { victimSide: 'player', killerSide: 'opponent', cause: 'asphyxia' }),
    )
    expect(choked.player.health).toBe(1)
    expect(choked.player.gumHeartSpent).toBe(true)
    expect(choked.deaths ?? []).toHaveLength(0)
    const struck = resolvePostMortemDeaths(
      recordFightDeath(dead, { victimSide: 'player', killerSide: 'opponent', cause: 'strike' }),
    )
    expect(struck.player.health).toBe(0)
  })
})
