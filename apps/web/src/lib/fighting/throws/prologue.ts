import { Vector3, Quaternion } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { fightRigOf } from '../fightRig'
import { reachLimb } from '../fightLimbReach'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState } from '../types'

/** Borrow only the spear that the real Prologue has already conjured. */
export function poseThrowPrologue(
  options: EffectSceneOptions,
  state: FightState,
  frame: ThrowCinematicFrame,
) {
  if (!preparedSpear(state, frame)) return
  const own = options.figureOf?.(frame.attacker),
    rival = options.figureOf?.(frame.victim)
  if (!own || !rival) return
  const spear = own.getObjectByName('bonolenov-prologue-spear')
  const hero = humanAnimationRig(own),
    target = humanAnimationRig(rival)
  if (!spear || !hero || !target) return
  const rig = fightRigOf(hero)
  const contact = target.knees[0].getWorldPosition(new Vector3())
  const axis = new Vector3(frame.facing, -0.12, 0.15).normalize()
  const grip = contact.clone().addScaledVector(axis, -0.55)
  reachLimb({ root: hero.arms[1], hinge: rig.elbows[1], end: rig.wrists[1] }, grip)
  // This cinematic aims the wrist's +Z axis; restore the shaft's matching local axis.
  spear.rotation.set(Math.PI / 2, 0, 0)
  const world = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), axis)
  rig.wrists[1].quaternion.copy(
    rig.wrists[1].parent!.getWorldQuaternion(new Quaternion()).invert().multiply(world),
  )
}

function preparedSpear(state: FightState, frame: ThrowCinematicFrame) {
  const actor = state[frame.attacker]
  return (
    frame.performance === 'bonolenov-prologue' &&
    actor.battleCantabile?.prologue &&
    !actor.weaponsConfiscated
  )
}
