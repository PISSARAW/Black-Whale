import { Raycaster, Vector3 } from 'three'
import { attackData } from '../frameData'
import { moveById } from '../movesets'
import type { ArcadeFighter } from '../types'
import type { VictoryContext } from './types'
import { visibleVictoryBounds } from './bodyBounds'
import { ease } from './resources'

/** Retarget only the actor's distance/depth; all native joint angles and attack clocks stay intact. */
export function fitBillNativeContact(context: VictoryContext, fighter: ArcadeFighter) {
  const attack = fighter.attack
  if (!attack) return { contactFit: 0, horizontalContactError: null }
  const slot = moveById(attack.moveId)?.slot
  const kick = slot === 'lowLight' || slot === 'lowHeavy'
  const charge = slot === 'forwardHeavy'
  const source = charge
    ? context.hero.root.getObjectByName('torso')!
    : kick
      ? context.hero.root.getObjectByName('knee-right')!.children[1]
      : context.hero.root.getObjectByName('hand-right')!
  const target = context.victim.root.getObjectByName(kick ? 'knee-left' : 'torso')!
  const from = visibleVictoryBounds(source),
    to = visibleVictoryBounds(target)
  const frames = attackData(attack.kind, fighter)
  const contactFit =
    ease(attack.frame / frames.startup) *
    (1 - ease((attack.frame - frames.startup - frames.active) / frames.recovery))
  const ray = new Raycaster(
    new Vector3(to.min.x - 1, from.getCenter(new Vector3()).y, to.getCenter(new Vector3()).z),
    new Vector3(1, 0, 0),
  )
  const surface = ray.intersectObject(target, true)[0]?.point.x ?? to.min.x
  const shiftX = surface - from.max.x - 0.008
  const shiftZ = to.getCenter(new Vector3()).z - from.getCenter(new Vector3()).z
  context.hero.root.position.x += shiftX * contactFit
  context.hero.root.position.z += shiftZ * contactFit
  context.hero.root.updateWorldMatrix(true, true)
  return {
    contactFit,
    horizontalContactError: Math.abs(surface - visibleVictoryBounds(source).max.x - 0.008),
  }
}
