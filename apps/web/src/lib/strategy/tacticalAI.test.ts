import { describe, expect, it } from 'vitest'
import type { WorldState } from '@black-whale/canon-engine'
import { personalityForFaction, projectFactionAIPerspective } from './tacticalAI'

describe('strategy AI personalities', () => {
  it('assigns a stable personality to every faction', () => {
    expect(personalityForFaction('faction-a')).toBe(personalityForFaction('faction-a'))
    expect(['CAUTIOUS', 'AGGRESSIVE', 'OPPORTUNIST']).toContain(personalityForFaction('faction-b'))
  })

  it('removes hidden opponents and their abilities from the AI world', () => {
    const state = {
      schemaVersion: 1,
      cursor: { chapterNumber: 359, eventId: 'turn' },
      entities: {
        ai: { id: 'ai', kind: 'CHARACTER', label: 'AI' },
        seen: { id: 'seen', kind: 'CHARACTER', label: 'Seen' },
        hidden: { id: 'hidden', kind: 'CHARACTER', label: 'Hidden' },
        roomA: { id: 'roomA', kind: 'LOCATION', label: 'A' },
        roomB: { id: 'roomB', kind: 'LOCATION', label: 'B' },
      },
      presences: {
        ai: { entity: { id: 'ai', kind: 'CHARACTER' }, locationId: 'roomA' },
        seen: { entity: { id: 'seen', kind: 'CHARACTER' }, locationId: 'roomA' },
        hidden: { entity: { id: 'hidden', kind: 'CHARACTER' }, locationId: 'roomB' },
      },
      abilitiesByOwner: { ai: ['own-hatsu'], hidden: ['secret-hatsu'] },
      bodyStates: {},
      consciousnessByBody: {},
      effects: {},
      knowledgeByObserver: {},
      vestiges: {},
    } as unknown as WorldState

    const perspective = projectFactionAIPerspective({
      state,
      memberCharacterIds: ['ai'],
      opposingEntityIds: ['seen', 'hidden'],
      unitConditions: { ai: 'READY', seen: 'READY', hidden: 'READY' },
    })

    expect(perspective.knownOpponentLocations).toEqual(['roomA'])
    expect(perspective.state.entities.seen).toBeDefined()
    expect(perspective.state.entities.hidden).toBeUndefined()
    expect(perspective.state.presences.hidden).toBeUndefined()
    expect(perspective.state.abilitiesByOwner.hidden).toBeUndefined()
    expect(perspective.state.entities.roomB).toBeDefined()
  })
})
