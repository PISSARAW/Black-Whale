import { readCounterplay } from './fightCounterplay'
import { styleReactionFrames } from './styleMobility'
import type { FightState, MoveSlot } from './types'

/** Close an observed opening with physical normals; normal admission still checks the body. */
export function counterplayAttackSlots(state: FightState, gap: number): readonly MoveSlot[] | null {
  const read = state.opponent.counterplayRead
  const cue = readCounterplay(state, 'opponent')
  if (!read || !cue || read.key !== cue.key || read.frames <= styleReactionFrames(state.opponent))
    return null
  if (gap > 10 || !['preparation', 'recovery', 'sleeping-body', 'tether'].includes(cue.kind))
    return null
  return ['standingLight', 'forwardLight']
}
