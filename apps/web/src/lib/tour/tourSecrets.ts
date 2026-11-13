import secretJson from '../../../../../data/ship/tour-secrets.json'

import { floorOf, type Ship } from './blueprint'
import { centroid } from './geometry-movement'
import type { Apparition } from './apparitions'
import type { Post } from './cast'

export type SecretMedium = 'manga' | 'anime' | 'film'
export type SecretCanonStatus = 'canon' | 'adaptation' | 'non-canon-homage'

export interface TourSecret {
  id: string
  spaceId: string
  characterIds: string[]
  name: string
  nameFr: string
  reference: {
    medium: SecretMedium
    title: string
    citation: string
    canonStatus: SecretCanonStatus
  }
  rationale: string
  rationaleFr: string
  colour: number
  size: number
  height: number
}

export const TOUR_SECRETS = secretJson as TourSecret[]
const APPARITION_PREFIX = 'secret:'

/** A secret follows a justified person within the same catalogued place. */
function witnessPresent(ship: Ship, secret: TourSecret, posts: readonly Post[]): boolean {
  const room = ship.spaces.get(secret.spaceId)
  if (!room) return false
  return posts.some((post) => {
    if (!secret.characterIds.includes(post.member.characterId)) return false
    if (post.spaceId === room.id) return true
    const stood = ship.spaces.get(post.spaceId)
    return Boolean(room.locationId && stood?.locationId === room.locationId)
  })
}

/** In-veiled references: ordinary sight gets no object and Gyo gets a target. */
export function secretApparitions(ship: Ship, posts: readonly Post[]): Apparition[] {
  return TOUR_SECRETS.flatMap((secret) => {
    const space = ship.spaces.get(secret.spaceId)
    const plan = space ? ship.plans.get(space.tierId) : null
    if (!space || !plan || !witnessPresent(ship, secret, posts)) return []
    return [
      {
        id: `${APPARITION_PREFIX}${secret.id}`,
        kind: 'residue',
        spaceId: space.id,
        tierId: space.tierId,
        at: centroid(space),
        y: floorOf(space, plan.tier) + secret.height,
        size: secret.size,
        colour: secret.colour,
        stage: 0,
        hidden: true,
        pick: true,
      },
    ]
  })
}

export function secretForApparition(id: string): TourSecret | null {
  if (!id.startsWith(APPARITION_PREFIX)) return null
  const secretId = id.slice(APPARITION_PREFIX.length)
  return TOUR_SECRETS.find((secret) => secret.id === secretId) ?? null
}

function authoredSecretErrors(
  ship: Ship,
  characterIds: ReadonlySet<string>,
  secret: TourSecret,
): string[] {
  const errors: string[] = []
  if (!ship.spaces.has(secret.spaceId)) errors.push(`${secret.id}: unknown space ${secret.spaceId}`)
  if (!secret.characterIds.length) errors.push(`${secret.id}: no character justification`)
  for (const id of secret.characterIds) {
    if (!characterIds.has(id)) errors.push(`${secret.id}: unknown character ${id}`)
  }
  if (!secret.reference.citation.trim()) errors.push(`${secret.id}: missing citation`)
  if (secret.reference.medium === 'film' && secret.reference.canonStatus === 'canon') {
    errors.push(`${secret.id}: film reference cannot silently claim canon status`)
  }
  return errors
}

/** Validation kept pure so contracts can adopt the file without a renderer. */
export function secretErrors(
  ship: Ship,
  characterIds: ReadonlySet<string>,
  secrets: readonly TourSecret[] = TOUR_SECRETS,
): string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  for (const secret of secrets) {
    if (seen.has(secret.id)) errors.push(`duplicate secret ${secret.id}`)
    seen.add(secret.id)
    errors.push(...authoredSecretErrors(ship, characterIds, secret))
  }
  return errors
}
