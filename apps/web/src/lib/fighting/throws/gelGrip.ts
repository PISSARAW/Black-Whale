import { Vector3, CatmullRomCurve3 } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { createVisitHatsuModel } from '../visitHatsuModel'
import { threadVisible } from '../fineControlAnchors'
import { gelThrowNenAvailable } from './sixthConditions'
import { fightRigOf } from '../fightRig'
import { reachLimb } from '../fightLimbReach'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState } from '../types'

/** The same violet head and black arm wrap a confirmed grip, with no venom or lasting bind. */
export function createThrowGelGrip(options: EffectSceneOptions) {
  const { THREE, scene } = options
  const root = new THREE.Group()
  root.name = 'throw-gel-grip'
  const model = createVisitHatsuModel(THREE, { model: 'snake-arm', joints: ['gel-snake-head'] })
  model.root.name = 'throw-signature:serpent'
  const head = model.joints.get('gel-snake-head')!
  model.body.traverse((node) => {
    if ((node as import('three').Mesh).isMesh && !insideHead(node, head)) node.visible = false
  })
  model.body.position.set(0, 0, 0)
  head.position.set(0, 0, 0)
  head.rotation.set(0, 0, 0)
  model.root.scale.setScalar(0.65)
  const line = new THREE.CatmullRomCurve3([new Vector3(), new Vector3(0, 1, 0)])
  const geometry = new THREE.TubeGeometry(line, 48, 0.055, 8, false)
  const material = new THREE.MeshBasicMaterial({ color: 0x14141a })
  root.add(new THREE.Mesh(geometry, material), model.root)
  scene.add(root)
  const skin = new THREE.MeshBasicMaterial({ visible: false })
  const hidden = new Map<
    import('three').Mesh,
    import('three').Material | import('three').Material[]
  >()
  const hide = () => {
    root.visible = model.root.visible = false
    hidden.forEach((material, mesh) => {
      mesh.material = material
    })
    hidden.clear()
  }
  hide()
  return {
    hide,
    sync(state: FightState, frame: ThrowCinematicFrame) {
      if (!gelFrame(state, frame) || !threadVisible(options, state, frame.attacker)) return
      const bodies = gelBodies(options, frame)
      if (!bodies) return
      const { hero, target, hand } = bodies
      const anchor = frame.powered ? target.torso : target.figure.getObjectByName('hand-left')!
      const from = hand.getWorldPosition(new Vector3()),
        centre = anchor.getWorldPosition(new Vector3())
      if (from.distanceTo(centre) > 2.8) return
      const curve = coilCurve(from, anchor, Boolean(frame.powered))
      const fresh = new THREE.TubeGeometry(curve, 48, 0.055, 8, false)
      copyTube(geometry, fresh)
      model.root.position.copy(curve.getPoint(1))
      const direction = centre.clone().sub(model.root.position).normalize()
      model.root.quaternion.setFromUnitVectors(new Vector3(0, 0, -1), direction)
      hideHandMeshes(hand, hidden, skin)
      root.visible = model.root.visible = true
      const rig = fightRigOf(hero)
      reachLimb(
        { root: hero.arms[0], hinge: rig.elbows[0], end: rig.wrists[0] },
        target.arms[1].children[1].getWorldPosition(new Vector3()),
      )
    },
    dispose() {
      hide()
      model.dispose()
      root.removeFromParent()
      geometry.dispose()
      material.dispose()
      skin.dispose()
    },
  }
}

function gelFrame(state: FightState, frame: ThrowCinematicFrame) {
  return (
    frame.performance?.startsWith('gel') &&
    frame.age / frame.duration < 0.68 &&
    gelThrowNenAvailable(state[frame.attacker])
  )
}
function gelBodies(options: EffectSceneOptions, frame: ThrowCinematicFrame) {
  const own = options.figureOf?.(frame.attacker),
    rival = options.figureOf?.(frame.victim)
  if (!own || !rival) return
  const hero = humanAnimationRig(own),
    target = humanAnimationRig(rival)
  const hand = own.getObjectByName('hand-right')
  return hero && target && hand ? { hero, target, hand } : undefined
}
function insideHead(node: import('three').Object3D, head: import('three').Object3D): boolean {
  if (node === head) return true
  return node.parent ? insideHead(node.parent, head) : false
}
function hideHandMeshes(
  hand: import('three').Object3D,
  hidden: Map<import('three').Mesh, import('three').Material | import('three').Material[]>,
  material: import('three').Material,
) {
  hand.traverse((node) => {
    const mesh = node as import('three').Mesh
    if (!mesh.isMesh) return
    hidden.set(mesh, mesh.material)
    mesh.material = material
  })
}
function coilCurve(from: Vector3, target: import('three').Object3D, powered: boolean) {
  const centre = target.getWorldPosition(new Vector3())
  const points = Array.from({ length: 17 }, (_, i) => {
    const t = i / 16
    if (t < 0.3) return from.clone().lerp(centre, t / 0.3)
    const u = (t - 0.3) / 0.7,
      angle = u * Math.PI * (powered ? 3 : 2)
    const radius = powered ? 0.23 : 0.1
    return target.localToWorld(
      new Vector3(Math.sin(angle) * radius, (u - 0.5) * 0.22, Math.cos(angle) * radius),
    )
  })
  return new CatmullRomCurve3(points)
}

function copyTube(target: import('three').TubeGeometry, fresh: import('three').TubeGeometry) {
  for (const name of ['position', 'normal']) {
    const attribute = target.getAttribute(name) as import('three').BufferAttribute
    const array = attribute.array as Float32Array
    array.set(fresh.getAttribute(name).array)
    attribute.needsUpdate = true
  }
  target.computeBoundingSphere()
  fresh.dispose()
}
