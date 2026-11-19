import { ghostwriterChannelReady } from './ghostwriterAccess'
import { ghostwriterOptions } from './ghostwriterAction'
import { traceArsenal } from './arsenalTrace'
import { performArsenalCommand } from './retrospectiveArsenal'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { FightState } from './types'

/** Prepare only what exists; the AI cannot create a client, handwriting, ink or a future. */
export function ghostwriterAi(state: FightState): FightState {
  if (state.opponent.id !== 'chrollo' || state.opponent.ghostwriterWriting) return state
  const sheet = state.battlefield?.entities.find(
    (entry) => entry.document?.fortuneSignature && entry.present && !entry.document.fortuneWritten,
  )
  if (!sheet) return state
  if (!state.opponent.writingKit) return takeNearbyKit(state)
  const option = ghostwriterOptions(state, 'opponent').find((entry) => entry.ready)
  if (!option && ghostwriterChannelReady(state, 'opponent')) return state
  const command: ArsenalCommand = option?.command ?? {
    action: 'history-page',
    target: 'lovely-ghostwriter',
  }
  const next = performArsenalCommand(state, 'opponent', command)
  return traceArsenal({ state, side: 'opponent', command }, next)
}
function takeNearbyKit(state: FightState): FightState {
  const actor = state.opponent
  const kit = state.battlefield?.entities.find(
    (entry) =>
      entry.writingKit && entry.present && Math.hypot(entry.x - actor.x, entry.y - actor.y) <= 4,
  )
  if (!kit) return state
  const command: ArsenalCommand = { action: 'writing-take', target: kit.id }
  return traceArsenal(
    { state, side: 'opponent', command },
    performArsenalCommand(state, 'opponent', command),
  )
}
