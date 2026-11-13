import type { MapLocation, TimelineEvent } from '$lib/server/mapPayload'
import type { ShipEventDelta } from './shipDelta'

export interface ShipCatalogData {
  events: TimelineEvent[]
  locations: MapLocation[]
  walkTargets: Record<string, string>
  spoilerLimit: number | null
}

export interface ShipEventData {
  selectedEventId: string | null
  selectedEventIndex: number
  nextEventDelta: ShipEventDelta[]
}
