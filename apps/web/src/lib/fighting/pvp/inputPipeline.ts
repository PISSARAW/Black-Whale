import type { PvpCommand, PvpInputPacket } from './types'

export const INPUT_WINDOW = 8
export const INPUT_REQUESTS = 4
export const INPUT_RATE = 20
interface Intent {
  command: PvpCommand
  id: number
}
interface PipelineOptions {
  now: () => number
  send: (packets: PvpInputPacket[], signal: AbortSignal) => Promise<void>
  sent: (packet: PvpInputPacket, ids: number[]) => void
  failed: (error: unknown) => void
}
/** Cumulative, immutable uploads recover loss/reordering without waiting for a receipt.
 * Only server acknowledgements retire packets. No client tick or result is sent. */
export function createInputPipeline(options: PipelineOptions) {
  let pending: Intent[] = []
  let window: PvpInputPacket[] = []
  let nextSequence = 0
  let received = 0
  let lastInput = 0
  let lastSend = -Infinity
  let tokens = 3
  let tokenAt = options.now()
  let generation = 0
  let stopped = false
  let uploads = 0
  let retransmitted = 0
  let peakInFlight = 0
  const active = new Map<AbortController, number>()

  function acknowledge(sequence: number) {
    received = Math.max(received, sequence)
    nextSequence = Math.max(nextSequence, received)
    window = window.filter((packet) => packet.sequence >= received)
    // A private SSE view can acknowledge a request whose HTTP response is stalled.
    for (const [controller, last] of active)
      if (last < received) {
        active.delete(controller)
        controller.abort()
      }
  }
  function reset(sequence: number) {
    generation++
    for (const controller of active.keys()) controller.abort()
    active.clear()
    pending = []
    window = []
    received = sequence
    nextSequence = sequence
    lastInput = 0
    lastSend = -Infinity
  }
  function outstandingCommands() {
    return window.reduce((count, packet) => count + packet.commands.length, pending.length)
  }
  function allocate(input: number) {
    if (window.length >= INPUT_WINDOW) return
    const intents = pending.splice(0, 8)
    const packet = {
      sequence: nextSequence++,
      input,
      commands: intents.map(({ command }) => command),
    }
    window.push(packet)
    lastInput = input
    options.sent(
      packet,
      intents.map(({ id }) => id),
    )
  }
  function send(input: number, force = false): Promise<void> {
    if (stopped || active.size >= INPUT_REQUESTS) return Promise.resolve()
    const now = options.now()
    tokens = Math.min(3, tokens + (Math.max(0, now - tokenAt) * INPUT_RATE) / 1000)
    tokenAt = now
    const urgent = pending.length > 0 || input !== lastInput
    if (!force && (tokens < 1 || (!urgent && now - lastSend < 50))) return Promise.resolve()
    tokens = Math.max(0, tokens - 1)
    lastSend = now
    allocate(input)
    const packets = window.slice()
    if (!packets.length) return Promise.resolve()
    const controller = new AbortController()
    const current = generation
    active.set(controller, packets.at(-1)!.sequence)
    peakInFlight = Math.max(peakInFlight, active.size)
    uploads++
    retransmitted += Math.max(0, packets.length - 1)
    return options
      .send(packets, controller.signal)
      .catch((error) => {
        if (!controller.signal.aborted && current === generation) options.failed(error)
      })
      .finally(() => active.delete(controller))
  }
  return {
    queue(command: PvpCommand, id: () => number) {
      if (stopped || outstandingCommands() >= 8) return false
      // A caller cannot mutate an intention after it was sequenced or sent.
      pending.push({ command: { ...command }, id: id() })
      return true
    },
    send,
    acknowledge,
    reset,
    release() {
      pending = []
      // Already sent commands retain their original sequence until acknowledged.
    },
    stop() {
      stopped = true
      reset(received)
    },
    get stats() {
      return {
        uploads,
        retransmitted,
        peakInFlight,
        inFlight: active.size,
        unreceived: window.length,
        pending: pending.length,
        nextSequence,
      }
    },
  }
}
