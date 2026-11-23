import { Vector3, type Object3D, type Scene } from 'three'

/**
 * Framings built on both fighters rather than one face: the stage axis runs from the
 * filmed hero to the other head, and the audience side is +z (the combat camera's side).
 */
export const TWO_SHOTS = ['wide-low', 'high', 'over', 'profile'] as const
export type TwoShot = (typeof TWO_SHOTS)[number]
export const isTwoShot = (mode: string): mode is TwoShot =>
  (TWO_SHOTS as readonly string[]).includes(mode)

/** The other fighter's head: the nearest visible rig head that is not the hero's. */
export function otherHead(scene: Scene, hero: Object3D): Object3D | undefined {
  const from = hero.getWorldPosition(new Vector3())
  let found: Object3D | undefined
  let best = Infinity
  scene.traverse((node) => {
    if (node === hero || !(node.name.startsWith('manga-head:') || node.name === 'kurapika-head'))
      return
    if (!shown(node)) return
    const distance = node.getWorldPosition(new Vector3()).distanceTo(from)
    if (distance < best) [found, best] = [node, distance]
  })
  return found
}

/** Visible with every ancestor: rigs parked off stage (background extras) do not count. */
function shown(node: Object3D): boolean {
  for (let at: Object3D | null = node; at; at = at.parent) if (!at.visible) return false
  return true
}

export function twoShotPlacement(mode: TwoShot, hero: Object3D, other: Object3D) {
  const a = hero.getWorldPosition(new Vector3())
  const b = other.getWorldPosition(new Vector3())
  const mid = a.clone().add(b).multiplyScalar(0.5)
  const axis = b.clone().sub(a).setY(0).normalize()
  const side = new Vector3(0, 0, 1)
  const up = new Vector3(0, 1, 0)
  switch (mode) {
    case 'wide-low':
      // Near the floor, looking up at both: the fight looks bigger than life.
      return {
        position: mid.clone().addScaledVector(side, 9).addScaledVector(up, -1.2),
        target: mid.clone().addScaledVector(up, -0.2),
        fov: 36,
      }
    case 'high':
      return {
        position: mid.clone().addScaledVector(side, 7).addScaledVector(up, 4.6),
        target: mid.clone().addScaledVector(up, -0.8),
        fov: 40,
      }
    case 'over':
      // Behind the hero's shoulder, the other fighter in front of the lens.
      return {
        position: a
          .clone()
          .addScaledVector(axis, -1.7)
          .addScaledVector(side, 0.55)
          .addScaledVector(up, 0.2),
        target: b.clone().addScaledVector(up, -0.35),
        fov: 40,
      }
    default:
      return {
        position: mid.clone().addScaledVector(side, 6.5).addScaledVector(up, -0.1),
        target: mid.clone().addScaledVector(up, -0.25),
        fov: 32,
      }
  }
}
