import type { Apparition } from './apparitions'
import type { Vec2 } from './types'

export interface MangaCastStaging {
  characterId: string
  at: Vec2
  heading?: number
  pose?: NonNullable<Apparition['human']>['pose']
}

export interface MangaView {
  /** The unique ID for this view */
  id: string
  /** The space this view belongs to */
  spaceId: string
  /** The position of the camera */
  at: Vec2
  /** The horizontal angle (yaw) of the camera in radians */
  heading: number
  /** The vertical angle (pitch) of the camera in radians */
  pitch: number
  /** Height above the floor for aerial plans; ordinary panel views use the visitor's eyes. */
  eyeHeight?: number
  /** Published rooms to render when a plan omits reconstructed connecting volumes. */
  visibleSpaceIds?: readonly string[]
  /** The chapter this view is from, for the watermark */
  chapter: number
  /** Event order inside the chapter when the panel reproduces a populated scene. */
  eventSequence?: number
  /** Collected edition used to check the framing. */
  volume: number
  /** Printed page(s), when the edition exposes a stable reference. */
  pages?: string
  /** Description of the scene */
  label: string
  /** Description of the scene in French */
  labelFr: string
  /** Character blocking visible in the source panel, when it is explicit. */
  staging?: readonly MangaCastStaging[]
  /** Other zones of the same continuous room from which this view is offered. */
  triggerSpaceIds?: readonly string[]
}

function headingTo(from: Vec2, target: Vec2): number {
  // Three.js' camera looks down local -Z; the ground-plane ray is (-sin(yaw), -cos(yaw)).
  return Math.atan2(from[0] - target[0], from[1] - target[1])
}

export function mangaView(input: Omit<MangaView, 'heading'> & { target: Vec2 }): MangaView {
  const { target, ...rest } = input
  return { ...rest, heading: headingTo(input.at, target) }
}
