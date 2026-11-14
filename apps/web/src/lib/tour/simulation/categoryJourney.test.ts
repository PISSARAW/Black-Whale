import { describe, expect, it } from 'vitest'
import { configurePilotNenProfile, previewTourNenAction } from './categoryAbilities'
import { executeTourNenAction } from './executeCategoryAction'
import { ensureNenPilotZone } from './nenEnvironment'
import { decodeTourSimulation, encodeTourSimulation } from './persistence'
import { createTourSimulation } from './state'

const pilot = () => ensureNenPilotZone(createTourSimulation({ id: 'journey' }))

describe('Nen category pilot journey', () => {
  it('keeps an ordinary solution and makes affinity materially change an action', () => {
    const base = pilot()
    expect(base.nenEnvironment.targets['pilot-service-door'].ordinarySolution).toContain('badge')

    const enhancer = configurePilotNenProfile(base, 'enhancer')
    const manipulator = configurePilotNenProfile(base, 'manipulator')
    const input = { targetId: 'pilot-service-door', distance: 1 }
    const direct = previewTourNenAction(enhancer, 'enhanced-effort', input)
    const distant = previewTourNenAction(manipulator, 'enhanced-effort', input)

    expect(direct.power).toBeGreaterThan(distant.power)
    expect(
      executeTourNenAction(enhancer, 'enhanced-effort', input).state.nenEnvironment.targets[
        'pilot-service-door'
      ].locked,
    ).toBe(false)
    expect(
      executeTourNenAction(manipulator, 'enhanced-effort', input).state.nenEnvironment.targets[
        'pilot-service-door'
      ].locked,
    ).toBe(true)
  })

  it('blocks aura-fed actions in Zetsu and restores maintained effects', () => {
    const state = configurePilotNenProfile(pilot(), 'transmuter')
    state.player.nen.mode = 'zetsu'
    expect(
      previewTourNenAction(state, 'adhesive-link', {
        targetId: 'pilot-cargo-crate',
        distance: 1,
      }).reason,
    ).toBe('ZETSU_HAS_NO_AURA')

    state.player.nen.mode = 'ten'
    const active = executeTourNenAction(state, 'adhesive-link', {
      targetId: 'pilot-cargo-crate',
      distance: 1,
    }).state
    const restored = decodeTourSimulation(encodeTourSimulation(active))
    expect(restored?.player.nenProfile.maintainedEffects).toEqual(
      active.player.nenProfile.maintainedEffects,
    )
    expect(Object.keys(restored?.nenEnvironment.traces ?? {})).toHaveLength(1)
  })
})
