import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from '../engine'
import { projectFightState } from './stateProjection'

describe('fight state projections', () => {
  it('uses the same boundary for a fighter, a spectator and a simulation', () => {
    const state = beginFight(createFight('hisoka', 'hisoka', { mode: 'versus-local' }))
    state.opponent.gumHeartArmed = true

    const fighter = projectFightState(state, { kind: 'fighter', side: 'player' })
    const simulation = projectFightState(state, { kind: 'simulation', side: 'player' })
    const spectator = projectFightState(state, { kind: 'spectator' })

    expect(fighter.opponent.gumHeartArmed).toBeUndefined()
    expect(simulation.opponent.gumHeartArmed).toBeUndefined()
    expect(simulation.forecastSimulation).toBe(true)
    expect(spectator.player.aura).toBe(0)
    expect(spectator.opponent.aura).toBe(0)
    expect(spectator.spectatorView).toBe(true)
  })

  it('never mutates the authoritative state', () => {
    const state = beginFight(createFight('hisoka', 'chrollo', { mode: 'versus-local' }))
    state.opponent.gumHeartArmed = true
    projectFightState(state, { kind: 'spectator' })
    expect(state.opponent.gumHeartArmed).toBe(true)
    expect(state.spectatorView).toBeUndefined()
  })
})
