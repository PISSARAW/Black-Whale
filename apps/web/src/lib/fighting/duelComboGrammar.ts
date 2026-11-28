import type { FighterMove } from './movesetTypes'
import type { CancelGrammar, ComboMove } from './duelComboTypes'
import type { MoveSlot } from './types'

export interface GrammarCancels {
  cancelInto: readonly string[]
  cancelOnBlockInto: readonly string[]
}

const GROUND_NORMALS: ReadonlySet<FighterMove['category']> = new Set(['normal', 'command'])

function ids(fighter: string, slots: readonly MoveSlot[]): string[] {
  return [...new Set(slots)].map((slot) => `${fighter}:${slot}`)
}

/** Specials listed after `slot`: the order keeps the cancel graph acyclic. */
export function accelTargets(grammar: CancelGrammar, slot: MoveSlot): MoveSlot[] {
  if (!grammar.accel) return []
  const index = grammar.specials.indexOf(slot)
  return index < 0 ? [] : grammar.specials.slice(index + 1)
}

/** Cancels of one move under the tiered grammar; see CancelGrammar. */
export function grammarCancels(
  move: FighterMove,
  spec: ComboMove | undefined,
  grammar: CancelGrammar,
): GrammarCancels {
  const fighter = move.id.split(':')[0]
  const chains = spec?.into ?? []
  // A super keeps only its own written chains (target combos, e.g. Les trois interdits).
  if (grammar.supers.includes(move.slot))
    return { cancelInto: ids(fighter, chains), cancelOnBlockInto: [] }
  if (grammar.specials.includes(move.slot))
    return {
      // A special keeps its written chains (target combos, e.g. Double page).
      cancelInto: ids(fighter, [...chains, ...accelTargets(grammar, move.slot), ...grammar.supers]),
      cancelOnBlockInto: [],
    }
  if (!GROUND_NORMALS.has(move.category) || move.variant === 'air')
    return { cancelInto: ids(fighter, chains), cancelOnBlockInto: [] }
  return {
    cancelInto: ids(fighter, [...chains, ...grammar.specials, ...grammar.supers]),
    cancelOnBlockInto: ids(fighter, [...chains, ...grammar.specials]),
  }
}
