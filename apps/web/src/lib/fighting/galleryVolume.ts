import { LUINI_ROOM_HALF_WIDTH, LUINI_ROOM_HEIGHT } from './luiniSpatial'
import type { PreparedEntity } from './preparationTypes'

/** Existing duel dimensions, not an additional remote En radius or canonical object measurements. */
export function galleryVolume(entry: PreparedEntity): { width: number; height: number } {
  if (entry.arena) return entry.arena
  if (entry.kind === 'room') return { width: LUINI_ROOM_HALF_WIDTH, height: LUINI_ROOM_HEIGHT }
  if (entry.writingKit) return { width: 2, height: 1 }
  if (entry.device) return { width: 1, height: 2 }
  return { width: 0.5, height: 1 }
}
