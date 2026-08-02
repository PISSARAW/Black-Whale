export type ObservationKind = 'sight' | 'sound' | 'trace' | 'claim' | 'report' | 'verification'

export interface Observation {
  id: string
  at: number
  observerId: string
  kind: ObservationKind
  subject: string
  value: string
  certainty: number
  sourceId?: string
  spaceId?: string
}

export interface ActorMemory {
  observations: Observation[]
  exposureBySubject: Record<string, number>
}

export const emptyMemory = (): ActorMemory => ({ observations: [], exposureBySubject: {} })

export function remember(memory: ActorMemory, observation: Observation): ActorMemory {
  if (memory.observations.some((item) => item.id === observation.id)) return memory
  const exposure = observation.kind === 'sight' ? 1 : 0
  return {
    observations: [...memory.observations, observation],
    exposureBySubject: {
      ...memory.exposureBySubject,
      [observation.subject]: (memory.exposureBySubject[observation.subject] ?? 0) + exposure,
    },
  }
}

export function knownObservations(memory: ActorMemory, subject: string): Observation[] {
  return memory.observations.filter((item) => item.subject === subject)
}

export function transmit(memory: ActorMemory, observationId: string, receiverId: string, at: number): Observation | null {
  const source = memory.observations.find((item) => item.id === observationId)
  if (!source) return null
  return { ...source, id: `${source.id}>${receiverId}`, at, observerId: receiverId, kind: 'report', certainty: Math.max(0, source.certainty - 12), sourceId: source.id }
}
