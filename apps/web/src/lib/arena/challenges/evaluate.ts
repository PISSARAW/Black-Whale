import { eventsFromReplay, playReplay } from '../replay/player'
import type { ArenaReplay } from '../replay/types'
import type { ArenaChallenge, ChallengeObjective, ChallengeResult } from './types'

export function evaluateChallenge(challenge: ArenaChallenge, replay: ArenaReplay): ChallengeResult {
  const final = playReplay(replay).state
  const satisfied = challenge.objectives.map((objective) => evaluate(objective, replay, final))
  const ratio = satisfied.filter(Boolean).length / satisfied.length
  return {
    complete: satisfied.every(Boolean),
    satisfied,
    grade: ratio === 1 ? 'S' : ratio >= 0.75 ? 'A' : ratio >= 0.5 ? 'B' : 'C',
  }
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
