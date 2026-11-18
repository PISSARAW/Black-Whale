import { gumSourceAvailable } from './bungeeSource'
import { advanceProjectileNen } from './nenProjectiles'
import { addGumLink, gumNetwork, ownedGumLinks, selectedGumLink } from './bungeeNetwork'
import { gumLimbPoint } from './bungeeGeometry'
import { fallingGumObject, MAX_GUM_LINKS, type GumLink } from './bungeeTypes'
import type { FightProjectile, FightSide, FightState } from './types'

export function armGumRecall(state: FightState, side: FightSide): FightState {
  const link = selectedGumLink(state, side)
  if (link?.target.kind !== 'projectile') return state
  const id = link.target.id
  return {
    ...state,
    projectiles: state.projectiles.map((shot) =>
      shot.id === id
        ? {
            ...shot,
            age: 0,
            gumFlight: {
              ...shot.gumFlight,
              mode: 'returning',
              struck: false,
              clearBeforeHit: Boolean(shot.gumFlight?.struck),
            },
          }
        : shot,
    ),
  }
}

/** Attach before the actual throw: only the existing physical projectile is bound. */
export function bindGumThrow(
  state: FightState,
  shot: FightProjectile,
): { state: FightState; shot: FightProjectile } {
  const prepared = state[shot.owner].gumThrowReady
  if (!prepared || shot.matter !== 'object' || shot.living) return { state, shot }
  const cleared = { ...state, [shot.owner]: { ...state[shot.owner], gumThrowReady: undefined } }
  if (
    !gumSourceAvailable(state, shot.owner, prepared) ||
    ownedGumLinks(state, shot.owner).length >= MAX_GUM_LINKS
  )
    return { state: cleared, shot }
  return {
    state: addGumLink(cleared, {
      side: shot.owner,
      target: { kind: 'projectile', id: shot.id },
      ...prepared,
    }),
    shot: { ...shot, gumFlight: { mode: 'outbound', struck: false } },
  }
}
export function gumProjectileLink(state: FightState, shot: FightProjectile): GumLink | undefined {
  return gumNetwork(state).links.find(
    (link) => link.target.kind === 'projectile' && link.target.id === shot.id,
  )
}
export function travelGumProjectile(
  state: FightState,
  shot: FightProjectile,
  step: number,
): FightProjectile {
  const mode = shot.gumFlight!.mode
  if (mode === 'falling') return fallObject(shot, step)
  const link = gumProjectileLink(state, shot)
  if (!link || !gumSourceAvailable(state, link.owner, link))
    return fallObject(fallingGumObject(shot), step)
  if (mode === 'returning') return recallObject(state, shot, { link, step })
  if (mode === 'held') {
    const point = gumLimbPoint(state, link.owner, link.limb)
    return { ...shot, ...point, velocityX: 0, velocityY: 0, age: 0 }
  }
  if (mode === 'resting') return { ...shot, age: 0 }
  const x = shot.x + shot.velocityX * step
  if (x <= 3 || x >= 97 || shot.age >= shot.lifetime - 1)
    return {
      ...shot,
      x: Math.max(3.1, Math.min(96.9, x)),
      velocityX: 0,
      age: 0,
      gumFlight: { ...shot.gumFlight!, mode: 'resting' },
    }
  return { ...shot, x, age: shot.age + 1 }
}
function recallObject(
  state: FightState,
  shot: FightProjectile,
  context: { link: GumLink; step: number },
): FightProjectile {
  const { link, step } = context
  const fighter = state[link.owner]
  if (fighter.hitStun || fighter.knockdownFrames || fighter.blockStun)
    return {
      ...shot,
      velocityX: 0,
      gumFlight: { ...shot.gumFlight!, mode: 'resting' },
    }
  const point = gumLimbPoint(state, link.owner, link.limb)
  const dx = point.x - shot.x,
    dy = point.y - shot.y,
    distance = Math.hypot(dx, dy)
  const travel = Math.min(distance, 74 * step)
  const other = state[link.owner === 'player' ? 'opponent' : 'player']
  const clear = Math.abs(shot.x - other.x) > 6 || Math.abs(shot.y - other.y - 7) > 9
  if (distance <= 1.5)
    return {
      ...shot,
      ...point,
      velocityX: 0,
      velocityY: 0,
      age: 0,
      gumFlight: { ...shot.gumFlight, mode: 'held', struck: true },
    }
  return {
    ...shot,
    x: shot.x + (dx / distance) * travel,
    y: shot.y + (dy / distance) * travel,
    velocityX: (dx / distance) * 74,
    velocityY: (dy / distance) * 74,
    age: 0,
    gumFlight: { ...shot.gumFlight!, clearBeforeHit: shot.gumFlight!.clearBeforeHit && !clear },
  }
}
function fallObject(shot: FightProjectile, step: number): FightProjectile {
  const velocityY = (shot.velocityY ?? 0) - 146 * step
  return {
    ...shot,
    y: Math.max(0.3, shot.y + velocityY * step),
    velocityY,
    velocityX: 0,
    age: shot.age + 1,
  }
}
export function gumProjectileCanHit(shot: FightProjectile): boolean {
  const flight = shot.gumFlight
  if (!flight) return true
  return (
    !flight.struck &&
    !flight.clearBeforeHit &&
    (flight.mode === 'outbound' || flight.mode === 'returning')
  )
}
export function settleGumProjectile(shot: FightProjectile, collided: boolean): FightProjectile {
  if (!collided || !shot.gumFlight) return shot
  const mode = shot.gumFlight.mode === 'outbound' ? 'resting' : shot.gumFlight.mode
  return {
    ...shot,
    gumFlight: { ...shot.gumFlight, mode, struck: true },
    ...(mode === 'resting' ? { velocityX: 0 } : {}),
  }
}

/** Recalling a real object never refreshes the aura already committed to its first throw. */
export function advanceGumObjectNen(shot: FightProjectile): FightProjectile {
  const auraAge = (shot.gumFlight?.auraAge ?? shot.age) + 1
  const aged = advanceProjectileNen({ ...shot, age: auraAge })
  return { ...aged, age: shot.age, gumFlight: { ...shot.gumFlight!, auraAge } }
}
