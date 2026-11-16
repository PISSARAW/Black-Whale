import { attackData, hurtboxes, otherSide } from './frameData'
import { sleepingBody } from './hanzoProjection'
import type { FightProjectile, FightSide, FightState } from './types'
import type { ComboMasterAlert } from './comboMasterTypes'
import { comboMasterMonitoring } from './comboMasterAvailability'

/** Observe committed threats only. This reducer changes no combat statistic or hidden effect. */
export function observeComboMaster(
  state: FightState,
  incoming: readonly FightProjectile[] = [],
): FightState {
  return (['player', 'opponent'] as const).reduce((next, side) => {
    const fighter = next[side]
    if (!fighter.comboMaster) return next
    if (next.phase !== 'fighting' || !comboMasterMonitoring(fighter))
      return { ...next, [side]: { ...fighter, comboMaster: undefined } }
    const alert = readAlert(next, side, incoming)
    if (sameAlert(fighter.comboMaster.alert, alert)) return next
    return { ...next, [side]: { ...fighter, comboMaster: { alert } } }
  }, state)
}

function readAlert(
  state: FightState,
  side: FightSide,
  incoming: readonly FightProjectile[],
): ComboMasterAlert | null {
  const source = otherSide(side)
  const targeted =
    concealedStrike(state, side) ||
    [...state.projectiles, ...incoming].some((projectile) =>
      concealedProjectile(state, side, projectile),
    )
  const gum = state.bungeeGum
  const affected = gum?.hidden && gum.target === side && gum.owner === source ? [side] : []
  if (!targeted && affected.length === 0) return null
  return {
    incoming: targeted,
    // Reuse Gyo's existing visibility; the alert itself never reveals an unreadable signature.
    signature: state[side].nen.gyo ? state[source].id : null,
    affected,
  }
}

function concealedStrike(state: FightState, target: FightSide): boolean {
  const attacker = state[otherSide(target)]
  const attack = attacker.attack
  if (!attack?.concealed || !attack.hatsuSource || attack.impacted) return false
  const frames = attackData(attack.kind, attacker)
  if (attack.frame >= frames.startup + frames.active) return false
  return (sleepingBody(state[target]).x - attacker.x) * attacker.facing >= 0
}

function concealedProjectile(
  state: FightState,
  target: FightSide,
  projectile: FightProjectile,
): boolean {
  if (
    !projectile.concealed ||
    projectile.matter !== 'nen' ||
    projectile.owner === target ||
    projectile.age >= projectile.lifetime
  )
    return false
  const body = sleepingBody(state[target])
  if ((body.x - projectile.x) * projectile.velocityX < 0) return false
  return hurtboxes(body).some(
    (box) =>
      projectile.y + projectile.height / 2 >= box.bottom &&
      projectile.y - projectile.height / 2 <= box.top,
  )
}

function sameAlert(before: ComboMasterAlert | null, after: ComboMasterAlert | null): boolean {
  if (!before || !after) return before === after
  return (
    before.incoming === after.incoming &&
    before.signature === after.signature &&
    before.affected.join(',') === after.affected.join(',')
  )
}
