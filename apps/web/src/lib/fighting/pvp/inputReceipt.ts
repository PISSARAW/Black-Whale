import { boundedInteger, record } from './protocol'
import type { FightSide } from '../types'

/** Old-generation replies may arrive after resume; they cannot acknowledge new controls. */
export function readPvpInputReceipt(
  value: unknown,
  context: {
    matchId: string
    side: FightSide
    inputEpoch: number
    round: number
    nextSequence: number
  },
): number | null {
  if (!record(value) || value.matchId !== context.matchId || value.side !== context.side)
    throw Error('DIVERGED')
  if (!boundedInteger(value.inputEpoch, Number.MAX_SAFE_INTEGER)) throw Error('DIVERGED')
  if (value.inputEpoch < context.inputEpoch) return null
  if (value.inputEpoch !== context.inputEpoch || value.round !== context.round)
    throw Error('DIVERGED')
  if (!boundedInteger(value.nextSequence, context.nextSequence)) throw Error('DIVERGED')
  return value.nextSequence
}
