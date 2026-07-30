import type { BeyondLineageStatus } from '$lib/beyondLineage'

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
  /**
   * What the marker's position *inside* its room is worth, on a local map only.
   *
   * The archive's `certainty` answers "is this the right room". It says nothing
   * about the point the marker occupies in it, and a local map draws that point
   * whether canon gave one or not — so a passenger the story only ever puts "in
   * 1004" renders as precisely as one shown lying on a named bed. This label is
   * how the two stop looking alike; it is absent exactly when a panel puts the
   * passenger on the fixture the marker sits on.
   */
  spotLabel?: string
  temporalLabel?: string
  temporalDetail?: string
  factionTags?: string[]
  /**
   * Set only for a body whose owner the reader may already know descends from
   * Beyond. The loader strips it past the spoiler cap, so its absence means
   * "not one of them, as far as this reader knows" — never "hidden for now".
   */
  beyondLineage?: BeyondLineageStatus
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
