import { HUMAN_LOD_DISTANCE, type HumanFigure } from './humanFigure'

/**
 * Three ranges for a body that wears a GLB, two for everyone else: the GLB up
 * close (`lod.detail`), the procedural body to twenty-four metres, the far
 * silhouette beyond. Returns whether the near group is the one shown.
 */
export function showHumanLod(lod: HumanFigure['lod'], distance: number): boolean {
  const near = distance <= HUMAN_LOD_DISTANCE
  lod.near.visible = near
  lod.far.visible = !near
  if (near) lod.detail?.(distance)
  return near
}
