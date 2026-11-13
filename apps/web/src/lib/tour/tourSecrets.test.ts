import { describe, expect, it } from 'vitest'
import characters from '../../../../../data/characters/characters.json'

import { theShip } from './blueprint'
import type { Post } from './cast'
import { secretApparitions, secretErrors, secretForApparition, TOUR_SECRETS } from './tourSecrets'

const ship = theShip()
const ids = new Set(characters.map((character) => character.id))

describe('references veiled with In', () => {
  it('validates every location, character and canon label in the authored registry', () => {
    expect(secretErrors(ship, ids)).toEqual([])
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
