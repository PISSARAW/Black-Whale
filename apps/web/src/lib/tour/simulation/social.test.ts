import { describe, expect, it } from 'vitest'
import { createTourSimulation } from './state'
import { mayEnterRestrictedSpace, resolveSocialAction } from './social'

describe('Tour social simulation', () => {
  it('tracks faction-specific reputation and rival reactions', () => {
    const state = resolveSocialAction(createTourSimulation({ id: 'social' }), {
      kind: 'HELP',
      factionId: 'mafia-xiyu',
      rivalFactionIds: ['mafia-heilly'],
      permissionId: 'xiyu-office',
    })
    expect(state.reputation).toMatchObject({ 'mafia-xiyu': 12, 'mafia-heilly': -6 })
    expect(mayEnterRestrictedSpace(state, { permissionId: 'xiyu-office' })).toBe(true)
  })

  it('only creates a full report when somebody witnessed the offence', () => {
    const unseen = resolveSocialAction(createTourSimulation({ id: 'unseen' }), {
      kind: 'TRESPASS',
      factionId: 'royal-army',
    })
    const seen = resolveSocialAction(createTourSimulation({ id: 'seen' }), {
      kind: 'TRESPASS',
      factionId: 'royal-army',
      witnessIds: ['guard-4'],
    })
    expect(unseen.incidents).toEqual([])
    expect(seen.incidents).toEqual(['trespass:royal-army'])
    expect(seen.reputation['royal-army']).toBeLessThan(unseen.reputation['royal-army'])
  })
})
