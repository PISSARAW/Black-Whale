export type PerspectiveKind = 'reader' | 'character'
export type FollowMode = 'consciousness' | 'body' | 'appearance'

export type KnowledgeVisualState =
  | 'known'
  | 'confirmed'
  | 'reported'
  | 'believed'
  | 'suspected'
  | 'rumor'
  | 'rejected'
  | 'outdated'
  | 'contradicted'
  | 'unknown'

export interface PerspectiveContext {
  chapter: number
  eventLabel: string
  spoilerLimit: number | null
  perspectiveName: string
  followedConsciousness: string
  occupiedBody: string
  apparentIdentity: string
  followMode: FollowMode
  hasAnomaly: boolean
}

export interface MarkerIdentityState {
  id: string
  x: number
  y: number
  body: string
  consciousness: string
  appearance: string
  perceivedIdentity: string
  knowledgeState: KnowledgeVisualState
  transferFlag?: boolean
  suspicionLabel?: string
  sourceLabel?: string
  sinceLabel?: string
  positionColor?: string
  tierLabel?: string
  locationLabel?: string
  temporalLabel?: string
  temporalDetail?: string
  factionTags?: string[]
  isFollowTarget?: boolean
  originalCharacterId?: string
  hatsuNames?: string[]
  hatsuIds?: string[]
  futureChange?: 'stable' | 'moved' | 'dead'
}

export interface PerspectiveOption {
  id: string
  label: string
  kind: PerspectiveKind
}
