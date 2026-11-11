import { describe, expect, it } from 'vitest'
import { circulateFactionReport, emptyFactionKnowledge } from './factions'

describe('faction-scoped infiltration knowledge', () => {
  it('shares a steward report with ship security but not unrelated Hunters', () => {
    const report = { id: 'r1', witnessId: 'steward' as const, spaceId: 'hall', certainty: 80 }
    const knowledge = circulateFactionReport(emptyFactionKnowledge(), report, {
      faction: 'royal-staff',
    })

    expect(knowledge['royal-staff']).toEqual([report])
    expect(knowledge.security).toEqual([report])
    expect(knowledge['hunter-association']).toEqual([])
  })

  it('does not duplicate a report retransmitted through the same link', () => {
    const report = { id: 'r1', witnessId: 'guard' as const, spaceId: 'hall', certainty: 80 }
    const once = circulateFactionReport(emptyFactionKnowledge(), report, { faction: 'security' })
    const twice = circulateFactionReport(once, report, { faction: 'security' })
    expect(twice.security).toHaveLength(1)
  })
})
