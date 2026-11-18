import type { FighterId } from './types'
import type { GumSource } from './bungeeSource'
import type { ArenaMap } from './arenaMap'

export const DOWSING_MAP_FRAMES = 30 // Duel preparation, not a canonical duration.

export interface DowsingMapSearch {
  phase: 'searching' | 'reading'
  mapId: string
  bodyKey: string
  appearance: FighterId
  startedAt: number
  remainingFrames: number
  origin: GumSource
}
export interface DowsingMapReading {
  map: ArenaMap
  mapId: string
  bodyKey: string
  appearance: FighterId
  frame: number
  round: number
  point?: { x: number; y: number }
}
declare module './types' {
  interface ArcadeFighter {
    dowsingMapPose?: { mapId: string; point?: { x: number; y: number } }
    dowsingMapSearch?: DowsingMapSearch
    dowsingMapReading?: DowsingMapReading
  }
}
