import { bungeeVisible } from '../hisokaTechnique'
import { privateLynchReplies } from '../lynchInterrogation'
import { gyoSight } from '../nenPerception'
import type { FightState } from '../types'
import type { SoloRun, SoloEncounter, SoloObjective } from './types'
import { soloMarker } from './setup'
import { soloEncounter } from './catalogue'

export function initialSoloObjective(state: FightState): SoloObjective {
  return {
    start: state.frame,
    lastFrame: state.frame,
    lastImpact: state.impact?.sequence ?? 0,
    held: 0,
    contact: false,
    threat: false,
  }
}
export function validSoloFrame(run: SoloRun, state: FightState) {
  const marker = soloMarker(run)
  return (
    state.soloSession?.run === marker.run &&
    state.soloSession.encounter === marker.encounter &&
    supported(state) &&
    sameEncounter(run, state)
  )
}
function sameEncounter(run: SoloRun, state: FightState) {
  const encounter = soloEncounter(run)
  return (
    state.player.id === (encounter.player === 'selected' ? run.fighter : encounter.player) &&
    state.opponent.id === encounter.opponent &&
    state.environment.stageId === encounter.stage
  )
}
function supported(state: FightState) {
  return (
    state.mode === 'versus-ai' &&
    !state.training &&
    !state.pvpSeat &&
    !state.spectatorView &&
    !state.teamMatch &&
    !state.replayPractice &&
    !state.forecastSimulation
  )
}
export function observeSoloObjective(
  run: SoloRun,
  before: FightState,
  after: FightState,
): SoloObjective {
  const p = run.objective,
    hit = freshImpact(before, after)
  return {
    ...p,
    lastFrame: after.frame,
    lastImpact: after.impact?.sequence ?? p.lastImpact,
    held: hiddenDetected(after) ? p.held + 1 : 0,
    contact: p.contact || interruptedPreparation(before, after),
    threat: p.threat || Boolean(hit?.attacker === 'opponent'),
  }
}
function hiddenDetected(state: FightState) {
  return Boolean(
    state.bungeeGum?.hidden && gyoSight(state.player) && bungeeVisible(state, 'player'),
  )
}
function interruptedPreparation(before: FightState, after: FightState) {
  const hit = freshImpact(before, after)
  return Boolean(hit?.attacker === 'player' && !hit.blocked && before.opponent.cyclotronWindup)
}
export function objectiveSucceeded(run: SoloRun, encounter: SoloEncounter, state: FightState) {
  if (state.catsName || state.parallelFuture) return false
  return checks[encounter.goal](run, state, encounter)
}
type Check = (run: SoloRun, state: FightState, encounter: SoloEncounter) => boolean
const checks: Record<SoloEncounter['goal'], Check> = {
  reveal: (r, s) =>
    r.objective.held >= 30 && Boolean(s.bungeeGum?.hidden && bungeeVisible(s, 'player')),
  interrupt: (r, s) =>
    r.objective.contact &&
    !s.opponent.cyclotronWindup &&
    s.opponent.hatsuEffects.cyclotronTurns === 0,
  question: (r, s) =>
    privateLynchReplies(s, 'player').some(
      (reply) =>
        reply.frame > r.objective.start &&
        reply.questioner === 'player' &&
        reply.target === 'opponent',
    ),
  'protect-crate': (r, s, e) => crateAlive(s) && r.objective.threat && survived(r, s, e),
  'protect-body': (r, s) =>
    !s.player.hanzoProjection &&
    r.objective.threat &&
    Boolean(s.impact?.attacker === 'opponent' && s.impact.blocked && !s.impact.avoided),
  survive: (r, s, e) => s.player.health > 0 && r.objective.threat && survived(r, s, e),
  'win-round': (_r, s) => s.phase === 'finished' && s.winner === 'player',
}
function survived(run: SoloRun, state: FightState, encounter: SoloEncounter) {
  return (
    state.frame - run.objective.start >= (encounter.duration ?? 0) ||
    (state.phase === 'finished' && state.winner === 'player')
  )
}
export function crateAlive(state: FightState) {
  const crate = state.battlefield?.entities.find((e) => e.id === 'arena:crate:34')
  return Boolean(crate?.present && crate.health > 0)
}
export function freshImpact(before: FightState, after: FightState) {
  const hit = after.impact
  return hit && hit.sequence !== before.impact?.sequence && !hit.avoided && !hit.invulnerable
    ? hit
    : null
}
export function scoreSoloFrame(before: FightState, after: FightState) {
  if (after.parallelFuture || after.catsName) return 0
  const hit = freshImpact(before, after)
  if (!hit || hit.attacker !== 'player' || hit.blocked) return 0
  const damage = Math.min(hit.damage, Math.max(0, before.opponent.health - after.opponent.health))
  if (damage <= 0) return 0
  return (
    Math.floor(damage) +
    25 * Number(hit.counterHit) +
    25 * Number(hit.punish) +
    10 * Number(hit.antiAir)
  )
}
