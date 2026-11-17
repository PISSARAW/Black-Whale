import type { FightState, FighterId } from '../types'
import { encounterIds, soloEncounter, SURVIVAL_FIGHTERS, SOLO_ROUTES } from './catalogue'
import {
  initialSoloObjective,
  validSoloFrame,
  observeSoloObjective,
  objectiveSucceeded,
  scoreSoloFrame,
  crateAlive,
  freshImpact,
} from './objectives'
import { createSoloFight, soloCarry } from './setup'
import type { SoloRun, SoloMode, SoloRouteId } from './types'
export function newSoloRun(options: {
  mode: SoloMode
  route: SoloRouteId
  fighter: FighterId
  id?: string
  seed?: number
}): SoloRun {
  if (options.mode === 'survival' && !SURVIVAL_FIGHTERS.includes(options.fighter))
    throw Error('UNSUPPORTED_SOLO_FIGHTER')
  if (!SOLO_ROUTES.some((r) => r.id === options.route)) throw Error('INVALID_SOLO_ROUTE')
  const run: SoloRun = {
    ...options,
    id: options.id ?? crypto.randomUUID(),
    seed: options.seed ?? 71717,
    index: 0,
    status: 'briefing',
    elapsed: 0,
    score: 0,
    results: [],
    objective: { start: 0, lastFrame: 0, lastImpact: 0, held: 0, contact: false, threat: false },
    failure: null,
  }
  const state = createSoloFight(run)
  return { ...run, objective: initialSoloObjective(state) }
}
export function observeSoloRun(run: SoloRun, before: FightState, after: FightState): SoloRun {
  if (run.status !== 'playing') return run
  if (!validSoloFrame(run, after)) return { ...run, status: 'failed', failure: 'invalid' }
  if (sameObservation(run, before, after)) return run
  const encounter = soloEncounter(run)
  const next = {
    ...run,
    elapsed: run.elapsed + 1,
    score: run.score + scoreSoloFrame(before, after),
    objective: observeSoloObjective(run, before, after),
  }
  const failure = failedObjective(encounter, { before, after })
  if (failure) return { ...next, status: 'failed', failure }
  const timed = timedBudget(next, after)
  if (timed) return timed
  if (objectiveSucceeded(next, encounter, after)) return winEncounter(next, after)
  if (after.phase === 'finished') return { ...next, status: 'failed', failure: 'objective' }
  if (timeExpired(next, after)) return { ...next, status: 'failed', failure: 'timeout' }
  return next
}
function sameObservation(run: SoloRun, before: FightState, after: FightState) {
  return after.frame === run.objective.lastFrame && before.phase === after.phase
}
function failedObjective(
  encounter: ReturnType<typeof soloEncounter>,
  frames: { before: FightState; after: FightState },
): SoloRun['failure'] {
  const s = frames.after
  if (s.catsName || s.parallelFuture) return null
  if (s.player.health <= 0 || (s.phase === 'finished' && s.winner !== 'player')) return 'defeat'
  return failedProtection(encounter, frames)
}
function failedProtection(
  encounter: ReturnType<typeof soloEncounter>,
  frames: { before: FightState; after: FightState },
): SoloRun['failure'] {
  const s = frames.after
  if (encounter.goal === 'protect-crate' && !crateAlive(s)) return 'object-lost'
  const hit = freshImpact(frames.before, s)
  if (
    encounter.goal === 'protect-body' &&
    hit?.attacker === 'opponent' &&
    !hit.blocked &&
    hit.damage > 0
  )
    return 'defeat'
  return null
}
function timedBudget(run: SoloRun, state: FightState): SoloRun | null {
  if (state.catsName || state.parallelFuture) return null
  if (run.elapsed < 10800) return null
  if (run.mode === 'time-attack') return { ...run, status: 'failed', failure: 'timeout' }
  if (run.mode === 'score-attack') return { ...run, status: 'complete' }
  return null
}
function timeExpired(run: SoloRun, state: FightState) {
  if (state.catsName || state.parallelFuture) return false
  if (run.mode === 'time-attack' && run.elapsed >= 10800) return true
  return state.frame - run.objective.start >= soloEncounter(run).limit
}
function winEncounter(run: SoloRun, state: FightState): SoloRun {
  const encounter = soloEncounter(run),
    frames = state.frame - run.objective.start
  const previous = run.results.reduce((total, r) => total + r.score, 0)
  const score = run.score + 1000 + Math.max(0, Math.floor((encounter.limit - frames) / 60)) * 2
  const results = [...run.results, { encounter: encounter.id, frames, score: score - previous }]
  return {
    ...run,
    score,
    results,
    status: run.index === encounterIds(run).length - 1 ? 'complete' : 'won',
    carry: run.mode === 'survival' ? soloCarry(state) : undefined,
  }
}
export function nextSoloRun(run: SoloRun): SoloRun {
  if (run.status !== 'won') return run
  const next = { ...run, index: run.index + 1, status: 'briefing' as const }
  const state = createSoloFight(next)
  return { ...next, objective: initialSoloObjective(state) }
}
export function retrySoloRun(run: SoloRun): SoloRun {
  if (run.mode !== 'story' || run.status !== 'failed') return run
  const next = {
    ...run,
    status: 'briefing' as const,
    failure: null,
    elapsed: run.results.reduce((n, r) => n + r.frames, 0),
    score: run.results.reduce((n, r) => n + r.score, 0),
  }
  return { ...next, objective: initialSoloObjective(createSoloFight(next)) }
}
