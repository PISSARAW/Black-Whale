export type FactSubjectType =
  | 'CHARACTER'
  | 'BODY'
  | 'CONSCIOUSNESS'
  | 'LOCATION'
  | 'EVENT'
  | 'ABILITY'
  | 'AFFILIATION'
  | 'COHORT'
export type TruthStatus = 'CONFIRMED' | 'STRONGLY_IMPLIED' | 'DEDUCTION' | 'CONTESTED'

export interface Fact {
  id: string
  subjectType: FactSubjectType
  subjectId: string
  predicate: string
  value: unknown
  validFromEventId: string
  validUntilEventId?: string
  truthStatus: TruthStatus
  firstVisibleEventId: string
  sourceIds?: string[]
}

export type EpistemicState = 'KNOWN' | 'BELIEVED' | 'SUSPECTED' | 'DOUBTED' | 'REJECTED' | 'UNKNOWN'
export type AcquisitionMethod =
  | 'DIRECT_OBSERVATION'
  | 'TOLD_BY_OTHER'
  | 'DEDUCTION'
  | 'NEN_ABILITY'
  | 'DOCUMENT'
  | 'RUMOR'
  | 'UNKNOWN'

export interface KnowledgeState {
  id: string
  observerCharacterId: string
  factId: string
  fromEventId: string
  untilEventId?: string
  epistemicState: EpistemicState
  confidence?: number
  acquisitionMethod: AcquisitionMethod
  sourceCharacterId?: string
  acquisitionEventId: string
}

export interface Belief {
  id: string
  observerCharacterId: string
  subjectType: string
  subjectId: string
  predicate: string
  believedValue: unknown
  fromEventId: string
  untilEventId?: string
  confidence: number
  sourceEventId: string
}

export type TransmissionType =
  'DIRECT_SPEECH' | 'PHONE' | 'MESSAGE' | 'REPORT' | 'BROADCAST' | 'NEN_LINK'
export type Reliability = 'TRUSTED' | 'UNVERIFIED' | 'DECEPTIVE' | 'UNKNOWN'

export interface InformationTransferEvent {
  id: string
  senderId: string
  receiverIds: string[]
  factIds: string[]
  transmissionType: TransmissionType
  reliability: Reliability
}
