import type { Group, Object3D } from 'three'
import { poseFluteArms, raiseConcertFlute } from '$lib/tour/humanFlutePose'
import type { FightRig } from './fightRig'
import type { ArcadeFighter } from './types'

const REST = new WeakMap<Object3D, ReturnType<typeof rememberFlute>>()
function rememberFlute(flute: Object3D) {
  return {
    parent: flute.parent!,
    position: flute.position.clone(),
    rotation: flute.rotation.clone(),
    scale: flute.scale.clone(),
  }
}

/** Stop, hit or loss of the instrument restores its carried position. */
export function restoreMelodyFlute(figure: Object3D, playing: boolean) {
  if (playing) return
  const flute = figure.getObjectByName('signature-flute')
  const rest = flute && REST.get(flute)
  if (!flute || !rest) return
  rest.parent.add(flute)
  flute.position.copy(rest.position)
  flute.rotation.copy(rest.rotation)
  flute.scale.copy(rest.scale)
  REST.delete(flute)
}

/** Shared concert arm targets keep the real flute at Melody's mouth in Fighting. */
export function animateMelodyFlute(rig: FightRig, fighter: ArcadeFighter) {
  if (!fighter.melodyPerformance) return
  const { human } = rig
  const flute = human.figure.getObjectByName('signature-flute')
  if (!flute) return
  let rest = REST.get(flute)
  if (!rest) {
    rest = rememberFlute(flute)
    REST.set(flute, rest)
  }
  rig.chest.add(flute)
  raiseConcertFlute(human.figure)
  poseFluteArms({
    head: human.head,
    arms: human.arms,
    elbows: human.arms.map((arm) => arm.children[1] as Group),
  })
}
