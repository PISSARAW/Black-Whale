import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight, nextRound } from './engine'
import { paperCommandReady } from './kallutoPaper'
import { availablePaperScatter, ownedPaperScatters } from './kallutoScatter'
import { advancePaperScatters } from './kallutoScatterFrame'
import { activePaperOwner } from './kallutoSurveillance'
import { performArsenalCommand } from './retrospectiveArsenal'
import { catchBungeeObject } from './hisokaCatch'
import { swallowPaperScatter } from './kallutoScatterVacuum'
import { createPaperScatterScene } from './kallutoScatterScene'
import { privatePvpState } from './pvp/view'
import * as THREE from 'three'
import { EMPTY_INPUT, type FightState } from './types'

function advance(state: FightState, count = 80): FightState {
  for (let index = 0; index < count; index++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function cast(state: FightState, moveId: string): FightState {
  return performAuraAttack({ state, side: 'player', kind: 'special', moveId, auraCharged: false })
}
function marked(): FightState {
  const base = beginFight(
    createFight('kalluto', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  const state = {
    ...base,
    player: { ...base.player, x: 30, aura: 100 },
    opponent: { ...base.opponent, x: 48 },
  }
  const next = advance(cast(state, 'kalluto:neutralSpecial'))
  expect(next.opponent.plantedPaper).toHaveLength(1)
  return { ...next, player: { ...next.player, paperKit: { ...next.player.paperKit!, salvos: 0 } } }
}
function released(state: FightState): FightState {
  let next = cast(state, 'kalluto:forwardSpecial')
  for (let index = 0; index < 60 && !next.projectiles.some((shot) => shot.paperScatterId); index++)
    next = advance(next, 1)
  expect(next.projectiles.some((shot) => shot.paperScatterId)).toBe(true)
  return next
}

describe('Kalluto reuses the actual remaining confetti (chapter 226)', () => {
  it('repeatedly concentrates the same dispersed paper without a fresh salvo, a cloned object or a new marking', () => {
    const state = marked()
    const paper = availablePaperScatter(state, 'player')!
    expect(paper).toBeDefined()
    expect(paperCommandReady(state, 'player', 'serpent')).toBe(true)
    const flying = released(state)
    expect(flying.projectiles[0].paperScatterId).toBe(paper.id)
    expect(flying.player.paperKit?.salvos).toBe(0)
    expect(availablePaperScatter(flying, 'player')).toBeUndefined()
    expect(paperCommandReady(flying, 'player', 'serpent')).toBe(false)
    const landed = advance(flying)
    expect(availablePaperScatter(landed, 'player')?.id).toBe(paper.id)
    const repeated = advance(released(landed))
    expect(ownedPaperScatters(repeated, activePaperOwner(repeated, 'player'))).toHaveLength(1)
    expect(availablePaperScatter(repeated, 'player')?.paperScatter?.paperId).toBe(
      paper.paperScatter?.paperId,
    )
    expect(repeated.player.paperKit?.markers).toBe(11)
    expect(repeated.player.paperKit?.salvos).toBe(0)
    expect(repeated.opponent.plantedPaper).toHaveLength(1)
  })
  it('ends voluntary control without destroying the material and keeps On’s seal on a new command', () => {
    const state = marked()
    const original = availablePaperScatter(state, 'player')!
    const stopped = performArsenalCommand(state, 'player', { action: 'paper-release-confetti' })
    expect(availablePaperScatter(stopped, 'player')).toMatchObject({
      id: original.id,
      material: 'real',
      paperScatter: { controlled: false },
    })
    const sealed = advancePaperScatters({
      ...state,
      player: { ...state.player, on: { grudge: 0, sealFrames: 60 } },
    })
    expect(cast(sealed, 'kalluto:forwardSpecial')).toBe(sealed)
    expect(availablePaperScatter(sealed, 'player')?.id).toBe(original.id)
    const round = beginFight(nextRound({ ...stopped, phase: 'finished', winner: 'player' }))
    expect(availablePaperScatter(round, 'player')?.id).toBe(original.id)
  })
  it('does not rematerialize a physical swarm while Bungee Gum is actually holding it', () => {
    const flying = released(marked())
    const shot = flying.projectiles.find((entry) => entry.paperScatterId)!
    const impact = {
      ...flying,
      projectiles: [],
      opponent: { ...flying.opponent, gumCatch: { frames: 24 }, facing: -1 as const },
    }
    const captured = catchBungeeObject(impact, {
      projectile: { ...shot, x: impact.opponent.x - 1 },
      defenderSide: 'opponent',
      position: { x: impact.opponent.x, y: shot.y },
    })!
    expect(captured).not.toBeNull()
    const held = advancePaperScatters(captured)
    expect(availablePaperScatter(held, 'player')).toBeUndefined()
    expect(held.opponent.gumCatch?.projectile?.paperScatterId).toBe(shot.paperScatterId)
  })
  it('lets Blinky swallow loose real paper without duplicating the matter when another object becomes last', () => {
    const state = marked()
    const paper = availablePaperScatter(state, 'player')!
    const source = {
      ...state,
      player: {
        ...state.player,
        x: paper.x - 2,
        facing: 1 as const,
        blinky: { target: 'card' as const },
      },
    }
    const swallowed = swallowPaperScatter(source, 'player')
    expect(swallowed.player.blinky?.lastObject?.paperScatterId).toBe(paper.id)
    expect(availablePaperScatter(swallowed, 'player')).toBeUndefined()
    const notLast = {
      ...swallowed,
      player: {
        ...swallowed.player,
        blinky: { ...swallowed.player.blinky!, lastObject: undefined },
      },
    }
    expect(availablePaperScatter(advancePaperScatters(notLast), 'player')).toBeUndefined()
    const copied = {
      ...source,
      battlefield: {
        ...source.battlefield!,
        entities: source.battlefield!.entities.map((entry) =>
          entry.id === paper.id ? { ...entry, material: 'nen' as const } : entry,
        ),
      },
    }
    expect(swallowPaperScatter(copied, 'player')).toBe(copied)
  })
  it('renders actual loose matter and keeps In-hidden conjured paper out of an opponent’s private view until Gyo', () => {
    const state = marked()
    const paper = availablePaperScatter(state, 'player')!
    const scene = new THREE.Scene()
    const renderer = createPaperScatterScene({
      THREE,
      scene,
      worldX: (x) => x,
      worldY: (y) => y,
      viewer: () => 'opponent',
    })
    renderer.sync(state, 0)
    expect(scene.getObjectByName(`paper-confetti:${paper.id}`)).toBeDefined()
    const hidden = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) =>
          entry.id === paper.id
            ? {
                ...entry,
                material: 'nen' as const,
                paperScatter: { ...entry.paperScatter!, hidden: true },
              }
            : entry,
        ),
      },
    }
    renderer.sync(hidden, 1)
    expect(scene.getObjectByName(`paper-confetti:${paper.id}`)).toBeUndefined()
    expect(
      privatePvpState(hidden, 'opponent').battlefield!.entities.some(
        (entry) => entry.id === paper.id,
      ),
    ).toBe(false)
    const inspected = {
      ...hidden,
      opponent: { ...hidden.opponent, nen: { ...hidden.opponent.nen, gyo: true } },
    }
    renderer.sync(inspected, 2)
    expect(scene.getObjectByName(`paper-confetti:${paper.id}`)).toBeDefined()
    expect(
      privatePvpState(inspected, 'opponent').battlefield!.entities.some(
        (entry) => entry.id === paper.id,
      ),
    ).toBe(true)
    renderer.dispose()
    expect(scene.getObjectByName(`paper-confetti:${paper.id}`)).toBeUndefined()
  })
})
