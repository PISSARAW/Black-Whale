import type { Vec2 } from './types'

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
  /** The chapter this view is from, for the watermark */
  chapter: number
  /** Description of the scene */
  label: string
  /** Description of the scene in French */
  labelFr: string
}

/**
 * A catalogue of specific camera angles that reproduce panels from the manga.
 * The walk can jump the visitor here so they see exactly what the drawing shows.
 */
export const MANGA_VIEWS: MangaView[] = []

export function viewsForSpace(spaceId: string | null): MangaView[] {
  if (!spaceId) return []
  return MANGA_VIEWS.filter((view) => view.spaceId === spaceId)
}
