import { describe, expect, it } from 'vitest'
import { markKnowledgeOutdated, propagateKnowledge, type BranchKnowledgeState } from './knowledge'

const initial = (): BranchKnowledgeState => ({
  byObserver: {
    kurapika: {
      threat: {
        factId: 'threat',
        state: 'KNOWN',
        confidence: 1,
        acquiredAtDecisionId: 'canon',
        sourceCharacterId: null,
        transmissionPath: ['kurapika'],
      },
    },
  },
})

describe('V3 knowledge propagation', () => {
  it('propagates a known fact and records its complete path', () => {
    const first = propagateKnowledge(initial(), {
      id: 'tell-oito',
      senderId: 'kurapika',
      receiverIds: ['oito'],
      factId: 'threat',
      reliability: 'trusted',
      deceptive: false,
    })
    expect(first.state.byObserver.oito.threat).toMatchObject({
      state: 'KNOWN',
      transmissionPath: ['kurapika', 'oito'],
    })
    const relay = propagateKnowledge(first.state, {
      id: 'tell-bill',
      senderId: 'oito',
      receiverIds: ['bill'],
      factId: 'threat',
      reliability: 'unverified',
      deceptive: false,
    })
    expect(relay.state.byObserver.bill.threat).toMatchObject({
      state: 'BELIEVED',
      confidence: 0.65,
      transmissionPath: ['kurapika', 'oito', 'bill'],
    })
  })

  it('blocks truthful transmission of an unknown fact', () => {
    const result = propagateKnowledge(initial(), {
      id: 'invent',
      senderId: 'bill',
      receiverIds: ['oito'],
      factId: 'secret',
      reliability: 'trusted',
      deceptive: false,
    })
    expect(result.traces[0]).toMatchObject({ status: 'blocked', record: null })
    expect(result.state).toEqual(initial())
  })

  it('keeps a lie as a belief rather than canonical knowledge', () => {
    const result = propagateKnowledge(initial(), {
      id: 'lie',
      senderId: 'liar',
      receiverIds: ['oito'],
      factId: 'false-location',
      reliability: 'deceptive',
      deceptive: true,
    })
    expect(result.state.byObserver.oito['false-location']).toMatchObject({
      state: 'BELIEVED',
      confidence: 0.55,
    })
  })

  it('marks superseded knowledge as outdated without deleting its provenance', () => {
    const outdated = markKnowledgeOutdated(initial(), 'threat')
    expect(outdated.byObserver.kurapika.threat).toMatchObject({
      state: 'OUTDATED',
      transmissionPath: ['kurapika'],
    })
    expect(initial().byObserver.kurapika.threat.state).toBe('KNOWN')
  })
})
