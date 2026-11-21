import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, performMove, tickFight } from './engine'
import { controlledEntities } from './preparationActions'
import { arsenalOptions, performArsenalCommand } from './retrospectiveArsenal'
import type { PreparedEntity } from './preparationTypes'
import { EMPTY_INPUT, type FightState } from './types'

function scenario(): FightState {
  const state = beginFight(
    createFight('sayird', 'hisoka', {
      mode: 'versus-local',
      environment: { preparation: { mode: 'scenario', resources: ['animals'], cohorts: [] } },
    }),
  )
  return { ...state, player: { ...state.player, aura: 100 } }
}
function frames(state: FightState, count: number): FightState {
  for (let index = 0; index < count; index++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function animal(state: FightState): PreparedEntity {
  return state.battlefield!.entities.find((entry) => entry.id === 'player:animal')!
}
function captured(): FightState {
  const state = frames(performAttack(scenario(), 'player', 'special'), 8)
  expect(controlledEntities(state, 'player')).toHaveLength(1)
  return state
}
function withCover(state: FightState, x: number): FightState {
  const cover: PreparedEntity = {
    ...animal(state),
    id: 'test:cover',
    kind: 'crate',
    owner: 'neutral',
    x,
    y: 0,
    health: 40,
    animalSize: undefined,
    arena: { width: 1, height: 3 },
  }
  return {
    ...state,
    battlefield: { ...state.battlefield!, entities: [...state.battlefield!.entities, cover] },
  }
}

describe('Little Eye: the ball must reach a real animal, and Sayird stays exposed', () => {
  it('lets real cover between Sayird and the animal stop the aura ball', () => {
    const start = scenario()
    const open = { ...start, player: { ...start.player, x: 20, facing: 1 as const } }
    const covered = withCover(open, 23.5)
    const launched = frames(performAttack(covered, 'player', 'special'), 20)
    expect(launched.battlefield!.littleEyeShots).toHaveLength(0)
    expect(controlledEntities(launched, 'player')).toHaveLength(0)
    expect(animal(launched).controller).toBeUndefined()
    expect(animal(launched).health).toBe(1)
    const clear = frames(performAttack(open, 'player', 'special'), 20)
    expect(controlledEntities(clear, 'player')).toHaveLength(1)
  })

  it('lets a crouching strike kill the controlled animal, ending the control without touching Sayird', () => {
    const active = captured()
    const mouse = animal(active)
    const near: FightState = {
      ...active,
      player: { ...active.player, x: 5 },
      opponent: { ...active.opponent, x: mouse.x + 4, facing: -1 },
    }
    const swept = performMove({
      state: near,
      side: 'opponent',
      action: 'heavy',
      input: { ...EMPTY_INPUT, down: true },
    })
    expect(swept.opponent.attack?.variant).toBe('low')
    const kicked = frames(swept, 20)
    expect(animal(kicked).health).toBe(0)
    expect(controlledEntities(kicked, 'player')).toHaveLength(0)
    expect(kicked.player.health).toBe(active.player.health)
  })

  it('ignores standing strikes passing over the animal', () => {
    const active = captured()
    const mouse = animal(active)
    const near: FightState = {
      ...active,
      player: { ...active.player, x: 5 },
      opponent: { ...active.opponent, x: mouse.x + 4, facing: -1 },
    }
    const jabbed = frames(performAttack(near, 'opponent', 'light'), 20)
    expect(animal(jabbed).health).toBe(1)
    expect(controlledEntities(jabbed, 'player')).toHaveLength(1)
  })

  it('leaves Sayird’s body open to hits while it pilots the animal, without losing control', () => {
    const active = captured()
    const exposed: FightState = {
      ...active,
      player: { ...active.player, x: 10, facing: 1 },
      opponent: { ...active.opponent, x: 14, facing: -1 },
    }
    const hit = frames(performAttack(exposed, 'opponent', 'light'), 20)
    expect(hit.player.health).toBeLessThan(active.player.health)
    expect(controlledEntities(hit, 'player')).toHaveLength(1)
  })

  it('gives the animal movement and orientation orders only, never an attack', () => {
    const active = captured()
    const actions = arsenalOptions(active, 'player')
      .map((option) => option.command.action)
      .filter((action) => action.startsWith('little-eye-'))
    expect(actions.sort()).toEqual(
      [
        'little-eye-left',
        'little-eye-look-left',
        'little-eye-look-right',
        'little-eye-release',
        'little-eye-right',
        'little-eye-stay',
      ].sort(),
    )
    const close: FightState = {
      ...active,
      opponent: { ...active.opponent, x: animal(active).x + 6 },
    }
    const sent = frames(performArsenalCommand(close, 'player', { action: 'little-eye-right' }), 240)
    expect(animal(sent).x).toBeGreaterThan(animal(close).x)
    expect(sent.opponent.health).toBe(close.opponent.health)
    expect(sent.opponent.hitStun).toBe(0)
  })
})
