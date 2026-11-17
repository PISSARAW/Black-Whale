import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { exposedBlinkyWounds } from './blinky'
import { advanceGumArsenal } from './hisokaArsenal'
import { arsenalProjectilePresentation } from './retrospectivePresentation'
import { EMPTY_INPUT, type FightState } from './types'

function duel(): FightState {
  const state = beginFight(
    createFight('hisoka', 'theta', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 44, aura: 100 },
    opponent: { ...state.opponent, x: 56 },
  }
}
function frames(state: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}

describe('Hisoka’s physical defensive applications', () => {
  it('covers open wounds without restoring health or removing the wounds', () => {
    const base = duel(),
      state = { ...base, player: { ...base.player, health: 45, openWounds: 3 } }
    const sealed = performArsenalCommand(state, 'player', { action: 'gum-seal' })
    expect(sealed.player.health).toBe(45)
    expect(sealed.player.openWounds).toBe(3)
    expect(exposedBlinkyWounds(sealed.player)).toBe(0)
    expect(sealed.player.aura).toBe(90)
    const removed = performArsenalCommand(sealed, 'player', { action: 'gum-unseal' })
    expect(exposedBlinkyWounds(removed.player)).toBe(3)
    expect(removed.player.health).toBe(45)
  })
  it('loses the seals immediately under forced Zetsu', () => {
    const state = duel(),
      sealed = {
        ...state,
        player: {
          ...state.player,
          openWounds: 3,
          gumWoundSeals: 3,
          hatsuEffects: { ...state.player.hatsuEffects, forcedZetsuFrames: 1 },
        },
      }
    expect(exposedBlinkyWounds(sealed.player)).toBe(3)
    expect(advanceGumArsenal(sealed).player.gumWoundSeals).toBeUndefined()
  })
  it('intercepts a real shot during the prepared window; its force still injures the hands', () => {
    let state = performArsenalCommand(duel(), 'player', { action: 'gum-catch' })
    state = performAttack(state, 'opponent', 'ranged')
    state = frames(state, 50)
    expect(state.player.gumCatch?.projectile?.matter).toBe('object')
    expect(state.player.gumCatch?.projectile?.shape).toBe('bullet')
    expect(state.player.health).toBeLessThan(state.player.maxHealth)
    expect(state.projectiles).toHaveLength(0)
    expect(arsenalProjectilePresentation(state)).toHaveLength(1)
    const returned = performArsenalCommand(state, 'player', { action: 'gum-return' })
    expect(returned.player.gumCatch).toBeUndefined()
    expect(returned.projectiles).toHaveLength(1)
    expect(returned.projectiles[0]).toMatchObject({
      owner: 'player',
      matter: 'object',
      shape: 'bullet',
    })
    expect(returned.projectiles[0].velocityX).toBeGreaterThan(0)
    const hit = frames(returned, 40)
    expect(hit.opponent.health).toBeLessThan(state.opponent.health)
  })
  it('does not create an object to return or catch after the window has expired', () => {
    const state = duel()
    expect(performArsenalCommand(state, 'player', { action: 'gum-return' })).toBe(state)
    let late = frames(performArsenalCommand(state, 'player', { action: 'gum-catch' }), 26)
    late = frames(performAttack(late, 'opponent', 'ranged'), 45)
    expect(late.player.gumCatch?.projectile).toBeUndefined()
    expect(late.player.health).toBeLessThan(state.player.health)
  })
})
