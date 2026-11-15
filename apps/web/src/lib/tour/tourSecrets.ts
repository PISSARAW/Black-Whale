import secretJson from '../../../../../data/ship/tour-secrets.json'

import { floorOf, type Ship } from './blueprint'
import { centroid } from './geometry-movement'
import type { Apparition } from './apparitions'
import type { Post } from './cast'

export type SecretMedium = 'manga' | 'anime' | 'film'
export type SecretCanonStatus = 'canon' | 'adaptation' | 'non-canon-homage'
export type SecretAvailability = 'canonical' | 'simulation-only'

interface SecretReferenceBase {
  title: string
  citation: string
}

export type SecretReference =
  | (SecretReferenceBase & {
      medium: 'manga'
      canonStatus: 'canon'
      locator: { chapters: number[] }
    })
  | (SecretReferenceBase & {
      medium: 'anime'
      canonStatus: 'adaptation' | 'non-canon-homage'
      locator: { episodes: { from: number; to: number } }
    })
  | (SecretReferenceBase & {
      medium: 'film'
      canonStatus: 'non-canon-homage'
      locator: { year: number }
    })

export interface TourSecret {
  id: string
  spaceId: string
  /** Whether the ordinary canonical cast can reach it, or a simulation must project its witness. */
  availability: SecretAvailability
  characterIds: string[]
  name: string
  nameFr: string
  reference: SecretReference
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

const positiveIntegers = (values: readonly number[]) =>
  values.length > 0 && values.every((value) => Number.isInteger(value) && value > 0)

function mangaReferenceErrors(id: string, chapters: readonly number[]): string[] {
  return positiveIntegers(chapters) ? [] : [`${id}: manga reference needs positive chapter numbers`]
}

function animeReferenceErrors(id: string, episodes: { from: number; to: number }): string[] {
  return positiveIntegers([episodes.from, episodes.to]) && episodes.to >= episodes.from
    ? []
    : [`${id}: anime reference needs an ordered episode range`]
}

function filmReferenceErrors(id: string, year: number, canonStatus: SecretCanonStatus): string[] {
  const errors =
    Number.isInteger(year) && year >= 1998 && year <= 2100
      ? []
      : [`${id}: film reference needs a plausible release year`]
  if (canonStatus !== 'non-canon-homage') {
    errors.push(`${id}: film reference must be labelled non-canon-homage`)
  }
  return errors
}

function referenceErrors(secret: TourSecret): string[] {
  const reference = secret.reference
  const errors = reference.citation.trim() ? [] : [`${secret.id}: missing citation`]
  if (reference.medium === 'manga') {
    return [...errors, ...mangaReferenceErrors(secret.id, reference.locator.chapters)]
  }
  if (reference.medium === 'anime') {
    return [...errors, ...animeReferenceErrors(secret.id, reference.locator.episodes)]
  }
  return [
    ...errors,
    ...filmReferenceErrors(secret.id, reference.locator.year, reference.canonStatus),
  ]
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
  if (!['canonical', 'simulation-only'].includes(secret.availability)) {
    errors.push(`${secret.id}: invalid availability ${String(secret.availability)}`)
  }
  errors.push(...referenceErrors(secret))
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

/** Canonical entries must be observable from an actual distribution, not only a synthetic post. */
export function secretReachabilityErrors(
  ship: Ship,
  posts: readonly Post[],
  secrets: readonly TourSecret[] = TOUR_SECRETS,
): string[] {
  const visible = new Set(secretApparitions(ship, posts).map((apparition) => apparition.id))
  return secrets.flatMap((secret) =>
    secret.availability === 'canonical' && !visible.has(`${APPARITION_PREFIX}${secret.id}`)
      ? [`${secret.id}: unreachable from canonical distribution`]
      : [],
  )
}
