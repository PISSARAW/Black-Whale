import { type BiohazardObject } from './biohazard'
import { biohazardBox } from './biohazardCapture'
import { activeHitbox, attackData, attackPhase, boxesOverlap } from './frameData'
import { isFirearmProjectile } from './nenProjectiles'
import type { FightProjectile, FightSide, FightState } from './types'

/** A real metal object reinforced by Nen. Ordinary firearm rounds cannot destroy it (ch. 391). */
export function strikeBiohazardMelee(
  state: FightState,
  owner: FightSide,
  object: BiohazardObject,
): FightState {
  const side = owner === 'player' ? 'opponent' : 'player'
  const fighter = state[side]
  if (!fighter.attack || fighter.attack.impacted || attackPhase(fighter) !== 'active') return state
  const hitbox = activeHitbox(fighter)
  if (!hitbox || !boxesOverlap(hitbox, biohazardBox(object))) return state
  const power =
    attackData(fighter.attack.kind, fighter).damage * (fighter.attack.auraCharged ? 1.5 : 1)
  const next = damageObject(state, owner, { object, damage: power })
  return { ...next, [side]: { ...fighter, attack: { ...fighter.attack, impacted: true } } }
}

/** The same projectile cannot hit a pigeon and its protected body in one frame. */
export function interceptBiohazardProjectile(
  state: FightState,
  flight: { projectile: FightProjectile; previousX: number },
): { state: FightState; intercepted: boolean } {
  const { projectile, previousX } = flight
  const owner = projectile.owner === 'player' ? 'opponent' : 'player'
  const box = {
    left: Math.min(previousX, projectile.x) - projectile.width,
    right: Math.max(previousX, projectile.x) + projectile.width,
    bottom: projectile.y - projectile.height,
    top: projectile.y + projectile.height,
  }
  const object = state[owner].biohazard?.objects.find(
    (o) => ['flying', 'returning'].includes(o.phase) && boxesOverlap(box, biohazardBox(o)),
  )
  if (!object) return { state, intercepted: false }
  const damage = isFirearmProjectile(projectile)
    ? 0
    : projectile.damage * (projectile.nenPower ?? 1)
  return { state: damageObject(state, owner, { object, damage }), intercepted: true }
}

function damageObject(
  state: FightState,
  owner: FightSide,
  impact: { object: BiohazardObject; damage: number },
): FightState {
  if (impact.damage <= 0) return state
  const fighter = state[owner]
  const durability = Math.max(0, impact.object.durability - impact.damage)
  const object = {
    ...impact.object,
    durability,
    phase: durability === 0 ? ('broken' as const) : ('returning' as const),
  }
  return {
    ...state,
    [owner]: {
      ...fighter,
      biohazard: {
        objects: fighter.biohazard!.objects.map((o) => (o.id === object.id ? object : o)),
      },
    },
  }
}
