import { describe, expect, it } from 'vitest'
import { configurePilotNenProfile } from './categoryAbilities'
import {
  executeTourNenAction,
  advanceNenMaintenance,
  prepareNenTarget,
} from './executeCategoryAction'
import { ensureNenPilotZone } from './nenEnvironment'
import { createTourSimulation } from './state'

const world = () =>
  configurePilotNenProfile(ensureNenPilotZone(createTourSimulation({ id: 'visitor' })), 'enhancer')

describe('category action consequences', () => {
  it('separates a witnessed fact from the persistent incident', () => {
    const result = executeTourNenAction(world(), 'enhanced-effort', {
      targetId: 'pilot-service-door',
      distance: 1,
      witnessIds: ['guard-1'],
    })
    expect(result.accepted).toBe(true)
    expect(result.state.nenEnvironment.targets['pilot-service-door']).toMatchObject({
      locked: false,
      damaged: true,
    })
    expect(result.state.incidents).toContain('nen-noise:tier-5-warehouse:pilot-service-door')
    expect(result.state.witnessKnowledge['guard-1']).toContain(
      'saw:enhanced-effort:pilot-service-door',
    )
  })

  it('requires a mark and persists maintenance costs', () => {
    let state = world()
    const refused = executeTourNenAction(state, 'marked-command', {
      targetId: 'pilot-control-panel',
      distance: 1,
    })
    expect(refused.reason).toBe('PREPARATION_MISSING')

    state = prepareNenTarget(state, 'pilot-control-panel')
    const accepted = executeTourNenAction(state, 'marked-command', {
      targetId: 'pilot-control-panel',
      distance: 1,
    }).state
    const aura = accepted.player.aura
    const maintained = advanceNenMaintenance(accepted, 2)
    expect(maintained.player.aura).toBe(aura - 6)
    expect(maintained.player.nenProfile.maintainedEffects).toHaveLength(1)
  })
})
