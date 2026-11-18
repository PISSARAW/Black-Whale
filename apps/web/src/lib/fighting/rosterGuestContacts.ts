import { settleHalkenburgArrow } from './hatsu/halkenburg'
import { separateFighterPushboxes } from './fighterPhysics'
import { resolveFightImpacts, resolveProjectileHit } from './combatImpact'
import { resolveFightOutcome } from './fightOutcome'
import { activeHitbox, boxesOverlap, hurtboxes } from './frameData'
import { guestProjection, mergeGuestProjection, type RosterGuest } from './rosterGuests'
import type { ProjectileHit } from './projectiles'
import type { FightProjectile, FightState } from './types'

/** Resolve the nearer extra body before the leader, consuming the same strike once. */
export function resolveGuestFirstContacts(state: FightState): FightState {
  let next = state
  for (const guest of state.rosterGuests ?? []) {
    if (guest.phase === 'eliminated') continue
    const enemySide = guest.owner === 'player' ? 'opponent' : 'player'
    const enemy = next[enemySide]
    if (!enemy.attack || enemy.attack.impacted) continue
    if (Math.abs(enemy.x - guest.fighter.x) >= Math.abs(enemy.x - next[guest.owner].x)) continue
    const hitbox = activeHitbox(enemy)
    if (!hitbox || !hurtboxes(guest.fighter).some((box) => boxesOverlap(hitbox, box))) continue
    const view = guestProjection(next, guest)
    const result = resolveFightOutcome(
      resolveFightImpacts({ ...view, [guest.owner]: { ...guest.fighter, attack: null } }, []),
    )
    next = mergeGuestProjection(
      next,
      { ...result, [guest.owner]: { ...result[guest.owner], attack: guest.fighter.attack } },
      guest,
    )
  }
  return next
}

/** Pair contacts reuse ordinary guards, scaling, hitstun and death attribution. */
export function resolveRosterGuestContacts(state: FightState): FightState {
  let next = state
  for (const guest of state.rosterGuests ?? []) {
    if (guest.phase === 'eliminated') continue
    const view = guestProjection(next, guest)
    const contact = resolveFightOutcome(resolveFightImpacts(view, []))
    const bodies = separateFighterPushboxes(contact.player, contact.opponent)
    next = mergeGuestProjection(next, { ...contact, ...bodies }, guest)
  }
  return resolveFightOutcome(next)
}

export function rosterProjectileTarget(
  state: FightState,
  options: { projectile: FightProjectile; main: { x: number; y: number } | null },
  collide: (shot: FightProjectile, body: RosterGuest['fighter']) => { x: number; y: number } | null,
): { position: { x: number; y: number }; targetBody?: string } | null {
  const { projectile, main } = options
  const choices = (state.rosterGuests ?? [])
    .filter((guest) => guest.owner !== projectile.owner && guest.phase !== 'eliminated')
    .flatMap((guest) => {
      const point = collide(projectile, guest.fighter)
      return point ? [{ position: point, targetBody: guest.id }] : []
    })
  const all: { position: { x: number; y: number }; targetBody?: string }[] = main
    ? [{ position: main }, ...choices]
    : choices
  return (
    all.sort((a, b) =>
      projectile.velocityX >= 0 ? a.position.x - b.position.x : b.position.x - a.position.x,
    )[0] ?? null
  )
}

export function resolveRosterProjectileHits(
  state: FightState,
  hits: readonly ProjectileHit[],
): FightState {
  let next = state
  for (const hit of hits) {
    if (!hit.targetBody && !hit.projectile.sourceBody) continue
    next =
      hit.projectile.halkenburgArrow?.mode === 'souls'
        ? settleHalkenburgArrow(next, hit)
        : resolveGuestProjectile(next, hit)
  }
  return next
}

function resolveGuestProjectile(state: FightState, hit: ProjectileHit): FightState {
  let next = state
  const source = next.rosterGuests?.find((guest) => guest.id === hit.projectile.sourceBody)
  const target = next.rosterGuests?.find((guest) => guest.id === hit.targetBody)
  let view = source ? guestProjection(next, source) : next
  if (target) view = guestProjection(view, target)
  const result = resolveFightOutcome(resolveProjectileHit(view, hit))
  if (source && target) {
    const sourceMerged = mergeGuestProjection(next, result, source)
    next = {
      ...sourceMerged,
      [target.owner]: next[target.owner],
      phase: next.phase,
      winner: next.winner,
      roundsWon: next.roundsWon,
      matchWinner: next.matchWinner,
      rosterGuests: sourceMerged.rosterGuests!.map((guest) =>
        guest.id === target.id ? { ...guest, fighter: result[target.owner] } : guest,
      ),
    }
  } else if (source) next = mergeGuestProjection(next, result, source)
  else if (target) next = mergeGuestProjection(next, result, target)
  return next
}
