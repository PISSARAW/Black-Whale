import type { Apparition } from './apparitions'
import type { Vec2 } from './types'

export interface MangaCastStaging {
  characterId: string
  /** A panel can span both sides of a grille or doorway. */
  spaceId?: string
  /** Height of the supporting bunk or cushion above the room floor. */
  floorOffset?: number
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
  /** Pull the photo camera back from its walkable anchor; walking restores the anchor. */
  cameraDistance?: number
  /** Published rooms to render when a plan omits reconstructed connecting volumes. */
  visibleSpaceIds?: readonly string[]
  /** The chapter this view is from, for the watermark */
  chapter: number
  /** Event order inside the chapter when the panel reproduces a populated scene. */
  eventSequence?: number
  /** Collected edition, when available; recent chapters may be uncollected. */
  volume?: number
  /** Printed page(s), when the edition exposes a stable reference. */
  pages?: string
  /** Description of the scene */
  label: string
  /** Description of the scene in French */
  labelFr: string
  /** Explicit blocking; an empty array keeps the viewed level free of inferred bodies, including adjoining rooms. */
  staging?: readonly MangaCastStaging[]
  /** A panel may locate a guardian more precisely than its default corner of the room. */
  beastStaging?: readonly { ownerId: string; at: Vec2; heading?: number }[]
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
