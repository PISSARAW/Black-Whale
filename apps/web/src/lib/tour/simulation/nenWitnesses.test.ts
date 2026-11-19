import { describe, expect, it } from 'vitest'
import { CALM, type CastMember, type Post, type Situation } from '$lib/tour/cast'
import { pressureWitnesses, systemicNenWitnesses } from './nenWitnesses'

const ROOM = 'tier-1-royal-residential-sector-room-1014'

function post(): Post {
  const member: CastMember = {
    characterId: 'guard',
    name: 'Guard',
    factionId: 'royal-army',
    locations: [ROOM],
    role: 'guard',
    since: 'ch-358',
    nen: {
      techniques: ['En', 'Gyo'],
      awakenedFromChapter: 358,
      conduct: { mode: 'ten', concealedWithIn: false, enRadius: 4 },
    },
    hatsu: [],
    beast: null,
  }
  return { member, spaceId: ROOM, tierId: 'tier-1', at: [0, 0], costume: { role: 'guard' } }
}

const hidden = (overrides: Partial<Situation> = {}): Situation => ({
  ...CALM,
  visitorIn: ROOM,
  visitorPressure: 'ren',
  visitorHidden: true,
  ...overrides,
})

describe('hostile Nen witnesses', () => {
  it('does not let In create visual testimony by itself', () => {
    expect(pressureWitnesses([post()], hidden())).toEqual([])
  })

  it('keeps a witness that detects the concealed visitor with En', () => {
    const situation = hidden({ sensedBy: { guard: 'aura' } })
    expect(pressureWitnesses([post()], situation)).toHaveLength(1)
    expect(systemicNenWitnesses([post()], situation)).toEqual([
      expect.objectContaining({ id: 'guard', highSecurity: true }),
    ])
  })

  it('keeps a witness whose active Gyo sees through In', () => {
    const situation = hidden({ holds: { guard: 'bound' } })
    expect(pressureWitnesses([post()], situation)).toHaveLength(1)
  })

  it('treats an interior royal room as high security', () => {
    const guard = post()
    guard.tierId = 'interior-room-1014'
    guard.spaceId = 'tier-1-royal-residential-sector-room-1014-entrance'

    expect(systemicNenWitnesses([guard], hidden({ visitorHidden: false }))[0]?.highSecurity).toBe(
      true,
    )
  })
})
