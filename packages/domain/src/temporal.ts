export interface Chapter {
  id: string
  number: number
  title?: string
}

export type EventRelationType = 'precedes' | 'causes' | 'concurrent' | 'reveals'

export interface NarrativeEvent {
  id: string
  chapterId: string
  sequence: number
  /** Chronological occurrence order, independent from the revealing chapter. */
  ordinal?: number
  isFlashback?: boolean
  occurredAtLabel?: string
  title: string
  summary: string
  locationId?: string
}

export type ParticipationType = 'ACTIVE' | 'PASSIVE' | 'OBSERVER' | 'VICTIM' | 'UNKNOWN'

export interface EventParticipation {
  id: string
  eventId: string
  participantId: string // Could be Character, Body, Cohort, etc.
  participantType: 'CHARACTER' | 'BODY' | 'COHORT'
  participationType: ParticipationType
}
