import { LUINI_WAIST } from './luiniPassage'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

interface MountedBody {
  figure: import('three').Object3D
  lower: import('three').Object3D
  hidden: Map<import('three').Object3D, boolean>
  baseY: number
  baseZ: number
  appliedY: number
  appliedZ: number
}

/** One rig is split at its waist. The second mesh is only its remaining legs, never a clone fighter. */
export function createLuiniPassageScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const bodies = new Map<FightSide, MountedBody>()
  const geometry = new THREE.RingGeometry(0.88, 1, 32)
  const material = new THREE.MeshBasicMaterial({ color: 0x67bbc5, side: THREE.DoubleSide })
  const rings = (['player', 'opponent'] as const).map((side) => {
    const ring = new THREE.Mesh(geometry, material)
    ring.name = `luini-aperture:${side}`
    ring.visible = false
    scene.add(ring)
    return ring
  })
  function restore(body: MountedBody) {
    for (const [child, visible] of body.hidden) child.visible = visible
    body.hidden.clear()
    if (body.figure.position.y === body.appliedY) body.figure.position.y = body.baseY
    if (body.figure.rotation.z === body.appliedZ) body.figure.rotation.z = body.baseZ
  }
  function syncSide(state: FightState, side: FightSide, ring: import('three').Mesh) {
    let body = bodies.get(side)
    if (body) restore(body)
    const fighter = state[side],
      passage = fighter.luiniPassage
    const figure = options.figureOf?.(side),
      chest = figure?.getObjectByName('fight-chest')
    ring.visible = false
    if (!passage || !figure || !chest) {
      if (body) body.lower.visible = false
      return
    }
    ring.visible = true
    body = mountedBody(side, figure)
    mountBody(options, { body, side, state })
    ring.position.set(
      options.worldX(fighter.x),
      options.worldY(fighter.y + (passage.mode === 'ceiling' ? 12 : 8.5)),
      0.12,
    )
    ring.rotation.x = passage.mode === 'ceiling' ? Math.PI / 2 : 0
    ring.scale.set(
      Math.abs(options.worldX(3) - options.worldX(0)),
      options.worldY(3.6) - options.worldY(0),
      1,
    )
  }
  function mountedBody(side: FightSide, figure: import('three').Object3D): MountedBody {
    const previous = bodies.get(side)
    if (previous?.figure === figure) return previous
    if (previous) scene.remove(previous.lower)
    const lower = figure.clone(true)
    lower.name = `luini-origin:${side}`
    lower.getObjectByName('fight-chest')!.visible = false
    const body = { figure, lower, hidden: new Map(), baseY: 0, baseZ: 0, appliedY: 0, appliedZ: 0 }
    bodies.set(side, body)
    scene.add(lower)
    return body
  }
  return {
    sync(state) {
      rings.forEach((ring, i) => syncSide(state, i === 0 ? 'player' : 'opponent', ring))
    },
    dispose() {
      for (const body of bodies.values()) {
        restore(body)
        scene.remove(body.lower)
      }
      scene.remove(...rings)
      geometry.dispose()
      material.dispose()
      bodies.clear()
    },
  }
}

function mountBody(
  options: EffectSceneOptions,
  context: { body: MountedBody; state: FightState; side: FightSide },
) {
  const { body, state, side } = context,
    { figure, lower } = body
  const passage = state[side].luiniPassage!
  // A spatial aperture appears at its real exit, without interpolating a body across the arena.
  figure.parent!.position.set(options.worldX(passage.exitX), options.worldY(passage.exitY), 0)
  body.baseY = figure.position.y
  body.baseZ = figure.rotation.z
  figure.updateWorldMatrix(true, false)
  const parentScale = figure.parent!.getWorldScale(new options.THREE.Vector3())
  lower.visible = true
  lower.scale.copy(figure.getWorldScale(new options.THREE.Vector3()))
  lower.quaternion.copy(figure.getWorldQuaternion(new options.THREE.Quaternion()))
  lower.position.set(
    options.worldX(passage.originX),
    options.worldY(passage.originY) + body.baseY * parentScale.y,
    0,
  )
  for (const child of figure.children)
    if (child.name !== 'fight-chest') {
      body.hidden.set(child, child.visible)
      child.visible = false
    }
  if (passage.mode === 'ceiling') {
    figure.rotation.z += Math.PI
    figure.position.y += (options.worldY(12 + LUINI_WAIST) - options.worldY(0)) / parentScale.y
  }
  body.appliedY = figure.position.y
  body.appliedZ = figure.rotation.z
}
