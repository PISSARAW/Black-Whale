import { activeHitbox, attackData, boxesOverlap, otherSide } from './frameData'
import { arenaObjects } from './arenaActions'
import { updateEntity } from './preparationWorld'
import { advanceArenaUtility, advanceArenaTether } from './arenaUtility'
import { recordFightDeath } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import { hatsuDamageFactor } from './hatsu'
import { remotePunchCanHit } from './remotePunch'
import { hasBashoPoem } from './bashoPoem'
import { sleepingBody, wakeHanzoBody } from './hanzoProjection'
import { nenDamageFactor } from './nen'
import type { PreparedEntity } from './preparationTypes'
import type { FightInput, FightProjectile, FightSide, FightState } from './types'

export const arenaBox = (entry: PreparedEntity) => ({
  left: entry.x - entry.arena!.width,
  right: entry.x + entry.arena!.width,
  bottom: entry.y,
  top: entry.y + entry.arena!.height,
})

export function readArenaInputs(
  state: FightState,
  inputs: { player: FightInput; opponent?: FightInput },
  activate: (state: FightState, side: FightSide) => FightState,
): FightState {
  if (!state.arena) return state
  for (const side of ['player', 'opponent'] as const) {
    const held = Boolean(inputs[side]?.arena)
    if (held && !state.arena!.held[side]) state = activate(state, side)
    state = { ...state, arena: { ...state.arena!, held: { ...state.arena!.held, [side]: held } } }
  }
  return state
}

export function advanceArena(state: FightState): FightState {
  if (!state.arena) return state
  for (const side of ['player', 'opponent'] as const) {
    state = advanceArenaUtility(state, side)
    state = advanceArenaTether(state, side)
    state = burnArenaWithSun(state, side)
  }
  return resolveMarkedContact(burnArenaObjects(state))
}

function burnArenaWithSun(state: FightState, side: FightSide): FightState {
  const sun = state[side].hatsuEffects.painPacker?.sun
  if (!sun || sun.age <= 0 || sun.age % 15 !== 0) return state
  for (const entry of arenaObjects(state))
    if (Math.hypot(entry.x - sun.x, entry.y + entry.arena!.height - sun.y) <= sun.radius)
      state = damageArenaObject(state, entry.id, sun.damage)
  return state
}

function burnArenaObjects(state: FightState): FightState {
  for (const entry of arenaObjects(state)) {
    if (!entry.arena?.burning) continue
    state = updateEntity(state, entry.id, {
      arena: { ...entry.arena, burning: entry.arena.burning - 1 },
    })
    if (state.frame % 15 === 0) state = damageArenaObject(state, entry.id, 5)
  }
  return state
}

/** Swept movement cannot tunnel through a crate. Hanzo's projection is intangible. */
export function collideArenaBodies(before: FightState, after: FightState): FightState {
  if (!after.arena) return after
  for (const side of ['player', 'opponent'] as const) {
    const fighter = after[side]
    if (fighter.hanzoProjection || fighter.y >= 8) continue
    let x = fighter.x
    for (const entry of arenaObjects(after)) x = avoidCrate(before[side].x, x, entry)
    if (x !== fighter.x) after = { ...after, [side]: { ...fighter, x } }
  }
  return after
}

function avoidCrate(previousX: number, x: number, entry: PreparedEntity): number {
  const half = entry.arena!.width + 2.5
  if (previousX <= entry.x - half && x > entry.x - half) return entry.x - half
  if (previousX >= entry.x + half && x < entry.x + half) return entry.x + half
  if (Math.abs(x - entry.x) < half) return entry.x + (previousX < entry.x ? -half : half)
  return x
}

/** Only actual damaging hitboxes break matter. Sensory/contact-only Hatsu do not damage crates. */
export function resolveArenaStrikes(state: FightState): FightState {
  if (!state.arena) return state
  for (const side of ['player', 'opponent'] as const) state = strikeArenaObject(state, side)
  return state
}

function arenaStrikeTarget(state: FightState, side: FightSide) {
  const fighter = state[side]
  const attack = fighter.attack
  const box = activeHitbox(fighter)
  if (!attack || !box || attack.impacted || !damagesMatter(fighter)) return undefined
  const target = arenaObjects(state)
    .filter((entry) => boxesOverlap(box, arenaBox(entry)))
    .sort((a, b) => Math.abs(a.x - fighter.x) - Math.abs(b.x - fighter.x))[0]
  if (!target || Math.abs(target.x - fighter.x) > Math.abs(state[otherSide(side)].x - fighter.x))
    return undefined
  return target
}

function damagesMatter(fighter: FightState['player']): boolean {
  const attack = fighter.attack!
  if (attack.hatsuSource === 'kurapika') return attack.moveId === 'kurapika:forwardSpecial'
  if (attack.kind !== 'special' || !attack.hatsuSource) return true
  return ['phinks', 'gel', 'padaille', 'benjamin'].includes(attack.hatsuSource)
}

function strikeArenaObject(state: FightState, side: FightSide): FightState {
  const target = arenaStrikeTarget(state, side)
  if (!target) return state
  const fighter = state[side]
  const attack = fighter.attack!
  const data = attackData(attack.kind, fighter)
  if (data.damage <= 0) return state
  state = damageArenaObject(state, target.id, data.damage * hatsuDamageFactor(fighter))
  state = ignitePunchedObject(state, side, target.id)
  return { ...state, [side]: { ...state[side], attack: { ...attack, impacted: true } } }
}

function ignitePunchedObject(state: FightState, side: FightSide, objectId: string): FightState {
  const fighter = state[side]
  if (!fighter.bashoPoem?.ready || fighter.attack?.kind !== 'light' || !hasBashoPoem(fighter))
    return state
  const object = state.battlefield!.entities.find((entry) => entry.id === objectId)!
  return updateEntity(state, object.id, { arena: { ...object.arena!, burning: 90 } })
}

export function damageArenaObject(state: FightState, id: string, damage: number): FightState {
  const entry = state.battlefield?.entities.find((object) => object.id === id)
  return entry ? updateEntity(state, id, { health: Math.max(0, entry.health - damage) }) : state
}

/** Swept projectile collision runs before body collision; the same shot cannot hit both. */
export function interceptArenaProjectile(
  state: FightState,
  projectile: FightProjectile,
  previousX: number,
) {
  if (
    !state.arena ||
    !remotePunchCanHit(projectile) ||
    projectile.living ||
    projectile.kallutoPaper
  )
    return { state, intercepted: false }
  const candidates = arenaObjects(state)
    .filter((entry) => {
      const box = arenaBox(entry)
      return (
        projectile.y + projectile.height >= box.bottom &&
        projectile.y - projectile.height <= box.top &&
        Math.max(previousX, projectile.x) + projectile.width >= box.left &&
        Math.min(previousX, projectile.x) - projectile.width <= box.right
      )
    })
    .sort((a, b) => Math.abs(a.x - previousX) - Math.abs(b.x - previousX))
  const target = candidates[0]
  if (!target) return { state, intercepted: false }
  const defender = state[otherSide(projectile.owner)]
  if (Math.abs(defender.x - previousX) + 3 < Math.abs(target.x - previousX))
    return { state, intercepted: false }
  return {
    state: damageArenaObject(state, target.id, projectile.damage * (projectile.nenPower ?? 1)),
    intercepted: !projectile.jupiter,
  }
}

function resolveMarkedContact(state: FightState): FightState {
  const objects = arenaObjects(state)
  for (const sun of objects.filter((entry) => entry.arena!.sun)) {
    const moon = objects.find(
      (entry) =>
        entry.id !== sun.id &&
        entry.arena!.moon &&
        entry.arena!.moon === sun.arena!.sun &&
        Math.abs(entry.x - sun.x) <= entry.arena!.width + sun.arena!.width + 0.15,
    )
    if (!moon) continue
    const owner = sun.arena!.sun!
    const centre = (sun.x + moon.x) / 2
    state = damageArenaObject(damageArenaObject(state, sun.id, sun.health), moon.id, moon.health)
    for (const side of ['player', 'opponent'] as const)
      state = applyArenaBlast(state, { side, owner, centre })
    return resolveFightOutcome(state)
  }
  return state
}

function applyArenaBlast(
  state: FightState,
  blast: { side: FightSide; owner: FightSide; centre: number },
): FightState {
  const { side, owner, centre } = blast
  const fighter = state[side]
  const body = sleepingBody(fighter)
  if (Math.hypot(body.x - centre, body.y) > 12 || fighter.wakeupInvulnerableFrames > 0) return state
  const damage = Math.max(
    1,
    Math.round((fighter.blocking ? 5 : 20) * nenDamageFactor(body, 'torso')),
  )
  state = {
    ...state,
    [side]: {
      ...wakeHanzoBody(fighter),
      health: Math.max(0, fighter.health - damage),
      hitStun: fighter.blocking ? 0 : 12,
    },
  }
  return recordFightDeath(state, {
    victimSide: side,
    killerSide: side === owner ? null : owner,
    cause: 'strike',
  })
}
