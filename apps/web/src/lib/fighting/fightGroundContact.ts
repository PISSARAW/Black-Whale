import type { Mesh, Object3D } from 'three'
import type { AnimatedHuman, HumanMotion } from '$lib/tour/humanAnimation'
import type { ArcadeFighter } from './types'

const FLOOR_CLEARANCE = 0.012
const SUPPORTS = new WeakMap<Object3D, Mesh[]>()

/** Physical body surfaces only: a book, gun, hair, aura or shadow is never a support. */
function bodySurfaces(human: AnimatedHuman): Mesh[] {
  const cached = SUPPORTS.get(human.figure)
  if (cached) return cached
  const segments = [...human.arms, ...human.legs, ...human.knees]
  const elbows = human.arms.map((arm) => arm.children[1])
  const parts = [
    human.torso,
    human.pelvis,
    human.head.children[0],
    ...segments.map((segment) => segment.children[0]),
    ...elbows.map((elbow) => elbow.children[0]),
    ...human.knees.map((knee) => knee.children[1]),
  ]
  const meshes: Mesh[] = []
  for (const part of parts)
    part.traverse((node) => {
      if ((node as Mesh).isMesh) meshes.push(node as Mesh)
    })
  // Hands can carry equipment: use their own geometry, never their descendants.
  for (const elbow of elbows)
    for (const hand of elbow.children)
      if ((hand as Mesh).isMesh && hand.name.startsWith('hand-')) meshes.push(hand as Mesh)
  SUPPORTS.set(human.figure, meshes)
  return meshes
}

/** Exact lowest body vertex in world space, including the rendered model's scale. */
export function lowestBodyHeight(human: AnimatedHuman): number {
  let lowest = Infinity
  for (const mesh of bodySurfaces(human)) {
    mesh.updateWorldMatrix(true, false)
    const vertices = mesh.geometry.getAttribute('position')
    const matrix = mesh.matrixWorld.elements
    for (let i = 0; i < vertices.count; i++)
      lowest = Math.min(
        lowest,
        matrix[1] * vertices.getX(i) +
          matrix[5] * vertices.getY(i) +
          matrix[9] * vertices.getZ(i) +
          matrix[13],
      )
  }
  return lowest
}

/** Apply after blending and head tracking, so the displayed body touches the floor. */
export function fightGroundContact(fighter: ArcadeFighter): HumanMotion {
  return (human) => {
    if (!['down', 'ko', 'wakeup'].includes(fighter.pose)) return
    const lowest = lowestBodyHeight(human)
    const correction = FLOOR_CLEARANCE - lowest
    // Airborne bodies keep their trajectory, but never pass through the floor.
    if (!Number.isFinite(correction) || (fighter.y > 0 && correction <= 0)) return
    const parent = human.figure.parent
    if (!parent) return
    const origin = parent.getWorldPosition(human.figure.position.clone())
    origin.y += correction
    human.figure.position.add(parent.worldToLocal(origin))
    human.figure.updateWorldMatrix(false, false)
  }
}
