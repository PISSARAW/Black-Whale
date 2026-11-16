import type { PvpCommand, PvpInputPacket } from './types'

export interface PredictedIntent {
  id: number
  frame: number
  command: PvpCommand
  sequence?: number
}
export interface PredictedFrame {
  frame: number
  input: number
}
const LIMIT = 120
/** Private local journal. No client frame, position or simulation result goes onto the wire. */
export function createPredictionHistory() {
  let frames: PredictedFrame[] = []
  let intents: PredictedIntent[] = []
  const sent = new Map<number, number>()
  let nextId = 0
  return {
    command(command: PvpCommand, frame: number) {
      const intent = { id: ++nextId, frame, command }
      intents.push(intent)
      intents = intents.slice(-64)
      return intent.id
    },
    record(frame: number, input: number) {
      frames.push({ frame, input })
      frames = frames.slice(-LIMIT)
    },
    sent(packet: PvpInputPacket, ids: number[], frame: number) {
      if (sent.has(packet.sequence)) return
      sent.set(packet.sequence, frame)
      for (const intent of intents) if (ids.includes(intent.id)) intent.sequence = packet.sequence
      if (sent.size > LIMIT) sent.delete(sent.keys().next().value!)
    },
    acknowledge(sequence: number) {
      const frame = sent.get(sequence - 1)
      intents = intents.filter(
        (intent) => intent.sequence === undefined || intent.sequence >= sequence,
      )
      for (const key of sent.keys()) if (key < sequence - 1) sent.delete(key)
      return frame
    },
    commands(frame: number, base: number) {
      return intents
        .filter((intent) => Math.max(base + 1, intent.frame) === frame)
        .map((intent) => intent.command)
    },
    input(frame: number, fallback: number) {
      return frames.find((entry) => entry.frame === frame)?.input ?? fallback
    },
    clear() {
      frames = []
      intents = []
      sent.clear()
    },
    get firstFrame() {
      if (sent.size) return Math.min(...sent.values())
      return intents.length ? Math.min(...intents.map((intent) => intent.frame)) - 1 : undefined
    },
    get pending() {
      return intents.length
    },
  }
}
