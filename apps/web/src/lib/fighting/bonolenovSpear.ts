import { attackData } from './frameData'
import type { FightRig } from './fightRig'
import type { ArcadeFighter } from './types'

/** A shaft follows the right forearm, not the handgun's barrel axis. */
export function animateBonolenovSpear(rig: FightRig, fighter: ArcadeFighter): void {
  if (fighter.id !== 'bonolenov' || !fighter.battleCantabile?.prologue) return
  const spear = rig.human.figure.getObjectByName('bonolenov-prologue-spear')
  if (!spear) return
  spear.visible = !fighter.weaponsConfiscated
  const attack = fighter.attack
  if (attack?.moveId !== 'bonolenov:forwardSpecial') {
    spear.rotation.x = Math.PI
    return
  }
  const frames = attackData(attack.kind, fighter)
  const recovery = Math.max(0, attack.frame - frames.startup - frames.active)
  const settle = Math.min(1, recovery / Math.max(1, frames.recovery))
  // The authored wrist remains neutral at contact; no render-clock wobble can turn the point away.
  spear.rotation.x = Math.PI + Math.sin(settle * Math.PI) * 0.08
}
