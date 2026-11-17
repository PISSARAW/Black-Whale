import { boundedInteger, record, parsePvpPacket, parsePvpPackets } from './protocol'

/** The generation comes from the server; client timestamps and simulation patches are forbidden. */
export function parsePvpControlUpload(value: unknown) {
  if (!record(value) || !['input', 'inputs'].includes(String(value.kind))) return null
  const field = value.kind === 'input' ? 'packet' : 'packets'
  if (!Object.keys(value).every((key) => ['kind', 'round', 'inputEpoch', field].includes(key)))
    return null
  if (
    !boundedInteger(value.round, Number.MAX_SAFE_INTEGER) ||
    !boundedInteger(value.inputEpoch, Number.MAX_SAFE_INTEGER)
  )
    return null
  const packets =
    value.kind === 'input' ? singlePacket(value.packet) : parsePvpPackets(value.packets)
  return packets ? { round: value.round, inputEpoch: value.inputEpoch, packets } : null
}

function singlePacket(value: unknown) {
  const packet = parsePvpPacket(value)
  return packet ? [packet] : null
}
