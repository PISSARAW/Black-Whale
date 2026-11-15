import { describe, expect, it } from 'vitest'
import { createTourSimulation } from './state'
import { ensureNenPilotZone } from './nenEnvironment'
import {
  actionsForNenTarget,
  configurePilotNenProfile,
  previewTourNenAction,
  TOUR_CATEGORY_ACTION_IDS,
} from './categoryAbilities'

describe('Tour category abilities', () => {
  it('offers only actions compatible with the selected target', () => {
    const state = ensureNenPilotZone(createTourSimulation({ id: 'targeting' }))
    expect(actionsForNenTarget(state, 'pilot-control-panel')).toEqual([
      'remote-pulse',
      'specified-tool',
      'marked-command',
    ])
  })

  it('routes all six pilot abilities through category resolution', () => {
    let state = ensureNenPilotZone(createTourSimulation({ id: 'pilot-user' }))
    state = configurePilotNenProfile(state, 'specialist')
    state.nenEnvironment.targets['pilot-control-panel'].markedBy = state.id
    state.nenEnvironment.traces['pilot-trace'] = {
      id: 'pilot-trace',
      spaceId: state.player.spaceId,
      sourceActionId: 'past-action',
      ownerId: 'unknown',
      hiddenWithIn: false,
      createdAt: 0,
      expiresAt: null,
      detectedBy: [],
    }
    const targetByAction = {
      'enhanced-effort': 'pilot-service-door',
      'remote-pulse': 'pilot-control-panel',
      'adhesive-link': 'pilot-cargo-crate',
      'specified-tool': 'pilot-service-door',
      'marked-command': 'pilot-control-panel',
      'conditional-trace-reading': 'pilot-trace',
    } as const

    for (const actionId of TOUR_CATEGORY_ACTION_IDS) {
      state.player.aura = 100
      expect(
        previewTourNenAction(state, actionId, {
          targetId: targetByAction[actionId],
          distance: 1,
        }).accepted,
        actionId,
      ).toBe(true)
    }
  })
})
