export interface CameraDetailRect {
  x: number
  y: number
  width: number
  height: number
}

/** Fractions of the arena, below the HUD; portrait shots leave the combat lane underneath. */
export function cinematicDetailRect(aspect: number): CameraDetailRect {
  return aspect < 1.15
    ? { x: 0.52, y: 0.22, width: 0.46, height: 0.23 }
    : { x: 0.67, y: 0.26, width: 0.31, height: 0.36 }
}

/** A full action, rather than a face, needs a larger comparison window. */
export function futureDetailRect(aspect: number, height = 720): CameraDetailRect {
  return aspect < 1.15
    ? { x: 0.48, y: Math.max(0.29, 210 / height), width: 0.5, height: 0.23 }
    : { x: 0.64, y: 0.3, width: 0.34, height: 0.42 }
}
