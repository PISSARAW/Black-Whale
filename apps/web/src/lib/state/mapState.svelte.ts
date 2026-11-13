import type { BeyondLineageStatus } from '$lib/beyondLineage'
import type { FollowMode, PerspectiveKind } from '$lib/components/perspective/types'

export type ZoomLevel = 'OVERVIEW' | 'TIER' | 'LOCAL'

/**
 * Beyond's lineage cuts across every faction chip — a marked guard and a
 * suspected prince never share one — so it filters on its own axis, and the two
 * intersect: a reader can ask for the guards who are also his children.
 * `any` takes both claims together; the statuses separate the birthmark the
 * manga shows from the paternity hypothesis Longhi only argues for.
 */
export type BeyondLineageFilter = 'all' | 'any' | BeyondLineageStatus
export type TrackingTargetKind = 'reader' | 'character' | 'object'
export type MapEntityFilter = 'all' | 'characters' | 'objects'
export type KnowledgeState =
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

export type ExplainTarget =
  | {
      kind: 'character'
      subject: string
      location: string
      tier: string
      certainty: string
      temporalLabel: string
      source: string
      observedAt: string
      knowledgeState: KnowledgeState
      profileSlug?: string
    }
  | {
      kind: 'object'
      subject: string
      value: string
      source: string
      observedAt: string
      freshness: string
      knowledgeState: KnowledgeState
      canonicalValue?: string
    }

export const mapState = $state({
  currentZoomLevel: 'OVERVIEW' as ZoomLevel,
  selectedTier: null as string | null,
  selectedLocationId: null as string | null,
  selectedPerspectiveId: 'reader' as string,
  selectedPerspectiveKind: 'reader' as PerspectiveKind,
  selectedPerspectiveName: 'Reader view' as string,
  trackedTargetId: 'reader' as string,
  trackedTargetKind: 'reader' as TrackingTargetKind,
  followMode: 'consciousness' as FollowMode,
  compareWithReader: false,
  explainPanelOpen: false,
  explainTarget: null as ExplainTarget | null,
  currentEventIndex: 0,
  showEventChanges: false,
  playingTimeline: false,
  showEntities: true,
  filters: {
    entityType: 'all' as MapEntityFilter,
    factions: [] as string[],
    beyondLineage: 'all' as BeyondLineageFilter,
    showUnknownPositions: false,
  },

  setZoomLevel(level: ZoomLevel) {
    this.currentZoomLevel = level
  },

  selectTier(tierId: string | null) {
    this.selectedTier = tierId
    this.currentZoomLevel = tierId ? 'TIER' : 'OVERVIEW'
    this.selectedLocationId = null
  },

  selectLocation(locationId: string | null) {
    this.selectedLocationId = locationId
    if (locationId) {
      this.currentZoomLevel = 'LOCAL'
    } else {
      this.currentZoomLevel = this.selectedTier ? 'TIER' : 'OVERVIEW'
    }
  },

  setEventIndex(index: number) {
    this.currentEventIndex = index
  },

  setPerspective(id: string, name: string, kind: PerspectiveKind) {
    this.selectedPerspectiveId = id
    this.selectedPerspectiveName = name
    this.selectedPerspectiveKind = kind
  },

  setTrackedTarget(id: string, kind: TrackingTargetKind) {
    this.trackedTargetId = id
    this.trackedTargetKind = kind
    if (kind !== 'reader') this.showEntities = true
  },

  setFollowMode(mode: FollowMode) {
    this.followMode = mode
  },

  setCompareWithReader(nextValue: boolean) {
    this.compareWithReader = nextValue
  },

  openExplainPanel(payload: ExplainTarget) {
    this.explainTarget = payload
    this.explainPanelOpen = true
  },

  closeExplainPanel() {
    this.explainPanelOpen = false
    this.explainTarget = null
  },

  setBeyondLineageFilter(filter: BeyondLineageFilter) {
    this.filters.beyondLineage = filter
    this.showEntities = true
  },

  setEntityTypeFilter(filter: MapEntityFilter) {
    this.filters.entityType = filter
    this.showEntities = true
  },

  resetFilters() {
    this.filters.entityType = 'all'
    this.filters.factions = []
    this.filters.beyondLineage = 'all'
    this.filters.showUnknownPositions = false
  },

  toggleFactionFilter(factionId: string) {
    this.showEntities = true
    if (this.filters.factions.includes(factionId)) {
      this.filters.factions = this.filters.factions.filter((f) => f !== factionId)
    } else {
      this.filters.factions.push(factionId)
    }
  },
})
