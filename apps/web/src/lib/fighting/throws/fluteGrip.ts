import { Vector3 } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { hasMelodyFlute, melodyNenActive, canHear } from '../melodyRules'
import { createVisitHatsuModel } from '../visitHatsuModel'
import { fightRigOf } from '../fightRig'
import { reachLimb } from '../fightLimbReach'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState, FightSide } from '../types'

/** A scene-owned representation of the equipped flute leaves the native concert rig intact. */
export function createThrowFluteGrip(options: EffectSceneOptions) {
  const { THREE, scene } = options
  const flute = createVisitHatsuModel(THREE, { model: 'melody-flute' })
  flute.fit({ width: 0.55, height: 0.55 })
  flute.root.name = 'throw-signature:flute'
  const geometry = new THREE.RingGeometry(0.1, 0.115, 32)
  const material = new THREE.MeshBasicMaterial({
    color: 0xf0d28b,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const notes = [0, 1, 2].map(() => new THREE.Mesh(geometry, material))
  const sound = new THREE.Group()
  sound.name = 'throw-signature:flute-sound'
  sound.add(...notes)
  scene.add(flute.root, sound)
  let hidden: { native: import('three').Object3D; side: FightSide } | undefined
  const hide = (state?: FightState) => {
    flute.root.visible = sound.visible = false
    if (hidden) hidden.native.visible = !state || equipped(state, hidden.side)
    hidden = undefined
  }
  hide()
  return {
    hide,
    sync(state: FightState, frame: ThrowCinematicFrame) {
      if (frame.performance !== 'melody-last-bar' || !equipped(state, frame.attacker)) return
      const figure = options.figureOf?.(frame.attacker)
      const rig = figure && humanAnimationRig(figure)
      if (!rig || frame.age / frame.duration > 0.18) return
      const native = figure!.getObjectByName('signature-flute')
      if (native) {
        native.visible = false
        hidden = { native, side: frame.attacker }
      }
      flute.root.visible = true
      flute.root.position.copy(rig.head.localToWorld(new Vector3(-0.12, -0.08, 0.2)))
      rig.head.getWorldQuaternion(flute.root.quaternion)
      const joints = fightRigOf(rig)
      for (const index of [0, 1]) {
        const point = flute.root.localToWorld(new Vector3(index === 0 ? -0.12 : 0.12, 0, 0))
        reachLimb(
          { root: rig.arms[index], hinge: joints.elbows[index], end: joints.wrists[index] },
          point,
        )
      }
      sound.visible = soundAvailable(options, state, frame)
      sound.position.copy(flute.root.position)
      sound.quaternion.copy(flute.root.quaternion)
      notes.forEach((note, index) => {
        const t = ((frame.age / frame.duration) * 5 + index / 3) % 1
        note.position.set(0.1 + t * 0.4, 0.1, t * 0.15)
        note.scale.setScalar(0.5 + t)
      })
    },
    dispose() {
      hide()
      flute.dispose()
      sound.removeFromParent()
      geometry.dispose()
      material.dispose()
    },
  }
}

function equipped(state: FightState, side: FightSide) {
  return hasMelodyFlute(state[side]) && !state[side].weaponsConfiscated
}
function soundAvailable(
  options: EffectSceneOptions,
  state: FightState,
  frame: ThrowCinematicFrame,
) {
  return (
    options.comfort?.().flashes !== false &&
    melodyNenActive(state[frame.attacker]) &&
    canHear(state[frame.victim])
  )
}
