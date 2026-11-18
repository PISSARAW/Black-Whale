import { Vector3, Quaternion, type Object3D } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { createVisitHatsuModel } from '../visitHatsuModel'
import { reachLimb } from '../fightLimbReach'
import { fightRigOf } from '../fightRig'
import { keepHumanJoint } from '$lib/tour/humanJointLimits'
import { signatureNenAvailable } from './selection'
import { kurapikaNenVisible } from '../kurapikaAccentScene'
import { throwPerformance } from './catalogue'
import { alignThrowScissors } from './scissors'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState } from '../types'

/** The visit's staff, Feitan's carried umbrella and Theta's own pistol; no spare weapons. */
export function createThrowEquipment(options: EffectSceneOptions) {
  const staff = createVisitHatsuModel(options.THREE, { model: 'priest-staff' })
  staff.root.name = 'throw-signature:staff'
  const umbrella = new options.THREE.Object3D()
  umbrella.name = 'throw-signature:umbrella'
  options.scene.add(staff.root, umbrella)
  let restoreGun = () => {}
  const reset = () => {
    staff.root.visible = umbrella.visible = false
    restoreGun()
    restoreGun = () => {}
  }
  reset()
  return {
    reset,
    sync(state: FightState, frame: ThrowCinematicFrame) {
      const effect = throwPerformance(frame.performance)?.effect
      if (frame.performance === 'feitan-wheel') alignThrowScissors(options, frame)
      if (effect === 'umbrella') poseUmbrella(options, { state, frame, marker: umbrella })
      if (effect === 'bodyguard') restoreGun = holsterTheta(options, frame)
      if (effect !== 'staff' || !signatureNenAvailable(state, frame.attacker)) return
      if (!kurapikaNenVisible(options, state, frame.attacker)) return
      poseStaff(options, { state, frame, model: staff })
    },
    dispose() {
      reset()
      staff.dispose()
      umbrella.removeFromParent()
    },
  }
}

function poseUmbrella(
  options: EffectSceneOptions,
  context: {
    state: FightState
    frame: ThrowCinematicFrame
    marker: Object3D
  },
) {
  const { state, frame, marker } = context
  if (state[frame.attacker].weaponsConfiscated) return
  const bodies = equipmentBodies(options, frame)
  if (!bodies) return
  const { figure, target } = bodies
  const source = figure.getObjectByName('signature-umbrella')
  if (!source) return
  if (frame.performance === 'feitan-umbrella') {
    const hand = source.parent!
    const grip = hand.getWorldPosition(new Vector3())
    const direction = target.knees[0].getWorldPosition(new Vector3()).sub(grip).normalize()
    const world = new Quaternion().setFromUnitVectors(new Vector3(0, -1, 0), direction)
    hand.quaternion.copy(hand.parent!.getWorldQuaternion(new Quaternion()).invert().multiply(world))
    keepHumanJoint(hand, 'wrist')
  }
  marker.visible = source.visible
  source.getWorldPosition(marker.position)
}

function poseStaff(
  options: EffectSceneOptions,
  context: {
    state: FightState
    frame: ThrowCinematicFrame
    model: ReturnType<typeof createVisitHatsuModel>
  },
) {
  const { state, frame, model } = context
  const bodies = equipmentBodies(options, frame)
  if (!bodies) return
  const { human, target } = bodies
  const rig = fightRigOf(human)
  const grip = rig.wrists[1].getWorldPosition(new Vector3())
  const t = frame.age / frame.duration
  const vault = frame.performance === 'saiyu-vault' && t < 0.7
  const start = vault
    ? new Vector3(options.worldX(state[frame.attacker].x + frame.facing * 3), 0.025, 0.08)
    : grip.clone()
  const direction = vault
    ? grip.clone().sub(start).normalize()
    : target.knees[0].getWorldPosition(new Vector3()).sub(grip).normalize()
  const length = vault ? Math.max(1.8, start.distanceTo(grip) + 0.35) : 1.8
  if (!vault) start.addScaledVector(direction, -0.25)
  model.root.visible = true
  model.root.position.copy(start).addScaledVector(direction, length / 2)
  model.root.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction)
  model.root.scale.set(0.85, length / model.size.y, 0.85)
  const old = options.scene.getObjectByName(`priest-staff:${frame.attacker}`)
  if (old) old.visible = false
  const goal = vault
    ? grip.clone().addScaledVector(direction, -0.24)
    : start.clone().addScaledVector(direction, 0.48)
  reachLimb({ root: human.arms[0], hinge: rig.elbows[0], end: rig.wrists[0] }, goal)
  model.root.userData.planted = vault
  model.root.userData.plant = start.toArray()
}

function equipmentBodies(options: EffectSceneOptions, frame: ThrowCinematicFrame) {
  const figure = options.figureOf?.(frame.attacker),
    rival = options.figureOf?.(frame.victim)
  if (!figure || !rival) return undefined
  const human = humanAnimationRig(figure),
    target = humanAnimationRig(rival)
  return human && target ? { figure, human, target } : undefined
}

function holsterTheta(options: EffectSceneOptions, frame: ThrowCinematicFrame) {
  const figure = options.figureOf?.(frame.attacker)
  const gun = figure?.getObjectByName('theta-physical-handgun')
  if (!figure || !gun?.parent) return () => {}
  const parent = gun.parent,
    position = gun.position.clone(),
    quaternion = gun.quaternion.clone()
  figure.add(gun)
  gun.position.set(0.23, 0.67, 0.06)
  gun.rotation.set(Math.PI / 2, 0, 0)
  return () => {
    parent.add(gun)
    gun.position.copy(position)
    gun.quaternion.copy(quaternion)
  }
}
