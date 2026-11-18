import { paperListening, PAPER_VOICE_RANGE } from './kallutoListening'
import { paperState } from './kallutoPaper'
import { senseDeprived } from './saiyuSenses'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

declare module './types' {
  interface ArcadeFighter {
    heardCorpse?: { source: string; owner: FightSide; frame: number; text: string }
  }
}

/** The words are the controller’s script, never information extracted from a dead mind. */
export function speakThroughCorpse(
  state: FightState,
  corpse: PreparedEntity,
  text: string,
): FightState {
  const owner = corpse.controller!.side
  let next = state
  for (const listener of ['player', 'opponent'] as const) {
    if (!hearsCorpse(state, corpse, listener)) continue
    next = {
      ...next,
      [listener]: {
        ...next[listener],
        heardCorpse: { source: corpse.id, owner, frame: state.frame, text },
      },
    }
  }
  return next
}

function hearsCorpse(state: FightState, corpse: PreparedEntity, side: FightSide): boolean {
  const actor = state[side]
  if (corpse.controller?.side === side) return true
  if (senseDeprived(actor, 'hearing') || actor.coveringEars) return false
  if (Math.hypot(corpse.x - actor.x, corpse.y - actor.y) <= PAPER_VOICE_RANGE) return true
  if (!paperListening(state, side)) return false
  const marked = state[paperState(actor).doll!.target]
  return Math.hypot(corpse.x - marked.x, corpse.y - marked.y) <= PAPER_VOICE_RANGE
}
