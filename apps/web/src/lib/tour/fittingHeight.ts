/** Lamp geometry and its baked illumination share one physical height. */
export function fittingHeight(floor: number, ceiling: number, drop = 0.35): number {
  return Math.max(floor + 2, ceiling - drop)
}
