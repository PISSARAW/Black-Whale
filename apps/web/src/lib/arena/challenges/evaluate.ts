import { eventsFromReplay, playReplay } from '../replay/player'
import type { ArenaReplay } from '../replay/types'
import type { ArenaStats } from '../progression'
import type { CombatAction, CombatState } from '../../combat/types'
import type { ArenaChallenge, ChallengeObjective, ChallengeResult } from './types'

export function evaluateChallenge(challenge: ArenaChallenge, replay: ArenaReplay): ChallengeResult {
  const final = playReplay(replay).state
  const satisfied = challenge.objectives.map((objective) => evaluate(objective, replay, final))
  return resultOf(satisfied)
}

export interface LiveChallengeReading {
  state: CombatState
  actions: Partial<Record<CombatAction['type'], number>>
  stats: ArenaStats
}

/** Gives immediate, honest feedback without waiting for the bout to end. */
export function evaluateChallengeProgress(
  challenge: ArenaChallenge,
  reading: LiveChallengeReading,
): ChallengeResult {
  const satisfied = challenge.objectives.map((objective) => evaluateLive(objective, reading))
  return resultOf(satisfied)
}

function evaluate(
  objective: ChallengeObjective,
  replay: ArenaReplay,
  final: ReturnType<typeof playReplay>['state'],
): boolean {
  if (objective.kind === 'win') return final.outcome === 'won'
  if (objective.kind === 'aura') return final.player.aura >= objective.minimum
  if (objective.kind === 'use') {
    return (
      replay.commands.filter((command) => command.action.type === objective.action).length >=
      objective.count
    )
  }
  const events = eventsFromReplay(replay)
  const playerEvents = events.filter((event) => event.attacker === 'player')
  if (objective.kind === 'accuracy') {
    if (playerEvents.length === 0) return false
    const hits = playerEvents.filter(
      (event) => event.impact !== 'miss' && event.impact !== 'blocked',
    )
    return hits.length / playerEvents.length >= objective.minimum
  }
  return (
    events.filter((event) => event.attacker === 'opponent' && event.impact === 'blocked').length >=
    objective.count
  )
}

function evaluateLive(objective: ChallengeObjective, reading: LiveChallengeReading): boolean {
  if (objective.kind === 'win') return reading.state.outcome === 'won'
  if (objective.kind === 'aura') return reading.state.player.aura >= objective.minimum
  if (objective.kind === 'use') return (reading.actions[objective.action] ?? 0) >= objective.count
  if (objective.kind === 'accuracy') {
    return (
      reading.stats.attacks > 0 && reading.stats.hits / reading.stats.attacks >= objective.minimum
    )
  }
  return reading.stats.blocks >= objective.count
}

function resultOf(satisfied: boolean[]): ChallengeResult {
  const ratio = satisfied.filter(Boolean).length / satisfied.length
  return {
    complete: satisfied.every(Boolean),
    satisfied,
    grade: ratio === 1 ? 'S' : ratio >= 0.75 ? 'A' : ratio >= 0.5 ? 'B' : 'C',
  }
}
