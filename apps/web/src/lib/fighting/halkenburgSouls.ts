import { collectSoulBodies, promoteCohortBody, routeSoulBodies } from './halkenburgSoulBodies'
import { bodyInSoulLink, setSoulOccupant, soulBodyKey } from './halkenburgSoulTypes'
import { readyCohort, updateEntity } from './preparationWorld'
import type { SoulBodyRecord } from './halkenburgSoulBodies'
import type { HalkenburgSoulLink } from './halkenburgSoulTypes'
import type { ProjectileHit } from './projectiles'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Real bodies and two distinct minds. No random roster draw, HP refill or Hatsu acquisition. */
export function applyHalkenburgSoulArrow(state: FightState, hit: ProjectileHit): FightState {
  if (!soulShotAdmitted(state, hit)) return state
  const shot = hit.projectile.halkenburgArrow!,
    side = hit.projectile.owner
  const bodies = collectSoulBodies(state),
    target = targetBody(bodies, state, hit)
  const source = participantBody(state, hit, bodies)
  const archer = bodies.find((record) => record.key === shot.archerBody)
  if (!archer || archer.body.health <= 0) return state
  if (!source || !target || !transferPairReady(state, source, target)) return state
  if (!bodies.includes(source)) {
    bodies.push(source)
    const id = source.body.halkCohortBody!
    state = updateEntity(state, id, { present: false, sleepingFrames: 0 })
  }
  state = appendSoulLink(state, { side, source, target })
  // Only the participating bodies are stopped; unrelated leaders retain their own action.
  source.body = { ...source.body, halkSoul: { ...source.body.halkSoul!, linked: true } }
  target.body = { ...target.body, halkSoul: { ...target.body.halkSoul!, linked: true } }
  archer.body = { ...archer.body, hatsuEffects: { ...archer.body.hatsuEffects, arrowNocked: 0 } }
  return settleLinks(state, bodies)
}
function appendSoulLink(
  state: FightState,
  pair: { side: FightSide; source: SoulBodyRecord; target: SoulBodyRecord },
): FightState {
  const { side, source, target } = pair
  const link: HalkenburgSoulLink = {
    id: (state.halkSoulLinks?.length ?? 0) + 1,
    owner: side,
    sourceBody: source.key,
    targetBody: target.key,
    sourceMind: source.body.halkSoul!.mind!,
    targetMind: target.body.halkSoul!.mind!,
    sourceSleep: 0,
    targetSleep: 0,
    preparedSedative: 0,
    phase: 'swapped',
  }
  const links = [...(state.halkSoulLinks ?? []), link]
  const origins = state.halkSoulOrigins ?? {
    player: state.player.halkenburgOrigin ?? state.player.id,
    opponent: state.opponent.halkenburgOrigin ?? state.opponent.id,
  }
  return { ...state, halkSoulLinks: links, halkSoulOrigins: origins }
}
function soulShotAdmitted(state: FightState, hit: ProjectileHit): boolean {
  return (
    state.phase === 'fighting' &&
    !state.teamMatch &&
    hit.projectile.halkenburgArrow?.mode === 'souls' &&
    !state.rosterProjection
  )
}
function targetBody(
  bodies: SoulBodyRecord[],
  state: FightState,
  hit: ProjectileHit,
): SoulBodyRecord | undefined {
  const key = hit.targetBody ? `guest:${hit.targetBody}` : soulBodyKey(state, hit.defenderSide)
  return bodies.find(
    (record) =>
      record.key === key ||
      (Boolean(hit.targetBody) && record.originalGuest?.id === hit.targetBody),
  )
}
function participantBody(
  state: FightState,
  hit: ProjectileHit,
  bodies: SoulBodyRecord[],
): SoulBodyRecord | undefined {
  const shot = hit.projectile.halkenburgArrow!,
    side = hit.projectile.owner
  if (shot.participant === `self:${side}`)
    return bodies.find((record) => record.key === shot.archerBody)
  const supporter = readyCohort(state, side).find((entry) => entry.id === shot.participant)
  return supporter ? promoteCohortBody(state, side, supporter) : undefined
}
function transferPairReady(
  state: FightState,
  source: SoulBodyRecord,
  target: SoulBodyRecord,
): boolean {
  return (
    target.originalGuest?.role !== 'puppet' &&
    source.key !== target.key &&
    eligibleBody(source.body) &&
    eligibleBody(target.body) &&
    !bodyInSoulLink(state, source.key) &&
    !bodyInSoulLink(state, target.key)
  )
}
function eligibleBody(body: ArcadeFighter): boolean {
  return (
    body.health > 0 &&
    !body.hanzoProjection &&
    !body.needlePuppet &&
    body.hatsuEffects.manipulatedFrames <= 0 &&
    body.hatsuEffects.possessedFrames <= 0
  )
}

/** The full-world referee calls this before judging an actual fatal impact. */
export function reconcileHalkenburgSouls(state: FightState): FightState {
  if (!state.halkSoulLinks?.length || state.rosterProjection) return state
  return settleLinks(state, collectSoulBodies(state))
}
export function advanceHalkenburgSouls(state: FightState): FightState {
  if (state.phase !== 'fighting' || !state.halkSoulLinks?.length || state.rosterProjection)
    return state
  const links = state.halkSoulLinks.map((link) => ({
    ...link,
    sourceSleep: Math.max(0, link.sourceSleep - 1),
    targetSleep: Math.max(0, link.targetSleep - 1),
    preparedSedative: Math.max(0, link.preparedSedative - 1),
  }))
  return reconcileHalkenburgSouls({ ...state, halkSoulLinks: links })
}
function settleLinks(state: FightState, bodies: SoulBodyRecord[]): FightState {
  const links = state.halkSoulLinks!.map((link) => settleLink(link, bodies))
  const routed = routeSoulBodies({ ...state, halkSoulLinks: links }, bodies)
  return {
    ...routed,
    player: principalSurvival(routed, 'player', bodies),
    opponent: principalSurvival(routed, 'opponent', bodies),
  }
}
function settleLink(link: HalkenburgSoulLink, bodies: SoulBodyRecord[]): HalkenburgSoulLink {
  const a = bodies.find((record) => record.key === link.sourceBody),
    b = bodies.find((record) => record.key === link.targetBody)
  if (!a || !b) return link
  if (b.body.health <= 0) return sourceLost(link, a, b)
  if (a.body.health <= 0) return cohabit(link, a, b)
  const sourceAwake = link.sourceSleep === 0 && !externalSleep(b.body)
  a.body = setSoulOccupant(
    a.body,
    link.targetMind,
    sourceAwake || link.targetSleep > 0 || externalSleep(a.body),
  )
  b.body = setSoulOccupant(b.body, link.sourceMind, !sourceAwake)
  return link
}
function sourceLost(
  link: HalkenburgSoulLink,
  a: SoulBodyRecord,
  b: SoulBodyRecord,
): HalkenburgSoulLink {
  a.body = setSoulOccupant(a.body, link.targetMind, link.targetSleep > 0 || externalSleep(a.body))
  b.body = setSoulOccupant(b.body, undefined, true)
  return { ...link, phase: a.body.health > 0 ? 'source-lost' : 'ended' }
}
function cohabit(
  link: HalkenburgSoulLink,
  a: SoulBodyRecord,
  b: SoulBodyRecord,
): HalkenburgSoulLink {
  const first = link.phase !== 'cohabiting'
  const targetSleep = first ? Math.max(link.targetSleep, link.preparedSedative) : link.targetSleep
  const targetAwake = targetSleep === 0
  a.body = setSoulOccupant(a.body, undefined, true)
  b.body = setSoulOccupant(
    b.body,
    targetAwake ? link.targetMind : link.sourceMind,
    (!targetAwake && link.sourceSleep > 0) || externalSleep(b.body),
  )
  return { ...link, targetSleep, preparedSedative: 0, phase: 'cohabiting' }
}
function principalSurvival(
  state: FightState,
  side: FightSide,
  bodies: SoulBodyRecord[],
): ArcadeFighter {
  const key = `mind:${side}`,
    link = state.halkSoulLinks!.find(
      (item) => item.sourceMind.key === key || item.targetMind.key === key,
    )
  if (!link) return { ...state[side], halkSoulAlive: state[side].health > 0 }
  const a = bodies.find((record) => record.key === link.sourceBody)!.body,
    b = bodies.find((record) => record.key === link.targetBody)!.body
  const alive = link.sourceMind.key === key ? b.health > 0 : a.health > 0 || b.health > 0
  return { ...state[side], halkSoulAlive: alive }
}

function externalSleep(body: ArcadeFighter): boolean {
  return Boolean(body.arsenalSleep) || (body.kurapika?.blackoutFrames ?? 0) > 0
}
