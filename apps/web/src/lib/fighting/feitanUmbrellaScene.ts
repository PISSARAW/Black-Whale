import { umbrellaCanopy, UMBRELLA_FEINT_FRAMES, UMBRELLA_OPEN_FRAMES } from './feitanUmbrella'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** An opaque canopy and its held shaft, never an aura shield. */
export function createUmbrellaFeintScene(options: EffectSceneOptions) {
  const { THREE, scene } = options
  const radius = Math.abs(options.worldY(3.5) - options.worldY(0))
  const cloth = new THREE.MeshBasicMaterial({ color: 0x54283e, side: THREE.DoubleSide })
  const metal = new THREE.LineBasicMaterial({ color: 0xbac2c8 })
  const cap = new THREE.SphereGeometry(radius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)
  const ribPoints: number[] = []
  for (let rib = 0; rib < 8; rib++) {
    const angle = (rib * Math.PI) / 4
    for (let segment = 0; segment < 8; segment++) {
      for (const step of [segment, segment + 1]) {
        const theta = (step * Math.PI) / 16
        const spread = Math.sin(theta) * radius * 1.005
        ribPoints.push(
          spread * Math.cos(angle),
          Math.cos(theta) * radius * 1.005,
          spread * Math.sin(angle),
        )
      }
    }
  }
  const ribs = new THREE.BufferGeometry()
  ribs.setAttribute('position', new THREE.Float32BufferAttribute(ribPoints, 3))
  const held = new Map<
    FightSide,
    { root: import('three').Group; canopy: import('three').Mesh; shaft: import('three').Line }
  >()
  for (const side of ['player', 'opponent'] as const) {
    const root = new THREE.Group(),
      canopy = new THREE.Mesh(cap, cloth)
    root.name = `feitan-umbrella:${side}`
    root.visible = false
    canopy.add(new THREE.LineSegments(ribs, metal))
    const shaft = new THREE.Line(new THREE.BufferGeometry(), metal)
    root.add(canopy, shaft)
    scene.add(root)
    held.set(side, { root, canopy, shaft })
  }
  return {
    sync(state: FightState) {
      for (const [side, model] of held) {
        const actor = state[side],
          canopy = umbrellaCanopy(actor)
        model.root.visible = Boolean(canopy) && state.phase === 'fighting'
        if (!canopy) continue
        model.canopy.position.set(options.worldX(canopy.x), options.worldY(canopy.y), 0.12)
        model.canopy.rotation.z = (-actor.facing * Math.PI) / 2
        const progress = (UMBRELLA_FEINT_FRAMES - actor.umbrellaFeintFrames!) / UMBRELLA_OPEN_FRAMES
        model.canopy.scale.setScalar(Math.max(0.02, Math.min(1, progress)))
        model.shaft.geometry.setFromPoints([
          new THREE.Vector3(
            options.worldX(actor.x + actor.facing),
            options.worldY(actor.y + 7),
            0.12,
          ),
          new THREE.Vector3(options.worldX(canopy.x), options.worldY(canopy.y), 0.12),
        ])
      }
    },
    dispose() {
      for (const model of held.values()) {
        model.shaft.geometry.dispose()
        scene.remove(model.root)
      }
      cap.dispose()
      ribs.dispose()
      cloth.dispose()
      metal.dispose()
      held.clear()
    },
  }
}
