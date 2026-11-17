import { createInputPipeline } from '$lib/fighting/pvp/inputPipeline'
import { AuthoritativeClashMatch } from '$lib/fighting/pvp/serverMatch'
import { applyPvpCommand } from '$lib/fighting/pvp/commands'
import { tickFight } from '$lib/fighting/engine'
import { FIXED_STEP } from '$lib/fighting/fightClock'
import { packReplayInput, unpackReplayInput } from '$lib/fighting/fightReplayInput'
import { fightReplayHash } from '$lib/fighting/fightReplayHash'
import { createReplayRecorder } from '$lib/fighting/fightReplayRecorder'
import { createReplayPlayer } from '$lib/fighting/fightReplayPlayer'
import { localPerspective } from '$lib/fighting/pvp/view'
import { EMPTY_INPUT, type FightSide, type FightState } from '$lib/fighting/types'
import type { PvpCommand, PvpInputPacket } from '$lib/fighting/pvp/types'
import type { ReplayCommand } from '$lib/fighting/fightReplayTypes'

export interface ImpactIntent {
  frame: number
  side: FightSide
  command: PvpCommand
}
interface Options {
  initial: FightState
  intents: ImpactIntent[]
  inputs: (frame: number, side: FightSide) => number
  rtt: number
  serial?: boolean
  faults?: boolean
  frames?: number
}
const SIDES = ['player', 'opponent'] as const
const flush = async () => {
  for (let n = 0; n < 6; n++) await Promise.resolve()
}

/** Deterministic application-level latency lab using the production input sender/referee.
 * Results measure actual simulation contacts; no predicted pose counts as a hit. */
export async function runImpactNetwork(options: Options) {
  const server = new AuthoritativeClashMatch(structuredClone(options.initial))
  const recorder = createReplayRecorder(options.initial)!
  let reference = options.initial
  let now = 0,
    id = 0
  const pending = { player: [] as PvpCommand[], opponent: [] as PvpCommand[] }
  const inputs = { player: 0, opponent: 0 }
  const inputAt = { player: 0, opponent: 0 }
  const accepted: Array<{ side: FightSide; packet: PvpInputPacket; at: number }> = []
  const uploads: Array<{
    at: number
    side: FightSide
    packets: PvpInputPacket[]
    reply: (received?: number) => void
  }> = []
  const replies: Array<{ at: number; run: () => void }> = []
  const contacts: Array<{ frame: number; impact: FightState['impact']; move: string | undefined }> =
    []
  const applications: Array<{ frame: number; side: FightSide; command: PvpCommand }> = []
  const queues: Array<{ side: FightSide; command: PvpCommand; at: number }> = []
  const failures: string[] = []
  const faulted = new Set<string>()
  let lostUploads = 0,
    lostReceipts = 0,
    duplicateUploads = 0,
    lastImpact = 0

  function transport(side: FightSide, packets: PvpInputPacket[]) {
    return new Promise<void>((resolve) => {
      const tail = packets.at(-1)!.sequence
      const key = `${side}:${tail}`
      const jitter = options.rtt ? [0, 9, -7, 4, -3][tail % 5] : 0
      const droppedUpload = options.faults && tail === 1 && !faulted.has(key)
      const droppedReceipt = options.faults && tail === 3 && !faulted.has(key)
      if (droppedUpload || droppedReceipt) faulted.add(key)
      if (droppedUpload) {
        lostUploads++
        replies.push({ at: now + options.rtt + 150, run: resolve })
        return
      }
      if (droppedReceipt) lostReceipts++
      uploads.push({
        at: now + Math.max(0, options.rtt / 2 + jitter),
        side,
        packets,
        reply: (received = server.nextSequence(side)) => {
          if (!droppedReceipt) senders[side].acknowledge(received)
          resolve()
        },
      })
    })
  }
  const senders = Object.fromEntries(
    SIDES.map((side) => [
      side,
      createInputPipeline({
        now: () => now,
        send: (packets) => transport(side, packets),
        sent: () => {},
        failed: (error) => failures.push(String(error)),
      }),
    ]),
  ) as Record<FightSide, ReturnType<typeof createInputPipeline>>
  const serial = {
    player: {
      busy: false,
      pending: [] as PvpCommand[],
      sequence: 0,
      input: 0,
      sentAt: -Infinity,
      tokens: 3,
      tokenAt: 0,
    },
    opponent: {
      busy: false,
      pending: [] as PvpCommand[],
      sequence: 0,
      input: 0,
      sentAt: -Infinity,
      tokens: 3,
      tokenAt: 0,
    },
  }
  function sendSerial(side: FightSide, input: number) {
    const state = serial[side]
    if (state.busy) return
    state.tokens = Math.min(3, state.tokens + Math.max(0, now - state.tokenAt) * 0.02)
    state.tokenAt = now
    const urgent = state.pending.length > 0 || input !== state.input
    if (state.tokens < 1 || (!urgent && now - state.sentAt < 50)) return
    state.tokens--
    state.sentAt = now
    state.input = input
    state.busy = true
    const packet = { sequence: state.sequence++, input, commands: state.pending.splice(0, 8) }
    void transport(side, [packet]).finally(() => {
      state.busy = false
    })
  }
  function deliver(frame: number) {
    uploads.sort((a, b) => a.at - b.at)
    while (uploads[0]?.at <= now + 1e-6) {
      const upload = uploads.shift()!
      for (const packet of upload.packets) {
        const result = server.submit(upload.side, packet, now)
        if (result === 'duplicate') {
          duplicateUploads++
          continue
        }
        if (result !== 'accepted') {
          failures.push(result)
          break
        }
        accepted.push({ side: upload.side, packet: structuredClone(packet), at: now })
        pending[upload.side].push(...packet.commands)
        inputs[upload.side] = packet.input
        inputAt[upload.side] = now
      }
      const received = server.nextSequence(upload.side)
      replies.push({ at: now + options.rtt / 2, run: () => upload.reply(received) })
    }
    for (const side of SIDES) {
      const commands = pending[side].splice(0, 8)
      for (const command of commands) applications.push({ frame, side, command })
    }
  }
  let hashesMatch = true
  const total = options.frames ?? 240
  function enqueue(frame: number) {
    for (const intent of options.intents.filter((intent) => intent.frame === frame)) {
      queues.push({ side: intent.side, command: intent.command, at: now })
      if (options.serial) serial[intent.side].pending.push(intent.command)
      else if (!senders[intent.side].queue(intent.command, () => ++id)) failures.push('QUEUE_FULL')
    }
    for (const side of SIDES) {
      const input = options.inputs(frame, side)
      if (options.serial) sendSerial(side, input)
      else void senders[side].send(input)
    }
  }
  function simulate(frame: number) {
    const before = reference
    const commands = applications.filter((entry) => entry.frame === frame)
    for (const entry of commands) reference = applyPvpCommand(reference, entry.side, entry.command)
    for (const side of SIDES) if (now - inputAt[side] > 250) inputs[side] = 0
    reference = tickFight(reference, unpackReplayInput(inputs.player), {
      dt: FIXED_STEP,
      ai: false,
      opponentInput: unpackReplayInput(inputs.opponent),
    })
    server.advance(now)
    if (frame % 30 === 0)
      hashesMatch &&= fightReplayHash(reference) === fightReplayHash(server.snapshot())
    recorder.append(
      before,
      [
        FIXED_STEP,
        inputs.player,
        inputs.opponent,
        commands.map(({ side, command }): ReplayCommand => {
          if (command.kind !== 'move') throw Error('Lab replay requires semantic move commands')
          return { ...command, side }
        }),
      ],
      reference,
    )
  }
  function observeContact(frame: number) {
    if (reference.impact && reference.impact.sequence !== lastImpact) {
      lastImpact = reference.impact.sequence
      contacts.push({
        frame,
        impact: reference.impact,
        move: reference[reference.impact.attacker].attack?.moveId,
      })
    }
  }
  function deliverViews(frame: number) {
    // Private views arrive independently at 30 Hz; one in seven is deliberately skipped.
    if (frame % 2 === 0 && (!options.faults || frame % 14 !== 0))
      for (const side of SIDES) {
        const received = server.nextSequence(side)
        replies.push({ at: now + options.rtt / 2, run: () => senders[side].acknowledge(received) })
      }
    replies.sort((a, b) => a.at - b.at)
    while (replies[0]?.at <= now + 1e-6) replies.shift()!.run()
  }
  for (let frame = 0; frame < total; frame++) {
    now = frame * FIXED_STEP * 1000
    enqueue(frame)
    deliver(frame)
    simulate(frame)
    observeContact(frame)
    deliverViews(frame)
    await flush()
  }
  hashesMatch &&= fightReplayHash(reference) === fightReplayHash(server.snapshot())
  const tape = recorder.snapshot()!
  const replay = createReplayPlayer(tape)
  while (!replay.done) replay.advance(0.5)
  const replayMatches =
    !replay.error && fightReplayHash(replay.state) === fightReplayHash(reference)
  const stats = SIDES.map((side) => senders[side].stats)
  for (const side of SIDES) senders[side].stop()
  for (const upload of uploads) upload.reply()
  for (const reply of replies) reply.run()
  await flush()
  return {
    contacts,
    applications,
    accepted,
    queues,
    hashesMatch,
    replayMatches,
    failures,
    stats,
    lostUploads,
    lostReceipts,
    duplicateUploads,
    final: reference,
  }
}

export function mirrorNetworkFight(state: FightState, side: FightSide) {
  return side === 'player' ? state : (localPerspective(state, true) as FightState)
}
export const guardInput = packReplayInput({ ...EMPTY_INPUT, guard: true })
