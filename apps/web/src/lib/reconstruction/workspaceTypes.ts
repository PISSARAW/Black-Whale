import type { Apparition } from '$lib/tour/apparitions'
import type { Messages } from '$lib/i18n'
import type { ReconstructionEvidence } from './evidence'

export interface DisplayPresence {
  entityId: string
  locationId: string | null
  locationLabel: string | null
  precision: 'EXACT_ROOM' | 'ZONE' | 'TIER' | 'UNKNOWN'
  certainty: 'CONFIRMED' | 'PROBABLE' | 'LAST_KNOWN'
  tierId: string | null
  name: string
}

export interface PresenceChange extends DisplayPresence {
  change: 'arrived' | 'moved' | 'departed' | 'unchanged'
  previousLocationLabel: string | null
  previousTierId: string | null
}

export interface SceneCharacter {
  characterId: string
  bodyId: string
  name: string
  participationType: keyof Messages['reconstruction']['roles']
  shown: Apparition | null
}

export interface EventDetails {
  chapter: number
  title: string
  summary: string
  time: string | null
  evidence: ReconstructionEvidence[]
}

export interface SceneTarget {
  bodyId: string
  shown: Apparition | null
}

export function reconstructionPeople(options: {
  presences: DisplayPresence[]
  cast: SceneCharacter[]
  avatars: Apparition[]
}) {
  const people = new Map(options.presences.map((person) => [person.entityId, person]))
  for (const character of options.cast) {
    if (people.has(character.bodyId)) continue
    people.set(character.bodyId, {
      entityId: character.bodyId,
      name: character.name,
      locationId: null,
      locationLabel: null,
      precision: 'UNKNOWN',
      certainty: 'LAST_KNOWN',
      tierId: null,
    })
  }
  return [...people.values()].map((person) => ({
    ...person,
    shown: options.avatars.find((avatar) => avatar.id === `avatar-${person.entityId}`) ?? null,
    role: options.cast.find((character) => character.bodyId === person.entityId)?.participationType,
  }))
}
