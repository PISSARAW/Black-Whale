import { describe, expect, it } from 'vitest'
import { initialHuntSocial, reactToTrace, type HuntWitness } from './social'
import type { HuntTrace } from './traces'

const witness: HuntWitness = {
  id: 'guard-1',
  factionId: 'royal-security',
  terrain: 'tserriednich',
  spaceId: 'hall',
  reliability: 0.8,
}
const trace: HuntTrace = {
  kind: 'aura',
  actor: 'player',
  terrain: 'tserriednich',
  spaceId: 'hall',
  position: [0, 0],
  createdAt: 12,
  strength: 1,
  falseTrail: false,
}

describe('reactive Hunt factions', () => {
  it('turns a witnessed Nen manifestation into a sourced report and alert', () => {
    const reacted = reactToTrace(initialHuntSocial([witness]), trace)
    expect(reacted.reports[0]).toMatchObject({
      witnessId: 'guard-1',
      traceKind: 'aura',
      confidence: 0.8,
    })
    expect(reacted.alertByFaction['royal-security']).toBe(1.6)
  })

  it('does not grant remote knowledge to witnesses in another zone', () => {
    const elsewhere = { ...witness, spaceId: 'kitchen' }
    expect(reactToTrace(initialHuntSocial([elsewhere]), trace).reports).toEqual([])
  })
})
