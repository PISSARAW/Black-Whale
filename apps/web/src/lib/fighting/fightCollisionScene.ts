import type * as Three from 'three'
import { fightCollisionBoxes, type FightCollisionBox } from './fightCollisionBoxes'
import { fightWorldX, fightWorldY, FIGHT_WORLD_X, FIGHT_WORLD_Y } from './fightCoordinates'
import type { FightState } from './types'

type ThreeApi = typeof Three
interface CollisionTile {
  root: Three.Group
  fill: Three.Mesh<Three.PlaneGeometry, Three.MeshBasicMaterial>
  outline: Three.LineSegments<Three.EdgesGeometry, Three.LineBasicMaterial>
}

/** Diagnostic geometry shares the combat plane, camera, interpolation and viewport with the fighters. */
export function createFightCollisionScene({
  THREE,
  scene,
}: {
  THREE: ThreeApi
  scene: Three.Scene
}) {
  const root = new THREE.Group()
  root.name = 'fight-collision-boxes'
  root.visible = false
  scene.add(root)
  const plane = new THREE.PlaneGeometry(1, 1)
  const edges = new THREE.EdgesGeometry(plane)
  const colours = { player: 0x3accff, opponent: 0xc267ff, hit: 0xff4d52, projectile: 0xffbb44 }
  const materials = Object.fromEntries(
    Object.entries(colours).map(([key, color]) => [
      key,
      {
        fill: new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.12,
          depthTest: false,
          depthWrite: false,
          toneMapped: false,
          fog: false,
          side: THREE.DoubleSide,
        }),
        outline: new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.95,
          depthTest: false,
          depthWrite: false,
          toneMapped: false,
          fog: false,
        }),
      },
    ]),
  )
  const pool: CollisionTile[] = []
  function tile(index: number): CollisionTile {
    if (pool[index]) return pool[index]
    const group = new THREE.Group()
    const fill = new THREE.Mesh(plane, materials.player.fill)
    const outline = new THREE.LineSegments(edges, materials.player.outline)
    fill.renderOrder = 1000
    outline.renderOrder = 1001
    group.add(fill, outline)
    root.add(group)
    return (pool[index] = { root: group, fill, outline })
  }
  function draw(entry: FightCollisionBox, index: number) {
    const current = tile(index)
    const { box } = entry
    const material = materials[entry.kind === 'hurt' ? entry.side : entry.kind]
    current.fill.material = material.fill
    current.outline.material = material.outline
    current.root.name = `collision:${entry.kind}:${entry.side}:${index}`
    current.root.userData.kind = entry.kind
    current.root.userData.side = entry.side
    current.root.position.set(
      fightWorldX((box.left + box.right) / 2),
      fightWorldY((box.bottom + box.top) / 2),
      0,
    )
    current.root.scale.set(
      (box.right - box.left) * FIGHT_WORLD_X,
      (box.top - box.bottom) * FIGHT_WORLD_Y,
      1,
    )
    current.root.visible = true
  }
  return {
    root,
    sync(state: FightState) {
      root.visible = state.mode === 'training'
      if (!root.visible) return
      const boxes = fightCollisionBoxes(state)
      boxes.forEach(draw)
      pool.slice(boxes.length).forEach((item) => {
        item.root.visible = false
      })
    },
    dispose() {
      root.removeFromParent()
      root.clear()
      plane.dispose()
      edges.dispose()
      Object.values(materials).forEach(({ fill, outline }) => {
        fill.dispose()
        outline.dispose()
      })
      pool.length = 0
    },
  }
}
