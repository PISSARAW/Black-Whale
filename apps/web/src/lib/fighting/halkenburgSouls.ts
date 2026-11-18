import { collectSoulBodies, promoteCohortBody, routeSoulBodies } from './halkenburgSoulBodies'
import { controlledSoulKey, soulBodyKey } from './halkenburgSoulTypes'
import { exchangeSoulMinds, settleSoulGraph } from './halkenburgSoulGraph'
import { interruptSoulTeamRelays, syncSoulTeamSeats } from './halkenburgSoulTeams'
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
  if (!source || !target || !transferPairReady(source, target)) return state
  if (!bodies.includes(source)) {
    bodies.push(source)
    const id = source.body.halkCohortBody!
    state = updateEntity(state, id, { present: false, sleepingFrames: 0 })
  }
  const minds = exchangeSoulMinds({ state, bodies, source, target })
  state = { ...appendSoulLink(state, { side, source, target }), halkSoulMinds: minds }
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
  return interruptSoulTeamRelays({ ...state, halkSoulLinks: links, halkSoulOrigins: origins })
}
function soulShotAdmitted(state: FightState, hit: ProjectileHit): boolean {
  return (
    state.phase === 'fighting' &&
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
    return bodies.find(
      (record) =>
        record.key === shot.archerBody &&
        (!shot.participantMind || record.body.halkSoul?.mind?.key === shot.participantMind),
    )
  const supporter = readyCohort(state, side).find((entry) => entry.id === shot.participant)
  return supporter ? promoteCohortBody(state, side, supporter) : undefined
}
function transferPairReady(source: SoulBodyRecord, target: SoulBodyRecord): boolean {
  return (
    target.originalGuest?.role !== 'puppet' &&
    source.key !== target.key &&
    eligibleBody(source.body) &&
    eligibleBody(target.body) &&
    participantsPresent(source, target)
  )
}
function participantsPresent(source: SoulBodyRecord, target: SoulBodyRecord): boolean {
  return Boolean(source.body.halkSoul?.mind && target.body.halkSoul?.mind)
}
function eligibleBody(body: ArcadeFighter): boolean {
  return (
    body.health > 0 &&
    !body.halkSoul?.offstage &&
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
  const minds = state.halkSoulMinds?.map((item) => ({
    ...item,
    sleep: Math.max(0, item.sleep - 1),
  }))
  return reconcileHalkenburgSouls({ ...state, halkSoulLinks: links, halkSoulMinds: minds })
}
function settleLinks(state: FightState, bodies: SoulBodyRecord[]): FightState {
  const settled = settleSoulGraph(state, bodies)
  const routed = routeSoulBodies(settled, bodies)
  return syncSoulTeamSeats(
    {
      ...routed,
      player: principalSurvival(routed, 'player'),
      opponent: principalSurvival(routed, 'opponent'),
    },
    bodies,
  )
}
function principalSurvival(state: FightState, side: FightSide): ArcadeFighter {
  const key = controlledSoulKey(state, side)
  const item = state.halkSoulMinds?.find((item) => item.mind.key === key)
  const alive = item ? item.alive && !item.eliminated : state[side].health > 0
  return { ...state[side], halkSoulAlive: alive }
}
