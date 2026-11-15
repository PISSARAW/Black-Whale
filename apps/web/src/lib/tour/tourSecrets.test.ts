import { describe, expect, it } from 'vitest'
import characters from '../../../../../data/characters/characters.json'

import { theShip } from './blueprint'
import { distribute, type CastMember, type Post } from './cast'
import {
  secretApparitions,
  secretErrors,
  secretForApparition,
  secretReachabilityErrors,
  TOUR_SECRETS,
  type TourSecret,
} from './tourSecrets'

const ship = theShip()
const ids = new Set(characters.map((character) => character.id))

function canonicalMembers(secret: TourSecret): CastMember[] {
  const space = ship.spaces.get(secret.spaceId)!
  const location = space.locationId ?? space.id
  return secret.characterIds.flatMap((characterId) => {
    const character = characters.find((candidate) => candidate.id === characterId)
    const leg = character?.mapTrajectory?.find((candidate) => candidate.location === location)
    if (!character?.shipLocation || !leg) return []
    return [
      {
        characterId,
        name: character.canonicalName,
        locations: [location],
        role: character.shipLocation.role,
        since: leg.fromChapterId,
        nen: null,
        hatsu: [],
        beast: null,
      },
    ]
  })
}

describe('references veiled with In', () => {
  it('validates every location, character and canon label in the authored registry', () => {
    expect(secretErrors(ship, ids)).toEqual([])
  })

  it('rejects media references without their structured locator', () => {
    const malformed = {
      ...TOUR_SECRETS[0],
      reference: { ...TOUR_SECRETS[0]!.reference, locator: { chapters: [] } },
    } as TourSecret
    expect(secretErrors(ship, ids, [malformed])).toContain(
      `${malformed.id}: manga reference needs positive chapter numbers`,
    )
  })

  it('reaches every canonical secret through the real cast distribution', () => {
    const canonical = TOUR_SECRETS.filter((secret) => secret.availability === 'canonical')
    for (const secret of canonical) {
      const members = canonicalMembers(secret)
      expect(members, secret.id).toHaveLength(1)
      const posts = distribute(ship, members)
      expect(secretReachabilityErrors(ship, posts, [secret]), JSON.stringify(posts)).toEqual([])
    }
  })

  it('draws nothing without the character that justifies the reference', () => {
    expect(secretApparitions(ship, [])).toEqual([])
  })

  it('emits a hidden Gyo target when its witness is actually present', () => {
    const secret = TOUR_SECRETS[2]
    const post = {
      spaceId: secret.spaceId,
      tierId: ship.spaces.get(secret.spaceId)!.tierId,
      member: { characterId: 'hisoka' },
    } as Post
    const apparition = secretApparitions(ship, [post])[0]
    expect(apparition.hidden).toBe(true)
    expect(apparition.pick).toBe(true)
    expect(secretForApparition(apparition.id)?.reference.canonStatus).toBe('non-canon-homage')
  })
})
