import {
  umbrellaCanopy,
  UMBRELLA_FEINT_FRAMES,
  UMBRELLA_OPEN_FRAMES,
  UMBRELLA_RADIUS,
} from './feitanUmbrella'
import { createUmbrellaEmblem } from './feitanUmbrellaEmblem'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** An opaque canopy and its held shaft, never an aura shield. */
export function createUmbrellaFeintScene(options: EffectSceneOptions) {
  const { THREE, scene } = options
  const radius = Math.abs(options.worldY(UMBRELLA_RADIUS) - options.worldY(0))
  const cloth = new THREE.MeshBasicMaterial({ color: 0x70223f, side: THREE.DoubleSide })
  const metal = new THREE.LineBasicMaterial({ color: 0x8c7d89 })
  const emblem = createUmbrellaEmblem(THREE, radius)
  const orientations = umbrellaOrientations(THREE)
  const burstGeometry = new THREE.RingGeometry(radius * 0.92, radius, 48)
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
    {
      root: import('three').Group
      canopy: import('three').Mesh
      shaft: import('three').Line
      burst: import('three').Mesh
      burstMaterial: import('three').MeshBasicMaterial
    }
  >()
  for (const side of ['player', 'opponent'] as const) {
    const root = new THREE.Group(),
      canopy = new THREE.Mesh(cap, cloth)
    root.name = `feitan-umbrella:${side}`
    root.visible = false
    canopy.add(new THREE.LineSegments(ribs, metal), emblem.make())
    const shaft = new THREE.Line(new THREE.BufferGeometry(), metal)
    const burstMaterial = new THREE.MeshBasicMaterial({
      color: 0xf7edf2,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const burst = new THREE.Mesh(burstGeometry, burstMaterial)
    burst.name = `feitan-umbrella-opening-burst:${side}`
    canopy.add(burst)
    root.add(canopy, shaft)
    scene.add(root)
    held.set(side, { root, canopy, shaft, burst, burstMaterial })
  }
  return {
    sync(state: FightState) {
      for (const [side, model] of held) {
        const actor = state[side],
          canopy = umbrellaCanopy(actor)
        model.root.visible = Boolean(canopy) && state.phase === 'fighting'
        if (!canopy) continue
        model.canopy.position.set(options.worldX(canopy.x), options.worldY(canopy.y), 0.12)
        model.canopy.quaternion.copy(orientations.get(actor.facing)!)
        const progress = (UMBRELLA_FEINT_FRAMES - actor.umbrellaFeintFrames!) / UMBRELLA_OPEN_FRAMES
        const spread = Math.max(0.02, Math.min(1, progress))
        model.canopy.scale.set(spread, 0.5 + spread * 0.5, spread)
        model.burst.visible = progress > 0 && progress < 1 && (options.comfort?.().flashes ?? true)
        model.burst.position.y = radius * 0.012
        model.burst.rotation.x = Math.PI / 2
        model.burst.scale.setScalar(0.85 + progress * 0.45)
        model.burstMaterial.opacity = Math.sin(Math.PI * progress) * 0.48
        model.shaft.geometry.setFromPoints([
          umbrellaGrip(options, { side, actor }),
          new THREE.Vector3(options.worldX(canopy.x), options.worldY(canopy.y), 0.12),
        ])
      }
    },
    dispose() {
      for (const model of held.values()) {
        model.shaft.geometry.dispose()
        model.burstMaterial.dispose()
        scene.remove(model.root)
      }
      cap.dispose()
      emblem.dispose()
      ribs.dispose()
      burstGeometry.dispose()
      cloth.dispose()
      metal.dispose()
      held.clear()
    },
  }
}

function umbrellaOrientations(THREE: typeof import('three')) {
  const result = new Map<number, import('three').Quaternion>()
  for (const facing of [1, -1]) {
    const normal = new THREE.Vector3(facing * 0.78, 0.03, 0.62).normalize()
    const up = new THREE.Vector3(0, 1, 0).addScaledVector(normal, -normal.y).normalize()
    const across = normal.clone().cross(up).normalize()
    const basis = new THREE.Matrix4().makeBasis(across, normal, up)
    result.set(facing, new THREE.Quaternion().setFromRotationMatrix(basis))
  }
  return result
}

/** The feint in the reference frees the sword hand by holding the shaft at the mouth. */
function umbrellaGrip(
  options: EffectSceneOptions,
  context: { side: FightSide; actor: import('./types').ArcadeFighter },
) {
  const { actor, side } = context
  const point = new options.THREE.Vector3(
    options.worldX(actor.x + actor.facing),
    options.worldY(actor.y + 7),
    0.12,
  )
  const head = options.figureOf?.(side)?.getObjectByName('manga-head:feitan-portor')
  if (head) {
    head.getWorldPosition(point)
    point.y -= 0.07
    point.x += actor.facing * 0.08
  }
  return point
}
