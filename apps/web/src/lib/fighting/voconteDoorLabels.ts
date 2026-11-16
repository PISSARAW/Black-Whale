import type { EffectSceneOptions } from './fighterEffectScene'

/** Small vector letters stay legible without a canvas texture or a font download. */
export function doorLetter(options: EffectSceneOptions, letter: 'A' | 'B') {
  const paths = {
    A: [
      [-0.14, 0, 0, 0.4],
      [0, 0.4, 0.14, 0],
      [-0.08, 0.16, 0.08, 0.16],
    ],
    B: [
      [-0.12, 0, -0.12, 0.4],
      [-0.12, 0.4, 0.1, 0.35],
      [0.1, 0.35, 0.1, 0.25],
      [0.1, 0.25, -0.12, 0.2],
      [-0.12, 0.2, 0.12, 0.16],
      [0.12, 0.16, 0.12, 0.04],
      [0.12, 0.04, -0.12, 0],
    ],
  }
  const points = paths[letter].flatMap(([x1, y1, x2, y2]) => [
    new options.THREE.Vector3(x1, y1, 0),
    new options.THREE.Vector3(x2, y2, 0),
  ])
  const geometry = new options.THREE.BufferGeometry().setFromPoints(points)
  const material = new options.THREE.LineBasicMaterial({ color: 0xcbeee3 })
  return new options.THREE.LineSegments(geometry, material)
}
