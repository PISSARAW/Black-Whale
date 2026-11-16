import type { FightSide, FighterId } from './types'

export type CameraPart = 'head' | 'hands' | 'left-hand' | 'right-hand' | 'feet' | 'chest' | 'body'
export type CameraAnchor =
  | { type: 'rig'; side: FightSide; part: CameraPart }
  | { type: 'node'; name: string; fallback?: CameraAnchor; size?: number; actor?: FightSide }
  | { type: 'entity'; id: string; x: number; y: number }
  | { type: 'projectile'; id: number; x: number; y: number }
  | { type: 'point'; x: number; y: number; size?: number }

export interface CameraDetail {
  kind: 'eyes' | 'body' | 'armour' | 'sun' | 'impact' | 'chain' | 'seal' | 'focus'
  side: FightSide
  labelFr: string
  labelEn: string
  tip?: string
  offset?: { x: number; y: number }
  anchors?: readonly CameraAnchor[]
  eventId?: string
  observation?: { rule: string; value: string | number | boolean | null | undefined }
  source?: FighterId
  sourceSide?: FightSide
  aura?: boolean
  /** Physical frontal view for eyes, faces and information displays. */
  frontal?: boolean
  elevation?: number
  /** Hide only an overlapping rival in the secondary pass, never in the main view. */
  isolate?: boolean
  /** Private information follows the selected viewer. */
  privateTo?: FightSide
  /** The event ended; the secondary camera follows its real actor/target, never a saved pose. */
  followThrough?: boolean
}
export interface CinematicCue {
  frame: number
  side: FightSide
  strength: number
  hold: number
  release: number
}
export interface CinematicDirection {
  strength: number
  side: FightSide | null
  detail: CameraDetail | null
}
export interface CameraEvent {
  cue: CinematicCue
  detail?: CameraDetail
  duration?: number
  priority?: number
}
export type CameraPacing = 'extended' | 'compact'
