import { describe, expect, it } from 'vitest'
import { createSolarShowcase } from '../../../demos/fighting-showcase/solarChoreography'
import { tickFight } from './engine'
import { EMPTY_INPUT } from './types'
import { parallelFutureCamera } from './parallelFutureCamera'

describe('Laplace Demon prediction inset', () => {
  const film = createSolarShowcase()
  const state = film.states.find(
    (s) =>
      s.parallelFuture?.phase === 'diverging' &&
      s.parallelFuture.frames[Math.max(0, s.parallelFuture.cursor - 1)].opponent.health === 0,
  )!
  it('shows the real prince escaping Rising Sun while the predicted image is knocked out', () => {
    expect(state).toBeDefined()
    const before = {
      frame: state.frame,
      time: state.time,
      player: state.player,
      opponent: state.opponent,
      phase: state.phase,
    }
    const view = parallelFutureCamera(state, 'player')
    expect(view.main).toBe(state)
    expect(view.main.opponent.health).toBeGreaterThan(0)
    expect(view.main.phase).toBe('fighting')
    expect(view.prediction?.state.opponent.health).toBe(0)
    expect(view.prediction?.state.phase).toBe('finished')
    expect(view.prediction?.state.parallelFuture).toBeUndefined()
    expect(view.prediction?.state.frame).toBe(state.frame)
    expect(view.prediction?.realHealth).toBe(state.opponent.health)
    expect(view.prediction?.damageTaken).toBeGreaterThan(0)
    expect(view.prediction?.elapsedFrames).toBe(state.parallelFuture!.cursor)
    expect(view.prediction?.durationFrames).toBe(600)
    expect(view.prediction?.cameraFrame.z).toBeGreaterThan(0)
    expect({
      frame: state.frame,
      time: state.time,
      player: state.player,
      opponent: state.opponent,
      phase: state.phase,
    }).toEqual(before)
  })
  it('leaves the opponent’s real position private in solo play', () => {
    const solo = { ...state, mode: 'versus-ai' as const }
    const opponent = parallelFutureCamera(solo, 'player')
    expect(opponent.prediction).toBeNull()
    expect(opponent.main.opponent.x).not.toBe(state.opponent.x)
    const owner = parallelFutureCamera(solo, 'opponent')
    expect(owner.main).toBe(solo)
    expect(owner.prediction?.owner).toBe('opponent')
  })
  it('scrubs the detached vision in the inset without changing the real duel', () => {
    let vision = film.states.find((s) => s.parallelFuture?.phase === 'vision')!
    expect(parallelFutureCamera(vision, 'opponent', 599).prediction?.index).toBe(3)
    for (let step = 0; step < 149; step++)
      vision = tickFight(vision, EMPTY_INPUT, { dt: 1 / 60, ai: false })
    const start = parallelFutureCamera(vision, 'opponent', 0)
    const end = parallelFutureCamera(vision, 'opponent', 599)
    expect(start.main).toBe(vision)
    expect(end.main).toBe(vision)
    expect(start.prediction?.index).toBe(0)
    expect(end.prediction?.index).toBe(599)
    expect(end.prediction?.state.opponent.health).toBe(0)
    expect(end.prediction?.elapsedFrames).toBe(600)
  })
})
