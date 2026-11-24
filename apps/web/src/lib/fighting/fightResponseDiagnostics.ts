import { get, writable } from 'svelte/store'
import { commandFailure, type CommandFailure } from './commandFailure'
import { unpackReplayInput } from './fightReplayInput'
import type { ReplayCommand } from './fightReplayTypes'
import type { FightSide, FightState } from './types'

export type ResponseOutcome =
  'queued' | 'buffered' | 'executed' | 'refused' | 'expired' | 'cancelled'
export interface ResponseAttempt {
  id: number
  side: FightSide
  action: string
  round: number
  receivedFrame: number
  appliedFrame?: number
  executedFrame?: number
  queueMs?: number
  outcome: ResponseOutcome
  reason?: CommandFailure | 'replaced' | 'cleared' | 'reset' | 'buffer-expired' | 'queue-full'
}
type ActorCommand = Extract<ReplayCommand, { side: FightSide }>
interface Pending {
  id: number
  command: ActorCommand
  moveId?: string
  kind: string
}
interface Application {
  id: number | null
  command: ReplayCommand
  before: FightState
  after: FightState
  now: number
}
const SIDES = ['player', 'opponent'] as const

export function createResponseDiagnostics() {
  const rows = writable<ResponseAttempt[]>([])
  const arrivals = new Map<number, number>()
  let nextId = 0
  let pending: Partial<Record<FightSide, Pending>> = {}
  function update(id: number, value: Partial<ResponseAttempt>) {
    rows.update((entries) =>
      entries.map((entry) => (entry.id === id ? { ...entry, ...value } : entry)),
    )
  }
  function finish(side: FightSide, value: Partial<ResponseAttempt>) {
    const intent = pending[side]
    if (intent) update(intent.id, value)
    delete pending[side]
  }
  return {
    subscribe: rows.subscribe,
    receive(state: FightState, command: ReplayCommand, now: number): number | null {
      if (!('side' in command)) return null
      const id = ++nextId
      arrivals.set(id, now)
      rows.update((entries) =>
        [
          ...entries,
          {
            id,
            side: command.side,
            action: command.kind === 'move' ? command.action : command.kind,
            round: state.roundNumber,
            receivedFrame: state.frame,
            outcome: 'queued' as const,
          },
        ].slice(-80),
      )
      return id
    },
    applied({ id, command, before, after, now }: Application) {
      if (id === null || !('side' in command)) return
      const side = command.side
      const result = commandResult(before, after, command)
      const arrival = arrivals.get(id) ?? now
      arrivals.delete(id)
      update(id, { ...result, appliedFrame: before.frame, queueMs: Math.max(0, now - arrival) })
      if (result.outcome === 'buffered') {
        finish(side, { outcome: 'cancelled', reason: 'replaced' })
        pending[side] = pendingCommand(id, command, after)
      }
    },
    observeFrame(before: FightState, after: FightState) {
      for (const side of SIDES) {
        const intent = pending[side]
        if (!intent) continue
        if (intent.kind === 'hitstop') {
          if (after.directMoveBuffer?.[side]) continue
          const result = commandResult(before, after, intent.command)
          if (result.outcome === 'buffered') {
            pending[side] = pendingCommand(intent.id, intent.command, after)
          } else finish(side, result)
          continue
        }
        const resolution = bufferResolution(before, after, intent)
        if (resolution) finish(side, resolution)
      }
    },
    discard(id: number | null, reason: 'cleared' | 'queue-full') {
      if (id === null) return
      update(id, { outcome: 'cancelled', reason })
      arrivals.delete(id)
    },
    clearQueued() {
      for (const entry of get(rows))
        if (entry.outcome === 'queued')
          update(entry.id, { outcome: 'cancelled', reason: 'cleared' })
      arrivals.clear()
    },
    reset() {
      pending = {}
      arrivals.clear()
      rows.set([])
    },
  }
}
function pendingCommand(id: number, command: ActorCommand, state: FightState): Pending {
  const side = command.side
  if (state.directMoveBuffer?.[side]) return { id, command, kind: 'hitstop' }
  const buffer = state[side].bufferedAttack
  return { id, command, moveId: buffer?.moveId, kind: buffer?.kind ?? command.kind }
}
function commandResult(
  before: FightState,
  after: FightState,
  command: ActorCommand,
): Partial<ResponseAttempt> {
  if (queuedDuringHitstop(before, after, command.side)) return { outcome: 'buffered' }
  const feedback = after.commandFeedback?.[command.side]
  const fresh = feedback?.sequence !== before.commandFeedback?.[command.side]?.sequence
  if (fresh && feedback) {
    if (feedback.outcome === 'started') return { outcome: 'executed', executedFrame: before.frame }
    return { outcome: feedback.outcome, reason: feedback.reason }
  }
  return before === after
    ? { outcome: 'refused', reason: refusal(before, command) }
    : { outcome: 'executed', executedFrame: before.frame }
}
function queuedDuringHitstop(before: FightState, after: FightState, side: FightSide): boolean {
  const deferred = after.directMoveBuffer?.[side]
  return Boolean(deferred && deferred !== before.directMoveBuffer?.[side])
}
function bufferResolution(
  before: FightState,
  after: FightState,
  intent: Pending,
): Partial<ResponseAttempt> | null {
  const side = intent.command.side
  if (after.roundNumber !== before.roundNumber || after.frame < before.frame)
    return { outcome: 'cancelled', reason: 'reset' }
  if (bufferStarted(before, after, intent))
    return { outcome: 'executed', executedFrame: after.frame }
  if (after[side].bufferedAttack) return null
  const expired = (before[side].bufferedAttack?.bufferFrames ?? 1) <= 0
  return expired
    ? { outcome: 'expired', reason: 'buffer-expired' }
    : { outcome: 'refused', reason: refusal(after, intent.command) }
}
function bufferStarted(before: FightState, after: FightState, intent: Pending): boolean {
  const side = intent.command.side
  const current = after[side].attack
  if (!current || current.kind !== intent.kind || current.moveId !== intent.moveId) return false
  const previous = before[side].attack
  return !previous || current.frame < previous.frame || current.moveId !== previous.moveId
}
function refusal(state: FightState, command: ActorCommand): CommandFailure {
  return commandFailure(state, {
    side: command.side,
    action: command.kind === 'move' ? command.action : 'utility',
    ...(command.kind === 'move' ? { input: unpackReplayInput(command.input) } : {}),
  })
}
export type ResponseDiagnostics = ReturnType<typeof createResponseDiagnostics>
