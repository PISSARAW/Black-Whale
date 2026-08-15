import { describe, expect, it } from 'vitest'
import { eventHatsuFor, type EventHatsuUse } from './eventHatsu'

const use = (overrides: Partial<EventHatsuUse> = {}): EventHatsuUse => ({
  chapter: 409,
  eventTitle: 'Borksen fulfills a condition of Contagion',
  abilityId: 'contagion',
  userId: 'morena-prudo',
  status: 'ACTIVATED',
  occursOnBlackWhale: true,
  ...overrides,
})

const event = { chapter: 409, title: 'Borksen fulfills a condition of Contagion' }
const kindFor = (abilityId: string) => (abilityId === 'contagion' ? 'leveling-game' : null)
const carried = new Set(['leveling-game'])

describe('event-attested Hatsu', () => {
  const options = { event, kindFor, carried }

  it('allows an activation explicitly attached to the selected event', () => {
    expect(eventHatsuFor([use()], options)).toEqual({
      'morena-prudo': ['leveling-game'],
    })
  })

  it('does not borrow an activation from another scene in the same chapter', () => {
    expect(
      eventHatsuFor([use({ eventTitle: 'Three soldiers vanish in room 3101' })], options),
    ).toEqual({})
  })

  it('does not treat a chapter-only mention or explanation as a visible cast', () => {
    expect(
      eventHatsuFor([use({ eventTitle: undefined }), use({ status: 'EXPLAINED' })], options),
    ).toEqual({})
  })

  it('refuses techniques the tour cannot faithfully render', () => {
    expect(eventHatsuFor([use()], { ...options, carried: new Set() })).toEqual({})
  })
})
