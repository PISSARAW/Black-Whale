import type * as Three from 'three'
import type { Vec2 } from './types'

export interface GangwayView {
  root: Three.Group
  setExtended: (extended: boolean) => void
  dispose: () => void
}

/**
 * The small outside scene at the Tier 2 gangway. It is deliberately a visual
 * companion to the audited deck plans: the manga gives the silhouette and the
 * relationship of the ship, water and retractable bridge, not a new interior
 * blueprint. The actual crossing remains the blueprint link.
 */
export function buildGangwayView(THREE: typeof Three, from: Vec2, to: Vec2): GangwayView {
  const root = new THREE.Group()
  root.name = 'chapter-419-gangway'

  const materials: Three.Material[] = []
  const material = (color: number, roughness = 0.82, metalness = 0.15) => {
    const value = new THREE.MeshStandardMaterial({ color, roughness, metalness })
    materials.push(value)
    return value
  }
  const waterMaterial = material(0x0b2730, 0.98, 0.02)
  const hullMaterial = material(0x9aa3a6, 0.56, 0.54)
  const deckMaterial = material(0x455155, 0.72, 0.42)
  const superstructureMaterial = material(0xb9c0bd, 0.62, 0.38)
  const windowMaterial = material(0x17272b, 0.28, 0.65)
  const gangwayMaterial = material(0xc0a260, 0.6, 0.62)
  const railMaterial = material(0xd4d9d6, 0.45, 0.72)

  const makeBox = (
    size: [number, number, number],
    position: [number, number, number],
    surface: Three.Material,
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), surface)
    mesh.position.set(...position)
    root.add(mesh)
    return mesh
  }

  const direction = new THREE.Vector3(to[0] - from[0], 0, to[1] - from[1])
  const length = Math.max(1, direction.length())
  const heading = Math.atan2(direction.x, direction.z)
  const midpoint = new THREE.Vector3((from[0] + to[0]) / 2, 0, (from[1] + to[1]) / 2)

  // The water and ship sit below the visitor's deck, as in the cutaway view.
  makeBox([92, 0.35, 62], [to[0], -9.5, to[1]], waterMaterial)
  makeBox([58, 3.6, 13], [to[0], -5.5, to[1]], hullMaterial)
  makeBox([52, 1.1, 12], [to[0], -3.2, to[1]], deckMaterial)
  makeBox([31, 4.2, 9], [to[0] + 5, 0.0, to[1]], superstructureMaterial)
  makeBox([19, 3.2, 7], [to[0] - 16, -0.1, to[1]], superstructureMaterial)
  makeBox([17, 0.45, 6], [to[0] + 5, 2.2, to[1]], deckMaterial)
  makeBox([9, 0.28, 0.6], [to[0] + 5, 0.8, to[1] - 4.55], windowMaterial)
  makeBox([9, 0.28, 0.6], [to[0] + 5, 0.8, to[1] + 4.55], windowMaterial)
  makeBox([5, 7, 4], [to[0] + 14, 3.5, to[1]], superstructureMaterial)

  const gangway = new THREE.Group()
  gangway.name = 'retractable-gangway'
  gangway.position.copy(midpoint)
  gangway.rotation.y = heading
  root.add(gangway)
  const deck = new THREE.Mesh(new THREE.BoxGeometry(4, 0.35, length), gangwayMaterial)
  deck.position.y = 5.8
  gangway.add(deck)
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, length), railMaterial)
    rail.position.set(side * 1.75, 6.45, 0)
    gangway.add(rail)
  }

  const extendedPosition = gangway.position.clone()
  const retractedPosition = new THREE.Vector3(from[0], 5.8, from[1])
  const setExtended = (extended: boolean) => {
    gangway.visible = true
    gangway.position.copy(extended ? extendedPosition : retractedPosition)
    gangway.scale.z = extended ? 1 : 0.08
    gangway.rotation.y = extended ? heading : 0
  }
  setExtended(true)

  return {
    root,
    setExtended,
    dispose: () => {
      root.traverse((object) => {
        const mesh = object as Three.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
      })
      for (const surface of materials) surface.dispose()
    },
  }
}
