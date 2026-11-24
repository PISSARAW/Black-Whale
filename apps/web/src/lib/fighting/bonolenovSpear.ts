import { Vector3 } from 'three'
import { spearNormal } from './bonolenovArmedProfile'
import { attackData } from './frameData'
import { moveById } from './movesets'
import type { FightRig } from './fightRig'
import type { ArcadeFighter } from './types'

const SPEAR_NAME = 'bonolenov-prologue-spear'

export function spearContactPoint(rig: FightRig, offset: number): Vector3 | undefined {
  const spear = rig.human.figure.getObjectByName(SPEAR_NAME)
  return spear?.visible ? spear.localToWorld(new Vector3(0, offset, 0)) : undefined
}

/** The carried weapon keeps the right-hand grip through thrust, sweep and butt strike. */
export function animateBonolenovSpear(rig: FightRig, fighter: ArcadeFighter): void {
  if (fighter.id !== 'bonolenov' || !fighter.battleCantabile?.prologue) return
  const spear = rig.human.figure.getObjectByName(SPEAR_NAME)
  if (!spear) return
  spear.visible = !fighter.weaponsConfiscated
  const attack = fighter.attack
  const normal = spearNormal(fighter, moveById(attack?.moveId)?.slot)
  const amount = attack ? strikeAmount(fighter) : 0
  if (normal) {
    const reverse = normal.contact < 0 ? Math.PI : 0
    spear.rotation.set(
      Math.PI + normal.pitch * amount,
      0,
      (normal.sweep + reverse) * amount * fighter.facing,
    )
  } else if (attack?.moveId === 'bonolenov:forwardSpecial') {
    spear.rotation.set(Math.PI + 0.08 * (1 - amount), 0, 0)
  } else {
    const pitch = fighter.y > 0 ? -0.2 : 0
    const guard = fighter.blocking ? -0.75 * fighter.facing : 0
    spear.rotation.set(Math.PI + pitch, 0, guard)
  }
}

function strikeAmount(fighter: ArcadeFighter): number {
  const attack = fighter.attack!
  const frames = attackData(attack.kind, fighter)
  const approach = Math.min(1, attack.frame / Math.max(1, frames.startup))
  const recovery = Math.max(0, attack.frame - frames.startup - frames.active)
  return approach * Math.max(0, 1 - recovery / Math.max(1, frames.recovery))
}
